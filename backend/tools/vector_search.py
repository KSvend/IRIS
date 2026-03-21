"""Semantic search tool for the Chat Agent."""
from backend.tools.embed import generate_embedding


def vector_search(query: str, filters: dict | None = None,
                  top_k: int = 10, client=None) -> list[dict]:
    if client is None:
        from backend.db import get_client
        client = get_client()

    embedding = generate_embedding(query)

    params = {
        "query_embedding": embedding,
        "match_count": top_k,
        "filter_country": filters.get("country") if filters else None,
        "filter_theme": filters.get("theme") if filters else None,
        "filter_verified_only": filters.get("verified_only", False) if filters else False,
    }
    result = client.rpc("match_documents", params).execute()
    chunks = result.data or []

    source_ids = list({c["source_id"] for c in chunks if c.get("source_id")})
    if source_ids:
        sources_result = (
            client.table("sources")
            .select("id, title, source_name, source_url")
            .in_("id", source_ids)
            .execute()
        )
        source_map = {s["id"]: s for s in (sources_result.data or [])}
        for chunk in chunks:
            src = source_map.get(chunk.get("source_id"), {})
            chunk["source_name"] = src.get("source_name", "")
            chunk["source_url"] = src.get("source_url", "")
            chunk["source_title"] = src.get("title", "")

    return chunks
