# IRIS Journal Papers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce two journal papers — Paper A (methodology/systems) and Paper D (findings/policy) — from the IRIS platform and its 80K+ post dataset.

**Architecture:** The work splits into three phases: (1) data analysis to generate the tables and figures both papers need, (2) writing Paper A (methodology), (3) writing Paper D (findings/policy). Phase 1 is shared infrastructure; Phases 2 and 3 are independent and can run in parallel after Phase 1 completes.

**Tech Stack:** Python (pandas, matplotlib/seaborn for figures), existing IRIS scripts for data access, LaTeX or Markdown for paper drafts.

**Spec:** `docs/superpowers/specs/2026-03-30-iris-journal-papers-design.md`

---

## Phase 1: Data Analysis & Figure Generation

All analysis outputs go to `papers/analysis/`. All figures go to `papers/figures/`. These directories will be created in Task 1.

---

### Task 1: Set Up Paper Workspace & Load Data

**Files:**
- Create: `papers/analysis/load_data.py`
- Create: `papers/figures/` (directory)
- Read: `docs/data/hate_speech_posts.json`, `docs/data/events.json`, `outputs/methodology.md`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p papers/analysis papers/figures papers/drafts
```

- [ ] **Step 2: Write data loading script**

```python
"""papers/analysis/load_data.py — Load and summarise IRIS datasets."""
import json
import csv
import os
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

def load_hs_posts():
    """Load hate speech posts from docs/data/hate_speech_posts.json."""
    with open(ROOT / "docs/data/hate_speech_posts.json") as f:
        return json.load(f)

def load_events():
    """Load disinformation events from docs/data/events.json."""
    with open(ROOT / "docs/data/events.json") as f:
        return json.load(f)

def load_hs_csv():
    """Load detailed HS data from outputs/hate_speech_posts.csv."""
    rows = []
    with open(ROOT / "outputs/hate_speech_posts.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

def summarise_hs(posts):
    """Print basic summary statistics for HS posts."""
    print(f"Total posts: {len(posts)}")
    print(f"By country: {Counter(p.get('c','unknown') for p in posts)}")
    print(f"By platform: {Counter(p.get('p','unknown') for p in posts)}")
    print(f"By prediction: {Counter(p.get('pr','unknown') for p in posts)}")
    print(f"By subtype: {Counter(p.get('gt','unknown') for p in posts)}")

def summarise_events(events):
    """Print basic summary statistics for disinformation events."""
    print(f"Total events: {len(events)}")
    print(f"By country: {Counter(e.get('country','unknown') for e in events)}")
    print(f"By type: {Counter(e.get('event_type','unknown') for e in events)}")
    print(f"By status: {Counter(e.get('status','unknown') for e in events)}")

if __name__ == "__main__":
    print("=== Hate Speech Posts ===")
    posts = load_hs_posts()
    summarise_hs(posts)
    print("\n=== Disinformation Events ===")
    events = load_events()
    summarise_events(events)
```

- [ ] **Step 3: Run the script to verify data loads correctly**

Run: `cd /Users/kmini/Github/IRIS && python papers/analysis/load_data.py`
Expected: Summary counts for both datasets matching approximate figures from spec (~5,987 HS posts, ~244 events).

- [ ] **Step 4: Commit**

```bash
git add papers/
git commit -m "papers: add workspace and data loading script"
```

---

### Task 2: Generate Hate Speech Cross-Tabulations (Paper D, Section 4)

**Files:**
- Create: `papers/analysis/hs_crosstabs.py`
- Output: `papers/analysis/hs_country_subtype.csv`, `papers/analysis/hs_country_platform.csv`, `papers/analysis/hs_prediction_distribution.csv`

- [ ] **Step 1: Write cross-tabulation script**

```python
"""papers/analysis/hs_crosstabs.py — Generate HS cross-tabulations for Paper D."""
import json
import csv
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = Path(__file__).resolve().parent

def load_hs_posts():
    with open(ROOT / "docs/data/hate_speech_posts.json") as f:
        return json.load(f)

def crosstab(posts, row_key, col_key):
    """Build a row_key x col_key frequency table."""
    table = defaultdict(Counter)
    for p in posts:
        r = p.get(row_key, "unknown")
        c = p.get(col_key, "unknown")
        table[r][c] += 1
    return table

def write_crosstab(table, filename, row_label, col_labels=None):
    """Write crosstab to CSV."""
    if col_labels is None:
        col_labels = sorted({c for row in table.values() for c in row})
    with open(OUT / filename, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([row_label] + col_labels + ["Total"])
        for row_name in sorted(table):
            counts = [table[row_name].get(c, 0) for c in col_labels]
            writer.writerow([row_name] + counts + [sum(counts)])
        # Totals row
        totals = [sum(table[r].get(c, 0) for r in table) for c in col_labels]
        writer.writerow(["Total"] + totals + [sum(totals)])

def main():
    posts = load_hs_posts()
    print(f"Loaded {len(posts)} posts")

    # Country x Subtype
    ct1 = crosstab(posts, "c", "gt")
    write_crosstab(ct1, "hs_country_subtype.csv", "Country")
    print("Wrote hs_country_subtype.csv")

    # Country x Platform
    ct2 = crosstab(posts, "c", "p")
    write_crosstab(ct2, "hs_country_platform.csv", "Country")
    print("Wrote hs_country_platform.csv")

    # Country x Prediction (Normal/Abusive/Hate)
    ct3 = crosstab(posts, "c", "pr")
    write_crosstab(ct3, "hs_prediction_distribution.csv", "Country")
    print("Wrote hs_prediction_distribution.csv")

    # Country x Toxicity level
    ct4 = crosstab(posts, "c", "tx")
    write_crosstab(ct4, "hs_country_toxicity.csv", "Country")
    print("Wrote hs_country_toxicity.csv")

    # Platform x Subtype
    ct5 = crosstab(posts, "p", "gt")
    write_crosstab(ct5, "hs_platform_subtype.csv", "Platform")
    print("Wrote hs_platform_subtype.csv")

    # Temporal distribution (month x country)
    month_country = defaultdict(Counter)
    for p in posts:
        date = p.get("d", "")
        if len(date) >= 7:
            month = date[:7]  # YYYY-MM
            month_country[month][p.get("c", "unknown")] += 1
    countries = sorted({c for row in month_country.values() for c in row})
    with open(OUT / "hs_temporal_distribution.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Month"] + countries + ["Total"])
        for month in sorted(month_country):
            counts = [month_country[month].get(c, 0) for c in countries]
            w.writerow([month] + counts + [sum(counts)])
    print("Wrote hs_temporal_distribution.csv")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the script**

Run: `cd /Users/kmini/Github/IRIS && python papers/analysis/hs_crosstabs.py`
Expected: Five CSV files created in `papers/analysis/` with cross-tabulation data.

- [ ] **Step 3: Inspect output and verify totals match expected dataset size**

Run: `head -20 papers/analysis/hs_country_subtype.csv`
Expected: Table with countries as rows, subtypes as columns, totals matching ~5,987.

- [ ] **Step 4: Commit**

```bash
git add papers/analysis/
git commit -m "papers: generate HS cross-tabulations by country, platform, subtype"
```

---

### Task 3: Generate Disinformation Event Analysis (Paper D, Section 5)

**Files:**
- Create: `papers/analysis/disinfo_analysis.py`
- Output: `papers/analysis/disinfo_country_type.csv`, `papers/analysis/disinfo_narrative_families.csv`, `papers/analysis/disinfo_claims_summary.csv`

- [ ] **Step 1: Write disinformation analysis script**

```python
"""papers/analysis/disinfo_analysis.py — Analyse disinformation events for Paper D."""
import json
import csv
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = Path(__file__).resolve().parent

def load_events():
    with open(ROOT / "docs/data/events.json") as f:
        return json.load(f)

def load_claims():
    rows = []
    path = ROOT / "outputs/extracted_disinfo_claims.csv"
    if path.exists():
        with open(path, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                rows.append(row)
    return rows

def main():
    events = load_events()
    print(f"Total events: {len(events)}")

    # Country x Event Type
    ct = defaultdict(Counter)
    for e in events:
        ct[e.get("country", "unknown")][e.get("event_type", "unknown")] += 1
    with open(OUT / "disinfo_country_type.csv", "w", newline="") as f:
        types = sorted({e.get("event_type", "unknown") for e in events})
        w = csv.writer(f)
        w.writerow(["Country"] + types + ["Total"])
        for country in sorted(ct):
            counts = [ct[country].get(t, 0) for t in types]
            w.writerow([country] + counts + [sum(counts)])
    print("Wrote disinfo_country_type.csv")

    # Narrative family frequency
    narrative_counts = Counter()
    for e in events:
        for n in e.get("disinfo_narratives", []):
            if isinstance(n, str):
                narrative_counts[n] += 1
            elif isinstance(n, dict):
                narrative_counts[n.get("family", n.get("id", "unknown"))] += 1
    with open(OUT / "disinfo_narrative_families.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Narrative Family", "Event Count"])
        for fam, count in narrative_counts.most_common():
            w.writerow([fam, count])
    print("Wrote disinfo_narrative_families.csv")

    # Event status distribution
    status_counts = Counter(e.get("status", "unknown") for e in events)
    print(f"Event status: {dict(status_counts)}")

    # Actor count
    all_actors = []
    for e in events:
        all_actors.extend(e.get("actors", []))
    print(f"Total actor mentions: {len(all_actors)}")
    print(f"Unique actors: {len(set(str(a) for a in all_actors))}")

    # Claims summary
    claims = load_claims()
    print(f"Extracted claims: {len(claims)}")
    if claims:
        with open(OUT / "disinfo_claims_summary.csv", "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["Total Claims", "Unique Events Referenced"])
            event_refs = set()
            for c in claims:
                for key in c:
                    if "event" in key.lower():
                        event_refs.add(c[key])
            w.writerow([len(claims), len(event_refs)])
        print("Wrote disinfo_claims_summary.csv")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the script**

Run: `cd /Users/kmini/Github/IRIS && python papers/analysis/disinfo_analysis.py`
Expected: CSV outputs plus console summary of event counts.

- [ ] **Step 3: Commit**

```bash
git add papers/analysis/
git commit -m "papers: generate disinformation event analysis tables"
```

---

### Task 4: Generate Pipeline Performance Metrics (Paper A, Section 5)

**Files:**
- Create: `papers/analysis/pipeline_metrics.py`
- Read: `outputs/methodology.md`, `monitoring/config/signal_metrics.json`
- Output: `papers/analysis/pipeline_performance.csv`, `papers/analysis/operational_metrics.csv`

- [ ] **Step 1: Write metrics extraction script**

This script extracts already-known metrics from the methodology documentation and signal config, and computes what's available from the classified data.

```python
"""papers/analysis/pipeline_metrics.py — Extract pipeline performance metrics for Paper A."""
import json
import csv
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = Path(__file__).resolve().parent

def load_hs_posts():
    with open(ROOT / "docs/data/hate_speech_posts.json") as f:
        return json.load(f)

def load_signal_metrics():
    with open(ROOT / "monitoring/config/signal_metrics.json") as f:
        return json.load(f)

def main():
    posts = load_hs_posts()

    # Quality gate metrics (from methodology.md — hardcoded as reference)
    quality_gate = {
        "original_dataset": 14754,
        "after_llm_qa": 5987,
        "noise_reduction_pct": 59,
        "correct_retained": 4048,
        "questionable_retained": 2948,
        "misclassified_removed": 7424,
        "relevant": 8547,
        "not_relevant_removed": 4774,
        "possibly_relevant": 1099,
    }

    with open(OUT / "pipeline_performance.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Metric", "Value"])
        for k, v in quality_gate.items():
            w.writerow([k, v])

        # LLM QA breakdown from actual data
        qc_counts = Counter(p.get("qc", "unknown") for p in posts)
        w.writerow([])
        w.writerow(["QC Label Distribution (verified dataset)", ""])
        for label, count in qc_counts.most_common():
            w.writerow([f"qc_{label}", count])

        rel_counts = Counter(p.get("rel", "unknown") for p in posts)
        w.writerow([])
        w.writerow(["Relevance Distribution (verified dataset)", ""])
        for label, count in rel_counts.most_common():
            w.writerow([f"rel_{label}", count])

    print("Wrote pipeline_performance.csv")

    # Operational metrics
    signal = load_signal_metrics()
    with open(OUT / "operational_metrics.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Metric", "Value", "Notes"])
        w.writerow(["Monthly cost (Apify)", "$38.50", "Social media scraping"])
        w.writerow(["Monthly cost (Anthropic)", "~$1.10", "Claude Sonnet QA"])
        w.writerow(["Total monthly cost", "~$40", "Full pipeline"])
        w.writerow(["Daily cost per run", "~$2", "Apify + API"])
        w.writerow(["Inference speed", "4-10 items/sec", "2-vCPU CPU-only"])
        w.writerow(["Batch size", "64", "BERT inference"])
        w.writerow(["Max token length", "256", "BERT input"])
        w.writerow(["LLM QA batch size", "10", "Claude Sonnet"])
        w.writerow(["Pipeline phases", "12", "Full run_pipeline.py"])

        # Signal quality from config
        if isinstance(signal, dict):
            w.writerow([])
            w.writerow(["Signal Quality Metrics", "", ""])
            for key, val in signal.items():
                if isinstance(val, dict):
                    hits = val.get("hits", val.get("hit_count", ""))
                    fps = val.get("false_positives", val.get("fp_count", ""))
                    w.writerow([key, f"hits={hits}, fp={fps}", ""])

    print("Wrote operational_metrics.csv")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the script**

Run: `cd /Users/kmini/Github/IRIS && python papers/analysis/pipeline_metrics.py`
Expected: Two CSV files with pipeline performance and operational cost data.

- [ ] **Step 3: Commit**

```bash
git add papers/analysis/
git commit -m "papers: extract pipeline performance and operational metrics"
```

---

### Task 5: Generate Figures

**Files:**
- Create: `papers/analysis/generate_figures.py`
- Output: `papers/figures/*.png`

- [ ] **Step 1: Install matplotlib if needed**

Run: `pip install matplotlib seaborn`

- [ ] **Step 2: Write figure generation script**

```python
"""papers/analysis/generate_figures.py — Generate paper figures from analysis CSVs."""
import csv
import os
from pathlib import Path

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.ticker as ticker
except ImportError:
    print("matplotlib not installed. Run: pip install matplotlib")
    exit(1)

ANALYSIS = Path(__file__).resolve().parent
FIGURES = ANALYSIS.parent / "figures"

def read_crosstab(filename):
    """Read a crosstab CSV into {row: {col: count}}."""
    with open(ANALYSIS / filename, newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        cols = header[1:-1]  # skip row label and Total
        data = {}
        for row in reader:
            if row[0] == "Total":
                continue
            data[row[0]] = {c: int(v) for c, v in zip(cols, row[1:-1])}
    return cols, data

def fig_country_subtype():
    """Stacked bar chart: HS subtypes by country."""
    cols, data = read_crosstab("hs_country_subtype.csv")
    countries = sorted(data.keys())
    fig, ax = plt.subplots(figsize=(10, 6))
    bottom = [0] * len(countries)
    for col in cols:
        values = [data[c].get(col, 0) for c in countries]
        ax.bar(countries, values, bottom=bottom, label=col)
        bottom = [b + v for b, v in zip(bottom, values)]
    ax.set_ylabel("Number of Posts")
    ax.set_title("Hate Speech Subtypes by Country")
    ax.legend(bbox_to_anchor=(1.05, 1), loc="upper left", fontsize=8)
    plt.tight_layout()
    plt.savefig(FIGURES / "fig_country_subtype.png", dpi=150)
    plt.close()
    print("Saved fig_country_subtype.png")

def fig_platform_distribution():
    """Grouped bar: HS volume by platform and country."""
    cols, data = read_crosstab("hs_country_platform.csv")
    countries = sorted(data.keys())
    fig, ax = plt.subplots(figsize=(8, 5))
    x = range(len(countries))
    width = 0.8 / max(len(cols), 1)
    for i, platform in enumerate(cols):
        values = [data[c].get(platform, 0) for c in countries]
        offset = (i - len(cols)/2 + 0.5) * width
        ax.bar([xi + offset for xi in x], values, width, label=platform)
    ax.set_xticks(x)
    ax.set_xticklabels(countries)
    ax.set_ylabel("Number of Posts")
    ax.set_title("Hate Speech Posts by Platform and Country")
    ax.legend()
    plt.tight_layout()
    plt.savefig(FIGURES / "fig_platform_distribution.png", dpi=150)
    plt.close()
    print("Saved fig_platform_distribution.png")

def fig_prediction_distribution():
    """Pie chart: overall prediction distribution."""
    cols, data = read_crosstab("hs_prediction_distribution.csv")
    totals = {c: sum(data[country].get(c, 0) for country in data) for c in cols}
    labels = list(totals.keys())
    sizes = list(totals.values())
    colors = {"Hate": "#d32f2f", "Abusive": "#f57c00", "Normal": "#757575",
              "Questionable": "#fbc02d"}
    fig, ax = plt.subplots(figsize=(7, 7))
    ax.pie(sizes, labels=labels, autopct="%1.1f%%",
           colors=[colors.get(l, "#999") for l in labels])
    ax.set_title("Overall Classification Distribution")
    plt.tight_layout()
    plt.savefig(FIGURES / "fig_prediction_distribution.png", dpi=150)
    plt.close()
    print("Saved fig_prediction_distribution.png")

def fig_temporal_trend():
    """Line chart: HS posts over time by country."""
    with open(ANALYSIS / "hs_temporal_distribution.csv", newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        countries = header[1:-1]
        months = []
        data = {c: [] for c in countries}
        for row in reader:
            months.append(row[0])
            for i, c in enumerate(countries):
                data[c].append(int(row[i + 1]))
    fig, ax = plt.subplots(figsize=(10, 5))
    for c in countries:
        ax.plot(months, data[c], marker="o", label=c)
    ax.set_ylabel("Number of Posts")
    ax.set_title("Hate Speech Posts Over Time by Country")
    ax.legend()
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(FIGURES / "fig_temporal_trend.png", dpi=150)
    plt.close()
    print("Saved fig_temporal_trend.png")

def main():
    os.makedirs(FIGURES, exist_ok=True)
    fig_country_subtype()
    fig_platform_distribution()
    fig_prediction_distribution()
    fig_temporal_trend()
    print(f"\nAll figures saved to {FIGURES}")

if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Run the script**

Run: `cd /Users/kmini/Github/IRIS && python papers/analysis/generate_figures.py`
Expected: Three PNG files in `papers/figures/`.

- [ ] **Step 4: Visually inspect figures**

Open the PNG files and verify they look reasonable — correct labels, sensible proportions, no rendering issues.

- [ ] **Step 5: Commit**

```bash
git add papers/analysis/generate_figures.py papers/figures/
git commit -m "papers: generate figures for HS distribution by country, platform, prediction"
```

---

## Phase 2: Paper A — Methodology Paper

---

### Task 6: Draft Paper A Structure

**Files:**
- Create: `papers/drafts/paper-a-methodology.md`

- [ ] **Step 1: Write the paper draft skeleton with all sections**

```markdown
# IRIS: An Automated Multi-Stage Pipeline for Hate Speech and Disinformation Monitoring in Low-Resource East African Contexts

## Abstract

[To be written after all sections are drafted]

## 1. Introduction

Online hate speech has been identified as a precursor to violence in East Africa,
from the 2007-08 Kenyan post-election violence to ongoing ethnic mobilization in
South Sudan and Al-Shabaab propaganda in Somalia. Monitoring these risks at scale
requires systems that handle multilingual content (Swahili, Somali, Arabic dialects,
English), local-language slang, and high false-positive rates from general-purpose
classifiers.

Existing approaches fall short in three ways. First, toxicity APIs such as
Perspective API and OpenAI's moderation endpoint are English-dominant and lack
support for East African languages and conflict-specific narrative categories.
Second, conflict monitoring systems like ACLED track physical events from news
reports but do not monitor online speech. Third, academic hate speech benchmarks
(HateCheck, HatEval) are rarely operationalized into deployed systems with
alerting and daily automation.

We present IRIS (Intelligence & Risk Identification from Signals), an automated
pipeline that combines rule-based linguistic filtering, four fine-tuned BERT
models, and LLM-based quality assurance to monitor social media across Kenya,
Somalia, and South Sudan. We evaluate classification performance on 80,000+
social media posts and report early operational observations from live deployment.

**Contributions:**
- An end-to-end pipeline architecture combining rule-based, ML, and LLM stages
  for hate speech and disinformation monitoring
- Evaluation demonstrating that the multi-stage approach outperforms any single
  stage in isolation
- Operational deployment metrics showing the system runs at ~$40/month
- Open discussion of failure modes and limitations in conflict monitoring contexts

## 2. Related Work

### 2.1 Hate Speech Detection
[Cite: Davidson et al. 2017, Waseem & Hovy 2016, Fortuna & Nunes 2018 survey]
[Gap: primarily English-language, Western social media contexts]

### 2.2 Multilingual and Low-Resource NLP for Africa
[Cite: AfriSenti (Muhammad et al. 2023), MasakhaNER (Adelani et al. 2021),
AfroLID, Masakhane community]
[Gap: sentiment and NER focus, not hate speech classification pipelines]

### 2.3 Toxicity APIs and Commercial Tools
[Cite: Perspective API (Jigsaw), OpenAI moderation, Meta's hate speech systems]
[Gap: English-centric, no local-language terms, no conflict-specific taxonomy,
no operational alerting for humanitarian contexts]

### 2.4 Conflict Monitoring and Early Warning
[Cite: ACLED, CrisisNLP, PeaceTech Lab, Sentinel Project, iVerify (UNDP)]
[Gap: physical events not online speech, manual not automated, or
single-platform not cross-platform]

### 2.5 LLM-Augmented Classification
[Cite: emerging work on using LLMs for data quality, explanation generation,
annotation assistance]
[Connection: IRIS uses LLMs specifically for QA, not primary classification]

## 3. System Architecture

### 3.1 Data Collection
[Describe Phoenix gathers, Apify sweeps, research agent, direct URL monitoring]
[Include: Table 1 — Data sources and coverage]

### 3.2 Classification Pipeline
[Describe the five stages with diagram reference]
[Include: Figure 1 — Pipeline architecture diagram]

### 3.3 Dual Monitoring Modalities
[Describe Disorder Events wheel vs. Hate Speech Posts wheel]

### 3.4 Alert and Escalation Protocol
[Describe P1/P2/P3 thresholds and notification logic]

### 3.5 Operational Infrastructure
[GitHub Actions, Supabase, daily automation, cost structure]

## 4. Classification Methodology

### 4.1 Rule-Based Filtering
[140+ EA indicators, local-language dictionaries, noise rejection]
[Include: Table 2 — Example local-language HS indicators by country]

### 4.2 ML Classification
[EA-HS BERT model, training data, fine-tuning, 3-class output]
[Supplementary models: Polarization-Kenya, Afxumo, HS-Sudan]

### 4.3 LLM Quality Assurance
[Claude API for explanation, false positive removal, subtype assignment]
[Include: Table 3 — Example LLM QA outputs (synthesized, not real posts)]

### 4.4 Stage Interaction
[How rule-based pre-filtering improves ML precision]
[How LLM QA catches ML false positives]

## 5. Evaluation

### 5.1 Classification Performance
[Include: Table 4 — Per-model precision/recall/F1]
[Data source: papers/analysis/pipeline_performance.csv]

### 5.2 Quality Gate Impact
[Original 14,754 → 5,987 after LLM QA (59% noise reduction)]
[Include: Table 5 — Quality gate breakdown]

### 5.3 Error Analysis
[Common failure modes: sarcasm, code-switching, indirect speech]
[Include: Table 6 — Error categories with frequency counts]

### 5.4 Operational Metrics
[Throughput, cost, infrastructure]
[Data source: papers/analysis/operational_metrics.csv]
[Include: Table 7 — Operational cost breakdown]

## 6. Discussion

### 6.1 Why Multi-Stage Beats Single-Stage
[Evidence from quality gate: 59% of rule+ML classified posts were noise]

### 6.2 Trade-Offs
[Cost vs. accuracy, automation vs. human review, coverage vs. precision]

### 6.3 Generalizability
[What would need to change for other low-resource conflict contexts]

### 6.4 Limitations
[Keyword-driven collection bias, classifier coverage gaps, deployment duration,
X/Twitter limitations in CI, potential for adversarial evasion]

## 7. Ethics and Data Privacy

[PII redaction, aggregate-only reporting, UNDP mandate, surveillance risks,
false positive consequences, IRB status]

## 8. Conclusion

[Summary of contributions, open questions, future work]

## References

[To be compiled during literature review]
```

- [ ] **Step 2: Commit**

```bash
git add papers/drafts/paper-a-methodology.md
git commit -m "papers: draft skeleton for Paper A (methodology)"
```

---

### Task 7: Literature Review for Paper A

**Files:**
- Create: `papers/analysis/literature_review_a.md`

This task requires web search and reading. The output is a structured reference list with notes on relevance.

- [ ] **Step 1: Search for key references in each Related Work subsection**

Search for these specific papers and record citation details + key findings:

**Hate speech detection:**
- Davidson et al. (2017) — "Automated Hate Speech Detection and the Problem of Offensive Language"
- Waseem & Hovy (2016) — "Hateful Symbols or Hateful People?"
- Fortuna & Nunes (2018) — survey on automatic detection of hate speech

**African NLP:**
- AfriSenti (Muhammad et al. 2023) — African sentiment analysis
- MasakhaNER (Adelani et al. 2021) — NER for African languages
- Any published work on hate speech detection in Swahili, Somali, or Sudanese Arabic

**Toxicity APIs:**
- Perspective API documentation and evaluation papers
- Any comparative studies showing Perspective API limitations on non-English text

**Conflict monitoring:**
- ACLED methodology papers
- PeaceTech Lab publications on online monitoring
- UNDP iVerify publications
- Sentinel Project methodology

**LLM-augmented classification:**
- Recent papers (2024-2025) on using LLMs for annotation, QA, or classification augmentation

- [ ] **Step 2: Write structured reference list**

Write to `papers/analysis/literature_review_a.md` with format:
```
## Section: [Related Work subsection]
### [Author et al. (Year)] — [Title]
- **Citation:** [Full citation]
- **Key finding:** [1-2 sentences]
- **Relevance to IRIS:** [How we reference this]
- **Gap we fill:** [What IRIS does that this doesn't]
```

- [ ] **Step 3: Commit**

```bash
git add papers/analysis/literature_review_a.md
git commit -m "papers: literature review notes for Paper A"
```

---

### Task 8: Write Paper A Evaluation Section (requires running analysis)

**Files:**
- Modify: `papers/drafts/paper-a-methodology.md`
- Read: `papers/analysis/pipeline_performance.csv`, `papers/analysis/operational_metrics.csv`

- [ ] **Step 1: Fill in Section 5.1 — Classification Performance**

Replace the placeholder with actual metrics from `pipeline_performance.csv`. Present the EA-HS model's performance on the verified dataset. If precision/recall/F1 are not directly available, compute them from the quality gate data:
- True positives = correct_retained (4,048)
- Questionable = retained but uncertain (2,948)
- False positives = misclassified_removed (7,424)

Note: This gives us a post-hoc precision estimate for the ML stage before LLM QA. Document exactly what these numbers measure.

- [ ] **Step 2: Fill in Section 5.2 — Quality Gate Impact**

Write the narrative around the 59% noise reduction figure. Structure as a before/after comparison showing what the LLM QA stage catches.

- [ ] **Step 3: Fill in Section 5.4 — Operational Metrics**

Use `operational_metrics.csv` to write the cost and throughput discussion.

- [ ] **Step 4: Commit**

```bash
git add papers/drafts/paper-a-methodology.md
git commit -m "papers: write Paper A evaluation section with metrics"
```

---

### Task 9: Complete Paper A Draft

**Files:**
- Modify: `papers/drafts/paper-a-methodology.md`

- [ ] **Step 1: Write Section 3 — System Architecture**

Using the codebase knowledge: describe the pipeline stages, data flow, and infrastructure. Reference the architecture diagram (to be created as a figure). Key files to reference for accuracy:
- `monitoring/run_pipeline.py` (12 pipeline phases)
- `monitoring/hs_apify_classify.py` (rule-based classification)
- `monitoring/ml_classify.py` (ML enrichment)
- `monitoring/explain_posts.py` (LLM QA)

- [ ] **Step 2: Write Section 4 — Classification Methodology**

Detail each stage with examples. For local-language indicators, draw from `monitoring/config/hs_keyword_strategy.json` (use anonymized examples — keyword categories, not specific slurs). Describe the EA-HS model architecture and the LLM QA prompt design.

- [ ] **Step 3: Write Section 6 — Discussion**

Frame the multi-stage argument using the quality gate evidence. Discuss trade-offs, generalizability, and limitations honestly.

- [ ] **Step 4: Write Section 7 — Ethics**

Cover PII redaction, aggregate-only reporting, UNDP mandate, surveillance risks. Flag IRB as pending.

- [ ] **Step 5: Write Abstract**

Summarize the paper in ~250 words now that all sections are drafted.

- [ ] **Step 6: Commit**

```bash
git add papers/drafts/paper-a-methodology.md
git commit -m "papers: complete Paper A first draft"
```

---

## Phase 3: Paper D — Findings/Policy Paper

---

### Task 10: Draft Paper D Structure

**Files:**
- Create: `papers/drafts/paper-d-findings.md`

- [ ] **Step 1: Write the paper draft skeleton**

```markdown
# Online Hate Speech and Disinformation Patterns Across East Africa: Evidence from Automated Classification of 80,000+ Social Media Posts

## Abstract

[To be written after all sections are drafted]

## 1. Introduction

Understanding the patterns, platforms, and narratives of online hate speech is
critical for conflict prevention in East Africa. While a growing body of research
examines online hate speech, most empirical studies focus on Western,
English-language contexts. Large-scale, cross-national evidence from East Africa
remains scarce.

This paper presents a cross-national analysis of online hate speech and
disinformation across Kenya, Somalia, and South Sudan. Using an automated
classification pipeline (described in [Paper A reference]) applied to 80,000+
social media posts collected over approximately six months (mid-2025 to early
2026), we examine how hate speech subtypes, platforms, and disinformation
narratives vary across these three conflict-affected countries.

We identify eight distinct hate speech subtypes and nine disinformation narrative
families, revealing significant variation by country context and social media
platform. We discuss implications for conflict early warning, platform governance,
and peacebuilding programming.

## 2. Context

### 2.1 Kenya
[Post-2007 election violence, ethnic tensions, 2027 election cycle, social media
penetration]

### 2.2 Somalia
[Al-Shabaab, clan dynamics, diaspora information flows]

### 2.3 South Sudan
[Civil war, ethnic mobilization, displacement, recent escalations]

### 2.4 Social Media in East Africa
[Facebook dominance, X/Twitter, TikTok emerging, platform-specific dynamics]

## 3. Data and Methods

### 3.1 Data Collection
[Phoenix platform, keyword-based gathers, ~6 months mid-2025 to early 2026]
[Include: Table 1 — Dataset overview (country x platform counts)]

### 3.2 Classification
[Brief: five-stage pipeline, reference Paper A for details]
[Include: Table 2 — Hate speech taxonomy (8 subtypes with definitions)]
[Include: Table 3 — Disinformation narrative taxonomy (9 families)]

### 3.3 Limitations
[Keyword-driven selection bias, classifier error rates, platform access,
TikTok underrepresentation, temporal window]

## 4. Findings: Hate Speech Patterns

### 4.1 Overall Prevalence
[Data source: papers/analysis/hs_prediction_distribution.csv]
[Reconcile Phoenix 26.5% narrative tag vs. EA-HS 6.4% Hate classification]

### 4.2 Country-Level Variation
[Data source: papers/analysis/hs_country_subtype.csv]
[Include: Figure 2 — HS subtypes by country (stacked bar)]

### 4.3 Platform-Level Variation
[Data source: papers/analysis/hs_country_platform.csv, hs_platform_subtype.csv]
[Include: Figure 3 — Platform distribution]

### 4.4 Subtype Analysis
[Deep dive into dominant subtypes per country]

## 5. Findings: Disinformation and Narrative Families

### 5.1 Event Overview
[Data source: papers/analysis/disinfo_country_type.csv]

### 5.2 Narrative Family Distribution
[Data source: papers/analysis/disinfo_narrative_families.csv]
[Include: Figure 4 — Narrative family prevalence]

### 5.3 Country-Level Patterns
[Which narratives dominate in each country]

### 5.4 Interaction Between Hate Speech and Disinformation
[Co-occurrence analysis if data supports it]

## 6. Discussion: Implications for Policy and Programming

### 6.1 Conflict Early Warning
[Which online signals are most relevant for early warning]

### 6.2 Platform Governance
[Facebook as primary vector in EA vs. Western X/Twitter focus]

### 6.3 Country-Specific Programming
[Tailoring interventions to dominant HS subtypes]

### 6.4 Counter-Narratives and Protective Speech
[21% Peace classification — what does this look like, how to amplify]

### 6.5 Automated Monitoring for Programme Design
[Value of systematic measurement vs. anecdotal evidence]

### 6.6 Limitations
[Selection bias, accuracy bounds, aggregate masking, temporal limits]

## 7. Ethics

[PII redaction, aggregate-only, responsible disclosure, surveillance vs.
protection framing, researcher positionality, IRB status]

## 8. Conclusion

[Key findings, call for monitoring infrastructure, future directions]

## References

[To be compiled during literature review]
```

- [ ] **Step 2: Commit**

```bash
git add papers/drafts/paper-d-findings.md
git commit -m "papers: draft skeleton for Paper D (findings/policy)"
```

---

### Task 11: Literature Review for Paper D

**Files:**
- Create: `papers/analysis/literature_review_d.md`

- [ ] **Step 1: Search for key references**

**East African conflict and online hate speech:**
- Studies on Kenyan election violence and social media
- Research on Al-Shabaab online propaganda
- South Sudan conflict and information dynamics
- Comparative studies of online hate speech in Africa

**Online hate speech and violence linkage:**
- Müller & Schwarz (2021) — "Fanning the Flames of Hate"
- Yanagizawa-Drott (2014) — hate radio in Rwanda
- Studies linking social media to offline violence

**Platform governance in Global South:**
- Facebook's role in Myanmar, Ethiopia
- Platform content moderation gaps in non-English contexts

**Conflict early warning:**
- UN Framework of Analysis for atrocity prevention
- Digital early warning systems literature

- [ ] **Step 2: Write structured reference list**

Same format as Task 7 — citation, key finding, relevance, gap.

- [ ] **Step 3: Commit**

```bash
git add papers/analysis/literature_review_d.md
git commit -m "papers: literature review notes for Paper D"
```

---

### Task 12: Write Paper D Findings Sections

**Files:**
- Modify: `papers/drafts/paper-d-findings.md`
- Read: all CSV outputs in `papers/analysis/`

- [ ] **Step 1: Write Section 4 — Hate Speech Patterns**

Use the cross-tabulation CSVs to write the findings narrative. Present:
- Overall prevalence with clear definition of what "hate speech" means in this context
- Country comparison with specific numbers
- Platform comparison highlighting Facebook dominance
- Notable subtype patterns (e.g., ethnic vs. clan targeting)

- [ ] **Step 2: Write Section 5 — Disinformation and Narrative Families**

Use the disinformation analysis CSVs. Present:
- Event type and country distribution
- Narrative family ranking
- Country-specific narrative patterns

- [ ] **Step 3: Write Section 6 — Discussion**

Connect findings to policy implications. This is where the paper makes its contribution beyond the numbers.

- [ ] **Step 4: Write Abstract**

Summarize in ~250 words with key quantitative findings.

- [ ] **Step 5: Commit**

```bash
git add papers/drafts/paper-d-findings.md
git commit -m "papers: complete Paper D first draft"
```

---

## Phase 4: Review and Finalise

---

### Task 13: Cross-Review Both Papers

**Files:**
- Read: `papers/drafts/paper-a-methodology.md`, `papers/drafts/paper-d-findings.md`

- [ ] **Step 1: Check Paper A → Paper D consistency**

Verify that:
- Dataset numbers match between papers
- Terminology is consistent (same subtype names, same narrative family names)
- Paper D's brief methods section is consistent with Paper A's full description
- No confidential information leaked in either paper

- [ ] **Step 2: Check Paper D → Paper A cross-reference**

Verify that Paper D correctly references Paper A for methodological details and does not duplicate unnecessarily.

- [ ] **Step 3: Check both papers against spec constraints**

Review against `docs/superpowers/specs/2026-03-30-iris-journal-papers-design.md`:
- No individual posts or sources exposed
- All data PII-redacted
- No direct reference to confidential BRACE4PEACE report
- Deployment duration not overstated
- Dataset temporal coverage accurately described

- [ ] **Step 4: Flag any issues found and fix them**

- [ ] **Step 5: Commit any fixes**

```bash
git add papers/
git commit -m "papers: cross-review fixes for consistency and constraints"
```

---

### Task 14: Resolve Open Action Items

**Files:**
- Modify: `papers/drafts/paper-a-methodology.md` and/or `papers/drafts/paper-d-findings.md`

- [ ] **Step 1: List all [bracketed placeholders] remaining in both drafts**

Run: `grep -n '\[.*\]' papers/drafts/paper-a-methodology.md papers/drafts/paper-d-findings.md`

- [ ] **Step 2: Resolve each placeholder**

For each one, either fill it in or mark it as requiring human input (authorship decisions, IRB status, venue selection).

- [ ] **Step 3: Create an action items file for the human author**

```bash
# papers/ACTION_ITEMS.md — things that need human decisions
```

Include:
- IRB/ethics: check with UNDP
- Authorship: decide who is on which paper
- Venue: select primary target for each paper, check deadlines
- Any remaining placeholders that need domain expertise

- [ ] **Step 4: Commit**

```bash
git add papers/
git commit -m "papers: resolve placeholders and create action items list"
```

---

### Task 15: Final Commit and Push

- [ ] **Step 1: Review all files in papers/**

```bash
find papers/ -type f | sort
```

Verify the directory structure is clean and all expected files are present.

- [ ] **Step 2: Final commit if needed**

```bash
git add papers/
git commit -m "papers: final organisation of paper workspace"
```

- [ ] **Step 3: Push**

```bash
git push origin main
```
