# backend/app/routers/audio.py
"""
Audio generation endpoints
Handles TTS generation for flashcards
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.services.service_registry import service_registry
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["audio"])


@router.post("/generate/{card_id}")
async def generate_audio(card_id: str, db: Session = Depends(get_db)):
    """
    Generate TTS audio for a single flashcard word
    
    Process:
    1. Get flashcard from database
    2. Generate pronunciation audio via OpenAI TTS
    3. Save to local /audio/ directory
    4. Update database with audio_url
    5. Return audio URL and metadata
    
    Returns:
        {
            "success": bool,
            "audio_url": str,
            "card_id": str,
            "word": str,
            "language": str,
            "error": str (optional)
        }
    """
    
    logger.info(f"🔧 === GENERATE AUDIO API CALLED ===")
    logger.info(f"🔧 Card ID: {card_id}")
    logger.info(f"🔧 Request received at: {datetime.now().isoformat()}")
    
    try:
        # Get flashcard
        logger.info(f"🔧 Querying database for flashcard with ID: {card_id}")
        flashcard = db.query(models.Flashcard).filter(
            models.Flashcard.id == card_id
        ).first()
        
        if not flashcard:
            logger.error(f"❌ Flashcard not found for ID: {card_id}")
            raise HTTPException(status_code=404, detail="Flashcard not found")
            
        logger.info(f"🔧 Found flashcard: word='{flashcard.word_or_phrase}', language_id='{flashcard.language_id}'")
        
        # Get language for voice selection
        language = db.query(models.Language).filter(
            models.Language.id == flashcard.language_id
        ).first()
        
        if not language:
            raise HTTPException(status_code=404, detail="Language not found")
        
        logger.info(f"Generating audio for card {card_id}: '{flashcard.word_or_phrase}' ({language.name})")
        
        # Generate audio
        success, audio_path, error_msg = service_registry.audio_service.generate_word_audio(
            word=flashcard.word_or_phrase,
            language_name=language.name,
            flashcard_id=str(flashcard.id)
        )
        
        if not success:
            return {
                "success": False,
                "card_id": str(flashcard.id),
                "word": flashcard.word_or_phrase,
                "language": language.name,
                "error": error_msg
            }
        
        # Update database
        flashcard.audio_url = audio_path
        flashcard.audio_generated_at = datetime.utcnow()
        
        try:
            db.commit()
            logger.info(f"Database updated: {audio_path}")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update database: {e}")
            raise HTTPException(status_code=500, detail="Database update failed")
        
        logger.info(f"🔧 === AUDIO GENERATION SUCCESS ===")
        logger.info(f"🔧 Audio URL: {audio_path}")
        logger.info(f"🔧 Returning success response")
        
        return {
            "success": True,
            "audio_url": audio_path,
            "card_id": str(flashcard.id),
            "word": flashcard.word_or_phrase,
            "language": language.name
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"❌ === UNEXPECTED ERROR IN GENERATE AUDIO ===")
        logger.error(f"❌ Error type: {type(e).__name__}")
        logger.error(f"❌ Error message: {str(e)}")
        logger.error(f"❌ Card ID: {card_id}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.delete("/delete/{card_id}")
async def delete_audio(card_id: str, db: Session = Depends(get_db)):
    """
    Delete audio for a flashcard
    
    Returns:
        {
            "success": bool,
            "message": str
        }
    """
    
    flashcard = db.query(models.Flashcard).filter(
        models.Flashcard.id == card_id
    ).first()
    
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    if not flashcard.audio_url:
        return {
            "success": False,
            "message": "No audio to delete"
        }
    
    # Delete audio file
    deleted = service_registry.audio_service.delete_audio(flashcard.audio_url)
    
    # Update database
    flashcard.audio_url = None
    flashcard.audio_generated_at = None
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update database: {e}")
        raise HTTPException(status_code=500, detail="Database update failed")
    
    return {
        "success": deleted,
        "message": "Audio deleted successfully" if deleted else "Audio file not found"
    }


@router.get("/status")
async def get_audio_status(db: Session = Depends(get_db)):
    """
    Get statistics about audio generation progress
    
    Returns:
        {
            "total_cards": int,
            "with_audio": int,
            "without_audio": int,
            "percentage_complete": float,
            "storage_stats": dict
        }
    """
    
    # Database statistics
    total_cards = db.query(func.count(models.Flashcard.id)).scalar()
    
    cards_with_audio = db.query(func.count(models.Flashcard.id)).filter(
        models.Flashcard.audio_url.isnot(None)
    ).scalar()
    
    cards_without_audio = total_cards - cards_with_audio
    
    percentage = (cards_with_audio / total_cards * 100) if total_cards > 0 else 0
    
    # Storage statistics
    storage_stats = service_registry.audio_service.get_audio_stats()
    
    return {
        "total_cards": total_cards,
        "with_audio": cards_with_audio,
        "without_audio": cards_without_audio,
        "percentage_complete": round(percentage, 1),
        "storage_stats": storage_stats
    }


@router.get("/check/{card_id}")
async def check_audio(card_id: str, db: Session = Depends(get_db)):
    """
    Check if audio exists for a flashcard
    
    Returns:
        {
            "has_audio": bool,
            "audio_url": str (optional),
            "file_exists": bool
        }
    """
    
    flashcard = db.query(models.Flashcard).filter(
        models.Flashcard.id == card_id
    ).first()
    
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    has_audio = flashcard.audio_url is not None
    file_exists = False
    
    if has_audio:
        file_exists = service_registry.audio_service.audio_exists(flashcard.audio_url)
    
    return {
        "has_audio": has_audio,
        "audio_url": flashcard.audio_url if has_audio else None,
        "file_exists": file_exists,
        "generated_at": flashcard.audio_generated_at.isoformat() if flashcard.audio_generated_at else None
    }
