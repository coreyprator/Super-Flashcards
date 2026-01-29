# VS Code Prompt: Sprint 8.5d - Pronunciation Feedback Overhaul

## Priority 1: Bug Fix - Contradictory Feedback

### The Problem

User sees contradictory feedback:
```
53% - Keep practicing. You'll improve!
...
Feedback: ✅ Perfect! Your pronunciation matched exactly.
```

Both can't be true. The transcription matched perfectly ("pince" = "pince", IPA matched), but confidence score says 53%.

### Root Cause

**STT confidence ≠ pronunciation accuracy**

- 53% confidence = Google was 53% *sure* it heard "pince"
- But it DID transcribe "pince" correctly
- Low confidence can mean: quiet audio, short word, background noise, accent
- If transcription matches, pronunciation was correct regardless of confidence

### Fix Required

In `backend/app/services/pronunciation_service.py`, update the feedback logic:

```python
def _calculate_overall_score(self, target: str, transcribed: str, confidence: float) -> tuple[float, str]:
    """
    Calculate score and feedback. Prioritize transcription match over confidence.
    
    Returns:
        tuple: (score, feedback_message)
    """
    target_clean = target.lower().strip()
    transcribed_clean = transcribed.lower().strip()
    
    # PRIORITY 1: Exact transcription match = success
    if transcribed_clean == target_clean:
        # Perfect match - don't let low confidence confuse the user
        # Score should reflect success, not STT uncertainty
        adjusted_score = max(confidence, 0.85)  # Minimum 85% if match
        return (adjusted_score, "✅ Perfect! Your pronunciation was understood exactly.")
    
    # PRIORITY 2: Check word-level matches for partial credit
    target_words = target_clean.split()
    transcribed_words = transcribed_clean.split()
    
    if len(target_words) == len(transcribed_words):
        matches = sum(1 for t, tr in zip(target_words, transcribed_words) if t == tr)
        match_ratio = matches / len(target_words)
        
        if match_ratio >= 0.8:
            return (max(confidence, 0.75), f"👍 Good! {matches}/{len(target_words)} words matched.")
    
    # PRIORITY 3: Use confidence for non-matching transcriptions
    if confidence >= 0.7:
        return (confidence, f"📝 Heard: '{transcribed}'. Close, but not quite.")
    else:
        return (confidence, f"🔄 Heard: '{transcribed}'. Try again, speaking more clearly.")


def _get_word_status(self, confidence: float, word_matched: bool) -> str:
    """
    Determine word status. Match trumps confidence.
    """
    if word_matched:
        return "correct"  # Even if confidence is low
    elif confidence >= 0.7:
        return "good"
    elif confidence >= 0.5:
        return "needs_work"
    else:
        return "unclear"
```

### UI Fix

In frontend, show ONE clear message, not both:

```javascript
function displayFeedback(response) {
    // Show the computed feedback, not raw confidence
    const feedbackText = response.feedback;  // Already computed by backend
    
    // Don't show "X% Keep practicing" if transcription matched
    // The backend now handles this logic
    
    return `<div class="feedback-message">${feedbackText}</div>`;
}
```

---

## Priority 2: IPA Phoneme Diff Highlighting

### Concept

Show users EXACTLY which sounds differ:

```
Target IPA:  p ɛ̃ s
Your IPA:    p ɛ n s
                 ↑
             You said [n] instead of [ɛ̃] (nasal vowel)
```

### Backend Implementation

Create `backend/app/services/ipa_diff_service.py`:

```python
"""
IPA Phoneme Comparison Service
Highlights differences between target and spoken pronunciation
"""
import re
from typing import List, Tuple
from difflib import SequenceMatcher


# Common IPA phonemes (simplified set for major languages)
IPA_PHONEMES = {
    # Vowels
    'a', 'e', 'i', 'o', 'u', 'ə', 'ɛ', 'ɔ', 'æ', 'ʌ', 'ɪ', 'ʊ', 'ɑ',
    # Nasal vowels (French)
    'ɛ̃', 'ɑ̃', 'ɔ̃', 'œ̃',
    # Consonants
    'p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'ʃ', 'ʒ', 
    'm', 'n', 'ŋ', 'ɲ', 'l', 'r', 'ʁ', 'w', 'j', 'h',
    # Special
    'θ', 'ð', 'tʃ', 'dʒ', 'ɣ', 'x', 'χ'
}

# Phonemes that are commonly confused (for better feedback)
CONFUSION_PAIRS = {
    ('ɛ̃', 'ɛn'): "The nasal vowel [ɛ̃] should resonate in your nose, not end with [n]",
    ('ɑ̃', 'ɑn'): "The nasal vowel [ɑ̃] is nasalized, not followed by [n]",
    ('ʁ', 'r'): "French [ʁ] is uvular (throat), not alveolar (tongue tip)",
    ('y', 'u'): "French [y] requires rounded lips while saying [i]",
    ('ø', 'o'): "French [ø] is between [e] and [o], lips rounded",
    ('θ', 's'): "English [θ] (th) requires tongue between teeth",
    ('ð', 'd'): "English [ð] (th) is voiced with tongue between teeth",
}


def tokenize_ipa(ipa_string: str) -> List[str]:
    """
    Split IPA string into individual phonemes.
    Handles multi-character phonemes like 'tʃ', 'ɛ̃', etc.
    """
    if not ipa_string:
        return []
    
    phonemes = []
    i = 0
    ipa = ipa_string.strip()
    
    while i < len(ipa):
        # Skip spaces and delimiters
        if ipa[i] in ' .ˈˌ':
            i += 1
            continue
        
        # Check for multi-character phonemes (longest match first)
        matched = False
        for length in [3, 2]:  # Try 3-char, then 2-char
            if i + length <= len(ipa):
                chunk = ipa[i:i+length]
                # Check for nasal vowels (vowel + combining tilde)
                if len(chunk) >= 2 and chunk[1] == '̃':
                    phonemes.append(chunk[:2])
                    i += 2
                    matched = True
                    break
                # Check for affricates
                elif chunk in ['tʃ', 'dʒ', 'ts', 'dz']:
                    phonemes.append(chunk)
                    i += len(chunk)
                    matched = True
                    break
        
        if not matched:
            phonemes.append(ipa[i])
            i += 1
    
    return phonemes


def compare_ipa(target_ipa: str, spoken_ipa: str) -> dict:
    """
    Compare target and spoken IPA, returning detailed diff.
    
    Returns:
        {
            "target_phonemes": ["p", "ɛ̃", "s"],
            "spoken_phonemes": ["p", "ɛ", "n", "s"],
            "alignment": [
                {"target": "p", "spoken": "p", "match": True},
                {"target": "ɛ̃", "spoken": "ɛn", "match": False, "tip": "..."},
                {"target": "s", "spoken": "s", "match": True}
            ],
            "match_ratio": 0.67,
            "differences": [
                {"position": 1, "expected": "ɛ̃", "got": "ɛn", "tip": "..."}
            ]
        }
    """
    target_phonemes = tokenize_ipa(target_ipa)
    spoken_phonemes = tokenize_ipa(spoken_ipa)
    
    # Use sequence matcher for alignment
    matcher = SequenceMatcher(None, target_phonemes, spoken_phonemes)
    
    alignment = []
    differences = []
    matches = 0
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            for k in range(i2 - i1):
                alignment.append({
                    "target": target_phonemes[i1 + k],
                    "spoken": spoken_phonemes[j1 + k],
                    "match": True
                })
                matches += 1
        elif tag == 'replace':
            for k in range(max(i2 - i1, j2 - j1)):
                t_phoneme = target_phonemes[i1 + k] if i1 + k < i2 else None
                s_phoneme = spoken_phonemes[j1 + k] if j1 + k < j2 else None
                
                tip = _get_confusion_tip(t_phoneme, s_phoneme)
                
                alignment.append({
                    "target": t_phoneme,
                    "spoken": s_phoneme,
                    "match": False,
                    "tip": tip
                })
                
                if t_phoneme and s_phoneme:
                    differences.append({
                        "position": len(alignment) - 1,
                        "expected": t_phoneme,
                        "got": s_phoneme,
                        "tip": tip
                    })
        elif tag == 'delete':
            for k in range(i2 - i1):
                alignment.append({
                    "target": target_phonemes[i1 + k],
                    "spoken": None,
                    "match": False,
                    "tip": f"Missing sound [{target_phonemes[i1 + k]}]"
                })
                differences.append({
                    "position": len(alignment) - 1,
                    "expected": target_phonemes[i1 + k],
                    "got": "(missing)",
                    "tip": f"You didn't pronounce [{target_phonemes[i1 + k]}]"
                })
        elif tag == 'insert':
            for k in range(j2 - j1):
                alignment.append({
                    "target": None,
                    "spoken": spoken_phonemes[j1 + k],
                    "match": False,
                    "tip": f"Extra sound [{spoken_phonemes[j1 + k]}]"
                })
                differences.append({
                    "position": len(alignment) - 1,
                    "expected": "(nothing)",
                    "got": spoken_phonemes[j1 + k],
                    "tip": f"Extra sound [{spoken_phonemes[j1 + k]}] not in target"
                })
    
    total = max(len(target_phonemes), len(spoken_phonemes), 1)
    
    return {
        "target_phonemes": target_phonemes,
        "spoken_phonemes": spoken_phonemes,
        "alignment": alignment,
        "match_ratio": matches / total,
        "differences": differences,
        "is_perfect": len(differences) == 0
    }


def _get_confusion_tip(target: str, spoken: str) -> str:
    """Get specific tip for common phoneme confusions."""
    if not target or not spoken:
        return None
    
    # Check known confusion pairs
    for (p1, p2), tip in CONFUSION_PAIRS.items():
        if (target == p1 and spoken == p2) or (target == p2 and spoken == p1):
            return tip
    
    # Generic tip
    return f"You said [{spoken}] instead of [{target}]"
```

### Frontend: IPA Diff Display

```javascript
function displayIPAComparison(ipaComparison) {
    if (!ipaComparison || !ipaComparison.alignment) {
        return '';
    }
    
    let targetHtml = '';
    let spokenHtml = '';
    let diffMarkers = '';
    
    ipaComparison.alignment.forEach((item, idx) => {
        const matchClass = item.match ? 'ipa-match' : 'ipa-diff';
        const targetChar = item.target || '∅';
        const spokenChar = item.spoken || '∅';
        
        targetHtml += `<span class="${matchClass}">${targetChar}</span>`;
        spokenHtml += `<span class="${matchClass}">${spokenChar}</span>`;
        
        if (!item.match) {
            diffMarkers += `<span class="diff-marker">↑</span>`;
        } else {
            diffMarkers += `<span class="diff-marker"> </span>`;
        }
    });
    
    let html = `
        <div class="ipa-comparison">
            <div class="ipa-row">
                <span class="ipa-label">Target:</span>
                <span class="ipa-phonemes">${targetHtml}</span>
            </div>
            <div class="ipa-row">
                <span class="ipa-label">You:</span>
                <span class="ipa-phonemes">${spokenHtml}</span>
            </div>
            <div class="ipa-row diff-row">
                <span class="ipa-label"></span>
                <span class="ipa-markers">${diffMarkers}</span>
            </div>
    `;
    
    // Show specific tips for differences
    if (ipaComparison.differences && ipaComparison.differences.length > 0) {
        html += `<div class="ipa-tips">`;
        ipaComparison.differences.slice(0, 2).forEach(diff => {
            if (diff.tip) {
                html += `<p class="ipa-tip">💡 ${diff.tip}</p>`;
            }
        });
        html += `</div>`;
    }
    
    html += `</div>`;
    return html;
}
```

### CSS for IPA Diff

```css
.ipa-comparison {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    font-family: 'Lucida Sans Unicode', 'DejaVu Sans', monospace;
}

.ipa-row {
    display: flex;
    align-items: center;
    margin: 0.25rem 0;
}

.ipa-label {
    width: 60px;
    font-weight: 500;
    font-size: 0.85rem;
    color: #666;
}

.ipa-phonemes {
    font-size: 1.4rem;
    letter-spacing: 0.3rem;
}

.ipa-match {
    color: #28a745;
}

.ipa-diff {
    color: #dc3545;
    background: #ffe0e0;
    padding: 0 0.2rem;
    border-radius: 3px;
    font-weight: 600;
}

.diff-row {
    margin-top: -0.25rem;
}

.ipa-markers {
    font-size: 0.9rem;
    letter-spacing: 0.3rem;
    color: #dc3545;
}

.ipa-tips {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e0e0e0;
}

.ipa-tip {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    font-family: inherit;
}
```

---

## Priority 3: 11Labs Voice Clone (Premium Feature 🔥)

### Concept

**Mind-blowing UX:** User hears THEMSELVES saying it correctly.

1. User provides voice sample (or we use their recordings)
2. 11Labs clones their voice
3. Generate reference pronunciation in their voice
4. Compare: "Here's how YOU would sound saying it correctly"
5. Show IPA diff between cloned reference and actual recording

### Why This Is Game-Changing

- Removes "that's not my voice" objection
- Highly personalized feedback
- Makes correct pronunciation feel achievable
- Premium feature users will pay for

### 11Labs API Integration

Create `backend/app/services/elevenlabs_service.py`:

```python
"""
ElevenLabs Voice Clone Service
Creates personalized pronunciation references in user's own voice
"""
import os
import httpx
import base64
from typing import Optional
import logging

logger = logging.getLogger(__name__)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"


class ElevenLabsService:
    """
    Service for voice cloning and TTS with cloned voices.
    """
    
    def __init__(self):
        self.api_key = ELEVENLABS_API_KEY
        self.headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
    
    def is_available(self) -> bool:
        return bool(self.api_key)
    
    async def create_voice_clone(
        self,
        user_id: str,
        audio_samples: list[bytes],
        voice_name: str = None
    ) -> Optional[str]:
        """
        Create a voice clone from audio samples.
        
        Args:
            user_id: User identifier
            audio_samples: List of audio bytes (at least 1 minute total)
            voice_name: Optional name for the voice
            
        Returns:
            voice_id if successful, None otherwise
        """
        if not self.is_available():
            logger.warning("ElevenLabs API key not configured")
            return None
        
        voice_name = voice_name or f"user_{user_id}_clone"
        
        try:
            async with httpx.AsyncClient() as client:
                # Prepare multipart form data
                files = [
                    ("files", (f"sample_{i}.wav", sample, "audio/wav"))
                    for i, sample in enumerate(audio_samples)
                ]
                
                response = await client.post(
                    f"{ELEVENLABS_API_BASE}/voices/add",
                    headers={"xi-api-key": self.api_key},
                    data={"name": voice_name},
                    files=files,
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    voice_id = result.get("voice_id")
                    logger.info(f"Created voice clone {voice_id} for user {user_id}")
                    return voice_id
                else:
                    logger.error(f"Voice clone failed: {response.status_code} {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Voice clone error: {e}")
            return None
    
    async def generate_pronunciation(
        self,
        text: str,
        voice_id: str,
        language_code: str = "en"
    ) -> Optional[bytes]:
        """
        Generate pronunciation audio using cloned voice.
        
        Args:
            text: Text to pronounce
            voice_id: ElevenLabs voice ID (cloned or preset)
            language_code: Target language
            
        Returns:
            Audio bytes (MP3) if successful, None otherwise
        """
        if not self.is_available():
            return None
        
        # Map language codes to ElevenLabs model
        model_id = "eleven_multilingual_v2"  # Supports 29 languages
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{ELEVENLABS_API_BASE}/text-to-speech/{voice_id}",
                    headers=self.headers,
                    json={
                        "text": text,
                        "model_id": model_id,
                        "voice_settings": {
                            "stability": 0.75,
                            "similarity_boost": 0.85,
                            "style": 0.0,
                            "use_speaker_boost": True
                        }
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.content
                else:
                    logger.error(f"TTS failed: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"TTS error: {e}")
            return None
    
    async def get_user_voice_id(self, db, user_id: str) -> Optional[str]:
        """
        Get user's cloned voice ID from database.
        Returns None if user hasn't created a voice clone.
        """
        # Query UserVoiceClones table
        # TODO: Implement after creating table
        pass


async def generate_personalized_reference(
    db,
    user_id: str,
    target_text: str,
    language_code: str
) -> dict:
    """
    Generate personalized pronunciation reference for user.
    
    Returns:
        {
            "audio_base64": "...",  # User's voice saying it correctly
            "audio_url": "...",     # GCS URL
            "voice_type": "cloned" | "default",
            "ipa": "..."
        }
    """
    service = ElevenLabsService()
    
    if not service.is_available():
        return {"error": "Voice service not available", "voice_type": None}
    
    # Try to get user's cloned voice
    voice_id = await service.get_user_voice_id(db, user_id)
    
    if not voice_id:
        # Fall back to a high-quality default voice
        # Or prompt user to create voice clone
        return {
            "error": "No voice clone found",
            "voice_type": None,
            "prompt_clone": True
        }
    
    # Generate audio
    audio_bytes = await service.generate_pronunciation(
        text=target_text,
        voice_id=voice_id,
        language_code=language_code
    )
    
    if audio_bytes:
        return {
            "audio_base64": base64.b64encode(audio_bytes).decode(),
            "voice_type": "cloned",
            "success": True
        }
    else:
        return {"error": "Audio generation failed", "voice_type": None}
```

### Database Schema for Voice Clones

```sql
-- Add to Sprint 8.5d schema changes
CREATE TABLE UserVoiceClones (
    CloneID INT IDENTITY(1,1) PRIMARY KEY,
    UserID UNIQUEIDENTIFIER NOT NULL,
    ElevenLabsVoiceID NVARCHAR(100) NOT NULL,
    VoiceName NVARCHAR(100),
    SampleCount INT DEFAULT 0,
    TotalSampleDuration DECIMAL(10,2),  -- seconds
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    LastUsedAt DATETIME2,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (UserID) REFERENCES Users(id)
);

CREATE INDEX IX_UserVoiceClones_User ON UserVoiceClones(UserID);
```

### Frontend: Voice Clone Setup

```javascript
class VoiceCloneUI {
    constructor() {
        this.requiredSamples = 3;  // Minimum samples for good clone
        this.minDuration = 30;     // Minimum 30 seconds total
        this.collectedSamples = [];
    }
    
    renderClonePrompt() {
        return `
            <div class="voice-clone-setup">
                <h3>🎙️ Create Your Voice Profile</h3>
                <p>Record a few samples so we can show you how <strong>you</strong> 
                   would sound saying words correctly.</p>
                
                <div class="clone-benefits">
                    <p>✨ Hear yourself speaking with perfect pronunciation</p>
                    <p>✨ More personalized, relatable feedback</p>
                    <p>✨ One-time setup, works forever</p>
                </div>
                
                <div class="sample-collection">
                    <p>Read these sentences aloud (any language):</p>
                    <ol>
                        <li>"The quick brown fox jumps over the lazy dog."</li>
                        <li>"She sells seashells by the seashore."</li>
                        <li>"How much wood would a woodchuck chuck?"</li>
                    </ol>
                    
                    <button onclick="voiceClone.startRecording()" class="btn btn-primary">
                        🎤 Start Recording
                    </button>
                    
                    <div class="progress-bar">
                        <div class="progress" style="width: 0%"></div>
                    </div>
                    <p class="progress-text">0 / ${this.requiredSamples} samples collected</p>
                </div>
            </div>
        `;
    }
    
    async submitForCloning() {
        const response = await fetch('/api/v1/voice-clone/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                samples: this.collectedSamples.map(s => s.base64)
            })
        });
        
        if (response.ok) {
            this.showSuccess("🎉 Voice profile created! You'll now hear yourself in examples.");
        }
    }
}
```

### Pronunciation Flow with Voice Clone

```javascript
async function displayPronunciationResults(response) {
    // ... existing STT results display ...
    
    // If user has voice clone, show personalized reference
    if (response.personalized_reference) {
        const ref = response.personalized_reference;
        
        if (ref.voice_type === 'cloned') {
            html += `
                <div class="personalized-reference">
                    <h4>🎧 How YOU Would Sound</h4>
                    <audio controls src="data:audio/mp3;base64,${ref.audio_base64}"></audio>
                    <p class="hint">This is your voice saying it correctly</p>
                </div>
            `;
        } else if (ref.prompt_clone) {
            html += `
                <div class="clone-prompt">
                    <p>Want to hear <strong>yourself</strong> saying it correctly?</p>
                    <button onclick="voiceClone.showSetup()">🎙️ Create Voice Profile</button>
                </div>
            `;
        }
    }
    
    // IPA comparison (always show)
    if (response.ipa_comparison) {
        html += displayIPAComparison(response.ipa_comparison);
    }
}
```

---

## Implementation Order

| Phase | Feature | Effort | Impact |
|-------|---------|--------|--------|
| **8.5d-1** | Bug fix: confidence vs match | 1 hour | High |
| **8.5d-2** | IPA phoneme diff highlighting | 2-3 hours | Very High |
| **8.5d-3** | 11Labs integration + voice clone | 4-6 hours | 🔥 Game-changer |

### Recommended Approach

1. **Immediate:** Fix the bug (contradictory feedback)
2. **This sprint:** Add IPA diff highlighting
3. **Next sprint or premium feature:** 11Labs voice clone

---

## Environment Variables Needed

```bash
# For 11Labs (Phase 3 only)
ELEVENLABS_API_KEY=your_key_here
```

Store in Secret Manager:
```powershell
Set-Content -Path "secret.txt" -Value "YOUR_ELEVENLABS_KEY" -NoNewline
gcloud secrets create ELEVENLABS_API_KEY --replication-policy="automatic" --project=super-flashcards-475210
gcloud secrets versions add ELEVENLABS_API_KEY --data-file="secret.txt" --project=super-flashcards-475210
Remove-Item "secret.txt"
```

---

## Cost Estimates

| Feature | Cost per Use |
|---------|--------------|
| STT (existing) | ~$0.006/15sec |
| Gemini Flash | ~$0.01/request |
| IPA Diff | Free (compute) |
| 11Labs TTS | ~$0.01-0.03/phrase |
| 11Labs Clone | Free (included in plan) |

**11Labs Pricing:** $5/mo (Starter) = 30k characters ≈ 3000 pronunciations

---

## Files to Create/Modify

### Phase 1 (Bug Fix)
- `backend/app/services/pronunciation_service.py` - Fix feedback logic

### Phase 2 (IPA Diff)
- `backend/app/services/ipa_diff_service.py` - CREATE
- `frontend/ipa-comparison.js` - CREATE  
- `frontend/styles.css` - ADD styles

### Phase 3 (11Labs)
- `backend/app/services/elevenlabs_service.py` - CREATE
- `backend/app/routers/voice_clone.py` - CREATE
- `frontend/voice-clone.js` - CREATE
- SQL schema for UserVoiceClones table

---

## Testing Checklist

### Phase 1
- [ ] Transcription match + low confidence → shows "Perfect!" (not "Keep practicing")
- [ ] Transcription mismatch → shows what was heard
- [ ] No contradictory messages displayed

### Phase 2
- [ ] IPA diff shows matching phonemes in green
- [ ] IPA diff shows mismatched phonemes in red with ↑ marker
- [ ] Tips display for common confusions (e.g., nasal vowels)

### Phase 3
- [ ] User can record voice samples
- [ ] Voice clone is created successfully
- [ ] Personalized reference audio plays in user's voice
- [ ] IPA comparison works with personalized reference
