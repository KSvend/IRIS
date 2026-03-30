# IRIS Data Collection Plan for Journal Papers — Design Spec

Two parallel workstreams over ~4 weeks (2026-03-31 through 2026-04-30) to strengthen the empirical basis of Paper A (methodology) and Paper D (findings/policy).

## Goals

1. **Extended monitoring:** Accumulate ~2 months of continuous daily monitoring data (current: a few weeks) to support credible deployment claims and temporal trend analysis.
2. **Gold-standard evaluation:** Produce a human-annotated evaluation set (350 posts) with inter-annotator agreement metrics, enabling formal precision/recall/F1 reporting in Paper A.

## Constraints

- Annotators are 3 local language speakers from the BRACE4PEACE project (already available).
- LLM annotator is GPT-4o (independent from Claude, which is used in the IRIS QA stage — avoids circular validation).
- Annotation interface already exists in IRIS (`/posts/review-queue`, `/posts/annotate` endpoints; `PostDrillDown.tsx` component).
- The blind annotation pass requires hiding model predictions from the UI — this is the main code change needed.
- Budget: GPT-4o API costs for 350 posts (~$1-2 total, negligible).
- All annotated posts remain PII-redacted. No new PII is introduced.

---

## Workstream 1: Extended Daily Monitoring

### Objective

Ensure the automated monitoring pipeline runs reliably for 30+ consecutive days (through 2026-04-30), producing daily findings and accumulating classified posts.

### Current State

- Pipeline runs twice daily (06:00 and 14:00 UTC) via GitHub Actions (`monitor.yml`).
- Downstream workflows (`ingest-daily-findings.yml`, `compute-stats.yml`) trigger on monitor completion.
- Current monitoring findings: 3 days of data in `monitoring/findings/` (2026-03-14 through 2026-03-16), plus ongoing runs.
- `Refresh HS Stats` workflow is currently failing — needs investigation and fix.

### Tasks

#### 1.1 Fix failing Refresh HS Stats workflow
- Investigate the `compute-stats.yml` failure (last failed 2026-03-30).
- Fix the root cause so downstream statistics are computed after each monitor run.

#### 1.2 Set up weekly health check
- Create a GitHub Actions workflow (`monitor-health.yml`) that runs weekly (e.g., Monday 08:00 UTC).
- Checks: Did the monitor run at least 12 times in the past 7 days (2x daily x 7 = 14 expected)? Were any runs failures? Is the latest `hate_speech_posts.json` growing?
- On failure: sends a notification (GitHub issue or email alert).
- Alternatively: a simple manual check protocol (check the Actions tab weekly) if automation is overkill.

#### 1.3 End-of-month data snapshot
- On or around 2026-04-30, regenerate all `papers/analysis/` CSVs and figures with the updated dataset.
- Run `papers/analysis/load_data.py`, `hs_crosstabs.py`, `disinfo_analysis.py`, `pipeline_metrics.py`, `generate_figures.py`.
- Compare before/after numbers to document dataset growth.
- Update both paper drafts with the refreshed statistics.

### Success Criteria

- 50+ consecutive days of monitoring with <5% failed runs.
- Verified dataset grows measurably (track weekly post count).
- Temporal analysis in Paper D covers a longer, more credible window.
- Paper A can claim "approximately two months of continuous automated monitoring."

---

## Workstream 2: Gold-Standard Evaluation

### Objective

Produce a rigorously annotated evaluation dataset enabling:
- Formal precision/recall/F1 for the IRIS pipeline (Paper A Section 5.1).
- Inter-annotator agreement metrics: human vs. human (if overlap exists), human vs. GPT-4o, human vs. IRIS pipeline.
- Analysis of model influence on human judgment (blind vs. informed annotation passes).

### Phase A: Sample Selection (Day 1, automated)

#### Sample Design

**Total: 350 posts.**

| Source | Per Country | Total | Purpose |
|--------|-------------|-------|---------|
| Hate (pipeline) | 40 | 120 | Evaluate true positive rate |
| Abusive (pipeline) | 40 | 120 | Evaluate true positive rate |
| Questionable (pipeline) | 10 | 30 | Edge case assessment |
| Normal (pipeline) | 10 | 30 | Evaluate false negative rate |
| Normal-classified (extra) | ~17 | 50 | Additional false negative check |
| **Total** | **~117** | **350** | |

**Stratification:**
- 100 posts per country (Kenya, Somalia, South Sudan) from the pipeline-positive pool, stratified across prediction classes as above.
- 50 additional posts the pipeline classified as Normal, drawn proportionally across countries (~17 each), to check for false negatives.

**Selection method:**
- Random sample within each stratum from `docs/data/hate_speech_posts.json` (for pipeline-positive) and from the broader Phoenix CSV data (for Normal-classified posts).
- Exclude posts with empty or very short text (<10 characters).
- Record post IDs for reproducibility.

#### Output

- `papers/evaluation/sample_full.json` — all 350 posts with metadata and pipeline predictions.
- `papers/evaluation/sample_blind.json` — same posts with `pr` (prediction), `co` (confidence), `gt` (subtype), `exp` (explanation), `qc`, and `rel` fields stripped. Only `i` (ID), `t` (text), `d` (date), `c` (country), `p` (platform) retained.
- `papers/evaluation/sample_manifest.csv` — post IDs, country, stratum, assigned annotator.

### Phase B: Annotation (~2 weeks)

#### Pass 1: Blind Human Annotation (Week 1-2)

**Annotators:** 3 local language speakers (1 per country).

**Task:** For each post, without seeing any model predictions, assign:
1. **Classification:** Normal / Abusive / Hate
2. **Subtype** (if Abusive or Hate): from the 8-subtype taxonomy (Ethnic Targeting, Political Incitement, Clan Targeting, Religious Incitement, Dehumanisation, Anti-Foreign, General Abuse, Gendered Violence)
3. **Confidence:** Low / Medium / High (annotator's self-assessed confidence)
4. **Optional note:** free text for ambiguous cases

**Interface modification required:**
- Add a "blind annotation mode" to the IRIS annotation UI that hides: prediction badge, confidence score, subtype, explanation, QC label, relevance label.
- Shows only: post text, platform icon, date, country flag.
- Annotation action is a direct label selection (Normal/Abusive/Hate + subtype dropdown) rather than CONFIRM/CORRECT/FLAG.
- Store blind annotations in a new field or table to keep them separate from pipeline predictions.

**Assignment:**
- Kenya annotator: 100 Kenya posts + 17 Normal-classified Kenya posts = 117 posts
- Somalia annotator: 100 Somalia posts + 17 Normal-classified Somalia posts = 117 posts
- South Sudan annotator: 100 South Sudan posts + 16 Normal-classified SS posts = 116 posts

**Overlap for IAA:** To compute between-annotator agreement, designate 30 posts (10 per country) from the Questionable stratum as the "shared subset." Each annotator labels their own country's 10 shared posts as part of their normal 100, AND labels the 10 shared posts from one other country (Kenya annotator also labels 10 Somalia shared posts, etc.). This produces 30 posts with 2 independent human labels each. These 30 extra cross-country annotations bring each annotator's total to ~127 posts.

**Time estimate:** ~117 posts at ~30 seconds each = ~1 hour per annotator. Budget 2-3 sessions over 1-2 weeks to account for scheduling.

#### Pass 1b: Blind LLM Annotation (parallel with Pass 1)

**Model:** GPT-4o via OpenAI API.

**Task:** Identical to human task — classify each post as Normal/Abusive/Hate + subtype.

**Prompt design:**
- System prompt defines the 3-class taxonomy and 8 subtypes with definitions matching the human annotation guidelines.
- Includes East African context: "You are classifying social media posts from Kenya, Somalia, and South Sudan for hate speech content."
- Provides 3-5 few-shot examples per class (drawn from posts NOT in the evaluation set).
- Requests structured JSON output: `{"classification": "Hate", "subtype": "Ethnic Targeting", "confidence": "high", "reasoning": "..."}`
- Each post submitted independently (no batch context that could leak information between posts).

**Output:** `papers/evaluation/gpt4o_annotations.json` — same format as human annotations.

**Cost:** ~350 API calls at ~$0.005 each = ~$1.75 total.

#### Pass 2: Correction Pass (after Pass 1 complete)

**Same annotators, same posts, now with model predictions visible.**

**Task:** For each post, the annotator now sees:
- Their own blind label from Pass 1
- The IRIS pipeline prediction, confidence, subtype, and explanation
- They decide: CONFIRM their original label, or CORRECT it (change to a different label)

**Purpose:** Measures whether seeing model predictions changes human judgment. This data supports Paper A's discussion of human-AI collaboration in the pipeline.

**Interface:** Standard IRIS annotation UI (predictions visible), with the annotator's Pass 1 label also displayed.

**Output:** `papers/evaluation/pass2_corrections.json`

### Phase C: Agreement Analysis (Day ~21, automated)

#### Metrics to Compute

**1. Inter-annotator agreement (Cohen's kappa):**
- Human annotator vs. GPT-4o — per country and overall (3-class)
- Human annotator vs. IRIS pipeline — per country and overall
- GPT-4o vs. IRIS pipeline — per country and overall
- Between human annotators — on the 30-post overlap subset

**2. Classification performance (against human gold standard):**
- IRIS pipeline precision/recall/F1 — per class (Normal/Abusive/Hate), per country, overall
- GPT-4o precision/recall/F1 — same breakdown
- Confusion matrices for both

**3. Subtype agreement:**
- Among posts both human and pipeline labeled as Hate or Abusive: do they agree on subtype?
- Cohen's kappa on subtype assignment

**4. Pass 1 vs. Pass 2 divergence:**
- How many posts did annotators change after seeing model predictions?
- Direction of changes (e.g., did they upgrade Normal→Abusive after seeing model output?)
- Per-country breakdown

#### Output Files

- `papers/evaluation/agreement_metrics.json` — all kappa scores, P/R/F1, confusion matrices
- `papers/evaluation/agreement_report.md` — narrative summary for incorporation into Paper A
- `papers/figures/fig_confusion_matrix.png` — confusion matrix visualization
- `papers/figures/fig_agreement_by_country.png` — kappa scores by country

---

## Timeline

| Week | Workstream 1 (Monitoring) | Workstream 2 (Annotation) |
|------|---------------------------|---------------------------|
| 1 (Mar 31 - Apr 6) | Fix stats workflow, set up health check | Phase A: sample selection, UI blind mode, annotator onboarding |
| 2 (Apr 7 - Apr 13) | Monitor runs, first health check | Phase B Pass 1: blind human + GPT-4o annotation begins |
| 3 (Apr 14 - Apr 20) | Monitor runs, second health check | Phase B Pass 1 completes, Pass 2 begins |
| 4 (Apr 21 - Apr 27) | Monitor runs, third health check | Phase B Pass 2 completes, Phase C: agreement analysis |
| 5 (Apr 28 - Apr 30) | End-of-month snapshot, regenerate paper data | Update Paper A evaluation section with real metrics |

## Code Changes Required

1. **Sample selection script** (`papers/evaluation/select_sample.py`) — draws stratified sample, creates blind/full versions.
2. **Blind annotation mode** in `PostDrillDown.tsx` — toggle that hides model predictions. Controlled by URL parameter or user role.
3. **Blind annotation storage** — either a new `blind_annotations` table in Supabase or a `pass` field on `post_annotations` (pass=1 for blind, pass=2 for correction).
4. **GPT-4o annotation script** (`papers/evaluation/gpt4o_annotate.py`) — sends posts to GPT-4o API with structured prompt, collects responses.
5. **Agreement analysis script** (`papers/evaluation/compute_agreement.py`) — computes all kappa scores, P/R/F1, generates figures.
6. **Health check workflow** (`monitor-health.yml`) — weekly pipeline reliability check.

## Dependencies

- OpenAI API key (for GPT-4o) — needs to be available as environment variable or secret.
- Supabase access for annotation storage (already configured).
- 3 annotators available for ~1-2 hours each over a 2-week window.

## What This Unlocks for the Papers

**Paper A gains:**
- Formal precision/recall/F1 table (Section 5.1) — currently missing
- Inter-annotator agreement metrics (human vs. LLM vs. pipeline)
- Evidence for/against LLM QA stage effectiveness
- Human-AI collaboration analysis (Pass 1 vs. Pass 2)

**Paper D gains:**
- Confidence bounds on the aggregate statistics ("our classifier achieves X precision, so the true hate speech prevalence is between Y and Z")
- Stronger methods section credibility
- Longer monitoring window for temporal analysis
