// frontend/pronunciation-recorder.js
/**
 * Pronunciation Practice Recorder Component
 * Handles recording, visualization, playback, and submission
 */

class PronunciationRecorder {
  constructor(config = {}) {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordedBlob = null;
    this.startTime = null;
    this.animationFrameId = null;
    
    // Configuration
    this.config = {
      containerSelector: config.containerSelector || '#recorder-container',
      flashcardId: config.flashcardId,
      userId: config.userId,
      targetText: config.targetText,
      apiBaseUrl: config.apiBaseUrl || 'http://localhost:8000/api/v1/pronunciation',
      ...config
    };
    
    // UI Elements
    this.container = null;
    this.recordButton = null;
    this.stopButton = null;
    this.playbackButton = null;
    this.playTargetButton = null;
    this.waveformCanvas = null;
    this.resultsContainer = null;
    this.progressChart = null;
    
    // Audio context for visualization
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    
    this.init();
  }
  
  init() {
    console.log('🎤 Initializing PronunciationRecorder');
    this.render();
    this.setupEventListeners();
    this.loadProgress();
  }
  
  render() {
    /**
     * Render the recorder UI
     */
    this.container = document.querySelector(this.config.containerSelector);
    if (!this.container) {
      console.error(`Container not found: ${this.config.containerSelector}`);
      return;
    }
    
    const html = `
      <div class="pronunciation-recorder-panel">
        <div class="recorder-header">
          <h3>🎤 Pronunciation Practice</h3>
          <div class="target-row">
            <p class="target-text">${this.config.targetText}</p>
            <button id="play-target-btn" class="btn btn-icon" title="Play target pronunciation">
              <span class="icon">🔊</span>
            </button>
          </div>
        </div>
        
        <div class="recorder-controls">
          <button id="record-btn" class="btn btn-primary btn-large">
            <span class="icon">🎤</span> Start Recording (Space/Enter)
          </button>
          <button id="playback-btn" class="btn btn-secondary" disabled>
            <span class="icon">▶️</span> Playback
          </button>
          <button id="stop-btn" class="btn btn-danger btn-small" disabled style="margin-left: auto;">
            <span class="icon">⏹️</span>
          </button>
        </div>
        
        <div class="recorder-status">
          <div id="recording-time" class="time-display">00:00</div>
          <canvas id="waveform-canvas" class="waveform" width="600" height="100" style="display:none;"></canvas>
          <div id="recording-message" class="message"></div>
        </div>
        
        <div id="results-container" class="results-container" style="display:none;">
          <div class="results-header">
            <h4>Results</h4>
            <button class="btn-close" id="close-results">✕</button>
          </div>
          
          <div class="overall-score">
            <div class="score-circle" id="score-circle">
              <span id="score-percentage">0%</span>
            </div>
            <p id="score-message"></p>
          </div>
          
          <div class="transcription-section">
            <div class="label">What you said:</div>
            <p id="transcribed-text" class="transcribed-text"></p>
          </div>
          
          <div class="word-scores-section">
            <div class="label">Word-by-word breakdown:</div>
            <div id="word-scores-list" class="word-scores-list"></div>
          </div>
          
          <div class="ipa-section">
            <div class="label">Target pronunciation (IPA):</div>
            <p id="ipa-target" class="ipa-text"></p>
          </div>
          
          <div class="feedback-section">
            <div class="label">Feedback:</div>
            <p id="feedback-text" class="feedback-text"></p>
          </div>
          
        </div>
        
        <div id="progress-container" class="progress-container">
          <h4>Your Progress</h4>
          <canvas id="progress-chart" class="progress-chart"></canvas>
          <div id="progress-stats" class="progress-stats"></div>
        </div>
      </div>
      
      <style>
        .pronunciation-recorder-panel {
          background: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .recorder-header {
          margin-bottom: 20px;
        }
        
        .recorder-header h3 {
          margin: 0 0 10px 0;
          font-size: 18px;
          color: #333;
        }
        
        .target-text {
          font-size: 24px;
          font-style: italic;
          color: #666;
          margin: 0;
          padding: 10px;
          background: white;
          border-radius: 4px;
        }
        
        .recorder-controls {
          display: flex;
          gap: 10px;
          margin: 20px 0;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .btn-danger {
          background: #dc3545;
          color: white;
        }
        
        .btn-danger:hover:not(:disabled) {
          background: #c82333;
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background: #5a6268;
        }
        
        .btn-success {
          background: #28a745;
          color: white;
        }
        
        .btn-success:hover:not(:disabled) {
          background: #218838;
        }
        
        .btn-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
        }
        
        .target-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .target-text {
          flex: 1;
          margin: 0;
        }
        
        .btn-icon {
          padding: 8px 12px;
          font-size: 20px;
          min-width: 44px;
        }
        
        .btn-large {
          flex: 1;
          font-size: 16px;
          min-height: 48px;
        }
        
        .btn-small {
          padding: 8px 16px;
          font-size: 14px;
        }
        
        .recorder-status {
          background: white;
          border-radius: 4px;
          padding: 15px;
          margin: 15px 0;
        }
        
        .time-display {
          font-size: 32px;
          font-family: monospace;
          text-align: center;
          color: #333;
          min-height: 40px;
        }
        
        .waveform {
          width: 100%;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
        }
        
        .message {
          text-align: center;
          margin-top: 10px;
          color: #666;
          font-size: 14px;
        }
        
        .results-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border: 2px solid #e0e0e0;
        }
        
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .results-header h4 {
          margin: 0;
          font-size: 18px;
        }
        
        .overall-score {
          display: flex;
          align-items: center;
          gap: 20px;
          margin: 20px 0;
        }
        
        .score-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          color: white;
        }
        
        .score-circle.excellent {
          background: #28a745;
        }
        
        .score-circle.good {
          background: #17a2b8;
        }
        
        .score-circle.acceptable {
          background: #ffc107;
          color: #333;
        }
        
        .score-circle.needs-work {
          background: #dc3545;
        }
        
        .score-message {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }
        
        .label {
          font-size: 12px;
          text-transform: uppercase;
          color: #666;
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 5px;
        }
        
        .transcribed-text {
          font-size: 18px;
          font-style: italic;
          color: #333;
          background: #f9f9f9;
          padding: 10px;
          border-left: 3px solid #007bff;
          margin: 10px 0;
        }
        
        .word-scores-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 10px 0;
        }
        
        .word-score-item {
          background: #f9f9f9;
          border-radius: 4px;
          padding: 10px;
          min-width: 120px;
        }
        
        .word {
          font-weight: bold;
          display: block;
          margin-bottom: 5px;
        }
        
        .confidence-bar {
          width: 100%;
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .confidence-fill {
          height: 100%;
          background: #28a745;
          transition: width 0.3s;
        }
        
        .confidence-fill.acceptable {
          background: #ffc107;
        }
        
        .confidence-fill.needs-work {
          background: #dc3545;
        }
        
        .confidence-text {
          font-size: 12px;
          color: #666;
          margin-top: 3px;
        }
        
        .ipa-text {
          font-size: 18px;
          font-family: monospace;
          background: #f0f0f0;
          padding: 10px;
          border-radius: 4px;
          color: #333;
        }
        
        .feedback-text {
          font-size: 16px;
          color: #555;
          padding: 10px;
          background: #e8f4f8;
          border-left: 3px solid #17a2b8;
          border-radius: 4px;
        }
        
        .progress-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .progress-container h4 {
          margin-top: 0;
        }
        
        .progress-chart {
          width: 100%;
          max-height: 300px;
          margin: 20px 0;
        }
        
        .progress-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        
        .stat-item {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          text-align: center;
        }
        
        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-top: 5px;
        }
        
        @media (max-width: 600px) {
          .pronunciation-recorder-panel {
            padding: 15px;
          }
          
          .recorder-controls {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
            justify-content: center;
          }
          
          .overall-score {
            flex-direction: column;
            text-align: center;
          }
          
          .word-scores-list {
            flex-direction: column;
          }
          
          .word-score-item {
            min-width: 100%;
          }
        }
      </style>
    `;
    
    this.container.innerHTML = html;
    this.cacheElements();
  }
  
  cacheElements() {
    this.recordButton = document.getElementById('record-btn');
    this.stopButton = document.getElementById('stop-btn');
    this.playbackButton = document.getElementById('playback-btn');
    this.playTargetButton = document.getElementById('play-target-btn');
    this.waveformCanvas = document.getElementById('waveform-canvas');
    this.resultsContainer = document.getElementById('results-container');
    this.recordingTimeDisplay = document.getElementById('recording-time');
    this.recordingMessage = document.getElementById('recording-message');
  }
  
  setupEventListeners() {
    this.recordButton?.addEventListener('click', () => this.startRecording());
    this.stopButton?.addEventListener('click', () => this.stopRecording({ submit: true }));
    this.playbackButton?.addEventListener('click', () => this.playRecording());
    this.playTargetButton?.addEventListener('click', () => this.playTargetAudio());
    
    // Keyboard shortcuts - Space/Enter: start or submit
    document.addEventListener('keydown', (e) => {
      const isEditable = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable);
      if (isEditable) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (this.isRecording) {
          this.stopRecording({ submit: true });
        } else if (this.recordButton && !this.recordButton.disabled) {
          this.startRecording();
        }
      }
    }, true);
    
    const closeResultsBtn = document.getElementById('close-results');
    closeResultsBtn?.addEventListener('click', () => this.closeResults());
  }
  
  async startRecording() {
    console.log('🎤 Starting recording...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context for visualization
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      source.connect(this.analyser);
      this.analyser.fftSize = 2048;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      // Create media recorder with proper encoding
      const options = { mimeType: 'audio/webm;codecs=opus' };
      this.mediaRecorder = new MediaRecorder(stream, options);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };
      
      this.mediaRecorder.start();
      this.isRecording = true;
      this.startTime = Date.now();
      
      // Update UI
      this.recordButton.disabled = true;
      this.stopButton.disabled = false;
      this.playbackButton.disabled = true;
      this.waveformCanvas.style.display = 'block';
      this.recordingMessage.textContent = '🔴 Recording... (Press Space/Enter to submit)';
      
      // Start visualization
      this.visualize();
      
      // Update time display
      this.updateTimeDisplay();
      this.timeInterval = setInterval(() => this.updateTimeDisplay(), 100);
      
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      this.recordingMessage.textContent = '❌ Unable to access microphone. Check permissions.';
      alert('Unable to access your microphone. Please check permissions.');
    }
  }
  
  stopRecording({ submit = false } = {}) {
    console.log('⏹️ Stopping recording...');
    
    if (!this.mediaRecorder) return;
    
    this.mediaRecorder.stop();
    this.isRecording = false;
    clearInterval(this.timeInterval);
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Stop all tracks
    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    
    // Wait for onstop to fire
    this.mediaRecorder.onstop = async () => {
      this.recordedBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      console.log(`✅ Recording stopped. Size: ${this.recordedBlob.size} bytes`);
      
      // Update UI
      this.recordButton.disabled = false;
      this.stopButton.disabled = true;
      this.playbackButton.disabled = false;
      this.waveformCanvas.style.display = 'none';
      this.recordingMessage.textContent = submit ? '⏳ Submitting recording...' : '✅ Recording saved.';
      
      if (submit) {
        await this.submitRecording();
      }
    };
  }

  abortRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;
    console.log('🛑 Aborting recording...');
    
    this.mediaRecorder.onstop = null;
    this.mediaRecorder.stop();
    this.isRecording = false;
    clearInterval(this.timeInterval);
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    this.audioChunks = [];
    this.recordedBlob = null;
    
    this.recordButton.disabled = false;
    this.stopButton.disabled = true;
    this.playbackButton.disabled = true;
    this.waveformCanvas.style.display = 'none';
    this.recordingMessage.textContent = '🛑 Recording aborted.';
    this.recordingTimeDisplay.textContent = '00:00';
  }
  
  visualize() {
    this.animationFrameId = requestAnimationFrame(() => this.visualize());
    
    const canvas = this.waveformCanvas;
    const canvasCtx = canvas.getContext('2d');
    const bufferLength = this.analyser.frequencyBinCount;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    canvasCtx.fillStyle = '#f5f5f5';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    canvasCtx.fillStyle = '#007bff';
    for (let i = 0; i < bufferLength; i++) {
      barHeight = (this.dataArray[i] / 255) * canvas.height;
      canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  
  updateTimeDisplay() {
    if (!this.startTime) return;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    this.recordingTimeDisplay.textContent = 
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  playRecording() {
    if (!this.recordedBlob) return;
    
    console.log('▶️ Playing recording...');
    const audioUrl = URL.createObjectURL(this.recordedBlob);
    const audio = new Audio();
    audio.src = audioUrl;
    audio.play();
  }
  
  playTargetAudio() {
    // Play the target pronunciation (Google Translate TTS)
    if (!this.config.targetAudioUrl) {
      console.warn('⚠️ No target audio URL available');
      return;
    }
    
    console.log('🔊 Playing target audio...');
    const audio = new Audio(this.config.targetAudioUrl);
    audio.play().catch(err => {
      console.error('❌ Error playing target audio:', err);
    });
  }
  
  async submitRecording() {
    if (!this.recordedBlob) return;
    
    console.log('📤 Submitting recording...');
    this.recordingMessage.textContent = '⏳ Analyzing pronunciation...';
    this.recordButton.disabled = true;
    this.stopButton.disabled = true;
    this.playbackButton.disabled = true;
    
    try {
      const formData = new FormData();
      formData.append('audio_file', this.recordedBlob, 'recording.webm');
      formData.append('flashcard_id', this.config.flashcardId);
      formData.append('user_id', this.config.userId);
      
      const response = await fetch(`${this.config.apiBaseUrl}/record`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Analysis complete:', result);
      
      this.displayResults(result);
      this.recordingMessage.textContent = '✅ Analysis complete!';
      
      // Reload progress stats after successful submission
      await this.loadProgress();
      
    } catch (error) {
      console.error('❌ Error submitting recording:', error);
      this.recordingMessage.textContent = `❌ Error: ${error.message}`;
    } finally {
      if (!this.isRecording) {
        this.recordButton.disabled = false;
        this.stopButton.disabled = true;
      }
      if (this.recordedBlob && !this.isRecording) {
        this.playbackButton.disabled = false;
      }
    }
  }
  
  displayResults(result) {
    // Set overall score
    const scorePercentage = Math.round(result.overall_score * 100);
    const scoreCircle = document.getElementById('score-circle');
    const scorePercentageEl = document.getElementById('score-percentage');
    const scoreMessageEl = document.getElementById('score-message');
    
    scorePercentageEl.textContent = `${scorePercentage}%`;
    
    // Color code the score
    scoreCircle.className = 'score-circle';
    if (result.overall_score >= 0.85) {
      scoreCircle.classList.add('excellent');
      scoreMessageEl.textContent = 'Excellent pronunciation!';
    } else if (result.overall_score >= 0.70) {
      scoreCircle.classList.add('good');
      scoreMessageEl.textContent = 'Good job! Keep practicing.';
    } else if (result.overall_score >= 0.60) {
      scoreCircle.classList.add('acceptable');
      scoreMessageEl.textContent = 'Acceptable. Room for improvement.';
    } else {
      scoreCircle.classList.add('needs-work');
      scoreMessageEl.textContent = 'Keep practicing. You\'ll improve!';
    }
    
    // Set transcribed text
    document.getElementById('transcribed-text').textContent = result.transcribed_text;
    
    // Display word scores
    const wordScoresList = document.getElementById('word-scores-list');
    wordScoresList.innerHTML = '';
    
    result.word_scores.forEach(score => {
      const item = document.createElement('div');
      item.className = 'word-score-item';
      item.innerHTML = `
        <span class="word">${score.word}</span>
        <div class="confidence-bar">
          <div class="confidence-fill ${score.status}" style="width: ${score.confidence * 100}%"></div>
        </div>
        <div class="confidence-text">${Math.round(score.confidence * 100)}% - ${score.status}</div>
      `;
      wordScoresList.appendChild(item);
    });
    
    // Set IPA
    document.getElementById('ipa-target').textContent = result.ipa_target || 'N/A';
    
    // Set feedback
    document.getElementById('feedback-text').textContent = result.feedback;
    
    // Show results container
    this.resultsContainer.style.display = 'block';
    
    // Sprint 8.5b: Render deep analysis button if attempt_id is available
    if (result.attempt_id && typeof deepAnalysis !== 'undefined') {
      setTimeout(() => {
        deepAnalysis.renderDeepAnalysisButton(result.attempt_id, true); // true = isPremiumUser (allow everyone for now)
      }, 100);
    }
    
    // Scroll to results
    this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
  }
  
  closeResults() {
    this.resultsContainer.style.display = 'none';
  }
  
  async loadProgress() {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/progress/${this.config.userId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.warn('Unable to load progress');
        return;
      }
      
      const progress = await response.json();
      this.displayProgress(progress);
      
    } catch (error) {
      console.warn('Error loading progress:', error);
    }
  }
  
  displayProgress(progress) {
    const statsContainer = document.getElementById('progress-stats');
    
    let html = `
      <div class="stat-item">
        <div class="stat-label">Total Attempts</div>
        <div class="stat-value">${progress.total_attempts}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Avg Score</div>
        <div class="stat-value">${Math.round(progress.avg_confidence * 100)}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Improvement</div>
        <div class="stat-value">${progress.improvement_trend}</div>
      </div>
    `;
    
    if (progress.problem_words && progress.problem_words.length > 0) {
      html += `
        <div class="stat-item">
          <div class="stat-label">Problem Words (Top 3)</div>
          <div class="stat-value" style="font-size: 14px; text-align: left;">
            ${progress.problem_words.slice(0, 3).map(w => 
              `<div>• ${w.word} (${Math.round(w.avg_confidence * 100)}%)</div>`
            ).join('')}
          </div>
        </div>
      `;
    }
    
    statsContainer.innerHTML = html;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PronunciationRecorder;
}
