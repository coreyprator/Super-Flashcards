"""
SF-ETL-FIX-002: Headword re-extraction ETL helper
Sprint: SF-ETL-FIX-002
Phases M03-M06: Re-extract correct headwords from excerpt content
  M03: de-vaan (709 rows)   — after "de Vaan Latin Etymology: " up to delimiter
  M04: kroonen (1,273 rows) — *headword- at start of excerpt
  M05: watkins (408 rows)   — after "Watkins PIE Root: " up to period/space
  M06: beekes (1,444 rows)  — strip page-number prefix, take first Greek word

Committed to git per sprint hard gate (Python helper allowed when unavoidable).
Run from g:\My Drive\Code\Python or Super-Flashcards directory.
"""

import re
import pyodbc

# Direct connection to learning DB (same server MetaPM MCP uses)
LEARNING_CS = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=35.224.242.223,1433;"
    "DATABASE=learning;"
    "UID=sqlserver;"
    "PWD=R2B1Admin#2025;"
    "Encrypt=yes;"
    "TrustServerCertificate=yes;"
    "Connection Timeout=30;"
)


def extract_de_vaan(excerpt: str) -> str:
    """
    Pattern: "de Vaan Latin Etymology: <headword> ..."
    Extract word after the 25-char prefix, up to first delimiter.
    """
    PREFIX = "de Vaan Latin Etymology: "
    if not excerpt or not excerpt.startswith(PREFIX):
        return None
    tail = excerpt[len(PREFIX):]
    # Split on first space, comma, apostrophe, bracket, or parenthesis
    m = re.match(r"([^\s,'\[\(]+)", tail)
    if m:
        return m.group(1).rstrip(",-;")
    return None


def extract_kroonen(excerpt: str) -> str:
    """
    Pattern: "*headword[-]" at start of excerpt (PG reconstructed form)
    Take from start up to first space or em-dash (—).
    """
    if not excerpt or not excerpt.startswith("*"):
        return None
    # Up to space, em-dash (U+2014), newline, or tab
    m = re.match(r"(\*[\w\-\.]+)", excerpt)
    if m:
        return m.group(1)
    return None


def extract_watkins(excerpt: str) -> str:
    """
    Pattern: "Watkins PIE Root: <headword>. ..."
    Extract word after 18-char prefix, up to first period or space.
    """
    PREFIX = "Watkins PIE Root: "
    if not excerpt or not excerpt.startswith(PREFIX):
        return None
    tail = excerpt[len(PREFIX):]
    # Up to first period, space, or comma
    m = re.match(r"([^\s\.,]+)", tail)
    if m:
        return m.group(1).rstrip(",-;")
    return None


def extract_beekes(excerpt: str) -> str:
    """
    Two sub-formats:
    (a) num-first: "NNN <Greek_word>..." — strip leading digits+space, take first word
    (b) greek-first: "<Greek_word> NNN..." — take first word (up to first space/digit)
    Skip INDICES and Latin-script entries.
    """
    if not excerpt:
        return None

    # Format A: starts with digit(s) then space/Greek
    m_num = re.match(r"^\d+\s+\*?\s*(\S+)", excerpt)
    if m_num:
        word = m_num.group(1).rstrip(".,;:")
        # Skip if it's a Latin/ASCII word (INDICES, etc.) — Greek chars have codepoint > 0x0370
        if any(ord(c) > 0x0370 for c in word):
            return word
        # Fall through to try greek-first
    else:
        # Format B: starts with Greek word then space/digit
        m_greek = re.match(r"^(\S+)\s+\d", excerpt)
        if m_greek:
            word = m_greek.group(1).rstrip(".,;:")
            if any(ord(c) > 0x0370 for c in word):
                return word

    # Fallback: find first Greek-script word anywhere in first 30 chars
    first_part = excerpt[:50]
    tokens = first_part.split()
    for tok in tokens:
        tok_clean = tok.strip(".,;:[]()•")
        if tok_clean and any(ord(c) > 0x0370 for c in tok_clean):
            return tok_clean

    return None


def run_extraction(conn, source: str, extract_fn, batch_size: int = 500):
    """Fetch rows for source, extract headwords, update in batches."""
    cursor = conn.cursor()

    # Fetch all fixable rows
    if source == "beekes":
        cursor.execute(
            "SELECT id, excerpt FROM dbo.etymology_entries "
            "WHERE source = ? AND excerpt IS NOT NULL",
            source
        )
    else:
        cursor.execute(
            "SELECT id, excerpt FROM dbo.etymology_entries WHERE source = ?",
            source
        )

    rows = cursor.fetchall()
    print(f"\n[{source}] fetched {len(rows)} rows")

    updates = []
    skipped = 0
    for row_id, excerpt in rows:
        new_hw = extract_fn(excerpt)
        if new_hw and len(new_hw.strip()) > 0:
            updates.append((new_hw.strip(), row_id))
        else:
            skipped += 1

    print(f"[{source}] extractable: {len(updates)}, skipped: {skipped}")

    # Batch UPDATE
    updated = 0
    for i in range(0, len(updates), batch_size):
        batch = updates[i:i + batch_size]
        for new_hw, row_id in batch:
            cursor.execute(
                "UPDATE dbo.etymology_entries SET headword = ? WHERE id = ?",
                new_hw, row_id
            )
        conn.commit()
        updated += len(batch)
        print(f"  [{source}] committed {updated}/{len(updates)}")

    return updated, skipped


def verify_sample(conn, source: str, n: int = 5):
    """Print random sample to verify extraction."""
    cursor = conn.cursor()
    cursor.execute(
        f"SELECT TOP {n} id, headword, LEFT(excerpt, 80) as e "
        f"FROM dbo.etymology_entries WHERE source = ? ORDER BY NEWID()",
        source
    )
    rows = cursor.fetchall()
    print(f"\n[{source}] VERIFICATION SAMPLE (n={n}):")
    for row in rows:
        print(f"  id={row[0]} hw={row[1]!r}")
        print(f"  exc={row[2][:60]!r}")


def main():
    print("SF-ETL-FIX-002: Connecting to learning DB...")
    conn = pyodbc.connect(LEARNING_CS, autocommit=False)
    print("Connected OK")

    results = {}

    # M03: de-vaan
    print("\n=== M03: de-vaan ===")
    n, s = run_extraction(conn, "de-vaan", extract_de_vaan)
    results["de-vaan"] = {"updated": n, "skipped": s}
    verify_sample(conn, "de-vaan")

    # M04: kroonen
    print("\n=== M04: kroonen ===")
    n, s = run_extraction(conn, "kroonen", extract_kroonen)
    results["kroonen"] = {"updated": n, "skipped": s}
    verify_sample(conn, "kroonen")

    # M05: watkins
    print("\n=== M05: watkins ===")
    n, s = run_extraction(conn, "watkins", extract_watkins)
    results["watkins"] = {"updated": n, "skipped": s}
    verify_sample(conn, "watkins")

    # M06: beekes (non-null excerpt rows only)
    print("\n=== M06: beekes ===")
    n, s = run_extraction(conn, "beekes", extract_beekes)
    results["beekes"] = {"updated": n, "skipped": s}
    verify_sample(conn, "beekes")

    print("\n=== SUMMARY ===")
    total = 0
    for src, r in results.items():
        print(f"  {src}: {r['updated']} updated, {r['skipped']} skipped")
        total += r["updated"]
    print(f"  TOTAL UPDATED: {total}")

    conn.close()
    print("\nDone. Connection closed.")


if __name__ == "__main__":
    main()
