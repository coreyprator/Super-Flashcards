# VS Code Prompt: Sprint 8.5b - Frontend Integration for Gemini Deep Analysis

## Context

Sprint 8.5 backend is complete and deployed. The following endpoints are live:

- `GET /api/v1/pronunciation/prompt-template/{language_code}` - Returns coaching prompts
- `POST /api/v1/pronunciation/deep-analysis/{attempt_id}` - Triggers Gemini analysis
- `POST /api/v1/pronunciation/feedback/{attempt_id}` - Logs user feedback

**Your task:** Integrate the frontend UI so users can trigger Gemini analysis after completing a pronunciation attempt.

---

## Current State

The pronunciation practice flow currently:
1. User sees flashcard with target phrase
2. User clicks "Record" and speaks
3. Audio uploads to Cloud Storage
4. Google Cloud STT returns word-level confidence scores
5. Results display showing which words were understood

**What's missing:** After step 5, there's no way for users to request deeper AI coaching feedback.

---

## Implementation Tasks

### 1. Create Deep Analysis JavaScript Component

Create `frontend/pronunciation-deep-analysis.js`:

```javascript
/**
 * Deep Analysis UI Component for Pronunciation Practice
 * Sprint 8.5b - Super Flashcards
 */

class DeepAnalysisUI {
    constructor() {
        this.currentAttemptId = null;
        this.apiBase = '/api/v1/pronunciation';
    }

    /**
     * Render the "Get Deep Analysis" button after STT results
     * Call this after pronunciation attempt completes
     */
    renderDeepAnalysisButton(attemptId, containerSelector = '.pronunciation-results') {
        this.currentAttemptId = attemptId;
        
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Deep analysis container not found:', containerSelector);
            return;
        }

        // Remove existing button if present
        const existing = document.getElementById(`deep-analysis-${attemptId}`);
        if (existing) existing.remove();

        const buttonHtml = `
            <div class="deep-analysis-section" id="deep-analysis-${attemptId}">
                <button 
                    class="btn btn-premium"
                    onclick="deepAnalysis.requestAnalysis('${attemptId}')"
                >
                    🎯 Get AI Coaching Feedback
                </button>
                <div class="analysis-results" id="results-${attemptId}" style="display: none;"></div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', buttonHtml);
    }

    /**
     * Request deep analysis from backend
     */
    async requestAnalysis(attemptId) {
        const button = document.querySelector(`#deep-analysis-${attemptId} button`);
        const resultsDiv = document.getElementById(`results-${attemptId}`);
        
        // Show loading state
        button.disabled = true;
        button.innerHTML = '⏳ Analyzing...';
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Our AI coach is listening to your pronunciation...</p>
        `;
        
        try {
            const response = await fetch(`${this.apiBase}/deep-analysis/${attemptId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || `Analysis failed: ${response.statusText}`);
            }
            
            this.renderResults(attemptId, data);
            
        } catch (error) {
            console.error('Deep analysis error:', error);
            resultsDiv.innerHTML = `
                <div class="error-message">
                    <p>❌ Analysis failed. Please try again.</p>
                    <small>${error.message}</small>
                </div>
            `;
            button.disabled = false;
            button.innerHTML = '🔄 Retry Analysis';
        }
    }

    /**
     * Render analysis results
     */
    renderResults(attemptId, data) {
        const resultsDiv = document.getElementById(`results-${attemptId}`);
        const gemini = data.gemini_results;
        
        if (!gemini) {
            resultsDiv.innerHTML = `
                <div class="error-message">
                    <p>⚠️ No coaching feedback available.</p>
                    <small>${data.error || 'Unknown error'}</small>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="coaching-results">
                <div class="score-section">
                    <div class="clarity-score">
                        <span class="score-value">${gemini.clarity_score || '?'}</span>
                        <span class="score-label">/10 Clarity</span>
                    </div>
                    <div class="rhythm-badge rhythm-${gemini.rhythm || 'unknown'}">
                        ${this.getRhythmEmoji(gemini.rhythm)} ${gemini.rhythm || 'Unknown'}
                    </div>
                </div>
        `;
        
        // Sound issues
        if (gemini.sound_issues && gemini.sound_issues.length > 0) {
            html += `<div class="issues-section"><h4>🔊 Areas to Focus On</h4>`;
            for (const issue of gemini.sound_issues) {
                const validationBadge = issue.cross_validated 
                    ? '<span class="badge validated">✓ Confirmed</span>' 
                    : (issue.confidence_warning 
                        ? '<span class="badge uncertain">? Verify</span>' 
                        : '');
                        
                html += `
                    <div class="issue-card">
                        <p class="issue-example">"${issue.example_comparison || ''}"</p>
                        <p class="issue-detail">
                            <strong>Target:</strong> ${issue.target_sound || 'N/A'}<br>
                            <strong>You said:</strong> ${issue.produced_sound || 'N/A'}
                        </p>
                        <p class="issue-tip">💡 ${issue.suggestion || 'Practice this sound'}</p>
                        ${validationBadge}
                    </div>
                `;
            }
            html += `</div>`;
        }
        
        // Recommended drill
        if (gemini.top_drill) {
            html += `
                <div class="drill-section">
                    <h4>🎯 Practice This</h4>
                    <p class="drill-text">${gemini.top_drill}</p>
                </div>
            `;
        }
        
        // Encouragement
        if (gemini.encouragement) {
            html += `
                <div class="encouragement">
                    <p>✨ ${gemini.encouragement}</p>
                </div>
            `;
        }
        
        // Cross-validation summary
        if (data.cross_validation) {
            const cv = data.cross_validation;
            if ((cv.confirmed_issues && cv.confirmed_issues.length > 0) || 
                (cv.suppressed_flags && cv.suppressed_flags.length > 0)) {
                html += `
                    <details class="validation-details">
                        <summary>🔬 Analysis Confidence</summary>
                        ${cv.confirmed_issues && cv.confirmed_issues.length > 0 
                            ? `<p class="confirmed">✓ Confirmed by both AI systems: ${cv.confirmed_issues.join(', ')}</p>` 
                            : ''}
                        ${cv.suppressed_flags && cv.suppressed_flags.length > 0 
                            ? `<p class="suppressed">⚠️ May be false positives: ${cv.suppressed_flags.join('; ')}</p>` 
                            : ''}
                    </details>
                `;
            }
        }
        
        // Feedback buttons
        html += `
            <div class="feedback-section">
                <p>Was this helpful?</p>
                <button onclick="deepAnalysis.submitFeedback('${attemptId}', 5)" class="btn-feedback">👍 Yes</button>
                <button onclick="deepAnalysis.submitFeedback('${attemptId}', 2)" class="btn-feedback">👎 Not really</button>
            </div>
        `;
        
        html += `</div>`;
        resultsDiv.innerHTML = html;
    }

    /**
     * Get emoji for rhythm type
     */
    getRhythmEmoji(rhythm) {
        const emojis = {
            'smooth': '🌊',
            'natural': '✨',
            'choppy': '⚡',
            'staccato': '🥁',
            'hesitant': '🐢'
        };
        return emojis[rhythm] || '🎵';
    }

    /**
     * Submit feedback on analysis quality
     */
    async submitFeedback(attemptId, rating) {
        try {
            await fetch(`${this.apiBase}/feedback/${attemptId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gemini_accuracy_rating: rating,
                    stt_accuracy_rating: rating,
                    comments: null
                })
            });
            
            // Update UI
            const feedbackSection = document.querySelector(`#results-${attemptId} .feedback-section`);
            if (feedbackSection) {
                feedbackSection.innerHTML = '<p class="thanks">Thanks for your feedback! 🙏</p>';
            }
            
        } catch (error) {
            console.error('Feedback submission failed:', error);
        }
    }
}

// Initialize global instance
const deepAnalysis = new DeepAnalysisUI();
```

### 2. Add CSS Styles

Add to existing stylesheet (e.g., `frontend/styles.css` or `frontend/app.css`):

```css
/* ===== Deep Analysis Styles - Sprint 8.5b ===== */

.deep-analysis-section {
    margin-top: 1.5rem;
    padding: 1rem;
    border-top: 1px solid #e0e0e0;
}

.btn-premium {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.btn-premium:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-premium:disabled {
    opacity: 0.7;
    cursor: wait;
}

.coaching-results {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1rem;
}

.score-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.clarity-score {
    text-align: center;
}

.score-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #667eea;
}

.score-label {
    display: block;
    font-size: 0.85rem;
    color: #666;
}

.rhythm-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 500;
}

.rhythm-smooth, .rhythm-natural { background: #d4edda; color: #155724; }
.rhythm-choppy, .rhythm-staccato { background: #fff3cd; color: #856404; }
.rhythm-hesitant { background: #f8d7da; color: #721c24; }

.issues-section h4,
.drill-section h4 {
    margin-bottom: 0.75rem;
    color: #333;
}

.issue-card {
    background: white;
    border-left: 4px solid #667eea;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 0 8px 8px 0;
}

.issue-example {
    font-style: italic;
    color: #555;
    margin-bottom: 0.5rem;
}

.issue-tip {
    background: #e7f1ff;
    padding: 0.5rem;
    border-radius: 4px;
    margin-top: 0.5rem;
}

.badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    margin-left: 0.5rem;
}

.badge.validated { background: #d4edda; color: #155724; }
.badge.uncertain { background: #fff3cd; color: #856404; }

.drill-section {
    background: #e7f1ff;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
}

.drill-text {
    font-weight: 500;
    color: #333;
}

.encouragement {
    text-align: center;
    font-size: 1.1rem;
    color: #28a745;
    margin-top: 1rem;
}

.validation-details {
    margin-top: 1rem;
    font-size: 0.85rem;
    color: #666;
}

.validation-details summary {
    cursor: pointer;
    font-weight: 500;
}

.feedback-section {
    margin-top: 1.5rem;
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
}

.btn-feedback {
    background: white;
    border: 1px solid #ddd;
    padding: 0.5rem 1rem;
    margin: 0 0.5rem;
    border-radius: 20px;
    cursor: pointer;
}

.btn-feedback:hover {
    background: #f0f0f0;
}

.thanks {
    color: #28a745;
    font-weight: 500;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
}

.error-message small {
    display: block;
    margin-top: 0.5rem;
    opacity: 0.8;
}
```

### 3. Include Script in HTML

Add to `frontend/index.html` (or wherever scripts are loaded):

```html
<script src="/pronunciation-deep-analysis.js"></script>
```

### 4. Integrate with Existing Pronunciation Flow

Find where the STT results are displayed after a pronunciation attempt (likely in `pronunciation-recorder.js` or similar). After the STT results render, add:

```javascript
// After displaying STT results, show the deep analysis button
// attemptId should come from the backend response when creating the pronunciation attempt
if (response.attempt_id) {
    deepAnalysis.renderDeepAnalysisButton(response.attempt_id, '.pronunciation-results');
}
```

**Key integration point:** The pronunciation attempt must return an `attempt_id` from the backend that gets passed to `renderDeepAnalysisButton()`.

---

## Testing

After implementation:

1. **Manual test flow:**
   - Go to a flashcard with audio
   - Click to practice pronunciation
   - Record yourself speaking
   - See STT results
   - Click "🎯 Get AI Coaching Feedback"
   - Verify results display with clarity score, issues, drill

2. **Test error handling:**
   - Use invalid attempt_id → should show error message
   - Test with slow network → loading spinner should appear

3. **Test feedback:**
   - Click 👍 or 👎 → should show "Thanks for your feedback!"

---

## Files to Modify

| File | Action |
|------|--------|
| `frontend/pronunciation-deep-analysis.js` | CREATE - new file |
| `frontend/styles.css` (or equivalent) | ADD - CSS styles |
| `frontend/index.html` | ADD - script include |
| `frontend/pronunciation-recorder.js` | MODIFY - call `deepAnalysis.renderDeepAnalysisButton()` |

---

## Expected Result

After a user completes a pronunciation attempt:

1. They see their STT word-confidence scores (existing)
2. Below that, a purple gradient button: "🎯 Get AI Coaching Feedback"
3. Clicking it shows loading spinner
4. Results appear with:
   - Clarity score (X/10)
   - Rhythm badge (smooth/choppy/etc)
   - Sound issues with coaching tips
   - Practice drill recommendation
   - Encouragement message
5. Feedback buttons to rate the analysis
