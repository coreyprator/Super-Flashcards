# SESSION CLOSEOUT — 2026-03-22 (SM04)
## Super Flashcards 🟡 SF-SM04-TYPEAHEAD-SPEECHIFY PTH-SM04

---

## SPRINT SUMMARY — 4 Items

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | REQ-003: Type-ahead on Add Card | ✅ Done | SW skipWaiting()+clients.claim() → forces immediate cache eviction; old SW was persisting stale app.js |
| 2 | REQ-001: Speechify read-aloud | ✅ Done | readCardAloud(cardId) Web Speech API; 🗣️ Read button in card detail + card list views |
| 3 | SF-025: Remove duplicate PK.md | ✅ N/A | No PK.md exists; only PROJECT_KNOWLEDGE.md (canonical). BV-03 passes trivially. |
| 4 | EM-013: Etymython PIE root → EFG link | ✅ Done | Code was already committed (00291a3) but CI used stale Artifact Registry image. Redeployed via gcr.io fallback → etymython-00209-jrw now live with EFG link. |

---

## VERSION & REVISION
- SF Version: 3.4.3 (was 3.4.2)
- SF Commit: 2bae3b0
- Etymython Revision: etymython-00209-jrw (EM-013 link now live)

---

## FILES CHANGED

### Super Flashcards
- `frontend/sw.js` — CACHE_NAME flashcards-v3.4.3, self.skipWaiting(), clients.claim()
- `frontend/app.js` — v3.4.3, readCardAloud() function, 🗣️ Read buttons (card list + card detail)
- `frontend/index.html` — APP_VERSION 3.4.3, app.js?v=3.4.3, version badge v3.4.3
- `backend/app/main.py` — version 3.4.3

### Etymython (EM-013 deploy only, no new commit)
- `frontend/index.html` — DCC PIE root now links to `https://efg.rentyourcio.com?search=` (committed 2026-03-20 as 00291a3, deployed this session via gcr.io fallback)

---

## CANARIES
- C1: `/api/flashcards/search?q=fr&limit=3` → 3 results ✓
- C2: `SpeechSynthesis` in live app.js → 2 occurrences ✓
- C3: `PK.md` count → 0 (canonical is PROJECT_KNOWLEDGE.md) ✓
- C4: `URLSearchParams` in efg.rentyourcio.com → 1 ✓
- C5: `app.js?v=3.4.3` in served HTML ✓
- C6: `/health` → `{"version":"3.4.3"}` ✓
- C7: `skipWaiting` + `clients.claim` in live sw.js → 1 each ✓
- C8: `efg.rentyourcio` in Etymython live static → 1 ✓
- C9: `readCardAloud` in live app.js → 3 occurrences ✓

---

## HANDOFF & UAT
- Handoff ID: 2DE5869E-B90B-466E-9715-9F0519593363
- UAT spec: 7F46E96E-62CD-4C93-9B29-C83F4DC666FD
- UAT URL: https://metapm.rentyourcio.com/uat/7F46E96E-62CD-4C93-9B29-C83F4DC666FD

---

## ROOT CAUSE NOTES

### REQ-003 (Type-ahead) — Root Cause
The type-ahead code was correct in all three prior attempts (SM01/SM02/SM03). The failure was a service worker activation timing issue: the old SW (`flashcards-v1`) remained active in PL's browser tabs until all tabs were closed — despite a new SW being installed with `CACHE_NAME = 'flashcards-v3.4.2'`. Without `self.skipWaiting()`, a new SW only activates after ALL tabs using the old SW are closed. PL never saw the new code because the old SW served cached files. Fix: `self.skipWaiting()` + `clients.claim()` in sw.js ensures the new SW activates immediately on next navigation, bypassing the old one.

### EM-013 (Etymython EFG link) — Root Cause
The EM-013 commit (00291a3, 2026-03-20) was on origin/main and GitHub Actions reported "success" but no new Cloud Run revision was created after 2026-03-16. The MEMORY.md note confirms Artifact Registry `cloud-run-source-deploy` has been broken since 2026-03-17. The GitHub Actions CI run succeeded (no error exit) but the image was not actually pushed/deployed to a new revision. Fix: manual deploy via gcr.io fallback (`gcloud builds submit --tag gcr.io/...` + `gcloud run deploy --image gcr.io/...`).
