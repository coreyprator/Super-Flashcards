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
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(tags=["pronunciation"])

# Initialize service
pronunciation_service = PronunciationService()

# Anonymous user UUID (deterministic for "anonymous" string)
ANONYMOUS_USER_UUID = "00000000-0000-0000-0000-000000000001"


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
        
        # Convert "anonymous" string to deterministic UUID
        actual_user_id = ANONYMOUS_USER_UUID if user_id == "anonymous" else user_id
        
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
            user_id=actual_user_id,
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
        # Convert "anonymous" string to deterministic UUID
        actual_user_id = ANONYMOUS_USER_UUID if user_id == "anonymous" else user_id
        logger.info(f"📊 Getting progress for user {actual_user_id}")
        
        result = await pronunciation_service.get_user_progress(actual_user_id, db)
        
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


# ============================================
# GEMINI DEEP ANALYSIS ENDPOINTS (Sprint 8.5)
# ============================================

@router.post("/deep-analysis/{attempt_id}")
async def trigger_deep_analysis(
    attempt_id: str,
    db: Session = Depends(get_db)
):
    """
    Trigger Gemini deep analysis for an existing pronunciation attempt.
    Premium feature - requires valid subscription.
    
    Returns:
    {
        "attempt_id": str,
        "stt_results": {...},
        "gemini_results": {...},
        "cross_validation": {...}
    }
    """
    from app import crud
    
    try:
        logger.info(f"🎯 Triggering deep analysis for attempt {attempt_id}")
        
        # TODO: Add premium user check here
        # if not user.is_premium:
        #     raise HTTPException(status_code=403, detail="Premium feature")
        
        # Get the attempt
        attempt = crud.get_pronunciation_attempt(db, attempt_id)
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")
        
        # Check if already analyzed
        if attempt.analysis_type == "stt_plus_gemini":
            logger.info(f"✅ Attempt already analyzed with Gemini")
            return {
                "message": "Already analyzed with Gemini",
                "cached_results": attempt.gemini_analysis
            }
        
        # Fetch audio from storage
        # TODO: Implement audio retrieval from Cloud Storage
        # audio_data = await fetch_audio_from_gcs(attempt.audio_url)
        
        # For now, return error if audio not available
        raise HTTPException(
            status_code=501, 
            detail="Audio retrieval not yet implemented - coming in Sprint 8.5b"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error triggering deep analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prompt-template/{language_code}")
async def get_prompt_template(
    language_code: str,
    db: Session = Depends(get_db)
):
    """
    Get the Gemini prompt template for a specific language.
    
    Returns:
    {
        "language_code": str,
        "native_language": str,
        "prompt_template": str,
        "common_interferences": dict
    }
    """
    from app.services import gemini_service
    from app import crud
    
    try:
        logger.info(f"📋 Getting prompt template for language: {language_code}")
        
        service = gemini_service.GeminiPronunciationService(db)
        template = service.get_prompt_template(language_code)
        
        if not template:
            raise HTTPException(
                status_code=404, 
                detail=f"No template found for language: {language_code}"
            )
        
        logger.info(f"✅ Template retrieved for {language_code}")
        return template
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting prompt template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback/{attempt_id}")
async def submit_analysis_feedback(
    attempt_id: str,
    gemini_accuracy_rating: int,
    stt_accuracy_rating: int,
    comments: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Submit user feedback on analysis accuracy.
    Used to track quality and improve prompts over time.
    
    Body:
    {
        "gemini_accuracy_rating": int (1-5),
        "stt_accuracy_rating": int (1-5),
        "comments": str (optional)
    }
    """
    from app import crud
    
    try:
        logger.info(f"📝 Feedback received for attempt {attempt_id}")
        
        attempt = crud.get_pronunciation_attempt(db, attempt_id)
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")
        
        # TODO: Create AnalysisFeedback table and store this
        # For now, just log it
        logger.info(
            f"Feedback - Gemini={gemini_accuracy_rating}/5, "
            f"STT={stt_accuracy_rating}/5, "
            f"Comments={comments}"
        )
        
        return {
            "message": "Feedback recorded",
            "attempt_id": attempt_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))
