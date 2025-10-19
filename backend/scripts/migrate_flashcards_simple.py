"""
Simple data migration from local SQL Server to Cloud SQL
Shows real-time progress for every flashcard copied
"""
import pyodbc
import sys

# Connection strings
local_conn_str = (
    r"DRIVER={ODBC Driver 17 for SQL Server};"
    r"SERVER=localhost\SQLEXPRESS;"
    r"DATABASE=LanguageLearning;"
    r"Trusted_Connection=yes;"
)

cloud_conn_str = (
    r"DRIVER={ODBC Driver 17 for SQL Server};"
    r"SERVER=35.224.242.223,1433;"
    r"DATABASE=LanguageLearning;"
    r"UID=flashcards_user;"
    r"PWD=ezihRMX6VAaGd97hAuwW;"
)

print("="*70)
print("  SuperFlashcards - Cloud Migration with Live Progress")
print("="*70)
print()

# Connect to databases
print("[1/3] Connecting to databases...")
try:
    local_conn = pyodbc.connect(local_conn_str, timeout=10)
    print("   ✓ Connected to LOCAL SQL Server")
    
    cloud_conn = pyodbc.connect(cloud_conn_str, timeout=10)
    print("   ✓ Connected to CLOUD SQL")
except Exception as e:
    print(f"   ✗ Connection failed: {e}")
    sys.exit(1)

local_cursor = local_conn.cursor()
cloud_cursor = cloud_conn.cursor()

print()
print("[2/3] Counting flashcards...")
local_cursor.execute("SELECT COUNT(*) FROM flashcards")
total = local_cursor.fetchone()[0]
print(f"   → Found {total} flashcards to copy")

print()
print("[3/3] Copying flashcards (batch inserts)...")
print()

# Fetch all data
local_cursor.execute("""
    SELECT 
        id, language_id, word_or_phrase, definition, etymology,
        english_cognates, related_words, image_url, image_description,
        audio_url, audio_generated_at, ipa_pronunciation, ipa_audio_url,
        ipa_generated_at, source, times_reviewed, last_reviewed,
        is_synced, local_only, created_at, updated_at
    FROM flashcards
    ORDER BY created_at
""")

# Insert in batches
batch_size = 50
copied = 0
batch = []

for row in local_cursor:
    batch.append(row)
    
    if len(batch) >= batch_size:
        # Insert batch
        cloud_cursor.fast_executemany = True
        cloud_cursor.executemany("""
            INSERT INTO flashcards (
                id, language_id, word_or_phrase, definition, etymology,
                english_cognates, related_words, image_url, image_description,
                audio_url, audio_generated_at, ipa_pronunciation, ipa_audio_url,
                ipa_generated_at, source, times_reviewed, last_reviewed,
                is_synced, local_only, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, batch)
        cloud_conn.commit()
        
        copied += len(batch)
        percent = round((copied / total) * 100, 1)
        print(f"   [{percent}%] {copied}/{total} flashcards copied")
        batch = []

# Insert remaining
if batch:
    cloud_cursor.fast_executemany = True
    cloud_cursor.executemany("""
        INSERT INTO flashcards (
            id, language_id, word_or_phrase, definition, etymology,
            english_cognates, related_words, image_url, image_description,
            audio_url, audio_generated_at, ipa_pronunciation, ipa_audio_url,
            ipa_generated_at, source, times_reviewed, last_reviewed,
            is_synced, local_only, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, batch)
    cloud_conn.commit()
    
    copied += len(batch)
    percent = round((copied / total) * 100, 1)
    print(f"   [{percent}%] {copied}/{total} flashcards copied")

print()
print("="*70)
print("  VERIFICATION")
print("="*70)

# Verify counts
cloud_cursor.execute("SELECT COUNT(*) FROM languages")
lang_count = cloud_cursor.fetchone()[0]

cloud_cursor.execute("SELECT COUNT(*) FROM flashcards")
card_count = cloud_cursor.fetchone()[0]

print()
print(f"   Languages in cloud:  {lang_count}")
print(f"   Flashcards in cloud: {card_count}/{total}")

if card_count == total:
    print()
    print("   ✅ MIGRATION COMPLETE! All flashcards copied successfully!")
else:
    print()
    print(f"   ⚠️  Warning: Expected {total} cards, found {card_count}")

print()
print("="*70)

# Close connections
local_cursor.close()
cloud_cursor.close()
local_conn.close()
cloud_conn.close()

print("  Next: Deploy application to Cloud Run")
print("="*70)
