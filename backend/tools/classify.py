"""Classification helper for findings (free-tier LLM chain)."""
import json
import sys
from pathlib import Path

# Make monitoring/llm_client.py importable from backend/
_MONITORING = Path(__file__).resolve().parent.parent.parent / "monitoring"
if str(_MONITORING) not in sys.path:
    sys.path.insert(0, str(_MONITORING))

from llm_client import LLMError, call_llm  # noqa: E402


SYSTEM_PROMPT = """You are a classification agent for the MERLx IRIS platform.
Classify findings about hate speech and disinformation in East Africa.

Return JSON with exactly these fields:
- classification: one of CONTEXT, HS_DISINFO, VE_PROPAGANDA
- hs_subtype: if HS_DISINFO, one of: Political Incitement, Clan Targeting,
  Religious Incitement, Dehumanisation, Anti-Foreign, Ethnic Targeting,
  General Abuse, Gendered Violence. null otherwise.
- confidence: float 0.0-1.0

Definitions:
- CONTEXT: Background events, policy changes, institutional actions
- HS_DISINFO: Direct hate speech, disinformation campaigns, content manipulation
- VE_PROPAGANDA: Violent extremist propaganda, recruitment, radicalisation material

Return ONLY valid JSON, no other text."""


def classify_finding(title: str, summary: str,
                     country: list[str] | None = None) -> dict:
    user_msg = f"Title: {title}\nCountry: {', '.join(country or [])}\nSummary: {summary}"
    try:
        text = call_llm(SYSTEM_PROMPT, user_msg, max_tokens=200)
        return json.loads(text)
    except (LLMError, json.JSONDecodeError):
        return {"classification": "CONTEXT", "hs_subtype": None, "confidence": 0.0}
