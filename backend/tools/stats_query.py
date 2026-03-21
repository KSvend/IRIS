"""Query tool for pre-computed HS statistics (Tier 3)."""


def query_hs_stats(stat_type: str, country: str | None = None,
                   client=None) -> dict | None:
    if client is None:
        from backend.db import get_client
        client = get_client()
    q = client.table("aggregated_stats").select("*").eq("stat_type", stat_type)
    if country:
        q = q.eq("country", country)
    result = q.execute()
    return result.data[0] if result.data else None
