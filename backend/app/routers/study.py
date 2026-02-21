# backend/app/routers/study.py
# Spaced Repetition Study endpoints — Sprint 9 (SF-005, SF-007, SF-008)

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app import crud, schemas, models
from app.database import get_db
from app.services.spaced_repetition import calculate_sm2

router = APIRouter()


# ─────────────────────────────────────────────
# SR Review
# ─────────────────────────────────────────────

@router.post("/review/{flashcard_id}", response_model=schemas.StudyReviewResponse)
def submit_review(
    flashcard_id: str,
    body: schemas.StudyReviewRequest,
    db: Session = Depends(get_db),
):
    """
    Submit a study review for a card.
    Applies SM-2 algorithm, updates card, and records the session.

    Quality values:
      0 = Again (complete failure)
      2 = Hard  (correct with serious difficulty)
      4 = Good  (correct with some hesitation)
      5 = Easy  (perfect recall)
    """
    card = crud.get_flashcard(db, flashcard_id)
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    result = calculate_sm2(
        quality=body.quality,
        current_interval=card.review_interval or 0,
        current_ease_factor=card.ease_factor or 2.5,
        current_repetition_count=card.repetition_count or 0,
    )

    # Update card with new SM-2 values
    crud.update_card_sr(
        db,
        flashcard_id=flashcard_id,
        ease_factor=result.ease_factor,
        review_interval=result.interval,
        repetition_count=result.repetition_count,
        next_review_date=result.next_review_date,
        difficulty=result.difficulty,
    )

    # Record session
    try:
        crud.record_study_session(
            db,
            flashcard_id=flashcard_id,
            ease_rating=body.quality,
            time_spent_seconds=body.time_spent_seconds,
            user_id=None,  # No per-user isolation yet (all cards shared)
        )
        session_recorded = True
    except Exception:
        session_recorded = False

    return schemas.StudyReviewResponse(
        flashcard_id=flashcard_id,
        quality=body.quality,
        new_interval=result.interval,
        new_ease_factor=result.ease_factor,
        next_review_date=result.next_review_date,
        repetition_count=result.repetition_count,
        difficulty=result.difficulty,
        session_recorded=session_recorded,
    )


# ─────────────────────────────────────────────
# Due Queue
# ─────────────────────────────────────────────

@router.get("/due", response_model=List[schemas.Flashcard])
def get_due_cards(
    language_id: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    """Return flashcards due for review today, ordered new-first then overdue."""
    return crud.get_cards_due_for_review(db, language_id=language_id, limit=limit)


# ─────────────────────────────────────────────
# Statistics
# ─────────────────────────────────────────────

@router.get("/stats", response_model=schemas.StudyStatsResponse)
def get_study_stats(
    language_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Aggregate study statistics for the progress dashboard."""
    stats = crud.get_study_stats(db, language_id=language_id)
    return schemas.StudyStatsResponse(**stats)


@router.get("/progress", response_model=schemas.StudyProgressResponse)
def get_study_progress(db: Session = Depends(get_db)):
    """Time-series data for progress charts (last 30 days)."""
    progress = crud.get_study_progress(db)
    return schemas.StudyProgressResponse(**progress)


# ─────────────────────────────────────────────
# Difficulty (SF-008)
# ─────────────────────────────────────────────

@router.put("/difficulty/{flashcard_id}")
def set_difficulty(
    flashcard_id: str,
    difficulty: str = Query(..., regex="^(beginner|intermediate|advanced|unrated)$"),
    db: Session = Depends(get_db),
):
    """Manually override difficulty for a card."""
    card = crud.get_flashcard(db, flashcard_id)
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    card.difficulty = difficulty
    db.commit()
    return {"flashcard_id": flashcard_id, "difficulty": difficulty}


@router.post("/difficulty/auto-assign")
def auto_assign_difficulty(
    language_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Batch auto-assign difficulty to all cards with 5+ reviews
    based on their ease factor.
    """
    from app.services.spaced_repetition import _auto_difficulty
    query = db.query(models.Flashcard).filter(
        models.Flashcard.repetition_count >= 5
    )
    if language_id:
        query = query.filter(models.Flashcard.language_id == language_id)

    updated = 0
    for card in query.all():
        new_difficulty = _auto_difficulty(
            ease_factor=card.ease_factor or 2.5,
            repetition_count=card.repetition_count or 0,
        )
        if card.difficulty != new_difficulty:
            card.difficulty = new_difficulty
            updated += 1

    db.commit()
    return {"updated": updated, "message": f"Auto-assigned difficulty to {updated} cards"}
