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
    
    logger.info("=" * 80)
    logger.info("🚀 BATCH GENERATE REQUEST RECEIVED")
    logger.info(f"📊 Words count: {len(request.words)}")
    logger.info(f"📊 Words: {request.words}")
    logger.info(f"📊 Language ID: {request.language_id}")
    logger.info(f"📊 Include images: {request.include_images}")
    logger.info("=" * 80)
    
    try:
        # Validate language
        logger.info(f"🔍 Validating language ID: {request.language_id}")
        language = crud.get_language(db, request.language_id)
        if not language:
            logger.error(f"❌ Language not found: {request.language_id}")
            raise HTTPException(status_code=404, detail=f"Language not found: {request.language_id}")
        
        logger.info(f"✅ Language validated: {language.name} (code: {language.code})")
        
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
                logger.info(f"📝 Processing word {index}/{len(request.words)}: '{word}'")
                
                # Check for duplicates
                logger.info(f"🔍 Checking for duplicate: '{word}'")
                existing = db.query(models.Flashcard).filter(
                    models.Flashcard.word_or_phrase == word,
                    models.Flashcard.language_id == request.language_id
                ).first()
                
                if existing:
                    logger.warning(f"⚠️  Duplicate found: '{word}' (ID: {existing.id})")
                    errors.append({
                        "word": word,
                        "error": "Duplicate flashcard already exists",
                        "flashcard_id": existing.id
                    })
                    failed += 1
                    continue
                
                # Generate AI content
                logger.info(f"🤖 Calling OpenAI for content generation: '{word}'")
                content = generate_flashcard_content(
                    word, 
                    language.code, 
                    dummy_user_id,
                    db,
                    verbose=False
                )
                logger.info(f"✅ AI content generated for '{word}'")
                logger.info(f"   - Definition: {content.get('definition', '')[:50]}...")
                logger.info(f"   - Has etymology: {bool(content.get('etymology'))}")
                logger.info(f"   - Has image_description: {bool(content.get('image_description'))}")
                
                # Generate image if requested
                image_url = None
                if request.include_images and content.get("image_description"):
                    try:
                        logger.info(f"🎨 Generating image for '{word}'")
                        image_url = generate_image(
                            content["image_description"], 
                            word,
                            verbose=False
                        )
                        logger.info(f"✅ Image generated: {image_url}")
                    except Exception as e:
                        logger.warning(f"⚠️  Image generation failed for '{word}': {e}")
                        # Continue without image
                
                # Convert related_words list to JSON string
                related_words_list = content.get("related_words", [])
                related_words_json = json.dumps(related_words_list) if related_words_list else None
                logger.info(f"📝 Related words for '{word}': {related_words_json}")
                
                # Create flashcard
                logger.info(f"💾 Creating flashcard in database for '{word}'")
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
                
                logger.info(f"✅ Created flashcard {index}/{len(request.words)}: '{word}' (ID: {flashcard.id})")
                
            except Exception as e:
                logger.error(f"❌ Failed to generate flashcard for '{word}': {e}")
                logger.error(f"❌ Exception type: {type(e).__name__}")
                logger.error(f"❌ Exception details: {str(e)}")
                import traceback
                logger.error(f"❌ Traceback: {traceback.format_exc()}")
                errors.append({
                    "word": word,
                    "error": str(e)
                })
                failed += 1
                continue
        
        logger.info("=" * 80)
        logger.info("🎉 BATCH GENERATION COMPLETE")
        logger.info(f"✅ Successful: {successful}")
        logger.info(f"❌ Failed: {failed}")
        logger.info(f"📊 Total flashcard IDs: {len(flashcard_ids)}")
        logger.info(f"📊 Total errors: {len(errors)}")
        logger.info("=" * 80)
        
        return BatchGenerateResponse(
            total_requested=len(request.words),
            successful=successful,
            failed=failed,
            flashcard_ids=flashcard_ids,
            errors=errors
        )
    
    except Exception as e:
        logger.error("=" * 80)
        logger.error("❌ CRITICAL ERROR IN BATCH GENERATE")
        logger.error(f"❌ Exception type: {type(e).__name__}")
        logger.error(f"❌ Exception message: {str(e)}")
        import traceback
        logger.error(f"❌ Full traceback:")
        logger.error(traceback.format_exc())
        logger.error("=" * 80)
        raise HTTPException(
            status_code=500,
            detail=f"Batch generation failed: {type(e).__name__}: {str(e)}"
        )

