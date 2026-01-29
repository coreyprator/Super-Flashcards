# backend/app/models.py
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Boolean, text, String, Numeric, Text
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER, NVARCHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import sqlalchemy

from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=generate_uuid)
    
    # Basic info
    username = Column(NVARCHAR(50), unique=True, nullable=False)
    email = Column(NVARCHAR(255), unique=True, nullable=False)  # Now required and unique
    
    # Authentication fields
    password_hash = Column(NVARCHAR(255), nullable=True)  # Null for OAuth-only users
    auth_provider = Column(NVARCHAR(20), default='email')  # 'email', 'google', 'github', etc.
    
    # Google OAuth fields
    google_id = Column(NVARCHAR(255), unique=True, nullable=True)  # Google's unique user ID
    name = Column(NVARCHAR(100), nullable=True)  # Full name from OAuth
    picture = Column(NVARCHAR(500), nullable=True)  # Profile picture URL
    
    # Preferences
    preferred_instruction_language = Column(NVARCHAR(10), default='en')
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Email verification status
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.getdate())
    updated_at = Column(DateTime, server_default=func.getdate(), onupdate=func.getdate())
    last_login = Column(DateTime, nullable=True)
    
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


# Pronunciation Attempts - Track user pronunciation practice
class PronunciationAttempt(Base):
    __tablename__ = "pronunciation_attempts"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=generate_uuid)
    flashcard_id = Column(UNIQUEIDENTIFIER, ForeignKey("flashcards.id"), nullable=False)
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey('users.id'), nullable=False)
    
    audio_url = Column(NVARCHAR(500), nullable=False)  # GCS URL for user recording
    target_text = Column(NVARCHAR(500), nullable=False)  # What they should have said
    transcribed_text = Column(NVARCHAR(500), nullable=True)  # What Google STT heard
    overall_confidence = Column(Numeric(5, 4), nullable=True)  # 0.0000 to 1.0000 as DECIMAL(5,4)
    word_scores = Column(NVARCHAR(None), nullable=True)  # JSON array of per-word scores
    ipa_target = Column(NVARCHAR(200), nullable=True)  # Target IPA
    ipa_transcribed = Column(NVARCHAR(200), nullable=True)  # What was detected (if available)
    
    created_at = Column(DateTime, server_default=func.getdate())
    
    # Relationships
    # flashcard = relationship("Flashcard")
    # user = relationship("User")


# API Debug Logs - For troubleshooting image/audio generation
class APIDebugLog(Base):
    __tablename__ = "api_debug_logs"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=generate_uuid)
    flashcard_id = Column(UNIQUEIDENTIFIER, nullable=True)  # Link to flashcard if applicable
    operation_type = Column(NVARCHAR(50), nullable=False)  # 'image_generation', 'audio_generation', 'batch_generate'
    word = Column(NVARCHAR(500), nullable=True)  # The word being processed
    status = Column(NVARCHAR(20), nullable=False)  # 'started', 'success', 'failed'
    step = Column(NVARCHAR(100), nullable=True)  # Current processing step
    input_data = Column(NVARCHAR(None), nullable=True)  # JSON input parameters
    output_data = Column(NVARCHAR(None), nullable=True)  # JSON output/result
    error_message = Column(NVARCHAR(None), nullable=True)  # Error message if failed
    error_traceback = Column(NVARCHAR(None), nullable=True)  # Full traceback if failed
    duration_ms = Column(Integer, nullable=True)  # How long the operation took
    api_provider = Column(NVARCHAR(50), nullable=True)  # 'openai', 'google_cloud', etc.
    api_model = Column(NVARCHAR(50), nullable=True)  # 'dall-e-3', 'gpt-4', etc.
    created_at = Column(DateTime, server_default=func.getdate())


# Pronunciation Prompt Templates - Sprint 8.5 Gemini Deep Analysis
class PronunciationPromptTemplate(Base):
    __tablename__ = "PronunciationPromptTemplates"
    
    template_id = Column("TemplateID", Integer, primary_key=True, autoincrement=True)
    language_code = Column("LanguageCode", String(10), nullable=False)
    native_language = Column("NativeLanguage", String(50), default="English")
    prompt_template = Column("PromptTemplate", Text, nullable=False)
    common_interferences = Column("CommonInterferences", Text, nullable=True)
    is_active = Column("IsActive", Boolean, default=True)
    created_at = Column("CreatedAt", DateTime, server_default=func.now())
    updated_at = Column("UpdatedAt", DateTime, server_default=func.now(), onupdate=func.now())