# SESSION CLOSEOUT — 2026-03-22 (SM05)
## Super Flashcards 🟡 SF-SM05-TTS-TYPEAHEAD PTH-SM05

---

## SPRINT SUMMARY — 3 Items

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | REQ-003: Type-ahead on Add Card | ✅ Done | Race condition fix: setupWordTypeahead() moved before await loadLanguages(). Root cause: IIFE ran AFTER loadFlashcards() (1497 cards, 2-10s). User could click Add Card and type before listener was attached. |
| 2 | REQ-001: TTS Provider Selector | ✅ Done | playTTS() unified button (SVG icon). POST /api/tts → 11Labs or browser fallback. ⚙️ Settings panel in nav bar. Stop button while playing. |
| 3 | EM-013: PIE root → EFG link | ✅ Already Live | Link deployed SM04 (etymython-00209-jrw). Confirmed in Etymython code at line 2532. Note: Aphrodite has NO DCC data. BV-04 should test with Helios (id=7, PIE root `*sol`). |

---

## VERSION & REVISION
- SF Version: 3.4.4 (was 3.4.3)
- SF Commit: 90f4b48
- Etymython: unchanged (etymython-00209-jrw, EM-013 already live)

---

## FILES CHANGED

### Super Flashcards
- `frontend/app.js` — v3.4.4; setupWordTypeahead() extracted to named function at top level; playTTS()/stopTTS()/getTTSButtonHTML() functions; TTS provider settings panel wired in initializeNewUI()
- `frontend/index.html` — APP_VERSION 3.4.4, app.js?v=3.4.4, version badge v3.4.4, ⚙️ settings button + settings panel with TTS provider select
- `frontend/sw.js` — CACHE_NAME flashcards-v3.4.4
- `backend/app/main.py` — version 3.4.4
- `backend/app/routers/card_audio.py` — POST /api/tts endpoint (TTSRequest model, 11Labs routing)
- `backend/app/services/elevenlabs_tts_service.py` — get_or_generate_audio_for_text() function (MD5 hash cache key)

---

## ROOT CAUSE NOTES

### REQ-003 (Type-ahead) — Phase 0-D Root Cause
The setupWordTypeahead() IIFE was positioned AFTER `await loadLanguages()` inside the DOMContentLoaded async handler. `loadLanguages()` internally calls `await loadFlashcards()` which loads all 1497 Greek cards from the network — taking 2-10+ seconds on first load.

`initializeNewUI()` runs BEFORE this (at line 3505), making the Add Card button functional. A user who clicks Add Card → Manual → starts typing while loadFlashcards() is still in progress has NO input event listener yet. The events fire with nothing attached. No dropdown appears.

Fix: extracted IIFE to named function `setupWordTypeahead()`, called immediately after `setupDebugButtons()` (before any awaits). Listener is now attached within milliseconds of DOM ready.

### REQ-001 (TTS) — Architecture Notes
- New `playTTS(cardId)` function reads `localStorage.tts_provider` (default: '11labs')
- `POST /api/tts {text, language, provider}` → 11Labs returns GCS URL; browser returns `{error: "use_browser_tts"}`
- 11Labs audio keyed by MD5(text)[:16] in GCS `sf/audio/tts/` prefix
- SVG person-speaking icon; stop (■) icon while playing; tooltip shows active provider
- Settings panel toggled by ⚙️ gear icon next to Add Card button

---

## CANARIES
- C1: Phase 0-D diagnosis — setupWordTypeahead IIFE was after await loadLanguages() (race condition) ✓
- C2: `curl https://learn.rentyourcio.com | grep "app.js?v="` → `app.js?v=3.4.4` ✓
- C3: `curl https://learn.rentyourcio.com/static/sw.js | grep CACHE_NAME` → `flashcards-v3.4.4` ✓
- C4: `POST /api/tts {"text":"bonjour","language":"fr","provider":"11labs"}` → `{"audio_url":"https://storage.googleapis.com/super-flashcards-media/sf/audio/tts/f02368945726d5fc.mp3","provider":"11labs"}` ✓
- C5: `/health` → `{"status":"healthy","version":"3.4.4","database":"connected"}` ✓

---

## HANDOFF & UAT
- Handoff ID: 2B1D6AA4-5B9F-4237-9C04-D04C612FCE3F
- UAT spec: 5274BB4A-49A5-4E25-B225-ABAAAC6E88F4
- UAT URL: https://metapm.rentyourcio.com/uat/5274BB4A-49A5-4E25-B225-ABAAAC6E88F4

---

## PL ACTIONS REQUIRED
- BV-01: Hard refresh (Ctrl+Shift+R), Add Card → Manual → type 3+ chars → dropdown appears
- BV-02: Open card → ⧯ button → natural audio → stop (■) button works
- BV-03: ⚙️ Settings → TTS Provider → select 11Labs → play card → tooltip shows "11Labs"
- BV-04: Etymython → search Helios (NOT Aphrodite — no DCC data) → DCC panel → click PIE root (*sol) → EFG opens
- BV-05: Version badge shows v3.4.4
