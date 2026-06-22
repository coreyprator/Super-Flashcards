// frontend/audio-player.js
// Audio player functionality for Super-Flashcards Sprint 4
// Handles audio generation, playback, and UI updates

/**
 * Get the backend base URL for API calls
 */
function getBackendBase() {
    const origin = window.location.origin;
    
    if (origin.includes('localhost')) {
        return 'http://localhost:8000';
    } else if (origin.includes(':3000')) {
        return origin.replace(':3000', ':8000');
    } else {
        return '';
    }
}

console.log('🎵 === AUDIO PLAYER v2.2 with IPA SUPPORT LOADED ===');
console.log('🎵 Added IPA pronunciation functionality');
console.log('🎵 Time:', new Date().toISOString());

/**
 * Get HTML for audio button based on card state
 * @param {Object} card - Flashcard object with id, word, audio_url, etc.
 * @returns {string} HTML string for audio button
 */
function getAudioButtonHTML(card) {
    console.log('🔧 Audio button check for card:', card.id);
    console.log('🔧 Card audio_url:', card.audio_url);
    console.log('🔧 Card audio_generated_at:', card.audio_generated_at);
    
    const hasAudio = card.audio_url && card.audio_url.trim() !== '';
    const buttonId = `audio-btn-${card.id}`;
    const audioId = `audio-${card.id}`;
    
    console.log('🔧 hasAudio result:', hasAudio);
    
    if (hasAudio) {
        // Show play button if audio exists (Google TTS batch processing complete)
        return `
            <div class="audio-controls flex items-center gap-2">
                <button id="${buttonId}" class="audio-btn play-btn" onclick="playAudio('${card.id}', '${card.audio_url}'); event.stopPropagation();">
                    ▶️ Play
                </button>
                <audio id="${audioId}" preload="none">
                    <source src="${typeof fixAssetUrl !== 'undefined' ? fixAssetUrl(card.audio_url) : card.audio_url}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
    } else {
        // Show generate button if no audio exists
        return `
            <div class="audio-controls">
                <button id="${buttonId}" class="audio-btn generate-btn" onclick="generateAudio('${card.id}', '${card.word_or_phrase}'); event.stopPropagation();">
                    🔊 Generate Audio
                </button>
                <div id="audio-status-${card.id}" class="audio-status" style="display: none;">
                    <small>Generating audio...</small>
                </div>
            </div>
        `;
    }
}

/**
 * Generate audio for a flashcard
 * @param {string} cardId - Flashcard ID
 * @param {string} word - Word/phrase to generate audio for
 */
async function generateAudio(cardId, word) {
    console.log('🔧 === GENERATE AUDIO DEBUG START ===');
    console.log('🔧 Function called with:', { cardId, word });
    console.log('🔧 Current time:', new Date().toISOString());
    
    const button = document.getElementById(`audio-btn-${cardId}`);
    const statusDiv = document.getElementById(`audio-status-${cardId}`);
    
    console.log('🔧 Button found:', !!button);
    console.log('🔧 Button current text:', button ? button.innerHTML : 'N/A');
    console.log('🔧 Status div found:', !!statusDiv);
    
    // Check if button exists - if not, we're being called during card creation
    const isCardCreation = !button;
    if (isCardCreation) {
        console.log('💡 No button found - running in card creation mode (direct API call)');
    }
    
    try {
        // Update UI to show generating state (only if button exists)
        if (button) {
            console.log('🔧 Updating UI to show generating state...');
            button.disabled = true;
            button.innerHTML = '🔄 Generating...';
        }
        if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.innerHTML = '<small>Generating audio...</small>';
        }
        
        // Make API call to generate audio
        // LEGWRITE1: route through apiRequest for bwtl write-auth (token attach, refresh, re-auth prompt)
        const url = `/api/audio/generate/${cardId}`;
        console.log('🔧 Making request to URL:', url);
        console.log('🔧 Request method: POST');
        
        const requestStartTime = Date.now();
        const result = await apiRequest(`/audio/generate/${cardId}`, { method: 'POST' });
        const requestDuration = Date.now() - requestStartTime;
        
        console.log('🔧 Response received after', requestDuration, 'ms');
        
        if (result.success) {
            // Audio generated successfully
            const audioUrl = result.audio_url;
            
            console.log('✅ Audio generated successfully:', audioUrl);
            
            // Update the flashcard data in state if available
            if (typeof state !== 'undefined' && state.flashcards && state.currentCardIndex !== undefined) {
                const currentCard = state.flashcards[state.currentCardIndex];
                if (currentCard && currentCard.id === cardId) {
                    // Update the current card's audio URL in state
                    currentCard.audio_url = audioUrl;
                    currentCard.audio_generated_at = new Date().toISOString();
                    
                    console.log('🔄 Refreshing card display with new audio...');
                    // Re-render the current flashcard to show updated audio controls
                    if (typeof renderFlashcard === 'function') {
                        renderFlashcard(currentCard);
                    }
                    return; // Exit early since we've refreshed the entire card
                }
            }
            
            // If button exists, update it (manual regeneration case)
            if (button) {
                console.log('🔄 Updating button manually (button exists)...');
                // Update button to play button
                button.innerHTML = '▶️ Play';
                button.onclick = () => playAudio(cardId, audioUrl);
                button.disabled = false;
                button.className = 'audio-btn play-btn';
                
                // Add audio element
                const audioElement = document.createElement('audio');
                audioElement.id = `audio-${cardId}`;
                audioElement.preload = 'none';
                audioElement.innerHTML = `<source src="${audioUrl}" type="audio/mpeg">`;
                button.parentElement.appendChild(audioElement);
            } else {
                // Card creation mode - audio generated but card not rendered yet
                console.log('💡 Audio generated during card creation - will display when card renders');
            }
            
            if (statusDiv) {
                statusDiv.innerHTML = '<small style="color: green;">✅ Audio ready!</small>';
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 2000);
            }
            
        } else {
            throw new Error(result.message || 'Failed to generate audio');
        }
        
    } catch (error) {
        console.error('❌ === ERROR IN GENERATE AUDIO ===');
        console.error('❌ Error object:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error name:', error.name);
        
        // Reset button state (only if button exists)
        if (button) {
            console.log('🔧 Resetting button state after error...');
            button.disabled = false;
            button.innerHTML = '🔊 Generate Audio';
        }
        
        if (statusDiv) {
            statusDiv.innerHTML = `<small style="color: red;">❌ Error: ${error.message}</small>`;
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
        
        console.log('🔧 === GENERATE AUDIO DEBUG END (ERROR) ===');
    }
    
    console.log('🔧 === GENERATE AUDIO DEBUG END (SUCCESS) ===');
}

/**
 * Get HTML for IPA pronunciation display and controls
 * @param {Object} card - Flashcard object with IPA data
 * @returns {string} HTML string for IPA section
 */
function getIPAHTML(card) {
    const hasIPA = card.ipa_pronunciation && card.ipa_pronunciation.trim() !== '';
    const hasIPAAudio = card.ipa_audio_url && card.ipa_audio_url.trim() !== '';
    
    // IPA functionality completely hidden as requested
    return '';
}

/**
 * Generate IPA pronunciation for a flashcard
 * @param {string} cardId - Flashcard ID
 */
async function generateIPA(cardId) {
    console.log('🔤 Generating IPA for card:', cardId);
    
    try {
        // LEGWRITE1: route through apiRequest for bwtl write-auth
        const result = await apiRequest(`/ipa/generate-ipa/${cardId}`, { method: 'POST' });
        
        if (result.success) {
            console.log('✅ IPA generated:', result.ipa_pronunciation);
            
            // Update the flashcard data in the state if available
            if (typeof state !== 'undefined' && state.flashcards) {
                // Find and update the flashcard in the state
                const cardIndex = state.flashcards.findIndex(card => card.id === cardId);
                if (cardIndex !== -1) {
                    state.flashcards[cardIndex].ipa_pronunciation = result.ipa_pronunciation;
                    state.flashcards[cardIndex].ipa_generated_at = new Date().toISOString();
                }
                
                // Refresh the current card display if in study mode
                if (typeof renderFlashcard === 'function' && state.currentCardIndex !== -1) {
                    renderFlashcard(state.flashcards[state.currentCardIndex]);
                }
                
                // Refresh the browse list if available  
                if (typeof renderFlashcardList === 'function') {
                    renderFlashcardList();
                }
            }
        } else {
            console.error('❌ IPA generation failed:', result.error);
            alert(`Failed to generate IPA: ${result.error || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.error('❌ Error generating IPA:', error);
        alert('Failed to generate IPA pronunciation');
    }
}

/**
 * Generate IPA audio for a flashcard
 * @param {string} cardId - Flashcard ID
 */
async function generateIPAAudio(cardId) {
    console.log('🔊 Generating IPA audio for card:', cardId);
    
    try {
        // LEGWRITE1: route through apiRequest for bwtl write-auth
        const result = await apiRequest(`/ipa/generate-ipa-audio/${cardId}`, { method: 'POST' });
        
        if (result.success) {
            console.log('✅ IPA audio generated:', result.ipa_audio_url);
            
            // Create audio element for IPA playback if it doesn't exist
            let audioElement = document.getElementById(`ipa-audio-${cardId}`);
            if (!audioElement) {
                audioElement = document.createElement('audio');
                audioElement.id = `ipa-audio-${cardId}`;
                audioElement.preload = 'none';
                audioElement.innerHTML = `<source src="${result.ipa_audio_url}" type="audio/mpeg">`;
                
                // Find a good place to append the audio element
                const ipaSection = document.querySelector('.ipa-section');
                if (ipaSection) {
                    ipaSection.appendChild(audioElement);
                } else {
                    document.body.appendChild(audioElement);
                }
                console.log('🔧 Created IPA audio element:', audioElement.id);
            } else {
                // Update existing audio element source
                audioElement.innerHTML = `<source src="${result.ipa_audio_url}" type="audio/mpeg">`;
                audioElement.load();
                console.log('🔧 Updated existing IPA audio element:', audioElement.id);
            }
            
            // Update the flashcard data in the state if available
            if (typeof state !== 'undefined' && state.flashcards) {
                // Find and update the flashcard in the state
                const cardIndex = state.flashcards.findIndex(card => card.id === cardId);
                if (cardIndex !== -1) {
                    state.flashcards[cardIndex].ipa_audio_url = result.ipa_audio_url;
                    state.flashcards[cardIndex].ipa_generated_at = new Date().toISOString();
                }
                
                // Refresh the current card display if in study mode
                if (typeof renderFlashcard === 'function' && state.currentCardIndex !== -1) {
                    renderFlashcard(state.flashcards[state.currentCardIndex]);
                }
                
                // Refresh the browse list if available  
                if (typeof renderFlashcardList === 'function') {
                    renderFlashcardList();
                }
            }
        } else {
            console.error('❌ IPA audio generation failed:', result.error);
            alert(`Failed to generate IPA audio: ${result.error || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.error('❌ Error generating IPA audio:', error);
        alert('Failed to generate IPA audio');
    }
}

/**
 * Play IPA audio for a flashcard
 * @param {string} cardId - Flashcard ID
 * @param {string} audioUrl - IPA audio file URL
 */
function playIPAAudio(cardId, audioUrl) {
    console.log('🎵 === IPA AUDIO PLAYBACK DEBUG START ===');
    console.log('🔊 Playing IPA audio for card:', cardId, 'URL:', audioUrl);
    console.log('🔧 Looking for audio element with ID:', `ipa-audio-${cardId}`);
    
    const audioElement = document.getElementById(`ipa-audio-${cardId}`);
    console.log('🔧 Audio element found:', !!audioElement);
    if (audioElement) {
        console.log('🔧 Audio element src:', audioElement.src);
        console.log('🔧 Audio element ready state:', audioElement.readyState);
        console.log('🔧 Audio element sources:', audioElement.innerHTML);
    }
    
    if (!audioElement) {
        console.error('❌ IPA audio element not found for card:', cardId);
        console.error('❌ All audio elements in DOM:', document.querySelectorAll('audio'));
        alert('IPA audio element not found');
        return;
    }
    
    try {
        // Check if audio is already loaded to avoid delays
        if (audioElement.readyState >= 2) {
            // Audio is loaded, play immediately
            audioElement.play().catch(error => {
                console.error('❌ Error playing loaded IPA audio:', error);
                alert('Failed to play IPA audio');
            });
        } else {
            // Audio not loaded, load and play
            audioElement.load();
            audioElement.play().catch(error => {
                console.error('❌ Error playing IPA audio:', error);
                alert('Failed to play IPA audio');
            });
        }
    } catch (error) {
        console.error('❌ Exception playing IPA audio:', error);
        alert('Failed to play IPA audio');
    }
}

/**
 * Play audio for a flashcard with caching support
 * @param {string} cardId - Flashcard ID
 * @param {string} audioUrl - URL to audio file
 */
async function playAudio(cardId, audioUrl) {
    console.log('🔊 Playing audio for card:', cardId, 'URL:', audioUrl);
    
    const button = document.getElementById(`audio-btn-${cardId}`);
    
    try {
        // Update button state
        if (button) {
            button.innerHTML = '▶️ Playing...';
            button.disabled = true;
        }
        
        // Use cached audio player if available (Sprint 5 Phase 2)
        if (typeof audioPlayer !== 'undefined' && audioPlayer.playAudio) {
            await audioPlayer.playAudio(audioUrl, cardId);
            
            // Reset button after playback
            if (button) {
                button.innerHTML = '▶️ Play';
                button.disabled = false;
            }
        } else {
            // Fallback to legacy audio element method
            const audioElement = document.getElementById(`audio-${cardId}`);
            if (!audioElement) {
                console.error(`Audio element not found for card ${cardId}`);
                if (button) {
                    button.innerHTML = '❌ Error';
                    button.disabled = false;
                }
                return;
            }
            
            // Check if audio is already loaded to avoid delays
            if (audioElement.readyState >= 2) {
                // Audio is loaded, play immediately
                await audioElement.play();
                console.log(`Playing loaded audio for card ${cardId}`);
            } else {
                // Audio not loaded, load and play
                audioElement.load();
                await audioElement.play();
                console.log(`Playing audio for card ${cardId}`);
            }
            
            // Reset button when audio ends
            audioElement.onended = () => {
                if (button) {
                    button.innerHTML = '▶️ Play';
                    button.disabled = false;
                }
            };
            
            // Reset button on error
            audioElement.onerror = () => {
                console.error('Audio error for card:', cardId);
                if (button) {
                    button.innerHTML = '❌ Error';
                    setTimeout(() => {
                        button.innerHTML = '▶️ Play';
                        button.disabled = false;
                    }, 2000);
                }
            };
        }
        
    } catch (error) {
        console.error('Error playing audio:', error);
        if (button) {
            button.innerHTML = '❌ Error';
            setTimeout(() => {
                button.innerHTML = '▶️ Play';
                button.disabled = false;
            }, 2000);
        }
    }
}

/**
 * Check audio status for multiple cards
 * Useful for batch operations or dashboard display
 */
async function checkAudioStatus() {
    try {
        const backendBase = getBackendBase();
        const response = await fetch(`${backendBase}/api/audio/status`);
        if (response.ok) {
            const status = await response.json();
            console.log('Audio status:', status);
            return status;
        }
    } catch (error) {
        console.error('Error checking audio status:', error);
    }
}

// CSS styles for audio buttons (auto-injected)
const audioStyles = `
<style>
.audio-controls {
    margin: 5px 0;
}

.audio-btn {
    background: #4CAF50;
    border: none;
    color: white;
    padding: 8px 12px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 14px;
    margin: 2px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.3s;
}

.audio-btn:hover {
    background: #45a049;
}

.audio-btn:disabled {
    background: #cccccc;
    cursor: not-allowed;
}

.generate-btn {
    background: #2196F3;
}

.generate-btn:hover {
    background: #1976D2;
}

.play-btn {
    background: #4CAF50;
}

.play-btn:hover {
    background: #45a049;
}

.audio-status {
    font-style: italic;
    color: #666;
    margin-top: 4px;
}
</style>
`;

// Inject CSS styles when script loads
document.head.insertAdjacentHTML('beforeend', audioStyles);

// Make IPA functions globally available for onclick handlers
window.generateIPA = generateIPA;
window.generateIPAAudio = generateIPAAudio;
window.playIPAAudio = playIPAAudio;
window.getIPAHTML = getIPAHTML;

// Export functions for testing (if in module environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAudioButtonHTML,
        generateAudio,
        playAudio,
        checkAudioStatus,
        generateIPA,
        generateIPAAudio,
        playIPAAudio,
        getIPAHTML
    };
}