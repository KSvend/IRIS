# MERLx IRIS Monitoring Methodology

**Platform**: MERLx IRIS — Intelligence & Risk Identification from Signals
**Prepared for**: UNDP East Africa
**Coverage**: Somalia, South Sudan, Kenya
**Monitoring period**: January 2025 — March 2026
**Dashboard**: https://ksvend.github.io/iris/

---

## 1. Overview

MERLx IRIS operates two parallel monitoring pipelines to track (1) disinformation campaigns and violent extremist propaganda, and (2) hate speech on social media across three East African countries: Somalia, South Sudan, and Kenya. The system combines automated social media surveillance, machine learning classification, rule-based linguistic analysis, and large language model quality assurance to produce a curated, analyst-verified dataset.

The methodology is designed for the East African context, with classification systems built around local-language hate speech indicators rather than generic English-language toxicity detection.

---

## 2. Data Collection

### 2.1 Social Media Surveillance

Social media posts are collected via the Apify web scraping platform using targeted keyword searches on three platforms:

| Platform | Collection method | Volume |
|----------|------------------|--------|
| X (Twitter) | `apidojo~tweet-scraper` actor, keyword + handle search | Primary source (65% of posts) |
| Facebook | `apify~facebook-posts-scraper` actor, page + group monitoring | Secondary source (33%) |
| TikTok | `clockworks~tiktok-scraper` actor, keyword search | Supplementary (2%) |

Collection runs twice daily on weekdays (06:00 and 14:00 UTC) via an automated GitHub Actions pipeline. Each run executes two separate sweeps:

- **Disinformation sweep**: 12 keyword groups targeting known disinformation campaigns, VE propaganda outlets, coordinated troll networks, fabricated claims, and foreign influence operations. Budget: ~$1.00/run.
- **Hate speech sweep**: 11 keyword groups targeting local-language hate speech terms across 7 subtypes per country. Budget: ~$0.50/run.

### 2.2 Keyword Strategy

Keywords are selected for high precision rather than high recall, prioritising terms specific to East African hate speech and disinformation:

- **Disinformation keywords**: Target specific campaigns (e.g., `#ChaosCartel`, `#43Against1`), VE outlets (Shahada News, Al-Kataib), fabricated claim patterns, and coordinated troll indicators.
- **Hate speech keywords**: Use only local-language slurs and culturally specific terms. Generic English-language terms (kill, deport, rape) are deliberately excluded to reduce noise from global content.

The keyword strategy includes an autolearning mechanism that proposes new keywords based on patterns in confirmed hate speech posts. Proposed keywords are promoted to active status after human review or after accumulating 3+ hits.

### 2.3 Source Monitoring

In addition to keyword-based sweeps, the system monitors:

- **9 VE propaganda producers**: Shahada News, Al-Kataib Media, Manjaniq Media, Somalimemo, Calamada, Radio Andalus, Voice of Munasir, Al Hijratain Media, Voice of Khorasan
- **4 HS/disinfo producers**: Lich Broadcast, SSEM TV, Dahir Alasow/Waagacusub, UmmaSoldiers
- **11 research partners** (Tier 1-3): Digital Rights Frontlines, NCIC Kenya, Tech Against Terrorism, Africa Check, PesaCheck, GNET, CTC West Point, Long War Journal, Radio Tamazuj, Eye Radio, Garowe Online

Source monitoring is conducted via Apify web scraping and search actors, checking for new content from tracked sources.

### 2.4 Baseline Data

The initial dataset was seeded with approximately 80,000 social media posts from the Phoenix platform harvest (20+ CSV files covering all three countries), collected between January 2025 and February 2026. These posts were pre-classified using four HuggingFace BERT models trained on East African content.

---

## 3. Classification Pipeline — Hate Speech

Hate speech posts undergo a multi-stage classification pipeline:

### Stage 1: Rule-Based Classification (`hs_apify_classify.py`)

Each collected post passes through the following gates:

1. **Noise filter**: Rejects fact-checks, counter-speech, press releases, and posts shorter than 10 characters.
2. **Non-EA fast reject**: Posts containing strong non-EA indicators (Trump, Biden, Gaza, Ukraine, etc.) without any East African context are immediately rejected as noise.
3. **East Africa relevance gate**: Posts must contain at least one of 140+ East Africa indicators (country names, cities, ethnic groups, political figures, clan names, Swahili terms). Exception: known toxic handles bypass this gate.
4. **HS indicator matching**: Posts are scored against 7 hate speech subtypes using dictionaries of local-language terms:

| Subtype | Example indicators |
|---------|-------------------|
| **HS-DEHUMANISE** | xayawaan (animal), jareer (racial slur), madoadoa (stains/outsiders), nyam nyam (cannibals), cockroach |
| **HS-CLAN** | mooryaan (bandit/clan slur), faqash (regime slur), laangaab (minority clan), idoor (anti-Isaaq) |
| **HS-ETHNIC** | kihii (uncircumcised insult), kokora (ethnic purge), dinkocracy, jenge (anti-Dinka), conoka (anti-Kikuyu) |
| **HS-RELIGIOUS** | kaafir/gaal (infidel), murtad (apostate), takfir, chinja kafir |
| **HS-POLITICAL** | mungiki (militia), kura au risasi (vote or bullet), konyo konyo regime |
| **HS-ANTI-FOREIGN** | wakuja (foreigners), wageni (guests/outsiders) |
| **HS-GENDER** | qaniis (homophobic slur), gabadh sharaf la'aa (woman without honour) |

5. **Confidence scoring**: 3+ indicator matches = HIGH, 2 = MEDIUM, 1 = LOW.

### Stage 2: Machine Learning Classification (`ml_classify.py`)

Posts confirmed by Stage 1 are enriched using five HuggingFace transformer models run locally:

| Model | Purpose | Architecture |
|-------|---------|-------------|
| `KSvendsen/EA-HS` | Primary hate speech detection (Normal/Abusive/Hate) | BERT fine-tuned on East African data |
| `textdetox/bert-multilingual-toxicity-classifier` | Toxicity scoring | Multilingual BERT |
| `datavaluepeople/Polarization-Kenya` | Kenya political polarization | BERT fine-tuned |
| `datavaluepeople/Afxumo-toxicity-somaliland-SO` | Somali-language toxicity | BERT fine-tuned |
| `datavaluepeople/Hate-Speech-Sudan-v2` | Sudan/South Sudan hate speech | BERT fine-tuned |

Additionally, `facebook/bart-large-mnli` (via HuggingFace Inference API) performs zero-shot classification into 10 subtopic categories: Ethnic Targeting, Clan Targeting, Anti-Foreign, Religious Incitement, Dehumanisation, Gendered Violence, Political Incitement, Diaspora Stigma, Militarisation, and Disinfo/Conspiracy.

### Stage 3: LLM Quality Assurance (`explain_posts.py`)

All posts undergo analytical review by Claude (Anthropic, `claude-sonnet-4-20250514`) in batches of 10. The LLM:

1. **Generates an analytical explanation** (1-2 sentences) for each post, translating local-language terms and explaining cultural context
2. **Validates the classification**: `correct` (genuinely hateful), `questionable` (borderline), or `misclassified` (not hate speech)
3. **Assesses regional relevance**: `relevant` (about East Africa), `possibly_relevant`, or `not_relevant`
4. **Validates toxicity levels and dimensions**: severity, insult, identity attack, threat

The LLM prompt includes a comprehensive glossary of 50+ local-language hate speech terms across Somali, Dinka/Nuer, Kikuyu/Luo, and Swahili languages with their meanings and cultural significance.

### Stage 4: Quality Gate

Posts classified as `misclassified` or `not_relevant` by the LLM are removed from the platform dataset and archived. Posts classified as `questionable` are reclassified with `pr=Questionable` and retained with reduced visual prominence.

**Quality gate results on the initial dataset:**

| LLM assessment | Count | % |
|----------------|-------|---|
| Correct (retained as Hate/Abusive) | 4,048 | 28% |
| Questionable (retained as Questionable) | 2,948 | 20% |
| Misclassified (removed) | 7,424 | 52% |

| Relevance | Count | % |
|-----------|-------|---|
| Relevant | 8,547 | 59% |
| Not relevant (removed) | 4,774 | 33% |
| Possibly relevant | 1,099 | 8% |

This quality gate reduced the dataset from 14,754 to **5,987 verified posts** — a 59% noise reduction rate. The high noise rate in the original data reflects the broad-spectrum collection strategy of the Phoenix platform, which included many non-EA posts that matched generic keywords.

### Final Classification

The retained dataset uses a three-class system:

| Class | Definition | Count |
|-------|-----------|-------|
| **Hate** | Genuinely hateful content targeting a specific group | 1,404 (23%) |
| **Abusive** | Abusive language with group-targeting elements | 2,238 (37%) |
| **Questionable** | Borderline content — political criticism, sarcasm, ambiguous intent | 2,330 (39%) |

---

## 4. Classification Pipeline — Disinformation Events

### Stage 1: Automated Classification (`apify_classify.py`)

Collected social media posts are classified using a priority-ordered rule chain:

1. **VE propaganda outlet detection**: Exact-match against 9 designated VE media outlets (Shahada News, Al-Kataib, Manjaniq, etc.) → automatic HIGH confidence DISINFO
2. **Coordinated campaign detection**: Campaign hashtag matching (#DogsOfWar, #ChaosCartel, #BBCForChaos, etc.) → HIGH confidence; troll indicator matching → MEDIUM
3. **Counter-speech/fact-check filter**: Posts containing fact-checking language → classified as NOISE
4. **News reporting filter**: Posts with journalistic markers → NOISE
5. **Keyword group-specific rules**: Tailored rules for each of 12 disinformation categories (casualty fabrication, deepfakes, ethnic claims, foreign operations, etc.)

### Stage 2: Event Building

Individual classified posts are aggregated into events:
- Near-identical posts (first 100 characters) are grouped as coordination
- Same keyword group with 3+ items → single coordinated event
- Campaign deduplication: >60% headline word overlap or shared campaign hashtags within 7 days → merge into existing event

### Stage 3: Event Lifecycle Management

Events track their lifecycle through observations:
- **Active**: Seen within last 30 days
- **Dormant**: 30-90 days without new observations
- **Resolved**: 90+ days without activity

When a new instance of an existing campaign is detected, it is added as an observation to the existing event rather than creating a duplicate.

### Stage 4: LLM Quality Assurance (`review_events.py`)

All events undergo analytical review by Claude, which:

1. **Validates classification** using the Bridge Test: is the primary substance *content* (false claims = DISINFO) or *action* (events, reports = CONTEXT)?
2. **Validates and improves headlines**: Headlines must describe the false claim being spread, not detection mechanics
3. **Validates and improves summaries**: Summaries must be analytical and contextual
4. **Validates threat levels**: P1 Critical, P2 High, P3 Moderate
5. **Extracts specific disinfo claims** from CONTEXT events (reports about disinformation contain intelligence about active campaigns)
6. **Proposes new search keywords** derived from extracted claims, feeding the autolearning loop

**QA results on existing events:**
- 244 events reviewed
- 13 reclassified (CONTEXT ↔ DISINFO)
- 115 specific disinformation claims extracted
- 5 new search keywords proposed for future sweeps

### Event Classification

| Type | Definition | Count |
|------|-----------|-------|
| **DISINFO** | Social media content spreading verifiably false claims | 43 |
| **CONTEXT** | Background events, reports, and actions related to disinformation | 201 |

---

## 5. Engagement Tracking

Post-level engagement metrics (likes, shares, comments) are collected via platform-specific Apify actors:

| Platform | Actor | Metrics |
|----------|-------|---------|
| X (Twitter) | `apidojo~tweet-scraper` | Likes, retweets, replies |
| Facebook | `apify~facebook-posts-scraper` | Reactions, shares, comments |
| TikTok | `clockworks~tiktok-scraper` | Hearts, shares, comments, views |

Engagement data is re-fetched for posts from the last 7 days, with up to 30 posts per platform per pipeline run. This provides a longitudinal view of how hate speech and disinformation content performs on each platform.

---

## 6. Autolearning System

The platform includes feedback loops that improve sweep coverage over time:

### 6.1 Toxic Handle Discovery
Authors with 2+ hate speech posts in a single sweep are flagged as toxic handles and added to direct monitoring. Their future posts are swept regardless of keyword matching.

### 6.2 Keyword Learning
Words appearing in 3+ confirmed hate speech texts that are not already known indicators are proposed as new keywords. After human review or 3+ hits, they are promoted to active status and included in future sweeps.

### 6.3 Narrative Discovery
New disinformation claims are extracted from events by the LLM review process. These claims, along with their associated keywords, are proposed as new search targets for future sweeps.

### 6.4 Intelligence Extraction
CONTEXT events (partner reports, news articles about disinformation) are automatically analysed to extract the specific disinformation claims they discuss. These extracted claims become actionable intelligence for future monitoring.

---

## 7. Limitations and Caveats

### 7.1 Collection Bias
- **Platform coverage**: X (Twitter) accounts for 65% of collected posts, likely overrepresenting certain demographics and underrepresenting populations that primarily use Facebook, WhatsApp, or Telegram.
- **Language coverage**: The keyword strategy prioritises Somali, Swahili, and English. Content in Dinka, Nuer, Luo, Kikuyu, and other local languages may be underrepresented in text-based sweeps.
- **Keyword dependency**: Posts that use novel euphemisms, coded language, or newly emerging terms may be missed until the autolearning system captures them.

### 7.2 Classification Limitations
- **Rule-based classification**: The indicator dictionaries are comprehensive but not exhaustive. Context-dependent hate speech (sarcasm, in-group reclamation of slurs, code-switching) may be misclassified.
- **ML model accuracy**: The BERT models were trained on East African data but may have lower accuracy on underrepresented language varieties or newly emerging discourse patterns.
- **LLM quality assurance**: While the LLM review significantly reduces false positives (52% noise reduction), it introduces its own biases — particularly around cultural context that may not be fully captured in the prompt.

### 7.3 Temporal Gaps
- **Monitoring schedule**: Twice-daily weekday collection may miss weekend spikes, rapidly evolving campaigns, or content that is deleted before the next collection run.
- **Engagement lag**: Engagement metrics are only re-fetched for posts from the last 7 days, so longer-term virality trends are not captured.

### 7.4 Ethical Considerations
- **Personally identifiable information**: Author handles are collected as part of the monitoring process. The platform is designed for institutional use by UNDP and research partners, not public exposure of individuals.
- **Classification as harm assessment**: The Hate/Abusive/Questionable classification reflects linguistic analysis, not legal determination. Posts classified as hate speech may or may not meet legal thresholds in any specific jurisdiction.

---

## 8. Technical Infrastructure

| Component | Technology |
|-----------|-----------|
| Data collection | Apify web scraping platform (X, Facebook, TikTok actors) |
| ML classification | HuggingFace transformer models (5 BERT models, run locally) |
| Zero-shot subtopics | `facebook/bart-large-mnli` via HuggingFace Inference API |
| LLM quality assurance | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Pipeline orchestration | GitHub Actions (scheduled + manual trigger) |
| Data storage | JSON files versioned in GitHub repository |
| Dashboard | Static HTML/JS/CSS served via GitHub Pages |
| Cost | ~$40/month (Apify $38.50, Anthropic ~$1.10, HF + GitHub Actions free) |

---

## 9. Dataset Summary

### Hate Speech Posts

| Metric | Value |
|--------|-------|
| Total verified posts | 5,987 |
| Original posts before QC | ~14,754 |
| Noise reduction rate | 59% |
| Countries | Somalia (3,029), Kenya (1,491), South Sudan (1,460), Regional (7) |
| Platforms | X/Twitter (3,900), Facebook (1,973), TikTok (114) |
| Classification | Hate (1,404), Abusive (2,238), Questionable (2,330) |
| Date range | January 2025 — March 2026 |
| Subtypes tracked | 7 (Dehumanisation, Clan Targeting, Ethnic Targeting, Religious Incitement, Political Incitement, Anti-Foreign, Gendered Violence) |
| Local-language indicators | 66 keywords across 3 countries |

### Disinformation Events

| Metric | Value |
|--------|-------|
| Total events | 244 |
| DISINFO events | 43 |
| CONTEXT events | 201 |
| Countries | Somalia (96), Kenya (64), South Sudan (61), Regional (23) |
| Unique actors tracked | 628 |
| Extracted false claims | 115 |
| Narrative families | 10 (Ethnic Incitement, Attack Claim, Delegitimization, VE Propaganda, etc.) |
| VE sources monitored | 9 designated propaganda outlets |
| Research partners | 11 (Tier 1-3) |
| Date range | February 2024 — March 2026 |

---

## 10. Reproducibility

The complete pipeline code, configuration files, classification rules, and indicator dictionaries are version-controlled in the GitHub repository (`KSvend/iris`). The automated pipeline can be triggered manually from the GitHub Actions interface, and all data transformations are logged in `data/run_history/`.

Raw CSV exports of all datasets are available in the `outputs/` directory for independent analysis.
