# backend/app/services/pronunciation_service.py
"""
Pronunciation Practice Service
Handles audio recording, speech-to-text transcription, IPA generation, and feedback
"""
from google.cloud import speech_v1 as speech
from google.cloud import storage
import asyncio
import epitran
from typing import Optional, Dict, List, Any
from .ipa_diff_service import compare_ipa
import json
import logging
import os
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app import models
from app.services.gemini_service import GeminiPronunciationService
import time

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
        db: Session,
        language_code: str = "fr"
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
            language_code: Language code for processing
        
        Returns:
            {
                "attempt_id": str,
                "target_text": str,
                "transcribed_text": str,
                "overall_score": float (0.0-1.0),
                "word_scores": list,
                "ipa_target": str,
                "feedback": str,
                "error": Optional[str],  # "no_audio", "no_speech", etc.
            }
        """
        # Generate unique request ID for tracking
        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()
        
        def log_step(step: str, status: str, data: dict = None, duration_ms: int = None):
            """Helper to log each processing step with consistent format."""
            elapsed = int((time.time() - start_time) * 1000) if duration_ms is None else duration_ms
            log_data = {
                "request_id": request_id,
                "user_id": user_id,
                "step": step,
                "status": status,
                "elapsed_ms": elapsed,
                **(data or {})
            }
            logger.info(f"[{request_id}] {step}: {status} ({elapsed}ms) {json.dumps(data or {})}")
            return log_data
        
        try:
            log_step("START", "processing", {
                "target_text": target_text[:30],
                "language_code": language_code,
                "audio_bytes": len(audio_content) if audio_content else 0
            })
            
            # STEP 1: Validate audio content
            if not audio_content or len(audio_content) < 1000:
                log_step("AUDIO_VALIDATION", "FAILED", {
                    "reason": "audio_too_small",
                    "size": len(audio_content) if audio_content else 0
                })
                return {
                    "success": False,
                    "error": "no_audio",
                    "message": "No audio detected. Please check your microphone and try again.",
                    "transcribed_text": "",
                    "overall_score": 0,
                    "word_scores": [],
                    "ipa_target": self._text_to_ipa(target_text),
                    "ipa_transcribed": "",
                    "ipa_diff": None,
                    "feedback": "🎤 No audio detected. Please enable your microphone and try again."
                }
            
            log_step("AUDIO_VALIDATION", "success", {"size": len(audio_content)})
            
            # STEP 2: Upload audio to GCS
            try:
                audio_url = await self._upload_audio(audio_content, user_id, flashcard_id)
                log_step("AUDIO_UPLOAD", "success", {"url": audio_url[:50] + "..."})
            except Exception as e:
                log_step("AUDIO_UPLOAD", "FAILED", {"error": str(e)})
                logger.error(f"[{request_id}] ❌ Audio upload failed: {e}")
                # Continue anyway - upload failure shouldn't block analysis
                audio_url = None
            
            # STEP 3: Transcribe with Google Cloud Speech-to-Text
            try:
                transcription = await self._transcribe_audio(audio_content, language_code)
                log_step("STT", "success", {
                    "transcription": transcription['transcript'][:50],
                    "confidence": transcription['overall_confidence'],
                    "words": len(transcription['word_scores'])
                })
            except Exception as e:
                log_step("STT", "FAILED", {"error": str(e)})
                raise
            
            # Check for empty transcription
            if not transcription['transcript'] or not transcription['transcript'].strip():
                log_step("STT", "EMPTY_RESULT", {"transcript_len": len(transcription.get('transcript', ''))})
                return {
                    "success": True,
                    "error": "no_speech",
                    "message": "No speech detected. Please speak louder and closer to the microphone.",
                    "transcribed_text": "",
                    "overall_score": 0,
                    "word_scores": [],
                    "ipa_target": self._text_to_ipa(target_text),
                    "ipa_transcribed": "",
                    "ipa_diff": None,
                    "feedback": "🔇 No speech detected. Please speak louder and try again."
                }
            
            # STEP 4: Generate IPA for target and transcribed text
            try:
                ipa_target = self._text_to_ipa(target_text)
                ipa_transcribed = self._text_to_ipa(transcription['transcript'])
                log_step("IPA", "success", {
                    "target": ipa_target[:30],
                    "spoken": ipa_transcribed[:30]
                })
            except Exception as e:
                log_step("IPA", "FAILED", {"error": str(e)})
                logger.warning(f"[{request_id}] ⚠️ IPA generation failed: {e}")
                ipa_target, ipa_transcribed = "", ""
            
            # STEP 5: Run Gemini coaching (non-blocking fallback)
            gemini_service = GeminiPronunciationService(db)
            gemini_result = None
            if gemini_service.is_available():
                try:
                    gemini_result = await asyncio.to_thread(
                        gemini_service.analyze_pronunciation,
                        audio_data=audio_content,
                        target_phrase=target_text,
                        language_code=language_code,
                        stt_word_scores=transcription['word_scores']
                    )
                    log_step("GEMINI", "success", {
                        "clarity": gemini_result.get("results", {}).get("clarity_score") if gemini_result else None
                    })
                except Exception as e:
                    log_step("GEMINI", "FAILED", {"error": str(e)})
                    logger.warning(f"[{request_id}] ⚠️ Gemini analysis failed (non-blocking): {e}")
            else:
                log_step("GEMINI", "skipped", {"reason": "not_available"})
            
            # STEP 6: Build feedback and calculate adjusted score
            if gemini_result and gemini_result.get("success"):
                feedback = self._build_rich_feedback(
                    gemini_result.get("results", {}),
                    transcription['word_scores']
                )
            else:
                feedback = self._build_basic_feedback(
                    transcription['word_scores'],
                    transcription['transcript'],
                    target_text
                )
            
            # Calculate overall score: prioritize transcription match over confidence
            overall_score, _ = self._calculate_overall_score(
                target_text,
                transcription['transcript'],
                transcription['overall_confidence']
            )
            
            # Generate IPA diff with color-coding info
            ipa_diff = compare_ipa(ipa_target, ipa_transcribed) if ipa_target and ipa_transcribed else None
            
            log_step("IPA_DIFF", "success", {
                "match_ratio": ipa_diff.get("match_ratio") if ipa_diff else 0
            })
            
            # STEP 7: Store attempt in database
            attempt_id = await self._store_attempt(
                db=db,
                flashcard_id=flashcard_id,
                user_id=user_id,
                audio_url=audio_url,
                target_text=target_text,
                transcribed_text=transcription['transcript'],
                overall_confidence=overall_score,  # Use adjusted score
                word_scores=transcription['word_scores'],
                ipa_target=ipa_target,
                ipa_transcribed=ipa_transcribed,
                gemini_result=gemini_result
            )
            log_step("DB_STORE", "success", {"attempt_id": attempt_id})
            
            log_step("COMPLETE", "success", {
                "overall_score": overall_score,
                "transcribed_text": transcription['transcript'][:30]
            })
            
            return {
                "success": True,
                "attempt_id": attempt_id,
                "target_text": target_text,
                "transcribed_text": transcription['transcript'],
                "overall_score": overall_score,  # Adjusted score
                "word_scores": transcription['word_scores'],
                "ipa_target": ipa_target,
                "ipa_transcribed": ipa_transcribed,
                "ipa_diff": ipa_diff,  # NEW: Phoneme-by-phoneme comparison with color info
                "feedback": feedback,
                "coaching": gemini_result.get("results") if gemini_result and gemini_result.get("success") else None
            }
        
        except Exception as e:
            log_step("ERROR", "FAILED", {"error": str(e), "type": type(e).__name__})
            logger.error(f"[{request_id}] ❌ Error analyzing pronunciation: {e}", exc_info=True)
            raise
                except Exception as e:
                    logger.warning(f"⚠️ Gemini analysis failed (non-blocking): {e}")
            
            # 5. Build feedback and calculate adjusted score (Gemini if available)
            if gemini_result and gemini_result.get("success"):
                feedback = self._build_rich_feedback(
                    gemini_result.get("results", {}),
                    transcription['word_scores']
                )
            else:
                feedback = self._build_basic_feedback(
                    transcription['word_scores'],
                    transcription['transcript'],
                    target_text
                )
            
            # Calculate overall score: prioritize transcription match over confidence
            overall_score, _ = self._calculate_overall_score(
                target_text,
                transcription['transcript'],
                transcription['overall_confidence']
            )
            
            # Generate IPA diff with color-coding info
            ipa_diff = compare_ipa(ipa_target, ipa_transcribed)
            
            # 6. Store attempt in database
            attempt_id = await self._store_attempt(
                db=db,
                flashcard_id=flashcard_id,
                user_id=user_id,
                audio_url=audio_url,
                target_text=target_text,
                transcribed_text=transcription['transcript'],
                overall_confidence=overall_score,  # Use adjusted score
                word_scores=transcription['word_scores'],
                ipa_target=ipa_target,
                ipa_transcribed=ipa_transcribed,
                gemini_result=gemini_result
            )
            logger.info(f"✅ Attempt stored: {attempt_id}")
            
            return {
                "attempt_id": attempt_id,
                "target_text": target_text,
                "transcribed_text": transcription['transcript'],
                "overall_score": overall_score,  # Adjusted score
                "word_scores": transcription['word_scores'],
                "ipa_target": ipa_target,
                "ipa_transcribed": ipa_transcribed,
                "ipa_diff": ipa_diff,  # NEW: Phoneme-by-phoneme comparison with color info
                "feedback": feedback,
                "coaching": gemini_result.get("results") if gemini_result and gemini_result.get("success") else None
            }
        
        except Exception as e:
            logger.error(f"❌ Error analyzing pronunciation: {e}")
            raise
    
    async def _transcribe_audio(self, audio_content: bytes, language_code: str = "fr") -> Dict[str, Any]:
        """
        Call Google Cloud Speech-to-Text with word-level confidence enabled.
        
        Args:
            audio_content: Raw audio bytes
            language_code: Language code for speech recognition (e.g., "fr", "es", "de")
        
        Returns:
            {
                "transcript": str,
                "word_scores": list,
                "overall_confidence": float
            }
        """
        try:
            # Map language codes to Google STT language codes
            lang_map = {
                "fr": "fr-FR",
                "es": "es-ES",
                "de": "de-DE",
                "it": "it-IT",
                "pt": "pt-PT",
                "en": "en-US",
                "ja": "ja-JP",
                "zh": "zh-CN",
                "el": "el-GR"
            }
            stt_language = lang_map.get(language_code, "fr-FR")
            
            audio = speech.RecognitionAudio(content=audio_content)
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=48000,
                language_code=stt_language,
                enable_word_confidence=True,
                enable_automatic_punctuation=True,
            )
            
            logger.info(f"📞 Calling Google Cloud Speech-to-Text API ({stt_language})")
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
            # Clean input: remove numbers and special chars that epitran can't handle
            # Keep only letters, spaces, hyphens, and apostrophes
            import re
            cleaned_text = re.sub(r'[^a-zA-ZàâäæçéèêëïîôœùûüœÀÂÄÆÇÉÈÊËÏÎÔŒÙÛÜŒ\s\-\']', '', text)
            cleaned_text = cleaned_text.strip()
            
            if not cleaned_text:
                # If no pronounceable characters, return empty
                logger.warning(f"⚠️ No pronounceable characters in '{text}'")
                return ""
            
            ipa = self.epi.transliterate(cleaned_text)
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
    
    def _calculate_overall_score(self, target: str, transcribed: str, confidence: float) -> tuple:
        """
        Calculate score and feedback. Prioritize transcription match over confidence.
        
        PRIORITY 1: If transcription matches perfectly, it's success (ignore low confidence)
        PRIORITY 2: If partial match, credit proportionally
        PRIORITY 3: If no match, use confidence to determine feedback
        
        Args:
            target: Expected text
            transcribed: What STT heard
            confidence: STT confidence (0.0-1.0)
        
        Returns:
            tuple: (adjusted_score, feedback_message)
        """
        target_clean = target.lower().strip()
        transcribed_clean = transcribed.lower().strip()
        
        # PRIORITY 1: Exact match = perfect, ignore low confidence
        if transcribed_clean == target_clean:
            # If transcription matched, user pronounced it correctly
            # Even if STT confidence was low (due to audio quality, accent, etc)
            adjusted_score = max(confidence, 0.90)  # Minimum 90% if exact match
            return (adjusted_score, "✅ Perfect! Your pronunciation was understood exactly.")
        
        # PRIORITY 2: Word-level matching for partial credit
        target_words = target_clean.split()
        transcribed_words = transcribed_clean.split()
        
        if len(target_words) == len(transcribed_words):
            matches = sum(1 for t, tr in zip(target_words, transcribed_words) if t == tr)
            if matches > 0:
                match_ratio = matches / len(target_words)
                if match_ratio >= 0.8:
                    adjusted_score = max(confidence, 0.75)  # Minimum 75% for near-match
                    return (adjusted_score, f"👍 Good! {matches}/{len(target_words)} words matched.")
        
        # PRIORITY 3: Use confidence for non-matching transcriptions
        if confidence >= 0.7:
            return (confidence, f"📝 Heard: '{transcribed}'. Close, but not quite. Try again!")
        else:
            return (confidence, f"🔄 Heard: '{transcribed}'. Try again, speaking more clearly.")
    
    
    def _build_rich_feedback(self, gemini_results: Dict[str, Any], word_scores: List[Dict]) -> str:
        """Build rich feedback text from Gemini analysis."""
        parts = []
        
        clarity = gemini_results.get("clarity_score")
        if clarity is not None:
            if clarity >= 8:
                parts.append(f"🌟 Excellent clarity ({clarity}/10).")
            elif clarity >= 6:
                parts.append(f"👍 Good clarity ({clarity}/10).")
            else:
                parts.append(f"📝 Clarity: {clarity}/10 — keep practicing.")
        
        issues = gemini_results.get("sound_issues", [])
        if issues:
            top_issue = issues[0]
            suggestion = top_issue.get("suggestion")
            example = top_issue.get("example_comparison")
            if suggestion:
                parts.append(f"💡 Tip: {suggestion}")
            if example:
                parts.append(f"   Example: {example}")
        
        drill = gemini_results.get("top_drill")
        if drill:
            parts.append(f"🎯 Practice: {drill}")
        
        encouragement = gemini_results.get("encouragement")
        if encouragement:
            parts.append(f"✨ {encouragement}")
        
        return "\n".join(parts) if parts else self._build_basic_feedback(word_scores, "", "")

    def _build_basic_feedback(self, word_scores: List[Dict], transcribed: str, target: str) -> str:
        """Fallback feedback when Gemini is unavailable. Prioritizes transcription match."""
        # Use the new priority-based score calculation
        overall_confidence = (
            sum(w['confidence'] for w in word_scores) / len(word_scores)
            if word_scores else 0.5
        )
        
        adjusted_score, feedback = self._calculate_overall_score(
            target, transcribed, overall_confidence
        )
        
        return feedback
    
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
        ipa_target: str,
        ipa_transcribed: str,
        gemini_result: Optional[Dict[str, Any]] = None
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
                ipa_transcribed=ipa_transcribed,
                analysis_type="stt_plus_gemini" if gemini_result and gemini_result.get("success") else "stt_only",
                created_at=datetime.utcnow()
            )

            if gemini_result and gemini_result.get("success"):
                results = gemini_result.get("results", {})
                attempt.gemini_analysis = json.dumps(results)
                attempt.gemini_clarity_score = results.get("clarity_score")
                attempt.gemini_rhythm_assessment = results.get("rhythm")
                if results.get("sound_issues"):
                    attempt.gemini_top_issue = results.get("sound_issues", [{}])[0].get("example_comparison")
                attempt.gemini_drill = results.get("top_drill")
                attempt.gemini_processed_at = datetime.utcnow()
            
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
