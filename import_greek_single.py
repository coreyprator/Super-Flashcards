"""
Single-card Greek vocabulary import for Super Flashcards.

One word per request. 60-second sleep between words.
Images included (single card + DALL-E fits comfortably in Cloud Run 300s limit).
Skips duplicates (handled server-side by /api/ai/batch-generate).
Never aborts on error — logs it and continues.

Three modes for duplicate detection:
  1. SQL query (default) — fast, handles 800+ cards. Requires --db-password or DB_PASSWORD env var.
  2. Delta file (--delta-file) — pre-computed word list, skips all queries.
  3. Legacy API (--use-api) — original GET /api/flashcards. Hangs at 800+ cards.

Usage:
    python import_greek_single.py --db-password PASSWORD          # SQL delta (default)
    python import_greek_single.py --delta-file remaining.txt      # pre-computed delta
    python import_greek_single.py --use-api                       # legacy API mode
    python import_greek_single.py --db-password PASSWORD --dry-run # show plan, write delta file
    python import_greek_single.py --start-at WORD                 # resume from a specific word
    python import_greek_single.py --sleep 60                      # override inter-card sleep

Log file: greek_import_YYYYMMDD_HHMMSS.log  (created at start, appended per card)
"""
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import argparse
import os
import time
import random
import requests
import pymssql
from datetime import datetime

BASE_URL       = "https://learn.rentyourcio.com"
GREEK_LANG_ID  = "21d23a9e-4ef7-4d53-ad17-371d164d0f0f"
VOCAB_FILE     = "G:/My Drive/Code/Python/Super-Flashcards/greek_core_vocab.txt"
DEFAULT_SLEEP  = 60   # seconds between cards
API_TIMEOUT    = 180  # seconds — single card with DALL-E finishes well within this
RETRY_ATTEMPTS = 5
RETRY_BASE_SEC = 2


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

def request_with_retries(method, url, *, timeout, logf=None, **kwargs):
    """HTTP request with bounded retries for transient network failures."""
    last_error = None
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            return requests.request(method, url, timeout=timeout, **kwargs)
        except (requests.Timeout, requests.ConnectionError) as e:
            last_error = e
            if attempt == RETRY_ATTEMPTS:
                break
            backoff = RETRY_BASE_SEC * (2 ** (attempt - 1)) + random.uniform(0, 0.5)
            log(
                f"WARN  Network error on {method.upper()} {url} (attempt {attempt}/{RETRY_ATTEMPTS}): "
                f"{type(e).__name__}: {str(e)[:120]} | retrying in {backoff:.1f}s",
                logf,
            )
            time.sleep(backoff)
    raise last_error

def get_existing_greek_words_api():
    """Return set of words already in SF for Greek, via API.
    WARNING: Hangs at 800+ cards. Use SQL mode instead."""
    existing = set()
    offset, limit = 0, 1000
    while True:
        r = request_with_retries(
            "GET",
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

def get_existing_greek_words_sql(db_password):
    """Query Cloud SQL directly for existing Greek words.
    Replaces GET /api/flashcards which hangs at 800+ cards."""
    conn = pymssql.connect(
        server='35.224.242.223',
        user='sqlserver',
        password=db_password,
        database='LanguageLearning',
    )
    cursor = conn.cursor()
    cursor.execute('''
        SELECT DISTINCT f.word_or_phrase
        FROM flashcards f
        JOIN languages l ON f.language_id = l.id
        WHERE l.name = 'Greek'
    ''')
    existing = set(row[0] for row in cursor.fetchall())
    conn.close()
    return existing

def get_delta_from_file(filepath):
    """Read pre-computed delta word list from a file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return [line.strip() for line in f if line.strip()]

def import_word(word):
    """
    POST one word to /api/ai/batch-generate with include_images=True.
    Returns (status, detail) where status is 'imported'|'duplicate'|'error'.
    """
    r = request_with_retries(
        "POST",
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
    parser.add_argument("--dry-run",      action="store_true", help="Calculate and display delta without importing")
    parser.add_argument("--start-at",     metavar="WORD",      help="Resume from this word (inclusive)")
    parser.add_argument("--sleep",        type=int, default=DEFAULT_SLEEP, metavar="SECS",
                        help=f"Sleep between cards (default {DEFAULT_SLEEP}s)")
    parser.add_argument("--db-password",  type=str, default=None,
                        help="Cloud SQL password for direct DB delta query (default mode)")
    parser.add_argument("--delta-file",   type=str, default=None,
                        help="Pre-computed delta file — skip duplicate detection entirely")
    parser.add_argument("--use-api",      action="store_true",
                        help="Use legacy API-based duplicate detection (slow for 800+ cards)")
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

    # Step 2: determine delta (duplicate detection mode)
    if args.delta_file:
        print(f"\n[Step 2] [MODE] Delta file: {args.delta_file}")
        words_to_import = get_delta_from_file(args.delta_file)
        print(f"  Words from delta file: {len(words_to_import)}")
    elif args.use_api:
        print(f"\n[Step 2] [MODE] Legacy API query (slow for large datasets)")
        existing = get_existing_greek_words_api()
        print(f"  Existing cards: {len(existing)}")
        words_to_import = [w for w in all_words if w not in existing]
    else:
        print(f"\n[Step 2] [MODE] SQL direct query to Cloud SQL")
        password = args.db_password or os.environ.get('DB_PASSWORD')
        if not password:
            password = input("Enter Cloud SQL password (sqlserver): ")
        existing = get_existing_greek_words_sql(password)
        print(f"  Existing cards: {len(existing)}")
        words_to_import = [w for w in all_words if w not in existing]

    # Step 3: delta summary
    if not args.delta_file:
        skipped_dupes = len(all_words) - len(words_to_import)
        print(f"\n[Step 3] Delta")
        print(f"  Already in SF : {skipped_dupes}")
        print(f"  To import     : {len(words_to_import)}")
    else:
        print(f"\n[Step 3] Delta (from file)")
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
        delta_file = "G:/My Drive/Code/Python/Super-Flashcards/greek_import_delta_remaining.txt"
        with open(delta_file, 'w', encoding='utf-8') as f:
            for w in words_to_import:
                f.write(w + '\n')
        print(f"\n[DRY RUN — no API calls]")
        print(f"  First 5 words : {words_to_import[:5]}")
        print(f"  Last  5 words : {words_to_import[-5:]}")
        print(f"  Written to    : {delta_file}")
        print(f"  Dry run complete. Exiting.")
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
