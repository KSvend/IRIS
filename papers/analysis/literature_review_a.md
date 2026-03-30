# Literature Review: Paper A — IRIS Hate Speech Monitoring Pipeline

Structured reference list supporting the methodology/systems paper describing the IRIS multilingual hate speech detection and monitoring pipeline operating across Horn of Africa and Sudan contexts.

---

## 2.1 Hate Speech Detection

### [Davidson et al. (2017)] — Automated Hate Speech Detection and the Problem of Offensive Language

- **Citation:** Davidson, T., Warmsley, D., Macy, M., & Weber, I. (2017). Automated Hate Speech Detection and the Problem of Offensive Language. *Proceedings of the 11th International AAAI Conference on Web and Social Media (ICWSM '17)*, Montreal, Canada, pp. 512–515. arXiv:1703.04009.
- **Key finding:** Trained a classifier on ~25k crowd-annotated tweets using a three-class schema (hate speech / offensive but not hate / neither). Found that the majority of content flagged by a lexicon-based approach was merely offensive language, not hate speech, and that the classifier frequently conflated the two — especially when tweets included slurs used in-group or in reclaimed contexts.
- **Relevance to IRIS:** The hate/offensive disambiguation problem is directly relevant to IRIS's tiered severity scoring. Davidson's dataset and confusion matrix serve as a benchmark comparison for our pipeline's precision/recall tradeoffs.
- **Gap we fill:** Davidson's model is English-only, trained on US Twitter, and does not account for code-switching, dialect variation, or conflict-specific political speech. IRIS operates across Swahili, Somali, and Sudanese Arabic with domain-specific ontologies.

---

### [Waseem & Hovy (2016)] — Hateful Symbols or Hateful People? Predictive Features for Hate Speech Detection on Twitter

- **Citation:** Waseem, Z., & Hovy, D. (2016). Hateful Symbols or Hateful People? Predictive Features for Hate Speech Detection on Twitter. *Proceedings of the NAACL Student Research Workshop*, San Diego, California, pp. 88–93. DOI: 10.18653/v1/N16-2013.
- **Key finding:** Annotated 16,914 tweets for racism and sexism using criteria grounded in critical race theory. Found that character n-grams and author-level features (e.g., user history, location) significantly outperform bag-of-words approaches, and that inter-annotator agreement was higher when annotators shared relevant social context.
- **Relevance to IRIS:** The annotation methodology (criteria grounded in lived social context) informs our approach to building hate speech lexicons with local annotators in East Africa and Sudan. The observation that author context matters is reflected in IRIS's account-level risk signals.
- **Gap we fill:** The dataset is limited to English and covers only racism/sexism. IRIS extends multi-class annotation to ethnicity, religion, and political incitement categories across three distinct conflict contexts.

---

### [Fortuna & Nunes (2018)] — A Survey on Automatic Detection of Hate Speech in Text

- **Citation:** Fortuna, P., & Nunes, S. (2018). A Survey on Automatic Detection of Hate Speech in Text. *ACM Computing Surveys (CSUR)*, 51(4), Article 85, 1–30. DOI: 10.1145/3232676.
- **Key finding:** Synthesised approaches from 2010–2018 showing that most hate speech detection relied on SVM and logistic regression over lexical features, with deep learning emerging only at the end of the period. Identified key challenges: inconsistent definitions across datasets, label imbalance, and poor cross-dataset generalisation.
- **Relevance to IRIS:** Provides the canonical taxonomy of hate speech categories (targeted identity, dehumanisation, calls to action) that frames our ontology design. The survey's documentation of cross-dataset degradation motivates IRIS's context-specific fine-tuning strategy.
- **Gap we fill:** Survey coverage is essentially English-language; no African-language systems appear. IRIS is among the first operational pipelines addressing hate speech for Swahili, Somali, and Sudanese Arabic simultaneously.

---

### [AfriHate (Muhammad et al., 2025)] — AfriHate: A Multilingual Collection of Hate Speech and Abusive Language Datasets for African Languages

- **Citation:** Muhammad, S. H., et al. (2025). AfriHate: A Multilingual Collection of Hate Speech and Abusive Language Datasets for African Languages. arXiv:2501.08284.
- **Key finding:** Presents annotated hate speech and abusive language datasets in 15 African languages (including Somali, Amharic, Kinyarwanda), collected from Twitter 2012–2023. Each instance was annotated by native speakers. Reports baseline classification results with and without LLM augmentation. Highlights that high-profile targets receive more moderation attention while large campaigns against minorities are missed.
- **Relevance to IRIS:** The most directly comparable resource to IRIS's annotation approach. AfriHate's findings on annotation quality with native speakers validate IRIS's annotation protocol. The Somali subset is a direct reference point for our Somali model evaluation.
- **Gap we fill:** AfriHate is a research dataset without an operational monitoring deployment. IRIS integrates similar language coverage into a real-time pipeline linked to conflict event data and escalation alerting.

---

## 2.2 Multilingual / Low-Resource NLP for Africa

### [Muhammad et al. (2023)] — SemEval-2023 Task 12: Sentiment Analysis for African Languages (AfriSenti-SemEval)

- **Citation:** Muhammad, S. H., Abdulmumin, I., Yimam, S. M., Adelani, D. I., Ahmad, I. S., Ousidhoum, N., Ayele, A., Mohammad, S. M., Beloucif, M., & Ruder, S. (2023). SemEval-2023 Task 12: Sentiment Analysis for African Languages (AfriSenti-SemEval). *Proceedings of the 17th International Workshop on Semantic Evaluation (SemEval-2023)*, Association for Computational Linguistics. arXiv:2304.06845.
- **Key finding:** First Africentric SemEval shared task, covering sentiment classification in 14 African languages with three subtasks (monolingual, multilingual, zero-shot). Attracted 44 monolingual and 32 multilingual system submissions. Demonstrated that multilingual transfer from related language families significantly outperforms English-only transfer for African languages.
- **Relevance to IRIS:** AfriSenti establishes the state of the art for sentiment and subjectivity in African languages, directly informing IRIS's choice of backbone models (AfriBERTa, AfroXLMR) and zero-shot transfer strategy for languages with minimal IRIS-collected training data.
- **Gap we fill:** Sentiment is a weaker signal than hate speech/incitement; IRIS adds conflict-specific labelling categories beyond positive/negative/neutral.

---

### [Adelani et al. (2021)] — MasakhaNER: Named Entity Recognition for African Languages

- **Citation:** Adelani, D. I., et al. (2021). MasakhaNER: Named Entity Recognition for African Languages. *Transactions of the Association for Computational Linguistics*, 9, 1116–1131. DOI: 10.1162/tacl_a_00416. arXiv:2103.11811.
- **Key finding:** First large publicly available NER dataset across 10 African languages, built by the Masakhane community. Evaluated supervised and transfer learning settings; found that cross-lingual transfer from multilingual models (mBERT, XLM-R) provides a strong starting point but language-specific fine-tuning yields consistent gains.
- **Relevance to IRIS:** IRIS uses NER to identify targeted groups, locations, and named actors in flagged content. MasakhaNER's methodology for community-driven annotation and its finding that XLM-R transfer is viable for under-resourced African languages directly shapes our NER module design.
- **Gap we fill:** MasakhaNER does not cover Somali or Sudanese Arabic; IRIS incorporates entity extraction for those languages through targeted annotation campaigns.

---

### [Orife et al. (2020)] — Masakhane: Machine Translation for Africa

- **Citation:** Orife, I., Kreutzer, J., Sibanda, B., Whitenack, D., Siminyu, K., Martinus, L., et al. (2020). Masakhane — Machine Translation for Africa. arXiv:2003.11529. Presented at the AfricaNLP Workshop, ICLR 2020.
- **Key finding:** Documents the Masakhane community's participatory research approach to building MT systems for 38+ African languages. Demonstrates that collaborative, community-embedded research can produce usable models even for extremely low-resource settings, and establishes open benchmarks for African NLP.
- **Relevance to IRIS:** Masakhane's participatory model is an explicit precedent for how IRIS engages local language experts and community annotators in Somalia, Kenya, and Sudan, rather than outsourcing annotation to non-native speakers.
- **Gap we fill:** Masakhane focuses on MT; IRIS extends the participatory approach to hate speech annotation and monitoring in conflict-sensitive contexts.

---

### [Swahili Hate Speech — Dataset (2022–2025)]

- **Citation:** Swahili and Code-Switched English-Swahili Political Hate Speech Detection Textual Dataset. *Data Intelligence (DI)*, 2025. DOI: 10.3724/2096-7004.di.2025.0053. (Dataset collected October 2021 – September 2022.)
- **Key finding:** One of the first annotated datasets specifically for political hate speech in Swahili and English-Swahili code-switching, covering hate targets including ethnicity, religion, politics, nationality, and disability. SVM with TF-IDF achieved ~82.5% accuracy on the binary task.
- **Relevance to IRIS:** Directly relevant as a comparison resource for our Swahili and code-switched content detection. IRIS's Kenyan/East African stream encounters very similar code-switching patterns.
- **Gap we fill:** The dataset is relatively small; IRIS accumulates a significantly larger operational corpus with continuous annotation refresh and integrates conflict event ground truth for downstream validation.

---

## 2.3 Toxicity APIs and Commercial Tools

### [Lees et al. (2022)] — A New Generation of Perspective API: Efficient Multilingual Character-level Transformers

- **Citation:** Lees, A., Tran, V. Q., Tay, Y., Sorensen, J., Gupta, J., Metzler, D., & Vasserman, L. (2022). A New Generation of Perspective API: Efficient Multilingual Character-level Transformers. *Proceedings of the 28th ACM SIGKDD Conference on Knowledge Discovery and Data Mining (KDD '22)*, Washington, DC, USA. DOI: 10.1145/3534678.3539147. arXiv:2202.11176.
- **Key finding:** Describes the Charformer-based multilingual model powering the current Perspective API. Token-free character-level model improves robustness to obfuscation (e.g., "h4te"), code-switching, and transliteration. Evaluated on multilingual toxicity benchmarks derived from real API traffic.
- **Relevance to IRIS:** IRIS uses Perspective API as one signal in its ensemble. Understanding its architecture helps explain systematic false negatives on Somali and Sudanese Arabic, since those languages are not in Perspective's supported language list. This paper is the technical reference for Perspective API behaviour.
- **Gap we fill:** Perspective's supported language list excludes Somali and most Sudanese Arabic dialects. IRIS builds language-specific models for these gaps rather than relying on cross-lingual transfer from the Charformer.

---

### [Jigsaw / Google] — Perspective API: Attributes and Languages (Technical Documentation)

- **Citation:** Jigsaw & Google Counter Abuse Technology. (2017–present). Perspective API. Retrieved from https://www.perspectiveapi.com/. Attribute and language documentation: https://developers.perspectiveapi.com/s/about-the-api-attributes-and-languages.
- **Key finding:** Perspective API classifies text along six dimensions (toxicity, severe toxicity, insult, profanity, identity attack, threat) using models trained primarily on English Wikipedia comments and New York Times comment data. English accuracy is ~80–85%; performance degrades materially for low-resource and non-Latin-script languages.
- **Relevance to IRIS:** IRIS incorporates Perspective scores as a baseline feature for English-language content but explicitly avoids applying them to Swahili, Somali, and Arabic text due to documented degradation. The API's bias toward penalising identity-group mentions is a documented concern for conflict-context monitoring where group references are substantively meaningful.
- **Gap we fill:** IRIS replaces Perspective's role for non-English content with language-specific classifiers, and supplements its toxicity score with conflict-specific severity dimensions absent from the Perspective schema.

---

### [Röttger et al. / Bias Studies] — Perspective API Bias and Non-English Limitations

- **Citation:** See: (a) Toxic Bias: Perspective API Misreads German as More Toxic. arXiv:2312.12651 (2023). (b) Sap, M., Card, D., Gabriel, S., Choi, Y., & Smith, N. A. (2019). The Risk of Racial Bias in Hate Speech Detection. *ACL 2019*, pp. 1668–1678.
- **Key finding:** Cross-language studies show Perspective API assigns systematically higher toxicity scores to non-English text, and within English, to African American Vernacular English (AAVE). Identity group mentions inflate scores regardless of sentiment direction. On average, four times as many German-language tweets would be moderated versus English equivalents of identical content.
- **Relevance to IRIS:** Directly motivates IRIS's design decision not to pass Somali or Arabic content through Perspective. Also informs IRIS's annotation guidelines, which instruct annotators to distinguish identity group mentions in context from dehumanising uses.
- **Gap we fill:** IRIS provides calibrated, language-specific classifiers that do not inherit the cross-lingual toxicity inflation documented here.

---

### [OpenAI] — OpenAI Moderation API (Technical Documentation)

- **Citation:** OpenAI. (2022–present). Moderation API. Platform documentation: https://platform.openai.com/docs/api-reference/moderations. Model: omni-moderation-2024-09-26.
- **Key finding:** Free endpoint classifying content into categories (hate, hate/threatening, harassment, self-harm, sexual, violence). The omni-moderation model accepts text and images. Trained primarily on English content; category definitions follow US platform policy norms and may not transfer to political speech in African conflict contexts.
- **Relevance to IRIS:** IRIS evaluates OpenAI moderation output as a comparison signal for English-language content. Its category taxonomy (particularly the hate vs. hate/threatening split) is one reference point for IRIS's own tiered severity schema.
- **Gap we fill:** Like Perspective, OpenAI moderation has no documented performance on Swahili, Somali, or Sudanese Arabic. IRIS documents comparative performance across APIs and our custom models on a shared evaluation set.

---

## 2.4 Conflict Monitoring and Early Warning

### [Raleigh et al. (2010)] — Introducing ACLED: An Armed Conflict Location and Event Dataset

- **Citation:** Raleigh, C., Linke, A., Hegre, H., & Karlsen, J. (2010). Introducing ACLED: An Armed Conflict Location and Event Dataset. *Journal of Peace Research*, 47(5), 651–660. DOI: 10.1177/0022343310378914.
- **Key finding:** Foundational paper establishing ACLED's methodology for coding political violence events (battles, civilian targeting, riots, remote violence) at the subnational level with actor, date, and location precision. Demonstrates that conflict is spatially concentrated and that disaggregated event data reveals dynamics invisible in country-level indices.
- **Relevance to IRIS:** ACLED event data is IRIS's primary ground-truth source for conflict escalation. We use ACLED coded events in Somalia, Sudan, Ethiopia, and Kenya to (a) train escalation prediction models and (b) validate whether spikes in IRIS-detected hate speech temporally precede ACLED-coded violence events.
- **Gap we fill:** ACLED codes documented violence events after the fact; IRIS aims to provide leading indicators from social media discourse before events are coded.

---

### [PeaceTech Lab] — Hate Speech Lexicons and South Sudan Monitoring Reports

- **Citation:** PeaceTech Lab. (2016–2020). Hate Speech Monitoring Reports: South Sudan (biweekly series). Washington, DC: PeaceTech Lab. See also: Hate Speech Lexicons for Nigeria, South Sudan, Cameroon, Kenya, South Africa (published 2016–2020). Available at: https://www.peacetechlab.org/.
- **Key finding:** PeaceTech Lab developed locally-sourced hate speech lexicons in five African countries and produced biweekly monitoring reports on the relationship between online hate speech and ground-level violence in South Sudan (2016). Showed that tracking online hate speech vocabulary over time correlates with reported violence incidents.
- **Relevance to IRIS:** PeaceTech Lab's South Sudan lexicon work and monitoring methodology is the closest operational precedent to IRIS. Their experience with local lexicon development and biweekly reporting cycles directly informed IRIS's annotation and reporting cadence design. Kenya lexicon overlaps with IRIS's Swahili monitoring scope.
- **Gap we fill:** PeaceTech Lab's monitoring was largely manual/lexicon-based without ML classification. IRIS automates this using transformer-based classification with human-in-the-loop review, enabling real-time scale across multiple simultaneous country contexts.

---

### [Imran et al. (2016)] — Twitter as a Lifeline: Human-Annotated Twitter Corpora for NLP of Crisis-related Messages

- **Citation:** Imran, M., Mitra, P., & Castillo, C. (2016). Twitter as a Lifeline: Human-annotated Twitter Corpora for NLP of Crisis-related Messages. *Proceedings of the 10th Language Resources and Evaluation Conference (LREC 2016)*, Portorož, Slovenia, pp. 1638–1643. arXiv:1605.05894.
- **Key finding:** Introduces CrisisNLP — annotated Twitter corpora from 19 crises (2013–2015), totalling ~53 million tweets with ~50,000 human-annotated for nine information types (needs, damage, etc.). Provides word2vec embeddings trained on crisis-specific language.
- **Relevance to IRIS:** CrisisNLP is the canonical resource for crisis-domain NLP and provides the methodological template for IRIS's data collection protocol during acute conflict phases. The finding that crisis language has distinct distributional properties that general-domain embeddings fail to capture supports IRIS's use of domain-adapted language models.
- **Gap we fill:** CrisisNLP focuses on humanitarian information extraction (needs, damage reports) from natural disasters, not on detecting hate speech or incitement in political violence contexts. IRIS addresses this gap for ongoing armed conflicts.

---

### [The Sentinel Project] — Early Warning System for Genocide Prevention

- **Citation:** The Sentinel Project for Genocide Prevention. (2008–present). Early Warning System: Operational Process and Stages of Genocide Model. Toronto: The Sentinel Project. Available at: https://thesentinelproject.org/what-we-do/early-warning-system/.
- **Key finding:** Describes a four-phase early warning methodology (risk assessment, operational monitoring, vulnerability assessment, forecasting) grounded in Gregory Stanton's Stages of Genocide framework. Emphasises localised, subnational monitoring and community-embedded information networks over country-level indices.
- **Relevance to IRIS:** The Sentinel Project's Stages of Genocide model (particularly the dehumanisation and symbolisation stages) provides a theoretical grounding for IRIS's severity tiers. The emphasis on subnational granularity aligns with IRIS's county/region-level reporting.
- **Gap we fill:** The Sentinel Project's early warning is primarily qualitative analyst-driven; IRIS automates the detection layer while preserving the human analyst review function for high-severity alerts.

---

### [UNDP] — iVerify: AI-Powered Fact-Checking for Election Integrity

- **Citation:** UNDP Chief Digital Office. (2021–present). iVerify: Combating Misinformation and Strengthening Information Integrity. United Nations Development Programme. Available at: https://www.undp.org/digital/iverify.
- **Key finding:** iVerify combines AI/ML with human fact-checking to detect false narratives during election periods. Deployed in Zambia, Liberia, Sierra Leone, DRC, Nigeria, and Madagascar. Recognised as a Digital Public Good. Focuses on misinformation/disinformation rather than hate speech per se, but the dual AI-human architecture and African deployment contexts are directly comparable.
- **Relevance to IRIS:** iVerify represents the UN/development community's approach to AI-assisted content monitoring in African electoral contexts. Its architecture (AI triage + human verification) mirrors IRIS's human-in-the-loop design. IRIS's work in Sudan and Somalia addresses conflict-phase contexts that iVerify's electoral focus does not cover.
- **Gap we fill:** iVerify is election-specific and focuses on factual accuracy; IRIS addresses ongoing conflict contexts and hate speech/incitement, which persist between electoral cycles.

---

## 2.5 LLM-Augmented Classification

### [Gilardi, Alizadeh & Kubli (2023)] — ChatGPT Outperforms Crowd-Workers for Text-Annotation Tasks

- **Citation:** Gilardi, F., Alizadeh, M., & Kubli, M. (2023). ChatGPT Outperforms Crowd-Workers for Text-Annotation Tasks. *Proceedings of the National Academy of Sciences*, 120(30), e2305016120. DOI: 10.1073/pnas.2305016120. arXiv:2303.15056.
- **Key finding:** Using 2,382 tweets across five annotation tasks (relevance, stance, topic, frame, persuasion), ChatGPT zero-shot accuracy exceeded that of MTurk crowd-workers for four out of five tasks. Cost per annotation with ChatGPT was ~$0.003, approximately 20x cheaper than MTurk. Intercoder agreement with ChatGPT exceeded both crowd-workers and trained annotators for all tasks.
- **Relevance to IRIS:** Directly motivates IRIS's use of LLM-assisted annotation to bootstrap training data for low-resource languages where native annotator recruitment is constrained. The cost and agreement findings support our hybrid annotation protocol (LLM first-pass, native speaker review).
- **Gap we fill:** Gilardi et al. work in English on general political science tasks. IRIS tests whether these findings hold for low-resource African languages and for the specialist domain of conflict-related hate speech.

---

### [He et al. / ACL Findings (2024)] — Data Augmentation Using LLMs: Data Perspectives, Learning Paradigms, and Challenges

- **Citation:** He, X., Lin, Z., Gong, Y., Jin, H., Han, T., Zhao, B., Gu, Q., Shou, L., Duan, N., & Chen, W. (2024). Data Augmentation Using LLMs: Data Perspectives, Learning Paradigms, and Challenges. *Findings of the Association for Computational Linguistics: ACL 2024*, pp. 97. DOI: 10.18653/v1/2024.findings-acl.97.
- **Key finding:** Comprehensive survey of LLM-based data augmentation across NLP tasks. Finds that GPT-4-augmented data improves model performance for low-resource settings, while GPT-3.5 augmentation can harm performance in some classification tasks. Recommends hybrid approaches combining LLM-generated and human-labelled examples.
- **Relevance to IRIS:** Informs IRIS's decision to use GPT-4 (not 3.5) for synthetic data generation for Somali and Sudanese Arabic where annotated examples are scarce, and to always combine with a validated human-annotated seed set.
- **Gap we fill:** IRIS evaluates LLM augmentation specifically for hate speech in conflict-context African languages, a setting absent from this survey.

---

### [Harnessing AI for Online Hate (2024)] — LLMs for Hate Speech Detection

- **Citation:** Huang, X., et al. (2024). Harnessing Artificial Intelligence to Combat Online Hate: Exploring the Challenges and Opportunities of Large Language Models in Hate Speech Detection. arXiv:2403.08035.
- **Key finding:** Benchmarks GPT-3.5, Llama-2, and Mistral on hate speech detection. GPT-3.5 achieves 80–90% F1 via RLHF-tuned reasoning; open models are competitive when fine-tuned. Zero-shot LLM performance still trails fine-tuned encoder models on recall-critical tasks.
- **Relevance to IRIS:** IRIS uses a similar ensemble approach (fine-tuned encoder as primary classifier, LLM as QA/review layer for borderline cases). This paper's finding that fine-tuned encoders retain recall advantages supports IRIS's architecture choice.
- **Gap we fill:** Benchmarks focus on English hate speech datasets (HateXplain, ETHOS). IRIS extends this evaluation to multilingual African-language settings.

---

### [Investigating Annotator Bias in LLMs (2024)] — LLMs as Hate Speech Annotators

- **Citation:** Rottger, P., et al. (2024). Investigating Annotator Bias in Large Language Models for Hate Speech Detection. arXiv:2406.11109.
- **Key finding:** LLMs used as annotators replicate demographic biases present in their training data, including over-flagging content mentioning marginalised identity groups. GPT-3 annotation reduces labelling costs by up to 96%, but introduces systematic biases that compound if not corrected with human review.
- **Relevance to IRIS:** Directly informs IRIS's human-in-the-loop design: LLMs are used for triage and draft labelling only; final labels for borderline and identity-group-mentioning content are validated by trained human reviewers with relevant cultural context.
- **Gap we fill:** Study is conducted on English datasets. IRIS documents whether LLM annotator bias is amplified or attenuated when applied to African-language content where the LLM's training coverage is sparse.

---

*Last updated: 2026-03-30. Compiled to support Paper A: "IRIS: A Multilingual Hate Speech Monitoring Pipeline for Conflict-Affected Contexts in the Horn of Africa and Sudan."*
