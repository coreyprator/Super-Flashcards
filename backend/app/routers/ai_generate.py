# backend/app/routers/ai_generate.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import json
import os
import logging
import traceback
from datetime import datetime

from app import crud, schemas
from app.database import get_db

router = APIRouter()

# Configure logging
logger = logging.getLogger(__name__)

# OpenAI client will be initialized on first use
client = None

def get_openai_client():
    """Initialize OpenAI client on first use"""
    global client
    if client is None:
        from openai import OpenAI
        import httpx
        
        # Get API key and strip any whitespace (trailing spaces cause httpx header errors)
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        logger.info(f"Initializing OpenAI client with key: {api_key[:20] if api_key else 'NONE'}...")
        
        # Create httpx client explicitly to avoid proxy configuration issues
        http_client = httpx.Client(
            timeout=httpx.Timeout(60.0, connect=10.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
        
        client = OpenAI(
            api_key=api_key,
            http_client=http_client
        )
        logger.info("OpenAI client initialized successfully")
    return client

def generate_flashcard_content(word_or_phrase: str, language_code: str, user_id: str, db: Session, verbose: bool = False) -> dict:
    """Generate flashcard content using OpenAI GPT-4"""
    
    if verbose:
        logger.info(f"=== AI Generation Started ===")
        logger.info(f"Word: {word_or_phrase}, Language: {language_code}, User: {user_id}")
    
    # Get language
    language = crud.get_language_by_code(db, language_code)
    if not language:
        error_msg = f"Language {language_code} not found"
        logger.error(error_msg)
        raise HTTPException(status_code=404, detail=error_msg)
    
    if verbose:
        logger.info(f"Language found: {language.name} (ID: {language.id})")
    
    # Determine instruction language for this user + language
    instruction_lang_code = crud.get_instruction_language(db, user_id, str(language.id))
    instruction_lang = crud.get_language_by_code(db, instruction_lang_code)
    instruction_lang_name = instruction_lang.name if instruction_lang else "English"
    
    if verbose:
        logger.info(f"Instruction language: {instruction_lang_name} ({instruction_lang_code})")
    
    # Build prompt with instruction language
    prompt = f"""Create a language learning flashcard for the {language.name} word/phrase: "{word_or_phrase}"

IMPORTANT: All explanations must be written in {instruction_lang_name}. Do not use English unless {instruction_lang_name} is English.

Provide the following in JSON format:
1. definition: A clear definition or context example in {instruction_lang_name} (2-3 sentences)
2. etymology: The word's origin explained in {instruction_lang_name} (Latin, Greek, or other roots if applicable)
3. english_cognates: Related English words or cognates (comma-separated, these can be in English)
4. related_words: 2-3 related {language.name} words or expressions (as array)
5. image_description: A detailed description for generating an image (for DALL-E, in English)

Format your response as valid JSON only, no additional text:
{{
  "definition": "...",
  "etymology": "...",
  "english_cognates": "...",
  "related_words": ["...", "...", "..."],
  "image_description": "..."
}}"""

    if verbose:
        logger.info(f"Prompt length: {len(prompt)} characters")

    try:
        if verbose:
            logger.info("Calling OpenAI API...")
            logger.info(f"Model: gpt-4-turbo-preview, Temperature: 0.7, Max tokens: 800")
        
        response = get_openai_client().chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a language learning expert who creates detailed, educational flashcards."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        if verbose:
            logger.info(f"OpenAI API call successful. Response received.")
            logger.info(f"Usage: {response.usage if hasattr(response, 'usage') else 'N/A'}")
        
        content = response.choices[0].message.content.strip()
        
        if verbose:
            logger.info(f"Raw response length: {len(content)} characters")
            logger.info(f"Raw response preview: {content[:200]}...")
        
        # Remove markdown code blocks if present
        if content.startswith("```json"):
            content = content[7:]
            if verbose:
                logger.info("Removed ```json prefix")
        if content.startswith("```"):
            content = content[3:]
            if verbose:
                logger.info("Removed ``` prefix")
        if content.endswith("```"):
            content = content[:-3]
            if verbose:
                logger.info("Removed ``` suffix")
        content = content.strip()
        
        if verbose:
            logger.info(f"Cleaned response: {content[:200]}...")
        
        # Parse JSON
        result = json.loads(content)
        
        if verbose:
            logger.info(f"JSON parsed successfully. Keys: {list(result.keys())}")
            logger.info("=== AI Generation Complete ===")
        
        return result
        
    except json.JSONDecodeError as e:
        error_detail = f"Failed to parse AI response: {str(e)}\nContent: {content[:500]}"
        logger.error(error_detail)
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_detail)
    except Exception as e:
        error_detail = f"AI generation failed: {type(e).__name__}: {str(e)}"
        logger.error(error_detail)
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_detail)

def generate_image(image_description: str, word: str, verbose: bool = False) -> str:
    """
    Generate an image using DALL-E, save locally, and upload to Cloud Storage
    Returns the image URL path or None if failed
    """
    import requests
    import uuid
    from pathlib import Path
    from google.cloud import storage
    
    try:
        if verbose:
            logger.info(f"🔍 VERBOSE: === Starting Image Generation ===")
            logger.info(f"🔍 VERBOSE: Word: {word}")
            logger.info(f"🔍 VERBOSE: Description: {image_description}")
        
        # Generate image with DALL-E
        prompt = f"Educational illustration for language learning: {image_description}. Simple, clear, educational style."
        
        if verbose:
            logger.info(f"🔍 VERBOSE: Calling DALL-E 3...")
            logger.info(f"🔍 VERBOSE: Prompt: {prompt}")
        
        response = get_openai_client().images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1
        )
        
        # Get the temporary URL from DALL-E
        dalle_url = response.data[0].url
        
        if verbose:
            logger.info(f"🔍 VERBOSE: DALL-E response received")
            logger.info(f"🔍 VERBOSE: Image URL: {dalle_url[:100]}...")
        
        # Download the image
        if verbose:
            logger.info(f"🔍 VERBOSE: Downloading image from DALL-E...")
        
        image_response = requests.get(dalle_url, timeout=60)
        image_response.raise_for_status()
        image_data = image_response.content
        
        if verbose:
            logger.info(f"🔍 VERBOSE: Downloaded {len(image_data)} bytes")
        
        # Generate unique filename: word_uuid.png
        safe_word = "".join(c for c in word if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_word = safe_word.replace(' ', '_')[:50]
        filename = f"{safe_word}_{uuid.uuid4().hex[:8]}.png"
        
        # Upload to Cloud Storage
        try:
            if verbose:
                logger.info(f"🔍 VERBOSE: Uploading to Cloud Storage...")
            
            storage_client = storage.Client()
            bucket = storage_client.bucket("super-flashcards-media")
            blob = bucket.blob(f"images/{filename}")
            
            # Upload the image
            blob.upload_from_string(image_data, content_type="image/png")
            blob.make_public()
            
            if verbose:
                logger.info(f"🔍 VERBOSE: ✓ Uploaded to Cloud Storage: images/{filename}")
            
            # Return the URL path (will be proxied by /images/* endpoint)
            return f"/images/{filename}"
            
        except Exception as storage_error:
            # If Cloud Storage upload fails, try saving locally as fallback
            logger.warning(f"⚠️ Cloud Storage upload failed: {storage_error}, saving locally")
            
            images_dir = Path(__file__).parent.parent.parent.parent / "images"
            images_dir.mkdir(exist_ok=True)
            image_path = images_dir / filename
            
            with open(image_path, 'wb') as f:
                f.write(image_data)
            
            if image_path.exists() and image_path.stat().st_size > 0:
                if verbose:
                    logger.info(f"🔍 VERBOSE: ✓ Image saved locally (fallback): {filename}")
                return f"/images/{filename}"
            else:
                logger.error("❌ Image file was not created or is empty")
                return None
        
    except requests.exceptions.RequestException as e:
        error_msg = f"Network error downloading image: {str(e)}"
        logger.error(f"❌ {error_msg}")
        if verbose:
            logger.error(f"🔍 VERBOSE: Exception type: {type(e).__name__}")
            logger.error(f"🔍 VERBOSE: Traceback: {traceback.format_exc()}")
        return None
    except Exception as e:
        error_msg = f"Image generation/download failed: {str(e)}"
        logger.error(f"❌ {error_msg}")
        if verbose:
            logger.error(f"🔍 VERBOSE: Exception type: {type(e).__name__}")
            logger.error(f"🔍 VERBOSE: Traceback: {traceback.format_exc()}")
        return None

@router.post("/generate", response_model=schemas.Flashcard)
def generate_ai_flashcard(
    request: schemas.AIGenerateRequest,
    verbose: bool = Query(False, description="Enable verbose logging for debugging"),
    db: Session = Depends(get_db)
):
    """
    Generate a flashcard using OpenAI API and save it to the database
    
    Args:
        request: Flashcard generation request
        verbose: Enable detailed logging (append ?verbose=true to URL)
        db: Database session
    """
    if verbose:
        logger.info(f"=== VERBOSE MODE ENABLED ===")
        logger.info(f"Request: word='{request.word_or_phrase}', language_id={request.language_id}, include_image={request.include_image}")
    
    try:
        # TODO: User management - Phase 1 is single-user, skip user table for now
        # For now, use a dummy user ID - get_instruction_language will default to 'en'
        dummy_user_id = "00000000-0000-0000-0000-000000000000"
        
        # Get language info
        language = crud.get_language(db, str(request.language_id))
        if not language:
            raise HTTPException(status_code=404, detail="Language not found")
        
        if verbose:
            logger.info(f"Language: {language.name} (code: {language.code})")
        
        # Generate content with user's instruction language preferences
        content = generate_flashcard_content(
            request.word_or_phrase, 
            language.code, 
            dummy_user_id,
            db,
            verbose=verbose
        )
        
        if verbose:
            logger.info(f"Content generated. Definition length: {len(content.get('definition', ''))}")
        
        # Generate image if requested
        image_url = None
        if request.include_image and content.get("image_description"):
            if verbose:
                logger.info(f"🔍 VERBOSE: Generating image for: {content['image_description']}")
            image_url = generate_image(content["image_description"], request.word_or_phrase, verbose=verbose)
            if verbose:
                if image_url:
                    logger.info(f"🔍 VERBOSE: ✓ Image generated: {image_url}")
                else:
                    logger.warning(f"🔍 VERBOSE: ⚠ Image generation failed, continuing without image")

        
        # Create flashcard
        flashcard_data = schemas.FlashcardCreate(
            language_id=request.language_id,
            word_or_phrase=request.word_or_phrase,
            definition=content.get("definition", ""),
            etymology=content.get("etymology", ""),
            english_cognates=content.get("english_cognates", ""),
            related_words=json.dumps(content.get("related_words", [])),
            image_url=image_url,
            image_description=content.get("image_description", ""),
            source="ai_generated"
        )
        
        if verbose:
            logger.info(f"🔍 VERBOSE: Creating flashcard in database...")
            logger.info(f"🔍 VERBOSE: Data: word='{flashcard_data.word_or_phrase}', language_id={flashcard_data.language_id}")
        
        result = crud.create_flashcard(db=db, flashcard=flashcard_data)
        
        if verbose:
            logger.info(f"🔍 VERBOSE: ✅ Flashcard created successfully!")
            logger.info(f"🔍 VERBOSE: Flashcard ID: {result.id}")
            logger.info(f"🔍 VERBOSE: === AI Generation Complete ===")
        
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is (already have proper error messages)
        if verbose:
            logger.error(f"🔍 VERBOSE: HTTPException raised - status {e.status_code if hasattr(e, 'status_code') else 'unknown'}")
        raise
    except Exception as e:
        error_detail = f"Unexpected error in generate_ai_flashcard: {type(e).__name__}: {str(e)}"
        logger.error(f"❌ {error_detail}")
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        if verbose:
            logger.error(f"🔍 VERBOSE: Exception type: {type(e).__name__}")
            logger.error(f"🔍 VERBOSE: Exception args: {e.args}")
        raise HTTPException(status_code=500, detail=error_detail)


@router.post("/preview")
def preview_ai_flashcard(request: schemas.AIGenerateRequest, db: Session = Depends(get_db)):

    """
    Generate flashcard content without saving (for preview/editing)
    """
    # TODO: User management - Phase 1 is single-user, skip user table for now
    # For now, use a dummy user ID - get_instruction_language will default to 'en'
    dummy_user_id = "00000000-0000-0000-0000-000000000000"
    
    # Get language info
    language = crud.get_language(db, str(request.language_id))
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Generate content with user's instruction language preferences
    content = generate_flashcard_content(
        request.word_or_phrase, 
        language.code, 
        dummy_user_id,
        db
    )
    
    # Generate image if requested
    image_url = None
    if request.include_image and content.get("image_description"):
        image_url = generate_image(content["image_description"], request.word_or_phrase)
    
    return {
        "word_or_phrase": request.word_or_phrase,
        "definition": content.get("definition", ""),
        "etymology": content.get("etymology", ""),
        "english_cognates": content.get("english_cognates", ""),
        "related_words": content.get("related_words", []),
        "image_url": image_url,
        "image_description": content.get("image_description", "")
    }

@router.post("/image")
def generate_image_only(
    word_or_phrase: str = Query(..., description="Word or phrase to generate image for"),
    language_id: str = Query(..., description="Language ID"),
    db: Session = Depends(get_db)
):
    """
    Generate only an image for a word/phrase without full flashcard content
    """
    # Check for OpenAI API key first
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.")
    
    # Get language info
    language = crud.get_language(db, language_id)
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Create a simple image description based on the word and language
    image_description = f"Educational illustration for learning the {language.name} word '{word_or_phrase}'. Simple, clear, educational style showing the concept or meaning of the word."
    
    # Generate image
    image_url = generate_image(image_description, word_or_phrase)
    
    if not image_url:
        raise HTTPException(status_code=500, detail="Failed to generate image")
    
    return {
        "image_url": image_url,
        "image_description": image_description
    }

@router.post("/fix-broken-images")
def fix_broken_images(db: Session = Depends(get_db)):
    """
    Fix flashcards with expired DALL-E URLs by regenerating local images
    """
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Find flashcards with broken DALL-E URLs
    flashcards = db.query(crud.models.Flashcard).filter(
        crud.models.Flashcard.image_url.like('%oaidalleapiprodscus.blob.core.windows.net%')
    ).all()
    
    results = []
    for flashcard in flashcards:
        logger.info(f"Fixing image for: {flashcard.word_or_phrase}")
        
        if flashcard.image_description:
            # Regenerate image
            new_image_url = generate_image(flashcard.image_description, flashcard.word_or_phrase)
            
            if new_image_url:
                # Update the flashcard
                flashcard.image_url = new_image_url
                db.commit()
                results.append({
                    "word": flashcard.word_or_phrase,
                    "status": "fixed",
                    "new_url": new_image_url
                })
            else:
                results.append({
                    "word": flashcard.word_or_phrase,
                    "status": "failed",
                    "error": "Could not generate new image"
                })
        else:
            results.append({
                "word": flashcard.word_or_phrase,
                "status": "skipped",
                "error": "No image description available"
            })
    
    return {
        "message": f"Processed {len(flashcards)} flashcards with broken images",
        "results": results
    }