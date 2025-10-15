# backend/app/routers/tts_testing.py
"""
TTS Testing Router for comparing different text-to-speech methods
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging
import time

from app.database import get_db
from app import models
from app.services.ipa_service import IPAService

router = APIRouter()
logger = logging.getLogger(__name__)

class TTSTestRequest(BaseModel):
    word: str
    ipa: Optional[str] = None
    method: str  # "openai_french", "openai_ipa", "elevenlabs", "azure"
    voice: str
    card_id: str

@router.get("/cards/without-ipa")
async def get_cards_without_ipa(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    """Get cards for TTS testing (prioritize cards without IPA, but include all if needed)"""
    
    try:
        # First try to get cards without IPA
        cards_without_ipa = db.query(models.Flashcard).filter(
            models.Flashcard.ipa_pronunciation.is_(None)
        ).order_by(models.Flashcard.created_at).offset(offset).limit(limit).all()
        
        # If no cards without IPA, get any cards for testing
        if not cards_without_ipa:
            logger.info("No cards without IPA found, getting all cards for testing")
            cards_without_ipa = db.query(models.Flashcard).order_by(models.Flashcard.created_at).offset(offset).limit(limit).all()
        
        result = []
        for card in cards_without_ipa:
            try:
                # Get language info
                language = db.query(models.Language).filter(
                    models.Language.id == card.language_id
                ).first()
                
                result.append({
                    "id": str(card.id),
                    "word_or_phrase": card.word_or_phrase,
                    "definition": card.definition,
                    "ipa_pronunciation": card.ipa_pronunciation,
                    "language": language.name if language else "Unknown"
                })
            except Exception as e:
                logger.error(f"Error processing card {card.id}: {e}")
                continue
        
        logger.info(f"Returning {len(result)} cards for TTS testing")
        return result
        
    except Exception as e:
        logger.error(f"Error in get_cards_without_ipa: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/tts/test")
async def test_tts_method(request: TTSTestRequest, db: Session = Depends(get_db)):
    """Test a specific TTS method and voice combination"""
    
    logger.info(f"🧪 Testing TTS: {request.method} - {request.voice} for '{request.word}'")
    
    try:
        start_time = time.time()
        
        # Get or create IPA service
        ipa_service = IPAService()
        
        # Generate audio based on method
        if request.method == "openai_french":
            success, audio_path, error = await _generate_openai_french(
                ipa_service, request.word, request.ipa, request.voice, request.card_id
            )
        elif request.method == "openai_ipa":
            success, audio_path, error = await _generate_openai_ipa_guide(
                ipa_service, request.word, request.ipa, request.voice, request.card_id
            )
        elif request.method == "elevenlabs":
            success, audio_path, error = await _generate_elevenlabs(
                request.word, request.voice, request.card_id
            )
        elif request.method == "azure":
            success, audio_path, error = await _generate_azure(
                request.word, request.voice, request.card_id
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unknown TTS method: {request.method}")
        
        duration = time.time() - start_time
        
        if success:
            return {
                "success": True,
                "audio_url": audio_path,
                "duration": round(duration, 2),
                "method": request.method,
                "voice": request.voice
            }
        else:
            return {
                "success": False,
                "error": error,
                "duration": round(duration, 2)
            }
            
    except Exception as e:
        logger.error(f"❌ TTS testing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def _generate_openai_french(ipa_service, word: str, ipa: str, voice: str, card_id: str):
    """Generate OpenAI TTS with French context"""
    try:
        if not ipa_service._client_initialized:
            ipa_service._initialize_client()
        
        if not ipa_service.client:
            return False, None, "OpenAI client not available"
        
        tts_text = f"En français: {word}"
        
        response = ipa_service.client.audio.speech.create(
            model="tts-1",  # Fast model for testing
            voice=voice,
            input=tts_text,
            response_format="mp3"
        )
        
        # Save file
        filename = f"test_{card_id}_{voice}_french.mp3"
        file_path = ipa_service.IPA_AUDIO_DIR / filename
        file_path.write_bytes(response.content)
        
        return True, f"/ipa_audio/{filename}", None
        
    except Exception as e:
        return False, None, str(e)

async def _generate_openai_ipa_guide(ipa_service, word: str, ipa: str, voice: str, card_id: str):
    """Generate OpenAI TTS with IPA guide"""
    try:
        if not ipa_service._client_initialized:
            ipa_service._initialize_client()
        
        if not ipa_service.client:
            return False, None, "OpenAI client not available"
        
        tts_text = f"Le mot français '{word}', prononcé {ipa or 'comme écrit'}"
        
        response = ipa_service.client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=tts_text,
            response_format="mp3"
        )
        
        # Save file
        filename = f"test_{card_id}_{voice}_ipa.mp3"
        file_path = ipa_service.IPA_AUDIO_DIR / filename
        file_path.write_bytes(response.content)
        
        return True, f"/ipa_audio/{filename}", None
        
    except Exception as e:
        return False, None, str(e)

async def _generate_elevenlabs(word: str, voice: str, card_id: str):
    """Generate ElevenLabs TTS"""
    try:
        import requests
        import os
        from pathlib import Path
        
        api_key = os.getenv('ELEVENLABS_API_KEY')
        if not api_key:
            return False, None, "ElevenLabs API key not found"
        
        # Voice mapping
        voice_ids = {
            "charlotte": "XB0fDUnXU5powFXDhCwa",
            "antoine": "ErXwobaYiN019PkySvjV"
        }
        
        voice_id = voice_ids.get(voice.lower())
        if not voice_id:
            return False, None, f"Unknown ElevenLabs voice: {voice}"
        
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": api_key
        }
        
        data = {
            "text": word,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8,
                "style": 0.2
            }
        }
        
        response = requests.post(url, json=data, headers=headers, timeout=60)
        
        if response.status_code == 200:
            # Save file
            filename = f"test_{card_id}_{voice}_elevenlabs.mp3"
            ipa_audio_dir = Path(__file__).parent.parent.parent.parent / "ipa_audio"
            ipa_audio_dir.mkdir(exist_ok=True)
            file_path = ipa_audio_dir / filename
            file_path.write_bytes(response.content)
            
            return True, f"/ipa_audio/{filename}", None
        else:
            return False, None, f"ElevenLabs API error: {response.status_code}"
            
    except Exception as e:
        return False, None, str(e)

async def _generate_azure(word: str, voice: str, card_id: str):
    """Generate Azure Speech TTS"""
    try:
        # Placeholder for Azure implementation
        return False, None, "Azure TTS not implemented yet - coming in next phase!"
        
    except Exception as e:
        return False, None, str(e)