"""
Backfill disinfo_narratives for DISINFO-pipeline events that lack narrative IDs.

Only processes events with info_type in {DISINFO, PROPAGANDA, MISINFO, RUMOR, CONTEXT}.
Hate speech / incitement events use narrative_families (a separate classification)
and are NOT sent through the disinfo narrative taxonomy.

Provider chain (free-tier first): Gemini 2.5 Flash → Groq Llama-3.3-70B →
Anthropic. See monitoring/llm_client.py.
"""

import json
import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

WORKSPACE = Path(__file__).resolve().parent.parent
EVENTS_PATH = WORKSPACE / "docs" / "data" / "events.json"
NARRATIVES_PATH = WORKSPACE / "docs" / "data" / "narratives.json"

# Load .env from backend/ for local runs
load_dotenv(WORKSPACE / "backend" / ".env")

# Make sibling llm_client importable when invoked from repo root
sys.path.insert(0, str(Path(__file__).resolve().parent))
from llm_client import LLMError, active_provider_name, call_llm  # noqa: E402

# Only these info_types go through the disinfo narrative taxonomy
DISINFO_TYPES = {"DISINFO", "PROPAGANDA", "MISINFO", "RUMOR", "CONTEXT"}


def build_taxonomy_prompt(narratives: dict) -> str:
    lines = []
    for nid, n in narratives.items():
        lines.append(f"- {nid}: {n['short_name']} — {n.get('name', '')}")
    return "\n".join(lines)


SYSTEM_PROMPT = """You are a narrative classifier for the MERLx IRIS East Africa monitoring platform.

Given an event, assign ALL matching narrative IDs from the supplied taxonomy. An event can match 0-3 narratives.
Only assign narratives that genuinely match — do not force-fit. If no narrative matches, return an empty list.

Respond ONLY with a JSON array of narrative IDs, e.g. ["NAR-SS-004", "NAR-KE-002"]. No prose, no fences.
If no narratives match, return []."""


def classify_event(event: dict, taxonomy_prompt: str) -> list[str]:
    """Send one event to the LLM and return matched narrative IDs."""
    headline = event.get("headline", "")
    summary = event.get("summary", "")
    country = event.get("country", "")
    info_type = event.get("info_type", "")
    certainty = event.get("certainty", "")
    families = event.get("narrative_families", [])
    family_names = ", ".join(f.get("family", "") for f in families) if families else "none"

    user_msg = f"""## Narrative Taxonomy
{taxonomy_prompt}

## Event
- Country: {country}
- Type: {info_type}
- Certainty: {certainty}
- Existing family tags: {family_names}
- Headline: {headline}
- Summary: {summary[:500]}"""

    try:
        text = call_llm(SYSTEM_PROMPT, user_msg, max_tokens=200)
    except LLMError as e:
        print(f"  LLM error: {e}")
        return []

    try:
        ids = json.loads(text)
        if isinstance(ids, list):
            return [i for i in ids if isinstance(i, str) and i.startswith("NAR-")]
    except json.JSONDecodeError:
        pass
    return []


def main():
    provider = active_provider_name()
    if not provider:
        print("ERROR: No LLM provider key set (GEMINI_API_KEY / GROQ_API_KEY / ANTHROPIC_API_KEY)")
        return
    print(f"Using LLM provider: {provider}")

    events = json.loads(EVENTS_PATH.read_text())
    narratives = json.loads(NARRATIVES_PATH.read_text())
    taxonomy_prompt = build_taxonomy_prompt(narratives)
    valid_ids = set(narratives.keys())

    # Only backfill disinfo-pipeline events — HS/incitement events use narrative_families
    unnarrated = [
        (i, e) for i, e in enumerate(events)
        if not e.get("disinfo_narratives")
        and e.get("info_type", "CONTEXT") in DISINFO_TYPES
    ]
    hs_skipped = sum(
        1 for e in events
        if not e.get("disinfo_narratives")
        and e.get("info_type", "CONTEXT") not in DISINFO_TYPES
    )
    print(f"Found {len(unnarrated)} disinfo events without disinfo_narratives")
    print(f"Skipping {hs_skipped} hate speech/incitement events (use narrative_families)")

    updated = 0
    for batch_num, (idx, event) in enumerate(unnarrated):
        try:
            ids = classify_event(event, taxonomy_prompt)
            ids = [i for i in ids if i in valid_ids]
            if ids:
                events[idx]["disinfo_narratives"] = ids
                updated += 1
                print(f"  [{batch_num+1}/{len(unnarrated)}] {event.get('id','?')}: {ids}")
            else:
                print(f"  [{batch_num+1}/{len(unnarrated)}] {event.get('id','?')}: no match")
        except Exception as exc:
            print(f"  [{batch_num+1}/{len(unnarrated)}] {event.get('id','?')}: ERROR {exc}")
        # Rate limit — Haiku is fast but respect limits
        if (batch_num + 1) % 30 == 0:
            time.sleep(1)

    EVENTS_PATH.write_text(json.dumps(events, indent=2, ensure_ascii=False))
    print(f"\nDone. Updated {updated}/{len(unnarrated)} events. Saved to {EVENTS_PATH}")


if __name__ == "__main__":
    main()
