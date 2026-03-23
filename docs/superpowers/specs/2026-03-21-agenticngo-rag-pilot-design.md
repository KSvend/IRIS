# AgenticNGO RAG-Augmented Conversational Intelligence — Pilot Design

**Date:** 2026-03-21
**Status:** Draft
**Author:** MERLx / Conflict Management Consulting

---

## 1. Overview

Add a RAG-augmented knowledge base and conversational chat interface to the existing MERLx IRIS dashboard, enabling analysts to query a continuously growing corpus of hate speech and disinformation research through natural language. The knowledge base also feeds back into existing monitoring pipelines, enriching HS post explanations with contextual source links.

### Scope

- **Pilot**: Embedded in the existing GitHub Pages dashboard (`docs/`)
- **Users**: A few UNDP/MERLx IRIS analysts with shared API key
- **Future**: Migrate to Next.js app as the production platform

### Design Principles

- **Citation-grounded**: Every factual claim links to a source URL
- **Human-in-the-loop**: Automated findings require human verification before entering confirmed knowledge base
- **Additive**: Existing dashboard and monitoring pipelines stay untouched
- **Zero infrastructure cost**: Free-tier services only (HF Spaces, Supabase, GitHub Actions)

---

## 2. Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Pages (docs/)                                       │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │ Existing     │  │ New Chat Panel                       │ │
│  │ Dashboard    │  │ • Query input + filter chips         │ │
│  │ (untouched)  │  │ • Citation-grounded responses        │ │
│  │              │  │ • Source cards with "read more" URLs  │ │
│  └──────────────┘  │ • PIN gate + API-key auth            │ │
│                    └───────────┬──────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Admin Page (admin.html)                              │   │
│  │ • Tab 1: Verify Research Agent findings              │   │
│  │ • Tab 2: Review/annotate HS posts                    │   │
│  └───────────┬──────────────────────────────────────────┘   │
└──────────────┼──────────────────────────────────────────────┘
               │ HTTPS + API key
               ▼
┌─────────────────────────────────────────────────────────────┐
│  FastAPI Chat Service (HuggingFace Spaces — free)           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LangGraph Chat Agent                                 │   │
│  │ • Query analysis → route → retrieve → generate       │   │
│  │ • Tools: vector_search, stats_query, get_finding     │   │
│  │ • Claude Sonnet with citation mandate                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Endpoints                                            │   │
│  │ • POST /chat — conversational Q&A                    │   │
│  │ • GET /chat/history/{session_id}                     │   │
│  │ • GET /knowledge/stats                               │   │
│  │ • GET /knowledge/search                              │   │
│  │ • GET /verification/pending                          │   │
│  │ • POST /verification/decide                          │   │
│  │ • GET /posts/review-queue                            │   │
│  │ • POST /posts/annotate                               │   │
│  │ • GET /health                                        │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (Free Tier — 500MB DB, 1GB storage)               │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │ pgvector        │  │ Structured Tables                │  │
│  │ • document_     │  │ • sources                        │  │
│  │   chunks +      │  │ • findings                       │  │
│  │   embeddings    │  │ • verification_log               │  │
│  │ • metadata      │  │ • post_annotations               │  │
│  │   filters       │  │ • aggregated_stats               │  │
│  │                 │  │ • chat_sessions                  │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions (existing infrastructure)                    │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  │
│  │ Existing       │ │ Research Agent │ │ Ingestion      │  │
│  │ Monitoring     │ │ (LangGraph)    │ │ Pipeline       │  │
│  │ Pipelines      │ │ • Daily 04:00  │ │ • Seed from    │  │
│  │ (untouched)    │ │ • Discovers    │ │   desk review  │  │
│  │                │ │   new sources  │ │ • Fetch docs   │  │
│  │                │ │ • Stages for   │ │ • Chunk + embed│  │
│  │                │ │   verification │ │ • Write to     │  │
│  │                │ │ • $2/day cap   │ │   Supabase     │  │
│  └────────────────┘ └────────────────┘ └────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Enhanced explain_posts.py                              │ │
│  │ • Queries knowledge base for relevant findings         │ │
│  │ • Adds related_sources[] with "read more" URLs         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Chat hosting | HuggingFace Spaces | Free, 2 vCPU + 16GB RAM, sleeps after 48h idle (acceptable for pilot) |
| Database | Supabase free tier | pgvector + Postgres, zero ops, shared by chat service and GitHub Actions |
| Batch agents | GitHub Actions | Extends existing automation pattern, free compute, no new infrastructure |
| LLM provider | Anthropic (Claude) throughout | Already integrated in explain_posts.py, API key exists |
| Frontend | Vanilla JS widget in GitHub Pages | No build step, no framework, matches existing static site |
| Auth (pilot) | API key + client-side PIN gate | Real security at API layer, PIN hides UI from casual visitors |

---

## 3. Knowledge Base

### Three Tiers

#### Tier 1: Full-Text Documents (embedded, chunked)

The primary knowledge corpus. Sourced from the 261 desk review URLs (`documentation/desk-review-update-oct2025-mar2026.md`) plus ongoing Research Agent discoveries.

- **Content**: ICG reports, HRW publications, UN documents, ISS Africa analyses, academic papers, quality news articles
- **Ingestion**: Fetch full text from URL → extract readable content (trafilatura for web, PyMuPDF for PDFs) → chunk by section (~500 tokens) → embed with multilingual model → store in pgvector with metadata
- **Metadata per chunk**: `source_name, source_url, date_published, country[], theme[], classification, chunk_index, verified`
- **Expected volume**: ~261 initial sources × ~5-20 chunks each = 1,300-5,200 chunks. Growing daily via Research Agent.

#### Tier 2: Structured Findings (embedded as whole items)

Analyst-curated summaries with high retrieval precision.

- **Content**: 261 desk review findings (title + key takeaway + metadata), 245 events from `docs/data/events.json`
- **Ingestion**: Parse markdown/JSON → one embedding per finding/event → store with rich metadata
- **Purpose**: When a desk review finding matches a query, the chat cites the summary and links to the full source document (Tier 1)

#### Tier 3: Aggregated Statistics (SQL, not embedded)

Pre-computed from the ~6,000 classified HS posts (growing as new posts are classified).

- **Content**: Counts by country/subtype/month, toxicity distributions, trend data, narrative family prevalence
- **Ingestion**: Computed by GitHub Actions job from existing classified data. Refreshed when new posts are classified.
- **Purpose**: Chat agent has a SQL tool to answer "How much hate speech is there in Kenya?" without embedding thousands of noisy posts.

### Embedding Model

`paraphrase-multilingual-MiniLM-L12-v2` (384 dimensions, 118M parameters). Open-source, runs locally in GitHub Actions. Covers English, Somali, Swahili, Arabic. Known gap: Dinka, Nuer, Juba Arabic — fallback is translate-to-English before embedding.

### Seeding Process

1. Parse `documentation/desk-review-update-oct2025-mar2026.md` → extract 261 entries with URLs, metadata (date, source, country, theme)
2. Attempt to fetch each URL → expect ~70-80% success rate (some paywalled/dead)
3. Full-text extraction → chunk → embed → store as Tier 1
4. Store desk review summaries as Tier 2 findings
5. Load `docs/data/events.json` as Tier 2 events
6. Compute HS aggregations from `docs/data/hate_speech_posts.json` as Tier 3 stats

### Desk Review Parsing Spec

The file `documentation/desk-review-update-oct2025-mar2026.md` contains 261 entries in a consistent semi-structured format. Each entry follows this pattern:

```markdown
#### {number}. {title}
- **Date:** {date string}
- **Source:** {source name} (sometimes with embedded markdown links)
- **URL:** [{display text}]({url})
- **Relevance:** {relevance tag}
- **Key takeaway:** {summary paragraph}
- **[FLAG]:** {optional flag note}
```

The parser (`seed_desk_review.py`) should:
1. Split on `#### ` headings to isolate entries
2. Extract fields via regex: `\*\*Date:\*\*\s*(.+)`, `\*\*URL:\*\*\s*\[.*?\]\((.*?)\)`, etc.
3. Infer `country` from the parent `## {Country}` heading and from content
4. Infer `theme` from the parent `### TOPIC` heading
5. Detect `[FLAG]` markers and store as `flagged: true` metadata
6. Handle edge cases: multiple URLs per entry, embedded links in Source field, entries missing some fields

---

## 4. Agent Architecture

### Chat Agent (LangGraph — real-time, on HF Spaces)

Stateful graph with nodes:

**ANALYZE** → Detect language, extract intent (factual / comparison / trend / meta-query), infer filters (country, theme, date range)

**ROUTE** → Stats query → SQL tool (Tier 3). Knowledge query → vector search. Both → parallel retrieval.

**RETRIEVE** → Vector search with metadata filters (country, theme, date, verified). Top-k=10 from Tier 1 + Tier 2. SQL query for Tier 3 if needed. Deduplicate, rank by relevance.

**GENERATE** → Claude Sonnet with system prompt enforcing:
- Citation mandate: every factual claim must cite `[Source Name](URL)`
- Uncertainty: "I don't have enough information on..." rather than speculate
- Neutrality: no sides in conflicts, present multiple perspectives
- Scope: HS/disinfo in Kenya, Somalia, South Sudan only
- Confidence indicator: HIGH / MEDIUM / LOW based on source count and quality

**FORMAT** → Inline citations, sources list with metadata, confidence badge, data gap flag if retrieval sparse.

**Tools available:**
- `vector_search(query, filters)` — semantic search across Tier 1 + 2
- `stats_query(sql)` — query Tier 3 aggregation tables
- `get_finding_detail(id)` — fetch full finding with source links

**Query embedding**: The Chat Agent on HF Spaces loads the MiniLM model (~500MB RAM) at startup to embed user queries for vector search. This is the same model used by the batch ingestion pipeline in GitHub Actions, ensuring consistency.

**Session memory**: LangGraph checkpointing, in-memory on HF Spaces. Multi-turn conversations maintain context. Stateless across container restarts (acceptable for pilot).

### Research Agent (LangGraph — batch, in GitHub Actions)

Runs daily at 04:00 UTC. Budget: max $2/run, max 50 searches.

**ASSESS GAPS** → Query Supabase for topics with no new findings in 7 days. Read `signal_metrics.json` for rising signals. Check institutional watchlist for new publications.

**SEARCH** → Generate targeted queries from gap analysis + `hs_keyword_strategy.json`. Web search via Tavily. Check watchlist URLs. Claude Haiku for extraction.

**PROCESS** → Extract metadata + summary. Classify: country, theme, CONTEXT/HS_DISINFO/VE_PROPAGANDA. Dedup: cosine similarity > 0.85 → discard. Score: source credibility × relevance × confidence.

**STAGE** → Insert into Supabase as UNVERIFIED. Embed and store in pgvector. Generate daily digest JSON.

**Source priority hierarchy:**

| Priority | Source Type | DB `source_type` | Credibility Baseline |
|----------|-----------|-------------------|---------------------|
| 1 | UN Agencies (UNDP, UNHCR, UNOCHA, UNESCO) | `UN_AGENCY` | 0.95 |
| 2 | Regional Bodies (IGAD, AU, EAC) | `REGIONAL_BODY` | 0.90 |
| 3 | Think Tanks (ICG, ISS Africa, RVI, ACLED) | `THINK_TANK` | 0.85 |
| 4 | NGOs & CSOs (HRW, Amnesty, DRF, 211Check) | `NGO_CSO` | 0.85 |
| 5 | Fact-Checkers (Africa Check, PesaCheck) | `FACT_CHECKER` | 0.85 |
| 6 | Academic Publications | `ACADEMIC` | 0.80 |
| 7 | Quality Media (The East African, Nation, Radio Dalsan, Radio Tamazuj) | `QUALITY_MEDIA` | 0.75 |

**Cost controls:** Hard cap $2/day LLM, max 30 searches/run (900/month stays within Tavily free tier of 1000), max 20 findings per run. Claude Haiku for extraction/classification, Sonnet only for ambiguous cases.

### Pipeline Functions (not agents)

- **classify(text, metadata)** → `{classification, hs_subtype, confidence}`. Claude Haiku with few-shot examples. Called by Research Agent and ingestion pipeline.
- **embed_and_store(text, metadata)** → Chunk text, generate embeddings, upsert to pgvector. Called after verification or by Research Agent.
- **verify_checks(finding)** → URL validity, dedup check, completeness check. Returns `{status, issues[]}`. Assists human decision.

---

## 5. API Endpoints

### FastAPI Service (HF Spaces)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/chat` | API key | Conversational Q&A. Accepts query + optional filters + session_id. Returns citation-grounded response with sources. |
| `GET` | `/chat/history/{session_id}` | API key | Retrieve conversation history for a session. |
| `GET` | `/knowledge/stats` | API key | Knowledge base summary: counts by country/theme/type, last research run, coverage gaps. |
| `GET` | `/knowledge/search` | API key | Structured search with filters (country, theme, date, classification). |
| `GET` | `/verification/pending` | API key | List UNVERIFIED findings awaiting analyst review. |
| `POST` | `/verification/decide` | API key | Analyst submits VERIFY / FLAG / REJECT with optional note + corrections. |
| `GET` | `/posts/review-queue` | API key | Filtered, paginated HS post list for annotation review. |
| `POST` | `/posts/annotate` | API key | Submit annotation for a post (confirm/correct/flag labels). |
| `GET` | `/health` | None | System status: DB, vector store, LLM reachability. |

### Auth

- **Backend**: `X-API-Key` header required on all endpoints except `/health`. Keys stored as environment variables on HF Spaces.
- **Frontend**: PIN input on first use (client-side gate, stored in localStorage). Real security is at the API layer.
- **CORS**: Allows requests only from `ksvend.github.io`.

### Request/Response Schemas

**POST /chat**
```json
// Request
{
  "query": "string (required)",
  "session_id": "string (optional — auto-generated if omitted)",
  "filters": {
    "country": ["Kenya", "Somalia"],
    "theme": ["Platform Governance"],
    "date_from": "2026-01-01",
    "date_to": "2026-03-21"
  }
}
// Response
{
  "response": "markdown string with [Source Name](URL) citations",
  "sources": [
    {"id": "uuid", "title": "...", "source_name": "...", "source_url": "...",
     "date": "2026-02-15", "country": ["Somalia"], "classification": "HS_DISINFO"}
  ],
  "confidence": "HIGH | MEDIUM | LOW",
  "session_id": "string",
  "query_id": "uuid"
}
```

**POST /verification/decide**
```json
// Request
{
  "finding_id": "uuid (required)",
  "action": "VERIFY | FLAG | REJECT (required)",
  "reviewer_name": "string (required — analyst enters name in admin UI, stored in localStorage)",
  "note": "string (optional)",
  "corrections": {
    "country": ["Kenya"],
    "theme": ["OGBV"],
    "classification": "HS_DISINFO"
  }
}
```

**POST /posts/annotate**
```json
// Request
{
  "post_id": "string (required)",
  "action": "CONFIRM | CORRECT | FLAG (required)",
  "reviewer_name": "string (required — same as verification)",
  "corrections": {
    "eaHsPred": "Abusive",
    "hs_subtype": "Political Incitement",
    "sev": "medium"
  },
  "note": "string (optional)"
}
```

### Reviewer Identity (Pilot)

The admin UI prompts for the analyst's name on first use (stored in localStorage alongside the PIN). This name is passed as `reviewer_name` in all verification and annotation requests. Not authenticated — trust-based for the pilot. Production upgrade: Supabase Auth with per-user accounts.

### Research Agent → Supabase Direct

The Research Agent (GitHub Actions) writes directly to Supabase using the service role key (GitHub Actions secret). Does not route through the FastAPI service.

---

## 6. Database Schema

### Supabase Tables

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Document chunks with embeddings (Tier 1 + Tier 2)
CREATE TABLE document_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID REFERENCES sources(id),
    tier            TEXT NOT NULL CHECK (tier IN ('full_text', 'finding', 'event')),
    content         TEXT NOT NULL,
    chunk_index     INTEGER NOT NULL DEFAULT 0,
    embedding       vector(384),
    country         TEXT[],
    theme           TEXT[],
    classification  TEXT CHECK (classification IN ('CONTEXT', 'HS_DISINFO', 'VE_PROPAGANDA')),
    date_published  DATE,
    verified        BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Use HNSW index (no pre-population requirement, better recall than IVFFlat)
CREATE INDEX idx_chunks_embedding ON document_chunks
    USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_chunks_country ON document_chunks USING GIN (country);
CREATE INDEX idx_chunks_theme ON document_chunks USING GIN (theme);
CREATE INDEX idx_chunks_tier ON document_chunks(tier);
CREATE INDEX idx_chunks_verified ON document_chunks(verified);

-- Source provenance
CREATE TABLE sources (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               TEXT NOT NULL,
    source_name         TEXT NOT NULL,
    source_url          TEXT NOT NULL,
    source_type         TEXT NOT NULL CHECK (source_type IN (
                            'UN_AGENCY', 'REGIONAL_BODY', 'THINK_TANK',
                            'QUALITY_MEDIA', 'ACADEMIC', 'NGO_CSO',
                            'FACT_CHECKER')),
    date_published      DATE,
    country             TEXT[],
    theme               TEXT[],
    classification      TEXT,
    credibility_score   REAL CHECK (credibility_score BETWEEN 0 AND 1),
    summary             TEXT,
    fetch_status        TEXT DEFAULT 'PENDING' CHECK (fetch_status IN (
                            'PENDING', 'FETCHED', 'FAILED', 'PAYWALLED')),
    created_by          TEXT NOT NULL,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Research Agent discoveries awaiting verification
CREATE TABLE findings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id           UUID REFERENCES sources(id),
    title               TEXT NOT NULL,
    summary             TEXT NOT NULL,
    country             TEXT[] NOT NULL,
    theme               TEXT[] NOT NULL,
    classification      TEXT NOT NULL CHECK (classification IN (
                            'CONTEXT', 'HS_DISINFO', 'VE_PROPAGANDA')),
    hs_subtype          TEXT,
    confidence          REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    status              TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (status IN (
                            'UNVERIFIED', 'VERIFIED', 'FLAGGED', 'REJECTED')),
    verified_by         TEXT,
    verified_at         TIMESTAMP,
    verification_note   TEXT,
    created_by          TEXT NOT NULL,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_findings_status ON findings(status);
CREATE INDEX idx_findings_country ON findings USING GIN (country);

-- Verification audit trail
CREATE TABLE verification_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id      UUID NOT NULL REFERENCES findings(id),
    reviewer_id     TEXT NOT NULL,
    action          TEXT NOT NULL CHECK (action IN ('VERIFY', 'FLAG', 'REJECT')),
    note            TEXT,
    previous_status TEXT NOT NULL,
    new_status      TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- HS post annotations from analyst review
CREATE TABLE post_annotations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         TEXT NOT NULL,
    reviewer        TEXT NOT NULL,
    action          TEXT NOT NULL CHECK (action IN ('CONFIRM', 'CORRECT', 'FLAG')),
    corrections     JSONB,
    note            TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_annotations_post ON post_annotations(post_id);

-- Pre-computed HS statistics (Tier 3)
CREATE TABLE aggregated_stats (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stat_type       TEXT NOT NULL,
    country         TEXT,
    period          TEXT,
    data            JSONB NOT NULL,
    computed_at     TIMESTAMP DEFAULT NOW()
);

-- Chat session logs
CREATE TABLE chat_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      TEXT NOT NULL,
    query_text      TEXT NOT NULL,
    query_language  TEXT,
    filters         JSONB,
    response_text   TEXT,
    sources_cited   JSONB,
    confidence      TEXT,
    feedback        TEXT,
    response_time_ms INTEGER,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_session ON chat_sessions(session_id);

-- System metadata (Research Agent run history, etc.)
CREATE TABLE system_metadata (
    key             TEXT PRIMARY KEY,
    value           JSONB NOT NULL,
    updated_at      TIMESTAMP DEFAULT NOW()
);
-- Example: INSERT INTO system_metadata VALUES ('last_research_run', '{"timestamp": "...", "findings_count": 5, "cost": 1.23}');
```

---

## 7. Pipeline Integration

### 7.1 explain_posts.py Enhancement

Current output:
```json
{"exp": "...", "sev": "high", "ner": ["Ethnic Targeting"], "src": "verified"}
```

Enhanced output:
```json
{
  "exp": "...", "sev": "high", "ner": ["Ethnic Targeting"], "src": "verified",
  "related_sources": [
    {"title": "NCIC: Hate Speech Fueling Radicalisation",
     "url": "https://www.the-star.co.ke/...",
     "relevance": "Links online hate to VE recruitment"}
  ]
}
```

Implementation: Before generating explanation, query Supabase for Tier 1/2 findings matching the post's country + narrative family + date proximity. Pass top 3 matches as context to the Claude prompt. Add `related_sources` to output. Minimal change — one Supabase query + prompt addition.

**Dependency note**: The existing `explain_posts.py` is pure stdlib (no pip dependencies). The Supabase query will use raw `urllib.request` calls to Supabase's PostgREST API (REST over HTTPS), avoiding the need for the `supabase` Python client. This preserves the script's lightweight design.

### 7.2 Daily Findings → Knowledge Base

After existing pipeline produces `findings_YYYY-MM-DD.json`:
1. New GitHub Action step parses new findings
2. Fetches full source text from URLs where possible
3. Embeds + stores in Supabase as UNVERIFIED
4. Findings become searchable in chat (marked as unverified in responses)

### 7.3 Autolearned Keywords → Research Agent

`monitoring/autolearn/` outputs (learned_keywords_hs.csv, narrative_discoveries.csv) feed into Research Agent gap assessment. New keyword patterns discovered by autolearning inform the next research run's search queries.

### 7.4 What Stays Untouched

- All Apify sweep/classify scripts
- ml_classify.py
- event_dedup.py / event_lifecycle.py
- GitHub Pages dashboard visualisations
- docs/data/events.json and docs/data/hate_speech_posts.json data flows

---

## 8. Frontend

### Chat Panel (docs/index.html)

Vanilla JS widget embedded in existing dashboard.

- **Layout**: Collapsible side panel on right edge, ~400px wide when expanded. Toggle button on all tabs. Dashboard content shifts left (overlays on mobile).
- **PIN gate**: Simple input on first click. Correct PIN reveals chat. Stored in localStorage.
- **Chat input**: Text field + send button. Enter to send, Shift+Enter for newline.
- **Filter chips**: Optional country toggles (Kenya / Somalia / South Sudan), date presets (7d / 30d / 90d / all).
- **Responses**: Markdown rendered with inline `[Source Name](URL)` as clickable links. Confidence badge (HIGH/MED/LOW). Expandable source cards: source name, date, country, classification badge.
- **Feedback**: Thumbs up/down per response.
- **Context injection**: When opened from a specific dashboard tab, the widget passes context (active country, visible date range) as default filters.
- **Cold-start handling**: HF Spaces free tier sleeps after 48h idle. First request after sleep takes ~20s to wake. The chat widget detects this (HTTP timeout or 503) and shows a "Waking up the service, please wait..." message with auto-retry after 5 seconds.
- **Styling**: MERLx design system — warm neutrals, Inter font, calm aesthetic matching existing dashboard.

### Admin Page (docs/admin.html)

Same PIN + API key auth. Two tabs:

**Tab 1: Verify Findings**
- Table of UNVERIFIED findings from Research Agent
- Columns: title, source, country, theme, confidence, date
- Actions: Verify / Flag / Reject with optional note
- Bulk select for batch operations

**Tab 2: Review Posts**
- Paginated table of HS posts, filterable by country, subtype, severity, confidence
- Smart queuing: low-confidence posts surfaced first
- Per-post: current labels shown, analyst can Confirm / Correct / Flag
- Corrections via dropdowns matching existing taxonomies
- Optional free-text note
- All annotations stored in `post_annotations` table

---

## 9. Cost

### Monthly Costs (Pilot)

| Component | Cost | Notes |
|-----------|------|-------|
| HuggingFace Spaces | $0 | Free tier: 2 vCPU, 16GB RAM. Sleeps after 48h idle. |
| Supabase | $0 | Free tier: 500MB DB, 1GB storage. |
| GitHub Actions | $0 | Free tier covers daily research runs. |
| GitHub Pages | $0 | Existing hosting. |
| Embedding model | $0 | Open-source, runs locally. |
| Tavily (web search) | $0 | Free tier: 1000 searches/month. |
| **Infrastructure total** | **$0** | |
| Anthropic — Chat Agent | ~$10-15/mo | Claude Sonnet, ~500 queries/mo at ~$0.02-0.03/query |
| Anthropic — Research Agent | ~$5-10/mo | Haiku for classify + Sonnet for synthesis, $2/day cap |
| Anthropic — explain_posts.py | ~$1/mo | Existing cost, unchanged |
| Apify (existing) | ~$15/mo | Existing cost, unchanged |
| **Total** | **~$31-41/mo** | ~$15-25 net new Anthropic cost |

### Cost Controls

- Research Agent: hard cap $2/day, max 30 searches (within Tavily free tier), max 20 findings per run
- Chat Agent: Claude Haiku for simple factual lookups, Sonnet for multi-source synthesis
- Caching: identical queries within 24h served from cache if no new findings added
- Model routing at API gateway: query complexity classifier determines Haiku vs Sonnet

---

## 10. Security

| Layer | Mechanism |
|-------|-----------|
| API authentication | `X-API-Key` header on all endpoints (except /health) |
| Rate limiting | 50 queries/day per API key (prevents accidental budget overrun) |
| Frontend gate | Client-side PIN (hides chat UI from casual visitors) |
| CORS | Locked to `ksvend.github.io` origin |
| Supabase access | Service role key in GitHub Actions secrets only. Anon key for read-only chat operations via PostgREST. |
| Data privacy | No PII stored. Social media posts pre-anonymised in existing pipeline. Chat logs use anonymous session IDs. |
| Audit trail | All queries, verifications, and annotations logged with timestamps. |

### Production Upgrade Path

When migrating to Next.js: replace PIN gate with Cloudflare Access or Supabase Auth (email-based login). Per-user API keys for audit trail. Row-level security in Supabase.

---

## 11. Deployment Topology

### New GitHub Actions Workflows

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `research-agent.yml` | Daily 04:00 UTC | Run Research Agent (LangGraph), discover new findings, stage in Supabase |
| `ingest-seed.yml` | Manual trigger | One-time seeding from desk review + events.json |
| `compute-stats.yml` | After monitor.yml | Refresh Tier 3 aggregated stats from classified HS data |
| `ingest-daily-findings.yml` | After monitor.yml | Ingest new daily findings into knowledge base |

Existing `monitor.yml` is untouched. New workflows trigger after it completes where needed.

### HuggingFace Spaces

- FastAPI app deployed from a subdirectory of the repo (or separate repo)
- Environment variables: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `API_KEY`
- Auto-deploys on push to main (or manual)

---

## 12. Files Changed / Added

### Changed

| File | Change |
|------|--------|
| `docs/index.html` | Add chat panel toggle button + widget container |
| `docs/app.js` | Add chat widget JS (or load from separate file) |
| `docs/style.css` | Chat panel + admin page styles (MERLx design system) |
| `monitoring/explain_posts.py` | Add Supabase query for related sources, add `related_sources` to output |

### Added

| File | Purpose |
|------|---------|
| `docs/admin.html` | Admin/verification/annotation page |
| `docs/chat-widget.js` | Chat panel logic (API calls, rendering, PIN gate) |
| `docs/admin.js` | Admin page logic (verification + post review tabs) |
| `backend/` | New directory for FastAPI + LangGraph chat service |
| `backend/app.py` | FastAPI application with all endpoints |
| `backend/agents/chat_agent.py` | LangGraph Chat Agent graph definition |
| `backend/agents/research_agent.py` | LangGraph Research Agent graph definition |
| `backend/tools/vector_search.py` | pgvector search tool |
| `backend/tools/stats_query.py` | SQL query tool for Tier 3 |
| `backend/tools/classify.py` | Classification pipeline function |
| `backend/tools/embed.py` | Embedding + storage pipeline function |
| `backend/tools/verify.py` | Automated verification checks |
| `backend/ingest/seed_desk_review.py` | Parse desk review markdown, fetch URLs, chunk + embed |
| `backend/ingest/seed_events.py` | Load events.json into knowledge base |
| `backend/ingest/compute_stats.py` | Compute Tier 3 aggregations |
| `backend/ingest/ingest_daily_findings.py` | Ingest daily pipeline findings |
| `.github/workflows/research-agent.yml` | Daily Research Agent workflow |
| `.github/workflows/ingest-seed.yml` | One-time seeding workflow |
| `.github/workflows/compute-stats.yml` | Stats refresh workflow |
| `.github/workflows/ingest-daily-findings.yml` | Daily findings ingestion |

### Moved

| From | To | Reason |
|------|-----|--------|
| `docs/desk-review-update-oct2025-mar2026.md` | `documentation/desk-review-update-oct2025-mar2026.md` | Belongs with project documentation, not static site |
