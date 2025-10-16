# backend/app/services/audio_service.py
"""
Audio generation service using Google TTS (primary) and OpenAI TTS (fallback)
Handles audio generation, storage, and management
"""
import os
from pathlib import Path
from typing import Optional, Tuple
import uuid
import logging

logger = logging.getLogger(__name__)

# Try to import OpenAI with graceful fallback
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError as e:
    logger.warning(f"OpenAI package not available: {e}")
    OpenAI = None
    OPENAI_AVAILABLE = False
except Exception as e:
    logger.warning(f"Failed to import OpenAI: {e}")
    OpenAI = None
    OPENAI_AVAILABLE = False

# Try to import Google TTS with graceful fallback
try:
    from google.cloud import texttospeech
    from app.services.google_tts_service import GoogleTTSService
    GOOGLE_TTS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Google TTS package not available: {e}")
    texttospeech = None
    GoogleTTSService = None
    GOOGLE_TTS_AVAILABLE = False
except Exception as e:
    logger.warning(f"Failed to import Google TTS: {e}")
    texttospeech = None
    GoogleTTSService = None
    GOOGLE_TTS_AVAILABLE = False

# Audio storage directory (similar to images)
AUDIO_DIR = Path(__file__).parent.parent.parent.parent / "audio"
AUDIO_DIR.mkdir(exist_ok=True)

# Voice mapping for different languages (OpenAI TTS - for fallback)
TTS_VOICE_MAPPING = {
    'French': 'nova',        # Female voice, good for French
    'Greek': 'alloy',        # Neutral voice
    'Spanish': 'nova',       # Female voice
    'German': 'onyx',        # Male voice
    'Italian': 'nova',       # Female voice
    'Portuguese': 'nova',    # Female voice
    'Japanese': 'shimmer',   # Female voice
    'Mandarin Chinese': 'alloy',  # Neutral voice
}


class AudioService:
    """
    Service for generating and managing TTS audio files
    Uses Google TTS as primary, OpenAI TTS as fallback
    """
    
    def __init__(self):
        """Initialize service with both Google TTS and OpenAI clients (background initialization)"""
        # Google TTS (primary)
        self.google_tts_service = None
        self._google_tts_initialized = False
        
        # OpenAI TTS (fallback)
        self.openai_client = None
        self._openai_client_initialized = False
        self._initialization_in_progress = False
    
    def _initialize_google_tts(self):
        """Lazy initialization of Google TTS service"""
        if self._google_tts_initialized:
            return
            
        if not GOOGLE_TTS_AVAILABLE:
            logger.warning("Google TTS package not available - using OpenAI as fallback")
            self.google_tts_service = None
            self._google_tts_initialized = True
            return
            
        try:
            self.google_tts_service = GoogleTTSService()
            logger.info("✅ Google TTS service initialized (PRIMARY)")
            self._google_tts_initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize Google TTS service: {e}")
            self.google_tts_service = None
            logger.warning("Google TTS service not initialized - will use OpenAI fallback")
            self._google_tts_initialized = True

    def _initialize_openai_client(self):
        """Lazy initialization of OpenAI client (fallback)"""
        if self._openai_client_initialized or self._initialization_in_progress:
            return
            
        self._initialization_in_progress = True
        
        if not OPENAI_AVAILABLE:
            logger.warning("OpenAI package not available - no fallback audio generation")
            self.openai_client = None
            self._openai_client_initialized = True
            self._initialization_in_progress = False
            return
            
        try:
            # Initialize OpenAI client with explicit parameters to avoid proxy issues
            self.openai_client = OpenAI(
                # The API key will be read from OPENAI_API_KEY environment variable
                # No need to explicitly pass proxy settings
            )
            logger.info("OpenAI client initialized for TTS (FALLBACK)")
            self._openai_client_initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            # For development, continue without failing the entire service
            self.openai_client = None
            logger.warning("OpenAI client not initialized - no fallback audio generation")
            self._openai_client_initialized = True
        finally:
            self._initialization_in_progress = False
    
    def start_background_initialization(self):
        """Start background initialization of both TTS services"""
        if (self._google_tts_initialized and self._openai_client_initialized) or self._initialization_in_progress:
            return
            
        import threading
        def init_in_background():
            logger.info("🔄 Starting background initialization of AudioService TTS clients...")
            
            # Initialize Google TTS first (primary)
            self._initialize_google_tts()
            
            # Initialize OpenAI TTS (fallback)
            self._initialize_openai_client()
            
            if self.google_tts_service:
                logger.info("✅ AudioService Google TTS ready (PRIMARY)!")
            if self.openai_client:
                logger.info("✅ AudioService OpenAI TTS ready (FALLBACK)!")
            if not self.google_tts_service and not self.openai_client:
                logger.error("❌ No TTS services available!")
        
        thread = threading.Thread(target=init_in_background, daemon=True)
        thread.start()
        logger.info("🚀 AudioService background initialization started")
    
    def is_ready(self) -> bool:
        """Check if the service is ready to use (either Google TTS or OpenAI)"""
        return (self._google_tts_initialized and self.google_tts_service is not None) or \
               (self._openai_client_initialized and self.openai_client is not None)
    
    def wait_for_initialization(self, timeout: int = 30):
        """
        Wait for initialization to complete, with timeout
        Returns True if ready, False if timeout or failed
        """
        import time
        start_time = time.time()
        
        while not (self._google_tts_initialized and self._openai_client_initialized) and (time.time() - start_time) < timeout:
            if not self._initialization_in_progress:
                # If not in progress and not initialized, start it
                self._initialize_google_tts()
                self._initialize_openai_client()
                break
            time.sleep(0.5)
        
        return self.is_ready()
    
    def generate_word_audio(
        self,
        word: str,
        language_name: str,
        flashcard_id: str
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Generate TTS audio for a single word
        Uses Google TTS as primary, OpenAI TTS as fallback
        
        Args:
            word: The word to speak
            language_name: Name of the language (e.g., "French")
            flashcard_id: ID of the flashcard (for filename)
        
        Returns:
            Tuple of (success, audio_path, error_message)
            - success: True if audio generated successfully
            - audio_path: Relative path to audio file (e.g., "/audio/word_uuid.mp3")
            - error_message: Error description if failed, None if successful
        """
        # Initialize services if not already done
        if not self._google_tts_initialized:
            self._initialize_google_tts()
        if not self._openai_client_initialized:
            self._initialize_openai_client()
        
        # Generate unique filename with timestamp to avoid browser caching
        import time
        timestamp = str(int(time.time()))
        filename = f"{flashcard_id}_{timestamp}.mp3"
        file_path = AUDIO_DIR / filename
        relative_path = f"/audio/{filename}"
        
        # Try Google TTS first (PRIMARY)
        if self.google_tts_service:
            try:
                logger.info(f"🔷 Attempting Google TTS for '{word}' in {language_name}")
                
                success, audio_url, error_msg = self.google_tts_service.generate_audio(
                    text=word,
                    language_code=self._get_language_code(language_name),
                    flashcard_id=flashcard_id
                )
                
                if success and audio_url:
                    logger.info(f"✅ Google TTS success: {audio_url}")
                    return True, audio_url, None
                else:
                    logger.warning(f"🔶 Google TTS failed: {error_msg}, trying OpenAI fallback")
                    
            except Exception as e:
                logger.warning(f"🔶 Google TTS failed: {str(e)}, trying OpenAI fallback")
        
        # Fallback to OpenAI TTS (FALLBACK)
        if self.openai_client:
            try:
                logger.info(f"🔸 Attempting OpenAI TTS fallback for '{word}' in {language_name}")
                
                # Select appropriate voice
                voice = TTS_VOICE_MAPPING.get(language_name, 'alloy')
                
                # Generate audio using OpenAI TTS
                response = self.openai_client.audio.speech.create(
                    model="tts-1-hd",  # High-quality model
                    voice=voice,
                    input=word,
                    response_format="mp3"
                )
                
                # Save audio file
                file_path.write_bytes(response.content)
                
                logger.info(f"✅ OpenAI TTS fallback success: {relative_path} ({len(response.content)} bytes)")
                return True, relative_path, None
                
            except Exception as e:
                logger.error(f"❌ OpenAI TTS fallback also failed: {str(e)}")
        
        # Both services failed
        error_msg = "Audio generation failed: Both Google TTS and OpenAI TTS are unavailable"
        logger.error(error_msg)
        return False, None, error_msg
    
    def _get_language_code(self, language_name: str) -> str:
        """Convert language name to language code for Google TTS"""
        language_mapping = {
            'French': 'fr-FR',
            'Greek': 'el-GR',
            'Spanish': 'es-ES',
            'German': 'de-DE',
            'Italian': 'it-IT',
            'Portuguese': 'pt-PT',
            'Japanese': 'ja-JP',
            'Mandarin Chinese': 'zh-CN',
            'Chinese': 'zh-CN',
            'English': 'en-US'
        }
        return language_mapping.get(language_name, 'en-US')
    
    def delete_audio(self, audio_path: str) -> bool:
        """
        Delete audio file from filesystem
        
        Args:
            audio_path: Relative path like "/audio/filename.mp3"
        
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            # Convert relative path to absolute
            filename = Path(audio_path).name
            file_path = AUDIO_DIR / filename
            
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted audio: {audio_path}")
                return True
            else:
                logger.warning(f"Audio file not found: {audio_path}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete audio {audio_path}: {e}")
            return False
    
    def audio_exists(self, audio_path: str) -> bool:
        """
        Check if audio file exists
        
        Args:
            audio_path: Relative path like "/audio/filename.mp3"
        
        Returns:
            True if file exists, False otherwise
        """
        try:
            filename = Path(audio_path).name
            file_path = AUDIO_DIR / filename
            return file_path.exists()
        except Exception:
            return False
    
    def get_audio_stats(self) -> dict:
        """
        Get statistics about audio files
        
        Returns:
            Dictionary with audio statistics
        """
        try:
            audio_files = list(AUDIO_DIR.glob("*.mp3"))
            total_size = sum(f.stat().st_size for f in audio_files)
            
            return {
                "total_files": len(audio_files),
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "audio_directory": str(AUDIO_DIR)
            }
        except Exception as e:
            logger.error(f"Failed to get audio stats: {e}")
            return {
                "total_files": 0,
                "total_size_mb": 0,
                "audio_directory": str(AUDIO_DIR),
                "error": str(e)
            }
