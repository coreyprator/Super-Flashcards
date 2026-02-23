"""
Import Greek core vocabulary into Super Flashcards.
1,084 words from Major's 80% frequency list.

Usage:
    python import_greek_vocab.py
    python import_greek_vocab.py --dry-run       # show plan without importing
    python import_greek_vocab.py --start-batch 5  # resume from batch 5
    python import_greek_vocab.py --no-images      # skip DALL-E (faster, cheaper)
"""
import sys
# Force UTF-8 output on Windows (handles Greek characters on cp1252 terminals)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
import time
import argparse
import json
import requests

BASE_URL = "https://learn.rentyourcio.com"
VOCAB_FILE = "greek_core_vocab.txt"
BATCH_SIZE = 20   # Reduced from 50: 20 × ~8s (GPT-4 only, --no-images) = ~160s < 300s Cloud Run limit
PAUSE_SECONDS = 30  # Shorter pause since smaller batches
LANGUAGE_CODE = "el"

# ── helpers ──────────────────────────────────────────────────────────────────

def get_greek_language_id():
    """Fetch the Greek language UUID from the API."""
    r = requests.get(f"{BASE_URL}/api/languages", timeout=30)
    r.raise_for_status()
    for lang in r.json():
        if lang.get("code") == LANGUAGE_CODE or "Greek" in lang.get("name", ""):
            return lang["id"], lang["name"]
    return None, None


def get_existing_greek_words(language_id):
    """Return the set of words already in the database for this language."""
    existing = set()
    # The endpoint defaults to limit=1000; fetch all pages if needed
    offset = 0
    limit = 1000
    while True:
        r = requests.get(
            f"{BASE_URL}/api/flashcards/",
            params={"language_id": language_id, "limit": limit, "offset": offset},
            timeout=30,
        )
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        for card in batch:
            existing.add(card["word_or_phrase"])
        if len(batch) < limit:
            break
        offset += limit
    return existing


def load_words(path):
    with open(path, encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def import_batch(words, language_id, include_images):
    """POST a batch to /api/ai/batch-generate. Returns the parsed response."""
    payload = {
        "words": words,
        "language_id": language_id,
        "include_images": include_images,
    }
    # Batch-generate takes time (OpenAI + DALL-E per word). Use a long timeout.
    r = requests.post(
        f"{BASE_URL}/api/ai/batch-generate",
        json=payload,
        timeout=600,  # 10 minutes — each word can take ~10s of AI time
    )
    r.raise_for_status()
    return r.json()


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Import Greek vocab into Super Flashcards")
    parser.add_argument("--dry-run", action="store_true", help="Show plan without importing")
    parser.add_argument("--start-batch", type=int, default=1, metavar="N",
                        help="Resume from batch N (1-based, default: 1)")
    parser.add_argument("--no-images", action="store_true", help="Skip DALL-E image generation")
    args = parser.parse_args()

    include_images = not args.no_images
    session_start = time.time()

    print("=" * 60)
    print("Super Flashcards — Greek Core Vocabulary Import")
    print(f"Target: {BASE_URL}")
    print(f"Images: {'yes' if include_images else 'NO (--no-images)' }")
    print("=" * 60)

    # Step 1: Verify Greek language exists
    print("\n[Step 1] Checking Greek language record …")
    language_id, language_name = get_greek_language_id()
    if not language_id:
        print("ERROR: Greek language not found. Run this to create it:")
        print(f'  POST {BASE_URL}/api/languages  body: {{"name":"Greek","code":"el"}}')
        sys.exit(1)
    print(f"  Found: '{language_name}'  id={language_id}")

    # Step 2: Existing cards
    print("\n[Step 2] Fetching existing Greek flashcards …")
    existing = get_existing_greek_words(language_id)
    print(f"  Existing cards: {len(existing)}")

    # Step 3: Load words, filter dupes
    print(f"\n[Step 3] Loading words from {VOCAB_FILE} …")
    all_words = load_words(VOCAB_FILE)
    print(f"  Total in file : {len(all_words)}")

    words_to_import = [w for w in all_words if w not in existing]
    already_done = len(all_words) - len(words_to_import)
    print(f"  Already exist : {already_done}")
    print(f"  To import     : {len(words_to_import)}")

    if not words_to_import:
        print("\nAll words already imported. Nothing to do.")
        return

    # Step 4: Batch import plan
    batches = [words_to_import[i:i + BATCH_SIZE]
               for i in range(0, len(words_to_import), BATCH_SIZE)]
    total_batches = len(batches)
    start_idx = args.start_batch - 1  # convert to 0-based

    print(f"\n[Step 4] Import plan")
    print(f"  Batch size    : {BATCH_SIZE} words")
    print(f"  Total batches : {total_batches}")
    print(f"  Starting at   : batch {args.start_batch}")
    print(f"  Pause between : {PAUSE_SECONDS}s")
    est_min = (total_batches - start_idx) * (PAUSE_SECONDS / 60 + 1.5)
    print(f"  Est. time     : ~{est_min:.0f} min (minimum, plus AI processing)")

    if args.dry_run:
        print("\n[DRY RUN — no API calls made]")
        for i, batch in enumerate(batches[start_idx:], start=start_idx + 1):
            print(f"  Batch {i:3}/{total_batches}: {batch[:3]}{'…' if len(batch) > 3 else ''}")
        return

    # Step 5: Run
    print()
    imported_total = 0
    failed_words = []
    duplicate_words = []

    for batch_num, batch in enumerate(batches[start_idx:], start=start_idx + 1):
        print(f"\n{'='*60}")
        print(f"Batch {batch_num}/{total_batches}  ({len(batch)} words)")
        print(f"Words: {batch[:5]}{'…' if len(batch) > 5 else ''}")
        print(f"{'='*60}")

        try:
            result = import_batch(batch, language_id, include_images)

            successful  = result.get("successful", 0)
            failed_cnt  = result.get("failed", 0)
            word_results = result.get("word_results", [])

            imported_total += successful
            print(f"  Result: {successful} ok, {failed_cnt} failed")

            for wr in word_results:
                if wr.get("status") == "failed":
                    err = wr.get("error", "")
                    if "Duplicate" in err:
                        duplicate_words.append(wr["word"])
                        print(f"  SKIP (dup): {wr['word']}")
                    else:
                        failed_words.append((wr["word"], err[:120]))
                        print(f"  FAIL: {wr['word']} — {err[:120]}")

        except requests.Timeout:
            print(f"  ERROR: Request timed out for batch {batch_num}")
            for w in batch:
                failed_words.append((w, "timeout"))
        except requests.HTTPError as e:
            print(f"  ERROR: HTTP {e.response.status_code} — {e.response.text[:200]}")
            for w in batch:
                failed_words.append((w, f"HTTP {e.response.status_code}"))
        except Exception as e:
            print(f"  ERROR: {e}")
            for w in batch:
                failed_words.append((w, str(e)[:120]))

        # Pause between batches (not after the last one)
        if batch_num < total_batches:
            print(f"\nPausing {PAUSE_SECONDS}s for rate-limit reset …")
            for remaining in range(PAUSE_SECONDS, 0, -10):
                print(f"  {remaining}s …", end="\r", flush=True)
                time.sleep(10)
            print()

    # ── Summary ──────────────────────────────────────────────────────────────
    elapsed = int(time.time() - session_start)
    print(f"\n{'='*60}")
    print("IMPORT COMPLETE")
    print(f"{'='*60}")
    print(f"  Imported this session : {imported_total}")
    print(f"  Skipped (duplicates)  : {len(duplicate_words)}")
    print(f"  Failed                : {len(failed_words)}")
    print(f"  Elapsed               : {elapsed // 60}m {elapsed % 60}s")

    if failed_words:
        print(f"\nFailed words ({len(failed_words)}):")
        for word, err in failed_words:
            print(f"  {word}: {err}")

        # Save failed words for retry
        failed_file = "greek_import_failed.txt"
        with open(failed_file, "w", encoding="utf-8") as f:
            for word, _ in failed_words:
                f.write(word + "\n")
        print(f"\nFailed words saved to: {failed_file}")
        print("Re-run with that file as VOCAB_FILE or retry manually.")

    # Step 5: Verification query hint
    print(f"\n[Step 5] Verification — run this SQL on LanguageLearning:")
    print(f"""
  SELECT COUNT(*) AS total_greek_cards
  FROM flashcards f
  JOIN languages l ON f.language_id = l.id
  WHERE l.code = 'el';

  -- Spot-check high-frequency words:
  SELECT word_or_phrase, created_at
  FROM flashcards f
  JOIN languages l ON f.language_id = l.id
  WHERE l.code = 'el'
    AND word_or_phrase IN (N'εἰμί', N'λέγω', N'ποιέω', N'πόλις', N'λόγος');
""")


if __name__ == "__main__":
    main()
