# BWTL Unified — Functionality Inventory

**Document purpose** — every user-facing surface in the proposed unified app, paired with the BWTL01 inventory rows (endpoints, tables, columns) it depends on. Use this side-by-side with `bwtl01_integration_inventory.md` to find gaps. Status values for reconciliation: **COVERED** · **CONSOLIDATED** · **DEPRECATED** · **GAP**.

**Conventions**
- "Hits" = backend endpoint or DB the surface reads/writes when wired to production.
- "Writes back to" = the original-app table that receives the write.
- "Source" = whether the data is rendered from SF / EFG / EM / RAG / AF.
- Role gates: PL = full · Theo = instructor · Tutor = own content · Learner = read-only.

---

## Top-level navigation

```
[ Study | Library | Generate | Bookmarks | Theodoros* | Admin** | Settings ]
                                            * PL + Theo only
                                            ** PL only
```

| Top-nav item | Sub-views | Purpose |
|---|---|---|
| **Study** | Today's queue, Word study, Pronunciation, Shadowing | SRS + everyday review. Front door. |
| **Library** | Cards · PIE roots · Figures · Beekes · DCC | Browse the five datasets, search, filter. |
| **Generate** | Jobs · From word · From figure · Scene editor · Enrich story | ArtForge etymology-only surface. |
| **Bookmarks** | (filter chips: words / roots / figures / threads / collections) | Cross-app polymorphic primitive. |
| **Theodoros** | Review queue (current); planned: Author, Batch ops | Instructor review + direct authoring. |
| **Admin** | Data health · Batch jobs · Document import · EFG editor · RAG console | PL admin surface. |
| **Settings** | Identity · Voices · Source apps · Data health snapshot | Identity, audio, deep-links out. |

Persistent chrome:
- Universal search (⌘K) — queries across SF flashcards + EFG nodes + EM figures + RAG Beekes
- Role chip (top right) — switcher for prototype demo; in prod reads `SF.users.role_tier`
- "+ New card" button — opens NewCardSheet
- Bookmark count badge

---

## 1 · Study

### 1.1 — Today's queue (`section=study sub=queue`)

| Element | Hits | Writes back |
|---|---|---|
| Progress bar (8 dots = 8 cards in session) | `SF.study_sessions` | — |
| Card row (rank, word, IPA, definition, language, last grade, due, interval, reps) | `GET /api/study/next`, `SF.flashcards`, SRS state | — |
| Streak pill (21-day) | `SF.study_sessions` aggregate | — |
| "Study" button → opens Word study sub-view | — | — |
| This-week stats (reviewed, % good or better, new, marked hard) | `SF.study_sessions` aggregate | — |

**Inventory rows hit:** `/api/study/*` · `SF.study_sessions` · `SF.flashcards.*`

### 1.2 — Word study (`section=study sub=card`) — the workspace

Three-zone layout: word card (center) · right rail panel stack · chat dock (bottom).

#### 1.2.1 Word card (center)

| Region | Source | AI edit available | Notes |
|---|---|---|---|
| Hero image | `SF.flashcards.image_url` | yes (spark on hover) → `POST /api/external/generate-video → image` (AF flux-pro) | placeholder when null |
| Word + language + POS | `SF.flashcards.word_or_phrase`, `.language`, `card_type` | no | |
| IPA | `SF.flashcards.ipa_pronunciation` (or PIE) | yes → `POST /api/v1/pronunciation/generate` | speaker button plays `audio_url` |
| Audio button | `SF.flashcards.audio_url` (47% missing) | yes → `POST /api/audio/tts` | TTS fallback if null |
| Definition | `SF.flashcards.definition` | no | |
| Bookmark toggle | bookmarks table | toggles `bookmarks.flashcard_id` | persists |
| Etymology (layered rows: French → Latin → PIE) | `SF.flashcards.etymology`, `SF.flashcard_pie_roots.etymology_layer` | yes (per-layer + PIE root spark) → `POST /api/ai/generate` | **GAP**: etymology_layer 0% filled (REQ-008) |
| Cognates strip | `SF.flashcards.english_cognates`, `SF.flashcards.related_words`, `EM.english_cognates` via `/api/v1/cognates/lookup` | yes → `POST /api/ai/generate` | false-cognate flag visible |
| Fun-facts list | `EM.fun_facts` (1012 rows) | yes → `POST /api/ai/generate` | figure-linked facts get EM xlink |
| RAG hint row | `RAG /search/etymology` | no | clicking opens RAG panel |

#### 1.2.2 Right rail — panel stack

| Panel | Source | Glow trigger | Key fields |
|---|---|---|---|
| **PIE Explorer (unified)** | `SF.flashcards WHERE pie_root=X` + `EFG.efg_pie_explorer_data` + `EFG.nodes` | PIE-root xlink in card | Root hero (label, gloss, IPA, audio) · atomic decomposition for compound roots · word-branches strip · verbal_paradigm · nominal_derivatives · modern_cognates |
| **Etymology Graph** | `EFG.nodes + EFG.edges` filtered by PIE root | "Open full graph" chip | Mini radial graph · siblings clickable to navigate |
| **Etymython figure** | `EM.mythological_figures.*` + `EM.figure_relationships` + `EM.fun_facts` | Figure-name xlink in fun fact | Hero image · Greek+Latin+English names · IPA + audio · origin_story · relations (parent_of, spouse_of, equivalent) · Generate imagery / From-figure storyboard buttons |
| **Portfolio RAG** | `RAG /rag-query` etymology collection | "Beekes EDPIE" xlink | Headword · Beekes page ref · excerpt · confidence pill |
| **ArtForge** | `AF /api/external/generate-video`, `AF /api/external/jobs/{id}` | "Generate video" button | 3-scene storyboard tiles · generate / scene-editor / job status |

Each panel has: collapse · pin · close. Closed panels can be reopened from a rail drawer (not yet rendered in prototype).

#### 1.2.3 AI Chat sidecar (bottom dock)

| Element | Hits | Notes |
|---|---|---|
| Anchor chip | `pie_root` primary, `flashcard_id` fallback | Chat persists across cards sharing the same root |
| Thread count pill ("3 threads · last: 2026-05-12") | `chat_threads` table (**NEW**, GAP) | Visible even when dock collapsed |
| Thread rail (grouped by month) | `chat_threads.title`, `chat_threads.when` | Click switches active thread |
| Messages (you / ai bubbles) | `chat_messages.role`, `.text` | Markdown-light |
| "Promote to card" bar on AI messages | Routes to `review_items` (NEW, GAP) | PL/Theo auto-apply, others suggest |
| Compose box + prompt chips (fun fact? · conjugation · false cognate · linked figures) | `window.claude.complete` / `POST /api/ai/chat` (NEW) | — |

### 1.3 — Pronunciation (`section=study sub=pronunciation`)

| Element | Hits | Writes |
|---|---|---|
| Reference word + IPA + "Hear reference (Eleni voice)" | `SF.flashcards`, `SF.UserVoiceClones` | — |
| Record button → live waveform | browser MediaRecorder API | — |
| Score panel: overall + per-phoneme alignment with annotations | `POST /api/v1/pronunciation/score` | `SF.PronunciationAttempts`, `SF.PronunciationDebugLogs` |
| Scoreboard footer (last 5 attempts average) | `vw_UserPronunciationProgress` | — |

### 1.4 — Shadowing (`section=study sub=shadowing`)

| Element | Hits | Writes |
|---|---|---|
| Passage panel (Greek text + English crib) | passage library (currently in-memory; GAP — needs `SF.shadowing_passages` table) | — |
| Play & shadow controls + speed selector | browser audio + `SF.UserVoiceClones` | — |
| 3-panel comparison (reference · your shadow · alignment) | local audio + alignment service | `SF.shadowing_sessions` |
| Highlighted token (Μνημοσύνη) | parser-aligned | — |

---

## 2 · Library

Five-tab browse over the five datasets.

### 2.1 — Cards
| | |
|---|---|
| Filters | All / by language (Greek 1540 · French 616 · English 441 · Spanish 150 · Italian 74 · German 69 · Portuguese 46) |
| Search | client-side over word + definition (prod: `SF` search endpoint) |
| Card tile shows | language pill, POS, word, IPA, definition, PIE root pill, figure pill (if linked), video pill (if generated), cognate count |
| Click | navigates to Word study for that card |

**Reads:** `SF.flashcards` (full table)

### 2.2 — PIE roots
| | |
|---|---|
| Header pills | 1057 nodes · 992 with explorer data (94%) · 65 missing · 52 missing IPA/audio (REQ-011) |
| Root tile | label, IPA, audio button, gloss, card count, compound flag, modern-cognates preview |
| Click | opens PIE root focus view (not yet built — GAP) |

**Reads:** `EFG.nodes` (pie_root type) · `EFG.efg_pie_explorer_data`

### 2.3 — Figures
| | |
|---|---|
| Header pills | 183 figures · 113 missing IPA · 111 missing audio · 173 with origin_story (95%) |
| Figure tile | image placeholder, English + Greek names, domain, type pill, PIE root pill, "no audio" pill if missing |
| Click | opens Etymython panel for figure |

**Reads:** `EM.mythological_figures`

### 2.4 — Beekes
| | |
|---|---|
| Header pills | 1840 docs in RAG `etymology` collection · queried via `/search /semantic /query` |
| Doc row | headword (display font), Beekes page reference, excerpt prose, "Read full" button |

**Reads:** RAG `etymology` collection

### 2.5 — DCC
| | |
|---|---|
| Header pills | 2086 entries · ranked by frequency · enriched via SF dcc.py + RAG |
| Table columns | rank, word, gloss, POS, PIE root, freq/10k, "linked" pill or "Create card" CTA for unlinked |

**Reads:** EFG `?include_dcc=true` enriched with RAG · `SF.flashcards.dcc_frequency_rank` join

---

## 3 · Generate (ArtForge etymology-only)

Top of page: "Open standalone ArtForge" link → `artforge.rentyourcio.com`

### 3.1 — Jobs
| | |
|---|---|
| Header pills | done count · active count · failed count |
| Row | status pill (queued / rendering / done / failed), kind (word_video / from_figure / image / enrich), subject, source endpoint, model, scenes, started/eta/duration, progress bar (while rendering), job_id, actions (play / retry / more) |

**Reads:** `AF /api/external/jobs/{id}` poll list

### 3.2 — From word
| | |
|---|---|
| Subject card | current word + change-subject button |
| Style picker | classical (Hesiodic), symbolic/minimal, photoreal, animated diagram |
| Length | 3 / 5 / 7 scenes |
| Embed etymology checkboxes | PIE root visually · IPA narration · cognate side-card sequence |
| Will-hit note | `POST artforge /api/external/generate-video` with embedded `*men-` context · `GET /api/external/jobs/{id}` poll · result stored in `SF.flashcards.video_url` |
| CTAs | Scene editor first · Generate |

### 3.3 — From figure
Grid of mythological figures (image placeholder, English + Greek name, "Generate story" CTA per tile).

**Hits:** `EM /api/v1/figures/{id}/artforge-story` → `AF /api/v1/stories/from-figure`

### 3.4 — Scene editor
Per-scene rows: preview thumbnail · scene title + prompt + voiceover script · model selector · regenerate / re-roll / more.

### 3.5 — Enrich story
Suggested embeds from EM fun_facts + EFG explorer data with confidence; per-row accept/reject.

**Hits:** `POST /api/stories/{id}/enrich`, `GET /api/stories/{id}/etymology-suggestions`

---

## 4 · Bookmarks

One polymorphic primitive: `word`, `pie_root`, `figure`, `thread`, `collection`. Filtered by kind chips; grouped by date (today / this week / last week).

Per-kind card affordances:
- `word` → opens Word study
- `pie_root` → opens Library · PIE roots focused
- `figure` → opens Etymython panel
- `thread` → opens Chat dock to that thread
- `collection` → opens nested view of bookmarked entities (used by Theo for class prep)

**Reads/writes:** `bookmarks` table (**NEW** — GAP per BWTL01 cross-cutting)

---

## 5 · Theodoros (instructor review)

Currently a single Review-queue tab; planned to expand to Author + Batch tabs.

### 5.1 — Review queue
Four stat cards at top: Awaiting review · PL-promoted from chat (this week) · AI batch jobs · Cards marked for class.

Two-pane: queue list (filterable by ai_correction / pie_backfill / fun_fact / figure_audio) + active item diff view.

Per item: confidence pill, type, target card/figure, target field, proposed_by, BEFORE / PROPOSED diff, "why suggested" reason, source pill, anchor pill, writes-to pill, Accept / Refine / Reject buttons.

**Writes back to:** the original app's table via its own endpoint.

| Queue source | Mechanism |
|---|---|
| AI corrections (chat-promoted) | `chat_messages.promotable=true` + user clicks Promote |
| AI corrections (re-run disagreements) | scheduled `POST /api/ai/generate` runs flagged for review when confidence < threshold |
| PIE backfill | `POST /api/admin/repair-pie-batch` proposals |
| Figure audio | `EM` ElevenLabs batch + Theodoros voice-quality approval |
| EFG node create/link | `REQ-015` cross-portfolio audit results |

### 5.2 — (planned) Author
Direct card / figure / connection creation. Tutors limited to their own; Theo + PL unrestricted.

**Hits:** `POST /api/flashcards`, `POST /api/v1/figures`, `POST efg /api/nodes`, `POST efg /api/edges`.

### 5.3 — (planned) Batch ops
Surfaces visible at Admin · Batch jobs are also exposed here for Theo.

---

## 6 · Admin (PL only)

### 6.1 — Data health
- App summary cards (SF 2936 cards · EFG 3290 nodes · EM 183 figures · RAG 7536 docs across 5 collections)
- 16 AI-healable fields table with live coverage, missing count, in-flight requirement, severity. Dead columns (`SF.flashcards.gender`, `EM.cognate_greek_roots`) shown struck-through.

### 6.2 — Batch jobs
TSK-001 (PIE audio backfill), TSK-008 (76 residual PIE mismatches), REQ-011 (EFG PIE audio), REQ-015 (cross-portfolio PIE audit), EM-AUDIO (figure ElevenLabs), EM-IPA, REQ-008 (etymology_layer write-back). Per-job: ID, title, target column, rows total / done / progress %, status.

### 6.3 — Document import
- Paste-text pane → `POST /api/document/parse`
- Drop-zone PDF upload → same endpoint
- Recent imports table (source, kind icon, approved/extracted, status pill, when, Review button)

### 6.4 — EFG editor (PL only)
- 4 stat cards (nodes / edges / SF-linked / explorer-data coverage)
- "Open graph editor" button → standalone `efg.rentyourcio.com`
- Recent node operations log: POST / PATCH / DELETE, node_id, field, old → new, when, who

**Hits:** `POST /api/nodes`, `PATCH /api/nodes/{id}`, `DELETE /api/nodes/{id}`, `POST /api/edges`, `DELETE /api/edges/{id}`

### 6.5 — RAG console (PL only)
- 3 stat cards (collections / total docs / last ingest)
- Collections table: name, docs, size, consumer, status, last_ingest, reingest button (deprecated `code` collection grayed out)
- Test query box: query input + collection selector → `POST /query /semantic /mcp`

**Hits:** `POST /admin/reingest`, `POST /ingest/*`, `POST /query`, `POST /semantic`, `POST /mcp`

---

## 7 · Settings

| Section | Content |
|---|---|
| Identity | Current role + sub-role + role-matrix link |
| Audio voices | Voice clones list (Eleni, Marcus, Theodoros, PL-draft) · "Manage voice clones" → `SF /api/v1/voice_clone/*` |
| Source apps | Deep-links: ArtForge (full), EFG graph editor, Etymython admin, Portfolio RAG console — each with URL, purpose, Open button |
| Data health snapshot | Top-5 most-missing field bars w/ progress + target marker |

---

## 8 · Cross-cutting elements

### 8.1 — Universal search (⌘K)
Federated query over `SF.flashcards.word_or_phrase`, `EFG.nodes.label`, `EM.mythological_figures.{greek,latin,english}_name`, RAG `etymology` collection. Result categories with source pills (SF / EFG / EM / RAG).

### 8.2 — Cross-app drill-down (xlinks)
Inline tokens in any prose body get a tinted background + source pill (PIE / EM / RAG / WORD). Clicking:
1. Opens the matching panel in the right rail if closed
2. Glows it for 1.4s in the panel's accent color
3. Updates chat anchor if relevant (e.g. PIE root click pulls chat threads for that root)

### 8.3 — AI edit per field
Every editable card field has a small spark button. Popover shows the exact endpoint, model, last-run time, average ms, optional steering prompt. On generate: diff render → Apply / Send-to-review / Re-roll. Non-admin roles see "Send to review" instead of "Apply".

### 8.4 — Toast notifications
Bottom-right ephemeral confirmation (e.g. "Promoted to review queue · fc_memoire → fun_facts").

### 8.5 — Tweaks panel
User-facing knobs: density, rail width, rail visibility, chat dock position, xlink style, panel glow on/off, source tags on xlinks, accent color, theme, etymology layout (layered / narrative / tree), fun-fact density (stacked / carousel).

---

## 9 · Permission matrix

| Capability | PL | Theo | Tutor | Learner |
|---|---|---|---|---|
| Read all surfaces | ✓ | ✓ | ✓ | ✓ |
| Personal bookmarks | ✓ | ✓ | ✓ | ✓ |
| Personal AI chat threads | ✓ | ✓ | ✓ | ✓ |
| Shared threads on a root | ✓ | ✓ | ✓ | read-only |
| Create flashcard directly | ✓ | ✓ | ✓ | ✗ |
| Edit any flashcard | ✓ | ✓ | own only | ✗ |
| Promote chat insight | auto-apply | auto-apply | suggest | suggest |
| Approve AI correction | ✓ | ✓ | ✗ | ✗ |
| Create EM figure | ✓ | ✓ | ✗ | ✗ |
| Trigger AF generation | ✓ | ✓ | ✓ | ✗ |
| Edit EFG node / edge | ✓ | ✗ | ✗ | ✗ |
| Run batch jobs | ✓ | ✗ | ✗ | ✗ |
| RAG ingestion | ✓ | ✗ | ✗ | ✗ |
| Document import | ✓ | ✓ | ✗ | ✗ |
| Theodoros tab visible | ✓ | ✓ | ✗ | ✗ |
| Admin tab visible | ✓ | ✗ | ✗ | ✗ |

---

## 10 · BWTL01 inventory mapping (compact)

Status legend: ● COVERED · ◐ CONSOLIDATED · ✕ DEPRECATED · ○ GAP

### Section A — Super Flashcards
- `POST /api/flashcards` (create) — ● New card sheet
- `GET/PUT/DELETE /api/flashcards/{id}` — ● Word study, AI edit per field
- `GET /api/flashcards/pie-explorer/{pie_root}` — ◐ Unified PIE panel (needs SF+EFG merge — ○ implementation gap, see BWTL02 finding)
- `POST /api/ai/ai_generate` — ● AI edit popover, New card sheet
- `POST /api/ai/batch_ai_generate` — ● Admin · Batch jobs
- `GET /api/ai/batch-progress` — ● Admin · Batch jobs
- `GET /api/languages` — ● Library filters, New card sheet
- `GET /api/users` — ● Settings · Identity
- `POST /api/audio/tts` — ● AI edit (audio), Pronunciation reference
- `POST /api/v1/pronunciation/*` — ● Pronunciation sub-view
- `POST /api/v1/voice_clone/*` — ● Settings · Audio voices
- `GET /api/v1/cards/{id}/dcc` — ● Library · DCC tab
- `GET/POST /api/study/*` — ● Today's queue
- `POST /api/shadowing/*` — ● Shadowing sub-view
- `POST /api/document/parse` — ● Admin · Document import
- `POST /api/flashcards/{id}/generate-video` — ● ArtForge panel + Generate · From word
- `GET /api/flashcards/{id}/video-status` — ● Generate · Jobs (poll)
- `POST /api/admin/repair-pie-*` — ◐ Theodoros review queue (pie_backfill type) + Admin · Batch jobs
- `POST /api/efg/backfill-pie-*` — ◐ Admin · Batch jobs (TSK-001)
- `/api/v0/dcc.py` — ✕ Deprecated path
- `flashcards.gender` (0%) — ✕ Dead column
- iframe SF in EFG — ✕ Replaced by intra-shell xlink

### Section B — EFG
- `GET /api/graph` — ● Library · PIE roots, EFG panel (mini), Admin · EFG editor link
- `GET /api/words` `?include_dcc=true` — ● Library · DCC tab, SF dcc.py enrichment
- `GET /api/roots` — ● Library · PIE roots
- `GET /api/nodes/{id}`, `PATCH /api/nodes/{id}`, `DELETE`, `POST /api/nodes` — ● Admin · EFG editor
- `POST /api/edges`, `DELETE /api/edges/{id}` — ● Admin · EFG editor
- `GET /api/search` — ● Universal search (⌘K)
- `GET /api/admin/stats`, `/api/stats`, `/api/dcc/stats` — ● Admin · Data health
- `POST /api/pie-explorer/generate/{root}` — ◐ Admin · Batch jobs (65-root backfill)
- `POST /api/pie-explorer/{root}` — ● Unified PIE panel
- `POST /rag-query`, `GET /api/rag/search` — ◐ RAG panel
- `GET /api/dictionary/search` (Beekes) — ◐ Library · Beekes tab
- 65 EFG roots missing explorer data — ○ Admin · Batch job tracker
- 52 EFG roots missing IPA/audio (REQ-011) — ○ Admin · Batch job tracker

### Section C — Etymython
- `GET/POST /api/v1/figures` — ● Library · Figures, Etymython panel
- `GET /api/v1/figures/{id}/mythology-data` — ● AF from-figure pipeline (service)
- `GET /api/v1/figures/{id}/cognates-with-links` — ● Etymython panel relations
- `GET /api/v1/cognates/lookup` — ● Word card cognates strip
- `POST /api/v1/figures/{id}/artforge-story` — ● Generate · From figure
- `POST /api/v1/admin/migrate-sf-links` — ◐ Admin · Batch jobs
- audio router — ● Etymython panel audio button + Theodoros · figure_audio queue
- image_gen router — ● Generate · From figure
- `EM.mythological_figures.ipa/audio` (38%/39%) — ○ Admin · Batch jobs + Theodoros queue
- `EM.fun_facts` (1012) — ● Word card · Fun facts
- `EM.figure_relationships` — ● Etymython panel · Relations
- `EM.perseus_citations` — ○ Etymython panel · Sources footer (not yet rendered)
- `EM.cognate_greek_roots` (2 rows) — ✕ Dead table

### Section D — Portfolio RAG
- `POST /query`, `/semantic`, `/search`, `/search/etymology` — ● Universal search + RAG panel + Admin · RAG console test
- `GET /document/{repo}/{path}` — ● Library · Beekes tab "Read full"
- `POST /mcp` — ● Service-to-service only (AI agents)
- `POST /ingest/*` — ● Admin · RAG console
- `GET /api/coverage*` — ● Admin · Data health
- `code` collection — ✕ Deprecated

### Section E — PIE Explorer (cross-app feature)
- SF PIE Panel response — ◐ Merged into unified PIE panel
- EFG PIE Panel response — ◐ Merged into unified PIE panel
- Cross-app join — ○ **HIGH-PRIORITY GAP** — unified panel needs backend merge query (see BWTL02)
- `flashcard_pie_roots` not queried — ○ Will be queried by unified endpoint
- BUG-045 (stale modal) — ○ Closed by single-endpoint design

### Section F — ArtForge (integration endpoints only)
- `POST /api/external/generate-video` — ● ArtForge panel + Generate · From word
- `GET /api/external/jobs/{id}` — ● Generate · Jobs
- `POST /api/v1/stories/from-figure` — ● Generate · From figure
- `POST /api/stories/{id}/enrich` — ● Generate · Enrich
- `GET /api/stories/{id}/etymology-suggestions` — ● Generate · Enrich (suggestions list)
- AF galleries / library / non-etymology — ◐ Out of scope; deep-link to standalone
- `GET /api/v1/mythology/figures` (internal) — ● Service-to-service only

### Cross-cutting new primitives
- **Chat threads anchored to pie_root / flashcard_id** — ○ NEW table `chat_threads`
- **Chat messages** — ○ NEW table `chat_messages` with `promotable JSON` field
- **Polymorphic bookmarks** — ○ NEW table `bookmarks` with `(kind, ref_id, owner_id)`
- **Bookmark collections** — ○ NEW table `bookmark_collections`
- **Role tier** — ○ NEW column `SF.users.role_tier` (pl|theo|tutor|learner)
- **Non-pie reason** — ○ NEW column `SF.flashcards.non_pie_reason`
- **Etymology layer write-back** (REQ-008) — ○ Existing column `flashcard_pie_roots.etymology_layer` is 0% filled; needs population pipeline
- **Cross-app PIE join** (BWTL02) — ○ Unified `GET /api/flashcards/pie-explorer/{root}` must merge `EFG.efg_pie_explorer_data`

---

## 11 · Surfaces explicitly NOT built (outside scope or future)

| Surface | Why excluded |
|---|---|
| ArtForge galleries / non-etymology projects | Lives at standalone `artforge.rentyourcio.com`; sibling project handles it |
| EFG full graph editor UI | Deep-link out; admin only |
| Etymython figure CMS | Deep-link out; Theo uses Authoring (planned) instead |
| MCP protocol UI | Service-to-service only, no user surface |
| Word-family standalone explorer | Folded into Library · Cards filter + Word study related_words section |
| Voice-clone training UI | Settings link out; ElevenLabs handles the actual recording flow |
| Multi-user collaboration / sharing UI | Brief: "semi-private, no scaling design" — out of scope |
| Public onboarding | Brief: "NOT a public product" |
| Content moderation | Same — out of scope |

---

## 12 · How to reconcile

For each row in `bwtl01_integration_inventory.md`:
1. Locate the matching surface in §1–§7 above
2. Read the "Hits" and "Writes back" columns
3. Compare against the inventory's actual endpoint signature and table columns
4. Flag mismatches:
   - **Endpoint signature differs** → design needs adjustment
   - **Required field not in design** → design GAP
   - **Field in design but not in inventory** → design over-reaches OR backend gap
   - **Surface entirely missing** → design GAP

Then for each GAP marker in §10:
1. Confirm it's still a gap (some may have been built since BWTL01)
2. Drive an implementation sprint or design pass

---

*Generated 2026-05-15 alongside the BWTL unified prototype.*
