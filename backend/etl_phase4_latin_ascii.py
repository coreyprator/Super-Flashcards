"""
SF-ETL-FIX-002 Phase 4: Re-populate headword_latin and headword_ascii
M07: headword_latin = fn_greek_to_latin(headword) for all 4 sources
M08: headword_ascii = fn_ascii_fold(headword_latin or headword) for all 4 sources
Usage: python etl_phase4_latin_ascii.py <db_password>
"""
import sys
import pyodbc


def get_conn(pw):
    return pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=35.224.242.223,1433;"
        "DATABASE=learning;"
        "UID=sqlserver;"
        f"PWD={pw};"
        "Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;",
        autocommit=True
    )


def main():
    if len(sys.argv) < 2:
        print("Usage: python etl_phase4_latin_ascii.py <db_password>")
        sys.exit(1)

    pw = sys.argv[1]
    print("Phase 4: Connecting...")
    conn = get_conn(pw)
    cur = conn.cursor()
    print("Connected OK")

    # M07: Re-populate headword_latin for all fixed sources
    print("\nM07: Updating headword_latin...")
    cur.execute("""
        UPDATE dbo.etymology_entries
        SET headword_latin = dbo.fn_greek_to_latin(headword)
        WHERE source IN ('de-vaan', 'kroonen', 'watkins', 'beekes')
          AND headword IS NOT NULL
    """)
    print(f"  headword_latin updated: {cur.rowcount} rows")

    # M08: Re-populate headword_ascii for all fixed sources
    print("\nM08: Updating headword_ascii...")
    cur.execute("""
        UPDATE dbo.etymology_entries
        SET headword_ascii = dbo.fn_ascii_fold(COALESCE(headword_latin, headword))
        WHERE source IN ('de-vaan', 'kroonen', 'watkins', 'beekes')
          AND COALESCE(headword_latin, headword) IS NOT NULL
    """)
    print(f"  headword_ascii updated: {cur.rowcount} rows")

    # Verify sample
    print("\nVerification sample:")
    cur.execute("""
        SELECT TOP 8 source, headword, headword_latin, headword_ascii
        FROM dbo.etymology_entries
        WHERE source IN ('de-vaan', 'kroonen', 'watkins', 'beekes')
        ORDER BY NEWID()
    """)
    rows = cur.fetchall()
    for r in rows:
        print(f"  [{r[0]}] hw={r[1]!r} latin={r[2]!r} ascii={r[3]!r}")

    # Specific checks for known problem rows from parity report
    print("\nKey parity checks:")
    for query, label in [
        ("SELECT headword, headword_latin, headword_ascii FROM dbo.etymology_entries WHERE id=16", "watkins invest->spend-"),
        ("SELECT COUNT(*) as c FROM dbo.etymology_entries WHERE source='de-vaan' AND headword_ascii='rex'", "de-vaan rex count"),
        ("SELECT COUNT(*) as c FROM dbo.etymology_entries WHERE source='de-vaan' AND headword='rex'", "de-vaan headword rex"),
    ]:
        cur.execute(query)
        r = cur.fetchone()
        print(f"  {label}: {list(r)}")

    conn.close()
    print("\nPhase 4 complete.")


if __name__ == "__main__":
    main()
