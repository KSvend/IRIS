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
1. Every factual statement must cite its source using [Source Name](URL).
   Never fabricate sources.
2. If retrieved evidence is insufficient, say "I don't have enough information
   on this topic." Indicate confidence level (HIGH / MEDIUM / LOW).
3. Do not take sides in conflicts. Present verified findings from multiple
   perspectives where available.
4. You answer questions about HS/disinfo dynamics in Kenya, Somalia, and
   South Sudan. Redirect out-of-scope queries politely.
5. When using statistical data, state the time period covered.
6. End every response with a line: "Confidence: HIGH/MEDIUM/LOW"

CONFIDENCE LEVELS:
- HIGH: 3+ corroborating sources, verified findings
- MEDIUM: 1-2 sources, or mix of verified and unverified
- LOW: Limited data, data gaps identified"""


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


def analyze_and_retrieve(state: ChatState) -> ChatState:
    query = state["query"]
    filters = state.get("filters", {})

    stats_keywords = ["how much", "how many", "count", "total", "statistics",
                      "prevalence", "trend", "percentage"]
    is_stats = any(kw in query.lower() for kw in stats_keywords)

    chunks = vector_search(query, filters=filters, top_k=10)

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
