#!/usr/bin/env python3
"""
Event Deduplication for MERLx IRIS
====================================
Before creating a new DISINFO event, check if it belongs to an existing
active event. If so, add it as an observation instead.

Usage (as module):
    from event_dedup import check_and_update
    result = check_and_update(proposed_event, events_list)

Usage (CLI test):
    python3 event_dedup.py --test "headline text here"
"""

import json
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
EVENTS_PATH = WORKSPACE / "docs/data/events.json"
MAX_OBSERVATIONS = 50
MATCH_WINDOW_DAYS = 30


def load_events():
    with open(EVENTS_PATH) as f:
        return json.load(f)

def save_events(events):
    with open(EVENTS_PATH, "w") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)


def compute_similarity(event_a, event_b):
    """
    Score how similar two disinfo events are.
    Returns 0.0 - 1.0.

    Matching signals (in priority order):
    1. Same disinfo_narratives -> strong match
    2. Overlapping extracted_claims -> strong match
    3. Same actors -> moderate match
    4. Same hashtags in headline -> moderate match
    5. Same country + similar keywords -> weak match
    """
    score = 0.0

    # 1. Narrative overlap (strongest signal)
    narr_a = set(event_a.get("disinfo_narratives") or [])
    narr_b = set(event_b.get("disinfo_narratives") or [])
    if narr_a and narr_b:
        overlap = len(narr_a & narr_b)
        if overlap > 0:
            score += 0.5 * (overlap / max(len(narr_a), len(narr_b)))

    # 2. Claim overlap
    claims_a = set()
    for c in (event_a.get("extracted_claims") or []):
        claims_a.update(re.findall(r'\b\w{5,}\b', c.lower()))
    claims_b = set()
    for c in (event_b.get("extracted_claims") or []):
        claims_b.update(re.findall(r'\b\w{5,}\b', c.lower()))

    if claims_a and claims_b:
        claim_overlap = len(claims_a & claims_b)
        if claim_overlap >= 5:
            score += 0.3 * min(claim_overlap / 10, 1.0)

    # 3. Actor overlap
    actors_a = set(a.lower() for a in (event_a.get("actors") or []))
    actors_b = set(a.lower() for a in (event_b.get("actors") or []))
    if actors_a and actors_b:
        actor_overlap = len(actors_a & actors_b)
        if actor_overlap > 0:
            score += 0.1 * min(actor_overlap / 3, 1.0)

    # 4. Hashtag overlap (extract from headlines)
    def extract_hashtags(text):
        return set(re.findall(r'#\w+', (text or "").lower()))

    tags_a = extract_hashtags(event_a.get("headline", "") + " " + event_a.get("summary", ""))
    tags_b = extract_hashtags(event_b.get("headline", "") + " " + event_b.get("summary", ""))
    if tags_a and tags_b:
        tag_overlap = len(tags_a & tags_b)
        if tag_overlap > 0:
            score += 0.15 * min(tag_overlap / 2, 1.0)

    # 5. Country must match (penalty if not)
    if event_a.get("country") != event_b.get("country"):
        score *= 0.3

    return min(score, 1.0)


def find_matching_event(proposed, existing_events):
    """
    Find an existing active event that the proposed event should merge into.
    Returns (matched_event, similarity_score) or (None, 0).
    """
    cutoff = datetime.now(timezone.utc).date() - timedelta(days=MATCH_WINDOW_DAYS)
    cutoff_str = cutoff.strftime("%Y-%m-%d")

    candidates = [
        e for e in existing_events
        if e.get("event_type") in ("HS_DISINFO", "DISINFO", "VE_PROPAGANDA")
        and (e.get("last_seen") or e.get("date", "")) >= cutoff_str
        and e.get("status", "active") != "resolved"
    ]

    best_match = None
    best_score = 0

    for candidate in candidates:
        sim = compute_similarity(proposed, candidate)
        if sim > best_score:
            best_score = sim
            best_match = candidate

    if best_score >= 0.55:
        return best_match, best_score

    return None, 0


def add_observation_to_event(event, new_finding):
    """
    Add a new observation to an existing event.
    Updates last_seen, observations array, reach, etc.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    obs_date = new_finding.get("date", today)

    # Initialize observations array if missing
    if "observations" not in event:
        event["observations"] = [{
            "date": event.get("date", ""),
            "url": event.get("sources", [{}])[0].get("url", "") if event.get("sources") else "",
            "summary": "Initial detection",
            "platforms": event.get("platforms", []),
            "reach": {}
        }]
        event["observation_count"] = 1

    # Build new observation
    source_url = ""
    if new_finding.get("sources"):
        src = new_finding["sources"][0]
        source_url = src.get("url", "") if isinstance(src, dict) else ""

    # Check for duplicate: same URL already observed (regardless of date)
    for obs in event["observations"]:
        if obs.get("url") == source_url and source_url:
            return False

    new_obs = {
        "date": obs_date,
        "url": source_url,
        "summary": (new_finding.get("headline") or new_finding.get("summary", ""))[:200],
        "platforms": new_finding.get("platforms", []),
        "reach": {}
    }

    event["observations"].append(new_obs)
    event["observation_count"] = event.get("observation_count", 1) + 1

    if len(event["observations"]) > MAX_OBSERVATIONS:
        event["observations"] = event["observations"][-MAX_OBSERVATIONS:]

    event["last_seen"] = max(event.get("last_seen", ""), obs_date)
    event["status"] = "active"

    # Update intensity_trend
    new_intensity = 2
    if new_finding.get("narrative_families"):
        intensities = [nf.get("intensity", 2) for nf in new_finding["narrative_families"]]
        new_intensity = max(intensities) if intensities else 2

    if "intensity_trend" not in event:
        event["intensity_trend"] = []
    event["intensity_trend"].append(new_intensity)
    if len(event["intensity_trend"]) > 30:
        event["intensity_trend"] = event["intensity_trend"][-30:]

    # Merge new actors
    existing_actors = set(a.lower() for a in (event.get("actors") or []))
    for actor in (new_finding.get("actors") or []):
        if actor.lower() not in existing_actors:
            event.setdefault("actors", []).append(actor)
            existing_actors.add(actor.lower())

    # Merge new sources
    existing_urls = set(s.get("url", "") for s in (event.get("sources") or []) if isinstance(s, dict))
    for src in (new_finding.get("sources") or []):
        if isinstance(src, dict) and src.get("url") and src["url"] not in existing_urls:
            event.setdefault("sources", []).append(src)

    # Merge new claims
    existing_claims = set(c.lower().strip() for c in (event.get("extracted_claims") or []))
    for claim in (new_finding.get("extracted_claims") or []):
        if claim.lower().strip() not in existing_claims:
            event.setdefault("extracted_claims", []).append(claim)

    # Merge platforms
    existing_platforms = set(p.lower() for p in (event.get("platforms") or []))
    for p in (new_finding.get("platforms") or []):
        if p.lower() not in existing_platforms:
            event.setdefault("platforms", []).append(p)

    return True


def check_and_update(proposed_event, events_list=None):
    """
    Main entry point. Called before creating any DISINFO event.

    Returns:
        {
            "action": "update_existing" | "create_new" | "skip_duplicate",
            "matched_event_id": "APF-..." or None,
            "similarity": 0.0-1.0,
            "reason": "explanation"
        }
    """
    if events_list is None:
        events_list = load_events()

    if proposed_event.get("event_type") not in ("HS_DISINFO", "DISINFO", "VE_PROPAGANDA"):
        return {"action": "create_new", "matched_event_id": None, "similarity": 0, "reason": "Not a disinfo event"}

    matched, score = find_matching_event(proposed_event, events_list)

    if matched and score >= 0.55:
        added = add_observation_to_event(matched, proposed_event)
        if added:
            return {
                "action": "update_existing",
                "matched_event_id": matched.get("event_id"),
                "similarity": round(score, 3),
                "reason": f"Matched existing event (similarity {score:.2f}). Added as observation #{matched.get('observation_count', 1)}."
            }
        else:
            return {
                "action": "skip_duplicate",
                "matched_event_id": matched.get("event_id"),
                "similarity": round(score, 3),
                "reason": f"Duplicate of existing observation in {matched.get('event_id')}."
            }

    return {
        "action": "create_new",
        "matched_event_id": None,
        "similarity": round(score, 3) if score > 0 else 0,
        "reason": f"No matching event found (best similarity: {score:.2f})."
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", type=str, help="Test headline for matching")
    args = parser.parse_args()

    if args.test:
        events = load_events()
        proposed = {
            "event_type": "DISINFO",
            "headline": args.test,
            "summary": args.test,
            "country": "Kenya",
            "disinfo_narratives": [],
            "actors": [],
            "platforms": [],
        }
        result = check_and_update(proposed, events)
        print(json.dumps(result, indent=2))
    else:
        events = load_events()
        disinfo = [e for e in events if e.get("event_type") in ("HS_DISINFO", "DISINFO", "VE_PROPAGANDA")]
        print(f"Total disinfo events: {len(disinfo)}")
        with_obs = [e for e in disinfo if e.get("observations")]
        print(f"With observations: {len(with_obs)}")
