# backend/app/services/pronunciation_service.py
"""
Pronunciation Practice Service
Handles audio recording, speech-to-text transcription, IPA generation, and feedback
"""
from google.cloud import speech_v1 as speech
from google.cloud import storage
import epitran
from typing import Optional, Dict, List, Any
import json
import logging
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app import models

logger = logging.getLogger(__name__)


class PronunciationService:
    """
    Main service for pronunciation analysis and feedback.
    Uses Google Cloud Speech-to-Text and epitran for IPA conversion.
    """
    
    def __init__(self):
        """Initialize service clients and configuration"""
        try:
            self.speech_client = speech.SpeechClient()
            self.storage_client = storage.Client()
            self.epi = epitran.Epitran('fra-Latn')  # French IPA converter
            self.bucket_name = "super-flashcards-media"
            logger.info("✅ PronunciationService initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize PronunciationService: {e}")
            raise
    
    async def analyze_pronunciation(
        self, 
        audio_content: bytes, 
        target_text: str,
        user_id: str,
        flashcard_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Main entry point: analyze user audio against target text.
        Returns word-level confidence scores and IPA feedback.
        
        Args:
            audio_content: Raw audio bytes (WEBM/Opus format)
            target_text: French phrase user should pronounce
            user_id: User's unique ID
            flashcard_id: Flashcard being practiced
            db: Database session for storing attempt
        
        Returns:
            {
                "attempt_id": str,
                "target_text": str,
                "transcribed_text": str,
                "overall_score": float (0.0-1.0),
                "word_scores": list,
                "ipa_target": str,
                "feedback": str
            }
        """
        try:
            logger.info(f"🎤 Analyzing pronunciation for flashcard {flashcard_id}")
            
            # 1. Upload audio to GCS
            audio_url = await self._upload_audio(audio_content, user_id, flashcard_id)
            logger.info(f"✅ Audio uploaded to GCS: {audio_url}")
            
            # 2. Transcribe with Google Cloud Speech-to-Text
            transcription = await self._transcribe_audio(audio_content)
            logger.info(f"✅ Transcription complete: {transcription['transcript']}")
            
            # 3. Generate IPA for target text
            ipa_target = self._text_to_ipa(target_text)
            logger.info(f"✅ IPA generated: {ipa_target}")
            
            # 4. Generate feedback
            feedback = self._generate_feedback(
                target_text,
                transcription['transcript'],
                transcription['word_scores'],
                ipa_target
            )
            
            # 5. Store attempt in database
            attempt_id = await self._store_attempt(
                db=db,
                flashcard_id=flashcard_id,
                user_id=user_id,
                audio_url=audio_url,
                target_text=target_text,
                transcribed_text=transcription['transcript'],
                overall_confidence=transcription['overall_confidence'],
                word_scores=transcription['word_scores'],
                ipa_target=ipa_target
            )
            logger.info(f"✅ Attempt stored: {attempt_id}")
            
            return {
                "attempt_id": attempt_id,
                "target_text": target_text,
                "transcribed_text": transcription['transcript'],
                "overall_score": transcription['overall_confidence'],
                "word_scores": transcription['word_scores'],
                "ipa_target": ipa_target,
                "feedback": feedback
            }
        
        except Exception as e:
            logger.error(f"❌ Error analyzing pronunciation: {e}")
            raise
    
    async def _transcribe_audio(self, audio_content: bytes) -> Dict[str, Any]:
        """
        Call Google Cloud Speech-to-Text with word-level confidence enabled.
        
        Args:
            audio_content: Raw audio bytes
        
        Returns:
            {
                "transcript": str,
                "word_scores": list,
                "overall_confidence": float
            }
        """
        try:
            audio = speech.RecognitionAudio(content=audio_content)
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=48000,
                language_code="fr-FR",
                enable_word_confidence=True,
                enable_automatic_punctuation=True,
            )
            
            logger.info("📞 Calling Google Cloud Speech-to-Text API")
            response = self.speech_client.recognize(config=config, audio=audio)
            
            word_scores = []
            transcript = ""
            
            if response.results:
                alt = response.results[0].alternatives[0]
                transcript = alt.transcript
                
                for word_info in alt.words:
                    word_scores.append({
                        "word": word_info.word,
                        "confidence": round(float(word_info.confidence), 4),
                        "status": self._score_to_status(float(word_info.confidence))
                    })
            
            # Calculate overall confidence
            if word_scores:
                overall = sum(w['confidence'] for w in word_scores) / len(word_scores)
            else:
                overall = 0.0
            
            return {
                "transcript": transcript,
                "word_scores": word_scores,
                "overall_confidence": round(overall, 4)
            }
        
        except Exception as e:
            logger.error(f"❌ Transcription error: {e}")
            raise
    
    def _text_to_ipa(self, text: str) -> str:
        """
        Convert French text to IPA using epitran.
        
        Args:
            text: French text to convert
        
        Returns:
            IPA representation string
        """
        try:
            ipa = self.epi.transliterate(text)
            return ipa
        except Exception as e:
            logger.warning(f"⚠️ IPA conversion failed for '{text}': {e}")
            return ""
    
    def _score_to_status(self, confidence: float) -> str:
        """
        Convert confidence score to human-readable status.
        
        Args:
            confidence: Float between 0.0 and 1.0
        
        Returns:
            "good", "acceptable", or "needs_work"
        """
        if confidence >= 0.85:
            return "good"
        elif confidence >= 0.70:
            return "acceptable"
        else:
            return "needs_work"
    
    def _generate_feedback(
        self, 
        target: str, 
        transcribed: str, 
        word_scores: List[Dict], 
        ipa: str
    ) -> str:
        """
        Generate human-readable pronunciation feedback.
        
        Args:
            target: Target French phrase
            transcribed: What Google STT heard
            word_scores: List of word-level scores
            ipa: IPA representation of target
        
        Returns:
            Feedback string
        """
        try:
            # Check if transcription matches target
            if transcribed.lower() == target.lower():
                return "Excellent pronunciation! All words were clearly understood."
            
            # Find problem words
            problem_words = [w for w in word_scores if w['status'] == 'needs_work']
            
            if not problem_words:
                return f"Good! The transcription matches well: '{transcribed}'"
            
            # Build feedback from top 3 problem words
            feedback_parts = []
            for pw in problem_words[:3]:
                confidence_pct = int(pw['confidence'] * 100)
                feedback_parts.append(f"'{pw['word']}' ({confidence_pct}%)")
            
            return f"Focus on improving: {', '.join(feedback_parts)}. Try to pronounce these words more clearly."
        
        except Exception as e:
            logger.warning(f"⚠️ Feedback generation failed: {e}")
            return "Try again - your pronunciation will improve with practice!"
    
    async def _upload_audio(
        self, 
        audio_content: bytes, 
        user_id: str, 
        flashcard_id: str
    ) -> str:
        """
        Upload audio file to Google Cloud Storage.
        
        Args:
            audio_content: Raw audio bytes
            user_id: User's unique ID
            flashcard_id: Flashcard being practiced
        
        Returns:
            GCS URL for the uploaded file
        """
        try:
            # Generate unique filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
            filename = f"pronunciation/{user_id}/{flashcard_id}/{timestamp}.webm"
            
            # Upload to GCS
            bucket = self.storage_client.bucket(self.bucket_name)
            blob = bucket.blob(filename)
            blob.upload_from_string(audio_content, content_type="audio/webm")
            
            # Return public URL
            audio_url = f"gs://{self.bucket_name}/{filename}"
            logger.info(f"✅ Audio uploaded: {audio_url}")
            return audio_url
        
        except Exception as e:
            logger.error(f"❌ GCS upload failed: {e}")
            raise
    
    async def _store_attempt(
        self,
        db: Session,
        flashcard_id: str,
        user_id: str,
        audio_url: str,
        target_text: str,
        transcribed_text: str,
        overall_confidence: float,
        word_scores: List[Dict],
        ipa_target: str
    ) -> str:
        """
        Store pronunciation attempt in database.
        
        Args:
            db: Database session
            flashcard_id: Flashcard ID
            user_id: User ID
            audio_url: GCS URL of recording
            target_text: Target phrase
            transcribed_text: Transcribed text from STT
            overall_confidence: Overall confidence score
            word_scores: List of word-level scores
            ipa_target: Target IPA
        
        Returns:
            Attempt ID
        """
        try:
            attempt = models.PronunciationAttempt(
                flashcard_id=flashcard_id,
                user_id=user_id,
                audio_url=audio_url,
                target_text=target_text,
                transcribed_text=transcribed_text,
                overall_confidence=overall_confidence,
                word_scores=json.dumps(word_scores),
                ipa_target=ipa_target,
                created_at=datetime.utcnow()
            )
            
            db.add(attempt)
            db.commit()
            db.refresh(attempt)
            
            # AttemptID is auto-generated by SQL Server IDENTITY column
            attempt_id = str(attempt.id) if attempt.id else "unknown"
            logger.info(f"✅ Attempt stored in database: {attempt_id}")
            return attempt_id
        
        except Exception as e:
            logger.error(f"❌ Database storage failed: {e}")
            db.rollback()
            raise
    
    async def get_user_progress(self, user_id: str, db: Session) -> Dict[str, Any]:
        """
        Get user's pronunciation progress over time.
        
        Args:
            user_id: User's unique ID
            db: Database session
        
        Returns:
            {
                "total_attempts": int,
                "avg_confidence": float,
                "problem_words": list,
                "improvement_trend": str
            }
        """
        try:
            # Get all attempts for user
            attempts = db.query(models.PronunciationAttempt).filter(
                models.PronunciationAttempt.user_id == user_id
            ).order_by(models.PronunciationAttempt.created_at.desc()).all()
            
            if not attempts:
                return {
                    "total_attempts": 0,
                    "avg_confidence": 0.0,
                    "problem_words": [],
                    "improvement_trend": "No attempts yet"
                }
            
            # Calculate statistics
            total_attempts = len(attempts)
            avg_confidence = sum(a.overall_confidence for a in attempts if a.overall_confidence) / total_attempts
            
            # Find problem words (lowest average confidence)
            word_stats: Dict[str, Dict] = {}
            for attempt in attempts:
                if attempt.word_scores:
                    scores = json.loads(attempt.word_scores)
                    for score in scores:
                        word = score['word']
                        if word not in word_stats:
                            word_stats[word] = {'total': 0, 'count': 0}
                        word_stats[word]['total'] += score['confidence']
                        word_stats[word]['count'] += 1
            
            # Calculate averages and sort
            problem_words = []
            for word, stats in word_stats.items():
                avg = stats['total'] / stats['count']
                problem_words.append({
                    "word": word,
                    "avg_confidence": round(avg, 4),
                    "attempts": stats['count']
                })
            
            problem_words.sort(key=lambda x: x['avg_confidence'])
            problem_words = problem_words[:10]  # Top 10 problem words
            
            # Calculate trend (improvement over last 30 days vs before)
            # Simplified: compare first 50% to last 50% of attempts
            mid_point = total_attempts // 2
            if mid_point > 0:
                first_half_avg = sum(a.overall_confidence for a in attempts[mid_point:] if a.overall_confidence) / (total_attempts - mid_point)
                second_half_avg = sum(a.overall_confidence for a in attempts[:mid_point] if a.overall_confidence) / mid_point
                improvement = ((second_half_avg - first_half_avg) / first_half_avg * 100) if first_half_avg > 0 else 0
                trend = f"+{improvement:.0f}%" if improvement > 0 else f"{improvement:.0f}%"
            else:
                trend = "Insufficient data"
            
            return {
                "total_attempts": total_attempts,
                "avg_confidence": round(avg_confidence, 4),
                "problem_words": problem_words,
                "improvement_trend": trend
            }
        
        except Exception as e:
            logger.error(f"❌ Error getting progress: {e}")
            raise
    
    async def get_flashcard_history(
        self, 
        flashcard_id: str, 
        db: Session, 
        skip: int = 0, 
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Get attempt history for a specific flashcard.
        
        Args:
            flashcard_id: Flashcard ID
            db: Database session
            skip: Number of records to skip (pagination)
            limit: Number of records to return
        
        Returns:
            {
                "flashcard_id": str,
                "total_attempts": int,
                "avg_confidence": float,
                "attempts": list,
                "pagination": {...}
            }
        """
        try:
            # Get total count
            total = db.query(models.PronunciationAttempt).filter(
                models.PronunciationAttempt.flashcard_id == flashcard_id
            ).count()
            
            # Get paginated attempts
            attempts = db.query(models.PronunciationAttempt).filter(
                models.PronunciationAttempt.flashcard_id == flashcard_id
            ).order_by(
                models.PronunciationAttempt.created_at.desc()
            ).offset(skip).limit(limit).all()
            
            # Calculate average confidence
            if attempts:
                avg_confidence = sum(a.overall_confidence for a in attempts if a.overall_confidence) / len(attempts)
            else:
                avg_confidence = 0.0
            
            # Format attempts
            attempt_list = []
            for attempt in attempts:
                word_scores = []
                if attempt.word_scores:
                    word_scores = json.loads(attempt.word_scores)
                
                attempt_list.append({
                    "id": str(attempt.id),
                    "user_id": str(attempt.user_id),
                    "target_text": attempt.target_text,
                    "transcribed_text": attempt.transcribed_text,
                    "overall_confidence": attempt.overall_confidence,
                    "word_scores": word_scores,
                    "created_at": attempt.created_at.isoformat() if attempt.created_at else None
                })
            
            return {
                "flashcard_id": flashcard_id,
                "total_attempts": total,
                "avg_confidence": round(avg_confidence, 4),
                "attempts": attempt_list,
                "pagination": {
                    "skip": skip,
                    "limit": limit,
                    "total": total,
                    "pages": (total + limit - 1) // limit
                }
            }
        
        except Exception as e:
            logger.error(f"❌ Error getting history: {e}")
            raise
    
    async def generate_ipa_for_flashcard(
        self, 
        flashcard_id: str, 
        db: Session
    ) -> Dict[str, Any]:
        """
        Generate and store IPA pronunciation for a flashcard.
        Used for batch processing.
        
        Args:
            flashcard_id: Flashcard ID
            db: Database session
        
        Returns:
            {
                "flashcard_id": str,
                "word_or_phrase": str,
                "ipa": str,
                "success": bool
            }
        """
        try:
            # Get flashcard
            flashcard = db.query(models.Flashcard).filter(
                models.Flashcard.id == flashcard_id
            ).first()
            
            if not flashcard:
                raise ValueError(f"Flashcard {flashcard_id} not found")
            
            # Generate IPA
            ipa = self._text_to_ipa(flashcard.word_or_phrase)
            
            # Update flashcard
            flashcard.ipa_pronunciation = ipa
            db.commit()
            
            logger.info(f"✅ IPA generated for flashcard {flashcard_id}: {ipa}")
            
            return {
                "flashcard_id": flashcard_id,
                "word_or_phrase": flashcard.word_or_phrase,
                "ipa": ipa,
                "success": True
            }
        
        except Exception as e:
            logger.error(f"❌ Error generating IPA: {e}")
            db.rollback()
            raise
