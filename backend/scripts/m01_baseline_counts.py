"""M01: Confirm baseline non-ASCII counts in headword_latin per source."""
import pyodbc
import sys

pw = sys.argv[1] if len(sys.argv) > 1 else ""

conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=35.224.242.223,1433;DATABASE=learning;UID=sqlserver;"
    f"PWD={pw};Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;"
)
cur = conn.cursor()

print("=== Non-ASCII in headword_latin per source ===")
cur.execute(
    "SELECT source, COUNT(*) as cnt FROM dbo.etymology_entries "
    "WHERE source IN ('beekes','kroonen','watkins','de-vaan') "
    "AND headword_latin COLLATE Latin1_General_BIN LIKE N'%[^ -~]%' "
    "GROUP BY source ORDER BY source"
)
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

print()
print("=== Non-ASCII in headword_ascii per source ===")
cur.execute(
    "SELECT source, COUNT(*) as cnt FROM dbo.etymology_entries "
    "WHERE source IN ('beekes','kroonen','watkins','de-vaan') "
    "AND headword_ascii COLLATE Latin1_General_BIN LIKE N'%[^ -~]%' "
    "GROUP BY source ORDER BY source"
)
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

print()
print("=== Total rows per source ===")
cur.execute(
    "SELECT source, COUNT(*) as cnt FROM dbo.etymology_entries "
    "WHERE source IN ('beekes','kroonen','watkins','de-vaan') "
    "GROUP BY source ORDER BY source"
)
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
print("DONE M01")
