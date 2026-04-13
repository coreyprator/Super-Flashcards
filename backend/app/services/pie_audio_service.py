"""
PIE Audio Generation Service — SF05
Generates pronunciation audio for PIE roots using ElevenLabs SSML phoneme synthesis.
Follows the same GCS caching pattern as elevenlabs_tts_service.py.
"""

import logging
import os
import re
import httpx
from google.cloud import storage

logger = logging.getLogger(__name__)

GCS_BUCKET = "super-flashcards-media"
GCS_PIE_PREFIX = "pie-audio/"
# Josh voice — selected 2026-04-12 voice comparison test, 4.0/5 avg
VOICE_ID = "TxGEqnHWrfWFTfGW9XjX"
# eleven_monolingual_v1 — ONLY model that supports SSML phoneme tags
MODEL_ID = "eleven_monolingual_v1"


def _get_api_key() -> str:
    key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    if not key:
        raise RuntimeError("ELEVENLABS_API_KEY not set")
    return key


def _slug_from_root(pie_root: str) -> str:
    """Convert PIE root to GCS-safe slug: lowercase, non-alphanumeric → underscore."""
    clean = pie_root.lstrip('*').lower()
    return re.sub(r'[^a-z0-9]', '_', clean).strip('_')


def _gcs_blob(slug: str):
    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET)
    return bucket.blob(f"{GCS_PIE_PREFIX}{slug}.mp3")


def _public_url(slug: str) -> str:
    return f"https://storage.googleapis.com/{GCS_BUCKET}/{GCS_PIE_PREFIX}{slug}.mp3"


# Vowel characters for consonant-final detection
_VOWELS = set('ɛoaeiuɪʊəɐɜɑɒæœøyɨʉɯɤɵɘɞʌɔ')


def build_ssml(pie_ipa: str, slug: str) -> str:
    """
    Wrap IPA in SSML phoneme tag.
    Appends a period after consonant-final strings to signal sentence-end
    and discourage ElevenLabs from adding a trailing vowel.
    """
    ends_on_consonant = pie_ipa[-1] not in _VOWELS and pie_ipa[-1] != 'ː' if pie_ipa else False
    text_content = slug + ('.' if ends_on_consonant else '')
    return f'<speak><phoneme alphabet="ipa" ph="{pie_ipa}">{text_content}</phoneme></speak>'


async def generate_pie_audio(pie_root: str, pie_ipa: str) -> tuple[str | None, bool]:
    """
    Generate PIE pronunciation audio via ElevenLabs.

    Tries SSML phoneme tag first, falls back to plain IPA text.

    Args:
        pie_root: The PIE root (e.g. "*bher-")
        pie_ipa: IPA transcription (e.g. "bʱɛr")

    Returns:
        (audio_url, ssml_failed) — URL or None, and whether SSML failed.
    """
    slug = _slug_from_root(pie_root)
    blob = _gcs_blob(slug)

    # GCS cache check
    if blob.exists():
        logger.info(f"[PIE-Audio] Cache hit: {slug}")
        return _public_url(slug), False

    api_key = _get_api_key()
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    # Attempt 1: SSML with phoneme tag (schwa prevention via build_ssml)
    ssml_text = build_ssml(pie_ipa, slug)
    ssml_failed = False

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=headers,
                json={
                    "text": ssml_text,
                    "model_id": MODEL_ID,
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                },
            )

            if response.status_code == 200 and len(response.content) >= 1024:
                # SSML worked
                blob.upload_from_string(response.content, content_type="audio/mpeg")
                blob.make_public()
                logger.info(f"[PIE-Audio] SSML success: {slug} ({len(response.content)} bytes)")
                return _public_url(slug), False
            else:
                logger.warning(
                    f"[PIE-Audio] SSML rejected for {slug}: "
                    f"status={response.status_code}, size={len(response.content)}"
                )
                ssml_failed = True
    except Exception as e:
        logger.warning(f"[PIE-Audio] SSML error for {slug}: {e}")
        ssml_failed = True

    # Attempt 2: Plain IPA text fallback
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=headers,
                json={
                    "text": pie_ipa,
                    "model_id": MODEL_ID,
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                },
            )

            if response.status_code == 200 and len(response.content) >= 1024:
                blob.upload_from_string(response.content, content_type="audio/mpeg")
                blob.make_public()
                logger.info(f"[PIE-Audio] Plain IPA success: {slug} ({len(response.content)} bytes)")
                return _public_url(slug), True
            else:
                logger.error(
                    f"[PIE-Audio] Plain IPA also failed for {slug}: "
                    f"status={response.status_code}, size={len(response.content)}"
                )
    except Exception as e:
        logger.error(f"[PIE-Audio] Plain IPA error for {slug}: {e}")

    return None, False
