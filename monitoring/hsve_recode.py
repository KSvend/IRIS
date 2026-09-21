#!/usr/bin/env python3
"""
HSVE multi-axis re-coder
========================
Re-codes hate-speech posts on the locked HSVE framework (target x harm x severity
+ dangerous-speech markers), replacing the old single-subtype + toxicity scoring
that the 2026-06 validation found unreliable.

Output codes per post:
  target[]   clan|caste|ethnic|religious|political|national_foreigner|gender|individual
  harm[]     insult_abuse|dangerous_speech|incitement|harassment|doxxing|threat
  ds_markers[] dehumanisation|accusation_mirror|existential_threat|exclusion_demand|glorification
  severity   low|medium|high|critical
  terms[]    coded/slur terms identified
  qc         correct|questionable|misclassified ; rel relevant|possibly_relevant|not_relevant
  exp        one-line analytic note

Provider chain via monitoring/llm_client.py (set LLM_PROVIDER + a key in .env.local).
For rigour prefer a capable model (Anthropic Claude or Gemini 2.5 Pro), NOT the
free Flash/Groq tier — the latter is what produced the noisy data this replaces.

Usage:
  python3 hsve_recode.py --dry-run            # validate pipeline, no LLM calls
  python3 hsve_recode.py --limit 50           # code first 50 (smoke test)
  python3 hsve_recode.py                       # full corpus, resumable
"""
import json, os, sys, time, argparse, re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from llm_client import call_llm, active_provider_name, LLMError

REPO = Path(__file__).resolve().parent.parent
# load .env.local (KEY=value) into the environment so llm_client sees the API key
_envf = REPO / ".env.local"
if _envf.exists():
    for _line in _envf.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ[_k.strip()] = _v.strip().strip('"').strip("'")  # last line wins
IN_PATH  = REPO / "docs" / "data" / "hate_speech_posts.json"
OUT_PATH = REPO / "outputs" / "hsve_recoded.json"
BATCH = 25
SLEEP = 1.0

SYSTEM_PROMPT = """You are a conflict-analysis coder for a UNDP hate-speech and violent-extremism assessment covering Kenya, Somalia and South Sudan. Code each social-media post on a structured multi-axis framework. You read Somali, Swahili, Nuer, Dinka and Juba Arabic and know the coded terms.

Local coded-language knowledge:
- Somali clan: mooryaan/maryooley (bandit slur), faqash (Barre-regime slur), idoor/inader (anti-Isaaq), langaab/laangaab (minority/short-lineage), cagdheer/qadaad (anti-Darod), reer X (lineage), qabiil (clan).
- Somali CASTE (distinct from clan — hereditary occupational minorities): Gabooye, Madhiban, Midgan/midgaan, Tumal, Yibir, Eelaay/sab.
- Somali religious: gaal/gaalo/kafir/kaafir/kafirun (infidel), mushrik/mushrikiin (polytheist), murtad (apostate), munaafiq (hypocrite), yuhuud (Jew), wahhabi (sect).
- Somali dehumanising: xayawaan/xoolo (animal/livestock), jareer/jareereed (anti-Bantu racial slur 'hard hair'), mukulaal madoow.
- South Sudan: camjiec/camjiɛc (anti-Nuer), nyam nyam (cannibals), jenge/jieng (Dinka), mathiang anyor (Dinka militia), Nuer wew (Nuer collaborator slur), White Army (Nuer youth militia), kokora (purge/separation), dinkocracy.
- Kenya: kihii/kîhîî (uncircumcised ethnic slur), madoadoa (stains/outsiders), nywele ngumu (hard hair), mungiki/mathiang.

For EACH post return:
- "target": array from [clan, caste, ethnic, religious, political, national_foreigner, gender, individual]. clan=Somali clan/sub-clan lineage; caste=Somali hereditary occupational minorities (Gabooye/Madhiban/Midgan/Tumal/Yibir) — NOT the same as clan; ethnic=ethnic groups (SS Dinka/Nuer/Shilluk/Murle/Anywaa, Kenya tribes, Bantu/jareer, Somali-as-ethnicity); religious=faith or sect; political=party/government/opposition/political bloc; national_foreigner=anti-foreigner, diaspora, refugee, cross-border othering; gender=ONLY when women, gender or sexuality is actually the target (never a default bin); individual=a specific named public figure.
- "harm": array from [insult_abuse, dangerous_speech, incitement, harassment, doxxing, threat]. insult_abuse=baseline derogatory/slur/stereotype (present in almost all hateful posts). dangerous_speech=contains a Benesch risk marker. incitement=explicit or implicit call to attack/kill/expel/punish/deport. harassment=sustained targeted abuse of one individual. doxxing=publishing personal info to enable targeting. threat=explicit threat of harm.
- "ds_markers": if harm includes dangerous_speech, array from [dehumanisation, accusation_mirror, existential_threat, exclusion_demand, glorification]; else [].
- "severity": one of [low, medium, high, critical]. low=insult/stereotype; medium=dehumanisation/exclusion; high=explicit threat/doxxing/targeted incitement of one person; critical=incitement to group violence meeting the Rabat threshold (intent + reach + likelihood).
- "terms": array of the coded/slur terms you identified (verbatim).
- "qc": "correct" (genuinely hateful/abusive toward a group or person), "questionable" (political criticism of leaders/policy without identity attack, sarcasm, or describing/condemning hate), or "misclassified" (not hate speech: news, counter-speech, unrelated, playful).
- "rel": "relevant" / "possibly_relevant" / "not_relevant" (about East Africa / its diaspora).
- "exp": ONE sentence — translate the coded terms and say what the post does.

Rules: minimum harm for a hateful post is insult_abuse. Use dangerous_speech ONLY with a named Benesch marker. Reserve incitement/threat for explicit calls/threats. Condemning or reporting hate is NOT itself hate (questionable/misclassified). Output ONLY a JSON array, no prose, no markdown fences:
[{"id":0,"target":[...],"harm":[...],"ds_markers":[...],"severity":"...","terms":[...],"qc":"...","rel":"...","exp":"..."}, ...]"""


def build_user(batch):
    lines = []
    for k, p in enumerate(batch):
        txt = (p.get("t") or "")[:400].replace("\n", " ")
        lines.append(f'{{"id":{k},"country":"{p.get("c","")}","text":{json.dumps(txt, ensure_ascii=False)}}}')
    return "Code these posts:\n[" + ",\n".join(lines) + "]"


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

    posts = json.load(open(args.input, encoding="utf-8"))
    # verified/relevant only
    posts = [p for p in posts if p.get("pr") in ("Hate", "Abusive", "Questionable")
             and p.get("rel") in ("relevant", "possibly_relevant", None)]
    if args.limit:
        posts = posts[:args.limit]
    print(f"[hsve_recode] {len(posts)} posts | provider={active_provider_name() or 'NONE'} | dry-run={args.dry_run}")

    done = {}
    outp = Path(args.output)
    if outp.exists():
        done = {r["i"]: r for r in json.load(open(outp))}
        print(f"[resume] {len(done)} already coded")

    todo = [p for p in posts if p.get("i") not in done]
    results = list(done.values())
    for i in range(0, len(todo), BATCH):
        batch = todo[i:i + BATCH]
        if args.dry_run:
            codes = [{"id": k, "target": ["ethnic"], "harm": ["insult_abuse"], "ds_markers": [],
                      "severity": "low", "terms": [], "qc": "correct", "rel": "relevant", "exp": "(dry-run)"}
                     for k in range(len(batch))]
        else:
            try:
                codes = parse(call_llm(SYSTEM_PROMPT, build_user(batch), max_tokens=8192))
            except (LLMError, ValueError) as e:
                print(f"  batch {i}: ERROR {str(e)[:90]} — skipping"); continue
        by_id = {c.get("id"): c for c in codes}
        for k, p in enumerate(batch):
            c = by_id.get(k, {})
            results.append({"i": p.get("i"), "c": p.get("c"), "pr": p.get("pr"),
                            "target": c.get("target", []), "harm": c.get("harm", []),
                            "ds_markers": c.get("ds_markers", []), "severity": c.get("severity", ""),
                            "terms": c.get("terms", []), "qc": c.get("qc", ""), "rel": c.get("rel", ""),
                            "exp": c.get("exp", "")})
        if (i // BATCH) % 10 == 0:
            json.dump(results, open(outp, "w"), ensure_ascii=False, indent=1)
            print(f"  {len(results)}/{len(posts)} coded")
        if not args.dry_run:
            time.sleep(SLEEP)
    json.dump(results, open(outp, "w"), ensure_ascii=False, indent=1)
    print(f"[done] {len(results)} posts -> {outp}")


if __name__ == "__main__":
    main()
