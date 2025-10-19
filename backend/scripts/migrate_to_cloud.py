# Migrate data from local SQL Server to Cloud SQL using SQLAlchemy
# This script connects to both databases and copies all data

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import urllib

print("="*70)
print("SuperFlashcards Cloud Migration Script")
print("="*70)

# Get cloud password
cloud_password = input("\nEnter Cloud SQL password: ")

print("\n[1/4] Connecting to LOCAL SQL Server...")
# Local connection
local_driver = "ODBC Driver 17 for SQL Server"
local_server = "localhost\\SQLEXPRESS"
local_database = "LanguageLearning"

local_conn_str = (
    f"DRIVER={{{local_driver}}};"
    f"SERVER={local_server};"
    f"DATABASE={local_database};"
    f"Trusted_Connection=yes;"
)
local_params = urllib.parse.quote_plus(local_conn_str)
local_url = f"mssql+pyodbc:///?odbc_connect={local_params}"

local_engine = create_engine(local_url, echo=False)
LocalSession = sessionmaker(bind=local_engine)
local_session = LocalSession()

print("   ✓ Connected to local database")

print("\n[2/4] Connecting to CLOUD SQL Server...")
# Cloud connection
cloud_instance = "35.224.242.223"  # Public IP from Cloud SQL
cloud_user = "sqlserver"  # Default admin user
cloud_database = "LanguageLearning"

cloud_url = (
    f"mssql+pyodbc://{cloud_user}:{cloud_password}@{cloud_instance}:1433/"
    f"{cloud_database}?driver=ODBC+Driver+17+for+SQL+Server"
)

cloud_engine = create_engine(cloud_url, echo=False)
CloudSession = sessionmaker(bind=cloud_engine)
cloud_session = CloudSession()

print("   ✓ Connected to cloud database")

print("\n[3/4] Creating tables in cloud database...")
# Import models to create tables
from app.models import Base, Language, Flashcard

# Create all tables
Base.metadata.create_all(cloud_engine)
print("   ✓ Tables created")

print("\n[4/4] Copying data...")

# Copy Languages
print("\n   [a] Copying languages...")
local_languages = local_session.execute("SELECT id, name, code, created_at FROM languages").fetchall()
for row in local_languages:
    cloud_session.execute(
        "INSERT INTO languages (id, name, code, created_at) VALUES (?, ?, ?, ?)",
        (row.id, row.name, row.code, row.created_at)
    )
cloud_session.commit()
print(f"      ✓ Copied {len(local_languages)} languages")

# Copy Flashcards
print("\n   [b] Copying flashcards...")
local_flashcards = local_session.execute("SELECT COUNT(*) FROM flashcards").fetchone()[0]
print(f"      Total flashcards: {local_flashcards}")

batch_size = 100
offset = 0
total_copied = 0

while True:
    rows = local_session.execute(f"""
        SELECT 
            id, language_id, word_or_phrase, definition, etymology, 
            english_cognates, related_words, image_url, image_description,
            audio_url, audio_generated_at, ipa_pronunciation, ipa_audio_url,
            ipa_generated_at, source, times_reviewed, last_reviewed,
            is_synced, local_only, created_at, updated_at
        FROM flashcards 
        ORDER BY created_at
        OFFSET {offset} ROWS FETCH NEXT {batch_size} ROWS ONLY
    """).fetchall()
    
    if not rows:
        break
    
    for row in rows:
        cloud_session.execute("""
            INSERT INTO flashcards (
                id, language_id, word_or_phrase, definition, etymology, 
                english_cognates, related_words, image_url, image_description,
                audio_url, audio_generated_at, ipa_pronunciation, ipa_audio_url,
                ipa_generated_at, source, times_reviewed, last_reviewed,
                is_synced, local_only, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, tuple(row))
    
    cloud_session.commit()
    total_copied += len(rows)
    print(f"      ✓ Batch: {total_copied}/{local_flashcards} cards copied")
    offset += batch_size

print(f"\n      ✓ Total flashcards copied: {total_copied}")

# Verify
cloud_language_count = cloud_session.execute("SELECT COUNT(*) FROM languages").fetchone()[0]
cloud_flashcard_count = cloud_session.execute("SELECT COUNT(*) FROM flashcards").fetchone()[0]

print("\n" + "="*70)
print("✅ MIGRATION COMPLETE!")
print("="*70)
print(f"\nLocal  → Cloud")
print(f"Languages:  {len(local_languages)} → {cloud_language_count}")
print(f"Flashcards: {local_flashcards} → {cloud_flashcard_count}")

if cloud_language_count == len(local_languages) and cloud_flashcard_count == local_flashcards:
    print("\n✅ All data migrated successfully!")
else:
    print("\n⚠️  Warning: Record counts don't match!")

local_session.close()
cloud_session.close()

print("\nNext: Deploy application to Cloud Run")
