// frontend/app.js
// Language Learning Flashcards - Main Application Logic
// Version: 2.5.5 (Hotfix: Language switching in browse mode)

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
    currentMode: 'study' // Track current mode: 'study', 'read', or 'browse'
};

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
            throw new Error(`API Error: ${response.status}`);
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
            // Fall back to first language
            selectedLanguage = languages[0].id;
        }
        
        if (selectedLanguage) {
            select.value = selectedLanguage;
            state.currentLanguage = selectedLanguage;
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

async function loadFlashcards() {
    if (!state.currentLanguage) return;
    
    try {
        showLoading();
        
        // Sprint 5: Use offline-first API client
        let flashcards;
        if (apiClient) {
            try {
                // New offline-first approach
                flashcards = await apiClient.getFlashcards();
                // Filter by language (language_id exists in Cloud SQL!)
                flashcards = flashcards.filter(card => card.language_id === state.currentLanguage);
                console.log(`Loaded ${flashcards.length} flashcards for language ${state.currentLanguage}`);
            } catch (error) {
                console.warn('API client failed, using offline data:', error);
                // If API fails, get from IndexedDB directly
                if (offlineDB) {
                    const allCards = await offlineDB.getAllFlashcards();
                    // Filter by language for offline data too
                    flashcards = allCards.filter(card => card.language_id === state.currentLanguage);
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
        
        state.flashcards = flashcards;
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
        
        // Reload flashcards first so the new card is in state.flashcards
        await loadFlashcards();
        
        // Generate audio for the new flashcard AFTER it's loaded into state
        if (flashcard && flashcard.id) {
            try {
                console.log('🔊 Starting audio generation for:', flashcard.id);
                await generateAudioForCard(flashcard.id);
            } catch (audioError) {
                console.error('Audio generation failed:', audioError);
                // Don't fail the whole operation if audio fails
                // TODO: Show user-friendly error message
            }
        }
        
        // Switch back to main content to show the new card
        backToMain();
        switchToStudyMode();
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
        
        // TODO: Add better error handling with user-friendly messages
        // Don't expose technical errors to users
        
        hideLoading();
        showToast('✅ AI Flashcard generated successfully!');
        
        // Reload flashcards first so the new card is in state.flashcards
        await loadFlashcards();
        
        // Generate audio for the new flashcard AFTER it's loaded into state
        if (flashcard && flashcard.id) {
            try {
                console.log('🔊 Starting audio generation for:', flashcard.id);
                await generateAudioForCard(flashcard.id);
            } catch (audioError) {
                console.error('Audio generation failed:', audioError);
                // Don't fail the whole operation if audio fails
                // TODO: Show user-friendly error message
            }
        }
        
        // Switch back to main content to show the new card
        backToMain();
        switchToStudyMode();
        
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
        
        // Generate image using image-only endpoint for better performance
        const response = await apiRequest(`/ai/image?word_or_phrase=${encodeURIComponent(wordInput)}&language_id=${state.currentLanguage}`, {
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
        showToast('Failed to generate image. Please try again.');
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
                            ${flashcard.source === 'ai_generated' ? '🤖 AI Generated' : '✍️ Manual'}
                        </div>
                        <div class="flex items-center gap-3">
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
                                <button onclick="editCard('${flashcard.id}')" 
                                        class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm transition-colors" 
                                        title="Edit this card">
                                    ✏️ Edit
                                </button>
                            </div>
                            <h2 class="text-2xl font-bold text-indigo-900">${flashcard.word_or_phrase}</h2>
                            <p class="text-sm text-indigo-600 mt-1">${flashcard.language_name || 'Word'}</p>
                            ${flashcard.definition ? `<p class="text-lg text-indigo-800 mt-2 font-medium">${flashcard.definition}</p>` : ''}
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
                                <span>${flashcard.source === 'ai_generated' ? '🤖 AI Generated' : '✍️ Manual'}</span>
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
    
    listContainer.innerHTML = state.flashcards.map((card, index) => `
        <div class="bg-white rounded-lg p-4 shadow hover:shadow-md transition">
            <div class="flex justify-between items-start">
                <div class="flex-1 cursor-pointer" onclick="selectCard(${index})">
                    <h3 class="font-semibold text-gray-900 text-lg mb-1">${card.word_or_phrase}</h3>
                    <p class="text-gray-600 text-sm line-clamp-2">${card.definition || 'No definition'}</p>
                </div>
                <div class="ml-4 flex space-x-2 items-center">
                    <button onclick="showEditModal(state.flashcards[${index}]); event.stopPropagation();" 
                        class="p-2 text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="confirmDelete(state.flashcards[${index}]); event.stopPropagation();" 
                        class="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                    <span class="text-sm text-gray-500">${card.source === 'ai_generated' ? '🤖' : '✍️'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function selectCard(index) {
    state.currentCardIndex = index;
    switchTab('study');
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
    if (!currentEditingId) return;
    
    const word = document.getElementById('edit-word').value.trim();
    const definition = document.getElementById('edit-definition').value.trim();
    const etymology = document.getElementById('edit-etymology').value.trim();
    const cognates = document.getElementById('edit-cognates').value.trim();
    const relatedInput = document.getElementById('edit-related').value.trim();
    
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
        
        const updated = await apiRequest(`/flashcards/${currentEditingId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        hideLoading();
        showToast('✅ Flashcard updated successfully!');
        closeEditModal();
        
        // Refresh the display
        await loadFlashcards();
        
    } catch (error) {
        hideLoading();
        showToast('Failed to update flashcard', 'error');
        console.error('Update error:', error);
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
    flashcardToDelete = flashcard;
    document.getElementById('delete-word-display').textContent = flashcard.word_or_phrase;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    flashcardToDelete = null;
}

async function deleteFlashcard() {
    if (!flashcardToDelete) return;
    
    try {
        showLoading();
        
        // Sprint 5: Use offline-first API client
        if (apiClient) {
            await apiClient.deleteFlashcard(flashcardToDelete.id);
        } else {
            // Fallback to old API
            await apiRequest(`/flashcards/${flashcardToDelete.id}`, {
                method: 'DELETE'
            });
        }
        
        hideLoading();
        showToast('Flashcard deleted');
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
    console.log('🔄 Initializing Sprint 5 offline-first architecture...');
    
    try {
        // Initialize IndexedDB
        console.log('📂 Initializing IndexedDB...');
        offlineDB = new OfflineDatabase();
        await offlineDB.init();
        
        // Initialize Sync Manager
        console.log('🔄 Initializing Sync Manager...');
        syncManager = new SyncManager(offlineDB);
        await syncManager.init();
        
        // Initialize API Client
        console.log('🌐 Initializing API Client...');
        apiClient = new ApiClient(offlineDB, syncManager);
        
        console.log('✅ Sprint 5 initialization complete!');
        
        // Setup sync button
        setupSyncButton();
        
    // (No debug buttons to set up here; handled after DOMContentLoaded)
        
        // Update UI with initial status
        updateSyncStatus();
        
        // Start periodic status updates
        setInterval(updateSyncStatus, 30000); // Update every 30 seconds
        
    } catch (error) {
        console.error('❌ Failed to initialize Sprint 5:', error);
        showToast('Failed to initialize offline features', 5000);
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
    console.log('🚀 DOMContentLoaded fired, initializing app...');
    
    // Sprint 5: Initialize offline-first architecture
    await initializeOfflineFirst();
    
    // Initialize new UI (mode toggle & hamburger menu)
    initializeNewUI();
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
    
    loadLanguages();
    initializeBatchIPA();
    
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
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const deleteFromEditBtn = document.getElementById('delete-from-edit-btn');
    
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

    // Document Parser Setup
    console.log('🔍 Setting up document parser event listeners...');
    
    const parserOption = document.getElementById('parser-option');
    const directOption = document.getElementById('direct-option');
    const documentFileInput = document.getElementById('document-file');
    const importParsedBtn = document.getElementById('import-parsed');
    const parseAnotherBtn = document.getElementById('parse-another');
    
    console.log('🔍 Parser elements found:', {
        parserOption: !!parserOption,
        directOption: !!directOption,
        documentFileInput: !!documentFileInput,
        importParsedBtn: !!importParsedBtn,
        parseAnotherBtn: !!parseAnotherBtn
    });
    
    if (parserOption) {
        parserOption.addEventListener('click', () => {
            console.log('🔄 Parser option selected');
            selectImportMethod('parser');
        });
    }
    
    if (directOption) {
        directOption.addEventListener('click', () => {
            console.log('🔄 Direct import option selected');
            selectImportMethod('direct');
        });
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
});

// Document Parser Functions
function selectImportMethod(method) {
    const parserOption = document.getElementById('parser-option');
    const directOption = document.getElementById('direct-option');
    const parserUploadSection = document.getElementById('parser-upload-section');
    const directUploadSection = document.getElementById('direct-upload-section');
    
    // Reset selections
    parserOption.classList.remove('border-blue-500', 'bg-blue-50');
    directOption.classList.remove('border-indigo-500', 'bg-indigo-50');
    parserUploadSection.classList.add('hidden');
    directUploadSection.classList.add('hidden');
    
    if (method === 'parser') {
        parserOption.classList.add('border-blue-500', 'bg-blue-50');
        parserUploadSection.classList.remove('hidden');
    } else if (method === 'direct') {
        directOption.classList.add('border-indigo-500', 'bg-indigo-50');
        directUploadSection.classList.remove('hidden');
    }
}

async function handleDocumentUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validExtensions = ['docx', 'txt'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        showToast('❌ Please select a Word document (.docx) or text file (.txt)', 5000);
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
        
        const response = await fetch(`${API_BASE}/parser/parse-document`, {
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
        showToast(`❌ Document parsing failed: ${error.message}`, 8000);
        resetParserForm();
    }
}

function showParserProgress() {
    document.getElementById('parser-progress').classList.remove('hidden');
    document.getElementById('parser-results').classList.add('hidden');
}

function showParserResults(result) {
    // Hide progress, show results
    document.getElementById('parser-progress').classList.add('hidden');
    document.getElementById('parser-results').classList.remove('hidden');
    
    // Store parsed entries for later import
    window.parsedEntries = result.entries;
    
    // Update counters
    document.getElementById('parsed-count').textContent = result.entries.length;
    const avgConfidence = result.entries.length > 0 
        ? Math.round(result.entries.reduce((sum, entry) => sum + entry.confidence, 0) / result.entries.length)
        : 0;
    document.getElementById('confidence-score').textContent = `${avgConfidence}%`;
    
    // Show parsed entries preview
    const entriesContainer = document.getElementById('parsed-entries-list');
    entriesContainer.innerHTML = '';
    
    result.entries.slice(0, 10).forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'p-2 bg-gray-50 rounded border text-xs';
        
        const confidenceColor = entry.confidence >= 80 ? 'text-green-600' : 
                               entry.confidence >= 60 ? 'text-yellow-600' : 'text-red-600';
        
        entryDiv.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <span class="font-medium text-gray-900">${entry.word}</span>
                <span class="${confidenceColor}">${entry.confidence}%</span>
            </div>
            <div class="text-gray-600">${entry.definition}</div>
            ${entry.etymology ? `<div class="text-blue-600 text-xs mt-1">📚 ${entry.etymology}</div>` : ''}
            ${entry.english_equivalent ? `<div class="text-green-600 text-xs">🇬🇧 ${entry.english_equivalent}</div>` : ''}
        `;
        entriesContainer.appendChild(entryDiv);
    });
    
    if (result.entries.length > 10) {
        const moreDiv = document.createElement('div');
        moreDiv.className = 'text-center text-gray-500 text-xs py-2';
        moreDiv.textContent = `... and ${result.entries.length - 10} more entries`;
        entriesContainer.appendChild(moreDiv);
    }
    
    // Set up import button
    const importParsedBtn = document.getElementById('import-parsed');
    if (importParsedBtn) {
        importParsedBtn.onclick = () => importParsedEntries();
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
 * Toggle between Study and Browse modes
 * @param {String} mode - 'study' or 'browse'
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
    
    console.log('🔍 Mode containers found:', {
        studyMode: !!document.getElementById('study-mode'),
        readMode: !!document.getElementById('read-mode'),
        browseMode: !!document.getElementById('browse-mode'),
        readContainer: !!document.getElementById('read-card-container')
    });
    
    // Reset all buttons
    [studyBtn, readBtn, browseBtn].forEach(btn => {
        if (btn) {
            btn.classList.remove('active', 'bg-indigo-600', 'text-white');
            btn.classList.add('text-gray-600');
        }
    });
    
    // Hide all mode content
    const studyModeEl = document.getElementById('study-mode');
    const readModeEl = document.getElementById('read-mode');
    const browseModeEl = document.getElementById('browse-mode');
    
    if (studyModeEl) studyModeEl.classList.add('hidden');
    if (readModeEl) readModeEl.classList.add('hidden');
    if (browseModeEl) browseModeEl.classList.add('hidden');
    
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
        browseBtn.classList.add('active', 'bg-indigo-600', 'text-white');
        browseBtn.classList.remove('text-gray-600');
        
        // Show browse mode content
        document.getElementById('browse-mode').classList.remove('hidden');
        
        // Load cards list
        loadCardsList();
    }
    
    state.currentMode = mode;
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
                        <span>${card.source === 'ai_generated' ? '🤖 AI Generated' : '✍️ Manual'}</span>
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
    document.getElementById('main-content').classList.add('hidden');
    
    // Hide other content areas
    ['content-add', 'content-import', 'content-batch'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    
    // Show requested content
    document.getElementById(contentId).classList.remove('hidden');
    
    // Close dropdown menu
    document.getElementById('dropdown-menu').classList.add('hidden');
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
    
    console.log('🔍 Mode buttons found:', {
        study: !!studyBtn,
        read: !!readBtn,
        browse: !!browseBtn
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
    
    // Primary action button
    document.getElementById('add-card-btn')?.addEventListener('click', () => {
        showContent('content-add');
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
    });
    
    // Hamburger menu
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
