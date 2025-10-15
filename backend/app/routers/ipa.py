# backend/app/routers/ipa.py
"""
IPA Pronunciation Router for Super-Flashcards
Handles IPA transcription and audio generation endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app.database import get_db
from app import models
from app.services.service_registry import service_registry

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/generate-ipa/{card_id}")
async def generate_ipa_pronunciation(card_id: str, db: Session = Depends(get_db)):
    """
    Generate IPA pronunciation for a flashcard
    
    Process:
    1. Get flashcard from database
    2. Generate IPA transcription using Wiktionary/OpenAI
    3. Update database with IPA
    4. Return IPA pronunciation
    
    Returns:
        {
            "success": bool,
            "card_id": str,
            "word": str,
            "language": str,
            "ipa_pronunciation": str,
            "error": str (optional)
        }
    """
    logger.info(f"🔤 === GENERATE IPA PRONUNCIATION ===")
    logger.info(f"🔤 Card ID: {card_id}")
    
    try:
        # Get flashcard
        flashcard = db.query(models.Flashcard).filter(
            models.Flashcard.id == card_id
        ).first()
        
        if not flashcard:
            raise HTTPException(status_code=404, detail="Flashcard not found")
        
        # Get language for IPA generation
        language = db.query(models.Language).filter(
            models.Language.id == flashcard.language_id
        ).first()
        
        if not language:
            raise HTTPException(status_code=404, detail="Language not found")
        
        logger.info(f"Generating IPA for '{flashcard.word_or_phrase}' in {language.name}")
        
        # Generate IPA pronunciation
        ipa_pronunciation = service_registry.ipa_service.get_ipa_pronunciation(
            word=flashcard.word_or_phrase,
            language=language.name
        )
        
        if not ipa_pronunciation:
            return {
                "success": False,
                "card_id": str(flashcard.id),
                "word": flashcard.word_or_phrase,
                "language": language.name,
                "error": "Could not generate IPA pronunciation"
            }
        
        # Update database with IPA
        flashcard.ipa_pronunciation = ipa_pronunciation
        
        try:
            db.commit()
            logger.info(f"Database updated with IPA: /{ipa_pronunciation}/")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update database: {e}")
            raise HTTPException(status_code=500, detail="Database update failed")
        
        return {
            "success": True,
            "card_id": str(flashcard.id),
            "word": flashcard.word_or_phrase,
            "language": language.name,
            "ipa_pronunciation": ipa_pronunciation
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in IPA generation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/generate-ipa-audio/{card_id}")
async def generate_ipa_audio(card_id: str, db: Session = Depends(get_db)):
    """
    Generate TTS audio from IPA pronunciation
    
    Process:
    1. Get flashcard with IPA from database
    2. Generate audio using TTS with IPA guidance
    3. Save audio file
    4. Update database with IPA audio URL
    5. Return audio URL
    
    Returns:
        {
            "success": bool,
            "card_id": str,
            "word": str,
            "ipa_pronunciation": str,
            "ipa_audio_url": str,
            "error": str (optional)
        }
    """
    logger.info(f"🔊 === GENERATE IPA AUDIO ===")
    logger.info(f"🔊 Card ID: {card_id}")
    
    try:
        # Get flashcard
        flashcard = db.query(models.Flashcard).filter(
            models.Flashcard.id == card_id
        ).first()
        
        if not flashcard:
            raise HTTPException(status_code=404, detail="Flashcard not found")
        
        if not flashcard.ipa_pronunciation:
            raise HTTPException(status_code=400, detail="No IPA pronunciation available. Generate IPA first.")
        
        # Get language
        language = db.query(models.Language).filter(
            models.Language.id == flashcard.language_id
        ).first()
        
        if not language:
            raise HTTPException(status_code=404, detail="Language not found")
        
        logger.info(f"Generating IPA audio for '{flashcard.word_or_phrase}' with IPA: /{flashcard.ipa_pronunciation}/")
        
        # Generate IPA audio
        success, audio_path, error_msg = service_registry.ipa_service.generate_ipa_audio(
            ipa_text=flashcard.ipa_pronunciation,
            word=flashcard.word_or_phrase,
            language=language.name,
            flashcard_id=str(flashcard.id)
        )
        
        if not success:
            return {
                "success": False,
                "card_id": str(flashcard.id),
                "word": flashcard.word_or_phrase,
                "ipa_pronunciation": flashcard.ipa_pronunciation,
                "error": error_msg
            }
        
        # Update database with IPA audio
        flashcard.ipa_audio_url = audio_path
        flashcard.ipa_generated_at = datetime.utcnow()
        
        try:
            db.commit()
            logger.info(f"Database updated with IPA audio: {audio_path}")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update database: {e}")
            raise HTTPException(status_code=500, detail="Database update failed")
        
        return {
            "success": True,
            "card_id": str(flashcard.id),
            "word": flashcard.word_or_phrase,
            "ipa_pronunciation": flashcard.ipa_pronunciation,
            "ipa_audio_url": audio_path
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in IPA audio generation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/check-ipa/{card_id}")
async def check_ipa_status(card_id: str, db: Session = Depends(get_db)):
    """
    Check IPA pronunciation and audio status for a flashcard
    
    Returns:
        {
            "card_id": str,
            "word": str,
            "has_ipa": bool,
            "ipa_pronunciation": str,
            "has_ipa_audio": bool,
            "ipa_audio_url": str,
            "ipa_generated_at": datetime
        }
    """
    flashcard = db.query(models.Flashcard).filter(
        models.Flashcard.id == card_id
    ).first()
    
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    return {
        "card_id": str(flashcard.id),
        "word": flashcard.word_or_phrase,
        "has_ipa": bool(flashcard.ipa_pronunciation),
        "ipa_pronunciation": flashcard.ipa_pronunciation,
        "has_ipa_audio": bool(flashcard.ipa_audio_url),
        "ipa_audio_url": flashcard.ipa_audio_url,
        "ipa_generated_at": flashcard.ipa_generated_at
    }