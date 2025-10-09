# Sprint 2 Implementation Guide - For VS Code AI

**Quick start guide for implementing Sprint 2 features**

---

## Priority Order

### Day 1-2: Edit Flashcard UI (Highest Priority)

**Goal**: Users can edit flashcards after creation

#### Step 1: Add Edit Modal to HTML

Add this to `frontend/index.html` before closing `</body>`:

```html
<!-- Edit Flashcard Modal -->
<div id="edit-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Edit Flashcard</h2>
            <button id="close-edit-modal" class="text-gray-500 hover:text-gray-700">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        
        <form id="edit-flashcard-form" class="space-y-4">
            <input type="hidden" id="edit-flashcard-id">
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Word or Phrase *</label>
                <input type="text" id="edit-word" required 
                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Definition</label>
                <textarea id="edit-definition" rows="3"
                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="How is this word used? Provide context..."></textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Etymology</label>
                <textarea id="edit-etymology" rows="2"
                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="From Latin... / From Greek..."></textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">English Cognates</label>
                <input type="text" id="edit-cognates"
                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="resuscitate, excite, incite">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Related Words (comma-separated)</label>
                <input type="text" id="edit-related"
                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="provoquer, engendrer, déclencher">
            </div>
            
            <div id="edit-image-section" class="hidden">
                <label class="block text-sm font-medium text-gray-700 mb-2">Current Image</label>
                <img id="edit-image-preview" class="w-32 h-32 object-cover rounded-lg mb-2">
                <div class="flex space-x-2">
                    <button type="button" id="remove-image-btn" class="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm">
                        Remove Image
                    </button>
                </div>
            </div>
            
            <div class="flex space-x-2 pt-4">
                <button type="submit" class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                    Save Changes
                </button>
                <button type="button" id="cancel-edit-btn" class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    Cancel
                </button>
                <button type="button" id="delete-from-edit-btn" class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Delete
                </button>
            </div>
        </form>
    </div>
</div>
```

#### Step 2: Add Edit Functions to app.js

Add these functions to `frontend/app.js`:

```javascript
// Edit flashcard
let currentEditingId = null;

function showEditModal(flashcard) {
    currentEditingId = flashcard.id;
    
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
        relatedWordsStr = related.join(', ');
    } catch (e) {
        relatedWordsStr = flashcard.related_words || '';
    }
    document.getElementById('edit-related').value = relatedWordsStr;
    
    // Show/hide image section
    if (flashcard.image_url) {
        document.getElementById('edit-image-section').classList.remove('hidden');
        document.getElementById('edit-image-preview').src = flashcard.image_url;
    } else {
        document.getElementById('edit-image-section').classList.add('hidden');
    }
    
    // Show modal
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    currentEditingId = null;
}

async function saveEditedFlashcard() {
    if (!currentEditingId) return;
    
    const word = document.getElementById('edit-word').value;
    const definition = document.getElementById('edit-definition').value;
    const etymology = document.getElementById('edit-etymology').value;
    const cognates = document.getElementById('edit-cognates').value;
    const relatedInput = document.getElementById('edit-related').value;
    
    // Convert related words to JSON array
    const relatedWords = relatedInput ? 
        JSON.stringify(relatedInput.split(',').map(w => w.trim())) : null;
    
    try {
        showLoading();
        const updated = await apiRequest(`/flashcards/${currentEditingId}`, {
            method: 'PUT',
            body: JSON.stringify({
                word_or_phrase: word,
                definition: definition || null,
                etymology: etymology || null,
                english_cognates: cognates || null,
                related_words: relatedWords
            })
        });
        
        hideLoading();
        showToast('✅ Flashcard updated successfully!');
        closeEditModal();
        
        // Refresh the display
        await loadFlashcards();
        
    } catch (error) {
        hideLoading();
        showToast('Failed to update flashcard');
        console.error('Update error:', error);
    }
}

// Event listeners for edit modal
document.getElementById('edit-flashcard-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveEditedFlashcard();
});

document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);

document.getElementById('remove-image-btn').addEventListener('click', async () => {
    if (!currentEditingId) return;
    
    try {
        await apiRequest(`/flashcards/${currentEditingId}`, {
            method: 'PUT',
            body: JSON.stringify({ image_url: null })
        });
        
        document.getElementById('edit-image-section').classList.add('hidden');
        showToast('Image removed');
        
    } catch (error) {
        showToast('Failed to remove image');
    }
});
```

#### Step 3: Add Edit Button to Browse List

Update `renderFlashcardList()` in `app.js`:

```javascript
function renderFlashcardList() {
    const listContainer = document.getElementById('flashcard-list');
    
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
                <div class="ml-4 flex space-x-2">
                    <button onclick="showEditModal(state.flashcards[${index}]); event.stopPropagation();" 
                        class="p-2 text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <span class="text-sm text-gray-500">${card.source === 'ai_generated' ? '🤖' : '✍️'}</span>
                </div>
            </div>
        </div>
    `).join('');
}
```

---

### Day 2-3: Delete Confirmation UI

#### Step 1: Add Delete Modal to HTML

```html
<!-- Delete Confirmation Modal -->
<div id="delete-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 max-w-md mx-4">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Delete Flashcard?</h2>
        <p class="text-gray-700 mb-2">Are you sure you want to delete:</p>
        <p class="font-semibold text-lg mb-4" id="delete-word-display"></p>
        <p class="text-sm text-red-600 mb-6">⚠️ This action cannot be undone.</p>
        <div class="flex space-x-2">
            <button id="confirm-delete-btn" class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                Delete
            </button>
            <button id="cancel-delete-btn" class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Cancel
            </button>
        </div>
    </div>
</div>
```

#### Step 2: Add Delete Functions to app.js

```javascript
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
        await apiRequest(`/flashcards/${flashcardToDelete.id}`, {
            method: 'DELETE'
        });
        
        hideLoading();
        showToast('Flashcard deleted');
        closeDeleteModal();
        
        // If deleting current study card, navigate away
        if (state.flashcards[state.currentCardIndex]?.id === flashcardToDelete.id) {
            nextCard(); // or prevCard() if last
        }
        
        // Refresh list
        await loadFlashcards();
        
    } catch (error) {
        hideLoading();
        showToast('Failed to delete flashcard');
        console.error('Delete error:', error);
    }
}

// Event listeners
document.getElementById('confirm-delete-btn').addEventListener('click', deleteFlashcard);
document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);
document.getElementById('delete-from-edit-btn').addEventListener('click', () => {
    closeEditModal();
    const card = state.flashcards.find(c => c.id === currentEditingId);
    if (card) confirmDelete(card);
});
```

#### Step 3: Add Delete Button to Browse List

Update the button section in `renderFlashcardList()`:

```javascript
<div class="ml-4 flex space-x-2">
    <button onclick="showEditModal(state.flashcards[${index}]); event.stopPropagation();" 
        class="p-2 text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
        <!-- Edit icon -->
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
```

---

### Day 3: Improve Manual Entry Form

Update the manual entry form in `index.html`:

```html
<div id="manual-form">
    <form id="create-flashcard-form" class="space-y-4">
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
                Word or Phrase *
            </label>
            <input type="text" id="word-input" required 
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., susciter, bonjour, je ne sais quoi">
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
                Definition / Context
                <span class="text-xs text-gray-500">(How is this word used?)</span>
            </label>
            <textarea id="definition-input" rows="4"
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Example: Le verbe susciter signifie « éveiller, exciter, faire naître ». Il est couramment utilisé pour exprimer l'idée de provoquer une réaction..."></textarea>
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
                Etymology
                <span class="text-xs text-gray-500">(Word origin and roots)</span>
            </label>
            <textarea id="etymology-input" rows="2"
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Example: From Latin suscitare, formed from sub- (under) + citare (to call, rouse)"></textarea>
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
                English Cognates
                <span class="text-xs text-gray-500">(Related English words)</span>
            </label>
            <input type="text" id="cognates-input"
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., resuscitate, excite, incite">
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
                Related Words
                <span class="text-xs text-gray-500">(Comma-separated)</span>
            </label>
            <input type="text" id="related-input"
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., provoquer, engendrer, déclencher">
        </div>
        
        <div class="flex space-x-2">
            <button type="submit" 
                class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                Create Flashcard
            </button>
            <button type="button" id="clear-form-btn"
                class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Clear
            </button>
        </div>
    </form>
</div>
```

Add clear button handler:

```javascript
document.getElementById('clear-form-btn').addEventListener('click', () => {
    document.getElementById('create-flashcard-form').reset();
});
```

---

### Day 4-5: PWA Basics

#### Service Worker (frontend/sw.js)

```javascript
const CACHE_NAME = 'flashcards-v1';
const urlsToCache = [
  '/',
  '/static/app.js',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

#### Register Service Worker in app.js

```javascript
// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then(reg => console.log('Service worker registered'))
            .catch(err => console.log('Service worker registration failed:', err));
    });
}
```

#### Manifest (frontend/manifest.json)

```json
{
  "name": "Language Learning Flashcards",
  "short_name": "Flashcards",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "description": "AI-powered language learning flashcards",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Add to index.html `<head>`:

```html
<link rel="manifest" href="/static/manifest.json">
```

---

## Testing Checklist

- [ ] Edit modal opens with correct data
- [ ] Can save edits, updates display
- [ ] Delete confirmation shows correct word
- [ ] Delete removes card from database and UI
- [ ] Improved form has better placeholders
- [ ] Clear button resets form
- [ ] Image remove button works
- [ ] Service worker registers
- [ ] App works offline (static assets cached)
- [ ] Install prompt appears on desktop

---

## Common Issues

**Modal doesn't close**: Check z-index, make sure hidden class applied

**Edit doesn't save**: Check PUT endpoint, verify flashcard ID passed correctly

**Delete fails**: Check if card exists, handle 404 error

**Service worker not registering**: Check path is correct, HTTPS required (except localhost)

---

**Start with edit modal - highest user priority. Test thoroughly before moving to delete.**