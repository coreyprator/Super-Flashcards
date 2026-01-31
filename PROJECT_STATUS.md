# Super Flashcards - Project Status

**Last Updated:** January 30, 2026
**Version:** 2.8.x (pronunciation feature branch)
**Author:** Claude (Architect) + Corey (Project Lead)

---

## 1. Current Sprint/Phase

### Sprint 8.5: Pronunciation Practice Enhancement

| Sub-Sprint | Description | Status |
|------------|-------------|--------|
| 8.5 | Gemini Deep Analysis Backend | ✅ Deployed |
| 8.5b | Frontend Integration | ⚠️ Partial |
| 8.5c | Unified STT + Gemini Feedback | 📋 Prompted |
| 8.5d | Bug Fixes + IPA Comparison | 📋 Prompted |
| 8.5e | 11Labs Voice Clone | ⚠️ Backend ready, frontend broken |

**Overall Phase:** Pronunciation Practice v2 - Adding AI coaching and personalized voice feedback

---

## 2. What's Working (Deployed & Tested)

### Core Application
- ✅ OAuth authentication with Google (fixed Jan 29)
- ✅ Flashcard CRUD operations
- ✅ Multi-language support (fr, es, el, de, it, pt, ja, zh)
- ✅ Google Cloud TTS for reference audio
- ✅ Basic study mode and progress tracking

### Pronunciation Feature - Backend
- ✅ Audio recording upload to GCS
- ✅ Google Cloud Speech-to-Text integration
- ✅ Word-level confidence scores
- ✅ IPA generation via epitran library
- ✅ Database storage in `PronunciationAttempts` table

### Gemini Integration
- ✅ 8 language-specific prompt templates in database
- ✅ Deep analysis and feedback endpoints deployed

### 11Labs Integration
- ✅ API key in Secret Manager
- ✅ Database tables created (UserVoiceClones, VoiceCloneSamples, GeneratedPronunciations)
- ✅ PronunciationDebugLogs table for troubleshooting

### Infrastructure
- ✅ Cloud Run: `super-flashcards` (us-central1)
- ✅ Custom domain: `learn.rentyourcio.com`
- ✅ Cloud SQL: `LanguageLearning` database
- ✅ GCS bucket for media storage

---

## 3. What's In Progress or Broken

### P0 - Critical Bugs

| Bug ID | Issue | Impact |
|--------|-------|--------|
| BUG-001 | Empty transcription returns | 0% score even when audio recorded |
| BUG-002 | Voice clone button non-functional | "Create Voice Profile" does nothing |

### P1 - High Priority Issues

| Bug ID | Issue | Impact |
|--------|-------|--------|
| BUG-003 | Keyboard shortcuts inconsistent | Space/Enter unreliable on mobile |
| BUG-005 | Gemini vs STT disagreement | Coaching contradicts word scores |
| BUG-006 | Mobile OAuth session expiry | Frequent re-login on iPhone |

### P2 - Known Issues

| Issue | Description |
|-------|-------------|
| Multi-tenant stats | User statistics may not be properly isolated |
| Feedback contradiction | "53% Keep practicing" alongside "Perfect match!" |
| IPA comparison display | Confusing arrows when spoken IPA is empty |

---

## 4. Key Decisions Made

| Decision | Rationale | Date |
|----------|-----------|------|
| **Single round-trip for STT + Gemini** | User shouldn't wait for two API calls | Jan 30 |
| **11Labs voice clone over IPA-to-audio** | Hearing yourself say it correctly is more motivating | Jan 30 |
| **Transcription match beats confidence** | If STT transcribes correctly, pronunciation was good | Jan 30 |
| **Delete google_oauth_client.json** | Hardcoded credentials overrode Secret Manager | Jan 29 |
| **Use `gcloud run services update` not `deploy`** | `deploy` can wipe env vars | Jan 29 |

---

## 5. Technical Debt

| Item | Description | Priority |
|------|-------------|----------|
| Hardcoded env var fallbacks | Can mask missing config | Medium |
| No automated E2E tests | Pronunciation flow untested in CI/CD | High |
| Inconsistent API path | Some `/api/`, others `/api/v1/` | Low |
| No refresh token rotation | OAuth tokens may not refresh on mobile | Medium |

---

## 6. Environment Variables (Cloud Run)

**Secrets:**
- `GOOGLE_CLIENT_SECRET` → `google-oauth-client-secret:latest`
- `SQL_PASSWORD` → `db-password:17`
- `OPENAI_API_KEY` → `openai-api-key:latest`
- `GEMINI_API_KEY` → `GEMINI_API_KEY:latest`
- `ELEVENLABS_API_KEY` → `ELEVENLABS_API_KEY:latest`

**Env vars:**
- `SQL_SERVER=35.224.242.223`
- `SQL_DATABASE=LanguageLearning`
- `SQL_USER=flashcards_user`

---

## 7. Next Steps (Recommended Order)

1. 🟡 Fix BUG-001 (empty transcription) — P0
2. 🟡 Fix BUG-002 (voice clone button) — P0
3. ⬜ Implement unified STT + Gemini response (Sprint 8.5c)
4. ⬜ Add IPA phoneme comparison with highlighting (Sprint 8.5d)
5. ⬜ Complete voice clone frontend workflow (Sprint 8.5e)
6. ⬜ Fix mobile OAuth session persistence

---

## 8. Reference

| Resource | URL |
|----------|-----|
| Live App | https://learn.rentyourcio.com |
| Health Check | https://super-flashcards-wmrla7fhwa-uc.a.run.app/health |

---

*This document should be updated after each sprint or significant change.*
