# Sprint 2 Manual Testing Checklist

**Purpose**: Validate all Sprint 2 implementations before handoff  
**Updated**: October 4, 2025

---

## Pre-Testing Setup

- [ ] Application running: `http://localhost:8000`
- [ ] Database connected (MS SQL Express)
- [ ] At least 3 flashcards exist for testing
- [ ] Browser dev tools open (Console tab)
- [ ] Test in Chrome/Edge (PWA support)

---

## Phase A: CRUD UI Testing

### Edit Flashcard Modal

**Setup**: Navigate to Browse tab with existing flashcards

- [ ] **Edit button visible** on each flashcard in browse list
- [ ] **Click edit button** - modal opens without page refresh
- [ ] **Pre-populated data** - form shows current flashcard data correctly
- [ ] **Edit word field** - can modify word/phrase
- [ ] **Edit definition** - can modify definition text
- [ ] **Edit etymology** - can modify etymology text  
- [ ] **Edit cognates** - can modify English cognates
- [ ] **Edit related words** - can modify comma-separated list
- [ ] **Image section** - shows/hides correctly if image exists
- [ ] **Save changes** - updates database and UI immediately
- [ ] **Cancel button** - closes modal without saving
- [ ] **Close X button** - closes modal without saving
- [ ] **Form validation** - requires word field
- [ ] **Error handling** - shows toast on API failure

**Edge Cases**:
- [ ] Edit flashcard with no definition/etymology
- [ ] Edit flashcard with image vs without image
- [ ] Edit flashcard while on study view
- [ ] Save with network disconnected (error handling)

### Delete Flashcard Confirmation

**Setup**: Have multiple flashcards available

- [ ] **Delete button visible** on browse list
- [ ] **Click delete button** - confirmation modal appears
- [ ] **Modal shows correct word** - displays flashcard being deleted
- [ ] **Warning message** - shows "cannot be undone" warning
- [ ] **Confirm delete** - removes from database and UI
- [ ] **Cancel delete** - closes modal, keeps flashcard
- [ ] **Delete from edit modal** - works from edit modal delete button
- [ ] **Study view handling** - if deleting current study card, navigates properly

**Edge Cases**:
- [ ] Delete last flashcard in list
- [ ] Delete currently studied flashcard
- [ ] Delete with network disconnected
- [ ] Multiple rapid delete attempts

### Enhanced Manual Entry Form

**Setup**: Navigate to Add Card tab

- [ ] **Improved layout** - better spacing and labels
- [ ] **Textareas** - multi-line fields use textarea not input
- [ ] **Helpful placeholders** - good example text in fields
- [ ] **Word field required** - form validation works
- [ ] **Clear button** - resets entire form
- [ ] **Create flashcard** - still works with enhanced form
- [ ] **Field labels** - clear descriptions with context hints

---

## Phase B: PWA Testing

### Service Worker

**Setup**: Chrome dev tools → Application tab → Service Workers

- [ ] **Service worker registered** - appears in dev tools
- [ ] **Static assets cached** - HTML/CSS/JS cached on first load
- [ ] **Offline static** - static files load when disconnected
- [ ] **Cache update** - new SW version updates cache

### PWA Manifest

**Setup**: Chrome dev tools → Application tab → Manifest

- [ ] **Manifest detected** - shows app info in dev tools
- [ ] **App name correct** - "Language Learning Flashcards"
- [ ] **Icons present** - manifest shows icon references
- [ ] **Install prompt** - Chrome shows install option

### Install Functionality

**Desktop (Chrome/Edge)**:
- [ ] **Install button** appears in address bar
- [ ] **Install works** - app installs as standalone
- [ ] **Standalone mode** - runs without browser UI
- [ ] **App icon** - appears in OS app list

---

## Integration Testing

### Cross-Feature Testing

- [ ] **Edit → Study** - edit card, then study shows updates
- [ ] **Delete → Browse** - delete card, browse list updates
- [ ] **Create → Edit** - create new card, can immediately edit
- [ ] **PWA → Offline** - installed app works offline for static content
- [ ] **Refresh data** - all views sync properly

### Performance Testing

- [ ] **Modal speed** - edit/delete modals open quickly
- [ ] **Form responsiveness** - no lag typing in large textareas
- [ ] **API response time** - edit/delete operations feel fast
- [ ] **Memory usage** - no obvious leaks in long session

---

## Error Scenarios

### Network Issues

- [ ] **Offline edit** - proper error message
- [ ] **Offline delete** - proper error message  
- [ ] **Slow network** - loading states work
- [ ] **API errors** - 500 responses handled gracefully

### Data Edge Cases

- [ ] **Empty fields** - edit with blank definition/etymology
- [ ] **Long text** - very long definitions display properly
- [ ] **Special characters** - unicode, emojis, accents work
- [ ] **Malformed data** - handles corrupted flashcard data

---

## Browser Compatibility

### Desktop Testing

- [ ] **Chrome** - all features work
- [ ] **Edge** - all features work  
- [ ] **Firefox** - basic functionality (no PWA)

### Mobile Testing (if available)

- [ ] **Chrome Mobile** - responsive layout
- [ ] **Safari Mobile** - basic functionality
- [ ] **PWA install** - Add to Home Screen works

---

## Final Validation

### User Experience

- [ ] **Intuitive flow** - edit/delete process feels natural
- [ ] **Fast interactions** - no unnecessary delays
- [ ] **Clear feedback** - user knows when actions succeed/fail
- [ ] **No bugs** - no console errors or broken functionality

### Ready for Production

- [ ] **All features working** - edit, delete, enhanced forms, PWA
- [ ] **Error handling complete** - graceful failure modes
- [ ] **Performance acceptable** - responsive user interface
- [ ] **Documentation complete** - CHANGES.md updated with findings

---

## Test Results Summary

**Date Tested**: _____________  
**Browser**: _____________  
**Issues Found**: _____________  
**Features Working**: _____ / _____  
**Ready for Claude Handoff**: [ ] Yes [ ] No

**Notes**: