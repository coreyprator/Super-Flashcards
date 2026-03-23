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


class TTSSegment(BaseModel):
    text: str
    language: str = "en"


class TTSRequest(BaseModel):
    text: str = ""
    language: Optional[str] = "el"
    provider: Optional[str] = "11labs"
    speed: Optional[float] = 1.0
    segments: Optional[list[TTSSegment]] = None


@router.post("/tts")
async def text_to_speech(payload: TTSRequest):
    """
    SM05: Provider-aware TTS endpoint.
    SM07: Added explicit logging to surface silent 11Labs failures.
    SM08: Added segments (per-field language) + speed parameter.
    For 11Labs: multilingual v2 handles mixed-language text — send as one call.
    For browser/speechify: return segments so frontend reads each with correct lang.
    """
    provider = payload.provider or "11labs"
    speed = max(0.5, min(2.0, payload.speed or 1.0))

    # Build combined text from segments if provided, else use legacy text field
    if payload.segments:
        combined_text = ". ".join(s.text for s in payload.segments if s.text)
    else:
        combined_text = payload.text

    logger.info(f"[TTS] Provider: {provider}, text len: {len(combined_text)}, speed: {speed}")

    if provider == "browser":
        # Return segments for browser TTS so frontend can set language per segment
        if payload.segments:
            return {"error": "use_browser_tts", "segments": [s.model_dump() for s in payload.segments], "speed": speed}
        return {"error": "use_browser_tts", "speed": speed}

    if provider == "11labs":
        try:
            audio_url = await get_or_generate_audio_for_text(combined_text, speed=speed)
            logger.info(f"[TTS] 11Labs success: {audio_url}")
            return {"audio_url": audio_url, "provider": "11labs"}
        except Exception as e:
            logger.error(f"[TTS] 11Labs FAILED: {e} — falling back to browser")
            segments_out = [s.model_dump() for s in payload.segments] if payload.segments else None
            return {"error": "use_browser_tts", "error_detail": str(e), "segments": segments_out, "speed": speed}

    # Speechify or unknown provider — fall back to browser with segments
    if payload.segments:
        return {"error": "use_browser_tts", "segments": [s.model_dump() for s in payload.segments], "speed": speed}
    return {"error": "use_browser_tts", "speed": speed}
