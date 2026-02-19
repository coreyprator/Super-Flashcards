# Super-Flashcards -- Project Knowledge Document

Generated/Updated: 2026-02-18 — Sprint "Etymython Integration + MetaPM Dashboard Rework"
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
| **Cloud Run URL** | https://super-flashcards-wmrla7fhwa-uc.a.run.app | `CLAUDE.md` |
| **GCP Project** | super-flashcards-475210 | `CLAUDE.md` |
| **Cloud Run Service** | super-flashcards | `CLAUDE.md` |
| **Region** | us-central1 | `CLAUDE.md` |
| **Database** | LanguageLearning (SQL Server on flashcards-db, 35.224.242.223) | `CLAUDE.md` |
| **Emoji / Color** | 🟡 Yellow | project-methodology registry |
| **Latest Revision** | super-flashcards-00288-hr9 | `Sprint_CloseOut_2026-02-18.md` |
| **Current Sprint** | Sprint 8.5 — Pronunciation Practice + Etymython Integration | `CLAUDE.md` |

---

## 2. ARCHITECTURE

| Component | Technology |
|-----------|-----------|
| Backend | FastAPI (Python) + pyodbc (SQL Server) |
| Frontend | HTML/JS templates served by backend (Vanilla JS + Tailwind CSS) |
| Database Driver | pyodbc with ODBC Driver 17 for SQL Server |
| Deployment | Docker → gcloud run deploy → Cloud Run |
| Audio | Google TTS (pronunciation cards), ElevenLabs (premium pronunciation) |
| AI | Gemini API, OpenAI API (GPT-4o) |
| Cloud Storage | GCS (audio files, images) |

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

| Table | Purpose |
|-------|---------|
| **flashcards** | Main vocabulary card table (word, translation, category, image, audio, IPA) |
| **languages** | Language registry (fr, el, en, etc.) |
| **users** | Google OAuth users (google_id, email, name, picture) |
| **user_languages** | User language enrollment (FK: users, languages) |
| **study_sessions** | Spaced repetition data (ease_rating 1-5, time_spent_seconds) |
| **UserVoiceClones** | Voice clone records per user |
| **VoiceCloneSamples** | Audio samples for voice cloning |
| **GeneratedPronunciations** | TTS-generated audio metadata |
| **PronunciationAttempts** | User pronunciation practice (PascalCase -- DUPLICATE, see issue SF-012) |
| **pronunciation_attempts** | Same purpose as above, lowercase -- DUPLICATE of PronunciationAttempts |
| **PronunciationDebugLogs** | Pronunciation debugging records |
| **PronunciationPromptTemplates** | Pronunciation prompt management |
| **api_debug_logs** | API debug logging |
| **View: vw_UserPronunciationProgress** | Aggregated pronunciation progress per user |

> **SF-012 Duplicate Table Bug:** Both `PronunciationAttempts` (PascalCase) and `pronunciation_attempts` (lowercase) exist. Causes confusion. Cleanup deferred.

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

## 5. KEY ENDPOINTS

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check with version + db status |
| GET | `/api/cards` | List flashcards with filtering |
| GET | `/api/cards/{id}` | Get single card |
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/languages` | List supported languages |
| POST | `/api/study/session` | Record study session |
| GET | `/api/pronunciation/{id}` | Get pronunciation audio |
| POST | `/api/pronunciation/attempt` | Submit pronunciation attempt |

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

### Verification
```powershell
# Must confirm correct project first
gcloud config get-value project
# Expected: super-flashcards-475210

# Health check
curl https://flashcards.rentyourcio.com/health

# View logs
gcloud run logs read super-flashcards --region=us-central1 --limit=50
```

### PINEAPPLE Test (LL-044)
Add `"canary": "PINEAPPLE-99999"` to /health endpoint, deploy, verify it appears. If missing, deployment failed.

---

## 9. KNOWN ISSUES & TECHNICAL DEBT

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| SF-012 | Duplicate pronunciation_attempts tables (PascalCase + lowercase) | P3 | Open — cleanup deferred |
| — | Console errors: import/CSV/JSON button not found | P3 | Non-blocking |
| — | study_sessions ease_rating collected but SM-2 algorithm may not be using it | P2 | Verify SF-007 |

---

## 10. WHAT'S NEXT (per Roadmap_Status_Report_2026-02-18.md)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| SF-007 | Spaced repetition verification | P2 | study_sessions collects ease_rating — verify if SM-2 is implemented or just data collection |
| SF-013 | PIE root field + API enrichment | P2 | Add depth layer: SF card → Etymython etymology → PIE root |
| SF-014 | Cross-language search from header bar | P2 | New requirement from sprint |
| SF-006 | Etymology bridge normalization | P2 | Columns exist, check data quality |
| AU02 | Fix post-login redirect (minor, shared with Etymython) | P3 | |

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
