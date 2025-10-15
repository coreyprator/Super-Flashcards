# backend/app/services/ipa_service.py
"""
IPA Pronunciation Service for Super-Flashcards
Handles International Phonetic Alphabet transcription and audio generation
"""
import os
import requests
import logging
from typing import Optional, Tuple
from pathlib import Path
import uuid

# Try to import OpenAI with graceful fallback
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError as e:
    logging.warning(f"OpenAI package not available: {e}")
    OpenAI = None
    OPENAI_AVAILABLE = False
except Exception as e:
    logging.warning(f"Failed to import OpenAI: {e}")
    OpenAI = None
    OPENAI_AVAILABLE = False

logger = logging.getLogger(__name__)

# IPA Audio storage directory - match main.py path construction
import os
IPA_AUDIO_DIR = Path(os.path.join(os.path.dirname(__file__), "../../../ipa_audio"))
IPA_AUDIO_DIR.mkdir(exist_ok=True)

class IPAService:
    """
    Service for generating IPA pronunciations and audio
    """
    
    def __init__(self):
        """Initialize service without OpenAI client (background initialization)"""
        self.client = None
        self._client_initialized = False
        self._initialization_in_progress = False
    
    def _initialize_client(self):
        """Lazy initialization of OpenAI client"""
        if self._client_initialized or self._initialization_in_progress:
            return
            
        self._initialization_in_progress = True
        
        if not OPENAI_AVAILABLE:
            logger.warning("OpenAI package not available - IPA audio generation will not work") 
            self.client = None
            self._client_initialized = True
            self._initialization_in_progress = False
            return
            
        try:
            self.client = OpenAI()
            logger.info("OpenAI client initialized for IPA audio generation")
            self._client_initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            self.client = None
            logger.warning("OpenAI client not initialized - IPA audio generation will not work")
            self._client_initialized = True
        finally:
            self._initialization_in_progress = False
    
    def start_background_initialization(self):
        """Start background initialization of OpenAI client"""
        if self._client_initialized or self._initialization_in_progress:
            return
            
        import threading
        def init_in_background():
            logger.info("🔄 Starting background initialization of IPAService OpenAI client...")
            self._initialize_client()
            if self.client:
                logger.info("✅ IPAService OpenAI client ready!")
            else:
                logger.warning("⚠️ IPAService OpenAI client initialization failed")
        
        thread = threading.Thread(target=init_in_background, daemon=True)
        thread.start()
        logger.info("🚀 IPAService background initialization started")
    
    def is_ready(self) -> bool:
        """Check if the service is ready to use"""
        return self._client_initialized and self.client is not None
    
    def wait_for_initialization(self, timeout: int = 30):
        """
        Wait for initialization to complete, with timeout
        Returns True if ready, False if timeout or failed
        """
        import time
        start_time = time.time()
        
        while not self._client_initialized and (time.time() - start_time) < timeout:
            if not self._initialization_in_progress:
                # If not in progress and not initialized, start it
                self._initialize_client()
                break
            time.sleep(0.5)
        
        return self.is_ready()
    
    def get_ipa_pronunciation(self, word: str, language: str) -> Optional[str]:
        """
        Get IPA pronunciation for a word using multiple sources
        
        Priority:
        1. Wiktionary API (free, reliable)
        2. OpenAI GPT (fallback, requires API key)
        3. Language-specific heuristics
        
        Args:
            word: Word or phrase to get IPA for
            language: Language name (e.g., "French", "Spanish")
            
        Returns:
            IPA pronunciation string or None if not found
        """
        logger.info(f"Getting IPA pronunciation for '{word}' in {language}")
        
        # Try Wiktionary first (free and reliable)
        ipa = self._get_ipa_from_wiktionary(word, language)
        if ipa:
            logger.info(f"Found IPA from Wiktionary: {ipa}")
            return ipa
        
        # Ensure OpenAI client is initialized before checking it
        if not self._client_initialized:
            self._initialize_client()
        
        # Fallback to OpenAI if available
        if self.client:
            ipa = self._get_ipa_from_openai(word, language)
            if ipa:
                logger.info(f"Found IPA from OpenAI: {ipa}")
                return ipa
        
        logger.warning(f"No IPA pronunciation found for '{word}' in {language}")
        return None
    
    def _get_ipa_from_wiktionary(self, word: str, language: str) -> Optional[str]:
        """
        Get IPA from Wiktionary API
        """
        try:
            # Map common language names to Wiktionary language codes
            lang_map = {
                'French': 'fr',
                'Spanish': 'es', 
                'German': 'de',
                'Italian': 'it',
                'Portuguese': 'pt',
                'English': 'en'
            }
            
            lang_code = lang_map.get(language, 'en')
            
            # Wiktionary API endpoint
            url = f"https://{lang_code}.wiktionary.org/api/rest_v1/page/definition/{word}"
            
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                # Parse response to extract IPA
                # This is a simplified parser - Wiktionary structure varies
                for definition in data.get(lang_code, []):
                    for sense in definition.get('definitions', []):
                        definition_text = sense.get('definition', '')
                        # Look for IPA patterns in definition
                        if '/' in definition_text and any(char in definition_text for char in 'æɛɪʊəɑɔ'):
                            # Extract IPA between forward slashes
                            import re
                            ipa_match = re.search(r'/([^/]+)/', definition_text)
                            if ipa_match:
                                return ipa_match.group(1).strip()
                                
        except Exception as e:
            logger.warning(f"Wiktionary API failed for '{word}': {e}")
        
        return None
    
    def _get_ipa_from_openai(self, word: str, language: str) -> Optional[str]:
        """
        Get IPA pronunciation using OpenAI GPT
        """
        # Initialize client if not already done
        self._initialize_client()
        
        if not self.client:
            return None
            
        try:
            # Language-specific examples to reduce bias
            examples = {
                'French': '/ɛksɑ̃pl/ for "exemple", /vi/ for "vie", /vis/ for "vis"',
                'Spanish': '/ejemplo/ for "ejemplo", /βiða/ for "vida"',
                'German': '/baɪʃpiːl/ for "Beispiel", /leːbən/ for "Leben"',
                'Italian': '/ezempio/ for "esempio", /vita/ for "vita"'
            }
            
            language_example = examples.get(language, '/ɛksɑ̃pl/ for "example"')
            
            prompt = f"""You are a linguistics expert. Provide the correct International Phonetic Alphabet (IPA) pronunciation for the {language} word "{word}".

IMPORTANT: This is a {language} word, not English. Use {language} phonology and pronunciation rules.

Examples of {language} IPA: {language_example}

Return ONLY the IPA transcription without forward slashes, like: vis

Do not include English pronunciation, explanations, or other formatting."""
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a linguistics expert specializing in IPA pronunciation."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=50,
                temperature=0.1
            )
            
            ipa_text = response.choices[0].message.content.strip()
            
            # Clean up the response
            if ipa_text.startswith('/') and ipa_text.endswith('/'):
                ipa_text = ipa_text[1:-1]  # Remove forward slashes
            
            # More comprehensive IPA validation
            # Include basic IPA characters plus common French phonemes
            ipa_chars = 'æɛɪʊəɑɔɒɜɪʏøœɤɯɨɪ̃ɛ̃ɑ̃ɔ̃ŋɲɻɾʃʒθðχɣħʕʔabcdefghijklmnopqrstuvwxyzɡβɸɟçʝɲʎʋɽɐɞɵɘɚɶɪ̯ʊ̯'
            
            # Log the raw response for debugging
            logger.info(f"OpenAI returned IPA: '{ipa_text}' for '{word}' in {language}")
            
            # Accept if it contains IPA characters OR looks like phonetic transcription
            if (any(char in ipa_text for char in ipa_chars) or 
                len(ipa_text) > 0 and ipa_text.replace(' ', '').isalpha()):
                logger.info(f"Accepting IPA transcription: {ipa_text}")
                return ipa_text
            else:
                logger.warning(f"IPA validation failed for: '{ipa_text}'")
                
        except Exception as e:
            logger.error(f"OpenAI IPA generation failed for '{word}': {e}")
        
        return None
    
    def generate_ipa_audio(self, ipa_text: str, word: str, language: str, flashcard_id: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Generate TTS audio from IPA pronunciation
        
        Args:
            ipa_text: IPA pronunciation text
            word: Original word (for filename)
            language: Language name
            flashcard_id: Flashcard ID for unique filename
            
        Returns:
            Tuple of (success, file_path, error_message)
        """
        # Initialize client if not already done, with a reasonable wait
        if not self.is_ready():
            logger.info("IPAService not ready, waiting for initialization...")
            if not self.wait_for_initialization(timeout=60):  # Wait up to 1 minute
                return False, None, "OpenAI client initialization timed out or failed - check API key and network connectivity"
        
        if not self.client:
            return False, None, "OpenAI client not available"
        
        try:
            logger.info(f"🔊 Starting IPA audio generation for '{word}' with IPA: /{ipa_text}/")
            logger.info(f"🔧 Client status: {self.client is not None}")
            
            # Test different OpenAI approaches for better French pronunciation
            approach = "french_context"  # Options: "word_only", "french_context", "ipa_guide", "phonetic"
            
            if approach == "word_only":
                tts_text = word
            elif approach == "french_context":
                tts_text = f"En français: {word}"
            elif approach == "ipa_guide":
                tts_text = f"Le mot français '{word}', prononcé {ipa_text}"
            elif approach == "phonetic":
                # Convert IPA to approximate phonetic spelling
                phonetic_map = {
                    'tʁavɛʁ': 'tra-VEHR',
                    'detʁimɑ̃': 'day-tree-MAHN', 
                    'atɑ̃dʁ': 'ah-TAHNDR'
                }
                tts_text = phonetic_map.get(ipa_text, word)
            else:
                tts_text = word
                
            logger.info(f"🔧 TTS approach: {approach}")
            logger.info(f"🔧 TTS text: '{tts_text}'")
            
            # Select voice based on language - test different voices for French
            voice_options = {
                'French': ['nova', 'alloy', 'echo', 'fable', 'onyx', 'shimmer'],
                'Spanish': ['nova'], 
                'German': ['onyx'],
                'Italian': ['nova'],
                'Portuguese': ['nova'],
                'English': ['alloy']
            }
            
            # For French, try nova first (seems to handle multilingual better)
            voices_to_try = voice_options.get(language, ['nova'])
            voice = voices_to_try[0]  # Start with first option
            logger.info(f"🔧 Selected voice: {voice} for language: {language}")
            
            # Speed optimization: Use faster model for testing
            model = "tts-1"  # Faster than tts-1-hd, good enough for testing
            logger.info(f"🔧 Using model: {model} (optimized for speed)")
            
            # Generate audio using OpenAI TTS
            logger.info("🔄 Making OpenAI TTS API call...")
            response = self.client.audio.speech.create(
                model=model,
                voice=voice,
                input=tts_text,
                response_format="mp3"
            )
            logger.info("✅ OpenAI TTS API call successful")
            
            # Save to file
            filename = f"{flashcard_id}_ipa.mp3"
            file_path = IPA_AUDIO_DIR / filename
            logger.info(f"🔧 Target file path: {file_path}")
            logger.info(f"🔧 IPA_AUDIO_DIR exists: {IPA_AUDIO_DIR.exists()}")
            
            # Save audio file using the same method as the working audio service
            logger.info(f"🔧 Writing response content, size: {len(response.content)} bytes")
            file_path.write_bytes(response.content)
            
            # Verify file was created - CRITICAL CHECK
            if file_path.exists():
                file_size = file_path.stat().st_size
                logger.info(f"✅ Audio file created successfully: {file_path} ({file_size} bytes)")
                
                # Return relative path for API
                relative_path = f"/ipa_audio/{filename}"
                logger.info(f"🎉 IPA audio generation complete: {relative_path}")
                return True, relative_path, None
            else:
                # File creation failed - this is the real problem!
                error_msg = f"CRITICAL: Audio file was not created at {file_path}. Check directory permissions and disk space."
                logger.error(f"❌ {error_msg}")
                return False, None, error_msg
            
        except Exception as e:
            error_msg = f"Failed to generate IPA audio: {str(e)}"
            logger.error(f"❌ EXCEPTION in IPA audio generation: {error_msg}")
            logger.error(f"❌ Exception type: {type(e).__name__}")
            logger.error(f"❌ Exception details: {repr(e)}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return False, None, error_msg