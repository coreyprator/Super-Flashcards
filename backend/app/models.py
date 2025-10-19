# backend/app/models.py
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Boolean, text, String
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER, NVARCHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=generate_uuid)
    username = Column(NVARCHAR(50), unique=True, nullable=False)
    email = Column(NVARCHAR(255), nullable=True)
    password_hash = Column(NVARCHAR(255), nullable=True)
    preferred_instruction_language = Column(NVARCHAR(10), default='en')
    created_at = Column(DateTime, server_default=func.getdate())
    updated_at = Column(DateTime, server_default=func.getdate())
    
    # Relationships - Commented out for Cloud SQL (FK columns missing)
    # flashcards = relationship("Flashcard", back_populates="user")
    # study_sessions = relationship("StudySession", back_populates="user")
    # user_languages = relationship("UserLanguage", back_populates="user")


class UserLanguage(Base):
    __tablename__ = "user_languages"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=generate_uuid)
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey('users.id'), nullable=False)
    language_id = Column(UNIQUEIDENTIFIER, ForeignKey('languages.id'), nullable=False)
    instruction_language = Column(NVARCHAR(10), nullable=True)
    proficiency_level = Column(NVARCHAR(20), nullable=True)
    created_at = Column(DateTime, server_default=func.getdate())
    updated_at = Column(DateTime, server_default=func.getdate())
    
    # Relationships - Commented out for Cloud SQL
    # user = relationship("User", back_populates="user_languages")
    # language = relationship("Language")


class Language(Base):
    __tablename__ = "languages"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=generate_uuid)
    name = Column(NVARCHAR(100), unique=True, nullable=False)  # "French", "Greek"
    code = Column(NVARCHAR(5), unique=True, nullable=False)  # "fr", "el"
    created_at = Column(DateTime, server_default=func.getdate())
    
    # Relationship - CORRECTED: Flashcard DOES have language_id
    flashcards = relationship("Flashcard", back_populates="language")

class Flashcard(Base):
    __tablename__ = "flashcards"
    
    # CORRECTED: id and language_id DO exist in Cloud SQL database!
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=generate_uuid)
    language_id = Column(UNIQUEIDENTIFIER, ForeignKey("languages.id"), nullable=False)
    word_or_phrase = Column(NVARCHAR(500), nullable=False, index=True)
    
    # user_id doesn't exist in Cloud SQL schema (no user authentication yet)
    # user_id = Column(UNIQUEIDENTIFIER, ForeignKey('users.id'), nullable=True)
    
    # Core content - Using NVARCHAR for Unicode (Greek, French, etc.)
    definition = Column(NVARCHAR(None))  # NVARCHAR(MAX)
    etymology = Column(NVARCHAR(None))  # NVARCHAR(MAX)
    english_cognates = Column(NVARCHAR(None))  # NVARCHAR(MAX)
    related_words = Column(NVARCHAR(None))  # JSON as NVARCHAR(MAX)
    
    # Image
    image_url = Column(NVARCHAR(1000))  # Cloudinary URL or local path
    image_description = Column(NVARCHAR(None))  # Alt text / DALL-E prompt
    
    # Audio (Sprint 4: TTS functionality)
    audio_url = Column(NVARCHAR(500))  # Path to audio file
    audio_generated_at = Column(DateTime)  # When audio was generated
    
    # IPA Pronunciation (Mini-Sprint: Pronunciation Enhancement)
    ipa_pronunciation = Column(NVARCHAR(500))  # International Phonetic Alphabet
    ipa_audio_url = Column(NVARCHAR(500))  # TTS from IPA pronunciation
    ipa_generated_at = Column(DateTime)  # When IPA audio was generated
    
    # Metadata
    source = Column(NVARCHAR(50), default="manual")  # manual, ai_generated, imported
    times_reviewed = Column(Integer, default=0)
    last_reviewed = Column(DateTime)
    
    # Sync metadata (for offline support)
    is_synced = Column(Boolean, default=True)
    local_only = Column(Boolean, default=False)  # Created offline, not yet synced
    
    # Timestamps - Using DATETIME2 for better precision
    created_at = Column(DateTime, server_default=func.getdate())
    updated_at = Column(DateTime, server_default=func.getdate(), onupdate=func.getdate())
    
    # Relationships - CORRECTED: language_id exists, so enable relationship
    language = relationship("Language", back_populates="flashcards")
    # user = relationship("User", back_populates="flashcards")  # user_id doesn't exist yet

# Phase 2: Study sessions for spaced repetition
class StudySession(Base):
    __tablename__ = "study_sessions"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=generate_uuid)
    flashcard_id = Column(UNIQUEIDENTIFIER, ForeignKey("flashcards.id"), nullable=False)
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey('users.id'), nullable=True)
    
    reviewed_at = Column(DateTime, server_default=func.getdate())
    ease_rating = Column(Integer)  # 1-5: how easy was it to recall?
    time_spent_seconds = Column(Integer)
    
    created_at = Column(DateTime, server_default=func.getdate())
    
    # Relationships - Commented out for Cloud SQL
    # user = relationship("User", back_populates="study_sessions")