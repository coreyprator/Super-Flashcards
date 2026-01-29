"""
SQLAlchemy model for PronunciationPromptTemplates table.
Sprint 8.5 - Gemini Deep Analysis Integration
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func

from app.database import Base


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
