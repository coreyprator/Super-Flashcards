# CC Sprint: Super Flashcards — Greek Core Vocabulary Batch Import

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
**Current Version**: v3.0.1
**Production URL**: https://learn.rentyourcio.com (or super-flashcards-57478301787.us-central1.run.app)
**Cloud SQL**: 35.224.242.223, instance flashcards-db
**Database login**: Check PROJECT_KNOWLEDGE.md for SF-specific login (not sqlserver)

### What This Sprint Does
Import Greek core vocabulary words from a text file into Super Flashcards using the existing batch import / AI enrichment pipeline. Each word gets a full flashcard: definition, etymology, pronunciation, example sentences, and AI-generated image.

### Source File
**Location**: `G:\My Drive\Code\Python\Super-Flashcards\greek_core_vocab.txt`

This file contains the most frequent Greek words, one word per line.

### Existing Infrastructure
Super Flashcards already has:
- `POST /api/batch/upload` — accepts CSV for batch processing
- `POST /api/ai/generate` — generates full flashcard from word + language via OpenAI
- `POST /api/ai/image` — generates image per card
- Batch import UI in the Import tab
- Rate limiting awareness: API calls need pacing

### What Already Exists in SF
- 1,583 total cards across Greek (478), English (414), French (357), Spanish (147), Italian (74), German (69), Portuguese (44)
- 960 cards have PIE root data
- Etymython cross-app cognate links (342 linked)

---

## 🔧 Requirements

### P0: Assess the Vocab File and Existing Cards

Before importing anything, determine what's needed:

```powershell
# 1. Read the source file
$vocabFile = "G:\My Drive\Code\Python\Super-Flashcards\greek_core_vocab.txt"
$words = Get-Content $vocabFile
Write-Host "Total words in file: $($words.Count)"
Write-Host "First 10 words:"
$words | Select-Object -First 10
```

```bash
# 2. Check what Greek cards already exist in SF database
# Connect to Cloud SQL and query
# SELECT word FROM flashcards WHERE language_code = 'el' OR language = 'Greek'
# This gives us the existing Greek vocabulary
```

```python
# 3. Compute the delta: words in file that are NOT already in SF
# existing_greek = set(query results from step 2)
# new_words = [w for w in vocab_file_words if w.strip() not in existing_greek]
# print(f"Already in SF: {len(existing_greek)}")
# print(f"New to import: {len(new_words)}")
# print(f"Duplicates skipped: {len(vocab_file_words) - len(new_words)}")
```

**Report the delta before proceeding.** Do NOT import duplicates.

### P1: Batch Import with Rate Limiting

**CRITICAL: Import in batches of 50 words with 60-second pauses between batches.**

This prevents hitting OpenAI API rate limits. The AI enrichment pipeline calls OpenAI for each word (definition, etymology, examples, pronunciation) plus image generation.

```python
"""
Import Greek core vocabulary into Super Flashcards.
Batch size: 50 words per batch.
Pause: 60 seconds between batches.
Skips words that already exist.
"""
import time
import requests

SF_BASE = "https://learn.rentyourcio.com"  # or production URL from PK.md
BATCH_SIZE = 50
PAUSE_SECONDS = 60

# Load the delta list (words not already in SF)
missing_words = [...]  # populated from P0 delta analysis

total = len(missing_words)
imported = 0
failed = []

for i in range(0, total, BATCH_SIZE):
    batch = missing_words[i:i + BATCH_SIZE]
    batch_num = (i // BATCH_SIZE) + 1
    total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
    
    print(f"\n--- Batch {batch_num}/{total_batches} ({len(batch)} words) ---")
    
    for word in batch:
        try:
            # Use whatever SF import mechanism exists
            # Check PROJECT_KNOWLEDGE.md for the correct endpoint
            # Option A: API endpoint
            resp = requests.post(
                f"{SF_BASE}/api/flashcards/import",  # adjust per PK.md
                json={"word": word.strip(), "language": "Greek", "language_code": "el"},
                timeout=60  # AI enrichment takes time
            )
            if resp.status_code in (200, 201):
                imported += 1
                print(f"  ✓ {word.strip()}")
            else:
                failed.append((word.strip(), resp.status_code, resp.text[:100]))
                print(f"  ✗ {word.strip()} — {resp.status_code}")
        except Exception as e:
            failed.append((word.strip(), "error", str(e)[:100]))
            print(f"  ✗ {word.strip()} — {e}")
    
    # Pause between batches (skip after last batch)
    if i + BATCH_SIZE < total:
        print(f"\nPausing {PAUSE_SECONDS}s before next batch...")
        time.sleep(PAUSE_SECONDS)

print(f"\n=== COMPLETE ===")
print(f"Imported: {imported}/{total}")
print(f"Failed: {len(failed)}")
for word, code, msg in failed:
    print(f"  {word}: {code} — {msg}")
```

**Adapt this script based on what you find in PROJECT_KNOWLEDGE.md and the codebase.** The exact endpoint and parameters may differ. Key points:
- Use the existing AI enrichment pipeline — don't skip definition/etymology/image generation
- Language must be "Greek" with code "el"
- Each card should get: definition, etymology, English cognates, pronunciation, example sentences, AI image
- Skip any word that already exists (duplicate check)

### P2: Verify Import Quality

After batch completes:

```bash
# Count total Greek cards now
# SELECT COUNT(*) FROM flashcards WHERE language = 'Greek'
# Expected: 478 (original) + new imports

# Spot-check 5 randomly selected new cards
# SELECT TOP 5 word, definition, etymology, pie_root, image_url 
# FROM flashcards 
# WHERE language = 'Greek' 
# ORDER BY created_at DESC

# Verify:
# - Definition is in English, explains the Greek word
# - Etymology traces the word's origin
# - Image exists (image_url not null)
# - No encoding corruption (Greek characters display correctly)
```

### P3: Cross-App Link Check

After import, verify Etymython cognate links still work:
```bash
# Check if any new Greek words match Etymython cognates
# If so, the cross-app links should auto-connect (or need a link refresh)
curl -s "https://learn.rentyourcio.com/api/flashcards?language=Greek&limit=5" | python -m json.tool
```

### P4: Version Bump (if code changes needed)

If any code changes were required to support the import (bug fixes, endpoint adjustments):
- Bump to v3.0.2
- Deploy and verify via /health

If this was a data-only import with no code changes, skip the version bump.

---

## ✅ Acceptance Criteria

1. All non-duplicate words from `greek_core_vocab.txt` imported into SF
2. Each card has: definition, etymology, pronunciation, AI image
3. No encoding corruption on Greek characters
4. No duplicate cards created
5. Existing 478 Greek cards unaffected
6. Import count reported: X new cards, Y skipped (already existed), Z failed
7. Failed words (if any) documented with error details

---

## 📮 Handoff Instructions

```bash
curl -X POST https://metapm.rentyourcio.com/api/uat/submit \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Super Flashcards",
    "version": "3.0.1",
    "feature_description": "Greek core vocabulary batch import from greek_core_vocab.txt",
    "linked_requirements": "SF-013",
    "test_results_summary": "Imported X new Greek cards. Y skipped (duplicates). Z failed.",
    "test_results_detail": "Source file: greek_core_vocab.txt (N words). Existing Greek cards: 478. Delta: M words to import. Batches: B batches of 50 with 60s pauses. Results: X imported, Y skipped, Z failed. Failed words: [list]. Spot-check: 5 cards verified with definition, etymology, image.",
    "commit_hash": "<commit if code changes>",
    "revision": "<revision if redeployed>",
    "notes": "Data import sprint. Import ran in batches of 50 with 60-second pauses. Total time: ~T minutes."
  }'
```

---

## 🔒 Session Close-Out

1. Commit `SESSION_CLOSEOUT.md` (even for data-only sprints)
2. Update `PROJECT_KNOWLEDGE.md`:
   - Total Greek cards after import
   - Total cards across all languages after import
   - Any failed words and why
   - Any code changes made to support import
   - Batch import performance notes (time, rate, failures)
   - Note: greek_core_vocab.txt has been imported — don't re-run
3. `git push`
4. Verify via `/health`

---

## ⚠️ Rules
- **Run P0 (delta analysis) FIRST.** Do not import before knowing exactly how many new words vs duplicates.
- **50-word batches, 60-second pauses.** Non-negotiable. OpenAI rate limits will kill the import otherwise.
- **Deploy to Cloud Run and test against production.** Do NOT run local.
- **Do NOT import duplicates.** Every word must be checked against existing Greek cards first.
- **Report honestly.** If 200 out of 1,000 fail, say so. PL needs accurate counts.
- **Greek character encoding.** If you see question marks or garbled text in the database after import, STOP. The pyodbc encoding fix (setencoding/setdecoding) may be needed. Check PK.md for encoding notes from the Etymython Unicode incident.
