# backend/app/services/google_tts_service.py
"""
Google Cloud Text-to-Speech Service for production-quality pronunciation
"""
import os
import logging
from pathlib import Path
from typing import Optional, Tuple
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from google.cloud import texttospeech
    GOOGLE_TTS_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Google Cloud TTS not available: {e}")
    texttospeech = None
    GOOGLE_TTS_AVAILABLE = False

logger = logging.getLogger(__name__)

# Audio storage directory
AUDIO_DIR = Path(os.path.join(os.path.dirname(__file__), "../../../audio"))
AUDIO_DIR.mkdir(exist_ok=True)

class GoogleTTSService:
    """
    Service for generating high-quality TTS audio using Google Cloud
    """
    
    def __init__(self):
        """Initialize Google Cloud TTS service"""
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Google Cloud TTS client"""
        if not GOOGLE_TTS_AVAILABLE:
            logger.warning("Google Cloud TTS package not available")
            return
            
        try:
            # Check if credentials are configured
            credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            if not credentials_path:
                logger.error("GOOGLE_APPLICATION_CREDENTIALS not set")
                return
                
            if not os.path.exists(credentials_path):
                logger.error(f"Credentials file not found: {credentials_path}")
                return
            
            self.client = texttospeech.TextToSpeechClient()
            logger.info("✅ Google Cloud TTS client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Cloud TTS client: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """Check if Google Cloud TTS is available"""
        return self.client is not None
    
    def generate_audio(self, text: str, language_code: str, flashcard_id: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Generate TTS audio using Google Cloud
        
        Args:
            text: Text to convert to speech
            language_code: Language code (e.g., 'fr-FR', 'el-GR')
            flashcard_id: ID of the flashcard for filename
            
        Returns:
            Tuple of (success, audio_url, error_message)
        """
        if not self.is_available():
            return False, None, "Google Cloud TTS not available"
        
        try:
            # Configure synthesis input
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Select voice based on language
            voice_config = self._get_voice_config(language_code)
            voice = texttospeech.VoiceSelectionParams(**voice_config)
            
            # Configure audio output
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            )
            
            # Perform the text-to-speech request
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            # Generate filename with timestamp to avoid browser caching
            import time
            timestamp = str(int(time.time()))
            filename = f"{flashcard_id}_google_{timestamp}.mp3"
            audio_path = AUDIO_DIR / filename
            audio_data = response.audio_content
            
            # Upload to Cloud Storage
            try:
                from google.cloud import storage
                storage_client = storage.Client()
                bucket = storage_client.bucket("super-flashcards-media")
                blob = bucket.blob(f"audio/{filename}")
                
                # Upload the audio
                blob.upload_from_string(audio_data, content_type="audio/mpeg")
                blob.make_public()
                
                logger.info(f"✅ Uploaded Google TTS audio to Cloud Storage: audio/{filename}")
                
                # Return the URL path (will be proxied by /audio/* endpoint)
                audio_url = f"/audio/{filename}"
                return True, audio_url, None
                
            except Exception as storage_error:
                # If Cloud Storage upload fails, save locally as fallback
                logger.warning(f"⚠️ Cloud Storage upload failed: {storage_error}, saving locally")
                
                with open(audio_path, "wb") as out:
                    out.write(audio_data)
                
                audio_url = f"/audio/{filename}"
                logger.info(f"✅ Generated Google TTS audio (local): {filename}")
                return True, audio_url, None
            
        except Exception as e:
            logger.error(f"Google TTS generation failed for '{text}': {e}")
            return False, None, str(e)
    
    def _get_voice_config(self, language_code: str) -> dict:
        """
        Get optimal voice configuration for language
        """
        voice_configs = {
            'en-US': {
                'language_code': 'en-US',
                'name': 'en-US-Wavenet-D',  # High-quality English male voice
                'ssml_gender': texttospeech.SsmlVoiceGender.MALE
            },
            'fr-FR': {
                'language_code': 'fr-FR',
                'name': 'fr-FR-Wavenet-C',  # High-quality French female voice
                'ssml_gender': texttospeech.SsmlVoiceGender.FEMALE
            },
            'el-GR': {
                'language_code': 'el-GR', 
                'name': 'el-GR-Wavenet-A',  # High-quality Greek female voice
                'ssml_gender': texttospeech.SsmlVoiceGender.FEMALE
            },
            'es-ES': {
                'language_code': 'es-ES',
                'name': 'es-ES-Wavenet-B',  # High-quality Spanish male voice
                'ssml_gender': texttospeech.SsmlVoiceGender.MALE
            },
            'de-DE': {
                'language_code': 'de-DE',
                'name': 'de-DE-Wavenet-B',  # High-quality German male voice
                'ssml_gender': texttospeech.SsmlVoiceGender.MALE
            },
            'it-IT': {
                'language_code': 'it-IT',
                'name': 'it-IT-Wavenet-A',  # High-quality Italian female voice
                'ssml_gender': texttospeech.SsmlVoiceGender.FEMALE
            },
            'pt-PT': {
                'language_code': 'pt-PT',
                'name': 'pt-PT-Wavenet-A',  # High-quality Portuguese female voice
                'ssml_gender': texttospeech.SsmlVoiceGender.FEMALE
            },
            'ja-JP': {
                'language_code': 'ja-JP',
                'name': 'ja-JP-Wavenet-A',  # High-quality Japanese female voice
                'ssml_gender': texttospeech.SsmlVoiceGender.FEMALE
            },
            'zh-CN': {
                'language_code': 'zh-CN',
                'name': 'cmn-CN-Wavenet-B',  # High-quality Mandarin male voice
                'ssml_gender': texttospeech.SsmlVoiceGender.MALE
            },
        }
        
        # Default to English if language not found
        return voice_configs.get(language_code, voice_configs['en-US'])

# Global service instance
google_tts_service = GoogleTTSService()