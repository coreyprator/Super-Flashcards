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
                    
                    # Generate translation and context using OpenAI
                    translation_data = await self.generate_flashcard_content(french_word)
                    
                    if translation_data:
                        # Create flashcard in database
                        flashcard = await self.create_flashcard(
                            french_word=french_word,
                            english_translation=translation_data['translation'],
                            context=translation_data['context'],
                            example_sentence=translation_data.get('example', ''),
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
        """Generate English translation and context using OpenAI."""
        
        try:
            prompt = f"""
You are a French language teacher creating flashcards. For the French word "{french_word}":

1. Provide the most common English translation
2. Write a brief context/definition (1-2 sentences)
3. Create a simple example sentence in French with English translation

Respond in JSON format:
{{
    "translation": "English translation",
    "context": "Brief definition or context",
    "example": "French example sentence | English translation"
}}
"""
            
            # TODO: Replace with actual OpenAI API call
            # For now, return mock data for testing
            mock_translations = {
                "ailleurs": {
                    "translation": "elsewhere, somewhere else",
                    "context": "An adverb meaning in another place or location.",
                    "example": "Il habite ailleurs maintenant. | He lives elsewhere now."
                },
                "couches": {
                    "translation": "layers, coats",
                    "context": "Plural noun referring to multiple layers or coats of material.",
                    "example": "Il y a plusieurs couches de peinture. | There are several coats of paint."
                },
                "davantage": {
                    "translation": "more, further",
                    "context": "An adverb meaning to a greater degree or extent.",
                    "example": "Nous devons étudier davantage. | We need to study more."
                },
                "éloges": {
                    "translation": "praise, compliments",
                    "context": "Plural noun referring to words of approval or admiration.",
                    "example": "Elle a reçu des éloges pour son travail. | She received praise for her work."
                },
                "parfois": {
                    "translation": "sometimes, occasionally",
                    "context": "An adverb meaning at times or now and then.",
                    "example": "Parfois, je vais au cinéma. | Sometimes, I go to the movies."
                }
            }
            
            # Return mock data for testing, or actual OpenAI response
            if french_word in mock_translations:
                return mock_translations[french_word]
            else:
                # Fallback mock response
                return {
                    "translation": f"[Translation for {french_word}]",
                    "context": f"Context and definition for the French word '{french_word}'.",
                    "example": f"{french_word} in a sentence. | {french_word} in a sentence (English)."
                }
            
        except Exception as e:
            logger.error(f"Error generating content for {french_word}: {str(e)}")
            return None
    
    async def create_flashcard(
        self, 
        french_word: str, 
        english_translation: str, 
        context: str,
        example_sentence: str,
        user_id: str, 
        language_id: str,
        frequency: int = 0
    ) -> Optional[Flashcard]:
        """Create a flashcard in the database."""
        
        try:
            flashcard = Flashcard(
                word_or_phrase=french_word,
                definition=english_translation,
                etymology=context,
                source="batch_generated",
                user_id=user_id,
                language_id=language_id
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