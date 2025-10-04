# backend/app/models.py
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Boolean, text
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER, NVARCHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Language(Base):
    __tablename__ = "languages"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=generate_uuid)
    name = Column(NVARCHAR(100), unique=True, nullable=False)  # "French", "Greek"
    code = Column(NVARCHAR(5), unique=True, nullable=False)  # "fr", "el"
    created_at = Column(DateTime, server_default=func.getdate())
    
    # Relationship
    flashcards = relationship("Flashcard", back_populates="language")

class Flashcard(Base):
    __tablename__ = "flashcards"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=generate_uuid)
    language_id = Column(UNIQUEIDENTIFIER, ForeignKey("languages.id"), nullable=False)
    
    # Core content - Using NVARCHAR for Unicode (Greek, French, etc.)
    word_or_phrase = Column(NVARCHAR(500), nullable=False, index=True)
    definition = Column(NVARCHAR(None))  # NVARCHAR(MAX)
    etymology = Column(NVARCHAR(None))  # NVARCHAR(MAX)
    english_cognates = Column(NVARCHAR(None))  # NVARCHAR(MAX)
    related_words = Column(NVARCHAR(None))  # JSON as NVARCHAR(MAX)
    
    # Image
    image_url = Column(NVARCHAR(1000))  # Cloudinary URL or local path
    image_description = Column(NVARCHAR(None))  # Alt text / DALL-E prompt
    
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
    
    # Relationship
    language = relationship("Language", back_populates="flashcards")

# Phase 2: Study sessions for spaced repetition
class StudySession(Base):
    __tablename__ = "study_sessions"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=generate_uuid)
    flashcard_id = Column(UNIQUEIDENTIFIER, ForeignKey("flashcards.id"), nullable=False)
    
    reviewed_at = Column(DateTime, server_default=func.getdate())
    ease_rating = Column(Integer)  # 1-5: how easy was it to recall?
    time_spent_seconds = Column(Integer)
    
    created_at = Column(DateTime, server_default=func.getdate())