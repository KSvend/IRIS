"""Classification pipeline function using Claude Haiku."""
import json
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage

_llm = None

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


def _get_llm():
    global _llm
    if _llm is None:
        _llm = ChatAnthropic(model="claude-haiku-4-5-20251001", max_tokens=200)
    return _llm


def classify_finding(title: str, summary: str,
                     country: list[str] | None = None) -> dict:
    llm = _get_llm()
    user_msg = f"Title: {title}\nCountry: {', '.join(country or [])}\nSummary: {summary}"
    response = llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_msg),
    ])
    try:
        return json.loads(response.content)
    except json.JSONDecodeError:
        return {"classification": "CONTEXT", "hs_subtype": None, "confidence": 0.0}
