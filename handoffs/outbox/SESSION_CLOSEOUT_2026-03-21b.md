# SESSION CLOSEOUT — 2026-03-21 (SM03)
## Super Flashcards 🟡 SF-CACHE-BUST-001 PTH-SM03

---

## SPRINT SUMMARY — 4 Fixes

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Fix 1: Script tag v= param | ✅ Done | `app.js?v=3.4.0` → `v=3.4.2` in index.html |
| 2 | Fix 2: SW CACHE_NAME | ✅ Done | `flashcards-v1` → `flashcards-v3.4.2` forces cache eviction |
| 3 | Fix 3: APP_JS_VERSION | ✅ Done | `3.4.1` → `3.4.2` in app.js |
| 4 | Fix 4: Related word link styling | ✅ Done | In-deck chips: dark indigo bg + white text + underline (unambiguously hyperlink) |

---

## VERSION & REVISION
- Version: 3.4.2 (was 3.4.1)
- Commit: 5fd32b1

---

## FILES CHANGED
- `frontend/index.html` — app.js?v=3.4.2, APP_VERSION 3.4.2, version badge v3.4.2
- `frontend/sw.js` — CACHE_NAME flashcards-v3.4.2
- `frontend/app.js` — APP_JS_VERSION 3.4.2, related word in-deck chip style
- `backend/app/main.py` — version 3.4.2
- `.gitignore` — exclude root UAT/design HTML docs and uat/

---

## CANARIES
- C1: `/app.js?v=` in served HTML → `3.4.2` ✓
- C2: `APP_VERSION` in served HTML → `3.4.2` ✓
- C3: `/static/sw.js` CACHE_NAME → `flashcards-v3.4.2` ✓
- C4: `/health` → `{"version":"3.4.2"}` ✓
- C5: `/app.js` APP_JS_VERSION → `3.4.2` ✓

---

## HANDOFF & UAT
- Handoff ID: 34AF6638-35CA-4F77-AFF7-3541184F1FB4
- UAT spec: 5C20362B-A8C0-4E66-91DB-3C806086A08A
- UAT URL: https://metapm.rentyourcio.com/uat/5C20362B-A8C0-4E66-91DB-3C806086A08A

---

## ROOT CAUSE NOTE
SM02 bumped `APP_VERSION` in the `<script>` block at the top of index.html to `3.4.1` but missed the `<script src="/app.js?v=3.4.0">` tag lower in the file. Browser caches treat `?v=` as a unique URL — `app.js?v=3.4.0` was served from cache while `APP_VERSION` reported `3.4.1`, causing the mismatch error. Future version bumps must update BOTH the inline `APP_VERSION` script AND the `?v=` query param.
