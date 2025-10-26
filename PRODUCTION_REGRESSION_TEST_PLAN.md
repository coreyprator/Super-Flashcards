# Production Regression Test Plan

## Test Environment

- **URL**: <https://learn.rentyourcio.com>
- **Backend**: Cloud Run (revision 00053-mz7)
- **Database**: Cloud SQL (LanguageLearning)
- **Test User**: <cprator@cbsware.com>

## Pre-Test Checklist

- [x] Clear browser cache and cookies
- [x] Close all browser tabs
- [x] Use incognito/private window for fresh session
- [x] Have test credentials ready

---

## Test Plan

### 1. Initial Page Load & Performance

**Objective**: Verify app loads quickly and displays correctly

- [x] 1.1. Navigate to <https://learn.rentyourcio.com>
- [x] 1.2. Verify page loads in < 5 seconds
- [x] 1.3. Verify all static assets load (CSS, JS, images)
- [x] 1.4. Check browser console for errors (should be clean)
- [x] 1.5. Verify responsive layout on desktop

**Expected**: Clean load, no console errors, UI renders properly
> Passed!
---

### 2. Google OAuth Authentication

**Objective**: Verify complete OAuth login flow

- [x] 2.1. Click "Sign in with Google" button
- [x] 2.2. Redirects to Google OAuth consent screen
- [x] 2.3. Select test account (<cprator@cbsware.com>)
- [x] 2.4. Grant permissions if prompted
- [x] 2.5. Redirects back to <https://learn.rentyourcio.com/login> (NOT localhost)
- [x] 2.6. Verify login completes successfully
- [x] 2.7. Verify user name/email displays in UI
- [x] 2.8. OAuth flow completes in < 10 seconds

**Expected**: Seamless login, stays on production URL, user logged in
> Passed!
---

### 3. Flashcard Data Loading

**Objective**: Verify flashcards load from database

- [x] 3.1. After login, flashcards should load automatically
- [x] 3.2. Verify flashcard count displays (should show 758 cards)
- [x] 3.3. Flashcards load in < 2 seconds
- [x] 3.4. Verify card data includes: front, back, language
- [x] 3.5. Check IndexedDB cache is populated (browser dev tools > Application)
> Passed!
**Expected**: 758 flashcards load quickly from Cloud SQL

#### Analysis

> **oauth-tracker.js?v=1.0.0:123 Total time: 780ms
> oauth-tracker.js?v=1.0.0:128 Slowest phase: initial-sync (780ms)
> oauth-tracker.js?v=1.0.0:136 === BREAKDOWN ===
> oauth-tracker.js?v=1.0.0:137 OAuth flow: 0ms
> oauth-tracker.js?v=1.0.0:138 Initial sync: 780ms
> oauth-tracker.js?v=1.0.0:139 First card load: 0ms
> sync.js?v=5.2.0:225 ✅ Background loading finished, sync truly complete
> db.js?v=5.2.1:650 📊 Saved metadata: last_sync_time
> sync.js?v=5.2.0:237 ╔════════════════════════════════════════╗
> sync.js?v=5.2.0:238 ║     SYNC COMPLETE (0.79s)           ║
> ---**

### 4. Language Selection & Filtering

**Objective**: Verify language filtering works

- [x] 4.1. Verify language selector displays available languages
- [x] 4.2. Select "French" language
- [x] 4.3. Verify only French cards display
- [x] 4.4. Note filtered card count
- [x] 4.5. Select "Greek" language
- [x] 4.6. Verify only Greek cards display


**Expected**: Filtering works correctly for all languages

> Passed!
---

### 5. Flashcard Study Mode

**Objective**: Verify study/review functionality

- [x] 5.1. Click on a flashcard to enter study mode
- [x] 5.2. Verify front of card displays
- [x] 5.3. Click "Reveal" or flip card
- [x] 5.4. Verify back of card displays
~~- [ ] 5.5. Rate difficulty (Easy/Medium/Hard)~~Not in this release
- [x] 5.6. Verify next card appears
- [x] 5.7. Complete 5-10 card review session

**Expected**: Study mode works smoothly, cards flip correctly
> Passed!
---

### 6. Audio/TTS Functionality (if applicable)

**Objective**: Verify text-to-speech works

- [x] 6.1. Look for audio/speaker icon on cards
- [x] 6.2. Click audio icon
- [x] 6.3. Verify pronunciation plays
- [x] 6.4. Test on multiple languages (French, Greek)
- [x] 6.5. Verify audio quality is acceptable

**Expected**: TTS works for supported languages
> Passed!
**Note**: Skip if TTS not yet implemented in production

---

### 7. Card Creation/Editing

**Objective**: Verify CRUD operations work

- [ ] 7.1. Navigate to "Add Card" or "Create" section
- [ ] 7.2. Fill in card details (front, back, language)
- [ ] 7.3. Submit new card
- [ ] 7.4. Verify card appears in deck
- [ ] 7.5. Edit an existing card
- [ ] 7.6. Verify changes save correctly
- [ ] 7.7. Delete a test card
- [ ] 7.8. Verify deletion works

**Expected**: All CRUD operations save to Cloud SQL

---

### 8. Search Functionality

**Objective**: Verify search works

- [ ] 8.1. Enter search term in search box
- [ ] 8.2. Verify matching cards display
- [ ] 8.3. Try multiple search terms
- [ ] 8.4. Clear search
- [ ] 8.5. Verify all cards return

**Expected**: Search filters cards correctly

---

### 9. Study Session Tracking

**Objective**: Verify study data persists

- [ ] 9.1. Complete a study session (5+ cards)
- [ ] 9.2. Check database for study_sessions records
- [ ] 9.3. Verify session data includes: card_id, user_id, ease_rating
- [ ] 9.4. Log out
- [ ] 9.5. Log back in
- [ ] 9.6. Verify study progress persists

**Expected**: Study sessions save to database correctly

---

### 10. User Profile & Settings

**Objective**: Verify user data management

- [ ] 10.1. Navigate to profile/settings page
- [ ] 10.2. Verify user info displays (name, email)
- [ ] 10.3. Update profile settings (if available)
- [ ] 10.4. Verify changes save
- [ ] 10.5. Check user_languages table in database

**Expected**: User data displays and updates correctly

---

### 11. Session Persistence

**Objective**: Verify login persists across sessions

- [ ] 11.1. Log in successfully
- [ ] 11.2. Close browser completely
- [ ] 11.3. Reopen browser
- [ ] 11.4. Navigate to <https://learn.rentyourcio.com>
- [ ] 11.5. Verify still logged in (no re-login required)

**Expected**: Session persists for ~30 days (JWT expiry)

---

### 12. Logout Functionality

**Objective**: Verify logout works

- [ ] 12.1. Click "Logout" or sign out button
- [ ] 12.2. Verify redirects to login page
- [ ] 12.3. Verify session cleared
- [ ] 12.4. Try accessing protected route
- [ ] 12.5. Verify redirects to login

**Expected**: Complete logout, session cleared

---

### 13. Error Handling

**Objective**: Verify graceful error handling

- [ ] 13.1. Try accessing app with no internet (airplane mode)
- [ ] 13.2. Verify offline message or cached data loads
- [ ] 13.3. Restore internet
- [ ] 13.4. Verify app recovers gracefully
- [ ] 13.5. Try submitting invalid data
- [ ] 13.6. Verify appropriate error messages display

**Expected**: Errors handled gracefully, no crashes

---

### 14. Mobile/Responsive Testing (if applicable)

**Objective**: Verify mobile experience

- [ ] 14.1. Test on mobile device or browser dev tools mobile view
- [ ] 14.2. Verify responsive layout works
- [ ] 14.3. Test touch interactions
- [ ] 14.4. Verify OAuth works on mobile
- [ ] 14.5. Test landscape/portrait orientations

**Expected**: App works well on mobile

---

### 15. Database Verification

**Objective**: Verify data integrity

- [ ] 15.1. Connect to Cloud SQL via SSMS
- [ ] 15.2. Verify tables: flashcards (758), languages (9), users (1+)
- [ ] 15.3. Check study_sessions for recent activity
- [ ] 15.4. Verify foreign keys are intact
- [ ] 15.5. Run sample queries to test data quality

**Expected**: All data intact, no corruption

---

### 16. Batch Import (CSV/JSON)

**Objective**: Verify bulk import of flashcards from files

- [ ] 16.1. Click hamburger menu → "Import Flashcards"
- [ ] 16.2. Download CSV template from modal
- [ ] 16.3. Create CSV with 5 Greek words (with definitions, etymology)
- [ ] 16.4. Upload CSV file
- [ ] 16.5. Verify success message shows "5 flashcards imported"
- [ ] 16.6. Navigate to Browse mode
- [ ] 16.7. Verify all 5 imported cards appear
- [ ] 16.8. Test duplicate prevention: Re-upload same CSV
- [ ] 16.9. Verify duplicate message shown
- [ ] 16.10. Test error handling: Upload CSV with missing language
- [ ] 16.11. Verify clear error message

**Expected**: CSV imports successfully, cards visible, duplicates prevented, errors handled gracefully

---

### 17. Batch IPA Processing

**Objective**: Verify bulk audio generation for language

- [ ] 17.1. Click hamburger menu → "Batch Processing"
- [ ] 17.2. Select language: Greek
- [ ] 17.3. Click "Generate IPA for All Cards"
- [ ] 17.4. Monitor progress indicator
- [ ] 17.5. Verify completion message
- [ ] 17.6. Select a card and verify IPA pronunciation added
- [ ] 17.7. Click "Generate IPA Audio for All Cards"
- [ ] 17.8. Monitor progress indicator
- [ ] 17.9. Verify completion message
- [ ] 17.10. Test audio playback for IPA-generated cards

**Expected**: Batch processing completes successfully, IPA and audio added to all cards

---

### 18. Hamburger Menu Navigation

**Objective**: Verify menu functionality and navigation

- [ ] 18.1. Click hamburger icon (top-right, 3 lines)
- [ ] 18.2. Verify menu opens smoothly
- [ ] 18.3. Verify menu items visible:
  - [ ] 🔄 Sync Now
  - [ ] 📥 Import Flashcards
  - [ ] ⚙️ Batch Processing
  - [ ] ⚙️ Settings
- [ ] 18.4. Click "Sync Now" - verify sync indicator appears
- [ ] 18.5. Click "Import Flashcards" - verify import modal opens
- [ ] 18.6. Close modal, click "Batch Processing" - verify batch modal opens
- [ ] 18.7. Close modal, click "Settings" - verify settings page/modal opens
- [ ] 18.8. Verify menu closes when clicking outside
- [ ] 18.9. Verify menu closes after selecting an option

**Expected**: Menu navigation smooth, all options functional

---

## Known Issues / Limitations

Document any issues found during testing:

1. **Issue**: [Description]
   - **Impact**: [High/Medium/Low]
   - **Workaround**: [If available]
   - **Status**: [New/In Progress/Fixed]

---

---

## Known Issues & Bugs

### 🐛 Active Bugs

**BUG-001: Duplicate Definition Display in Study Mode**
- **Status**: 🔴 OPEN
- **Severity**: Low (UI/UX)
- **Reported**: Oct 25, 2025
- **Description**: In study mode, when clicking "Show Details", the definition appears twice:
  1. Below the word (in bold)
  2. Below the audio play button
- **Expected**: Definition should appear only once
- **Proposed Fix**: Remove duplicate from top section, keep only below audio player
- **Test**: Category 5 (Study Mode)

**BUG-002: Audio Not Generated on Card Creation (iPhone)**
- **Status**: 🟡 INVESTIGATING
- **Severity**: Medium (Core Feature)
- **Reported**: Oct 25, 2025
- **Description**: When adding a new card via iPhone, audio is not automatically generated despite TTS fix being deployed (revision 00057+)
- **Expected**: Audio should generate automatically after card creation
- **Backend Fix**: ✅ Deployed in revision 00057 (TTS Application Default Credentials)
- **Frontend**: ✅ Calls `generateAudioForCard()` after save
- **Next Steps**: 
  - Test on desktop to isolate iPhone-specific issue
  - Check browser console logs on iPhone
  - Verify network request to `/api/audio/generate` is made
- **Test**: Category 3 (Card Creation), Category 10 (Mobile Testing)

### ✅ Fixed Issues

**FIXED-001: AI Card Generation 500 Error**
- **Fixed**: Oct 25, 2025 (Revision 00055)
- **Issue**: Missing OPENAI_API_KEY in Cloud Run environment
- **Solution**: Added OPENAI_API_KEY secret to Cloud Run

**FIXED-002: Missing Audio Generation**
- **Fixed**: Oct 25, 2025 (Revision 00057)
- **Issue**: Google TTS service required GOOGLE_APPLICATION_CREDENTIALS file
- **Solution**: Modified TTS service to use Application Default Credentials in Cloud Run

**FIXED-003: DNS Resolution Failures**
- **Fixed**: Oct 25, 2025 (Client-side)
- **Issue**: AT&T gateway DNS servers timing out (68.94.156.9, 68.94.157.9)
- **Solution**: Changed laptop Wi-Fi DNS to Google DNS (8.8.8.8, 8.8.4.4)

---

## Test Results Summary

**Tester**: _______________  
**Date**: _______________  
**Environment**: Production (learn.rentyourcio.com)  

**Overall Status**: ⬜ PASS | ⬜ PASS WITH ISSUES | ⬜ FAIL

**Tests Passed**: ___/ 18  
**Tests Failed**: ___  
**Blockers**: ___  
**Open Bugs**: 2  

**Notes**:
[Add any additional observations or concerns]

---

## Sign-Off

- [ ] All critical functionality tested and working
- [ ] No blocking issues identified
- [ ] Ready for next sprint phase
- [ ] Handoff document reviewed

**Approved by**: _______________  
**Date**: _______________
