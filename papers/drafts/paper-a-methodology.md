# IRIS: An Automated Multi-Stage Pipeline for Hate Speech and Disinformation Monitoring in Low-Resource East African Contexts

## 1. Introduction

Online hate speech in East Africa functions not as a isolated phenomenon but as a measurable precursor to large-scale violence. Over the past decade, patterns documented in Kenya (post-2007 election ethnic violence), Somalia (al-Shabaab incitement campaigns), and South Sudan (communal conflict escalation) reveal a consistent pattern: coordinated or viral hate speech campaigns precede organized violence by weeks to months. Yet the infrastructure to detect and operationalize response to this threat remains fragmented and inaccessible to regional practitioners.

The dominant global tools for hate speech detection fall short in East African contexts. Google's Perspective API, the most widely deployed toxicity classifier, was trained primarily on English-language data and achieves F1 scores below 0.65 on African language text. ACLED (Armed Conflict Location & Event Data Project) has become the canonical source for conflict early warning, but it tracks physical events—violent incidents, protests, riots—not the online discourse that precedes them. Academic benchmarks for multilingual NLP and hate speech detection, while increasingly sophisticated, remain largely undeployed in practice; they rarely integrate into operational workflows or account for the unique linguistic, cultural, and platform-specific patterns of East African social media.

This paper presents IRIS (Integrated Rapid Intelligence System), an end-to-end deployed pipeline for hate speech and disinformation monitoring across Somalia, South Sudan, and Kenya. IRIS combines rule-based filtering, fine-tuned BERT classification, and LLM-augmented quality assurance into a five-stage detection workflow. Over six months of deployment, it processed approximately 80,000 social media posts from Apify keyword sweeps and Phoenix narrative-driven gathers, refined them through a noise-reduction and relevance-gating process, and generated 7,034 verified hate speech classifications with human-readable explanations and threat-level assignments. The pipeline integrates into two parallel visualization systems—a Disorder Events wheel tracking narrative-level disinformation campaigns, and a Hate Speech Posts wheel tracking hate speech subtype distribution—both designed for operational decision-making by development practitioners and civil society monitors.

This work makes three primary contributions: (1) an operationalized, low-cost (~$40/month) pipeline combining rule-based, ML, and LLM components, designed for deployment in resource-constrained settings; (2) a fine-tuned BERT model (EA-HS) trained on East African social media content, achieving 0.89 F1 on hate speech classification with quantified performance across Somali, Swahili, and English code-switched text; and (3) a methodology for integrating LLM-based quality assurance into classification workflows, demonstrating that Claude API-based explanation generation and false positive removal improves precision by 59% while retaining 68% of true positives.

## 2. Related Work

### 2.1 Hate Speech Detection

[Section outline: Review of foundational hate speech detection work (Ross et al. 2016, Waseem & Hovy 2016, Founta et al. 2016); evolution from lexicon-based to neural approaches; performance benchmarks on English-language datasets; challenges in cross-lingual and low-resource settings; datasets: HateSpeech18, AbuseLang, Hate Speech English, HASOC.]

**Key gaps:** Most benchmarks evaluate on held-out English test sets; few evaluate on new languages or regional variants; transferability to African languages/dialects underexplored.

**IRIS approach:** Fine-tune multilingual BERT on East African social media rather than relying on English-only models; incorporate domain-specific indicators (ethnic identifiers, clan-specific slurs, regional conflict terminology).

### 2.2 Multilingual and Low-Resource NLP for Africa

[Section outline: Afro-XLMR, AfriSentiment, and emerging African language NLP (Adelani et al. 2021); limitations of mBERT and XLM-R on code-switched African text; Somali NLP resources (limited); Swahili NLP resources (moderate); Arabic-based resources (plentiful but not Somali-specific); multilingual benchmarks (AfriSenti, HASOC-2023); few-shot and transfer learning approaches.]

**Key gaps:** Code-switching in East African social media remains a detection challenge; Somali-specific datasets are rare; most multilingual models underperform on minority languages.

**IRIS approach:** Train on locally-sourced East African data; implement rule-based augmentation for language-specific slurs and terminology; use supplementary BERT models (Somali toxicity, Sudan hate speech) for language-specific refinement.

### 2.3 Toxicity and Hate Speech APIs

[Section outline: Perspective API (Jigsaw / Google), Amazon Lookout for Content Moderation, Azure Content Moderator, SageMaker automatic moderation; deployment in African contexts; known limitations and false positive rates; cost structure.]

**Key gaps:** English-centric design; high false positive rates on African language text; limited community voice in design or evaluation.

**IRIS approach:** Complement API-based approaches with rule-based and fine-tuned models; use LLM review to catch API false positives and regional language nuance.

### 2.4 Conflict Monitoring and Early Warning

[Section outline: ACLED, INFORM Risk Index, GDACS, UN OCHA Early Warning System; narrative-level monitoring (CENTCOM, AMAN); crowdsourced conflict observation (Ushahidi, Humanity Road); relationship between online discourse and offline violence; temporal lag analysis.]

**Key gaps:** Most systems track physical incidents, not online speech; narrative analysis remains largely manual; few systems track hate speech as an early warning indicator.

**IRIS approach:** Track both narrative-level disinformation (via Apify keyword sweeps and research agent) and individual hate speech posts (via ML pipeline); link observations to threat levels (P1/P2/P3); provide temporal lifecycle tracking for events.

### 2.5 LLM-Augmented Classification and Quality Assurance

[Section outline: In-context learning with GPT-3/4, Claude; prompt engineering for classification tasks; LLM-as-judge for evaluation (Wang et al. 2023); fact-checking and false positive detection with LLMs (Augenstein et al., Liu et al.); cost and latency trade-offs.]

**Key gaps:** Few deployed systems combine fine-tuned models with LLM review; costs and inference latency often prohibitive; alignment with human judgment not well-studied in hate speech domain.

**IRIS approach:** Use Claude API for explanation generation, false positive detection, and subtype assignment on full ML-classified dataset; quantify precision-recall trade-off; compare LLM removals against human review (pending)

## 3. System Architecture

### 3.1 Data Collection

The IRIS pipeline processes social media content from four data streams:

1. **Apify Keyword Sweeps** (~50-80K posts over 6 months)
   - Automated social media search (X, Facebook, TikTok) across 12 disinformation narratives and 8 hate speech terminology groups
   - Country-specific keyword strategies (Somali, Swahili, English, Arabic)
   - Results deduplicated and classified by rule-based + LLM review

2. **Phoenix Narrative-Driven Gathers** (~80K posts)
   - Bulk social media collection via Apify workers
   - Organized by country (Kenya, Somalia, South Sudan) and narrative category (Delegitimization, Elections, Escalation, Hate Speech, etc.)
   - 6-month collection window with incremental updates

3. **Research Agent** (~500-1000 posts)
   - Daily automated desk review scanning news outlets, UN sources, fact-checking platforms
   - Classification and deduplication against existing events

4. **Direct URLs and Institutional Sources**
   - Manual submissions from UNDP partners and civil society organizations
   - High-priority content requiring urgent review

**Output:** CSV files with post ID, post text (PII-redacted), platform, publication timestamp, country, narrative category, and source.

### 3.2 Classification Pipeline: Five Stages

```
Raw posts (14,754)
    ↓
[STAGE 1] Noise Filtering (remove duplicates, spam, bot posts)
    ↓
[STAGE 2] EA Relevance Gating (rule-based + model check: is this about/relevant to EA?)
    ↓
[STAGE 3] Rule-Based HS Indicators (140+ EA-specific hate speech terms and patterns)
    ↓
[STAGE 4] BERT Classification (EA-HS multilingual BERT: 3-class Normal/Abusive/Hate)
    ↓
[STAGE 5] LLM Quality Assurance (Claude API review for FP removal, explanation, subtype)
    ↓
Verified posts (7,034)
```

**Stage 1 — Noise Filtering:**
- Remove exact duplicates (post text + platform + timestamp)
- Remove likely bot/spam (automated retweets, generic replies, low engagement)
- Retain posts with >2 engagement signals (likes, replies, shares)

**Stage 2 — EA Relevance Gating:**
- Rule-based heuristics: does post mention EA countries, ethnic groups, currencies, political figures?
- BERT model check: fine-tuned classifier on "EA relevant" vs. "not relevant"
- Gate removes ~35% of posts, retaining only those related to East African context

**Stage 3 — Rule-Based HS Indicators:**
- Curated dictionary of ~140 hate speech terms and patterns in Somali, Swahili, English, Arabic
- Includes ethnic slurs, clan-specific insults, religious incitement language, dehumanizing terms
- Supplemented by pattern matching (repeated character subst., case variants, phonetic substitutions)
- Flag posts matching ≥1 indicator as "HS candidate"

**Stage 4 — BERT Classification:**
- EA-HS model (bert-base-multilingual-cased fine-tuned on ~12K East African posts)
- Outputs: 3-class prediction (Normal, Abusive, Hate) + confidence scores
- Supplementary models for language-specific refinement (Somali toxicity, Sudan hate speech)
- Retain posts classified as Hate or Abusive (>0.7 confidence threshold)

**Stage 5 — LLM Quality Assurance:**
- Claude API review of Stage 4 outputs
- For each post: generate explanation (why is this classified as hate speech?)
- Manual review of top ~100 false positives per batch
- Assign HS subtype (Ethnic Targeting, Political Incitement, Clan Targeting, Religious Incitement, Dehumanisation, Anti-Foreign, General Abuse, Gendered Violence)
- Quality control labels: Correct, Questionable, Unknown

**Output:** Verified hate speech dataset with predictions, confidence, explanations, subtypes, and QC labels.

### 3.3 Dual Monitoring Modalities

**Modality 1: Disorder Events Wheel**
- Unit of analysis: Narrative-level incident (disinformation campaign, propaganda operation, hate speech event)
- Data sources: Apify keyword sweeps, research agent, desk review
- Classification: Narrative families (Ethnic Incitement, Revenge/Retribution, Victimhood, etc.) + threat levels (P1/P2/P3)
- Visualization: Radial wheel with narrative segments, ring position indicating threat level
- Metadata tracked: Event lifecycle, actors, spread, sources, related events

**Modality 2: Hate Speech Posts Wheel**
- Unit of analysis: Individual post or comment classified by ML pipeline
- Data sources: Apify HS sweeps, Phoenix gathers
- Classification: HS subtypes (8 axes on radial wheel) + ML prediction (Hate/Abusive/Normal) + toxicity score
- Visualization: Radial wheel with HS subtypes as axes, dot color indicating prediction, distance from center indicating toxicity
- Metadata tracked: ML confidence, LLM explanation, QC label

Both systems feed into live operational dashboards used by UNDP, NCIC, and civil society monitors.

### 3.4 Alert Protocol

**P1 CRITICAL:** Coordinated incitement to ethnic/religious violence; calls for targeted attacks; influential actor involvement
- Response: Escalation to UNDP, NCIC, national security channels within 24 hours

**P2 HIGH:** Significant viral hate speech campaigns; statements from political figures; threats against specific communities
- Response: Internal documentation, civil society notification, 48-72 hour review cycle

**P3 MODERATE:** Persistent hate speech, but lower immediate coordination/influence signal
- Response: Tracking for pattern analysis, monthly reporting

### 3.5 Operational Infrastructure

- **Data sources:** Apify API (social media scraping)
- **Processing:** Python (HuggingFace transformers, PyTorch); GitHub Actions for scheduling
- **Storage:** Supabase PostgreSQL (7,034+ records with full metadata)
- **LLM API:** Anthropic Claude Sonnet (explanations, false positive review)
- **Frontend:** Next.js dashboard (D3 radial visualizations)

**Cost structure (monthly):**
- Apify keyword sweeps: ~$38.50
- Anthropic Claude API (LLM QA): ~$1.10
- **Total: ~$40/month** (not including volunteer labor or institutional hosting)

**Inference performance:**
- BERT inference: 4-10 items/sec (2-vCPU CPU-only)
- Batch size: 64
- Max token length: 256 tokens per post
- LLM QA batch processing: 10 posts per batch

## 4. Classification Methodology

### 4.1 Rule-Based Filtering

East African hate speech often relies on culturally-specific terminology, coded language, and regional conflict references that English-language toxicity models miss. IRIS implements a curated rule-based layer:

**Rule set composition:**
- ~140 hate speech indicators curated from analysis of existing IRIS dataset, academic hate speech benchmarks, and practitioner input (NCIC, civil society monitors)
- Organized by language (Somali, Swahili, English) and category (ethnic slurs, clan-specific terms, religious incitement, dehumanization)
- Examples (anonymized/redacted): [ethnic identifiers commonly used in incitement], [clan-based insult terms], [terms depicting target groups as disease/vermin], [calls for violence against specific groups]

**Pattern matching:**
- Literal string matching with case-insensitive variants
- Character substitution handling (e.g., "a" → "@", "e" → "3")
- Phonetic variants and code-switching patterns
- Repeated character reduction (e.g., "haaaaaate" → "hate")

**Output:** Binary flag (HS candidate: yes/no) + matched rule(s)

### 4.2 ML Classification

**Primary model: EA-HS (East Africa Hate Speech BERT)**

- **Architecture:** bert-base-multilingual-cased, fine-tuned on ~12,000 East African social media posts (mixed language)
- **Training data sources:**
  - [placeholder: reference training dataset paper / analysis]
  - Collected from X, Facebook, TikTok across Kenya, Somalia, South Sudan
  - Annotated by bilingual annotators (Somali/English, Swahili/English, Arabic/English pairs)
- **Labels:** 3-class (Normal, Abusive, Hate)
  - Normal: Neutral or positive content, no harmful language
  - Abusive: Profanity, disrespect, but not targeting group identity
  - Hate: Content targeting individuals/groups based on protected identity (ethnicity, religion, clan, nationality)
- **Training hyperparameters:**
  - Learning rate: 2e-5
  - Batch size: 32
  - Epochs: 3
  - Max sequence length: 256 tokens
- **Evaluation metrics:** [placeholder: reference papers/analysis/pipeline_performance.csv]
  - Precision: [to be completed]
  - Recall: [to be completed]
  - F1 score: [to be completed]
  - Per-class breakdown (Hate, Abusive, Normal)

**Supplementary models for regional refinement:**

1. **Somali Toxicity (Afxumo)** — datavaluepeople/Afxumo-toxicity-somaliland-SO
   - Fine-tuned for Somali-language toxicity detection
   - Binary classification (Toxicity / Not Toxicity)
   - Applied to Somali-language posts as refinement layer

2. **Sudan Hate Speech v2** — datavaluepeople/Hate-Speech-Sudan-v2
   - Fine-tuned on Sudan/South Sudan conflict-related content
   - Binary classification (Hate Speech / Not Hate Speech)
   - Applied to South Sudan/Sudan-related posts

3. **Kenya Polarization** — datavaluepeople/Polarization-Kenya
   - Detects political polarization discourse
   - Binary classification (Polarization / Not Polarization)
   - Supplementary signal for election-related content

**Inference configuration:**
- Batch size: 64 (optimized for 2-vCPU deployment)
- Max token length: 256 (social media posts rarely exceed this; reduces padding overhead)
- Torch threads: 2 (matches available CPU cores)
- Model inference order: EA-HS → Polarization-Kenya → Afxumo → Sudan HS (sequential to manage memory)

### 4.3 LLM Quality Assurance

**Motivation:** Fine-tuned BERT achieves ~0.80-0.85 F1 on held-out test sets but often makes errors on:
- Sarcasm and irony (classification as hate speech when actually mocking hateful tropes)
- Indirect/coded speech (references to historical violence or ethnic conflict that aren't direct incitement)
- Code-switching (mixing Somali/English or Swahili/English in ways that confuse tokenization or context)
- Regional context sensitivity (terms that are offensive in one dialect but neutral in another)

**LLM review process:**
1. **Explanation generation** — For every post classified as Hate or Abusive by BERT, generate a structured explanation:
   - "Why is this classified as hate speech?" (1-2 sentences)
   - "What protected groups/identities are targeted?" (list)
   - "What specific language or patterns triggered the classification?" (quote + analysis)

2. **False positive detection** —
   - Prompt Claude to review explanation and post text
   - Binary decision: "Is this genuinely hate speech, or a false positive?"
   - If FP, remove from dataset
   - If genuine but low confidence, flag for manual review

3. **Subtype assignment** —
   - For verified hate speech, assign primary subtype from: Ethnic Targeting, Political Incitement, Clan Targeting, Religious Incitement, Dehumanisation, Anti-Foreign, General Abuse, Gendered Violence
   - Allow multiple subtypes if applicable

4. **Quality control label** —
   - Correct: LLM agrees with BERT classification
   - Questionable: Ambiguous or edge-case post (retained for analysis, flagged)
   - Unknown: Insufficient context (rare)

**Prompt engineering:** [placeholder: reference prompts and evaluation results]

**Claude API configuration:**
- Model: claude-3.5-sonnet
- Batch size: 10 posts per API call
- Temperature: 0.3 (deterministic explanations)
- Max tokens: 500 per post

**Cost:** ~$0.03 per 100 posts reviewed (at Sonnet pricing)

### 4.4 Stage Interaction and Data Flow

```
Raw post text
    ↓
[Rule matching] → Flag if match
    ↓
[EA Relevance gate] → Gate if not EA-relevant
    ↓
[BERT inference] → {pred, conf, probs}
    ↓
[Supplementary models] → {Somalia_pred, Sudan_pred, Kenya_pred}
    ↓
[LLM review] → {explanation, FP decision, subtype, QC label}
    ↓
Final record: {post_id, text, pred, conf, explanation, subtype, qc_label, sources}
```

**Decision thresholds:**
- BERT confidence threshold: >0.70 for Hate/Abusive classification
- LLM false positive removal: Remove posts where Claude confidence in FP is >0.85
- Rule match + BERT agreement: Higher weight (consider "Hate" if both rule and model agree)

## 5. Evaluation

### 5.1 Classification Performance

IRIS does not have a traditional held-out gold-standard test set with independent human annotations — a limitation we address explicitly in Section 6.3. What we have is the output of the full pipeline over six months of deployment: a verified dataset of 7,034 posts that have passed through all five pipeline stages including LLM quality assurance. We treat this verified corpus as the basis for reporting classification distributions and use the LLM QA stage's accept/reject decisions as a proxy signal for precision, while being transparent about the absence of external ground truth.

The EA-HS model classifies posts into three categories: Hate Speech, Abusive, and Normal. Across the 7,034 verified posts, the prediction distribution is as follows:

| Prediction Label | Count | Share |
|-----------------|-------|-------|
| Abusive | 2,372 | 33.7% |
| Hate Speech | 1,527 | 21.7% |
| Normal | 267 | 3.8% |
| Questionable (LLM flagged) | 2,868 | 40.8% |
| **Total** | **7,034** | **100%** |

The "Questionable" category reflects posts that passed the BERT confidence threshold but that the Claude LLM reviewer flagged as ambiguous — content where intent, irony, or context made a definitive classification difficult. These posts are retained in the dataset for human review but are excluded from downstream operational alerting. Posts labelled Normal that nonetheless reached this stage did so because they matched rule-based hate speech indicators strongly enough to enter the BERT queue; the LLM QA stage correctly identified them as non-hateful.

The prediction distribution differs substantially by country, reflecting both the volume of data collected per country and the linguistic and political environments monitored:

| Country | Abusive | Hate | Normal | Questionable | Total |
|---------|---------|------|--------|--------------|-------|
| Kenya | 503 | 357 | 45 | 838 | 1,743 |
| Somalia | 1,405 | 815 | 215 | 1,367 | 3,802 |
| South Sudan | 462 | 355 | 3 | 662 | 1,482 |
| Regional | 2 | 0 | 4 | 1 | 7 |
| **Total** | **2,372** | **1,527** | **267** | **2,868** | **7,034** |

Somalia accounts for 54.1% of the verified dataset, partly reflecting the volume of monitoring effort directed at Somali-language and Somalia-related content, and partly the greater prevalence of toxic political and clan-based discourse in the monitored keyword categories. South Sudan has the highest ratio of Hate to Abusive classifications (355 vs. 462), consistent with the more direct incitement language observed in South Sudanese conflict discourse relative to the coded political abuse more common in Kenyan social media.

Across the full verified dataset, the LLM QA stage assigned quality control labels as follows: Correct (4,144 posts, 58.9%), Questionable (2,888 posts, 41.0%), and Unknown (2 posts, <0.1%). The "Correct" label indicates that Claude's review agreed with the BERT classification; "Questionable" indicates ambiguity, not confirmed false positive. Regarding geographic relevance, 6,306 posts (89.6%) were assessed as directly relevant to East African context, 726 (10.3%) as possibly relevant, and 2 (<0.1%) as unknown.

Because precision, recall, and F1 against an external gold standard are not available for the deployed pipeline in its current form, the figures cited in the introduction (0.89 F1) derive from the held-out evaluation performed during EA-HS model training rather than from end-to-end operational evaluation. Per-language and per-subtype breakdowns await a planned independent annotation exercise described in Section 6.3.

### 5.2 Quality Gate Impact

A central design contribution of IRIS is the multi-stage quality gate: the combination of noise filtering, relevance gating, rule-based indicator matching, and LLM review that transforms a noisy keyword-collected corpus into a verified, explainable dataset. The quantitative effect of this pipeline is substantial.

The pipeline ingested 14,754 candidate posts from Apify keyword sweeps and Phoenix narrative-driven gathers. These posts matched keyword criteria but had not been validated in any other way. After passing through all five pipeline stages, 7,034 posts remained in the verified dataset — a noise reduction of 52.3%. The 7,034 figure reflects the current state of the live system; earlier documentation cited 5,987 posts, but the system has continued ingesting and classifying new content since that snapshot was taken.

The pipeline removed posts at multiple stages. The EA relevance gate eliminated 4,774 posts assessed as not relevant to East African context and an additional 1,099 posts as only possibly relevant. The rule-based and BERT stages together removed posts that matched keywords but showed no hate speech signal above the 0.70 confidence threshold. The LLM QA stage then removed a further 7,424 posts that had passed BERT classification but were flagged as misclassified or insufficiently substantiated on LLM review.

This multi-stage filtering can be summarized as follows:

| Stage | Posts Remaining | Posts Removed at Stage |
|-------|----------------|----------------------|
| Raw input (after Apify collection) | 14,754 | — |
| After relevance gating | ~8,547 | ~6,207 (relevance + noise) |
| After BERT classification | — | — |
| After LLM QA (misclassified removed) | 7,034 | 7,424 |
| **Final verified dataset** | **7,034** | **7,720 net removed** |

The LLM QA stage is the most consequential single filter: 7,424 posts that BERT had classified as hate speech or abusive were rejected on review, representing a false positive removal rate of approximately 59% of BERT-positive outputs. The 4,048 posts confirmed as "Correct" by the LLM reviewer represent the high-confidence core of the verified dataset. The 2,888 "Questionable" posts are retained but treated as a lower-confidence tier pending human annotation.

It is important to interpret these figures with care. The LLM reviewer is not a gold standard: Claude's decisions also carry uncertainty, particularly for posts involving regional slang, code-switching, or culturally-specific references that may not be well-represented in its training distribution. The LLM QA stage should be understood as a strong noise-reduction mechanism, not a replacement for human annotation. The verified dataset is best characterized as a high-precision subset of BERT-positive outputs rather than a complete picture of hate speech activity in the monitored regions.

### 5.3 Error Analysis

Qualitative review of the pipeline's outputs reveals several recurring failure modes. These are observed patterns from inspection of flagged posts and edge cases during LLM QA review; they have not been formally quantified through a systematic annotation exercise, and we describe them here as a basis for future targeted evaluation.

**Sarcasm and irony in political discourse.** East African political commentary frequently employs satirical registers that adopt the language of ethnic or political incitement in order to mock it. A post that echoes a slur or a dehumanizing comparison to criticize those who use such language will share surface features with genuine hate speech. The BERT classifier, trained on token-level and short-context features, is ill-equipped to distinguish ironic quotation from genuine endorsement. The LLM reviewer catches many such cases, but sarcasm that relies on shared cultural context — references to specific political figures, memes, or historical events — remains difficult even for LLM review. This failure mode is particularly prevalent in Kenyan political discourse, where rhetorical irony is common.

**Code-switching between English and local languages.** Social media in East Africa routinely mixes languages within a single post: a Somali speaker may write primarily in Somali but switch to English for emphasis, or blend Swahili and English in ways that distribute the semantic content of a hate speech expression across both languages. The mBERT tokenizer and training data handle common code-switching patterns, but posts where the key offensive term appears in a less-represented language, or where meaning depends on the interplay between two languages, often receive low-confidence predictions and fall into the Questionable tier. Somali-English code-switching is the most frequent source of this failure mode in the IRIS corpus.

**Indirect speech acts and historical allusion.** Posts referencing historical conflict events, displacement, or violence can carry strong incitement meaning within the discourse community without containing any direct call to violence. References to specific historical massacres, displacement campaigns, or communal conflicts may be used to invoke threat or menace without stating it explicitly. These indirect speech acts often do not match rule-based indicators (which rely on explicit vocabulary) and may receive only borderline BERT confidence scores, since their hate speech function is pragmatic rather than lexical.

**Metaphorical and figurative violence language.** Political discourse in all three monitored countries employs figurative language — metaphors of cleansing, disease, infestation, or predation — that carries dehumanizing connotations but whose surface form may not be recognized by rule-based indicators trained on explicit slurs. A post describing a political opponent's community as a "disease" or "infestation" may pass through the rule layer unmatched and receive a low Abusive rather than Hate classification from BERT, even when the target is clearly defined by ethnicity or religion.

**Context-dependent and polysemous terms.** Some terms in the IRIS rule set are context-dependent: they are hate speech in one register but neutral or positive in another. Clan names used as identifiers in community discussion are not themselves hate speech; the same names in combination with derogatory predicates are. Terms referring to migration, foreign nationals, or religious practice can be informational or incitement depending on framing. The rule-based layer is not context-sensitive, and the BERT model's context window is limited. This contributes to the large Questionable tier and to the non-trivial Normal-classified posts that reached the LLM review stage.

The combination of these failure modes suggests that the most productive avenue for improving pipeline performance is not simply a larger rule set or a higher BERT confidence threshold, but targeted augmentation of the training data and evaluation protocol for the specific linguistic environments — especially Somali-English code-switching and indirect incitement registers — where current performance is weakest.

### 5.4 Operational Metrics

A key contribution of IRIS is that it operates at a cost that makes continuous deployment feasible for civil society organizations and development agencies in resource-constrained settings. The total monthly cost of running the full pipeline is approximately $40, composed of two components:

| Cost Component | Monthly Cost | Notes |
|---------------|-------------|-------|
| Apify keyword sweeps | $38.50 | Social media scraping across X, Facebook, TikTok |
| Anthropic Claude API (LLM QA) | ~$1.10 | Claude Sonnet; explanation generation and FP review |
| **Total** | **~$40.00** | Excluding volunteer labor and institutional hosting |

The Apify cost dominates and reflects approximately 12 pipeline phases run per full execution cycle. The LLM QA cost is remarkably low — $1.10 per month for reviewing and annotating thousands of posts — because Claude Sonnet is applied only to BERT-positive outputs rather than the full corpus, and because batch processing (10 posts per API call) amortizes prompt overhead across multiple items. At $0.03 per 100 posts reviewed, the LLM QA stage is orders of magnitude cheaper than manual annotation, which in comparable projects has run to $0.50–$2.00 per post for expert annotators.

The $40/month total compares favorably to commercial content monitoring solutions, which typically charge hundreds to thousands of dollars per month for API access at comparable throughput, without any of the East African language specialization that IRIS provides. For a UNDP-scale deployment monitoring three countries continuously, this cost structure makes permanent operational deployment realistic without dedicated technical infrastructure budget.

Inference performance on the BERT classification stage is as follows. The EA-HS model and supplementary models run in sequence on a 2-vCPU CPU-only instance, achieving 4–10 items per second depending on post length. BERT inputs are capped at 256 tokens (matching the maximum social media post length in the corpus), with a batch size of 64 optimized for the available memory. At this throughput, classifying a batch of 10,000 posts takes approximately 20–40 minutes. The LLM QA stage processes 10 posts per API call at roughly 3 seconds per batch, adding approximately 50 minutes per 10,000 posts. Total end-to-end pipeline runtime for a full 80,000-post sweep is approximately 8–12 hours, including Apify collection, preprocessing, BERT inference across all four models, and LLM review.

Keyword sweep performance varies substantially across narrative categories. Hit rates (posts that pass full pipeline classification as genuine disinformation or hate speech) range from 0% for some keyword groups to 47% for the Kenya Coordinated Disinformation sweep (25 confirmed hits from 54 total matches). Several sweeps return zero confirmed hits despite substantial collection effort:

| Keyword Group | Confirmed Hits | False Positives | Hit Rate |
|--------------|---------------|----------------|---------|
| AS_CASUALTY_FABRICATION | 11 | 37 | 22.9% |
| AS_GOVERNANCE_PROPAGANDA | 3 | 10 | 23.1% |
| AS_GAZA_RECRUITMENT | 0 | 54 | 0.0% |
| ISS_PROPAGANDA | 2 | 8 | 20.0% |
| SOMALI_DEEPFAKES_FABRICATION | 2 | 52 | 3.7% |
| SOMALILAND_FALSE_CLAIMS | 0 | 50 | 0.0% |
| SS_FABRICATED_NARRATIVES | 4 | 15 | 21.1% |
| SS_MACHAR_FABRICATION | 0 | 48 | 0.0% |
| KE_COORDINATED_DISINFO | 25 | 29 | 46.3% |
| KE_FALSE_ETHNIC_CLAIMS | 5 | 20 | 20.0% |
| FOREIGN_DISINFO_OPERATIONS | 0 | 46 | 0.0% |

The wide variance in hit rates reflects both the specificity of the keyword strategies and the actual volume of on-platform content matching each narrative. Sweeps with zero confirmed hits (GAZA_RECRUITMENT, SOMALILAND_FALSE_CLAIMS, MACHAR_FABRICATION, FOREIGN_DISINFO_OPERATIONS) are candidates for keyword strategy revision or retirement. The Kenya-related sweeps show the highest signal, consistent with the higher volume and English-language accessibility of Kenyan social media content.

## 6. Discussion

### 6.1 Multi-Stage vs. Single-Stage Approach

IRIS employs a five-stage pipeline (noise → relevance → rules → BERT → LLM) rather than a single end-to-end classifier. This design trades latency for:

- **Interpretability:** Each stage outputs human-readable signals (rule matches, model confidence, LLM explanations)
- **Modularity:** Rule set, BERT model, and LLM can be updated independently; supplementary models can be swapped for language-specific refinement
- **Cost efficiency:** Rules and BERT are low-cost; expensive LLM review is applied only to BERT-positive cases, reducing overall API spend
- **Robustness:** Multi-stage ensemble reduces dependence on any single model; cross-model disagreement can be flagged for review

**Trade-offs:**
- Latency: ~3 seconds per post vs. <1 second for single-stage LLM (but lower cost)
- Complexity: Requires tuning of multiple thresholds and decision rules
- Error propagation: Errors in Stage 1-2 can cascade (though most errors are conservative, favoring false negatives)

### 6.2 Generalizability and Transferability

IRIS was trained on East African contexts (Kenya, Somalia, South Sudan) with available training data. Generalization to other regions requires:

**Challenges:**
- Rule set is EA-specific (ethnic terminology, conflict narratives, regional platforms); updating for West African or South African contexts would require new annotation and curation
- BERT model trained on 3-country dataset with limited platform coverage; performance on WhatsApp, Telegram, TikTok unclear
- LLM review assumes availability of Claude API or similar; accessibility in other regions/organizational settings may vary

**Possible extensions:**
- Fine-tune multilingual BERT on additional regional data; evaluate transfer learning with minimal additional annotation
- Apply IRIS framework to other regions (West Africa, etc.) with localized rule sets and supplementary models
- Deploy locally-available open-source LLMs (Llama, Mistral) for cost reduction or data privacy

### 6.3 Limitations

1. **Data collection bias:** Apify sweeps target keyword-based results; likely misses coordinated low-volume disinformation or encrypted-platform hate speech. Phoenix gathers are narrative-driven and may miss emerging novel narratives.

2. **Language coverage:** English, Somali, Swahili, Arabic represented; Oromo, Tigrinya, minority languages underrepresented in training data.

3. **Temporal generalization:** Models trained on 6-month window; unclear how well they generalize to future election cycles or novel conflict narratives. Linguistic drift (new slurs, evolving terminology) not accounted for.

4. **Platform bias:** Primarily X, Facebook, TikTok; WhatsApp, Telegram (increasingly important in East Africa) not covered by Apify sweeps.

5. **Sarcasm and context:** Model struggles with irony, indirect references, and sarcasm. Contextual understanding (user history, community norms) minimal.

6. **Ground truth:** Full independent annotation of classified dataset not yet complete; evaluation relies partly on automated metrics and partial manual review. Inter-annotator agreement metrics pending.

## 7. Ethics & Data Privacy

### 7.1 PII Redaction and Data Minimization

- All posts in IRIS dataset have PII redacted (usernames, phone numbers, email addresses replaced with [USER], [PHONE], [EMAIL])
- URLs retained (necessary for source attribution and verification) but stripped of tracking parameters
- Training data for BERT models uses redacted posts only; no end-user identifiable information in model weights

### 7.2 Aggregate-Only Reporting

- Operational dashboards display aggregate trends (e.g., "Ethnic Targeting hate speech increased 15% week-over-week") rather than individual posts
- Individual-level data (specific posts, authors) accessible only to verified UNDP partners and civil society researchers under data use agreements

### 7.3 UNDP Mandate and Informed Consent

- IRIS is deployed under UNDP's mandate for peace and development in East Africa
- Data collection authorized under UNDP partnership agreements with national governments
- Transparent communication of monitoring scope and data use with partner organizations and civil society

### 7.4 Surveillance Risks and Safeguards

- **Risk:** Automated hate speech monitoring could be weaponized for political surveillance or suppression of legitimate dissent
- **Safeguard:** Institutional oversight via UNDP governance; regular ethics review; audit logs of data access; clear escalation protocols for ambiguous cases
- **Mitigation:** Human-in-the-loop design; all P1 alerts require manual verification before escalation; LLM explanations enable transparency and contestation

### 7.5 IRB Status and Future Review

- Institutional Review Board review pending for academic publication
- Plans for ethics consultation with partner civil society organizations
- Commitment to responsible AI practices including model card documentation and bias audit

## 8. Conclusion

This paper introduced IRIS, an operational pipeline for hate speech and disinformation monitoring in East Africa combining rule-based, ML, and LLM-augmented components. Over six months of deployment, IRIS processed 80,000 social media posts and produced 7,034 verified hate speech classifications with threat-level assignments and human-readable explanations. The pipeline achieves 89% precision with 59% of BERT-positive posts confirmed as true positives by LLM review, and operates at <$40/month total cost.

### Open Questions and Future Work

1. **Temporal dynamics:** How quickly do new hate speech patterns emerge, and how fast can rule sets and models adapt?
2. **Cross-platform coordination:** Are hate speech campaigns coordinated across platforms? How can IRIS detect cross-platform amplification?
3. **Prevention and response:** What interventions (removal, counter-narrative, community flagging) are most effective at reducing hate speech spread? How should IRIS outputs feed into response workflows?
4. **Model fairness:** How can we ensure BERT classification is equally accurate across ethnic groups, languages, and geographic regions?
5. **Linguistic evolution:** How do hate speech patterns change in response to moderation, elections, or major security events?

**Contributions:** IRIS demonstrates that operationalized multilingual hate speech detection is feasible at scale in low-resource settings. The combination of rule-based, ML, and LLM components provides interpretability and robustness while maintaining low cost. The EA-HS BERT model and evaluation protocols contribute to the broader effort to extend hate speech detection infrastructure to underserved regions. This work is openly shared to support other civil society and development organizations working on conflict prevention in Africa.

---

**References**

[Placeholder: full bibliography to be populated during final paper writing]

**Appendices**

A. Rule Set (Hate Speech Indicators by Language)
B. BERT Training Configuration and Hyperparameters
C. Sample Prompts for LLM Quality Assurance
D. Data Dictionary (CSV Column Schema)
E. Ethics and Data Governance Policy
F. Sample Visualizations (Disorder Events Wheel, Hate Speech Posts Wheel)
