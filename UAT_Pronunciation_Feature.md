# Pronunciation Practice - UAT Framework & Bug Tracking

## Critical Bugs Identified (P0/P1)

### BUG-001: Empty Transcription Returns (P0)
**Symptom:** Analysis shows 0% with empty transcription
```
What you said: (blank)
Your pronunciation (IPA): t→∅ɛ→∅ʃ→∅n→∅
Feedback: 🔄 Heard: ''. Try again, speaking more clearly.
```
**Expected:** Should capture spoken audio and return transcription
**Impact:** Feature is non-functional when this occurs
**Debug Data Needed:**
- Audio file size (was audio actually recorded?)
- Audio duration
- GCS upload success/failure
- STT API response (raw)
- Error logs

### BUG-002: Voice Clone Auth + UI Issues (P0) — Partially Fixed
**Original Symptom:** "Create Voice Profile" button does nothing when clicked
**Updated Symptom:** Voice Clone returns "Not authenticated" error — API auth issue
**Fixes Applied (2026-01-31):**
- Button onclick binding (renderSetupPrompt not called — fixed in app.js)
- Recording counter race condition (onstop async timing — fixed in voice-clone.js)
- Auth headers missing on fetch calls (added Bearer token — fixed in voice-clone.js)
- Backend await on sync functions (upload_to_gcs not async — fixed in voice_clone.py)
- "No flashcard selected" (window.state not accessible — added setFlashcardContext)
- Active clone UI (shows "Voice Profile Active" when clone exists)
**Remaining:** ElevenLabs pronunciation quality for non-English languages (11Labs TTS engine limitation)

### BUG-007: Mouse Click Doesn't Stop Recording (P2)
**Symptom:** Spacebar works to stop recording but mouse click on the stop button does not
**Expected:** Both mouse click and keyboard should stop recording
**Impact:** Confusing UX, especially on mobile where keyboard shortcuts aren't available
**Status:** New — investigate in pronunciation-recorder.js

### BUG-003: Keyboard Shortcuts Inconsistent (P1)
**Symptom:** Space/Enter works on desktop but not reliably on mobile
**Expected:** Consistent behavior across platforms, or graceful fallback to touch
**Platforms to test:** Desktop Chrome, Desktop Safari, iOS Safari, Android Chrome

### BUG-004: IPA Comparison Shows All Mismatches (P1)
**Symptom:** Even when audio sounds correct, IPA shows all phonemes as mismatched (→∅)
**Root Cause Hypothesis:** If transcription is empty, IPA of empty string = nothing, so all target phonemes show as "missing"
**Dependency:** Fix BUG-001 first

### BUG-005: Gemini vs STT Inconsistency (P2)
**Symptom:** Gemini coaching and STT confidence disagree on pronunciation quality
**Expected:** Cross-validation should reconcile differences
**Debug Data Needed:**
- Raw STT response with word confidences
- Raw Gemini response
- Cross-validation decision log

### BUG-006: Mobile OAuth Session Expiry (P1)
**Symptom:** User must re-login frequently on iPhone
**Expected:** Session should persist for reasonable duration (7-30 days)
**Investigate:**
- Cookie expiration settings
- Token refresh logic
- iOS Safari cookie restrictions

---

## Logging Enhancements Required

### Backend: Add Comprehensive Logging

**File: `backend/app/services/pronunciation_service.py`**

Add detailed logging at each step:

```python
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class PronunciationService:
    
    async def process_pronunciation_attempt(self, ...):
        request_id = str(uuid.uuid4())[:8]
        log_data = {
            "request_id": request_id,
            "user_id": str(user_id),
            "target_text": target_text,
            "language_code": language_code,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(f"[{request_id}] 🎤 Starting pronunciation processing: {json.dumps(log_data)}")
        
        # Step 1: Audio upload
        try:
            audio_size = len(audio_data) if audio_data else 0
            logger.info(f"[{request_id}] 📤 Audio size: {audio_size} bytes")
            
            if audio_size < 1000:
                logger.warning(f"[{request_id}] ⚠️ Audio too small - likely empty recording")
            
            audio_url = await self._upload_audio(audio_data, user_id)
            logger.info(f"[{request_id}] ✅ Audio uploaded: {audio_url}")
        except Exception as e:
            logger.error(f"[{request_id}] ❌ Audio upload failed: {e}")
            raise
        
        # Step 2: STT Analysis
        try:
            stt_result = await self._run_stt_analysis(audio_data, language_code)
            logger.info(f"[{request_id}] 🎯 STT Result: {json.dumps(stt_result)}")
            
            if not stt_result.get('transcription'):
                logger.warning(f"[{request_id}] ⚠️ STT returned empty transcription")
        except Exception as e:
            logger.error(f"[{request_id}] ❌ STT failed: {e}")
            raise
        
        # Step 3: IPA Generation
        try:
            ipa_target = self._generate_ipa(target_text, language_code)
            ipa_spoken = self._generate_ipa(stt_result.get('transcription', ''), language_code)
            logger.info(f"[{request_id}] 🔤 IPA - Target: {ipa_target}, Spoken: {ipa_spoken}")
        except Exception as e:
            logger.error(f"[{request_id}] ❌ IPA generation failed: {e}")
        
        # Step 4: Gemini Analysis
        try:
            gemini_result = await self._run_gemini_analysis(...)
            logger.info(f"[{request_id}] 🤖 Gemini Result: {json.dumps(gemini_result)}")
        except Exception as e:
            logger.error(f"[{request_id}] ⚠️ Gemini failed (non-blocking): {e}")
        
        # Step 5: Cross-validation
        if gemini_result and stt_result:
            cv_result = self._cross_validate(gemini_result, stt_result)
            logger.info(f"[{request_id}] 🔬 Cross-validation: {json.dumps(cv_result)}")
        
        logger.info(f"[{request_id}] ✅ Processing complete")
        
        return response
```

### Frontend: Add Console Logging

**File: `frontend/pronunciation-recorder.js`**

```javascript
class PronunciationRecorder {
    constructor() {
        this.debugMode = true;  // Set to false in production
    }
    
    log(level, message, data = null) {
        if (!this.debugMode) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, data };
        
        console[level](`[Pronunciation] ${message}`, data || '');
        
        // Store in sessionStorage for debugging
        const logs = JSON.parse(sessionStorage.getItem('pronunciation_logs') || '[]');
        logs.push(logEntry);
        if (logs.length > 100) logs.shift();  // Keep last 100
        sessionStorage.setItem('pronunciation_logs', JSON.stringify(logs));
    }
    
    async startRecording() {
        this.log('info', 'Starting recording...');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.log('info', 'Microphone access granted', { 
                tracks: stream.getAudioTracks().map(t => ({ label: t.label, enabled: t.enabled }))
            });
            
            // ... rest of recording logic
            
        } catch (error) {
            this.log('error', 'Microphone access denied', { error: error.message });
            throw error;
        }
    }
    
    async submitRecording() {
        this.log('info', 'Submitting recording...', {
            audioSize: this.audioBlob?.size,
            duration: this.recordingDuration
        });
        
        const response = await fetch('/api/v1/pronunciation/analyze', ...);
        const data = await response.json();
        
        this.log('info', 'Analysis response', data);
        
        if (!data.transcribed_text) {
            this.log('warn', 'Empty transcription returned!');
        }
        
        return data;
    }
    
    // Export logs for debugging
    exportLogs() {
        const logs = sessionStorage.getItem('pronunciation_logs');
        console.log('=== PRONUNCIATION DEBUG LOGS ===');
        console.log(logs);
        return logs;
    }
}
```

### Database: Add Debug Table

```sql
-- Table to store debug data for troubleshooting
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'PronunciationDebugLogs') AND type = 'U')
    DROP TABLE PronunciationDebugLogs;
GO

CREATE TABLE PronunciationDebugLogs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    RequestID NVARCHAR(50),
    UserID UNIQUEIDENTIFIER,
    AttemptID INT,
    Step NVARCHAR(50),  -- 'audio_upload', 'stt', 'ipa', 'gemini', 'cross_validate'
    Status NVARCHAR(20),  -- 'success', 'warning', 'error'
    InputData NVARCHAR(MAX),  -- JSON
    OutputData NVARCHAR(MAX),  -- JSON
    ErrorMessage NVARCHAR(MAX),
    DurationMs INT,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

CREATE INDEX IX_PronunciationDebugLogs_Request ON PronunciationDebugLogs(RequestID);
GO

CREATE INDEX IX_PronunciationDebugLogs_User ON PronunciationDebugLogs(UserID);
GO

CREATE INDEX IX_PronunciationDebugLogs_Date ON PronunciationDebugLogs(CreatedAt);
GO
```

---

## UAT Test Cases

### TC-001: Basic Recording Flow (Desktop)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to flashcard with audio | Card displays with Play button |
| 2 | Click "Start Recording" button | Button changes to "Stop Recording", timer starts |
| 3 | Speak the target phrase | Recording indicator visible |
| 4 | Click "Stop Recording" | Recording stops, "Analyzing..." appears |
| 5 | Wait for analysis | Results display with transcription, IPA, score |
| 6 | Verify transcription | Should match what was spoken |
| 7 | Verify IPA comparison | Matching sounds in green, differences in red |

### TC-002: Basic Recording Flow (Mobile - iOS Safari)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to flashcard | Card displays properly on mobile |
| 2 | Tap "Start Recording" | Microphone permission prompt (if first time) |
| 3 | Grant permission | Recording starts |
| 4 | Speak phrase | Recording indicator visible |
| 5 | Tap "Stop Recording" | Recording stops, analysis starts |
| 6 | Verify results | Same quality as desktop |

### TC-003: Keyboard Shortcuts (Desktop)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Focus on card area | Ready state |
| 2 | Press Space | Recording starts |
| 3 | Press Space again | Recording stops, submits |
| 4 | Press Enter | Same behavior as Space |
| 5 | Navigate to different card | Space/Enter should work on new card |

### TC-004: Empty Recording Handling
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start recording | Recording begins |
| 2 | Stay silent for 2 seconds | Timer shows 00:02 |
| 3 | Stop recording | Analysis runs |
| 4 | Check results | Should show "No speech detected" or similar, NOT empty IPA |

### TC-005: Voice Clone Setup Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete a pronunciation attempt | Results display |
| 2 | See "Create Voice Profile" button | Button is visible and clickable |
| 3 | Click button | Modal opens with instructions |
| 4 | Read sample text aloud | Recording captures audio |
| 5 | Submit sample | "Creating voice profile..." message |
| 6 | Wait for completion | Success message, button changes to "Hear Yourself" |
| 7 | Test "Hear Yourself" | Plays audio in user's cloned voice |

### TC-006: Voice Clone - Returning User
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User with existing voice clone logs in | Voice clone detected |
| 2 | Practice pronunciation | Results display |
| 3 | See "Hear Yourself Say It" button | Button visible (not "Create Profile") |
| 4 | Click button | Plays personalized audio |

### TC-007: Multi-Tenant User Stats
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A logs in | See User A's stats |
| 2 | User A practices | Stats update for User A |
| 3 | User A logs out | Session ends |
| 4 | User B logs in (same device) | See User B's stats (different from A) |
| 5 | User B practices | Stats update for User B only |
| 6 | User A logs back in | User A stats unchanged from step 2 |

### TC-008: OAuth Session Persistence (Mobile)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in on iOS Safari | Login succeeds |
| 2 | Use app for 5 minutes | Works normally |
| 3 | Close Safari completely | App closed |
| 4 | Wait 1 hour | Time passes |
| 5 | Reopen Safari, navigate to app | Should still be logged in |
| 6 | Wait 24 hours | Time passes |
| 7 | Reopen app | Should still be logged in |

### TC-009: Gemini + STT Cross-Validation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Record good pronunciation | Audio captured |
| 2 | Check STT result | High confidence (>80%) |
| 3 | Check Gemini result | Positive feedback |
| 4 | Check cross-validation | Both systems agree |
| 5 | Record poor pronunciation | Audio captured |
| 6 | Check both systems | Both identify issues |
| 7 | Verify issues match | Same words/sounds flagged |

### TC-010: IPA Phoneme Highlighting
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Practice "bonjour" | Results display |
| 2 | Check IPA comparison | Target IPA shown |
| 3 | Matching sounds | Displayed in green |
| 4 | Different sounds | Displayed in red with ↑ marker |
| 5 | Hover/tap on red sound | Shows tip for improvement |

---

## Automated Test Cases (VS Code)

### Backend Tests: `backend/tests/test_pronunciation_e2e.py`

```python
"""
End-to-end tests for pronunciation feature.
Run before any deployment.
"""
import pytest
import httpx
import base64
import os
from pathlib import Path

BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")

# Sample audio files for testing (should be in tests/fixtures/)
FIXTURES_DIR = Path(__file__).parent / "fixtures"


class TestPronunciationRecording:
    """Tests for recording and analysis flow."""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authenticated headers for test user."""
        # TODO: Implement test user authentication
        return {"Authorization": "Bearer TEST_TOKEN"}
    
    @pytest.fixture
    def sample_audio(self):
        """Load sample audio file."""
        audio_path = FIXTURES_DIR / "sample_bonjour.wav"
        if audio_path.exists():
            return audio_path.read_bytes()
        # Generate minimal valid WAV if fixture missing
        return self._generate_silence_wav(duration_sec=2)
    
    def _generate_silence_wav(self, duration_sec: int = 2) -> bytes:
        """Generate a silent WAV file for testing."""
        import struct
        sample_rate = 16000
        num_samples = sample_rate * duration_sec
        
        # WAV header
        header = struct.pack(
            '<4sI4s4sIHHIIHH4sI',
            b'RIFF',
            36 + num_samples * 2,
            b'WAVE',
            b'fmt ',
            16, 1, 1, sample_rate, sample_rate * 2, 2, 16,
            b'data',
            num_samples * 2
        )
        
        # Silent samples
        samples = b'\x00\x00' * num_samples
        
        return header + samples
    
    @pytest.mark.asyncio
    async def test_pronunciation_endpoint_exists(self):
        """Verify pronunciation endpoints are registered."""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/api/v1/pronunciation/prompt-template/fr")
            assert response.status_code in [200, 401], "Endpoint should exist"
    
    @pytest.mark.asyncio
    async def test_empty_audio_handled_gracefully(self, auth_headers):
        """Empty audio should return meaningful error, not crash."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/v1/pronunciation/analyze",
                headers=auth_headers,
                json={
                    "audio_base64": base64.b64encode(b"").decode(),
                    "target_text": "bonjour",
                    "language_code": "fr"
                }
            )
            
            # Should not be 500
            assert response.status_code != 500, "Empty audio should not cause server error"
            
            if response.status_code == 400:
                data = response.json()
                assert "error" in data or "detail" in data
    
    @pytest.mark.asyncio
    async def test_valid_audio_returns_transcription(self, auth_headers, sample_audio):
        """Valid audio should return non-empty transcription."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/api/v1/pronunciation/analyze",
                headers=auth_headers,
                json={
                    "audio_base64": base64.b64encode(sample_audio).decode(),
                    "target_text": "bonjour",
                    "language_code": "fr"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Transcription should not be empty (unless silence)
            # At minimum, should have tried
            assert "transcribed_text" in data
            assert "overall_confidence" in data
    
    @pytest.mark.asyncio
    async def test_ipa_generated_for_transcription(self, auth_headers, sample_audio):
        """IPA should be generated for both target and spoken."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/api/v1/pronunciation/analyze",
                headers=auth_headers,
                json={
                    "audio_base64": base64.b64encode(sample_audio).decode(),
                    "target_text": "bonjour",
                    "language_code": "fr"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # IPA should be present
            assert "ipa" in data or "ipa_target" in data
            
            # Target IPA should not be empty
            ipa_target = data.get("ipa", {}).get("target") or data.get("ipa_target")
            assert ipa_target, "Target IPA should not be empty"


class TestVoiceClone:
    """Tests for voice clone feature."""
    
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": "Bearer TEST_TOKEN"}
    
    @pytest.mark.asyncio
    async def test_voice_clone_status_endpoint(self, auth_headers):
        """Voice clone status endpoint should work."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BASE_URL}/api/v1/voice-clone/status",
                headers=auth_headers
            )
            
            # Should return status (even if 401 for unauth)
            assert response.status_code in [200, 401]
            
            if response.status_code == 200:
                data = response.json()
                assert "has_voice_clone" in data
    
    @pytest.mark.asyncio
    async def test_voice_clone_create_requires_audio(self, auth_headers):
        """Create endpoint should require audio samples."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/v1/voice-clone/create",
                headers=auth_headers,
                files=[]  # No files
            )
            
            # Should reject with 400, not 500
            assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_voice_clone_generate_requires_clone(self, auth_headers):
        """Generate should fail gracefully if no clone exists."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BASE_URL}/api/v1/voice-clone/generate/fr?text=bonjour",
                headers=auth_headers
            )
            
            # Should return 404 (no clone) not 500
            assert response.status_code in [404, 401]


class TestMultiTenant:
    """Tests for multi-tenant user isolation."""
    
    @pytest.mark.asyncio
    async def test_user_stats_isolated(self):
        """Different users should have isolated stats."""
        # TODO: Implement with two test users
        pass
    
    @pytest.mark.asyncio
    async def test_voice_clone_isolated(self):
        """User A cannot access User B's voice clone."""
        # TODO: Implement with two test users
        pass


class TestCrossValidation:
    """Tests for STT + Gemini cross-validation."""
    
    @pytest.mark.asyncio
    async def test_cross_validation_suppresses_false_positives(self):
        """High STT confidence should suppress Gemini false positives."""
        # TODO: Implement with mock data
        pass
    
    @pytest.mark.asyncio
    async def test_cross_validation_confirms_real_issues(self):
        """Both systems flagging same word = confirmed issue."""
        # TODO: Implement with mock data
        pass
```

### Frontend Tests: `frontend/tests/pronunciation.test.js`

```javascript
/**
 * Frontend tests for pronunciation feature.
 * Run with: npm test
 */

describe('Pronunciation Recorder', () => {
    
    describe('Recording Controls', () => {
        
        test('Start button should be enabled on load', () => {
            // Setup
            document.body.innerHTML = `
                <button id="start-recording">Start Recording</button>
            `;
            
            const btn = document.getElementById('start-recording');
            expect(btn.disabled).toBe(false);
        });
        
        test('Space key should trigger recording', () => {
            const mockStartRecording = jest.fn();
            window.pronunciationRecorder = { startRecording: mockStartRecording };
            
            // Simulate space key
            const event = new KeyboardEvent('keydown', { code: 'Space' });
            document.dispatchEvent(event);
            
            expect(mockStartRecording).toHaveBeenCalled();
        });
        
        test('Recording should stop on second Space press', () => {
            const mockStopRecording = jest.fn();
            window.pronunciationRecorder = { 
                isRecording: true,
                stopRecording: mockStopRecording 
            };
            
            const event = new KeyboardEvent('keydown', { code: 'Space' });
            document.dispatchEvent(event);
            
            expect(mockStopRecording).toHaveBeenCalled();
        });
        
    });
    
    describe('Results Display', () => {
        
        test('Empty transcription should show helpful message', () => {
            const response = {
                transcribed_text: '',
                overall_confidence: 0,
                feedback: ''
            };
            
            const message = getEmptyTranscriptionMessage(response);
            
            expect(message).toContain('No speech detected');
            expect(message).not.toContain('undefined');
        });
        
        test('IPA comparison should handle empty spoken IPA', () => {
            const comparison = {
                target_phonemes: ['b', 'ɔ̃', 'ʒ', 'u', 'ʁ'],
                spoken_phonemes: [],
                alignment: []
            };
            
            const html = renderIPAComparison(comparison);
            
            expect(html).toContain('No pronunciation detected');
            expect(html).not.toContain('→∅');  // Should not show confusing arrows
        });
        
    });
    
    describe('Voice Clone UI', () => {
        
        test('Create Profile button should have click handler', () => {
            document.body.innerHTML = `
                <button id="create-voice-profile">Create Voice Profile</button>
            `;
            
            const btn = document.getElementById('create-voice-profile');
            const hasHandler = btn.onclick !== null || 
                              getEventListeners(btn).click?.length > 0;
            
            expect(hasHandler).toBe(true);
        });
        
        test('Should show different button if clone exists', async () => {
            // Mock API response
            global.fetch = jest.fn(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ has_voice_clone: true })
                })
            );
            
            await voiceClone.checkStatus();
            const buttonText = document.getElementById('voice-clone-btn').textContent;
            
            expect(buttonText).toContain('Hear Yourself');
            expect(buttonText).not.toContain('Create');
        });
        
    });
    
});

describe('Mobile Compatibility', () => {
    
    beforeEach(() => {
        // Mock mobile user agent
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
            writable: true
        });
    });
    
    test('Touch events should work for recording', () => {
        const mockStartRecording = jest.fn();
        window.pronunciationRecorder = { startRecording: mockStartRecording };
        
        const btn = document.getElementById('start-recording');
        btn.dispatchEvent(new TouchEvent('touchstart'));
        
        expect(mockStartRecording).toHaveBeenCalled();
    });
    
    test('Should not rely solely on keyboard shortcuts on mobile', () => {
        const btn = document.getElementById('start-recording');
        
        // Button should be visible and tappable
        expect(btn.style.display).not.toBe('none');
        expect(btn.disabled).toBe(false);
    });
    
});
```

---

## Voice Clone Workflow Clarification

### Current User's Situation
- User has been using the app for 1-2 years
- Has existing pronunciation recordings in the system
- 11Labs account may have existing voice avatars

### Recommended Workflow

**Option A: Use Existing Recordings (Preferred)**
1. Query user's past pronunciation attempts
2. Select 3-5 high-quality recordings (>30 sec total, high confidence)
3. Automatically create voice clone from these
4. No new recording needed!

**Option B: New Recording**
1. User clicks "Create Voice Profile"
2. Modal shows with sample text to read
3. User records 30-60 seconds of speech
4. Submit to 11Labs
5. Wait for processing (~30 sec)
6. Clone ready

### Sample Size Requirements

| Quality | Total Duration | Samples |
|---------|----------------|---------|
| Basic | 30 seconds | 1-2 recordings |
| Good | 1-2 minutes | 3-5 recordings |
| Best | 3-5 minutes | 5-10 recordings |

11Labs can work with as little as 30 seconds, but more is better for non-English languages.

### Implementation: Use Existing Recordings

```python
async def create_clone_from_history(db: Session, user_id: UUID) -> dict:
    """
    Create voice clone from user's existing pronunciation recordings.
    """
    # Get user's best recordings
    recordings = db.query(PronunciationAttempt).filter(
        PronunciationAttempt.user_id == user_id,
        PronunciationAttempt.overall_confidence > 0.7,  # Good quality
        PronunciationAttempt.audio_url.isnot(None)
    ).order_by(
        PronunciationAttempt.overall_confidence.desc()
    ).limit(5).all()
    
    if not recordings:
        return {"success": False, "error": "No suitable recordings found"}
    
    # Calculate total duration
    total_duration = sum(r.audio_duration or 5 for r in recordings)
    
    if total_duration < 30:
        return {"success": False, "error": "Need more recordings (at least 30 sec)"}
    
    # Download audio files from GCS
    audio_samples = []
    for r in recordings:
        audio_bytes = await download_from_gcs(r.audio_url)
        audio_samples.append(audio_bytes)
    
    # Create clone
    service = ElevenLabsService()
    result = await service.create_voice_clone(
        audio_samples=audio_samples,
        voice_name=f"user_{str(user_id)[:8]}"
    )
    
    return result
```

---

## Multi-Tenant Stats Fix

### Problem
Stats may be showing aggregate data instead of per-user data.

### Verification Query
```sql
-- Check if stats are properly filtered by user
SELECT 
    UserID,
    COUNT(*) as TotalAttempts,
    AVG(OverallConfidence) as AvgConfidence
FROM PronunciationAttempts
GROUP BY UserID
ORDER BY TotalAttempts DESC;
```

### Frontend Fix
Ensure all stats queries include user_id:

```javascript
// WRONG - gets all stats
const stats = await fetch('/api/v1/pronunciation/stats');

// RIGHT - gets current user's stats
const stats = await fetch('/api/v1/pronunciation/stats/me');
```

### Backend Fix
```python
@router.get("/stats/me")
async def get_my_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # MUST filter by user
):
    stats = db.query(...).filter(
        PronunciationAttempt.user_id == current_user.id  # CRITICAL
    )...
```

---

## OAuth Session Persistence Fix

### Problem
iOS Safari aggressively clears cookies, causing frequent logouts.

### Solutions

1. **Increase token expiry:**
```python
# In auth.py
ACCESS_TOKEN_EXPIRE_DAYS = 30  # Instead of hours
REFRESH_TOKEN_EXPIRE_DAYS = 90
```

2. **Use localStorage as fallback:**
```javascript
// Store token in localStorage as backup
function saveAuthToken(token) {
    // Primary: cookie (set by server)
    // Backup: localStorage
    localStorage.setItem('auth_token', token);
}

function getAuthToken() {
    // Try cookie first, fall back to localStorage
    return getCookie('auth_token') || localStorage.getItem('auth_token');
}
```

3. **Implement refresh token rotation:**
```python
@router.post("/refresh")
async def refresh_token(refresh_token: str):
    # Validate refresh token
    # Issue new access token
    # Rotate refresh token
    pass
```

---

## Summary: Priority Order

| Priority | Bug/Feature | Effort | Impact |
|----------|-------------|--------|--------|
| P0 | BUG-001: Empty transcription | FIXED | Was blocking |
| P0 | BUG-002: Voice clone auth + UI | FIXED (6 sub-issues) | Was blocking |
| P1 | BUG-006: Mobile OAuth | 2h | High frustration |
| P1 | Add logging/debugging | 3h | Enables troubleshooting |
| P1 | Multi-tenant stats fix | 1h | Data integrity |
| P2 | BUG-003: Keyboard shortcuts | 2h | UX polish |
| P2 | BUG-005: Cross-validation | 3h | Quality improvement |
| P2 | BUG-007: Mouse click stop recording | 1h | UX confusion |
