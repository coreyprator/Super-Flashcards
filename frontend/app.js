// frontend/app.js
// Language Learning Flashcards - Main Application Logic
// Version: 3.6.0 (SF-SENT-001: Sentence cards, Count of Monte Cristo, Shadowing mode)

// VERSION CONSISTENCY CHECK
const APP_JS_VERSION = '3.8.1';

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

const ETYMYTHON_BASE_URL = window.location.origin.includes('localhost')
    ? 'http://localhost:8001'
    : 'https://etymython.rentyourcio.com';

const etymythonLookupCache = new Map();

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
    sortOrder: localStorage.getItem('flashcard_sort_order') || 'date-desc', // Persist sort order, default to newest first
    difficultyFilter: 'all' // 'all' | 'unrated' | 'easy' | 'medium' | 'hard' | 'mastered'
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

// Standard B: type='error' defaults to 10s and logs to console.error
function showToast(message, duration = 3000, type = '') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    // Standard B: errors persist at least 10 seconds
    const finalDuration = type === 'error' ? Math.max(duration, 10000) : duration;
    if (type === 'error') console.error('[Super-Flashcards Error]', message);
    if (toast._toastTimer) clearTimeout(toast._toastTimer);
    toast._toastTimer = setTimeout(() => {
        toast.classList.add('hidden');
    }, finalDuration);
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
            // Standard A: capture and log the full response body
            let errorDetail = `API Error: ${response.status}`;
            let rawBody = '';
            try {
                const errorData = await response.json();
                rawBody = JSON.stringify(errorData);
                if (errorData.detail) {
                    errorDetail = errorData.detail;
                }
            } catch (e) {
                try { rawBody = await response.text(); } catch { rawBody = ''; }
            }
            console.error(`[API Error] ${options.method || 'GET'} ${endpoint}`, {
                status: response.status,
                statusText: response.statusText,
                body: rawBody
            });
            throw new Error(errorDetail);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        if (!state.isOnline) {
            showToast('You are offline. Changes will sync when back online.', 10000, 'error');
        } else {
            showToast(error.message || 'Network error. Please try again.', 10000, 'error');
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

        // BV-06: Populate browse language filter dynamically (SF-MOBILE-FIX-001)
        // Use lang.code as value — backend search_cross_language accepts name or code
        const browseFilter = document.getElementById('search-language-filter');
        if (browseFilter) {
            browseFilter.innerHTML = '<option value="all">All Languages</option>';
            languages.forEach(lang => {
                const opt = document.createElement('option');
                opt.value = lang.code;
                opt.textContent = lang.name;
                browseFilter.appendChild(opt);
            });
        }

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
        
        // Apply sort: SRS ordering in study mode, user preference elsewhere
        const effectiveSort = (state.currentMode === 'study' || !state.currentMode) ? 'srs' : state.sortOrder;
        state.flashcards = sortFlashcards(flashcards, effectiveSort);
        state.currentCardIndex = 0;

        // Update SR queue header in study mode
        const srHeader = document.getElementById('sr-queue-header');
        const srRemaining = document.getElementById('sr-cards-remaining');
        if (srHeader && (state.currentMode === 'study' || !state.currentMode)) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueCount = flashcards.filter(c => {
                if (!c.next_review_date) return true; // new cards count as due
                const d = new Date(c.next_review_date);
                d.setHours(0, 0, 0, 0);
                return d <= today;
            }).length;
            if (srRemaining) srRemaining.textContent = dueCount;
            srHeader.classList.remove('hidden');
        } else if (srHeader) {
            srHeader.classList.add('hidden');
        }
        
        if (flashcards.length > 0) {
            // Check current mode and render appropriately
            if (state.currentMode === 'browse') {
                // In browse mode, update cards list
                loadCardsList();
            } else if (state.currentMode === 'read') {
                // In read mode, render read card
                renderReadCard(flashcards[0]);
            } else if (state.currentMode === 'practice') {
                // In practice mode, render practice card
                renderPracticeCard(flashcards[0]);
            } else {
                // In study mode (default), render flashcard
                renderFlashcard(flashcards[0]);
            }
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
        
        // Show the newly created card immediately using URL navigation
        console.log('📍 Navigating to newly created card:', flashcard.word_or_phrase);
        console.log('🆔 Card ID:', flashcard.id);
        
        // ✅ FIX: Use URL parameter navigation to show the newly created card
        // This ensures cache is refreshed and card is properly displayed
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('cardId', flashcard.id);
        
        // Update URL without reloading the page
        const newUrl = `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`;
        window.history.pushState({}, '', newUrl);
        
        // Set the language if not already set
        if (flashcard.language_id) {
            state.currentLanguage = flashcard.language_id;
            const languageSelect = document.getElementById('language-select');
            if (languageSelect) {
                languageSelect.value = flashcard.language_id;
            }
        }
        
        // Force fresh fetch from server to get the newly created card
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
        // apiRequest already surfaces the real error message via toast — no generic fallback needed
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

// SR rating submission — Sprint 9 (SF-005)
window.submitSRRating = async function(quality) {
    const card = state.flashcards[state.currentCardIndex];
    if (!card) return;

    // Disable buttons immediately to prevent double-submit
    const ratingButtons = document.getElementById('sr-rating-buttons');
    if (ratingButtons) {
        ratingButtons.querySelectorAll('button').forEach(b => b.disabled = true);
    }

    try {
        const result = await apiRequest(`/study/review/${card.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quality: quality })
        });

        // Show next review date briefly
        const nextReviewEl = document.getElementById('sr-next-review');
        if (nextReviewEl && result && result.next_review_date) {
            const qualityLabels = { 0: 'Again', 2: 'Hard', 4: 'Good', 5: 'Easy' };
            nextReviewEl.textContent = `${qualityLabels[quality] || ''} — next review: ${result.next_review_date}`;
            nextReviewEl.classList.remove('hidden');
        }

        // Update the in-memory card with new SR data so stats stay fresh
        if (result && state.flashcards[state.currentCardIndex]) {
            state.flashcards[state.currentCardIndex].ease_factor = result.new_ease_factor;
            state.flashcards[state.currentCardIndex].next_review_date = result.next_review_date;
            state.flashcards[state.currentCardIndex].repetition_count = result.repetition_count;
        }
    } catch (err) {
        console.error('[SR] Failed to submit rating:', err);
    }

    // Advance to next card after a short pause
    setTimeout(() => {
        if (ratingButtons) {
            ratingButtons.classList.add('hidden');
            ratingButtons.querySelectorAll('button').forEach(b => b.disabled = false);
        }
        nextCard();
    }, 1200);
};

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

async function injectEtymythonLink(flashcard, targetElementId) {
    if (!flashcard || !flashcard.word_or_phrase || !flashcard.etymology) {
        return;
    }

    const target = document.getElementById(targetElementId);
    if (!target) {
        return;
    }

    const wordKey = flashcard.word_or_phrase.toLowerCase().trim();
    if (!wordKey) {
        return;
    }

    try {
        let lookup = etymythonLookupCache.get(wordKey);
        if (!lookup) {
            const response = await fetch(`${ETYMYTHON_BASE_URL}/api/v1/cognates/lookup?word=${encodeURIComponent(flashcard.word_or_phrase)}`);
            if (!response.ok) {
                return;
            }
            lookup = await response.json();
            etymythonLookupCache.set(wordKey, lookup);
        }

        const pickBestFigure = (payload, card) => {
            const figures = payload?.figures || [];
            if (!figures.length) {
                return null;
            }

            const cardWord = (card?.word_or_phrase || '').toLowerCase().trim();
            const cardEtymology = (card?.etymology || '').toLowerCase();
            const cardCognates = (card?.english_cognates || '').toLowerCase();

            const scoreFigure = (figureCandidate) => {
                const englishName = (figureCandidate?.english_name || '').toLowerCase();
                const greekName = (figureCandidate?.greek_name || '').toLowerCase();
                let score = 0;

                if (cardWord && (cardWord === englishName || cardWord === greekName)) {
                    score += 100;
                }
                if (cardWord && (englishName.includes(cardWord) || greekName.includes(cardWord))) {
                    score += 40;
                }
                if (englishName && (cardEtymology.includes(englishName) || cardCognates.includes(englishName))) {
                    score += 25;
                }
                if (greekName && (cardEtymology.includes(greekName) || cardCognates.includes(greekName))) {
                    score += 25;
                }

                return score;
            };

            const ranked = [...figures].sort((a, b) => scoreFigure(b) - scoreFigure(a));
            return ranked[0];
        };

        const figure = pickBestFigure(lookup, flashcard);
        if (!figure || !figure.id) {
            return;
        }

        const figureName = figure.english_name || flashcard.word_or_phrase;
        const figureUrl = `${ETYMYTHON_BASE_URL}/app#figure/${figure.id}`;
        target.innerHTML = `
            <div class="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <span class="text-sm text-purple-700">From Greek mythology:</span>
                <a href="${figureUrl}" target="_blank" rel="noopener noreferrer" class="ml-2 text-sm font-semibold text-purple-800 hover:text-purple-900 underline">
                    View ${figureName} in Etymython 🟣
                </a>
            </div>
        `;
    } catch (error) {
        console.warn('Etymython lookup unavailable:', error);
    }
}

// SF-SENT-001: Sentence card renderer
function renderSentenceCard(flashcard) {
    const container = document.getElementById('flashcard-container');
    const chapterLabel = flashcard.chapter_number ? `Ch. ${flashcard.chapter_number}` : '';
    const orderLabel = flashcard.sentence_order ? `#${flashcard.sentence_order}` : '';

    container.innerHTML = `
        <div class="max-w-2xl mx-auto" style="box-sizing:border-box;">
            <!-- Chapter badge -->
            <div class="mb-2">
                ${chapterLabel ? `<span class="chapter-badge">${chapterLabel} ${orderLabel}</span>` : ''}
                ${flashcard.source_book ? `<span class="text-xs text-gray-400 ml-2">${flashcard.source_book}</span>` : ''}
            </div>

            <!-- French sentence -->
            <div class="bg-white rounded-xl shadow-md p-4 mb-3">
                <div class="sentence-card-text">${flashcard.word_or_phrase}</div>
                ${flashcard.translation ? `<div id="shadow-translation-${flashcard.id}" class="sentence-translation">${flashcard.translation}</div>` : ''}
                ${flashcard.ipa_pronunciation ? `<div id="shadow-ipa-${flashcard.id}" class="text-xs text-gray-400 font-mono mb-2">${flashcard.ipa_pronunciation}</div>` : ''}

                <!-- Audio + Shadow controls -->
                <div class="flex gap-2 mt-3 items-center flex-wrap">
                    ${getTTSButtonHTML(flashcard.id)}
                    <button class="shadow-btn" id="shadow-btn-${flashcard.id}"
                            onclick="startShadowing('${flashcard.id}')">
                        🎤 Shadow
                    </button>
                    <button onclick="copyShareLink('${flashcard.id}')" class="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">🔗</button>
                </div>

                <!-- Shadowing feedback panel (hidden until recording completes) -->
                <div id="shadow-feedback-${flashcard.id}" style="display:none" class="shadow-feedback"></div>
            </div>

            <!-- Prev / Next navigation -->
            <div class="flex gap-2">
                <button onclick="previousCard(); event.stopPropagation();"
                        class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm disabled:opacity-40"
                        ${state.currentCardIndex === 0 ? 'disabled' : ''}>← Prev</button>
                <span class="flex items-center text-xs text-gray-400 px-2">${state.currentCardIndex + 1} / ${state.flashcards.length}</span>
                <button onclick="nextCard(); event.stopPropagation();"
                        class="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-40"
                        ${state.currentCardIndex >= state.flashcards.length - 1 ? 'disabled' : ''}>Next →</button>
            </div>
        </div>
    `;
}

// SF-MOBILE-UI-001: new card layout — no flip, thumbnail + collapsible sections
function renderFlashcard(flashcard) {
    // SF-SENT-001: Route sentence cards to dedicated renderer
    if (flashcard.card_type === 'sentence') {
        return renderSentenceCard(flashcard);
    }

    const container = document.getElementById('flashcard-container');

    // Parse related words if it's a JSON string
    let relatedWords = [];
    try {
        relatedWords = flashcard.related_words ? JSON.parse(flashcard.related_words) : [];
    } catch (e) {
        relatedWords = flashcard.related_words ? flashcard.related_words.split(',') : [];
    }

    // Resolve language display name
    const cardLang = state.languages?.find(l => l.id === flashcard.language_id);
    const langName = flashcard.language_name || cardLang?.name || '';

    container.innerHTML = `
        <div class="max-w-2xl mx-auto" style="box-sizing:border-box;">

            <!-- Card header: image thumbnail + word info -->
            <div class="bg-white rounded-xl shadow-md p-4 mb-3">
                <div class="flex gap-3 items-flex-start" style="align-items:flex-start;">
                    <!-- Image thumbnail (100px) with tap-to-fullscreen -->
                    <div id="sf-img-thumb" style="width:100px;height:100px;flex-shrink:0;border-radius:10px;overflow:hidden;background:#e5e7eb;cursor:pointer;position:relative;">
                        ${flashcard.image_url ? `
                            <img src="${fixAssetUrl(flashcard.image_url)}"
                                 alt="${flashcard.image_description || flashcard.word_or_phrase}"
                                 style="width:100%;height:100%;object-fit:cover;"
                                 onerror="this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af;font-size:24px;\\'>🖼️</div>'">
                        ` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af;font-size:24px;">🖼️</div>`}
                        ${flashcard.image_url ? `<span style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.4);color:white;font-size:10px;padding:1px 5px;border-radius:4px;">tap</span>` : ''}
                    </div>
                    <!-- Word info: min-width:0 prevents overflow -->
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                            <span class="text-2xl font-bold text-gray-900" style="word-break:break-word;">${flashcard.word_or_phrase}</span>
                            ${getGenderBadgeHTML(flashcard.gender)}
                            ${langName ? `<span class="text-sm text-gray-400">${langName}</span>` : ''}
                        </div>
                        ${flashcard.preposition_usage ? `<p class="text-sm text-gray-500 italic mt-1" style="word-break:break-word;">${flashcard.preposition_usage}</p>` : ''}
                        <div class="flex gap-2 mt-2 flex-wrap">
                            <span class="text-xs px-2 py-1 rounded-full ${flashcard.source && flashcard.source.startsWith('ai_generated') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">${flashcard.source && flashcard.source.startsWith('ai_generated') ? '🤖 AI' : '✍️ Manual'}</span>
                            <span class="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">Reviewed ${flashcard.times_reviewed}x</span>
                        </div>
                        <div class="flex gap-2 mt-2 items-center flex-wrap">
                            ${getAudioButtonHTML(flashcard)}
                            ${getTTSButtonHTML(flashcard.id)}
                            <button onclick="copyShareLink('${flashcard.id}')" class="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">🔗</button>
                            <button onclick="editCard('${flashcard.id}')" class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">✏️</button>
                            <button onclick="confirmDeleteById('${flashcard.id}')" class="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">🗑️</button>
                        </div>
                        ${getIPAHTML(flashcard)}
                    </div>
                </div>
            </div>

            <!-- Details section (expanded by default) -->
            <div class="bg-white rounded-xl shadow-md mb-3 overflow-hidden">
                <button class="sf-section-toggle w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        data-sf-section="details-${flashcard.id}" style="background:none;border:none;cursor:pointer;">
                    <span class="font-semibold text-gray-800">Details</span>
                    <span class="sf-chevron text-gray-400 text-sm" data-sf-section="details-${flashcard.id}" style="transition:transform 0.2s;display:inline-block;transform:rotate(0deg);">▼</span>
                </button>
                <div id="sf-section-details-${flashcard.id}" style="display:block;">
                    <div class="px-4 pb-4 space-y-4">
                        ${flashcard.definition ? `
                            <div>
                                <h3 class="text-xs font-semibold text-indigo-900 uppercase mb-1">Definition</h3>
                                <p class="text-gray-800 leading-relaxed text-sm">${flashcard.definition}</p>
                            </div>
                        ` : ''}
                        ${flashcard.etymology ? `
                            <div>
                                <h3 class="text-xs font-semibold text-indigo-900 uppercase mb-1">Etymology</h3>
                                <p class="text-gray-700 text-sm">${flashcard.etymology}</p>
                                <div id="etymython-link-study-${flashcard.id}"></div>
                            </div>
                        ` : ''}
                        ${flashcard.pie_root && flashcard.pie_root !== 'N/A' ? `
                            <div class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                <div class="flex items-center justify-between mb-1">
                                    <h3 class="text-xs font-semibold text-amber-900 uppercase">PIE Root</h3>
                                    <button class="pie-audio-btn px-2 py-0.5 text-xs rounded ${flashcard.pie_audio_url ? 'bg-amber-200 text-amber-900 hover:bg-amber-300 cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}"
                                        data-pie-root="${flashcard.pie_root || ''}"
                                        data-pie-ipa="${flashcard.pie_ipa || ''}"
                                        data-audio-url="${flashcard.pie_audio_url || ''}"
                                        title="${flashcard.pie_root || ''}${flashcard.pie_ipa ? ' / /' + flashcard.pie_ipa + '/' : ''}"
                                        ${!flashcard.pie_audio_url ? 'disabled' : ''}>PIE 🔊</button>
                                </div>
                                <p class="text-amber-800 font-mono font-semibold text-sm">${flashcard.pie_root}${flashcard.pie_ipa ? ` <span class="text-amber-600 font-normal">/${flashcard.pie_ipa}/</span>` : ''}</p>
                                ${flashcard.pie_meaning ? `<p class="text-amber-700 text-sm mt-1">${flashcard.pie_meaning}</p>` : ''}
                            </div>
                        ` : ''}
                        ${flashcard.compound_parts ? (() => {
                            try {
                                const parts = typeof flashcard.compound_parts === 'string'
                                    ? JSON.parse(flashcard.compound_parts) : flashcard.compound_parts;
                                return Array.isArray(parts) && parts.length > 0 ? `
                                    <div class="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                        <h3 class="text-xs font-semibold text-blue-900 uppercase mb-1">Word Breakdown</h3>
                                        <div class="flex flex-wrap gap-2">
                                            ${parts.map(p => `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"><strong>${p.root}</strong> — ${p.meaning}</span>`).join('')}
                                        </div>
                                    </div>` : '';
                            } catch(e) { return ''; }
                        })() : ''}
                        ${flashcard.english_cognates ? `
                            <div>
                                <h3 class="text-xs font-semibold text-indigo-900 uppercase mb-1">English Cognates</h3>
                                <p class="text-gray-700 text-sm">${flashcard.english_cognates}</p>
                            </div>
                        ` : ''}
                        ${relatedWords.length > 0 ? `
                            <div>
                                <h3 class="text-xs font-semibold text-indigo-900 uppercase mb-1">Related Words</h3>
                                <div class="flex flex-wrap gap-2">
                                    ${relatedWords.map(w => {
                                        const word = w.trim();
                                        const inDeck = state.flashcards?.some(c => c.word_or_phrase === word);
                                        if (inDeck) {
                                            return `<span class="px-2 py-1 bg-indigo-600 text-white rounded-full text-xs cursor-pointer hover:bg-indigo-700" style="text-decoration:underline;text-underline-offset:2px;" onclick="navigateToRelatedWord('${word.replace(/'/g, "\\'")}'); event.stopPropagation();">${word} →</span>`;
                                        } else {
                                            return `<span class="px-2 py-1 bg-gray-100 text-gray-400 rounded-full text-xs" style="cursor:default;pointer-events:none;">${word}</span>`;
                                        }
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                        <!-- Word Family Graph (SF-027) -->
                        <div id="word-family-${flashcard.id}" class="word-family-container"></div>
                        <!-- DCC Dictionary Panel (SF-DCC-001) -->
                        <div id="dcc-panel-${flashcard.id}"></div>
                        <!-- Word Video (SF-VID-001) -->
                        <div id="video-panel-${flashcard.id}" class="mt-3">
                            ${flashcard.video_url
                                ? `<div>
                                       <h3 class="text-xs font-semibold text-indigo-900 uppercase mb-1">Word Video</h3>
                                       <video controls playsinline style="width:100%;border-radius:8px;max-height:240px;background:#000;">
                                           <source src="${flashcard.video_url}" type="video/mp4">
                                       </video>
                                   </div>`
                                : `<button onclick="generateCardVideo('${flashcard.id}')"
                                           class="w-full text-sm px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition border border-purple-200"
                                           id="gen-video-btn-${flashcard.id}">
                                       Generate Word Video
                                   </button>
                                   <div id="video-status-${flashcard.id}" style="display:none"
                                        class="text-xs text-center text-gray-400 mt-2">
                                       Generating video... (~90 seconds)
                                   </div>`
                            }
                        </div>
                    </div>
                </div>
            </div>

            <!-- Practice section (collapsed by default) -->
            <div class="bg-white rounded-xl shadow-md mb-3 overflow-hidden">
                <button class="sf-section-toggle w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        data-sf-section="practice-${flashcard.id}" style="background:none;border:none;cursor:pointer;">
                    <span class="font-semibold text-gray-800">Practice</span>
                    <span class="sf-chevron text-gray-400 text-sm" data-sf-section="practice-${flashcard.id}" style="transition:transform 0.2s;display:inline-block;transform:rotate(-90deg);">▼</span>
                </button>
                <div id="sf-section-practice-${flashcard.id}" style="display:none;">
                    <div class="px-4 pb-4">
                        <p class="text-sm text-gray-500 mb-3">How well do you know this word?</p>
                        <div id="sr-rating-buttons" class="flex gap-2 flex-wrap mb-3">
                            <button onclick="window.submitSRRating(0)"
                                class="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition border border-red-200 min-w-[60px]">
                                😰 Again
                            </button>
                            <button onclick="window.submitSRRating(2)"
                                class="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 transition border border-orange-200 min-w-[60px]">
                                😓 Hard
                            </button>
                            <button onclick="window.submitSRRating(4)"
                                class="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition border border-blue-200 min-w-[60px]">
                                🙂 Good
                            </button>
                            <button onclick="window.submitSRRating(5)"
                                class="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition border border-green-200 min-w-[60px]">
                                😊 Easy
                            </button>
                        </div>
                        <p id="sr-next-review" class="text-xs text-center text-gray-400 mb-3 hidden"></p>
                        <div class="border-t border-gray-100 pt-3">
                            <div id="pronunciation-recorder-container"></div>
                            <div id="voice-clone-container" class="mt-3"></div>
                        </div>
                        ${flashcard.next_review_date ? `
                            <div class="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                                Next review: ${flashcard.next_review_date}
                                ${flashcard.review_interval ? ` · Interval: ${flashcard.review_interval}d` : ''}
                            </div>` : ''}
                    </div>
                </div>
            </div>

            <!-- Prev / Edit / Next -->
            <div class="flex gap-2">
                <button onclick="previousCard(); event.stopPropagation();"
                        class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm disabled:opacity-40"
                        ${state.currentCardIndex === 0 ? 'disabled' : ''}>← Prev</button>
                <span class="flex items-center text-xs text-gray-400 px-2">${state.currentCardIndex + 1} / ${state.flashcards.length}</span>
                <button onclick="editCard('${flashcard.id}')"
                        class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">✏️ Edit</button>
                <button onclick="nextCard(); event.stopPropagation();"
                        class="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-40"
                        ${state.currentCardIndex >= state.flashcards.length - 1 ? 'disabled' : ''}>Next →</button>
            </div>
        </div>
    `;
    
    // BV-07: Image tap — touchend + click for iPhone (SF-MOBILE-FIX-001)
    const imgThumb = container.querySelector('#sf-img-thumb');
    if (imgThumb) {
        ['click', 'touchend'].forEach(function(eventType) {
            imgThumb.addEventListener(eventType, function(e) {
                e.preventDefault();
                e.stopPropagation();
                const m = document.getElementById('img-fullscreen-modal');
                const i = document.getElementById('img-fullscreen-img');
                if (m && i && flashcard.image_url) {
                    i.src = fixAssetUrl(flashcard.image_url);
                    i.alt = flashcard.image_description || flashcard.word_or_phrase;
                }
                if (m) m.style.display = 'flex';
            });
        });
    }

    // Section toggle handlers — SF-MOBILE-UI-001
    document.querySelectorAll('.sf-section-toggle').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.dataset.sfSection;
            const content = document.getElementById('sf-section-' + sectionId);
            const chevron = document.querySelector('.sf-chevron[data-sf-section="' + sectionId + '"]');
            if (!content) return;
            const isOpen = content.style.display !== 'none';
            content.style.display = isOpen ? 'none' : 'block';
            if (chevron) chevron.style.transform = isOpen ? 'rotate(-90deg)' : 'rotate(0deg)';
            // Opening Practice section = mark as reviewed
            if (!isOpen && sectionId.startsWith('practice-') && state.flashcards[state.currentCardIndex]) {
                markAsReviewed(state.flashcards[state.currentCardIndex].id);
            }
        });
    });

    // Initialize pronunciation recorder if available (destroy previous instance first)
    if (typeof PronunciationRecorder !== 'undefined') {
        setTimeout(() => {
            if (window.pronunciationRecorder) {
                window.pronunciationRecorder.destroy();
            }
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const currentLanguage = state.languages?.find(lang => lang.id === state.currentLanguage);
            window.pronunciationRecorder = new PronunciationRecorder({
                containerSelector: '#pronunciation-recorder-container',
                flashcardId: flashcard.id,
                userId: currentUser.id || 'anonymous',
                targetText: flashcard.word_or_phrase,
                targetAudioUrl: flashcard.audio_url || null,
                languageCode: currentLanguage?.code || 'fr',
                apiBaseUrl: API_BASE.replace('/api', '') + '/api/v1/pronunciation'
            });
        }, 100);
    }

    // Initialize voice clone UI if available
    if (typeof VoiceCloneManager !== 'undefined' && window.voiceClone) {
        setTimeout(() => {
            const currentLanguage = state.languages?.find(lang => lang.id === state.currentLanguage);
            window.voiceClone.setFlashcardContext({
                text: flashcard.word_or_phrase,
                languageCode: currentLanguage?.code || 'fr'
            });
            window.voiceClone.renderSetupPrompt('voice-clone-container');
        }, 150);
    }

    if (flashcard.etymology) {
        injectEtymythonLink(flashcard, `etymython-link-study-${flashcard.id}`);
    }

    // Load word family graph (SF-027)
    loadWordFamily(flashcard.id, flashcard.word_or_phrase);

    // Load DCC dictionary panel (SF-DCC-001)
    loadDccPanel(flashcard.id);

    // Add touch/swipe support for mobile navigation
    addSwipeSupport();
}

function flipCard() {
    const card = document.querySelector('.flashcard');
    if (!card) return; // SF-MOBILE-UI-001: new layout has no flip
    card.classList.toggle('flipped');
    state.isFlipped = !state.isFlipped;

    // Mark as reviewed when flipping
    if (state.flashcards[state.currentCardIndex]) {
        markAsReviewed(state.flashcards[state.currentCardIndex].id);
    }

    // Show SR rating buttons when card is revealed (flipped to answer side)
    const ratingButtons = document.getElementById('sr-rating-buttons');
    if (ratingButtons) {
        if (state.isFlipped) {
            ratingButtons.classList.remove('hidden');
        } else {
            ratingButtons.classList.add('hidden');
            const nextReview = document.getElementById('sr-next-review');
            if (nextReview) nextReview.classList.add('hidden');
        }
    }
}

// ========================================
// SF-MS2: Gender Badge (SF-023)
// ========================================
function getGenderBadgeHTML(gender) {
    if (!gender) return '';
    const badges = {
        masculine: '<span class="inline-block ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700">m</span>',
        feminine: '<span class="inline-block ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-rose-100 text-rose-700">f</span>',
        neuter: '<span class="inline-block ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-gray-200 text-gray-600">n</span>'
    };
    return badges[gender] || '';
}

// ========================================
// SM05 Fix 2: Unified TTS with provider selector
// ========================================
let _ttsCurrentAudio = null;
let _ttsIsPlaying = false;
let _ttsCurrentCardId = null;

function _ttsSpeakerSVG() {
    // Person speaking with sound waves — clean SVG icon
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2"/><path d="M18 9a4 4 0 0 1 0 6"/></svg>`;
}

function _ttsStopSVG() {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;
}

function _ttsProviderLabel() {
    const p = localStorage.getItem('tts_provider') || '11labs';
    // SFSENT3-REQ-002: Normalize legacy 'speechify' → show as 11Labs
    if (p === '11labs' || p === 'speechify') return '11Labs';
    if (p === 'browser-premium') return 'Browser Premium';
    return 'Browser';
}

function _updateTTSBtn(btn, playing) {
    if (!btn) return;
    if (playing) {
        btn.innerHTML = _ttsStopSVG();
        btn.title = `Stop (playing via ${_ttsProviderLabel()})`;
        btn.classList.add('text-red-500');
        btn.classList.remove('text-indigo-600');
    } else {
        btn.innerHTML = _ttsSpeakerSVG();
        btn.title = `Read aloud (${_ttsProviderLabel()})`;
        btn.classList.remove('text-red-500');
        btn.classList.add('text-indigo-600');
    }
}

function stopTTS() {
    window.speechSynthesis?.cancel();
    if (_ttsCurrentAudio) { _ttsCurrentAudio.pause(); _ttsCurrentAudio = null; }
    _ttsIsPlaying = false;
    if (_ttsCurrentCardId) {
        document.querySelectorAll(`[data-tts-btn="${_ttsCurrentCardId}"]`).forEach(b => _updateTTSBtn(b, false));
        _ttsCurrentCardId = null;
    }
}

let _ttsDebounceTimer = null;

async function playTTS(cardId) {
    // SM08 Fix 3: Debounce — prevent double-trigger from keyboard bounce
    if (_ttsDebounceTimer) return;
    _ttsDebounceTimer = setTimeout(() => { _ttsDebounceTimer = null; }, 300);

    // Blur the button so spacebar/Enter doesn't re-trigger
    const activeBtn = document.querySelector(`[data-tts-btn="${cardId}"]`);
    if (activeBtn) activeBtn.blur();

    // Toggle stop if already playing
    if (_ttsIsPlaying) { stopTTS(); return; }

    const card = state.flashcards?.find(c => c.id === cardId);
    if (!card) return;

    const lang = state.languages?.find(l => l.id === card.language_id);
    const cardLang = lang?.code || 'el';
    const contentLang = 'en'; // definitions, etymology, cognates are always in English
    // SFSENT3-REQ-002: Normalize legacy provider values (speechify → 11labs)
    const validProviders = ['11labs', 'browser', 'browser-premium'];
    const storedProvider = localStorage.getItem('tts_provider') || '11labs';
    const provider = validProviders.includes(storedProvider) ? storedProvider : '11labs';
    const speed = parseFloat(localStorage.getItem('tts_speed') || '1.0');

    // SM08 Fix 1: Build segments with correct language per field
    const segments = [];
    if (card.word_or_phrase) segments.push({text: card.word_or_phrase, language: cardLang});
    if (card.ipa_pronunciation) segments.push({text: `Pronounced: ${card.ipa_pronunciation}`, language: cardLang});
    if (card.definition) segments.push({text: card.definition, language: contentLang});
    if (card.etymology) segments.push({text: `Etymology: ${card.etymology}`, language: contentLang});
    if (card.pie_root && card.pie_root !== 'N/A') segments.push({text: `Proto-Indo-European root: ${card.pie_root}`, language: contentLang});
    if (card.english_cognates) segments.push({text: `English cognates: ${card.english_cognates}`, language: contentLang});

    const text = segments.map(s => s.text).join('. ');

    _ttsIsPlaying = true;
    _ttsCurrentCardId = cardId;
    document.querySelectorAll(`[data-tts-btn="${cardId}"]`).forEach(b => _updateTTSBtn(b, true));

    const onEnd = () => {
        _ttsIsPlaying = false;
        _ttsCurrentCardId = null;
        document.querySelectorAll(`[data-tts-btn="${cardId}"]`).forEach(b => _updateTTSBtn(b, false));
    };

    if (provider === 'browser') {
        _speakSegments(segments, speed, onEnd);
    } else if (provider === 'browser-premium') {
        _speakBestVoice(segments, speed, onEnd);
    } else {
        // 11Labs via backend endpoint
        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text, language: cardLang, provider, speed, segments})
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.error === 'use_browser_tts') {
                // Backend says use browser fallback — use returned segments for correct language
                _speakSegments(data.segments || segments, data.speed || speed, onEnd);
            } else if (data.audio_url) {
                const audio = new Audio(data.audio_url);
                _ttsCurrentAudio = audio;
                audio.onended = onEnd;
                audio.onerror = onEnd;
                await audio.play();
            } else { onEnd(); }
        } catch (e) {
            console.error('TTS error:', e);
            onEnd();
            showToast('Audio unavailable', 3000);
        }
    }
}

function _speakSegments(segments, speed, onEnd) {
    if (!window.speechSynthesis) { showToast('Speech not supported', 3000); onEnd(); return; }
    window.speechSynthesis.cancel();
    const segs = segments && segments.length > 0 ? segments : [{text: '', language: 'en'}];
    let remaining = segs.length;
    segs.forEach((seg, i) => {
        if (!seg.text) { remaining--; if (remaining <= 0) onEnd(); return; }
        const utt = new SpeechSynthesisUtterance(seg.text);
        utt.lang = seg.language || 'en';
        utt.rate = speed || 1.0;
        utt.onend = () => { remaining--; if (remaining <= 0) onEnd(); };
        utt.onerror = () => { remaining--; if (remaining <= 0) onEnd(); };
        window.speechSynthesis.speak(utt);
    });
}

function _speakBestVoice(segments, speed, onEnd) {
    if (!window.speechSynthesis) { showToast('Speech not supported', 3000); onEnd(); return; }
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const segs = segments && segments.length > 0 ? segments : [{text: '', language: 'en'}];
    let remaining = segs.length;
    segs.forEach((seg) => {
        if (!seg.text) { remaining--; if (remaining <= 0) onEnd(); return; }
        const utt = new SpeechSynthesisUtterance(seg.text);
        utt.lang = seg.language || 'en';
        utt.rate = speed || 1.0;
        const langVoices = voices.filter(v => v.lang.startsWith(seg.language || 'en'));
        const premiumVoice = langVoices.find(v => /natural|premium|neural|online/i.test(v.name)) || langVoices[0];
        if (premiumVoice) utt.voice = premiumVoice;
        utt.onend = () => { remaining--; if (remaining <= 0) onEnd(); };
        utt.onerror = () => { remaining--; if (remaining <= 0) onEnd(); };
        window.speechSynthesis.speak(utt);
    });
}

function getTTSButtonHTML(cardId) {
    return `<button data-tts-btn="${cardId}" onclick="playTTS('${cardId}'); event.stopPropagation();"
        title="Read aloud (${_ttsProviderLabel()})"
        class="flex items-center justify-center w-7 h-7 text-indigo-600 hover:bg-indigo-50 rounded transition-colors">${_ttsSpeakerSVG()}</button>`;
}

// ========================================
// SF-MS2: ElevenLabs TTS (SF-026) — legacy kept for card audio generation
// ========================================
async function playCardTTS(cardId) {
    const btn = document.querySelector(`[data-card-tts="${cardId}"]`);
    if (btn) {
        btn.disabled = true;
        btn.textContent = '...';
    }
    try {
        const res = await fetch(`/api/cards/${cardId}/audio`, {method: 'POST'});
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const audio = new Audio(data.url);
        audio.onended = () => { if (btn) { btn.disabled = false; btn.textContent = '🔊'; } };
        audio.onerror = () => { if (btn) { btn.disabled = false; btn.textContent = '🔊'; } };
        await audio.play();
    } catch (e) {
        console.error('ElevenLabs TTS error:', e);
        if (btn) { btn.disabled = false; btn.textContent = '🔊'; }
        // REQ-001: Web Speech API fallback
        const card = state.flashcards?.find(c => c.id === cardId);
        if (card && window.speechSynthesis) {
            const lang = state.languages?.find(l => l.id === card.language_id);
            const utt = new SpeechSynthesisUtterance(
                `${card.word_or_phrase}. ${card.definition || ''}`
            );
            utt.lang = lang?.code || 'en';
            window.speechSynthesis.speak(utt);
        } else {
            showToast('Audio unavailable', 3000);
        }
    }
}

// ========================================
// REQ-001: Web Speech API read-aloud
// ========================================
function readCardAloud(cardId) {
    if (!window.speechSynthesis) {
        showToast('Speech not supported in this browser', 3000);
        return;
    }
    const card = state.flashcards?.find(c => c.id === cardId);
    if (!card) return;
    const lang = state.languages?.find(l => l.id === card.language_id);
    const text = card.word_or_phrase + (card.definition ? '. ' + card.definition : '');
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang?.code || 'en';
    utt.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
}

// ========================================
// SF-VID-001: Word Video via ArtForge
// ========================================
async function generateCardVideo(cardId) {
    const btn = document.getElementById(`gen-video-btn-${cardId}`);
    const statusEl = document.getElementById(`video-status-${cardId}`);
    if (btn) btn.style.display = 'none';
    if (statusEl) statusEl.style.display = 'block';

    try {
        const resp = await fetch(`/api/flashcards/${cardId}/generate-video`, { method: 'POST' });
        const data = await resp.json();

        if (data.status === 'already_exists' && data.video_url) {
            _showVideoPlayer(cardId, data.video_url);
            return;
        }

        if (data.status === 'queued' || data.status === 'in_progress') {
            _pollVideoStatus(cardId);
        } else {
            if (statusEl) statusEl.textContent = 'Video generation failed.';
        }
    } catch (e) {
        console.error('[SFVID] generate error:', e);
        if (statusEl) statusEl.textContent = 'Error starting video generation.';
        if (btn) btn.style.display = '';
        if (statusEl) statusEl.style.display = 'none';
    }
}

function _pollVideoStatus(cardId) {
    const statusEl = document.getElementById(`video-status-${cardId}`);
    let attempts = 0;
    const maxAttempts = 36; // 6 minutes
    const interval = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
            clearInterval(interval);
            if (statusEl) statusEl.textContent = 'Video generation timed out.';
            return;
        }
        try {
            const resp = await fetch(`/api/flashcards/${cardId}/video-status`);
            const data = await resp.json();
            if (data.status === 'complete' && data.video_url) {
                clearInterval(interval);
                _showVideoPlayer(cardId, data.video_url);
                // Update local state so reload shows video
                const card = state.flashcards?.find(c => String(c.id) === String(cardId));
                if (card) card.video_url = data.video_url;
            }
        } catch (e) {
            console.warn('[SFVID] poll error:', e);
        }
    }, 10000);
}

function _showVideoPlayer(cardId, videoUrl) {
    const panel = document.getElementById(`video-panel-${cardId}`);
    if (!panel) return;
    panel.innerHTML = `
        <div>
            <h3 class="text-xs font-semibold text-indigo-900 uppercase mb-1">Word Video</h3>
            <video controls playsinline style="width:100%;border-radius:8px;max-height:240px;background:#000;">
                <source src="${videoUrl}" type="video/mp4">
            </video>
        </div>`;
}

// ========================================
// SF-MS2: Word Family Graph (SF-027)
// ========================================
async function loadWordFamily(cardId, cardWord) {
    const container = document.getElementById(`word-family-${cardId}`);
    if (!container) return;

    try {
        const res = await fetch(`/api/cards/${cardId}/word-family`);
        if (!res.ok) return;
        const data = await res.json();

        if (!data.cognates || data.cognates.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mt-4">
                <h3 class="text-sm font-semibold text-green-900 uppercase mb-2">Word Family</h3>
                <div id="word-family-graph-${cardId}" style="width:100%;height:200px;"></div>
            </div>
        `;

        renderWordFamilyGraph(`word-family-graph-${cardId}`, cardWord, data.cognates);
    } catch (e) {
        console.error('Word family load error:', e);
        container.style.display = 'none';
    }
}

function renderWordFamilyGraph(containerId, rootWord, cognates) {
    const container = document.getElementById(containerId);
    if (!container || !cognates.length) return;

    const width = container.clientWidth || 300;
    const height = 200;

    // Build nodes and links
    const nodes = [
        {id: rootWord, type: 'root', x: width/2, y: height/2}
    ];
    const links = [];

    cognates.forEach((c, i) => {
        const angle = (2 * Math.PI * i) / cognates.length;
        const r = Math.min(width, height) * 0.35;
        nodes.push({
            id: c.word,
            type: 'cognate',
            meaning: c.meaning,
            figure: c.figure,
            x: width/2 + r * Math.cos(angle),
            y: height/2 + r * Math.sin(angle)
        });
        links.push({source: rootWord, target: c.word});
    });

    // Render as SVG (no D3 dependency needed for simple layout)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Draw links
    links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', source.x);
        line.setAttribute('y1', source.y);
        line.setAttribute('x2', target.x);
        line.setAttribute('y2', target.y);
        line.setAttribute('stroke', '#94a3b8');
        line.setAttribute('stroke-width', '1.5');
        svg.appendChild(line);
    });

    // Draw nodes
    nodes.forEach(node => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', node.type === 'root' ? 8 : 6);
        circle.setAttribute('fill', node.type === 'root' ? '#3b82f6' : '#22c55e');
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');
        g.appendChild(circle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y + (node.type === 'root' ? -14 : 18));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#1e293b');
        text.setAttribute('font-size', node.type === 'root' ? '12' : '10');
        text.setAttribute('font-weight', node.type === 'root' ? 'bold' : 'normal');
        text.textContent = node.id.length > 15 ? node.id.slice(0, 13) + '...' : node.id;
        g.appendChild(text);

        if (node.meaning) {
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${node.id}: ${node.meaning}`;
            g.appendChild(title);
        }

        svg.appendChild(g);
    });

    container.appendChild(svg);
}

// ========================================
// SF-DCC-001: DCC Dictionary Panel
// ========================================
async function loadDccPanel(cardId) {
    const container = document.getElementById(`dcc-panel-${cardId}`);
    if (!container) return;

    // Show shimmer while loading
    container.innerHTML = '<div class="dcc-shimmer"></div>';

    try {
        const res = await fetch(`/api/v1/cards/${cardId}/dcc`);
        if (!res.ok) { container.innerHTML = ''; return; }
        const data = await res.json();

        if (!data.matched) { container.innerHTML = ''; return; }

        const cognatesHtml = data.cognates && data.cognates.length
            ? `<div class="dcc-cognates">English cognates: ${data.cognates.join(', ')}</div>`
            : '';
        const usageHtml = data.usage_note
            ? `<div class="dcc-usage">${data.usage_note}</div>`
            : '';
        const freqHtml = data.frequency_context
            ? `<div class="dcc-freq">${data.frequency_context}</div>`
            : '';
        const pieHtml = data.pie_root
            ? `<div class="dcc-pie">PIE root: ${data.pie_root}</div>`
            : '';

        container.innerHTML = `
            <div class="dcc-panel">
                <div class="dcc-header">
                    <span class="dcc-badge">📖 DCC Greek Core</span>
                    <span class="dcc-rank">#${data.rank} of 519</span>
                </div>
                <div class="dcc-definition">${data.extended_def || data.gloss || ''}</div>
                <div class="dcc-details">
                    ${data.pos ? `<span class="dcc-pos">${data.pos}</span>` : ''}
                    ${data.semantic_group ? `<span class="dcc-pos">${data.semantic_group}</span>` : ''}
                </div>
                ${pieHtml}
                ${cognatesHtml}
                ${usageHtml}
                ${freqHtml}
                <a href="${data.dcc_url}" target="_blank" rel="noopener" class="dcc-source-link">dcc.dickinson.edu ↗</a>
            </div>
        `;
    } catch (e) {
        container.innerHTML = '';
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

// SF-003: Navigate to a related word card by word text (only called for in-deck words)
function navigateToRelatedWord(word) {
    const card = state.flashcards.find(c => c.word_or_phrase === word);
    if (card) {
        state.currentCardIndex = state.flashcards.indexOf(card);
        renderFlashcard(card);
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('cardId', card.id);
        window.history.pushState({}, '', `${window.location.pathname}?${urlParams}`);
    }
}

function updateCardCounter() {
    const counter = document.getElementById('card-counter');
    if (!counter) return;
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
                                    <h2 class="text-3xl font-bold text-indigo-900">
                                        ${flashcard.word_or_phrase}${getGenderBadgeHTML(flashcard.gender)}
                                    </h2>
                                    <p class="text-sm text-indigo-600 mt-1">${flashcard.language_name || 'Word'}</p>
                                    ${flashcard.preposition_usage ? `<p class="text-sm text-indigo-500 mt-1 italic">${flashcard.preposition_usage}</p>` : ''}
                                </div>
                                <button onclick="editCard('${flashcard.id}')"
                                        class="px-3 py-1 bg-white text-indigo-700 rounded-md hover:bg-indigo-50 text-sm transition-colors shadow-sm"
                                        title="Edit this card">
                                    ✏️ Edit
                                </button>
                            </div>

                            <!-- Audio Controls -->
                            <div class="mt-3 flex items-center gap-3">
                                ${getAudioButtonHTML(flashcard)}
                                ${getTTSButtonHTML(flashcard.id)}
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
                            <div id="etymython-link-read-${flashcard.id}"></div>
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

                    ${flashcard.pie_root && flashcard.pie_root !== 'N/A' ? `
                        <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                            <h3 class="text-sm font-semibold text-amber-900 uppercase mb-1 flex items-center gap-2">
                                <span class="text-lg">🌳</span> PIE Root
                            </h3>
                            <p class="text-amber-800 font-mono font-semibold text-lg">${flashcard.pie_root}</p>
                            ${flashcard.pie_meaning ? `<p class="text-amber-700 text-sm mt-1">${flashcard.pie_meaning}</p>` : ''}
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

    if (flashcard.etymology) {
        injectEtymythonLink(flashcard, `etymython-link-read-${flashcard.id}`);
    }
    
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
 * Render a simplified card for Practice mode (pronunciation focus)
 * Shows word, definition, image, audio button + pronunciation recorder
 */
function renderPracticeCard(flashcard) {
    const container = document.getElementById('practice-card-container');
    if (!container || !flashcard) return;

    container.innerHTML = `
        <div class="max-w-3xl mx-auto">
            <!-- Practice Card: simplified for pronunciation focus -->
            <div class="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl shadow-2xl p-6">
                <!-- Header: image + word + definition -->
                <div class="flex items-center gap-4 mb-4">
                    ${flashcard.image_url ? `
                        <img src="${fixAssetUrl(flashcard.image_url)}"
                             alt="${flashcard.image_description || flashcard.word_or_phrase}"
                             class="w-20 h-20 object-cover rounded-lg shadow-md border-2 border-white flex-shrink-0">
                    ` : `
                        <div class="w-20 h-20 bg-gradient-to-br from-green-200 to-teal-200 rounded-lg shadow-md flex items-center justify-center border-2 border-white flex-shrink-0">
                            <span class="text-3xl">🎙</span>
                        </div>
                    `}
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-green-900">${flashcard.word_or_phrase}</h2>
                        ${flashcard.definition ? `<p class="text-gray-700 mt-1">${flashcard.definition}</p>` : ''}
                        <div class="mt-2">${getAudioButtonHTML(flashcard)}</div>
                    </div>
                </div>

                <!-- Pronunciation Recorder -->
                <div id="practice-pronunciation-recorder-container"></div>
            </div>

            <!-- Navigation Controls -->
            <div class="mt-4 flex justify-between items-center gap-4">
                <button onclick="previousPracticeCard()"
                        class="px-6 py-3 bg-white text-green-700 rounded-lg hover:bg-green-50 font-medium shadow-md border border-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        ${state.currentCardIndex === 0 ? 'disabled' : ''}>
                    ← Previous
                </button>
                <div class="text-sm text-green-600 font-medium px-4 py-2 bg-white rounded-lg shadow-sm border border-green-100">
                    ${state.currentCardIndex + 1} of ${state.flashcards.length}
                </div>
                <button onclick="nextPracticeCard()"
                        class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        ${state.currentCardIndex >= state.flashcards.length - 1 ? 'disabled' : ''}>
                    Next →
                </button>
            </div>
        </div>
    `;

    // Initialize pronunciation recorder (destroy previous instance first)
    if (typeof PronunciationRecorder !== 'undefined') {
        setTimeout(() => {
            if (window.practicePronunciationRecorder) {
                window.practicePronunciationRecorder.destroy();
            }
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const currentLanguage = state.languages?.find(lang => lang.id === state.currentLanguage);
            window.practicePronunciationRecorder = new PronunciationRecorder({
                containerSelector: '#practice-pronunciation-recorder-container',
                flashcardId: flashcard.id,
                userId: currentUser.id || 'anonymous',
                targetText: flashcard.word_or_phrase,
                targetAudioUrl: flashcard.audio_url || null,
                languageCode: currentLanguage?.code || 'fr',
                apiBaseUrl: API_BASE.replace('/api', '') + '/api/v1/pronunciation',
                compactProgress: true
            });
        }, 100);
    }

    // Add swipe support for practice mode navigation
    addPracticeModeSwipeSupport();
}

/**
 * Navigate to next card in practice mode
 */
function nextPracticeCard() {
    if (state.currentCardIndex < state.flashcards.length - 1) {
        state.currentCardIndex++;
        renderPracticeCard(state.flashcards[state.currentCardIndex]);
        document.getElementById('practice-card-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Navigate to previous card in practice mode
 */
function previousPracticeCard() {
    if (state.currentCardIndex > 0) {
        state.currentCardIndex--;
        renderPracticeCard(state.flashcards[state.currentCardIndex]);
        document.getElementById('practice-card-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Add swipe support for Practice Mode navigation
 */
function addPracticeModeSwipeSupport() {
    const container = document.getElementById('practice-card-container');
    if (!container) return;

    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextPracticeCard();
            else previousPracticeCard();
        }
    }, { passive: true });
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
 * @param {string} sortOrder - Sort order ('name-asc', 'name-desc', 'date-asc', 'date-desc', 'srs')
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
            case 'srs': {
                // SRS priority: overdue > due today > new (no review date) > not due yet
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const srsBucket = (card) => {
                    if (!card.next_review_date) return 1; // new card — second priority
                    const reviewDate = new Date(card.next_review_date);
                    reviewDate.setHours(0, 0, 0, 0);
                    if (reviewDate < today) return 0; // overdue — highest priority
                    if (reviewDate.getTime() === today.getTime()) return 1; // due today
                    return 2; // not due yet — lowest priority
                };
                const aBucket = srsBucket(a);
                const bBucket = srsBucket(b);
                if (aBucket !== bBucket) return aBucket - bBucket;
                // Within same bucket, sort by ease_factor ascending (hardest first)
                return (a.ease_factor || 2.5) - (b.ease_factor || 2.5);
            }
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
    let cardsToDisplay = state.flashcards;

    // Apply difficulty filter if set
    if (state.difficultyFilter && state.difficultyFilter !== 'all') {
        cardsToDisplay = cardsToDisplay.filter(c => (c.difficulty || 'unrated') === state.difficultyFilter);
    }

    if (cardsToDisplay.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-gray-500 py-8">No cards match the selected difficulty filter.</p>`;
        return;
    }

    const sortedCards = sortFlashcards(cardsToDisplay, state.sortOrder);
    
    // SF-MOBILE-UI-001: language badge helper
    const langCodeMap = { el: 'GR', en: 'EN', fr: 'FR', de: 'DE', es: 'ES', it: 'IT', pt: 'PT', ja: 'JA', zh: 'ZH' };

    listContainer.innerHTML = sortedCards.map((card) => {
        const originalIndex = state.flashcards.indexOf(card);
        const cardLangObj = state.languages?.find(l => l.id === card.language_id);
        const langBadge = cardLangObj ? (langCodeMap[cardLangObj.code] || cardLangObj.code.toUpperCase().slice(0, 2)) : '';
        return `
        <div class="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
            <div class="flex justify-between items-start">
                <div class="flex-1 cursor-pointer" onclick="selectCard(${originalIndex})">
                    <div class="flex items-baseline gap-2 flex-wrap">
                        <h3 class="font-semibold text-gray-900 text-lg mb-1">${card.word_or_phrase}${getGenderBadgeHTML(card.gender)}</h3>
                        ${langBadge ? `<span class="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">${langBadge}</span>` : ''}
                    </div>
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
                    <button onclick="confirmDeleteById('${card.id}'); event.stopPropagation();"
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

        // SF-014: read language filter from dropdown (defaults to "all")
        const langFilter = (document.getElementById('search-language-filter') || {}).value || 'all';

        console.log('Searching for:', query, 'language:', langFilter);

        let searchResults = [];

        try {
            // SF-014: use cross-language search endpoint
            const langParam = langFilter !== 'all' ? `&language=${encodeURIComponent(langFilter)}` : '';
            const url = `/api/search?q=${encodeURIComponent(query)}${langParam}&limit=50`;
            const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
            if (response.ok) {
                const data = await response.json();
                searchResults = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.warn('Cross-language search failed, falling back:', error);
            // Fallback to original per-language search
            if (apiClient) {
                const languageId = state.currentLanguage && state.currentLanguage !== 'all'
                    ? state.currentLanguage : null;
                searchResults = await apiClient.searchFlashcards(query, languageId);
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
    const recorderContainer = document.querySelector('#pronunciation-recorder-container') || document.querySelector('#practice-pronunciation-recorder-container');
    const recorderVisible = recorderContainer && recorderContainer.offsetParent !== null;
    if (recorderVisible && (e.key === ' ' || e.key === 'Enter')) {
        // Let the recorder handle Space/Enter
        return;
    }

    // Handle keyboard navigation based on current mode
    if (state.currentMode === 'practice') {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                previousPracticeCard();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextPracticeCard();
                break;
            // Space is reserved for recorder in practice mode
        }
    } else if (state.currentMode === 'read') {
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

    // Cognate Audit (SF04C)
    const auditSection = document.getElementById('cognate-audit-section');
    if (auditSection) {
        if (flashcard.cognate_pie_roots) {
            auditSection.classList.remove('hidden');
            renderCognateAudit(flashcard.cognate_pie_roots);
        } else {
            auditSection.classList.add('hidden');
        }
    }

    // Handle related words JSON
    let relatedWordsStr = '';
    try {
        const related = flashcard.related_words ? JSON.parse(flashcard.related_words) : [];
        relatedWordsStr = Array.isArray(related) ? related.join(', ') : related;
    } catch (e) {
        relatedWordsStr = flashcard.related_words || '';
    }
    document.getElementById('edit-related').value = relatedWordsStr;

    // PIE root fields (SF-013)
    const pieRootEl = document.getElementById('edit-pie-root');
    const pieMeaningEl = document.getElementById('edit-pie-meaning');
    if (pieRootEl) pieRootEl.value = (flashcard.pie_root && flashcard.pie_root !== 'N/A') ? flashcard.pie_root : '';
    if (pieMeaningEl) pieMeaningEl.value = flashcard.pie_meaning || '';

    // SF-017: Language reassignment dropdown
    const editLangSelect = document.getElementById('edit-language-select');
    if (editLangSelect && state.languages) {
        editLangSelect.innerHTML = state.languages.map(l =>
            `<option value="${l.id}"${l.id === flashcard.language_id ? ' selected' : ''}>${l.name} (${l.code})</option>`
        ).join('');
    }

    // Gender and Preposition Usage (SF-023, SF-024)
    const genderEl = document.getElementById('edit-gender');
    if (genderEl) genderEl.value = flashcard.gender || '';
    const prepEl = document.getElementById('edit-preposition-usage');
    if (prepEl) prepEl.value = flashcard.preposition_usage || '';

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

// SF04C — Cognate Audit rendering
function renderCognateAudit(cognateDataRaw) {
    const container = document.getElementById('cognate-audit-content');
    if (!container) return;
    let items;
    try {
        items = typeof cognateDataRaw === 'string' ? JSON.parse(cognateDataRaw) : cognateDataRaw;
    } catch { container.innerHTML = '<span class="text-gray-400">Invalid audit data</span>'; return; }
    if (!Array.isArray(items) || items.length === 0) { container.innerHTML = '<span class="text-gray-400">No audit data</span>'; return; }
    const html = items.map(r => {
        if (r.is_true_cognate === true) {
            return `<div class="text-green-700" title="${(r.citation || '').replace(/"/g, '&quot;')}">&#10003; <strong>${r.word}</strong> — ${r.proposed_pie_root || '?'}</div>`;
        } else if (r.is_true_cognate === false) {
            return `<div class="text-red-600 line-through" title="${(r.citation || '').replace(/"/g, '&quot;')}">&#128465; <strong>${r.word}</strong> — ${r.proposed_pie_root || '?'} (removed)</div>`;
        } else {
            return `<div class="text-yellow-600" title="RAG inconclusive — kept">&#128993; <strong>${r.word}</strong> — uncertain (kept)</div>`;
        }
    }).join('');
    container.innerHTML = html;
}

async function revalidateCognates() {
    if (!currentEditingId) return;
    const btn = document.getElementById('revalidate-cognates-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Validating...'; }
    try {
        const resp = await fetch(`/api/flashcards/${currentEditingId}/validate-cognates`, { method: 'POST' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        // Update the cognates input
        document.getElementById('edit-cognates').value = data.cleaned_english_cognates || '';
        // Re-render audit from the server response
        const fullAudit = [...(data.kept || []).map(k => ({...k, kept: true})), ...(data.removed || []).map(r => ({...r, kept: false, is_true_cognate: false}))];
        // Fetch updated card to get full audit JSON
        const cardResp = await fetch(`/api/flashcards/${currentEditingId}`);
        if (cardResp.ok) {
            const card = await cardResp.json();
            if (card.cognate_pie_roots) renderCognateAudit(card.cognate_pie_roots);
        }
        document.getElementById('cognate-audit-section').classList.remove('hidden');
    } catch (e) {
        console.error('Cognate validation failed:', e);
        alert('Cognate validation failed: ' + e.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Re-validate Cognates'; }
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
    const pieRoot = (document.getElementById('edit-pie-root')?.value || '').trim() || null;
    const pieMeaning = (document.getElementById('edit-pie-meaning')?.value || '').trim() || null;
    const gender = (document.getElementById('edit-gender')?.value || '').trim() || null;
    const prepositionUsage = (document.getElementById('edit-preposition-usage')?.value || '').trim() || null;
    const editedLanguageId = (document.getElementById('edit-language-select')?.value || '').trim() || null;

    console.log('📝 Form values:', { word, definition, etymology, cognates, relatedInput, pieRoot, pieMeaning, gender, prepositionUsage, editedLanguageId });
    
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
            related_words: relatedWords,
            pie_root: pieRoot,
            pie_meaning: pieMeaning,
            gender: gender,
            preposition_usage: prepositionUsage,
            language_id: editedLanguageId
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

function confirmDeleteById(id) {
    const card = state.flashcards.find(c => c.id === id);
    if (card) confirmDelete(card);
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
    const id = currentEditingId; // save before closeEditModal nulls it
    closeEditModal();
    const card = state.flashcards.find(c => c.id === id);
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
// SM06 Fix 1: Type-ahead — attach to BOTH #ai-word-input (AI form, default) and #word-input (manual form)
// SM05 root cause: IIFE was after await loadLanguages()/loadFlashcards() — timing fixed in SM05.
// SM06 root cause: listener was on #word-input (manual, hidden by default). PL uses #ai-word-input.
// ========================================
// SM07 Fix 3: Wiktionary spell suggestions for new words not yet in DB
async function getSpellingSuggestions(word, langCode) {
    if (word.length < 3) return [];
    const langMap = { 'fr': 'fr', 'el': 'el', 'en': 'en', 'es': 'es', 'de': 'de', 'it': 'it', 'la': 'la' };
    const lang = langMap[langCode] || 'en';
    try {
        const url = `https://${lang}.wiktionary.org/w/api.php?action=opensearch&search=${encodeURIComponent(word)}&limit=5&format=json&origin=*`;
        const resp = await fetch(url);
        const data = await resp.json();
        return (data[1] || []).slice(0, 5);
    } catch { return []; }
}

function _showSpellSuggestions(dropdownEl, suggestions, onSelect) {
    dropdownEl.innerHTML =
        `<div style="padding:4px 12px 2px;font-size:11px;color:#6b7280;font-weight:500;letter-spacing:.03em;">SPELLING SUGGESTIONS</div>` +
        suggestions.map(s => {
            const safe = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
            return `<div data-ta-item data-word="${safe}" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid #f3f4f6;font-size:14px;color:#3730a3;">${safe}</div>`;
        }).join('');
    dropdownEl.querySelectorAll('[data-ta-item]').forEach(el => {
        el.addEventListener('pointerdown', e => { e.preventDefault(); onSelect(el.dataset.word); });
        el.addEventListener('mouseover', () => el.style.background = '#f3f4f6');
        el.addEventListener('mouseout', () => el.style.background = '');
    });
    dropdownEl.style.display = 'block';
}

function _attachTypeahead(inputEl, dropdownEl, langCodeFn) {
    // Remove any prior listeners by cloning the node
    const newInput = inputEl.cloneNode(true);
    inputEl.parentNode.replaceChild(newInput, inputEl);
    inputEl = newInput;

    let _taTimer = null;
    let _activeIdx = -1;

    function getItems() { return dropdownEl.querySelectorAll('[data-ta-item]'); }

    function highlightItem(idx) {
        const items = getItems();
        items.forEach((el, i) => { el.style.background = i === idx ? '#e0e7ff' : ''; });
        _activeIdx = idx;
    }

    function selectItem(word) {
        inputEl.value = word;
        dropdownEl.style.display = 'none';
        _activeIdx = -1;
    }

    function closeDropdown() {
        dropdownEl.style.display = 'none';
        _activeIdx = -1;
    }

    inputEl.addEventListener('input', () => {
        clearTimeout(_taTimer);
        _activeIdx = -1;
        const q = inputEl.value.trim();
        if (q.length < 2) { closeDropdown(); return; }
        _taTimer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/flashcards/search?q=${encodeURIComponent(q)}&limit=8`);
                if (!res.ok) { closeDropdown(); return; }
                const cards = await res.json();
                if (!cards || !cards.length) {
                    // SM07 Fix 3: try Wiktionary suggestions when no existing cards match
                    if (langCodeFn && q.length >= 3) {
                        const langCode = langCodeFn();
                        if (langCode) {
                            const suggestions = await getSpellingSuggestions(q, langCode);
                            if (suggestions.length) { _showSpellSuggestions(dropdownEl, suggestions, selectItem); return; }
                        }
                    }
                    closeDropdown(); return;
                }
                dropdownEl.innerHTML = cards.map(c => {
                    const lang = state.languages?.find(l => l.id === c.language_id);
                    const badge = lang ? `<span style="font-size:10px;padding:1px 5px;border-radius:4px;background:#e0e7ff;color:#3730a3;margin-left:6px;">${lang.code.toUpperCase()}</span>` : '';
                    const safeWord = (c.word_or_phrase || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
                    return `<div data-ta-item data-word="${safeWord}" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid #f3f4f6;font-size:14px;">${safeWord}${badge}</div>`;
                }).join('');
                dropdownEl.querySelectorAll('[data-ta-item]').forEach(el => {
                    el.addEventListener('pointerdown', e => { e.preventDefault(); selectItem(el.dataset.word); });
                    el.addEventListener('mouseover', () => el.style.background = '#f3f4f6');
                    el.addEventListener('mouseout', () => { if (_activeIdx === -1 || getItems()[_activeIdx] !== el) el.style.background = ''; });
                });
                dropdownEl.style.display = 'block';
            } catch (e) {
                console.warn('Type-ahead error:', e);
                closeDropdown();
            }
        }, 300);
    });

    inputEl.addEventListener('keydown', e => {
        if (dropdownEl.style.display === 'none') return;
        const items = getItems();
        if (e.key === 'ArrowDown') { e.preventDefault(); highlightItem(Math.min(_activeIdx + 1, items.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); highlightItem(Math.max(_activeIdx - 1, 0)); }
        else if (e.key === 'Enter' && _activeIdx >= 0) { e.preventDefault(); if (items[_activeIdx]) selectItem(items[_activeIdx].dataset.word); }
        else if (e.key === 'Escape') { closeDropdown(); }
    });

    inputEl.addEventListener('blur', () => setTimeout(closeDropdown, 200));

    document.addEventListener('pointerdown', e => {
        if (!dropdownEl.contains(e.target) && e.target !== inputEl) closeDropdown();
    });

    console.log(`[Typeahead] Listener attached to #${inputEl.id}`);
    return inputEl; // return new node for callers that need it
}

function setupWordTypeahead() {
    // AI form (default visible) — SM07: pass language getter for Wiktionary spell suggestions
    const aiInput = document.getElementById('ai-word-input');
    const aiDrop  = document.getElementById('ai-word-typeahead-dropdown');
    if (aiInput && aiDrop) {
        const aiLangFn = () => state.languages?.find(l => l.id === state.currentLanguage)?.code || 'fr';
        _attachTypeahead(aiInput, aiDrop, aiLangFn);
    } else {
        console.warn('[Typeahead] #ai-word-input or #ai-word-typeahead-dropdown not found');
    }

    // Manual form (hidden by default) — no spell suggestions (existing behavior)
    const manualInput = document.getElementById('word-input');
    const manualDrop  = document.getElementById('word-typeahead-dropdown');
    if (manualInput && manualDrop) {
        _attachTypeahead(manualInput, manualDrop);
    }
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

    // SM05 Fix 1: Attach type-ahead EARLY — before await loadLanguages() so the listener is
    // ready even if the user navigates to Add Card before flashcard loading completes.
    setupWordTypeahead();

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
    
    // SM05: setupWordTypeahead() was called earlier (before await loadLanguages) — no second call needed.

    // SF-004: Browser back button — restore card view when URL has ?cardId=
    window.addEventListener('popstate', () => {
        const p = new URLSearchParams(window.location.search);
        const cid = p.get('cardId');
        if (cid) {
            const card = state.flashcards.find(c => c.id === cid);
            if (card) {
                state.currentCardIndex = state.flashcards.indexOf(card);
                switchMode('study');
                renderFlashcard(card);
            }
        }
        // No cardId → leave whatever tab is visible; card list is already rendered
    });

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

            try {
                await generateAIFlashcard(word, includeImage);
                document.getElementById('ai-word-input').value = '';
            } catch (err) {
                // SM06 Fix 2: ensure overlay is always cleared if generateAIFlashcard throws
                hideLoading();
                console.error('[AddCard] AI generate error:', err);
            }
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

    // Difficulty filter event listener
    const difficultyFilterDropdown = document.getElementById('difficulty-filter');
    if (difficultyFilterDropdown) {
        difficultyFilterDropdown.addEventListener('change', (e) => {
            state.difficultyFilter = e.target.value;
            renderFlashcardList();
        });
        console.log('✅ Difficulty filter initialized');
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
        console.debug('ℹ️ Import file input not present on this view');
    }
    
    if (csvTemplateBtn) {
        console.log('✅ Adding CSV template listener');
        csvTemplateBtn.addEventListener('click', () => {
            console.log('🔄 CSV template button clicked');
            downloadTemplate('csv');
        });
    } else {
        console.debug('ℹ️ CSV template button not present on this view');
    }
    
    if (jsonTemplateBtn) {
        console.log('✅ Adding JSON template listener');
        jsonTemplateBtn.addEventListener('click', () => {
            console.log('🔄 JSON template button clicked');
            downloadTemplate('json');
        });
    } else {
        console.debug('ℹ️ JSON template button not present on this view');
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
    
    // ✅ LIMIT: Cap at 50 cards per batch
    const MAX_CARDS_PER_BATCH = 50;
    const hasMore = result.has_more || result.entries.length > MAX_CARDS_PER_BATCH;
    const limitedEntries = result.entries.slice(0, MAX_CARDS_PER_BATCH);
    
    // Update counters
    document.getElementById('parsed-count').textContent = result.entries.length;
    document.getElementById('selected-count').textContent = '0';
    document.getElementById('duplicate-count').textContent = duplicateCount;
    
    // Show/hide 50-card limit warning
    const batchLimitWarning = document.getElementById('batch-limit-warning');
    if (hasMore) {
        batchLimitWarning.classList.remove('hidden');
    } else {
        batchLimitWarning.classList.add('hidden');
    }
    
    // Show/hide duplicate controls
    const duplicateControls = document.getElementById('duplicate-controls');
    if (duplicateCount > 0) {
        duplicateControls.classList.remove('hidden');
    } else {
        duplicateControls.classList.add('hidden');
    }
    
    // Show parsed entries as checkboxes (limited to first 50 non-duplicates)
    const entriesContainer = document.getElementById('parsed-entries-list');
    console.log('📄 Entries container found:', !!entriesContainer);
    entriesContainer.innerHTML = '';
    
    let renderedCount = 0;
    let selectedCount = 0;
    
    limitedEntries.forEach((entry, index) => {
        // Skip entries with missing word_or_phrase
        if (!entry.word_or_phrase) {
            console.warn('⚠️ Skipping entry with missing word_or_phrase:', entry);
            return;
        }
        
        renderedCount++;
        const isDuplicate = existingWords.has(entry.word_or_phrase.toLowerCase().trim());
        
        // ✅ AUTO-SELECT: Select first 50 non-duplicates automatically
        const shouldAutoSelect = !isDuplicate && selectedCount < MAX_CARDS_PER_BATCH;
        if (shouldAutoSelect) selectedCount++;
        
        const entryDiv = document.createElement('div');
        entryDiv.className = `flex items-start gap-2 p-2 hover:bg-gray-50 rounded border-b border-gray-100 ${isDuplicate ? 'bg-yellow-50' : ''}`;
        
        entryDiv.innerHTML = `
            <input type="checkbox" 
                   id="word-${index}" 
                   class="word-checkbox mt-1 h-4 w-4 text-purple-600 rounded" 
                   data-word="${entry.word_or_phrase}"
                   data-index="${index}"
                   data-duplicate="${isDuplicate}"
                   ${shouldAutoSelect ? 'checked' : ''}>
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
    const MAX_CARDS_PER_BATCH = 50;
    
    // Update selected count when checkboxes change
    const checkboxes = document.querySelectorAll('.word-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            // ✅ ENFORCE: Prevent checking more than 50 cards
            const checkedCount = document.querySelectorAll('.word-checkbox:checked').length;
            if (e.target.checked && checkedCount > MAX_CARDS_PER_BATCH) {
                e.target.checked = false;
                showToast(`⚠️ Maximum ${MAX_CARDS_PER_BATCH} cards per batch. Please process remaining cards separately.`, 4000);
                return;
            }
            updateSelectedCount();
        });
    });
    
    // Select all button (limited to first 50)
    const selectAllBtn = document.getElementById('select-all-words');
    if (selectAllBtn) {
        selectAllBtn.onclick = () => {
            let selectedCount = 0;
            checkboxes.forEach(cb => {
                if (selectedCount < MAX_CARDS_PER_BATCH) {
                    cb.checked = true;
                    selectedCount++;
                } else {
                    cb.checked = false;
                }
            });
            updateSelectedCount();
            if (checkboxes.length > MAX_CARDS_PER_BATCH) {
                showToast(`⚠️ Selected first ${MAX_CARDS_PER_BATCH} cards (maximum per batch)`, 3000);
            }
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
 * Toggle between Study, Read, Practice, Browse, and Import modes
 * @param {String} mode - 'study', 'read', 'practice', 'browse', or 'import'
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
    const practiceBtn = document.getElementById('mode-practice');
    const browseBtn = document.getElementById('mode-browse');
    const importBtn = document.getElementById('mode-import');
    const progressBtn = document.getElementById('mode-progress');

    console.log('🔍 Mode containers found:', {
        studyMode: !!document.getElementById('study-mode'),
        readMode: !!document.getElementById('read-mode'),
        practiceMode: !!document.getElementById('practice-mode'),
        browseMode: !!document.getElementById('browse-mode'),
        importMode: !!document.getElementById('content-import'),
        readContainer: !!document.getElementById('read-card-container')
    });

    // Reset all buttons
    [studyBtn, readBtn, practiceBtn, browseBtn, importBtn, progressBtn].forEach(btn => {
        if (btn) {
            btn.classList.remove('active', 'bg-indigo-600', 'text-white');
            btn.classList.add('text-gray-600');
        }
    });

    // Hide all mode content
    const studyModeEl = document.getElementById('study-mode');
    const readModeEl = document.getElementById('read-mode');
    const practiceModeEl = document.getElementById('practice-mode');
    const browseModeEl = document.getElementById('browse-mode');
    const importModeEl = document.getElementById('content-import');
    const progressModeEl = document.getElementById('progress-mode');

    if (studyModeEl) studyModeEl.classList.add('hidden');
    if (readModeEl) readModeEl.classList.add('hidden');
    if (practiceModeEl) practiceModeEl.classList.add('hidden');
    if (browseModeEl) browseModeEl.classList.add('hidden');
    if (importModeEl) importModeEl.classList.add('hidden');
    if (progressModeEl) progressModeEl.classList.add('hidden');
    
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
        
    } else if (mode === 'practice') {
        console.log('🎙 Activating Practice mode');

        if (practiceBtn) {
            practiceBtn.classList.add('active', 'bg-indigo-600', 'text-white');
            practiceBtn.classList.remove('text-gray-600');
        }

        // Show practice mode content
        if (practiceModeEl) {
            practiceModeEl.classList.remove('hidden');
            console.log('🎙 Practice mode container now visible');
        } else {
            console.error('❌ Practice mode element not found!');
        }

        // Load current card in practice mode
        if (state.flashcards.length > 0) {
            renderPracticeCard(state.flashcards[state.currentCardIndex]);
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

        // SFSENT3-REQ-003: Populate book filter if sentence cards exist
        _populateBookFilter();

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
    } else if (mode === 'progress') {
        console.log('📊 Activating Progress mode');

        if (progressBtn) {
            progressBtn.classList.add('active', 'bg-indigo-600', 'text-white');
            progressBtn.classList.remove('text-gray-600');
        }

        if (progressModeEl) {
            progressModeEl.classList.remove('hidden');
        }

        // Initialize progress dashboard (progress.js)
        if (typeof window.initProgressDashboard === 'function') {
            window.initProgressDashboard();
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
    // SM05: Settings panel toggle + TTS provider persistence
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');
    const ttsSelect = document.getElementById('tts-provider-select');
    if (settingsToggle && settingsPanel) {
        settingsToggle.addEventListener('click', () => {
            settingsPanel.classList.toggle('hidden');
        });
    }
    if (ttsSelect) {
        // SFSENT3-REQ-002: Migrate legacy 'speechify' to '11labs'
        const storedTts = localStorage.getItem('tts_provider') || '11labs';
        if (storedTts === 'speechify') localStorage.setItem('tts_provider', '11labs');
        ttsSelect.value = localStorage.getItem('tts_provider') || '11labs';
        ttsSelect.addEventListener('change', () => {
            localStorage.setItem('tts_provider', ttsSelect.value);
            const hint = document.getElementById('tts-provider-hint');
            if (hint) hint.textContent = `Active: ${ttsSelect.options[ttsSelect.selectedIndex].text}`;
        });
    }

    // SFSENT3-REQ-003: Book filter for browse tab
    _initBookFilter();

    // SM08: TTS speed slider persistence
    const ttsSpeedSlider = document.getElementById('tts-speed');
    const ttsSpeedLabel = document.getElementById('tts-speed-label');
    if (ttsSpeedSlider) {
        const savedSpeed = localStorage.getItem('tts_speed') || '1.0';
        ttsSpeedSlider.value = savedSpeed;
        if (ttsSpeedLabel) ttsSpeedLabel.textContent = savedSpeed + 'x';
        ttsSpeedSlider.addEventListener('input', () => {
            localStorage.setItem('tts_speed', ttsSpeedSlider.value);
            if (ttsSpeedLabel) ttsSpeedLabel.textContent = ttsSpeedSlider.value + 'x';
        });
    }

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
    const practiceBtn = document.getElementById('mode-practice');
    const browseBtn = document.getElementById('mode-browse');
    const importBtn = document.getElementById('mode-import');

    console.log('🔍 Mode buttons found:', {
        study: !!studyBtn,
        read: !!readBtn,
        practice: !!practiceBtn,
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

    practiceBtn?.addEventListener('click', () => {
        console.log('🎙 Practice button clicked');
        switchMode('practice');
    });

    browseBtn?.addEventListener('click', () => {
        console.log('📖 Browse button clicked');
        switchMode('browse');
    });
    
    importBtn?.addEventListener('click', () => {
        console.log('📁 Import button clicked');
        switchMode('import');
    });

    const progressBtn2 = document.getElementById('mode-progress');
    progressBtn2?.addEventListener('click', () => {
        console.log('📊 Progress button clicked');
        switchMode('progress');
    });
    
    // Primary action button - show the add card form
document.getElementById('add-card-btn')?.addEventListener('click', () => {
    // SM06 Fix 2: Dismiss any stuck loading overlay before showing Add Card form.
    // The overlay (fixed inset-0 z-50) can remain visible during initial loadFlashcards()
    // which takes 2-10s on first load. Calling hideLoading() here ensures the overlay
    // is gone so the user can interact with the Add Card form immediately.
    hideLoading();
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

    // SF05: PIE audio playback — inline, no navigation
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.pie-audio-btn');
        if (!btn) return;
        const audioUrl = btn.dataset.audioUrl;
        if (!audioUrl) return;
        if (window._pieAudio) { window._pieAudio.pause(); window._pieAudio = null; }
        btn.textContent = 'PIE ▶';
        const audio = new Audio(audioUrl);
        window._pieAudio = audio;
        audio.onended = () => { btn.textContent = 'PIE 🔊'; };
        audio.onerror = () => { btn.textContent = 'PIE ✗'; };
        audio.play().catch(() => { btn.textContent = 'PIE ✗'; });
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

    // BV-07: Modal dismiss — touchend + click for iPhone (SF-MOBILE-FIX-001)
    const fullscreenModal = document.getElementById('img-fullscreen-modal');
    if (fullscreenModal) {
        ['click', 'touchend'].forEach(function(eventType) {
            fullscreenModal.addEventListener(eventType, function(e) {
                e.preventDefault();
                this.style.display = 'none';
            });
        });
    }

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

// ========================================
// SFSENT3-REQ-003: Book filter for Browse tab
// ========================================
async function _populateBookFilter() {
    const container = document.getElementById('book-filter-container');
    const select = document.getElementById('book-filter');
    if (!container || !select) return;

    // Check if any sentence cards exist — fetch distinct source_books
    try {
        const res = await fetch('/api/flashcards/?card_type=sentence&limit=500');
        if (!res.ok) return;
        const cards = await res.json();
        if (!cards || cards.length === 0) {
            container.style.display = 'none';
            return;
        }

        // Extract distinct source_book values
        const books = [...new Set(cards.map(c => c.source_book).filter(Boolean))].sort();
        if (books.length === 0) {
            container.style.display = 'none';
            return;
        }

        // Show the filter and populate options
        container.style.display = '';
        const currentValue = select.value;
        select.innerHTML = '<option value="all">All books</option>';
        books.forEach(book => {
            const opt = document.createElement('option');
            opt.value = book;
            opt.textContent = book;
            select.appendChild(opt);
        });
        if (currentValue && currentValue !== 'all') select.value = currentValue;
    } catch (e) {
        console.error('Book filter populate error:', e);
    }
}

let _bookFilteredCards = null;

function _initBookFilter() {
    const select = document.getElementById('book-filter');
    if (!select) return;
    select.addEventListener('change', async () => {
        const book = select.value;
        if (book === 'all') {
            _bookFilteredCards = null;
            renderFlashcardList();
            return;
        }
        try {
            const res = await fetch(`/api/flashcards/?card_type=sentence&source_book=${encodeURIComponent(book)}&limit=500`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const cards = await res.json();
            const listContainer = document.getElementById('cards-list');
            if (!listContainer) return;
            if (!cards || cards.length === 0) {
                listContainer.innerHTML = '<p class="text-center text-gray-500 py-8">No sentence cards found for this book.</p>';
                return;
            }
            cards.sort((a, b) => {
                if (a.chapter_number !== b.chapter_number) return (a.chapter_number || 0) - (b.chapter_number || 0);
                return (a.sentence_order || 0) - (b.sentence_order || 0);
            });
            _bookFilteredCards = cards;
            _renderBookFilteredList(cards, listContainer);
        } catch (e) {
            console.error('Book filter error:', e);
        }
    });
}

function _renderBookFilteredList(cards, listContainer) {
    listContainer.innerHTML = cards.map((card, i) => {
        const chLabel = card.chapter_number ? `Ch.${card.chapter_number}` : '';
        const orderLabel = card.sentence_order ? `#${card.sentence_order}` : '';
        const safeWord = (card.word_or_phrase || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeTrans = (card.translation || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `
        <div class="bg-white rounded-lg p-4 shadow hover:shadow-md transition cursor-pointer"
             onclick="_selectBookCard(${i})">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-baseline gap-2 flex-wrap">
                        <h3 class="font-semibold text-gray-900 text-base mb-1">${safeWord}</h3>
                        ${chLabel ? `<span class="text-xs text-gray-400">${chLabel} ${orderLabel}</span>` : ''}
                    </div>
                    <p class="text-gray-600 text-sm line-clamp-1">${safeTrans}</p>
                </div>
            </div>
        </div>`;
    }).join('');
}

function _selectBookCard(index) {
    if (!_bookFilteredCards) return;
    state.flashcards = _bookFilteredCards;
    state.currentCardIndex = index;
    switchMode('study');
    renderFlashcard(state.flashcards[index]);
    updateCardCounter();
}
window._selectBookCard = _selectBookCard;

// ========================================
// SF-SENT-001: Shadowing Mode
// ========================================
let _shadowRecorder = null;
let _shadowStream = null;

async function startShadowing(cardId) {
    const btn = document.getElementById(`shadow-btn-${cardId}`);
    if (!btn) return;

    // If already recording, stop
    if (_shadowRecorder && _shadowRecorder.state === 'recording') {
        _shadowRecorder.stop();
        if (_shadowStream) _shadowStream.getTracks().forEach(t => t.stop());
        return;
    }

    // Use Web Speech API for transcription (browser-side)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast('Speech recognition not supported in this browser', 3000);
        return;
    }

    // SFSENT3-REQ-001: Hide translation and IPA during shadow mode — French only
    const translationEl = document.getElementById(`shadow-translation-${cardId}`);
    const ipaEl = document.getElementById(`shadow-ipa-${cardId}`);
    if (translationEl) translationEl.style.display = 'none';
    if (ipaEl) ipaEl.style.display = 'none';

    const card = state.flashcards?.find(c => c.id === cardId);
    const lang = card ? state.languages?.find(l => l.id === card.language_id) : null;
    const langCode = lang?.code || 'fr';

    // Set up speech recognition
    const recognition = new SpeechRecognition();
    recognition.lang = langCode === 'fr' ? 'fr-FR' : langCode;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    btn.classList.add('recording');
    btn.innerHTML = '⏹ Stop';

    recognition.onresult = async (event) => {
        const transcribed = event.results[0][0].transcript;
        btn.classList.remove('recording');
        btn.innerHTML = '🎤 Shadow';

        // Send to backend for IPA comparison
        await submitShadowResult(cardId, transcribed);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        btn.classList.remove('recording');
        btn.innerHTML = '🎤 Shadow';
        if (event.error === 'no-speech') {
            showToast('No speech detected. Try again.', 3000);
        } else if (event.error === 'not-allowed') {
            showToast('Microphone access denied. Check browser permissions.', 5000);
        } else {
            showToast(`Recognition error: ${event.error}`, 3000);
        }
    };

    recognition.onend = () => {
        btn.classList.remove('recording');
        btn.innerHTML = '🎤 Shadow';
    };

    try {
        recognition.start();
    } catch (e) {
        console.error('Failed to start recognition:', e);
        btn.classList.remove('recording');
        btn.innerHTML = '🎤 Shadow';
        showToast('Could not start recording', 3000);
    }
}

async function submitShadowResult(cardId, transcribedText) {
    const feedbackEl = document.getElementById(`shadow-feedback-${cardId}`);
    if (!feedbackEl) return;

    feedbackEl.style.display = 'block';
    feedbackEl.innerHTML = '<div class="text-center text-gray-400 text-sm">Analyzing pronunciation...</div>';

    try {
        const res = await fetch(`/api/flashcards/${cardId}/shadow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcribed_text: transcribedText }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        renderShadowingFeedback(cardId, data);
    } catch (e) {
        console.error('Shadow submit error:', e);
        feedbackEl.innerHTML = '<div class="text-center text-red-500 text-sm">Analysis failed. Try again.</div>';
    }
}

function renderShadowingFeedback(cardId, data) {
    const feedbackEl = document.getElementById(`shadow-feedback-${cardId}`);
    if (!feedbackEl) return;

    // SFSENT3-REQ-001: Keep translation and IPA hidden during shadow feedback
    const translationEl = document.getElementById(`shadow-translation-${cardId}`);
    const ipaEl = document.getElementById(`shadow-ipa-${cardId}`);
    if (translationEl) translationEl.style.display = 'none';
    if (ipaEl) ipaEl.style.display = 'none';

    const accuracy = data.accuracy_pct || 0;
    const colorClass = accuracy >= 80 ? 'good' : accuracy >= 50 ? 'ok' : 'needs-work';

    const phonemeChips = (data.phoneme_results || []).map(p => {
        const chipClass = p.correct ? 'correct' : 'incorrect';
        const title = p.feedback ? ` title="${p.feedback}"` : '';
        const display = p.correct ? p.expected : `${p.expected || '∅'}→${p.got || '∅'}`;
        return `<span class="phoneme-chip ${chipClass}"${title}>${display}</span>`;
    }).join('');

    // SFSENT3-REQ-001: Display shadow_target from API response (French only)
    const targetDisplay = data.shadow_target
        ? `<div class="text-xs text-gray-500 mb-1">Target: "${data.shadow_target}"</div>`
        : '';

    feedbackEl.innerHTML = `
        <div class="shadow-accuracy ${colorClass}">${accuracy.toFixed(0)}%</div>
        <div class="text-center text-sm text-gray-600 mb-2">${data.overall_feedback || ''}</div>
        ${targetDisplay}
        <div class="text-xs text-gray-400 mb-1">You said: "${data.transcribed_text || ''}"</div>
        <div class="text-xs text-gray-400 mb-2">Your IPA: ${data.transcribed_ipa || ''}</div>
        <div class="phoneme-grid">${phonemeChips}</div>
        <div class="text-center mt-3">
            <button class="shadow-btn" onclick="startShadowing('${cardId}')" style="display:inline-flex;">
                🎤 Try Again
            </button>
            <button class="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 ml-2"
                    onclick="exitShadowMode('${cardId}')">
                Show Full Card
            </button>
        </div>
    `;
}

// SFSENT3-REQ-001: Exit shadow mode — restore translation and IPA visibility
function exitShadowMode(cardId) {
    const translationEl = document.getElementById(`shadow-translation-${cardId}`);
    const ipaEl = document.getElementById(`shadow-ipa-${cardId}`);
    if (translationEl) translationEl.style.display = '';
    if (ipaEl) ipaEl.style.display = '';
    const feedbackEl = document.getElementById(`shadow-feedback-${cardId}`);
    if (feedbackEl) feedbackEl.style.display = 'none';
}

// SF-SENT-001: Load sentence cards from a book deck
async function loadBookDeck() {
    try {
        showLoading();
        const res = await fetch('/api/flashcards/?card_type=sentence&limit=500');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const cards = await res.json();

        if (!cards || cards.length === 0) {
            hideLoading();
            showToast('No sentence cards found. Books will appear after ingestion.', 3000);
            return;
        }

        // Sort by chapter + sentence_order
        cards.sort((a, b) => {
            if (a.chapter_number !== b.chapter_number) return (a.chapter_number || 0) - (b.chapter_number || 0);
            return (a.sentence_order || 0) - (b.sentence_order || 0);
        });

        state.flashcards = cards;
        state.currentCardIndex = 0;
        hideLoading();
        renderFlashcard(cards[0]);

        // Highlight books button as active
        const booksBtn = document.getElementById('books-btn');
        if (booksBtn) {
            booksBtn.classList.remove('bg-purple-100', 'text-purple-700');
            booksBtn.classList.add('bg-purple-600', 'text-white');
        }

        showToast(`Loaded ${cards.length} sentences from "${cards[0].source_book || 'Book'}"`, 3000);
    } catch (e) {
        console.error('Failed to load book deck:', e);
        hideLoading();
        showToast('Failed to load book deck', 3000);
    }
}

// Make shadowing and book functions globally accessible
window.startShadowing = startShadowing;
window.exitShadowMode = exitShadowMode;
window.loadBookDeck = loadBookDeck;

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
