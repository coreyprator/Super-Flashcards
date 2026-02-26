# Super-Flashcards -- Project Knowledge Document

Generated/Updated: 2026-02-23 — Sprint "Greek Core Vocabulary Batch Import"
Purpose: Canonical reference for all AI sessions working on this project.

---

## 1. PROJECT IDENTITY

| Field | Value | Source |
|-------|-------|--------|
| **Name** | Super-Flashcards | `CLAUDE.md` |
| **Description** | Multi-language vocabulary learning with spaced repetition, pronunciation, and cross-app etymology links | `CLAUDE.md` |
| **Repository** | https://github.com/coreyprator/Super-Flashcards | `CLAUDE.md` |
| **Local Path** | `G:\My Drive\Code\Python\super-flashcards` | filesystem |
| **Custom Domain** | https://flashcards.rentyourcio.com | `CLAUDE.md` |
| **Alternate URL** | https://learn.rentyourcio.com | `PROJECT_STATUS.md` (original live URL, both active) |
| **Cloud Run URL** | https://super-flashcards-wmrla7fhwa-uc.a.run.app | `CLAUDE.md` |
| **GCP Project** | super-flashcards-475210 | `CLAUDE.md` |
| **Cloud Run Service** | super-flashcards | `CLAUDE.md` |
| **Region** | us-central1 | `CLAUDE.md` |
| **Database** | LanguageLearning (SQL Server on flashcards-db, 35.224.242.223) | `CLAUDE.md` |
| **DB User** | flashcards_user | `CLAUDE.md`, `build-and-deploy.ps1` |
| **Emoji / Color** | 🟡 Yellow | project-methodology registry |
| **Version** | 3.0.2 | `backend/app/main.py` (as of 2026-02-23) |
| **Latest Revision** | super-flashcards-00288-hr9 (see Sprint 2026-02-23 for update after import) | `Sprint_CloseOut_2026-02-18.md` |
| **Current Sprint** | Greek Core Vocabulary Batch Import (data sprint) | `CC_Retry_SF_Greek_Import_Diagnostic.md` |

---

## 2. ARCHITECTURE

| Component | Technology |
|-----------|-----------|
| Backend | FastAPI 0.104.1 + SQLAlchemy 2.0.23 + Uvicorn 0.24.0 |
| Frontend | Vanilla JavaScript (ES6+), HTML5, CSS3 — no framework |
| Python Version | 3.11 (Docker: python:3.11-slim) |
| Database Driver | pyodbc with ODBC Driver 17 for SQL Server |
| Auth | Google OAuth 2.0 + email/password with JWT (access + refresh tokens) |
| AI Services | OpenAI GPT-4-turbo + DALL-E 3, Google Cloud TTS (primary), OpenAI TTS-1-HD (fallback), Google STT, Gemini 1.5 Flash, ElevenLabs |
| CI/CD | GitHub Actions → Cloud Run (`.github/workflows/deploy.yml`) |
| Deployment | Docker → Cloud Run |

### Middleware Stack (in order, from `backend/app/main.py`)
1. `SessionMiddleware` — required by authlib for OAuth (SameSite=none for iOS Safari)
2. `ProxyHeaderMiddleware` — trusts X-Forwarded-Proto from Cloud Run
3. `CORSMiddleware` — allows specific origins including learn.rentyourcio.com
4. `basic_auth_middleware` — HTTP Basic Auth (currently DISABLED via BASIC_AUTH_ENABLED env var)
5. `RequestTimingMiddleware` — logs slow requests (>1s threshold)

### Key Architecture Decisions
1. **Vanilla JS over React** — deferred to Sprint 15+
2. **Google TTS as primary, OpenAI TTS as fallback** — better quality/cost/reliability
3. **MSSQL on Cloud SQL** — established infrastructure
4. **Single round-trip for STT + Gemini** — user should not wait for two sequential API calls
5. **Transcription match beats confidence** — if STT transcribes correctly, pronunciation was good regardless of score

### Frontend Static File Serving
Each JS/CSS file needs a corresponding route in `backend/app/main.py` (individual route handlers, NOT a catch-all). New frontend files require a new route to be added.

### Version Tracking — 4 Locations
Must stay in sync after every deploy:
1. `window.APP_VERSION` in `index.html`
2. `const APP_JS_VERSION` in `app.js`
3. Version badge `<span>` in `index.html`
4. Cache-busting query string: `<script src="/app.js?v=X.Y.Z">`

### Directory Structure
```
super-flashcards/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── models.py        # SQLAlchemy ORM models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── crud.py          # Database operations
│   │   ├── database.py      # DB connection
│   │   ├── routers/         # API route modules
│   │   └── services/        # Business logic
│   ├── Dockerfile
│   └── requirements.txt
└── CLAUDE.md
```

---

## 3. DATABASE SCHEMA (13 tables + 1 view)

**Connection**: SQL Server 35.224.242.223:1433, database `LanguageLearning`, user `flashcards_user`
**ID type**: UNIQUEIDENTIFIER (UUIDs) throughout.

| Table | Purpose |
|-------|---------|
| **languages** | id, name (e.g. "French"), code (e.g. "fr") |
| **flashcards** | id, language_id (FK), word_or_phrase, definition, etymology, english_cognates, related_words (JSON), image_url, audio_url, ipa_pronunciation, source ("manual"/"ai_generated"/"imported"), times_reviewed, last_reviewed, is_synced, created_at, updated_at |
| **users** | id, username, email, password_hash (NULL for OAuth), auth_provider ("email"/"google"), google_id, name, picture, preferred_instruction_language, is_active, is_verified, last_login |
| **user_languages** | Links users to languages with instruction_language and proficiency_level |
| **study_sessions** | Tracks flashcard reviews: flashcard_id, user_id, ease_rating (1-5), time_spent_seconds |
| **PronunciationAttempts** | AttemptID (INT PK IDENTITY), FlashcardID, UserID, AudioURL, TargetText, TranscribedText, OverallConfidence (0.0000-1.0000), WordScores (JSON), IPATarget, IPATranscribed, GeminiAnalysis (JSON), GeminiClarityScore (0-100), GeminiTopIssue, GeminiDrill, AnalysisType ("stt_only"/"stt_plus_gemini"), CreatedAt, GeminiProcessedAt |
| **pronunciation_attempts** | Duplicate of PronunciationAttempts (lowercase) — CLEANUP DEFERRED (SF-012) |
| **UserVoiceClones** | ElevenLabs voice clone references per user: CloneID, ElevenLabsVoiceID, VoiceName, Status, SampleCount |
| **VoiceCloneSamples** | Audio samples for voice clones: SampleID, CloneID (FK), AudioURL, DurationSec |
| **GeneratedPronunciations** | Cached voice clone TTS: GenerationID, CloneID (FK), TargetText, LanguageCode, AudioURL, PlayCount |
| **PronunciationPromptTemplates** | Language-specific Gemini prompts: TemplateID, LanguageCode, NativeLanguage, PromptTemplate, CommonInterferences — 8 templates loaded |
| **PronunciationDebugLogs** | Pronunciation debugging records |
| **api_debug_logs** | API debug logging for image/audio operations |
| **View: vw_UserPronunciationProgress** | Aggregated pronunciation progress per user |

> **Key note**: `user_id` FK on `flashcards` is NOT in the Cloud SQL schema (commented out in models.py). All flashcards are currently shared across all users. Required for multi-tenant isolation.

**Languages supported (9)**: French (fr), Greek (el), Spanish (es), German (de), Italian (it), Portuguese (pt), Japanese (ja), Mandarin (zh), English (en)

---

## 4. SECRETS (GCP Secret Manager, project: super-flashcards-475210)

| Secret Name | Purpose |
|-------------|---------|
| `db-password` | Cloud SQL `sqlserver` user password |
| `google-oauth-client-secret` | Google OAuth for authentication |
| `ELEVENLABS_API_KEY` | ElevenLabs API for premium pronunciation |
| `GEMINI_API_KEY` | Gemini API |
| `openai-api-key` | OpenAI API |

---

## 5. KEY ENDPOINTS (Full API Surface)

### Route Prefix Map
| Prefix | Router | Description |
|--------|--------|-------------|
| `/api/auth` | auth.router | Google OAuth, email/password, JWT |
| `/api/flashcards` | flashcards.router | Flashcard CRUD |
| `/api/ai` | ai_generate + batch + progress routers | OpenAI GPT-4 + DALL-E, batch, SSE progress |
| `/api/languages` | languages.router | Language CRUD |
| `/api/users` | users.router | User management |
| `/api` | import_flashcards.router | CSV/JSON import |
| `/api/batch` | batch_processing.router | Batch word processing |
| `/api/audio` | audio.router | TTS generation |
| `/api/v1/pronunciation` | pronunciation.router | Recording + analysis |
| `/api/v1/voice-clone` | voice_clone.router | Voice cloning (backend complete, frontend broken) |
| `/api/document` | document_parser.router | Document parsing |

### Authentication (`/api/auth`)
- `POST /api/auth/register` — email/password registration
- `POST /api/auth/login` — email/password login
- `GET /api/auth/google/login` — initiate Google OAuth
- `GET /api/auth/google/callback` — OAuth callback → issues JWT + refresh cookie
- `POST /api/auth/refresh` — exchange refresh token for new access token
- `POST /api/auth/logout` — clear auth cookies
- `GET /api/auth/me` — current user profile (auth required)
- **Token model**: Access tokens 15-min (JWT HS256). Refresh tokens 30-day, HTTP-only cookie (SameSite=none, Secure, path=/api/auth). Rotation on refresh.

### Flashcards (`/api/flashcards`)
- `POST /api/flashcards/` — create; `GET /api/flashcards/` — list (filter by language_id)
- `GET /api/flashcards/search?q=term` — search across word/definition/etymology
- `GET /api/flashcards/{id}` — get; `PUT /api/flashcards/{id}` — update; `DELETE /api/flashcards/{id}` — delete
- `POST /api/flashcards/{id}/review` — increment review counter

### AI & Audio
- `POST /api/ai/generate` — full flashcard via GPT-4 + DALL-E 3 (3-level content policy fallback)
- `POST /api/audio/generate/{card_id}` — Google TTS primary, OpenAI TTS-1-HD fallback
- `DELETE /api/audio/delete/{card_id}` — delete audio file

### Pronunciation (`/api/v1/pronunciation`)
- `POST /api/v1/pronunciation/record` — upload recording → STT + Gemini analysis
- `GET /api/v1/pronunciation/progress/{user_id}` — progress stats
- `GET /api/v1/pronunciation/history/{flashcard_id}` — attempt history per card
- `POST /api/v1/pronunciation/deep-analysis/{attempt_id}` — **RETURNS 501** (audio retrieval not implemented)

### Other
- `GET /health` — health check (no DB); `GET /health/db` — health check with DB test
- `POST /api/import` — import CSV/JSON; `GET /api/template/csv`, `GET /api/template/json` — templates

---

## 6. FEATURES — WHAT EXISTS TODAY

### Core Flashcard System
- French + Greek vocabulary cards with spaced repetition (SM-2 algorithm or data collection — verify SF-007)
- IPA phonetic transcription stored per card
- Image per card (AI-generated via DALL-E or Google search)
- Audio pronunciation (Google TTS or ElevenLabs)
- study_sessions table collects ease_rating 1-5 and time_spent_seconds

### Google OAuth Authentication
- Users authenticate via Google OAuth
- JWT tokens for session management
- Matches pattern from ArtForge/HarmonyLab

### Pronunciation Practice (Sprint 8.5)
- Pronunciation scoring via phoneme matching
- Debug logs in PronunciationDebugLogs table
- UserVoiceClones + VoiceCloneSamples for custom voice

### Greek Core Vocabulary Import (Sprint 2026-02-23)
- **Source**: `greek_core_vocab.txt` (1,084 words from Major's 80% frequency list)
- **Pre-import baseline**: 481 Greek cards (471 unique words), as of 2/22/2026 UAT
- **Import strategy**: Option A — API-based via `POST /api/ai/batch-generate` (50 words/batch, 60s pauses)
- **Delta**: 77 words already in SF (skipped), target 1,007 new cards
- **Import status**: SUBSTANTIALLY COMPLETE as of 2026-02-25 audit — 1098 unique Greek words in DB (1111 total cards)
- **Script (batch)**: `import_greek_vocab.py` (supports --dry-run, --start-batch, --no-images)
- **Script (single-card)**: `import_greek_single.py` (one card at a time, 60s sleep, retry w/ backoff)
- **Retry logic**: Added in `ed3885d` — exponential backoff on ConnectionResetError/500 errors
- **Known issue**: GET /api/flashcards hangs at 800+ cards — do NOT use API-based duplicate detection
- **Note**: Do NOT re-run import scripts without verifying current count first via SQL
- **Note**: `batch_processing.py:40` has placeholder OpenAI key — use `ai_generate` endpoints, not batch_processing router

### Greek Import Status (as of 2026-02-25 audit)
- Vocab file: `greek_core_vocab.txt` (1,084 words)
- Cards imported: 1098 unique words (1111 total cards including duplicates/variants)
- Remaining: ~0 (vocab file fully covered; 14 extra words from Etymython cognate import)
- Import script: `import_greek_single.py`
- Retry logic: present, committed in `ed3885d`
- Known issue: GET /api/flashcards hangs at 800+ cards
- Fix: SQL delta mode added in this session (Part C of consolidated sprint)
- Import must run from PL terminal (not CC session — sessions timeout)
- Remaining delta (as of 2026-02-24): 383 words still to import

### Import Script Modes (added 2026-02-24)
- Default: `--db-password` → SQL query to Cloud SQL (handles 800+ cards)
- Alternative: `--delta-file <file>` → pre-computed delta, skips all queries
- Legacy: `--use-api` → original API GET (hangs at 800+ cards, use only for small sets)
- Dry run: `--dry-run` → shows delta count, writes delta file, no import
- DB user: `sqlserver` (not `flashcards_user` — task doc was incorrect)

### Etymython Integration (Sprint 2026-02-18)
- **340 English cognate cards imported** from Etymython (etymology_cognates → english_cognates chain)
  - All 340 cards received AI-generated images
  - 343 audio files generated via Google TTS for pronunciation
  - Cost: ~$17 at $0.05/card for AI enrichment during import
- **"View in Etymython" reverse links** added to each English cognate card
  - `pickBestFigure()` / `scoreFigure()` logic: scores by direct name match, domain relevance, etymology count
  - Corrections applied: "deity" → Zeus (not Chronos), "narcissism" → Narcissus
  - Uses `#figure/N` hash routing on etymython.rentyourcio.com
- **342/342 cognates matched** and linked bidirectionally

---

## 7. CROSS-APP INTEGRATIONS

| Integration | Direction | Description |
|------------|-----------|-------------|
| Etymython → SF | Inbound | 📇 icon on cognate words in Etymython links to SF card |
| SF → Etymython | Outbound | "View in Etymython" button on English cards with pickBestFigure logic |
| MetaPM | Reporting | UAT results submitted to metapm.rentyourcio.com/api/uat/submit |

---

## 8. DEPLOYMENT

### Deploy Command
```powershell
cd "G:\My Drive\Code\Python\Super-Flashcards"
gcloud run deploy super-flashcards --source . --region us-central1 --allow-unauthenticated
```

> **CRITICAL WARNING (LL-008):** `gcloud run deploy` WITHOUT explicitly setting all env vars can **wipe existing environment variables**. Use `gcloud run services update --set-env-vars` for config-only changes to preserve existing vars.

### Key Environment Variables
| Variable | Value |
|----------|-------|
| `SQL_SERVER` | 35.224.242.223 |
| `SQL_DATABASE` | LanguageLearning |
| `SQL_USER` | flashcards_user |
| `GOOGLE_REDIRECT_URI` | https://learn.rentyourcio.com/api/auth/google/callback |
| `BASIC_AUTH_ENABLED` | false (disabled since OAuth active) |

### Verification
```powershell
gcloud config get-value project  # Must be: super-flashcards-475210
curl https://flashcards.rentyourcio.com/health
# Also: curl https://learn.rentyourcio.com/health
gcloud run logs read super-flashcards --region=us-central1 --limit=50
```

### PINEAPPLE Test (LL-044)
Add `"canary": "PINEAPPLE-99999"` to /health endpoint, deploy, verify it appears. If missing, deployment failed.

## CI/CD
- GitHub Actions: `.github/workflows/deploy.yml`
- Trigger: push to `main` or manual `workflow_dispatch`
- Auth: cc-deploy SA via `GCP_SA_KEY` secret
- Deploy method: `--source .` (Cloud Run builds from source)
- Health check step: added 2026-02-26 (PM-MS1)
- Health check URL: https://learn.rentyourcio.com/health

---

## 9. KNOWN ISSUES & TECHNICAL DEBT

### Active Bugs (from PROJECT_STATUS.md as of 2026-02-15)
| ID | Issue | Priority |
|----|-------|----------|
| BUG-001 | Empty transcription returns 0% even when audio was recorded | P0 |
| BUG-002 | Voice clone "Create Voice Profile" button non-functional | P0 |
| BUG-003 | Keyboard shortcuts inconsistent on mobile | P1 |
| BUG-005 | Gemini vs STT disagreement (coaching contradicts word scores) | P1 |
| BUG-006 | Mobile OAuth session expiry (frequent re-login) — partially fixed | P1 |
| BUG-007 | Mouse click does not stop recording | P1 |

### Sprint 2026-02-18 Issues
| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| SF-012 | Duplicate pronunciation_attempts tables (PascalCase + lowercase) | P3 | Open — cleanup deferred |
| — | Console errors: import/CSV/JSON button not found | P3 | Non-blocking |
| — | study_sessions ease_rating collected but SM-2 may not use it | P2 | Verify SF-007 |

### Technical Debt
| Item | Priority |
|------|----------|
| `user_id` FK not on flashcards table — all flashcards shared across all users | High |
| No automated E2E tests in CI/CD | High |
| No staging environment | High |
| Greek Unicode — DB stores correct Unicode but UI can display corrupted Latin-1 | Medium |
| deep-analysis endpoint returns 501 — not implemented | Medium |
| `openai.api_key = "your-openai-api-key-here"` placeholder in `batch_processing.py:40` | Medium |
| Inconsistent API paths — mix of `/api/` and `/api/v1/` prefixes | Low |

---

## 10. WHAT'S NEXT (updated 2026-02-23 per PL UAT 2/22/2026)

| ID | Feature | Priority | Status | Notes |
|----|---------|----------|--------|-------|
| SF-005 | Spaced Repetition System (SRS) | P1 | **Backlog** | PL UAT 2/22: SRS not implemented end-to-end, needs membership model first |
| SF-007 | Spaced repetition verification | P2 | Backlog | study_sessions collects ease_rating — verify if SM-2 is implemented or just data collection |
| SF-013 | PIE root field + API enrichment | P2 | Backlog | Add depth layer: SF card → Etymython etymology → PIE root |
| SF-014 | PIE Root Pronunciation Audio | P3 | Backlog | Generate and store pronunciation audio for PIE roots |
| SF-017 | Language Reassignment | P2 | Backlog | Allow cards to be moved between languages |
| SF-018 | Error Tracker Fix | P3 | Backlog | |
| SF-006 | Etymology bridge normalization | P2 | Backlog | Columns exist, check data quality |
| AU02 | Fix post-login redirect (minor, shared with Etymython) | P3 | Backlog | |

---

## 11. COMPLIANCE DIRECTIVES (from CLAUDE.md)

### Before ANY Work (LL-045)
1. Read entire CLAUDE.md
2. State: "Service is super-flashcards, database is LanguageLearning"
3. Never invent infrastructure values

### Definition of Done
- Code → Git commit+push → Deploy → Health check → UAT (for features) → Handoff

### Locked Vocabulary (LL-049)
"Complete/Done/Fixed/Working" require deployed revision + test output proof.

### Forbidden Phrases
- "Test locally" (no localhost)
- "Let me know if you want me to deploy" (CC owns deployment)
- "Please run this command" (CC runs commands)

---

## 12. DOCUMENTATION SOURCES INVENTORY

| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI session instructions, infrastructure values, compliance |
| `Sprint_CloseOut_2026-02-18.md` | Sprint close-out with SF changes this sprint |
| `backend/app/main.py` | FastAPI app entry point |
| `backend/app/models.py` | ORM models + schema |
| `backend/create_missing_tables.sql` | SQL schema for users, user_languages, study_sessions |
| `BUGS_AND_TODOS.md` | Known issues tracker |
| `CAI_Handoff_2026-02-18.md` | Architect handoff for next session |

---

*End of PROJECT_KNOWLEDGE.md*
