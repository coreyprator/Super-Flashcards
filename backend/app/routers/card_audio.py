"""
SF-026: ElevenLabs TTS endpoint for flashcard pronunciation.
POST /api/cards/{card_id}/audio
Checks GCS cache first, generates via ElevenLabs if miss, returns audio URL.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging

from app.database import get_db
from app import models
from app.services.elevenlabs_tts_service import get_or_generate_audio, get_or_generate_audio_for_text

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


class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "el"
    provider: Optional[str] = "11labs"


@router.post("/tts")
async def text_to_speech(payload: TTSRequest):
    """
    SM05: Provider-aware TTS endpoint.
    Returns audio_url for 11labs provider, or {"error": "use_browser_tts"} for browser/speechify.
    """
    provider = payload.provider or "11labs"

    if provider == "browser":
        return {"error": "use_browser_tts"}

    if provider == "11labs":
        try:
            audio_url = await get_or_generate_audio_for_text(payload.text)
            return {"audio_url": audio_url, "provider": "11labs"}
        except Exception as e:
            logger.error(f"11Labs TTS failed: {e}")
            return {"error": "use_browser_tts"}

    # Speechify or unknown provider — fall back to browser
    return {"error": "use_browser_tts"}
