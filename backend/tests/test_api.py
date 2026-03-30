"""Tests for the FastAPI application endpoints."""

import os
import time
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, MagicMock

# Set env vars before importing app
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-key")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")
os.environ.setdefault("API_KEY", "test-api-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret-key-at-least-32-chars-long!!")

import jwt
from backend.app import app

TEST_API_KEY = "test-api-key"
TEST_JWT_SECRET = "test-secret-key-at-least-32-chars-long!!"


def _make_token(sub="user-123", exp_offset=3600):
    """Create a valid Supabase-style JWT for testing."""
    payload = {
        "sub": sub,
        "aud": "authenticated",
        "exp": int(time.time()) + exp_offset,
        "iat": int(time.time()),
        "role": "authenticated",
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


def _auth_headers():
    """Return valid auth headers for protected endpoints."""
    return {
        "X-API-Key": TEST_API_KEY,
        "Authorization": f"Bearer {_make_token()}",
    }


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_health_no_auth(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_chat_requires_auth(client):
    resp = await client.post("/chat", json={"query": "test"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_invalid_api_key_rejected(client):
    token = _make_token()
    resp = await client.post(
        "/chat",
        json={"query": "test"},
        headers={
            "X-API-Key": "wrong-key",
            "Authorization": f"Bearer {token}",
        },
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_missing_jwt_rejected(client):
    resp = await client.post(
        "/chat",
        json={"query": "test"},
        headers={"X-API-Key": TEST_API_KEY},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_chat_with_valid_key(client, mocker):
    mock_agent = mocker.patch("backend.app._get_chat_agent")
    mock_agent.return_value.invoke.return_value = {
        "response": "Test response [Source](https://example.com)",
        "sources": [{"title": "Source", "source_url": "https://example.com"}],
        "confidence": "HIGH",
        "session_id": "s1",
    }
    mocker.patch("backend.app._get_supabase")
    resp = await client.post(
        "/chat",
        json={"query": "test question"},
        headers=_auth_headers(),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "response" in data
    assert data["confidence"] == "HIGH"
    assert "session_id" in data


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_feedback_endpoint(client, mocker):
    mocker.patch("backend.app._get_supabase")
    resp = await client.post(
        "/chat/feedback",
        json={"session_id": "s1", "feedback_type": "helpful"},
        headers=_auth_headers(),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "recorded"


# ---------------------------------------------------------------------------
# Posts review queue (uses local JSON, no Supabase)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_posts_review_queue(client, mocker):
    mocker.patch(
        "backend.app._get_hs_posts",
        return_value=[
            {"id": "p1", "country": "Kenya", "eaHsConf": 0.5, "subtopics": ["hate"]},
            {"id": "p2", "country": "Sudan", "eaHsConf": 0.3, "subtopics": ["threat"]},
        ],
    )
    resp = await client.get(
        "/posts/review-queue",
        headers=_auth_headers(),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    # Sorted by eaHsConf ascending
    assert data["posts"][0]["id"] == "p2"


@pytest.mark.asyncio
async def test_posts_review_queue_filter_country(client, mocker):
    mocker.patch(
        "backend.app._get_hs_posts",
        return_value=[
            {"id": "p1", "country": "Kenya", "eaHsConf": 0.5},
            {"id": "p2", "country": "Sudan", "eaHsConf": 0.3},
        ],
    )
    resp = await client.get(
        "/posts/review-queue?country=Kenya",
        headers=_auth_headers(),
    )
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
