import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=localhost\\SQLEXPRESS;'
    'DATABASE=LanguageLearning;'
    'Trusted_Connection=yes;'
)

cursor = conn.cursor()

# Count French cards
cursor.execute("SELECT COUNT(*) FROM flashcards WHERE language_id = ?", '9E4D5CA8-FFEC-47B9-9943-5F2DD1093593')
french_count = cursor.fetchone()[0]
print(f"✅ Total French cards in DB: {french_count}")

# Count Greek cards  
cursor.execute("SELECT COUNT(*) FROM flashcards WHERE language_id = ?", '21D23A9E-4EF7-4D53-AD17-371D164D0F0F')
greek_count = cursor.fetchone()[0]
print(f"✅ Total Greek cards in DB: {greek_count}")

# Get sample of what API would return (limited to 100 like the default)
cursor.execute("""
    SELECT TOP 100 id, word_or_phrase, language_id 
    FROM flashcards 
    WHERE language_id = ?
    ORDER BY created_at DESC
""", '9E4D5CA8-FFEC-47B9-9943-5F2DD1093593')

results = cursor.fetchall()
print(f"\n📊 API would return (with limit=100): {len(results)} French cards")
print(f"Sample cards:")
for i, row in enumerate(results[:5]):
    print(f"  {i+1}. {row.word_or_phrase}")

conn.close()
