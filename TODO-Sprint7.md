# Sprint 7 TODO List

**Date Created:** November 5, 2025  
**Sprint Focus:** Image Generation Reliability & System Improvements

---

## 🔴 High Priority

### 1. Abstract Word Image Generation Issue
**Status:** Deferred from Sprint 6  
**Problem:** Words like "hyper", "naut", "techn" fail to generate images even with 3-level fallback  
**Current Behavior:**
- Level 1 (word-based): DALL-E content policy rejection
- Level 2 (definition-based): DALL-E content policy rejection  
- Level 3 (ultra-generic): Sometimes fails too

**Potential Solutions to Research:**
- [ ] Option A: Pre-detect abstract words (< 5 chars, Greek/Latin roots) and skip image generation gracefully
- [ ] Option B: Use alternative image API (Stability AI, Midjourney API) as final fallback
- [ ] Option C: Maintain library of generic educational images by category, use as last resort
- [ ] Option D: Allow flashcard creation without image, add "Generate Image Later" button

**Files Involved:**
- `backend/app/routers/ai_generate.py` (generate_image function, lines 157-400)
- `backend/app/routers/batch_ai_generate.py` (batch generation logic)

**Testing Words:** hyper, naut, techn, topo (sometimes), abstract Greek/Latin prefixes

**Priority:** High - affects user experience during batch imports

---

## 🟡 Medium Priority

### 2. Fix URL Parameter Navigation - Make Language Parameter User-Friendly
**Status:** Reported by user November 5, 2025  
**Problem:** URL requires exact language code format `?word=peri&language=Greek%20(el)` which users won't know  
**Root Cause:** Language stored in database as "Greek (el)" but users expect simple "Greek" to work  
**Expected Behavior:** Should accept both formats:
- `?word=peri&language=Greek` ✅ (simple, user-friendly)
- `?word=peri&language=Greek%20(el)` ✅ (current working format)

**Current Behavior:** 
- `?word=peri&language=Greek` ❌ (doesn't work, user-unfriendly)
- `?word=peri&language=Greek%20(el)` ✅ (works but requires language code knowledge)

**Solution Options:**
- [ ] Option A: Fuzzy match language name (strip language code suffix in search)
- [ ] Option B: Accept language code only `?word=peri&language=el` OR full name
- [ ] Option C: Add language alias mapping (Greek → Greek (el), French → French (fr), etc.)
- [ ] Option D: Update URL parsing to try multiple formats (Greek → Greek (el) → el)

**Implementation:**
- [ ] Modify `frontend/app.js` URL parameter handling (lines ~2720-2808)
- [ ] Update language matching logic to handle partial matches
- [ ] Add fallback search: exact match → name only → code only
- [ ] Test with all languages in database

**Files Involved:**
- `frontend/app.js` (URL parameter handling, lines 2720-2808)
- Backend API: `/api/flashcards/search` endpoint (may need fuzzy matching)

**Testing URLs:**
- `/?word=peri&language=Greek` (should work after fix)
- `/?word=Etymology&language=English` (verify English works)
- `/?word=bonjour&language=French` (test other languages)
- `/?word=peri&language=el` (test code-only format)

**Priority:** Medium - URL sharing feature exists but not user-friendly

---

### 3. Mobile Optimization
- [ ] Test Read mode on mobile devices (responsive design)
- [ ] Test batch import progress bar on mobile
- [ ] Verify SSE connection stability on mobile networks

### 4. Performance Optimization
- [ ] Analyze IndexedDB performance with 800+ cards
- [ ] Consider pagination for Browse mode (currently loads all)
- [ ] Optimize image loading (lazy loading, progressive images)

### 4. Error Handling Improvements
- [ ] Add retry mechanism for failed API calls
- [ ] Better error messages for users (not just dev logs)
- [ ] Handle SSE disconnection gracefully (auto-reconnect)

---

## 🟢 Low Priority (Technical Debt)

### 5. Code Refactoring
- [ ] Consider splitting `app.js` (5016 lines) into modules:
  - `study-mode.js`
  - `read-mode.js`
  - `browse-mode.js`
  - `batch-import.js`
  - `api-client.js`
  - `state-manager.js`
- **Note:** Would require build step (Webpack/Vite) or ES6 modules

### 6. Testing Infrastructure
- [ ] Unit tests for critical functions
- [ ] End-to-end testing for batch import
- [ ] Test SSE progress with slow connections

### 7. Documentation Updates
- [ ] Update API documentation with SSE endpoints
- [ ] Document image generation fallback logic
- [ ] Add troubleshooting guide for common issues

---

## ✅ Completed Sprint 6 Items

- ✅ Real-time batch progress with SSE and ETA (v2.6.40)
- ✅ Coffee break suggestions for long jobs
- ✅ Enhanced 3-level image fallback (v2.6.41)
- ✅ Fixed manifest.json 404 errors
- ✅ Fixed "Generate more cards" file input reset
- ✅ Fixed language change batch list clearing

---

## 📊 Sprint 6 Metrics

**Deployed Versions:**
- v2.6.39: Bug fixes (manifest, file reset, language change)
- v2.6.40: Real-time SSE progress with ETA
- v2.6.41: Enhanced image fallback

**User-Reported Issues Resolved:** 4/4 (100%)
**New Features Delivered:** 2 (SSE progress, coffee break feature)
**Known Issues Remaining:** 1 (abstract word images)

---

## 🎯 Sprint 7 Success Criteria

1. Abstract word image generation resolves gracefully (no failed flashcard creation)
2. All batch imports complete successfully with 95%+ image success rate
3. Mobile experience validated on iOS and Android
4. Error handling improved with user-friendly messages

---

## Notes for Next Sprint Lead

**Context:**
- Sprint 6 was highly successful with real-time progress tracking
- User is very satisfied with coffee break feature
- Image generation works for 95%+ of words, but abstract Greek/Latin roots still problematic
- All deployments smooth, Cloud Run stable

**Recommendations:**
- Research DALL-E prompt engineering for abstract concepts
- Consider pre-validation of problematic words before API call
- Test with actual Greek root word list (common in language learning)
- May need to accept that some words simply won't have images

**Technical Debt:**
- `app.js` is large but functional - only refactor if making major changes
- Consider modularization when adding next major feature
- Docker not needed yet (Cloud Run works perfectly)

