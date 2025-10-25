# Production Regression Test Plan

## Test Environment
- **URL**: https://learn.rentyourcio.com
- **Backend**: Cloud Run (revision 00053-mz7)
- **Database**: Cloud SQL (LanguageLearning)
- **Test User**: cprator@cbsware.com

## Pre-Test Checklist
- [ ] Clear browser cache and cookies
- [ ] Close all browser tabs
- [ ] Use incognito/private window for fresh session
- [ ] Have test credentials ready

---

## Test Plan

### 1. Initial Page Load & Performance
**Objective**: Verify app loads quickly and displays correctly

- [ ] 1.1. Navigate to https://learn.rentyourcio.com
- [ ] 1.2. Verify page loads in < 5 seconds
- [ ] 1.3. Verify all static assets load (CSS, JS, images)
- [ ] 1.4. Check browser console for errors (should be clean)
- [ ] 1.5. Verify responsive layout on desktop

**Expected**: Clean load, no console errors, UI renders properly

---

### 2. Google OAuth Authentication
**Objective**: Verify complete OAuth login flow

- [ ] 2.1. Click "Sign in with Google" button
- [ ] 2.2. Redirects to Google OAuth consent screen
- [ ] 2.3. Select test account (cprator@cbsware.com)
- [ ] 2.4. Grant permissions if prompted
- [ ] 2.5. Redirects back to https://learn.rentyourcio.com/login (NOT localhost)
- [ ] 2.6. Verify login completes successfully
- [ ] 2.7. Verify user name/email displays in UI
- [ ] 2.8. OAuth flow completes in < 10 seconds

**Expected**: Seamless login, stays on production URL, user logged in

---

### 3. Flashcard Data Loading
**Objective**: Verify flashcards load from database

- [ ] 3.1. After login, flashcards should load automatically
- [ ] 3.2. Verify flashcard count displays (should show 758 cards)
- [ ] 3.3. Flashcards load in < 2 seconds
- [ ] 3.4. Verify card data includes: front, back, language
- [ ] 3.5. Check IndexedDB cache is populated (browser dev tools > Application)

**Expected**: 758 flashcards load quickly from Cloud SQL

---

### 4. Language Selection & Filtering
**Objective**: Verify language filtering works

- [ ] 4.1. Verify language selector displays available languages
- [ ] 4.2. Select "French" language
- [ ] 4.3. Verify only French cards display
- [ ] 4.4. Note filtered card count
- [ ] 4.5. Select "Greek" language
- [ ] 4.6. Verify only Greek cards display
- [ ] 4.7. Select "All Languages"
- [ ] 4.8. Verify all 758 cards display again

**Expected**: Filtering works correctly for all languages

---

### 5. Flashcard Study Mode
**Objective**: Verify study/review functionality

- [ ] 5.1. Click on a flashcard to enter study mode
- [ ] 5.2. Verify front of card displays
- [ ] 5.3. Click "Reveal" or flip card
- [ ] 5.4. Verify back of card displays
- [ ] 5.5. Rate difficulty (Easy/Medium/Hard)
- [ ] 5.6. Verify next card appears
- [ ] 5.7. Complete 5-10 card review session

**Expected**: Study mode works smoothly, cards flip correctly

---

### 6. Audio/TTS Functionality (if applicable)
**Objective**: Verify text-to-speech works

- [ ] 6.1. Look for audio/speaker icon on cards
- [ ] 6.2. Click audio icon
- [ ] 6.3. Verify pronunciation plays
- [ ] 6.4. Test on multiple languages (French, Greek)
- [ ] 6.5. Verify audio quality is acceptable

**Expected**: TTS works for supported languages

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
- [ ] 11.4. Navigate to https://learn.rentyourcio.com
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

## Known Issues / Limitations
Document any issues found during testing:

1. **Issue**: [Description]
   - **Impact**: [High/Medium/Low]
   - **Workaround**: [If available]
   - **Status**: [New/In Progress/Fixed]

---

## Test Results Summary

**Tester**: _______________  
**Date**: _______________  
**Environment**: Production (learn.rentyourcio.com)  

**Overall Status**: ⬜ PASS | ⬜ PASS WITH ISSUES | ⬜ FAIL

**Tests Passed**: ___ / 15  
**Tests Failed**: ___  
**Blockers**: ___  

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
