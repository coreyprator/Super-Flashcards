"""
Batch AI Generation Endpoint
Generates multiple flashcards with AI content in one request
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import logging
import json

from ..database import get_db
from .. import crud, schemas, models
from .ai_generate import generate_flashcard_content, generate_image

router = APIRouter()
logger = logging.getLogger(__name__)

class BatchGenerateRequest(BaseModel):
    """Request model for batch AI generation"""
    words: List[str]
    language_id: str  # UUID string
    include_images: bool = True

class BatchGenerateResponse(BaseModel):
    """Response model for batch AI generation"""
    total_requested: int
    successful: int
    failed: int
    flashcard_ids: List[str]  # UUID strings
    errors: List[dict]

@router.post("/batch-generate", response_model=BatchGenerateResponse)
async def batch_generate_flashcards(
    request: BatchGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate multiple flashcards with AI content in one batch.
    
    For each word:
    1. Generate definition, etymology, cognates via OpenAI
    2. Generate image via DALL-E (if include_images=True)
    3. Save to database
    
    Note: Audio generation happens asynchronously after card creation
    """
    
    logger.info(f"🚀 Starting batch generation for {len(request.words)} words")
    
    # Validate language
    language = crud.get_language(db, request.language_id)
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Track results
    flashcard_ids = []
    errors = []
    successful = 0
    failed = 0
    
    # TODO: Use dummy user ID for now (Phase 1 single-user)
    dummy_user_id = "00000000-0000-0000-0000-000000000000"
    
    # Process each word
    for index, word in enumerate(request.words, 1):
        try:
            logger.info(f"📝 Processing {index}/{len(request.words)}: {word}")
            
            # Check for duplicates
            existing = db.query(models.Flashcard).filter(
                models.Flashcard.word_or_phrase == word,
                models.Flashcard.language_id == request.language_id
            ).first()
            
            if existing:
                logger.warning(f"⚠️  Duplicate: {word} (ID: {existing.id})")
                errors.append({
                    "word": word,
                    "error": "Duplicate flashcard already exists",
                    "flashcard_id": existing.id
                })
                failed += 1
                continue
            
            # Generate AI content
            content = generate_flashcard_content(
                word, 
                language.code, 
                dummy_user_id,
                db,
                verbose=False
            )
            
            # Generate image if requested
            image_url = None
            if request.include_images and content.get("image_description"):
                try:
                    image_url = generate_image(
                        content["image_description"], 
                        word,
                        verbose=False
                    )
                except Exception as e:
                    logger.warning(f"⚠️  Image generation failed for {word}: {e}")
                    # Continue without image
            
            # Convert related_words list to JSON string
            related_words_list = content.get("related_words", [])
            related_words_json = json.dumps(related_words_list) if related_words_list else None
            
            # Create flashcard
            flashcard_data = schemas.FlashcardCreate(
                language_id=request.language_id,
                word_or_phrase=word,
                definition=content.get("definition", ""),
                etymology=content.get("etymology", ""),
                english_cognates=content.get("english_cognates", ""),
                related_words=related_words_json,
                image_url=image_url,
                image_description=content.get("image_description", ""),
                source="ai_generated_batch"
            )
            
            flashcard = crud.create_flashcard(db=db, flashcard=flashcard_data)
            flashcard_ids.append(flashcard.id)
            successful += 1
            
            logger.info(f"✅ Created flashcard {index}/{len(request.words)}: {word} (ID: {flashcard.id})")
            
        except Exception as e:
            logger.error(f"❌ Failed to generate flashcard for {word}: {e}")
            errors.append({
                "word": word,
                "error": str(e)
            })
            failed += 1
            continue
    
    logger.info(f"🎉 Batch generation complete: {successful} successful, {failed} failed")
    
    return BatchGenerateResponse(
        total_requested=len(request.words),
        successful=successful,
        failed=failed,
        flashcard_ids=flashcard_ids,
        errors=errors
    )
