"""
API endpoints for voice cloning feature.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import base64

from app.database import get_db
from app.services.elevenlabs_service import ElevenLabsService
from app.services.storage_service import upload_to_gcs, download_from_gcs
from app import crud
from app.routers.auth import get_current_user, get_current_user_optional

router = APIRouter(prefix="/voice-clone", tags=["voice-clone"])


@router.get("/status")
async def get_voice_clone_status(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """Check if user has a voice clone set up. Returns empty if not authenticated."""
    if not current_user:
        return {
            "has_voice_clone": False,
            "clone_id": None,
            "voice_name": None,
            "status": None,
            "usage_count": 0,
            "authenticated": False
        }
    
    clone = crud.get_user_voice_clone(db, current_user.id)

    return {
        "has_voice_clone": clone is not None,
        "clone_id": clone.CloneID if clone else None,
        "voice_name": clone.VoiceName if clone else None,
        "status": clone.Status if clone else None,
        "usage_count": clone.UsageCount if clone else 0,
        "authenticated": True
    }


@router.post("/create")
async def create_voice_clone(
    samples: List[UploadFile] = File(..., description="Audio samples for voice cloning"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a voice clone from uploaded audio samples.
    Requires 1-5 audio files, total duration > 30 seconds recommended.
    """
    # Check if user already has a clone
    existing = crud.get_user_voice_clone(db, current_user.id)
    if existing:
        raise HTTPException(400, "Voice clone already exists. Delete it first to create a new one.")

    # Validate samples
    if not samples or len(samples) == 0:
        raise HTTPException(400, "At least one audio sample is required")
    if len(samples) > 5:
        raise HTTPException(400, "Maximum 5 audio samples allowed")

    # Read audio bytes
    audio_bytes_list = []
    total_size = 0
    for sample in samples:
        content = await sample.read()
        audio_bytes_list.append(content)
        total_size += len(content)

    # Basic size validation (30 sec of audio is roughly 500KB-1MB)
    if total_size < 100_000:
        raise HTTPException(400, "Audio samples too short. Please provide at least 30 seconds of speech.")

    # Create voice clone via 11Labs
    service = ElevenLabsService()
    if not service.is_available():
        raise HTTPException(503, "Voice cloning service not available")

    voice_name = f"user_{str(current_user.id)[:8]}_voice"

    result = await service.create_voice_clone(
        audio_samples=audio_bytes_list,
        voice_name=voice_name,
        description="Voice clone for Super Flashcards user"
    )

    if not result.get("success"):
        raise HTTPException(500, f"Failed to create voice clone: {result.get('error')}")

    # Save to database
    clone = crud.create_voice_clone(
        db=db,
        user_id=current_user.id,
        elevenlabs_voice_id=result["voice_id"],
        voice_name=voice_name,
        sample_count=len(samples)
    )

    # Upload samples to GCS for backup
    for i, audio_bytes in enumerate(audio_bytes_list):
        gcs_url = await upload_to_gcs(
            audio_bytes,
            f"voice-clones/{current_user.id}/sample_{i}.wav",
            content_type="audio/wav"
        )
        crud.add_voice_sample(db, clone.CloneID, gcs_url, 0)

    return {
        "success": True,
        "clone_id": clone.CloneID,
        "voice_name": clone.VoiceName,
        "message": "Voice clone created successfully! You can now hear yourself in pronunciation practice."
    }


@router.post("/generate/{language_code}")
async def generate_pronunciation(
    language_code: str,
    text: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate pronunciation audio using user's cloned voice.
    Returns audio as base64 for immediate playback.
    Uses cache if available.
    """
    # Get user's voice clone
    clone = crud.get_user_voice_clone(db, current_user.id)
    if not clone:
        raise HTTPException(404, "No voice clone found. Please create one first.")

    # Check cache
    cached = crud.get_cached_pronunciation(db, clone.CloneID, text, language_code)
    if cached:
        # Return cached audio
        crud.increment_play_count(db, cached.GenerationID)
        audio_bytes = await download_from_gcs(cached.AudioURL)
        return {
            "success": True,
            "audio_base64": base64.b64encode(audio_bytes).decode(),
            "cached": True
        }

    # Generate new audio
    service = ElevenLabsService()
    if not service.is_available():
        raise HTTPException(503, "Voice service not available")

    result = await service.generate_speech(
        text=text,
        voice_id=clone.ElevenLabsVoiceID
    )

    if not result.get("success"):
        raise HTTPException(500, f"Failed to generate audio: {result.get('error')}")

    audio_bytes = result["audio_bytes"]

    # Upload to GCS for caching
    gcs_url = await upload_to_gcs(
        audio_bytes,
        f"voice-clones/{current_user.id}/generated/{language_code}/{hash(text)}.mp3",
        content_type="audio/mpeg"
    )

    # Cache the generation
    crud.cache_pronunciation(db, clone.CloneID, text, language_code, gcs_url)
    crud.update_clone_usage(db, clone.CloneID)

    return {
        "success": True,
        "audio_base64": base64.b64encode(audio_bytes).decode(),
        "cached": False
    }


@router.delete("/")
async def delete_voice_clone(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete user's voice clone."""
    clone = crud.get_user_voice_clone(db, current_user.id)
    if not clone:
        raise HTTPException(404, "No voice clone found")

    # Delete from 11Labs
    service = ElevenLabsService()
    if service.is_available():
        await service.delete_voice(clone.ElevenLabsVoiceID)

    # Soft delete in database
    crud.deactivate_voice_clone(db, clone.CloneID)

    return {"success": True, "message": "Voice clone deleted"}


@router.get("/subscription")
async def get_subscription_info(
    current_user = Depends(get_current_user)
):
    """Get 11Labs subscription info (admin/debug endpoint)."""
    service = ElevenLabsService()
    return await service.get_subscription_info()
