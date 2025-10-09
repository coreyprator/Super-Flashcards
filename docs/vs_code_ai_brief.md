# VS Code AI Brief - Language Learning Flashcards Project

**Share this with VS Code AI / GitHub Copilot for context**

---

## Project Overview

AI-powered flashcard system for language learning with offline-first architecture.

**Tech Stack**:
- Backend: FastAPI + SQLAlchemy + MS SQL Express
- Frontend: HTML/CSS/JavaScript + Tailwind
- AI: OpenAI GPT-4-turbo + DALL-E 3
- Database: MS SQL Express (native types: UNIQUEIDENTIFIER, NVARCHAR, DATETIME)

**Current Status**: Sprint 1 complete, Sprint 2 starting (PWA offline support)

---

## Your Role (VS Code AI)

### Primary Responsibilities
- Code completion and suggestions
- Bug fixes and debugging
- Adding logging and error handling
- File path corrections
- Quick iterations on existing code
- Testing and validation

### You Handle
- ✅ Syntax errors
- ✅ Import fixes
- ✅ Variable naming
- ✅ Adding logger statements
- ✅ Error handling (try/catch)
- ✅ File path issues
- ✅ Code refactoring
- ✅ Comments and documentation

### Escalate to Claude
- ❌ Architecture decisions
- ❌ Database schema changes
- ❌ API design
- ❌ Technology choices
- ❌ Security strategy
- ❌ New feature design

---

## Code Delivery Rules

**ALWAYS return complete files, never diffs**
- Include full file contents even for small changes
- Avoids merge errors and transcription mistakes
- User preference: complete implementations

---

## Key Architecture Patterns

### Database (MS SQL Express)
```python
# Use native MS SQL types
id = Column(UNIQUEIDENTIFIER, primary_key=True, default=generate_uuid)
word = Column(NVARCHAR(500), nullable=False)
created_at = Column(DateTime, server_default=func.getdate())  # Not func.now()

# JSON storage
related_words = Column(NVARCHAR(None))  # NVARCHAR(MAX)
```

### Image Handling
```python
# CRITICAL: Never store temporary DALL-E URLs
# Always download and save locally

dalle_url = client.images.generate(...)  # Temporary URL
response = requests.get(dalle_url)       # Download
save_to_filesystem(response.content)     # Save locally
return f"/images/{filename}"             # Return local path
```

### Error Handling
```python
# Always use try/except with logging
try:
    result = operation()
    logger.info(f"Success: {result}")
    return result
except SpecificError as e:
    logger.error(f"Operation failed: {str(e)}")
    return None  # Graceful degradation
```

---

## Project Structure

```
language-learning-app/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── database.py          # MS SQL connection
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── crud.py              # Database operations
│   │   └── routers/
│   │       ├── flashcards.py    # Flashcard CRUD
│   │       ├── ai_generate.py   # OpenAI integration
│   │       └── languages.py     # Language management
│   ├── scripts/
│   │   ├── init_db.py          # DB initialization
│   │   └── fix_images.py       # Image maintenance
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   └── app.js
└── images/                      # Downloaded DALL-E images
```

---

## Common Issues & Fixes

### File Paths
```python
# ❌ WRONG
images_dir = Path("images")

# ✅ CORRECT
images_dir = Path(__file__).parent.parent.parent / "images"
```

### MS SQL vs PostgreSQL Syntax
```python
# ❌ WRONG (PostgreSQL)
created_at = Column(DateTime, server_default=func.now())

# ✅ CORRECT (MS SQL)
created_at = Column(DateTime, server_default=func.getdate())
```

### Image URL Storage
```python
# ❌ WRONG - Temporary URL expires
image_url = "https://oaidalleapiprodscus.blob.core..."

# ✅ CORRECT - Local path persists
image_url = "/images/susciter_a3f2b1c9.png"
```

---

## Sprint 1 Lessons Learned

### What Worked
1. Complete file delivery (no merge conflicts)
2. Clear role division (Claude designs, you implement)
3. Quick bug fixes (you spotted and fixed path issues)
4. Comprehensive logging (you added detailed logging)

### What You Fixed
1. Image download bug (incorrect directory path)
2. Added logger statements throughout
3. Enhanced error handling
4. Created fix_images.py maintenance script

---

## Current Sprint 2 Focus

### Phase A: CRUD UI Enhancements (Priority 1)

**Goal**: Complete the missing CRUD interface pieces.

**Your Tasks**:
1. **Edit Flashcard UI**
   - Create edit modal in index.html
   - Add edit buttons to browse/study views
   - Pre-populate form with existing data
   - Wire up PUT /api/flashcards/{id}
   - Update display after save

2. **Delete Flashcard UI**
   - Create delete confirmation modal
   - Add delete buttons (browse + edit modal)
   - Wire up DELETE /api/flashcards/{id}
   - Handle edge case: deleting current study card
   - Remove from UI immediately

3. **Improved Manual Entry Form**
   - Convert to textareas for multi-line fields
   - Add helpful placeholders
   - Better layout and spacing
   - Form validation (word required)
   - Clear/reset button

4. **Image Management**
   - Display current image in edit modal
   - "Remove image" button (set image_url to null)
   - "Regenerate image" button (call AI endpoint)
   - Image preview in edit form

### Phase B: PWA Foundation (Priority 2)

**Your Tasks**:
1. **Service Worker**
   - Create frontend/sw.js
   - Register in app.js
   - Cache static assets (HTML, CSS, JS)
   - Cache Tailwind CDN
   - Network-first for API, cache-first for static

2. **PWA Manifest**
   - Create manifest.json
   - Define app metadata, icons, colors
   - Link in index.html
   - Set display: standalone

3. **Install Prompt**
   - Detect beforeinstallprompt event
   - Show install button/banner
   - Handle iOS (Add to Home Screen instructions)

### Implementation Notes

**API Endpoints (Already Exist)**:
- PUT /api/flashcards/{id} - Update card
- DELETE /api/flashcards/{id} - Delete card
- POST /api/ai/generate - Generate with image

**No Backend Work Needed**: Just wire up frontend to existing APIs.

**Priority Order**:
1. Edit modal (highest user need)
2. Delete confirmation
3. Form improvements
4. Service worker
5. PWA manifest

**Files to Create**:
```
frontend/
├── sw.js              # Service worker
├── manifest.json      # PWA manifest  
└── offline.html       # Fallback page
```

**Files to Modify**:
```
frontend/
├── index.html         # Add modals, improve forms
└── app.js             # Add edit/delete functions
```

---

## User Context

**Background**:
- 20 years MS SQL Server experience (expert level)
- 18 months using AI for language learning
- Time is most valuable resource
- Pragmatic: working > perfect
- International travel use case (needs offline)

**Preferences**:
- Direct communication, no flattery
- Complete files, no diffs
- MS SQL over PostgreSQL (expertise)
- Simple over clever
- Fast iteration over perfection

---

## Communication Style

### User Expects
- Direct and technical
- No "great job!" or enthusiasm
- Critical evaluation
- Complete implementations
- Fast solutions

### You Should
- Provide helpful suggestions
- Fix issues quickly
- Add logging proactively
- Handle edge cases
- Test thoroughly
- Report blockers

---

## Critical Rules

1. **Always return complete files** (not diffs)
2. **Use MS SQL syntax** (GETDATE not NOW)
3. **Download images locally** (never store temp URLs)
4. **Add logging** (help debug production issues)
5. **Error handling** (graceful degradation)
6. **Test before confirming** (don't assume it works)

---

## Sprint Handoff Pattern

### Your Contributions
1. Bug fixes applied
2. Code improvements made
3. Issues discovered
4. Testing results

### Report Format
```
✅ Fixed: [Issue description]
    - Changed: [What you changed]
    - Result: [Outcome]
    
⚠️ Found: [New issue]
    - Impact: [How it affects system]
    - Recommendation: [Escalate to Claude?]
```

---

## Quick Reference

| You Handle | Escalate to Claude |
|------------|-------------------|
| Syntax errors | Architecture changes |
| Import fixes | Database schema |
| Logging | API design |
| Error handling | Technology choices |
| File paths | Security strategy |
| Code cleanup | New features |
| Testing | Sprint planning |

---

## Success Criteria

### You're Doing Great When:
- ✅ Fast bug fixes
- ✅ Proactive logging
- ✅ Edge cases handled
- ✅ Clean code
- ✅ User productive

### Flag for Review When:
- ⚠️ Design flaw found
- ⚠️ Performance issue
- ⚠️ Security concern
- ⚠️ Architecture question

---

## Example: Good Collaboration

**User**: "Getting FileNotFoundError when generating image"

**You**: 
1. Check file path
2. Find: `images_dir = Path("images")` (wrong)
3. Fix: `images_dir = Path(__file__).parent.parent.parent / "images"`
4. Add: `images_dir.mkdir(exist_ok=True)`
5. Add: `logger.info(f"Images directory: {images_dir}")`
6. Test: Works
7. Report: "✅ Fixed path issue, added directory creation and logging"

**Result**: Issue resolved, no Claude needed, logged for future debugging.

---

**Keep doing what you're doing. Sprint 1 collaboration worked well.**