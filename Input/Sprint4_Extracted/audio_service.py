# backend/app/services/audio_service.py
"""
Audio generation service using OpenAI TTS
Handles audio generation, storage, and management
"""
import os
from pathlib import Path
from typing import Optional, Tuple
import uuid
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

# Audio storage directory (similar to images)
AUDIO_DIR = Path(__file__).parent.parent.parent.parent / "audio"
AUDIO_DIR.mkdir(exist_ok=True)

# Voice mapping for different languages
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
    """
    
    def __init__(self):
        """Initialize OpenAI client"""
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Lazy initialization of OpenAI client"""
        try:
            self.client = OpenAI()
            logger.info("OpenAI client initialized for TTS")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            raise
    
    def generate_word_audio(
        self,
        word: str,
        language_name: str,
        flashcard_id: str
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Generate TTS audio for a single word
        
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
        try:
            # Select appropriate voice
            voice = TTS_VOICE_MAPPING.get(language_name, 'alloy')
            
            logger.info(f"Generating audio for '{word}' in {language_name} using voice '{voice}'")
            
            # Generate audio using OpenAI TTS
            response = self.client.audio.speech.create(
                model="tts-1-hd",  # High-quality model
                voice=voice,
                input=word,
                response_format="mp3"
            )
            
            # Generate unique filename
            filename = f"{flashcard_id}.mp3"
            file_path = AUDIO_DIR / filename
            
            # Save audio file
            file_path.write_bytes(response.content)
            
            # Return relative path for database
            relative_path = f"/audio/{filename}"
            
            logger.info(f"Audio saved: {relative_path} ({len(response.content)} bytes)")
            
            return True, relative_path, None
            
        except Exception as e:
            error_msg = f"Audio generation failed: {str(e)}"
            logger.error(error_msg)
            return False, None, error_msg
    
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
