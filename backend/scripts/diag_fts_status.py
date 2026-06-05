"""Check FTS population status and catalog health."""
import pyodbc, sys

pw = sys.argv[1] if len(sys.argv) > 1 else ""
conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=35.224.242.223,1433;DATABASE=learning;UID=sqlserver;"
    f"PWD={pw};Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;",
    autocommit=True
)
cur = conn.cursor()

print("=== sys.dm_fts_index_population columns ===")
cur.execute(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
    "WHERE TABLE_NAME = 'dm_fts_index_population'"
)
# DMV columns may not show in INFORMATION_SCHEMA, try SELECT *
try:
    cur.execute("SELECT * FROM sys.dm_fts_index_population")
    desc = [c[0] for c in cur.description]
    print(f"  Columns: {desc}")
    rows = cur.fetchall()
    print(f"  Rows: {len(rows)}")
    for row in rows:
        print(f"  {dict(zip(desc, row))}")
except Exception as e:
    print(f"  Error: {e}")

print()
print("=== sys.dm_fts_active_catalogs ===")
try:
    cur.execute("SELECT * FROM sys.dm_fts_active_catalogs")
    desc = [c[0] for c in cur.description]
    print(f"  Columns: {desc}")
    rows = cur.fetchall()
    print(f"  Active crawls: {len(rows)}")
    for row in rows:
        print(f"  {dict(zip(desc, row))}")
except Exception as e:
    print(f"  Error: {e}")

print()
print("=== FTS catalog status ===")
cur.execute("""
    SELECT fc.name, fc.is_accent_sensitivity_on,
           FULLTEXTCATALOGPROPERTY(fc.name, 'PopulateStatus') AS pop_status,
           FULLTEXTCATALOGPROPERTY(fc.name, 'ItemCount') AS item_count,
           FULLTEXTCATALOGPROPERTY(fc.name, 'UniqueKeyCount') AS unique_keys
    FROM sys.fulltext_catalogs fc
""")
desc = [c[0] for c in cur.description]
for row in cur.fetchall():
    d = dict(zip(desc, row))
    print(f"  {d}")
    # pop_status: 0=idle, 1=full population, 2=incremental, 3=change tracking, 4=auto, etc.

print()
print("=== Direct CONTAINS tests for specific words ===")
test_words = ['sol', 'kind', 'wasser', 'terra', 'polis', 'logos', 'homo', 'pater', 'mater', 'nox', 'haus']
for word in test_words:
    try:
        cur.execute(
            f"SELECT source, headword, headword_ascii FROM dbo.etymology_entries "
            f"WHERE CONTAINS(([headword],[headword_ascii],[headword_latin],[excerpt]), ?) "
            f"AND source != '__no_match__'",
            (f'"{word}"',)
        )
        rows = cur.fetchall()
        srcs = list(set(r[0] for r in rows))
        print(f"  CONTAINS({word}): sources={srcs}, count={len(rows)}")
    except Exception as e:
        print(f"  CONTAINS({word}): ERROR {e}")

print()
print("=== Direct lookup: headword_ascii = word ===")
for word in ['sol', 'kind', 'wasser', 'terra', 'polis', 'logos', 'homo']:
    cur.execute(
        "SELECT source, headword, headword_ascii FROM dbo.etymology_entries "
        "WHERE headword_ascii = ? AND source != '__no_match__'",
        (word,)
    )
    rows = cur.fetchall()
    print(f"  headword_ascii='{word}': {[(r[0], r[1][:20]) for r in rows]}")

conn.close()
print("DONE")
