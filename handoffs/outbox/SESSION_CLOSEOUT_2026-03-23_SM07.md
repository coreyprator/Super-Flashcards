# SESSION CLOSEOUT — 2026-03-23 (SM07)
## Super Flashcards 🟡 SM07-TTS-SPELLCHECK PTH-SM07

---

## SPRINT SUMMARY — 3 Fixes

| # | Fix | Status | Root Cause / Notes |
|---|-----|--------|---------------------|
| 1 | TTS logging — surface silent 11Labs failures | ✅ Done | Added `logger.info` on success + `logger.error` with `error_detail` on exception in `/api/tts`. Previously errors were logged but the error_detail was dropped. |
| 2 | TTS full card content — definition included | ✅ Done | SM06 `playTTS()` had word+etymology+PIE+cognates but missed `definition` and `ipa_pronunciation`. Now: word, pronunciation, definition, etymology, PIE root, cognates. |
| 3 | Add Card spell suggestions via Wiktionary | ✅ Done | `getSpellingSuggestions(word, langCode)` → `lang.wiktionary.org/w/api.php?action=opensearch`. `_attachTypeahead()` extended with optional `langCodeFn`; falls back to Wiktionary when DB search returns empty. "SPELLING SUGGESTIONS" header in dropdown. |

---

## VERSION & REVISION
- SF Version: 3.4.6 (was 3.4.5)
- SF Commit: 12d4ce5
- Deployed: GitHub Actions CI → Cloud Run (success)

---

## FILES CHANGED

### Super Flashcards
- `backend/app/routers/card_audio.py` — SM07 Fix 1: added `logger.info` at start of `/api/tts`; `logger.info` on success; `logger.error` with `error_detail` on failure
- `backend/app/main.py` — version 3.4.6
- `frontend/app.js` — v3.4.6; Fix 2: `playTTS()` includes `ipa_pronunciation` + `definition`; Fix 3: `getSpellingSuggestions()`, `_showSpellSuggestions()`, `_attachTypeahead()` extended with `langCodeFn`; `setupWordTypeahead()` passes `aiLangFn` for AI form
- `frontend/index.html` — v3.4.6
- `frontend/sw.js` — CACHE_NAME flashcards-v3.4.6

---

## PHASE 0-C DIAGNOSTIC RESULTS

```
11Labs key (ELEVENLABS_API_KEY): 50 chars (sk_3b9...) — VALID
Direct 11Labs API: NOT re-tested (key found valid, app endpoint confirmed working)
App /api/tts: HTTP 200, JSON {"audio_url": "https://storage.googleapis.com/...", "provider": "11labs"}
GCS audio URL: HTTP 200, 14254 bytes (real MP3)
```

Root cause of TTS robotic fallback: Backend works correctly. The silent failure path occurs when `get_or_generate_audio_for_text()` throws (network/quota), returning `{"error": "use_browser_tts"}`. Frontend at line 1618 then uses `window.speechSynthesis`. Fix 1 adds `error_detail` to the response and `logger.error` to the backend.

---

## CANARIES
- C1: Phase 0-C — `ELEVENLABS_API_KEY` 50 chars ✓
- C2: `curl .../static/sw.js | grep CACHE_NAME` → `flashcards-v3.4.6` ✓
- CP-1: `POST /api/tts {"text":"bonjour monde","language":"fr"}` → `{"audio_url":"https://storage.googleapis.com/...","provider":"11labs"}` ✓
- C5: `/health` → `{"status":"healthy","version":"3.4.6","database":"connected"}` ✓

---

## HANDOFF & UAT
- Handoff ID: B09E678B-8EEB-4F22-8678-DA7DE183AC16
- UAT spec: 3769E002-C97A-4252-B697-51B70219093C
- UAT URL: https://metapm.rentyourcio.com/uat/3769E002-C97A-4252-B697-51B70219093C

---

## PL ACTIONS REQUIRED
- BV-01: Open French card with etymology+definition → play → full content read in natural voice (not robotic). Should include definition text.
- BV-02: Add Card → French language → type "francais" (missing ç) → dropdown shows "SPELLING SUGGESTIONS" header + "français" → click → field corrects
- BV-03: Version badge shows v3.4.6 (or `/health` → 3.4.6)
