# scripts/init_db.py
"""
Initialize the MS SQL database with default languages
Run this once after creating the database
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app import models, crud, schemas

def init_db():
    # Create tables
    print("Creating database tables...")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("✓ Tables created successfully")
    except Exception as e:
        print(f"Error creating tables: {e}")
        print("\nMake sure:")
        print("1. SQL Server is running")
        print("2. Database 'LanguageLearning' exists")
        print("3. ODBC Driver 17 for SQL Server is installed")
        return
    
    # Create session
    db = SessionLocal()
    
    # Default languages
    default_languages = [
        {"name": "English", "code": "en"},
        {"name": "French", "code": "fr"},
        {"name": "Greek", "code": "el"},
        {"name": "Spanish", "code": "es"},
        {"name": "German", "code": "de"},
        {"name": "Italian", "code": "it"},
        {"name": "Portuguese", "code": "pt"},
        {"name": "Japanese", "code": "ja"},
        {"name": "Mandarin Chinese", "code": "zh"},
    ]
    
    print("\nAdding default languages...")
    for lang_data in default_languages:
        # Check if language already exists
        existing = crud.get_language_by_code(db, lang_data["code"])
        if not existing:
            language = schemas.LanguageCreate(**lang_data)
            created = crud.create_language(db, language)
            print(f"✓ Added {created.name} ({created.code})")
        else:
            print(f"- {existing.name} already exists")
    
    # Create default user
    print("\nCreating default user...")
    existing_user = db.query(models.User).filter(models.User.username == "default_user").first()
    if not existing_user:
        default_user = models.User(
            username="default_user",
            preferred_instruction_language="en"
        )
        db.add(default_user)
        db.commit()
        print("✓ Created default user")
    else:
        print("- Default user already exists")
    
    db.close()
    print("\n✓ Database initialization complete!")
    print("\nNext steps:")
    print("1. Run: uvicorn app.main:app --reload")
    print("2. Open: http://localhost:8000")
    print("3. Start adding flashcards!")

if __name__ == "__main__":
    init_db()