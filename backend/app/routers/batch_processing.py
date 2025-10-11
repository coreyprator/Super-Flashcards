"""
Batch Processing Router for Super-Flashcards
Handles batch creation of flashcards from selected vocabulary using OpenAI API.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import csv
import json
import asyncio
import logging
from pathlib import Path
import openai
from datetime import datetime

from app.database import get_db
from app.models import Flashcard, Language, User
from app.schemas import FlashcardCreate, BatchProcessRequest, BatchProcessResponse, BatchStatusResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/batch", tags=["batch_processing"])

# OpenAI API configuration
openai.api_key = "your-openai-api-key-here"  # TODO: Move to environment variable

class BatchProcessor:
    """Handles batch processing of vocabulary into flashcards."""
    
    def __init__(self, db: Session):
        self.db = db
        self.processing_status = {}
    
    async def process_vocabulary_batch(
        self, 
        selected_words: List[Dict], 
        user_id: str, 
        language_id: str,
        batch_id: str,
        max_words: Optional[int] = None
    ):
        """Process selected vocabulary into flashcards using OpenAI."""
        
        try:
            # Limit words for testing
            if max_words:
                selected_words = selected_words[:max_words]
            
            self.processing_status[batch_id] = {
                "status": "processing",
                "total_words": len(selected_words),
                "processed": 0,
                "successful": 0,
                "failed": 0,
                "start_time": datetime.now(),
                "flashcards": []
            }
            
            logger.info(f"Starting batch processing for {len(selected_words)} words")
            
            for i, word_data in enumerate(selected_words):
                try:
                    french_word = word_data['french_text']
                    frequency = word_data.get('frequency', 0)
                    
                    logger.info(f"Processing word {i+1}/{len(selected_words)}: {french_word}")
                    
                    # Generate translation and context using AI
                    translation_data = await self.generate_flashcard_content(french_word)
                    
                    if translation_data:
                        # Create flashcard in database
                        flashcard = await self.create_flashcard(
                            french_word=french_word,
                            english_translation=translation_data['translation'],
                            context=translation_data['context'],
                            example_sentence=translation_data.get('example', ''),
                            image_url=translation_data.get('image_url', ''),
                            user_id=user_id,
                            language_id=language_id,
                            frequency=frequency
                        )
                        
                        if flashcard:
                            self.processing_status[batch_id]["successful"] += 1
                            self.processing_status[batch_id]["flashcards"].append({
                                "id": str(flashcard.id),
                                "word_or_phrase": french_word,
                                "definition": translation_data['translation'],
                                "etymology": translation_data['context']
                            })
                            logger.info(f"✅ Created flashcard for: {french_word}")
                        else:
                            self.processing_status[batch_id]["failed"] += 1
                            logger.error(f"❌ Failed to create flashcard for: {french_word}")
                    else:
                        self.processing_status[batch_id]["failed"] += 1
                        logger.error(f"❌ Failed to generate content for: {french_word}")
                    
                    self.processing_status[batch_id]["processed"] += 1
                    
                    # Small delay to avoid rate limiting
                    await asyncio.sleep(0.5)
                    
                except Exception as e:
                    logger.error(f"Error processing word {french_word}: {str(e)}")
                    self.processing_status[batch_id]["failed"] += 1
                    self.processing_status[batch_id]["processed"] += 1
            
            # Mark as completed
            self.processing_status[batch_id]["status"] = "completed"
            self.processing_status[batch_id]["end_time"] = datetime.now()
            
            logger.info(f"Batch processing completed: {self.processing_status[batch_id]['successful']} successful, {self.processing_status[batch_id]['failed']} failed")
            
        except Exception as e:
            logger.error(f"Batch processing failed: {str(e)}")
            self.processing_status[batch_id]["status"] = "failed"
            self.processing_status[batch_id]["error"] = str(e)
    
    async def generate_flashcard_content(self, french_word: str) -> Optional[Dict]:
        """Generate flashcard content using the actual AI generation system."""
        
        try:
            # Import here to avoid circular imports
            from app.routers.ai_generate import generate_flashcard_content
            
            # Use the real AI generation function
            # Get French language ID (we know it's this from context)
            french_language_id = "9e4d5ca8-ffec-47b9-9943-5f2dd1093593"
            default_user_id = "default-user"  # We'll use a default user for batch processing
            
            # Call the real AI generation function
            ai_result = generate_flashcard_content(
                word_or_phrase=french_word,
                language_code="fr", 
                user_id=default_user_id,
                db=self.db
            )
            
            if ai_result and 'generated_content' in ai_result:
                content = ai_result['generated_content']
                return {
                    "translation": content.get('definition', f"[Translation for {french_word}]"),
                    "context": content.get('etymology', f"Etymology for {french_word}"),
                    "example": f"Example sentence with {french_word}",
                    "image_url": ai_result.get('image_url', None)
                }
            else:
                logger.warning(f"AI generation returned no content for {french_word}")
                return None
            
        except Exception as e:
            logger.error(f"Error generating AI content for {french_word}: {str(e)}")
            # Fallback to basic response if AI fails
            return {
                "translation": f"[AI generation failed for {french_word}]",
                "context": f"Please review and update this flashcard manually.",
                "example": f"Example needed for {french_word}"
            }
    
    async def create_flashcard(
        self, 
        french_word: str, 
        english_translation: str, 
        context: str,
        example_sentence: str,
        user_id: str, 
        language_id: str,
        frequency: int = 0,
        image_url: str = ""
    ) -> Optional[Flashcard]:
        """Create a flashcard in the database."""
        
        try:
            flashcard = Flashcard(
                word_or_phrase=french_word,
                definition=english_translation,
                etymology=context,
                source="batch_generated",
                user_id=user_id,
                language_id=language_id,
                image_url=image_url if image_url else None
            )
            
            self.db.add(flashcard)
            self.db.commit()
            self.db.refresh(flashcard)
            
            return flashcard
            
        except Exception as e:
            logger.error(f"Error creating flashcard: {str(e)}")
            self.db.rollback()
            return None

def parse_selected_words_csv(file_path: str) -> List[Dict]:
    """Parse the CSV file with selected words (marked with X)."""
    
    selected_words = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                # Check if word is selected (X or x in first column)
                if row.get('X', '').lower() == 'x':
                    selected_words.append({
                        'french_text': row.get('french_text', ''),
                        'frequency': int(row.get('frequency', 0) or 0),
                        'english_translation': row.get('english_translation', ''),
                        'context': row.get('context', '')
                    })
        
        logger.info(f"Found {len(selected_words)} selected words in CSV")
        return selected_words
        
    except Exception as e:
        logger.error(f"Error parsing CSV file: {str(e)}")
        return []


@router.post("/process-selected-words", response_model=BatchProcessResponse)
async def process_selected_words(
    request: BatchProcessRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start batch processing of selected vocabulary words."""
    
    try:
        # Parse selected words from CSV
        selected_words = parse_selected_words_csv(request.csv_file_path)
        
        if not selected_words:
            raise HTTPException(status_code=400, detail="No selected words found in CSV file")
        
        # Limit to max_words for testing
        if request.max_words:
            selected_words = selected_words[:request.max_words]
        
        # Generate batch ID
        batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Start background processing
        processor = BatchProcessor(db)
        background_tasks.add_task(
            processor.process_vocabulary_batch,
            selected_words=selected_words,
            user_id=request.user_id,
            language_id=request.language_id,
            batch_id=batch_id,
            max_words=request.max_words
        )
        
        return BatchProcessResponse(
            batch_id=batch_id,
            status="started",
            message=f"Started processing {len(selected_words)} words",
            total_words=len(selected_words)
        )
        
    except Exception as e:
        logger.error(f"Error starting batch process: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start batch processing: {str(e)}")


@router.get("/status/{batch_id}")
async def get_batch_status(batch_id: str):
    """Get the status of a batch processing job."""
    
    # This would normally be stored in Redis or database
    # For now, using in-memory storage (will be lost on restart)
    processor = BatchProcessor(None)
    
    if batch_id not in processor.processing_status:
        raise HTTPException(status_code=404, detail="Batch ID not found")
    
    return processor.processing_status[batch_id]


@router.post("/process-batch")
async def process_batch(
    request: Dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Process a batch of words through AI generation."""
    
    words = request.get("words", [])
    if not words:
        raise HTTPException(status_code=400, detail="No words provided")
    
    # Get or create default user and language
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found. Please create a user first.")
    
    language = db.query(Language).filter(Language.code == "fr").first()
    if not language:
        raise HTTPException(status_code=404, detail="French language not found. Please add French language first.")
    
    # Convert word list to expected format
    selected_words = [{"french_text": word, "frequency": 0} for word in words]
    
    # Generate batch ID
    batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Start processing
    processor = BatchProcessor(db)
    background_tasks.add_task(
        processor.process_vocabulary_batch,
        selected_words=selected_words,
        user_id=str(user.id),
        language_id=str(language.id),
        batch_id=batch_id,
        max_words=None
    )
    
    return {
        "batch_id": batch_id,
        "status": "started",
        "message": f"Started processing {len(words)} words through AI generation",
        "words": words,
        "user_id": str(user.id),
        "language_id": str(language.id)
    }


@router.get("/test-five-words")
async def test_five_words(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Test endpoint to process first 5 selected words."""
    
    csv_file_path = r"G:\My Drive\Code\Python\Super-Flashcards\Output\vocabulary_Copy_of_Cours_Corey_ending_1_de_Février_2025 Selected.csv"
    
    # Get or create default user and language
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found. Please create a user first.")
    
    language = db.query(Language).filter(Language.code == "fr").first()
    if not language:
        raise HTTPException(status_code=404, detail="French language not found. Please add French language first.")
    
    # Parse selected words
    selected_words = parse_selected_words_csv(csv_file_path)
    
    if not selected_words:
        raise HTTPException(status_code=400, detail="No selected words found")
    
    # Limit to first 5 words
    test_words = selected_words[:5]
    
    # Generate batch ID
    batch_id = f"test_batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Start processing
    processor = BatchProcessor(db)
    background_tasks.add_task(
        processor.process_vocabulary_batch,
        selected_words=test_words,
        user_id=str(user.id),
        language_id=str(language.id),
        batch_id=batch_id,
        max_words=5
    )
    
    return {
        "batch_id": batch_id,
        "status": "started",
        "message": f"Started processing {len(test_words)} test words",
        "words": [word['french_text'] for word in test_words],
        "user_id": str(user.id),
        "language_id": str(language.id)
    }