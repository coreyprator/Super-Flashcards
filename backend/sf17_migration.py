"""
SF17 migration — REQ-022
Creates flashcards_repair_log, adds is_admin to users, seeds admin.
"""
import os
import sys
import urllib
import pyodbc

SERVER = "35.224.242.223"
DATABASE = "LanguageLearning"
USERNAME = "flashcards_user"
PASSWORD = os.getenv("DB_PASS", "")

if not PASSWORD:
    print("ERROR: DB_PASS env var not set")
    sys.exit(1)

conn_str = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={SERVER},1433;"
    f"DATABASE={DATABASE};"
    f"UID={USERNAME};"
    f"PWD={PASSWORD};"
    f"Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;"
)

conn = pyodbc.connect(conn_str)
cur = conn.cursor()

# ── 1A: flashcards_repair_log
cur.execute("""
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'flashcards_repair_log'
)
BEGIN
    CREATE TABLE LanguageLearning.dbo.flashcards_repair_log (
        id           INT IDENTITY(1,1) PRIMARY KEY,
        flashcard_id UNIQUEIDENTIFIER NOT NULL,
        word_or_phrase NVARCHAR(MAX),
        admin_user   NVARCHAR(255),
        before_json  NVARCHAR(MAX),
        after_json   NVARCHAR(MAX),
        triggered_by NVARCHAR(100),
        created_at   DATETIME2 DEFAULT GETDATE()
    )
    PRINT 'flashcards_repair_log created'
END
ELSE
    PRINT 'flashcards_repair_log already exists'
""")
conn.commit()
print("flashcards_repair_log: OK")

# ── 1B: is_admin column on users
cur.execute("""
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'is_admin'
)
BEGIN
    ALTER TABLE LanguageLearning.dbo.users
        ADD is_admin BIT NOT NULL DEFAULT 0
    PRINT 'is_admin column added'
END
ELSE
    PRINT 'is_admin column already exists'
""")
conn.commit()
print("users.is_admin: OK")

# ── 1C: seed admin users (cprator@cbsware.com, corey.prator@gmail.com)
cur.execute("""
UPDATE LanguageLearning.dbo.users
SET is_admin = 1
WHERE email IN ('cprator@cbsware.com', 'corey.prator@gmail.com')
""")
conn.commit()
print(f"Admin users seeded: {cur.rowcount} row(s)")

cur.close()
conn.close()
print("SF17 migration complete.")
