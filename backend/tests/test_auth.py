"""Tests for Supabase JWT + API key authentication."""

import os
import time

# Set required env vars before any backend imports
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")

import jwt
import pytest
from unittest.mock import patch


# Fake JWT secret for testing
TEST_JWT_SECRET = "test-secret-key-at-least-32-chars-long!!"


def _make_token(sub="user-123", exp_offset=3600, secret=TEST_JWT_SECRET):
    """Create a valid Supabase-style JWT for testing."""
    payload = {
        "sub": sub,
        "aud": "authenticated",
        "exp": int(time.time()) + exp_offset,
        "iat": int(time.time()),
        "role": "authenticated",
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@patch("backend.config.SUPABASE_JWT_SECRET", TEST_JWT_SECRET)
@patch("backend.config.API_KEY", "test-api-key")
def test_valid_request_passes_auth():
    from backend.auth import verify_request

    token = _make_token()
    result = verify_request(
        api_key="test-api-key",
        authorization=f"Bearer {token}",
    )
    assert result["sub"] == "user-123"


@patch("backend.config.SUPABASE_JWT_SECRET", TEST_JWT_SECRET)
@patch("backend.config.API_KEY", "test-api-key")
def test_missing_api_key_rejected():
    from backend.auth import verify_request
    from fastapi import HTTPException

    token = _make_token()
    with pytest.raises(HTTPException) as exc_info:
        verify_request(api_key="", authorization=f"Bearer {token}")
    assert exc_info.value.status_code == 401


@patch("backend.config.SUPABASE_JWT_SECRET", TEST_JWT_SECRET)
@patch("backend.config.API_KEY", "test-api-key")
def test_missing_jwt_rejected():
    from backend.auth import verify_request
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        verify_request(api_key="test-api-key", authorization="")
    assert exc_info.value.status_code == 401


@patch("backend.config.SUPABASE_JWT_SECRET", TEST_JWT_SECRET)
@patch("backend.config.API_KEY", "test-api-key")
def test_expired_jwt_rejected():
    from backend.auth import verify_request
    from fastapi import HTTPException

    token = _make_token(exp_offset=-3600)
    with pytest.raises(HTTPException) as exc_info:
        verify_request(api_key="test-api-key", authorization=f"Bearer {token}")
    assert exc_info.value.status_code == 401


@patch("backend.config.SUPABASE_JWT_SECRET", TEST_JWT_SECRET)
@patch("backend.config.API_KEY", "test-api-key")
def test_wrong_api_key_rejected():
    from backend.auth import verify_request
    from fastapi import HTTPException

    token = _make_token()
    with pytest.raises(HTTPException) as exc_info:
        verify_request(api_key="wrong-key", authorization=f"Bearer {token}")
    assert exc_info.value.status_code == 401
