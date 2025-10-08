from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=schemas.User)
def get_current_user(db: Session = Depends(get_db)):
    """
    Get current user (Phase 1: always returns default user)
    Phase 2: Will use JWT token to identify user
    """
    user = crud.get_or_create_default_user(db)
    return user


@router.patch("/me/preferences", response_model=schemas.User)
def update_user_preferences(
    preferences: schemas.UserPreferencesUpdate,
    db: Session = Depends(get_db)
):
    """Update user's global instruction language preference"""
    user = crud.get_or_create_default_user(db)
    updated_user = crud.update_user_preferences(
        db, 
        str(user.id), 
        preferences.preferred_instruction_language
    )
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user


@router.get("/languages/{language_id}/settings", response_model=Optional[schemas.UserLanguage])
def get_language_settings(
    language_id: str,
    db: Session = Depends(get_db)
):
    """Get user's settings for a specific language"""
    user = crud.get_or_create_default_user(db)
    return crud.get_user_language_setting(db, str(user.id), language_id)


@router.put("/languages/{language_id}/settings", response_model=schemas.UserLanguage)
def update_language_settings(
    language_id: str,
    settings: schemas.UserLanguageUpdate,
    db: Session = Depends(get_db)
):
    """Update instruction language for a specific language"""
    user = crud.get_or_create_default_user(db)
    
    # Verify language exists
    language = crud.get_language(db, language_id)
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    return crud.create_or_update_user_language(
        db,
        str(user.id),
        language_id,
        instruction_language=settings.instruction_language,
        proficiency_level=settings.proficiency_level
    )