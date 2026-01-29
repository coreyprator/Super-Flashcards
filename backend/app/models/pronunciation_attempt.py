# backend/app/models/pronunciation_attempt.py
"""
SQLAlchemy model for pronunciation practice attempts
"""
from sqlalchemy import Column, String, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class PronunciationAttempt(Base):
    """
    Stores user pronunciation practice attempts.
    
    Fields:
        id: Unique attempt identifier (UUID)
        flashcard_id: Reference to flashcard being practiced
        user_id: User who made the attempt
        audio_url: GCS URL of the recording
        target_text: What the user should pronounce (French phrase)
        transcribed_text: What Google Cloud Speech-to-Text recognized
        overall_confidence: Overall confidence score (0.0-1.0)
        word_scores: JSON array of word-level scores and confidence
        ipa_target: IPA representation of target text
        ipa_transcribed: IPA representation of transcribed text (optional)
        created_at: Timestamp of attempt
    """
    __tablename__ = "pronunciation_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    flashcard_id = Column(String(36), ForeignKey("flashcards.id"), nullable=False)
    user_id = Column(String(36), nullable=False)  # Can be "anonymous" or user UUID
    audio_url = Column(String(500), nullable=False)  # GCS URL
    target_text = Column(Text, nullable=False)  # What they should say
    transcribed_text = Column(Text, nullable=False)  # What was recognized
    overall_confidence = Column(Float, default=0.0)  # 0.0-1.0
    word_scores = Column(JSON, nullable=True)  # Array of word scores
    ipa_target = Column(Text, nullable=True)  # IPA of target
    ipa_transcribed = Column(Text, nullable=True)  # IPA of transcribed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<PronunciationAttempt(id={self.id}, flashcard_id={self.flashcard_id}, user_id={self.user_id}, score={self.overall_confidence})>"
