# backend/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app import models, schemas

# Language CRUD
def get_language(db: Session, language_id: str):
    return db.query(models.Language).filter(models.Language.id == language_id).first()

def get_language_by_code(db: Session, code: str):
    return db.query(models.Language).filter(models.Language.code == code).first()

def get_languages(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Language).order_by(models.Language.name).offset(skip).limit(limit).all()

def create_language(db: Session, language: schemas.LanguageCreate):
    db_language = models.Language(**language.dict())
    db.add(db_language)
    db.commit()
    db.refresh(db_language)
    return db_language

# Flashcard CRUD
def get_flashcard(db: Session, flashcard_id: str):
    return db.query(models.Flashcard).filter(models.Flashcard.id == flashcard_id).first()

def get_flashcards(
    db: Session, 
    language_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
):
    query = db.query(models.Flashcard)
    if language_id:
        query = query.filter(models.Flashcard.language_id == language_id)
    return query.order_by(models.Flashcard.created_at.desc()).offset(skip).limit(limit).all()

def search_flashcards(db: Session, search_term: str, language_id: Optional[str] = None):
    """Search flashcards by word or definition"""
    query = db.query(models.Flashcard).filter(
        or_(
            models.Flashcard.word_or_phrase.ilike(f"%{search_term}%"),
            models.Flashcard.definition.ilike(f"%{search_term}%"),
            models.Flashcard.etymology.ilike(f"%{search_term}%")
        )
    )
    if language_id:
        query = query.filter(models.Flashcard.language_id == language_id)
    return query.all()

def create_flashcard(db: Session, flashcard: schemas.FlashcardCreate):
    db_flashcard = models.Flashcard(**flashcard.dict())
    db.add(db_flashcard)
    db.commit()
    db.refresh(db_flashcard)
    return db_flashcard

def update_flashcard(db: Session, flashcard_id: str, flashcard: schemas.FlashcardUpdate):
    db_flashcard = get_flashcard(db, flashcard_id)
    if db_flashcard:
        update_data = flashcard.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_flashcard, key, value)
        db.commit()
        db.refresh(db_flashcard)
    return db_flashcard

def delete_flashcard(db: Session, flashcard_id: str):
    db_flashcard = get_flashcard(db, flashcard_id)
    if db_flashcard:
        db.delete(db_flashcard)
        db.commit()
        return True
    return False

def increment_review_count(db: Session, flashcard_id: str):
    """Increment times_reviewed and update last_reviewed timestamp"""
    db_flashcard = get_flashcard(db, flashcard_id)
    if db_flashcard:
        db_flashcard.times_reviewed += 1
        from datetime import datetime
        db_flashcard.last_reviewed = datetime.now()
        db.commit()
        db.refresh(db_flashcard)
    return db_flashcard

# Sync operations for offline support
def get_flashcards_updated_since(db: Session, since: str, language_id: Optional[str] = None):
    """Get all flashcards updated since a given timestamp"""
    query = db.query(models.Flashcard).filter(
        models.Flashcard.updated_at > since
    )
    if language_id:
        query = query.filter(models.Flashcard.language_id == language_id)
    return query.all()