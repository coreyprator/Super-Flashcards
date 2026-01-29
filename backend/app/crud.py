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
    from datetime import datetime, timezone
    
    db_flashcard = get_flashcard(db, flashcard_id)
    if db_flashcard:
        db_flashcard.times_reviewed += 1
        db_flashcard.last_reviewed = datetime.now(timezone.utc)
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


# ============================================
# USER OPERATIONS
# ============================================

def get_user(db: Session, user_id: str):
    """Get user by ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    """Get user by username"""
    return db.query(models.User).filter(models.User.username == username).first()

def get_or_create_default_user(db: Session):
    """Get or create the default user (Phase 1: single user)"""
    user = db.query(models.User).filter(models.User.username == "default_user").first()
    if not user:
        user = models.User(
            username="default_user",
            preferred_instruction_language="en"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def update_user_preferences(db: Session, user_id: str, preferred_instruction_language: str):
    """Update user's global instruction language preference"""
    user = get_user(db, user_id)
    if user:
        user.preferred_instruction_language = preferred_instruction_language
        from datetime import datetime
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
    return user


# ============================================
# USER-LANGUAGE OPERATIONS
# ============================================

def get_user_language_setting(db: Session, user_id: str, language_id: str):
    """Get user's settings for a specific language"""
    return db.query(models.UserLanguage).filter(
        models.UserLanguage.user_id == user_id,
        models.UserLanguage.language_id == language_id
    ).first()

def create_or_update_user_language(
    db: Session, 
    user_id: str, 
    language_id: str, 
    instruction_language: Optional[str] = None,
    proficiency_level: Optional[str] = None
):
    """Create or update user's language-specific settings"""
    user_lang = get_user_language_setting(db, user_id, language_id)
    
    if user_lang:
        # Update existing
        if instruction_language is not None:
            user_lang.instruction_language = instruction_language
        if proficiency_level is not None:
            user_lang.proficiency_level = proficiency_level
        from datetime import datetime
        user_lang.updated_at = datetime.utcnow()
    else:
        # Create new
        user_lang = models.UserLanguage(
            user_id=user_id,
            language_id=language_id,
            instruction_language=instruction_language,
            proficiency_level=proficiency_level
        )
        db.add(user_lang)
    
    db.commit()
    db.refresh(user_lang)
    return user_lang

def get_instruction_language(db: Session, user_id: str, language_id: str) -> str:
    """
    Determine what language to use for AI-generated content.
    Priority:
    1. User's language-specific setting
    2. User's global preference
    3. Default to English
    
    NOTE: Phase 1 workaround - users/user_languages tables don't exist yet
    """
    # Phase 1: Skip database queries, default to English
    # TODO Phase 2: Implement proper user preferences
    if user_id == "00000000-0000-0000-0000-000000000000":
        return 'en'
    
    # Phase 2+ code (when users table exists):
    try:
        # Check user-language specific setting
        user_lang = get_user_language_setting(db, user_id, language_id)
        if user_lang and user_lang.instruction_language:
            return user_lang.instruction_language
        
        # Use user's global preference
        user = get_user(db, user_id)
        if user and user.preferred_instruction_language:
            return user.preferred_instruction_language
    except Exception:
        # Table doesn't exist yet, fallback to English
        pass
    
    # Default to English
    return 'en'


# ============================================
# PRONUNCIATION - GEMINI DEEP ANALYSIS (Sprint 8.5)
# ============================================

def get_pronunciation_attempt(db: Session, attempt_id: str):
    """Get a pronunciation attempt by ID"""
    return db.query(models.PronunciationAttempt).filter(
        models.PronunciationAttempt.id == attempt_id
    ).first()


def update_pronunciation_attempt_gemini(
    db: Session,
    attempt_id: str,
    gemini_analysis: str,
    clarity_score: Optional[float] = None,
    rhythm_assessment: Optional[str] = None,
    top_issue: Optional[str] = None,
    drill: Optional[str] = None,
    analysis_type: str = "stt_plus_gemini"
) -> Optional[models.PronunciationAttempt]:
    """
    Update a pronunciation attempt with Gemini analysis results.
    
    Args:
        db: Database session
        attempt_id: UUID of the attempt
        gemini_analysis: Full JSON response from Gemini
        clarity_score: 1-10 clarity rating
        rhythm_assessment: choppy/smooth/natural/etc
        top_issue: Primary pronunciation issue identified
        drill: Recommended practice exercise
        analysis_type: 'stt_only' or 'stt_plus_gemini'
        
    Returns:
        Updated PronunciationAttempt or None if not found
    """
    from datetime import datetime
    
    attempt = db.query(models.PronunciationAttempt).filter(
        models.PronunciationAttempt.id == attempt_id
    ).first()
    
    if not attempt:
        return None
    
    attempt.gemini_analysis = gemini_analysis
    attempt.gemini_clarity_score = clarity_score
    attempt.gemini_rhythm_assessment = rhythm_assessment
    attempt.gemini_top_issue = top_issue
    attempt.gemini_drill = drill
    attempt.gemini_processed_at = datetime.utcnow()
    attempt.analysis_type = analysis_type
    
    db.commit()
    db.refresh(attempt)
    return attempt


def get_pronunciation_prompt_template(
    db: Session,
    language_code: str
) -> Optional[models.PronunciationPromptTemplate]:
    """Get active prompt template for a language."""
    return db.query(models.PronunciationPromptTemplate).filter(
        models.PronunciationPromptTemplate.language_code == language_code,
        models.PronunciationPromptTemplate.is_active == True
    ).first()