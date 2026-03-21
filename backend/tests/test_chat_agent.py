"""Tests for LangGraph Chat Agent."""
import pytest
from unittest.mock import MagicMock, patch


def test_chat_agent_returns_response(mocker):
    mock_search = mocker.patch("backend.agents.chat_agent.vector_search")
    mock_search.return_value = [
        {"content": "NCIC found 12 hate speech cases.",
         "source_name": "Capital FM", "source_url": "https://capitalfm.co.ke/report",
         "source_title": "NCIC Report", "similarity": 0.91,
         "country": ["Kenya"], "classification": "CONTEXT", "verified": True}
    ]
    mock_stats = mocker.patch("backend.agents.chat_agent.query_hs_stats")
    mock_stats.return_value = None

    mock_llm = mocker.patch("backend.agents.chat_agent._get_llm")
    mock_llm.return_value.invoke.return_value = MagicMock(
        content="NCIC has 12 cases [Capital FM](https://capitalfm.co.ke/report).\n\nConfidence: HIGH"
    )

    from backend.agents.chat_agent import create_chat_agent
    agent = create_chat_agent()
    result = agent.invoke({
        "query": "How many hate speech cases in Kenya?",
        "filters": {"country": "Kenya"},
        "session_id": "test",
        "messages": [],
    })

    assert "capitalfm" in result["response"]
    assert len(result["sources"]) >= 1
    assert result["confidence"] == "HIGH"


def test_chat_agent_handles_no_results(mocker):
    mock_search = mocker.patch("backend.agents.chat_agent.vector_search")
    mock_search.return_value = []
    mock_stats = mocker.patch("backend.agents.chat_agent.query_hs_stats")
    mock_stats.return_value = None

    mock_llm = mocker.patch("backend.agents.chat_agent._get_llm")
    mock_llm.return_value.invoke.return_value = MagicMock(
        content="I don't have enough information on this topic.\n\nConfidence: LOW"
    )

    from backend.agents.chat_agent import create_chat_agent
    agent = create_chat_agent()
    result = agent.invoke({
        "query": "What about XYZ?",
        "filters": {},
        "session_id": "test",
        "messages": [],
    })

    assert result["confidence"] == "LOW"
    assert result["sources"] == []
