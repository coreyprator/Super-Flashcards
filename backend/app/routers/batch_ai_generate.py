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
import time
import traceback

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
    word_results: List[dict]  # NEW: Detailed status for each word

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
        word_results = []  # NEW: Track status for each word
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
                    error_msg = "Duplicate flashcard already exists"
                    errors.append({
                        "word": word,
                        "error": error_msg,
                        "flashcard_id": str(existing.id)  # Convert UUID to string
                    })
                    word_results.append({
                        "word": word,
                        "status": "failed",
                        "error": error_msg
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
                    # CREATE DEBUG LOG ENTRY - Image generation started
                    image_log_id = str(models.generate_uuid())
                    start_time = time.time()
                    
                    db.add(models.APIDebugLog(
                        id=image_log_id,
                        operation_type='image_generation',
                        word=word,
                        status='started',
                        step='calling_dalle',
                        input_data=json.dumps({
                            'image_description': content["image_description"],
                            'word': word,
                            'include_images': request.include_images
                        }),
                        api_provider='openai',
                        api_model='dall-e-3'
                    ))
                    db.commit()
                    
                    try:
                        logger.info(f"🎨 ===== IMAGE GENERATION START =====")
                        logger.info(f"🎨 Word: '{word}'")
                        logger.info(f"🎨 Include images: {request.include_images}")
                        logger.info(f"🎨 Has image_description: {bool(content.get('image_description'))}")
                        logger.info(f"🎨 Image description: {content.get('image_description', 'N/A')[:200]}")
                        logger.info(f"🎨 Calling generate_image() with verbose=True...")
                        
                        image_url = generate_image(
                            content["image_description"], 
                            word,
                            verbose=True  # VERBOSE MODE ON
                        )
                        
                        duration_ms = int((time.time() - start_time) * 1000)
                        
                        logger.info(f"✅ IMAGE GENERATION SUCCESS")
                        logger.info(f"✅ Image URL: {image_url}")
                        logger.info(f"✅ Duration: {duration_ms}ms")
                        logger.info(f"🎨 ===== IMAGE GENERATION END =====")
                        
                        # UPDATE DEBUG LOG - Success
                        log_entry = db.query(models.APIDebugLog).filter(models.APIDebugLog.id == image_log_id).first()
                        if log_entry:
                            log_entry.status = 'success'
                            log_entry.step = 'completed'
                            log_entry.output_data = json.dumps({'image_url': image_url})
                            log_entry.duration_ms = duration_ms
                            db.commit()
                        
                    except Exception as e:
                        duration_ms = int((time.time() - start_time) * 1000)
                        error_trace = traceback.format_exc()
                        
                        logger.error(f"❌ IMAGE GENERATION FAILED")
                        logger.error(f"❌ Word: '{word}'")
                        logger.error(f"❌ Error: {e}")
                        logger.error(f"❌ Error type: {type(e).__name__}")
                        logger.error(f"❌ Duration: {duration_ms}ms")
                        logger.error(f"❌ Traceback:\n{error_trace}")
                        logger.info(f"🎨 ===== IMAGE GENERATION END (FAILED) =====")
                        
                        # UPDATE DEBUG LOG - Failed
                        log_entry = db.query(models.APIDebugLog).filter(models.APIDebugLog.id == image_log_id).first()
                        if log_entry:
                            log_entry.status = 'failed'
                            log_entry.step = 'error'
                            log_entry.error_message = str(e)
                            log_entry.error_traceback = error_trace
                            log_entry.duration_ms = duration_ms
                            db.commit()
                        
                        # Continue without image
                else:
                    logger.warning(f"⚠️  Skipping image generation for '{word}'")
                    logger.warning(f"⚠️  request.include_images: {request.include_images}")
                    logger.warning(f"⚠️  content.get('image_description'): {content.get('image_description')}")
                    
                    # Log the skip reason
                    db.add(models.APIDebugLog(
                        id=str(models.generate_uuid()),
                        operation_type='image_generation',
                        word=word,
                        status='skipped',
                        step='validation',
                        input_data=json.dumps({
                            'include_images': request.include_images,
                            'has_image_description': bool(content.get('image_description')),
                            'image_description': content.get('image_description', '')[:500] if content.get('image_description') else None
                        }),
                        error_message=f"Skipped: include_images={request.include_images}, has_description={bool(content.get('image_description'))}"
                    ))
                    db.commit()
                
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
                flashcard_id_str = str(flashcard.id)
                flashcard_ids.append(flashcard_id_str)  # Convert UUID to string
                successful += 1
                
                # Track word result
                word_results.append({
                    "word": word,
                    "status": "success",
                    "flashcard_id": flashcard_id_str
                })
                
                logger.info(f"✅ Created flashcard {index}/{len(request.words)}: '{word}' (ID: {flashcard.id})")
                
            except Exception as e:
                logger.error(f"❌ Failed to generate flashcard for '{word}': {e}")
                logger.error(f"❌ Exception type: {type(e).__name__}")
                logger.error(f"❌ Exception details: {str(e)}")
                import traceback
                logger.error(f"❌ Traceback: {traceback.format_exc()}")
                error_msg = str(e)
                errors.append({
                    "word": word,
                    "error": error_msg
                })
                word_results.append({
                    "word": word,
                    "status": "failed",
                    "error": error_msg
                })
                failed += 1
                continue
        
        logger.info("=" * 80)
        logger.info("🎉 BATCH GENERATION COMPLETE")
        logger.info(f"✅ Successful: {successful}")
        logger.info(f"❌ Failed: {failed}")
        logger.info(f"📊 Total flashcard IDs: {len(flashcard_ids)}")
        logger.info(f"📊 Total errors: {len(errors)}")
        logger.info(f"📊 Word results: {len(word_results)}")
        logger.info("=" * 80)
        
        return BatchGenerateResponse(
            total_requested=len(request.words),
            successful=successful,
            failed=failed,
            flashcard_ids=flashcard_ids,
            errors=errors,
            word_results=word_results  # NEW: Return detailed word status
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

