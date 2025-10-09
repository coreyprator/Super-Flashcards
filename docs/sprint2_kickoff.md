# Sprint 2 Kickoff Document
**Project**: Language Learning Flashcards  
**Sprint Focus**: CRUD UI Enhancements + PWA Foundation  
**Start Date**: After Sprint 1 git push  
**Estimated Duration**: 5-7 days

---

## Sprint Goal

Complete the CRUD interface for flashcards and lay foundation for offline PWA support.

**Priority 1**: Fix/improve basic CRUD operations (edit, delete, better forms)  
**Priority 2**: PWA infrastructure (service worker, offline basics)  
**Priority 3**: Basic spaced repetition (if time permits)

---

## Sprint 2 Features

### Phase A: CRUD UI Enhancements (Must Have)

These are the missing pieces from Sprint 1 MVP:

#### 1. Edit Flashcard UI
**Status**: Backend API exists (PUT /api/flashcards/{id}), UI missing

**Requirements**:
- [ ] Edit button on flashcard browse view
- [ ] Edit button on study view
- [ ] Modal or dedicated edit page
- [ ] Pre-populate form with existing data
- [ ] Save updates to database
- [ ] Update display immediately (no page refresh)

**UI Flow**:
```
User on Study/Browse → Click "Edit" button 
  → Modal appears with current data
  → User modifies fields
  → Click "Save" 
  → API call: PUT /api/flashcards/{id}
  → Modal closes, card updates
```

**Fields to Edit**:
- word_or_phrase
- definition
- etymology
- english_cognates
- related_words (comma-separated in UI)
- image_url (can change/remove)

#### 2. Delete Flashcard UI
**Status**: Backend API exists (DELETE /api/flashcards/{id}), UI missing

**Requirements**:
- [ ] Delete button on flashcard browse view
- [ ] Delete button in edit modal
- [ ] Confirmation dialog ("Are you sure?")
- [ ] Remove from display immediately
- [ ] Handle if user is studying deleted card

**UI Flow**:
```
User on Browse → Click "Delete" (trash icon)
  → Confirmation: "Delete '[word]'? This cannot be undone."
  → User confirms
  → API call: DELETE /api/flashcards/{id}
  → Card removed from list
```

**Edge Cases**:
- If deleting currently studied card → navigate to next/prev
- If deleting last card → show "no cards" message
- If delete fails → show error, don't remove from UI

#### 3. Improved Manual Card Form
**Status**: Basic form exists, needs enhancements

**Requirements**:
- [ ] Better layout and spacing
- [ ] Textarea for definition (multi-line)
- [ ] Textarea for etymology (multi-line)
- [ ] Helpful placeholders with examples
- [ ] Character counters (optional)
- [ ] Clear/reset button
- [ ] Form validation (word required)

**Example Placeholders**:
```
Word/Phrase: e.g., "susciter"
Definition: How is this word used? Provide context...
Etymology: From Latin "suscitare" meaning...
English Cognates: resuscitate, excite, incite
Related Words: provoquer, engendrer (comma-separated)
```

#### 4. Image Management
**Status**: Images save but no UI to change/remove

**Requirements**:
- [ ] Display current image in edit modal
- [ ] "Remove image" button
- [ ] "Regenerate image" button (calls AI again)
- [ ] Show image preview when editing
- [ ] Option to upload custom image (Phase 2.5)

**UI in Edit Modal**:
```
Current Image: [thumbnail display]
[Remove Image] [Regenerate with AI]
```

#### 5. Bulk Operations (Nice to Have)
**Status**: Not implemented

**Requirements** (if time permits):
- [ ] Select multiple cards (checkboxes)
- [ ] Delete selected
- [ ] Change language for selected
- [ ] Export selected to CSV

---

### Phase B: PWA Foundation (Should Have)

#### 1. Service Worker Basics
**Requirements**:
- [ ] Create `frontend/sw.js`
- [ ] Register service worker in `app.js`
- [ ] Cache static assets (HTML, CSS, JS)
- [ ] Cache Tailwind CDN
- [ ] Offline fallback page
- [ ] Test offline mode

**Files to Create**:
```
frontend/
├── sw.js                   # Service worker
├── manifest.json           # PWA manifest
└── offline.html            # Offline fallback page
```

**Service Worker Strategy**:
- Cache-first for static assets
- Network-first for API calls
- Offline page when network fails

#### 2. PWA Manifest
**Requirements**:
- [ ] Create `manifest.json`
- [ ] Define app name, icons, colors
- [ ] Set display: standalone
- [ ] Configure start_url
- [ ] Link in `index.html`

**Minimal Manifest**:
```json
{
  "name": "Language Learning Flashcards",
  "short_name": "Flashcards",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "icons": [...]
}
```

#### 3. Install Prompt
**Requirements**:
- [ ] Detect if installable
- [ ] Show install banner/button
- [ ] Handle beforeinstallprompt event
- [ ] Hide after installation
- [ ] iOS instructions (Add to Home Screen)

---

### Phase C: Basic Spaced Repetition (If Time Permits)

**Note**: Lower priority than CRUD UI fixes.

#### 1. Simple Review Scheduling
**Requirements**:
- [ ] Mark card difficulty (Easy/Hard buttons)
- [ ] Calculate next review date
- [ ] Store in last_reviewed field
- [ ] "Due for review" filter
- [ ] Sort by due date

**Algorithm** (Simple version):
```
Easy: Review in 7 days
Medium: Review in 3 days  
Hard: Review tomorrow
```

#### 2. Study Session Tracking
**Requirements**:
- [ ] Use study_sessions table
- [ ] Track: card reviewed, difficulty rating, time
- [ ] Show session summary at end
- [ ] "Cards reviewed today" counter

---

## Technical Implementation

### CRUD Operations - API Endpoints Already Exist

**No backend changes needed** for basic CRUD:
- ✅ GET /api/flashcards - List cards
- ✅ GET /api/flashcards/{id} - Get single card
- ✅ POST /api/flashcards - Create card
- ✅ PUT /api/flashcards/{id} - Update card
- ✅ DELETE /api/flashcards/{id} - Delete card

**Frontend needs**: UI to call these endpoints

### Frontend Changes Needed

**Update `frontend/app.js`**:
```javascript
// Add these functions:

async function editFlashcard(id, data) {
    const response = await apiRequest(`/flashcards/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response;
}

async function deleteFlashcard(id) {
    const response = await apiRequest(`/flashcards/${id}`, {
        method: 'DELETE'
    });
    return response;
}

function showEditModal(flashcard) {
    // Display modal with flashcard data
    // Pre-populate form fields
}

function confirmDelete(flashcard) {
    // Show confirmation dialog
    // If confirmed, call deleteFlashcard()
}
```

**Update `frontend/index.html`**:
```html
<!-- Add Edit Modal -->
<div id="edit-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50">
    <div class="bg-white rounded-lg p-8 max-w-2xl mx-auto mt-20">
        <h2 class="text-2xl font-bold mb-4">Edit Flashcard</h2>
        <form id="edit-flashcard-form">
            <!-- Form fields -->
        </form>
        <div class="mt-4 flex space-x-2">
            <button id="save-edit-btn">Save Changes</button>
            <button id="cancel-edit-btn">Cancel</button>
            <button id="delete-from-edit-btn" class="bg-red-600">Delete</button>
        </div>
    </div>
</div>

<!-- Add Delete Confirmation Modal -->
<div id="delete-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50">
    <div class="bg-white rounded-lg p-8 max-w-md mx-auto mt-40">
        <h2 class="text-xl font-bold mb-4">Delete Flashcard?</h2>
        <p class="mb-6">Are you sure you want to delete "<span id="delete-word"></span>"?</p>
        <p class="text-sm text-red-600 mb-6">This action cannot be undone.</p>
        <div class="flex space-x-2">
            <button id="confirm-delete-btn" class="bg-red-600">Delete</button>
            <button id="cancel-delete-btn">Cancel</button>
        </div>
    </div>
</div>
```

---

## Files to Modify

### Frontend Changes
```
frontend/
├── index.html          # Add edit and delete modals
├── app.js              # Add edit/delete functions, modal handlers
└── (new) sw.js         # Service worker for offline
└── (new) manifest.json # PWA manifest
```

### No Backend Changes
- API endpoints already functional
- Database schema supports all operations
- May add image regeneration endpoint (optional)

---

## Current Issues to Fix

Based on Sprint 1 handoff, these are known pain points:

1. **No edit capability**: Can't fix AI-generated content mistakes
2. **No delete UI**: Can't remove test/bad cards
3. **Form is basic**: Hard to enter multi-line content
4. **No image management**: Can't change or remove images
5. **Manual entry workflow**: Could be smoother

---

## Testing Checklist

### CRUD Testing
- [ ] Create flashcard manually
- [ ] Create flashcard with AI
- [ ] Edit existing flashcard
- [ ] Save changes persist to database
- [ ] Delete flashcard from browse view
- [ ] Delete flashcard from study view
- [ ] Delete last card shows appropriate message
- [ ] Form validation prevents empty words
- [ ] Multi-line text in definition/etymology works
- [ ] Image removal works
- [ ] Related words comma-separated format works

### PWA Testing
- [ ] Service worker registers successfully
- [ ] Static assets cached
- [ ] Offline page displays when no network
- [ ] Manifest linked and valid
- [ ] Install prompt appears (desktop Chrome)
- [ ] iOS instructions clear
- [ ] App installs to home screen
- [ ] Icon displays correctly

### Edge Cases
- [ ] Edit card while studying (updates immediately)
- [ ] Delete card being studied (navigates to next)
- [ ] Network error during edit (shows error)
- [ ] Network error during delete (doesn't remove from UI)
- [ ] Long text in fields (handles overflow)
- [ ] Special characters in word (Greek, French accents)

---

## Success Criteria

### Must Complete
- ✅ Edit flashcard UI functional
- ✅ Delete flashcard UI functional
- ✅ Improved manual entry form
- ✅ Basic PWA setup (installable)
- ✅ Service worker caching static assets
- ✅ All CRUD operations work from UI

### Should Complete
- ✅ Image management (remove/regenerate)
- ✅ Install prompt working
- ✅ Offline fallback page

### Nice to Have
- 🎯 Bulk operations
- 🎯 Basic spaced repetition
- 🎯 Study session tracking

---

## Sprint 2 Estimates

**Phase A: CRUD UI** (3 days)
- Edit modal: 1 day
- Delete confirmation: 0.5 day
- Improved forms: 0.5 day
- Image management: 0.5 day
- Testing: 0.5 day

**Phase B: PWA Foundation** (2 days)
- Service worker: 1 day
- Manifest and install: 0.5 day
- Testing: 0.5 day

**Phase C: Spaced Repetition** (2 days - optional)
- Simple algorithm: 1 day
- UI integration: 0.5 day
- Testing: 0.5 day

**Total**: 5-7 days depending on scope

---

## Risks & Mitigation

**Risk**: Edit modal complexity
- **Mitigation**: Use simple modal approach, not full component

**Risk**: Service worker bugs on iOS
- **Mitigation**: Test early, provide fallback

**Risk**: Image regeneration may be expensive
- **Mitigation**: Add confirmation, show cost estimate

**Risk**: Scope creep on features
- **Mitigation**: Stick to must-haves, defer nice-to-haves

---

## Dependencies

### External
- None (all tools already in place)

### Internal
- ✅ Sprint 1 complete and working
- ✅ API endpoints functional
- ✅ Database schema supports operations

---

## Handoff to VS Code AI

### Priority Order for Implementation

**Day 1-2: Edit UI**
1. Create edit modal HTML
2. Add edit button to browse list
3. Pre-populate form with flashcard data
4. Wire up save functionality
5. Test updates persist

**Day 2-3: Delete UI**
1. Create delete confirmation modal
2. Add delete buttons (browse + edit modal)
3. Wire up delete functionality
4. Handle edge cases (deleting current card)
5. Test deletion works

**Day 3: Form Improvements**
1. Convert to textareas where needed
2. Add helpful placeholders
3. Improve layout/spacing
4. Add validation
5. Test multi-line content

**Day 4-5: PWA Basics**
1. Create service worker
2. Create manifest.json
3. Register service worker
4. Test caching works
5. Test offline mode

**Day 5-7: Polish & Optional Features**
1. Image management UI
2. Install prompt
3. Spaced repetition (if time)
4. Final testing

---

## Context for VS Code AI

**What's Working**:
- All API endpoints functional
- Database CRUD operations work
- AI generation creates cards
- Images download and persist

**What's Missing**:
- UI to edit cards after creation
- UI to delete cards
- Better forms for manual entry
- PWA infrastructure

**User Need**:
- Fix mistakes in AI-generated content
- Remove test/bad cards
- Better manual entry experience
- Install to phone for travel

**Your Focus**: UI implementation, wiring up existing APIs, user experience polish

---

## Next Steps

1. Review this document
2. Start with edit modal (highest priority)
3. Implement delete confirmation
4. Improve forms
5. Add PWA basics
6. Test thoroughly
7. Document in Sprint 2 handoff

---

**Document Status**: Ready for VS Code AI  
**Priority**: CRUD UI first, then PWA  
**Estimated Completion**: 5-7 days