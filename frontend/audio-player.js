// frontend/audio-player.js
// Audio player functionality for Super-Flashcards Sprint 4
// Handles audio generation, playback, and UI updates

console.log("🔊 Audio player loaded");

/**
 * Get HTML for audio button based on card state
 * @param {Object} card - Flashcard object with id, word, audio_url, etc.
 * @returns {string} HTML string for audio button
 */
function getAudioButtonHTML(card) {
    const hasAudio = card.audio_url && card.audio_url.trim() !== '';
    const buttonId = `audio-btn-${card.id}`;
    const audioId = `audio-${card.id}`;
    
    if (hasAudio) {
        // Show play button if audio exists
        return `
            <div class="audio-controls">
                <button id="${buttonId}" class="audio-btn play-btn" onclick="playAudio('${card.id}', '${card.audio_url}')">
                    🔊 Play
                </button>
                <audio id="${audioId}" preload="none">
                    <source src="${card.audio_url}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
    } else {
        // Show generate button if no audio exists
        return `
            <div class="audio-controls">
                <button id="${buttonId}" class="audio-btn generate-btn" onclick="generateAudio('${card.id}', '${card.word_or_phrase}')">
                    🔊 Generate
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
    const button = document.getElementById(`audio-btn-${cardId}`);
    const statusDiv = document.getElementById(`audio-status-${cardId}`);
    
    if (!button) return;
    
    try {
        // Update UI to show generating state
        button.disabled = true;
        button.innerHTML = '🔄 Generating...';
        if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.innerHTML = '<small>Generating audio...</small>';
        }
        
        // Make API call to generate audio
        const response = await fetch(`/api/audio/generate/${cardId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Audio generated successfully
            const audioUrl = result.audio_url;
            
            // Update button to play button
            button.innerHTML = '🔊 Play';
            button.onclick = () => playAudio(cardId, audioUrl);
            button.disabled = false;
            button.className = 'audio-btn play-btn';
            
            // Add audio element
            const audioElement = document.createElement('audio');
            audioElement.id = `audio-${cardId}`;
            audioElement.preload = 'none';
            audioElement.innerHTML = `<source src="${audioUrl}" type="audio/mpeg">`;
            button.parentElement.appendChild(audioElement);
            
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
        console.error('Error generating audio:', error);
        
        // Reset button state
        button.disabled = false;
        button.innerHTML = '🔊 Generate';
        
        if (statusDiv) {
            statusDiv.innerHTML = `<small style="color: red;">❌ Error: ${error.message}</small>`;
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }
}

/**
 * Play audio for a flashcard
 * @param {string} cardId - Flashcard ID
 * @param {string} audioUrl - URL to audio file
 */
function playAudio(cardId, audioUrl) {
    const audioElement = document.getElementById(`audio-${cardId}`);
    const button = document.getElementById(`audio-btn-${cardId}`);
    
    if (!audioElement) {
        console.error(`Audio element not found for card ${cardId}`);
        return;
    }
    
    try {
        // Update button state
        if (button) {
            button.innerHTML = '▶️ Playing...';
            button.disabled = true;
        }
        
        // Play audio
        audioElement.play().then(() => {
            console.log(`Playing audio for card ${cardId}`);
        }).catch((error) => {
            console.error('Error playing audio:', error);
            if (button) {
                button.innerHTML = '❌ Error';
                setTimeout(() => {
                    button.innerHTML = '🔊 Play';
                    button.disabled = false;
                }, 2000);
            }
        });
        
        // Reset button when audio ends
        audioElement.onended = () => {
            if (button) {
                button.innerHTML = '🔊 Play';
                button.disabled = false;
            }
        };
        
        // Reset button on error
        audioElement.onerror = () => {
            if (button) {
                button.innerHTML = '❌ Error';
                setTimeout(() => {
                    button.innerHTML = '🔊 Play';
                    button.disabled = false;
                }, 2000);
            }
        };
        
    } catch (error) {
        console.error('Error playing audio:', error);
        if (button) {
            button.innerHTML = '❌ Error';
            setTimeout(() => {
                button.innerHTML = '🔊 Play';
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
        const response = await fetch('/api/audio/status');
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

// Export functions for testing (if in module environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAudioButtonHTML,
        generateAudio,
        playAudio,
        checkAudioStatus
    };
}