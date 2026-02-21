# CC Session: Greek Core Vocabulary Import into Super Flashcards

## BOOTSTRAP GATE
**STOP. Before doing anything, read this file first:**

`G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md`

Follow its instructions. It will direct you to read `Super Flashcards PROJECT_KNOWLEDGE.md`. Then return here.

---

## OBJECTIVE

Import 1,084 Ancient Greek core vocabulary words into Super Flashcards. These are from Wilfred Major's 2008 frequency study — the ~1,100 lemmas that generate 80% of all surviving Greek text.

## SOURCE FILE

`greek_core_vocab.txt` — plain text, one Greek word per line, 1,084 lines. Located in the same directory as this prompt (or PL will tell you where it is).

Sample:
```
ἀγαθός
ἄγαλμα
ἄγαν
ἀγανακτέω
ἀγάπη
ἀγγέλλω
ἄγγελος
...
```

## WHAT WORKED LAST TIME

The 342 English cognate import (Etymython → SF) succeeded using this pattern:
- **TXT format** — one word per line. This works. CSV does NOT work with the import function.
- **Batch size: 50 words** — SF's import hits API rate limits above 50.
- **60-second pause** between batches to let rate limits reset.
- **Loop script** that reads the file, chunks into batches of 50, calls the import endpoint/function for each word, waits 60s, repeats.

## IMPORT STEPS

### Step 1: Check existing Greek cards

Before importing, find out how many Greek cards already exist to avoid duplicates:

```sql
-- In LanguageLearning database
SELECT COUNT(*) as existing_greek_cards
FROM flashcards f
JOIN languages l ON f.language_id = l.id
WHERE l.code = 'el' OR l.name LIKE '%Greek%';
```

There should be ~71 from the Theogony/Genesis import + 17 pronunciation cards. Get the exact list of existing words so you can skip them.

### Step 2: Verify Greek language exists

```sql
SELECT id, name, code FROM languages WHERE code = 'el' OR name LIKE '%Greek%';
```

If it doesn't exist (unlikely — it should), create it. Note the language ID.

### Step 3: Find the import mechanism

Look at how the previous batch import worked:

```bash
cd "G:\My Drive\Code\Python\Super-Flashcards"
grep -rn "import\|batch\|generate.*card\|txt.*upload" app/ --include="*.py" | head -30
```

Identify whether import is via:
- **API endpoint** (e.g., `POST /api/flashcards/import` or `POST /api/batch/upload`)
- **Direct Python function call**

Use whichever method the 342-word English import used.

### Step 4: Import in batches of 50

```python
"""
Import Greek core vocabulary into Super Flashcards.
1,084 words from Major's 80% frequency list.
"""
import time

BATCH_SIZE = 50
PAUSE_SECONDS = 60
LANGUAGE = "Greek"  # or language code "el" — match what SF expects

# Load words from txt file
with open("greek_core_vocab.txt", "r", encoding="utf-8") as f:
    all_words = [line.strip() for line in f if line.strip()]

# Remove words that already exist (from Step 1)
existing = set()  # populate from Step 1 query
words_to_import = [w for w in all_words if w not in existing]

total = len(words_to_import)
total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
imported = 0
failed = []

print(f"Total words: {len(all_words)}")
print(f"Already exist: {len(existing)}")
print(f"To import: {total}")
print(f"Batches: {total_batches}")

for i in range(0, total, BATCH_SIZE):
    batch = words_to_import[i:i + BATCH_SIZE]
    batch_num = (i // BATCH_SIZE) + 1

    print(f"\n{'='*50}")
    print(f"Batch {batch_num}/{total_batches} ({len(batch)} words)")
    print(f"{'='*50}")

    for word in batch:
        try:
            # === USE WHATEVER IMPORT METHOD YOU FOUND IN STEP 3 ===
            # Adapt this to match SF's actual import mechanism
            result = import_single_word(word, language=LANGUAGE)
            imported += 1
            print(f"  ✓ {word}")
        except Exception as e:
            failed.append((word, str(e)[:100]))
            print(f"  ✗ {word} — {e}")

    # Pause between batches (skip after last)
    if i + BATCH_SIZE < total:
        print(f"\nWaiting {PAUSE_SECONDS}s for rate limit reset...")
        time.sleep(PAUSE_SECONDS)

print(f"\n{'='*50}")
print(f"COMPLETE")
print(f"Imported: {imported}/{total}")
print(f"Failed: {len(failed)}")
if failed:
    print(f"\nFailed words:")
    for word, err in failed:
        print(f"  {word}: {err}")
```

**Adapt the script based on what you find in Step 3.** The skeleton above is a guide — use SF's actual import mechanism.

### Step 5: Verify

After all batches complete:

```sql
-- Total Greek cards should be ~1,084 + pre-existing (~88) minus duplicates
SELECT COUNT(*) as total_greek_cards
FROM flashcards f
JOIN languages l ON f.language_id = l.id
WHERE l.code = 'el' OR l.name LIKE '%Greek%';

-- Spot-check: look for specific high-frequency words
SELECT word_or_phrase, created_at
FROM flashcards f
JOIN languages l ON f.language_id = l.id
WHERE (l.code = 'el' OR l.name LIKE '%Greek%')
AND word_or_phrase IN ('εἰμί', 'λέγω', 'ποιέω', 'πόλις', 'λόγος');
```

---

## IMPORTANT NOTES

- **Language:** These are Ancient Greek lemmas (polytonic, with breathing marks and accents). The existing Greek cards in SF are the same script. Make sure encoding is UTF-8 throughout.
- **Rate limits are real.** Do not exceed 50 per batch. Do not skip the 60-second pause.
- **If the import generates images and audio:** That's expected — SF enriches each card with AI-generated content. This is why it's slow and rate-limited.
- **If import fails partway through:** Note which batch you're on. The script can be restarted — Step 1's dedup check will skip already-imported words.
- **Do not run this against localhost.** Run against the production SF instance.
- **Production URL:** `https://super-flashcards-57478301787.us-central1.run.app` (or check PROJECT_KNOWLEDGE.md for the current URL)

---

## SESSION CLOSE-OUT

When complete:
1. Report total imported, total failed, total skipped (already existed)
2. List any failed words
3. Paste the Step 5 verification query results
4. Note total elapsed time (22 batches × 60s = ~22 minutes minimum, plus processing time)
