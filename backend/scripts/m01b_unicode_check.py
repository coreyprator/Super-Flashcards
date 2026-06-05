"""M01b: Investigate Unicode content in headword, headword_latin, headword_ascii columns."""
import pyodbc
import sys
import unicodedata

pw = sys.argv[1] if len(sys.argv) > 1 else ""

conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=35.224.242.223,1433;DATABASE=learning;UID=sqlserver;"
    f"PWD={pw};Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;"
)
cur = conn.cursor()

print("=== Sample headword/headword_latin/headword_ascii per source ===")
for src in ['beekes', 'kroonen', 'watkins', 'de-vaan']:
    cur.execute(
        "SELECT TOP 5 headword, headword_latin, headword_ascii "
        "FROM dbo.etymology_entries WHERE source = ? "
        "ORDER BY id",
        (src,)
    )
    rows = cur.fetchall()
    print(f"\n--- {src} ---")
    for row in rows:
        hw, hwl, hwa = row[0], row[1], row[2]
        # Check for non-ASCII
        hw_nonascii = any(ord(c) > 127 for c in (hw or ''))
        hwl_nonascii = any(ord(c) > 127 for c in (hwl or ''))
        hwa_nonascii = any(ord(c) > 127 for c in (hwa or ''))
        print(f"  headword={hw!r}{'[NON-ASCII]' if hw_nonascii else ''}")
        print(f"  headword_latin={hwl!r}{'[NON-ASCII]' if hwl_nonascii else ''}")
        print(f"  headword_ascii={hwa!r}{'[NON-ASCII]' if hwa_nonascii else ''}")

print()
print("=== Python-based non-ASCII count per source ===")
for src in ['beekes', 'kroonen', 'watkins', 'de-vaan']:
    cur.execute(
        "SELECT headword, headword_latin, headword_ascii "
        "FROM dbo.etymology_entries WHERE source = ?",
        (src,)
    )
    rows = cur.fetchall()
    hw_na = sum(1 for r in rows if r[0] and any(ord(c) > 127 for c in r[0]))
    hwl_na = sum(1 for r in rows if r[1] and any(ord(c) > 127 for c in r[1]))
    hwa_na = sum(1 for r in rows if r[2] and any(ord(c) > 127 for c in r[2]))
    print(f"  {src}: headword={hw_na}, headword_latin={hwl_na}, headword_ascii={hwa_na} (total={len(rows)})")

conn.close()
print("DONE M01b")
