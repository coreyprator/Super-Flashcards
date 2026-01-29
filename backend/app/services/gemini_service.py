"""
Gemini Deep Analysis Service for Pronunciation Coaching
Sprint 8.5 - Super Flashcards
"""
import os
import json
import base64
import logging
from typing import Optional
import google.generativeai as genai
from sqlalchemy.orm import Session

from app import models, crud

logger = logging.getLogger(__name__)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class GeminiPronunciationService:
    """
    Provides qualitative pronunciation coaching via Gemini API.
    Designed to complement quantitative STT word-confidence scores.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.model = genai.GenerativeModel(GEMINI_MODEL) if GEMINI_API_KEY else None
    
    def is_available(self) -> bool:
        """Check if Gemini service is configured and available."""
        return self.model is not None
    
    def get_prompt_template(self, language_code: str) -> Optional[dict]:
        """
        Retrieve the language-specific prompt template.
        
        Args:
            language_code: ISO language code (fr, es, el, etc.)
            
        Returns:
            Dict with prompt_template and common_interferences, or None
        """
        template = self.db.query(models.PronunciationPromptTemplate).filter(
            models.PronunciationPromptTemplate.language_code == language_code,
            models.PronunciationPromptTemplate.is_active == True
        ).first()
        
        if not template:
            logger.warning(f"No prompt template found for language: {language_code}")
            return None
        
        return {
            "language_code": template.language_code,
            "native_language": template.native_language,
            "prompt_template": template.prompt_template,
            "common_interferences": json.loads(template.common_interferences) if template.common_interferences else {}
        }
    
    def analyze_pronunciation(
        self,
        audio_data: bytes,
        target_phrase: str,
        language_code: str,
        stt_word_scores: Optional[list] = None
    ) -> dict:
        """
        Analyze pronunciation using Gemini's audio understanding.
        
        Args:
            audio_data: Raw audio bytes (WAV or MP3)
            target_phrase: What the user was supposed to say
            language_code: Target language code
            stt_word_scores: Optional STT results for cross-validation
            
        Returns:
            Dict containing Gemini analysis results
        """
        if not self.is_available():
            return {"error": "Gemini service not configured"}
        
        # Get language-specific prompt
        template_data = self.get_prompt_template(language_code)
        if not template_data:
            # Fall back to generic prompt
            prompt = self._get_generic_prompt(target_phrase)
        else:
            prompt = template_data["prompt_template"].replace("{target_phrase}", target_phrase)
        
        try:
            # Prepare audio for Gemini
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Create content with audio
            response = self.model.generate_content([
                {
                    "mime_type": "audio/wav",  # Adjust based on actual format
                    "data": audio_base64
                },
                prompt
            ])
            
            # Parse JSON response
            response_text = response.text
            
            # Clean up response (Gemini sometimes wraps in markdown)
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            gemini_results = json.loads(response_text.strip())
            
            # Cross-validate with STT if available
            if stt_word_scores:
                gemini_results = self._cross_validate(gemini_results, stt_word_scores)
            
            return {
                "success": True,
                "results": gemini_results
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            return {
                "success": False,
                "error": "Failed to parse analysis results",
                "raw_response": response.text if 'response' in locals() else None
            }
        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _cross_validate(self, gemini_results: dict, stt_word_scores: list) -> dict:
        """
        Cross-validate Gemini findings against STT confidence scores.
        Suppress Gemini flags for words where STT confidence > 0.90.
        
        Args:
            gemini_results: Parsed Gemini analysis
            stt_word_scores: List of {"word": str, "confidence": float}
            
        Returns:
            Enhanced results with cross-validation info
        """
        high_confidence_words = {
            score["word"].lower() 
            for score in stt_word_scores 
            if score.get("confidence", 0) > 0.90
        }
        
        low_confidence_words = {
            score["word"].lower(): score["confidence"]
            for score in stt_word_scores 
            if score.get("confidence", 0) <= 0.90
        }
        
        suppressed_flags = []
        confirmed_issues = []
        
        # Check sound_issues against STT confidence
        if "sound_issues" in gemini_results:
            validated_issues = []
            for issue in gemini_results["sound_issues"]:
                # Extract word from the issue (best effort)
                issue_text = issue.get("example_comparison", "").lower()
                
                # Check if any high-confidence word is mentioned
                flagged_high_conf = any(word in issue_text for word in high_confidence_words)
                flagged_low_conf = any(word in issue_text for word in low_confidence_words)
                
                if flagged_high_conf and not flagged_low_conf:
                    suppressed_flags.append(
                        f"Gemini flagged issue in '{issue.get('example_comparison')}' "
                        f"but STT confidence was high - may be false positive"
                    )
                    issue["confidence_warning"] = "STT showed high confidence - verify this issue"
                elif flagged_low_conf:
                    word_match = [w for w in low_confidence_words if w in issue_text]
                    if word_match:
                        confirmed_issues.append(
                            f"'{word_match[0]}' flagged by both systems "
                            f"(STT: {low_confidence_words[word_match[0]]:.2f})"
                        )
                        issue["cross_validated"] = True
                
                validated_issues.append(issue)
            
            gemini_results["sound_issues"] = validated_issues
        
        gemini_results["cross_validation"] = {
            "suppressed_flags": suppressed_flags,
            "confirmed_issues": confirmed_issues,
            "high_confidence_words": list(high_confidence_words),
            "low_confidence_words": list(low_confidence_words.keys())
        }
        
        return gemini_results
    
    def _get_generic_prompt(self, target_phrase: str) -> str:
        """Fallback prompt when no language-specific template exists."""
        return f'''Act as an expert pronunciation coach. Analyze this audio of someone saying: "{target_phrase}"

CRITICAL RULES:
- ONLY flag issues you actually hear in THIS specific recording
- If you do not hear a problem, do not mention it
- Be encouraging but honest

Respond in this exact JSON format:
{{
  "clarity_score": <1-10>,
  "rhythm": "<choppy|smooth|natural|staccato|hesitant>",
  "sound_issues": [
    {{
      "target_sound": "<what it should sound like>",
      "produced_sound": "<what was actually produced>",
      "example_comparison": "<specific example>",
      "suggestion": "<brief coaching tip>"
    }}
  ],
  "word_stress_issues": "<description or null>",
  "top_drill": "<one specific practice exercise>",
  "encouragement": "<brief positive note>"
}}'''


async def process_deep_analysis(
    db: Session,
    attempt_id: str,
    audio_data: bytes
) -> dict:
    """
    Main entry point for deep analysis processing.
    Called after STT processing is complete.
    
    Args:
        db: Database session
        attempt_id: UUID of the pronunciation attempt
        audio_data: Raw audio bytes
        
    Returns:
        Combined STT + Gemini results
    """
    # Fetch the existing attempt with STT results
    attempt = crud.get_pronunciation_attempt(db, attempt_id)
    if not attempt:
        return {"error": "Pronunciation attempt not found"}
    
    # Get the flashcard for language info
    flashcard = crud.get_flashcard(db, attempt.flashcard_id)
    if not flashcard:
        return {"error": "Associated flashcard not found"}
    
    # Initialize Gemini service
    gemini_service = GeminiPronunciationService(db)
    
    if not gemini_service.is_available():
        return {"error": "Gemini service not available"}
    
    # Parse existing STT word scores
    stt_word_scores = json.loads(attempt.word_scores) if attempt.word_scores else None
    
    # Run Gemini analysis
    gemini_result = gemini_service.analyze_pronunciation(
        audio_data=audio_data,
        target_phrase=attempt.target_text,
        language_code=flashcard.language.code,
        stt_word_scores=stt_word_scores
    )
    
    if gemini_result.get("success"):
        # Update the attempt record
        results = gemini_result["results"]
        crud.update_pronunciation_attempt_gemini(
            db=db,
            attempt_id=attempt_id,
            gemini_analysis=json.dumps(results),
            clarity_score=results.get("clarity_score"),
            rhythm_assessment=results.get("rhythm"),
            top_issue=results.get("sound_issues", [{}])[0].get("example_comparison") if results.get("sound_issues") else None,
            drill=results.get("top_drill"),
            analysis_type="stt_plus_gemini"
        )
    
    return {
        "attempt_id": attempt_id,
        "stt_results": {
            "transcribed_text": attempt.transcribed_text,
            "overall_confidence": float(attempt.overall_confidence) if attempt.overall_confidence else None,
            "word_scores": stt_word_scores
        },
        "gemini_results": gemini_result.get("results") if gemini_result.get("success") else None,
        "error": gemini_result.get("error")
    }
