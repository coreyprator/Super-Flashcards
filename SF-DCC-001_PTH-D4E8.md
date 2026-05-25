# PTH-D4E8 | SF-DCC-001 | Super Flashcards
## Super Flashcards 🟡 — DCC Dictionary Panel + Bulk Load Missing DCC Words
## Sprint ID: SF-DCC-001 | Est: 4-5 hrs | Deploy required
## Bootstrap: G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md

======================================================
========= Super Flashcards 🟡 SF-DCC-001 PTH-D4E8 =========
======================================================

[SESSION] Super Flashcards | SF-DCC-001 DCC Dictionary Integration | 2026-03-09 | v3.2.0 → v3.3.0

## CONTEXT

The DCC (Dickinson College Commentaries) Greek Core List is the gold standard
frequency list for ancient Greek vocabulary — 532 words ranked by corpus frequency.
This data currently lives in the PIE Network Graph database, imported from
dcc.dickinson.edu.

This sprint does two things:
1. Shows DCC dictionary data (rank, definition, principal parts, POS) on any
   Super Flashcards word card that matches a DCC lemma.
2. Bulk-imports DCC words not yet in Super Flashcards as new cards.

Data source: PIE Network Graph API at https://efg.rentyourcio.com

Production URL: https://learn.rentyourcio.com
Cloud SQL: 35.224.242.223 | DB: LanguageLearning

---

## PHASE 0 — Bootstrap + auth + pending lessons + seed

Read Bootstrap v1.5.1 (BOOT-1.5.1-A4F9). Read Super Flashcards PROJECT_KNOWLEDGE.md.

```powershell
gcloud auth list
# Expected: cc-deploy@super-flashcards-475210.iam.gserviceaccount.com
```

```bash
curl -s https://learn.rentyourcio.com/health
curl -s "https://metapm.rentyourcio.com/api/lessons/pending?project=super-flashcards"

# Fetch all DCC words from PIE Network Graph
curl -s "https://efg.rentyourcio.com/api/words?include_dcc=true" | python -m json.tool
```

Examine the DCC API response carefully. Record:
- Field names (lemma, definition, frequency_rank, part_of_speech, principal_parts, etc.)
- Total DCC word count
- Whether Greek is in Unicode or transliteration

Seed and walk:
```bash
RESPONSE=$(curl -s -X POST https://metapm.rentyourcio.com/api/roadmap/requirements \
  -H "Content-Type: application/json" \
  -d '{
    "project": "super-flashcards",
    "title": "DCC Dictionary Panel and Bulk Load Missing DCC Words",
    "description": "Show DCC Greek Core List data on matching word cards (frequency rank, definition, principal parts, POS). Bulk import DCC words not already in Super Flashcards. Data source: PIE Network Graph API.",
    "status": "req_created",
    "priority": "P1",
    "person": "CC"
  }')
echo $RESPONSE

SF_CODE="SF-0XX"  # REPLACE WITH ACTUAL

for status in req_approved cai_designing cc_prompt_ready cc_executing; do
  curl -s -X PATCH https://metapm.rentyourcio.com/api/roadmap/requirements/$SF_CODE \
    -H "Content-Type: application/json" \
    -d "{\"status\": \"$status\"}"
  sleep 1
done
```

Phase 0 diagnostic — before writing any code:
```sql
-- How many SF words match DCC lemmas?
-- Query SF word table, compare against DCC word list from API
-- Report: total SF words, total DCC words, overlap count, missing count
```

**STOP after Phase 0. Report DCC API field names, overlap count, and missing count.**

---

## PHASE 1 — Backend: DCC lookup endpoint

Add a lightweight proxy endpoint in Super Flashcards that fetches DCC data
for a given lemma from the PIE Network Graph API:

```python
GET /api/v1/cards/{id}/dcc
```

Logic:
1. Get card's Greek lemma from SF DB
2. Call `GET https://efg.rentyourcio.com/api/words?include_dcc=true`
   (or a more targeted endpoint if one exists — check Phase 0 findings)
3. Match on lemma (normalized: strip accents for comparison, but display with accents)
4. Return DCC data or 404 if no match

Response:
```json
{
  "matched": true,
  "dcc_rank": 14,
  "lemma": "θεός",
  "definition": "god, divinity",
  "part_of_speech": "noun",
  "principal_parts": "θεός, -οῦ, ὁ",
  "dcc_url": "https://dcc.dickinson.edu/greek-core-list"
}
```

Cache responses in-memory (per server instance) — DCC data is static.
Do not add a DB table for this; the PIE API is the source of truth.

---

## PHASE 2 — Frontend: DCC Dictionary panel on card detail page

On the card detail / study page, when DCC data exists for the current word,
show a panel below the main card content:

```html
<div class="dcc-panel">
  <div class="dcc-header">
    <span class="dcc-badge">📖 DCC Greek Core</span>
    <span class="dcc-rank">#14 of 532</span>
  </div>
  <div class="dcc-definition">god, divinity</div>
  <div class="dcc-details">
    <span class="dcc-pos">noun</span>
    <span class="dcc-principal">θεός, -οῦ, ὁ</span>
  </div>
  <a href="https://dcc.dickinson.edu/greek-core-list" 
     target="_blank" class="dcc-source-link">dcc.dickinson.edu ↗</a>
</div>
```

Style: subtle, secondary to the main card. Use a warm amber/gold color scheme
to distinguish from the main card UI. Non-intrusive — collapses or is hidden
if no DCC match.

Load DCC data async after card renders — do not block card display.
Show a small "loading..." shimmer, then replace with data or hide panel if no match.

---

## PHASE 3 — Bulk import missing DCC words

Write a one-time import script `scripts/import_dcc_words.py`:

```python
"""
Compares DCC word list (from PIE Network Graph API) against SF word table.
Imports DCC words not already present in SF.

Fields mapped:
  DCC lemma → SF Greek field
  DCC definition → SF English field  
  DCC part_of_speech → SF metadata
  DCC frequency_rank → SF metadata (add column if needed)
  source = "dcc_import"
  language = "Greek"

Run once. Idempotent — skip if lemma already exists.
"""
```

Before running: report how many words will be imported (dry run first).

After import: verify new cards are accessible via the SF study interface.
Do NOT mark imported cards as "mastered" — they start in the default new-card state.

Add `dcc_frequency_rank` column to the SF words/cards table if it doesn't exist:
```sql
ALTER TABLE [words/cards table] ADD dcc_frequency_rank INT NULL;
```

Update this column for both imported cards AND existing SF cards that match DCC lemmas.

---

## PHASE 4 — Version bump + deploy

```python
VERSION = "3.3.0"
```

```bash
gcloud config get-value project  # must be: super-flashcards-475210
# Deploy per PK.md
curl -s https://learn.rentyourcio.com/health  # must return 3.3.0
```

---

## PHASE 5 — MetaPM handoff

```bash
curl -s -X PATCH https://metapm.rentyourcio.com/api/roadmap/requirements/$SF_CODE \
  -H "Content-Type: application/json" \
  -d '{"status": "cc_complete"}'
```

---

## ACCEPTANCE CRITERIA

- [ ] GET /api/v1/cards/{id}/dcc returns DCC data for a matched lemma
- [ ] DCC panel visible on card detail page for a known DCC word (e.g., θεός)
- [ ] DCC panel hidden/absent for non-DCC words (no broken UI)
- [ ] DCC rank, definition, POS, and principal parts all displayed
- [ ] Link to dcc.dickinson.edu present on panel
- [ ] dcc_frequency_rank column populated for matched existing SF cards
- [ ] New DCC words imported — report count in deliverable
- [ ] Imported words appear in SF study interface
- [ ] No regressions to existing card study, pronunciation, cognate links
- [ ] Super Flashcards version 3.3.0 at /health
- [ ] SF-DCC-001 at cc_complete in MetaPM

---

## DELIVERABLE REPORT

```
SESSION COMPLETE
================
PTH: D4E8 | Sprint: SF-DCC-001
Super Flashcards version: 3.2.0 → 3.3.0
MetaPM code: ________
Commits: ________ (feat), ________ (docs)

Phase 0 findings:
  DCC API total words: ________
  DCC API field names: ________
  SF existing words: ________
  Lemma overlap (DCC words already in SF): ________
  New words to import: ________

Phase 3 import results:
  Words imported: ________
  Words skipped (already existed): ________
  dcc_frequency_rank populated for existing cards: ________

Sample DCC panel — θεός:
  rank=___ definition=___ pos=___

Deviations: ________
```

PTH-D4E8 — END OF PROMPT
