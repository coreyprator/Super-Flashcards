# CC Rework Sprint: Super Flashcards — Version Audit + UAT Failures

## 🚨 BOOTSTRAP GATE
**Read Bootstrap v1.1 FIRST** — located at:
`G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md`

Complete ALL pre-work gates before writing any code:
1. Read `PROJECT_KNOWLEDGE.md`
2. Read `CLAUDE.md`
3. Activate service account
4. State project identity
5. `git pull origin main`
6. Read previous `SESSION_CLOSEOUT.md`

---

## 🔐 Auth Check

```powershell
# Verify service account is active
gcloud auth list
# Expected: cc-deploy@super-flashcards-475210.iam.gserviceaccount.com (active)

# If not active:
gcloud auth activate-service-account cc-deploy@super-flashcards-475210.iam.gserviceaccount.com --key-file=C:\venvs\cc-deploy-key.json

# DEPLOY WORKAROUND: cc-deploy SA cannot deploy. Switch for deploy only:
# gcloud config set account cprator@cbsware.com
# (switch back after deploy)
```

---

## 📋 Context

**Project**: Super Flashcards
**Claimed Version**: v3.0.0
**Production URL**: super-flashcards-57478301787.us-central1.run.app
**Cloud SQL**: 35.224.242.223, instance flashcards-db

### Critical Issue: Version Mismatch
PL's UAT reported: **Badge: v3.0.0, JS: v2.10.2, HTML: 3.0.0**

The browser is showing a version mismatch warning ("Press Ctrl+Shift+R to hard refresh!"). This means the Sprint 9 JavaScript bundle was not fully deployed or the browser is serving stale cached JS from a CDN or service worker.

This is the FIRST thing to investigate. If the JS is stale, most UAT failures may resolve once the correct JS is deployed and cache-busted.

### UAT Results (6 passed, 5 failed, 2 skipped out of 13)

**PASSED**: SM-01, SM-02, SR-01, PD-01, PD-02, REG-01
**FAILED**: SR-02, SR-03, DIF-01, PIE-01, PIE-02
**SKIPPED**: SR-04, CLN-01

### UAT Handoff
Check MetaPM for the Sprint 9 build handoff for commit details and what CC claimed to have delivered.

---

## 🔧 Requirements (Priority Order)

### P0: Version Audit — Fix JS Version Mismatch [SM-01 Critical Note]

**This must be resolved BEFORE investigating any other failures.** Many UAT failures may be caused by stale v2.10.2 JS being served instead of v3.0.0.

Investigation steps:
1. **Check what's deployed**: `gcloud run revisions describe <latest-revision> --region=us-central1` — what image is running?
2. **Check the JS bundle**: In the deployed container, find the main JS bundle. Search for version string. Is it v3.0.0 or v2.10.2?
3. **Check for caching issues**:
   - Does the app use a service worker? If so, is it caching old JS?
   - Are static files served with cache-busting hashes (e.g., `app.abc123.js`)? Or are they `app.js` with long cache headers?
   - Is there a CDN (Cloud CDN, Cloudflare) caching old assets?
4. **Check git**: Is the v3.0.0 JS actually committed? `git log --oneline | head -10` and check the JS source for version strings.
5. **Fix**:
   - If JS wasn't committed: commit the v3.0.0 JS and redeploy
   - If JS was committed but not in the Docker build: fix the Dockerfile/build process
   - If caching: add cache-busting (content hash in filename, or version query param `app.js?v=3.0.0`), clear any CDN/service worker cache
   - If service worker: ensure it updates on deploy, doesn't serve stale assets

**Acceptance criteria**:
- `curl -s https://<SF_URL>/static/js/<main-bundle> | grep -o 'v[0-9]*\.[0-9]*\.[0-9]*'` returns `v3.0.0` consistently
- The version mismatch warning does NOT appear in the browser
- Badge, JS, and HTML all show v3.0.0 (or the new version after this sprint)

### P1: Spaced Repetition — Study Mode [SR-02, SR-03]

**After P0 is fixed, verify whether these still fail:**

- **SR-02**: Cards in Study mode should be ordered by spaced repetition algorithm (due date, not sequential). If all 1,583 cards are "New" with no review history, the algorithm should present them in a learning sequence, not just browse order. Verify the study endpoint returns cards sorted by due date / priority.
- **SR-03**: "Again / Hard / Good / Easy" rating buttons. PL noted "I don't see any rate card button" in one view but the buttons DO appear in the captured UI text ("😰 Again 😓 Hard 🙂 Good 😊 Easy"). This may be a visibility/UX issue — are the buttons below the fold? Hidden until a card is flipped? Only visible after showing details? If the JS version mismatch is fixed and the buttons are present, this may resolve.
- **SR-04**: After fixing SR-02/SR-03, verify: when all due cards are reviewed, a "done for today" message appears.

**Acceptance criteria**:
- Study mode shows cards sorted by SRS algorithm (due first, then new cards)
- Rating buttons visible and functional after viewing a card
- Rating a card updates its review data (next_review_date, ease_factor, interval)
- After rating all due cards, "done for today" or "all caught up" message displays

### P2: Difficulty Filter [DIF-01]

- **Problem**: No difficulty filter in browse/study — only sort and search
- **Check**: Is the difficulty filter code in the v3.0.0 JS? If it's in stale v2.10.2 JS, it won't appear.
- **Required**: Add a filter control (dropdown or buttons) for difficulty levels: Beginner, Intermediate, Advanced (or however difficulty is categorized in the data model)
- **Acceptance criteria**:
  - Filter control visible on browse and study pages
  - Selecting a difficulty level filters the card set
  - Filter persists during the session

### P3: PIE Root Data [PIE-01, PIE-02]

- **Problem**: No PIE (Proto-Indo-European) root data visible on card detail
- **Investigate two possible causes**:
  1. **Data not imported**: The Sprint 9 description mentioned "PIE roots 961/1,573 cards" — check the database. Do any cards have PIE root data? `SELECT COUNT(*) FROM flashcards WHERE pie_root IS NOT NULL` (or equivalent column)
  2. **Data exists but not displayed**: If PIE root data is in the DB, the frontend may not be rendering it on the card detail view. Check the card detail template/component.
- **If data doesn't exist**: The batch import may have failed or never completed. Check for a PIE root column in the schema. If the column doesn't exist, the migration wasn't applied.
- **Acceptance criteria**:
  - Card detail page shows PIE root field (when data exists)
  - Spot check: common words like "mother" (PIE: *méh₂tēr), "water" (PIE: *wódr̥), "three" (PIE: *tréyes) show plausible PIE roots
  - Cards without PIE data show the field as empty or hidden (no error)

### P4: Ghost Table Cleanup [CLN-01]

- **Check**: Does the table `pronunciation_attempts` still exist? If so, `DROP TABLE pronunciation_attempts` — it was flagged for cleanup.
- **Acceptance criteria**: Table does not exist in production database

### P5: Version Bump
- Bump to v3.0.1 in ALL locations: Python backend, JS bundle, HTML templates, version badge
- **All version references must match** — no more mismatches
- Add a startup version consistency check if feasible: backend logs a warning if it detects a JS/HTML version that doesn't match its own

**Acceptance criteria**:
- `/health` returns v3.0.1
- Browser shows v3.0.1 in badge, JS, and HTML — no mismatch warning
- Hard refresh is not required to see correct version

---

## ✅ Test Commands (CC Self-Verification)

```bash
# 1. Health + version
curl -s https://<SF_URL>/health | python -m json.tool
# Expected: version 3.0.1, healthy

# 2. Version consistency — check JS bundle
curl -s https://<SF_URL>/ | grep -o 'v[0-9]*\.[0-9]*\.[0-9]*'
# Expected: 3.0.1 everywhere, no v2.10.2

# 3. Study endpoint — cards ordered by SRS
curl -s -H "Authorization: Bearer <token>" https://<SF_URL>/api/study
# Expected: cards with next_review_date, ordered by due date

# 4. Rating endpoint — update card review
# POST a rating for a card, verify next_review_date changes
curl -X POST https://<SF_URL>/api/study/rate \
  -H "Content-Type: application/json" \
  -d '{"card_id": "<id>", "rating": "good"}'
# Expected: 200, card review data updated

# 5. PIE root data in DB
# Query the database for PIE root column existence and data
# SELECT column_name FROM information_schema.columns WHERE table_name='flashcards' AND column_name LIKE '%pie%'
# SELECT COUNT(*) FROM flashcards WHERE pie_root IS NOT NULL

# 6. Difficulty levels in DB
# Check if difficulty data exists on cards
# SELECT DISTINCT difficulty FROM flashcards LIMIT 10

# 7. All 13 UAT tests — report per-test:
# [SM-01] health + version match
# [SM-02] cards visible, audio works
# [SR-01] study mode accessible
# [SR-02] cards ordered by SRS
# [SR-03] rating buttons visible and functional
# [SR-04] "done for today" after all due cards
# [PD-01] progress page accessible
# [PD-02] stats displayed
# [DIF-01] difficulty filter present
# [PIE-01] PIE root visible on card detail
# [PIE-02] PIE root data spot-check
# [CLN-01] pronunciation_attempts table dropped
# [REG-01] browse, pronunciation, images, Etymython links
```

---

## 📮 Handoff Instructions

```bash
curl -X POST https://metapm.rentyourcio.com/api/uat/submit \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Super Flashcards",
    "version": "3.0.1",
    "feature_description": "Rework: Version mismatch fix, SRS study mode, difficulty filter, PIE root data, ghost table cleanup",
    "linked_requirements": "SF-005, SF-007, SF-008, SF-013",
    "test_results_summary": "X passed, Y failed out of 13",
    "test_results_detail": "<per-test pass/fail with notes>",
    "commit_hash": "<commit>",
    "revision": "<cloud-run-revision>",
    "notes": "Root cause of version mismatch: <explain>. PIE data status: <in DB / not in DB / column missing>. Difficulty data status: <in DB / not in DB>."
  }'
```

---

## 🔒 Session Close-Out

1. Commit `SESSION_CLOSEOUT.md`
2. Update `PROJECT_KNOWLEDGE.md`:
   - Root cause of version mismatch and how it was fixed
   - Cache-busting strategy implemented
   - PIE root data status (column exists? data populated? how many cards?)
   - Difficulty level data status
   - Spaced repetition algorithm details (which SRS variant, interval calculations)
   - Current version: v3.0.1
3. `git push`
4. Verify deploy via `/health`

---

## ⚠️ Rules
- **P0 (version audit) FIRST.** Do not fix other failures until the JS version mismatch is resolved. Many failures may self-resolve.
- **Deploy to Cloud Run and test against production.** Do NOT run local validation or create virtual environments.
- **If PIE data was never imported**, document what's needed (batch script, source data, schema migration) in the handoff. Do not attempt a 1,000+ card batch import in this session unless it's trivial.
- **Report honestly** — distinguish between "feature not built" and "feature built but not deployed due to version mismatch."
