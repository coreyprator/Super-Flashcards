"""
ElevenLabs Voice Clone Service
Creates and manages personalized voice clones for pronunciation practice.
"""
import os
import httpx
import logging
from typing import List

logger = logging.getLogger(__name__)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"


class ElevenLabsService:
    """
    Service for voice cloning and text-to-speech with cloned voices.
    11Labs API Docs: https://elevenlabs.io/docs/api-reference
    """

    def __init__(self):
        self.api_key = ELEVENLABS_API_KEY
        if not self.api_key:
            logger.warning("ELEVENLABS_API_KEY not configured")

    def is_available(self) -> bool:
        """Check if 11Labs service is configured."""
        return bool(self.api_key)

    def _get_headers(self) -> dict:
        return {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }

    async def create_voice_clone(
        self,
        audio_samples: List[bytes],
        voice_name: str,
        description: str = None
    ) -> dict:
        """
        Create a voice clone from audio samples.

        Returns:
            {"success": bool, "voice_id": str, "error": str}
        """
        if not self.is_available():
            return {"success": False, "error": "11Labs not configured"}

        if not audio_samples:
            return {"success": False, "error": "No audio samples provided"}

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                files = [
                    ("files", (f"sample_{i}.wav", sample, "audio/wav"))
                    for i, sample in enumerate(audio_samples)
                ]

                data = {
                    "name": voice_name,
                    "description": description or f"Voice clone for {voice_name}"
                }

                response = await client.post(
                    f"{ELEVENLABS_API_BASE}/voices/add",
                    headers={"xi-api-key": self.api_key},
                    data=data,
                    files=files
                )

                if response.status_code == 200:
                    result = response.json()
                    voice_id = result.get("voice_id")
                    logger.info(f"✅ Created voice clone: {voice_id}")
                    return {"success": True, "voice_id": voice_id}

                error_msg = response.text
                logger.error(f"❌ Voice clone failed: {response.status_code} - {error_msg}")
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}",
                    "details": error_msg
                }

        except httpx.TimeoutException:
            logger.error("Voice clone timed out")
            return {"success": False, "error": "Request timed out"}
        except Exception as e:
            logger.error(f"Voice clone exception: {e}")
            return {"success": False, "error": str(e)}

    async def generate_speech(
        self,
        text: str,
        voice_id: str,
        model_id: str = "eleven_multilingual_v2"
    ) -> dict:
        """
        Generate speech using a voice (cloned or preset).
        """
        if not self.is_available():
            return {"success": False, "error": "11Labs not configured"}

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{ELEVENLABS_API_BASE}/text-to-speech/{voice_id}",
                    headers=self._get_headers(),
                    json={
                        "text": text,
                        "model_id": model_id,
                        "voice_settings": {
                            "stability": 0.75,
                            "similarity_boost": 0.85,
                            "style": 0.0,
                            "use_speaker_boost": True
                        }
                    }
                )

                if response.status_code == 200:
                    return {
                        "success": True,
                        "audio_bytes": response.content,
                        "content_type": response.headers.get("content-type", "audio/mpeg")
                    }

                logger.error(f"TTS failed: {response.status_code} - {response.text}")
                return {"success": False, "error": f"TTS failed: {response.status_code}"}

        except httpx.TimeoutException:
            return {"success": False, "error": "TTS timed out"}
        except Exception as e:
            logger.error(f"TTS exception: {e}")
            return {"success": False, "error": str(e)}

    async def delete_voice(self, voice_id: str) -> bool:
        """Delete a cloned voice."""
        if not self.is_available():
            return False

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.delete(
                    f"{ELEVENLABS_API_BASE}/voices/{voice_id}",
                    headers=self._get_headers()
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Delete voice error: {e}")
            return False

    async def get_subscription_info(self) -> dict:
        """Get current subscription/usage info."""
        if not self.is_available():
            return {"error": "Not configured"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{ELEVENLABS_API_BASE}/user/subscription",
                    headers=self._get_headers()
                )
                if response.status_code == 200:
                    return response.json()
                return {"error": f"API error: {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}
