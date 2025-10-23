# backend/app/schemas.py
from pydantic import BaseModel, Field, field_serializer
from typing import Optional, List
from datetime import datetime
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
    audio_url: Optional[str] = None  # Sprint 4: TTS audio file URL
    audio_generated_at: Optional[datetime] = None  # Sprint 4: When audio was generated
    ipa_pronunciation: Optional[str] = None  # IPA phonetic transcription
    ipa_audio_url: Optional[str] = None  # TTS from IPA pronunciation
    ipa_generated_at: Optional[datetime] = None  # When IPA audio was generated

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
    audio_url: Optional[str] = None  # Sprint 4: TTS audio file URL
    audio_generated_at: Optional[datetime] = None  # Sprint 4: When audio was generated
    ipa_pronunciation: Optional[str] = None  # IPA phonetic transcription
    ipa_audio_url: Optional[str] = None  # TTS from IPA pronunciation
    ipa_generated_at: Optional[datetime] = None  # When IPA audio was generated

class Flashcard(FlashcardBase):
    id: UUID  # CORRECTED: id DOES exist in Cloud SQL!
    language_id: UUID  # CORRECTED: language_id DOES exist in Cloud SQL!
    source: str
    times_reviewed: Optional[int] = 0
    last_reviewed: Optional[datetime] = None
    is_synced: bool
    local_only: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @field_serializer('id', 'language_id')
    def serialize_uuid(self, value):
        return str(value)
    
    class Config:
        from_attributes = True

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