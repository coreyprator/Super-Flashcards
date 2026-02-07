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
    this.playbackAudio = null;  // Persistent audio element for playback
    
    // Configuration
    this.config = {
      containerSelector: config.containerSelector || '#recorder-container',
      flashcardId: config.flashcardId,
      userId: config.userId,
      targetText: config.targetText,
      languageCode: config.languageCode || 'fr',
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
    this.setupGlobalClickHandlers();
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
        <div class="recorder-bar">
          <button id="record-btn" class="btn btn-primary">
            <span class="icon">🎤</span> Start Recording
          </button>
          <span id="recording-time" class="time-display-inline">00:00</span>
          <button id="playback-btn" class="btn btn-secondary btn-playback" disabled>
            <span class="icon">▶️</span> My Voice
          </button>
          <button id="play-target-btn" class="btn btn-secondary btn-playback" title="Play reference pronunciation (P)">
            <span class="icon">🔊</span> Reference
          </button>
          <button id="stop-btn" class="btn btn-cancel" type="button" disabled title="Cancel recording (Esc)">
            <span class="icon">✕</span>
          </button>
        </div>

        <div class="keyboard-hints" id="keyboard-hints">
          Space: record/stop &nbsp; Esc: cancel &nbsp; R: my voice &nbsp; P: reference
        </div>

        <div class="recorder-status">
          <canvas id="waveform-canvas" class="waveform" width="600" height="60" style="display:none;"></canvas>
          <div id="recording-message" class="message"></div>
        </div>
        
        <div id="results-container" class="results-container" style="display:none;">
          <div class="results-header">
            <h4>Speech Recognition Results</h4>
            <button class="btn-close" id="close-results">✕</button>
          </div>
          
          <div class="overall-score">
            <div class="score-circle" id="score-circle">
              <span id="score-percentage">0%</span>
            </div>
            <div class="score-labels">
              <p id="score-message"></p>
              <p class="score-explainer">Recognition accuracy — how well your speech was understood</p>
            </div>
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
               <div class="label" style="margin-top: 10px;">Your pronunciation (IPA):</div>
               <p id="ipa-transcribed" class="ipa-text"></p>
             </div>
          
          <div class="feedback-section">
            <div class="label">Feedback:</div>
               <p id="feedback-text" class="feedback-text" style="white-space: pre-line;"></p>
          </div>

          <div id="personalized-audio-container" class="personalized-audio-container"></div>
          
        </div>
        
        <div id="progress-container" class="progress-container ${this.config.compactProgress ? 'compact-progress' : ''}">
          ${this.config.compactProgress ? '' : '<h4>Your Progress</h4>'}
          ${this.config.compactProgress ? '' : '<canvas id="progress-chart" class="progress-chart"></canvas>'}
          <div id="progress-stats" class="progress-stats"></div>
        </div>
      </div>
      
      <style>
        .pronunciation-recorder-panel {
          background: #f5f5f5;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 0;
        }

        .recorder-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 8px 14px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #4F46E5;
          color: white;
          font-weight: 600;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4338CA;
        }

        .btn-success {
          background: #16a34a;
          color: white;
          font-weight: 600;
        }

        .btn-success:hover:not(:disabled) {
          background: #15803d;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #5a6268;
        }

        .btn-playback {
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn-cancel {
          background: transparent;
          color: #9ca3af;
          padding: 6px 10px;
          font-size: 16px;
          border-radius: 50%;
          line-height: 1;
          margin-left: auto;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #fee2e2;
          color: #dc2626;
        }

        .btn-cancel:disabled {
          opacity: 0.3;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
        }

        .time-display-inline {
          font-family: monospace;
          font-size: 14px;
          color: #6b7280;
          min-width: 40px;
        }

        .time-display-inline.recording-active {
          color: #dc2626;
          font-weight: bold;
        }

        .recorder-status {
          margin-top: 8px;
        }

        .recorder-status:empty {
          display: none;
        }

        .keyboard-hints {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
          padding-left: 2px;
        }

        @media (pointer: coarse) {
          .keyboard-hints { display: none; }
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
        
        .score-labels {
          flex: 1;
        }

        .score-message {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }

        .score-explainer {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
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
          letter-spacing: 3px;
        }
        
        .ipa-phoneme {
          margin: 0 4px;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: bold;
          cursor: help;
        }
        
        .ipa-green {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .ipa-red {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
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

        /* Compact progress for Practice mode */
        .compact-progress {
          padding: 8px 16px;
          margin-top: 8px;
        }

        .compact-progress .progress-stats {
          display: block;
          margin-top: 0;
        }

        .compact-stats {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #555;
          flex-wrap: wrap;
        }

        .compact-stats strong {
          color: #333;
        }
        
        @media (max-width: 600px) {
          .pronunciation-recorder-panel {
            padding: 10px 12px;
          }

          .recorder-bar {
            gap: 6px;
          }

          .btn {
            padding: 6px 10px;
            font-size: 12px;
          }

          .btn-playback {
            padding: 5px 8px;
            font-size: 11px;
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
    const el = (sel) => this.container.querySelector(sel);
    this.recordButton = el('#record-btn');
    this.stopButton = el('#stop-btn');
    this.playbackButton = el('#playback-btn');
    this.playTargetButton = el('#play-target-btn');
    this.waveformCanvas = el('#waveform-canvas');
    this.resultsContainer = el('#results-container');
    this.recordingTimeDisplay = el('#recording-time');
    this.recordingMessage = el('#recording-message');
  }
  
  setupEventListeners() {
    // Diagnostic logging
    console.log('🔧 Setting up event listeners...');
    console.log('🔹 Record button:', this.recordButton);
    console.log('🔹 Stop button:', this.stopButton);
    console.log('🔹 Stop button disabled?', this.stopButton?.disabled);
    console.log('🔹 Stop button display:', window.getComputedStyle(this.stopButton || {}).display);
    console.log('🔹 Playback button:', this.playbackButton);
    
    // Record button toggles: start recording, or stop+submit if already recording
    this.recordButton?.addEventListener('click', () => {
      if (!this._isVisible()) return; // Guard: ignore clicks on hidden recorder
      if (this.isRecording) {
        console.log('🎤 Record button clicked while recording → stop+submit');
        this.stopRecording({ submit: true });
      } else {
        this.startRecording();
      }
    });

    // Stop/cancel button aborts the recording without submitting
    if (this.stopButton) {
      this.stopButton.addEventListener('click', (e) => {
        console.log('🚫 Cancel button clicked → aborting recording');
        e.preventDefault();
        e.stopPropagation();
        this.abortRecording();
      });
    }
    
    this.playbackButton?.addEventListener('click', () => this.playRecording());
    this.playTargetButton?.addEventListener('click', () => this.playTargetAudio());
    
    // Keyboard shortcuts - only on devices with a physical keyboard
    // Mobile virtual keyboards don't reliably fire keydown for Space/Enter (BUG-003)
    this._isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    this._keydownHandler = (e) => {
      if (this._isTouchDevice) return; // BUG-003: skip on mobile, buttons handle everything
      if (!this._isVisible()) return; // Don't handle keys when this recorder is hidden
      const isEditable = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable);
      if (isEditable) return;

      if (e.key === 'Escape' && this.isRecording) {
        e.preventDefault();
        e.stopPropagation();
        this.abortRecording();
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (this.isRecording) {
          this.stopRecording({ submit: true });
        } else if (this.recordButton && !this.recordButton.disabled) {
          this.startRecording();
        }
        return;
      }

      if ((e.key === 'r' || e.key === 'R') && this.recordedBlob && !this.isRecording) {
        e.preventDefault();
        this.playRecording();
        return;
      }

      if ((e.key === 'p' || e.key === 'P') && !this.isRecording) {
        e.preventDefault();
        this.playTargetAudio();
        return;
      }
    };
    document.addEventListener('keydown', this._keydownHandler, true);

    const closeResultsBtn = this.container.querySelector('#close-results');
    closeResultsBtn?.addEventListener('click', () => this.closeResults());
  }

  setupGlobalClickHandlers() {
    // No-op: global click interception no longer needed.
    // BUG-007 fix: CSS pointer-events on flipped card resolved click issues.
  }

  destroy() {
    // Clean up: stop recording, remove event listeners, clear timers
    if (this.isRecording && this.mediaRecorder) {
      this.mediaRecorder.onstop = null;
      try { this.mediaRecorder.stop(); } catch(e) {}
      this.mediaRecorder.stream?.getTracks().forEach(t => t.stop());
    }
    if (this.timeInterval) clearInterval(this.timeInterval);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.audioContext) {
      try { this.audioContext.close(); } catch(e) {}
    }
    // Remove the keydown listener
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler, true);
    }
    this.isRecording = false;
    this.mediaRecorder = null;
  }

  _getResultsInnerHTML() {
    return `
      <div class="results-header">
        <h4>Speech Recognition Results</h4>
        <button class="btn-close" id="close-results">✕</button>
      </div>
      <div class="overall-score">
        <div class="score-circle" id="score-circle">
          <span id="score-percentage">0%</span>
        </div>
        <div class="score-labels">
          <p id="score-message"></p>
          <p class="score-explainer">Recognition accuracy — how well your speech was understood</p>
        </div>
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
        <div class="label" style="margin-top: 10px;">Your pronunciation (IPA):</div>
        <p id="ipa-transcribed" class="ipa-text"></p>
      </div>
      <div class="feedback-section">
        <div class="label">Feedback:</div>
        <p id="feedback-text" class="feedback-text" style="white-space: pre-line;"></p>
      </div>
      <div id="personalized-audio-container" class="personalized-audio-container"></div>
    `;
  }

  _resetRecordButton() {
    if (this.recordButton) {
      this.recordButton.disabled = false;
      this.recordButton.innerHTML = this.recordedBlob
        ? '<span class="icon">🎤</span> Re-record'
        : '<span class="icon">🎤</span> Start Recording';
      this.recordButton.classList.remove('btn-success');
      this.recordButton.classList.add('btn-primary');
    }
  }

  _isVisible() {
    // Check if this recorder's container is in a visible (not hidden) mode
    return this.container && this.container.offsetParent !== null;
  }

  async startRecording() {
    if (!this._isVisible()) return; // Guard: don't act if hidden
    console.log('🎤 Starting recording...');
    window.pronunciationDebugger?.log('info', 'Starting recording');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      window.pronunciationDebugger?.log('info', 'Microphone access granted', {
        tracks: stream.getAudioTracks().map(t => ({ label: t.label, enabled: t.enabled }))
      });
      
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
      window.pronunciationDebugger?.log('info', 'MediaRecorder started');
      
      // Update UI — record button stays enabled as toggle (click again to stop+submit)
      this.recordButton.disabled = false;
      this.recordButton.innerHTML = '<span class="icon">⏹️</span> Stop & Submit';
      this.recordButton.classList.remove('btn-primary');
      this.recordButton.classList.add('btn-success');
      this.stopButton.disabled = false;
      this.playbackButton.disabled = true;
      this.waveformCanvas.style.display = 'block';
      this.recordingTimeDisplay.classList.add('recording-active');
      this.recordingMessage.textContent = '🔴 Recording...';
      
      // Start visualization
      this.visualize();
      
      // Update time display
      this.updateTimeDisplay();
      this.timeInterval = setInterval(() => this.updateTimeDisplay(), 100);
      
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      window.pronunciationDebugger?.log('error', 'Microphone access failed', { error: error.message });
      this.recordingMessage.textContent = '❌ Unable to access microphone. Check permissions.';
      alert('Unable to access your microphone. Please check permissions.');
    }
  }
  
  stopRecording({ submit = false } = {}) {
    console.log('⏹️ Stopping recording...');
    window.pronunciationDebugger?.log('info', 'Stopping recording', { submit });
    
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
      window.pronunciationDebugger?.log('info', 'MediaRecorder stopped', {
        chunks: this.audioChunks.length
      });
      if (this.audioChunks.length === 0) {
        console.error('❌ No audio chunks captured!');
        window.pronunciationDebugger?.log('warn', 'No audio chunks captured');
        this.recordingMessage.textContent = '❌ Recording failed - no audio captured';
        this._resetRecordButton();
        return;
      }

      this.recordedBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      console.log(`✅ Recording stopped. Size: ${this.recordedBlob.size} bytes, Chunks: ${this.audioChunks.length}`);
      window.pronunciationDebugger?.log('info', 'Recording blob created', {
        size: this.recordedBlob.size,
        chunks: this.audioChunks.length
      });

      if (this.recordedBlob.size === 0) {
        console.error('❌ Audio blob is empty!');
        window.pronunciationDebugger?.log('error', 'Audio blob empty');
        this.recordingMessage.textContent = '❌ Recording failed - no audio data';
        this._resetRecordButton();
        return;
      }
      
      // Update UI — restore record button to initial state
      this._resetRecordButton();
      this.stopButton.disabled = true;
      this.playbackButton.disabled = false;
      this.waveformCanvas.style.display = 'none';
      this.recordingTimeDisplay.classList.remove('recording-active');
      this.recordingMessage.textContent = submit ? '⏳ Submitting recording...' : '✅ Recording saved.';
      
      if (submit) {
        console.log('🔄 Auto-submitting via onstop handler');
        window.pronunciationDebugger?.log('info', 'Auto-submitting recording');
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
    
    this._resetRecordButton();
    this.stopButton.disabled = true;
    this.playbackButton.disabled = true;
    this.waveformCanvas.style.display = 'none';
    this.recordingTimeDisplay.classList.remove('recording-active');
    this.recordingMessage.textContent = '🛑 Recording cancelled.';
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
    if (!this.recordedBlob) {
      console.warn('⚠️ No recording to play back');
      return;
    }
    
    console.log('▶️ Playing recording...', `(${this.recordedBlob.size} bytes)`);
    
    // Stop any existing playback
    if (this.playbackAudio) {
      this.playbackAudio.pause();
      this.playbackAudio.currentTime = 0;
    }
    
    try {
      // Create or reuse audio element - MUST be in DOM to play properly
      if (!this.playbackAudio) {
        this.playbackAudio = new Audio();
        this.playbackAudio.style.display = 'none';
        document.body.appendChild(this.playbackAudio);
        console.log('🔧 Created persistent audio element, appended to body');
      }
      
      const audioUrl = URL.createObjectURL(this.recordedBlob);
      this.playbackAudio.volume = 1.0;
      this.playbackAudio.src = audioUrl;
      
      // Set up event listeners
      this.playbackAudio.onloadedmetadata = () => {
        console.log('📊 Audio metadata loaded:', {
          duration: this.playbackAudio.duration,
          readyState: this.playbackAudio.readyState,
          networkState: this.playbackAudio.networkState
        });
      };
      
      this.playbackAudio.onplay = () => {
        console.log('▶️ Audio.onplay fired - playback started');
      };
      
      this.playbackAudio.onended = () => {
        console.log('✅ Playback ended');
        try {
          URL.revokeObjectURL(audioUrl);
        } catch (e) {
          console.warn('⚠️ Could not revoke URL:', e);
        }
      };
      
      this.playbackAudio.onerror = (e) => {
        console.error('❌ Playback error:', {
          error: e,
          code: this.playbackAudio.error?.code,
          message: this.playbackAudio.error?.message,
          src: this.playbackAudio.src,
          readyState: this.playbackAudio.readyState
        });
      };
      
      console.log('🎵 Calling play() on audio element...');
      const playPromise = this.playbackAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('❌ play() promise rejected:', {
            name: err.name,
            message: err.message,
            code: err.code
          });
        });
      }
    } catch (err) {
      console.error('❌ Error creating/playing audio:', err);
    }
  }
  
  playTargetAudio() {
    // Play the target pronunciation (Google Translate TTS)
    if (!this.config.targetAudioUrl) {
      console.warn('⚠️ No target audio URL available');
      return;
    }
    
    console.log('🔊 Playing target audio...');
    const audio = new Audio(this.config.targetAudioUrl);
    audio.onerror = () => {
      console.error('❌ Error playing target audio:', audio.error?.message);
    };
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.error('❌ Target audio play() rejected:', err.message);
      });
    }
  }
  
  async submitRecording() {
    if (!this.recordedBlob) return;
    if (!this._isVisible()) return; // Don't submit from hidden recorder
    
    console.log('📤 Submitting recording...');
    window.pronunciationDebugger?.log('info', 'Submitting recording', {
      blobSize: this.recordedBlob.size,
      durationMs: this.recordingDuration
    });
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
      window.pronunciationDebugger?.log('info', 'API response received', {
        status: response.status,
        ok: response.ok
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Analysis complete:', result);
      window.pronunciationDebugger?.log('info', 'Analysis complete', {
        success: result.success,
        error: result.error,
        transcription: result.transcribed_text?.substring(0, 30)
      });
      
      await this.displayResults(result);
      this.recordingMessage.textContent = '✅ Analysis complete!';
      
      // Reload progress stats after successful submission
      await this.loadProgress();
      
    } catch (error) {
      console.error('❌ Error submitting recording:', error);
      window.pronunciationDebugger?.log('error', 'Submission failed', { error: error.message });
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

  async renderPersonalizedAudio(result) {
    const container = this.container.querySelector('#personalized-audio-container');
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    if (!window.voiceClone || typeof window.voiceClone.checkStatus !== 'function') {
      window.pronunciationDebugger?.log('warn', 'voiceClone not initialized');
      return;
    }

    try {
      const status = await window.voiceClone.checkStatus();
      window.pronunciationDebugger?.log('info', 'Voice clone status', status || {});
      const languageCode = this.config.languageCode || 'fr';

      if (status?.has_voice_clone) {
        const safeText = encodeURIComponent(result.target_text || '');
        container.innerHTML = `
          <div class="personalized-reference">
            <button class="personalized-audio-btn" data-action="play-personalized" data-text="${safeText}" data-lang="${languageCode}">
              🎙️ Hear Yourself Say It Correctly
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="clone-prompt-banner">
            <p>Want to hear <strong>yourself</strong> say it correctly?</p>
            <button class="btn btn-secondary" data-action="show-voice-clone">
              🎙️ Create Voice Profile
            </button>
          </div>
        `;
      }

      // Attach event listeners
      container.querySelectorAll('[data-action="play-personalized"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const text = decodeURIComponent(btn.getAttribute('data-text') || '');
          const lang = btn.getAttribute('data-lang') || languageCode;
          if (window.voiceClone?.playPersonalizedAudio) {
            await window.voiceClone.playPersonalizedAudio(text, lang);
          }
        });
      });

      container.querySelectorAll('[data-action="show-voice-clone"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.showVoiceCloneSetup) {
            window.showVoiceCloneSetup();
          }
        });
      });
    } catch (error) {
      window.pronunciationDebugger?.log('error', 'Voice clone status failed', { error: error.message });
      console.warn('Voice clone status unavailable:', error);
    }
  }
  
  async displayResults(result) {
    // Handle error states gracefully
    if (result.error === 'no_audio') {
      this.resultsContainer.innerHTML = `
        <div class="pronunciation-error-state">
          <div class="error-icon">🎤</div>
          <h3>No Audio Detected</h3>
          <p>We couldn't record any audio. Please check:</p>
          <ul>
            <li>Microphone permission is granted</li>
            <li>Your microphone is not muted</li>
            <li>Microphone is properly connected</li>
          </ul>
          <button class="btn btn-primary retry-btn">
            🔄 Try Again
          </button>
        </div>
      `;
      this.resultsContainer.querySelector('.retry-btn').addEventListener('click', () => this.reset());
      this.resultsContainer.style.display = 'block';
      this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (result.error === 'no_speech' || !result.transcribed_text || result.transcribed_text.trim() === '') {
      this.resultsContainer.innerHTML = `
        <div class="pronunciation-warning-state">
          <div class="warning-icon">🔇</div>
          <h3>No Speech Detected</h3>
          <p>We couldn't hear any words. Please try again:</p>
          <ul>
            <li>Speak louder and closer to the microphone</li>
            <li>Reduce background noise</li>
            <li>Make sure you're speaking during the recording</li>
          </ul>
          <button class="btn btn-primary retry-btn">
            🔄 Try Again
          </button>
        </div>
      `;
      this.resultsContainer.querySelector('.retry-btn').addEventListener('click', () => this.reset());
      this.resultsContainer.style.display = 'block';
      this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    // Normal results display
    // Restore results HTML if it was replaced by an error/warning state
    if (!this.container.querySelector('#score-circle')) {
      this.resultsContainer.innerHTML = this._getResultsInnerHTML();
      // Re-bind close button
      const closeBtn = this.resultsContainer.querySelector('#close-results');
      closeBtn?.addEventListener('click', () => this.closeResults());
    }

    // Set overall score
    const scorePercentage = Math.round(result.overall_score * 100);
    const scoreCircle = this.container.querySelector('#score-circle');
    const scorePercentageEl = this.container.querySelector('#score-percentage');
    const scoreMessageEl = this.container.querySelector('#score-message');
    
    scorePercentageEl.textContent = `${scorePercentage}%`;
    
    // Color code the score
    scoreCircle.className = 'score-circle';
    if (result.overall_score >= 0.85) {
      scoreCircle.classList.add('excellent');
      scoreMessageEl.textContent = 'Clearly understood!';
    } else if (result.overall_score >= 0.70) {
      scoreCircle.classList.add('good');
      scoreMessageEl.textContent = 'Mostly understood. Keep practicing.';
    } else if (result.overall_score >= 0.60) {
      scoreCircle.classList.add('acceptable');
      scoreMessageEl.textContent = 'Partially understood. Try again.';
    } else {
      scoreCircle.classList.add('needs-work');
      scoreMessageEl.textContent = 'Not recognized. Speak more clearly.';
    }
    
    // Set transcribed text
    this.container.querySelector('#transcribed-text').textContent = result.transcribed_text;

    // Display word scores
    const wordScoresList = this.container.querySelector('#word-scores-list');
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
    this.container.querySelector('#ipa-target').textContent = result.ipa_target || '';
    const ipaTranscribedEl = this.container.querySelector('#ipa-transcribed');
    
    if (ipaTranscribedEl && result.ipa_diff) {
      // Display color-coded phoneme alignment if available
      const alignment = result.ipa_diff.alignment || [];
      const html = alignment.map(item => {
        const color_class = `ipa-${item.color}`;
        
        if (item.match) {
          // Green: exact match
          return `<span class="ipa-phoneme ${color_class}">${item.target}</span>`;
        } else {
          // Red: mismatch - show comparison
          const target_text = item.target || '∅';
          const spoken_text = item.spoken || '∅';
          const comparison = `${target_text}→${spoken_text}`;
          const title_attr = item.tip ? ` title="${item.tip}"` : '';
          return `<span class="ipa-phoneme ${color_class}"${title_attr}>${comparison}</span>`;
        }
      }).join('');
      
      ipaTranscribedEl.innerHTML = html;
      
      // Log the match ratio
      console.log(`📊 IPA Match: ${result.ipa_diff.num_matches}/${result.ipa_diff.num_total} (${Math.round(result.ipa_diff.match_ratio * 100)}%)`);
    } else if (ipaTranscribedEl) {
      ipaTranscribedEl.textContent = result.ipa_transcribed || '';
    }
    
    // Set feedback
      this.container.querySelector('#feedback-text').textContent = result.feedback || 'Keep practicing!';

    // Personalized audio (voice clone)
    await this.renderPersonalizedAudio(result);
    
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
    const statsContainer = this.container.querySelector('#progress-stats');

    if (this.config.compactProgress) {
      // Compact single-row display for Practice mode
      statsContainer.innerHTML = `
        <div class="compact-stats">
          <span>Attempts: <strong>${progress.total_attempts}</strong></span>
          <span>Avg: <strong>${Math.round(progress.avg_confidence * 100)}%</strong></span>
          <span>Trend: <strong>${progress.improvement_trend}</strong></span>
        </div>
      `;
      return;
    }

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
  
  reset() {
    /**
     * Reset recorder to initial state for retry
     */
    console.log('🔄 Resetting recorder');
    this.audioChunks = [];
    this.recordedBlob = null;
    this.isRecording = false;
    
    // Reset buttons
    this._resetRecordButton();
    if (this.stopButton) {
      this.stopButton.disabled = true;
    }
    if (this.playbackButton) {
      this.playbackButton.disabled = true;
    }
    
    // Hide results
    if (this.resultsContainer) {
      this.resultsContainer.style.display = 'none';
    }
    
    // Reset time display
    const timeDisplay = this.container?.querySelector('#recording-time');
    if (timeDisplay) {
      timeDisplay.textContent = '00:00';
    }

    // Reset message
    const messageEl = this.container?.querySelector('#recording-message');
    if (messageEl) {
      messageEl.textContent = '';
    }
  }
}

/**
 * Pronunciation Debugger - Utility for capturing and exporting debug logs
 */
class PronunciationDebugger {
  constructor() {
    this.logs = [];
    this.sessionId = Math.random().toString(36).substr(2, 8);
    this.enabled = true;  // Set to false in production if needed
  }
  
  log(level, message, data = {}) {
    if (!this.enabled) return;
    
    const entry = {
      time: new Date().toISOString(),
      session: this.sessionId,
      level,
      message,
      data
    };
    
    this.logs.push(entry);
    
    // Log to console with appropriate level
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[Pronunciation ${this.sessionId}] ${message}`, data);
    
    // Keep last 100 entries
    if (this.logs.length > 100) this.logs.shift();
    
    // Store in sessionStorage for persistence across page reloads
    try {
      sessionStorage.setItem('pronunciation_debug', JSON.stringify(this.logs));
    } catch (e) {
      // Ignore storage errors
    }
  }
  
  exportLogs() {
    const logs = JSON.stringify(this.logs, null, 2);
    console.log('=== PRONUNCIATION DEBUG EXPORT ===\n' + logs);
    
    // Also copy to clipboard if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(logs).then(() => {
        console.log('✅ Logs copied to clipboard');
      }).catch(err => {
        console.warn('Could not copy to clipboard:', err);
      });
    }
    
    return logs;
  }
  
  clear() {
    this.logs = [];
    try {
      sessionStorage.removeItem('pronunciation_debug');
    } catch (e) {
      // Ignore
    }
    console.log('🗑️ Debug logs cleared');
  }
}

// Create global debug instance
window.pronunciationDebugger = new PronunciationDebugger();

// Export debug function for console use
window.exportPronunciationLogs = () => window.pronunciationDebugger.exportLogs();
window.clearPronunciationLogs = () => window.pronunciationDebugger.clear();

console.log('🐛 Pronunciation debugging enabled. Use window.exportPronunciationLogs() to export logs.');

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PronunciationRecorder;
}
