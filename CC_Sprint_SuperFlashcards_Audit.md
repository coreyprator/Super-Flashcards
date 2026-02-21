# CC Sprint: Super Flashcards — Audit + Verify Features

## BOOTSTRAP GATE
**STOP. Read this file first:**
`G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md`

Follow its instructions. Read `Super Flashcards PROJECT_KNOWLEDGE.md`. Then return here.

## AUTH CHECK — RUN FIRST
```powershell
gcloud auth list
```
**Verify the ACTIVE account is `cc-deploy@super-flashcards-475210.iam.gserviceaccount.com`.** If it's not:
```powershell
gcloud auth activate-service-account --key-file="C:\venvs\cc-deploy-key.json"
gcloud config set project super-flashcards-475210
```
**NEVER prompt the user for passwords or credentials.**
**Deploy to GCloud and test against production. No local validation. No virtual environments.**

---

## CONTEXT

Super Flashcards is a language learning flashcard app supporting multiple languages (Greek, French, Spanish, Portuguese). It has Google OAuth login, audio pronunciation, image support, and integration with Etymython (342 cognates linked). The app uses Cloud SQL (sqlserver login) with the shared database at 35.224.242.223.

Production URL: https://super-flashcards-475210.web.app (or verify actual URL from Cloud Run)

Key areas: Several items marked in_progress or backlog may be closer to done than expected — tables and views already exist. PL says pronunciation works great (no bugs). A separate CC session is importing 1,084 Ancient Greek vocabulary words in 22 batches.

---

## PHASE 1: AUDIT — What Actually Works?

Before writing ANY code, test the following against production. For each item, document status.

### General App Health
**Test:**
```bash
# Find the correct URL first
gcloud run services describe super-flashcards --region=us-central1 --format="value(status.url)" 2>/dev/null || echo "Service name may differ — check: gcloud run services list --region=us-central1"

# Then test health
BASE="[URL from above]"
curl -s "$BASE/health" 2>/dev/null || curl -s "$BASE/" -o /dev/null -w "HTTP %{http_code}"
```

**Report:**
```
General Health:
  Production URL: [URL]
  App loads: [yes/no]
  /health endpoint: [status and version]
  Google OAuth login: [works/broken]
  Card display: [works/broken]
  Audio pronunciation: [works/broken]
  Image display: [works/broken]
```

### SF-005: Spaced Repetition Algorithm (P2, backlog)
**Description:** Tables/views may already exist for this feature.

**Test — DATABASE CHECK:**
```sql
-- Check for spaced repetition tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME LIKE '%repetition%' OR TABLE_NAME LIKE '%review%' OR TABLE_NAME LIKE '%schedule%';

-- Check for related views
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS
WHERE TABLE_NAME LIKE '%repetition%' OR TABLE_NAME LIKE '%review%' OR TABLE_NAME LIKE '%schedule%';

-- Check for columns suggesting SR implementation
SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME LIKE '%interval%' OR COLUMN_NAME LIKE '%ease%'
OR COLUMN_NAME LIKE '%next_review%' OR COLUMN_NAME LIKE '%repetition%';
```

**Test — UI CHECK:**
- Is there a "Review" or "Study" mode in the app?
- Does it track which cards you've seen?
- Does it schedule cards for future review?

```
SF-005 Spaced Repetition:
  DB tables exist: [yes/no] — [table names]
  DB views exist: [yes/no] — [view names]
  SR columns on flashcards: [yes/no] — [column names]
  UI review mode: [exists/missing]
  Scheduling works: [yes/no/stub]
  Assessment: [done/partially done/not started]
```

### SF-007: Progress Tracking Dashboard (P2, backlog)
**Description:** Tables/views may exist.

**Test — DATABASE CHECK:**
```sql
-- Check for progress/stats tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME LIKE '%progress%' OR TABLE_NAME LIKE '%stats%' OR TABLE_NAME LIKE '%history%';

SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS
WHERE TABLE_NAME LIKE '%progress%' OR TABLE_NAME LIKE '%stats%' OR TABLE_NAME LIKE '%history%';
```

**Test — UI CHECK:**
- Is there a progress or stats page?
- Does it show cards studied, accuracy, streak?

```
SF-007 Progress Dashboard:
  DB tables exist: [yes/no] — [table names]
  UI page exists: [exists/missing]
  Stats displayed: [yes/no] — [what stats]
  Assessment: [done/partially done/not started]
```

### SF-008: Difficulty Levels (P2, backlog)
**Description:** Tables/views may exist.

**Test — DATABASE CHECK:**
```sql
-- Check for difficulty-related data
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'flashcards' AND
(COLUMN_NAME LIKE '%difficulty%' OR COLUMN_NAME LIKE '%level%' OR COLUMN_NAME LIKE '%grade%');
```

**Test — UI CHECK:**
- Can you filter cards by difficulty?
- Is there a difficulty indicator on cards?

```
SF-008 Difficulty Levels:
  DB column exists: [yes/no] — [column name]
  Data populated: [yes/partially/no]
  UI filter/display: [exists/missing]
  Assessment: [done/partially done/not started]
```

### SF-010: Google OAuth (P2, backlog)
**Description:** OAuth using same client as Etymython (...c67).

**Test:**
- Does login work? What OAuth client is configured?
- Can you log in with Google?
- Does session persist?

```
SF-010 Google OAuth:
  Login works: [yes/no]
  OAuth client: [client ID]
  Session persistence: [yes/no]
  Assessment: [done/partially done/not started]
```

### SF-013: PIE Root Data (P2, in_progress)
**Description:** Proto-Indo-European root data for etymology enrichment.

**Test — DATABASE CHECK:**
```sql
-- Check for PIE/root columns
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'flashcards' AND
(COLUMN_NAME LIKE '%pie%' OR COLUMN_NAME LIKE '%root%' OR COLUMN_NAME LIKE '%proto%');

-- Sample data
SELECT TOP 5 * FROM flashcards WHERE pie_root IS NOT NULL OR proto_root IS NOT NULL;
```

```
SF-013 PIE Root:
  DB columns exist: [yes/no] — [column names]
  Data populated: [count with data / total]
  UI display: [exists/missing]
  Assessment: [done/partially done/not started]
```

### SF-015: Add Frequent Greek Words (in_progress — separate session)
**Description:** Batch import of 1,084 Ancient Greek vocabulary words in 22 batches. A separate CC session is handling this.

**Test — DO NOT MODIFY — just check count:**
```sql
SELECT COUNT(*) as greek_word_count FROM flashcards
WHERE language = 'Greek' OR language = 'Ancient Greek';
```

```
SF-015 Greek Words:
  Current count: [number]
  Target: 1,084
  Status: [separate session in flight]
```

### Etymython Integration
**Test:**
```sql
-- Check cognate data
SELECT COUNT(*) as cognate_count FROM flashcards
WHERE etymology IS NOT NULL AND etymology != '';

SELECT COUNT(*) as with_cognates FROM flashcards
WHERE english_cognates IS NOT NULL AND english_cognates != '';
```

**Test — cross-app links:**
- Pick a card with etymology data
- Does it link to Etymython?

```
Etymython Integration:
  Cards with etymology: [count]
  Cards with cognates: [count]
  Cross-app links: [work/broken]
```

---

## PHASE 2: FIXES

Based on audit findings, fix ONLY the following. Everything else is reporting only.

### Fix any broken existing features

If the audit reveals that previously-working features are now broken (OAuth login, card display, audio, images), fix them. These are regressions, not new work.

**Acceptance criteria:**
- All features that worked before still work
- No new features in this sprint — audit and stabilize only

### SF-010: If OAuth is broken, fix it

If Google OAuth doesn't work:
- Verify the OAuth client ...c67 is configured
- Check callback URL is registered for SF's domain
- Fix login flow

---

## PHASE 3: DO NOT TOUCH

- SF-001 through SF-004 (core features — leave alone if working)
- SF-006 (offline mode)
- SF-009 (social features)
- SF-011, SF-012 (future features)
- SF-014 (TTS improvements)
- SF-015 (Greek words — SEPARATE SESSION IN FLIGHT)
- SF-016 (gender articles — future sprint)
- Any Etymython code or data

---

## DEPLOY & TEST

Only deploy if you made changes. Otherwise this is an audit-only sprint.

```bash
BASE="[production URL]"

echo "=== Health ==="
curl -s "$BASE/health" | python3 -m json.tool

echo "=== Card count by language ==="
# Via API if available
curl -s "$BASE/api/cards/stats" 2>/dev/null || echo "No stats endpoint"
```

---

## HANDOFF

POST to MetaPM: `https://metapm.rentyourcio.com/api/uat/submit`

```json
{
  "project": "Super Flashcards",
  "version": "[current version]",
  "feature": "SF Audit — Feature Verification + DB Schema Check",
  "linked_requirements": ["SF-005", "SF-007", "SF-008", "SF-010", "SF-013", "SF-015"]
}
```

**The audit findings are the primary deliverable.** Include:
- Full status for every item audited
- Database schema discoveries (what tables/views/columns exist)
- Which items are closer to "done" than their status suggests
- Which items have no code at all
- Recommended priority order for future sprints

---

## SESSION CLOSE-OUT

Per Bootstrap v1.1:
1. SESSION_CLOSEOUT committed
2. PROJECT_KNOWLEDGE.md updated with audit findings and schema inventory
3. POST handoff with URL
4. Git push all changes
