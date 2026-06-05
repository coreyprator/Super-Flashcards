"""
SF-ETL-FIX-003: Proper Unicode-NFD transliteration + ASCII fold fix
Sprint: SF-ETL-FIX-003

Root cause: Prior transliteration (SF-ETL-FIX-002 Phase M07/M08) did NOT NFD-decompose
Greek polytonic before lookup. Precomposed accented chars like '\u03ad' (epsilon+tonos)
were not in the Greek-to-Latin map, so they slipped through to headword_latin/headword_ascii.

Fix: NFD-decompose first, so '\u03ad' -> '\u03b5' (epsilon) + U+0301 (combining acute).
Then epsilon -> 'e', combining mark stripped (for ascii) or kept (for latin).

Usage:
  python fix_transliteration.py --dry-run --sample 20   [Phase 2: M03]
  python fix_transliteration.py --commit                [Phase 3: M04]

Only beekes source has non-ASCII headwords (Greek polytonic).
kroonen/watkins/de-vaan headwords are already Latin/ASCII - untouched.
"""

import argparse
import sys
import unicodedata
import pyodbc

# Full Greek-to-Latin map (base letters only, no accents)
GREEK_TO_LATIN = {
    # lowercase
    'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z',
    'η': 'e', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm',
    'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's',
    'ς': 's', 'τ': 't', 'υ': 'u', 'φ': 'ph', 'χ': 'ch', 'ψ': 'ps',
    'ω': 'o',
    # uppercase
    'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z',
    'Η': 'E', 'Θ': 'Th', 'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M',
    'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P', 'Ρ': 'R', 'Σ': 'S',
    'Τ': 'T', 'Υ': 'U', 'Φ': 'Ph', 'Χ': 'Ch', 'Ψ': 'Ps', 'Ω': 'O',
    # breathings and other Greek punctuation (strip)
    '\u0374': '', '\u0375': '', '\u037e': '', '\u0387': '',
    # Greek archaic letters that may appear
    '\u03dd': 'w', '\u03dc': 'W',  # digamma
    '\u03f2': 's', '\u03f9': 'S',  # lunate sigma
}


def to_latin(s: str) -> str:
    """
    Greek polytonic -> Latin with accents preserved (for headword_latin display).

    Step 1: NFD decompose — precomposed chars split into base + combining marks.
    Step 2: Map Greek base letters to Latin equivalents.
    Step 3: Keep combining marks attached to the resulting Latin letters.
    Step 4: NFC re-compose the Latin + combining marks.

    If string has no Greek characters, return unchanged.
    """
    if not s:
        return s
    # NFD decompose: e.g. '\u03ad' (έ) -> '\u03b5' (ε) + '\u0301' (combining acute)
    decomposed = unicodedata.normalize('NFD', s)
    result = []
    for char in decomposed:
        if char in GREEK_TO_LATIN:
            result.append(GREEK_TO_LATIN[char])
        else:
            result.append(char)
    # NFC re-compose so accent marks bind to their base letter
    return unicodedata.normalize('NFC', ''.join(result))


def to_ascii(s: str) -> str:
    """
    Strip ALL diacritics + non-ASCII chars (for headword_ascii search).

    Step 1: NFD decompose.
    Step 2: Strip combining marks (Unicode category Mn = Nonspacing Mark).
    Step 3: Map Greek base letters to Latin.
    Step 4: Strip remaining non-ASCII and special chars (keep alphanumeric + space + _).
    Step 5: Lowercase.
    """
    if not s:
        return s
    # NFD decompose
    decomposed = unicodedata.normalize('NFD', s)
    # Strip combining marks
    no_marks = ''.join(c for c in decomposed if unicodedata.category(c) != 'Mn')
    # Map Greek base letters to Latin
    mapped = ''.join(GREEK_TO_LATIN.get(c, c) for c in no_marks)
    # Strip remaining non-ASCII and special chars (keep alphanumeric and space/_)
    ascii_only = ''.join(c for c in mapped if c.isascii() and (c.isalnum() or c in ' _'))
    return ascii_only.lower()


def get_conn(pw: str) -> pyodbc.Connection:
    return pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=35.224.242.223,1433;DATABASE=learning;UID=sqlserver;"
        f"PWD={pw};Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;",
        autocommit=False
    )


def run_dry_run(conn: pyodbc.Connection, sample: int = 20) -> None:
    """Phase 2 / M03: Show before/after for sample rows."""
    cur = conn.cursor()
    cur.execute(
        "SELECT TOP (?) id, headword, headword_latin, headword_ascii "
        "FROM dbo.etymology_entries "
        "WHERE source = 'beekes' "
        "  AND headword IS NOT NULL "
        "  AND LEN(headword_latin) > 0 "
        "ORDER BY id",
        (sample,)
    )
    rows = cur.fetchall()

    print(f"\n{'ID':<8} {'headword':<25} {'headword_latin (before)':<30} {'headword_latin (after)':<30} "
          f"{'headword_ascii (before)':<25} {'headword_ascii (after)':<20}")
    print("-" * 145)
    for row in rows:
        row_id, hw, hwl_before, hwa_before = row[0], row[1], row[2], row[3]
        hwl_after = to_latin(hw)
        hwa_after = to_ascii(hw)
        changed = hwl_before != hwl_after or hwa_before != hwa_after
        marker = " *" if changed else "  "
        print(f"{row_id:<8} {str(hw):<25} {str(hwl_before):<30} {str(hwl_after):<30} "
              f"{str(hwa_before):<25} {str(hwa_after):<20}{marker}")

    # Count how many changed in this sample
    changes = sum(
        1 for r in rows
        if to_latin(r[1]) != r[2] or to_ascii(r[1]) != r[3]
    )
    print(f"\nSample size: {len(rows)}, changed: {changes}")

    # Full count across all beekes
    cur.execute(
        "SELECT COUNT(*) FROM dbo.etymology_entries "
        "WHERE source = 'beekes' AND headword IS NOT NULL"
    )
    total = cur.fetchone()[0]
    print(f"Total beekes rows with headword: {total}")
    print("\nDRY RUN COMPLETE — no DB changes made.")


def run_commit(conn: pyodbc.Connection) -> None:
    """Phase 3 / M04+M11: Apply UPDATE to all affected beekes rows."""
    cur = conn.cursor()

    print("\n[SENTINEL-START: fix_transliteration COMMIT]")

    # Fetch all beekes rows with a headword
    print("Fetching beekes rows...")
    cur.execute(
        "SELECT id, headword FROM dbo.etymology_entries "
        "WHERE source = 'beekes' AND headword IS NOT NULL"
    )
    rows = cur.fetchall()
    print(f"Fetched {len(rows)} rows.")

    updated = 0
    skipped = 0
    errors = 0

    # Build batch updates
    update_params = []
    for row in rows:
        row_id, hw = row[0], row[1]
        new_hwl = to_latin(hw)
        new_hwa = to_ascii(hw)
        update_params.append((new_hwl, new_hwa, row_id))

    print(f"Applying {len(update_params)} UPDATE statements...")
    try:
        cur.executemany(
            "UPDATE dbo.etymology_entries "
            "SET headword_latin = ?, headword_ascii = ? "
            "WHERE id = ?",
            update_params
        )
        conn.commit()
        updated = len(update_params)
        print(f"Committed. Rows updated: {updated}")
    except Exception as e:
        conn.rollback()
        print(f"ERROR during batch update, rolled back: {e}")
        errors += 1

    print(f"\nSummary: updated={updated}, skipped={skipped}, errors={errors}")

    # M11: 10-row sanity sample
    print("\n[M11: 10-row post-commit sanity sample]")
    cur.execute(
        "SELECT TOP 10 headword, headword_latin, headword_ascii "
        "FROM dbo.etymology_entries "
        "WHERE source = 'beekes' "
        "ORDER BY id"
    )
    sample_rows = cur.fetchall()
    for r in sample_rows:
        hw, hwl, hwa = r[0], r[1], r[2]
        hwa_na = any(ord(c) > 127 for c in (hwa or ''))
        print(f"  headword={hw!r} -> headword_latin={hwl!r} | headword_ascii={hwa!r}{'  [NON-ASCII!]' if hwa_na else ''}")

    # M04 verification: count remaining non-ASCII in headword_ascii
    cur.execute(
        "SELECT source, COUNT(*) FROM dbo.etymology_entries "
        "WHERE source IN ('beekes','kroonen','watkins','de-vaan') "
        "  AND headword_ascii IS NOT NULL "
        "GROUP BY source ORDER BY source"
    )
    print("\n[M04 post-commit: rows per source (total)]")
    for r in cur.fetchall():
        print(f"  {r[0]}: {r[1]}")

    # Python-side count of remaining non-ASCII in headword_ascii
    cur.execute(
        "SELECT headword_ascii FROM dbo.etymology_entries "
        "WHERE source = 'beekes'"
    )
    ascii_rows = cur.fetchall()
    remaining = sum(1 for r in ascii_rows if r[0] and any(ord(c) > 127 for c in r[0]))
    print(f"\n[M04] beekes headword_ascii non-ASCII remaining: {remaining} (target ~0)")

    print("\n[SENTINEL-END: fix_transliteration COMMIT]")


def main():
    parser = argparse.ArgumentParser(description="SF-ETL-FIX-003: Fix Unicode transliteration")
    parser.add_argument("--dry-run", action="store_true", help="Show before/after without DB changes")
    parser.add_argument("--commit", action="store_true", help="Apply UPDATE statements to DB")
    parser.add_argument("--sample", type=int, default=20, help="Number of rows for dry-run (default 20)")
    parser.add_argument("--pw", type=str, default="", help="DB password (or set LEARNING_DB_PW env var)")
    args = parser.parse_args()

    import os
    pw = args.pw or os.environ.get("LEARNING_DB_PW", "")
    if not pw:
        print("ERROR: DB password required. Use --pw or set LEARNING_DB_PW env var.")
        sys.exit(1)

    if not args.dry_run and not args.commit:
        parser.print_help()
        sys.exit(1)

    conn = get_conn(pw)
    print("Connected to learning DB OK.")

    if args.dry_run:
        run_dry_run(conn, sample=args.sample)
    elif args.commit:
        run_commit(conn)

    conn.close()


if __name__ == "__main__":
    main()
