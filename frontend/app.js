// frontend/app.js
// Language Learning Flashcards - Main Application Logic

// API Configuration
const API_BASE = window.location.origin.includes('localhost') 
    ? 'http://localhost:8000/api' 
    : '/api';

// Application State
let state = {
    currentLanguage: null,
    flashcards: [],
    currentCardIndex: 0,
    isFlipped: false,
    isOnline: navigator.onLine,
    languages: []
};

// ========================================
// Utility Functions
// ========================================

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
        const languages = await apiRequest('/languages');
        state.languages = languages;
        
        const select = document.getElementById('language-select');
        select.innerHTML = '<option value="">Select a language...</option>';
        
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.id;
            option.textContent = `${lang.name} (${lang.code})`;
            select.appendChild(option);
        });
        
        // Select first language by default if available
        if (languages.length > 0) {
            select.value = languages[0].id;
            state.currentLanguage = languages[0].id;
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
        const flashcards = await apiRequest(`/flashcards?language_id=${state.currentLanguage}`);
        state.flashcards = flashcards;
        state.currentCardIndex = 0;
        
        if (flashcards.length > 0) {
            renderFlashcard(flashcards[0]);
            document.getElementById('study-controls').classList.remove('hidden');
            updateCardCounter();
        } else {
            document.getElementById('flashcard-container').innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <p class="text-lg mb-4">No flashcards yet for this language</p>
                    <p class="text-sm">Add your first flashcard using the "Add Card" tab</p>
                </div>
            `;
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
        const flashcard = await apiRequest('/flashcards', {
            method: 'POST',
            body: JSON.stringify({
                ...data,
                language_id: state.currentLanguage,
                source: 'manual'
            })
        });
        
        showToast('✅ Flashcard created successfully!');
        await loadFlashcards();
        
        // Switch to study tab
        switchTab('study');
        hideLoading();
        
        return flashcard;
    } catch (error) {
        hideLoading();
        showToast('Failed to create flashcard');
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
        const flashcard = await apiRequest('/ai/generate', {
            method: 'POST',
            body: JSON.stringify({
                word_or_phrase: word,
                language_id: state.currentLanguage,
                include_image: includeImage
            })
        });
        
        hideLoading();
        showToast('✅ AI Flashcard generated successfully!');
        await loadFlashcards();
        switchTab('study');
        
        return flashcard;
    } catch (error) {
        hideLoading();
        showToast('AI generation failed. Check your API key.');
        throw error;
    }
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
        <div class="flashcard max-w-2xl mx-auto" onclick="flipCard()">
            <div class="flashcard-inner relative">
                <!-- Front of card -->
                <div class="flashcard-front bg-white rounded-xl shadow-xl p-8 min-h-[400px] cursor-pointer hover:shadow-2xl transition">
                    <div class="flex justify-between items-start mb-6">
                        <div class="text-sm text-gray-500">
                            ${flashcard.source === 'ai_generated' ? '🤖 AI Generated' : '✍️ Manual'}
                        </div>
                        <div class="text-sm text-gray-500">
                            Reviewed ${flashcard.times_reviewed} times
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <h2 class="text-5xl font-bold text-gray-900 mb-8">
                            ${flashcard.word_or_phrase}
                        </h2>
                        
                        ${flashcard.image_url ? `
                            <img src="${flashcard.image_url}" 
                                 alt="${flashcard.image_description || flashcard.word_or_phrase}"
                                 class="w-full max-w-md mx-auto rounded-lg mb-6 shadow-md">
                        ` : ''}
                        
                        <p class="text-gray-600 italic mt-8">
                            Click to reveal details
                        </p>
                    </div>
                </div>
                
                <!-- Back of card -->
                <div class="flashcard-back bg-indigo-50 rounded-xl shadow-xl p-8 min-h-[400px] cursor-pointer hover:shadow-2xl transition">
                    <div class="space-y-6">
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
                        
                        <p class="text-gray-600 italic text-center mt-8">
                            Click to flip back
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
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

function renderFlashcardList() {
    const listContainer = document.getElementById('flashcard-list');
    
    if (state.flashcards.length === 0) {
        listContainer.innerHTML = '<p class="text-center text-gray-500 py-8">No flashcards yet</p>';
        return;
    }
    
    listContainer.innerHTML = state.flashcards.map((card, index) => `
        <div class="bg-white rounded-lg p-4 shadow hover:shadow-md transition cursor-pointer"
             onclick="selectCard(${index})">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-900 text-lg mb-1">${card.word_or_phrase}</h3>
                    <p class="text-gray-600 text-sm line-clamp-2">${card.definition || 'No definition'}</p>
                </div>
                <div class="ml-4 text-sm text-gray-500">
                    ${card.source === 'ai_generated' ? '🤖' : '✍️'}
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
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600');
        btn.classList.add('text-gray-600');
    });
    
    document.getElementById(`tab-${tabName}`).classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600');
    document.getElementById(`tab-${tabName}`).classList.remove('text-gray-600');
    
    // Show/hide content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
}

// ========================================
// Form Handlers
// ========================================

document.getElementById('create-flashcard-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const word = document.getElementById('word-input').value;
    const definition = document.getElementById('definition-input').value;
    const etymology = document.getElementById('etymology-input').value;
    const cognates = document.getElementById('cognates-input').value;
    const relatedInput = document.getElementById('related-input').value;
    
    // Convert related words to JSON array
    const relatedWords = relatedInput ? JSON.stringify(relatedInput.split(',').map(w => w.trim())) : null;
    
    await createFlashcard({
        word_or_phrase: word,
        definition: definition || null,
        etymology: etymology || null,
        english_cognates: cognates || null,
        related_words: relatedWords
    });
    
    // Clear form
    e.target.reset();
});

document.getElementById('ai-generate-btn').addEventListener('click', async () => {
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

// ========================================
// Event Listeners
// ========================================

document.getElementById('language-select').addEventListener('change', async (e) => {
    state.currentLanguage = e.target.value;
    if (state.currentLanguage) {
        await loadFlashcards();
    }
});

document.getElementById('tab-study').addEventListener('click', () => switchTab('study'));
document.getElementById('tab-add').addEventListener('click', () => switchTab('add'));
document.getElementById('tab-browse').addEventListener('click', () => switchTab('browse'));

document.getElementById('next-card').addEventListener('click', nextCard);
document.getElementById('prev-card').addEventListener('click', prevCard);

// Manual/AI form toggle
document.getElementById('btn-manual').addEventListener('click', function() {
    document.getElementById('manual-form').classList.remove('hidden');
    document.getElementById('ai-form').classList.add('hidden');
    this.classList.add('bg-indigo-600', 'text-white');
    this.classList.remove('bg-gray-200', 'text-gray-700');
    document.getElementById('btn-ai').classList.remove('bg-indigo-600', 'text-white');
    document.getElementById('btn-ai').classList.add('bg-gray-200', 'text-gray-700');
});

document.getElementById('btn-ai').addEventListener('click', function() {
    document.getElementById('ai-form').classList.remove('hidden');
    document.getElementById('manual-form').classList.add('hidden');
    this.classList.add('bg-indigo-600', 'text-white');
    this.classList.remove('bg-gray-200', 'text-gray-700');
    document.getElementById('btn-manual').classList.remove('bg-indigo-600', 'text-white');
    document.getElementById('btn-manual').classList.add('bg-gray-200', 'text-gray-700');
});

// Search functionality
let searchTimeout;
document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
            searchFlashcards(query);
        } else {
            renderFlashcardList();
        }
    }, 300);
});

async function searchFlashcards(query) {
    try {
        const results = await apiRequest(`/flashcards/search?q=${encodeURIComponent(query)}&language_id=${state.currentLanguage}`);
        const originalFlashcards = state.flashcards;
        state.flashcards = results;
        renderFlashcardList();
        state.flashcards = originalFlashcards;
    } catch (error) {
        console.error('Search failed:', error);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    
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
// Initialize App
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadLanguages();
    
    // Check online status on load
    if (!navigator.onLine) {
        state.isOnline = false;
        document.getElementById('offline-indicator').classList.remove('hidden');
    }
});