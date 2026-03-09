"""
SF-DCC-001: Import missing DCC Greek Core List words into Super Flashcards.

Phase 1: Update dcc_frequency_rank for existing SF cards that match DCC lemmas.
Phase 2: Insert new SF cards for DCC words not already in SF.

Usage:
    python scripts/import_dcc_words.py --dry-run     # Preview only
    python scripts/import_dcc_words.py               # Execute import

Requirements:
    pip install httpx pyodbc python-dotenv
"""

import argparse
import json
import sys
import unicodedata
import uuid
from datetime import datetime

import httpx
import pyodbc

# ─── Config ────────────────────────────────────────────────────────────────────

PIE_API_URL = "https://efg.rentyourcio.com/api/words?include_dcc=true"
SF_GREEK_LANGUAGE_CODE = "el"

DB_SERVER = "35.224.242.223,1433"
DB_NAME = "LanguageLearning"
DB_USER = "sqlserver"
DB_PASS = "LGxbsXu3*Cwyte3CLrnZ"


# ─── Helpers ───────────────────────────────────────────────────────────────────

def strip_accents(s: str) -> str:
    if not s:
        return ""
    nfkd = unicodedata.normalize("NFD", s)
    return "".join(c for c in nfkd if unicodedata.category(c) != "Mn").lower().strip()


def get_db_connection():
    return pyodbc.connect(
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={DB_SERVER};"
        f"DATABASE={DB_NAME};"
        f"UID={DB_USER};"
        f"PWD={DB_PASS};"
        f"Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;"
    )


# ─── Main ──────────────────────────────────────────────────────────────────────

def main(dry_run: bool):
    print(f"{'DRY RUN — no changes will be made' if dry_run else 'LIVE RUN — changes WILL be made'}")
    print()

    # 1. Fetch DCC data from PIE API
    print("Fetching DCC data from PIE Network Graph API...")
    response = httpx.get(PIE_API_URL, timeout=20.0)
    response.raise_for_status()
    words = response.json()
    if isinstance(words, dict):
        words = words.get("words", words.get("nodes", []))
    dcc_words = [w for w in words if w.get("frequency_rank") and w.get("label")]
    print(f"  DCC words fetched: {len(dcc_words)}")

    dcc_by_stripped = {strip_accents(w["label"]): w for w in dcc_words}

    # 2. Connect to SF DB
    print("Connecting to LanguageLearning database...")
    conn = get_db_connection()
    cursor = conn.cursor()

    # 3. Get Greek language_id
    cursor.execute("SELECT id FROM languages WHERE code = ?", SF_GREEK_LANGUAGE_CODE)
    row = cursor.fetchone()
    if not row:
        print(f"ERROR: No language with code '{SF_GREEK_LANGUAGE_CODE}' found in DB.")
        conn.close()
        sys.exit(1)
    greek_lang_id = str(row[0])
    print(f"  Greek language_id: {greek_lang_id}")

    # 4. Load all SF Greek words
    cursor.execute(
        "SELECT f.id, f.word_or_phrase FROM flashcards f "
        "JOIN languages l ON f.language_id = l.id WHERE l.code = ?",
        SF_GREEK_LANGUAGE_CODE,
    )
    sf_rows = [(str(row[0]), row[1]) for row in cursor.fetchall()]
    print(f"  SF Greek cards: {len(sf_rows)}")

    sf_by_stripped: dict[str, str] = {}  # stripped -> sf_id (first match wins)
    for sf_id, sf_word in sf_rows:
        key = strip_accents(sf_word)
        if key not in sf_by_stripped:
            sf_by_stripped[key] = sf_id

    # 5. Identify matches and gaps
    to_update: list[tuple[str, int]] = []   # (sf_id, dcc_rank)
    to_insert: list[dict] = []              # DCC words not in SF

    for stripped, dcc_word in dcc_by_stripped.items():
        rank = dcc_word["frequency_rank"]
        if stripped in sf_by_stripped:
            to_update.append((sf_by_stripped[stripped], rank))
        else:
            to_insert.append(dcc_word)

    to_insert.sort(key=lambda w: w.get("frequency_rank", 9999))

    print()
    print(f"Phase 1 — Update dcc_frequency_rank for existing cards: {len(to_update)}")
    print(f"Phase 2 — Insert new DCC cards not in SF:               {len(to_insert)}")
    print()

    if dry_run:
        print("New words to import (sample):")
        for w in to_insert[:10]:
            print(f"  rank={w['frequency_rank']:3d}  {w['label']!r:20s}  {w['gloss']!r}")
        if len(to_insert) > 10:
            print(f"  ... and {len(to_insert) - 10} more")
        conn.close()
        return

    # ─── Phase 1: Update dcc_frequency_rank ────────────────────────────────────
    print("Phase 1: Updating dcc_frequency_rank on existing cards...")
    updated = 0
    for sf_id, rank in to_update:
        cursor.execute(
            "UPDATE flashcards SET dcc_frequency_rank = ? WHERE id = ?",
            rank, sf_id
        )
        updated += 1
    conn.commit()
    print(f"  Updated: {updated} cards")

    # ─── Phase 2: Insert new cards ─────────────────────────────────────────────
    print("Phase 2: Inserting new DCC cards...")
    inserted = 0
    skipped = 0
    for w in to_insert:
        label = w.get("label", "")
        gloss = w.get("gloss", "")
        pos = w.get("pos", "")
        rank = w.get("frequency_rank")

        # Double-check not already in DB (guard against case-sensitivity edge cases)
        cursor.execute(
            "SELECT COUNT(*) FROM flashcards f "
            "JOIN languages l ON f.language_id = l.id "
            "WHERE l.code = ? AND f.word_or_phrase = ?",
            SF_GREEK_LANGUAGE_CODE, label
        )
        if cursor.fetchone()[0] > 0:
            skipped += 1
            continue

        new_id = str(uuid.uuid4())
        definition = gloss
        if pos:
            definition = f"{gloss} [{pos}]" if gloss else pos

        cursor.execute(
            """
            INSERT INTO flashcards
                (id, language_id, word_or_phrase, definition, source, dcc_frequency_rank,
                 times_reviewed, is_synced, local_only, created_at, updated_at)
            VALUES
                (?, ?, ?, ?, 'dcc_import', ?,
                 0, 1, 0, GETDATE(), GETDATE())
            """,
            new_id, greek_lang_id, label, definition, rank
        )
        inserted += 1
        if inserted % 10 == 0:
            print(f"  Inserted {inserted} so far...")
        conn.commit()

    print()
    print("=" * 50)
    print("IMPORT COMPLETE")
    print(f"  dcc_frequency_rank updated:    {updated}")
    print(f"  New cards inserted:            {inserted}")
    print(f"  Skipped (already existed):     {skipped}")
    print("=" * 50)

    conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import DCC Greek Core List words into Super Flashcards")
    parser.add_argument("--dry-run", action="store_true", help="Preview without making changes")
    args = parser.parse_args()
    main(dry_run=args.dry_run)
