"""
Bootstrap Content Import Script
Imports curated vocabulary with automatic image and audio generation

Usage:
    python scripts/import_bootstrap.py                    # Full import with media
    python scripts/import_bootstrap.py --no-media         # Import without media
    python scripts/import_bootstrap.py --max-cards 10     # Test with 10 cards
"""

import json
import sys
import os
import asyncio
import requests
from pathlib import Path
from sqlalchemy.orm import Session
from datetime import datetime
import logging
import time

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from backend.app.database import SessionLocal
from backend.app.models import Flashcard, Language

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BootstrapImporter:
    def __init__(self, db: Session):
        self.db = db
        self.stats = {
            'total': 0,
            'created': 0,
            'skipped_duplicates': 0,
            'with_images': 0,
            'with_audio': 0,
            'errors': []
        }
        
        # Get language mappings
        self.language_map = {}
        languages = db.query(Language).all()
        for lang in languages:
            self.language_map[lang.code] = lang.id
            logger.info(f"📚 Found language: {lang.name} ({lang.code}) -> {lang.id}")
    
    def load_bootstrap_data(self, json_path: str) -> dict:
        """Load the bootstrap JSON file."""
        logger.info(f"📂 Loading bootstrap data from: {json_path}")
        
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.info(f"✅ Loaded {len(data['flashcards'])} flashcards")
        return data
    
    async def generate_image(self, flashcard_id: str, word: str, definition: str) -> str:
        """Generate image for a flashcard using AI generate endpoint."""
        try:
            logger.info(f"🎨 Generating image for: {word}")
            
            # Call the AI image generation endpoint
            url = f"http://localhost:8000/api/ai/generate-image/{flashcard_id}"
            
            response = requests.post(url, timeout=120)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('image_url'):
                    logger.info(f"✅ Image generated: {result['image_url']}")
                    return result['image_url']
            
            logger.warning(f"⚠️  Image generation failed: {response.status_code}")
            return None
                
        except Exception as e:
            logger.error(f"❌ Image generation error for {word}: {str(e)}")
            return None
    
    async def generate_audio(self, flashcard_id: str, word: str) -> str:
        """Generate audio for a flashcard using the audio endpoint."""
        try:
            logger.info(f"🔊 Generating audio for: {word}")
            
            # Call the audio generation endpoint
            url = f"http://localhost:8000/api/audio/generate/{flashcard_id}"
            
            response = requests.post(url, timeout=120)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('audio_url'):
                    logger.info(f"✅ Audio generated: {result['audio_url']}")
                    return result['audio_url']
            
            logger.warning(f"⚠️  Audio generation failed: {response.status_code}")
            return None
                
        except Exception as e:
            logger.error(f"❌ Audio generation error for {word}: {str(e)}")
            return None
    
    async def import_flashcard(self, card_data: dict, generate_media: bool = True) -> bool:
        """Import a single flashcard with optional media generation."""
        
        word = card_data['word_or_phrase']
        definition = card_data['definition']
        language_code = card_data['language_code']
        
        # Get language ID
        language_id = self.language_map.get(language_code)
        if not language_id:
            logger.error(f"❌ Unknown language code: {language_code}")
            self.stats['errors'].append(f"Unknown language: {language_code} for word: {word}")
            return False
        
        try:
            # Check for duplicates
            existing = self.db.query(Flashcard).filter(
                Flashcard.word_or_phrase == word,
                Flashcard.language_id == language_id
            ).first()
            
            if existing:
                logger.info(f"⏭️  Skipping duplicate: {word}")
                self.stats['skipped_duplicates'] += 1
                return True
            
            # Create flashcard
            flashcard = Flashcard(
                word_or_phrase=word,
                definition=definition,
                etymology=card_data.get('etymology', ''),
                language_id=language_id,
                source='bootstrap',
                is_synced=False,
                local_only=False
            )
            
            self.db.add(flashcard)
            self.db.flush()  # Get ID without committing
            
            flashcard_id = str(flashcard.id)
            logger.info(f"✅ Created flashcard: {word} (ID: {flashcard_id})")
            
            # Generate media if requested
            if generate_media:
                # Generate image
                image_url = await self.generate_image(flashcard_id, word, definition)
                if image_url:
                    flashcard.image_url = image_url
                    flashcard.image_description = f"Image for {word}"
                    self.stats['with_images'] += 1
                
                # Generate audio
                audio_url = await self.generate_audio(flashcard_id, word)
                if audio_url:
                    flashcard.audio_url = audio_url
                    flashcard.audio_generated_at = datetime.utcnow()
                    self.stats['with_audio'] += 1
                
                # Small delay between media generations
                await asyncio.sleep(1)
            
            self.db.commit()
            self.stats['created'] += 1
            
            logger.info(f"🎉 Successfully imported: {word}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error importing {word}: {str(e)}")
            self.db.rollback()
            self.stats['errors'].append(f"Error with {word}: {str(e)}")
            return False
    
    async def import_all(self, json_path: str, generate_media: bool = True, max_cards: int = None):
        """Import all flashcards from the bootstrap file."""
        
        logger.info("=" * 70)
        logger.info("🚀 BOOTSTRAP IMPORT STARTING")
        logger.info("=" * 70)
        
        # Load data
        data = self.load_bootstrap_data(json_path)
        flashcards = data['flashcards']
        
        if max_cards:
            flashcards = flashcards[:max_cards]
            logger.info(f"⚠️  Limited to first {max_cards} cards for testing")
        
        self.stats['total'] = len(flashcards)
        
        logger.info(f"\n📊 Processing {len(flashcards)} flashcards...")
        logger.info(f"🎨 Image generation: {'ENABLED' if generate_media else 'DISABLED'}")
        logger.info(f"🔊 Audio generation: {'ENABLED' if generate_media else 'DISABLED'}\n")
        
        # Process each card
        for i, card_data in enumerate(flashcards, 1):
            logger.info(f"\n--- Card {i}/{len(flashcards)} ---")
            await self.import_flashcard(card_data, generate_media)
            
            # Small delay to avoid rate limiting
            if generate_media:
                await asyncio.sleep(2)
        
        # Print summary
        logger.info("\n" + "=" * 70)
        logger.info("📈 IMPORT SUMMARY")
        logger.info("=" * 70)
        logger.info(f"Total cards processed: {self.stats['total']}")
        logger.info(f"✅ Successfully created: {self.stats['created']}")
        logger.info(f"⏭️  Skipped (duplicates): {self.stats['skipped_duplicates']}")
        logger.info(f"🎨 With images: {self.stats['with_images']}")
        logger.info(f"🔊 With audio: {self.stats['with_audio']}")
        
        if self.stats['errors']:
            logger.error(f"\n❌ Errors ({len(self.stats['errors'])}):")
            for error in self.stats['errors'][:10]:  # Show first 10 errors
                logger.error(f"  - {error}")
        
        logger.info("=" * 70)
        logger.info("✨ IMPORT COMPLETE!")
        logger.info("=" * 70)

async def main():
    """Main entry point for the bootstrap import."""
    
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description='Import bootstrap vocabulary content')
    parser.add_argument('--no-media', action='store_true', help='Skip image and audio generation')
    parser.add_argument('--max-cards', type=int, help='Maximum number of cards to import (for testing)')
    parser.add_argument('--file', type=str, default='Input/bootstrap_vocabulary.json', help='Path to JSON file')
    args = parser.parse_args()
    
    # Create database session
    db = SessionLocal()
    
    try:
        importer = BootstrapImporter(db)
        await importer.import_all(
            json_path=args.file,
            generate_media=not args.no_media,
            max_cards=args.max_cards
        )
    finally:
        db.close()

if __name__ == '__main__':
    asyncio.run(main())
