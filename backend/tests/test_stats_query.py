import pytest
from unittest.mock import MagicMock
from backend.tools.stats_query import query_hs_stats


def test_query_hs_stats_returns_data(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[
        {"stat_type": "hs_by_country_subtype", "country": "Kenya",
         "data": {"Hate": 150, "Abusive": 300}, "period": "2025-10 to 2026-03"}
    ])
    result = query_hs_stats("hs_by_country_subtype", country="Kenya", client=mock_supabase)
    assert result["data"]["Hate"] == 150


def test_query_hs_stats_no_data(mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    result = query_hs_stats("nonexistent", client=mock_supabase)
    assert result is None
