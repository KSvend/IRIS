# IRIS ML Models - HuggingFace Availability Report

**Generated:** 2026-03-30
**Status:** All 4 models are publicly accessible and actively maintained

---

## Executive Summary

All IRIS ML models are available on HuggingFace Hub with Apache/AGPL licenses and comprehensive metadata. Models are actively maintained with recent updates (Dec 2025 - Feb 2026). The models support multiple African languages and use modern transformer architectures (BERT, XLM-RoBERTa).

---

## Model Details

### 1. KSvendsen/EA-HS (Primary Hate Speech Model)

**Status:** ✅ Publicly Accessible

#### Overview
- **Author:** KSvendsen
- **Task:** Text classification (hate speech detection)
- **Architecture:** XLM-RoBERTa (278M parameters)
- **Last Updated:** 20 Feb, 2026
- **Downloads:** 254
- **HuggingFace Link:** https://hf.co/KSvendsen/EA-HS

#### Technical Details
- **Model Class:** AutoModelForSequenceClassification
- **Base Model:** afro-xlmr (XLM-RoBERTa-based)
- **License:** Apache 2.0

#### Supported Languages
- Swahili (sw), Somali (so), Amharic (am), Oromo (om), Tigrinya (ti), Kinyarwanda (rw), Nigerian Pidgin (pcm), Arabic (ar), English (en)

#### Training Datasets
- **AfriHate** — African hate speech corpus
- **HateVal** — Multilingual hate speech evaluation dataset
- **HateExplain** — Explainable hate speech annotations

#### Documentation
- Includes model card with training data information
- Tagged with multiple relevant keywords (peacebuilding, African languages, East Africa)
- Model index available for proper citation

---

### 2. datavaluepeople/Polarization-Kenya

**Status:** ✅ Publicly Accessible

#### Overview
- **Author:** datavaluepeople
- **Task:** Text classification (polarization detection)
- **Architecture:** BERT-multilingual-cased (167.4M parameters)
- **Last Updated:** 15 Dec, 2025
- **Downloads:** 177
- **HuggingFace Link:** https://hf.co/datavaluepeople/Polarization-Kenya

#### Technical Details
- **Model Class:** AutoModelForSequenceClassification
- **Base Model:** google-bert/bert-base-multilingual-cased (fine-tuned)
- **License:** AGPL-3.0
- **Framework:** Transformers with SafeTensors format

#### Supported Languages
- Swahili (sw), English (en)

#### Deployment
- Compatible with Text Embeddings Inference (TEI)
- Hugging Face Endpoints compatible

#### Additional Context
- Part of **ACFP** (Automatic Classifiers for Peace) initiative
- References arxiv:1910.09700

---

### 3. datavaluepeople/Afxumo-toxicity-somaliland-SO

**Status:** ✅ Publicly Accessible

#### Overview
- **Author:** datavaluepeople
- **Task:** Text classification (toxicity detection)
- **Architecture:** XLM-RoBERTa (278M parameters)
- **Last Updated:** 21 Aug, 2025
- **Downloads:** 368 (highest of all models)
- **HuggingFace Link:** https://hf.co/datavaluepeople/Afxumo-toxicity-somaliland-SO

#### Technical Details
- **Model Class:** AutoModelForSequenceClassification
- **Base Model:** Davlan/xlm-roberta-base-finetuned-somali (fine-tuned)
- **License:** AGPL-3.0
- **Framework:** Transformers with SafeTensors format

#### Supported Languages
- Somali (so)

#### Deployment
- Compatible with Text Embeddings Inference (TEI)
- Hugging Face Endpoints compatible
- Higher download count indicates active use

#### Additional Context
- **Afxumo** initiative for Somalia/Somaliland
- Part of ACFP (Automatic Classifiers for Peace)
- Somali-optimized fine-tuning

---

### 4. datavaluepeople/Hate-Speech-Sudan-v2

**Status:** ✅ Publicly Accessible

#### Overview
- **Author:** datavaluepeople
- **Task:** Text classification (hate speech detection)
- **Architecture:** BERT (167.4M parameters)
- **Last Updated:** 5 Jan, 2026
- **Downloads:** 165
- **HuggingFace Link:** https://hf.co/datavaluepeople/Hate-Speech-Sudan-v2

#### Technical Details
- **Model Class:** AutoModelForSequenceClassification
- **License:** Not explicitly specified (likely open)
- **Framework:** Transformers with SafeTensors format

#### Deployment
- Compatible with Text Embeddings Inference (TEI)
- Hugging Face Endpoints compatible

#### Additional Context
- Version 2 indicates iteration/improvements over initial release
- Represents Sudan-specific hate speech detection

---

## Cross-Model Analysis

### Architecture Distribution
| Architecture | Count | Models |
|---|---|---|
| XLM-RoBERTa | 2 | EA-HS, Afxumo-toxicity-somaliland-SO |
| BERT-multilingual | 2 | Polarization-Kenya, Hate-Speech-Sudan-v2 |

### License Distribution
| License | Count | Models |
|---|---|---|
| Apache 2.0 | 1 | EA-HS |
| AGPL-3.0 | 2 | Polarization-Kenya, Afxumo-toxicity-somaliland-SO |
| Not specified | 1 | Hate-Speech-Sudan-v2 |

### Geographic Coverage
- **East Africa:** Kenya (Polarization), Somalia/Somaliland (Toxicity), Sudan (Hate Speech)
- **Multi-regional:** EA-HS (9 languages across Africa)

### Download Metrics (as of Mar 30, 2026)
1. **Afxumo-toxicity-somaliland-SO:** 368 downloads (highest adoption)
2. **EA-HS:** 254 downloads
3. **Polarization-Kenya:** 177 downloads
4. **Hate-Speech-Sudan-v2:** 165 downloads (lowest adoption)

---

## Key Findings

### Strengths
1. **All models are publicly accessible** — no authentication barriers
2. **Recent maintenance** — all updated within last 5 months (Aug 2025 - Feb 2026)
3. **Multiple architectures** — BERT and XLM-RoBERTa provide different trade-offs
4. **Language coverage** — Support for Swahili, Somali, Arabic, and other African languages
5. **Enterprise-ready** — TEI/Endpoints compatible for production deployment
6. **License clarity** — Mostly Apache/AGPL for open use (except Sudan-v2)
7. **Proper documentation** — Model cards, dataset references, and metadata included

### Considerations
1. **License variation** — Mixed licensing (Apache, AGPL, unspecified) may affect usage
2. **Sudan-v2 metadata** — Minimal documentation compared to other models
3. **AGPL restrictions** — Polarization-Kenya and Afxumo-toxicity use AGPL, requiring derivative disclosure
4. **Download adoption** — Varying adoption levels suggest different maturity/use-cases

---

## Recommendations

1. **For commercial use:** Verify AGPL-3.0 implications for Polarization-Kenya and Afxumo-toxicity-somaliland-SO
2. **For Sudan-v2:** Request clarified licensing from datavaluepeople
3. **Production deployment:** All models support HuggingFace Endpoints for scalable inference
4. **Model selection:**
   - **Multilingual/broad coverage:** Use EA-HS (Apache license, 9 languages)
   - **Somali-specific:** Use Afxumo-toxicity-somaliland-SO (highest adoption, Somali-optimized)
   - **Kenya-specific:** Use Polarization-Kenya (Swahili/English)
   - **Sudan-specific:** Use Hate-Speech-Sudan-v2 (latest update Jan 2026)

---

## References

- HuggingFace Hub: https://huggingface.co
- ACFP (Automatic Classifiers for Peace): Community initiative for African peace and safety
- Paper reference: arxiv:1910.09700 (for BERT-based models)
