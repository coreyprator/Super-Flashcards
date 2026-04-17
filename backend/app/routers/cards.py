# backend/app/routers/cards.py — PromptForge content audit endpoints (PF-PREREQ-001)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app import models
from app.database import get_db

router = APIRouter()


@router.get("/cards")
def get_cards(
    pie_root: Optional[str] = None,
    has_pie_root: Optional[str] = None,
    language: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Search/filter flashcards for PromptForge content audit."""
    query = db.query(
        models.Flashcard.id,
        models.Flashcard.word_or_phrase,
        models.Language.name.label("language"),
        models.Flashcard.pie_root,
        models.Flashcard.pie_meaning,
        models.Flashcard.etymology,
    ).join(models.Language, models.Flashcard.language_id == models.Language.id)

    if pie_root:
        query = query.filter(func.lower(models.Flashcard.pie_root).like(func.lower(f"%{pie_root}%")))

    if has_pie_root == "false":
        query = query.filter(
            (models.Flashcard.pie_root == None) | (models.Flashcard.pie_root == "")
        )
    elif has_pie_root == "true":
        query = query.filter(
            models.Flashcard.pie_root != None,
            models.Flashcard.pie_root != "",
        )

    if language:
        query = query.filter(func.lower(models.Language.name) == func.lower(language))

    rows = query.limit(limit).all()
    cards = [
        {
            "id": str(r.id),
            "word": r.word_or_phrase,
            "language": r.language,
            "pie_root": r.pie_root,
            "pie_root_gloss": r.pie_meaning,
            "etymology": r.etymology,
        }
        for r in rows
    ]
    return {"cards": cards, "count": len(cards)}


@router.get("/cards/stats")
def cards_stats(db: Session = Depends(get_db)):
    """Flashcard statistics for PromptForge content audit."""
    total = db.query(func.count(models.Flashcard.id)).scalar()

    by_lang_rows = (
        db.query(models.Language.name, func.count(models.Flashcard.id))
        .join(models.Language, models.Flashcard.language_id == models.Language.id)
        .group_by(models.Language.name)
        .order_by(func.count(models.Flashcard.id).desc())
        .all()
    )
    by_language = {name: count for name, count in by_lang_rows}

    has_pie = db.query(func.count(models.Flashcard.id)).filter(
        models.Flashcard.pie_root != None,
        models.Flashcard.pie_root != "",
    ).scalar()

    return {
        "total": total,
        "by_language": by_language,
        "has_pie_root": has_pie,
        "missing_pie_root": total - has_pie,
    }
