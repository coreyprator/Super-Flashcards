"""
SF-026: ElevenLabs TTS endpoint for flashcard pronunciation.
POST /api/cards/{card_id}/audio
Checks GCS cache first, generates via ElevenLabs if miss, returns audio URL.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app import models
from app.services.elevenlabs_tts_service import get_or_generate_audio

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/cards/{card_id}/audio")
async def generate_card_audio(card_id: str, db: Session = Depends(get_db)):
    """Generate or retrieve ElevenLabs TTS audio for a flashcard."""
    flashcard = db.query(models.Flashcard).filter(
        models.Flashcard.id == card_id
    ).first()

    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    try:
        url = await get_or_generate_audio(
            greek_text=flashcard.word_or_phrase,
            card_id=str(flashcard.id),
        )
        return {"url": url, "card_id": str(flashcard.id), "cached": True}
    except Exception as e:
        logger.error(f"ElevenLabs TTS failed for card {card_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")
