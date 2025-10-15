# backend/app/routers/batch_ipa.py
"""
Batch IPA processing router for Super-Flashcards
Handles batch generation of IPA pronunciations and audio for multiple flashcards
"""
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import logging
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.services.ipa_service import IPAService
from app.services.service_registry import service_registry

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/batch-generate-ipa/{language_id}")
async def batch_generate_ipa(
    language_id: str,
    background_tasks: BackgroundTasks,
    limit: Optional[int] = Query(default=50, description="Maximum number of cards to process"),
    db: Session = Depends(get_db)
):
    """
    Start batch generation of IPA pronunciations for all flashcards in a language
    """
    try:
        # Verify language exists
        language = db.query(models.Language).filter(models.Language.id == language_id).first()
        if not language:
            raise HTTPException(status_code=404, detail="Language not found")
        
        # Get flashcards without IPA pronunciations
        flashcards = db.query(models.Flashcard).filter(
            models.Flashcard.language_id == language_id,
            models.Flashcard.ipa_pronunciation.is_(None)
        ).limit(limit).all()
        
        if not flashcards:
            return {
                "success": True,
                "message": "No flashcards need IPA pronunciation generation",
                "cards_found": 0,
                "language": language.name
            }
        
        # Start background task
        task_id = str(uuid.uuid4())
        background_tasks.add_task(
            _batch_generate_ipa_task,
            task_id,
            [card.id for card in flashcards],
            language.name
        )
        
        logger.info(f"🚀 Started batch IPA generation for {len(flashcards)} cards in {language.name}")
        
        return {
            "success": True,
            "message": f"Started batch IPA generation for {len(flashcards)} cards in {language.name}",
            "task_id": task_id,
            "cards_to_process": len(flashcards),
            "language": language.name
        }
        
    except Exception as e:
        logger.error(f"❌ Error starting batch IPA generation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start batch IPA generation: {str(e)}")

@router.post("/batch-generate-ipa-audio/{language_id}")
async def batch_generate_ipa_audio(
    language_id: str,
    background_tasks: BackgroundTasks,
    limit: Optional[int] = Query(default=50, description="Maximum number of cards to process"),
    db: Session = Depends(get_db)
):
    """
    Start batch generation of IPA audio for all flashcards with IPA pronunciations in a language
    """
    try:
        # Verify language exists
        language = db.query(models.Language).filter(models.Language.id == language_id).first()
        if not language:
            raise HTTPException(status_code=404, detail="Language not found")
        
        # Get flashcards with IPA pronunciations but no IPA audio
        flashcards = db.query(models.Flashcard).filter(
            models.Flashcard.language_id == language_id,
            models.Flashcard.ipa_pronunciation.isnot(None),
            models.Flashcard.ipa_audio_url.is_(None)
        ).limit(limit).all()
        
        if not flashcards:
            return {
                "success": True,
                "message": "No flashcards need IPA audio generation",
                "cards_found": 0,
                "language": language.name
            }
        
        # Start background task
        task_id = str(uuid.uuid4())
        background_tasks.add_task(
            _batch_generate_ipa_audio_task,
            task_id,
            [card.id for card in flashcards],
            language.name
        )
        
        logger.info(f"🔊 Started batch IPA audio generation for {len(flashcards)} cards in {language.name}")
        
        return {
            "success": True,
            "message": f"Started batch IPA audio generation for {len(flashcards)} cards in {language.name}",
            "task_id": task_id,
            "cards_to_process": len(flashcards),
            "language": language.name
        }
        
    except Exception as e:
        logger.error(f"❌ Error starting batch IPA audio generation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start batch IPA audio generation: {str(e)}")

@router.post("/batch-generate-complete/{language_id}")
async def batch_generate_complete(
    language_id: str,
    background_tasks: BackgroundTasks,
    limit: Optional[int] = Query(default=50, description="Maximum number of cards to process"),
    db: Session = Depends(get_db)
):
    """
    Start batch generation of both IPA pronunciations and audio for all flashcards in a language
    """
    try:
        # Verify language exists
        language = db.query(models.Language).filter(models.Language.id == language_id).first()
        if not language:
            raise HTTPException(status_code=404, detail="Language not found")
        
        # Get all flashcards in the language
        flashcards = db.query(models.Flashcard).filter(
            models.Flashcard.language_id == language_id
        ).limit(limit).all()
        
        if not flashcards:
            return {
                "success": True,
                "message": "No flashcards found in this language",
                "cards_found": 0,
                "language": language.name
            }
        
        # Start background task
        task_id = str(uuid.uuid4())
        background_tasks.add_task(
            _batch_generate_complete_task,
            task_id,
            [card.id for card in flashcards],
            language.name
        )
        
        logger.info(f"🎯 Started complete batch IPA processing for {len(flashcards)} cards in {language.name}")
        
        return {
            "success": True,
            "message": f"Started complete batch IPA processing for {len(flashcards)} cards in {language.name}",
            "task_id": task_id,
            "cards_to_process": len(flashcards),
            "language": language.name
        }
        
    except Exception as e:
        logger.error(f"❌ Error starting complete batch IPA processing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start complete batch IPA processing: {str(e)}")

async def _batch_generate_ipa_task(task_id: str, card_ids: List[str], language_name: str):
    """
    Background task to generate IPA pronunciations for multiple cards
    """
    logger.info(f"🔤 [{task_id}] Starting IPA generation for {len(card_ids)} cards in {language_name}")
    
    ipa_service = service_registry.get_ipa_service()
    processed = 0
    errors = 0
    
    for card_id in card_ids:
        try:
            # Get database session
            from app.database import SessionLocal
            db = SessionLocal()
            
            try:
                # Get the card
                card = db.query(models.Flashcard).filter(models.Flashcard.id == card_id).first()
                if not card:
                    logger.warning(f"⚠️ Card {card_id} not found")
                    continue
                
                # Skip if already has IPA
                if card.ipa_pronunciation:
                    logger.info(f"⏭️ Card {card_id} already has IPA: {card.ipa_pronunciation}")
                    continue
                
                # Generate IPA
                ipa_text = ipa_service.get_ipa_pronunciation(card.word_or_phrase, language_name)
                
                if ipa_text:
                    # Update the card
                    card.ipa_pronunciation = ipa_text
                    card.ipa_generated_at = datetime.utcnow()
                    db.commit()
                    
                    processed += 1
                    logger.info(f"✅ [{task_id}] Generated IPA for '{card.word_or_phrase}': {ipa_text}")
                else:
                    errors += 1
                    logger.warning(f"⚠️ [{task_id}] Failed to generate IPA for '{card.word_or_phrase}'")
                    
            finally:
                db.close()
                
        except Exception as e:
            errors += 1
            logger.error(f"❌ [{task_id}] Error processing card {card_id}: {e}")
    
    logger.info(f"🎉 [{task_id}] Batch IPA generation complete: {processed} processed, {errors} errors")

async def _batch_generate_ipa_audio_task(task_id: str, card_ids: List[str], language_name: str):
    """
    Background task to generate IPA audio for multiple cards
    """
    logger.info(f"🔊 [{task_id}] Starting IPA audio generation for {len(card_ids)} cards in {language_name}")
    
    ipa_service = service_registry.get_ipa_service()
    processed = 0
    errors = 0
    
    for card_id in card_ids:
        try:
            # Get database session
            from app.database import SessionLocal
            db = SessionLocal()
            
            try:
                # Get the card
                card = db.query(models.Flashcard).filter(models.Flashcard.id == card_id).first()
                if not card:
                    logger.warning(f"⚠️ Card {card_id} not found")
                    continue
                
                # Skip if no IPA pronunciation
                if not card.ipa_pronunciation:
                    logger.warning(f"⚠️ Card {card_id} has no IPA pronunciation")
                    continue
                
                # Skip if already has IPA audio
                if card.ipa_audio_url:
                    logger.info(f"⏭️ Card {card_id} already has IPA audio")
                    continue
                
                # Generate IPA audio
                success, audio_path, error = ipa_service.generate_ipa_audio(
                    card.ipa_pronunciation,
                    card.word_or_phrase,
                    language_name,
                    card_id
                )
                
                if success and audio_path:
                    # Update the card
                    card.ipa_audio_url = audio_path
                    card.ipa_generated_at = datetime.utcnow()
                    db.commit()
                    
                    processed += 1
                    logger.info(f"✅ [{task_id}] Generated IPA audio for '{card.word_or_phrase}'")
                else:
                    errors += 1
                    logger.warning(f"⚠️ [{task_id}] Failed to generate IPA audio for '{card.word_or_phrase}': {error}")
                    
            finally:
                db.close()
                
        except Exception as e:
            errors += 1
            logger.error(f"❌ [{task_id}] Error processing card {card_id}: {e}")
    
    logger.info(f"🎉 [{task_id}] Batch IPA audio generation complete: {processed} processed, {errors} errors")

async def _batch_generate_complete_task(task_id: str, card_ids: List[str], language_name: str):
    """
    Background task to generate both IPA pronunciations and audio for multiple cards
    """
    logger.info(f"🎯 [{task_id}] Starting complete IPA processing for {len(card_ids)} cards in {language_name}")
    
    # First run IPA generation
    await _batch_generate_ipa_task(f"{task_id}-ipa", card_ids, language_name)
    
    # Then run IPA audio generation  
    await _batch_generate_ipa_audio_task(f"{task_id}-audio", card_ids, language_name)
    
    logger.info(f"🎉 [{task_id}] Complete IPA processing finished for {language_name}")

@router.get("/batch-status/{language_id}")
async def get_batch_status(
    language_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the current status of IPA processing for a language
    """
    try:
        # Verify language exists
        language = db.query(models.Language).filter(models.Language.id == language_id).first()
        if not language:
            raise HTTPException(status_code=404, detail="Language not found")
        
        # Get counts
        total_cards = db.query(models.Flashcard).filter(
            models.Flashcard.language_id == language_id
        ).count()
        
        cards_with_ipa = db.query(models.Flashcard).filter(
            models.Flashcard.language_id == language_id,
            models.Flashcard.ipa_pronunciation.isnot(None)
        ).count()
        
        cards_with_ipa_audio = db.query(models.Flashcard).filter(
            models.Flashcard.language_id == language_id,
            models.Flashcard.ipa_audio_url.isnot(None)
        ).count()
        
        return {
            "success": True,
            "language": language.name,
            "total_cards": total_cards,
            "cards_with_ipa": cards_with_ipa,
            "cards_with_ipa_audio": cards_with_ipa_audio,
            "ipa_completion_percent": round((cards_with_ipa / total_cards * 100) if total_cards > 0 else 0, 1),
            "audio_completion_percent": round((cards_with_ipa_audio / total_cards * 100) if total_cards > 0 else 0, 1)
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting batch status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get batch status: {str(e)}")