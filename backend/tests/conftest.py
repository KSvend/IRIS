"""Shared test fixtures."""
import os
import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for unit tests."""
    env_defaults = {
        "SUPABASE_URL": "https://test.supabase.co",
        "SUPABASE_KEY": "test-key",
        "ANTHROPIC_API_KEY": "test-anthropic-key",
        "API_KEY": "test-api-key",
    }
    with patch.dict(os.environ, env_defaults, clear=False):
        with patch("backend.db.get_client") as mock:
            client = MagicMock()
            mock.return_value = client
            yield client


@pytest.fixture
def mock_anthropic():
    """Mock Anthropic API responses."""
    with patch("langchain_anthropic.ChatAnthropic") as mock:
        llm = MagicMock()
        mock.return_value = llm
        yield llm


@pytest.fixture
def sample_desk_review_entry():
    """A single parsed desk review entry for testing."""
    return {
        "title": "NPS–NCIC Joint Investigations: 12 Hate Speech Cases Under Probe",
        "date": "2026-02-25",
        "source_name": "Capital FM Kenya",
        "source_url": "https://www.capitalfm.co.ke/news/2026/02/kenya-police-probe-hate-speech-cases-2027-elections/",
        "country": ["Kenya"],
        "theme": ["Hate Speech Incidents"],
        "classification": "CONTEXT",
        "summary": "Inspector General Douglas Kanja told the Senate...",
        "flagged": True,
    }
