# UUID Display and Share URL Feature

## 📋 Feature Request

**Goal**: Display card UUID on flashcard footer with ability to copy shareable URL

**User Story**: As a user, I want to see the UUID of a flashcard and easily copy a shareable URL so I can share specific cards with others.

---

## 🎯 Implementation Plan

### Frontend Changes

#### 1. Update Card Rendering to Show UUID Footer

**File**: `frontend/app.js`

**Function to Update**: `renderFlashcard()` around line ~600

Add UUID footer section:

```javascript
// Add after the existing card structure, before closing card div
<div class="card-footer mt-4 pt-4 border-t border-gray-200">
    <div class="flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center gap-2">
            <span class="font-mono text-gray-400">${card.id}</span>
            <button 
                onclick="copyShareURL('${card.id}', '${card.word_or_phrase}'); event.stopPropagation();"
                class="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                title="Copy share URL">
                📋
            </button>
        </div>
        <span class="text-gray-400">ID: ${card.id.substring(0, 8)}...</span>
    </div>
</div>
```

#### 2. Add Copy Share URL Function

**File**: `frontend/app.js`

Add new function:

```javascript
/**
 * Copy shareable URL for a flashcard
 * @param {String} cardId - UUID of the flashcard
 * @param {String} word - Word for fallback parameter
 */
async function copyShareURL(cardId, word) {
    try {
        // Build share URL with both parameters for redundancy
        const shareURL = `${window.location.origin}/?cardId=${cardId}&word=${encodeURIComponent(word)}&language=${state.currentLanguage}`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(shareURL);
        
        // Show success toast
        showToast('✅ Share URL copied to clipboard!', 3000);
        
        console.log(`📋 Copied share URL: ${shareURL}`);
    } catch (error) {
        console.error('❌ Failed to copy URL:', error);
        showToast('❌ Failed to copy URL', 3000);
    }
}
```

#### 3. Update Browse Mode Cards

**File**: `frontend/app.js`

**Function to Update**: `loadCardsList()` around line ~4204

Add UUID display in browse list:

```javascript
cardsList.innerHTML = state.flashcards.map((card, index) => `
    <div class="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
         onclick="selectCard(${index})"
         data-flashcard-id="${card.id}">
        <div class="flex justify-between items-start">
            <div class="flex-1">
                <h3 class="font-semibold text-lg mb-2">${card.word_or_phrase}</h3>
                ${card.definition ? `<p class="text-gray-600 text-sm mb-2">${card.definition}</p>` : ''}
                
                <!-- ADD UUID LINE -->
                <div class="flex items-center gap-2 text-xs text-gray-400 mt-2">
                    <span class="font-mono">${card.id.substring(0, 13)}...</span>
                    <button onclick="copyShareURL('${card.id}', '${card.word_or_phrase}'); event.stopPropagation();"
                            class="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Copy share URL">
                        📋
                    </button>
                </div>
            </div>
            
            <!-- Existing buttons -->
            <div class="flex items-center gap-2 ml-4">
                ${card.audio_url ? `...` : ''}
                <!-- ... rest of buttons -->
            </div>
        </div>
    </div>
`).join('');
```

#### 4. Update Read Mode Cards

**File**: `frontend/app.js`

**Function to Update**: `renderReadCard()` around line ~650

Add UUID footer similar to Study mode.

---

## 🎨 Visual Design

### Study Mode Card Footer
```
┌─────────────────────────────────────────┐
│                                         │
│  [Card Content Here]                    │
│                                         │
├─────────────────────────────────────────┤
│ 550e8400-e29b... 📋  │  ID: 550e8400... │
└─────────────────────────────────────────┘
```

### Browse Mode List Item
```
┌─────────────────────────────────────────┐
│ Καλημέρα                                │
│ Good morning (formal greeting)          │
│                                         │
│ 550e8400-e29b... 📋                      │
└─────────────────────────────────────────┘
```

---

## ✅ Testing Checklist

After implementation, verify:

- [ ] UUID displays on Study mode flashcards
- [ ] UUID displays on Browse mode card list
- [ ] UUID displays on Read mode
- [ ] Copy button (📋) is visible and clickable
- [ ] Clicking copy button copies full URL to clipboard
- [ ] Success toast appears after copy
- [ ] Copied URL includes ?cardId=UUID
- [ ] Copied URL includes ?word=X as fallback
- [ ] Copied URL includes ?language=Y
- [ ] Pasting URL in new tab opens correct card
- [ ] UUID is truncated nicely (first 13 chars + ...)
- [ ] Hover tooltip shows "Copy share URL"

---

## 🧪 Playwright Test

The test `test_uuid_display_and_copy_feature()` in `tests/test_batch_and_url_sharing.py` will verify this feature.

Currently it will SKIP with message:
```
⚠️  UUID display feature not yet implemented
💡 FEATURE REQUEST: Add UUID to card footer with copy button
```

After implementation, the test should PASS.

---

## 📊 User Benefits

1. **Easy Sharing**: One-click copy of shareable URL
2. **Debugging**: UUID visible for troubleshooting
3. **Collaboration**: Share specific cards with students/colleagues
4. **Bookmarking**: Save links to frequently reviewed cards
5. **Integration**: Use URLs in LMS or other tools

---

## 🚀 Quick Implementation

**Estimated Time**: 30 minutes

**Priority**: Medium (Nice-to-have, improves UX)

**Complexity**: Low (Simple UI addition)

**Files to Change**:
1. `frontend/app.js` - 3 functions
2. `frontend/index.html` - No changes needed (uses inline styles)

Would you like me to implement this feature now?
