# Lessons Learned - Permanent Reference

## 🔐 Authentication & Deployment

### **Google Cloud Authentication with Passkey Accounts**
**Issue**: User's Google account uses passkey authentication (no password). When `gcloud` credentials expire and require reauth, the command `gcloud run deploy` gets stuck at password prompt:
```
Reauthentication required.
Please enter your password:
```

**Root Cause**: 
- `gcloud` tries to reauth with password prompt
- Passkey accounts don't have passwords
- Process hangs indefinitely waiting for keyboard input
- Ctrl+C shows: `KeyboardInterrupt` and `reauth is required` errors

**Solution**:
1. **Kill stuck process first**:
   ```powershell
   taskkill /F /IM gcloud.exe
   ```

2. **Re-authenticate with browser-based flow**:
   ```powershell
   gcloud auth login --no-launch-browser
   ```
   This provides a URL to open in browser where passkey authentication works properly.

3. **Copy verification code** from browser back to terminal

4. **Then deploy normally**:
   ```powershell
   gcloud run deploy super-flashcards --source . --region us-central1 --allow-unauthenticated
   ```

**Prevention**:
- Before deploying, check if credentials are fresh: `gcloud auth list`
- If account shows `ACTIVE` but deployment fails with reauth error, use browser auth flow
- Consider setting up Application Default Credentials for longer sessions

**Frequency**: This has recurred multiple times during development sprints.

**Impact**: Wastes 5-10 minutes per occurrence trying password-based auth before realizing passkey issue.

---

## 🧪 Testing & Quality Assurance

### **Cannot Test Deployed Applications in Browser**
**Issue**: AI assistant cannot:
- Open web browsers
- Click buttons in UI
- Simulate user interactions
- Verify deployed behavior
- Test runtime issues

**Impact**: Bugs that look correct in code are only caught when user tests:
- Sort order not applying (code looked correct, didn't work)
- Document parser URL mismatch (different endpoints)
- UUID delete bug (NaN check failed on UUIDs)
- Random card display after creation

**Solution**:
1. **User must test every deployment** before marking complete
2. **Agent should ask**: "Please test X, Y, Z after hard refresh"
3. **Create test checklists** (like BATCH_GREEK_TEST.md)
4. **Don't assume working code = working app**

**Future Improvement**: Add automated UI tests (Playwright/Cypress)

---

## 📦 Simple Word Lists vs Structured Documents

### **Document Parser Design Assumption**
**Issue**: Document parser (`document_parser.py`) was designed for **structured documents** with:
- Word/phrase
- Definition paragraph
- Etymology section
- Related words
- Example: French vocabulary with full explanations

**User's Real Use Case**: Simple word lists for AI generation:
```
poly mono micro macro mega tele arch crat auto dyn
anthropo bio psycho path derm neuro cardio geo
```

**What Broke**: Parser expected structure, got whitespace-separated words. Returned garbage: "undefined undefined%"

**Solution**: Added simple word list detection in v2.6.11:
```python
# If no structure keywords and >5 words, treat as simple list
if not any(keyword in file_content.lower() for keyword in ['étymologie', 'definition', 'origine', ':']):
    words = re.split(r'[,;\s]+', file_content)
    # Create minimal entries - AI fills in the rest
```

**Lesson**: Always clarify **input format** vs **output format**:
- Input: Can be minimal (just words)
- Output: Will be complete (AI-generated definitions, etymology, etc.)

Don't conflate the two!

---

## 🐛 ID Type Assumptions

### **Integer vs UUID IDs**
**Issue**: Code assumed numeric IDs when database uses UUIDs:
```javascript
if (id && !isNaN(id)) {  // ❌ Rejects UUIDs!
    await this.db.deleteFlashcard(parseInt(id));
}
```

**Impact**: Delete worked for old numeric IDs but failed silently on UUID cards.

**Solution**: Handle both types:
```javascript
if (id) {  // ✅ Works for numbers AND strings
    await this.db.deleteFlashcard(id);
}
```

**Lesson**: When migrating ID types (integer → UUID), audit ALL ID handling code, not just database schema.

---

## 🔄 State Synchronization

### **Cache Gets Out of Sync After Mutations**
**Issue**: Multiple occurrences where `state.flashcards` didn't match cache:
1. Creating new card → card not in array → findIndex fails → wrong card displayed
2. Loading app → cards loaded but not sorted → random order
3. Deleting card → cache updated but state not reloaded → stale UI

**Solution Pattern**: After ANY mutation, reload state from cache:
```javascript
await apiClient.createFlashcard(data);
await loadFlashcards();  // ✅ Reload to get fresh state
```

**Lesson**: Treat cache as source of truth. After write operations, always re-read.

---

## 🎯 Frontend/Backend URL Mismatches

### **Endpoint Registration vs Frontend Calls**
**Issue**: Backend registered at one path, frontend called different path:
- Backend: `app.include_router(document_parser.router, prefix="/api/document")`
- Endpoint: `@router.post("/parse")` 
- **Full path**: `/api/document/parse` ✅
- Frontend called: `/api/parser/parse-document` ❌

**Why It Happened**: Endpoint was moved/renamed but frontend not updated.

**Solution**: 
1. Document API endpoints clearly in backend code
2. Use constants for URLs in frontend: `const DOCUMENT_PARSE = '/api/document/parse'`
3. Test endpoints with curl/Postman before frontend integration

**Prevention**: Add API endpoint tests in backend test suite

---

## 📱 Hard Refresh Required After Deployment

### **Browser Caching vs New Code**
**Issue**: User tests new deployment but sees old version because browser cached:
- JavaScript files
- HTML with old version numbers
- Service worker

**Symptoms**:
- Version badge shows old version
- New features don't appear
- Fixed bugs still happen

**Solution**: **ALWAYS hard refresh** after deployment:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**User Education**: Include hard refresh step in all test instructions.

---

## 🗂️ Hamburger Menu Clutter

### **Unused Features in Production**
**Issue**: Hamburger menu shows features that aren't implemented or used:
- 🔄 Sync Now (automatic sync works)
- 📥 Import Cards (separate Import tab)
- ⚙️ Batch Operations (not used)
- ⚙️ Settings (not implemented)
- Debug features (should be dev-only)

**Impact**: Confuses users, makes UI cluttered.

**Solution**: Remove unused menu items, keep only:
- 📥 Import (if not redundant with tab)
- Or remove hamburger menu entirely if tabs cover everything

**Lesson**: Regularly audit UI for unused/incomplete features. Either implement or remove.

---

## 📊 Version Tracking Best Practices

### **Three-Location Version Synchronization**
**System**: Version must match in 3 places:
1. `window.APP_VERSION = 'X.Y.Z'` (index.html line 6)
2. `const APP_JS_VERSION = 'X.Y.Z'` (app.js line ~6)
3. `<span>vX.Y.Z</span>` (index.html badge line ~371)
4. `<script src="/app.js?v=X.Y.Z">` (index.html cache-busting line ~1394)

**Why**: Version check compares all three to detect stale cache.

**Lesson**: Create a version bump script to update all 4 locations atomically.

---

## 🚀 Deployment Checklist

**Before Every Deploy**:
1. ✅ Check gcloud auth status
2. ✅ Use `--no-launch-browser` if passkey account
3. ✅ Update version in ALL 4 locations
4. ✅ Git commit with version number in message
5. ✅ Git push to GitHub
6. ✅ Deploy to Cloud Run
7. ✅ Wait for "Service [super-flashcards] revision [XXX] deployed"
8. ✅ Tell user to hard refresh
9. ✅ Provide test checklist
10. ✅ Wait for user test results before next change

**Don't Skip Steps**: Each skipped step causes delays and confusion.

---

## 💡 Communication Patterns

### **Agent Limitations**
**Agent CAN**:
- ✅ Read and analyze code
- ✅ Find bugs by comparing frontend/backend
- ✅ Make code changes
- ✅ Run terminal commands
- ✅ Deploy to production

**Agent CANNOT**:
- ❌ Test in browser
- ❌ Click buttons
- ❌ See runtime behavior
- ❌ Verify UI changes

**Communication Pattern**:
1. Agent makes changes
2. Agent deploys
3. Agent provides **specific test steps**
4. User tests and reports results
5. Agent fixes based on feedback
6. Repeat

**Don't assume**: "Code looks right" ≠ "Feature works"

---

*This document should be reviewed and updated after each sprint to capture new patterns and pitfalls.*

*Last Updated: October 27, 2025*
