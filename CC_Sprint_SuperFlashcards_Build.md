# CC Sprint: Super Flashcards — Spaced Repetition + Progress Dashboard Build

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

**DEPLOY NOTE:** If `cc-deploy` cannot deploy to Cloud Run, switch to `cprator@cbsware.com` for the deploy step ONLY:
```powershell
gcloud config set account cprator@cbsware.com
gcloud run deploy [SERVICE_NAME] --source . --region=us-central1
gcloud config set account cc-deploy@super-flashcards-475210.iam.gserviceaccount.com
```

**Deploy to GCloud and test against production. No local validation. No virtual environments.**

---

## CONTEXT

Super Flashcards is a multi-language learning app with 1,583 flashcards (Greek 478, English 414, French 357, Spanish 147, Italian 74, German 69, Portuguese 44). Google OAuth works. Pronunciation works. Etymython integration works (342 cognates, 1,565 cards with etymology data).

**Previous audit confirmed:**
- ✅ OAuth (SF-010): fully working
- ✅ Pronunciation: working great
- ✅ Etymython integration: 1,565 with etymology, 1,146 with cognates
- ⚠️ SF-005 Spaced Repetition: `study_sessions` table exists but 0 rows — the review endpoint never writes to it
- ⚠️ SF-007 Progress Dashboard: `vw_UserPronunciationProgress` view exists — general dashboard not started
- ❌ SF-008 Difficulty Levels: not started, no schema
- ❌ SF-013 PIE Root: not started, no columns
- 🗑️ Ghost table `pronunciation_attempts` (lowercase) — 0 rows, safe to drop
- ❓ `Reference_Audio_URL` — undocumented column on flashcards, not in ORM

**This sprint builds the learning engine.** The audit's key insight: wiring `study_sessions` writes into the review endpoint unblocks BOTH SF-005 and SF-007 in one shot.

Cloud SQL: 35.224.242.223, instance flashcards-db, login: sqlserver
Production URL: (check `gcloud run services list --region=us-central1`)

---

## REQUIREMENTS — IN DEPENDENCY ORDER

### CLEANUP: Database Housekeeping (P1 — do first)

**Execute these SQL statements and log results:**

```sql
-- 1. Drop ghost table (0 rows, schema differs from live PronunciationAttempts)
DROP TABLE IF EXISTS pronunciation_attempts;

-- 2. Check Reference_Audio_URL usage
SELECT COUNT(*) as total_cards,
       COUNT(Reference_Audio_URL) as has_ref_audio,
       COUNT(CASE WHEN Reference_Audio_URL != '' THEN 1 END) as has_nonempty_ref_audio
FROM flashcards;

-- 3. Update SF-010 status to done (audit confirmed working)
-- POST this to MetaPM via the roadmap API or log for PL
```

Report the Reference_Audio_URL counts. If zero cards have data in it, note it for PL decision (drop vs keep).

### SF-005: Spaced Repetition Algorithm (P1)

**What:** The `study_sessions` table exists but the review endpoint never writes to it. Wire it up, then implement SM-2.

**Acceptance criteria:**
- **Wire the review endpoint:** `POST /api/flashcards/{id}/review` must write to `study_sessions` on every review:
  - Card ID, user ID, timestamp, response quality (0-5 scale)
  - This is the foundational data that everything else depends on
- **SM-2 algorithm implementation:**
  - Track per-card: ease factor (default 2.5), interval (days), repetition count
  - After each review, calculate next review date based on response quality:
    - Quality 0-2: reset to interval=1 (card needs re-learning)
    - Quality 3: interval stays same
    - Quality 4-5: interval × ease factor
  - Ease factor adjusts: EF' = EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02))
  - Minimum ease factor: 1.3
- **Study mode UI:**
  - "Study" button on the main page (alongside existing browse/quiz modes)
  - Shows cards due for review (next_review_date ≤ today)
  - After answering, user rates: "Again" (0), "Hard" (2), "Good" (4), "Easy" (5)
  - Card updates with new interval and next review date
  - When no more cards are due: "You're done for today! 🎉 Next review: [date]"
- **Schema additions (if needed):**
  ```sql
  ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS ease_factor FLOAT DEFAULT 2.5;
  ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS review_interval INT DEFAULT 0;
  ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS repetition_count INT DEFAULT 0;
  ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS next_review_date DATE NULL;
  ```
  Check if these columns already exist before adding.

### SF-007: Progress Dashboard (P1)

**What:** Show learning stats. The `vw_UserPronunciationProgress` view already exists for pronunciation stats.

**Acceptance criteria:**
- Dashboard page accessible from main navigation: "📊 Progress"
- **Stats displayed:**
  - Total cards studied / total cards
  - Cards due today / overdue
  - Current streak (consecutive days with at least 1 review)
  - Average ease factor (how well you know your cards)
  - Cards by mastery level: New (0 reviews), Learning (1-3), Familiar (4-10), Mastered (10+)
  - Cards by language with progress bars
- **Charts (use Chart.js or simple HTML/CSS bars):**
  - Reviews per day (last 30 days)
  - Cards learned over time (cumulative)
  - Mastery distribution pie chart
- **Data source:** `study_sessions` table (now populated by SF-005) + flashcards columns
- **Pronunciation stats:** Incorporate the existing `vw_UserPronunciationProgress` view data if relevant
- Responsive layout — works on mobile (PL uses the app on airplane mode for study)

### SF-008: Difficulty Levels (P2)

**What:** Categorize cards by difficulty so users can study appropriate material.

**Acceptance criteria:**
- **Schema:**
  ```sql
  ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'unrated';
  ```
  Values: 'beginner', 'intermediate', 'advanced', 'unrated'
- **Auto-assignment based on data:**
  - Cards with ease_factor > 2.8 after 5+ reviews → 'beginner' (user finds them easy)
  - Cards with ease_factor 2.0-2.8 → 'intermediate'
  - Cards with ease_factor < 2.0 after 5+ reviews → 'advanced' (user finds them hard)
  - Cards with < 5 reviews → 'unrated'
- **Manual override:** User can set difficulty on any card
- **Filter by difficulty:** On the card browse/study page, dropdown to filter by difficulty level
- **Study by difficulty:** "Study Beginner Cards", "Study Advanced Cards" mode options

### SF-016: Add Gender Articles to French/Spanish/Portuguese Nouns (P2)

**What:** Batch update existing noun flashcards to include grammatical gender articles. "pince" → "la pince". Recommendation from PL's French teacher Lucas.

**Acceptance criteria:**
- **Scope:** All noun-type flashcards in French, Spanish, and Portuguese
- **Process:**
  1. Query all nouns in target languages
  2. For French: use rules from https://www.fourmilab.ch/francais/gender.html + AI enrichment for exceptions
  3. For Spanish/Portuguese: similar gender rules (masculine -o, feminine -a, with exceptions)
  4. Prepend correct article: le/la (French), el/la (Spanish), o/a (Portuguese)
  5. Update the card's display term (e.g., "pince" → "la pince")
- **Safeguards:**
  - Don't modify cards that already have articles
  - Log all changes: "Updated 'pince' → 'la pince' (French, feminine)"
  - Batch processing: 50 cards at a time with verification
- **Gender determination:** Use AI (GPT-4 or Claude API) to determine gender for ambiguous cases. The API call pattern exists from the flashcard content generation pipeline.
- **Report:** After completion, output counts: "French: 89 nouns updated. Spanish: 42. Portuguese: 12. Skipped (already had article): 15."

### SF-013: PIE Root Data (P3)

**What:** Add Proto-Indo-European root data to flashcards for etymology enrichment.

**Acceptance criteria:**
- **Schema:**
  ```sql
  ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS pie_root VARCHAR(100) NULL;
  ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS pie_meaning VARCHAR(255) NULL;
  ```
- **Data population:** For cards that have etymology data (1,565 cards), use AI to extract the PIE root:
  - Input: existing etymology text on the card
  - Output: PIE root (e.g., *bher-) and meaning (e.g., "to carry")
  - Batch process: 50 cards per API call
- **UI display:** Show PIE root on the card detail view, below the etymology field
- **Cross-reference:** Cards sharing the same PIE root are linked (e.g., "bear", "ferry", "transfer" all from *bher-)

---

## PRIORITY ORDER

If you run out of time:
1. **Cleanup** — ghost table, check Reference_Audio_URL
2. **SF-005** (spaced repetition) — the learning engine core
3. **SF-007** (progress dashboard) — visualization of learning
4. **SF-008** (difficulty levels) — study customization
5. **SF-016** (gender articles) — content enrichment
6. **SF-013** (PIE roots) — etymology enrichment

Items 1-3 transform Super Flashcards from a card browser into a learning system. Items 4-6 enrich the content.

**⚠️ DO NOT touch SF-015 (Greek word import) — a separate session is handling that.**

---

## DEPLOY & TEST

```bash
BASE="[production URL from gcloud run services describe]"

echo "=== Health ==="
curl -s "$BASE/health" | python3 -m json.tool

echo "=== Study session count (should be > 0 after fix) ==="
# This may need to go through the API
curl -s "$BASE/api/study/stats" 2>/dev/null || echo "No study stats endpoint yet"

echo "=== Progress dashboard ==="
curl -s "$BASE/progress" -o /dev/null -w "HTTP %{http_code}" 2>/dev/null || echo "No progress page"

echo "=== Card with SR data ==="
curl -s "$BASE/api/flashcards?limit=1" | python3 -c "
import json,sys
cards = json.load(sys.stdin)
if cards:
    c = cards[0] if isinstance(cards, list) else cards
    print(f\"ease_factor: {c.get('ease_factor', 'MISSING')}\")
    print(f\"next_review: {c.get('next_review_date', 'MISSING')}\")
    print(f\"difficulty: {c.get('difficulty', 'MISSING')}\")
"
```

### Browser verification:
1. **Login** → OAuth works
2. **Study mode** → shows cards due for review (or "nothing due" if first run)
3. **Review a card** → rate it → next card appears → interval updates
4. **Progress dashboard** → stats visible, charts render
5. **Filter by difficulty** → dropdown works
6. **Check a French noun** → has article (e.g., "la pince" not just "pince")
7. **Check a card with etymology** → PIE root displayed (if SF-013 was reached)

---

## HANDOFF

POST to MetaPM: `https://metapm.rentyourcio.com/api/uat/submit`

```json
{
  "project": "Super Flashcards",
  "version": "[new version]",
  "feature": "Spaced Repetition + Progress Dashboard + Difficulty + Gender Articles",
  "linked_requirements": ["SF-005", "SF-007", "SF-008", "SF-013", "SF-016"]
}
```

Include:
1. Which features are fully working
2. study_sessions row count after wiring fix
3. Schema changes made (new columns, dropped tables)
4. Gender article update counts by language
5. PIE root population count (if reached)
6. Reference_Audio_URL findings

---

## SESSION CLOSE-OUT

Per Bootstrap v1.1:
1. SESSION_CLOSEOUT committed
2. PROJECT_KNOWLEDGE.md updated with SR algorithm details, new schema, progress dashboard
3. POST handoff with URL
4. Git push all changes
