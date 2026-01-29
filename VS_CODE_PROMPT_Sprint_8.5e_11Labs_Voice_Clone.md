# Sprint 8.5e: 11Labs Voice Clone Integration

## Overview

Add personalized pronunciation references using the user's own cloned voice. When a user practices pronunciation, they can hear **themselves** saying it correctly - not a generic TTS voice.

**Why this matters:** The #1 psychological barrier in pronunciation learning is "I can't sound like that native speaker." With voice cloning, users hear their own voice demonstrating correct pronunciation, making it feel achievable.

---

## Pre-Work: Corey's Tasks

### Task 1: Get 11Labs API Key

1. Go to: https://elevenlabs.io/app/settings/api-keys
2. Click "Create API Key"
3. Name it: `super-flashcards-production`
4. Copy the key (starts with `sk_...` or similar)
5. Store in Secret Manager:

```powershell
Set-Content -Path "secret.txt" -Value "YOUR_11LABS_API_KEY_HERE" -NoNewline
gcloud secrets create ELEVENLABS_API_KEY --replication-policy="automatic" --project=super-flashcards-475210
gcloud secrets versions add ELEVENLABS_API_KEY --data-file="secret.txt" --project=super-flashcards-475210
Remove-Item "secret.txt"
```

6. Verify:
```powershell
gcloud secrets versions access latest --secret=ELEVENLABS_API_KEY --project=super-flashcards-475210
```

7. Mount to Cloud Run:
```powershell
gcloud run services update super-flashcards --region=us-central1 --project=super-flashcards-475210 --update-secrets=ELEVENLABS_API_KEY=ELEVENLABS_API_KEY:latest
```

### Task 2: Run SQL Schema Changes

Execute in SSMS against `LanguageLearning` database:

```sql
-- =====================================================
-- Sprint 8.5e: Voice Clone Tables
-- =====================================================

-- Table: UserVoiceClones
-- Stores 11Labs voice clone IDs for users
CREATE TABLE UserVoiceClones (
    CloneID INT IDENTITY(1,1) PRIMARY KEY,
    UserID UNIQUEIDENTIFIER NOT NULL,
    ElevenLabsVoiceID NVARCHAR(100) NOT NULL,
    VoiceName NVARCHAR(100),
    Status NVARCHAR(20) DEFAULT 'active',  -- active, processing, failed, deleted
    SampleCount INT DEFAULT 0,
    TotalSampleDurationSec DECIMAL(10,2) DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    LastUsedAt DATETIME2,
    UsageCount INT DEFAULT 0,
    CONSTRAINT FK_UserVoiceClones_User FOREIGN KEY (UserID) 
        REFERENCES Users(id) ON DELETE CASCADE
);

CREATE INDEX IX_UserVoiceClones_UserID ON UserVoiceClones(UserID);
CREATE INDEX IX_UserVoiceClones_Status ON UserVoiceClones(Status);

-- Table: VoiceCloneSamples
-- Stores metadata about audio samples used for cloning
CREATE TABLE VoiceCloneSamples (
    SampleID INT IDENTITY(1,1) PRIMARY KEY,
    CloneID INT NOT NULL,
    AudioURL NVARCHAR(500) NOT NULL,  -- GCS URL
    DurationSec DECIMAL(10,2),
    UploadedAt DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_VoiceCloneSamples_Clone FOREIGN KEY (CloneID) 
        REFERENCES UserVoiceClones(CloneID) ON DELETE CASCADE
);

-- Table: GeneratedPronunciations
-- Cache of generated pronunciations to avoid re-generating
CREATE TABLE GeneratedPronunciations (
    GenerationID INT IDENTITY(1,1) PRIMARY KEY,
    CloneID INT NOT NULL,
    TargetText NVARCHAR(500) NOT NULL,
    LanguageCode NVARCHAR(10) NOT NULL,
    AudioURL NVARCHAR(500) NOT NULL,  -- GCS URL of generated audio
    GeneratedAt DATETIME2 DEFAULT GETUTCDATE(),
    PlayCount INT DEFAULT 0,
    CONSTRAINT FK_GeneratedPronunciations_Clone FOREIGN KEY (CloneID) 
        REFERENCES UserVoiceClones(CloneID) ON DELETE CASCADE
);

-- Index for cache lookup
CREATE UNIQUE INDEX IX_GeneratedPronunciations_Lookup 
    ON GeneratedPronunciations(CloneID, TargetText, LanguageCode);

-- Add VoiceCloneEnabled flag to Users table (if not exists)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'VoiceCloneEnabled')
BEGIN
    ALTER TABLE Users ADD VoiceCloneEnabled BIT DEFAULT 0;
END

-- Add HasVoiceClone computed helper (optional)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'HasVoiceClone')
BEGIN
    ALTER TABLE Users ADD HasVoiceClone AS (
        CASE WHEN EXISTS (
            SELECT 1 FROM UserVoiceClones 
            WHERE UserID = Users.id AND Status = 'active'
        ) THEN 1 ELSE 0 END
    );
END
GO

PRINT '✅ Sprint 8.5e schema changes complete';
```

### Task 3: Verify 11Labs Account

Check your 11Labs subscription tier:
- Go to: https://elevenlabs.io/app/subscription
- Note your plan (Starter, Creator, etc.)
- Voice cloning requires at least **Starter** tier ($5/mo)
- Check available characters/month

---

## VS Code Implementation Tasks

### Architecture Overview

```
User records voice samples (3x ~30 sec)
         ↓
Upload to GCS → Store metadata in VoiceCloneSamples
         ↓
Call 11Labs API → Create voice clone
         ↓
Store voice_id in UserVoiceClones
         ↓
User practices pronunciation
         ↓
Check cache (GeneratedPronunciations)
         ↓ (cache miss)
Call 11Labs TTS with user's voice_id + target phrase
         ↓
Store generated audio in GCS + cache
         ↓
Return audio to frontend
         ↓
User hears THEMSELVES saying it correctly
```

### File 1: `backend/app/services/elevenlabs_service.py`

```python
"""
ElevenLabs Voice Clone Service
Creates and manages personalized voice clones for pronunciation practice.
"""
import os
import httpx
import base64
import logging
from typing import Optional, List
from datetime import datetime

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
        
        Args:
            audio_samples: List of audio bytes (WAV/MP3, total > 30 sec recommended)
            voice_name: Name for the cloned voice
            description: Optional description
            
        Returns:
            {
                "success": bool,
                "voice_id": str (if success),
                "error": str (if failed)
            }
        """
        if not self.is_available():
            return {"success": False, "error": "11Labs not configured"}
        
        if not audio_samples or len(audio_samples) == 0:
            return {"success": False, "error": "No audio samples provided"}
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                # Prepare multipart form data
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
                    return {
                        "success": True,
                        "voice_id": voice_id
                    }
                else:
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
        
        Args:
            text: Text to speak
            voice_id: 11Labs voice ID
            model_id: TTS model (eleven_multilingual_v2 supports 29 languages)
            
        Returns:
            {
                "success": bool,
                "audio_bytes": bytes (if success),
                "error": str (if failed)
            }
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
                else:
                    logger.error(f"TTS failed: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"TTS failed: {response.status_code}"
                    }
                    
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
```

### File 2: `backend/app/models/voice_clone.py`

```python
"""
SQLAlchemy models for voice cloning feature.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, DECIMAL, Boolean
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class UserVoiceClone(Base):
    __tablename__ = "UserVoiceClones"
    
    CloneID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(UNIQUEIDENTIFIER, ForeignKey("Users.id", ondelete="CASCADE"), nullable=False)
    ElevenLabsVoiceID = Column(String(100), nullable=False)
    VoiceName = Column(String(100))
    Status = Column(String(20), default="active")
    SampleCount = Column(Integer, default=0)
    TotalSampleDurationSec = Column(DECIMAL(10, 2), default=0)
    CreatedAt = Column(DateTime, server_default=func.now())
    LastUsedAt = Column(DateTime)
    UsageCount = Column(Integer, default=0)
    
    # Relationships
    samples = relationship("VoiceCloneSample", back_populates="clone", cascade="all, delete-orphan")
    generated = relationship("GeneratedPronunciation", back_populates="clone", cascade="all, delete-orphan")


class VoiceCloneSample(Base):
    __tablename__ = "VoiceCloneSamples"
    
    SampleID = Column(Integer, primary_key=True, autoincrement=True)
    CloneID = Column(Integer, ForeignKey("UserVoiceClones.CloneID", ondelete="CASCADE"), nullable=False)
    AudioURL = Column(String(500), nullable=False)
    DurationSec = Column(DECIMAL(10, 2))
    UploadedAt = Column(DateTime, server_default=func.now())
    
    clone = relationship("UserVoiceClone", back_populates="samples")


class GeneratedPronunciation(Base):
    __tablename__ = "GeneratedPronunciations"
    
    GenerationID = Column(Integer, primary_key=True, autoincrement=True)
    CloneID = Column(Integer, ForeignKey("UserVoiceClones.CloneID", ondelete="CASCADE"), nullable=False)
    TargetText = Column(String(500), nullable=False)
    LanguageCode = Column(String(10), nullable=False)
    AudioURL = Column(String(500), nullable=False)
    GeneratedAt = Column(DateTime, server_default=func.now())
    PlayCount = Column(Integer, default=0)
    
    clone = relationship("UserVoiceClone", back_populates="generated")
```

### File 3: `backend/app/crud/voice_clone.py`

```python
"""
CRUD operations for voice cloning.
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from app.models.voice_clone import UserVoiceClone, VoiceCloneSample, GeneratedPronunciation


def get_user_voice_clone(db: Session, user_id: UUID) -> Optional[UserVoiceClone]:
    """Get active voice clone for user."""
    return db.query(UserVoiceClone).filter(
        and_(
            UserVoiceClone.UserID == user_id,
            UserVoiceClone.Status == "active"
        )
    ).first()


def create_voice_clone(
    db: Session,
    user_id: UUID,
    elevenlabs_voice_id: str,
    voice_name: str,
    sample_count: int = 0,
    total_duration: float = 0
) -> UserVoiceClone:
    """Create a new voice clone record."""
    clone = UserVoiceClone(
        UserID=user_id,
        ElevenLabsVoiceID=elevenlabs_voice_id,
        VoiceName=voice_name,
        Status="active",
        SampleCount=sample_count,
        TotalSampleDurationSec=total_duration
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    return clone


def add_voice_sample(
    db: Session,
    clone_id: int,
    audio_url: str,
    duration_sec: float
) -> VoiceCloneSample:
    """Add a sample to a voice clone."""
    sample = VoiceCloneSample(
        CloneID=clone_id,
        AudioURL=audio_url,
        DurationSec=duration_sec
    )
    db.add(sample)
    db.commit()
    db.refresh(sample)
    return sample


def get_cached_pronunciation(
    db: Session,
    clone_id: int,
    target_text: str,
    language_code: str
) -> Optional[GeneratedPronunciation]:
    """Get cached generated pronunciation if exists."""
    return db.query(GeneratedPronunciation).filter(
        and_(
            GeneratedPronunciation.CloneID == clone_id,
            GeneratedPronunciation.TargetText == target_text,
            GeneratedPronunciation.LanguageCode == language_code
        )
    ).first()


def cache_pronunciation(
    db: Session,
    clone_id: int,
    target_text: str,
    language_code: str,
    audio_url: str
) -> GeneratedPronunciation:
    """Cache a generated pronunciation."""
    gen = GeneratedPronunciation(
        CloneID=clone_id,
        TargetText=target_text,
        LanguageCode=language_code,
        AudioURL=audio_url
    )
    db.add(gen)
    db.commit()
    db.refresh(gen)
    return gen


def increment_play_count(db: Session, generation_id: int):
    """Increment play count for a generated pronunciation."""
    db.query(GeneratedPronunciation).filter(
        GeneratedPronunciation.GenerationID == generation_id
    ).update({"PlayCount": GeneratedPronunciation.PlayCount + 1})
    db.commit()


def update_clone_usage(db: Session, clone_id: int):
    """Update last used time and increment usage count."""
    db.query(UserVoiceClone).filter(
        UserVoiceClone.CloneID == clone_id
    ).update({
        "LastUsedAt": datetime.utcnow(),
        "UsageCount": UserVoiceClone.UsageCount + 1
    })
    db.commit()


def deactivate_voice_clone(db: Session, clone_id: int):
    """Soft delete a voice clone."""
    db.query(UserVoiceClone).filter(
        UserVoiceClone.CloneID == clone_id
    ).update({"Status": "deleted"})
    db.commit()
```

### File 4: `backend/app/routers/voice_clone.py`

```python
"""
API endpoints for voice cloning feature.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import base64

from app.database import get_db
from app.services.elevenlabs_service import ElevenLabsService
from app.services.storage_service import upload_to_gcs, download_from_gcs
from app.crud import voice_clone as crud
from app.routers.auth import get_current_user

router = APIRouter(prefix="/voice-clone", tags=["voice-clone"])


@router.get("/status")
async def get_voice_clone_status(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Check if user has a voice clone set up.
    """
    clone = crud.get_user_voice_clone(db, current_user.id)
    
    return {
        "has_voice_clone": clone is not None,
        "clone_id": clone.CloneID if clone else None,
        "voice_name": clone.VoiceName if clone else None,
        "status": clone.Status if clone else None,
        "usage_count": clone.UsageCount if clone else 0
    }


@router.post("/create")
async def create_voice_clone(
    samples: List[UploadFile] = File(..., description="Audio samples for voice cloning"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a voice clone from uploaded audio samples.
    
    Requires 1-3 audio files, total duration > 30 seconds recommended.
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
    if total_size < 100_000:  # Less than 100KB
        raise HTTPException(400, "Audio samples too short. Please provide at least 30 seconds of speech.")
    
    # Create voice clone via 11Labs
    service = ElevenLabsService()
    if not service.is_available():
        raise HTTPException(503, "Voice cloning service not available")
    
    voice_name = f"user_{str(current_user.id)[:8]}_voice"
    
    result = await service.create_voice_clone(
        audio_samples=audio_bytes_list,
        voice_name=voice_name,
        description=f"Voice clone for Super Flashcards user"
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
        crud.add_voice_sample(db, clone.CloneID, gcs_url, 0)  # Duration TBD
    
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
    """
    Delete user's voice clone.
    """
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
    """
    Get 11Labs subscription info (admin/debug endpoint).
    """
    service = ElevenLabsService()
    return await service.get_subscription_info()
```

### File 5: Update `backend/app/main.py`

Add the voice clone router:

```python
# Add import
from app.routers import voice_clone

# Add router (with other router includes)
app.include_router(voice_clone.router, prefix="/api/v1")
```

### File 6: Update `backend/app/models/__init__.py`

```python
# Add imports
from app.models.voice_clone import UserVoiceClone, VoiceCloneSample, GeneratedPronunciation
```

### File 7: `frontend/voice-clone.js`

```javascript
/**
 * Voice Clone UI Component
 * Handles voice clone setup and pronunciation generation
 */
class VoiceCloneManager {
    constructor() {
        this.apiBase = '/api/v1/voice-clone';
        this.hasClone = false;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.samples = [];
        this.requiredSamples = 1;  // Minimum samples (11Labs needs ~30 sec total)
    }

    /**
     * Check if user has a voice clone
     */
    async checkStatus() {
        try {
            const response = await fetch(`${this.apiBase}/status`);
            const data = await response.json();
            this.hasClone = data.has_voice_clone;
            return data;
        } catch (error) {
            console.error('Failed to check voice clone status:', error);
            return { has_voice_clone: false };
        }
    }

    /**
     * Render the voice clone setup prompt
     */
    renderSetupPrompt(containerId = 'voice-clone-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="voice-clone-setup">
                <div class="vc-header">
                    <h3>🎙️ Create Your Voice Profile</h3>
                    <p>Hear <strong>yourself</strong> speaking with perfect pronunciation!</p>
                </div>

                <div class="vc-benefits">
                    <div class="benefit">✨ Personalized pronunciation examples</div>
                    <div class="benefit">🎯 See how YOU would sound saying it correctly</div>
                    <div class="benefit">🔒 One-time setup, private to you</div>
                </div>

                <div class="vc-instructions">
                    <h4>How it works:</h4>
                    <ol>
                        <li>Record yourself speaking for about 30-60 seconds</li>
                        <li>Read any text naturally (we provide suggestions)</li>
                        <li>Our AI creates a voice profile from your sample</li>
                    </ol>
                </div>

                <div class="vc-sample-text">
                    <h4>Read this aloud (any language works):</h4>
                    <blockquote>
                        "I'm creating my voice profile for Super Flashcards. 
                        This will help me learn languages by hearing myself 
                        speak with correct pronunciation. I'm excited to 
                        improve my language skills in a personalized way."
                    </blockquote>
                </div>

                <div class="vc-recording-section">
                    <div class="recording-status" id="recording-status">
                        Ready to record
                    </div>
                    
                    <div class="recording-controls">
                        <button id="vc-record-btn" class="btn btn-primary" onclick="voiceClone.toggleRecording()">
                            🎤 Start Recording
                        </button>
                        <button id="vc-submit-btn" class="btn btn-success" onclick="voiceClone.submitSamples()" disabled>
                            ✨ Create Voice Profile
                        </button>
                    </div>

                    <div class="samples-list" id="samples-list"></div>
                </div>
            </div>
        `;
    }

    /**
     * Start/stop recording
     */
    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.samples.push(audioBlob);
                this.updateSamplesList();
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.updateRecordingUI(true);

        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Could not access microphone. Please allow microphone access.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.updateRecordingUI(false);
        }
    }

    updateRecordingUI(isRecording) {
        const btn = document.getElementById('vc-record-btn');
        const status = document.getElementById('recording-status');
        const submitBtn = document.getElementById('vc-submit-btn');

        if (isRecording) {
            btn.innerHTML = '⏹️ Stop Recording';
            btn.classList.add('recording');
            status.innerHTML = '🔴 Recording...';
            status.classList.add('active');
        } else {
            btn.innerHTML = '🎤 Record Another Sample';
            btn.classList.remove('recording');
            status.innerHTML = `✅ ${this.samples.length} sample(s) recorded`;
            status.classList.remove('active');
            
            // Enable submit if we have enough samples
            submitBtn.disabled = this.samples.length < this.requiredSamples;
        }
    }

    updateSamplesList() {
        const list = document.getElementById('samples-list');
        if (!list) return;

        list.innerHTML = this.samples.map((sample, i) => `
            <div class="sample-item">
                <span>Sample ${i + 1}</span>
                <audio controls src="${URL.createObjectURL(sample)}"></audio>
                <button onclick="voiceClone.removeSample(${i})" class="btn-small">❌</button>
            </div>
        `).join('');
    }

    removeSample(index) {
        this.samples.splice(index, 1);
        this.updateSamplesList();
        document.getElementById('vc-submit-btn').disabled = this.samples.length < this.requiredSamples;
    }

    /**
     * Submit samples to create voice clone
     */
    async submitSamples() {
        if (this.samples.length < this.requiredSamples) {
            alert(`Please record at least ${this.requiredSamples} sample(s)`);
            return;
        }

        const submitBtn = document.getElementById('vc-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Creating voice profile...';

        try {
            const formData = new FormData();
            this.samples.forEach((sample, i) => {
                formData.append('samples', sample, `sample_${i}.wav`);
            });

            const response = await fetch(`${this.apiBase}/create`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.hasClone = true;
                this.showSuccess();
            } else {
                throw new Error(data.detail || data.error || 'Failed to create voice profile');
            }

        } catch (error) {
            console.error('Voice clone creation failed:', error);
            alert(`Error: ${error.message}`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '✨ Create Voice Profile';
        }
    }

    showSuccess() {
        const container = document.querySelector('.voice-clone-setup');
        if (container) {
            container.innerHTML = `
                <div class="vc-success">
                    <h3>🎉 Voice Profile Created!</h3>
                    <p>You'll now hear yourself in pronunciation practice examples.</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        Start Practicing
                    </button>
                </div>
            `;
        }
    }

    /**
     * Generate pronunciation with user's voice
     */
    async generatePronunciation(text, languageCode) {
        if (!this.hasClone) {
            return { success: false, error: 'No voice clone' };
        }

        try {
            const response = await fetch(
                `${this.apiBase}/generate/${languageCode}?text=${encodeURIComponent(text)}`,
                { method: 'POST' }
            );

            if (!response.ok) {
                const error = await response.json();
                return { success: false, error: error.detail };
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Generate pronunciation failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Play generated pronunciation
     */
    async playPersonalizedAudio(text, languageCode) {
        const result = await this.generatePronunciation(text, languageCode);
        
        if (result.success && result.audio_base64) {
            const audio = new Audio(`data:audio/mpeg;base64,${result.audio_base64}`);
            audio.play();
            return true;
        }
        
        return false;
    }
}

// Global instance
const voiceClone = new VoiceCloneManager();

// Check status on page load
document.addEventListener('DOMContentLoaded', () => {
    voiceClone.checkStatus();
});
```

### File 8: Add CSS - `frontend/voice-clone.css` or add to existing styles

```css
/* Voice Clone UI Styles */

.voice-clone-setup {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 16px;
}

.vc-header {
    text-align: center;
    margin-bottom: 1.5rem;
}

.vc-header h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.vc-benefits {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #e7f3ff;
    border-radius: 8px;
}

.benefit {
    font-size: 0.95rem;
}

.vc-instructions ol {
    padding-left: 1.5rem;
    margin: 0.5rem 0;
}

.vc-instructions li {
    margin: 0.5rem 0;
}

.vc-sample-text {
    margin: 1.5rem 0;
}

.vc-sample-text blockquote {
    background: #fff;
    padding: 1rem;
    border-left: 4px solid #667eea;
    border-radius: 0 8px 8px 0;
    margin: 0.5rem 0;
    font-style: italic;
}

.vc-recording-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #ddd;
}

.recording-status {
    text-align: center;
    padding: 0.75rem;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 1rem;
}

.recording-status.active {
    background: #ffe0e0;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.recording-controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 1rem;
}

.recording-controls button {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.recording-controls button.recording {
    background: #dc3545;
    color: white;
    animation: pulse 1s infinite;
}

.samples-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.sample-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    background: #fff;
    border-radius: 8px;
}

.sample-item audio {
    flex: 1;
    height: 36px;
}

.btn-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.85rem;
    background: none;
    border: none;
    cursor: pointer;
}

.vc-success {
    text-align: center;
    padding: 2rem;
}

.vc-success h3 {
    font-size: 1.75rem;
    color: #28a745;
    margin-bottom: 1rem;
}

/* Personalized audio button in pronunciation practice */
.personalized-audio-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    cursor: pointer;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.personalized-audio-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.clone-prompt-banner {
    background: linear-gradient(135deg, #667eea22, #764ba222);
    border: 1px solid #667eea44;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    text-align: center;
}

.clone-prompt-banner button {
    margin-top: 0.5rem;
}
```

---

## Integration with Pronunciation Practice

### Update pronunciation results display

In the pronunciation results, add a button to hear personalized reference:

```javascript
// In pronunciation results display (pronunciation-recorder.js or similar)

async function displayPronunciationResults(response) {
    // ... existing display code ...
    
    // Add personalized audio option
    const status = await voiceClone.checkStatus();
    
    if (status.has_voice_clone) {
        html += `
            <div class="personalized-reference">
                <button class="personalized-audio-btn" 
                        onclick="voiceClone.playPersonalizedAudio('${response.target_text}', '${languageCode}')">
                    🎙️ Hear Yourself Say It Correctly
                </button>
            </div>
        `;
    } else {
        html += `
            <div class="clone-prompt-banner">
                <p>Want to hear <strong>yourself</strong> say it correctly?</p>
                <button onclick="showVoiceCloneSetup()" class="btn btn-secondary">
                    🎙️ Create Voice Profile
                </button>
            </div>
        `;
    }
}
```

---

## Testing Checklist

### Corey Pre-Tests
- [ ] 11Labs API key is in Secret Manager
- [ ] Cloud Run has ELEVENLABS_API_KEY mounted
- [ ] SQL schema changes applied (3 new tables)

### VS Code Implementation Tests
- [ ] `/api/v1/voice-clone/status` returns correct status
- [ ] Recording UI works (start/stop/playback)
- [ ] Voice clone creation succeeds (check 11Labs dashboard)
- [ ] `/api/v1/voice-clone/generate/fr?text=bonjour` returns audio
- [ ] Cached pronunciations are reused (check DB)
- [ ] Delete endpoint removes clone from 11Labs

### End-to-End Tests
- [ ] New user sees "Create Voice Profile" prompt
- [ ] User can record samples and submit
- [ ] After setup, "Hear Yourself" button appears in pronunciation practice
- [ ] Generated audio sounds like the user
- [ ] Audio is cached (second request is faster)

---

## Deployment

After VS Code implementation:

```powershell
gcloud builds submit --tag gcr.io/super-flashcards-475210/super-flashcards:latest --project=super-flashcards-475210
```

```powershell
gcloud run services update super-flashcards --region=us-central1 --project=super-flashcards-475210 --image=gcr.io/super-flashcards-475210/super-flashcards:latest
```

---

## Summary

| Task | Owner | Status |
|------|-------|--------|
| Get 11Labs API key | Corey | TODO |
| Store key in Secret Manager | Corey | TODO |
| Run SQL schema changes | Corey | TODO |
| Mount secret to Cloud Run | Corey | TODO |
| Implement backend service | VS Code | TODO |
| Implement API endpoints | VS Code | TODO |
| Implement frontend UI | VS Code | TODO |
| Integrate with pronunciation practice | VS Code | TODO |
| Test end-to-end | Both | TODO |
| Deploy | Corey | TODO |
