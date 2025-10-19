import pyodbc
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Connect directly to database
conn_str = (
    r'DRIVER={ODBC Driver 17 for SQL Server};'
    r'SERVER=localhost\SQLEXPRESS;'
    r'DATABASE=LanguageLearning;'
    r'Trusted_Connection=yes;'
)
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

print("=" * 80)
print("DATABASE CONTENTS:")
print("=" * 80)

# Get language counts
cursor.execute("""
    SELECT l.name, l.id, COUNT(f.id) as card_count
    FROM languages l
    LEFT JOIN flashcards f ON l.id = f.language_id
    GROUP BY l.name, l.id
    ORDER BY l.name
""")
print("\nFlashcard counts by language:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[2]} cards (language_id: {row[1]})")

# Check for NULL values in key fields
cursor.execute("""
    SELECT COUNT(*) as null_times_reviewed
    FROM flashcards
    WHERE times_reviewed IS NULL
""")
null_count = cursor.fetchone()[0]
print(f"\nFlashcards with NULL times_reviewed: {null_count}")

cursor.execute("""
    SELECT COUNT(*) as null_last_reviewed
    FROM flashcards
    WHERE last_reviewed IS NULL
""")
null_count = cursor.fetchone()[0]
print(f"Flashcards with NULL last_reviewed: {null_count}")

cursor.execute("""
    SELECT COUNT(*) as null_user_id
    FROM flashcards
    WHERE user_id IS NULL
""")
null_count = cursor.fetchone()[0]
print(f"Flashcards with NULL user_id: {null_count}")

# Check for other potential issues
cursor.execute("""
    SELECT COUNT(*) as total,
           SUM(CASE WHEN is_synced IS NULL THEN 1 ELSE 0 END) as null_is_synced,
           SUM(CASE WHEN local_only IS NULL THEN 1 ELSE 0 END) as null_local_only
    FROM flashcards
""")
row = cursor.fetchone()
print(f"\nFlashcards with NULL is_synced: {row[1]}")
print(f"Flashcards with NULL local_only: {row[2]}")

# Show sample of recent cards
print("\n" + "=" * 80)
print("MOST RECENT 10 FLASHCARDS:")
print("=" * 80)
cursor.execute("""
    SELECT TOP 10 
        f.word_or_phrase,
        l.name as language,
        f.times_reviewed,
        f.is_synced,
        f.local_only,
        f.created_at
    FROM flashcards f
    JOIN languages l ON f.language_id = l.id
    ORDER BY f.created_at DESC
""")
for row in cursor.fetchall():
    print(f"  {row[0][:30]:30s} | {row[1]:10s} | times_reviewed: {row[2]} | synced: {row[3]} | local: {row[4]} | {row[5]}")

conn.close()

print("\n" + "=" * 80)
print("Now testing SQLAlchemy query (same as API uses):")
print("=" * 80)

from app.database import SessionLocal
from app import models

db = SessionLocal()
try:
    # Same query the API uses
    query = db.query(models.Flashcard).order_by(models.Flashcard.created_at.desc()).limit(100)
    flashcards = query.all()
    
    print(f"\nSQLAlchemy returned {len(flashcards)} flashcards")
    
    # Count by language
    from collections import Counter
    lang_counts = Counter()
    for f in flashcards:
        try:
            lang_counts[f.language.name] += 1
        except Exception as e:
            print(f"Error accessing language for flashcard {f.id}: {e}")
    
    print("\nFlashcards by language (from SQLAlchemy):")
    for lang, count in lang_counts.items():
        print(f"  {lang}: {count} cards")
    
    print("\nFirst 5 flashcards from SQLAlchemy:")
    for f in flashcards[:5]:
        try:
            print(f"  {f.word_or_phrase[:30]:30s} | {f.language.name:10s} | times_reviewed: {f.times_reviewed}")
        except Exception as e:
            print(f"  Error displaying flashcard {f.id}: {e}")
            
finally:
    db.close()
