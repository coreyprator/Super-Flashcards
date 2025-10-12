# backend/scripts/test_audio_single.py
"""
Test audio generation for a single flashcard
Use this to verify TTS is working before batch processing
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app import models
from app.services.audio_service import AudioService

def test_single_audio():
    """
    Test audio generation for the first flashcard
    """
    
    db = SessionLocal()
    audio_service = AudioService()
    
    try:
        print("=" * 60)
        print("🔊 TESTING SINGLE AUDIO GENERATION")
        print("=" * 60)
        print()
        
        # Get first flashcard
        card = db.query(models.Flashcard).first()
        
        if not card:
            print("❌ No flashcards found in database")
            print("Run batch_processor.py first to create flashcards")
            return
        
        # Get language
        language = db.query(models.Language).filter(
            models.Language.id == card.language_id
        ).first()
        
        print(f"Testing with flashcard:")
        print(f"  Word: {card.word}")
        print(f"  Language: {language.name}")
        print(f"  ID: {card.id}")
        print()
        
        # Generate audio
        print("Generating audio...")
        success, audio_path, error_msg = audio_service.generate_word_audio(
            word=card.word,
            language_name=language.name,
            flashcard_id=str(card.id)
        )
        
        if success:
            print(f"✅ SUCCESS!")
            print(f"   Audio saved to: {audio_path}")
            print()
            
            # Check file exists
            audio_dir = Path(__file__).parent.parent.parent / "audio"
            filename = Path(audio_path).name
            full_path = audio_dir / filename
            
            if full_path.exists():
                file_size = full_path.stat().st_size
                print(f"   File size: {file_size} bytes ({file_size/1024:.1f} KB)")
                print(f"   Full path: {full_path}")
            else:
                print(f"   ⚠️  Warning: File not found at {full_path}")
            
            print()
            print("To test in browser:")
            print(f"1. Start server: .\\runui.ps1")
            print(f"2. Open: http://localhost:8000{audio_path}")
            print()
            
            # Update database
            from datetime import datetime
            card.audio_url = audio_path
            card.audio_generated_at = datetime.utcnow()
            db.commit()
            print("✓ Database updated")
            
        else:
            print(f"❌ FAILED!")
            print(f"   Error: {error_msg}")
        
        print()
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == '__main__':
    test_single_audio()
