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
        this.requiredSamples = 1;  // Minimum samples (~30 sec total recommended)
    }

    /**
     * Check if user has a voice clone
     */
    async checkStatus() {
        try {
            const response = await fetch(`${this.apiBase}/status`);
            const data = await response.json();
            this.hasClone = !!data.has_voice_clone;
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
        let container = document.getElementById(containerId);
        if (!container) {
            // Fallback: create container if missing
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'voice-clone-setup-fallback';
            document.body.appendChild(container);
        }

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
        console.log('🎙️ Voice clone setup UI rendered');
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

        if (!btn || !status || !submitBtn) return;

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
        const submitBtn = document.getElementById('vc-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = this.samples.length < this.requiredSamples;
        }
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
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '⏳ Creating voice profile...';
        }

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
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '✨ Create Voice Profile';
            }
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
window.voiceClone = voiceClone;

// Expose helper to show setup UI
window.showVoiceCloneSetup = () => voiceClone.renderSetupPrompt('voice-clone-container');

// Check status on page load
document.addEventListener('DOMContentLoaded', () => {
    voiceClone.checkStatus();
});
