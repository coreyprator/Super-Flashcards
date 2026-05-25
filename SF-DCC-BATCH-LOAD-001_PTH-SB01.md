# PTH-SB01 | SF-DCC-BATCH-LOAD-001 | Super Flashcards 🟡

Read Bootstrap v1.5.7 FIRST:
G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md
Complete ALL pre-work gates including Phase 0 Diagnostic Gate.

---

## Auth Check

```powershell
gcloud auth list
# Expected: cc-deploy@super-flashcards-475210.iam.gserviceaccount.com (active)
```

## Session Identity Banner

Print as FIRST output:
```
[SESSION] Super Flashcards | SF-DCC-BATCH-LOAD-001 | 2026-03-13 | v3.3.3 → v3.3.4
```

---

## Context

UAT-DC01 (PTH-UD01) found SF search is broken — all queries return the same
card (ὡς, card ab114918) regardless of search term. This breaks the DCC panel
demo flow.

PL's proposed fix: instead of repairing search, batch-load all 519 DCC words
directly as flashcard records. This means:
1. Every DCC word exists as a card with a known, stable ID
2. The DCC panel works by direct card lookup, not search
3. SF deck gains 519 high-frequency Greek vocabulary cards — genuinely useful
   for a Greek learner
4. Search fix can be addressed separately with no demo dependency

Source: EFG has all 519 DCC words with rank, gloss, POS, transliteration.
Pull from there. Do not duplicate cards that already exist.

Super Flashcards production: https://learn.rentyourcio.com

---

## Phase 0 — Diagnostic Gate

```powershell
# 1. Governance checkpoint
Invoke-RestMethod -Uri "https://metapm.rentyourcio.com/api/governance/bootstrap-checkpoint"
# Expected: BOOT-1.5.6-B5F9

# 2. Confirm search is broken
Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/flashcards/?search=logos&limit=3"
# Expected: returns ὡς (ab114918) or wrong result — confirms bug

# 3. Check current card count
Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/flashcards/?limit=1"
# Note total count from response

# 4. Check card schema — what fields does a card have?
Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/flashcards/?limit=1" | ConvertTo-Json -Depth 3
# Note all fields — batch load must match schema

# 5. Check if DCC cards already exist (avoid duplicates)
Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/v1/cards?limit=5" | ConvertTo-Json -Depth 2

# 6. Read PROJECT_KNOWLEDGE.md
# G:\My Drive\Code\Python\super-flashcards\PROJECT_KNOWLEDGE.md
```

Stop and report Phase 0 before writing any code. Specifically confirm:
- Card schema (all required fields for POST /api/flashcards or equivalent)
- Whether a batch insert endpoint exists
- Current card count (to verify post-load delta)

---

## Requirements

### BATCH-1 — Seed Requirement

```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://metapm.rentyourcio.com/api/roadmap/requirements" `
  -ContentType "application/json" `
  -Body '{
    "project_id": "proj-sf",
    "code": "SF-DCC-BATCH-001",
    "title": "Batch load 519 DCC words as Super Flashcards vocabulary cards",
    "description": "Pull all 519 DCC words from EFG API and insert as flashcard records. Skip duplicates. Bypasses broken search by ensuring all DCC words exist as cards with stable IDs. Enriches SF deck with high-frequency Greek vocabulary.",
    "type": "feature",
    "priority": "P1",
    "status": "req_created"
  }'
```

Advance to cc_executing.

### BATCH-2 — Pull DCC Words from EFG

```powershell
# Fetch all 519 DCC words from EFG
$dccWords = Invoke-RestMethod `
  -Uri "https://efg.rentyourcio.com/api/words?dcc_imported=true&limit=600"
Write-Host "DCC words fetched: $($dccWords.items.Count)"
# Expected: 519 items with rank, gloss, pos, transliteration, greek_word fields
```

### BATCH-3 — Deduplicate Against Existing Cards

Before inserting, check which DCC words already exist as SF cards to
avoid duplicates:

```powershell
# Get existing card words for comparison
# Fetch all existing cards (paginate if needed)
$existing = @{}
$page = 0
do {
  $batch = Invoke-RestMethod `
    -Uri "https://learn.rentyourcio.com/api/flashcards/?limit=100&offset=$($page * 100)"
  foreach ($card in $batch.items) {
    $existing[$card.word_or_phrase] = $card.id
  }
  $page++
} while ($batch.items.Count -eq 100)

Write-Host "Existing cards: $($existing.Count)"

# Filter DCC words to only those not already in SF
$toInsert = $dccWords.items | Where-Object {
  -not $existing.ContainsKey($_.greek_word) -and
  -not $existing.ContainsKey($_.transliteration)
}
Write-Host "New cards to insert: $($toInsert.Count)"
```

### BATCH-4 — Batch Insert DCC Cards

Map each DCC word to the SF card schema. Required fields from Phase 0
diagnostic — fill based on actual schema discovered.

Expected mapping:
```python
{
  "word_or_phrase": dcc_word.greek_word,          # e.g. λόγος
  "translation": dcc_word.gloss,                   # e.g. "word, reason, speech"
  "part_of_speech": dcc_word.pos,                  # e.g. "noun"
  "transliteration": dcc_word.transliteration,     # e.g. "logos"
  "source_language": "Greek",
  "target_language": "English",
  "dcc_frequency_rank": dcc_word.rank,             # e.g. 23
  "tags": ["dcc", "greek-core", f"rank-{band}"]   # band = 1-100, 101-200, etc.
}
```

Insert in batches of 50. If a batch endpoint exists use it. If not, use
individual POSTs with a brief delay to avoid rate limiting.

```powershell
$inserted = 0
$failed = 0
$failedWords = @()

foreach ($word in $toInsert) {
  try {
    $body = @{
      word_or_phrase = $word.greek_word
      translation = $word.gloss
      # ... map remaining fields per schema
    }
    Invoke-RestMethod -Method POST `
      -Uri "https://learn.rentyourcio.com/api/flashcards/" `
      -ContentType "application/json" `
      -Body (ConvertTo-Json $body)
    $inserted++
  } catch {
    $failed++
    $failedWords += $word.greek_word
  }
}

Write-Host "Inserted: $inserted | Failed: $failed"
if ($failedWords.Count -gt 0) {
  Write-Host "Failed words: $($failedWords -join ', ')"
}
```

Acceptance criteria:
- [ ] At least 400 new DCC cards inserted (519 minus existing duplicates)
- [ ] Failed inserts logged, not silently skipped
- [ ] Each inserted card has dcc_frequency_rank populated

### BATCH-5 — Verify DCC Panel Works by Direct ID

After batch load, verify the DCC endpoint works for 5 known words by
looking up their card IDs directly (bypassing broken search):

```powershell
# Get fresh card list and find DCC words by greek text
$allCards = @()
$page = 0
do {
  $batch = Invoke-RestMethod `
    -Uri "https://learn.rentyourcio.com/api/flashcards/?limit=100&offset=$($page * 100)"
  $allCards += $batch.items
  $page++
} while ($batch.items.Count -eq 100)

$testWords = @("λόγος", "ψυχή", "θεός", "νίκη", "χρόνος")
foreach ($w in $testWords) {
  $card = $allCards | Where-Object { $_.word_or_phrase -eq $w }
  if ($card) {
    $dcc = Invoke-RestMethod `
      -Uri "https://learn.rentyourcio.com/api/v1/cards/$($card.id)/dcc"
    Write-Host "$w (ID: $($card.id)): rank=$($dcc.rank) cognates=$($dcc.cognates)"
  } else {
    Write-Host "$w: NOT FOUND after batch load"
  }
}
```

### BATCH-6 — Version Bump

Bump Super Flashcards 3.3.3 → 3.3.4

---

## UI UAT — Demo Readiness

Known Test Values:

| Greek word | Transliteration | Expected DCC rank | Expected cognates |
|------------|-----------------|-------------------|-------------------|
| λόγος | logos | 23 | logic, logo, -logy |
| ψυχή | psyche | 117 | psychic, psychology |
| θεός | theos | ~50 | theology, theocracy |
| νίκη | nike | 501 | Nicholas |
| χρόνος | chronos | 106 | chronology, anachronism |

Browser UAT:
```
1. Open https://learn.rentyourcio.com
2. Navigate to card for λόγος (logos)
3. Confirm: DCC panel shows rank + cognates
4. Navigate to card for ψυχή (psyche)
5. Confirm: DCC panel shows rank + cognates
Report: PASS / FAIL per card
```

Demo Readiness Summary:
```
DEMO READINESS — SF-DCC-BATCH-LOAD-001
=======================================
New DCC cards inserted: {N}
Total DCC cards in SF: {N}
DCC panel working on inserted cards: YES/NO
Test words with cognates: {N}/5
SF search bug: still present (expected — not fixed in this sprint)
OVERALL: READY / NOT READY
Note: access DCC cards by direct ID or browse — do not use search for demo
```

---

## MetaPM Handoff

```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://metapm.rentyourcio.com/api/uat/submit" `
  -ContentType "application/json" `
  -Body '{
    "project": "Super-Flashcards",
    "version": "3.3.4",
    "feature": "Batch load 519 DCC words as vocabulary cards, bypasses broken search",
    "status": "passed",
    "total_tests": 0,
    "results_text": "<CC fills in Demo Readiness Summary>",
    "results": [],
    "tested_by": "cc",
    "notes": "SF-DCC-BATCH-LOAD-001 PTH-SB01. Search bug not fixed — use direct card ID for demo."
  }'
```

---

## CANARY TEST (mandatory)

```powershell
# logos card must exist and return DCC data
$allCards = Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/flashcards/?limit=200"
$logos = $allCards.items | Where-Object { $_.word_or_phrase -eq "λόγος" }
$dcc = Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/v1/cards/$($logos.id)/dcc"
Write-Host "logos rank: $($dcc.rank) | cognates: $($dcc.cognates)"
```

Expected: rank=23, cognates array not empty.
If logos card not found or cognates empty, sprint is NOT complete.

---

## INTENT BOUNDARIES

1. Do NOT fix the search bug in this sprint — it is out of scope.
2. Do NOT insert duplicate cards — deduplication check is mandatory.
3. If batch insert fails for more than 50 words, STOP and report the error
   pattern before continuing.
4. If card schema requires fields not available from EFG, use sensible
   defaults (e.g. source_language="Greek") and document them.
5. Honest count — report exactly how many inserted, how many skipped, how many failed.

---

## Rules

- Deploy to Cloud Run and test against production. No local validation.
- Never prompt for passwords. Never create virtual environments.
- Read PROJECT_KNOWLEDGE.md before writing any code.

PTH-SB01 — END OF PROMPT
