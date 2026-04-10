# backend/app/routers/flashcards.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
import json
import asyncio
import logging

from app import crud, schemas, models
from app.database import get_db

logger = logging.getLogger(__name__)

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


@router.post("/backfill-cognate-pie-roots")
async def backfill_cognate_pie_roots(
    batch_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Batch-validate english_cognates against PIE roots for cards missing cognate_pie_roots."""
    from app.services.cognate_validation_service import process_card_cognates

    rows = db.execute(text("""
        SELECT TOP :batch_size id, word_or_phrase, english_cognates, pie_root
        FROM flashcards
        WHERE english_cognates IS NOT NULL
          AND english_cognates != ''
          AND english_cognates != 'N/A'
          AND pie_root IS NOT NULL
          AND pie_root != 'N/A'
          AND cognate_pie_roots IS NULL
        ORDER BY created_at ASC
    """), {"batch_size": batch_size}).fetchall()

    processed = 0
    removed_count = 0
    skipped = 0
    errors = 0
    rag_miss_total = 0

    for row in rows:
        card_id, word, cognates, pie_root = row[0], row[1], row[2], row[3]
        try:
            cleaned, audit, rag_miss = await process_card_cognates(cognates, pie_root, word)
            db.execute(text("""
                UPDATE flashcards
                SET english_cognates = :cleaned,
                    cognate_pie_roots = :audit
                WHERE id = :card_id
            """), {"cleaned": cleaned, "audit": json.dumps(audit), "card_id": card_id})
            db.commit()
            removed_count += len([r for r in audit if not r["kept"]])
            rag_miss_total += rag_miss
            processed += 1
        except Exception as e:
            logger.error(f"[backfill] Error on card {card_id}: {e}")
            errors += 1
        await asyncio.sleep(0.5)

    # Estimate remaining
    remaining = db.execute(text("""
        SELECT COUNT(*) FROM flashcards
        WHERE english_cognates IS NOT NULL
          AND english_cognates != ''
          AND english_cognates != 'N/A'
          AND pie_root IS NOT NULL
          AND pie_root != 'N/A'
          AND cognate_pie_roots IS NULL
    """)).scalar()

    return {
        "processed": processed,
        "removed_cognates_total": removed_count,
        "skipped": skipped,
        "errors": errors,
        "rag_miss_count": rag_miss_total,
        "remaining_estimate": remaining,
        "message": f"Run again to continue. {removed_count} synonyms removed from english_cognates across {processed} cards.",
    }


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

@router.post("/{flashcard_id}/validate-cognates")
async def validate_card_cognates(flashcard_id: str, db: Session = Depends(get_db)):
    """Validate cognates for a single card against its PIE root. Overwrites existing audit."""
    from app.services.cognate_validation_service import process_card_cognates

    card = crud.get_flashcard(db, flashcard_id)
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    if not card.english_cognates or not card.pie_root or card.pie_root == "N/A":
        raise HTTPException(status_code=400, detail="Card has no english_cognates or pie_root to validate")

    original = card.english_cognates
    cleaned, audit, rag_miss = await process_card_cognates(original, card.pie_root, card.word_or_phrase)

    # Persist
    db.execute(text("""
        UPDATE flashcards
        SET english_cognates = :cleaned,
            cognate_pie_roots = :audit
        WHERE id = :card_id
    """), {"cleaned": cleaned, "audit": json.dumps(audit), "card_id": flashcard_id})
    db.commit()

    removed = [{"word": r["word"], "reason": f"different PIE root {r['proposed_pie_root']}", "citation": r["citation"]}
               for r in audit if not r["kept"]]
    kept = [{"word": r["word"], "is_true_cognate": r["is_true_cognate"]} for r in audit if r["kept"]]

    return {
        "card_id": flashcard_id,
        "original_english_cognates": original,
        "cleaned_english_cognates": cleaned,
        "removed": removed,
        "kept": kept,
        "rag_miss_count": rag_miss,
    }


@router.post("/{flashcard_id}/review", response_model=schemas.Flashcard)
def mark_reviewed(flashcard_id: str, db: Session = Depends(get_db)):
    """Mark a flashcard as reviewed (increments counter, updates timestamp)"""
    db_flashcard = crud.increment_review_count(db, flashcard_id=flashcard_id)
    if db_flashcard is None:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return db_flashcard