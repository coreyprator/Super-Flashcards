# backend/app/routers/languages.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Language)
def create_language(
    language: schemas.LanguageCreate,
    db: Session = Depends(get_db)
):
    """Create a new language"""
    # Check if language already exists
    existing = crud.get_language_by_code(db, language.code)
    if existing:
        raise HTTPException(status_code=400, detail="Language already exists")
    return crud.create_language(db=db, language=language)

@router.get("/", response_model=List[schemas.Language])
def read_languages(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all languages"""
    languages = crud.get_languages(db, skip=skip, limit=limit)
    return languages

@router.get("/{language_id}", response_model=schemas.Language)
def read_language(language_id: str, db: Session = Depends(get_db)):
    """Get a specific language by ID"""
    db_language = crud.get_language(db, language_id=language_id)
    if db_language is None:
        raise HTTPException(status_code=404, detail="Language not found")
    return db_language

@router.get("/code/{code}", response_model=schemas.Language)
def read_language_by_code(code: str, db: Session = Depends(get_db)):
    """Get a language by its code (e.g., 'fr', 'el')"""
    db_language = crud.get_language_by_code(db, code=code)
    if db_language is None:
        raise HTTPException(status_code=404, detail="Language not found")
    return db_language