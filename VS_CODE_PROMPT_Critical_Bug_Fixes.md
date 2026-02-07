# VS Code Prompt: Critical Bug Fixes - Pronunciation Feature

## Priority 0 Bugs (Must Fix Before Any Other Work)

### BUG-001: Empty Transcription Returns

**Symptom:**
```
What you said: (blank)
Your pronunciation (IPA): t→∅ɛ→∅ʃ→∅n→∅
0% - Keep practicing
```

**Root Cause Investigation:**
1. Is audio actually being recorded? (Check blob size)
2. Is audio being uploaded to GCS? (Check URL returned)
3. Is STT receiving the audio? (Check API call)
4. Is STT returning empty? (Check raw response)

**Fix Required:**
In `pronunciation_service.py`, add validation and better error handling:

```python
async def process_pronunciation_attempt(self, audio_data: bytes, ...):
    # VALIDATION: Check audio data
    if not audio_data or len(audio_data) < 1000:
        return {
            "success": False,
            "error": "no_audio",
            "message": "No audio detected. Please check your microphone and try again.",
            "transcribed_text": None,
            "overall_confidence": 0
        }
    
    # ... rest of processing ...
    
    # After STT
    if not stt_result.get('transcription'):
        return {
            "success": True,  # STT worked, just no speech
            "error": "no_speech",
            "message": "No speech detected. Please speak louder and closer to the microphone.",
            "transcribed_text": "",
            "overall_confidence": 0,
            "word_scores": []
        }
```

In frontend, handle these cases gracefully:

```javascript
function displayResults(response) {
    if (response.error === 'no_audio') {
        showError('🎤 No audio recorded. Please check your microphone permissions.');
        return;
    }
    
    if (response.error === 'no_speech' || !response.transcribed_text) {
        showMessage('🔇 No speech detected. Please speak louder and try again.');
        // Don't show confusing IPA comparison
        return;
    }
    
    // Normal display...
}
```

### BUG-002: Voice Clone Button Non-Functional

**Symptom:** "🎙️ Create Voice Profile" button does nothing

**Likely Causes:**
1. JavaScript not loaded
2. onclick handler not attached
3. API endpoint returning error
4. Modal not rendering

**Debug Steps:**
```javascript
// Add to voice-clone.js
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('[onclick*="voiceClone"]');
    console.log('Voice clone button found:', btn);
    console.log('voiceClone object exists:', typeof voiceClone !== 'undefined');
});
```

**Fix:**
Ensure the button has proper handler and voiceClone is initialized:

```html
<!-- In HTML -->
<button id="create-voice-profile-btn" class="btn btn-secondary">
    🎙️ Create Voice Profile
</button>

<script>
document.getElementById('create-voice-profile-btn').addEventListener('click', async function() {
    console.log('Button clicked');
    
    if (typeof voiceClone === 'undefined') {
        console.error('voiceClone not initialized');
        alert('Voice clone feature is loading. Please try again.');
        return;
    }
    
    try {
        voiceClone.renderSetupPrompt('voice-clone-container');
    } catch (error) {
        console.error('Voice clone error:', error);
        alert('Failed to open voice profile setup: ' + error.message);
    }
});
</script>
```

---

## Add Comprehensive Logging

### Backend Logging

Add to `pronunciation_service.py`:

```python
import logging
import json
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class PronunciationService:
    
    async def process_pronunciation_attempt(
        self,
        db,
        audio_data: bytes,
        target_text: str,
        language_code: str,
        user_id: str,
        flashcard_id: str = None
    ):
        request_id = str(uuid.uuid4())[:8]
        start_time = datetime.utcnow()
        
        def log_step(step: str, status: str, data: dict = None):
            elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
            logger.info(f"[{request_id}] {step}: {status} ({elapsed:.0f}ms) {json.dumps(data or {})}")
        
        log_step("START", "processing", {
            "target": target_text,
            "language": language_code,
            "audio_bytes": len(audio_data) if audio_data else 0
        })
        
        # Step 1: Validate audio
        if not audio_data or len(audio_data) < 1000:
            log_step("AUDIO", "EMPTY", {"size": len(audio_data) if audio_data else 0})
            return self._error_response("no_audio", "No audio detected")
        
        log_step("AUDIO", "valid", {"size": len(audio_data)})
        
        # Step 2: Upload to GCS
        try:
            audio_url = await self._upload_audio(audio_data, user_id)
            log_step("UPLOAD", "success", {"url": audio_url[:50] + "..."})
        except Exception as e:
            log_step("UPLOAD", "FAILED", {"error": str(e)})
            return self._error_response("upload_failed", str(e))
        
        # Step 3: STT Analysis
        try:
            stt_result = await self._run_stt_analysis(audio_data, language_code)
            log_step("STT", "success", {
                "transcription": stt_result.get('transcription', '')[:50],
                "confidence": stt_result.get('confidence', 0)
            })
        except Exception as e:
            log_step("STT", "FAILED", {"error": str(e)})
            return self._error_response("stt_failed", str(e))
        
        # Check for empty transcription
        if not stt_result.get('transcription'):
            log_step("STT", "EMPTY_RESULT", {})
            return {
                "success": True,
                "error": "no_speech",
                "message": "No speech detected. Please speak louder.",
                "transcribed_text": "",
                "overall_confidence": 0
            }
        
        # Step 4: IPA Generation
        try:
            ipa_target = self._generate_ipa(target_text, language_code)
            ipa_spoken = self._generate_ipa(stt_result['transcription'], language_code)
            log_step("IPA", "success", {"target": ipa_target, "spoken": ipa_spoken})
        except Exception as e:
            log_step("IPA", "FAILED", {"error": str(e)})
            ipa_target, ipa_spoken = "", ""
        
        # Step 5: Gemini Analysis (non-blocking)
        gemini_result = None
        try:
            gemini_result = await self._run_gemini_analysis(
                audio_data, target_text, language_code, stt_result
            )
            log_step("GEMINI", "success", {"clarity": gemini_result.get('clarity_score')})
        except Exception as e:
            log_step("GEMINI", "FAILED", {"error": str(e)})
        
        # Step 6: Build response
        response = self._build_response(
            stt_result=stt_result,
            ipa_target=ipa_target,
            ipa_spoken=ipa_spoken,
            gemini_result=gemini_result,
            target_text=target_text
        )
        
        log_step("COMPLETE", "success", {"score": response.get('overall_confidence')})
        
        return response
    
    def _error_response(self, error_code: str, message: str) -> dict:
        return {
            "success": False,
            "error": error_code,
            "message": message,
            "transcribed_text": None,
            "overall_confidence": 0
        }
```

### Frontend Logging

Add to `pronunciation-recorder.js`:

```javascript
class PronunciationDebugger {
    constructor() {
        this.logs = [];
        this.sessionId = Math.random().toString(36).substr(2, 8);
    }
    
    log(level, message, data = {}) {
        const entry = {
            time: new Date().toISOString(),
            session: this.sessionId,
            level,
            message,
            data
        };
        
        this.logs.push(entry);
        console[level](`[Pronunciation ${this.sessionId}] ${message}`, data);
        
        // Keep last 50 entries
        if (this.logs.length > 50) this.logs.shift();
        
        // Store in sessionStorage for export
        sessionStorage.setItem('pronunciation_debug', JSON.stringify(this.logs));
    }
    
    exportLogs() {
        const logs = JSON.stringify(this.logs, null, 2);
        console.log('=== PRONUNCIATION DEBUG EXPORT ===\n' + logs);
        
        // Also copy to clipboard
        navigator.clipboard?.writeText(logs);
        
        return logs;
    }
}

const debug = new PronunciationDebugger();

// Instrument key functions
const originalStartRecording = pronunciationRecorder.startRecording;
pronunciationRecorder.startRecording = async function() {
    debug.log('info', 'Starting recording');
    try {
        const result = await originalStartRecording.call(this);
        debug.log('info', 'Recording started successfully');
        return result;
    } catch (error) {
        debug.log('error', 'Recording failed to start', { error: error.message });
        throw error;
    }
};

const originalSubmit = pronunciationRecorder.submitRecording;
pronunciationRecorder.submitRecording = async function() {
    debug.log('info', 'Submitting recording', {
        blobSize: this.audioBlob?.size,
        duration: this.recordingDuration
    });
    
    try {
        const result = await originalSubmit.call(this);
        debug.log('info', 'Submission complete', {
            success: result.success,
            transcription: result.transcribed_text?.substring(0, 30),
            confidence: result.overall_confidence
        });
        return result;
    } catch (error) {
        debug.log('error', 'Submission failed', { error: error.message });
        throw error;
    }
};

// Export function for debugging
window.exportPronunciationLogs = () => debug.exportLogs();
```

---

## SQL: Add Debug Logging Table

Run in SSMS:

```sql
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'PronunciationDebugLogs') AND type = 'U')
    DROP TABLE PronunciationDebugLogs;
GO

CREATE TABLE PronunciationDebugLogs (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    RequestID NVARCHAR(50) NOT NULL,
    UserID UNIQUEIDENTIFIER,
    Step NVARCHAR(50) NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    Data NVARCHAR(MAX),
    ErrorMessage NVARCHAR(MAX),
    DurationMs INT,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

CREATE INDEX IX_DebugLogs_Request ON PronunciationDebugLogs(RequestID);
GO

CREATE INDEX IX_DebugLogs_Date ON PronunciationDebugLogs(CreatedAt DESC);
GO

PRINT '✅ Debug logging table created';
GO
```

---

## Frontend: Handle Empty Results Gracefully

Update results display to never show confusing "→∅" patterns:

```javascript
function displayResults(response) {
    const container = document.getElementById('results-container');
    
    // Handle no audio
    if (response.error === 'no_audio') {
        container.innerHTML = `
            <div class="error-state">
                <h3>🎤 No Audio Detected</h3>
                <p>Please check that your microphone is working and try again.</p>
                <ul>
                    <li>Make sure microphone permission is granted</li>
                    <li>Check that your microphone is not muted</li>
                    <li>Try speaking louder</li>
                </ul>
            </div>
        `;
        return;
    }
    
    // Handle no speech detected
    if (response.error === 'no_speech' || !response.transcribed_text) {
        container.innerHTML = `
            <div class="warning-state">
                <h3>🔇 No Speech Detected</h3>
                <p>We couldn't hear any words. Please try again:</p>
                <ul>
                    <li>Speak louder and closer to the microphone</li>
                    <li>Reduce background noise</li>
                    <li>Make sure you're speaking during the recording</li>
                </ul>
                <button onclick="retryRecording()" class="btn btn-primary">
                    🔄 Try Again
                </button>
            </div>
        `;
        return;
    }
    
    // Normal results display
    container.innerHTML = buildNormalResults(response);
}

function buildIPAComparison(targetIPA, spokenIPA) {
    // Don't show comparison if spoken is empty
    if (!spokenIPA || spokenIPA.trim() === '') {
        return `
            <div class="ipa-section">
                <p><strong>Target IPA:</strong> ${targetIPA}</p>
                <p class="ipa-note">Spoken IPA not available (no speech detected)</p>
            </div>
        `;
    }
    
    // Normal comparison
    return buildPhonemeComparison(targetIPA, spokenIPA);
}
```

---

## Testing Checklist Before Handoff

VS Code must verify these pass before deployment:

### Backend Tests
- [ ] Empty audio returns `error: "no_audio"`, not 500
- [ ] Silent audio returns `error: "no_speech"`, not empty IPA
- [ ] Valid audio returns non-empty transcription
- [ ] Logging captures all steps
- [ ] Voice clone status endpoint works
- [ ] Voice clone create endpoint validates input

### Frontend Tests
- [ ] Start button works with click
- [ ] Start button works with Space/Enter (desktop)
- [ ] Stop button works with click
- [ ] Empty result shows helpful message, not "→∅"
- [ ] Voice clone button has click handler
- [ ] Console shows debug logs

### Integration Tests
- [ ] Full flow: record → submit → display results
- [ ] Error states display correctly
- [ ] Logs can be exported for debugging

---

## Deployment

After fixes:

```powershell
gcloud builds submit --tag gcr.io/super-flashcards-475210/super-flashcards:latest --project=super-flashcards-475210
```

```powershell
gcloud run services update super-flashcards --region=us-central1 --project=super-flashcards-475210 --image=gcr.io/super-flashcards-475210/super-flashcards:latest
```

Then run UAT test cases manually.
