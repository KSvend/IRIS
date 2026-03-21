import pytest
from unittest.mock import MagicMock, patch
from backend.tools.vector_search import vector_search


def test_vector_search_calls_rpc(mock_supabase, mocker):
    mocker.patch("backend.tools.vector_search.generate_embedding", return_value=[0.1] * 384)
    mock_supabase.rpc.return_value.execute.return_value = MagicMock(data=[
        {"id": "abc", "content": "test", "similarity": 0.92,
         "source_id": "src1", "tier": "finding", "country": ["Kenya"],
         "theme": ["OGBV"], "classification": "HS_DISINFO",
         "date_published": "2026-02-01", "verified": True}
    ])
    mock_supabase.table.return_value.select.return_value.in_.return_value.execute.return_value = MagicMock(data=[
        {"id": "src1", "title": "NCIC Report", "source_name": "NCIC", "source_url": "https://ncic.go.ke/report"}
    ])
    results = vector_search(query="test", client=mock_supabase)
    assert len(results) == 1
    assert results[0]["source_name"] == "NCIC"


def test_vector_search_no_results(mock_supabase, mocker):
    mocker.patch("backend.tools.vector_search.generate_embedding", return_value=[0.1] * 384)
    mock_supabase.rpc.return_value.execute.return_value = MagicMock(data=[])
    results = vector_search(query="nothing", client=mock_supabase)
    assert results == []
