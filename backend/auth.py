"""Supabase JWT + API key verification for FastAPI."""

import jwt
from fastapi import HTTPException, Header

from backend.config import API_KEY, SUPABASE_JWT_SECRET


def verify_request(
    api_key: str = Header("", alias="X-API-Key"),
    authorization: str = Header("", alias="Authorization"),
) -> dict:
    """Verify both API key and Supabase JWT. Returns decoded JWT payload."""
    # Check API key
    if not api_key or api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Check JWT
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload
