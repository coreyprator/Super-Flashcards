# backend/app/routers/ai_generate.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import json
import os

from app import crud, schemas
from app.database import get_db

router = APIRouter()

# OpenAI client will be initialized on first use
client = None

def get_openai_client():
    """Initialize OpenAI client on first use"""
    global client
    if client is None:
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return client

def generate_flashcard_content(word_or_phrase: str, language_code: str, user_id: str, db: Session) -> dict:
    """Generate flashcard content using OpenAI GPT-4"""
    
    # Get language
    language = crud.get_language_by_code(db, language_code)
    if not language:
        raise HTTPException(status_code=404, detail=f"Language {language_code} not found")
    
    # Determine instruction language for this user + language
    instruction_lang_code = crud.get_instruction_language(db, user_id, str(language.id))
    instruction_lang = crud.get_language_by_code(db, instruction_lang_code)
    instruction_lang_name = instruction_lang.name if instruction_lang else "English"
    
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

    try:
        response = get_openai_client().chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a language learning expert who creates detailed, educational flashcards."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        content = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        # Parse JSON
        result = json.loads(content)
        return result
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

def generate_image(image_description: str, word: str) -> str:
    """
    Generate an image using DALL-E and download it locally
    Returns the local image URL path or None if failed
    """
    import requests
    import uuid
    from pathlib import Path
    import logging
    
    # Set up logging for debugging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Starting image generation for: {word}")
        
        # Generate image with DALL-E
        response = get_openai_client().images.generate(
            model="dall-e-3",
            prompt=f"Educational illustration for language learning: {image_description}. Simple, clear, educational style.",
            size="1024x1024",
            quality="standard",
            n=1
        )
        
        # Get the temporary URL from DALL-E
        dalle_url = response.data[0].url
        logger.info(f"DALL-E generated image URL: {dalle_url}")
        
        # Download the image
        logger.info("Downloading image from DALL-E...")
        image_response = requests.get(dalle_url, timeout=60)  # Increased timeout
        image_response.raise_for_status()
        logger.info(f"Downloaded {len(image_response.content)} bytes")
        
        # Create images directory if it doesn't exist
        # Path should be: Super-Flashcards/images (not backend/images)
        images_dir = Path(__file__).parent.parent.parent.parent / "images"
        images_dir.mkdir(exist_ok=True)
        logger.info(f"Images directory: {images_dir}")
        
        # Generate unique filename: word_uuid.png
        # Sanitize word for filename (remove special characters)
        safe_word = "".join(c for c in word if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_word = safe_word.replace(' ', '_')[:50]  # Limit length
        filename = f"{safe_word}_{uuid.uuid4().hex[:8]}.png"
        
        # Save image to disk
        image_path = images_dir / filename
        logger.info(f"Saving image to: {image_path}")
        
        with open(image_path, 'wb') as f:
            f.write(image_response.content)
        
        # Verify file was created and has content
        if image_path.exists() and image_path.stat().st_size > 0:
            logger.info(f"Image successfully saved: {filename}")
            # Return relative URL path that FastAPI will serve
            return f"/images/{filename}"
        else:
            logger.error("Image file was not created or is empty")
            return None
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error downloading image: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Image generation/download failed: {str(e)}")
        return None

@router.post("/generate", response_model=schemas.Flashcard)
def generate_ai_flashcard(
    request: schemas.AIGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a flashcard using OpenAI API and save it to the database
    """
    # Get default user (Phase 1)
    user = crud.get_or_create_default_user(db)
    
    # Get language info
    language = crud.get_language(db, str(request.language_id))
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Generate content with user's instruction language preferences
    content = generate_flashcard_content(
        request.word_or_phrase, 
        language.code, 
        str(user.id),
        db
    )
    
    # Generate image if requested
    image_url = None
    if request.include_image and content.get("image_description"):
        image_url = generate_image(content["image_description"], request.word_or_phrase)
    
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
    
    return crud.create_flashcard(db=db, flashcard=flashcard_data)

@router.post("/preview")
def preview_ai_flashcard(request: schemas.AIGenerateRequest, db: Session = Depends(get_db)):
    """
    Generate flashcard content without saving (for preview/editing)
    """
    # Get default user (Phase 1)
    user = crud.get_or_create_default_user(db)
    
    # Get language info
    language = crud.get_language(db, str(request.language_id))
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Generate content with user's instruction language preferences
    content = generate_flashcard_content(
        request.word_or_phrase, 
        language.code, 
        str(user.id),
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