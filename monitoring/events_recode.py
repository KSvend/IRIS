#!/usr/bin/env python3
"""
Events re-coder — systematic framework re-classification of the events catalogue
================================================================================
Re-derives the ANALYTICAL codes for every event in docs/data/events.json on the
assessment framework (Wardle information-disorder axis + hate-speech/incitement/VE
categories + the 8 narrative families + threat level), BLIND to the existing codes
so the old-vs-new comparison is meaningful.

Re-codes from each event's factual headline+summary ONLY — does NOT invent facts
and does NOT re-research. Preserves all factual fields; writes a parallel file.

Output per event (outputs/events_recoded.json):
  id, country, date, old_info_type, old_threat
  category      disinformation|misinformation|malinformation|hate_speech|incitement|ve_propaganda|context
  narrative_families[]  religious_justification|identity_incitement|government_delegitimisation|
                        existential_threat_dehumanisation|gendered_targeting|youth_recruitment|
                        anti_foreign|resource_grievance
  threat_level  P1 CRITICAL|P2 HIGH|P3 MODERATE|P4 LOW
  ds_markers[]  dehumanisation|accusation_mirror|existential_threat|exclusion_demand|glorification
  confidence    HIGH|MEDIUM|LOW
  exp           one-line rationale

Usage:
  python3 events_recode.py --dry-run
  python3 events_recode.py --limit 20
  python3 events_recode.py --model claude-sonnet-4-6
"""
import json, os, sys, time, argparse, re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from llm_client import call_llm, active_provider_name, LLMError

REPO = Path(__file__).resolve().parent.parent
_envf = REPO / ".env.local"
if _envf.exists():
    for _line in _envf.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ[_k.strip()] = _v.strip().strip('"').strip("'")
IN_PATH  = REPO / "docs" / "data" / "events.json"
OUT_PATH = REPO / "outputs" / "events_recoded.json"
BATCH = 10
SLEEP = 1.5

SYSTEM_PROMPT = """You are a conflict-analysis coder for a UNDP hate-speech, disinformation and violent-extremism assessment covering Kenya, Somalia and South Sudan. You are given documented EVENTS — each a factual record (headline + summary) of an incident of harmful online content, information disorder, or a related contextual development. Re-classify each event on the assessment framework, judging ONLY from the factual description given. Do NOT invent facts beyond the summary.

For EACH event return:
- "category": the PRIMARY nature of the event, exactly one of:
  - "disinformation" = false/fabricated content created or spread with intent to deceive or harm (Wardle). Deepfakes, fake front pages, forged documents, doctored video, coordinated false campaigns.
  - "misinformation" = false content spread WITHOUT intent to harm (honest error, rumour repeated in good faith).
  - "malinformation" = GENUINE information/private material shared to cause harm (leaks, doxxing, decontextualised-but-real content).
  - "hate_speech" = communication attacking or demeaning a person/group on identity grounds (clan, ethnicity, religion, nationality, gender) — harmful by its targeting, not primarily by being false.
  - "incitement" = explicit or implicit call to discrimination, hostility or violence meeting the Rabat threshold (e.g. 'spare no one', mobilisation orders, calls to expel/kill).
  - "ve_propaganda" = organised violent-extremist (Al-Shabaab, Islamic State) recruitment, financing, or mobilisation content/infrastructure.
  - "context" = a contextual or institutional event that DESCRIBES, REPORTS, RESPONDS TO, or sets the stage for harm rather than BEING a piece of harmful content (monitoring reports, official statements, arrests, legal actions, conferences, displacement events, foreign-policy moves).
- "narrative_families": array (dominant first) from [religious_justification, identity_incitement, government_delegitimisation, existential_threat_dehumanisation, gendered_targeting, youth_recruitment, anti_foreign, resource_grievance]; [] for context-only events with no narrative.
- "threat_level": one of [P1 CRITICAL, P2 HIGH, P3 MODERATE, P4 LOW] — escalation/harm potential. P1=imminent mass-violence/atrocity incitement; P2=high-reach disinformation or serious incitement; P3=moderate political fabrication/abuse; P4=low-level or purely contextual.
- "ds_markers": for hate_speech/incitement, array from [dehumanisation, accusation_mirror, existential_threat, exclusion_demand, glorification]; else [].
- "confidence": "HIGH" / "MEDIUM" / "LOW" — your confidence in the classification given the summary's detail.
- "exp": ONE sentence saying what the event is and why it gets that category.

Rules: distinguish disinformation (intent to harm) from misinformation (no intent) by what the summary says about origin/intent. Reserve "incitement" for explicit/implicit calls to violence/discrimination; reserve "ve_propaganda" for organised extremist groups. Use "context" for reports/statements/institutional actions ABOUT harm — most fact-checker debunks of a fabrication are still classifying the underlying fabrication (code the fabrication's type, e.g. disinformation), but a monitoring REPORT or UN STATEMENT about the situation is context. Output ONLY a JSON array, no prose, no markdown fences:
[{"id":"<event_id>","category":"...","narrative_families":[...],"threat_level":"...","ds_markers":[...],"confidence":"...","exp":"..."}, ...]"""


def build_user(batch):
    lines = []
    for p in batch:
        head = (p.get("headline") or "")[:200].replace("\n", " ")
        summ = (p.get("summary") or "")[:600].replace("\n", " ")
        rec = {"id": p.get("event_id"), "country": p.get("country", ""),
               "date": p.get("date", ""), "headline": head, "summary": summ}
        lines.append(json.dumps(rec, ensure_ascii=False))
    return "Classify these events:\n[" + ",\n".join(lines) + "]"


def parse(raw):
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?|\n?```$", "", raw).strip()
    a = raw.find("["); b = raw.rfind("]")
    if a < 0 or b < 0:
        raise ValueError("no JSON array")
    return json.loads(raw[a:b + 1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--input", default=str(IN_PATH))
    ap.add_argument("--output", default=str(OUT_PATH))
    ap.add_argument("--model", default="", help="override the anthropic model id")
    args = ap.parse_args()

    if args.model:
        import llm_client as _lc
        for _p in _lc.PROVIDERS:
            if _p["name"] == "anthropic":
                _p["model"] = args.model
        print(f"[model override] anthropic -> {args.model}")

    events = json.load(open(args.input, encoding="utf-8"))
    if args.limit:
        events = events[:args.limit]
    print(f"[events_recode] {len(events)} events | provider={active_provider_name() or 'NONE'} | dry-run={args.dry_run}")

    done = {}
    outp = Path(args.output)
    if outp.exists():
        done = {r["id"]: r for r in json.load(open(outp))}
        print(f"[resume] {len(done)} already coded")

    todo = [e for e in events if e.get("event_id") not in done]
    results = list(done.values())
    for i in range(0, len(todo), BATCH):
        batch = todo[i:i + BATCH]
        if args.dry_run:
            codes = [{"id": e.get("event_id"), "category": "disinformation", "narrative_families": [],
                      "threat_level": "P3 MODERATE", "ds_markers": [], "confidence": "MEDIUM",
                      "exp": "(dry-run)"} for e in batch]
        else:
            try:
                codes = parse(call_llm(SYSTEM_PROMPT, build_user(batch), max_tokens=4096))
            except (LLMError, ValueError) as e:
                print(f"  batch {i}: ERROR {str(e)[:90]} — skipping"); continue
        by_id = {c.get("id"): c for c in codes}
        for e in batch:
            c = by_id.get(e.get("event_id"), {})
            results.append({"id": e.get("event_id"), "country": e.get("country"), "date": e.get("date"),
                            "old_info_type": e.get("info_type"), "old_threat": e.get("threat_level"),
                            "category": c.get("category", ""), "narrative_families": c.get("narrative_families", []),
                            "threat_level": c.get("threat_level", ""), "ds_markers": c.get("ds_markers", []),
                            "confidence": c.get("confidence", ""), "exp": c.get("exp", "")})
        if (i // BATCH) % 5 == 0:
            json.dump(results, open(outp, "w"), ensure_ascii=False, indent=1)
            print(f"  {len(results)}/{len(events)} coded")
        if not args.dry_run:
            time.sleep(SLEEP)
    json.dump(results, open(outp, "w"), ensure_ascii=False, indent=1)
    print(f"[done] {len(results)} events -> {outp}")


if __name__ == "__main__":
    main()
