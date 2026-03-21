import pytest
from unittest.mock import MagicMock, patch
from backend.tools.classify import classify_finding


def test_classify_returns_structured_result(mocker):
    mock_llm = mocker.patch("backend.tools.classify._get_llm")
    mock_llm.return_value.invoke.return_value = MagicMock(
        content='{"classification": "HS_DISINFO", "hs_subtype": "Political Incitement", "confidence": 0.85}'
    )
    result = classify_finding(title="MPs charged", summary="Several MPs...", country=["Kenya"])
    assert result["classification"] == "HS_DISINFO"
    assert result["confidence"] == 0.85


def test_classify_handles_invalid_json(mocker):
    mock_llm = mocker.patch("backend.tools.classify._get_llm")
    mock_llm.return_value.invoke.return_value = MagicMock(content="not json")
    result = classify_finding(title="Test", summary="Test")
    assert result["classification"] == "CONTEXT"
    assert result["confidence"] == 0.0
