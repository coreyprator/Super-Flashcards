# ✅ Sprint 4 Phase 1 - Quick Start Checklist

**Print this and check off items as you go!**

---

## 🗂️ Pre-Implementation (5 minutes)

- [ ] Review implementation guide artifact
- [ ] Ensure server is stopped (`Ctrl+C` if running)
- [ ] OpenAI API key in `.env` file
- [ ] Backup current working code (optional but recommended)

---

## 📦 Step 1: Database Setup (5 minutes)

- [ ] Open PowerShell in project root
- [ ] Run migration:
  ```powershell
  sqlcmd -S localhost\SQLEXPRESS -d LanguageLearning -i backend\migrations\add_audio_columns.sql
  ```
- [ ] Verify "✓ Migration complete!" message
- [ ] Create audio directory:
  ```powershell
  New-Item -ItemType Directory -Path "audio" -Force
  ```

---

## 📁 Step 2: Copy Backend Files (10 minutes)

### New Files (copy from artifacts):
- [ ] `backend/app/services/audio_service.py`
- [ ] `backend/app/routers/audio.py`
- [ ] `backend/scripts/batch_audio_generator.py`
- [ ] `backend/scripts/test_audio_single.py`

### Update Existing:
- [ ] Replace `backend/app/main.py` with updated version

### Verify:
- [ ] All 5 files exist
- [ ] No syntax errors visible in VS Code

---

## 🎨 Step 3: Copy Frontend Files (10 minutes)

### New Files:
- [ ] `frontend/audio-player.js`

### Update `frontend/index.html`:
- [ ] Add script tag: `<script src="/static/audio-player.js"></script>`
- [ ] **Let VS Code AI help integrate audio buttons!**

---

## 🧪 Step 4: Test Single Audio (15 minutes)

- [ ] Start server: `.\runui.ps1`
- [ ] Open new PowerShell terminal
- [ ] Run test: `python backend\scripts\test_audio_single.py`
- [ ] See "✅ SUCCESS!" message
- [ ] Check audio file created in `/audio/` directory
- [ ] Test in browser: `http://localhost:8000/audio/{filename}.mp3`
- [ ] Hear pronunciation

**If any step fails → Ask VS Code AI to debug!**

---

## 🔌 Step 5: Test API (10 minutes)

- [ ] Get status:
  ```powershell
  curl "http://localhost:8000/api/audio/status"
  ```
- [ ] Should show: `"with_audio": 1, "total_cards": 280`

- [ ] Open browser: `http://localhost:8000`
- [ ] App loads without errors
- [ ] Check browser console (F12) - no red errors

---

## 🎮 Step 6: Frontend Testing (20 minutes)

### With VS Code AI Help:
- [ ] Audio buttons appear on flashcards
- [ ] Click "🔊 Generate" button
- [ ] Button changes to "⏳ Generating..."
- [ ] Page reloads automatically
- [ ] Button now shows "🔊 Play"
- [ ] Click "🔊 Play"
- [ ] Hear pronunciation
- [ ] No console errors

**If integration issues → VS Code AI will fix!**

---

## 🚀 Step 7: Batch Processing (Optional, 20 minutes)

**Only after Steps 1-6 are perfect!**

- [ ] Run batch script:
  ```powershell
  python backend\scripts\batch_audio_generator.py
  ```
- [ ] Watch progress updates
- [ ] Wait for completion (~15-20 minutes)
- [ ] Check results: `Output/batch_audio_results.json`
- [ ] Verify: "succeeded": 280 (or close to it)
- [ ] Check OpenAI usage/costs

---

## ✅ Verification Checklist

### Database:
- [ ] `audio_url` column exists
- [ ] Some cards have audio URLs
- [ ] `audio_generated_at` timestamps set

### Files:
- [ ] `/audio/` directory has `.mp3` files
- [ ] File count matches database count
- [ ] Files are 15-30 KB each (reasonable)

### API:
- [ ] Status endpoint works
- [ ] Generate endpoint works
- [ ] Check endpoint works
- [ ] No 500 errors in logs

### Frontend:
- [ ] Audio buttons visible
- [ ] Generate function works
- [ ] Play function works
- [ ] Audio quality good

---

## 🐛 Quick Troubleshooting

### Server won't start:
```powershell
# Check for import errors
python -c "from app.routers import audio"
# Ask VS Code AI to fix imports
```

### Audio won't generate:
```powershell
# Check OpenAI key
python -c "from openai import OpenAI; print('OK')"
# Verify .env has OPENAI_API_KEY
```

### Frontend button missing:
```html
<!-- Check audio-player.js loaded -->
<!-- Open browser console: -->
<!-- Should see: "🔊 Audio player loaded" -->
```

### Files not found:
```powershell
# Verify directory structure
Get-ChildItem -Recurse -Filter "audio*"
```

---

## 📊 Success Criteria

**Phase 1 Complete:**
- ✅ Can generate audio for one word
- ✅ Can play audio in browser
- ✅ Frontend buttons work
- ✅ Database updates correctly
- ✅ Cost < $0.50

**Ready for Phase 2:**
- ✅ 10+ successful tests
- ✅ No errors in logs
- ✅ Audio quality acceptable
- ✅ Performance good (~3s per word)

---

## 🎯 What to Do Next

### If Everything Works:
1. Run batch processing for all cards
2. Document any issues
3. Test offline caching (Sprint 4 Phase 2)
4. Plan Azure migration (Sprint 4 Phase 2)

### If Issues Found:
1. VS Code AI fixes implementation details
2. Report architecture issues to Claude
3. Test fixes thoroughly
4. Document workarounds

---

## 💡 Tips for Success

1. **Test incrementally** - Don't skip steps
2. **Use VS Code AI** - Let it handle syntax/imports
3. **Check logs** - Look for errors after each step
4. **Ask for help** - Claude for architecture, VS Code AI for code
5. **Document** - Note any issues or workarounds

---

## 📞 When to Ask Who

### Ask VS Code AI:
- Syntax errors
- Import issues
- File paths wrong
- HTML integration
- Code formatting
- Variable names
- Error handling

### Ask Claude:
- Architecture questions
- API design changes
- Database schema issues
- Performance problems
- New features
- Alternative approaches

---

## 🎉 You're Ready!

**Total Time: ~90 minutes**
- Setup: 30 min
- Testing: 30 min
- Integration: 30 min

**After completion:**
- You'll have working TTS
- ~280 audio files
- Cost: < $0.50
- Ready for Phase 2!

---

**Start with Step 1 and check off items as you go. Good luck! 🚀**

*Remember: Claude designed it, VS Code AI implements it, you verify it works!*
