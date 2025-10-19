import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=35.224.242.223;'
    'DATABASE=LanguageLearning;'
    'UID=flashcards_user;'
    'PWD=ezihRMX6VAaGd97hAuwW;'
    'Encrypt=yes;'
    'TrustServerCertificate=yes'
)

cursor = conn.cursor()

print("\n=== FLASHCARDS COUNT ===")
cursor.execute("SELECT COUNT(*) FROM flashcards")
count = cursor.fetchone()[0]
print(f"Total flashcards: {count}")

print("\n=== FIRST 3 FLASHCARDS ===")
cursor.execute("SELECT TOP 3 word_or_phrase, definition FROM flashcards")
for row in cursor.fetchall():
    print(f"  {row.word_or_phrase}: {row.definition[:80] if row.definition else 'No definition'}...")

conn.close()
