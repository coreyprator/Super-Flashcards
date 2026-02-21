# backend/app/schemas.py
from pydantic import BaseModel, Field, field_serializer
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID

# Language Schemas
class LanguageBase(BaseModel):
    name: str
    code: str

class LanguageCreate(LanguageBase):
    pass

class Language(LanguageBase):
    id: UUID
    created_at: datetime
    
    @field_serializer('id')
    def serialize_id(self, value):
        return str(value)
    
    class Config:
        from_attributes = True

# Flashcard Schemas
class FlashcardBase(BaseModel):
    word_or_phrase: str
    definition: Optional[str] = None
    etymology: Optional[str] = None
    english_cognates: Optional[str] = None
    related_words: Optional[str] = None  # JSON string
    image_url: Optional[str] = None
    image_description: Optional[str] = None
    audio_url: Optional[str] = None
    audio_generated_at: Optional[datetime] = None
    ipa_pronunciation: Optional[str] = None
    ipa_audio_url: Optional[str] = None
    ipa_generated_at: Optional[datetime] = None
    # PIE Root
    pie_root: Optional[str] = None
    pie_meaning: Optional[str] = None

class FlashcardCreate(FlashcardBase):
    language_id: UUID  # CORRECTED: language_id DOES exist in Cloud SQL!
    source: str = "manual"

class FlashcardUpdate(BaseModel):
    word_or_phrase: Optional[str] = None
    definition: Optional[str] = None
    etymology: Optional[str] = None
    english_cognates: Optional[str] = None
    related_words: Optional[str] = None
    image_url: Optional[str] = None
    image_description: Optional[str] = None
    audio_url: Optional[str] = None
    audio_generated_at: Optional[datetime] = None
    ipa_pronunciation: Optional[str] = None
    ipa_audio_url: Optional[str] = None
    ipa_generated_at: Optional[datetime] = None
    difficulty: Optional[str] = None
    pie_root: Optional[str] = None
    pie_meaning: Optional[str] = None

class Flashcard(FlashcardBase):
    id: UUID
    language_id: UUID
    source: str
    times_reviewed: Optional[int] = 0
    last_reviewed: Optional[datetime] = None
    # Spaced repetition fields
    ease_factor: Optional[float] = 2.5
    review_interval: Optional[int] = 0
    repetition_count: Optional[int] = 0
    next_review_date: Optional[date] = None
    difficulty: Optional[str] = "unrated"
    is_synced: bool
    local_only: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_serializer('id', 'language_id')
    def serialize_uuid(self, value):
        return str(value)

    class Config:
        from_attributes = True


# Study / Spaced Repetition Schemas
class StudyReviewRequest(BaseModel):
    quality: int = Field(..., ge=0, le=5, description="Review quality 0-5 (0=again, 2=hard, 4=good, 5=easy)")
    time_spent_seconds: Optional[int] = None

class StudyReviewResponse(BaseModel):
    flashcard_id: str
    quality: int
    new_interval: int
    new_ease_factor: float
    next_review_date: date
    repetition_count: int
    difficulty: str
    session_recorded: bool

class StudyStatsResponse(BaseModel):
    total_cards: int
    due_today: int
    overdue: int
    new_cards: int        # never reviewed
    learning: int         # 1-3 reviews
    familiar: int         # 4-10 reviews
    mastered: int         # 10+ reviews
    streak_days: int
    total_sessions: int
    avg_ease_factor: Optional[float]
    by_language: List[dict]

class StudyProgressResponse(BaseModel):
    reviews_last_30_days: List[dict]   # [{date, count}]
    cumulative_learned: List[dict]     # [{date, count}]
    mastery_distribution: dict         # {new, learning, familiar, mastered}
    pronunciation_stats: Optional[dict]

# AI Generation Schemas
class AIGenerateRequest(BaseModel):
    word_or_phrase: str
    language_id: UUID
    include_image: bool = True

class AIGenerateResponse(BaseModel):
    word_or_phrase: str
    definition: str
    etymology: Optional[str] = None
    english_cognates: Optional[str] = None
    related_words: List[str] = []
    image_description: Optional[str] = None
    image_url: Optional[str] = None

# User Authentication Schemas
class UserBase(BaseModel):
    username: str
    email: str
    preferred_instruction_language: str = "en"

class UserCreate(BaseModel):
    """For email/password registration"""
    username: str
    email: str
    password: str
    preferred_instruction_language: str = "en"

class UserLogin(BaseModel):
    """For email/password login"""
    email: str
    password: str

class UserUpdate(BaseModel):
    """For updating user profile"""
    username: Optional[str] = None
    preferred_instruction_language: Optional[str] = None

class User(UserBase):
    """User response schema"""
    id: UUID
    auth_provider: str
    name: Optional[str] = None
    picture: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    @field_serializer('id')
    def serialize_id(self, value):
        return str(value)
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: User

class TokenData(BaseModel):
    """Data stored in JWT token"""
    user_id: str
    email: str
    exp: Optional[int] = None

class UserPreferencesUpdate(BaseModel):
    preferred_instruction_language: str


# UserLanguage Schemas
class UserLanguageBase(BaseModel):
    instruction_language: Optional[str] = None
    proficiency_level: Optional[str] = None

class UserLanguageCreate(UserLanguageBase):
    user_id: UUID
    language_id: UUID

class UserLanguage(UserLanguageBase):
    id: UUID
    user_id: UUID
    language_id: UUID
    created_at: datetime
    updated_at: datetime
    
    @field_serializer('id', 'user_id', 'language_id')
    def serialize_ids(self, value):
        return str(value)
    
    class Config:
        from_attributes = True

class UserLanguageUpdate(BaseModel):
    instruction_language: Optional[str] = None
    proficiency_level: Optional[str] = None


# Batch Processing Schemas
class BatchProcessRequest(BaseModel):
    csv_file_path: str
    user_id: str = "00000000-0000-0000-0000-000000000001"  # Default user UUID for testing
    language_id: str = "00000000-0000-0000-0000-000000000001"  # Default French language UUID
    max_words: Optional[int] = None  # Limit for testing

class BatchProcessResponse(BaseModel):
    batch_id: str
    status: str
    message: str
    total_words: int

class BatchStatusResponse(BaseModel):
    batch_id: str
    status: str
    total_words: int
    processed: int
    successful: int
    failed: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    flashcards: List[dict] = []

# Sync Schemas (for offline support)
class SyncRequest(BaseModel):
    flashcards: List[FlashcardCreate]
    last_sync: Optional[datetime] = None

class SyncResponse(BaseModel):
    synced_count: int
    conflicts: List[str] = []
    server_flashcards: List[Flashcard] = []