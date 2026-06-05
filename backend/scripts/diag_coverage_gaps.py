"""Investigate specific parity failures to distinguish coverage gaps vs fixable issues."""
import pyodbc, sys

pw = sys.argv[1] if len(sys.argv) > 1 else ""
conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=35.224.242.223,1433;DATABASE=learning;UID=sqlserver;"
    f"PWD={pw};Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;",
    autocommit=True
)
cur = conn.cursor()

# Check: does beekes have entries that SHOULD map to 'anthropos'?
print("=== beekes entries matching anthropos-related Greek ===")
cur.execute(
    "SELECT id, headword, headword_ascii, headword_latin FROM dbo.etymology_entries "
    "WHERE source='beekes' AND (headword LIKE N'%ανθρωπ%' OR headword LIKE N'%νθρωπ%') "
    "ORDER BY id"
)
for r in cur.fetchall():
    print(f"  id={r[0]}, headword={r[1]!r}, headword_ascii={r[2]!r}, headword_latin={r[3]!r}")

# Check: does beekes have theta-ksi? 
print()
print("=== beekes: headword_ascii containing 'theos' or similar ===")
cur.execute(
    "SELECT id, headword, headword_ascii FROM dbo.etymology_entries "
    "WHERE source='beekes' AND headword_ascii LIKE '%theo%' ORDER BY id LIMIT 5" if False
    else "SELECT TOP 5 id, headword, headword_ascii FROM dbo.etymology_entries "
         "WHERE source='beekes' AND headword_ascii LIKE '%theo%' ORDER BY id"
)
for r in cur.fetchall():
    print(f"  id={r[0]}, headword={r[1]!r}, headword_ascii={r[2]!r}")

# Check kroonen: does it have 'theos' related
print()
print("=== kroonen: headword_ascii or headword related to theos/god ===")
cur.execute(
    "SELECT TOP 5 id, headword, headword_ascii FROM dbo.etymology_entries "
    "WHERE source='kroonen' AND (headword_ascii LIKE '%got%' OR headword_ascii LIKE '%god%' "
    "  OR headword_ascii LIKE '%guth%' OR headword_ascii LIKE '%guda%') ORDER BY id"
)
for r in cur.fetchall():
    print(f"  id={r[0]}, headword={r[1]!r}, headword_ascii={r[2]!r}")

# Check: search for "theos" using API-style CONTAINS
print()
print("=== CONTAINS(theos) for kroonen ===")
cur.execute(
    "SELECT TOP 5 id, headword, headword_ascii FROM dbo.etymology_entries "
    "WHERE source='kroonen' AND CONTAINS(([headword],[headword_ascii],[headword_latin],[excerpt],[full_text]), '\"theos\"')"
)
for r in cur.fetchall():
    print(f"  id={r[0]}, headword={r[1]!r}, headword_ascii={r[2]!r}")

# Check: anthropos for kroonen
print()
print("=== CONTAINS(anthropos) for beekes/kroonen/de-vaan ===")
for src in ['beekes', 'kroonen', 'de-vaan']:
    cur.execute(
        "SELECT TOP 3 id, headword, headword_ascii FROM dbo.etymology_entries "
        "WHERE source=? AND CONTAINS(([headword],[headword_ascii],[headword_latin],[excerpt],[full_text]), '\"anthropos\"')",
        (src,)
    )
    rows = cur.fetchall()
    print(f"  {src}: {[(r[0], r[1][:20], r[2][:20]) for r in rows]}")

# Check: rex for de-vaan/kroonen/watkins
print()
print("=== Rex search: headword_ascii = 'rex' or LIKE ===")
cur.execute(
    "SELECT source, headword, headword_ascii FROM dbo.etymology_entries "
    "WHERE headword_ascii LIKE '%rex%' OR headword LIKE N'%rex%' ORDER BY source"
)
for r in cur.fetchall():
    print(f"  source={r[0]}, headword={r[1]!r}, headword_ascii={r[2]!r}")

# Check total beekes entries we can now find via ASCII query
print()
print("=== Summary: CONTAINS for all failing queries ===")
queries = ['anthropos', 'theos', 'polis', 'rex', 'wasser', 'terra', 'vita', 'mann', 'gott', 'aqua']
sources = ['beekes', 'kroonen', 'de-vaan', 'watkins']
for q in queries:
    cur.execute(
        "SELECT source, COUNT(*) FROM dbo.etymology_entries "
        "WHERE CONTAINS(([headword],[headword_ascii],[headword_latin],[excerpt],[full_text]), ?) "
        "  AND source IN ('beekes','kroonen','de-vaan','watkins') "
        "GROUP BY source ORDER BY source",
        (f'"{q}"',)
    )
    rows = cur.fetchall()
    print(f"  {q}: {[(r[0], r[1]) for r in rows]}")

conn.close()
print("DONE")
