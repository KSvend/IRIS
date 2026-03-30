"""FastAPI application with all endpoints, auth middleware, CORS, and rate limiting."""

import os
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone
import json
import uuid
from pathlib import Path

from backend.auth import verify_request
from backend.agents.chat_agent import create_chat_agent
import traceback
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="MERLx IRIS Chat API")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "path": str(request.url.path)},
    )


from fastapi.responses import JSONResponse

_cors_origins = [
    "https://ksvend.github.io",
]
_vercel_url = os.environ.get("VERCEL_FRONTEND_URL", "")
if _vercel_url:
    _cors_origins.append(_vercel_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

_chat_agent = None
_supabase = None
_hs_posts = None


def _get_chat_agent():
    global _chat_agent
    if _chat_agent is None:
        _chat_agent = create_chat_agent()
    return _chat_agent


def _get_supabase():
    global _supabase
    if _supabase is None:
        from backend.db import get_client

        _supabase = get_client()
    return _supabase


def _get_hs_posts():
    global _hs_posts
    if _hs_posts is None:
        path = (
            Path(__file__).resolve().parent.parent
            / "docs"
            / "data"
            / "hate_speech_posts.json"
        )
        if path.exists():
            _hs_posts = json.loads(path.read_text())
        else:
            _hs_posts = []
    return _hs_posts


# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------


class ChatRequest(BaseModel):
    query: str
    session_id: str | None = None
    filters: dict | None = None


class FeedbackRequest(BaseModel):
    session_id: str
    feedback_type: str  # "helpful" or "not_helpful"


class VerificationRequest(BaseModel):
    finding_id: str
    action: str
    reviewer_name: str
    note: str | None = None
    corrections: dict | None = None


class AnnotationRequest(BaseModel):
    post_id: str
    action: str
    reviewer_name: str
    corrections: dict | None = None
    note: str | None = None


class BlindAnnotationRequest(BaseModel):
    post_id: str
    reviewer_name: str
    pass_number: int
    classification: str
    subtype: str | None = None
    confidence: str | None = None
    note: str | None = None


# ---------------------------------------------------------------------------
# Lazy loaders for blind-review data
# ---------------------------------------------------------------------------

_blind_posts = None


def _get_blind_posts():
    global _blind_posts
    if _blind_posts is None:
        path = (
            Path(__file__).resolve().parent.parent
            / "papers"
            / "evaluation"
            / "sample_blind.json"
        )
        if path.exists():
            _blind_posts = json.loads(path.read_text())
        else:
            _blind_posts = []
    return _blind_posts


_blind_manifest = None


def _get_blind_manifest():
    """Return manifest as dict: post_id -> row dict."""
    global _blind_manifest
    if _blind_manifest is None:
        import csv

        path = (
            Path(__file__).resolve().parent.parent
            / "papers"
            / "evaluation"
            / "sample_manifest.csv"
        )
        result = {}
        if path.exists():
            with path.open() as f:
                for row in csv.DictReader(f):
                    result[row["post_id"]] = row
        _blind_manifest = result
    return _blind_manifest


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    """System status check -- no auth required."""
    from backend.config import API_KEY, SUPABASE_URL, SUPABASE_KEY
    return {
        "status": "healthy",
        "api_key_len": len(API_KEY) if API_KEY else 0,
        "supabase_url": SUPABASE_URL[:30] + "..." if SUPABASE_URL else "",
        "supabase_key_len": len(SUPABASE_KEY) if SUPABASE_KEY else 0,
        "supabase_key_prefix": SUPABASE_KEY[:15] + "..." if SUPABASE_KEY else "",
    }


@app.get("/debug/headers")
async def debug_headers(request: Request):
    """Temporary: dump request headers for debugging."""
    return {"headers": dict(request.headers)}


@app.post("/chat")
async def chat(req: ChatRequest, user=Depends(verify_request)):
    """Main chat endpoint. Invokes the LangGraph chat agent."""
    agent = _get_chat_agent()
    session_id = req.session_id or str(uuid.uuid4())
    result = agent.invoke(
        {
            "query": req.query,
            "filters": req.filters or {},
            "session_id": session_id,
            "messages": [],
        }
    )
    # Log to chat_sessions
    try:
        client = _get_supabase()
        client.table("chat_sessions").insert(
            {
                "session_id": session_id,
                "query_text": req.query,
                "filters": req.filters,
                "response_text": result.get("response", ""),
                "sources_cited": result.get("sources", []),
                "confidence": result.get("confidence", "LOW"),
            }
        ).execute()
    except Exception:
        pass
    return {
        "response": result.get("response", ""),
        "sources": result.get("sources", []),
        "confidence": result.get("confidence", "LOW"),
        "session_id": session_id,
    }


@app.get("/chat/history/{session_id}")
async def chat_history(session_id: str, user=Depends(verify_request)):
    """Return conversation history for the given session."""
    client = _get_supabase()
    result = (
        client.table("chat_sessions")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
    )
    return {"messages": result.data or []}


@app.post("/chat/feedback")
async def chat_feedback(req: FeedbackRequest, user=Depends(verify_request)):
    """Record lightweight feedback on a chat session."""
    try:
        client = _get_supabase()
        latest = (
            client.table("chat_sessions")
            .select("id")
            .eq("session_id", req.session_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if latest.data:
            client.table("chat_sessions").update(
                {"feedback": req.feedback_type}
            ).eq("id", latest.data[0]["id"]).execute()
    except Exception:
        pass
    return {"status": "recorded"}


@app.get("/knowledge/stats")
async def knowledge_stats(user=Depends(verify_request)):
    """Return high-level knowledge base statistics."""
    client = _get_supabase()
    chunks = client.table("document_chunks").select("id", count="exact").execute()
    findings = client.table("findings").select("id", count="exact").execute()
    pending = (
        client.table("findings")
        .select("id", count="exact")
        .eq("status", "UNVERIFIED")
        .execute()
    )
    meta = (
        client.table("system_metadata")
        .select("*")
        .eq("key", "last_research_run")
        .execute()
    )
    return {
        "total_chunks": chunks.count or 0,
        "total_findings": findings.count or 0,
        "pending_verification": pending.count or 0,
        "last_research_run": meta.data[0]["value"] if meta.data else None,
    }


@app.get("/knowledge/search")
async def knowledge_search(
    country: str | None = None,
    theme: str | None = None,
    classification: str | None = None,
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
    user=Depends(verify_request),
):
    """Filtered search over findings."""
    client = _get_supabase()
    q = client.table("findings").select("*", count="exact")
    if country:
        q = q.contains("country", [country])
    if theme:
        q = q.contains("theme", [theme])
    if classification:
        q = q.eq("classification", classification)
    if status:
        q = q.eq("status", status)
    result = (
        q.range(offset, offset + limit - 1)
        .order("created_at", desc=True)
        .execute()
    )
    return {"results": result.data or [], "total": result.count or 0}


@app.get("/verification/pending")
async def verification_pending(limit: int = 50, user=Depends(verify_request)):
    """Return unverified findings for human review."""
    client = _get_supabase()
    result = (
        client.table("findings")
        .select("*")
        .eq("status", "UNVERIFIED")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"findings": result.data or []}


@app.post("/verification/decide")
async def verification_decide(req: VerificationRequest, user=Depends(verify_request)):
    """Record a verification decision (VERIFY / FLAG / REJECT) on a finding."""
    client = _get_supabase()
    current = client.table("findings").select("*").eq("id", req.finding_id).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Finding not found")
    old_status = current.data[0]["status"]
    new_status = {"VERIFY": "VERIFIED", "FLAG": "FLAGGED", "REJECT": "REJECTED"}[
        req.action
    ]
    update_data = {
        "status": new_status,
        "verified_by": req.reviewer_name,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "verification_note": req.note,
    }
    if req.corrections:
        update_data.update(req.corrections)
    client.table("findings").update(update_data).eq("id", req.finding_id).execute()
    client.table("verification_log").insert(
        {
            "finding_id": req.finding_id,
            "reviewer_id": req.reviewer_name,
            "action": req.action,
            "note": req.note,
            "previous_status": old_status,
            "new_status": new_status,
        }
    ).execute()
    return {
        "finding_id": req.finding_id,
        "previous_status": old_status,
        "new_status": new_status,
    }


@app.get("/posts/review-queue")
async def posts_review_queue(
    country: str | None = None,
    subtype: str | None = None,
    limit: int = 20,
    offset: int = 0,
    user=Depends(verify_request),
):
    """Return hate-speech posts for human annotation, sorted by lowest confidence.

    Posts with None/missing confidence are deprioritised (likely unclassified noise).
    Uses abbreviated field names from the JSON: c=country, cf=confidence, st=subtypes.
    """
    posts = _get_hs_posts()
    filtered = posts
    if country:
        filtered = [p for p in filtered if (p.get("country") or p.get("c")) == country]
    if subtype:
        filtered = [
            p for p in filtered
            if subtype in [
                s.get("n", s) if isinstance(s, dict) else s
                for s in (p.get("subtopics") or p.get("st") or [])
            ]
        ]
    # Sort by confidence ascending — but treat None as 1.0 (skip unscored posts)
    def _conf(p):
        c = p.get("eaHsConf") or p.get("cf")
        return c if c is not None else 1.0
    filtered.sort(key=_conf)
    page = filtered[offset : offset + limit]
    return {"posts": page, "total": len(filtered)}


@app.post("/posts/annotate")
async def posts_annotate(req: AnnotationRequest, user=Depends(verify_request)):
    """Save a human annotation for a hate-speech post."""
    client = _get_supabase()
    client.table("post_annotations").insert(
        {
            "post_id": req.post_id,
            "reviewer": req.reviewer_name,
            "action": req.action,
            "corrections": req.corrections,
            "note": req.note,
        }
    ).execute()
    return {"post_id": req.post_id, "action": req.action, "status": "saved"}


@app.post("/posts/blind-annotate")
async def posts_blind_annotate(req: BlindAnnotationRequest, user=Depends(verify_request)):
    """Save a blind annotation (pass 1 or 2) for gold-standard evaluation."""
    client = _get_supabase()
    client.table("blind_annotations").insert(
        {
            "post_id": req.post_id,
            "reviewer": req.reviewer_name,
            "pass": req.pass_number,
            "classification": req.classification,
            "subtype": req.subtype,
            "confidence": req.confidence,
            "note": req.note,
        }
    ).execute()
    return {"post_id": req.post_id, "pass": req.pass_number, "status": "saved"}


@app.get("/posts/blind-review-queue")
async def posts_blind_review_queue(
    reviewer: str,
    limit: int = 20,
    offset: int = 0,
    user=Depends(verify_request),
):
    """Return blind-review posts assigned to the given reviewer via the manifest."""
    manifest = _get_blind_manifest()
    posts = _get_blind_posts()
    # Build set of post_ids assigned to this reviewer (primary or cross)
    assigned_ids = {
        pid
        for pid, row in manifest.items()
        if row.get("primary_annotator") == reviewer
        or row.get("cross_annotator") == reviewer
    }
    # Filter posts by assignment
    filtered = [p for p in posts if p.get("i") in assigned_ids]
    page = filtered[offset : offset + limit]
    return {"posts": page, "total": len(filtered)}


class DisinfoFlagRequest(BaseModel):
    post_id: str
    title: str
    summary: str
    country: list[str] | None = None
    source_url: str | None = None
    reviewer_name: str


@app.post("/posts/flag-disinfo")
async def flag_disinfo(req: DisinfoFlagRequest, user=Depends(verify_request)):
    """Flag a post as potential disinformation — creates a finding for verification."""
    client = _get_supabase()
    client.table("findings").insert(
        {
            "title": req.title,
            "summary": req.summary,
            "country": req.country or ["Regional"],
            "theme": ["Analyst-Flagged Disinformation"],
            "classification": "HS_DISINFO",
            "confidence": 1.0,
            "status": "UNVERIFIED",
            "verification_note": f"Flagged from post {req.post_id} by {req.reviewer_name}",
            "created_by": req.reviewer_name,
        }
    ).execute()
    return {"status": "flagged", "post_id": req.post_id}
