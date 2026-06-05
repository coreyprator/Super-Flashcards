"""
SF-ETL-FIX-003 Phase 5 / M06: Rebuild FTS index on etymology_entries
Usage: python m06_rebuild_fts.py <db_password>
"""
import pyodbc
import sys
import time

pw = sys.argv[1] if len(sys.argv) > 1 else ""

conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=35.224.242.223,1433;DATABASE=learning;UID=sqlserver;"
    f"PWD={pw};Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;",
    autocommit=True
)
cur = conn.cursor()
print("Connected OK.")

print("[SENTINEL-START: FTS FULL POPULATION]")

# Trigger full FTS population on etymology_entries
print("Triggering ALTER FULLTEXT INDEX ... START FULL POPULATION...")
cur.execute(
    "ALTER FULLTEXT INDEX ON learning.dbo.etymology_entries START FULL POPULATION"
)
print("FTS population started. Polling sys.dm_fts_index_population...")

# Poll until status = 0 (idle) or timeout
timeout_sec = 300
start = time.time()
while True:
    try:
        cur.execute("""
            SELECT database_id, table_id, crawl_state, crawl_end_date,
                   incremental_timestamp, full_text_catalog_id
            FROM sys.dm_fts_index_population
            WHERE table_id = OBJECT_ID('dbo.etymology_entries')
        """)
        rows = cur.fetchall()
    except Exception as e:
        print(f"DMV query error: {e}")
        rows = []
    if not rows:
        print("No active population — FTS index is idle (complete).")
        break
    for row in rows:
        print(f"  crawl_state={row[2]}, crawl_end={row[3]}")
    elapsed = time.time() - start
    if elapsed > timeout_sec:
        print(f"WARNING: Timed out after {timeout_sec}s — FTS may still be populating.")
        break
    time.sleep(5)

# Final check: verify FTS catalog exists and is healthy
cur.execute("""
    SELECT fc.name, fc.is_default, fts.object_id
    FROM sys.fulltext_catalogs fc
    JOIN sys.fulltext_indexes fts ON fc.fulltext_catalog_id = fts.fulltext_catalog_id
    WHERE fts.object_id = OBJECT_ID('dbo.etymology_entries')
""")
rows = cur.fetchall()
for row in rows:
    print(f"FTS catalog={row[0]}, is_default={row[1]}, object_id={row[2]}")

# Quick test: FTS query to verify it responds
cur.execute(
    "SELECT COUNT(*) FROM dbo.etymology_entries "
    "WHERE CONTAINS(headword_ascii, '\"polis\"')"
)
cnt = cur.fetchone()[0]
print(f"Post-rebuild CONTAINS(headword_ascii, 'polis') count: {cnt}")

cur.execute(
    "SELECT COUNT(*) FROM dbo.etymology_entries "
    "WHERE CONTAINS(headword_ascii, '\"tokos\"')"
)
cnt2 = cur.fetchone()[0]
print(f"Post-rebuild CONTAINS(headword_ascii, 'tokos') count: {cnt2}")

conn.close()
print("[SENTINEL-END: FTS FULL POPULATION]")
print("DONE M06")
