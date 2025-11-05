// frontend/app.js
// Language Learning Flashcards - Main Application Logic
// Version: 2.6.41 (Add enhanced image fallback for Greek root prefixes)

// VERSION CONSISTENCY CHECK
const APP_JS_VERSION = '2.6.41';

// Check version consistency on load
window.addEventListener('DOMContentLoaded', () => {
    const htmlVersion = window.APP_VERSION || 'unknown';
    const versionBadge = document.querySelector('span.font-mono[class*="text-gray"]');
    const badgeVersion = versionBadge ? versionBadge.textContent.trim() : 'unknown';
    
    console.log('🏷️ === VERSION CHECK ===');
    console.log(`🏷️ HTML declared: ${htmlVersion}`);
    console.log(`🏷️ App.js version: ${APP_JS_VERSION}`);
    console.log(`🏷️ Badge displays: ${badgeVersion}`);
    
    // Check if all versions match
    const allMatch = htmlVersion === APP_JS_VERSION && badgeVersion === `v${APP_JS_VERSION}`;
    
    if (!allMatch) {
        console.error('⚠️⚠️⚠️ VERSION MISMATCH DETECTED! ⚠️⚠️⚠️');
        console.error(`HTML: ${htmlVersion}, App.js: ${APP_JS_VERSION}, Badge: ${badgeVersion}`);
        console.error('CACHE ISSUE: Hard refresh (Ctrl+Shift+R) or clear cache!');
        
        // Show visual warning to user
        setTimeout(() => {
            const warningDiv = document.createElement('div');
            warningDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#dc2626;color:white;padding:12px;text-align:center;z-index:10000;font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
            warningDiv.innerHTML = `⚠️ VERSION MISMATCH! Badge: ${badgeVersion}, JS: v${APP_JS_VERSION}, HTML: ${htmlVersion}<br>Press <strong>Ctrl+Shift+R</strong> to hard refresh! ⚠️`;
            document.body.prepend(warningDiv);
        }, 1000);
    } else {
        console.log('✅ Version check passed - all components synchronized at v' + APP_JS_VERSION);
    }
});

// Sprint 5: Offline-First Architecture
let offlineDB, syncManager, apiClient;

// API Configuration (Legacy - will be replaced by ApiClient)
const API_BASE = window.location.origin.includes('localhost') 
    ? 'http://localhost:8000/api' 
    : '/api';

// Backend Base URL for static assets (images, audio)
// Handle both localhost and cross-device access (like iPhone → laptop)
const BACKEND_BASE = (() => {
    const origin = window.location.origin;
    
    if (origin.includes('localhost')) {
        // Local development
        return 'http://localhost:8000';
    } else if (origin.includes(':3000')) {
        // Cross-device access (iPhone → laptop) - replace port 3000 with 8000
        return origin.replace(':3000', ':8000');
    } else {
        // Production or other cases
        return '';
    }
})();

console.log(`🌐 Frontend origin: ${window.location.origin}`);
console.log(`🌐 Backend base: ${BACKEND_BASE}`);

// Application State
let state = {
    currentLanguage: null,
    flashcards: [],
    currentCardIndex: 0,
    isFlipped: false,
    isOnline: navigator.onLine,
    languages: [],
    syncStatus: 'offline',
    currentMode: 'study', // Track current mode: 'study', 'read', or 'browse'
    sortOrder: localStorage.getItem('flashcard_sort_order') || 'date-desc' // Persist sort order, default to newest first
};

// ========================================
// Status Banner Functions
// ========================================

/**
 * Show persistent status banner at top of page
 * @param {String} title - Main status message
 * @param {String} message - Detailed message
 * @param {String} type - 'processing', 'success', 'error', 'warning'
 * @param {Number} autoDismiss - Auto-dismiss after milliseconds (0 = manual dismiss only)
 */
function showStatusBanner(title, message, type = 'processing', autoDismiss = 0) {
    const banner = document.getElementById('status-banner');
    const icon = document.getElementById('status-banner-icon');
    const titleEl = document.getElementById('status-banner-title');
    const messageEl = document.getElementById('status-banner-message');
    
    if (!banner) return;
    
    // Set icon and colors based on type
    const types = {
        processing: {
            icon: '⏳',
            gradient: 'from-purple-500 to-indigo-600'
        },
        success: {
            icon: '✅',
            gradient: 'from-green-500 to-emerald-600'
        },
        error: {
            icon: '❌',
            gradient: 'from-red-500 to-rose-600'
        },
        warning: {
            icon: '⚠️',
            gradient: 'from-yellow-500 to-orange-600'
        }
    };
    
    const config = types[type] || types.processing;
    icon.textContent = config.icon;
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Update gradient
    banner.className = `bg-gradient-to-r ${config.gradient} text-white shadow-lg`;
    
    // Show banner
    banner.classList.remove('hidden');
    
    // Auto-dismiss if requested
    if (autoDismiss > 0) {
        setTimeout(() => {
            banner.classList.add('hidden');
        }, autoDismiss);
    }
}

/**
 * Hide status banner
 */
function hideStatusBanner() {
    const banner = document.getElementById('status-banner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

// ========================================
// Utility Functions
// ========================================

/**
 * Fix relative URLs to point to correct backend server
 * @param {String} url - URL to fix (may be relative or absolute)
 * @returns {String} Absolute URL pointing to backend
 */
function fixAssetUrl(url) {
    if (!url) return url;
    
    // If already absolute URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        console.log(`🔗 URL already absolute: ${url}`);
        return url;
    }
    
    // If relative URL starting with /, prepend backend base
    if (url.startsWith('/')) {
        const fixedUrl = BACKEND_BASE + url;
        console.log(`🔗 Fixed URL: ${url} → ${fixedUrl}`);
        return fixedUrl;
    }
    
    // Otherwise, return as-is
    console.log(`🔗 URL unchanged: ${url}`);
    return url;
}

/**
 * Enhanced audio player with caching support
 */
class CachedAudioPlayer {
    constructor() {
        this.currentAudio = null;
        this.cache = new Map(); // In-memory cache for blob URLs
    }
    
    /**
     * Play audio with caching support
     * @param {String} audioUrl - URL of audio to play
     * @param {String} flashcardId - Associated flashcard ID for caching
     */
    async playAudio(audioUrl, flashcardId = null) {
        const startTime = performance.now(); // Start performance timer
        try {
            const fixedUrl = fixAssetUrl(audioUrl);
            console.log(`🔊 Playing audio: ${fixedUrl}`);
            
            // Check if we have cached audio first
            let audioBlob = null;
            let cacheHit = false;
            if (offlineDB) {
                audioBlob = await offlineDB.getCachedAudio(fixedUrl);
                cacheHit = !!audioBlob;
            }
            
            let playableUrl = fixedUrl;
            
            if (audioBlob) {
                // Use cached audio
                console.log(`🔊 Using cached audio for ${fixedUrl}`);
                if (this.cache.has(fixedUrl)) {
                    playableUrl = this.cache.get(fixedUrl);
                } else {
                    playableUrl = URL.createObjectURL(audioBlob);
                    this.cache.set(fixedUrl, playableUrl);
                }
            } else if (navigator.onLine) {
                // Try to cache audio for future offline use
                this.cacheAudioInBackground(fixedUrl, flashcardId);
            }
            
            // Stop current audio if playing
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }
            
            // Create and play audio
            this.currentAudio = new Audio(playableUrl);
            
            // Add detailed event listeners for debugging
            this.currentAudio.addEventListener('canplay', () => {
                console.log('✅ Audio can play - duration:', this.currentAudio.duration);
            });
            this.currentAudio.addEventListener('playing', () => {
                console.log('▶️ Audio is playing');
            });
            this.currentAudio.addEventListener('error', (e) => {
                console.error('❌ Audio element error:', e, this.currentAudio.error);
            });
            
            console.log('🎵 Audio element created, attempting play...');
            const playPromise = this.currentAudio.play();
            
            playPromise.then(() => {
                console.log('✅ Play promise resolved successfully');
            }).catch((error) => {
                console.error('❌ Play promise rejected:', error);
                throw error;
            });
            
            await playPromise;
            
            // Log performance metrics
            const endTime = performance.now();
            const loadTime = (endTime - startTime).toFixed(2);
            console.log(`⏱️ Audio load time: ${loadTime}ms (${cacheHit ? 'CACHED' : 'NETWORK'})`);
            
        } catch (error) {
            console.error('❌ Error playing audio:', error);
            console.error('❌ Error name:', error.name);
            console.error('❌ Error message:', error.message);
            showToast('Audio playback failed: ' + error.message);
        }
    }
    
    /**
     * Cache audio in background for offline use
     * @param {String} audioUrl - URL to cache
     * @param {String} flashcardId - Associated flashcard ID
     */
    async cacheAudioInBackground(audioUrl, flashcardId) {
        try {
            // Don't cache if already cached
            if (offlineDB && await offlineDB.isAudioCached(audioUrl)) {
                return;
            }
            
            console.log(`🔄 Caching audio in background: ${audioUrl}`);
            
            const response = await fetch(audioUrl);
            if (response.ok) {
                const audioBlob = await response.blob();
                
                if (offlineDB) {
                    await offlineDB.cacheAudio(audioUrl, audioBlob, flashcardId);
                    console.log(`✅ Audio cached successfully: ${audioUrl}`);
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to cache audio (non-critical):', error);
        }
    }
    
    /**
     * Cleanup blob URLs to prevent memory leaks
     */
    cleanup() {
        for (const blobUrl of this.cache.values()) {
            URL.revokeObjectURL(blobUrl);
        }
        this.cache.clear();
    }
}

// Global cached audio player instance
const audioPlayer = new CachedAudioPlayer();

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            // Try to get detailed error message from response
            let errorDetail = `API Error: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorDetail = errorData.detail;
                }
            } catch (e) {
                // Couldn't parse error response, use status code
            }
            throw new Error(errorDetail);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        if (!state.isOnline) {
            showToast('You are offline. Changes will sync when back online.');
        } else {
            showToast('Network error. Please try again.');
        }
        throw error;
    }
}

// ========================================
// Language Functions
// ========================================

async function loadLanguages() {
    try {
        // Sprint 5: Use offline-first API client
        let languages;
        if (apiClient) {
            try {
                languages = await apiClient.getLanguages();
            } catch (error) {
                console.warn('API client failed, using offline data:', error);
                // If API fails, get from IndexedDB directly
                if (offlineDB) {
                    languages = await offlineDB.getAllLanguages();
                } else {
                    languages = [];
                }
            }
        } else {
            // Fallback to old API
            try {
                languages = await apiRequest('/languages');
            } catch (error) {
                console.warn('Old API failed:', error);
                languages = [];
            }
        }
        
        // If no languages found, add some defaults for testing
        if (languages.length === 0) {
            console.log('📝 No languages found, adding defaults for testing...');
            languages = [
                { id: 1, name: 'French', code: 'fr' },
                { id: 2, name: 'Spanish', code: 'es' },
                { id: 3, name: 'German', code: 'de' },
                { id: 4, name: 'Italian', code: 'it' }
            ];
            
            // Save defaults to IndexedDB if available
            if (offlineDB) {
                for (const lang of languages) {
                    await offlineDB.saveLanguage(lang);
                }
            }
        }
        
        state.languages = languages;
        
        // Sort languages alphabetically by name
        languages.sort((a, b) => a.name.localeCompare(b.name));
        
        const select = document.getElementById('language-select');
        select.innerHTML = '<option value="">Select a language...</option>';
        
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.id;
            option.textContent = `${lang.name} (${lang.code})`;
            select.appendChild(option);
        });
        
        // Select last used language or first language by default
        const savedLanguageId = localStorage.getItem('lastSelectedLanguage');
        let selectedLanguage = null;
        
        if (savedLanguageId && languages.find(lang => lang.id === savedLanguageId)) {
            // Use saved language if it still exists
            selectedLanguage = savedLanguageId;
        } else if (languages.length > 0) {
            // Fall back to first language (alphabetically)
            selectedLanguage = languages[0].id;
        }
        
        if (selectedLanguage) {
            select.value = selectedLanguage;
            state.currentLanguage = selectedLanguage;
            // Save to localStorage immediately
            localStorage.setItem('lastSelectedLanguage', selectedLanguage);
            await loadFlashcards();
        }
    } catch (error) {
        console.error('Failed to load languages:', error);
        showToast('Failed to load languages');
    }
}

// ========================================
// Flashcard CRUD Functions
// ========================================

async function loadFlashcards(options = {}) {
    // During first-time progressive load, we might not have a language selected yet
    // Allow loading without language filter in this case
    const hasLanguages = state.languages && state.languages.length > 0;
    if (!state.currentLanguage && hasLanguages) {
        // Languages are loaded but none selected - this is an error state
        return;
    }
    
    try {
        showLoading();
        
        // Sprint 5: Use offline-first API client
        let flashcards;
        if (apiClient) {
            try {
                // New offline-first approach - pass through forceFresh option if provided
                flashcards = await apiClient.getFlashcards(options);
                
                // IMPORTANT: Only filter by language if we have actual language data
                // During progressive first-time load, languages may not be loaded yet
                const hasLanguages = state.languages && state.languages.length > 0;
                if (hasLanguages && state.currentLanguage) {
                    // Filter by language (language_id exists in Cloud SQL!)
                    flashcards = flashcards.filter(card => card.language_id === state.currentLanguage);
                    console.log(`Loaded ${flashcards.length} flashcards for language ${state.currentLanguage}`);
                } else {
                    // No language filtering - show all available cards
                    console.log(`Loaded ${flashcards.length} flashcards (no language filter)`);
                }
            } catch (error) {
                console.warn('API client failed, using offline data:', error);
                // If API fails, get from IndexedDB directly
                if (offlineDB) {
                    const allCards = await offlineDB.getAllFlashcards();
                    // Filter by language for offline data too (if we have language data)
                    const hasLanguages = state.languages && state.languages.length > 0;
                    if (hasLanguages && state.currentLanguage) {
                        flashcards = allCards.filter(card => card.language_id === state.currentLanguage);
                    } else {
                        flashcards = allCards;
                    }
                } else {
                    flashcards = [];
                }
            }
        } else {
            // Fallback to old API for backward compatibility
            try {
                flashcards = await apiRequest(`/flashcards?language_id=${state.currentLanguage}`);
            } catch (error) {
                console.warn('Old API failed:', error);
                flashcards = [];
            }
        }
        
        // ✅ FIX: Apply sort order to state.flashcards so they're in correct order from the start
        state.flashcards = sortFlashcards(flashcards, state.sortOrder);
        state.currentCardIndex = 0;
        
        if (flashcards.length > 0) {
            // Check current mode and render appropriately
            if (state.currentMode === 'browse') {
                // In browse mode, update cards list
                loadCardsList();
            } else if (state.currentMode === 'read') {
                // In read mode, render read card
                renderReadCard(flashcards[0]);
            } else {
                // In study mode (default), render flashcard
                renderFlashcard(flashcards[0]);
            }
            document.getElementById('study-controls').classList.remove('hidden');
            updateCardCounter();
        } else {
            // Empty state - show appropriate message based on mode
            if (state.currentMode === 'browse') {
                const cardsList = document.getElementById('cards-list');
                if (cardsList) {
                    cardsList.innerHTML = `
                        <div class="text-center text-gray-500 py-8">
                            <p class="text-lg mb-2">No flashcards yet for this language</p>
                            <p class="text-sm">Add your first flashcard using the "Add Card" tab</p>
                        </div>
                    `;
                }
            } else {
                document.getElementById('flashcard-container').innerHTML = `
                    <div class="text-center text-gray-500 py-12">
                        <p class="text-lg mb-4">No flashcards yet for this language</p>
                        <p class="text-sm">Add your first flashcard using the "Add Card" tab</p>
                    </div>
                `;
            }
            document.getElementById('study-controls').classList.add('hidden');
        }
        
        renderFlashcardList();
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Failed to load flashcards:', error);
    }
}

async function createFlashcard(data) {
    try {
        showLoading();
        
        const flashcardData = {
            ...data,
            language_id: state.currentLanguage,
            source: 'manual'
        };
        
        // Sprint 5: Use offline-first API client
        let flashcard;
        if (apiClient) {
            flashcard = await apiClient.createFlashcard(flashcardData);
        } else {
            // Fallback to old API
            flashcard = await apiRequest('/flashcards', {
                method: 'POST',
                body: JSON.stringify(flashcardData)
            });
        }
        
        console.log('✅ Manual flashcard created:', flashcard);
        console.log('📷 Image URL:', flashcard?.image_url);
        console.log('🔊 Audio URL:', flashcard?.audio_url);
        
        // TODO: Add better error handling with user-friendly messages
        // Don't expose technical errors to users
        
        showToast('✅ Flashcard created successfully!');
        
        // Generate audio for the new flashcard using the word from the response
        if (flashcard && flashcard.id && flashcard.word_or_phrase) {
            try {
                console.log('🔊 Starting audio generation for:', flashcard.word_or_phrase);
                // Call audio generation directly with the word we already have
                if (typeof generateAudio === 'function') {
                    await generateAudio(flashcard.id, flashcard.word_or_phrase);
                    console.log('✅ Audio generation completed');
                } else {
                    console.error('❌ generateAudio function not available');
                }
            } catch (audioError) {
                console.error('❌ Audio generation failed:', audioError);
                showToast('⚠️ Card created but audio generation failed. Use the Generate Audio button.', 5000);
            }
        }
        
        // Show the newly created card immediately
        console.log('📍 Showing newly created card:', flashcard.word_or_phrase);
        
        // ✅ FIX: Force fresh fetch from server to get the newly created card
        console.log('🔄 Force reloading flashcards from server...');
        await loadFlashcards({ forceFresh: true });
        
        // Find the card in state.flashcards
        const cardIndex = state.flashcards.findIndex(c => c.id === flashcard.id);
        if (cardIndex !== -1) {
            state.currentCardIndex = cardIndex;
            console.log('📍 Found card at index:', cardIndex);
            
            // Switch to study mode to display the card
            console.log('🔄 Switching to study mode...');
            switchMode('study');
            
            // Wait a brief moment for mode switch to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Render the specific card
            if (state.flashcards[state.currentCardIndex]) {
                console.log('🎨 Rendering flashcard...');
                renderFlashcard(state.flashcards[state.currentCardIndex]);
                updateCardCounter();
            }
        } else {
            console.error('❌ Newly created card not found in state.flashcards after sync!');
            showToast('⚠️ Card created but may not be visible yet. Refresh the page.', 5000);
        }
        
        hideLoading();
        
        return flashcard;
    } catch (error) {
        hideLoading();
        // TODO: Improve error messages - don't expose technical details
        showToast('Failed to create flashcard');
        console.error('Create flashcard error:', error);
        throw error;
    }
}

async function generateAIFlashcard(word, includeImage = true) {
    if (!state.currentLanguage) {
        showToast('Please select a language first');
        return null;
    }
    
    try {
        showLoading();
        
        // Show a more informative message for AI generation
        const loadingMessage = document.querySelector('#loading-overlay p');
        if (loadingMessage) {
            loadingMessage.innerHTML = `
                <span class="block mb-2">Generating AI flashcard...</span>
                <span class="text-sm text-gray-600">This will take a few minutes</span>
                <span class="text-xs text-gray-500 mt-1 block">(Creating definition, etymology, image, and audio)</span>
            `;
        }
        
        const flashcard = await apiRequest('/ai/generate', {
            method: 'POST',
            body: JSON.stringify({
                word_or_phrase: word,
                language_id: state.currentLanguage,
                include_image: includeImage
            })
        });
        
        console.log('✅ AI flashcard received:', flashcard);
        console.log('📷 Image URL:', flashcard?.image_url);
        console.log('🔊 Audio URL:', flashcard?.audio_url);
        console.log('🖼️ Include image was requested:', includeImage);
        console.log('📝 Image description from AI:', flashcard?.image_description);
        
        // Check if image generation was requested but failed
        if (includeImage && !flashcard?.image_url) {
            console.warn('⚠️ Image was requested but not generated!');
            if (!flashcard?.image_description) {
                console.error('❌ No image_description returned from AI - this is why image generation failed');
            } else {
                console.error('❌ Image description exists but image_url is null - generation or upload failed');
            }
        }
        
        // TODO: Add better error handling with user-friendly messages
        // Don't expose technical errors to users
        
        hideLoading();
        showToast('✅ AI Flashcard generated successfully!');
        
        // ✅ FIX: Force fresh fetch from server to get the newly created card
        console.log('📍 Reloading flashcards with forceFresh to include newly created card:', flashcard.word_or_phrase);
        await loadFlashcards({ forceFresh: true });
        
        // Generate audio for the new flashcard using the word from the response
        if (flashcard && flashcard.id && flashcard.word_or_phrase) {
            try {
                console.log('🔊 Starting audio generation for:', flashcard.word_or_phrase);
                // Call audio generation directly with the word we already have
                if (typeof generateAudio === 'function') {
                    await generateAudio(flashcard.id, flashcard.word_or_phrase);
                    console.log('✅ Audio generation completed');
                } else {
                    console.error('❌ generateAudio function not available');
                }
            } catch (audioError) {
                console.error('❌ Audio generation failed:', audioError);
                // Don't fail the whole operation if audio fails
                showToast('⚠️ Card created but audio generation failed. Use the Generate Audio button.', 5000);
            }
        }
        
        // Now find the card in the refreshed state.flashcards
        const cardIndex = state.flashcards.findIndex(c => c.id === flashcard.id);
        if (cardIndex !== -1) {
            state.currentCardIndex = cardIndex;
            console.log('📍 Found card at index:', cardIndex);
        } else {
            console.warn('⚠️ Newly created card not found in state.flashcards after reload, showing last card');
            state.currentCardIndex = state.flashcards.length - 1;
        }
        
        // Switch to study mode to display the card
        backToMain();
        switchToStudyMode();
        
        // Render the specific card
        if (state.flashcards[state.currentCardIndex]) {
            renderFlashcard(state.flashcards[state.currentCardIndex]);
            updateCardCounter();
        }
        
        return flashcard;
    } catch (error) {
        hideLoading();
        // TODO: Improve error messages - don't expose technical details
        showToast('AI generation failed. Check your API key.');
        console.error('AI generation error:', error);
        throw error;
    }
}

/**
 * Helper function to generate audio for a flashcard
 * @param {string} flashcardId - The flashcard ID
 */
async function generateAudioForCard(flashcardId) {
    console.log('🔊 generateAudioForCard called with ID:', flashcardId);
    console.log('🔊 Current flashcards in state:', state.flashcards.length);
    
    // Get the flashcard to get the word/phrase
    const flashcard = state.flashcards.find(card => card.id === flashcardId);
    if (!flashcard) {
        console.warn('⚠️ Flashcard not found in state.flashcards for audio generation:', flashcardId);
        console.warn('Available IDs:', state.flashcards.map(c => c.id));
        return;
    }
    
    console.log('🔊 Found flashcard:', flashcard.word_or_phrase);
    
    // Call the global generateAudio function from audio-player.js
    if (typeof generateAudio === 'function') {
        console.log('🔊 Calling generateAudio...');
        await generateAudio(flashcardId, flashcard.word_or_phrase);
        console.log('🔊 generateAudio completed');
    } else {
        console.error('❌ generateAudio function not available');
    }
}

/**
 * Switch to study mode (not Browse mode)
 * This ensures we show the study view with the new card
 */
function switchToStudyMode() {
    // Make sure we're in Study mode (not Browse mode)
    switchMode('study');
}

async function markAsReviewed(flashcardId) {
    try {
        await apiRequest(`/flashcards/${flashcardId}/review`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Failed to mark as reviewed:', error);
    }
}

// ========================================
// Image Generation Functions
// ========================================

let manualImageData = null;
let editImageData = null;

async function generateImageForManualCard() {
    console.log('generateImageForManualCard called');
    const wordInput = document.getElementById('word-input').value.trim();
    
    console.log('Word input:', wordInput);
    console.log('Current language:', state.currentLanguage);
    
    if (!wordInput) {
        showToast('Please enter a word or phrase first');
        return;
    }
    
    if (!state.currentLanguage) {
        showToast('Please select a language first');
        return;
    }
    
    console.log('Starting image generation...');
    showToast('🎨 Generating image, please wait...');
    
    try {
        // Show loading state
        const loadingElement = document.getElementById('manual-image-loading');
        const generateBtn = document.getElementById('generate-manual-image-btn');
        
        if (loadingElement) {
            loadingElement.classList.remove('hidden');
        }
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = '⏳ Generating...';
        }
        
        // Generate image using image-only endpoint for better performance
        console.log('Making API request for image generation...');
        const apiUrl = `/ai/image?word_or_phrase=${encodeURIComponent(wordInput)}&language_id=${state.currentLanguage}`;
        console.log('API URL:', apiUrl);
        
        const response = await apiRequest(apiUrl, {
            method: 'POST'
        });
        
        console.log('API response received:', response);
        console.log('Response type:', typeof response);
        console.log('Has image_url:', !!response?.image_url);
        
        if (response && response.image_url) {
            manualImageData = {
                url: response.image_url,
                description: response.image_description || ''
            };
            
            console.log('Image data set:', manualImageData);
            
            // Show image preview
            const previewImg = document.getElementById('manual-image-preview-img');
            const previewDesc = document.getElementById('manual-image-description');
            const previewContainer = document.getElementById('manual-image-preview');
            
            if (previewImg && previewContainer) {
                previewImg.src = fixAssetUrl(response.image_url);
                if (previewDesc) {
                    previewDesc.textContent = response.image_description || 'Generated image';
                }
                previewContainer.classList.remove('hidden');
                showToast('✨ Image generated successfully!');
            } else {
                console.error('Preview elements not found');
                showToast('Image generated but preview failed');
            }
        } else {
            console.error('No image URL in response:', response);
            showToast('Failed to generate image - no URL returned');
        }
        
    } catch (error) {
        console.error('Image generation failed:', error);
        showToast(`Failed to generate image: ${error.message}`);
    } finally {
        // Hide loading state
        const loadingElement = document.getElementById('manual-image-loading');
        const generateBtn = document.getElementById('generate-manual-image-btn');
        
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = '🎨 Generate Image';
        }
        console.log('Image generation complete (finally block)');
    }
}

async function generateImageForEditCard() {
    console.log('generateImageForEditCard called');
    const wordInput = document.getElementById('edit-word').value.trim();
    
    console.log('Edit word input:', wordInput);
    console.log('Current language:', state.currentLanguage);
    
    if (!wordInput) {
        console.log('No word input, showing toast');
        showToast('Please enter a word or phrase first');
        return;
    }
    
    if (!state.currentLanguage) {
        console.log('No current language, showing toast');
        showToast('Please select a language first');
        return;
    }
    
    console.log('Starting edit image generation...');
    
    try {
        // Show loading state
        document.getElementById('edit-image-loading').classList.remove('hidden');
        document.getElementById('generate-edit-image-btn').disabled = true;
        document.getElementById('regenerate-edit-image-btn').disabled = true;
        
        // Get the flashcard ID from edit modal (for definition fallback)
        const flashcardIdInput = document.getElementById('edit-flashcard-id');
        const flashcardId = flashcardIdInput ? flashcardIdInput.value : null;
        
        // Build URL with optional flashcard_id parameter
        let url = `/ai/image?word_or_phrase=${encodeURIComponent(wordInput)}&language_id=${state.currentLanguage}`;
        if (flashcardId) {
            url += `&flashcard_id=${flashcardId}`;
        }
        
        // Generate image using image-only endpoint for better performance
        const response = await apiRequest(url, {
            method: 'POST'
        });
        
        if (response.image_url) {
            editImageData = {
                url: response.image_url,
                description: response.image_description || ''
            };
            
            // Show image preview
            const previewImg = document.getElementById('edit-image-preview');
            const previewDesc = document.getElementById('edit-image-description');
            
            previewImg.src = fixAssetUrl(response.image_url);
            previewDesc.textContent = response.image_description || 'Generated image';
            
            document.getElementById('edit-image-section').classList.remove('hidden');
            document.getElementById('regenerate-edit-image-btn').classList.remove('hidden');
            showToast('✨ Image generated!');
        } else {
            showToast('Failed to generate image');
        }
        
    } catch (error) {
        console.error('Image generation failed:', error);
        
        // Check if this is a content policy violation
        const errorMsg = error.message || '';
        if (errorMsg.includes('safety system') || errorMsg.includes('content policy')) {
            showToast('⚠️ DALL-E rejected this word due to content policy. You can upload an image manually instead.', 8000);
        } else if (errorMsg.includes('422')) {
            showToast('⚠️ Image generation blocked. Try uploading an image manually.', 6000);
        } else {
            showToast('❌ Failed to generate image. Please try again or upload manually.', 5000);
        }
    } finally {
        // Hide loading state
        document.getElementById('edit-image-loading').classList.add('hidden');
        document.getElementById('generate-edit-image-btn').disabled = false;
        document.getElementById('regenerate-edit-image-btn').disabled = false;
    }
}

function removeManualImage() {
    manualImageData = null;
    document.getElementById('manual-image-preview').classList.add('hidden');
    document.getElementById('regenerate-manual-image-btn')?.classList.add('hidden');
}

function removeEditImage() {
    editImageData = null;
    document.getElementById('edit-image-section').classList.add('hidden');
    document.getElementById('regenerate-edit-image-btn').classList.add('hidden');
}

// ========================================
// UI Rendering Functions
// ========================================

/**
 * Copy share link for a flashcard to clipboard
 */
async function copyShareLink(cardId) {
    const shareUrl = `${window.location.origin}/?cardId=${cardId}`;
    
    try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('📋 Share link copied to clipboard!', 3000);
        console.log('📋 Copied share link:', shareUrl);
    } catch (error) {
        console.error('Failed to copy link:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('📋 Share link copied to clipboard!', 3000);
        } catch (err) {
            showToast('❌ Failed to copy link', 'error');
        }
        document.body.removeChild(textArea);
    }
}

function renderFlashcard(flashcard) {
    const container = document.getElementById('flashcard-container');
    
    // Parse related words if it's a JSON string
    let relatedWords = [];
    try {
        relatedWords = flashcard.related_words ? JSON.parse(flashcard.related_words) : [];
    } catch (e) {
        relatedWords = flashcard.related_words ? flashcard.related_words.split(',') : [];
    }
    
    container.innerHTML = `
        <div class="flashcard max-w-2xl mx-auto">
            <div class="flashcard-inner relative">
                <!-- Front of card -->
                <div class="flashcard-front bg-white rounded-xl shadow-xl p-8 min-h-[400px] hover:shadow-2xl transition">
                    <div class="flex justify-between items-start mb-6">
                        <div class="text-sm text-gray-500">
                            ${flashcard.source && flashcard.source.startsWith('ai_generated') ? '🤖 AI Generated' : '✍️ Manual'}
                        </div>
                        <div class="flex items-center gap-3">
                            <button onclick="copyShareLink('${flashcard.id}')" 
                                    class="px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 text-sm transition-colors" 
                                    title="Copy share link">
                                🔗 Share
                            </button>
                            <button onclick="editCard('${flashcard.id}')" 
                                    class="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm transition-colors" 
                                    title="Edit this card">
                                ✏️ Edit
                            </button>
                            <div class="text-sm text-gray-500">
                                Reviewed ${flashcard.times_reviewed} times
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <h2 class="text-5xl font-bold text-gray-900 mb-8">
                            ${flashcard.word_or_phrase}
                        </h2>
                        
                        <!-- Audio Controls -->
                        <div class="mb-6">
                            ${getAudioButtonHTML(flashcard)}
                        </div>
                        
                        <!-- IPA Pronunciation Section -->
                        ${getIPAHTML(flashcard)}
                        
                        ${flashcard.image_url ? `
                            <img src="${fixAssetUrl(flashcard.image_url)}" 
                                 alt="${flashcard.image_description || flashcard.word_or_phrase}"
                                 class="w-full max-w-md mx-auto rounded-lg mb-6 shadow-md"
                                 onload="console.log('🖼️ Image loaded:', this.src, 'Time:', performance.now().toFixed(2) + 'ms')"
                                 onerror="console.error('❌ Image failed to load:', this.src)">
                        ` : ''}
                        
                        <!-- Reveal Details Button -->
                        <div class="mt-8">
                            <button onclick="flipCard()" class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-lg transition-all transform hover:scale-105">
                                📋 Show Details
                            </button>
                        </div>
                        
                        <!-- Mobile Navigation -->
                        <div class="mt-6 flex justify-center items-center gap-4">
                            <button onclick="previousCard(); event.stopPropagation();" 
                                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50" 
                                    ${state.currentCardIndex === 0 ? 'disabled' : ''}>
                                ← Previous
                            </button>
                            <span class="text-sm text-gray-500 px-3">
                                ${state.currentCardIndex + 1} of ${state.flashcards.length}
                            </span>
                            <button onclick="nextCard(); event.stopPropagation();" 
                                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    ${state.currentCardIndex >= state.flashcards.length - 1 ? 'disabled' : ''}>
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Back of card -->
                <div class="flashcard-back bg-indigo-50 rounded-xl shadow-xl p-8 min-h-[400px] cursor-pointer hover:shadow-2xl transition">
                    <div class="space-y-6">
                        <!-- Show the word at the top of the back -->
                        <div class="text-center border-b border-indigo-200 pb-4 mb-6">
                            <div class="flex justify-between items-start mb-2">
                                <div></div>
                                <div class="flex items-center gap-2">
                                    <button onclick="copyShareLink('${flashcard.id}')" 
                                            class="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm transition-colors" 
                                            title="Copy share link">
                                        🔗 Share
                                    </button>
                                    <button onclick="editCard('${flashcard.id}')" 
                                            class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm transition-colors" 
                                            title="Edit this card">
                                        ✏️ Edit
                                    </button>
                                </div>
                            </div>
                            <h2 class="text-2xl font-bold text-indigo-900">${flashcard.word_or_phrase}</h2>
                            <p class="text-sm text-indigo-600 mt-1">${flashcard.language_name || 'Word'}</p>
                            <!-- Audio Controls -->
                            <div class="mt-3">
                                ${getAudioButtonHTML(flashcard)}
                            </div>
                            
                            <!-- IPA Pronunciation Section -->
                            <div class="mt-3">
                                ${getIPAHTML(flashcard)}
                            </div>
                        </div>
                        
                        ${flashcard.definition ? `
                            <div>
                                <h3 class="text-sm font-semibold text-indigo-900 uppercase mb-2">Definition</h3>
                                <p class="text-gray-800 leading-relaxed">${flashcard.definition}</p>
                            </div>
                        ` : ''}
                        
                        ${flashcard.etymology ? `
                            <div>
                                <h3 class="text-sm font-semibold text-indigo-900 uppercase mb-2">Etymology</h3>
                                <p class="text-gray-700">${flashcard.etymology}</p>
                            </div>
                        ` : ''}
                        
                        ${flashcard.english_cognates ? `
                            <div>
                                <h3 class="text-sm font-semibold text-indigo-900 uppercase mb-2">English Cognates</h3>
                                <p class="text-gray-700">${flashcard.english_cognates}</p>
                            </div>
                        ` : ''}
                        
                        ${relatedWords.length > 0 ? `
                            <div>
                                <h3 class="text-sm font-semibold text-indigo-900 uppercase mb-2">Related Words</h3>
                                <div class="flex flex-wrap gap-2">
                                    ${relatedWords.map(word => `
                                        <span class="px-3 py-1 bg-indigo-200 text-indigo-800 rounded-full text-sm">
                                            ${word.trim()}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Back to Word Button -->
                        <div class="text-center mt-8">
                            <button onclick="flipCard()" class="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 font-medium shadow-lg border-2 border-indigo-200 transition-all transform hover:scale-105">
                                ↩️ Back to Word
                            </button>
                        </div>
                        
                        <!-- Mobile Navigation -->
                        <div class="mt-6 flex justify-center items-center gap-4">
                            <button onclick="previousCard(); event.stopPropagation();" 
                                    class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50" 
                                    ${state.currentCardIndex === 0 ? 'disabled' : ''}>
                                ← Previous
                            </button>
                            <span class="text-sm text-indigo-600 px-3 font-medium">
                                ${state.currentCardIndex + 1} of ${state.flashcards.length}
                            </span>
                            <button onclick="nextCard(); event.stopPropagation();" 
                                    class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50"
                                    ${state.currentCardIndex >= state.flashcards.length - 1 ? 'disabled' : ''}>
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add touch/swipe support for mobile navigation
    addSwipeSupport();
}

function flipCard() {
    const card = document.querySelector('.flashcard');
    card.classList.toggle('flipped');
    state.isFlipped = !state.isFlipped;
    
    // Mark as reviewed when flipping
    if (state.flashcards[state.currentCardIndex]) {
        markAsReviewed(state.flashcards[state.currentCardIndex].id);
    }
}

function editCard(cardId) {
    // Find the flashcard by ID
    const flashcard = state.flashcards.find(card => card.id === cardId);
    if (flashcard) {
        showEditModal(flashcard);
    } else {
        showToast('Card not found', 3000);
    }
}

function updateCardCounter() {
    const counter = document.getElementById('card-counter');
    if (state.flashcards.length > 0) {
        counter.textContent = `${state.currentCardIndex + 1} / ${state.flashcards.length}`;
    }
}

function nextCard() {
    if (state.currentCardIndex < state.flashcards.length - 1) {
        state.currentCardIndex++;
        renderFlashcard(state.flashcards[state.currentCardIndex]);
        updateCardCounter();
        
        // Reset flip state
        const card = document.querySelector('.flashcard');
        card.classList.remove('flipped');
        state.isFlipped = false;
        
        // Prefetch next 3 cards (simple prefetch as Claude suggested)
        if (window.firstTimeLoader) {
            window.firstTimeLoader.prefetchNextCards(state.flashcards, state.currentCardIndex, 3);
        }
    }
}

function prevCard() {
    if (state.currentCardIndex > 0) {
        state.currentCardIndex--;
        renderFlashcard(state.flashcards[state.currentCardIndex]);
        updateCardCounter();
        
        // Reset flip state
        const card = document.querySelector('.flashcard');
        card.classList.remove('flipped');
        state.isFlipped = false;
        
        // Prefetch surrounding cards
        if (window.firstTimeLoader) {
            window.firstTimeLoader.prefetchNextCards(state.flashcards, state.currentCardIndex, 3);
        }
    }
}

// Alias for mobile navigation
function previousCard() {
    prevCard();
}

/**
 * Render flashcard in Read Mode (shows back content with navigation)
 */
function renderReadCard(flashcard) {
    console.log('📄 renderReadCard called with:', flashcard.word_or_phrase);
    
    const container = document.getElementById('read-card-container');
    
    if (!container) {
        console.error('❌ read-card-container element not found!');
        return;
    }
    
    console.log('✅ read-card-container found, rendering card...');
    
    // Parse related words if it's a JSON string
    let relatedWords = [];
    try {
        relatedWords = flashcard.related_words ? JSON.parse(flashcard.related_words) : [];
    } catch (e) {
        relatedWords = flashcard.related_words ? flashcard.related_words.split(',') : [];
    }
    
    container.innerHTML = `
        <div class="max-w-3xl mx-auto">
            <!-- Read Mode Card -->
            <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-2xl p-8 min-h-[500px]">
                <div class="space-y-6">
                    <!-- Header with thumbnail and title -->
                    <div class="flex items-start gap-6 border-b border-indigo-200 pb-6">
                        <!-- Image Thumbnail -->
                        ${flashcard.image_url ? `
                            <div class="flex-shrink-0">
                                <img src="${fixAssetUrl(flashcard.image_url)}" 
                                     alt="${flashcard.image_description || flashcard.word_or_phrase}"
                                     class="w-32 h-32 object-cover rounded-lg shadow-md border-2 border-white">
                            </div>
                        ` : `
                            <div class="flex-shrink-0 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-lg shadow-md flex items-center justify-center border-2 border-white">
                                <span class="text-4xl">📚</span>
                            </div>
                        `}
                        
                        <!-- Title and Meta -->
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h2 class="text-3xl font-bold text-indigo-900">${flashcard.word_or_phrase}</h2>
                                    <p class="text-sm text-indigo-600 mt-1">${flashcard.language_name || 'Word'}</p>
                                </div>
                                <button onclick="editCard('${flashcard.id}')" 
                                        class="px-3 py-1 bg-white text-indigo-700 rounded-md hover:bg-indigo-50 text-sm transition-colors shadow-sm" 
                                        title="Edit this card">
                                    ✏️ Edit
                                </button>
                            </div>
                            
                            <!-- Audio Controls -->
                            <div class="mt-3">
                                ${getAudioButtonHTML(flashcard)}
                            </div>
                            
                            <!-- IPA Pronunciation -->
                            <div class="mt-2">
                                ${getIPAHTML(flashcard)}
                            </div>
                            
                            <!-- Stats -->
                            <div class="mt-3 flex items-center gap-4 text-xs text-indigo-700">
                                <span>${flashcard.source && flashcard.source.startsWith('ai_generated') ? '🤖 AI Generated' : '✍️ Manual'}</span>
                                <span>•</span>
                                <span>Reviewed ${flashcard.times_reviewed} times</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Content Sections -->
                    ${flashcard.definition ? `
                        <div>
                            <h3 class="text-sm font-semibold text-indigo-900 uppercase mb-2 flex items-center gap-2">
                                <span class="text-lg">📖</span> Definition
                            </h3>
                            <p class="text-gray-800 leading-relaxed text-lg">${flashcard.definition}</p>
                        </div>
                    ` : ''}
                    
                    ${flashcard.etymology ? `
                        <div>
                            <h3 class="text-sm font-semibold text-indigo-900 uppercase mb-2 flex items-center gap-2">
                                <span class="text-lg">🌱</span> Etymology
                            </h3>
                            <p class="text-gray-700 leading-relaxed">${flashcard.etymology}</p>
                        </div>
                    ` : ''}
                    
                    ${flashcard.english_cognates ? `
                        <div>
                            <h3 class="text-sm font-semibold text-indigo-900 uppercase mb-2 flex items-center gap-2">
                                <span class="text-lg">🔗</span> English Cognates
                            </h3>
                            <p class="text-gray-700">${flashcard.english_cognates}</p>
                        </div>
                    ` : ''}
                    
                    ${flashcard.example_sentences ? `
                        <div>
                            <h3 class="text-sm font-semibold text-indigo-900 uppercase mb-2 flex items-center gap-2">
                                <span class="text-lg">💬</span> Example Sentences
                            </h3>
                            <p class="text-gray-700 leading-relaxed italic">${flashcard.example_sentences}</p>
                        </div>
                    ` : ''}
                    
                    ${relatedWords.length > 0 ? `
                        <div>
                            <h3 class="text-sm font-semibold text-indigo-900 uppercase mb-2 flex items-center gap-2">
                                <span class="text-lg">🔀</span> Related Words
                            </h3>
                            <div class="flex flex-wrap gap-2">
                                ${relatedWords.map(word => `
                                    <span class="px-3 py-1 bg-white text-indigo-800 rounded-full text-sm shadow-sm border border-indigo-200">
                                        ${word.trim()}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Navigation Controls -->
            <div class="mt-6 flex justify-between items-center gap-4">
                <button onclick="previousReadCard()" 
                        class="px-6 py-3 bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 font-medium shadow-md border border-indigo-200 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                        ${state.currentCardIndex === 0 ? 'disabled' : ''}>
                    ← Previous
                </button>
                
                <div class="text-center">
                    <div class="text-sm text-indigo-600 font-medium px-4 py-2 bg-white rounded-lg shadow-sm border border-indigo-100">
                        ${state.currentCardIndex + 1} of ${state.flashcards.length}
                    </div>
                </div>
                
                <button onclick="nextReadCard()" 
                        class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        ${state.currentCardIndex >= state.flashcards.length - 1 ? 'disabled' : ''}>
                    Next →
                </button>
            </div>
        </div>
    `;
    
    // Add touch/swipe support for mobile navigation in read mode
    addReadModeSwipeSupport();
}

/**
 * Navigate to next card in read mode
 */
function nextReadCard() {
    if (state.currentCardIndex < state.flashcards.length - 1) {
        state.currentCardIndex++;
        renderReadCard(state.flashcards[state.currentCardIndex]);
        
        // Scroll to top of card
        document.getElementById('read-card-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Navigate to previous card in read mode
 */
function previousReadCard() {
    if (state.currentCardIndex > 0) {
        state.currentCardIndex--;
        renderReadCard(state.flashcards[state.currentCardIndex]);
        
        // Scroll to top of card
        document.getElementById('read-card-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Add swipe support for Read Mode navigation
 */
function addReadModeSwipeSupport() {
    const container = document.getElementById('read-card-container');
    if (!container) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleReadSwipe();
    }, { passive: true });
    
    function handleReadSwipe() {
        const swipeThreshold = 50; // minimum distance for swipe
        
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe left - next card
            nextReadCard();
        }
        
        if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe right - previous card
            previousReadCard();
        }
    }
}

/**
 * Add swipe support for mobile navigation
 */
function addSwipeSupport() {
    const card = document.querySelector('.flashcard');
    if (!card) return;
    
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    
    card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });
    
    card.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;
        
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const minSwipeDistance = 50;
        
        // Only process horizontal swipes (ignore mostly vertical scrolling)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                // Swipe right - go to previous card
                previousCard();
            } else {
                // Swipe left - go to next card
                nextCard();
            }
        }
    }, { passive: true });
    
    console.log('📱 Touch swipe navigation enabled');
}

/**
 * Sort flashcards based on specified order
 * @param {Array} cards - Array of flashcards to sort
 * @param {string} sortOrder - Sort order ('name-asc', 'name-desc', 'date-asc', 'date-desc')
 * @returns {Array} - Sorted array of flashcards
 */
function sortFlashcards(cards, sortOrder) {
    return [...cards].sort((a, b) => {
        switch (sortOrder) {
            case 'name-asc':
                return (a.word_or_phrase || '').localeCompare(b.word_or_phrase || '');
            case 'name-desc':
                return (b.word_or_phrase || '').localeCompare(a.word_or_phrase || '');
            case 'date-desc':
                return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
            case 'date-asc':
                return new Date(a.updated_at || a.created_at) - new Date(b.updated_at || b.created_at);
            default:
                return 0;
        }
    });
}

function renderFlashcardList() {
    const listContainer = document.getElementById('cards-list');
    
    if (!listContainer) {
        console.warn('Cards list container not found');
        return;
    }
    
    if (state.flashcards.length === 0) {
        listContainer.innerHTML = '<p class="text-center text-gray-500 py-8">No flashcards yet</p>';
        return;
    }
    
    // Use the helper function instead of inline sort
    const sortedCards = sortFlashcards(state.flashcards, state.sortOrder);
    
    listContainer.innerHTML = sortedCards.map((card) => {
        const originalIndex = state.flashcards.indexOf(card);
        return `
        <div class="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
            <div class="flex justify-between items-start">
                <div class="flex-1 cursor-pointer" onclick="selectCard(${originalIndex})">
                    <h3 class="font-semibold text-gray-900 text-lg mb-1">${card.word_or_phrase}</h3>
                    <p class="text-gray-600 text-sm line-clamp-2">${card.definition || 'No definition'}</p>
                </div>
                <div class="ml-4 flex space-x-2 items-center">
                    <button onclick="copyShareLink('${card.id}'); event.stopPropagation();" 
                        class="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Copy share link">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                        </svg>
                    </button>
                    <button onclick="showEditModal(state.flashcards[${originalIndex}]); event.stopPropagation();" 
                        class="p-2 text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="confirmDelete(state.flashcards[${originalIndex}]); event.stopPropagation();" 
                        class="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                    <span class="text-sm text-gray-500">${card.source && card.source.startsWith('ai_generated') ? '🤖' : '✍️'}</span>
                </div>
            </div>
        </div>
    `}).join('');
}

function selectCard(index) {
    state.currentCardIndex = index;
    switchMode('study');
    renderFlashcard(state.flashcards[index]);
    updateCardCounter();
}

// ========================================
// Tab Management
// ========================================

function switchTab(tabName) {
    console.log(`🔄 switchTab called with: "${tabName}"`);
    
    // Check if elements exist
    const tabButton = document.getElementById(`tab-${tabName}`);
    const contentDiv = document.getElementById(`content-${tabName}`);
    
    console.log(`🔍 Tab button found: ${!!tabButton}`, tabButton);
    console.log(`🔍 Content div found: ${!!contentDiv}`, contentDiv);
    
    if (!tabButton) {
        console.error(`❌ Tab button not found: tab-${tabName}`);
        return;
    }
    
    if (!contentDiv) {
        console.error(`❌ Content div not found: content-${tabName}`);
        return;
    }
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600');
        btn.classList.add('text-gray-600');
    });
    
    tabButton.classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600');
    tabButton.classList.remove('text-gray-600');
    
    // Show/hide content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    contentDiv.classList.remove('hidden');
    console.log(`✅ Successfully switched to ${tabName} tab`);
}

// ========================================
// Form Handlers (moved to DOMContentLoaded)
// ========================================

// ========================================
// Import Functionality
// ========================================

// Import event listeners will be added in DOMContentLoaded

function resetImportForm() {
    document.getElementById('import-file').value = '';
    document.getElementById('import-progress').classList.add('hidden');
    document.getElementById('import-results').classList.add('hidden');
}

async function downloadTemplate(format) {
    try {
        const response = await fetch(`${API_BASE}/import/template/${format}`);
        const data = await response.json();
        
        if (response.ok) {
            // Create and trigger download
            const blob = new Blob([data.content], { type: data.content_type });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showToast(`📄 Downloaded ${format.toUpperCase()} template`);
        } else {
            throw new Error(data.detail || 'Failed to download template');
        }
    } catch (error) {
        console.error('Error downloading template:', error);
        showToast(`❌ Failed to download template: ${error.message}`, 5000);
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validExtensions = ['csv', 'json'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        showToast('❌ Please select a CSV or JSON file', 5000);
        event.target.value = '';
        return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        showToast('❌ File too large. Maximum size is 10MB', 5000);
        event.target.value = '';
        return;
    }
    
    // Show progress
    showImportProgress();
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Update progress
        updateImportProgress(25, 'Uploading file...');
        
        const response = await fetch(`${API_BASE}/import/import`, {
            method: 'POST',
            body: formData
        });
        
        updateImportProgress(75, 'Processing file...');
        
        const result = await response.json();
        
        updateImportProgress(100, 'Complete!');
        
        if (response.ok) {
            showImportResults(result);
            
            // Refresh flashcards if we're on browse tab
            if (state.currentLanguage) {
                await loadFlashcards();
            }
            
            showToast(`✅ Import complete! ${result.successful_imports} cards imported`, 5000);
        } else {
            throw new Error(result.detail || 'Import failed');
        }
        
    } catch (error) {
        console.error('Import error:', error);
        showToast(`❌ Import failed: ${error.message}`, 8000);
        resetImportForm();
    }
}

function showImportProgress() {
    document.getElementById('import-progress').classList.remove('hidden');
    document.getElementById('import-results').classList.add('hidden');
}

function updateImportProgress(percentage, message) {
    document.getElementById('import-percentage').textContent = `${percentage}%`;
    document.getElementById('import-progress-bar').style.width = `${percentage}%`;
    
    if (message) {
        document.querySelector('#import-progress .text-sm').textContent = message;
    }
}

function showImportResults(result) {
    // Hide progress, show results
    document.getElementById('import-progress').classList.add('hidden');
    document.getElementById('import-results').classList.remove('hidden');
    
    // Update counters
    document.getElementById('successful-count').textContent = result.successful_imports || 0;
    document.getElementById('warning-count').textContent = result.warnings?.length || 0;
    document.getElementById('error-count').textContent = result.errors?.length || 0;
    
    // Show messages
    const messagesContainer = document.getElementById('import-messages');
    messagesContainer.innerHTML = '';
    
    // Add errors
    if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200';
            errorDiv.textContent = `❌ ${error}`;
            messagesContainer.appendChild(errorDiv);
        });
    }
    
    // Add warnings
    if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'text-sm text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200';
            warningDiv.textContent = `⚠️ ${warning}`;
            messagesContainer.appendChild(warningDiv);
        });
    }
    
    // Show success message if no errors/warnings
    if ((!result.errors || result.errors.length === 0) && (!result.warnings || result.warnings.length === 0)) {
        const successDiv = document.createElement('div');
        successDiv.className = 'text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200';
        successDiv.textContent = `✅ ${result.message}`;
        messagesContainer.appendChild(successDiv);
    }
    
    // Show imported cards preview
    const previewContainer = document.getElementById('imported-cards-list');
    previewContainer.innerHTML = '';
    
    if (result.imported_cards && result.imported_cards.length > 0) {
        document.getElementById('imported-cards-preview').classList.remove('hidden');
        
        result.imported_cards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'text-xs text-gray-600 p-1 bg-gray-50 rounded';
            cardDiv.textContent = `${card.word_or_phrase} → ${card.definition} (${card.language})`;
            previewContainer.appendChild(cardDiv);
        });
        
        if (result.successful_imports > result.imported_cards.length) {
            const moreDiv = document.createElement('div');
            moreDiv.className = 'text-xs text-gray-500 italic p-1';
            moreDiv.textContent = `... and ${result.successful_imports - result.imported_cards.length} more cards`;
            previewContainer.appendChild(moreDiv);
        }
    } else {
        document.getElementById('imported-cards-preview').classList.add('hidden');
    }
}

// Search functionality
let searchTimeout;
document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
            searchFlashcards(query);
        } else {
            // Restore original flashcards when search is cleared
            if (state.originalFlashcards) {
                state.flashcards = [...state.originalFlashcards];
                state.originalFlashcards = null;
                renderFlashcardList();
            }
            // Hide search stats
            document.getElementById('search-stats').classList.add('hidden');
        }
    }, 300);
});

async function searchFlashcards(query) {
    const searchLoading = document.getElementById('search-loading');
    const searchStats = document.getElementById('search-stats');
    
    try {
        // Show loading indicator
        searchLoading.classList.remove('hidden');
        searchStats.classList.add('hidden');
        
        console.log('Searching for:', query);
        console.log('🌍 Current language for search:', state.currentLanguage);
        
        // Sprint 5: Use offline-first search
        let searchResults = [];
        
        if (apiClient) {
            try {
                // Try API client first (works offline too)
                const languageId = state.currentLanguage && state.currentLanguage !== 'all' 
                    ? state.currentLanguage 
                    : null;
                searchResults = await apiClient.searchFlashcards(query, languageId);
            } catch (error) {
                console.warn('API client search failed, using local search:', error);
                // Fallback to local IndexedDB search
                if (offlineDB) {
                    const languageId = state.currentLanguage && state.currentLanguage !== 'all' 
                        ? state.currentLanguage 
                        : null;
                    searchResults = await offlineDB.searchFlashcards(query, languageId);
                }
            }
        } else {
            // Old API fallback
            try {
                const languageParam = state.currentLanguage && state.currentLanguage !== 'all' 
                    ? `&language_id=${state.currentLanguage}` 
                    : '';
                const searchUrl = `/flashcards/search?q=${encodeURIComponent(query)}${languageParam}&search_type=simple&limit=50`;
                const response = await apiRequest(searchUrl);
                searchResults = Array.isArray(response) ? response : [];
            } catch (error) {
                console.warn('Old API search failed:', error);
                searchResults = [];
            }
        }
        
        console.log('Search results:', searchResults);
        
        // Store original flashcards and show search results
        if (!state.originalFlashcards) {
            state.originalFlashcards = [...state.flashcards];
        }
        
        state.flashcards = searchResults;
        renderFlashcardList();
        
        // Show search stats
        searchStats.textContent = `Found ${searchResults.length} results`;
        searchStats.classList.remove('hidden');
        
    } catch (error) {
        console.error('Search failed:', error);
        showToast('Search failed. Please try again.', 'error');
        
        // Show error in stats
        searchStats.textContent = 'Search failed - please check if full-text search is set up';
        searchStats.classList.remove('hidden');
        searchStats.classList.add('text-red-500');
        
    } finally {
        // Hide loading indicator
        searchLoading.classList.add('hidden');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    
    // Handle keyboard navigation based on current mode
    if (state.currentMode === 'read') {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                previousReadCard();
                break;
            case 'ArrowRight':
            case ' ':
                e.preventDefault();
                nextReadCard();
                break;
        }
    } else if (state.currentMode === 'study') {
        switch(e.key) {
            case 'ArrowLeft':
                prevCard();
                break;
            case 'ArrowRight':
            case ' ':
                e.preventDefault();
                nextCard();
                break;
            case 'f':
                flipCard();
                break;
        }
    }
});

// Online/Offline detection
window.addEventListener('online', () => {
    state.isOnline = true;
    document.getElementById('offline-indicator').classList.add('hidden');
    showToast('✅ Back online - syncing data...');
    loadFlashcards();
});

window.addEventListener('offline', () => {
    state.isOnline = false;
    document.getElementById('offline-indicator').classList.remove('hidden');
    showToast('📡 You are offline - changes will sync later');
});

// ========================================
// Edit Flashcard Modal Functions
// ========================================

let currentEditingId = null;

function showEditModal(flashcard) {
    currentEditingId = flashcard.id;
    
    // Reset edit image data
    editImageData = null;
    
    // Populate form
    document.getElementById('edit-flashcard-id').value = flashcard.id;
    document.getElementById('edit-word').value = flashcard.word_or_phrase;
    document.getElementById('edit-definition').value = flashcard.definition || '';
    document.getElementById('edit-etymology').value = flashcard.etymology || '';
    document.getElementById('edit-cognates').value = flashcard.english_cognates || '';
    
    // Handle related words JSON
    let relatedWordsStr = '';
    try {
        const related = flashcard.related_words ? JSON.parse(flashcard.related_words) : [];
        relatedWordsStr = Array.isArray(related) ? related.join(', ') : related;
    } catch (e) {
        relatedWordsStr = flashcard.related_words || '';
    }
    document.getElementById('edit-related').value = relatedWordsStr;
    
    // Show/hide image section and set up image data
    if (flashcard.image_url) {
        document.getElementById('edit-image-section').classList.remove('hidden');
        document.getElementById('edit-image-preview').src = fixAssetUrl(flashcard.image_url);
        document.getElementById('edit-image-description').textContent = flashcard.image_description || 'Existing image';
        document.getElementById('regenerate-edit-image-btn').classList.remove('hidden');
        
        // Store current image data
        editImageData = {
            url: flashcard.image_url,
            description: flashcard.image_description || ''
        };
    } else {
        document.getElementById('edit-image-section').classList.add('hidden');
        document.getElementById('regenerate-edit-image-btn').classList.add('hidden');
    }
    
    // Reset loading states
    const editImageLoading = document.getElementById('edit-image-loading');
    if (editImageLoading) {
        editImageLoading.classList.add('hidden');
    }
    
    // Show modal
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        editModal.classList.remove('hidden');
    }
    
    // Attach event listeners for image generation buttons (fix for button not working)
    setupEditModalEventListeners();
}

function setupEditModalEventListeners() {
    console.log('Setting up edit modal event listeners...');
    
    const generateEditBtn = document.getElementById('generate-edit-image-btn');
    const regenerateEditBtn = document.getElementById('regenerate-edit-image-btn');
    const removeEditBtn = document.getElementById('remove-edit-image-btn');
    
    if (generateEditBtn) {
        console.log('Edit image generation button found, adding event listener');
        // Remove any existing listeners first
        generateEditBtn.replaceWith(generateEditBtn.cloneNode(true));
        const newGenerateBtn = document.getElementById('generate-edit-image-btn');
        newGenerateBtn.addEventListener('click', (e) => {
            console.log('Generate edit image button clicked!');
            e.preventDefault();
            generateImageForEditCard();
        });
    } else {
        console.error('Generate edit image button not found!');
    }
    
    if (regenerateEditBtn) {
        console.log('Regenerate edit image button found, adding event listener');
        regenerateEditBtn.replaceWith(regenerateEditBtn.cloneNode(true));
        const newRegenerateBtn = document.getElementById('regenerate-edit-image-btn');
        newRegenerateBtn.addEventListener('click', (e) => {
            console.log('Regenerate edit image button clicked!');
            e.preventDefault();
            generateImageForEditCard();
        });
    } else {
        console.error('Regenerate edit image button not found!');
    }
    
    if (removeEditBtn) {
        console.log('Remove edit image button found, adding event listener');
        removeEditBtn.replaceWith(removeEditBtn.cloneNode(true));
        const newRemoveBtn = document.getElementById('remove-edit-image-btn');
        newRemoveBtn.addEventListener('click', (e) => {
            console.log('Remove edit image button clicked!');
            e.preventDefault();
            removeEditImage();
        });
    } else {
        console.error('Remove edit image button not found!');
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    currentEditingId = null;
    editImageData = null;
}

async function saveEditedFlashcard() {
    console.log('💾 === SAVE EDITED FLASHCARD ===');
    console.log('Current editing ID:', currentEditingId);
    
    if (!currentEditingId) {
        console.error('❌ No currentEditingId set!');
        showToast('Error: No card selected for editing', 'error');
        return;
    }
    
    const word = document.getElementById('edit-word').value.trim();
    const definition = document.getElementById('edit-definition').value.trim();
    const etymology = document.getElementById('edit-etymology').value.trim();
    const cognates = document.getElementById('edit-cognates').value.trim();
    const relatedInput = document.getElementById('edit-related').value.trim();
    
    console.log('📝 Form values:', { word, definition, etymology, cognates, relatedInput });
    
    if (!word) {
        showToast('Word or phrase is required', 'error');
        return;
    }
    
    // Convert related words to JSON array
    let relatedWords = null;
    if (relatedInput) {
        try {
            const wordsArray = relatedInput.split(',').map(w => w.trim()).filter(w => w);
            relatedWords = JSON.stringify(wordsArray);
        } catch (e) {
            relatedWords = relatedInput;
        }
    }
    
    try {
        showLoading();
        
        // Build update data
        const updateData = {
            word_or_phrase: word,
            definition: definition || null,
            etymology: etymology || null,
            english_cognates: cognates || null,
            related_words: relatedWords
        };
        
        // Include image data if new image was generated
        if (editImageData) {
            updateData.image_url = editImageData.url;
            updateData.image_description = editImageData.description;
        }
        
        console.log('📤 Sending update request:', updateData);
        console.log('🎯 Target endpoint:', `/flashcards/${currentEditingId}`);
        
        const updated = await apiRequest(`/flashcards/${currentEditingId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        console.log('✅ Update successful! Response:', updated);
        
        // ⚠️ CRITICAL: Save the card ID BEFORE closing modal (which sets currentEditingId to null!)
        const savedCardId = currentEditingId;
        console.log(`💾 Saved card ID for later use: ${savedCardId}`);
        
        hideLoading();
        showToast('✅ Flashcard updated successfully!');
        closeEditModal();
        
        // Refresh the display
        console.log('🔄 Reloading flashcards with forceFresh...');
        await loadFlashcards({ forceFresh: true });
        
        // Find the edited card by ID (not by index, as order may have changed)
        console.log(`🔍 Searching for card ID: ${savedCardId}`);
        console.log(`🔍 Total flashcards loaded: ${state.flashcards.length}`);
        console.log(`🔍 First 3 card IDs:`, state.flashcards.slice(0, 3).map(c => c.id));
        
        const editedCardIndex = state.flashcards.findIndex(card => card.id === savedCardId);
        console.log(`🔍 Found edited card at index: ${editedCardIndex}`);
        
        if (editedCardIndex !== -1) {
            // Update the current index to the edited card
            state.currentCardIndex = editedCardIndex;
            console.log('🎨 Re-rendering edited card at new index');
            renderFlashcard(state.flashcards[editedCardIndex]);
            
            // Flip to show the back (details) since that's what was edited
            setTimeout(() => {
                const card = document.querySelector('.flashcard');
                if (card && !card.classList.contains('flipped')) {
                    card.classList.add('flipped');
                    state.isFlipped = true;
                    console.log('🔄 Flipped card to show edited details');
                }
            }, 100);
        } else {
            console.warn('⚠️ Edited card not found after reload');
            // Still render the current card if available
            if (state.flashcards[state.currentCardIndex]) {
                renderFlashcard(state.flashcards[state.currentCardIndex]);
            }
        }
        
        // If we're in browse mode, refresh the list
        if (document.getElementById('browse-mode').classList.contains('mode-content') && 
            !document.getElementById('browse-mode').classList.contains('hidden')) {
            console.log('📋 Refreshing browse list');
            renderFlashcardList();
        }
        
    } catch (error) {
        hideLoading();
        console.error('❌ Update error:', error);
        console.error('Error stack:', error.stack);
        showToast(`Failed to update flashcard: ${error.message}`, 'error');
    }
}

async function removeImageFromFlashcard() {
    if (!currentEditingId) return;
    
    try {
        showLoading();
        await apiRequest(`/flashcards/${currentEditingId}`, {
            method: 'PUT',
            body: JSON.stringify({ image_url: null })
        });
        
        hideLoading();
        document.getElementById('edit-image-section').classList.add('hidden');
        showToast('Image removed');
        
        // Update the current flashcard data
        const flashcard = state.flashcards.find(f => f.id === currentEditingId);
        if (flashcard) {
            flashcard.image_url = null;
        }
        
    } catch (error) {
        hideLoading();
        showToast('Failed to remove image', 'error');
        console.error('Remove image error:', error);
    }
}

// ========================================
// Delete Flashcard Modal Functions
// ========================================

let flashcardToDelete = null;

function confirmDelete(flashcard) {
    console.log('🗑️ === CONFIRM DELETE CALLED ===');
    console.log('🗑️ Flashcard to delete:', flashcard);
    flashcardToDelete = flashcard;
    document.getElementById('delete-word-display').textContent = flashcard.word_or_phrase;
    document.getElementById('delete-modal').classList.remove('hidden');
    console.log('🗑️ Modal should now be visible');
}

function closeDeleteModal() {
    console.log('🗑️ Closing delete modal');
    document.getElementById('delete-modal').classList.add('hidden');
    flashcardToDelete = null;
}

async function deleteFlashcard() {
    console.log('🗑️ === DELETE FLASHCARD CALLED ===');
    console.log('🗑️ Current flashcardToDelete:', flashcardToDelete);
    
    if (!flashcardToDelete) {
        console.error('❌ No flashcard to delete');
        return;
    }
    
    console.log('🗑️ Deleting flashcard:', flashcardToDelete.id, flashcardToDelete.word_or_phrase);
    
    try {
        showLoading();
        
        // Sprint 5: Use offline-first API client
        if (apiClient) {
            console.log('🔧 Using apiClient.deleteFlashcard()');
            await apiClient.deleteFlashcard(flashcardToDelete.id);
        } else {
            // Fallback to old API
            console.log('🔧 Using fallback apiRequest DELETE');
            await apiRequest(`/flashcards/${flashcardToDelete.id}`, {
                method: 'DELETE'
            });
        }
        
        console.log('✅ Delete successful');
        hideLoading();
        showToast('✅ Flashcard deleted');
        closeDeleteModal();
        
        // Reload flashcards from server/IndexedDB to ensure sync
        await loadFlashcards();
        
        // Update browse list immediately
        renderFlashcardList();
        
        // Handle study view navigation if needed
        if (state.flashcards.length === 0) {
            // No cards left
            document.getElementById('flashcard-container').innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <p class="text-lg mb-4">No flashcards yet for this language</p>
                    <p class="text-sm">Add your first flashcard using the "Add Card" button</p>
                </div>
            `;
            document.getElementById('study-controls').classList.add('hidden');
            state.currentCardIndex = 0;
        } else {
            // Navigate to first card or adjust current index
            state.currentCardIndex = Math.min(state.currentCardIndex, state.flashcards.length - 1);
            if (state.flashcards[state.currentCardIndex]) {
                renderFlashcard(state.flashcards[state.currentCardIndex]);
                updateCardCounter();
            }
        }
        
    } catch (error) {
        hideLoading();
        // TODO: Add user-friendly error message
        showToast('Failed to delete flashcard', 'error');
        console.error('Delete error:', error);
    }
}

function deleteFromEditModal() {
    closeEditModal();
    const card = state.flashcards.find(c => c.id === currentEditingId);
    if (card) confirmDelete(card);
}

// ========================================
// Sprint 5: Offline-First Initialization
// ========================================

/**
 * Initialize offline-first architecture
 */
async function initializeOfflineFirst() {
    console.log('\n� ===== INITIALIZE OFFLINE FIRST =====');
    performance.mark('T9-init-offline-start');
    const initStart = performance.now();
    window.timingCheckpoint?.('T9-init-offline-start', 'Starting offline-first initialization');
    
    try {
        // Step 1: Create OfflineDB instance
        console.log('📦 Step 1/5: Creating OfflineDB instance...');
        const dbCreateStart = performance.now();
        
        offlineDB = new OfflineDatabase();
        
        const dbCreateTime = performance.now() - dbCreateStart;
        console.log(`📦 OfflineDB instance created in ${dbCreateTime.toFixed(2)}ms`);
        
        // Step 2: Initialize IndexedDB
        console.log('📂 Step 2/5: Initializing IndexedDB...');
        const dbInitStart = performance.now();
        
        await offlineDB.init();
        
        const dbInitTime = performance.now() - dbInitStart;
        console.log(`📂 IndexedDB initialized in ${dbInitTime.toFixed(2)}ms`);
        
        if (dbInitTime > 1000) {
            console.error(`⚠️ WARNING: OfflineDB.init() took ${dbInitTime.toFixed(2)}ms (>1s)`);
            console.error('   This could be causing delays in app startup!');
        }
        
        // Step 3: Create SyncManager instance
        console.log('🔄 Step 3/5: Creating SyncManager...');
        const syncCreateStart = performance.now();
        
        syncManager = new SyncManager(offlineDB);
        
        const syncCreateTime = performance.now() - syncCreateStart;
        console.log(`🔄 SyncManager instance created in ${syncCreateTime.toFixed(2)}ms`);
        
        // Step 4: Initialize SyncManager
        console.log('🔄 Step 4/5: Initializing SyncManager (will start progressive sync)...');
        const syncInitStart = performance.now();
        
        await syncManager.init();
        
        const syncInitTime = performance.now() - syncInitStart;
        console.log(`🔄 SyncManager initialized in ${syncInitTime.toFixed(2)}ms`);
        
        if (syncInitTime > 1000) {
            console.error(`⚠️ WARNING: SyncManager.init() took ${syncInitTime.toFixed(2)}ms (>1s)`);
            console.error('   Progressive loading should be faster than this!');
        }
        
        // Step 5: Create ApiClient
        console.log('🌐 Step 5/5: Creating ApiClient...');
        const apiCreateStart = performance.now();
        
        apiClient = new ApiClient(offlineDB, syncManager);
        
        const apiCreateTime = performance.now() - apiCreateStart;
        console.log(`🌐 ApiClient created in ${apiCreateTime.toFixed(2)}ms`);
        
        // Total initialization time
        const totalInitTime = performance.now() - initStart;
        console.log(`✅ initializeOfflineFirst() COMPLETE in ${totalInitTime.toFixed(2)}ms (${(totalInitTime/1000).toFixed(3)}s)`);
        
        if (totalInitTime > 2000) {
            console.error(`🚨 CRITICAL: initializeOfflineFirst() took ${totalInitTime.toFixed(2)}ms (>2s)`);
            console.error('   This is likely causing significant startup delay!');
        }
        
        performance.mark('T9-init-offline-end');
        performance.measure('init-offline-time', 'T9-init-offline-start', 'T9-init-offline-end');
        window.timingCheckpoint?.('T9-init-offline-complete', `Offline-first initialization complete (${totalInitTime.toFixed(2)}ms)`);
        
        console.log('🔧 ===== OFFLINE FIRST COMPLETE =====\n');
        
        // Setup sync button
        setupSyncButton();
        
    // (No debug buttons to set up here; handled after DOMContentLoaded)
        
        // Update UI with initial status
        updateSyncStatus();
        
        // Start periodic status updates
        setInterval(updateSyncStatus, 30000); // Update every 30 seconds
        
    } catch (error) {
        const errorTime = performance.now() - initStart;
        console.error(`❌ Failed to initialize offline-first after ${errorTime.toFixed(2)}ms:`, error);
        console.error('Error stack:', error.stack);
        window.timingCheckpoint?.('T9-ERROR-init-failed', `Initialization failed: ${error.message}`);
        showToast('Failed to initialize offline features', 5000);
        throw error; // Re-throw to prevent app from continuing in broken state
    }
}

/**
 * Setup manual sync button
 */
function setupSyncButton() {
    const syncButton = document.getElementById('sync-button');
    if (syncButton) {
        syncButton.addEventListener('click', async () => {
            console.log('🔄 Manual sync requested');
            
            syncButton.disabled = true;
            syncButton.textContent = '🔄 Syncing...';
            
            try {
                await apiClient.forceSync();
                showToast('Sync completed successfully!');
            } catch (error) {
                console.error('❌ Manual sync failed:', error);
                showToast('Sync failed - will retry automatically', 5000);
            } finally {
                syncButton.disabled = false;
                syncButton.textContent = '🔄 Sync';
            }
        });
    }
}

/**
 * Update sync status display
 */
async function updateSyncStatus() {
    if (syncManager && offlineDB) {
        try {
            const status = await syncManager.getSyncStatus();
            state.syncStatus = status.online ? 'online' : 'offline';
            // Update hamburger menu sync stats
            const localCountMenu = document.getElementById('local-flashcards-count-menu');
            const pendingCountMenu = document.getElementById('pending-sync-count-menu');
            const networkStatusMenu = document.getElementById('network-status-menu');
            if (localCountMenu && status.stats) {
                localCountMenu.textContent = status.stats.flashcardsCount || 0;
            }
            if (pendingCountMenu) {
                pendingCountMenu.textContent = status.pendingOperations || 0;
            }
            if (networkStatusMenu) {
                networkStatusMenu.textContent = status.online ? '🟢' : '🔴';
                networkStatusMenu.className = status.online ? 'font-mono text-green-500' : 'font-mono text-red-500';
            }
            // Update minimalist online indicator dot and alt text
            const onlineDot = document.getElementById('online-dot');
            if (onlineDot) {
                if (status.online) {
                    onlineDot.classList.remove('bg-red-500');
                    onlineDot.classList.add('bg-green-500');
                    onlineDot.setAttribute('aria-label', 'Online');
                } else {
                    onlineDot.classList.remove('bg-green-500');
                    onlineDot.classList.add('bg-red-500');
                    onlineDot.setAttribute('aria-label', 'Offline');
                }
                // Alt text for last sync
                let lastSync = status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleString() : 'Never';
                onlineDot.parentElement.title = `Last sync: ${lastSync}`;
            }
        } catch (error) {
            console.error('Failed to update sync status:', error);
        }
    }
}

/**
 * Setup debug buttons for testing
 */
function setupDebugButtons() {
    // Test Offline Study Mode
    const testOfflineBtn = document.getElementById('test-offline-btn');
    if (testOfflineBtn) {
        testOfflineBtn.addEventListener('click', async () => {
            debugLog('🧪 Testing offline study mode...');
            
            try {
                // Add some sample cards to IndexedDB for offline study
                debugLog('📚 Adding sample study cards to IndexedDB...');
                debugLog(`🌍 Current language state: ${state.currentLanguage}`);
                
                const sampleCards = [
                    {
                        id: -1001,
                        word_or_phrase: 'bonjour',
                        definition: 'hello (French greeting)',
                        language_id: state.currentLanguage || 9, // Use French (9) as default for French words
                        etymology: 'From Old French bon jorn (good day)',
                        english_cognates: 'bonus, journal',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        synced: false
                    },
                    {
                        id: -1002,
                        word_or_phrase: 'merci',
                        definition: 'thank you (French)',
                        language_id: state.currentLanguage || 9, // Use French (9) as default for French words
                        etymology: 'From Latin merces (wages, reward)',
                        english_cognates: 'mercy, merchant',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        synced: false
                    },
                    {
                        id: -1003,
                        word_or_phrase: 'au revoir',
                        definition: 'goodbye (French farewell)',
                        language_id: state.currentLanguage || 9, // Use French (9) as default for French words
                        etymology: 'Literally "until seeing again"',
                        english_cognates: 'revise, review',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        synced: false
                    }
                ];
                
                for (const card of sampleCards) {
                    await offlineDB.saveFlashcard(card);
                    debugLog(`  ✅ Added: ${card.word_or_phrase} (language_id: ${card.language_id})`);
                }
                
                debugLog('🎯 Sample cards ready for offline study!');
                debugLog('💡 Now you can study these cards even without internet');
                debugLog('� Try switching to Study tab to browse offline cards');
                
                // Reload the current view to show the new cards
                await loadFlashcards();
                await updateSyncStatus();
                
            } catch (error) {
                debugLog(`❌ Offline setup failed: ${error.message}`);
            }
        });
    }
    
    // Test Sync Queue
    const testSyncBtn = document.getElementById('test-sync-btn');
    if (testSyncBtn) {
        testSyncBtn.addEventListener('click', async () => {
            debugLog('🔄 Testing sync queue...');
            
            try {
                const queue = await offlineDB.getSyncQueue();
                debugLog(`📋 Found ${queue.length} operations in queue:`);
                
                queue.forEach((op, i) => {
                    debugLog(`  ${i+1}. ${op.type} ${op.entity} (ID: ${op.entityId})`);
                });
                
                if (navigator.onLine) {
                    debugLog('🌐 Online - triggering sync...');
                    await syncManager.sync();
                    debugLog('✅ Sync completed!');
                } else {
                    debugLog('📴 Offline - cannot sync now');
                }
                
                await updateSyncStatus();
                
            } catch (error) {
                debugLog(`❌ Sync test failed: ${error.message}`);
            }
        });
    }
    
    // Clear Local DB (menu)
    const clearDbBtnMenu = document.getElementById('clear-db-btn-menu');
    if (clearDbBtnMenu) {
        clearDbBtnMenu.addEventListener('click', async () => {
            if (confirm('Clear all local data? This cannot be undone!')) {
                debugLog('🗑️ Clearing local database...');
                try {
                    await offlineDB.clear();
                    debugLog('✅ Local database cleared');
                    location.reload();
                } catch (error) {
                    debugLog(`❌ Clear failed: ${error.message}`);
                }
            }
        });
    }
    
    // Simulate Airplane Mode
    const simulateAirplaneBtn = document.getElementById('simulate-airplane-btn');
    if (simulateAirplaneBtn) {
        let airplaneModeActive = false;
        
        simulateAirplaneBtn.addEventListener('click', async () => {
            airplaneModeActive = !airplaneModeActive;
            
            if (airplaneModeActive) {
                debugLog('✈️ Simulating airplane mode - blocking network requests');
                simulateAirplaneBtn.textContent = '🌐 Go Online';
                simulateAirplaneBtn.className = 'px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm';
                
                // Override fetch to simulate network failure
                window.originalFetch = window.fetch;
                window.fetch = async (...args) => {
                    debugLog(`🚫 Blocked network request: ${args[0]}`);
                    throw new Error('Network unavailable (airplane mode simulation)');
                };
                
                debugLog('📱 Now try studying cards or browsing - should work offline!');
                
            } else {
                debugLog('🌐 Back online - network requests enabled');
                simulateAirplaneBtn.textContent = '✈️ Simulate Offline';
                simulateAirplaneBtn.className = 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm';
                
                // Restore original fetch
                if (window.originalFetch) {
                    window.fetch = window.originalFetch;
                    delete window.originalFetch;
                }
                
                debugLog('🔄 Triggering sync now that we\'re back online...');
                if (syncManager) {
                    await syncManager.sync();
                }
            }
            
            await updateSyncStatus();
        });
    }
}

/**
 * Debug logging to on-screen console
 */
function debugLog(message) {
    const debugLogMenu = document.getElementById('debug-log-menu');
    if (debugLogMenu) {
        const timestamp = new Date().toLocaleTimeString();
        const logLine = `[${timestamp}] ${message}\n`;
        debugLogMenu.textContent += logLine;
        debugLogMenu.scrollTop = debugLogMenu.scrollHeight;
    }
    console.log(`[DEBUG] ${message}`);
}

// ========================================
// Initialize App
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('\n🚀 ===== DOM CONTENT LOADED =====');
    performance.mark('T10-dom-ready');
    const domReadyTime = performance.now();
    const timeSincePageStart = domReadyTime - (window.pageLoadStart || 0);
    
    console.log(`🚀 DOMContentLoaded fired at ${domReadyTime.toFixed(2)}ms (${timeSincePageStart.toFixed(2)}ms from page start)`);
    window.timingCheckpoint?.('T10-dom-ready', `DOM ready, starting app initialization`);
    
    // Sprint 5: Initialize offline-first architecture
    console.log('\n⏱️ Starting offline-first initialization...');
    const initStart = performance.now();
    
    try {
        await initializeOfflineFirst();
        
        const initTime = performance.now() - initStart;
        console.log(`⏱️ Offline-first initialized in ${initTime.toFixed(2)}ms`);
        window.timingCheckpoint?.('T11-offline-init-done', `Offline initialization complete (${initTime.toFixed(2)}ms)`);
        
    } catch (error) {
        const errorTime = performance.now() - initStart;
        console.error(`❌ Offline initialization failed after ${errorTime.toFixed(2)}ms:`, error);
        // Continue despite error - app may still work in degraded mode
    }
    
    // Initialize new UI (mode toggle & hamburger menu)
    console.log('\n🎨 Initializing UI...');
    const uiStart = performance.now();
    
    initializeNewUI();
    
    const uiTime = performance.now() - uiStart;
    console.log(`🎨 UI initialized in ${uiTime.toFixed(2)}ms`);
    window.timingCheckpoint?.('T12-ui-initialized', `UI controls ready (${uiTime.toFixed(2)}ms)`);
    
    // Setup debug panel (menu)
    setupDebugButtons();
    
    // Debug: Check if all tab elements exist
    const tabs = ['study', 'add', 'import', 'browse'];
    tabs.forEach(tab => {
        const button = document.getElementById(`tab-${tab}`);
        const content = document.getElementById(`content-${tab}`);
        console.log(`🔍 Tab "${tab}":`, {
            button: !!button,
            content: !!content,
            buttonElement: button,
            contentElement: content
        });
    });
    
    console.log('\n📚 Loading languages and initializing batch IPA...');
    const languagesStart = performance.now();
    
    await loadLanguages();  // ✅ FIX: Added await so URL parameters can work correctly
    initializeBatchIPA();
    
    const languagesTime = performance.now() - languagesStart;
    console.log(`📚 Languages loaded in ${languagesTime.toFixed(2)}ms`);
    
    // ✅ FIX: Check for URL parameters AFTER languages are loaded
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get('cardId');
    const word = urlParams.get('word');
    const language = urlParams.get('language');
    
    if (cardId || (word && language)) {
        console.log('🔗 URL parameters detected:', { cardId, word, language });
        
        try {
            let targetCard = null;
            
            if (cardId) {
                // Fetch specific card by ID
                console.log(`🔍 Fetching card by ID: ${cardId}`);
                const response = await fetch(`/api/flashcards/${cardId}`, {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    targetCard = await response.json();
                    
                    // Set language
                    if (targetCard.language_id) {
                        state.currentLanguage = targetCard.language_id;
                        document.getElementById('language-select').value = targetCard.language_id;
                    }
                    
                    // Load flashcards for that language
                    await loadFlashcards();
                    
                    // Find card index in loaded flashcards
                    const cardIndex = state.flashcards.findIndex(c => c.id === cardId);
                    if (cardIndex !== -1) {
                        state.currentCardIndex = cardIndex;
                        switchMode('study');
                        renderFlashcard(state.flashcards[cardIndex]);
                        showToast('📖 Opened shared card!', 3000);
                    } else {
                        // Card not in list, add it temporarily
                        state.flashcards.push(targetCard);
                        state.currentCardIndex = state.flashcards.length - 1;
                        switchMode('study');
                        renderFlashcard(targetCard);
                        showToast('📖 Opened shared card!', 3000);
                    }
                } else {
                    showToast('❌ Card not found', 5000);
                }
            } else if (word && language) {
                // Search for card by word and language
                console.log(`🔍 Searching for: ${word} in ${language}`);
                
                // Find language ID by name
                const languageEl = Array.from(document.getElementById('language-select').options)
                    .find(opt => opt.text.toLowerCase() === language.toLowerCase());
                
                if (languageEl) {
                    state.currentLanguage = languageEl.value;
                    document.getElementById('language-select').value = languageEl.value;
                    
                    // Load flashcards
                    await loadFlashcards();
                    
                    // Find card by word
                    const cardIndex = state.flashcards.findIndex(c => 
                        c.word_or_phrase.toLowerCase() === word.toLowerCase()
                    );
                    
                    if (cardIndex !== -1) {
                        state.currentCardIndex = cardIndex;
                        switchMode('study');
                        renderFlashcard(state.flashcards[cardIndex]);
                        showToast(`📖 Opened: ${word}`, 3000);
                    } else {
                        showToast(`❌ Word "${word}" not found`, 5000);
                    }
                } else {
                    showToast(`❌ Language "${language}" not found`, 5000);
                }
            }
        } catch (error) {
            console.error('❌ Error loading shared card:', error);
            showToast('❌ Failed to load shared card', 5000);
        }
    }
    
    // CRITICAL MILESTONE: Calculate total time to this point
    const totalTime = performance.now() - (window.pageLoadStart || 0);
    console.log('\n' + '='.repeat(80));
    console.log(`📊 APP INITIALIZATION CHECKPOINT`);
    console.log(`   Time since page load: ${totalTime.toFixed(2)}ms (${(totalTime/1000).toFixed(3)}s)`);
    console.log(`   Offline init: ${(performance.now() - initStart).toFixed(2)}ms`);
    console.log(`   UI init: ${uiTime.toFixed(2)}ms`);
    console.log('='.repeat(80) + '\n');
    
    if (totalTime > 10000) {
        console.error(`🚨 CRITICAL: ${(totalTime/1000).toFixed(1)}s elapsed - app is taking too long to initialize!`);
    }
    
    // ========================================
    // Form Event Listeners
    // ========================================
    
    // Create flashcard form
    const createForm = document.getElementById('create-flashcard-form');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const word = document.getElementById('word-input').value;
            const definition = document.getElementById('definition-input').value;
            const etymology = document.getElementById('etymology-input').value;
            const cognates = document.getElementById('cognates-input').value;
            const relatedInput = document.getElementById('related-input').value;
            
            // Convert related words to JSON array
            const relatedWords = relatedInput ? JSON.stringify(relatedInput.split(',').map(w => w.trim())) : null;
            
            // Include image data if available
            const flashcardData = {
                word_or_phrase: word,
                definition: definition || null,
                etymology: etymology || null,
                english_cognates: cognates || null,
                related_words: relatedWords
            };
            
            // Add image data if generated
            if (manualImageData) {
                flashcardData.image_url = manualImageData.url;
                flashcardData.image_description = manualImageData.description;
            }
            
            await createFlashcard(flashcardData);
            
            // Clear form and reset image data
            e.target.reset();
            removeManualImage();
        });
    }
    
    // AI generate button
    const aiGenerateBtn = document.getElementById('ai-generate-btn');
    if (aiGenerateBtn) {
        aiGenerateBtn.addEventListener('click', async () => {
            const word = document.getElementById('ai-word-input').value.trim();
            const includeImage = document.getElementById('include-image').checked;
            
            if (!word) {
                showToast('Please enter a word or phrase');
                return;
            }
            
            await generateAIFlashcard(word, includeImage);
            
            // Clear input
            document.getElementById('ai-word-input').value = '';
        });
    }
    
    // Language selector
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', async (e) => {
            state.currentLanguage = e.target.value;
            
            // Save selected language to localStorage
            localStorage.setItem('lastSelectedLanguage', state.currentLanguage);
            
            // Dispatch custom event for language change
            document.dispatchEvent(new CustomEvent('languageChanged', { 
                detail: { languageId: state.currentLanguage } 
            }));
            
            if (state.currentLanguage) {
                await loadFlashcards();
            }
        });
    }
    
    // Tab buttons
    const studyTab = document.getElementById('tab-study');
    const addTab = document.getElementById('tab-add');
    const importTab = document.getElementById('tab-import');
    const batchTab = document.getElementById('tab-batch');
    const browseTab = document.getElementById('tab-browse');
    
    // Debug: Check if all tab elements are found
    console.log('🐛 DEBUG: Tab elements found:');
    console.log('🐛 DEBUG: studyTab:', !!studyTab);
    console.log('🐛 DEBUG: addTab:', !!addTab);
    console.log('🐛 DEBUG: importTab:', !!importTab);
    console.log('🐛 DEBUG: batchTab:', !!batchTab);
    console.log('🐛 DEBUG: browseTab:', !!browseTab);
    
    if (studyTab) {
        studyTab.addEventListener('click', () => {
            console.log('🔄 Switching to study tab');
            switchTab('study');
        });
    }
    
    if (addTab) {
        addTab.addEventListener('click', () => {
            console.log('🔄 Switching to add tab');
            switchTab('add');
        });
    }
    
    if (importTab) {
        importTab.addEventListener('click', () => {
            console.log('🔄 Switching to import tab');
            switchTab('import');
        });
    }
    
    if (batchTab) {
        batchTab.addEventListener('click', () => {
            console.log('🔄 Switching to batch tab');
            switchTab('batch');
        });
    }
    
    if (browseTab) {
        browseTab.addEventListener('click', () => {
            console.log('🔄 Switching to browse tab');
            switchTab('browse');
        });
    }
    
    // Navigation buttons
    const nextCardBtn = document.getElementById('next-card');
    const prevCardBtn = document.getElementById('prev-card');
    
    if (nextCardBtn) {
        nextCardBtn.addEventListener('click', nextCard);
    }
    
    if (prevCardBtn) {
        prevCardBtn.addEventListener('click', prevCard);
    }
    
    // Manual/AI form toggle
    const btnManual = document.getElementById('btn-manual');
    const btnAI = document.getElementById('btn-ai');
    
    if (btnManual) {
        btnManual.addEventListener('click', function() {
            document.getElementById('manual-form').classList.remove('hidden');
            document.getElementById('ai-form').classList.add('hidden');
            this.classList.add('bg-indigo-600', 'text-white');
            this.classList.remove('bg-gray-200', 'text-gray-700');
            if (btnAI) {
                btnAI.classList.remove('bg-indigo-600', 'text-white');
                btnAI.classList.add('bg-gray-200', 'text-gray-700');
            }
        });
    }
    
    if (btnAI) {
        btnAI.addEventListener('click', function() {
            document.getElementById('ai-form').classList.remove('hidden');
            document.getElementById('manual-form').classList.add('hidden');
            this.classList.add('bg-indigo-600', 'text-white');
            this.classList.remove('bg-gray-200', 'text-gray-700');
            if (btnManual) {
                btnManual.classList.remove('bg-indigo-600', 'text-white');
                btnManual.classList.add('bg-gray-200', 'text-gray-700');
            }
        });
    }
    
    // ✅ FIX: Initialize button states based on which form is currently visible
    if (btnManual && btnAI) {
        const manualForm = document.getElementById('manual-form');
        const aiForm = document.getElementById('ai-form');
        
        if (manualForm && aiForm) {
            // Check which form is visible (not hidden)
            if (!manualForm.classList.contains('hidden')) {
                // Manual form is visible
                btnManual.classList.add('bg-indigo-600', 'text-white');
                btnManual.classList.remove('bg-gray-200', 'text-gray-700');
                btnAI.classList.remove('bg-indigo-600', 'text-white');
                btnAI.classList.add('bg-gray-200', 'text-gray-700');
                console.log('📋 Initialized button state: Manual form visible');
            } else if (!aiForm.classList.contains('hidden')) {
                // AI form is visible
                btnAI.classList.add('bg-indigo-600', 'text-white');
                btnAI.classList.remove('bg-gray-200', 'text-gray-700');
                btnManual.classList.remove('bg-indigo-600', 'text-white');
                btnManual.classList.add('bg-gray-200', 'text-gray-700');
                console.log('📋 Initialized button state: AI form visible');
            }
        }
    }
    
    // Check online status on load
    if (!navigator.onLine) {
        state.isOnline = false;
        document.getElementById('offline-indicator').classList.remove('hidden');
    }
    
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/static/sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration.scope);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }
    
    // Edit modal event listeners
    const editForm = document.getElementById('edit-flashcard-form');
    const closeEditBtn = document.getElementById('close-edit-modal');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    // Note: 'remove-image-btn' doesn't exist - using correct IDs per form
    const removeImageBtn = null; // Will be handled per-form
    
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveEditedFlashcard();
        });
    } else {
        console.warn('⚠️ Edit form not found');
    }
    
    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', closeEditModal);
    } else {
        console.warn('⚠️ Close edit button not found');
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditModal);
    } else {
        console.warn('⚠️ Cancel edit button not found');
    }
    
    // Regenerate audio button in edit modal
    const regenerateEditAudioBtn = document.getElementById('regenerate-edit-audio-btn');
    if (regenerateEditAudioBtn) {
        regenerateEditAudioBtn.addEventListener('click', async () => {
            const cardId = document.getElementById('edit-flashcard-id').value;
            const word = document.getElementById('edit-word').value;
            const statusDiv = document.getElementById('edit-audio-status');
            
            if (!cardId || !word) {
                showToast('Please enter a word first');
                return;
            }
            
            try {
                // Show status
                statusDiv.textContent = 'Generating audio...';
                statusDiv.classList.remove('hidden');
                regenerateEditAudioBtn.disabled = true;
                regenerateEditAudioBtn.textContent = '🔄 Generating...';
                
                // Generate audio
                await generateAudio(cardId, word);
                
                // Success
                statusDiv.textContent = '✅ Audio regenerated successfully!';
                setTimeout(() => {
                    statusDiv.classList.add('hidden');
                }, 3000);
                
            } catch (error) {
                console.error('Failed to regenerate audio:', error);
                statusDiv.textContent = '❌ Failed to regenerate audio';
                showToast('Failed to regenerate audio');
            } finally {
                regenerateEditAudioBtn.disabled = false;
                regenerateEditAudioBtn.textContent = '🔊 Regenerate Audio';
            }
        });
    } else {
        console.warn('⚠️ Regenerate edit audio button not found');
    }
    
    // Note: remove-image-btn doesn't exist - image removal is handled per-form
    // removeImageFromFlashcard is called from edit modal buttons
    console.log('ℹ️ Image removal buttons are handled per-form (manual/edit)');
    
    // Close modal when clicking outside
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                closeEditModal();
            }
        });
    } else {
        console.warn('⚠️ Edit modal not found');
    }
    
    // Delete modal event listeners
    console.log('🗑️ Setting up delete modal event listeners...');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const deleteFromEditBtn = document.getElementById('delete-from-edit-btn');
    
    console.log('🗑️ Delete buttons found:', {
        confirmDeleteBtn: !!confirmDeleteBtn,
        cancelDeleteBtn: !!cancelDeleteBtn,
        deleteFromEditBtn: !!deleteFromEditBtn
    });
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteFlashcard);
    } else {
        console.warn('⚠️ Confirm delete button not found');
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    } else {
        console.warn('⚠️ Cancel delete button not found');
    }
    
    if (deleteFromEditBtn) {
        deleteFromEditBtn.addEventListener('click', deleteFromEditModal);
    } else {
        console.warn('⚠️ Delete from edit button not found');
    }
    
    // Close delete modal when clicking outside
    const deleteModal = document.getElementById('delete-modal');
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') {
                closeDeleteModal();
            }
        });
    } else {
        console.warn('⚠️ Delete modal not found');
    }
    
    // Sort dropdown event listener
    console.log('📋 Setting up sort dropdown...');
    const sortDropdown = document.getElementById('sort-dropdown');
    if (sortDropdown) {
        // Set initial value from state
        sortDropdown.value = state.sortOrder;
        console.log('📋 Sort dropdown initialized with saved order:', state.sortOrder);
        
        sortDropdown.addEventListener('change', (e) => {
            console.log('📋 Sort order changed to:', e.target.value);
            state.sortOrder = e.target.value;
            localStorage.setItem('flashcard_sort_order', e.target.value);
            renderFlashcardList();
        });
        console.log('✅ Sort dropdown initialized');
    } else {
        console.warn('⚠️ Sort dropdown not found');
    }
    
    // Clear form button
    const clearFormBtn = document.getElementById('clear-form-btn');
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', () => {
            document.getElementById('create-flashcard-form').reset();
            removeManualImage();
            showToast('Form cleared');
        });
    } else {
        console.warn('⚠️ Clear form button not found');
    }
    
    // Image generation event listeners
    const generateManualBtn = document.getElementById('generate-manual-image-btn');
    const removeManualBtn = document.getElementById('remove-manual-image-btn');
    
    if (generateManualBtn) {
        console.log('Manual image generation button found, adding event listener');
        generateManualBtn.addEventListener('click', (e) => {
            console.log('Generate manual image button clicked!');
            e.preventDefault();
            generateImageForManualCard();
        });
    } else {
        console.error('Generate manual image button not found!');
    }
    
    if (removeManualBtn) {
        removeManualBtn.addEventListener('click', removeManualImage);
    } else {
        console.warn('Remove manual image button not found (this is expected initially)');
    }
    
    // Edit image generation event listeners are now set up in showEditModal() function
    
    // Enable/disable manual image generation button based on word input
    const wordInput = document.getElementById('word-input');
    const generateBtn = document.getElementById('generate-manual-image-btn');
    
    function updateGenerateButtonState() {
        if (wordInput && generateBtn) {
            const hasText = wordInput.value.trim().length > 0;
            const hasLanguage = !!state.currentLanguage;
            const canGenerate = hasText && hasLanguage;
            
            console.log('Updating button state:', { hasText, hasLanguage, canGenerate, currentLanguage: state.currentLanguage });
            
            generateBtn.disabled = !canGenerate;
            
            if (canGenerate) {
                generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                generateBtn.title = 'Click to generate image';
            } else {
                generateBtn.classList.add('opacity-50', 'cursor-not-allowed');
                generateBtn.title = hasText ? 'Please select a language first' : 'Enter a word or phrase first';
            }
        }
    }
    
    if (wordInput && generateBtn) {
        console.log('Setting up word input and language change listeners');
        wordInput.addEventListener('input', updateGenerateButtonState);
        
        // Also update when language changes
        document.addEventListener('languageChanged', updateGenerateButtonState);
        
        // Initial state
        updateGenerateButtonState();
    } else {
        console.warn('Word input or generate button not found for manual image generation');
    }
    
    // Import functionality event listeners
    console.log('🔍 Setting up import event listeners...');
    
    const importFileInput = document.getElementById('import-file');
    const csvTemplateBtn = document.getElementById('download-csv-template');
    const jsonTemplateBtn = document.getElementById('download-json-template');
    const importAnotherBtn = document.getElementById('import-another');
    
    console.log('🔍 Import elements found:', {
        importFileInput: !!importFileInput,
        csvTemplateBtn: !!csvTemplateBtn,
        jsonTemplateBtn: !!jsonTemplateBtn,
        importAnotherBtn: !!importAnotherBtn
    });
    
    if (importFileInput) {
        console.log('✅ Adding file upload listener');
        importFileInput.addEventListener('change', handleFileUpload);
    } else {
        console.error('❌ Import file input not found');
    }
    
    if (csvTemplateBtn) {
        console.log('✅ Adding CSV template listener');
        csvTemplateBtn.addEventListener('click', () => {
            console.log('🔄 CSV template button clicked');
            downloadTemplate('csv');
        });
    } else {
        console.error('❌ CSV template button not found');
    }
    
    if (jsonTemplateBtn) {
        console.log('✅ Adding JSON template listener');
        jsonTemplateBtn.addEventListener('click', () => {
            console.log('🔄 JSON template button clicked');
            downloadTemplate('json');
        });
    } else {
        console.error('❌ JSON template button not found');
    }
    
    if (importAnotherBtn) {
        console.log('✅ Adding import another listener');
        importAnotherBtn.addEventListener('click', resetImportForm);
    } else {
        console.warn('⚠️ Import another button not found (this is expected initially)');
    }

    // Navigation buttons for Import tab
    const importToBrowseBtn = document.getElementById('import-to-browse');
    const importToStudyBtn = document.getElementById('import-to-study');
    
    if (importToBrowseBtn) {
        importToBrowseBtn.addEventListener('click', () => {
            console.log('📚 Navigate to Browse from Import');
            switchMode('browse');
        });
    }
    
    if (importToStudyBtn) {
        importToStudyBtn.addEventListener('click', () => {
            console.log('🎯 Navigate to Study from Import');
            switchToStudyMode();
        });
    }
    
    // Navigation button for Batch Generation Results
    const batchToStudyBtn = document.getElementById('batch-to-study');
    
    if (batchToStudyBtn) {
        batchToStudyBtn.addEventListener('click', () => {
            console.log('🎯 Navigate to Study from Batch Results');
            switchToStudyMode();
        });
    }
    
    // Status banner close button
    const statusBannerClose = document.getElementById('status-banner-close');
    if (statusBannerClose) {
        statusBannerClose.addEventListener('click', hideStatusBanner);
    }

    // Document Parser Setup
    console.log('🔍 Setting up document parser event listeners...');
    
    const parserOption = document.getElementById('parser-option');
    const documentFileInput = document.getElementById('document-file');
    const importParsedBtn = document.getElementById('import-parsed');
    const parseAnotherBtn = document.getElementById('parse-another');
    
    console.log('🔍 Parser elements found:', {
        parserOption: !!parserOption,
        documentFileInput: !!documentFileInput,
        importParsedBtn: !!importParsedBtn,
        parseAnotherBtn: !!parseAnotherBtn
    });
    
    // Auto-select parser method (it's the only option now)
    if (parserOption) {
        selectImportMethod('parser');
    }
    
    if (documentFileInput) {
        documentFileInput.addEventListener('change', handleDocumentUpload);
    }
    
    if (parseAnotherBtn) {
        parseAnotherBtn.addEventListener('click', () => {
            resetParserForm();
            selectImportMethod('parser');
        });
    }
    
    // Clear batch import when language changes
    document.addEventListener('languageChanged', () => {
        console.log('🌍 Language changed - clearing batch import');
        
        // Clear parsed entries display
        const entriesContainer = document.getElementById('parsed-entries-container');
        if (entriesContainer) {
            entriesContainer.innerHTML = '';
        }
        
        // Hide results section, show upload section
        const resultsSection = document.getElementById('parser-results-section');
        const uploadSection = document.getElementById('parser-upload-section');
        if (resultsSection) resultsSection.classList.add('hidden');
        if (uploadSection) uploadSection.classList.remove('hidden');
        
        // Reset file input
        const fileInput = document.getElementById('document-file');
        if (fileInput) {
            fileInput.value = '';
        }
    });
});

// Document Parser Functions
function selectImportMethod(method) {
    const parserUploadSection = document.getElementById('parser-upload-section');
    
    if (method === 'parser') {
        parserUploadSection.classList.remove('hidden');
    }
}

async function handleDocumentUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type (only .txt now)
    const validExtensions = ['txt'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        showToast('❌ Please select a text file (.txt)', 5000);
        event.target.value = '';
        return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        showToast('❌ File too large. Maximum size is 10MB', 5000);
        event.target.value = '';
        return;
    }
    
    // Show progress
    showParserProgress();
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', state.currentLanguage || 'fr'); // Default to French
        
        // ✅ FIX: Correct endpoint is /api/document/parse (not /api/parser/parse-document)
        const response = await fetch(`${API_BASE}/document/parse`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showParserResults(result);
            showToast(`📄 Document parsed! Found ${result.entries.length} vocabulary entries`, 5000);
        } else {
            throw new Error(result.detail || 'Document parsing failed');
        }
        
    } catch (error) {
        console.error('Document parsing error:', error);
        showToast(`❌ Document parsing failed: ${error.message}`, 15000);
        resetParserForm();
    }
}

function showParserProgress() {
    document.getElementById('parser-progress').classList.remove('hidden');
    document.getElementById('parser-results').classList.add('hidden');
}

function showParserResults(result) {
    console.log('📄 showParserResults called with:', result);
    console.log('📄 Number of entries:', result.entries.length);
    console.log('📄 First few entries:', result.entries.slice(0, 3));
    
    // Hide progress, show results
    document.getElementById('parser-progress').classList.add('hidden');
    document.getElementById('parser-results').classList.remove('hidden');
    
    // Store parsed entries for later import
    window.parsedEntries = result.entries;
    window.selectedWords = new Set(); // Track selected words
    
    // Update language display
    const currentLanguage = state.languages.find(lang => lang.id === state.currentLanguage);
    const languageNameEl = document.getElementById('import-language-name');
    if (languageNameEl && currentLanguage) {
        languageNameEl.textContent = currentLanguage.name;
    }
    
    // Check for duplicates against existing flashcards
    const existingWords = new Set(
        state.flashcards
            .filter(card => card.language_id === state.currentLanguage)
            .map(card => card.word_or_phrase.toLowerCase().trim())
    );
    
    const duplicateCount = result.entries.filter(entry => 
        entry.word_or_phrase && existingWords.has(entry.word_or_phrase.toLowerCase().trim())
    ).length;
    
    // Update counters
    document.getElementById('parsed-count').textContent = result.entries.length;
    document.getElementById('selected-count').textContent = '0';
    document.getElementById('duplicate-count').textContent = duplicateCount;
    
    // Show/hide duplicate controls
    const duplicateControls = document.getElementById('duplicate-controls');
    if (duplicateCount > 0) {
        duplicateControls.classList.remove('hidden');
    } else {
        duplicateControls.classList.add('hidden');
    }
    
    // Show parsed entries as checkboxes (clean word list only)
    const entriesContainer = document.getElementById('parsed-entries-list');
    console.log('📄 Entries container found:', !!entriesContainer);
    entriesContainer.innerHTML = '';
    
    let renderedCount = 0;
    result.entries.forEach((entry, index) => {
        // Skip entries with missing word_or_phrase
        if (!entry.word_or_phrase) {
            console.warn('⚠️ Skipping entry with missing word_or_phrase:', entry);
            return;
        }
        
        renderedCount++;
        const isDuplicate = existingWords.has(entry.word_or_phrase.toLowerCase().trim());
        const entryDiv = document.createElement('div');
        entryDiv.className = `flex items-start gap-2 p-2 hover:bg-gray-50 rounded border-b border-gray-100 ${isDuplicate ? 'bg-yellow-50' : ''}`;
        
        entryDiv.innerHTML = `
            <input type="checkbox" 
                   id="word-${index}" 
                   class="word-checkbox mt-1 h-4 w-4 text-purple-600 rounded" 
                   data-word="${entry.word_or_phrase}"
                   data-index="${index}"
                   data-duplicate="${isDuplicate}"
                   ${!isDuplicate ? 'checked' : ''}>
            <label for="word-${index}" class="flex-1 cursor-pointer text-sm">
                <span class="font-medium text-gray-900">${entry.word_or_phrase}</span>
                ${isDuplicate ? '<span class="ml-2 text-xs text-yellow-700 bg-yellow-200 px-2 py-0.5 rounded">⚠️ Duplicate</span>' : ''}
            </label>
        `;
        entriesContainer.appendChild(entryDiv);
    });
    
    console.log(`📄 Rendered ${renderedCount} out of ${result.entries.length} entries`);
    
    // Set up selection event listeners
    setupWordSelectionHandlers();
    
    // Initial count update after rendering
    updateSelectedCount();
    
    // Set up batch generation button
    const batchGenerateBtn = document.getElementById('batch-generate-btn');
    if (batchGenerateBtn) {
        batchGenerateBtn.onclick = () => batchGenerateFlashcards();
    }
}

function setupWordSelectionHandlers() {
    // Update selected count when checkboxes change
    const checkboxes = document.querySelectorAll('.word-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedCount);
    });
    
    // Select all button
    const selectAllBtn = document.getElementById('select-all-words');
    if (selectAllBtn) {
        selectAllBtn.onclick = () => {
            checkboxes.forEach(cb => cb.checked = true);
            updateSelectedCount();
        };
    }
    
    // Deselect all button
    const deselectAllBtn = document.getElementById('deselect-all-words');
    if (deselectAllBtn) {
        deselectAllBtn.onclick = () => {
            checkboxes.forEach(cb => cb.checked = false);
            updateSelectedCount();
        };
    }
    
    // Toggle duplicates button
    const toggleDuplicatesBtn = document.getElementById('toggle-duplicates');
    if (toggleDuplicatesBtn) {
        toggleDuplicatesBtn.onclick = () => {
            const duplicateCheckboxes = document.querySelectorAll('.word-checkbox[data-duplicate="true"]');
            const allDuplicatesUnchecked = Array.from(duplicateCheckboxes).every(cb => !cb.checked);
            
            duplicateCheckboxes.forEach(cb => {
                cb.checked = allDuplicatesUnchecked; // Toggle: if all unchecked, check them; otherwise uncheck
            });
            
            // Update button text
            toggleDuplicatesBtn.textContent = allDuplicatesUnchecked ? 'Unselect Duplicates' : 'Select Duplicates';
            updateSelectedCount();
        };
    }
}

function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('.word-checkbox:checked');
    const count = checkboxes.length;
    
    document.getElementById('selected-count').textContent = count;
    
    // Update button state and text
    const batchGenerateBtn = document.getElementById('batch-generate-btn');
    batchGenerateBtn.disabled = count === 0;
    batchGenerateBtn.textContent = `🪄 Generate Flashcards with AI (${count} selected)`;
}

async function batchGenerateFlashcards() {
    const checkboxes = document.querySelectorAll('.word-checkbox:checked');
    const selectedWords = Array.from(checkboxes).map(cb => cb.dataset.word);
    
    if (selectedWords.length === 0) {
        showToast('❌ Please select at least one word', 3000);
        return;
    }
    
    // Store selected words globally so we can track status
    window.selectedWords = selectedWords;
    
    console.log('🪄 Starting batch AI generation for', selectedWords.length, 'words');
    
    // Get current language from state (no dropdown in parser)
    const languageId = state.currentLanguage;
    
    // Show persistent status banner
    showStatusBanner(
        `Generating ${selectedWords.length} flashcards...`,
        'AI is creating definitions, etymologies, and images. This may take a minute.',
        'processing',
        0 // Don't auto-dismiss - user needs to see final result
    );
    
    // Hide results, show progress
    document.getElementById('parser-results').classList.add('hidden');
    document.getElementById('batch-generation-progress').classList.remove('hidden');
    
    // Reset progress UI
    updateBatchProgress(0, selectedWords.length, null, 0);
    
    try {
        // Use Server-Sent Events for real-time progress
        const wordsParam = encodeURIComponent(selectedWords.join(','));
        const eventSource = new EventSource(
            `/api/ai/batch-generate-stream?words=${wordsParam}&language_id=${languageId}&include_images=true`
        );
        
        let finalResult = null;
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📡 Progress update:', data);
                
                if (data.status === 'processing') {
                    // Update progress bar and ETA
                    updateBatchProgress(
                        data.current - 1, // Completed count
                        data.total,
                        data.word,
                        data.eta_seconds,
                        data.successful,
                        data.failed
                    );
                } else if (data.status === 'word_complete') {
                    console.log(`✅ Word completed: ${data.word} (image: ${data.has_image})`);
                } else if (data.status === 'word_failed') {
                    console.log(`❌ Word failed: ${data.word} (${data.reason})`);
                } else if (data.status === 'complete') {
                    // Store final result
                    finalResult = data;
                    console.log('✅ Batch generation complete:', data);
                    eventSource.close();
                    
                    // Show results
                    showBatchGenerationResults(finalResult);
                    
                    // Trigger audio generation for successful cards
                    if (finalResult.successful > 0 && finalResult.flashcard_ids && finalResult.flashcard_ids.length > 0) {
                        console.log(`🎵 Triggering audio generation for ${finalResult.flashcard_ids.length} flashcards`);
                        triggerBatchAudioGeneration(finalResult.flashcard_ids);
                    }
                } else if (data.status === 'error') {
                    console.error('❌ Batch error:', data.error);
                    eventSource.close();
                    throw new Error(data.error);
                }
            } catch (e) {
                console.error('❌ Error parsing SSE message:', e);
            }
        };
        
        eventSource.onerror = (error) => {
            console.error('❌ SSE connection error:', error);
            eventSource.close();
            
            // Update status banner to show error
            showStatusBanner(
                'Batch generation failed',
                'Connection to server lost',
                'error',
                10000
            );
            
            showToast('❌ Batch generation failed: Connection error', 5000);
            document.getElementById('batch-generation-progress').classList.add('hidden');
            document.getElementById('parser-results').classList.remove('hidden');
        };
        
    } catch (error) {
        console.error('❌ Batch generation error:', error);
        
        // Update status banner to show error
        showStatusBanner(
            'Batch generation failed',
            error.message,
            'error',
            10000 // Auto-dismiss after 10 seconds
        );
        
        showToast(`❌ Batch generation failed: ${error.message}`, 5000);
        document.getElementById('batch-generation-progress').classList.add('hidden');
        document.getElementById('parser-results').classList.remove('hidden');
    }
}

function updateBatchProgress(completed, total, currentWord, etaSeconds, successful = 0, failed = 0) {
    const percentage = Math.round((completed / total) * 100);
    
    // Update progress bar
    const progressBar = document.getElementById('batch-progress-bar');
    const progressPercentage = document.getElementById('batch-progress-percentage');
    const progressText = document.getElementById('batch-progress-text');
    const progressDetails = document.getElementById('batch-progress-details');
    
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
    
    // Update progress text with current word
    if (progressText) {
        if (currentWord) {
            progressText.textContent = `Processing "${currentWord}" (${completed}/${total})`;
        } else {
            progressText.textContent = `Preparing... (${completed}/${total})`;
        }
    }
    
    // Update details with ETA and stats
    if (progressDetails) {
        const etaMinutes = Math.floor(etaSeconds / 60);
        const etaSecondsRemaining = Math.round(etaSeconds % 60);
        
        let etaText = '';
        if (etaSeconds > 0) {
            if (etaMinutes > 0) {
                etaText = `⏱️ ETA: ~${etaMinutes}m ${etaSecondsRemaining}s`;
            } else {
                etaText = `⏱️ ETA: ~${etaSecondsRemaining}s`;
            }
        }
        
        const statsText = successful > 0 || failed > 0 
            ? `<div class="mt-2">✅ ${successful} succeeded, ❌ ${failed} failed</div>`
            : '';
        
        progressDetails.innerHTML = `
            <div class="font-medium text-purple-700">${etaText}</div>
            ${statsText}
            <div class="text-xs text-gray-500 mt-1">☕ ${etaSeconds > 60 ? 'Grab a coffee!' : 'Almost done...'}</div>
        `;
    }
}

async function showBatchGenerationResults(result) {
    // Hide progress, show results
    document.getElementById('batch-generation-progress').classList.add('hidden');
    document.getElementById('batch-generation-results').classList.remove('hidden');
    
    // Update counters
    document.getElementById('batch-successful-count').textContent = result.successful;
    document.getElementById('batch-failed-count').textContent = result.failed;
    
    // Populate word status list
    const wordStatusList = document.getElementById('batch-word-status-list');
    wordStatusList.innerHTML = '';
    
    // Create a map of words to their status
    const wordStatusMap = new Map();
    
    // Use word_results from backend if available
    if (result.word_results && result.word_results.length > 0) {
        result.word_results.forEach(wr => {
            const statusMessage = wr.status === 'success' 
                ? `✅ Generated` 
                : `❌ ${wr.error || 'Failed'}`;
            
            wordStatusMap.set(wr.word, { 
                status: wr.status, 
                message: statusMessage,
                flashcard_id: wr.flashcard_id 
            });
        });
    } else {
        // Fallback: Mark successful words (old logic for backward compatibility)
        if (result.flashcard_ids && result.flashcard_ids.length > 0) {
            const successfulWords = window.selectedWords ? window.selectedWords.slice(0, result.successful) : [];
            successfulWords.forEach(word => {
                wordStatusMap.set(word, { status: 'success', message: '✅ Generated' });
            });
        }
        
        // Mark failed words from errors
        if (result.errors && result.errors.length > 0) {
            result.errors.forEach(error => {
                wordStatusMap.set(error.word, { status: 'error', message: `❌ ${error.error}` });
            });
        }
    }
    
    // If we have the original word list, use it
    if (window.selectedWords) {
        window.selectedWords.forEach((word, index) => {
            const status = wordStatusMap.get(word) || { status: 'unknown', message: '❓ Unknown' };
            
            const row = document.createElement('tr');
            row.className = status.status === 'success' ? 'bg-green-50 hover:bg-green-100 cursor-pointer' : 
                           status.status === 'error' ? 'bg-red-50' : 'bg-gray-50';
            
            // Set HTML content first
            row.innerHTML = `
                <td class="px-3 py-2 text-gray-900">${index + 1}</td>
                <td class="px-3 py-2 font-medium text-gray-900">${word}</td>
                <td class="px-3 py-2 text-sm ${status.status === 'success' ? 'text-green-700' : status.status === 'error' ? 'text-red-700' : 'text-gray-700'}">${status.message}</td>
            `;
            
            // THEN add click handler after innerHTML (so it doesn't get wiped out)
            if (status.status === 'success' && status.flashcard_id) {
                row.style.cursor = 'pointer';
                row.title = 'Click to view this card in Browse mode';
                row.addEventListener('click', () => {
                    console.log(`🔍 Clicked on word: ${word}, flashcard_id: ${status.flashcard_id}`);
                    // Store the flashcard ID to highlight
                    window.lastGeneratedFlashcardId = status.flashcard_id;
                    // Close the results panel
                    document.getElementById('batch-generation-results').classList.add('hidden');
                    // Switch to Browse mode
                    switchMode('browse');
                    // Refresh and scroll to the card
                    setTimeout(() => {
                        const cardElement = document.querySelector(`[data-flashcard-id="${status.flashcard_id}"]`);
                        console.log(`🔍 Looking for card element with ID: ${status.flashcard_id}`, cardElement);
                        if (cardElement) {
                            cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            cardElement.classList.add('ring-4', 'ring-green-400');
                            setTimeout(() => cardElement.classList.remove('ring-4', 'ring-green-400'), 3000);
                        } else {
                            console.warn(`⚠️ Card element not found for ID: ${status.flashcard_id}`);
                        }
                    }, 500);
                });
            }
            
            wordStatusList.appendChild(row);
        });
    }
    
    // Update status banner with final result - DON'T auto-dismiss
    if (result.successful > 0 && result.failed === 0) {
        showStatusBanner(
            `✅ Success! Generated ${result.successful} flashcard${result.successful !== 1 ? 's' : ''}!`,
            'All flashcards were created successfully. Audio will be generated in the background.',
            'success',
            0 // DON'T auto-dismiss - keep visible
        );
    } else if (result.successful > 0 && result.failed > 0) {
        showStatusBanner(
            `⚠️ Partial Success: ${result.successful} created, ${result.failed} failed`,
            'Some flashcards could not be generated. See details below.',
            'warning',
            0 // Don't auto-dismiss - user needs to see errors
        );
    } else {
        showStatusBanner(
            `❌ Generation Failed`,
            `All ${result.failed} flashcard${result.failed !== 1 ? 's' : ''} failed to generate. See errors below.`,
            'error',
            0 // Don't auto-dismiss
        );
    }
    
    // Show BIG success message at top if any succeeded
    if (result.successful > 0) {
        showToast(`✅ SUCCESS! Generated ${result.successful} flashcard${result.successful !== 1 ? 's' : ''}!`, 8000);
    }
    
    // Show errors if any
    if (result.errors && result.errors.length > 0) {
        document.getElementById('batch-errors').classList.remove('hidden');
        const errorsList = document.getElementById('batch-errors-list');
        errorsList.innerHTML = '';
        
        // Add countdown message at the top
        const countdownDiv = document.createElement('div');
        countdownDiv.className = 'p-2 bg-yellow-50 rounded border border-yellow-300 text-sm text-yellow-800 mb-2';
        countdownDiv.innerHTML = '⏰ This panel will auto-close in <span id="error-countdown">30</span> seconds. Copy any errors you need now!';
        errorsList.appendChild(countdownDiv);
        
        result.errors.forEach(error => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'p-2 bg-red-50 rounded border border-red-200';
            errorDiv.textContent = `${error.word}: ${error.error}`;
            errorsList.appendChild(errorDiv);
        });
        
        // Auto-dismiss after 30 seconds with countdown
        let timeLeft = 30;
        const countdownSpan = document.getElementById('error-countdown');
        const countdownInterval = setInterval(() => {
            timeLeft--;
            if (countdownSpan) {
                countdownSpan.textContent = timeLeft;
            }
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                document.getElementById('batch-generation-results').classList.add('hidden');
                showToast('Error panel auto-closed', 3000);
            }
        }, 1000);
        
        // Also show toast for errors
        if (result.failed > 0) {
            showToast(`⚠️ ${result.failed} word${result.failed !== 1 ? 's' : ''} failed to generate. See errors below.`, 8000);
        }
    } else {
        document.getElementById('batch-errors').classList.add('hidden');
    }
    
    // Trigger sync to update the UI with new cards
    if (result.successful > 0) {
        console.log('🔄 Fetching newly created flashcards...');
        
        // Fetch the new flashcards directly using their IDs
        if (result.flashcard_ids && result.flashcard_ids.length > 0) {
            const newCards = [];
            for (const id of result.flashcard_ids) {
                try {
                    const response = await fetch(`/api/flashcards/${id}`, {
                        credentials: 'include'
                    });
                    if (response.ok) {
                        const card = await response.json();
                        newCards.push(card);
                        // Save to IndexedDB
                        if (offlineDB) {
                            await offlineDB.saveFlashcard(card);
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch flashcard ${id}:`, error);
                }
            }
            
            // Add new cards to state immediately
            if (newCards.length > 0) {
                state.flashcards = [...state.flashcards, ...newCards];
                console.log(`✅ Added ${newCards.length} new flashcards to state. Total: ${state.flashcards.length}`);
                
                // Auto-navigate to Browse mode to see the new cards
                console.log('🔄 Auto-navigating to Browse mode to show new flashcards...');
                switchMode('browse');
                
                // Refresh browse list
                renderFlashcardList();
            }
        }
        
        // Also trigger a full sync to be safe
        if (window.syncManager) {
            console.log('🔄 Triggering background sync...');
            window.syncManager.sync().catch(err => console.error('Background sync failed:', err));
        }
    }
    
    // Set up buttons
    document.getElementById('view-generated-cards').onclick = () => {
        console.log('📚 View Generated Cards clicked');
        // Close the results panel
        document.getElementById('batch-generation-results').classList.add('hidden');
        // Switch to Browse mode to view the cards
        switchMode('browse');
        console.log('📚 Switched to Browse mode, flashcards count:', state.flashcards.length);
    };
    
    document.getElementById('batch-another').onclick = () => {
        document.getElementById('batch-generation-results').classList.add('hidden');
        document.getElementById('parser-upload-section').classList.remove('hidden');
        
        // Reset file input to allow re-upload
        const fileInput = document.getElementById('document-file');
        if (fileInput) {
            fileInput.value = '';
            console.log('🔄 File input reset for next upload');
        }
    };
    
    // "Start Studying" button
    const batchToStudyBtn = document.getElementById('batch-to-study');
    if (batchToStudyBtn) {
        batchToStudyBtn.onclick = () => {
            document.getElementById('batch-generation-results').classList.add('hidden');
            switchMode('study');
        };
    }
}

/**
 * Trigger audio generation for a batch of flashcards
 * @param {Array} flashcardIds - Array of flashcard ID strings
 */
async function triggerBatchAudioGeneration(flashcardIds) {
    if (!flashcardIds || flashcardIds.length === 0) {
        return;
    }
    
    console.log(`🎵 Starting background audio generation for ${flashcardIds.length} flashcards`);
    
    // Show initial progress toast
    showToast(`🎵 Generating audio for ${flashcardIds.length} flashcard${flashcardIds.length !== 1 ? 's' : ''}...`, 3000);
    
    // Trigger audio generation in parallel using Promise.allSettled
    const audioPromises = flashcardIds.map(async (flashcardId, index) => {
        try {
            console.log(`🎵 [${index + 1}/${flashcardIds.length}] Generating audio for ${flashcardId}...`);
            
            const response = await fetch(`/api/audio/generate/${flashcardId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log(`🎵 ✅ [${index + 1}/${flashcardIds.length}] Audio generated for ${data.word || flashcardId}`);
                return { 
                    flashcardId, 
                    success: true, 
                    word: data.word,
                    audio_url: data.audio_url 
                };
            } else {
                console.warn(`🎵 ⚠️ [${index + 1}/${flashcardIds.length}] Audio generation failed: ${response.status}`, data);
                return { 
                    flashcardId, 
                    success: false, 
                    error: data.error || `HTTP ${response.status}`,
                    word: data.word
                };
            }
        } catch (error) {
            console.error(`🎵 ❌ [${index + 1}/${flashcardIds.length}] Error generating audio:`, error);
            return { 
                flashcardId, 
                success: false, 
                error: error.message 
            };
        }
    });
    
    // Wait for all audio generation to complete
    const results = await Promise.allSettled(audioPromises);
    
    // Process results
    const fulfilled = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const successful = fulfilled.filter(r => r.success);
    const failed = fulfilled.filter(r => !r.success);
    
    console.log(`🎵 Audio generation complete: ${successful.length} successful, ${failed.length} failed`);
    
    // Show summary toast
    if (failed.length === 0) {
        showToast(`✅ Audio generated successfully for all ${successful.length} cards`, 5000);
        
        // Refresh flashcards to update audio URLs
        await loadFlashcards();
    } else {
        const failedWords = failed.map(f => f.word || f.flashcardId.substring(0, 8)).join(', ');
        showToast(
            `⚠️ Audio generation: ${successful.length} succeeded, ${failed.length} failed (${failedWords}). ` +
            `You can manually generate audio by clicking the 🔊 button on each card.`,
            10000
        );
        
        console.error('Failed audio generations:', failed);
        
        // Still refresh to update the successful ones
        if (successful.length > 0) {
            await loadFlashcards();
        }
    }
}

async function importParsedEntries() {
    if (!window.parsedEntries || window.parsedEntries.length === 0) {
        showToast('❌ No parsed entries to import', 3000);
        return;
    }
    
    // Show regular import progress
    showImportProgress();
    
    try {
        // Convert parsed entries to flashcard format
        const flashcards = window.parsedEntries.map(entry => ({
            word: entry.word,
            definition: entry.definition,
            language: state.currentLanguage || 'fr',
            etymology: entry.etymology || '',
            english_equivalent: entry.english_equivalent || '',
            related_words: entry.related_words || '',
            difficulty: entry.difficulty || 'medium',
            notes: `Imported from document (${entry.confidence}% confidence)`
        }));
        
        updateImportProgress(25, 'Converting parsed entries...');
        
        // Create JSON blob for import
        const jsonData = JSON.stringify(flashcards, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const formData = new FormData();
        formData.append('file', blob, 'parsed_entries.json');
        
        updateImportProgress(50, 'Uploading flashcards...');
        
        const response = await fetch(`${API_BASE}/import/import`, {
            method: 'POST',
            body: formData
        });
        
        updateImportProgress(75, 'Processing flashcards...');
        
        const result = await response.json();
        
        updateImportProgress(100, 'Complete!');
        
        if (response.ok) {
            showImportResults(result);
            
            // Refresh flashcards if we're on browse tab
            if (state.currentLanguage) {
                await loadFlashcards();
            }
            
            showToast(`✅ Import complete! ${result.successful_imports} cards imported from parsed document`, 5000);
        } else {
            throw new Error(result.detail || 'Import failed');
        }
        
    } catch (error) {
        console.error('Parsed entries import error:', error);
        showToast(`❌ Import failed: ${error.message}`, 8000);
        resetImportForm();
    }
}

function resetParserForm() {
    document.getElementById('document-file').value = '';
    document.getElementById('parser-progress').classList.add('hidden');
    document.getElementById('parser-results').classList.add('hidden');
    window.parsedEntries = null;
}

// ========================================
// Batch IPA Processing Functions
// ========================================

async function initializeBatchIPA() {
    // NOTE: Batch IPA section is now hidden from main view
    // It's accessible through hamburger menu "Batch Processing" instead
    // This initialization is kept for backward compatibility but disabled
    
    const batchSection = document.getElementById('batch-ipa-section');
    const batchIpaBtn = document.getElementById('batch-generate-ipa');
    const batchAudioBtn = document.getElementById('batch-generate-audio');
    const batchCompleteBtn = document.getElementById('batch-generate-complete');
    
    // Ensure the section stays hidden (audio is now auto-generated on card creation)
    if (batchSection) {
        batchSection.style.display = 'none';
    }
    
    // DISABLED: Don't show batch section on language change
    // Audio is now generated automatically when cards are created
    /*
    document.addEventListener('languageChanged', async (e) => {
        if (e.detail.languageId) {
            batchSection.style.display = 'block';
            await updateBatchStatus();
            enableBatchButtons();
        } else {
            batchSection.style.display = 'none';
            disableBatchButtons();
        }
    });
    */
    
    // Batch button event listeners (kept for batch processing page)
    if (batchIpaBtn) batchIpaBtn.addEventListener('click', () => startBatchIPA('ipa'));
    if (batchAudioBtn) batchAudioBtn.addEventListener('click', () => startBatchIPA('audio'));
    if (batchCompleteBtn) batchCompleteBtn.addEventListener('click', () => startBatchIPA('complete'));
}

function enableBatchButtons() {
    document.getElementById('batch-generate-ipa').disabled = false;
    document.getElementById('batch-generate-audio').disabled = false;
    document.getElementById('batch-generate-complete').disabled = false;
}

function disableBatchButtons() {
    document.getElementById('batch-generate-ipa').disabled = true;
    document.getElementById('batch-generate-audio').disabled = true;
    document.getElementById('batch-generate-complete').disabled = true;
}

async function updateBatchStatus() {
    if (!state.currentLanguage) return;
    
    try {
        const status = await apiRequest(`/batch-ipa/batch-status/${state.currentLanguage}`);
        const statusElement = document.getElementById('batch-status');
        
        if (status.success) {
            statusElement.innerHTML = `
                IPA: ${status.cards_with_ipa}/${status.total_cards} (${status.ipa_completion_percent}%)<br>
                Audio: ${status.cards_with_ipa_audio}/${status.total_cards} (${status.audio_completion_percent}%)
            `;
        }
    } catch (error) {
        console.error('Failed to get batch status:', error);
    }
}

async function startBatchIPA(type) {
    if (!state.currentLanguage) {
        showToast('Please select a language first');
        return;
    }
    
    const button = document.getElementById(`batch-generate-${type}`);
    const originalText = button.textContent;
    
    try {
        button.disabled = true;
        button.textContent = '⏳ Processing...';
        
        let endpoint;
        let message;
        
        switch (type) {
            case 'ipa':
                endpoint = `/batch-ipa/batch-generate-ipa/${state.currentLanguage}`;
                message = 'Starting batch IPA pronunciation generation...';
                break;
            case 'audio':
                endpoint = `/batch-ipa/batch-generate-ipa-audio/${state.currentLanguage}`;
                message = 'Starting batch IPA audio generation...';
                break;
            case 'complete':
                endpoint = `/batch-ipa/batch-generate-complete/${state.currentLanguage}`;
                message = 'Starting complete batch IPA processing...';
                break;
        }
        
        const response = await apiRequest(endpoint, { method: 'POST' });
        
        if (response.success) {
            showToast(`✅ ${response.message}`, 5000);
            
            // Start polling for status updates
            startBatchStatusPolling();
        } else {
            throw new Error(response.error || 'Batch processing failed');
        }
        
    } catch (error) {
        console.error('Batch IPA error:', error);
        showToast(`❌ Batch processing failed: ${error.message}`, 5000);
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

function startBatchStatusPolling() {
    // Poll status every 5 seconds for 2 minutes
    let pollCount = 0;
    const maxPolls = 24; // 2 minutes
    
    const pollInterval = setInterval(async () => {
        pollCount++;
        
        await updateBatchStatus();
        
        if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            showToast('Status polling stopped. Check manually for final results.', 3000);
        }
    }, 5000);
    
    // Stop polling when user leaves the page
    window.addEventListener('beforeunload', () => {
        clearInterval(pollInterval);
    });
}

// ========================================
// NEW UI: Mode Toggle & Hamburger Menu
// ========================================

/**
 * Toggle between Study, Read, Browse, and Import modes
 * @param {String} mode - 'study', 'read', 'browse', or 'import'
 */
function switchMode(mode) {
    console.log(`🔄 Switching to ${mode} mode`);
    console.log(`📊 Current state:`, {
        flashcardsCount: state.flashcards.length,
        currentIndex: state.currentCardIndex,
        previousMode: state.currentMode
    });
    
    // Update button states
    const studyBtn = document.getElementById('mode-study');
    const readBtn = document.getElementById('mode-read');
    const browseBtn = document.getElementById('mode-browse');
    const importBtn = document.getElementById('mode-import');
    
    console.log('🔍 Mode containers found:', {
        studyMode: !!document.getElementById('study-mode'),
        readMode: !!document.getElementById('read-mode'),
        browseMode: !!document.getElementById('browse-mode'),
        importMode: !!document.getElementById('content-import'),
        readContainer: !!document.getElementById('read-card-container')
    });
    
    // Reset all buttons
    [studyBtn, readBtn, browseBtn, importBtn].forEach(btn => {
        if (btn) {
            btn.classList.remove('active', 'bg-indigo-600', 'text-white');
            btn.classList.add('text-gray-600');
        }
    });
    
    // Hide all mode content
    const studyModeEl = document.getElementById('study-mode');
    const readModeEl = document.getElementById('read-mode');
    const browseModeEl = document.getElementById('browse-mode');
    const importModeEl = document.getElementById('content-import');
    
    if (studyModeEl) studyModeEl.classList.add('hidden');
    if (readModeEl) readModeEl.classList.add('hidden');
    if (browseModeEl) browseModeEl.classList.add('hidden');
    if (importModeEl) importModeEl.classList.add('hidden');
    
    console.log(`🎯 Switching to: ${mode}`);
    
    if (mode === 'study') {
        console.log('📚 Activating Study mode');
        if (studyBtn) {
            studyBtn.classList.add('active', 'bg-indigo-600', 'text-white');
            studyBtn.classList.remove('text-gray-600');
        }
        
        // Show study mode content
        if (studyModeEl) studyModeEl.classList.remove('hidden');
        
        // Load current card if available
        if (state.flashcards.length > 0) {
            renderFlashcard(state.flashcards[state.currentCardIndex]);
        }
        
    } else if (mode === 'read') {
        console.log('📄 Activating Read mode');
        console.log('📄 Read mode flashcards available:', state.flashcards.length);
        
        if (readBtn) {
            readBtn.classList.add('active', 'bg-indigo-600', 'text-white');
            readBtn.classList.remove('text-gray-600');
        }
        
        // Show read mode content
        if (readModeEl) {
            readModeEl.classList.remove('hidden');
            console.log('📄 Read mode container now visible');
        } else {
            console.error('❌ Read mode element not found!');
        }
        
        // Load current card in read mode
        if (state.flashcards.length > 0) {
            renderReadCard(state.flashcards[state.currentCardIndex]);
        }
        
    } else if (mode === 'browse') {
        console.log('📚 Activating Browse mode');
        
        if (browseBtn) {
            browseBtn.classList.add('active', 'bg-indigo-600', 'text-white');
            browseBtn.classList.remove('text-gray-600');
        }
        
        // Show browse mode content
        if (browseModeEl) {
            browseModeEl.classList.remove('hidden');
            console.log('📚 Browse mode container now visible');
        } else {
            console.error('❌ Browse mode element not found!');
        }
        
        // Load cards list with proper sorting
        renderFlashcardList();
        
    } else if (mode === 'import') {
        console.log('📁 Activating Import mode');
        
        if (importBtn) {
            importBtn.classList.add('active', 'bg-indigo-600', 'text-white');
            importBtn.classList.remove('text-gray-600');
        }
        
        // Show import mode content
        if (importModeEl) {
            importModeEl.classList.remove('hidden');
            console.log('📁 Import mode container now visible');
        } else {
            console.error('❌ Import mode element not found!');
        }
    }
    
    state.currentMode = mode;
    console.log(`✅ Mode switched to: ${mode}`);
}

/**
 * Load cards list for browse mode
 */
function loadCardsList() {
    const cardsList = document.getElementById('cards-list');
    
    if (state.flashcards.length === 0) {
        cardsList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p class="text-lg mb-2">No cards to display</p>
                <p class="text-sm">Select a language to see your flashcards</p>
            </div>
        `;
        return;
    }
    
    // Display cards as a list
    cardsList.innerHTML = state.flashcards.map((card, index) => `
        <div class="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
             onclick="selectCard(${index})">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="font-semibold text-lg mb-2">${card.word_or_phrase}</h3>
                    ${card.definition ? `<p class="text-gray-600 text-sm mb-2">${card.definition}</p>` : ''}
                    <div class="flex items-center gap-2 text-xs text-gray-500">
                        <span>${card.source && card.source.startsWith('ai_generated') ? '🤖 AI Generated' : '✍️ Manual'}</span>
                        <span>•</span>
                        <span>Reviewed ${card.times_reviewed} times</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 ml-4">
                    ${card.audio_url ? `
                        <button onclick="playAudio('${card.id}', '${card.audio_url}'); event.stopPropagation();" 
                                class="p-2 text-indigo-600 hover:bg-indigo-50 rounded">
                            🔊
                        </button>
                    ` : ''}
                    <button onclick="editCard('${card.id}'); event.stopPropagation();" 
                            class="p-2 text-gray-600 hover:bg-gray-50 rounded">
                        ✏️
                    </button>
                    <button onclick="confirmDelete(state.flashcards[${index}]); event.stopPropagation();" 
                            class="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Select a card from browse mode and switch to study mode
 * @param {Number} index - Card index
 */
function selectCard(index) {
    state.currentCardIndex = index;
    switchMode('study');
}

/**
 * Toggle hamburger menu dropdown
 */
function toggleMenu() {
    const dropdown = document.getElementById('dropdown-menu');
    const isHidden = dropdown.classList.contains('hidden');
    
    if (isHidden) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('dropdown-enter');
        setTimeout(() => {
            dropdown.classList.add('dropdown-enter-active');
        }, 10);
    } else {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('dropdown-enter', 'dropdown-enter-active');
    }
}

/**
 * Show specific content area (for hamburger menu items)
 * @param {String} contentId - ID of content to show
 */
function showContent(contentId) {
    // Hide main content
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.classList.add('hidden');
    }
    
    // Hide other content areas
    ['content-add', 'content-import', 'content-batch'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
        }
    });
    
    // Show requested content
    const targetContent = document.getElementById(contentId);
    if (targetContent) {
        targetContent.classList.remove('hidden');
    }
    
    // Close dropdown menu (if it exists)
    const dropdown = document.getElementById('dropdown-menu');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

/**
 * Go back to main content from any sub-content
 */
function backToMain() {
    // Hide all content areas
    ['content-add', 'content-import', 'content-batch'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    
    // Show main content
    document.getElementById('main-content').classList.remove('hidden');
}

/**
 * Initialize new UI event listeners
 */
function initializeNewUI() {
    // Hamburger menu Sync button
    document.getElementById('menu-sync')?.addEventListener('click', async () => {
        const btn = document.getElementById('menu-sync');
        btn.disabled = true;
        btn.textContent = '🔄 Syncing...';
        try {
            await apiClient.forceSync();
            showToast('Sync completed successfully!');
        } catch (error) {
            showToast('Sync failed - will retry automatically', 5000);
        } finally {
            btn.disabled = false;
            btn.textContent = '🔄 Sync Now';
        }
    });
    console.log('🎨 Initializing new UI...');
    
    // Mode toggle buttons with debugging
    const studyBtn = document.getElementById('mode-study');
    const readBtn = document.getElementById('mode-read');
    const browseBtn = document.getElementById('mode-browse');
    const importBtn = document.getElementById('mode-import');
    
    console.log('🔍 Mode buttons found:', {
        study: !!studyBtn,
        read: !!readBtn,
        browse: !!browseBtn,
        import: !!importBtn
    });
    
    studyBtn?.addEventListener('click', () => {
        console.log('📚 Study button clicked');
        switchMode('study');
    });
    
    readBtn?.addEventListener('click', () => {
        console.log('📄 Read button clicked');
        switchMode('read');
    });
    
    browseBtn?.addEventListener('click', () => {
        console.log('📖 Browse button clicked');
        switchMode('browse');
    });
    
    importBtn?.addEventListener('click', () => {
        console.log('📁 Import button clicked');
        switchMode('import');
    });
    
    // Primary action button - show the add card form
document.getElementById('add-card-btn')?.addEventListener('click', () => {
    // Use the showContent function to properly show the add card form
    showContent('content-add');
    
    // Scroll to the form
    setTimeout(() => {
        const addCardContent = document.getElementById('content-add');
        if (addCardContent) {
            addCardContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
    
    // Default to AI form (make sure it's visible)
    setTimeout(() => {
        const aiForm = document.getElementById('ai-form');
        const manualForm = document.getElementById('manual-form');
        const btnAI = document.getElementById('btn-ai');
        const btnManual = document.getElementById('btn-manual');
        
        if (aiForm && manualForm && btnAI && btnManual) {
            aiForm.classList.remove('hidden');
            manualForm.classList.add('hidden');
            btnAI.classList.add('bg-indigo-600', 'text-white');
            btnAI.classList.remove('bg-gray-200', 'text-gray-700');
            btnManual.classList.remove('bg-indigo-600', 'text-white');
            btnManual.classList.add('bg-gray-200', 'text-gray-700');
        }
    }, 50);
});    // Hamburger menu
    document.getElementById('menu-toggle')?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu();
    });
    document.getElementById('menu-import')?.addEventListener('click', () => showContent('content-import'));
    document.getElementById('menu-batch')?.addEventListener('click', () => showContent('content-batch'));
    document.getElementById('menu-settings')?.addEventListener('click', async () => {
        // Try to fetch the settings page, show alert if not found
        try {
            const resp = await fetch('/static/settings.html', { method: 'HEAD' });
            if (resp.ok) {
                window.location.href = '/static/settings.html';
            } else {
                alert('Settings coming soon!');
            }
        } catch (e) {
            alert('Settings coming soon!');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('dropdown-menu');
        const menuToggle = document.getElementById('menu-toggle');
        
        if (!dropdown?.contains(e.target) && !menuToggle?.contains(e.target)) {
            dropdown?.classList.add('hidden');
        }
    });
    
    // Real-time search functionality in browse mode
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        // Real-time search with debouncing
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (searchTimeout) clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (query.length === 0) {
                    loadCardsList();
                } else {
                    performSearch(query);
                }
            }, 300);
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (searchTimeout) clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                if (query.length === 0) {
                    loadCardsList();
                } else {
                    performSearch(query);
                }
            }
        });
    }

    // Make Next/Previous card buttons robust
    document.getElementById('next-card')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        nextCard();
    });
    document.getElementById('prev-card')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        prevCard();
    });
    
    // Initialize in study mode
    switchMode('study');
    
    console.log('✅ New UI initialized');
}

/**
 * Perform search and update browse mode results  
 * @param {String} query - Search query
 */
async function performSearch(query) {
    console.log('🔍 Searching for:', query);
    
    const searchStats = document.getElementById('search-stats');
    
    try {
        // Use existing search functionality
        let searchResults = [];
        
        if (apiClient) {
            const languageId = state.currentLanguage && state.currentLanguage !== 'all' 
                ? state.currentLanguage 
                : null;
            searchResults = await apiClient.searchFlashcards(query, languageId);
        }
        
        // Update results
        state.flashcards = searchResults;
        loadCardsList();
        
        // Update stats - show count for any result (including 0)
        const count = searchResults.length;
        const plural = count === 1 ? 'result' : 'results';
    searchStats.innerHTML = `Found <span class="font-medium">${count}</span> ${plural} for "${query}"`;
    searchStats.classList.remove('hidden');
    searchStats.classList.remove('text-red-500', 'text-green-500', 'text-blue-500');
    searchStats.classList.add('text-gray-600');
        
    } catch (error) {
        console.error('Search failed:', error);
        // Silently fail - just keep previous results
        // No error messages shown to user for smoother experience
    }
}

// ========================================
// Debug Helper Functions (accessible from console)
// ========================================

window.debugReadMode = function() {
    console.log('🔍 DEBUG: Read Mode Diagnostics');
    console.log('================================');
    console.log('Read button exists:', !!document.getElementById('mode-read'));
    console.log('Read mode container exists:', !!document.getElementById('read-mode'));
    console.log('Read card container exists:', !!document.getElementById('read-card-container'));
    console.log('Current mode:', state.currentMode);
    console.log('Flashcards loaded:', state.flashcards.length);
    console.log('Current card index:', state.currentCardIndex);
    
    if (state.flashcards.length > 0) {
        console.log('Current card:', state.flashcards[state.currentCardIndex]);
    }
    
    // Try to switch to read mode
    console.log('Attempting to switch to Read mode...');
    switchMode('read');
};

window.testReadCard = function() {
    console.log('🧪 Testing Read Card rendering...');
    if (state.flashcards.length > 0) {
        renderReadCard(state.flashcards[state.currentCardIndex]);
        console.log('✅ renderReadCard called');
    } else {
        console.log('❌ No flashcards available');
    }
};

console.log('💡 Debug helpers loaded! Use debugReadMode() or testReadCard() in console');

// ============================================================================
// PERFORMANCE TIMING UTILITIES
// ============================================================================

/**
 * Detect user state (new vs returning)
 */
function detectUserState() {
    console.log('\n👤 ===== USER STATE DETECTION =====');
    
    // Check various indicators
    const hasVisitedBefore = localStorage.getItem('has-visited');
    const hasAuthToken = localStorage.getItem('auth_token');
    const hasIndexedDBData = localStorage.getItem('indexeddb-populated');
    const firstVisitTime = localStorage.getItem('first-visit-time');
    
    let userState;
    let stateDescription;
    
    if (!hasVisitedBefore) {
        userState = 'BRAND_NEW_USER';
        stateDescription = 'First-time visitor - never been here before';
        localStorage.setItem('has-visited', 'true');
        localStorage.setItem('first-visit-time', Date.now().toString());
    } else if (!hasAuthToken) {
        userState = 'RETURNING_NO_AUTH';
        stateDescription = 'Returning visitor without authentication';
    } else if (!hasIndexedDBData) {
        userState = 'AUTHED_NO_DATA';
        stateDescription = 'Authenticated but no local data cached';
    } else {
        userState = 'RETURNING_FULL';
        stateDescription = 'Returning user with full cache';
    }
    
    console.log('User State:', userState);
    console.log('Description:', stateDescription);
    console.log('Details:', {
        'Has Visited': !!hasVisitedBefore,
        'Has Auth Token': !!hasAuthToken,
        'Has IndexedDB Data': !!hasIndexedDBData,
        'First Visit': firstVisitTime ? new Date(parseInt(firstVisitTime)).toISOString() : 'N/A'
    });
    
    // Store for later use
    window.userState = userState;
    window.timingCheckpoint?.('user-state-detected', `User state: ${userState} - ${stateDescription}`);
    
    console.log('👤 ===== USER STATE: ' + userState + ' =====\n');
    
    return userState;
}

/**
 * Display comprehensive timing report
 */
function displayTimingReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TIMING REPORT');
    console.log('='.repeat(80));
    
    // Get all performance marks
    const allMarks = performance.getEntriesByType('mark');
    const allMeasures = performance.getEntriesByType('measure');
    
    if (allMarks.length > 0) {
        console.log('\n📍 PERFORMANCE CHECKPOINTS:');
        console.table(allMarks.map(mark => ({
            Name: mark.name,
            'Time (ms)': mark.startTime.toFixed(2),
            'Time (s)': (mark.startTime / 1000).toFixed(3)
        })));
    }
    
    if (allMeasures.length > 0) {
        console.log('\n⏱️ MEASURED DURATIONS:');
        console.table(allMeasures.map(measure => ({
            Name: measure.name,
            'Duration (ms)': measure.duration.toFixed(2),
            'Duration (s)': (measure.duration / 1000).toFixed(3)
        })));
    }
    
    // Calculate key milestones
    const milestones = {
        'Page Load → Head Complete': getDuration('T0-URL-requested', 'T1d-head-complete'),
        'Head → Body Start': getDuration('T1d-head-complete', 'T2-body-start'),
        'Body → Auth Loaded': getDuration('T2-body-start', 'T3b-auth-js-loaded'),
        'Auth → DOM Ready': getDuration('T3e-auth-success', 'T10-dom-ready'),
        'DOM Ready → Offline Init Done': getDuration('T10-dom-ready', 'T9-init-offline-complete'),
        'Offline Init → UI Ready': getDuration('T9-init-offline-complete', 'T12-ui-initialized'),
        'TOTAL: Page → UI Ready': getDuration('T0-URL-requested', 'T12-ui-initialized')
    };
    
    console.log('\n🎯 KEY MILESTONES:');
    const milestoneTable = Object.entries(milestones)
        .map(([name, duration]) => ({
            Milestone: name,
            'Duration (ms)': duration ? duration.toFixed(2) : 'N/A',
            'Duration (s)': duration ? (duration / 1000).toFixed(3) : 'N/A',
            Status: !duration ? 'N/A' : duration > 5000 ? '🚨 SLOW' : duration > 2000 ? '⚠️ DELAYED' : '✅ OK'
        }));
    console.table(milestoneTable);
    
    // Identify bottlenecks
    console.log('\n🔍 BOTTLENECK ANALYSIS:');
    const slowPhases = Object.entries(milestones)
        .filter(([_, duration]) => duration && duration > 2000)
        .sort((a, b) => b[1] - a[1]);
    
    if (slowPhases.length === 0) {
        console.log('✅ No significant bottlenecks found! All phases completed quickly.');
    } else {
        console.log('🚨 SLOW PHASES DETECTED (>2 seconds):');
        slowPhases.forEach(([name, duration]) => {
            console.log(`   ${name}: ${(duration / 1000).toFixed(3)}s`);
        });
    }
    
    // Check error tracker
    if (window.errorTracker?.hasErrors()) {
        console.log('\n🚨 ERRORS DETECTED:');
        window.errorTracker.printReport();
    } else {
        console.log('\n✅ No errors detected during initialization');
    }
    
    // Check for fallback scenarios
    const fallbacks = window.errorTracker?.detectFallbacks() || [];
    if (fallbacks.length > 0) {
        console.log('\n⚠️ FALLBACK SCENARIOS DETECTED:');
        console.table(fallbacks);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 END OF TIMING REPORT');
    console.log('='.repeat(80) + '\n');
}

/**
 * Get duration between two performance marks
 */
function getDuration(startMarkName, endMarkName) {
    const startMark = performance.getEntriesByName(startMarkName)[0];
    const endMark = performance.getEntriesByName(endMarkName)[0];
    
    if (!startMark || !endMark) return null;
    return endMark.startTime - startMark.startTime;
}

// Expose timing functions globally for debugging
window.displayTimingReport = displayTimingReport;
window.detectUserState = detectUserState;

// Detect user state early
detectUserState();

// Display timing report after window loads
window.addEventListener('load', () => {
    // Wait a bit to ensure all measurements are complete
    setTimeout(() => {
        displayTimingReport();
    }, 500);
});

console.log('⏱️ Performance timing utilities loaded!');
