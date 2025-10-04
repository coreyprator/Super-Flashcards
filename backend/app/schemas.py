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

class FlashcardCreate(FlashcardBase):
    language_id: UUID
    source: str = "manual"

class FlashcardUpdate(BaseModel):
    word_or_phrase: Optional[str] = None
    definition: Optional[str] = None
    etymology: Optional[str] = None
    english_cognates: Optional[str] = None
    related_words: Optional[str] = None
    image_url: Optional[str] = None
    image_description: Optional[str] = None

class Flashcard(FlashcardBase):
    id: UUID
    language_id: UUID
    source: str
    times_reviewed: int
    last_reviewed: Optional[datetime] = None
    is_synced: bool
    local_only: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    language: Language
    
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

# Sync Schemas (for offline support)
class SyncRequest(BaseModel):
    flashcards: List[FlashcardCreate]
    last_sync: Optional[datetime] = None

class SyncResponse(BaseModel):
    synced_count: int
    conflicts: List[str] = []
    server_flashcards: List[Flashcard] = []