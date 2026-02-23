"""
Single-card Greek vocabulary import for Super Flashcards.

One word per request. 60-second sleep between words.
Images included (single card + DALL-E fits comfortably in Cloud Run 300s limit).
Skips duplicates (handled server-side by /api/ai/batch-generate).
Never aborts on error — logs it and continues.

Usage:
    python import_greek_single.py
    python import_greek_single.py --dry-run          # show plan, no API calls
    python import_greek_single.py --start-at WORD    # resume from a specific word
    python import_greek_single.py --sleep 60         # override inter-card sleep (default 60s)

Log file: greek_import_YYYYMMDD_HHMMSS.log  (created at start, appended per card)
"""
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import argparse
import time
import requests
from datetime import datetime

BASE_URL       = "https://learn.rentyourcio.com"
GREEK_LANG_ID  = "21d23a9e-4ef7-4d53-ad17-371d164d0f0f"
VOCAB_FILE     = "G:/My Drive/Code/Python/Super-Flashcards/greek_core_vocab.txt"
DEFAULT_SLEEP  = 60   # seconds between cards
API_TIMEOUT    = 180  # seconds — single card with DALL-E finishes well within this


# ── helpers ────────────────────────────────────────────────────────────────────

def ts():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def log(msg, logf=None):
    line = f"[{ts()}] {msg}"
    print(line)
    sys.stdout.flush()
    if logf:
        logf.write(line + "\n")
        logf.flush()

def get_existing_greek_words():
    """Return set of words already in SF for Greek, via API."""
    existing = set()
    offset, limit = 0, 1000
    while True:
        r = requests.get(
            f"{BASE_URL}/api/flashcards/",
            params={"language_id": GREEK_LANG_ID, "limit": limit, "offset": offset},
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

def import_word(word):
    """
    POST one word to /api/ai/batch-generate with include_images=True.
    Returns (status, detail) where status is 'imported'|'duplicate'|'error'.
    """
    r = requests.post(
        f"{BASE_URL}/api/ai/batch-generate",
        json={
            "words": [word],
            "language_id": GREEK_LANG_ID,
            "include_images": True,
        },
        timeout=API_TIMEOUT,
    )
    r.raise_for_status()
    data = r.json()

    word_results = data.get("word_results", [])
    if word_results:
        result = word_results[0]
        if result.get("status") == "failed":
            err = result.get("error", "")
            if "Duplicate" in err or "duplicate" in err or "already exists" in err.lower():
                return "duplicate", err
            return "error", err
    # successful == 1 means the card was created
    if data.get("successful", 0) >= 1:
        return "imported", ""
    return "error", str(data)


# ── main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Single-card Greek vocab import")
    parser.add_argument("--dry-run",   action="store_true", help="Show plan, no API calls")
    parser.add_argument("--start-at",  metavar="WORD",      help="Resume from this word (inclusive)")
    parser.add_argument("--sleep",     type=int, default=DEFAULT_SLEEP, metavar="SECS",
                        help=f"Sleep between cards (default {DEFAULT_SLEEP}s)")
    args = parser.parse_args()

    log_filename = f"G:/My Drive/Code/Python/Super-Flashcards/greek_import_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

    print("=" * 64)
    print("Super Flashcards — Greek Single-Card Import")
    print(f"Target  : {BASE_URL}")
    print(f"Images  : YES")
    print(f"Sleep   : {args.sleep}s between cards")
    print(f"Log     : {log_filename}")
    print("=" * 64)

    # Step 1: load vocab file
    with open(VOCAB_FILE, encoding="utf-8") as f:
        all_words = [l.strip() for l in f if l.strip()]
    print(f"\n[Step 1] Vocab file: {len(all_words)} words")

    # Step 2: fetch existing Greek words
    print(f"\n[Step 2] Fetching existing Greek cards from API ...")
    existing = get_existing_greek_words()
    print(f"  Existing cards: {len(existing)}")

    # Step 3: compute delta
    words_to_import = [w for w in all_words if w not in existing]
    skipped_dupes   = len(all_words) - len(words_to_import)
    print(f"\n[Step 3] Delta")
    print(f"  Already in SF : {skipped_dupes}")
    print(f"  To import     : {len(words_to_import)}")

    if not words_to_import:
        print("\nAll words already imported. Nothing to do.")
        return

    # Apply --start-at resume offset
    if args.start_at:
        try:
            idx = words_to_import.index(args.start_at)
            words_to_import = words_to_import[idx:]
            print(f"  Resuming from : '{args.start_at}' (word {idx + 1} of original list)")
        except ValueError:
            print(f"  WARNING: --start-at '{args.start_at}' not found in delta list. Starting from beginning.")

    total = len(words_to_import)
    est_hours = total * (args.sleep + 35) / 3600
    print(f"\n[Step 4] Import plan")
    print(f"  Cards to process : {total}")
    print(f"  Sleep between    : {args.sleep}s")
    print(f"  Est. time        : ~{est_hours:.1f} hours (processing ~35s/card + sleep)")

    if args.dry_run:
        print(f"\n[DRY RUN — no API calls]")
        print(f"  First 5 words : {words_to_import[:5]}")
        print(f"  Last  5 words : {words_to_import[-5:]}")
        return

    # Step 5: import loop
    print(f"\n[Step 5] Starting import — logging to {log_filename}\n")
    imported   = 0
    duplicates = 0
    errors     = []
    session_start = time.time()

    with open(log_filename, "w", encoding="utf-8") as logf:
        log(f"=== Greek Import Start ===", logf)
        log(f"Words to process: {total}", logf)
        log(f"Sleep: {args.sleep}s | API timeout: {API_TIMEOUT}s", logf)
        log("", logf)

        for i, word in enumerate(words_to_import, start=1):
            try:
                status, detail = import_word(word)
            except requests.Timeout:
                status, detail = "error", f"Client timeout ({API_TIMEOUT}s)"
            except requests.HTTPError as e:
                status, detail = "error", f"HTTP {e.response.status_code}: {e.response.text[:120]}"
            except Exception as e:
                status, detail = "error", f"{type(e).__name__}: {str(e)[:120]}"

            elapsed = int(time.time() - session_start)
            progress = f"{i}/{total}"

            if status == "imported":
                imported += 1
                log(f"OK    [{progress}] {word}  (total imported: {imported})", logf)
            elif status == "duplicate":
                duplicates += 1
                log(f"SKIP  [{progress}] {word}  (duplicate)", logf)
            else:
                errors.append((word, detail))
                log(f"FAIL  [{progress}] {word}  — {detail}", logf)

            # Progress summary every 20 words
            if i % 20 == 0:
                log(f"--- Progress: {i}/{total} | imported={imported} dup={duplicates} err={len(errors)} elapsed={elapsed//60}m ---", logf)

            # Sleep between cards (skip after last)
            if i < total:
                time.sleep(args.sleep)

        # Final summary
        elapsed = int(time.time() - session_start)
        log("", logf)
        log("=" * 64, logf)
        log("IMPORT COMPLETE", logf)
        log("=" * 64, logf)
        log(f"Total processed : {total}", logf)
        log(f"Imported        : {imported}", logf)
        log(f"Duplicates      : {duplicates}", logf)
        log(f"Errors          : {len(errors)}", logf)
        log(f"Elapsed         : {elapsed // 3600}h {(elapsed % 3600) // 60}m {elapsed % 60}s", logf)

        if errors:
            log("", logf)
            log(f"Error details ({len(errors)} words):", logf)
            for word, detail in errors:
                log(f"  {word}: {detail}", logf)

        log("", logf)
        log(f"Log saved to: {log_filename}", logf)

    print(f"\nDone. Imported={imported} Duplicates={duplicates} Errors={len(errors)}")
    print(f"Full log: {log_filename}")


if __name__ == "__main__":
    main()
