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

# Voiced stops that ElevenLabs devoices at utterance boundaries,
# plus word-final laryngeals (h, hʷ) that render harshly in ElevenLabs
# without a following vowel (SF12 BUG-013 secondary fix).
_VOICED_STOPS = {
    'b', 'd', 'ɡ', 'bʰ', 'dʰ', 'ɡʰ', 'ɡʷ', 'ɡʲ', 'bʱ', 'dʱ', 'ɡʱ',
    'h', 'hʷ',
}


def prevent_final_devoicing(pie_ipa: str) -> str:
    """
    Append a short schwa /ə/ after word-final voiced stops / laryngeals
    to prevent ElevenLabs from devoicing them or rendering them harshly.
    English TTS devoices final /b d ɡ/ to /p t k/ at utterance boundaries,
    and renders final /h/ with an unwanted aspirated burst.

    Only appends if the IPA string ends on one of these segments
    (including aspirated voiced variants and laryngeals).
    """
    if not pie_ipa:
        return pie_ipa

    for stop_len in [3, 2, 1]:
        if len(pie_ipa) >= stop_len and pie_ipa[-stop_len:] in _VOICED_STOPS:
            return pie_ipa + 'ə'

    return pie_ipa


def build_ssml(pie_ipa: str, slug: str) -> str:
    """
    Wrap IPA in SSML phoneme tag.
    Applies devoicing prevention, then appends a period after consonant-final
    strings to signal sentence-end and discourage ElevenLabs from adding
    a trailing vowel.
    """
    ipa_for_ssml = prevent_final_devoicing(pie_ipa)
    ends_on_consonant = ipa_for_ssml[-1] not in _VOWELS and ipa_for_ssml[-1] != 'ː' if ipa_for_ssml else False
    text_content = slug + ('.' if ends_on_consonant else '')
    return f'<speak><phoneme alphabet="ipa" ph="{ipa_for_ssml}">{text_content}</phoneme></speak>'


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


def _gcs_blob_path(gcs_path: str):
    """Get a GCS blob by arbitrary path (for adhoc audio)."""
    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET)
    return bucket.blob(gcs_path)


def _public_url_path(gcs_path: str) -> str:
    return f"https://storage.googleapis.com/{GCS_BUCKET}/{gcs_path}"


async def generate_pie_audio_from_ipa(ipa: str, gcs_path: str) -> tuple[str | None, bool]:
    """
    Generate ElevenLabs audio for an arbitrary IPA string (not tied to a PIE root).
    Uses the same Josh voice pipeline. Uploads to the given GCS path.

    Returns:
        (audio_url, ssml_failed) — URL or None, and whether SSML failed.
    """
    blob = _gcs_blob_path(gcs_path)

    if blob.exists():
        return _public_url_path(gcs_path), False

    api_key = _get_api_key()
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    # Build SSML with devoicing prevention
    ipa_for_ssml = prevent_final_devoicing(ipa)
    slug = "ipa"
    ends_on_consonant = ipa_for_ssml[-1] not in _VOWELS and ipa_for_ssml[-1] != 'ː' if ipa_for_ssml else False
    text_content = slug + ('.' if ends_on_consonant else '')
    ssml_text = f'<speak><phoneme alphabet="ipa" ph="{ipa_for_ssml}">{text_content}</phoneme></speak>'

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
                blob.upload_from_string(response.content, content_type="audio/mpeg")
                blob.make_public()
                logger.info(f"[PIE-Audio] Adhoc SSML success: {gcs_path} ({len(response.content)} bytes)")
                return _public_url_path(gcs_path), False
    except Exception as e:
        logger.warning(f"[PIE-Audio] Adhoc SSML error for {gcs_path}: {e}")

    # Fallback: plain IPA text
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=headers,
                json={
                    "text": ipa,
                    "model_id": MODEL_ID,
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                },
            )
            if response.status_code == 200 and len(response.content) >= 1024:
                blob.upload_from_string(response.content, content_type="audio/mpeg")
                blob.make_public()
                logger.info(f"[PIE-Audio] Adhoc plain success: {gcs_path} ({len(response.content)} bytes)")
                return _public_url_path(gcs_path), True
    except Exception as e:
        logger.error(f"[PIE-Audio] Adhoc plain error for {gcs_path}: {e}")

    return None, False
