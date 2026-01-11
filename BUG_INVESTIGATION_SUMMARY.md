# 🐛 Bug Investigation Summary

**Date**: October 29, 2025  
**Test**: `test_batch_generation_full_workflow`  
**Environment**: Production (`https://learn.rentyourcio.com`)

---

## ✅ Bug #2: Browse List Order Changes - **FIXED**

### Issue
After viewing a card in Study mode and returning to Browse mode, the list re-orders and new cards disappear from view.

### Root Cause
`switchMode('browse')` was calling `loadCardsList()` which doesn't apply sort order, instead of `renderFlashcardList()` which does.

### Fix Applied
**File**: `frontend/app.js`  
**Line**: ~4177  
**Change**:
```javascript
// BEFORE:
loadCardsList();

// AFTER:
renderFlashcardList();  // ✅ Now respects sort order
```

### Verification Needed
1. Generate new batch cards
2. View in Browse mode (sorted by "Date Modified - Newest")
3. Click on a new card
4. Return to Browse mode
5. ✅ Verify new cards remain at top of list

---

## ⚠️ Bug #1: Missing Audio for "crat" - **INVESTIGATION FINDINGS**

### Issue
User reported "crat" card shows "🔊 Generate Audio" button instead of audio file after batch generation.

### Investigation Results

#### 1. Backend Database Check
- **Local database query**: "crat" card NOT FOUND
- **Last cards**: Portuguese words from October 16, 2025
- **Greek cards**: 10 cards exist, ALL have audio successfully generated
- **Conclusion**: Test ran against **PRODUCTION** environment, not local database

#### 2. Audio Generation Flow Analysis

**Batch Generation** (`batch_ai_generate.py`):
```python
# Line 50 comment: "Note: Audio generation happens asynchronously after card creation"
# ❌ NO CODE actually triggers audio generation in batch endpoint
```

**Frontend Triggers Audio** (`app.js` line 3569):
```javascript
if (result.successful > 0 && result.flashcard_ids.length > 0) {
    triggerBatchAudioGeneration(result.flashcard_ids);  // ✅ This IS called
}
```

**Audio Generation Function** (`app.js` line 3828-3860):
```javascript
async function triggerBatchAudioGeneration(flashcardIds) {
    flashcardIds.forEach(async (flashcardId) => {
        const response = await fetch(`/api/audio/generate/${flashcardId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            console.log(`🎵 ✅ Audio generated for flashcard ${flashcardId}`);
        } else {
            console.warn(`🎵 ⚠️ Audio generation failed: ${response.status}`);
        }
    });
}
```

**Audio Generation API** (`routers/audio.py` line 21):
- Fetches flashcard from database
- Gets language for voice selection
- Calls `service_registry.audio_service.generate_word_audio()`
- Updates `audio_url` and `audio_generated_at` fields
- Returns success/failure response

#### 3. Why Audio Might Be Missing

**Possible Causes:**

1. **Network Timeout/Failure**:
   - Audio API call from frontend may have failed silently
   - `forEach()` with async doesn't await or catch errors properly
   - Console would show: `🎵 ⚠️ Audio generation failed: 504` (or similar)

2. **API Rate Limiting**:
   - Generating 2 audio files simultaneously might hit OpenAI rate limits
   - One succeeds, one fails
   - This matches user report: "photo" has audio, "crat" doesn't

3. **TTS Service Error**:
   - Greek root word "crat" might not be pronounceable
   - Service returns error but frontend doesn't display it
   - Database doesn't get updated with `audio_url`

4. **Database Transaction Issue**:
   - Audio generated successfully
   - Database commit fails
   - `audio_url` remains NULL
   - File exists in `/audio/` but not linked to card

#### 4. Code Quality Issues Found

**Problem**: `forEach()` with `async` doesn't properly handle errors or track completion:
```javascript
// CURRENT CODE (Lines 3843-3858):
flashcardIds.forEach(async (flashcardId) => {  // ❌ forEach doesn't await
    try {
        const response = await fetch(`/api/audio/generate/${flashcardId}`);
        // ...
    } catch (error) {
        console.error(`🎵 ❌ Error:`, error);  // ❌ Just logs, no retry
    }
});
```

**Recommended Fix**:
```javascript
// BETTER APPROACH:
const results = await Promise.allSettled(
    flashcardIds.map(flashcardId => 
        fetch(`/api/audio/generate/${flashcardId}`, { method: 'POST' })
            .then(res => res.json())
    )
);

const failed = results.filter(r => r.status === 'rejected' || !r.value.success);
if (failed.length > 0) {
    showToast(`⚠️ Audio generation failed for ${failed.length} card(s). Click to retry.`, 10000);
}
```

---

## 📋 Next Steps

### Immediate Actions

1. **Re-run Test Locally**:
   ```bash
   # Start local backend first
   cd backend
   uvicorn app.main:app --reload
   
   # Then run test against localhost
   pytest tests/test_batch_and_url_sharing.py::test_batch_generation_full_workflow -v
   ```

2. **Check Production Logs**:
   - Look for audio generation errors in production logs
   - Check for specific error for "crat" card
   - Verify if API call was made and what response was returned

3. **Manual Verification**:
   - Open browser DevTools Network tab
   - Click "🔊 Generate Audio" button on "crat" card
   - Capture API request/response
   - Check if error is in response JSON

### Code Improvements

1. **Fix Audio Generation Error Handling**:
   ```javascript
   // frontend/app.js - Line 3828
   async function triggerBatchAudioGeneration(flashcardIds) {
       const results = await Promise.allSettled(
           flashcardIds.map(async (flashcardId) => {
               const response = await fetch(`/api/audio/generate/${flashcardId}`, {
                   method: 'POST'
               });
               const data = await response.json();
               return { flashcardId, success: response.ok, data };
           })
       );
       
       const failed = results.filter(r => 
           r.status === 'rejected' || !r.value.success
       );
       
       if (failed.length > 0) {
           const failedIds = failed.map(f => 
               f.status === 'rejected' ? 'unknown' : f.value.flashcardId
           );
           
           showToast(
               `⚠️ Audio generation failed for ${failed.length} card(s). ` +
               `Check cards and retry manually.`,
               10000
           );
           
           console.error('Failed audio generations:', failedIds);
       }
   }
   ```

2. **Add Retry Button**:
   - When audio generation fails, show retry button
   - Store failed IDs in state
   - Allow user to retry batch audio generation

3. **Add Progress Indicator**:
   - Show "Generating audio 1/2..." progress
   - Update as each audio completes
   - Makes failures more visible

### Testing Checklist

- [ ] Run test against local environment
- [ ] Verify both cards created in local database
- [ ] Check DevTools console for audio generation logs
- [ ] Verify both audio files generated successfully
- [ ] Check `/audio/` directory for audio files
- [ ] Query database for `audio_url` values
- [ ] Test manual audio generation button
- [ ] Verify audio plays correctly

---

## 🎯 Summary

### Bug #2 (Browse Order): **FIXED ✅**
- Simple one-line fix applied
- Changed `loadCardsList()` to `renderFlashcardList()` in `switchMode()`
- Ready for testing

### Bug #1 (Missing Audio): **NEEDS PRODUCTION DATA 📊**
- Can't reproduce locally (test ran against production)
- Likely cause: Network failure, rate limiting, or silent API error
- Recommended: Improve error handling and retry logic
- Need to check production logs or re-run test to see actual error

### Test Environment Note ⚠️
The Playwright test is configured to run against:
```python
BASE_URL = "https://learn.rentyourcio.com"  # PRODUCTION
```

To test locally, change to:
```python
BASE_URL = "http://localhost:8000"  # LOCAL
```
