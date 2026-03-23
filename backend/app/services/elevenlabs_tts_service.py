"""
ElevenLabs TTS service for Super Flashcards.
Generates high-quality Greek pronunciation audio with GCS caching.
GCS cache: generate once, serve from cache on repeat plays.
"""

import logging
import os
import httpx
from google.cloud import storage

logger = logging.getLogger(__name__)

GCS_BUCKET = "super-flashcards-media"
GCS_AUDIO_PREFIX = "sf/audio/"
# Aria — multilingual voice, good for Greek pronunciation
VOICE_ID = "9BWtsMINqrJLrRacOk9x"
MODEL_ID = "eleven_multilingual_v2"


def _get_api_key() -> str:
    """Get ElevenLabs API key from environment (injected via Secret Manager)."""
    key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise RuntimeError("ELEVENLABS_API_KEY not set")
    return key


def _gcs_blob(card_id: str):
    """Get GCS blob for a card's ElevenLabs audio."""
    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET)
    return bucket.blob(f"{GCS_AUDIO_PREFIX}{card_id}.mp3")


def _public_url(card_id: str) -> str:
    return f"https://storage.googleapis.com/{GCS_BUCKET}/{GCS_AUDIO_PREFIX}{card_id}.mp3"


def _gcs_blob_tts(text_hash: str):
    """GCS blob for arbitrary-text TTS, keyed by MD5 hash."""
    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET)
    return bucket.blob(f"{GCS_AUDIO_PREFIX}tts/{text_hash}.mp3")


def _public_url_tts(text_hash: str) -> str:
    return f"https://storage.googleapis.com/{GCS_BUCKET}/{GCS_AUDIO_PREFIX}tts/{text_hash}.mp3"


async def get_or_generate_audio(greek_text: str, card_id: str) -> str:
    """
    Get cached audio or generate via ElevenLabs TTS.
    Uses card_id in GCS path (not word text) to avoid collisions.

    Returns:
        Public GCS URL of the audio file.
    """
    blob = _gcs_blob(card_id)

    # Check GCS cache first
    if blob.exists():
        logger.info(f"ElevenLabs audio cache hit: card {card_id}")
        return _public_url(card_id)

    # Generate via ElevenLabs API
    api_key = _get_api_key()
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url,
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            json={
                "text": greek_text,
                "model_id": MODEL_ID,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                },
            },
        )
        response.raise_for_status()

    # Upload to GCS
    blob.upload_from_string(response.content, content_type="audio/mpeg")
    blob.make_public()
    public = _public_url(card_id)
    logger.info(f"ElevenLabs audio generated and cached: card {card_id} -> {public}")
    return public


async def get_or_generate_audio_for_text(text: str, speed: float = 1.0) -> str:
    """
    SM05: Generate ElevenLabs TTS for arbitrary text (no card_id).
    SM08: Added speed parameter (0.5–2.0).
    Uses MD5 hash of text+speed as GCS cache key.
    Returns public GCS URL.
    """
    import hashlib
    # Include speed in cache key so different speeds get different cached files
    cache_input = f"{text}|speed={speed}" if speed != 1.0 else text
    text_hash = hashlib.md5(cache_input.encode("utf-8")).hexdigest()[:16]
    blob = _gcs_blob_tts(text_hash)

    if blob.exists():
        logger.info(f"TTS text cache hit: {text_hash}")
        return _public_url_tts(text_hash)

    api_key = _get_api_key()
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

    # SM08: Use SSML prosody for speed control when speed != 1.0
    if speed != 1.0:
        speed_pct = int(speed * 100)
        tts_text = f'<speak><prosody rate="{speed_pct}%">{text}</prosody></speak>'
    else:
        tts_text = text

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url,
            headers={"xi-api-key": api_key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
            json={
                "text": tts_text,
                "model_id": MODEL_ID,
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
            },
        )
        response.raise_for_status()

    blob.upload_from_string(response.content, content_type="audio/mpeg")
    blob.make_public()
    public = _public_url_tts(text_hash)
    logger.info(f"TTS generated and cached: {text_hash} (speed={speed}) -> {public}")
    return public
