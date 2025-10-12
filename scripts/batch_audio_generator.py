# backend/scripts/batch_audio_generator.py
"""
Batch generate audio for all flashcards
Similar to batch_processor.py pattern
"""
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.services.audio_service import AudioService
from datetime import datetime
import time
import json

def batch_generate_audio():
    """
    Process all flashcards without audio and generate TTS
    """
    
    db = SessionLocal()
    audio_service = AudioService()
    
    try:
        # Get all cards without audio
        cards_without_audio = db.query(models.Flashcard).filter(
            models.Flashcard.audio_url == None
        ).all()
        
        total_cards = len(cards_without_audio)
        
        print("=" * 70)
        print(f"🔊 BATCH AUDIO GENERATION")
        print("=" * 70)
        print(f"Total cards to process: {total_cards}")
        print()
        
        if total_cards == 0:
            print("✅ All flashcards already have audio!")
            return
        
        start_time = time.time()
        processed = 0
        succeeded = 0
        failed = 0
        errors = []
        
        for i, card in enumerate(cards_without_audio, 1):
            try:
                # Get language
                language = db.query(models.Language).filter(
                    models.Language.id == card.language_id
                ).first()
                
                if not language:
                    print(f"[{i}/{total_cards}] ✗ {card.word_or_phrase} - No language found")
                    failed += 1
                    errors.append(f"{card.word_or_phrase}: No language found")
                    continue
                
                print(f"[{i}/{total_cards}] Processing: {card.word_or_phrase} ({language.name})")
                
                # Generate audio
                success, audio_path, error_msg = audio_service.generate_word_audio(
                    word=card.word_or_phrase,
                    language_name=language.name,
                    flashcard_id=str(card.id)
                )
                
                if success:
                    # Update database
                    card.audio_url = audio_path
                    card.audio_generated_at = datetime.utcnow()
                    db.commit()
                    
                    succeeded += 1
                    print(f"  ✓ Audio generated: {audio_path}")
                else:
                    failed += 1
                    error_entry = f"{card.word_or_phrase}: {error_msg}"
                    errors.append(error_entry)
                    print(f"  ✗ Failed: {error_msg}")
                
            except Exception as e:
                failed += 1
                error_entry = f"{card.word_or_phrase}: {str(e)}"
                errors.append(error_entry)
                print(f"  ✗ Error: {e}")
                db.rollback()
            
            processed += 1
            
            # Progress update every 10 cards
            if processed % 10 == 0:
                elapsed = time.time() - start_time
                avg_time = elapsed / processed
                remaining = total_cards - processed
                eta_seconds = avg_time * remaining
                eta_minutes = eta_seconds / 60
                
                print()
                print(f"📊 Progress: {processed}/{total_cards} ({processed/total_cards*100:.1f}%)")
                print(f"   Succeeded: {succeeded}, Failed: {failed}")
                print(f"   Avg time: {avg_time:.1f}s per card")
                print(f"   ETA: {eta_minutes:.1f} minutes")
                print()
        
        # Final summary
        total_time = time.time() - start_time
        print()
        print("=" * 70)
        print("🎉 BATCH AUDIO GENERATION COMPLETE")
        print("=" * 70)
        print(f"Total processed: {processed}")
        print(f"Succeeded: {succeeded}")
        print(f"Failed: {failed}")
        print(f"Success rate: {(succeeded/processed*100):.1f}%")
        print(f"Total time: {total_time/60:.1f} minutes")
        print(f"Average: {total_time/processed:.1f} seconds per card")
        print()
        
        if errors:
            print(f"❌ Errors ({len(errors)}):")
            for error in errors[:20]:  # Show first 20 errors
                print(f"  - {error}")
            if len(errors) > 20:
                print(f"  ... and {len(errors) - 20} more")
            print()
        
        # Save results
        results = {
            'timestamp': datetime.now().isoformat(),
            'total_processed': processed,
            'succeeded': succeeded,
            'failed': failed,
            'success_rate': round(succeeded/processed*100, 1) if processed > 0 else 0,
            'total_time_seconds': round(total_time, 1),
            'avg_time_per_card': round(total_time/processed, 1) if processed > 0 else 0,
            'errors': errors
        }
        
        output_dir = Path(__file__).parent.parent.parent / "Output"
        output_dir.mkdir(exist_ok=True)
        
        output_file = output_dir / "batch_audio_results.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Results saved to: {output_file}")
        
        # Audio statistics
        storage_stats = audio_service.get_audio_stats()
        print()
        print("📁 Audio Storage:")
        print(f"   Total files: {storage_stats['total_files']}")
        print(f"   Total size: {storage_stats['total_size_mb']} MB")
        print(f"   Directory: {storage_stats['audio_directory']}")
        
    finally:
        db.close()


if __name__ == '__main__':
    print("\n🎵 Starting batch audio generation...")
    print("Press Ctrl+C to cancel\n")
    
    try:
        batch_generate_audio()
        print("\n✅ Done!")
    except KeyboardInterrupt:
        print("\n\n⚠️  Cancelled by user")
        print("You can run this script again to resume - it only processes cards without audio")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
