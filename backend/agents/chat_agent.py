"""LangGraph Chat Agent for BRACE4PEACE."""
import re
from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage
from backend.tools.vector_search import vector_search
from backend.tools.stats_query import query_hs_stats

SYSTEM_PROMPT = """You are an analyst assistant for the BRACE4PEACE programme,
specialising in hate speech and disinformation monitoring in East Africa
(Kenya, Somalia, South Sudan).

RULES:
1. When citing specific findings, events, or data points from the RETRIEVED FINDINGS below,
   always cite the source using [Source Name](URL). Never fabricate source citations.
2. You may also draw on your own knowledge to provide analytical context, historical background,
   and expert synthesis — but clearly distinguish between what comes from the knowledge base
   (cited) and your own analysis (uncited).
3. Do not take sides in conflicts. Present findings neutrally.
4. You specialise in HS/disinfo dynamics in Kenya, Somalia, and South Sudan.
5. When the context includes STATISTICAL DATA, use the exact numbers provided.
6. When the context includes EVENTS, present them with dates and sources.
7. End every response with: "Confidence: HIGH/MEDIUM/LOW"

CONFIDENCE LEVELS:
- HIGH: 3+ retrieved sources directly address the question
- MEDIUM: 1-2 retrieved sources address the question
- LOW: Retrieved sources are tangential or sparse

The knowledge base contains: 261 desk review findings, 245 monitored events,
and aggregated hate speech statistics from ~6,000 classified social media posts
across Kenya, Somalia, and South Sudan (Oct 2025 - Mar 2026)."""


class ChatState(TypedDict):
    query: str
    filters: dict
    session_id: str
    messages: list
    retrieved_chunks: list
    stats_data: dict | None
    response: str
    sources: list
    confidence: str


_llm = None


def _get_llm():
    global _llm
    if _llm is None:
        _llm = ChatAnthropic(model="claude-sonnet-4-20250514", max_tokens=2000)
    return _llm


def _expand_query(query: str) -> list[str]:
    """Generate additional search queries to improve recall."""
    queries = [query]
    # Expand abbreviations common in the domain
    expansions = {
        "ss": "South Sudan", "ke": "Kenya", "so": "Somalia",
        "disinfo": "disinformation", "hs": "hate speech",
        "ve": "violent extremism", "ogbv": "online gender-based violence",
    }
    expanded = query
    for abbr, full in expansions.items():
        if abbr in query.lower().split():
            expanded = query.lower().replace(abbr, full)
    if expanded != query:
        queries.append(expanded)
    return queries[:3]


def analyze_and_retrieve(state: ChatState) -> ChatState:
    query = state["query"]
    filters = state.get("filters", {})

    stats_keywords = ["how much", "how many", "count", "total", "statistics",
                      "prevalence", "trend", "percentage"]
    is_stats = any(kw in query.lower() for kw in stats_keywords)

    # Search with expanded queries for better recall
    all_chunks = []
    seen_ids = set()
    for q in _expand_query(query):
        results = vector_search(q, filters=filters, top_k=10)
        for chunk in results:
            cid = chunk.get("id")
            if cid not in seen_ids:
                seen_ids.add(cid)
                all_chunks.append(chunk)

    # Sort by similarity and take top 15
    all_chunks.sort(key=lambda c: c.get("similarity", 0), reverse=True)
    chunks = all_chunks[:15]

    stats = None
    if is_stats:
        country = filters.get("country")
        stats = query_hs_stats("hs_by_country_subtype", country=country)

    return {**state, "retrieved_chunks": chunks, "stats_data": stats}


def generate_response(state: ChatState) -> ChatState:
    llm = _get_llm()
    chunks = state.get("retrieved_chunks", [])
    stats = state.get("stats_data")

    context_parts = []
    if chunks:
        context_parts.append("RETRIEVED FINDINGS:")
        for i, c in enumerate(chunks, 1):
            source_info = f"[{c.get('source_name', 'Unknown')}]({c.get('source_url', '')})"
            verified = "VERIFIED" if c.get("verified") else "UNVERIFIED"
            context_parts.append(
                f"{i}. {source_info} ({verified})\n"
                f"   Country: {', '.join(c.get('country', []))}\n"
                f"   Content: {c.get('content', '')[:500]}"
            )

    if stats:
        context_parts.append(f"\nSTATISTICAL DATA:\n{stats}")

    if not context_parts:
        context_parts.append("No relevant findings found in the knowledge base.")

    context = "\n\n".join(context_parts)

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"CONTEXT:\n{context}\n\nQUERY: {state['query']}"),
    ]
    response = llm.invoke(messages)
    response_text = response.content

    confidence_match = re.search(r"Confidence:\s*(HIGH|MEDIUM|LOW)", response_text)
    confidence = confidence_match.group(1) if confidence_match else "LOW"

    sources = []
    seen_urls = set()
    for c in chunks:
        url = c.get("source_url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            sources.append({
                "title": c.get("source_title", ""),
                "source_name": c.get("source_name", ""),
                "source_url": url,
                "date": c.get("date_published"),
                "country": c.get("country", []),
                "classification": c.get("classification"),
            })

    return {**state, "response": response_text, "sources": sources, "confidence": confidence}


def create_chat_agent():
    graph = StateGraph(ChatState)
    graph.add_node("retrieve", analyze_and_retrieve)
    graph.add_node("generate", generate_response)
    graph.set_entry_point("retrieve")
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", END)
    return graph.compile()
