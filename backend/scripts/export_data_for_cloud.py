# Export SuperFlashcards data to SQL INSERT statements for Cloud SQL deployment
# This script exports all data from local SQL Server to SQL scripts that can be run on Cloud SQL 2019

import pyodbc
import os
from pathlib import Path

# Connection to local SQL Server
conn_str = (
    r"DRIVER={ODBC Driver 17 for SQL Server};"
    r"SERVER=localhost\SQLEXPRESS;"
    r"DATABASE=LanguageLearning;"
    r"Trusted_Connection=yes;"
)

output_dir = Path("C:/Backups/SuperFlashcards/sql_exports")
output_dir.mkdir(exist_ok=True)

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    print("Connected to local SQL Server")
    print("="*60)
    
    # Export Languages
    print("\n[1/2] Exporting languages...")
    cursor.execute("SELECT id, name, code, created_at FROM languages ORDER BY name")
    languages = cursor.fetchall()
    
    with open(output_dir / "01_insert_languages.sql", "w", encoding="utf-8") as f:
        f.write("-- Languages data export\n")
        f.write("-- Total records: {}\n\n".format(len(languages)))
        for row in languages:
            f.write(f"INSERT INTO languages (id, name, code, created_at) VALUES ")
            f.write(f"('{row.id}', N'{row.name}', '{row.code}', '{row.created_at}');\n")
    
    print(f"   ✓ Exported {len(languages)} languages")
    
    # Export Flashcards (in batches for large dataset)
    print("\n[2/2] Exporting flashcards...")
    cursor.execute("SELECT COUNT(*) FROM flashcards")
    total_cards = cursor.fetchone()[0]
    print(f"   Total flashcards to export: {total_cards}")
    
    cursor.execute("""
        SELECT 
            id, language_id, word_or_phrase, definition, etymology, 
            english_cognates, related_words, image_url, image_description,
            audio_url, audio_generated_at, ipa_pronunciation, ipa_audio_url,
            ipa_generated_at, source, times_reviewed, last_reviewed,
            is_synced, local_only, created_at, updated_at
        FROM flashcards 
        ORDER BY created_at
    """)
    
    batch_size = 100
    batch_num = 1
    cards_written = 0
    
    while True:
        rows = cursor.fetchmany(batch_size)
        if not rows:
            break
        
        filename = f"02_insert_flashcards_batch{batch_num:03d}.sql"
        with open(output_dir / filename, "w", encoding="utf-8") as f:
            f.write(f"-- Flashcards batch {batch_num}\n")
            f.write(f"-- Records: {len(rows)}\n\n")
            
            for row in rows:
                # Escape single quotes
                def escape(val):
                    if val is None:
                        return "NULL"
                    if isinstance(val, str):
                        return f"N'{val.replace(chr(39), chr(39)+chr(39))}'"
                    if isinstance(val, bool):
                        return "1" if val else "0"
                    return f"'{val}'"
                
                values = [
                    f"'{row.id}'",
                    f"'{row.language_id}'",
                    escape(row.word_or_phrase),
                    escape(row.definition),
                    escape(row.etymology),
                    escape(row.english_cognates),
                    escape(row.related_words),
                    escape(row.image_url),
                    escape(row.image_description),
                    escape(row.audio_url),
                    escape(row.audio_generated_at),
                    escape(row.ipa_pronunciation),
                    escape(row.ipa_audio_url),
                    escape(row.ipa_generated_at),
                    escape(row.source),
                    str(row.times_reviewed or 0),
                    escape(row.last_reviewed),
                    "1" if row.is_synced else "0",
                    "1" if row.local_only else "0",
                    escape(row.created_at),
                    escape(row.updated_at)
                ]
                
                f.write(f"INSERT INTO flashcards (")
                f.write(f"id, language_id, word_or_phrase, definition, etymology, ")
                f.write(f"english_cognates, related_words, image_url, image_description, ")
                f.write(f"audio_url, audio_generated_at, ipa_pronunciation, ipa_audio_url, ")
                f.write(f"ipa_generated_at, source, times_reviewed, last_reviewed, ")
                f.write(f"is_synced, local_only, created_at, updated_at")
                f.write(f") VALUES ({', '.join(values)});\n")
                
                cards_written += 1
        
        print(f"   ✓ Batch {batch_num}: {len(rows)} cards written")
        batch_num += 1
    
    print(f"\n   ✓ Total flashcards exported: {cards_written}")
    
    print("\n" + "="*60)
    print("✅ Export complete!")
    print(f"\nFiles written to: {output_dir}")
    print("\nNext steps:")
    print("1. Upload SQL files to Cloud Storage")
    print("2. Connect to Cloud SQL")
    print("3. Run schema creation")
    print("4. Run INSERT scripts in order")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
