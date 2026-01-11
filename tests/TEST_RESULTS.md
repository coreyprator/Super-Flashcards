# 🧪 Batch Generation Test Results - October 29, 2025

## Test Execution Summary

**Test**: `test_batch_generation_full_workflow`
**Status**: ⏸️ **Manually paused for inspection**
**Words Selected**: `crat` and `photo` (first 2 non-duplicates from 49 words)

---

## ✅ What Worked

1. ✅ **File Upload**: Successfully uploaded `greek_roots.txt`
2. ✅ **Parsing**: Parsed all 49 words correctly
3. ✅ **Duplicate Detection**: Correctly identified 26 duplicates, 23 new words
4. ✅ **Word Selection**: Selected `crat` and `photo` (non-duplicates)
5. ✅ **Batch Generation**: Both cards generated successfully
6. ✅ **Cards in Browse List**: Both words appeared in Browse mode
7. ✅ **Cache Refresh**: Cards visible without page reload ✅
8. ✅ **Card Navigation**: Clicking on cards opens them in Study mode

---

## ⚠️ Issues Found

### 🐛 **BUG 1: Missing Audio for "crat"**
**Symptom**: Card showed "🔊 Generate Audio" button instead of audio file
**Expected**: Audio should be generated during batch process
**Actual**: Audio generation may have failed or timed out for this word

**Possible Causes**:
- TTS API timeout
- Greek pronunciation not available for root word "crat"
- Audio generation queued but not completed

### 🐛 **BUG 2: Browse List Order Changes After Card View**
**Symptom**: 
1. New cards visible in Browse (sorted by "Date Modified - Newest")
2. Click on a card to open it
3. Close the card
4. **Browse list order changes**
5. New words disappear from list
6. Changing sort order (to any other, then back to "Newest") makes cards reappear

**Expected**: Browse list order should remain stable after viewing a card

**Actual**: Viewing a card causes list to re-sort incorrectly, hiding new cards

**Steps to Reproduce**:
1. Generate new batch cards
2. Go to Browse mode (default sort: "Date Modified - Newest")
3. Click on a newly generated card
4. Close card (go back to Browse)
5. ❌ New cards no longer visible in expected position
6. Change sort to "Name (A-Z)" then back to "Date Modified - Newest"
7. ✅ Cards reappear

---

## 🔍 Bug Investigation Needed

### Bug 2: Browse List Order Issue

**Suspected Root Cause**: Cache/state desync when returning from Study mode

**Files to Investigate**:

1. **`frontend/app.js` - `switchMode()` function** (around line 4081)
   - Check if Browse mode re-renders list when switching back
   - Verify sort order is preserved

2. **`frontend/app.js` - `selectCard()` function** (around line 4240)
   - Check if clicking a card modifies state in a way that affects sort

3. **`frontend/app.js` - `loadCardsList()` function** (around line 4204)
   - Check sort logic
   - Verify `times_reviewed` or `updated_at` updates don't affect "newest" sort

4. **Database `updated_at` timestamp**
   - Viewing a card might update `times_reviewed` counter
   - This could update `updated_at` timestamp
   - New sort might put viewed card at top, pushing unviewed cards down

**Hypothesis**: 
When a card is viewed, `times_reviewed` increments, which triggers `updated_at` to change. The "Date Modified - Newest" sort then puts the just-viewed card at the top, pushing the other new (unviewed) card lower in the list. If the list is paginated or has a display limit, the other new card falls out of view.

---

## 🧪 Test Code Status

**Current State**: Test has all the right logic but was cancelled during execution.

**What the test does**:
1. ✅ Scans ALL 49 words (not just first 20)
2. ✅ Finds non-duplicates: `crat` and `photo`
3. ✅ Generates cards with 180-second timeout (3 minutes)
4. ⏸️ **Pauses with `page.pause()`** for manual inspection
5. ⏳ Was cancelled before verification steps

**Verification steps not yet executed**:
- Check audio buttons on both cards
- Verify cards clickable
- Confirm cache refresh

---

## 🎯 Next Steps

### 1. Complete Test Run
Run the full test to completion to gather complete data:
```powershell
pytest tests/test_batch_and_url_sharing.py::test_batch_generation_full_workflow -v --headed --slowmo=300 -s
```

### 2. Investigate Bug #2 (Browse List Order)

Let me search for the suspected issue in the code:

```javascript
// Check switchMode() function
// Check if viewing a card updates times_reviewed
// Check if updated_at changes
// Check loadCardsList() sort logic
```

### 3. Fix Audio Generation Issue (Bug #1)
- Check backend logs for "crat" audio generation
- Verify TTS API response
- Check if Greek root words need special handling

---

## 📝 User Observations

From user report:
- ✅ `photo` and `crat` were successfully added
- ❌ `crat` missing audio (shows "🔊 Generate Audio" button)
- ✅ Words visible in Browse list initially
- ❌ After opening card and closing, Browse list re-ordered incorrectly
- ✅ Workaround: Change sort order away and back fixes it

---

## 💡 Recommendations

1. **Fix Bug #2 First** (Browse order issue) - Affects UX immediately
2. **Investigate Bug #1** (Audio) - May be a one-off or systemic issue
3. **Add Test Assertions** for:
   - Audio button presence (not just "Generate Audio" button)
   - Browse list stability after card view
   - Sort order persistence

Would you like me to:
1. Investigate the browse list order bug in the code?
2. Run the test to completion to get full results?
3. Both?
