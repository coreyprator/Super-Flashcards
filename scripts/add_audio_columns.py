#!/usr/bin/env python3
"""
Add audio columns to flashcards table using SQLAlchemy
This is an alternative to running the SQL migration directly
"""
import sys
from pathlib import Path

# Add backend directory to path
backend_path = str(Path(__file__).parent.parent / "backend")
sys.path.append(backend_path)

from sqlalchemy import text
from app.database import engine

def add_audio_columns():
    """Add audio columns to the flashcards table"""
    
    print("🎵 Adding audio columns to flashcards table...")
    
    try:
        with engine.connect() as connection:
            # Check if columns already exist
            check_audio_url = text("""
                SELECT COUNT(*) as count FROM sys.columns 
                WHERE object_id = OBJECT_ID('dbo.flashcards') 
                AND name = 'audio_url'
            """)
            
            result = connection.execute(check_audio_url)
            audio_url_exists = result.fetchone()[0] > 0
            
            check_audio_generated_at = text("""
                SELECT COUNT(*) as count FROM sys.columns 
                WHERE object_id = OBJECT_ID('dbo.flashcards') 
                AND name = 'audio_generated_at'
            """)
            
            result = connection.execute(check_audio_generated_at)
            audio_generated_at_exists = result.fetchone()[0] > 0
            
            # Add audio_url column if it doesn't exist
            if not audio_url_exists:
                print("  ➕ Adding audio_url column...")
                add_audio_url_sql = text("""
                    ALTER TABLE dbo.flashcards
                    ADD audio_url NVARCHAR(500) NULL
                """)
                connection.execute(add_audio_url_sql)
                print("  ✅ audio_url column added successfully")
            else:
                print("  ℹ️ audio_url column already exists")
            
            # Add audio_generated_at column if it doesn't exist
            if not audio_generated_at_exists:
                print("  ➕ Adding audio_generated_at column...")
                add_audio_generated_at_sql = text("""
                    ALTER TABLE dbo.flashcards
                    ADD audio_generated_at DATETIME2 NULL
                """)
                connection.execute(add_audio_generated_at_sql)
                print("  ✅ audio_generated_at column added successfully")
            else:
                print("  ℹ️ audio_generated_at column already exists")
            
            # Create index for better performance
            if not audio_url_exists:
                print("  📊 Creating index on audio_url...")
                create_index_sql = text("""
                    CREATE NONCLUSTERED INDEX IX_flashcards_audio_url 
                    ON dbo.flashcards (audio_url)
                    WHERE audio_url IS NOT NULL
                """)
                connection.execute(create_index_sql)
                print("  ✅ Index created successfully")
            
            connection.commit()
            print("\n🎉 Audio columns migration completed successfully!")
            
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = add_audio_columns()
    if success:
        print("\n✅ Ready to test audio functionality!")
        print("Run: python scripts/test_audio_single.py")
    else:
        print("\n❌ Migration failed. Check the error messages above.")
    
    sys.exit(0 if success else 1)