#!/usr/bin/env python3
"""
Script to fix broken image URLs in the database
Run this when you have flashcards with expired DALL-E URLs
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app import models
from app.routers.ai_generate import generate_image

def fix_broken_images():
    """Fix flashcards with expired DALL-E URLs"""
    db = SessionLocal()
    
    try:
        # Find flashcards with broken DALL-E URLs
        flashcards = db.query(models.Flashcard).filter(
            models.Flashcard.image_url.like('%oaidalleapiprodscus.blob.core.windows.net%')
        ).all()
        
        print(f"Found {len(flashcards)} flashcards with broken DALL-E URLs")
        
        for flashcard in flashcards:
            print(f"\nFixing: {flashcard.word_or_phrase}")
            print(f"Current URL: {flashcard.image_url}")
            
            if flashcard.image_description:
                # Regenerate image
                new_image_url = generate_image(flashcard.image_description, flashcard.word_or_phrase)
                
                if new_image_url:
                    # Update the flashcard
                    flashcard.image_url = new_image_url
                    db.commit()
                    print(f"✅ Fixed! New URL: {new_image_url}")
                else:
                    print("❌ Failed to generate new image")
            else:
                print("⚠️  No image description available - cannot regenerate")
        
        print(f"\n✅ Completed processing {len(flashcards)} flashcards")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_broken_images()