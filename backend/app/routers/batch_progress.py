"""
Batch Progress Tracking with Server-Sent Events (SSE)
Provides real-time progress updates during batch AI generation
"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import asyncio
import json
import time
import logging
from typing import AsyncGenerator

from ..database import get_db
from .. import crud, models
from .ai_generate import generate_flashcard_content, generate_image

router = APIRouter()
logger = logging.getLogger(__name__)

# Global dictionary to track batch progress
# Key: batch_id, Value: dict with progress info
batch_progress = {}


async def generate_batch_with_progress(
    batch_id: str,
    words: list,
    language_id: str,
    include_images: bool,
    db: Session
) -> AsyncGenerator[str, None]:
    """
    Generate flashcards with real-time progress updates via SSE.
    Yields JSON messages with progress information.
    """
    
    total_words = len(words)
    start_time = time.time()
    
    # Initialize progress tracking
    batch_progress[batch_id] = {
        'total': total_words,
        'completed': 0,
        'current_word': None,
        'start_time': start_time
    }
    
    try:
        logger.info(f"🚀 Starting batch {batch_id}: {total_words} words")
        
        # Validate language
        language = crud.get_language(db, language_id)
        if not language:
            yield f"data: {json.dumps({'error': f'Language not found: {language_id}'})}\n\n"
            return
        
        # Track results
        flashcard_ids = []
        errors = []
        word_results = []
        successful = 0
        failed = 0
        
        # TODO: Use dummy user ID for now (Phase 1 single-user)
        dummy_user_id = "00000000-0000-0000-0000-000000000000"
        
        # Process each word with progress updates
        for index, word in enumerate(words, 1):
            word_start_time = time.time()
            batch_progress[batch_id]['current_word'] = word
            batch_progress[batch_id]['completed'] = index - 1
            
            # Calculate ETA
            elapsed = time.time() - start_time
            avg_time_per_word = elapsed / index if index > 0 else 0
            remaining_words = total_words - index + 1
            eta_seconds = avg_time_per_word * remaining_words
            
            # Send progress update
            progress_data = {
                'status': 'processing',
                'current': index,
                'total': total_words,
                'word': word,
                'percentage': int((index - 1) / total_words * 100),
                'eta_seconds': int(eta_seconds),
                'successful': successful,
                'failed': failed
            }
            yield f"data: {json.dumps(progress_data)}\n\n"
            
            try:
                logger.info(f"📝 [{index}/{total_words}] Processing: '{word}'")
                
                # Check for duplicates
                existing = db.query(models.Flashcard).filter(
                    models.Flashcard.word_or_phrase == word,
                    models.Flashcard.language_id == language_id
                ).first()
                
                if existing:
                    logger.warning(f"⚠️  Duplicate: '{word}'")
                    error_msg = "Duplicate flashcard already exists"
                    errors.append({
                        "word": word,
                        "error": error_msg,
                        "flashcard_id": str(existing.id)
                    })
                    word_results.append({
                        "word": word,
                        "status": "failed",
                        "error": error_msg
                    })
                    failed += 1
                    
                    # Send update for duplicate
                    yield f"data: {json.dumps({'status': 'word_failed', 'word': word, 'reason': 'duplicate'})}\n\n"
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
                if include_images and content.get("image_description"):
                    try:
                        logger.info(f"🎨 Generating image for '{word}'")
                        image_url = generate_image(
                            content["image_description"], 
                            word,
                            verbose=False
                        )
                        logger.info(f"✅ Image generated for '{word}'")
                    except Exception as e:
                        logger.error(f"❌ Image generation failed for '{word}': {e}")
                
                # Create flashcard
                related_words_list = content.get("related_words", [])
                related_words_json = json.dumps(related_words_list) if related_words_list else None
                
                from ..schemas import FlashcardCreate
                flashcard_data = FlashcardCreate(
                    language_id=language_id,
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
                flashcard_ids.append(flashcard_id_str)
                successful += 1
                
                word_results.append({
                    "word": word,
                    "status": "success",
                    "flashcard_id": flashcard_id_str
                })
                
                word_duration = time.time() - word_start_time
                logger.info(f"✅ [{index}/{total_words}] '{word}' completed in {word_duration:.1f}s")
                
                # Send success update
                yield f"data: {json.dumps({'status': 'word_complete', 'word': word, 'has_image': bool(image_url)})}\n\n"
                
            except Exception as e:
                logger.error(f"❌ Error processing '{word}': {e}")
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
                
                # Send error update
                yield f"data: {json.dumps({'status': 'word_failed', 'word': word, 'reason': 'error'})}\n\n"
        
        # Send final completion message
        total_duration = time.time() - start_time
        completion_data = {
            'status': 'complete',
            'total_requested': total_words,
            'successful': successful,
            'failed': failed,
            'flashcard_ids': flashcard_ids,
            'errors': errors,
            'word_results': word_results,
            'duration_seconds': int(total_duration)
        }
        yield f"data: {json.dumps(completion_data)}\n\n"
        
        logger.info(f"✅ Batch {batch_id} complete: {successful} succeeded, {failed} failed in {total_duration:.1f}s")
        
    except Exception as e:
        logger.error(f"❌ Batch {batch_id} failed: {e}")
        yield f"data: {json.dumps({'status': 'error', 'error': str(e)})}\n\n"
    
    finally:
        # Clean up progress tracking
        if batch_id in batch_progress:
            del batch_progress[batch_id]


@router.get("/batch-generate-stream")
async def batch_generate_stream(
    words: str,  # Comma-separated list
    language_id: str,
    include_images: bool = True,
    db: Session = Depends(get_db)
):
    """
    Stream batch generation progress via Server-Sent Events.
    
    Query params:
    - words: Comma-separated word list
    - language_id: UUID of target language
    - include_images: Whether to generate images (default: true)
    """
    
    # Generate unique batch ID
    import uuid
    batch_id = str(uuid.uuid4())
    
    # Parse words
    word_list = [w.strip() for w in words.split(',') if w.strip()]
    
    # ✅ VALIDATION: Enforce 50-card limit to prevent Cloud Run memory exhaustion
    MAX_CARDS_PER_BATCH = 50
    if len(word_list) > MAX_CARDS_PER_BATCH:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail=f"Batch size exceeds maximum of {MAX_CARDS_PER_BATCH} cards. Please reduce selection and process remaining cards in a separate batch."
        )
    
    logger.info(f"📡 SSE batch generation: {len(word_list)} words, batch_id: {batch_id}")
    
    return StreamingResponse(
        generate_batch_with_progress(
            batch_id=batch_id,
            words=word_list,
            language_id=language_id,
            include_images=include_images,
            db=db
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.get("/batch-progress/{batch_id}")
async def get_batch_progress(batch_id: str):
    """
    Get current progress for a batch (polling alternative to SSE).
    """
    if batch_id not in batch_progress:
        return {"status": "not_found"}
    
    progress = batch_progress[batch_id]
    elapsed = time.time() - progress['start_time']
    
    return {
        "status": "processing",
        "total": progress['total'],
        "completed": progress['completed'],
        "current_word": progress['current_word'],
        "elapsed_seconds": int(elapsed)
    }
