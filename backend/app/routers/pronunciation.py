# backend/app/routers/pronunciation.py
"""
Pronunciation Practice Endpoints
Handles audio recording, transcription, and feedback
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.services.pronunciation_service import PronunciationService
import logging
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(tags=["pronunciation"])

# Initialize service
pronunciation_service = PronunciationService()


@router.post("/record")
async def record_pronunciation(
    audio_file: UploadFile = File(...),
    flashcard_id: str = Form(...),
    user_id: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Upload user audio recording and get pronunciation feedback.
    
    Request: multipart/form-data
    - audio_file: WAV or WEBM file
    - flashcard_id: UUID
    - user_id: UUID
    
    Response:
    {
        "attempt_id": str,
        "target_text": str,
        "transcribed_text": str,
        "overall_score": float,
        "word_scores": list,
        "ipa_target": str,
        "feedback": str
    }
    """
    try:
        logger.info(f"🎤 Recording endpoint called for flashcard {flashcard_id}")
        
        # Validate flashcard exists
        flashcard = db.query(models.Flashcard).filter(
            models.Flashcard.id == flashcard_id
        ).first()
        
        if not flashcard:
            raise HTTPException(status_code=404, detail="Flashcard not found")
        
        # Read audio file
        audio_content = await audio_file.read()
        if not audio_content:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        logger.info(f"✅ Audio file received: {len(audio_content)} bytes")
        
        # Analyze pronunciation
        result = await pronunciation_service.analyze_pronunciation(
            audio_content=audio_content,
            target_text=flashcard.word_or_phrase,
            user_id=user_id,
            flashcard_id=flashcard_id,
            db=db
        )
        
        logger.info(f"✅ Analysis complete: score {result['overall_score']}")
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in record endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/progress/{user_id}")
async def get_pronunciation_progress(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get user's pronunciation progress over time.
    
    Response:
    {
        "total_attempts": int,
        "avg_confidence": float,
        "problem_words": list,
        "improvement_trend": str
    }
    """
    try:
        logger.info(f"📊 Getting progress for user {user_id}")
        
        result = await pronunciation_service.get_user_progress(user_id, db)
        
        logger.info(f"✅ Progress retrieved: {result['total_attempts']} attempts")
        return result
    
    except Exception as e:
        logger.error(f"❌ Error getting progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{flashcard_id}")
async def get_pronunciation_history(
    flashcard_id: str,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get attempt history for a specific flashcard.
    
    Query Parameters:
    - skip: Number of records to skip (pagination)
    - limit: Number of records to return (max 100)
    
    Response:
    {
        "flashcard_id": str,
        "total_attempts": int,
        "avg_confidence": float,
        "attempts": list,
        "pagination": {...}
    }
    """
    try:
        logger.info(f"📜 Getting history for flashcard {flashcard_id}")
        
        # Validate pagination
        if limit > 100:
            limit = 100
        if skip < 0:
            skip = 0
        
        result = await pronunciation_service.get_flashcard_history(
            flashcard_id=flashcard_id,
            db=db,
            skip=skip,
            limit=limit
        )
        
        logger.info(f"✅ History retrieved: {result['total_attempts']} total attempts")
        return result
    
    except Exception as e:
        logger.error(f"❌ Error getting history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-ipa/{flashcard_id}")
async def generate_ipa_pronunciation(
    flashcard_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate and store IPA pronunciation for a flashcard.
    Used for batch processing.
    
    Response:
    {
        "flashcard_id": str,
        "word_or_phrase": str,
        "ipa": str,
        "success": bool
    }
    """
    try:
        logger.info(f"🎯 Generating IPA for flashcard {flashcard_id}")
        
        result = await pronunciation_service.generate_ipa_for_flashcard(
            flashcard_id=flashcard_id,
            db=db
        )
        
        logger.info(f"✅ IPA generated: {result['ipa']}")
        return result
    
    except Exception as e:
        logger.error(f"❌ Error generating IPA: {e}")
        raise HTTPException(status_code=500, detail=str(e))
