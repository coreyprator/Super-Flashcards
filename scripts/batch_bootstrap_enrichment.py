"""
Batch enrich the newly imported bootstrap vocabulary cards with images and audio.
This script finds cards without images/audio and processes them.
"""
import pyodbc
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Connect to database
conn_str = (
    r'DRIVER={ODBC Driver 17 for SQL Server};'
    r'SERVER=localhost\SQLEXPRESS;'
    r'DATABASE=LanguageLearning;'
    r'Trusted_Connection=yes;'
)
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

print("=" * 80)
print("FINDING CARDS NEEDING ENRICHMENT")
print("=" * 80)

# Find cards without images
cursor.execute("""
    SELECT COUNT(*) 
    FROM flashcards 
    WHERE image_url IS NULL OR image_url = ''
""")
no_image_count = cursor.fetchone()[0]
print(f"\n📸 Cards without images: {no_image_count}")

# Find cards without audio
cursor.execute("""
    SELECT COUNT(*) 
    FROM flashcards 
    WHERE audio_url IS NULL OR audio_url = ''
""")
no_audio_count = cursor.fetchone()[0]
print(f"🔊 Cards without audio: {no_audio_count}")

# Get sample of cards needing enrichment (focus on bootstrap/recent)
cursor.execute("""
    SELECT TOP 10
        f.id,
        f.word_or_phrase,
        l.name as language,
        f.source,
        CASE WHEN f.image_url IS NULL OR f.image_url = '' THEN 'NO' ELSE 'YES' END as has_image,
        CASE WHEN f.audio_url IS NULL OR f.audio_url = '' THEN 'NO' ELSE 'YES' END as has_audio,
        f.created_at
    FROM flashcards f
    JOIN languages l ON f.language_id = l.id
    WHERE (f.image_url IS NULL OR f.image_url = '') 
       OR (f.audio_url IS NULL OR f.audio_url = '')
    ORDER BY f.created_at DESC
""")

print("\n" + "=" * 80)
print("SAMPLE OF CARDS NEEDING ENRICHMENT (most recent 10):")
print("=" * 80)
print(f"{'Word/Phrase':<30} {'Language':<10} {'Image':<6} {'Audio':<6} {'Source':<15} {'Created'}")
print("-" * 80)
for row in cursor.fetchall():
    word = row[1][:28] if len(row[1]) > 28 else row[1]
    print(f"{word:<30} {row[2]:<10} {row[4]:<6} {row[5]:<6} {row[3]:<15} {row[6]}")

conn.close()

print("\n" + "=" * 80)
print("READY TO PROCESS")
print("=" * 80)
print(f"\nWould process:")
print(f"  - {no_image_count} cards needing images")
print(f"  - {no_audio_count} cards needing audio")
print(f"\nTotal cards to enrich: {max(no_image_count, no_audio_count)}")
print(f"\nTo run batch processing, use the batch processing endpoints:")
print(f"  - POST http://localhost:8000/api/batch/images")
print(f"  - POST http://localhost:8000/api/batch/audio")
