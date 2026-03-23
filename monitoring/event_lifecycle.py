#!/usr/bin/env python3
"""
Event Lifecycle Manager
========================
- Updates event statuses (active -> dormant -> resolved)
- Backfills observations from existing duplicate events
- Aggregates reach across observations

Usage:
    python3 event_lifecycle.py                  # daily update
    python3 event_lifecycle.py --backfill       # one-time migration
    python3 event_lifecycle.py --status-report  # print summary
"""

import json
import argparse
from datetime import datetime, timezone, timedelta
from pathlib import Path
from collections import defaultdict

WORKSPACE = Path(__file__).resolve().parent.parent
EVENTS_PATH = WORKSPACE / "docs/data/events.json"
TIMELINE_PATH = WORKSPACE / "monitoring/iris_timeline.json"

DORMANT_DAYS = 30
RESOLVED_DAYS = 90


def load_events():
    with open(EVENTS_PATH) as f:
        return json.load(f)

def save_events(events):
    with open(EVENTS_PATH, "w") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)


def update_statuses(events):
    """Mark events as dormant/resolved based on inactivity."""
    today = datetime.now(timezone.utc).date()
    changes = {"to_dormant": 0, "to_resolved": 0, "still_active": 0}

    for e in events:
        if e.get("event_type") not in ("HS_DISINFO", "DISINFO", "VE_PROPAGANDA"):
            continue

        last = e.get("last_seen") or e.get("date", "")
        if not last:
            continue

        try:
            last_date = datetime.strptime(last, "%Y-%m-%d").date()
        except ValueError:
            continue

        days_inactive = (today - last_date).days
        old_status = e.get("status", "active")

        if days_inactive >= RESOLVED_DAYS:
            e["status"] = "resolved"
            if old_status != "resolved":
                changes["to_resolved"] += 1
        elif days_inactive >= DORMANT_DAYS:
            e["status"] = "dormant"
            if old_status != "dormant":
                changes["to_dormant"] += 1
        else:
            e["status"] = "active"
            changes["still_active"] += 1

    return changes


def backfill_observations(events):
    """
    One-time: group duplicate events that share the same narrative,
    merge the later ones as observations into the earliest one.
    """
    narr_groups = defaultdict(list)
    other_events = []

    for e in events:
        if e.get("event_type") not in ("HS_DISINFO", "DISINFO", "VE_PROPAGANDA"):
            other_events.append(e)
            continue

        narrs = e.get("disinfo_narratives") or []
        if narrs:
            key = tuple(sorted(narrs))
            narr_groups[key].append(e)
        else:
            other_events.append(e)

    merged_events = list(other_events)
    merge_count = 0

    for narr_key, group in narr_groups.items():
        if len(group) == 1:
            e = group[0]
            if "last_seen" not in e:
                e["last_seen"] = e.get("date", "")
            if "observations" not in e:
                e["observations"] = [{
                    "date": e.get("date", ""),
                    "url": e.get("sources", [{}])[0].get("url", "") if e.get("sources") else "",
                    "summary": "Initial detection",
                    "platforms": e.get("platforms", []),
                    "reach": e.get("reach_data", {}) if isinstance(e.get("reach_data"), dict) else {}
                }]
                e["observation_count"] = 1
            e["status"] = e.get("status", "active")
            merged_events.append(e)
            continue

        # Multiple events for same narrative — merge into earliest
        group.sort(key=lambda x: x.get("date", ""))
        parent = group[0]

        if "observations" not in parent:
            parent["observations"] = [{
                "date": parent.get("date", ""),
                "url": parent.get("sources", [{}])[0].get("url", "") if parent.get("sources") else "",
                "summary": "Initial detection",
                "platforms": parent.get("platforms", []),
                "reach": parent.get("reach_data", {}) if isinstance(parent.get("reach_data"), dict) else {}
            }]

        for child in group[1:]:
            obs = {
                "date": child.get("date", ""),
                "url": child.get("sources", [{}])[0].get("url", "") if child.get("sources") else "",
                "summary": (child.get("headline") or "")[:200],
                "platforms": child.get("platforms", []),
                "reach": child.get("reach_data", {}) if isinstance(child.get("reach_data"), dict) else {},
                "merged_from_event_id": child.get("event_id")
            }
            parent["observations"].append(obs)

            # Merge actors
            existing_actors = set(a.lower() for a in (parent.get("actors") or []))
            for a in (child.get("actors") or []):
                if a.lower() not in existing_actors:
                    parent.setdefault("actors", []).append(a)
                    existing_actors.add(a.lower())

            # Merge claims
            existing_claims = set(c.lower().strip() for c in (parent.get("extracted_claims") or []))
            for c in (child.get("extracted_claims") or []):
                if c.lower().strip() not in existing_claims:
                    parent.setdefault("extracted_claims", []).append(c)

            # Merge sources
            existing_urls = set(s.get("url", "") for s in (parent.get("sources") or []) if isinstance(s, dict))
            for s in (child.get("sources") or []):
                if isinstance(s, dict) and s.get("url") and s["url"] not in existing_urls:
                    parent.setdefault("sources", []).append(s)

            # Merge platforms
            existing_plat = set(p.lower() for p in (parent.get("platforms") or []))
            for p in (child.get("platforms") or []):
                if p.lower() not in existing_plat:
                    parent.setdefault("platforms", []).append(p)

            # Upgrade threat level if child was higher
            THREAT_RANK = {"P1 CRITICAL": 3, "P2 HIGH": 2, "P3 MODERATE": 1}
            if THREAT_RANK.get(child.get("threat_level"), 0) > THREAT_RANK.get(parent.get("threat_level"), 0):
                parent["threat_level"] = child["threat_level"]

            merge_count += 1

        # Update parent metadata
        all_dates = [o["date"] for o in parent["observations"] if o.get("date")]
        parent["last_seen"] = max(all_dates) if all_dates else parent.get("date", "")
        parent["observation_count"] = len(parent["observations"])
        parent["intensity_trend"] = [
            max((nf.get("intensity", 2) for nf in (parent.get("narrative_families") or [{"intensity": 2}])), default=2)
        ] * len(parent["observations"])
        parent["status"] = "active"
        parent["spread"] = min(5, max(parent.get("spread", 1), len(parent["observations"])))

        merged_events.append(parent)

    return merged_events, merge_count


def status_report(events):
    """Print a summary of narrative lifecycle status."""
    disinfo = [e for e in events if e.get("event_type") in ("HS_DISINFO", "DISINFO", "VE_PROPAGANDA")]

    active = [e for e in disinfo if e.get("status") == "active"]
    dormant = [e for e in disinfo if e.get("status") == "dormant"]
    resolved = [e for e in disinfo if e.get("status") == "resolved"]
    no_status = [e for e in disinfo if not e.get("status")]

    print(f"\nDisinfo Event Lifecycle Report")
    print(f"{'='*50}")
    print(f"Total disinfo events: {len(disinfo)}")
    print(f"  Active: {len(active)}")
    print(f"  Dormant: {len(dormant)}")
    print(f"  Resolved: {len(resolved)}")
    print(f"  No status: {len(no_status)}")

    with_obs = sorted(
        [e for e in disinfo if e.get("observations")],
        key=lambda e: e.get("observation_count", 0),
        reverse=True
    )
    if with_obs:
        print(f"\nMost-observed events:")
        for e in with_obs[:5]:
            print(f"  {e.get('event_id')}: {e.get('observation_count', 0)} obs | "
                  f"{e.get('date')} -> {e.get('last_seen', '?')} | {e.get('headline', '')[:60]}")

    active_recent = [e for e in active if e.get("last_seen", "") >=
                     (datetime.now(timezone.utc).date() - timedelta(days=10)).strftime("%Y-%m-%d")]
    print(f"\nActive events seen in last 10 days: {len(active_recent)}")
    for e in active_recent:
        print(f"  {e.get('event_id')}: last_seen={e.get('last_seen')} | {e.get('headline', '')[:60]}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backfill", action="store_true", help="One-time: merge duplicate events")
    parser.add_argument("--status-report", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    events = load_events()

    if args.backfill:
        print("Backfilling: merging duplicate events by narrative...")
        merged, merge_count = backfill_observations(events)
        print(f"  Merged {merge_count} duplicate events")
        print(f"  Events before: {len(events)}, after: {len(merged)}")

        changes = update_statuses(merged)
        print(f"  Status changes: {changes}")

        if not args.dry_run:
            save_events(merged)
            print(f"  Saved to {EVENTS_PATH}")
        return

    if args.status_report:
        status_report(events)
        return

    # Daily run: update statuses
    changes = update_statuses(events)
    if not args.dry_run:
        save_events(events)

    print(json.dumps({"status_changes": changes}))


if __name__ == "__main__":
    main()
