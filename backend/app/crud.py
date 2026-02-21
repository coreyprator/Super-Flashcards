# backend/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, text
from typing import List, Optional
from datetime import date, datetime, timezone, timedelta
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


# ============================================
# VOICE CLONE (Sprint 8.5e)
# ============================================

def get_user_voice_clone(db: Session, user_id: str):
    """Get active voice clone for user."""
    return db.query(models.UserVoiceClone).filter(
        models.UserVoiceClone.UserID == user_id,
        models.UserVoiceClone.Status == "active"
    ).first()


def create_voice_clone(
    db: Session,
    user_id: str,
    elevenlabs_voice_id: str,
    voice_name: str,
    sample_count: int = 0,
    total_duration: float = 0
):
    """Create a new voice clone record."""
    clone = models.UserVoiceClone(
        UserID=user_id,
        ElevenLabsVoiceID=elevenlabs_voice_id,
        VoiceName=voice_name,
        Status="active",
        SampleCount=sample_count,
        TotalSampleDurationSec=total_duration
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    return clone


def add_voice_sample(
    db: Session,
    clone_id: int,
    audio_url: str,
    duration_sec: float
):
    """Add a sample to a voice clone."""
    sample = models.VoiceCloneSample(
        CloneID=clone_id,
        AudioURL=audio_url,
        DurationSec=duration_sec
    )
    db.add(sample)
    db.commit()
    db.refresh(sample)
    return sample


def get_cached_pronunciation(
    db: Session,
    clone_id: int,
    target_text: str,
    language_code: str
):
    """Get cached generated pronunciation if exists."""
    return db.query(models.GeneratedPronunciation).filter(
        models.GeneratedPronunciation.CloneID == clone_id,
        models.GeneratedPronunciation.TargetText == target_text,
        models.GeneratedPronunciation.LanguageCode == language_code
    ).first()


def cache_pronunciation(
    db: Session,
    clone_id: int,
    target_text: str,
    language_code: str,
    audio_url: str
):
    """Cache a generated pronunciation."""
    gen = models.GeneratedPronunciation(
        CloneID=clone_id,
        TargetText=target_text,
        LanguageCode=language_code,
        AudioURL=audio_url
    )
    db.add(gen)
    db.commit()
    db.refresh(gen)
    return gen


def increment_play_count(db: Session, generation_id: int):
    """Increment play count for a generated pronunciation."""
    db.query(models.GeneratedPronunciation).filter(
        models.GeneratedPronunciation.GenerationID == generation_id
    ).update({"PlayCount": models.GeneratedPronunciation.PlayCount + 1})
    db.commit()


def update_clone_usage(db: Session, clone_id: int):
    """Update last used time and increment usage count."""
    from datetime import datetime
    db.query(models.UserVoiceClone).filter(
        models.UserVoiceClone.CloneID == clone_id
    ).update({
        "LastUsedAt": datetime.utcnow(),
        "UsageCount": models.UserVoiceClone.UsageCount + 1
    })
    db.commit()


def deactivate_voice_clone(db: Session, clone_id: int):
    """Soft delete a voice clone."""
    db.query(models.UserVoiceClone).filter(
        models.UserVoiceClone.CloneID == clone_id
    ).update({"Status": "deleted"})
    db.commit()


def get_pronunciation_prompt_template(
    db: Session,
    language_code: str
) -> Optional[models.PronunciationPromptTemplate]:
    """Get active prompt template for a language."""
    return db.query(models.PronunciationPromptTemplate).filter(
        models.PronunciationPromptTemplate.language_code == language_code,
        models.PronunciationPromptTemplate.is_active == True
    ).first()


# ============================================
# SPACED REPETITION — Sprint 9 (SF-005/SF-007)
# ============================================

def get_cards_due_for_review(
    db: Session,
    language_id: Optional[str] = None,
    limit: int = 50
) -> List[models.Flashcard]:
    """Return cards due today (next_review_date <= today or never reviewed).
    Orders: overdue first, then new cards."""
    today = date.today()
    query = db.query(models.Flashcard).filter(
        or_(
            models.Flashcard.next_review_date == None,  # noqa: E711 — SQLAlchemy requires ==
            models.Flashcard.next_review_date <= today
        )
    )
    if language_id:
        query = query.filter(models.Flashcard.language_id == language_id)
    # MSSQL: NULLs sort first in ASC — new cards first, then overdue by date
    query = query.order_by(
        models.Flashcard.next_review_date.asc(),
        models.Flashcard.created_at.asc()
    )
    return query.limit(limit).all()


def update_card_sr(
    db: Session,
    flashcard_id: str,
    ease_factor: float,
    review_interval: int,
    repetition_count: int,
    next_review_date: date,
    difficulty: str,
) -> Optional[models.Flashcard]:
    """Update SM-2 fields on a flashcard after a review."""
    card = get_flashcard(db, flashcard_id)
    if not card:
        return None
    card.ease_factor = ease_factor
    card.review_interval = review_interval
    card.repetition_count = repetition_count
    card.next_review_date = next_review_date
    card.difficulty = difficulty
    card.times_reviewed = (card.times_reviewed or 0) + 1
    card.last_reviewed = datetime.now(timezone.utc)
    db.commit()
    db.refresh(card)
    return card


def record_study_session(
    db: Session,
    flashcard_id: str,
    ease_rating: int,
    time_spent_seconds: Optional[int] = None,
    user_id: Optional[str] = None,
) -> models.StudySession:
    """Write a study session record to study_sessions table."""
    session = models.StudySession(
        flashcard_id=flashcard_id,
        user_id=user_id,
        ease_rating=ease_rating,
        time_spent_seconds=time_spent_seconds,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_study_stats(db: Session, language_id: Optional[str] = None) -> dict:
    """Aggregate statistics for the progress dashboard."""
    today = date.today()

    base = db.query(models.Flashcard)
    if language_id:
        base = base.filter(models.Flashcard.language_id == language_id)

    total_cards = base.count()

    due_today = base.filter(
        or_(
            models.Flashcard.next_review_date == None,  # noqa: E711
            models.Flashcard.next_review_date <= today
        )
    ).count()

    overdue = base.filter(
        models.Flashcard.next_review_date < today
    ).count()

    new_cards = base.filter(models.Flashcard.repetition_count == 0).count()
    learning = base.filter(
        models.Flashcard.repetition_count > 0,
        models.Flashcard.repetition_count <= 3
    ).count()
    familiar = base.filter(
        models.Flashcard.repetition_count > 3,
        models.Flashcard.repetition_count <= 10
    ).count()
    mastered = base.filter(models.Flashcard.repetition_count > 10).count()

    # Average ease factor (only for reviewed cards)
    ef_result = base.filter(
        models.Flashcard.repetition_count > 0
    ).with_entities(func.avg(models.Flashcard.ease_factor)).scalar()
    avg_ef = round(float(ef_result), 3) if ef_result else None

    # Total study sessions
    total_sessions = db.query(models.StudySession).count()

    # Streak: consecutive days with at least one study session
    streak_days = _calculate_streak(db)

    # By language breakdown
    lang_query = (
        db.query(
            models.Language.name,
            func.count(models.Flashcard.id).label("total"),
            func.sum(
                func.iif(models.Flashcard.repetition_count > 10, 1, 0)
            ).label("mastered"),
        )
        .join(models.Flashcard, models.Flashcard.language_id == models.Language.id)
        .group_by(models.Language.name)
        .order_by(func.count(models.Flashcard.id).desc())
    )
    by_language = [
        {"language": row.name, "total": row.total, "mastered": int(row.mastered or 0)}
        for row in lang_query.all()
    ]

    return {
        "total_cards": total_cards,
        "due_today": due_today,
        "overdue": overdue,
        "new_cards": new_cards,
        "learning": learning,
        "familiar": familiar,
        "mastered": mastered,
        "streak_days": streak_days,
        "total_sessions": total_sessions,
        "avg_ease_factor": avg_ef,
        "by_language": by_language,
    }


def get_study_progress(db: Session) -> dict:
    """Return time-series data for progress charts."""
    today = date.today()
    thirty_days_ago = today - timedelta(days=29)

    # Reviews per day (last 30 days) from study_sessions
    sessions_raw = (
        db.query(
            func.cast(models.StudySession.reviewed_at, sqlalchemy_date_type()).label("review_date"),
            func.count(models.StudySession.id).label("cnt"),
        )
        .filter(models.StudySession.reviewed_at >= thirty_days_ago)
        .group_by(func.cast(models.StudySession.reviewed_at, sqlalchemy_date_type()))
        .all()
    )
    reviews_by_date = {str(row.review_date): row.cnt for row in sessions_raw}

    # Build 30-day list filling zeros for missing days
    reviews_last_30 = []
    for i in range(29, -1, -1):
        d = str(today - timedelta(days=i))
        reviews_last_30.append({"date": d, "count": reviews_by_date.get(d, 0)})

    mastery_distribution = {
        "new": db.query(models.Flashcard).filter(models.Flashcard.repetition_count == 0).count(),
        "learning": db.query(models.Flashcard).filter(
            models.Flashcard.repetition_count > 0,
            models.Flashcard.repetition_count <= 3
        ).count(),
        "familiar": db.query(models.Flashcard).filter(
            models.Flashcard.repetition_count > 3,
            models.Flashcard.repetition_count <= 10
        ).count(),
        "mastered": db.query(models.Flashcard).filter(
            models.Flashcard.repetition_count > 10
        ).count(),
    }

    return {
        "reviews_last_30_days": reviews_last_30,
        "cumulative_learned": [],  # Placeholder — costly to compute
        "mastery_distribution": mastery_distribution,
        "pronunciation_stats": None,
    }


def _calculate_streak(db: Session) -> int:
    """Count consecutive days with at least one study session ending today."""
    today = date.today()
    streak = 0
    d = today
    while True:
        start = datetime.combine(d, datetime.min.time())
        end = datetime.combine(d, datetime.max.time())
        count = db.query(models.StudySession).filter(
            models.StudySession.reviewed_at >= start,
            models.StudySession.reviewed_at <= end,
        ).count()
        if count == 0:
            break
        streak += 1
        d -= timedelta(days=1)
        if streak > 3650:  # Safety cap
            break
    return streak


def sqlalchemy_date_type():
    """Return SQLAlchemy Date type for casting."""
    from sqlalchemy import Date
    return Date