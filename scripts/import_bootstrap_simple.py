"""
Simple Bootstrap Import Script
Imports curated vocabulary directly via database connection
No backend imports to avoid conflicts

Usage:
    python import_bootstrap_simple.py [json_file_path]
    
Example:
    python import_bootstrap_simple.py Input/bootstrap_vocabulary.json
    python import_bootstrap_simple.py Input/bootstrap_vocabulary2.json
"""

import json
import pyodbc
from datetime import datetime
import uuid
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database connection string
# Update this to match your database configuration
CONNECTION_STRING = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost\\SQLEXPRESS;"
    "DATABASE=LanguageLearning;"
    "Trusted_Connection=yes;"
)

def get_language_map(conn):
    """Get mapping of language codes to IDs"""
    cursor = conn.cursor()
    cursor.execute("SELECT id, code, name FROM languages")
    
    lang_map = {}
    for row in cursor.fetchall():
        lang_map[row.code] = {
            'id': str(row.id),
            'name': row.name
        }
        logger.info(f"📚 Found language: {row.name} ({row.code}) -> {row.id}")
    
    return lang_map

def check_duplicate(conn, word, language_id):
    """Check if flashcard already exists"""
    cursor = conn.cursor()
    cursor.execute(
        "SELECT COUNT(*) FROM flashcards WHERE word_or_phrase = ? AND language_id = ?",
        (word, language_id)
    )
    count = cursor.fetchone()[0]
    return count > 0

def import_flashcard(conn, card_data, lang_map):
    """Import a single flashcard"""
    word = card_data['word_or_phrase']
    definition = card_data['definition']
    etymology = card_data.get('etymology', '')
    language_code = card_data['language_code']
    
    # Get language ID
    if language_code not in lang_map:
        logger.error(f"❌ Unknown language code: {language_code}")
        return False
    
    language_id = lang_map[language_code]['id']
    
    # Check for duplicates
    if check_duplicate(conn, word, language_id):
        logger.info(f"⏭️  Skipping duplicate: {word}")
        return 'duplicate'
    
    # Create flashcard
    try:
        flashcard_id = str(uuid.uuid4())
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO flashcards (
                id, word_or_phrase, definition, etymology, 
                language_id, source, is_synced, local_only,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
        """, (
            flashcard_id, word, definition, etymology,
            language_id, 'bootstrap', 0, 0
        ))
        conn.commit()
        
        logger.info(f"✅ Imported: {word}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error importing {word}: {str(e)}")
        conn.rollback()
        return False

def main():
    """Main import function"""
    logger.info("=" * 70)
    logger.info("🚀 BOOTSTRAP IMPORT STARTING")
    logger.info("=" * 70)
    
    # Get JSON file path from command line or use default
    if len(sys.argv) > 1:
        json_path = sys.argv[1]
    else:
        json_path = 'Input/bootstrap_vocabulary.json'
    
    logger.info(f"📂 Loading: {json_path}")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    flashcards = data['flashcards']
    logger.info(f"✅ Loaded {len(flashcards)} flashcards\n")
    
    # Connect to database
    logger.info("🔌 Connecting to database...")
    try:
        conn = pyodbc.connect(CONNECTION_STRING)
        logger.info("✅ Database connected\n")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        return
    
    try:
        # Get language mappings
        lang_map = get_language_map(conn)
        logger.info("")
        
        # Import stats
        stats = {
            'total': len(flashcards),
            'created': 0,
            'duplicates': 0,
            'errors': 0
        }
        
        # Import each card
        logger.info(f"📊 Processing {len(flashcards)} flashcards...\n")
        
        for i, card_data in enumerate(flashcards, 1):
            logger.info(f"--- Card {i}/{len(flashcards)} ---")
            result = import_flashcard(conn, card_data, lang_map)
            
            if result == True:
                stats['created'] += 1
            elif result == 'duplicate':
                stats['duplicates'] += 1
            else:
                stats['errors'] += 1
        
        # Print summary
        logger.info("\n" + "=" * 70)
        logger.info("📈 IMPORT SUMMARY")
        logger.info("=" * 70)
        logger.info(f"Total cards processed: {stats['total']}")
        logger.info(f"✅ Successfully created: {stats['created']}")
        logger.info(f"⏭️  Skipped (duplicates): {stats['duplicates']}")
        logger.info(f"❌ Errors: {stats['errors']}")
        logger.info("=" * 70)
        logger.info("✨ IMPORT COMPLETE!")
        logger.info("=" * 70)
        
    finally:
        conn.close()
        logger.info("\n🔌 Database connection closed")

if __name__ == '__main__':
    main()
