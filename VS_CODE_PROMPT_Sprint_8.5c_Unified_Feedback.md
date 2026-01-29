# VS Code Prompt: Sprint 8.5c - Unified Pronunciation Feedback (STT + Gemini)

## Problem Statement

Current feedback after pronunciation practice is useless:
```
Focus on improving: 'pense' (55%). Try to pronounce these words more clearly.
```

This provides:
- ❌ No actionable advice
- ❌ No phonetic guidance (what's wrong with "pense"?)
- ❌ No comparison (target vs actual)
- ❌ No practice drills

Meanwhile, Gemini analysis exists but requires an extra button click. Users shouldn't have to click twice to get useful feedback.

---

## Solution: Single Round Trip

Merge STT + Gemini into ONE request/response cycle:

```
User records → Upload audio → STT analysis → Gemini analysis → Rich feedback
                    (all in one backend call, ~2-3 seconds total)
```

**Cost:** ~$0.01 per attempt (Gemini Flash). Corey confirmed: "Time is more valuable than money."

---

## Architecture Change

### Current Flow (Bad)
```
POST /pronunciation/submit
  → STT only
  → Returns generic feedback
  → User sees useless message
  → User clicks "Get AI Coaching" button
  → POST /deep-analysis/{id}
  → Returns Gemini analysis
  → User finally sees useful feedback
```

### New Flow (Good)
```
POST /pronunciation/submit
  → STT analysis (word confidence)
  → Gemini analysis (coaching feedback) [parallel or sequential]
  → Returns COMBINED results
  → User immediately sees rich feedback
```

---

## Backend Changes

### File: `backend/app/services/pronunciation_service.py`

Replace the `_generate_feedback()` method and modify the main submission flow:

```python
import asyncio
from app.services.gemini_service import GeminiPronunciationService

class PronunciationService:
    
    async def process_pronunciation_attempt(
        self,
        db: Session,
        audio_data: bytes,
        target_text: str,
        language_code: str,
        user_id: str,
        flashcard_id: str
    ) -> dict:
        """
        Process pronunciation attempt with STT + Gemini in single call.
        """
        # Step 1: Upload audio to GCS
        audio_url = await self._upload_audio(audio_data, user_id)
        
        # Step 2: Run STT analysis
        stt_result = await self._run_stt_analysis(audio_data, language_code)
        
        # Step 3: Generate IPA (existing logic)
        ipa_target = self._generate_ipa(target_text, language_code)
        ipa_transcribed = self._generate_ipa(stt_result['transcription'], language_code)
        
        # Step 4: Calculate word scores (existing logic)
        word_scores = self._calculate_word_scores(
            target_text, 
            stt_result['transcription'],
            stt_result.get('word_confidences', [])
        )
        
        # Step 5: Run Gemini analysis (THE NEW PART)
        gemini_service = GeminiPronunciationService(db)
        gemini_result = None
        
        if gemini_service.is_available():
            try:
                gemini_result = await asyncio.to_thread(
                    gemini_service.analyze_pronunciation,
                    audio_data=audio_data,
                    target_phrase=target_text,
                    language_code=language_code,
                    stt_word_scores=word_scores
                )
            except Exception as e:
                print(f"⚠️ Gemini analysis failed (non-blocking): {e}")
                # Continue without Gemini - STT results still valid
        
        # Step 6: Save to database
        attempt = self._save_attempt(
            db=db,
            user_id=user_id,
            flashcard_id=flashcard_id,
            audio_url=audio_url,
            target_text=target_text,
            transcribed_text=stt_result['transcription'],
            overall_confidence=stt_result['confidence'],
            word_scores=word_scores,
            ipa_target=ipa_target,
            ipa_transcribed=ipa_transcribed,
            gemini_result=gemini_result
        )
        
        # Step 7: Build rich response
        return self._build_response(
            attempt_id=attempt.id,
            target_text=target_text,
            transcribed_text=stt_result['transcription'],
            overall_confidence=stt_result['confidence'],
            word_scores=word_scores,
            ipa_target=ipa_target,
            ipa_transcribed=ipa_transcribed,
            gemini_result=gemini_result
        )
    
    def _build_response(
        self,
        attempt_id: int,
        target_text: str,
        transcribed_text: str,
        overall_confidence: float,
        word_scores: list,
        ipa_target: str,
        ipa_transcribed: str,
        gemini_result: dict
    ) -> dict:
        """
        Build unified response with STT + Gemini results.
        """
        response = {
            "attempt_id": attempt_id,
            "target_text": target_text,
            "transcribed_text": transcribed_text,
            "overall_confidence": overall_confidence,
            "word_scores": word_scores,
            "ipa": {
                "target": ipa_target,
                "transcribed": ipa_transcribed
            }
        }
        
        # Add Gemini coaching if available
        if gemini_result and gemini_result.get("success"):
            results = gemini_result.get("results", {})
            response["coaching"] = {
                "clarity_score": results.get("clarity_score"),
                "rhythm": results.get("rhythm"),
                "sound_issues": results.get("sound_issues", []),
                "top_drill": results.get("top_drill"),
                "encouragement": results.get("encouragement"),
                "cross_validation": results.get("cross_validation")
            }
            # Rich text feedback for display
            response["feedback"] = self._build_rich_feedback(results, word_scores)
        else:
            # Fallback to basic feedback if Gemini unavailable
            response["coaching"] = None
            response["feedback"] = self._build_basic_feedback(word_scores, transcribed_text, target_text)
        
        return response
    
    def _build_rich_feedback(self, gemini_results: dict, word_scores: list) -> str:
        """
        Build rich feedback text from Gemini analysis.
        """
        parts = []
        
        # Clarity score
        clarity = gemini_results.get("clarity_score")
        if clarity:
            if clarity >= 8:
                parts.append(f"🌟 Excellent clarity ({clarity}/10)!")
            elif clarity >= 6:
                parts.append(f"👍 Good clarity ({clarity}/10).")
            else:
                parts.append(f"📝 Clarity: {clarity}/10 - keep practicing!")
        
        # Top issue with specific guidance
        issues = gemini_results.get("sound_issues", [])
        if issues and len(issues) > 0:
            top_issue = issues[0]
            if top_issue.get("suggestion"):
                parts.append(f"💡 Tip: {top_issue['suggestion']}")
            if top_issue.get("example_comparison"):
                parts.append(f"   ({top_issue['example_comparison']})")
        
        # Practice drill
        drill = gemini_results.get("top_drill")
        if drill:
            parts.append(f"🎯 Practice: {drill}")
        
        # Encouragement
        encouragement = gemini_results.get("encouragement")
        if encouragement:
            parts.append(f"✨ {encouragement}")
        
        return "\n".join(parts) if parts else "Keep practicing!"
    
    def _build_basic_feedback(self, word_scores: list, transcribed: str, target: str) -> str:
        """
        Fallback feedback when Gemini is unavailable.
        Still better than current generic message.
        """
        if transcribed.lower().strip() == target.lower().strip():
            return "✅ Perfect! Your pronunciation matched exactly."
        
        problem_words = [w for w in word_scores if w.get('confidence', 1) < 0.7]
        
        if not problem_words:
            return f"👍 Good job! Transcribed as: '{transcribed}'"
        
        # At least show which words need work with their confidence
        word_list = ", ".join([f"'{w['word']}' ({int(w['confidence']*100)}%)" for w in problem_words[:3]])
        return f"📝 Words to focus on: {word_list}. Try listening to the target audio and repeat."
```

### File: `backend/app/services/pronunciation_service.py` - Save Method Update

Update the `_save_attempt` method to store Gemini results:

```python
def _save_attempt(
    self,
    db: Session,
    user_id: str,
    flashcard_id: str,
    audio_url: str,
    target_text: str,
    transcribed_text: str,
    overall_confidence: float,
    word_scores: list,
    ipa_target: str,
    ipa_transcribed: str,
    gemini_result: dict = None
) -> PronunciationAttempt:
    """Save attempt with all data including Gemini analysis."""
    
    attempt = PronunciationAttempt(
        user_id=user_id,
        flashcard_id=flashcard_id,
        audio_url=audio_url,
        target_text=target_text,
        transcribed_text=transcribed_text,
        overall_confidence=overall_confidence,
        word_scores=json.dumps(word_scores),
        ipa_target=ipa_target,
        ipa_transcribed=ipa_transcribed,
        analysis_type="stt_plus_gemini" if gemini_result else "stt_only"
    )
    
    # Add Gemini data if available
    if gemini_result and gemini_result.get("success"):
        results = gemini_result.get("results", {})
        attempt.gemini_analysis = json.dumps(results)
        attempt.gemini_clarity_score = results.get("clarity_score")
        attempt.gemini_rhythm_assessment = results.get("rhythm")
        attempt.gemini_top_issue = results.get("sound_issues", [{}])[0].get("example_comparison") if results.get("sound_issues") else None
        attempt.gemini_drill = results.get("top_drill")
        attempt.gemini_processed_at = datetime.utcnow()
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt
```

---

## Frontend Changes

### File: `frontend/pronunciation-recorder.js` (or equivalent)

Update the results display to show rich feedback:

```javascript
function displayPronunciationResults(response) {
    const resultsContainer = document.querySelector('.pronunciation-results');
    
    let html = `
        <div class="pronunciation-feedback">
            <!-- Transcription comparison -->
            <div class="transcription-section">
                <div class="target">
                    <strong>Target:</strong> ${response.target_text}
                    ${response.ipa?.target ? `<span class="ipa">[${response.ipa.target}]</span>` : ''}
                </div>
                <div class="transcribed">
                    <strong>You said:</strong> ${response.transcribed_text}
                    ${response.ipa?.transcribed ? `<span class="ipa">[${response.ipa.transcribed}]</span>` : ''}
                </div>
            </div>
            
            <!-- Word-level scores -->
            <div class="word-scores">
                ${response.word_scores.map(w => `
                    <span class="word-badge ${getScoreClass(w.confidence)}">
                        ${w.word} (${Math.round(w.confidence * 100)}%)
                    </span>
                `).join('')}
            </div>
    `;
    
    // Gemini coaching (if available)
    if (response.coaching) {
        const c = response.coaching;
        html += `
            <div class="coaching-section">
                <!-- Clarity & Rhythm -->
                <div class="score-row">
                    ${c.clarity_score ? `
                        <div class="clarity-score">
                            <span class="score-value">${c.clarity_score}</span>/10 Clarity
                        </div>
                    ` : ''}
                    ${c.rhythm ? `
                        <span class="rhythm-badge rhythm-${c.rhythm}">${getRhythmEmoji(c.rhythm)} ${c.rhythm}</span>
                    ` : ''}
                </div>
                
                <!-- Sound issues -->
                ${c.sound_issues && c.sound_issues.length > 0 ? `
                    <div class="issues">
                        <h4>🔊 Focus Areas</h4>
                        ${c.sound_issues.slice(0, 2).map(issue => `
                            <div class="issue-card">
                                <p class="issue-example">${issue.example_comparison || ''}</p>
                                <p class="issue-tip">💡 ${issue.suggestion || ''}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <!-- Drill -->
                ${c.top_drill ? `
                    <div class="drill-box">
                        <strong>🎯 Practice:</strong> ${c.top_drill}
                    </div>
                ` : ''}
                
                <!-- Encouragement -->
                ${c.encouragement ? `
                    <div class="encouragement">✨ ${c.encouragement}</div>
                ` : ''}
            </div>
        `;
    } else {
        // Fallback text feedback
        html += `
            <div class="feedback-text">
                ${response.feedback.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
        `;
    }
    
    html += `</div>`;
    
    resultsContainer.innerHTML = html;
}

function getScoreClass(confidence) {
    if (confidence >= 0.85) return 'score-excellent';
    if (confidence >= 0.7) return 'score-good';
    if (confidence >= 0.5) return 'score-fair';
    return 'score-needs-work';
}

function getRhythmEmoji(rhythm) {
    const emojis = {
        'smooth': '🌊', 'natural': '✨', 'choppy': '⚡',
        'staccato': '🥁', 'hesitant': '🐢'
    };
    return emojis[rhythm] || '🎵';
}
```

### File: `frontend/styles.css` - Additional Styles

```css
/* Pronunciation Results - Unified Feedback */

.pronunciation-feedback {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1rem;
}

.transcription-section {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e0e0e0;
}

.transcription-section .target,
.transcription-section .transcribed {
    margin: 0.5rem 0;
}

.transcription-section .ipa {
    color: #666;
    font-family: 'Lucida Sans Unicode', monospace;
    margin-left: 0.5rem;
}

.word-scores {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.word-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.9rem;
}

.score-excellent { background: #d4edda; color: #155724; }
.score-good { background: #cce5ff; color: #004085; }
.score-fair { background: #fff3cd; color: #856404; }
.score-needs-work { background: #f8d7da; color: #721c24; }

.coaching-section {
    margin-top: 1rem;
}

.score-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.clarity-score {
    font-size: 1.2rem;
}

.clarity-score .score-value {
    font-size: 2rem;
    font-weight: 700;
    color: #667eea;
}

.rhythm-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 500;
}

.rhythm-smooth, .rhythm-natural { background: #d4edda; color: #155724; }
.rhythm-choppy, .rhythm-staccato { background: #fff3cd; color: #856404; }
.rhythm-hesitant { background: #f8d7da; color: #721c24; }

.issues h4 {
    margin-bottom: 0.5rem;
}

.issue-card {
    background: white;
    border-left: 4px solid #667eea;
    padding: 0.75rem 1rem;
    margin-bottom: 0.75rem;
    border-radius: 0 8px 8px 0;
}

.issue-example {
    font-style: italic;
    color: #555;
    margin-bottom: 0.25rem;
}

.issue-tip {
    margin: 0;
}

.drill-box {
    background: #e7f1ff;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
}

.encouragement {
    text-align: center;
    font-size: 1.1rem;
    color: #28a745;
    margin-top: 1rem;
}

.feedback-text {
    line-height: 1.6;
}

.feedback-text p {
    margin: 0.5rem 0;
}
```

---

## Remove the "Get AI Coaching" Button

Since Gemini runs automatically, the button is no longer needed. Either:

1. **Remove it entirely** from `pronunciation-deep-analysis.js`
2. **Or keep it** as a "Re-analyze" option if user wants fresh analysis

Recommended: Remove it for cleaner UX. The button was a workaround for not having integrated feedback.

---

## Testing Checklist

After implementation:

- [ ] Record pronunciation → see rich feedback immediately (no button click)
- [ ] Feedback includes clarity score (X/10)
- [ ] Feedback includes rhythm assessment
- [ ] Feedback includes specific sound issues with suggestions
- [ ] Feedback includes practice drill
- [ ] Word-by-word confidence scores still display
- [ ] IPA shows for both target and transcribed
- [ ] Works for all 8 languages (fr, es, el, de, it, pt, ja, zh)
- [ ] Graceful fallback if Gemini fails (basic feedback still shows)
- [ ] Response time is acceptable (~2-3 seconds total)

---

## Expected User Experience

**Before (Bad):**
```
Your pronunciation: "je pense"
Focus on improving: 'pense' (55%). Try to pronounce these words more clearly.
[Get AI Coaching] button
```

**After (Good):**
```
Target: je pense [ʒə pɑ̃s]
You said: je pense [ʒə pɛns]

je (92%) ✅  pense (55%) ⚠️

━━━━━━━━━━━━━━━━━━━━━━━
7/10 Clarity    🌊 smooth

🔊 Focus Areas
"'pense' sounded like 'pens'"
💡 The nasal vowel 'an' [ɑ̃] should resonate in your nose. 
   Try humming while saying it.

🎯 Practice: Say "en, an, on" while pinching your nose - 
   you should feel vibration. Then try "pense, danse, France"

✨ Good flow overall! The 'je' was clear.
━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Files to Modify

| File | Action |
|------|--------|
| `backend/app/services/pronunciation_service.py` | MODIFY - Add Gemini call, update _build_response |
| `frontend/pronunciation-recorder.js` | MODIFY - Update displayPronunciationResults() |
| `frontend/styles.css` | ADD - New feedback styles |
| `frontend/pronunciation-deep-analysis.js` | OPTIONAL - Remove or repurpose button |

---

## Deployment

```powershell
gcloud builds submit --tag gcr.io/super-flashcards-475210/super-flashcards:latest --project=super-flashcards-475210
```

```powershell
gcloud run services update super-flashcards --region=us-central1 --project=super-flashcards-475210 --image=gcr.io/super-flashcards-475210/super-flashcards:latest
```
