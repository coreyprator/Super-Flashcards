#!/usr/bin/env python3
"""
Import Greek diphthongs and consonant combinations into the database.
17 cards total: 7 diphthongs + 10 consonant combinations.
"""

import json
import sys
import os
import asyncio
from pathlib import Path

# Add the app directory to the path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.database import get_db
from app import models, crud
from app.services.service_registry import service_registry
import uuid
from datetime import datetime

async def import_greek_diphthongs():
    """Import the Greek diphthongs/consonant combination flashcards"""

    print("Greek Diphthongs & Consonant Combinations Import")
    print("=" * 50)

    # Load the JSON data
    json_path = Path(__file__).parent / "greek_diphthongs.json"

    with open(json_path, 'r', encoding='utf-8') as f:
        flashcards_data = json.load(f)

    print(f"Loaded {len(flashcards_data)} flashcards from JSON")

    # Get database session
    db = next(get_db())

    try:
        # Get or create Greek language
        greek_lang = crud.get_language_by_code(db, "el")
        if not greek_lang:
            print("Creating Greek language entry...")
            greek_lang = models.Language(
                id=str(uuid.uuid4()),
                name="Greek",
                code="el",
                created_at=datetime.utcnow()
            )
            db.add(greek_lang)
            db.commit()
            db.refresh(greek_lang)

        print(f"Greek language: {greek_lang.name} (ID: {greek_lang.id})")

        # Import flashcards (no user_id - Cloud SQL schema doesn't have it)
        imported_count = 0
        skipped_count = 0

        for card_data in flashcards_data:
            try:
                # Check if this word already exists for this language
                existing = db.query(models.Flashcard).filter(
                    models.Flashcard.word_or_phrase == card_data["word_or_phrase"],
                    models.Flashcard.language_id == greek_lang.id
                ).first()

                if existing:
                    print(f"  Skipping existing: {card_data['word_or_phrase']}")
                    skipped_count += 1
                    continue

                # Create new flashcard
                flashcard = models.Flashcard(
                    id=str(uuid.uuid4()),
                    language_id=greek_lang.id,
                    word_or_phrase=card_data["word_or_phrase"],
                    definition=card_data["definition"],
                    ipa_pronunciation=card_data.get("ipa_pronunciation"),
                    etymology=card_data.get("etymology"),
                    english_cognates=card_data.get("english_cognates"),
                    related_words=json.dumps(card_data["related_words"]) if card_data.get("related_words") else None,
                    image_description=card_data.get("image_description"),
                    source="Greek Pronunciation Import",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                db.add(flashcard)
                imported_count += 1
                print(f"  Added: {card_data['word_or_phrase']} - {card_data['ipa_pronunciation']}")

            except Exception as e:
                print(f"  Error importing '{card_data['word_or_phrase']}': {e}")
                continue

        # Commit all changes
        db.commit()
        print(f"\nImported {imported_count} new flashcards")
        print(f"Skipped {skipped_count} existing flashcards")

        # Now generate Google TTS audio for the new cards
        print("\n" + "=" * 50)
        print("Generating Greek TTS Audio")
        print("=" * 50)

        # Get all Greek diphthong/combination cards without audio
        greek_cards = db.query(models.Flashcard).filter(
            models.Flashcard.language_id == greek_lang.id,
            models.Flashcard.source == "Greek Pronunciation Import",
            models.Flashcard.audio_url.is_(None)
        ).all()

        print(f"Found {len(greek_cards)} cards needing audio")

        if greek_cards:
            audio_success = 0
            audio_errors = 0

            for card in greek_cards:
                try:
                    print(f"  Generating audio for: {card.word_or_phrase}")

                    # Generate audio using the service
                    success, audio_path, error_msg = service_registry.audio_service.generate_word_audio(
                        word=card.word_or_phrase,
                        language_name="Greek",
                        flashcard_id=str(card.id)
                    )

                    if success:
                        card.audio_url = audio_path
                        card.audio_generated_at = datetime.utcnow()
                        audio_success += 1
                        print(f"    Audio generated: {audio_path}")
                    else:
                        audio_errors += 1
                        print(f"    Audio failed: {error_msg}")

                except Exception as e:
                    audio_errors += 1
                    print(f"    Exception: {e}")

            # Commit audio updates
            db.commit()

            print(f"\nAudio Generation Summary:")
            print(f"  Success: {audio_success}")
            print(f"  Errors: {audio_errors}")

        print(f"\nGreek pronunciation cards ready!")

    except Exception as e:
        print(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

async def main():
    """Main entry point"""
    await import_greek_diphthongs()

if __name__ == "__main__":
    asyncio.run(main())
