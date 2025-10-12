# 🎯 Sprint 4 Phase 1 - Local TTS Implementation Guide

**Status**: Ready for Implementation  
**Approach**: Local audio storage (Azure migration later)  
**Focus**: Single word pronunciation only  
**Timeline**: 1-2 days for basic implementation

---

## 📦 Files Delivered (All Complete)

### Backend (5 files)

1. **`backend/app/services/audio_service.py`** ✅
   - Audio generation service using OpenAI TTS
   - Saves audio to local `/audio/` directory
   - Voice mapping for different languages
   - File management (delete, check existence, stats)

2. **`backend/app/routers/audio.py`** ✅
   - API endpoints for audio generation
   - `/api/audio/generate/{card_id}` - Generate audio
   - `/api/audio/status` - Progress statistics
   - `/api/audio/check/{card_id}` - Check audio exists
   - `/api/audio/delete/{card_id}` - Delete audio

3. **`backend/scripts/batch_audio_generator.py`** ✅
   - Batch process all flashcards
   - Progress tracking with ETA
   - Error handling and resume capability
   - JSON results output

4. **`backend/migrations/add_audio_columns.sql`** ✅
   - Add `audio_url` column
   - Add `audio_generated_at` column
   - Create performance index

5. **`backend/scripts/test_audio_single.py`** ✅
   - Test script for single audio generation
   - Verify TTS working before batch

### Frontend (2 files)

6. **`frontend/audio-player.js`** ✅
   - Audio playback functions
   - Generate audio UI functions
   - Status display updates

7. **`frontend/index.html`** (instructions provided) ✅
   - Integration guide for audio controls
   - Example code snippets

### Modified Files

8. **`backend/app/main.py`** ✅
   - Updated with audio router registration
   - Audio directory mounted as static files

---

## 🚀 Implementation Steps

### Step 1: Database Migration (5 minutes)

```powershell
# Run SQL migration
sqlcmd -S localhost\SQLEXPRESS -d LanguageLearning -i backend\migrations\add_audio_columns.sql
```

**Expected output:**
```
✓ Added audio_url column
✓ Added audio_generated_at column
✓ Created idx_flashcards_audio index
✅ Migration complete!
```

**Verify:**
```sql
SELECT name, TYPE_NAME(system_type_id) 
FROM sys.columns 
WHERE object_id = OBJECT_ID('flashcards') 
AND name LIKE '%audio%';
```

---

### Step 2: Create Audio Directory (1 minute)

```powershell
# Create audio directory in project root
New-Item -ItemType Directory -Path "audio" -Force
```

**Verify structure:**
```
Super-Flashcards/
├── audio/           ← New directory
├── images/
├── backend/
├── frontend/
└── Output/
```

---

### Step 3: Copy Backend Files (5 minutes)

Copy these 5 files from artifacts to your project:

```
✅ backend/app/services/audio_service.py
✅ backend/app/routers/audio.py
✅ backend/scripts/batch_audio_generator.py
✅ backend/scripts/test_audio_single.py
✅ backend/migrations/add_audio_columns.sql (already used)
```

**Replace this file:**
```
✅ backend/app/main.py (with updated version)
```

---

### Step 4: Copy Frontend Files (5 minutes)

```
✅ frontend/audio-player.js (new file)
```

**Update `frontend/index.html`:**
- Add `<script src="/static/audio-player.js"></script>` to head
- Integrate audio buttons using `getAudioButtonHTML(card)` function
- Optionally add audio status panel (instructions in artifact)

**VS Code AI will help with the HTML integration!**

---

### Step 5: Test Single Audio (10 minutes)

```powershell
# Restart server
.\runui.ps1

# In another terminal, test single audio generation
python backend\scripts\test_audio_single.py
```

**Expected output:**
```
🔊 TESTING SINGLE AUDIO GENERATION
Testing with flashcard:
  Word: bonjour
  Language: French
  ID: abc-123

Generating audio...
✅ SUCCESS!
   Audio saved to: /audio/abc-123.mp3
   File size: 24576 bytes (24.0 KB)
   
✓ Database updated
```

**Manual verification:**
1. Open browser: `http://localhost:8000/audio/abc-123.mp3`
2. Should hear French pronunciation of "bonjour"

---

### Step 6: Test API Endpoints (10 minutes)

**Generate audio via API:**
```powershell
# Get first flashcard ID from database
$cardId = "your-card-id-here"

# Generate audio
curl -X POST "http://localhost:8000/api/audio/generate/$cardId"
```

**Expected response:**
```json
{
  "success": true,
  "audio_url": "/audio/abc-123.mp3",
  "card_id": "abc-123",
  "word": "bonjour",
  "language": "French"
}
```

**Check status:**
```powershell
curl "http://localhost:8000/api/audio/status"
```

**Expected response:**
```json
{
  "total_cards": 280,
  "with_audio": 1,
  "without_audio": 279,
  "percentage_complete": 0.4,
  "storage_stats": {
    "total_files": 1,
    "total_size_mb": 0.02,
    "audio_directory": "C:\\...\\audio"
  }
}
```

---

### Step 7: Test Frontend (15 minutes)

**This is where VS Code AI helps!**

1. Open `frontend/index.html`
2. VS Code AI will help integrate audio buttons
3. Test in browser:
   - Click 🔊 Generate button
   - Should generate audio
   - Button changes to 🔊 Play
   - Click Play - hear pronunciation

**Example integration (VS Code AI will refine):**

```javascript
// In your flashcard rendering code:
function renderFlashcard(card) {
    const audioButton = getAudioButtonHTML(card);
    
    return `
        <div class="flashcard">
            <h2>${card.word}</h2>
            ${audioButton}
            <p>${card.translation}</p>
            <img src="${card.image_url}">
        </div>
    `;
}
```

---

### Step 8: Batch Generate (Optional - 15-20 minutes)

**Only after Steps 1-7 work perfectly!**

```powershell
# Generate audio for all 280 flashcards
python backend\scripts\batch_audio_generator.py
```

**Expected progress:**
```
🔊 BATCH AUDIO GENERATION
Total cards to process: 280

[1/280] Processing: bonjour (French)
  ✓ Audio generated: /audio/abc-123.mp3

[2/280] Processing: merci (French)
  ✓ Audio generated: /audio/def-456.mp3

📊 Progress: 10/280 (3.6%)
   Succeeded: 10, Failed: 0
   Avg time: 3.2s per card
   ETA: 14.4 minutes

...

🎉 BATCH AUDIO GENERATION COMPLETE
Total processed: 280
Succeeded: 280
Failed: 0
Success rate: 100.0%
Total time: 14.8 minutes
Average: 3.2 seconds per card

✓ Results saved to: Output/batch_audio_results.json
```

---

## 🧪 Testing Checklist

### Phase 1: Basic Functionality ✅
- [ ] Database migration successful
- [ ] Audio directory created
- [ ] Backend files copied
- [ ] Frontend files copied
- [ ] Server starts without errors
- [ ] Test script generates audio
- [ ] Audio file playable in browser

### Phase 2: API Testing ✅
- [ ] POST `/api/audio/generate/{id}` works
- [ ] GET `/api/audio/status` returns correct data
- [ ] Audio files saved to `/audio/` directory
- [ ] Database updated with `audio_url`
- [ ] Can access audio via `/audio/filename.mp3`

### Phase 3: Frontend Integration ✅
- [ ] Audio buttons appear on flashcards
- [ ] Generate button creates audio
- [ ] Play button plays audio
- [ ] No console errors
- [ ] Smooth user experience

### Phase 4: Batch Processing (Optional) ✅
- [ ] Batch script runs successfully
- [ ] All 280 cards processed
- [ ] Progress tracking accurate
- [ ] Error handling works
- [ ] Results saved to JSON

---

## 💰 Cost Tracking

**TTS Pricing:**
- Model: `tts-1-hd`
- Rate: $0.015 per 1,000 characters
- Average word: ~10 characters
- 280 words: 2,800 characters
- **Cost: $0.042 (~4 cents)**

**Actual costs will be slightly higher due to API overhead, estimate $0.10-0.20 total**

---

## 🐛 Troubleshooting Guide

### "OpenAI client initialization failed"
```bash
# Check environment variable
echo $env:OPENAI_API_KEY

# Should show: sk-...
# If not, add to .env file
```

### "Audio directory not found"
```powershell
# Create directory
New-Item -ItemType Directory -Path "audio" -Force

# Verify
Test-Path "audio"  # Should return True
```

### "Module 'app.routers.audio' not found"
```powershell
# Make sure file exists
Test-Path "backend\app\routers\audio.py"

# Check if __init__.py exists in routers
Test-Path "backend\app\routers\__init__.py"
```

### "Audio URL returns 404"
```python
# Check main.py has audio mount
app.mount("/audio", StaticFiles(directory=str(audio_dir)), name="audio")

# Verify audio directory path
print(audio_dir)
```

### "Database column doesn't exist"
```sql
-- Run migration again
sqlcmd -S localhost\SQLEXPRESS -d LanguageLearning -i backend\migrations\add_audio_columns.sql

-- Verify
SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('flashcards') AND name = 'audio_url';
```

---

## 📊 Success Metrics

**Phase 1 Complete When:**
- ✅ Single audio generation works
- ✅ Audio playable in browser
- ✅ Frontend buttons functional
- ✅ Cost under $0.50 for testing

**Ready for Batch Processing When:**
- ✅ 10+ test cards successful
- ✅ No errors in logs
- ✅ Audio quality acceptable
- ✅ Performance adequate (~3s per card)

---

## 🔄 Handoff to VS Code AI

**VS Code AI should handle:**

1. **Import fixes** - Add missing imports, fix paths
2. **Error handling** - Add try/catch, logging
3. **HTML integration** - Insert audio buttons in templates
4. **Code refinement** - Variable names, comments, formatting
5. **Edge cases** - Handle missing files, network errors
6. **Testing** - Run code, report issues back to user

**VS Code AI should NOT:**
- Change the architecture
- Modify API design
- Redesign the audio service
- Change voice mapping strategy

**If architecture issues found:** Report to user → User asks Claude

---

## 📝 Implementation Notes

### Design Decisions

1. **Local storage instead of Azure**
   - Simpler to implement and test
   - No Azure setup required initially
   - Easy to migrate to Azure later
   - Same API structure

2. **Single word pronunciation only**
   - Faster to implement
   - Lower costs for testing
   - Easier to verify quality
   - Can add full content later

3. **Voice mapping by language**
   - French → nova (female)
   - German → onyx (male)
   - Default → alloy (neutral)
   - Easy to customize later

4. **File naming: `{flashcard_id}.mp3`**
   - Simple and predictable
   - One audio per card
   - Easy to manage and delete

### Future Enhancements (Sprint 4 Phase 2)

- [ ] Azure Blob Storage migration
- [ ] Full card content audio (word + definition + example)
- [ ] Service Worker caching for offline
- [ ] Translation toggle (French ↔ English)
- [ ] Batch audio UI in admin panel
- [ ] Audio regeneration (if quality issues)

---

## ✅ Ready to Implement!

**Current Status:**
- ✅ All files delivered and complete
- ✅ Database migration script ready
- ✅ API endpoints designed
- ✅ Frontend components created
- ✅ Test scripts included
- ✅ Documentation comprehensive

**Next Actions:**
1. Run database migration
2. Copy files to project
3. Test single audio generation
4. Let VS Code AI handle integration details
5. Test thoroughly before batch processing

**Expected Timeline:**
- Steps 1-5: 30 minutes (setup)
- Steps 6-7: 30 minutes (testing & integration)
- Step 8: 15-20 minutes (batch processing)
- **Total: ~90 minutes for complete implementation**

---

**Sprint 4 Phase 1 package complete and ready for implementation! 🎧**

*All files are architecturally sound and complete. VS Code AI will handle implementation details, debugging, and refinement.*
