/**
 * Deep Analysis UI Component for Pronunciation Practice
 * Sprint 8.5 - Super Flashcards
 */

class DeepAnalysisUI {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentAttemptId = null;
    }

    /**
     * Render the "Get Deep Analysis" button after STT results
     */
    renderDeepAnalysisButton(attemptId, isPremiumUser = false) {
        this.currentAttemptId = attemptId;
        
        const buttonHtml = `
            <div class="deep-analysis-section" id="deep-analysis-${attemptId}">
                <button 
                    class="btn btn-premium ${isPremiumUser ? '' : 'btn-locked'}"
                    onclick="deepAnalysis.requestAnalysis('${attemptId}')"
                    ${isPremiumUser ? '' : 'disabled'}
                >
                    ${isPremiumUser 
                        ? '🎯 Get AI Coaching Feedback' 
                        : '🔒 AI Coaching (Premium)'}
                </button>
                ${!isPremiumUser ? '<p class="premium-hint">Upgrade to get detailed pronunciation coaching</p>' : ''}
                <div class="analysis-results" id="results-${attemptId}" style="display: none;"></div>
            </div>
        `;
        
        // Append after STT results
        const sttResults = document.querySelector('.stt-results');
        if (sttResults) {
            sttResults.insertAdjacentHTML('afterend', buttonHtml);
        }
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
        resultsDiv.innerHTML = '<div class="loading-spinner"></div><p>Our AI coach is listening to your pronunciation...</p>';
        
        try {
            const response = await fetch(`/api/v1/pronunciation/deep-analysis/${attemptId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.statusText}`);
            }
            
            const data = await response.json();
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
            resultsDiv.innerHTML = '<p class="error">No coaching feedback available.</p>';
            return;
        }
        
        // Build results HTML
        let html = `
            <div class="coaching-results">
                <div class="score-section">
                    <div class="clarity-score">
                        <span class="score-value">${gemini.clarity_score}</span>
                        <span class="score-label">/10 Clarity</span>
                    </div>
                    <div class="rhythm-badge rhythm-${gemini.rhythm}">
                        ${this.getRhythmEmoji(gemini.rhythm)} ${gemini.rhythm}
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
                        <p class="issue-example">"${issue.example_comparison}"</p>
                        <p class="issue-detail">
                            <strong>Target:</strong> ${issue.target_sound}<br>
                            <strong>You said:</strong> ${issue.produced_sound}
                        </p>
                        <p class="issue-tip">💡 ${issue.suggestion}</p>
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
        
        // Cross-validation summary (for debugging/transparency)
        if (data.cross_validation) {
            const cv = data.cross_validation;
            if (cv.confirmed_issues && cv.confirmed_issues.length > 0 || cv.suppressed_flags && cv.suppressed_flags.length > 0) {
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
            await fetch(`/api/v1/pronunciation/feedback/${attemptId}`, {
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
const deepAnalysis = new DeepAnalysisUI('pronunciation-container');
