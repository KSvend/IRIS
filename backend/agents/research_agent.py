#!/usr/bin/env python3
"""LangGraph Research Agent — daily automated desk research.

Runs as a GitHub Action. Discovers new findings, classifies,
deduplicates against existing embeddings, and stages for human review.
Budget cap: $2/day, max 30 Tavily queries, max 20 new findings per run.
"""
import csv
import json
import logging
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import TypedDict

from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage

from backend.tools.embed import generate_embedding
from backend.tools.classify import classify_finding

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
AUTOLEARN_PATH = REPO_ROOT / "monitoring" / "autolearn"

RESEARCH_SYSTEM_PROMPT = """You are the BRACE4PEACE Daily Research Agent.
You discover new findings about hate speech and disinformation in Kenya, Somalia, and South Sudan.

For each finding, extract:
- title: concise headline
- summary: 100-200 word description
- source_name: publishing organisation
- source_url: direct URL
- date_published: publication date (YYYY-MM-DD)
- country: one or more of Kenya, Somalia, South Sudan, Regional
- theme: one of AI/deepfakes, Platform Governance, EWER, Legal Frameworks, OGBV, Youth/Radicalisation, Diaspora, Cross-border

Return a JSON array of findings. Return empty array [] if no relevant findings.
Do NOT fabricate findings or URLs."""


class ResearchState(TypedDict):
    search_queries: list[str]
    raw_results: list[dict]
    new_findings: list[dict]
    stats: dict


def _load_autolearn_keywords() -> list[str]:
    """Load learned keywords from autolearn CSV files."""
    keywords = []

    kw_file = AUTOLEARN_PATH / "learned_keywords_hs.csv"
    if kw_file.exists():
        try:
            with open(kw_file) as f:
                reader = csv.reader(f)
                for row in reader:
                    if row and row[0].strip():
                        keywords.append(row[0].strip())
            logger.info(f"Loaded {len(keywords)} HS keywords from autolearn")
        except Exception as e:
            logger.warning(f"Could not read {kw_file}: {e}")

    narratives_file = AUTOLEARN_PATH / "narrative_discoveries.csv"
    if narratives_file.exists():
        try:
            with open(narratives_file) as f:
                reader = csv.reader(f)
                for row in reader:
                    if row and row[0].strip():
                        keywords.append(row[0].strip())
            logger.info(f"Loaded narrative discoveries from autolearn")
        except Exception as e:
            logger.warning(f"Could not read {narratives_file}: {e}")

    return keywords


def assess_gaps(state: ResearchState) -> ResearchState:
    """Check knowledge base for coverage gaps and build search queries.

    Queries Supabase for topics with no findings in the last 7 days,
    then augments with autolearned keywords from monitoring/autolearn/.
    """
    from backend.db import get_client
    client = get_client()

    # Find topics with no findings in last 7 days
    cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()
    recent = (
        client.table("findings")
        .select("country, theme")
        .gte("created_at", cutoff)
        .execute()
    )

    covered = set()
    for f in (recent.data or []):
        for c in (f.get("country") or []):
            covered.add(f"{c}_{f.get('theme', '')}")

    all_combos = [
        f"{c}_{t}" for c in ["Kenya", "Somalia", "South Sudan"]
        for t in [
            "hate speech", "disinformation", "VE", "legal framework",
            "platform governance", "OGBV", "AI deepfakes", "youth radicalisation",
        ]
    ]
    gaps = [combo for combo in all_combos if combo not in covered]

    # Base queries from coverage gaps
    queries = [gap.replace("_", " ") + " 2026" for gap in gaps]

    # Augment with autolearned keywords (review fix #16)
    autolearn_keywords = _load_autolearn_keywords()
    countries = ["Kenya", "Somalia", "South Sudan"]
    for kw in autolearn_keywords[:15]:  # Limit to 15 autolearn terms
        for country in countries:
            queries.append(f"{kw} {country} 2026")

    # Deduplicate and cap at 30 (Tavily budget)
    seen = set()
    deduped = []
    for q in queries:
        if q not in seen:
            seen.add(q)
            deduped.append(q)
        if len(deduped) >= 30:
            break

    logger.info(f"Gap assessment: {len(gaps)} gaps, {len(autolearn_keywords)} autolearn terms → {len(deduped)} queries")
    return {**state, "search_queries": deduped}


def execute_searches(state: ResearchState) -> ResearchState:
    """Run Tavily web searches and extract findings via Claude Sonnet."""
    from tavily import TavilyClient

    tavily_key = os.environ.get("TAVILY_API_KEY", "")
    if not tavily_key:
        logger.warning("TAVILY_API_KEY not set — skipping searches")
        return {**state, "raw_results": [], "new_findings": []}

    tavily = TavilyClient(api_key=tavily_key)
    llm = ChatAnthropic(model="claude-sonnet-4-20250514", max_tokens=4000)

    all_results = []
    for query in state["search_queries"][:30]:  # Cap at 30 per Tavily free tier
        try:
            search = tavily.search(query=query, max_results=3)
            for result in search.get("results", []):
                all_results.append({
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "content": result.get("content", "")[:1000],
                })
        except Exception as e:
            logger.warning(f"Search failed for '{query}': {e}")

    if not all_results:
        logger.info("No search results returned")
        return {**state, "raw_results": [], "new_findings": []}

    logger.info(f"Retrieved {len(all_results)} raw search results")

    # Use LLM to extract structured findings from batch
    batch_text = "\n\n---\n\n".join(
        f"Title: {r['title']}\nURL: {r['url']}\nContent: {r['content']}"
        for r in all_results[:50]
    )

    response = llm.invoke([
        SystemMessage(content=RESEARCH_SYSTEM_PROMPT),
        HumanMessage(content=f"Extract relevant findings from these search results:\n\n{batch_text}"),
    ])

    try:
        findings = json.loads(response.content)
        if not isinstance(findings, list):
            findings = []
    except json.JSONDecodeError:
        logger.error("Failed to parse LLM response as JSON")
        findings = []

    logger.info(f"Extracted {len(findings)} candidate findings")
    return {**state, "raw_results": all_results, "new_findings": findings}


def dedup_and_stage(state: ResearchState) -> ResearchState:
    """Deduplicate findings against existing knowledge base and stage new ones.

    Cosine similarity threshold: 0.85. Stages as UNVERIFIED.
    Cap: 20 new findings per run (budget guard).
    """
    from backend.db import get_client
    client = get_client()

    staged = 0
    skipped_dupes = 0

    for finding in state.get("new_findings", [])[:20]:  # Cap at 20
        title = finding.get("title", "")
        summary = finding.get("summary", "")

        if not title or not summary:
            continue

        # Generate embedding for dedup check
        text = f"{title}\n{summary}"
        embedding = generate_embedding(text)

        # Check similarity against existing chunks (cosine > 0.85 = duplicate)
        try:
            dupes = client.rpc("match_documents", {
                "query_embedding": embedding,
                "match_count": 1,
            }).execute()

            if dupes.data and dupes.data[0].get("similarity", 0) > 0.85:
                logger.info(
                    f"  Duplicate (sim={dupes.data[0]['similarity']:.2f}): {title[:50]}"
                )
                skipped_dupes += 1
                continue
        except Exception as e:
            logger.warning(f"Dedup check failed for '{title[:40]}': {e}")

        # Classify finding
        countries = finding.get("country", [])
        if isinstance(countries, str):
            countries = [countries]

        themes = finding.get("theme", [])
        if isinstance(themes, str):
            themes = [themes]

        classification = classify_finding(
            title=title,
            summary=summary,
            country=countries,
        )

        # Insert source record
        try:
            src_result = client.table("sources").insert({
                "title": title,
                "source_name": finding.get("source_name", ""),
                "source_url": finding.get("source_url", "") or "N/A",
                "source_type": "QUALITY_MEDIA",
                "date_published": finding.get("date_published") or None,
                "country": countries,
                "theme": themes,
                "classification": classification["classification"],
                "credibility_score": classification["confidence"],
                "summary": summary,
                "created_by": "research_agent",
                "fetch_status": "PENDING",
            }).execute()
            source_id = src_result.data[0]["id"] if src_result.data else None
        except Exception as e:
            logger.error(f"Failed to insert source for '{title[:40]}': {e}")
            continue

        # Insert finding as UNVERIFIED
        try:
            client.table("findings").insert({
                "source_id": source_id,
                "title": title,
                "summary": summary,
                "country": countries,
                "theme": themes,
                "classification": classification["classification"],
                "hs_subtype": classification.get("hs_subtype"),
                "confidence": classification["confidence"],
                "status": "UNVERIFIED",
                "created_by": "research_agent",
            }).execute()
        except Exception as e:
            logger.error(f"Failed to insert finding for '{title[:40]}': {e}")
            continue

        # Embed as unverified chunk
        try:
            client.table("document_chunks").insert({
                "source_id": source_id,
                "tier": "finding",
                "content": text,
                "chunk_index": 0,
                "embedding": embedding,
                "country": countries,
                "theme": themes,
                "classification": classification["classification"],
                "date_published": finding.get("date_published") or None,
                "verified": False,
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to embed chunk for '{title[:40]}': {e}")

        staged += 1
        logger.info(f"  Staged [{staged}]: {title[:60]}")

    # Update system metadata with run stats
    run_stats = {
        "timestamp": datetime.utcnow().isoformat(),
        "findings_staged": staged,
        "findings_deduplicated": skipped_dupes,
        "searches_executed": len(state.get("search_queries", [])),
        "raw_results": len(state.get("raw_results", [])),
    }

    try:
        client.table("system_metadata").upsert({
            "key": "last_research_run",
            "value": run_stats,
        }).execute()
        logger.info(f"Updated system_metadata: last_research_run")
    except Exception as e:
        logger.warning(f"Failed to update system_metadata: {e}")

    logger.info(
        f"Research run complete — staged: {staged}, dupes: {skipped_dupes}, "
        f"queries: {len(state.get('search_queries', []))}"
    )
    return {**state, "stats": run_stats}


def create_research_agent():
    """Build and compile the Research Agent LangGraph."""
    graph = StateGraph(ResearchState)
    graph.add_node("assess_gaps", assess_gaps)
    graph.add_node("execute_searches", execute_searches)
    graph.add_node("dedup_and_stage", dedup_and_stage)
    graph.set_entry_point("assess_gaps")
    graph.add_edge("assess_gaps", "execute_searches")
    graph.add_edge("execute_searches", "dedup_and_stage")
    graph.add_edge("dedup_and_stage", END)
    return graph.compile()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    agent = create_research_agent()
    result = agent.invoke({
        "search_queries": [],
        "raw_results": [],
        "new_findings": [],
        "stats": {},
    })
    logger.info(f"Research Agent complete: {result.get('stats', {})}")
