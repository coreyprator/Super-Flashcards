# backend/app/routers/flashcards.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app import crud, schemas, models
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Flashcard)
def create_flashcard(
    flashcard: schemas.FlashcardCreate,
    db: Session = Depends(get_db)
):
    """Create a new flashcard"""
    return crud.create_flashcard(db=db, flashcard=flashcard)

@router.get("/", response_model=List[schemas.Flashcard])
def read_flashcards(
    language_id: Optional[str] = None,
    card_type: Optional[str] = None,
    source_book: Optional[str] = None,
    chapter_number: Optional[int] = None,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """Get all flashcards, optionally filtered by language, card_type, source_book, chapter."""
    query = db.query(models.Flashcard)
    if language_id:
        query = query.filter(models.Flashcard.language_id == language_id)
    if card_type:
        query = query.filter(models.Flashcard.card_type == card_type)
    if source_book:
        query = query.filter(models.Flashcard.source_book.ilike(f"%{source_book}%"))
    if chapter_number is not None:
        query = query.filter(models.Flashcard.chapter_number == chapter_number)
    # For sentence cards, order by chapter + sentence_order
    if card_type == "sentence":
        query = query.order_by(models.Flashcard.chapter_number, models.Flashcard.sentence_order)
    else:
        query = query.order_by(models.Flashcard.created_at.desc())
    flashcards = query.offset(skip).limit(limit).all()
    return flashcards

@router.get("/search", response_model=List[schemas.Flashcard])
def search_flashcards(
    q: str = Query(..., min_length=1, description="Search term"),
    language_id: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    """Search flashcards by word, definition, or etymology"""
    return crud.search_flashcards(db, search_term=q, language_id=language_id, limit=limit, offset=offset)


@router.get("/exists")
def check_card_exists(word: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """Case-insensitive card existence check by exact word_or_phrase."""
    normalized = word.strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="word is required")

    card = db.query(models.Flashcard).filter(
        func.lower(models.Flashcard.word_or_phrase) == normalized.lower()
    ).first()

    if not card:
        return {
            "word": normalized,
            "exists": False,
            "card_id": None,
            "url": None,
        }

    return {
        "word": normalized,
        "exists": True,
        "card_id": str(card.id),
        "url": f"/?cardId={card.id}",
    }

@router.get("/{flashcard_id}", response_model=schemas.Flashcard)
def read_flashcard(flashcard_id: str, db: Session = Depends(get_db)):
    """Get a specific flashcard by ID"""
    db_flashcard = crud.get_flashcard(db, flashcard_id=flashcard_id)
    if db_flashcard is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return db_flashcard

@router.put("/{flashcard_id}", response_model=schemas.Flashcard)
def update_flashcard(
    flashcard_id: str,
    flashcard: schemas.FlashcardUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing flashcard"""
    db_flashcard = crud.update_flashcard(db, flashcard_id=flashcard_id, flashcard=flashcard)
    if db_flashcard is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return db_flashcard

@router.delete("/{flashcard_id}")
def delete_flashcard(flashcard_id: str, db: Session = Depends(get_db)):
    """Delete a flashcard"""
    success = crud.delete_flashcard(db, flashcard_id=flashcard_id)
    if not success:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return {"detail": "Flashcard deleted successfully"}

@router.post("/{flashcard_id}/review", response_model=schemas.Flashcard)
def mark_reviewed(flashcard_id: str, db: Session = Depends(get_db)):
    """Mark a flashcard as reviewed (increments counter, updates timestamp)"""
    db_flashcard = crud.increment_review_count(db, flashcard_id=flashcard_id)
    if db_flashcard is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return db_flashcard