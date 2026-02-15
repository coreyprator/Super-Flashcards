# Super-Flashcards — Project Knowledge Document
Generated: 2026-02-15 by CC Session
Purpose: Canonical reference for all AI sessions working on this project.

---

## 1. PROJECT IDENTITY

| Field | Value | Source |
|-------|-------|--------|
| Project Name | Super-Flashcards | `CLAUDE.md` |
| Description | AI-powered language learning flashcard application with spaced repetition, pronunciation practice, and multi-language support | `CLAUDE.md`, `README.md` |
| Repository | https://github.com/coreyprator/Super-Flashcards | `CLAUDE.md` |
| Local Path | `G:\My Drive\Code\Python\Super-Flashcards` | `CLAUDE.md` |
| Live URL | https://learn.rentyourcio.com | `PROJECT_STATUS.md`, `backend/app/main.py` |
| Cloud Run URL | https://super-flashcards-wmrla7fhwa-uc.a.run.app | `CLAUDE.md` |
| GCP Project ID | `super-flashcards-475210` | `CLAUDE.md` |
| GCP Region | `us-central1` | `CLAUDE.md` |
| Methodology | coreyprator/project-methodology v3.14 | `CLAUDE.md` |
| Current Version | 2.9.0 | `backend/app/main.py` |
| Current Sprint | Sprint 8.5 (Pronunciation Practice Enhancement) | `PROJECT_STATUS.md` |
| Owner | Corey Prator (Project Lead), Claude (Architect) | `PROJECT_STATUS.md` |
| First User Login | October 25, 2025 | `README.md` |

### Tech Stack Summary
- **Backend:** Python 3.11, FastAPI 0.104.1, SQLAlchemy 2.0.23, Uvicorn 0.24.0 (`backend/requirements.txt`, `Dockerfile`)
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 (no framework) (`README.md`)
- **Database:** Microsoft SQL Server (Cloud SQL) via pyodbc + ODBC Driver 17 (`backend/app/database.py`)
- **AI Services:** OpenAI GPT-4-turbo + DALL-E 3, Google Cloud TTS, Google Cloud Speech-to-Text, Google Gemini 1.5 Flash, ElevenLabs voice cloning (`backend/requirements.txt`, various service files)
- **Auth:** Google OAuth 2.0 + email/password with JWT (access + refresh tokens) (`backend/app/routers/auth.py`)
- **Infrastructure:** Google Cloud Run, Cloud SQL, Cloud Storage, Secret Manager (`CLAUDE.md`)

---

## 2. ARCHITECTURE

### System Architecture
Source: `README.md`, `Dockerfile`, `backend/app/main.py`

```
                    ┌─────────────────────────┐
                    │   learn.rentyourcio.com  │
                    │    (Custom Domain)       │
                    └───────────┬──────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │   Google Cloud Run       │
                    │   super-flashcards       │
                    │   us-central1            │
                    │                          │
                    │  ┌────────────────────┐  │
                    │  │ uvicorn + FastAPI   │  │
                    │  │ (port 8080)         │  │
                    │  └────────┬───────────┘  │
                    │           │               │
                    │  ┌────────▼───────────┐  │
                    │  │ frontend/ (static)  │  │
                    │  │ served by FastAPI   │  │
                    │  └────────────────────┘  │
                    └───┬────┬────┬────┬───────┘
                        │    │    │    │
            ┌───────────▼┐ ┌▼────▼┐ ┌─▼──────────────┐
            │ Cloud SQL   │ │ GCS  │ │ External APIs   │
            │ (MSSQL)     │ │Bucket│ │ - OpenAI        │
            │ 35.224.     │ │super-│ │ - Google TTS    │
            │  242.223    │ │flash │ │ - Google STT    │
            │             │ │cards-│ │ - Gemini 1.5    │
            │ Database:   │ │media │ │ - ElevenLabs    │
            │ Language    │ │      │ │                  │
            │ Learning    │ │      │ │                  │
            └─────────────┘ └──────┘ └──────────────────┘
```

### Backend Structure
Source: `backend/app/` directory

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, middleware, route mounting, static serving
│   ├── database.py          # SQLAlchemy engine, Cloud SQL / local connection
│   ├── models.py            # All ORM models (User, Flashcard, Language, etc.)
│   ├── schemas.py           # Pydantic schemas for request/response
│   ├── crud.py              # Database CRUD operations
│   ├── routers/
│   │   ├── ai_generate.py   # OpenAI GPT-4 + DALL-E image generation
│   │   ├── audio.py         # TTS audio generation (Google TTS primary, OpenAI fallback)
│   │   ├── auth.py          # Google OAuth + email/password + JWT
│   │   ├── batch_ai_generate.py  # Batch AI flashcard generation
│   │   ├── batch_ipa.py     # Batch IPA generation
│   │   ├── batch_processing.py   # Batch word processing from CSV
│   │   ├── batch_progress.py     # SSE streaming for batch progress
│   │   ├── document_parser.py    # Document/word list parsing
│   │   ├── flashcards.py    # CRUD endpoints for flashcards
│   │   ├── import_flashcards.py  # CSV/JSON import
│   │   ├── ipa.py           # IPA pronunciation endpoints
│   │   ├── languages.py     # Language CRUD
│   │   ├── pronunciation.py # Pronunciation recording and analysis
│   │   ├── search.py        # Search endpoint
│   │   ├── tts_testing.py   # TTS testing (dev only, not mounted in prod)
│   │   ├── users.py         # User management
│   │   └── voice_clone.py   # ElevenLabs voice cloning
│   ├── services/
│   │   ├── audio_service.py      # Google TTS + OpenAI TTS with fallback
│   │   ├── auth_service.py       # JWT creation/validation, password hashing
│   │   ├── background_init.py    # Background service initialization
│   │   ├── elevenlabs_service.py # ElevenLabs voice clone API
│   │   ├── gemini_service.py     # Gemini pronunciation coaching
│   │   ├── google_tts_service.py # Google Cloud TTS
│   │   ├── ipa_diff_service.py   # IPA phoneme comparison with color-coding
│   │   ├── ipa_service.py        # IPA conversion service
│   │   ├── pronunciation_service.py  # Full pronunciation analysis pipeline
│   │   ├── service_registry.py   # Singleton service registry
│   │   └── storage_service.py    # GCS upload/download helpers
│   └── models/
│       ├── pronunciation_attempt.py
│       └── pronunciation_prompt_template.py
├── requirements.txt
├── migrations/
├── scripts/
└── tests/
```

### Frontend Structure
Source: `frontend/` directory listing

```
frontend/
├── index.html                # Main SPA page
├── login.html                # Login page
├── settings.html             # Settings page
├── app.js                    # Core application logic
├── auth.js                   # Authentication module (JWT, OAuth)
├── api-client.js             # API wrapper with auth headers
├── audio-player.js           # TTS audio management
├── db.js                     # IndexedDB offline cache
├── sync.js                   # Offline sync module
├── error-tracker.js          # Client-side error tracking
├── first-time-loader.js      # Progressive loading UX
├── oauth-tracker.js          # OAuth performance tracking
├── pronunciation-recorder.js # Pronunciation recording UI
├── pronunciation-deep-analysis.js  # Gemini deep analysis UI
├── pronunciation-deep-analysis.css
├── voice-clone.js            # Voice cloning UI
├── voice-clone.css
├── sw.js                     # Service worker for PWA
├── manifest.json             # PWA manifest
├── favicon.png
└── (various debug/test HTML files)
```

### Key Architecture Decisions
Source: `PROJECT_STATUS.md`, `ROADMAP.md`, `LESSONS_LEARNED.md`

1. **Vanilla JS over React** -- Decision to stay with vanilla JS until complexity requires migration (deferred to Sprint 15+)
2. **Google TTS as primary, OpenAI TTS as fallback** -- Google won on quality/cost/reliability (`ROADMAP.md`)
3. **PWA over native mobile app** -- PWA sufficient; native app deferred until revenue justifies it
4. **MSSQL over PostgreSQL** -- Already established; Cloud SQL with MSSQL
5. **Single round-trip for STT + Gemini** -- User should not wait for two sequential API calls (`PROJECT_STATUS.md`)
6. **Transcription match beats confidence** -- If STT correctly transcribes text, pronunciation was good regardless of confidence score (`PROJECT_STATUS.md`)

### Middleware Stack (in order)
Source: `backend/app/main.py`

1. `SessionMiddleware` -- Required by authlib for OAuth (SameSite=none for iOS Safari compat in prod)
2. `ProxyHeaderMiddleware` -- Trusts X-Forwarded-Proto from Cloud Run load balancer
3. `CORSMiddleware` -- Allows specific origins including learn.rentyourcio.com
4. `basic_auth_middleware` -- Basic auth (currently DISABLED, controlled by BASIC_AUTH_ENABLED env var)
5. `RequestTimingMiddleware` -- Logs slow requests (>1s threshold)

---

## 3. DATABASE SCHEMA

### Database Connection
Source: `backend/app/database.py`, `CLAUDE.md`

| Property | Value |
|----------|-------|
| Engine | Microsoft SQL Server (Cloud SQL) |
| Server | 35.224.242.223:1433 |
| Database | LanguageLearning |
| Cloud Run User | flashcards_user |
| Local User | Windows Auth (Trusted_Connection) |
| Driver | ODBC Driver 17 for SQL Server |
| Pool Size | 5 (max_overflow=10, pool_recycle=3600) |

### Tables

**languages** (Source: `backend/app/models.py`)
| Column | Type | Notes |
|--------|------|-------|
| id | UNIQUEIDENTIFIER (PK) | UUID |
| name | NVARCHAR(100) | Unique, e.g., "French", "Greek" |
| code | NVARCHAR(5) | Unique, e.g., "fr", "el" |
| created_at | DATETIME | |

**flashcards** (Source: `backend/app/models.py`)
| Column | Type | Notes |
|--------|------|-------|
| id | UNIQUEIDENTIFIER (PK) | UUID |
| language_id | UNIQUEIDENTIFIER (FK) | -> languages.id |
| word_or_phrase | NVARCHAR(500) | Indexed |
| definition | NVARCHAR(MAX) | |
| etymology | NVARCHAR(MAX) | |
| english_cognates | NVARCHAR(MAX) | |
| related_words | NVARCHAR(MAX) | JSON string |
| image_url | NVARCHAR(1000) | Cloud Storage path |
| image_description | NVARCHAR(MAX) | Alt text / DALL-E prompt |
| audio_url | NVARCHAR(500) | TTS audio file path |
| audio_generated_at | DATETIME | |
| ipa_pronunciation | NVARCHAR(500) | IPA text |
| ipa_audio_url | NVARCHAR(500) | |
| ipa_generated_at | DATETIME | |
| source | NVARCHAR(50) | "manual", "ai_generated", "imported", "batch_generated" |
| times_reviewed | INT | Default 0 |
| last_reviewed | DATETIME | |
| is_synced | BIT | Default 1 |
| local_only | BIT | Default 0 |
| created_at | DATETIME | |
| updated_at | DATETIME | |

**users** (Source: `backend/app/models.py`, `backend/create_missing_tables.sql`)
| Column | Type | Notes |
|--------|------|-------|
| id | UNIQUEIDENTIFIER (PK) | UUID |
| username | NVARCHAR(50) | Unique |
| email | NVARCHAR(255) | Unique |
| password_hash | NVARCHAR(255) | NULL for OAuth-only users |
| auth_provider | NVARCHAR(20) | 'email', 'google' |
| google_id | NVARCHAR(255) | Unique, nullable |
| name | NVARCHAR(100) | From OAuth |
| picture | NVARCHAR(500) | Profile picture URL |
| preferred_instruction_language | NVARCHAR(10) | Default 'en' |
| is_active | BIT | Default 1 |
| is_verified | BIT | Default 0 |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| last_login | DATETIME | |

**user_languages** (Source: `backend/app/models.py`)
- Links users to languages with instruction_language and proficiency_level preferences

**study_sessions** (Source: `backend/app/models.py`)
- Tracks flashcard reviews with ease_rating (1-5) and time_spent_seconds

**PronunciationAttempts** (Source: `backend/app/models.py`, `create_pronunciation_attempts_table.sql`)
| Column | Type | Notes |
|--------|------|-------|
| AttemptID | INT (PK, IDENTITY) | Auto-increment |
| FlashcardID | UNIQUEIDENTIFIER (FK) | -> flashcards.id |
| UserID | UNIQUEIDENTIFIER (FK) | -> users.id |
| AudioURL | NVARCHAR(500) | GCS URL |
| TargetText | NVARCHAR(500) | Expected text |
| TranscribedText | NVARCHAR(500) | STT result |
| OverallConfidence | NUMERIC(5,4) | 0.0000-1.0000 |
| WordScores | NVARCHAR(MAX) | JSON array |
| IPATarget | NVARCHAR(200) | |
| IPATranscribed | NVARCHAR(200) | |
| GeminiAnalysis | NVARCHAR(MAX) | Full Gemini JSON response |
| GeminiClarityScore | NUMERIC(5,2) | 0-100 |
| GeminiRhythmAssessment | NVARCHAR(MAX) | |
| GeminiTopIssue | NVARCHAR(500) | |
| GeminiDrill | NVARCHAR(MAX) | |
| AnalysisType | NVARCHAR(50) | 'stt_only' or 'stt_plus_gemini' |
| CreatedAt | DATETIME | |
| GeminiProcessedAt | DATETIME | |

**UserVoiceClones** (Source: `backend/app/models.py`)
- Stores ElevenLabs voice clone references per user (CloneID, ElevenLabsVoiceID, VoiceName, Status, SampleCount, etc.)

**VoiceCloneSamples** (Source: `backend/app/models.py`)
- Audio samples used to create voice clones (SampleID, CloneID FK, AudioURL, DurationSec)

**GeneratedPronunciations** (Source: `backend/app/models.py`)
- Cached pronunciation audio from voice clones (GenerationID, CloneID FK, TargetText, LanguageCode, AudioURL, PlayCount)

**PronunciationPromptTemplates** (Source: `backend/app/models.py`)
- Language-specific Gemini prompt templates (TemplateID, LanguageCode, NativeLanguage, PromptTemplate, CommonInterferences)
- 8 templates currently loaded per `PROJECT_STATUS.md`

**api_debug_logs** (Source: `backend/app/models.py`)
- Debug logging for image/audio generation operations

### Key Database Notes
- `user_id` FK on flashcards is NOT in the Cloud SQL schema yet (commented out in models.py) -- all flashcards are shared across users
- Relationships between User and Flashcard/StudySession are commented out due to missing FK columns
- Language-Flashcard relationship IS active
- NVARCHAR used throughout for Unicode support (Greek, French, etc.)

---

## 4. API SURFACE

### Route Prefix Map
Source: `backend/app/main.py`

| Prefix | Router | Tags | Description |
|--------|--------|------|-------------|
| `/api/auth` | auth.router | authentication | Google OAuth, email/password, JWT |
| `/api/flashcards` | flashcards.router | flashcards | CRUD operations |
| `/api/ai` | ai_generate.router | ai-generate | OpenAI GPT-4 + DALL-E |
| `/api/ai` | batch_ai_generate.router | batch-ai-generation | Batch AI generation |
| `/api/ai` | batch_progress.router | batch-progress | SSE streaming progress |
| `/api/languages` | languages.router | languages | Language CRUD |
| `/api/users` | users.router | users | User management |
| `/api` | import_flashcards.router | import | CSV/JSON import |
| `/api/batch` | batch_processing.router | batch_processing | Batch word processing |
| `/api/audio` | audio.router | audio | TTS generation |
| `/api/v1/pronunciation` | pronunciation.router | pronunciation | Recording + analysis |
| `/api/v1/voice-clone` | voice_clone.router | voice-clone | Voice cloning |
| `/api/document` | document_parser.router | document-parser | Document parsing |

### Key Endpoints

**Authentication** (Source: `backend/app/routers/auth.py`)
- `POST /api/auth/register` -- Email/password registration
- `POST /api/auth/login` -- Email/password login
- `GET /api/auth/google/login` -- Initiate Google OAuth
- `GET /api/auth/google/callback` -- OAuth callback, issues JWT + refresh cookie
- `POST /api/auth/refresh` -- Exchange refresh token (HTTP-only cookie) for new access token
- `POST /api/auth/logout` -- Clear auth cookies
- `GET /api/auth/me` -- Get current user profile (requires auth)
- `PUT /api/auth/me` -- Update profile (requires auth)

**Flashcards** (Source: `backend/app/routers/flashcards.py`)
- `POST /api/flashcards/` -- Create flashcard
- `GET /api/flashcards/` -- List flashcards (optional `language_id` filter, default limit=1000)
- `GET /api/flashcards/search?q=term` -- Search by word/definition/etymology
- `GET /api/flashcards/{id}` -- Get single flashcard
- `PUT /api/flashcards/{id}` -- Update flashcard
- `DELETE /api/flashcards/{id}` -- Delete flashcard
- `POST /api/flashcards/{id}/review` -- Increment review counter

**AI Generation** (Source: `backend/app/routers/ai_generate.py`)
- `POST /api/ai/generate` -- Generate full flashcard (content + image) via GPT-4 + DALL-E
- `POST /api/ai/preview` -- Preview without saving
- `POST /api/ai/image` -- Generate image only
- `POST /api/ai/fix-broken-images` -- Regenerate expired DALL-E URLs

**Audio** (Source: `backend/app/routers/audio.py`)
- `POST /api/audio/generate/{card_id}` -- Generate TTS audio (Google TTS primary, OpenAI fallback)
- `DELETE /api/audio/delete/{card_id}` -- Delete audio file
- `GET /api/audio/status` -- Audio generation statistics
- `GET /api/audio/check/{card_id}` -- Check if audio exists

**Pronunciation** (Source: `backend/app/routers/pronunciation.py`)
- `POST /api/v1/pronunciation/record` -- Upload recording, get STT + Gemini analysis
- `GET /api/v1/pronunciation/progress/{user_id}` -- User progress stats
- `GET /api/v1/pronunciation/history/{flashcard_id}` -- Attempt history per card
- `POST /api/v1/pronunciation/generate-ipa/{flashcard_id}` -- Generate IPA for card
- `POST /api/v1/pronunciation/deep-analysis/{attempt_id}` -- Trigger Gemini analysis (NOT YET IMPLEMENTED -- returns 501)
- `GET /api/v1/pronunciation/prompt-template/{language_code}` -- Get Gemini prompt template
- `POST /api/v1/pronunciation/feedback/{attempt_id}` -- Submit user feedback

**Voice Clone** (Source: `backend/app/routers/voice_clone.py`)
- `GET /api/v1/voice-clone/status` -- Check if user has voice clone
- `POST /api/v1/voice-clone/create` -- Create clone from audio samples (requires auth)
- `POST /api/v1/voice-clone/generate/{language_code}` -- Generate speech with cloned voice
- `DELETE /api/v1/voice-clone/` -- Delete voice clone
- `GET /api/v1/voice-clone/subscription` -- Get 11Labs subscription info

**Other**
- `GET /health` -- Health check (no DB test)
- `GET /health/db` -- Health check with database connectivity test
- `GET /api/sync` -- PWA sync status
- `POST /api/import` -- Import CSV/JSON flashcards
- `GET /api/template/csv` and `/api/template/json` -- Download import templates

### Authentication Model
Source: `backend/app/services/auth_service.py`, `backend/app/routers/auth.py`

- **Access tokens:** JWT, HS256, 15-minute expiry
- **Refresh tokens:** JWT, HS256, 30-day expiry, stored in HTTP-only cookie (path=/api/auth, SameSite=none, Secure=true in prod)
- **Token rotation:** Refresh endpoint issues new access + new refresh token
- **Password hashing:** bcrypt via passlib
- **OAuth flow:** Google OAuth2 via authlib, redirect to login.html with token in URL param
- **BUG-006 fix:** Refresh cookie set on actual RedirectResponse, not injected response param

### API Inconsistency Note
Source: `PROJECT_STATUS.md`
- Some endpoints use `/api/`, others use `/api/v1/` -- marked as low-priority tech debt

---

## 5. FRONTEND

### Technology
Source: `README.md`, `frontend/` directory

- **Framework:** None (Vanilla JavaScript ES6+)
- **Styling:** CSS3 (no Tailwind/Bootstrap in production, CDN warning noted)
- **PWA:** Service worker (`sw.js`), manifest.json, IndexedDB cache (`db.js`)
- **Offline Support:** IndexedDB cache-first strategy, background network sync (`sync.js`)

### Key Frontend Files
Source: `frontend/` directory listing, `backend/app/main.py` (route serving)

| File | Purpose |
|------|---------|
| `index.html` | Main SPA with all tabs (Study, Read, Browse, Import) |
| `login.html` | Login/OAuth page |
| `app.js` | Core app logic, tab navigation, flashcard display, batch operations |
| `auth.js` | JWT token management, login/logout, OAuth callback handling |
| `api-client.js` | API wrapper with auth headers |
| `db.js` | IndexedDB offline cache for flashcards |
| `sync.js` | Offline/online sync management |
| `audio-player.js` | TTS audio playback |
| `pronunciation-recorder.js` | Audio recording, waveform, submission |
| `pronunciation-deep-analysis.js` | Gemini coaching UI |
| `voice-clone.js` | Voice cloning UI |
| `first-time-loader.js` | Progressive loading for new users |
| `sw.js` | Service worker for PWA caching |

### Static File Serving
Source: `backend/app/main.py`

Frontend files are served directly by FastAPI via individual route handlers (e.g., `@app.get("/app.js")`, `@app.get("/auth.js")`, etc.) rather than a catch-all static mount. The `/static` mount also exists for the frontend directory. This pattern means each new JS/CSS file needs a corresponding route in `main.py`.

### Version Tracking
Source: `LESSONS_LEARNED.md`

Version must be synchronized in 4 places:
1. `window.APP_VERSION` in `index.html`
2. `const APP_JS_VERSION` in `app.js`
3. Version badge `<span>` in `index.html`
4. Cache-busting query string in `<script src="/app.js?v=X.Y.Z">`

---

## 6. FEATURES — WHAT EXISTS TODAY

Source: `PROJECT_STATUS.md`, `README.md`, `CLAUDE.md`, code inspection

### Core Features (Deployed & Working)
- **Multi-language flashcard management** -- 9 languages supported: French (fr), Greek (el), Spanish (es), German (de), Italian (it), Portuguese (pt), Japanese (ja), Mandarin Chinese (zh), English (en)
- **AI-powered flashcard generation** -- OpenAI GPT-4-turbo for definitions/etymology/cognates, DALL-E 3 for images with 3-level fallback for content policy violations
- **Google Cloud TTS** -- Primary audio provider with OpenAI TTS-1-HD fallback
- **Full-text search** -- Search across word, definition, etymology fields
- **Import/Export** -- CSV and JSON batch import with validation
- **Batch document processing** -- Upload word lists or structured documents, AI generates full flashcard content
- **Batch AI generation** -- Process multiple words through GPT-4 + DALL-E with real-time SSE progress
- **Google OAuth authentication** -- Deployed and verified, JWT access+refresh tokens
- **Email/password authentication** -- Registration with password strength validation
- **Offline-first PWA** -- IndexedDB cache, service worker, works without internet
- **Cross-device sync** -- Laptop and iPhone accessing same cloud database
- **Responsive design** -- Desktop and mobile support
- **Edit capabilities** -- Inline flashcard editing in Browse mode

### Pronunciation Practice (Sprint 8 / 8.5)
- **Audio recording** -- Upload user recordings to GCS
- **Google Cloud Speech-to-Text** -- Word-level confidence scores
- **IPA generation** -- epitran library for French IPA conversion
- **IPA phoneme comparison** -- Color-coded diff between target and spoken IPA
- **Gemini deep analysis** -- AI coaching with language-specific prompt templates (8 templates loaded)
- **Cross-validation** -- Gemini findings validated against STT confidence
- **Progress tracking** -- Total attempts, average confidence, problem words, improvement trend
- **Pronunciation history** -- Per-flashcard attempt history with pagination

### Voice Cloning (Sprint 8.5e)
- **Backend ready:** Database tables created, ElevenLabs API integration built
- **Frontend broken:** "Create Voice Profile" button non-functional (BUG-002)

### Infrastructure
- **Cloud Run** deployment with custom domain
- **Cloud SQL** (MSSQL) with 758+ flashcards (405 Greek, others)
- **GCS bucket** (super-flashcards-media) for images, audio, pronunciation recordings
- **Secret Manager** for all credentials
- **GitHub Actions CI/CD** -- Auto-deploy on push to main

---

## 7. FEATURES — PLANNED/IN PROGRESS

### Active Bugs (P0/P1)
Source: `PROJECT_STATUS.md`, `BUGS_AND_TODOS.md`

| Bug ID | Issue | Priority |
|--------|-------|----------|
| BUG-001 | Empty transcription returns (0% score even when audio recorded) | P0 |
| BUG-002 | Voice clone button non-functional | P0 |
| BUG-003 | Keyboard shortcuts inconsistent on mobile | P1 |
| BUG-005 | Gemini vs STT disagreement (coaching contradicts word scores) | P1 |
| BUG-006 | Mobile OAuth session expiry (frequent re-login on iPhone) -- PARTIALLY FIXED (refresh cookie on redirect) | P1 |
| BUG-007 | Mouse click does not stop recording | P1 |

### Sprint 8.5 Sub-Sprints
Source: `PROJECT_STATUS.md`

| Sub-Sprint | Description | Status |
|------------|-------------|--------|
| 8.5 | Gemini Deep Analysis Backend | Deployed |
| 8.5b | Frontend Integration | Partial |
| 8.5c | Unified STT + Gemini Feedback | Prompted (not started) |
| 8.5d | Bug Fixes + IPA Comparison | Prompted (not started) |
| 8.5e | 11Labs Voice Clone | Backend ready, frontend broken |

### Pronunciation UI Redesign
Source: `PRONUNCIATION_UI_REDESIGN_SPEC.md`

- Move recording bar to top of Read view (below nav tabs)
- Unified button state machine (Start/Stop/Re-record)
- Keyboard shortcuts: Space/Enter for start/stop, Escape to cancel, P for reference, R for recording
- Status: Approved, implement after bug fixes

### Future Sprints (Roadmap)
Source: `ROADMAP.md`

| Sprint | Goal |
|--------|------|
| 9 | Subscription & Billing (Stripe) |
| 10 | Admin Dashboard |
| 11 | Performance Tracking Phase 1 (study metrics, streaks) |
| 12 | Performance Tracking Phase 2 (spaced repetition SM-2 algorithm) |
| 13 | Polish & Launch Prep |

### Planned Features
Source: `ROADMAP.md`, `BUGS_AND_TODOS.md`

- **Freemium model** -- Free tier (50 cards, 5 AI/day, 2 languages) + Premium ($9.99/mo, unlimited)
- **Stripe integration** for payments
- **Spaced repetition** (SM-2 algorithm)
- **Gender field for nouns** (French le/la, German der/die/das)
- **Preposition field for verbs** (German warten auf, French penser a)
- **Multiple choice quizzes** (AI-generated, 10 per flashcard)
- **Anki export compatibility**
- **Multi-language card display** (beginner vs advanced mode)
- **Admin dashboard** for user/subscription management
- **Error tracking** (Sentry or similar)

---

## 8. CONFIGURATION & SECRETS

### Secret Manager Secrets
Source: `CLAUDE.md`, `PROJECT_STATUS.md`

| Secret Name | Purpose |
|-------------|---------|
| `db-password` | Database password (flashcards_user) |
| `google-oauth-client-secret` | Google OAuth client secret |
| `ELEVENLABS_API_KEY` | ElevenLabs API for voice cloning |
| `GEMINI_API_KEY` | Gemini API for pronunciation coaching |
| `openai-api-key` | OpenAI API for GPT-4/DALL-E/TTS |

### Cloud Run Environment Variables
Source: `PROJECT_STATUS.md`, `build-and-deploy.ps1`

| Variable | Value | Source |
|----------|-------|--------|
| `SQL_SERVER` | 35.224.242.223 | env var |
| `SQL_DATABASE` | LanguageLearning | env var |
| `SQL_USER` | flashcards_user | env var |
| `SQL_PASSWORD` | (from Secret Manager `db-password:latest`) | secret |
| `OPENAI_API_KEY` | (from Secret Manager `openai-api-key:latest`) | secret |
| `GOOGLE_CLIENT_ID` | 57478301787-... | env var |
| `GOOGLE_CLIENT_SECRET` | (from Secret Manager) | secret |
| `GOOGLE_REDIRECT_URI` | https://learn.rentyourcio.com/api/auth/google/callback | env var |
| `GEMINI_API_KEY` | (from Secret Manager) | secret |
| `ELEVENLABS_API_KEY` | (from Secret Manager) | secret |
| `BASIC_AUTH_ENABLED` | false (disabled now that OAuth is active) | env var |
| `BASIC_AUTH_USERNAME` | beta | env var |
| `BASIC_AUTH_PASSWORD` | [REDACTED — stored in environment variable, rotate if exposed] | env var |

### Environment Detection
Source: `backend/app/main.py`, `backend/app/database.py`

- `K_SERVICE` env var: Present when running on Cloud Run
- `ENVIRONMENT` env var: "qa" for QA environment, "production" (default)
- Cloud Run detection controls: HTTPS-only cookies, SameSite=none, session security

### .env.example
Source: `.env.example`

Contains all required environment variables for local development. Note: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` values are present in .env.example (should be rotated if considered exposed).

---

## 9. DEPLOYMENT

### Primary Deploy Method
Source: `CLAUDE.md`

```powershell
cd "G:\My Drive\Code\Python\Super-Flashcards"
gcloud run deploy super-flashcards --source . --region us-central1 --allow-unauthenticated
```

### Build & Deploy Script
Source: `build-and-deploy.ps1`

Full automated deployment script that:
1. Checks gcloud authentication (supports passkey accounts via `--no-launch-browser`)
2. Builds container via Cloud Build (`cloudbuild.yaml`)
3. Deploys to Cloud Run with all env vars and secrets explicitly set
4. Handles auth expiry with automatic re-authentication

### CI/CD Pipeline
Source: `.github/workflows/deploy.yml`

- **Trigger:** Push to `main` branch or manual dispatch
- **Runner:** ubuntu-latest
- **Steps:** Checkout -> Auth (GCP_SA_KEY secret) -> Setup gcloud -> Deploy -> Get URL
- **Auth method:** Service account key JSON stored in GitHub secrets as `GCP_SA_KEY`

### Docker Setup
Source: `Dockerfile`

- Base image: `python:3.11-slim`
- Installs ODBC Driver 17 for SQL Server (Debian 12)
- Copies `backend/requirements.txt`, installs dependencies
- Copies `backend/app/` and `frontend/` into container
- Images/audio served from Cloud Storage (not in container)
- Runs: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT}` (PORT=8080)

### Cloud Build Configs
Source: `cloudbuild.yaml`, `cloudbuild-qa.yaml`

- Production: Builds with `:latest` tag, `--no-cache`
- QA: Builds with `:qa` tag, pushes to container registry

### Verification
Source: `CLAUDE.md`

```powershell
# View logs
gcloud run logs read super-flashcards --region=us-central1 --limit=50

# Health check
curl https://flashcards.rentyourcio.com/health
# Or: curl https://super-flashcards-wmrla7fhwa-uc.a.run.app/health
```

### PINEAPPLE Test (LL-044)
Source: `CLAUDE.md`

Before debugging deployment issues:
1. Add `"canary": "PINEAPPLE-99999"` to /health endpoint
2. Deploy
3. Verify canary value appears in health response
4. If missing, deployment itself failed -- fix that first

### Critical Deployment Lessons
Source: `LESSONS_LEARNED_OAuth_Debug_Jan29.md`

- **NEVER use `gcloud run deploy` without all env vars** -- it can wipe existing env vars
- **Use `gcloud run services update`** for config changes (preserves other vars)
- **Never commit credential JSON files** -- use Secret Manager exclusively
- **PowerShell mangles secrets** -- use `-NoNewline` flag when piping to secret creation

---

## 10. TESTING

### Testing Framework
Source: `pytest.ini`, `tests/conftest.py`

- **Framework:** pytest with Playwright (browser automation)
- **Config:** `pytest.ini` in project root
- **Markers:** `slow`, `integration`, `smoke`
- **Browser auth:** Saved auth state in `tests/auth_state.json`
- **HTTP Basic Auth:** Included in test context (username: beta, password: flashcards2025)

### Test Files
Source: `tests/` directory

| File | Purpose |
|------|---------|
| `conftest.py` | Playwright browser context setup with auth |
| `test_batch_and_url_sharing.py` | E2E batch generation and URL card sharing |
| `test_pronunciation_e2e.py` | E2E pronunciation recording flow |
| `test_v2_6_33_deployment.py` | Deployment verification tests |
| `test_production.py` | (Empty) |

### Backend Tests
Source: `backend/tests/`

| File | Purpose |
|------|---------|
| `conftest.py` | Backend test setup |
| `test_gemini_service.py` | Gemini pronunciation analysis tests |
| `test_pronunciation_api.py` | Pronunciation API endpoint tests |
| `test_pronunciation_service.py` | Pronunciation service unit tests |

### Testing Approach
Source: `LESSONS_LEARNED.md`, `PROJECT_STATUS.md`

- **Current:** Primarily manual testing by Corey after each deployment
- **Gap:** No automated E2E tests in CI/CD pipeline (marked as high-priority tech debt)
- **Playwright tests exist** but are not integrated into CI/CD
- **Agent limitation:** Cannot test in browser, click buttons, or verify runtime behavior
- **Pattern:** Agent deploys -> provides specific test steps -> Corey tests -> reports results

### Test Commands
Source: `CLAUDE.md`

```powershell
pytest tests/ -v
```

---

## 11. INTEGRATIONS WITH OTHER PROJECTS

### project-methodology
Source: `CLAUDE.md`

- Repository: `coreyprator/project-methodology` (v3.14)
- Provides the handoff bridge protocol used for all inter-session communication
- All responses to Claude.ai/Corey must use the handoff bridge (create file -> run handoff_send.py -> provide URL)

### Handoff System
Source: `handoffs/` directory, `CLAUDE.md`

| Directory | Purpose |
|-----------|---------|
| `handoffs/inbox/` | Incoming handoff requests |
| `handoffs/outbox/` | Completed handoff responses |
| `handoffs/archive/` | Processed handoff requests |
| `handoffs/log/HANDOFF_LOG.md` | Handoff activity log |

Recent handoffs include Greek diphthong cards, Greek encoding fixes, and corrupted card deletion (HO-W1X2, HO-C3D4, HO-C4D5).

### GCS Handoff Storage
Source: `CLAUDE.md`

Handoff documents are uploaded to GCS and URL provided to the receiving party.

### Etymython Shared Etymology Graph (Planned — Priority #1 Integration)
- `flashcards` table has `etymology`, `english_cognates`, `related_words` columns (flat NVARCHAR,
  not normalized)
- These columns are bridge data for the shared etymology graph with Etymython
- Requires normalization into graph nodes before integration can proceed
- Etymython side: `english_cognates` table and `etymologies.phonetic_evolution` feed the graph

---

## 12. KNOWN ISSUES & TECHNICAL DEBT

### Critical Bugs
Source: `PROJECT_STATUS.md`

- **BUG-001:** Empty transcription returns -- 0% score even when audio was recorded
- **BUG-002:** Voice clone "Create Voice Profile" button does nothing
- **BUG-006:** Mobile OAuth session expiry (partially fixed with refresh cookie on RedirectResponse)

### Technical Debt
Source: `PROJECT_STATUS.md`, `ROADMAP.md`, `BUGS_AND_TODOS.md`

| Item | Priority | Description |
|------|----------|-------------|
| No automated E2E tests | High | Pronunciation flow untested in CI/CD |
| Hardcoded env var fallbacks | Medium | Can mask missing config in production |
| No refresh token rotation/revocation | Medium | Tokens may not refresh properly on mobile |
| Inconsistent API paths | Low | Mix of `/api/` and `/api/v1/` prefixes |
| Version tracked in 4 places | Low | No single source of truth for version |
| Static file routes in main.py | Low | Each new JS/CSS file needs manual route |
| No staging environment | High | Currently deploying directly to production |
| No error tracking (Sentry) | Medium | Only know about bugs when user reports them |
| user_id not on flashcards table | Medium | All flashcards shared across all users |
| Greek Unicode rendering | Medium | Database stores correct Unicode but UI can display corrupted Latin-1 |

### Bug Tracking Policy
Bugs BUG-001, BUG-002, BUG-006 referenced in PROJECT_STATUS.md should be tracked in MetaPM
(source of truth for all bug tracking across the portfolio). Do not maintain parallel bug lists
in this document or PROJECT_STATUS.md.

### API Key in batch_processing.py
Source: `backend/app/routers/batch_processing.py` line 40

```python
openai.api_key = "your-openai-api-key-here"  # TODO: Move to environment variable
```

This is a placeholder that should use environment variables.

---

## 13. LESSONS LEARNED (PROJECT-SPECIFIC)

Source: `LESSONS_LEARNED.md`, `LESSONS_LEARNED_OAuth_Debug_Jan29.md`

### LL-001: Passkey Authentication with gcloud
Google accounts using passkeys hang at password prompt during `gcloud` reauth. Fix: `gcloud auth login --no-launch-browser` for browser-based flow.

### LL-002: Agent Cannot Test in Browser
AI assistant cannot open browsers, click buttons, or verify runtime behavior. Every deployment must be manually tested by Corey with specific test steps provided.

### LL-003: Simple Word Lists vs Structured Documents
Document parser was designed for structured documents but users upload simple word lists. Added detection to handle both formats.

### LL-004: Integer vs UUID ID Assumptions
Code assumed numeric IDs when database uses UUIDs (`isNaN()` rejected UUIDs). Fix: Check `if (id)` instead of `if (id && !isNaN(id))`.

### LL-005: Cache Sync After Mutations
After ANY mutation (create/update/delete), reload state from cache. Treat cache as source of truth.

### LL-006: Frontend/Backend URL Mismatches
Backend registered at one path, frontend called different path. Use constants for API URLs and test with curl before frontend integration.

### LL-007: Hard Refresh Required After Deployment
Browser caching means users must `Ctrl+Shift+R` after every deployment. Always include this in test instructions.

### LL-008: gcloud run deploy Wipes Env Vars
Using `gcloud run deploy` without explicitly setting all env vars can wipe existing config. Use `gcloud run services update` for config changes.

### LL-009: Never Commit Credential Files
`google_oauth_client.json` with old credentials overrode Secret Manager values. Credentials must only come from environment variables.

### LL-010: PowerShell Mangles Secret Values
PowerShell pipe adds unexpected characters to secrets. Use `Set-Content -NoNewline` then `gcloud secrets versions add --data-file=`.

### LL-011: Transcription Match > Confidence Score
If Google STT transcribes the text correctly, the user's pronunciation was good -- even if confidence score is low. Prioritize transcription match over raw confidence.

---

## 14. DIRECTIVES FOR AI SESSIONS

Source: `CLAUDE.md`

### Mandatory Pre-Work (LL-045)
1. Read entire CLAUDE.md before writing any code
2. State: "Service is super-flashcards, database is LanguageLearning"
3. NEVER invent infrastructure values

### Definition of Done (MANDATORY)
Source: `CLAUDE.md`

1. Code changes complete
2. Tests pass
3. All changes committed and pushed to `origin main`
4. Deployed to Cloud Run
5. Health check passes at `https://flashcards.rentyourcio.com/health`
6. Version matches in health response
7. UAT checklist created, Corey executes, results passed
8. Handoff created with deployment verification, uploaded to GCS, URL provided

### Forbidden Actions
- "Test locally" (no localhost exists in production context)
- "Let me know if you want me to deploy" (AI owns deployment)
- "Please run this command" (AI runs commands)
- Saying "Complete" / "Done" / "Working" without deployed proof
- Hardcoding API keys or secrets in code
- Committing secrets to git

### Security Requirements
- Use GCP Secret Manager for ALL secrets
- Reference secrets by name, never by value
- Mask secrets in logs: `key=***REDACTED***`
- If secret exposed: rotate immediately, notify Corey, audit, document

### Handoff Protocol
1. Note handoff ID (HO-XXXX)
2. Archive to `handoffs/archive/`
3. Delete from inbox
4. Include completion table (ID, Project, Task, Status, Commit, Handoff URL)
5. Include summary, files changed, inbox cleanup confirmation

### Git Commit Format
```
feat: [description] (HO-XXXX)
fix: [description] (HO-XXXX)
```

### Claude Code Permissions
Source: `.claude/settings.json`

**Allowed:** Read, Edit, Bash(git/python/pip/npm/gcloud/cd/ls/cat/mkdir/cp/mv)
**Denied:** Bash(rm -rf), Bash(sudo), Read(.env*)

---

## 15. OPEN QUESTIONS

1. **When will user_id FK be added to flashcards table?** -- Currently all flashcards are shared. Required for multi-tenant isolation and monetization. (Source: `backend/app/models.py` comments, `ROADMAP.md`)

2. **Greek Unicode rendering issue** -- Database stores correct Unicode but UI shows corrupted Latin-1. Root cause is a rendering/encoding issue, not data corruption. 17 cards were deleted as workaround. (Source: `handoffs/outbox/20260211_HO-W1X2-complete.md`)

3. **What is the status of the QA environment?** -- `cloudbuild-qa.yaml` and `build-and-deploy-qa.ps1` exist but `PROJECT_STATUS.md` doesn't mention an active QA service. `docs/QA_ENVIRONMENT_SETUP.md` and `docs/QA_ENVIRONMENT_SETUP_PLAN.md` exist. (Source: file listing)

4. **How are Gemini prompt templates managed?** -- 8 templates loaded in database per `PROJECT_STATUS.md`, but no admin UI or script to manage them. (Source: `backend/app/services/gemini_service.py`)

5. **What is the status of the deep-analysis endpoint?** -- `POST /api/v1/pronunciation/deep-analysis/{attempt_id}` returns 501 "Audio retrieval not yet implemented" per code. (Source: `backend/app/routers/pronunciation.py` line 253)

6. **Is the feedback table planned?** -- `POST /api/v1/pronunciation/feedback/{attempt_id}` logs feedback but does not store it (TODO comment). (Source: `backend/app/routers/pronunciation.py` line 334)

7. **Should `openai.api_key = "your-openai-api-key-here"` in batch_processing.py be fixed?** -- This is dead code since the actual API key comes from environment, but it's a hardcoded string. (Source: `backend/app/routers/batch_processing.py` line 40)

8. **What is the current flashcard count by language?** -- README says 758 total (as of Oct 2025), but Greek cards were recently modified (405 remaining after 17 deletions). Total count may have changed. (Source: `README.md`, handoff docs)

---

## DOCUMENTATION SOURCES INVENTORY

### Found and Read

| File/Directory | Status | Notes |
|----------------|--------|-------|
| `CLAUDE.md` | READ | Primary AI instructions, infrastructure values |
| `README.md` | READ | Project overview, architecture, features |
| `.claude/settings.json` | READ | Permissions config |
| `.claude/settings.local.json` | NOT FOUND | Does not exist |
| `.env.example` | READ | Environment variable template |
| `Dockerfile` | READ | Container build config |
| `cloudbuild.yaml` | READ | Production Cloud Build |
| `cloudbuild-qa.yaml` | READ | QA Cloud Build |
| `backend/requirements.txt` | READ | Python dependencies |
| `pytest.ini` | READ | Test configuration |
| `backend/app/main.py` | READ | FastAPI app entry point |
| `backend/app/models.py` | READ | All ORM models |
| `backend/app/database.py` | READ | Database connection |
| `backend/app/schemas.py` | READ | Pydantic schemas |
| `backend/app/crud.py` | READ | Database operations |
| `backend/app/routers/*.py` | READ (all 16) | All API routers |
| `backend/app/services/*.py` | READ (all 11) | All service files |
| `frontend/` | LISTED | File inventory completed |
| `tests/conftest.py` | READ | Test configuration |
| `tests/test_pronunciation_e2e.py` | READ | E2E pronunciation tests |
| `tests/test_batch_and_url_sharing.py` | READ (partial) | Batch/URL tests |
| `tests/test_production.py` | READ | Empty file |
| `backend/tests/*.py` | LISTED | 3 test files |
| `.github/workflows/deploy.yml` | READ | CI/CD pipeline |
| `ROADMAP.md` | READ | Feature roadmap, monetization plan |
| `LESSONS_LEARNED.md` | READ | General lessons learned |
| `LESSONS_LEARNED_OAuth_Debug_Jan29.md` | READ | OAuth-specific lessons |
| `PROJECT_STATUS.md` | READ | Current sprint status, bugs |
| `BUGS_AND_TODOS.md` | READ | Bug tracker, feature TODOs |
| `PRONUNCIATION_UI_REDESIGN_SPEC.md` | READ | UI redesign spec |
| `handoffs/log/HANDOFF_LOG.md` | READ | Handoff activity log |
| `handoffs/outbox/*.md` | READ (1 of 5) | Completion handoffs |
| `handoffs/archive/*.md` | LISTED | 3 archived handoffs |
| `build-and-deploy.ps1` | READ | Deployment script |
| `create_pronunciation_attempts_table.sql` | READ | Schema DDL |
| `backend/create_missing_tables.sql` | READ | Schema DDL |
| `backend/app/services/ipa_diff_service.py` | READ | IPA comparison logic |

### Found but Not Read (Lower Priority)

| File/Directory | Notes |
|----------------|-------|
| `docs/` (50+ files) | Extensive documentation directory -- sprint summaries, handoff guides, architecture docs, testing guides |
| `scripts/` (25+ files) | Batch processing scripts, database tools, test scripts |
| Root `.md` files (40+) | Sprint handoffs, deployment docs, OAuth docs, debug docs |
| `frontend/*.js` (full content) | JS files listed but not all read in full |
| Various `.sql` files | Schema migration scripts |
| `backend/scripts/` | Database migration and batch processing scripts |

### Not Found

| Expected File | Status |
|---------------|--------|
| `.claude/settings.local.json` | Does not exist |
| `config.py` / `settings.py` | Not used (config is in database.py and env vars) |
| `pyproject.toml` / `package.json` | Not used (requirements.txt for Python deps) |
| `alembic.ini` | Not at root (alembic versions in `backend/app/alembic/`) |
| `docs/decisions/` | Directory does not exist |
| `docs/specs/` | Directory does not exist |
| `handoffs/inbox/` | No files found (inbox is clean per protocol) |

---

*End of Project Knowledge Document*
*Last updated: 2026-02-15*
