"""
Import flashcards from CSV/JSON files.
Supports bulk import with validation and error reporting.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import csv
import json
import io
from datetime import datetime

from ..database import get_db
from ..models import Flashcard, Language
from ..schemas import FlashcardCreate

router = APIRouter()

class ImportResult:
    def __init__(self):
        self.total_rows = 0
        self.successful_imports = 0
        self.errors = []
        self.warnings = []
        self.imported_cards = []

def validate_flashcard_data(row_data: Dict[str, Any], row_number: int, languages_dict: Dict[str, int]) -> tuple[Optional[FlashcardCreate], Optional[str]]:
    """
    Validate and convert a single row of import data to FlashcardCreate schema.
    Returns (flashcard_data, error_message)
    """
    try:
        # Required fields
        required_fields = ['word_or_phrase', 'definition', 'language']
        missing_fields = [field for field in required_fields if not row_data.get(field, '').strip()]
        
        if missing_fields:
            return None, f"Row {row_number}: Missing required fields: {', '.join(missing_fields)}"
        
        # Clean and validate data
        word_or_phrase = row_data['word_or_phrase'].strip()
        definition = row_data['definition'].strip()
        language_name = row_data['language'].strip().lower()
        
        # Validate language exists
        if language_name not in languages_dict:
            return None, f"Row {row_number}: Language '{language_name}' not found. Available languages: {', '.join(languages_dict.keys())}"
        
        # Optional fields with defaults
        pronunciation = row_data.get('pronunciation', '').strip()
        etymology = row_data.get('etymology', '').strip()
        memory_hint = row_data.get('memory_hint', '').strip()
        difficulty_level = row_data.get('difficulty_level', 1)
        
        # Validate difficulty level
        try:
            difficulty_level = int(difficulty_level)
            if difficulty_level < 1 or difficulty_level > 5:
                difficulty_level = 1
        except (ValueError, TypeError):
            difficulty_level = 1
        
        # Handle related_words (JSON array or comma-separated string)
        related_words = []
        if row_data.get('related_words'):
            related_words_str = str(row_data['related_words']).strip()
            if related_words_str.startswith('[') and related_words_str.endswith(']'):
                try:
                    related_words = json.loads(related_words_str)
                except json.JSONDecodeError:
                    related_words = []
            else:
                # Comma-separated values
                related_words = [word.strip() for word in related_words_str.split(',') if word.strip()]
        
        flashcard_data = FlashcardCreate(
            word_or_phrase=word_or_phrase,
            definition=definition,
            language_id=languages_dict[language_name],
            pronunciation=pronunciation if pronunciation else None,
            etymology=etymology if etymology else None,
            memory_hint=memory_hint if memory_hint else None,
            difficulty_level=difficulty_level,
            related_words=related_words if related_words else None
        )
        
        return flashcard_data, None
        
    except Exception as e:
        return None, f"Row {row_number}: Validation error - {str(e)}"

def parse_csv_file(file_content: str) -> tuple[List[Dict[str, Any]], List[str]]:
    """Parse CSV content and return rows with error messages."""
    rows = []
    errors = []
    
    try:
        # Detect delimiter
        sample = file_content[:1024]
        sniffer = csv.Sniffer()
        delimiter = sniffer.sniff(sample).delimiter
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(file_content), delimiter=delimiter)
        
        # Validate headers
        expected_headers = {'word_or_phrase', 'definition', 'language'}
        headers = set(header.strip().lower() for header in csv_reader.fieldnames or [])
        missing_headers = expected_headers - headers
        
        if missing_headers:
            errors.append(f"Missing required CSV columns: {', '.join(missing_headers)}")
            return [], errors
        
        # Normalize headers to lowercase
        for i, row in enumerate(csv_reader, 1):
            normalized_row = {key.strip().lower(): value for key, value in row.items()}
            rows.append(normalized_row)
            
            if i > 1000:  # Limit import size
                errors.append("Import limited to 1000 rows. Please split large files.")
                break
                
    except Exception as e:
        errors.append(f"CSV parsing error: {str(e)}")
    
    return rows, errors

def parse_json_file(file_content: str) -> tuple[List[Dict[str, Any]], List[str]]:
    """Parse JSON content and return rows with error messages."""
    rows = []
    errors = []
    
    try:
        data = json.loads(file_content)
        
        if isinstance(data, list):
            rows = data
        elif isinstance(data, dict) and 'flashcards' in data:
            rows = data['flashcards']
        else:
            errors.append("JSON must be an array of objects or an object with 'flashcards' array")
            return [], errors
        
        if len(rows) > 1000:
            errors.append("Import limited to 1000 rows. Please split large files.")
            rows = rows[:1000]
            
    except json.JSONDecodeError as e:
        errors.append(f"JSON parsing error: {str(e)}")
    except Exception as e:
        errors.append(f"JSON processing error: {str(e)}")
    
    return rows, errors

@router.post("/import")
async def import_flashcards(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Import flashcards from CSV or JSON file.
    
    CSV format:
    word_or_phrase,definition,language,pronunciation,etymology,memory_hint,difficulty_level,related_words
    
    JSON format:
    [
        {
            "word_or_phrase": "hola",
            "definition": "hello",
            "language": "spanish",
            "pronunciation": "OH-lah",
            "etymology": "From Latin",
            "memory_hint": "Think of 'holler'",
            "difficulty_level": 1,
            "related_words": ["hello", "hi", "greetings"]
        }
    ]
    """
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_extension = file.filename.lower().split('.')[-1]
    if file_extension not in ['csv', 'json']:
        raise HTTPException(status_code=400, detail="File must be CSV or JSON format")
    
    # Read file content
    try:
        content = await file.read()
        file_content = content.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # Get available languages
    languages = db.query(Language).all()
    languages_dict = {lang.name.lower(): lang.id for lang in languages}
    
    # Parse file based on type
    if file_extension == 'csv':
        rows, parse_errors = parse_csv_file(file_content)
    else:
        rows, parse_errors = parse_json_file(file_content)
    
    result = ImportResult()
    result.total_rows = len(rows)
    result.errors.extend(parse_errors)
    
    if parse_errors:
        return {
            "success": False,
            "message": "File parsing failed",
            "total_rows": 0,
            "successful_imports": 0,
            "errors": result.errors,
            "warnings": result.warnings
        }
    
    # Process each row
    for i, row in enumerate(rows, 1):
        flashcard_data, validation_error = validate_flashcard_data(row, i, languages_dict)
        
        if validation_error:
            result.errors.append(validation_error)
            continue
        
        try:
            # Check for duplicates
            existing = db.query(Flashcard).filter(
                Flashcard.word_or_phrase == flashcard_data.word_or_phrase,
                Flashcard.language_id == flashcard_data.language_id
            ).first()
            
            if existing:
                result.warnings.append(f"Row {i}: Duplicate card '{flashcard_data.word_or_phrase}' skipped")
                continue
            
            # Create flashcard
            db_flashcard = Flashcard(**flashcard_data.dict())
            db.add(db_flashcard)
            db.flush()  # Get the ID without committing
            
            result.imported_cards.append({
                "word_or_phrase": db_flashcard.word_or_phrase,
                "definition": db_flashcard.definition,
                "language": next(lang.name for lang in languages if lang.id == db_flashcard.language_id)
            })
            result.successful_imports += 1
            
        except Exception as e:
            result.errors.append(f"Row {i}: Database error - {str(e)}")
            db.rollback()
            continue
    
    # Commit all successful imports
    if result.successful_imports > 0:
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to save imports: {str(e)}")
    
    return {
        "success": result.successful_imports > 0,
        "message": f"Successfully imported {result.successful_imports} out of {result.total_rows} flashcards",
        "total_rows": result.total_rows,
        "successful_imports": result.successful_imports,
        "errors": result.errors,
        "warnings": result.warnings,
        "imported_cards": result.imported_cards[:10]  # Show first 10 for preview
    }

@router.get("/template/csv")
async def get_csv_template():
    """Download a CSV template for importing flashcards."""
    template_content = """word_or_phrase,definition,language,pronunciation,etymology,memory_hint,difficulty_level,related_words
hola,hello,spanish,OH-lah,"From Latin 'salus'",Think of 'holler',1,"hello,hi,greetings"
bonjour,hello,french,bon-ZHOOR,"From 'bon' (good) + 'jour' (day)",Good day greeting,1,"hello,good morning"
guten Tag,hello,german,GOO-ten tahk,"From 'gut' (good) + 'Tag' (day)",Good day in German,2,"hello,good day"
"""
    
    return {
        "filename": "flashcards_template.csv",
        "content": template_content,
        "content_type": "text/csv"
    }

@router.get("/template/json")
async def get_json_template():
    """Download a JSON template for importing flashcards."""
    template_data = [
        {
            "word_or_phrase": "hola",
            "definition": "hello",
            "language": "spanish",
            "pronunciation": "OH-lah",
            "etymology": "From Latin 'salus'",
            "memory_hint": "Think of 'holler'",
            "difficulty_level": 1,
            "related_words": ["hello", "hi", "greetings"]
        },
        {
            "word_or_phrase": "bonjour",
            "definition": "hello",
            "language": "french",
            "pronunciation": "bon-ZHOOR",
            "etymology": "From 'bon' (good) + 'jour' (day)",
            "memory_hint": "Good day greeting",
            "difficulty_level": 1,
            "related_words": ["hello", "good morning"]
        }
    ]
    
    return {
        "filename": "flashcards_template.json",
        "content": json.dumps(template_data, indent=2),
        "content_type": "application/json"
    }