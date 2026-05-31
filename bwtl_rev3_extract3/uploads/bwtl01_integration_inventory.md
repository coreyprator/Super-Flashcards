# BWTL Integration Reconciliation Inventory
**Sprint:** BWTL01 | **Date:** 2026-05-15 | **Mode:** READ-ONLY (no code changes, no deploys)  
**Handoff ID:** C4B966BB-D28C-44CD-B37C-2DFAE81B4497  
**Purpose:** Single-source reconciliation contract for Claude Design's unified UI/UX redesign across all apps.

---

## Table of Contents
- [Section A: Super Flashcards (SF)](#section-a-super-flashcards-sf)
- [Section B: EFG / pie-network-graph](#section-b-efg--pie-network-graph)
- [Section C: Etymython (EM)](#section-c-etymython-em)
- [Section D: Portfolio RAG](#section-d-portfolio-rag)
- [Section E: PIE Explorer (Cross-App Feature)](#section-e-pie-explorer-cross-app-feature)
- [Section F: ArtForge (Reference AF08)](#section-f-artforge-reference-af08)
- [Section G: PIE Audit State](#section-g-pie-audit-state)
- [Cross-Cutting: Integration Surfaces](#cross-cutting-integration-surfaces)
- [Cross-Cutting: 16 AI-Healable Field Map](#cross-cutting-16-ai-healable-field-map)
- [Cross-Cutting: Missing Capabilities](#cross-cutting-missing-capabilities)
- [Cross-Cutting: Shared Data Audit (Chat-Anchor Questions)](#cross-cutting-shared-data-audit-chat-anchor-questions)

---

## Section A: Super Flashcards (SF)

**Production URL:** `https://learn.rentyourcio.com`  
**Backend:** FastAPI + SQLAlchemy, pyodbc; Cloud SQL `LanguageLearning` DB @ 35.224.242.223  
**Auth:** Google OAuth (user-facing), ARTFORGE_EXTERNAL_API_KEY (service-to-service out)  
**Repo:** `Super-Flashcards/backend/app/`

### A1. Endpoint Catalog

| Prefix | Router File | Key Endpoints |
|--------|-------------|---------------|
| `/api` | auth.py | Login, OAuth callback, token refresh |
| `/api` | import.py | Flashcard import/upload |
| `/api` | batch_processing.py | Batch card operations |
| `/api` | card_audio.py | Per-card audio generation |
| `/api` | word_family.py | Word family lookup |
| `/api` | dcc.py (v0) | DCC lookup (deprecated path) |
| `/api` | video.py | `POST /api/flashcards/{id}/generate-video`, `GET /api/flashcards/{id}/video-status` |
| `/api` | shadowing.py | Shadowing session endpoints |
| `/api` | cards.py | Generic card CRUD |
| `/api` | admin_repair.py | `POST /api/repair-pie-relationship`, `POST /api/repair-pie-batch` |
| `/api/flashcards` | flashcards.py | Full CRUD; `GET /api/flashcards/pie-explorer/{pie_root}` |
| `/api/ai` | ai_generate.py | AI content generation per card |
| `/api/ai` | batch_ai_generate.py | Batch AI generation |
| `/api/ai` | batch_progress.py | `GET /api/ai/batch-progress` |
| `/api/languages` | languages.py | Language CRUD |
| `/api/users` | users.py | User profile, preferences |
| `/api/audio` | audio.py | TTS audio endpoints |
| `/api/v1/pronunciation` | pronunciation.py | Pronunciation recording, scoring |
| `/api/v1` | voice_clone.py | ElevenLabs voice clone management |
| `/api/v1` | dcc.py | `GET /api/v1/cards/{id}/dcc` — DCC enrichment via EFG + RAG |
| `/api/study` | study.py | Study sessions, SRS logic |
| `/api/document` | document_parser.py | Document import, text extraction |
| `/api/efg` | efg.py | `POST /api/efg/backfill-pie-ipa`, `POST /api/efg/backfill-pie-audio` |

**PIE Explorer endpoint (full):**
```
GET /api/flashcards/pie-explorer/{pie_root}
Response: {
  pie_root, card_count, pie_meaning, pie_ipa, pie_audio_url,
  branches: [{id, word, language, definition, etymology, pie_meaning, pie_ipa, pie_audio_url}]
}
```
> ⚠️ Reads only from `flashcards.pie_root` — does NOT query EFG `efg_pie_explorer_data` or `efg_pie_explorer_data`. Cross-app join is missing.

### A2. Frontend Cross-App Calls (app.js)

| SF Frontend → Dest | Protocol | Endpoint | Usage | Source |
|---|---|---|---|---|
| SF → EM | HTTPS GET | `https://etymython.rentyourcio.com/api/v1/cognates/lookup?word={word}` | Inject "View in Etymython" link on flashcard | app.js:1171 |
| SF → EFG (deep link) | `sfLink` click | Opens `learn.rentyourcio.com/?cardId={UUID}` in EFG's iframe | Initiated by EFG, not SF | app.js:7392 |
| SF self → PIE Explorer | HTTPS GET | `/api/flashcards/pie-explorer/{pie_root}` | PIE Explorer modal inside SF | app.js:7392 |

**Etymython cache:** Results cached in `etymythonLookupCache` (Map). Called once per unique word per session.

### A3. Data Model

**Database:** `LanguageLearning` (Cloud SQL MSSQL @ 35.224.242.223)

**Key Tables:**

`flashcards` — core table
| Column | Type | Notes |
|--------|------|-------|
| id | uniqueidentifier | PK |
| word_or_phrase | NVARCHAR | Required |
| definition | NVARCHAR | 1 NULL row |
| etymology | NVARCHAR | 304 NULL (10%) |
| english_cognates | NVARCHAR | 724 NULL (25%) |
| related_words | NVARCHAR | 710 NULL (24%) |
| audio_url | VARCHAR | 1368 NULL (47%) |
| pie_root | NVARCHAR | 879 NULL (30%) |
| pie_meaning | NVARCHAR | — |
| pie_ipa | NVARCHAR | 883 NULL (30%) |
| pie_audio_url | VARCHAR | 2581 NULL (88%) |
| efg_node_id | NVARCHAR(100) | 790 NULL (27%); links to EFG nodes.id |
| cognate_pie_roots | JSON | Legacy multi-root field |
| gender | NVARCHAR | ALL NULL (2936/2936) — dead column |
| card_type | VARCHAR | word / sentence (250 sentence cards) |
| dcc_frequency_rank | INT | DCC Greek rank |
| ipa_pronunciation | NVARCHAR | User-facing pronunciation |
| image_url, video_url, video_job_id | VARCHAR | Media |

`flashcard_pie_roots` — junction table (multi-root support)
| Column | Type | Notes |
|--------|------|-------|
| flashcard_id | uniqueidentifier | FK → flashcards |
| pie_root | NVARCHAR | |
| pie_meaning | NVARCHAR | |
| pie_ipa | NVARCHAR | |
| pie_audio_url | NVARCHAR | |
| role | NVARCHAR | (primary/secondary) |
| display_order | INT | |
| etymology_layer | NVARCHAR | **0% filled** (2922 rows, all NULL) |
| confidence | FLOAT | |
| source | NVARCHAR | |
| efg_node_id | NVARCHAR | |

> ⚠️ `etymology_layer` exists in schema but is never populated. REQ-008 (req_created).

**All LanguageLearning tables:**
api_debug_logs, flashcard_pie_roots, flashcards, flashcards_repair_log, GeneratedPronunciations, languages, PronunciationAttempts, PronunciationDebugLogs, PronunciationPromptTemplates, shadowing_sessions, study_sessions, user_languages, users, UserVoiceClones, VoiceCloneSamples, vw_UserPronunciationProgress

### A4. External Callers (Who Calls SF?)

| Caller | Protocol | Endpoint on SF | Purpose |
|--------|----------|----------------|---------|
| EFG frontend | iframe deep-link | `learn.rentyourcio.com/?cardId={UUID}` | Opens SF card in EFG's SF modal |
| EM backend | HTTPS POST | `/api/v1/admin/migrate-sf-links` | Batch-link EM cognates to SF cards |
| EM backend | HTTPS POST | `/api/v1/admin/batch-link-cognates` | Admin: populate `english_cognates.sf_card_id` |

### A5. External Calls Out (SF Calls Who?)

| SF Component | → Dest | Protocol | Endpoint | Purpose |
|---|---|---|---|---|
| video.py (backend) | ArtForge | HTTPS POST | `https://artforge.rentyourcio.com/api/external/generate-video` | Trigger word video; X-API-Key auth |
| video.py (backend) | ArtForge | HTTPS GET | `https://artforge.rentyourcio.com/api/external/jobs/{job_id}` | Poll video job status; x-api-key auth |
| dcc.py (backend) | EFG | HTTPS GET | `https://efg.rentyourcio.com/api/words?include_dcc=true` | Load DCC word list (in-memory cache) |
| dcc.py (backend) | Portfolio RAG | HTTPS GET | `https://portfolio-rag-57478301787.us-central1.run.app/search` | Enrich DCC definitions |
| efg.py (backend) | EFG DB | pymssql direct | `EtymologyGraph.dbo.*` | PIE IPA/audio backfill via SQL |
| app.js (frontend) | EM | HTTPS GET | `https://etymython.rentyourcio.com/api/v1/cognates/lookup` | Cognate cross-link injection |

### A6. Shared Concepts

| Concept | SF Column | Linked To |
|---------|-----------|-----------|
| EFG node ID | `flashcards.efg_node_id` (e.g. `dcc_42`) | `EFG.nodes.id` |
| EFG SF link | `EFG.nodes.sf_url` (e.g. `https://learn.rentyourcio.com/?cardId={UUID}`) | `SF.flashcards.id` |
| PIE root string | `flashcards.pie_root` | `EFG.nodes.pie_root`, `EM.english_cognates.pie_root` |
| DCC rank | `flashcards.dcc_frequency_rank` | `EFG.nodes.frequency_rank` (same dataset) |

---

## Section B: EFG / pie-network-graph

**Production URL:** `https://efg.rentyourcio.com`  
**Backend:** FastAPI, all endpoints in `main.py` (no router split), pymssql  
**Database:** `EtymologyGraph` DB @ 35.224.242.223 (SQL-backed, NOT in-memory)  
**Correction:** Prompt stated "all data in in-memory Python files" — this is outdated. EFG migrated to SQL (see `db.py`). The `data/` directory contains static seed/fallback JSON only (`static/data/dictionary.json`).

### B1. Endpoint Catalog

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/debug/source` | Data source debug info |
| GET | `/api/graph` | Full graph (nodes + edges) |
| GET | `/api/words` | Word nodes list; `?include_dcc=true` for DCC filter |
| GET | `/api/roots` | PIE root nodes list |
| GET | `/api/words/{word_id}` | Single word node |
| GET | `/api/nodes/{node_id}` | Single node by ID |
| PATCH | `/api/nodes/{node_id}` | Update node fields |
| DELETE | `/api/nodes/{node_id}` | Delete node |
| POST | `/api/nodes` | Create node |
| POST | `/api/edges` | Create edge |
| DELETE | `/api/edges/{edge_id}` | Delete edge |
| GET | `/api/search` | Search nodes |
| GET | `/api/admin/stats` | Admin statistics |
| GET | `/api/stats` | Public stats (includes `sf_linked_count`) |
| GET | `/api/dcc/stats` | DCC coverage stats |
| POST | `/api/pie-explorer/generate/{root}` | AI-generate PIE explorer data and store in DB |
| POST | `/api/pie-explorer/{root:path}` | Serve PIE explorer data from DB (or fallback) |
| GET | `/api/rag/search` | RAG-backed search |
| GET | `/api/dictionary/search` | Beekes dictionary search |
| POST | `/api/rag-query` | Query Portfolio RAG |
| GET | `/` | Static index.html (main UI) |
| GET | `/beekes` | Beekes dictionary viewer |

### B2. Frontend Cross-App Calls (static/index.html)

| EFG Frontend → Dest | Protocol | Mechanism | Endpoint | Usage |
|---|---|---|---|---|
| EFG → SF | iframe embed | `openSFModal(node.sf_link)` | `https://learn.rentyourcio.com/?cardId={UUID}` | Opens SF flashcard in overlay modal when word node has `sf_url` |

**SF Modal:** `<iframe id="sf-modal-frame">` inside `<div id="sf-modal">`. Triggered by `node.sf_link` (populated from `EFG.nodes.sf_url`). No SF → EFG reverse iframe exists.

### B3. Data Model

**Database:** `EtymologyGraph` (3 tables)

`nodes` — 3290 total (2233 word, 1057 pie_root)
| Column | Type | Notes |
|--------|------|-------|
| id | NVARCHAR | PK; string IDs like `dcc_42`, `pie_h2ep` |
| label | NVARCHAR | Display label (Greek, English, PIE) |
| language | NVARCHAR | Language code |
| node_type | NVARCHAR | `word` or `pie_root` |
| gloss | NVARCHAR | Brief gloss |
| pie_root | NVARCHAR | PIE root string (for word nodes) |
| pie_root_id | NVARCHAR | FK to pie_root node id |
| source | NVARCHAR | Source dataset |
| frequency_rank | INT | DCC rank |
| has_sf_link | BIT | SF link present |
| sf_url | NVARCHAR | `https://learn.rentyourcio.com/?cardId={UUID}` |
| transliteration | NVARCHAR | |
| english_cognates | NVARCHAR | Cognate list (string) |
| pos | NVARCHAR | Part of speech |
| semantic_group | NVARCHAR | |
| dcc_imported | BIT | From DCC dataset |
| created_at | datetime2 | |
| pie_ipa | NVARCHAR | **52 NULL on pie_root nodes (5%)** |
| pie_audio_url | NVARCHAR | **52 NULL on pie_root nodes (5%)** |

`edges` — 2111 edges  
`efg_pie_explorer_data` — 992 rows
| Column | Type | Fill Rate |
|--------|------|-----------|
| id | INT | PK |
| pie_root | NVARCHAR | 100% |
| verbal_paradigm | NVARCHAR | **100% filled (0 NULL)** |
| nominal_derivatives | NVARCHAR | **100% filled** |
| modern_cognates | NVARCHAR | **100% filled** |
| generation_model | NVARCHAR | |
| generated_at | datetime2 | |

### B4. External Callers (Who Calls EFG?)

| Caller | Protocol | Endpoint on EFG | Purpose |
|--------|----------|-----------------|---------|
| SF backend (dcc.py) | HTTPS GET | `/api/words?include_dcc=true` | Load DCC word list for SF's DCC enrichment |
| SF backend (efg.py) | Direct SQL (pyodbc) | `EtymologyGraph.dbo.*` | Backfill PIE IPA/audio on EFG nodes |
| EM frontend/backend | URL navigation only | `https://efg.rentyourcio.com?search={root}` | Generates URL link; no HTTP call |
| AI agents / MetaPM | HTTPS | Various (PATCH /api/nodes, POST /api/edges) | Node/edge management |

### B5. External Calls Out (EFG Calls Who?)

| EFG Component | → Dest | Protocol | Endpoint | Purpose |
|---|---|---|---|---|
| `/api/rag-query`, `/api/rag/search` | Portfolio RAG | HTTPS POST | `https://portfolio-rag-57478301787.us-central1.run.app` | RAG-backed dictionary/search |
| `/api/pie-explorer/generate/{root}` | OpenAI | HTTPS | OpenAI API | AI-generate PIE explorer content |

### B6. Shared Concepts

| Concept | EFG Column | Linked To |
|---------|-----------|-----------|
| SF card deep-link | `nodes.sf_url` → full URL | `SF.flashcards.id` (UUID embedded in URL) |
| PIE root string | `nodes.pie_root` (on word nodes) | `SF.flashcards.pie_root` (string match — no FK) |
| EFG node ID | `nodes.id` (e.g. `dcc_42`) | `SF.flashcards.efg_node_id` |
| DCC frequency rank | `nodes.frequency_rank` | `SF.flashcards.dcc_frequency_rank` |

---

## Section C: Etymython (EM)

**Production URL:** `https://etymython.rentyourcio.com`  
**Backend:** FastAPI + SQLAlchemy, all endpoints in `main.py`  
**Database:** `Etymython` DB @ 35.224.242.223  
**Auth:** Google OAuth (users), X-API-Key (ArtForge outbound)

### C1. Endpoint Catalog (selected key endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/v1/figures` | List/create mythological figures |
| GET/PUT/DELETE | `/api/v1/figures/{id}` | Figure detail/update/delete |
| GET | `/api/v1/figures/{id}/mythology-data` | Mythology data for ArtForge pipeline |
| GET | `/api/v1/figures/{id}/cognates-with-links` | Figure cognates with SF links |
| GET | `/api/v1/figures/{id}/dcc` | DCC entry for figure |
| GET | `/api/v1/cognates/lookup` | **Called by SF frontend** — find EM figure for a word |
| POST | `/api/v1/figures/{id}/artforge-story` | Trigger ArtForge story (by figure object) |
| POST | `/api/v1/figures/{figure_id}/artforge-story` | Trigger ArtForge story (by ID — EM-014) |
| POST | `/api/v1/admin/migrate-sf-links` | Admin: migrate SF card links to EM cognates |
| POST | `/api/v1/admin/batch-link-cognates` | Admin: batch populate `sf_card_id` on cognates |
| GET | `/auth/google` | Google OAuth flow |
| — | audio sub-router | TTS audio for figures/cognates |
| — | image_gen sub-router | Image generation |
| — | content sub-router | Content management |

**Cross-app URLs embedded in main.py:**
- `EFG_BASE = "https://efg.rentyourcio.com"` (line 71)
- `ARTFORGE_URL = "https://artforge.rentyourcio.com"` (via artforge_client.py)
- `RAG_URL = "https://portfolio-rag-57478301787.us-central1.run.app"` (line 1069)
- CORS allowed origins include `https://learn.rentyourcio.com` and `https://artforge.rentyourcio.com`

### C2. Frontend Cross-App Calls

| EM → Dest | Protocol | Endpoint | Usage |
|---|---|---|---|
| EM → EFG | URL link (frontend only) | `https://efg.rentyourcio.com?search={pie_root}` | "View in EFG" link on cognate view (line 321) |
| EM → SF | URL link (frontend) | `english_cognates.sf_card_url` → `learn.rentyourcio.com` | Cognate → SF flashcard link |

### C3. Data Model

**Database:** `Etymython` (15 tables)

`mythological_figures` — 183 rows
| Column | Type | Fill Rate |
|--------|------|-----------|
| id | INT | PK |
| greek_name | NVARCHAR | — |
| latin_name | NVARCHAR | — |
| english_name | NVARCHAR | — |
| figure_type | VARCHAR | Olympian/Titan/Primordial/Hero/Creature |
| domain | NVARCHAR | e.g. "love, beauty, passion" |
| origin_story | NVARCHAR | **95% filled (10 NULL)** |
| image_url | VARCHAR | — |
| pronunciation_audio_url | VARCHAR | **61% missing (111/183)** |
| ipa_transcription | NVARCHAR | **62% missing (113/183)** |
| pronunciation_guide | NVARCHAR | — |
| mythology_source | NVARCHAR | greek/roman/nordic |
| equivalent_figure_id | INT | Cross-myth link (e.g. Jupiter ↔ Zeus) |
| ingestion_run_id | INT | — |
> ⚠️ NO direct `pie_root` column on `mythological_figures`. PIE data is accessed via `etymologies` relationship.

`etymologies` — 227 rows
| Column | Type | Notes |
|--------|------|-------|
| id | INT | PK |
| greek_root | NVARCHAR | Greek root form |
| root_meaning | NVARCHAR | |
| phonetic_evolution | NVARCHAR | |
| notes | NVARCHAR | **Scholarly notes field** (fill rate unqueried) |

`english_cognates` — 560 rows
| Column | Type | Fill Rate |
|--------|------|-----------|
| id | INT | PK |
| word | NVARCHAR | |
| definition | NVARCHAR | |
| part_of_speech | NVARCHAR | |
| usage_frequency | NVARCHAR | common/uncommon/rare/technical |
| example_sentence | NVARCHAR | |
| pronunciation_audio_url | VARCHAR | — |
| sf_card_id | VARCHAR(100) | **UUID of matching SF flashcard** |
| sf_card_url | VARCHAR | Path on learn.rentyourcio.com |
| pie_root | NVARCHAR(100) | **93% filled (519/560)** |
| pie_ipa | NVARCHAR(200) | — |
| pie_audio_url | VARCHAR | **51% missing (286/560)** |

`figure_relationships` — junction
- figure1_id, figure2_id, relationship_type (`parent_of`, `spouse_of`, `sibling_of`), notes

`figure_etymologies` — junction: figure_id, etymology_id

`etymology_cognates` — junction: etymology_id, cognate_id, derivation_path (Greek → Latin → English)

`fun_facts` — **1012 rows** (5.5 per figure average)

`figure_dcc_matches` — 1:1 per figure; dcc_word, dcc_rank, dcc_gloss, dcc_pos, dcc_transliteration, dcc_semantic_group

`cognate_greek_roots` — **2 rows** (virtually unused; columns: cognate_word, root, meaning, definition, wiktionary_url)

`perseus_citations` — **183 rows** (1 per figure)

`content_transactions` — audit log for AI/manual content changes

**All Etymython tables:**
cognate_greek_roots, content_transactions, english_cognates, etymologies, etymology_cognates, figure_dcc_matches, figure_etymologies, figure_groups, figure_relationships, fun_facts, ingestion_groups, ingestion_runs, mythological_figures, perseus_citations, users

### C4. External Callers (Who Calls EM?)

| Caller | Protocol | Endpoint on EM | Purpose |
|--------|----------|----------------|---------|
| SF frontend (app.js) | HTTPS GET | `/api/v1/cognates/lookup?word={word}` | Inject Etymython link on SF flashcard |
| ArtForge | HTTPS GET | `/api/v1/figures/{id}/mythology-data` | Pull figure data for AF mythology pipeline |

### C5. External Calls Out (EM Calls Who?)

| EM Component | → Dest | Protocol | Endpoint | Auth |
|---|---|---|---|---|
| artforge_client.py | ArtForge | HTTPS POST | `https://artforge.rentyourcio.com/api/v1/stories/from-figure` | X-API-Key |
| main.py (RAG_URL) | Portfolio RAG | HTTPS | `https://portfolio-rag-57478301787.us-central1.run.app` | none |
| main.py (EFG_BASE) | EFG | URL link only | `https://efg.rentyourcio.com?search={root}` | n/a (no HTTP call) |

**ArtForge payload (from artforge_client.py):**
```json
{
  "figure_name": "<english_name>",
  "greek_name": "<greek_name>",
  "domain": "<domain>",
  "keywords": ["<domain_word1>", ...],
  "origin_story": "<origin_story>",
  "etymology": "<etymology>",
  "style": "classical"
}
```

### C6. Shared Concepts

| Concept | EM Column | Linked To |
|---------|-----------|-----------|
| SF card link | `english_cognates.sf_card_id` (UUID) | `SF.flashcards.id` |
| SF card URL | `english_cognates.sf_card_url` | `learn.rentyourcio.com` |
| PIE root (cognate level) | `english_cognates.pie_root` | `SF.flashcards.pie_root`, `EFG.nodes.pie_root` |
| DCC data | `figure_dcc_matches.dcc_rank` | `EFG.nodes.frequency_rank` (same DCC dataset) |
| Equivalent figure | `mythological_figures.equivalent_figure_id` | Cross-mythology self-join (Zeus ↔ Jupiter) |

---

## Section D: Portfolio RAG

**Production URL:** `https://rag.rentyourcio.com` (inferred; direct GCP URL: `https://portfolio-rag-57478301787.us-central1.run.app`)  
**Backend:** FastAPI + native MCP server (FastMCP)  
**Storage:** ChromaDB vector database  
**Role:** Read-only knowledge store; both REST API and MCP protocol; no UI frontend

### D1. Endpoint Catalog

**REST API:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/document/{repo}/{path}` | Get single document by repo+path |
| POST | `/query` | Query vector DB |
| POST | `/semantic` | Semantic similarity search |
| GET | `/latest/all` | Latest documents (all types) |
| GET | `/latest/{doc_type}` | Latest documents by type |
| GET | `/checkpoints` | List checkpoints |
| GET | `/documents` | List all documents |
| GET | `/api/pk-status` | PROJECT_KNOWLEDGE.md ingestion status |
| GET | `/api/coverage/reload` | Reload coverage data |
| GET | `/api/coverage` | Coverage report |
| GET | `/api/coverage/report` | Detailed coverage report |
| POST | `/ingest/all` | Ingest all sources |
| POST | `/ingest/portfolio` | Ingest portfolio docs |
| POST | `/ingest/etymology` | Ingest etymology (Beekes) docs |
| POST | `/ingest/jazz_theory` | Ingest jazz theory docs |
| POST | `/ingest/code` | Ingest code (deprecated → MetaPM) |
| POST | `/ingest/custom` | Custom ingest |
| POST | `/ingest/{repo_name}` | Ingest by repo name |
| POST | `/mcp` | MCP protocol endpoint |
| GET | `/search` | General search |
| GET | `/search/etymology` | Etymology-specific search |
| POST | `/admin/reingest` | Admin: force reingest |

**MCP Tools (from mcp_server.py):**

| Tool | Description | Collections |
|------|-------------|-------------|
| `query_portfolio(query, collection?, max_results?)` | Search knowledge base (max 20) | portfolio, etymology |
| `rag_query(query, collection?, n?)` | Semantic search with source attribution | portfolio, metapm, etymology, dcc, jazz_theory |
| `rag_get_document(source, collection?)` | Full document retrieval by source path | portfolio, metapm, etymology, dcc, jazz_theory |

> ⚠️ `code` collection is **deprecated** (MP48 TSK-005). Use MetaPM SQL `code_files` table.  
> Valid collections: `portfolio`, `etymology`, `jazz_theory`, `dcc`, `metapm`

### D2. Frontend / UI

No user-facing frontend. RAG is a pure backend/MCP service consumed by:
- SF (DCC enrichment via `dcc.py`)
- EM (RAG_URL calls)
- EFG (rag-query endpoint)
- AI agents/MetaPM via MCP protocol

### D3. Data Model (ChromaDB Collections)

| Collection | Content | Primary Consumer |
|------------|---------|-----------------|
| `portfolio` | Methodology docs, CAI standards, PROJECT_KNOWLEDGE.md files, Bootstrap | Claude/AI agents |
| `etymology` | Beekes dictionary entries | EFG (dictionary search), AI agents |
| `jazz_theory` | Jazz harmony theory docs | HarmonyLab |
| `dcc` | DCC Greek core vocabulary | SF (dcc.py enrichment) |
| `metapm` | Requirements, prompts | Claude/AI agents |
| `code` | DEPRECATED | Use MetaPM `code_files` SQL table |

### D4. External Callers (Who Calls RAG?)

| Caller | Protocol | Endpoint | Purpose |
|--------|----------|----------|---------|
| SF backend (dcc.py) | HTTPS GET | `/search` | Enrich DCC word data with definitions |
| EM backend | HTTPS | Various | Knowledge queries |
| EFG backend | HTTPS POST | `/rag-query` | Dictionary/etymology search |
| Claude/AI agents | MCP | `POST /mcp` | Standards/methodology retrieval |
| GitHub webhook | Push event | `/ingest/*` | Auto-ingest on code push |

### D5. External Calls Out

RAG ingests from GitHub repository webhooks (no outbound calls to other apps).

### D6. Shared Concepts

| Concept | RAG Collection | Used By |
|---------|---------------|---------|
| Beekes dictionary | `etymology` | EFG dictionary search, PIE research |
| DCC word list | `dcc` | SF DCC enrichment (`dcc.py`) |
| CAI standards / Bootstrap | `portfolio` | All AI agents |

---

## Section E: PIE Explorer (Cross-App Feature)

The "PIE Explorer" is a shared concept with two independent implementations — one panel inside SF and one inside EFG — that are currently NOT joined.

### E1. Route Map

| Panel | App | HTTP Route | Source DB |
|-------|-----|-----------|-----------|
| SF PIE Panel | SF | `GET /api/flashcards/pie-explorer/{pie_root}` | `LanguageLearning.flashcards.pie_root` |
| EFG PIE Panel (serve) | EFG | `POST /api/pie-explorer/{root:path}` | `EtymologyGraph.efg_pie_explorer_data` + `nodes` children |
| EFG PIE Generator | EFG | `POST /api/pie-explorer/generate/{root}` | OpenAI → stores in `efg_pie_explorer_data` |

**SF Frontend invocation:** `fetch('/api/flashcards/pie-explorer/${encodeURIComponent(pieRoot)}')` → populates `#pie-explorer-modal` (app.js:7392)

### E2. SF PIE Panel Response Schema

```json
{
  "pie_root": "*h₂ep-",
  "card_count": 12,
  "pie_meaning": "water",
  "pie_ipa": "*h₂ep-",
  "pie_audio_url": "https://...",
  "branches": [
    {
      "id": "UUID",
      "word": "ὕδωρ",
      "language": "UUID",
      "definition": "water",
      "etymology": "...",
      "pie_meaning": "water",
      "pie_ipa": "*h₂ep-",
      "pie_audio_url": "https://..."
    }
  ]
}
```

### E3. EFG PIE Panel Response Schema

```json
{
  "pie_root": "*h₂ep-",
  "verbal_paradigm": "...",
  "nominal_derivatives": "...",
  "modern_cognates": "...",
  "children": [
    {"label": "ὕδωρ", "gloss": "water", "language": "Greek", "sf_link": "https://learn.rentyourcio.com/?cardId=UUID"}
  ],
  "sf_linked_count": 8
}
```
Sources: `efg_pie_explorer_data` for `verbal_paradigm`/`nominal_derivatives`/`modern_cognates`; `nodes` children for word list.

### E4. Panel Data Availability

| Data Field | SF Panel | EFG Panel |
|------------|----------|-----------|
| Flashcard word list | ✅ | ✅ (as children with sf_link) |
| PIE IPA | ✅ (from flashcard) | ✅ (from nodes.pie_ipa — 95% filled) |
| PIE audio | ✅ (12% filled) | ✅ (from nodes.pie_audio_url — 95% filled) |
| Verbal paradigm | ❌ | ✅ (efg_pie_explorer_data — 992 roots, 100% filled) |
| Nominal derivatives | ❌ | ✅ |
| Modern cognates | ❌ | ✅ |
| Etymology notes | ❌ | ❌ |
| Mythological figures | ❌ | ❌ |
| Multi-language branches | ✅ (all languages) | ❌ (Greek-focused) |

### E5. Critical Gaps

1. **SF panel never reads from EFG.** `GET /api/flashcards/pie-explorer/{root}` queries `flashcards.pie_root` only. It does NOT call EFG for `verbal_paradigm`, `nominal_derivatives`, or `modern_cognates`. These fields are available in `efg_pie_explorer_data` but unreachable from SF.
2. **SF panel reads `flashcards.pie_root` not `flashcard_pie_roots`.** The multi-root junction table (`flashcard_pie_roots`, 2922 rows) is NOT queried by the PIE Explorer endpoint.
3. **BUG-045 (req_created):** PIE Explorer modal shows stale data.
4. **992 EFG PIE roots populated, 1057 total PIE nodes.** 65 PIE root nodes in EFG have no `efg_pie_explorer_data` entry.

---

## Section F: ArtForge (Reference AF08)

**Production URL:** `https://artforge.rentyourcio.com`  
**Full inventory:** `G:\My Drive\Code\Python\ArtForge\AF08_RECONCILIATION_INVENTORY.md` (129 endpoints, 25 router files)  
**Auth:** Google OAuth (user-facing), X-API-Key (service-to-service)

This section lists only integration-relevant endpoints. Do NOT regenerate the full AF08 catalog here.

### F1. Integration Endpoints (cross-app only)

| Method | Path | Auth | Caller | Description |
|--------|------|------|--------|-------------|
| POST | `/api/v1/stories/from-figure` | X-API-Key | EM (artforge_client.py) | Create Story + Collection + 3 Scenes for mythology figure |
| POST | `/api/external/generate-video` | x-api-key | SF (video.py) | Trigger word video generation |
| GET | `/api/external/jobs/{job_id}` | x-api-key | SF (video.py) | Poll video generation job status |
| GET | `/api/v1/mythology/figures` | X-API-Key | Internal/pipeline | List mythology figures |
| GET | `/api/v1/mythology/context/{figure}` | none | Internal | Get mythology context for a figure name |
| POST | `/api/mythology/generate` | verify_caller_token | Internal | Mythology story generation |
| POST | `/api/stories/{story_id}/enrich` | user auth | UI | Embed etymology facts from EM figures |
| GET | `/api/stories/{story_id}/etymology-suggestions` | user auth | UI | Get EM figure suggestions for a story |

### F2. Integration Dependency Map

| From | To | Auth | Call | Purpose |
|------|----|------|------|---------|
| EM | AF | X-API-Key | `POST /api/v1/stories/from-figure` | Figure → ArtForge story pipeline |
| SF | AF | x-api-key | `POST /api/external/generate-video` | Flashcard word → video |
| AF | EM | none/X-API-Key | `GET /api/v1/figures/{id}/mythology-data` | Pull figure for AF mythology image pipeline |

---

## Section G: PIE Audit State

**Snapshot date:** 2026-05-15 (live SQL queries run during BWTL01)

### G1. 12 In-Flight PIE Items (MetaPM SF Requirements)

| Code | Title (abbreviated) | Status | PTH |
|------|---------------------|--------|-----|
| REQ-015 | Cross-portfolio PIE audit | cc_executing | ETY01G |
| REQ-011 | EFG PIE audio/endpoint | cai_designing | 9A4D |
| REQ-008 | `etymology_layer` field | req_created | 3829 |
| REQ-020 | AI etymology notes non-PIE | req_created | 7153 |
| REQ-023 | Confidence/sources/Pre-Greek | req_created | AD24 |
| REQ-024 | Latin column PIE Explorer | req_created | (none) |
| BUG-024 | Multi-PIE DevTools diag | cc_executing | ETY01D |
| BUG-045 | PIE Explorer modal stale | req_created | 3372 |
| TSK-001 | PIE IPA+audio backfill | cc_executing | PIE-BF-001 |
| TSK-007 | PIE audio batch incomplete | req_created | 4EE2 |
| TSK-008 | 76 residual PIE mismatches | req_created | 66E5 |
| TSK-009 | 2 orphan cards backfill | req_created | 2939 |

### G2. Live Coverage Data (SQL 2026-05-15)

**Super Flashcards — LanguageLearning DB:**

| Metric | Count | % of 2936 |
|--------|-------|-----------|
| Total flashcards | 2936 | 100% |
| Has `pie_root` | 2057 | 70% |
| No `pie_root` | 879 | 30% |
| Has `pie_ipa` | 2053 | 70% |
| No `pie_ipa` | 883 | 30% |
| Has `pie_audio_url` | 355 | 12% |
| No `pie_audio_url` | 2581 | **88%** |
| Has `efg_node_id` | 2146 | 73% |
| No `efg_node_id` | 790 | 27% |
| Has `etymology` text | 2632 | 90% |
| Has `english_cognates` text | 2212 | 75% |
| `flashcard_pie_roots` rows | 2922 | 99.5% |
| `etymology_layer` filled | **0** | **0%** |
| Sentence-type cards | 250 | 9% |
| `gender` filled | **0** | **0% (dead column)** |

**SF by language (no PIE root):**

| Language | Total Cards | No `pie_root` |
|----------|-------------|----------------|
| Greek | 1540 | 432 (28%) |
| French | 616 | 120 (19%) |
| English | 441 | 178 (40%) |
| Spanish | 150 | 44 (29%) |
| Italian | 74 | 27 (36%) |
| German | 69 | 43 (62%) |
| Portuguese | 46 | 35 (76%) |
| **TOTAL** | **2936** | **879 (30%)** |

**EtymologyGraph DB:**

| Metric | Count |
|--------|-------|
| Total nodes | 3290 |
| Word nodes | 2233 |
| PIE root nodes | 1057 |
| `efg_pie_explorer_data` rows | 992 |
| PIE root nodes with `pie_ipa` | 1005 (95%) |
| PIE root nodes without `pie_ipa` | **52 (5%)** |
| PIE root nodes without `pie_audio_url` | **52 (5%)** |
| Total edges | 2111 |

**Etymython DB:**

| Metric | Count |
|--------|-------|
| Mythological figures | 183 |
| Figures with `ipa_transcription` | 70 (38%) |
| Figures without `ipa_transcription` | **113 (62%)** |
| Figures with `pronunciation_audio_url` | 72 (39%) |
| Figures without `pronunciation_audio_url` | **111 (61%)** |
| Figures with `origin_story` | 173 (95%) |
| Etymologies | 227 |
| English cognates | 560 |
| Cognates with `pie_root` | 519 (93%) |
| Cognates without `pie_root` | 41 (7%) |
| Cognates without `pie_audio_url` | **286 (51%)** |
| Fun facts | 1012 |
| Perseus citations | 183 |

### G3. Three-Bucket No-PIE Classification (879 SF cards)

Based on 20-card random sample (NEWID() draw):

| Bucket | Estimated Count | % | Sample Words |
|--------|----------------|---|--------------|
| **Backfill-pending** (PIE root exists, needs research + data entry) | ~440 | ~50% | χειμών (*ghei-), στέρνον (*ster-), οὔτε (*ne-kwi-), ἀποστέλλω (*stel-), autrement (*al-), Guten Appetit (*pet-) |
| **Genuinely non-PIE** (proper nouns, alphabet letters, modern coinages, loanwords) | ~308 | ~35% | Ξ ξ, Τ τ (letters), Bacchic, titanic, martialist, Cassandraism (mythonym-derived), verschlimmbessern (modern coinage), le bac (abbreviation) |
| **Genuinely uncertain** (Pre-Greek substrate, borrowed roots, unclear etymology) | ~131 | ~15% | καθαρός (Pre-Greek candidate), λόφος (possible substrate), le tête-à-tête (Latin borrowing path unclear) |

> **Action signal:** ~440 backfill-pending cards are actionable AI-heal targets. ~308 genuinely non-PIE cards should be flagged with a `non_pie_reason` field (does not exist yet).

---

## Cross-Cutting: Integration Surfaces

Complete map of all cross-app calls as of BWTL01.

| From | To | Protocol | Auth | Endpoint | Direction |
|------|----|----------|------|----------|-----------|
| SF frontend (app.js) | EM | HTTPS GET | none | `/api/v1/cognates/lookup?word={word}` | SF → EM |
| SF backend (video.py) | ArtForge | HTTPS POST | X-API-Key | `/api/external/generate-video` | SF → AF |
| SF backend (video.py) | ArtForge | HTTPS GET | x-api-key | `/api/external/jobs/{job_id}` | SF → AF |
| SF backend (dcc.py) | EFG | HTTPS GET | none | `/api/words?include_dcc=true` | SF → EFG |
| SF backend (dcc.py) | Portfolio RAG | HTTPS GET | none | `/search` | SF → RAG |
| SF backend (efg.py) | EFG DB | pymssql direct | DB credentials | `EtymologyGraph.dbo.*` | SF → EFG DB |
| EFG frontend (index.html) | SF | iframe embed | none | `learn.rentyourcio.com/?cardId={UUID}` | EFG → SF |
| EFG backend | Portfolio RAG | HTTPS POST | none | `/rag-query` | EFG → RAG |
| EM backend (artforge_client.py) | ArtForge | HTTPS POST | X-API-Key | `/api/v1/stories/from-figure` | EM → AF |
| EM backend | Portfolio RAG | HTTPS | none | `portfolio-rag-57478301787` | EM → RAG |
| EM (URL only, no HTTP call) | EFG | URL link | n/a | `efg.rentyourcio.com?search={root}` | EM → EFG |
| ArtForge | EM | HTTPS GET | none/X-API-Key | `/api/v1/figures/{id}/mythology-data` | AF → EM |

**Absent integrations (no connection exists):**
- EFG ↔ EM (no direct API call; only shared domain overlap)
- SF PIE Panel ↔ EFG PIE Panel (completely separate implementations)
- EM → EFG (URL link only, not an API call)

---

## Cross-Cutting: 16 AI-Healable Field Map

Fields that are missing data and could be filled by AI without human review, ordered by impact.

| # | Field | App | Table.Column | Total Rows | Missing | Fill % | Gap Type | In-Flight Req |
|---|-------|-----|-------------|-----------|---------|--------|----------|---------------|
| 1 | PIE audio URL | SF | `flashcards.pie_audio_url` | 2936 | 2581 | **12%** | TTS generation needed | TSK-001 (cc_executing) |
| 2 | EM figure IPA | EM | `mythological_figures.ipa_transcription` | 183 | 113 | 38% | AI IPA needed | none |
| 3 | EM figure audio | EM | `mythological_figures.pronunciation_audio_url` | 183 | 111 | 39% | TTS generation needed | none |
| 4 | EM cognate PIE audio | EM | `english_cognates.pie_audio_url` | 560 | 286 | **49%** | TTS generation needed | none |
| 5 | EFG node PIE IPA | EFG | `nodes.pie_ipa` (pie_root type only) | 1057 | 52 | 95% | AI IPA needed | REQ-011 (cai_designing) |
| 6 | EFG node PIE audio | EFG | `nodes.pie_audio_url` (pie_root type only) | 1057 | 52 | 95% | TTS generation needed | REQ-011 (cai_designing) |
| 7 | SF etymology text | SF | `flashcards.etymology` | 2936 | 304 | 90% | AI text generation | none |
| 8 | SF english_cognates | SF | `flashcards.english_cognates` | 2936 | 724 | 75% | AI text generation | none |
| 9 | SF pie_root | SF | `flashcards.pie_root` | 2936 | 879 | 70% | Research + AI | TSK-008 (req_created) |
| 10 | SF pie_ipa | SF | `flashcards.pie_ipa` | 2936 | 883 | 70% | AI IPA generation | TSK-001 (cc_executing) |
| 11 | EM cognate PIE root | EM | `english_cognates.pie_root` | 560 | 41 | 93% | Research + AI | none |
| 12 | EM origin_story | EM | `mythological_figures.origin_story` | 183 | 10 | 95% | AI text generation | none |
| 13 | EM etymology notes | EM | `etymologies.notes` | 227 | unknown | unknown | AI scholarly notes | none |
| 14 | etymology_layer | SF | `flashcard_pie_roots.etymology_layer` | 2922 | 2922 | **0%** | Column exists, never populated | REQ-008 (req_created) |
| 15 | SF EFG node link | SF | `flashcards.efg_node_id` | 2936 | 790 | 73% | Node lookup/create | REQ-015 (cc_executing) |
| 16 | EFG → SF URL | EFG | `nodes.sf_url` (word type) | 2233 | ~87 | 96% | SF card lookup + write | REQ-015 (cc_executing) |

**Highest-priority AI batch jobs:**
1. SF `pie_audio_url`: 2581 missing → TTS pipeline exists (TSK-001 cc_executing)
2. EM figure audio: 111 missing → no in-flight requirement
3. EM cognate PIE audio: 286 missing → no in-flight requirement
4. `etymology_layer`: 2922 rows, 0% filled → REQ-008 req_created (blocked on schema decision)

---

## Cross-Cutting: Missing Capabilities

Gaps in the current integration surface that will affect UI/UX design.

| Gap | Apps Affected | Severity | Notes |
|-----|---------------|----------|-------|
| Cross-app PIE join API | SF, EFG | **High** | No endpoint combines SF word branches + EFG verbal_paradigm. SF PIE Panel and EFG PIE Panel are siloed. |
| SF PIE Panel reads flashcards only | SF | **High** | Does not query `flashcard_pie_roots` or EFG `efg_pie_explorer_data`. BUG-045 (req_created). |
| `etymology_layer` all NULL | SF | **High** | 2922 junction rows, 0 filled. REQ-008 req_created. UI can't distinguish primary/secondary PIE roots. |
| PIE audio 88% missing | SF | **High** | TSK-001 cc_executing. UI must handle missing audio gracefully. |
| EM figure IPA/audio 62%/61% missing | EM | Medium | No in-flight requirement. EM pronunciation UI will have sparse coverage. |
| EM ↔ EFG — no API link | EM, EFG | Medium | EFG has no EM endpoint; EM generates only URL links to EFG. No machine-readable cross-reference. |
| `cognate_greek_roots` 2 rows | EM | Low | Table virtually unused; may be dead schema. |
| `flashcards.gender` all NULL | SF | Low | Dead column (2936/2936 NULL). Should be removed or populated. |
| RAG etymology collection underused | RAG, EM | Medium | Beekes content in RAG `etymology` collection but no EM endpoint consumes it. |
| EFG → EM: no reverse lookup | EFG, EM | Medium | EFG has no way to identify which EM figure corresponds to a given PIE root node. |
| EM `cognate_greek_roots` 2 rows | EM | Low | Effectively unused; may conflict with `etymology_cognates` schema. |
| No `non_pie_reason` field | SF | Medium | ~308 genuinely non-PIE cards have no flag. UI cannot distinguish "no PIE" vs "not applicable." |
| 65 EFG PIE nodes with no explorer data | EFG | Low | 1057 PIE root nodes; only 992 have `efg_pie_explorer_data` entries. |
| SF Panel reads `flashcards.pie_root` not junction table | SF | High | `flashcard_pie_roots` has 2922 rows supporting multi-root but PIE Explorer endpoint ignores them. |

---

## Cross-Cutting: Shared Data Audit (Chat-Anchor Questions)

These questions require a designer or engineer decision before BWTL UI work can begin.

**Q1 — PIE Root String Format Consistency**  
`SF.flashcards.pie_root`, `EFG.nodes.pie_root`, `EM.english_cognates.pie_root` — are these consistent format strings? (e.g. `*h₂ep-` vs `h₂ep` vs `H2EP`?)  
→ Needs SQL string comparison: `SELECT DISTINCT pie_root FROM flashcards ORDER BY pie_root` vs `SELECT DISTINCT pie_root FROM EtymologyGraph.dbo.nodes ORDER BY pie_root`.  
→ **If inconsistent: no reliable cross-app join on PIE root string is possible.**

**Q2 — EFG Node ID Reliability Post-Migration**  
SF `flashcards.efg_node_id` = `"dcc_42"` ↔ EFG `nodes.id` = `"dcc_42"`. 790 SF cards have NULL `efg_node_id`.  
→ Are IDs stable after EFG's SQL migration (EFG04-STATS-SEC-001)? Are new nodes using different ID formats?

**Q3 — EM ↔ EFG Vocabulary Overlap**  
`EFG.nodes.label` (Greek words) ≈ `EM.etymologies.greek_root`. No formal FK join exists.  
→ Is there an intended join? Should `EM.etymologies.efg_node_id` be created?

**Q4 — SF PIE Panel vs EFG PIE Panel: Design Intent**  
SF Panel: word-centric (which SF cards share this root).  
EFG Panel: root-centric (verbal paradigm, nominal derivatives, modern cognates).  
→ Design question: should these be **two tabs of one modal**, or **two separate views**? Currently there is no API that combines them.

**Q5 — `flashcard_pie_roots` vs `flashcards.pie_root` Sync**  
`flashcards.pie_root`: 2057 non-null entries.  
`flashcard_pie_roots`: 2922 rows.  
→ These differ by 865 rows. The junction table has more rows (multi-root support) but also some cards may be in junction table without matching the direct column. Is `flashcards.pie_root` kept in sync with `flashcard_pie_roots`?

**Q6 — Unified PIE IPA Audio Source**  
SF `flashcards.pie_audio_url` (12% filled) vs EFG `nodes.pie_audio_url` (95% filled for PIE root nodes).  
→ Can SF's PIE Explorer panel fall back to EFG's audio when `flashcards.pie_audio_url` is NULL? This would effectively increase SF PIE audio coverage from 12% → near 95% for cards that have an `efg_node_id`.

---

*Document generated by BWTL01 sprint (CAI). Sources: live SQL queries, static code analysis, MetaPM requirements list. All data as of 2026-05-15.*
