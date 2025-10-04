# backend/app/routers/ai_generate.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import os
from openai import OpenAI

from app import crud, schemas
from app.database import get_db

router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_flashcard_content(word_or_phrase: str, language_code: str) -> dict:
    """
    Generate flashcard content using OpenAI API
    Returns dict with definition, etymology, cognates, related_words
    """
    
    # Map language codes to full names
    language_names = {
        "fr": "French",
        "el": "Greek",
        "es": "Spanish",
        "de": "German",
        "it": "Italian"
    }
    language_name = language_names.get(language_code, language_code)
    
    prompt = f"""Create a language learning flashcard for the {language_name} word/phrase: "{word_or_phrase}"

Provide the following in JSON format:
1. definition: A clear definition or context example in {language_name} (2-3 sentences)
2. etymology: The word's origin (Latin, Greek, or other roots if applicable)
3. english_cognates: Related English words or cognates (comma-separated)
4. related_words: 2-3 related {language_name} words or expressions (as array)
5. image_description: A detailed description for generating an image (for DALL-E)

Format your response as valid JSON only, no additional text:
{{
  "definition": "...",
  "etymology": "...",
  "english_cognates": "...",
  "related_words": ["...", "...", "..."],
  "image_description": "..."
}}"""

    try:
        response = client.chat.completions.create(
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
        response = client.images.generate(
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
    # Get language info
    language = crud.get_language(db, request.language_id)
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Generate content
    content = generate_flashcard_content(request.word_or_phrase, language.code)
    
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
    # Get language info
    language = crud.get_language(db, request.language_id)
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # Generate content
    content = generate_flashcard_content(request.word_or_phrase, language.code)
    
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