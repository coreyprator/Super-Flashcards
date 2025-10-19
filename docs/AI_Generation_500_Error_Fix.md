# AI Generation 500 Error - Debugging Journey

## Problem
AI flashcard generation endpoint (`/api/ai/generate`) was returning 500 Internal Server Error in production (Cloud Run).

## Timeline of Investigation

### Revision 00017-00020: Initial Attempts
- **Symptom**: 500 errors with minimal logging
- **Suspected causes**: 
  - Missing database tables (`users`, `user_languages`)
  - OpenAI API key configuration
- **Actions taken**:
  - Implemented dummy user_id workarounds
  - Fixed crud.py to handle missing tables gracefully
  - All still resulted in 500 errors

### Revision 00021: Added Verbose Logging
- **Goal**: Surface detailed error messages
- **Implementation**: Added comprehensive logging throughout `ai_generate.py`
  - 🔍 VERBOSE markers for debugging
  - Full exception stack traces
  - Step-by-step operation logging
- **Result**: Still 500 errors, but now with better visibility

### Revision 00022: Updated OpenAI Library
- **Suspected cause**: `TypeError: Client.__init__() got an unexpected keyword argument 'proxies'`
- **Action**: Updated `openai==1.3.5` to `openai==1.54.0`
- **Result**: Same error persisted

### Revision 00023: Explicit httpx Client
- **Theory**: OpenAI library's auto-configuration was passing invalid parameters to httpx
- **Action**: Created explicit `httpx.Client()` with known-good parameters
  ```python
  http_client = httpx.Client(
      timeout=httpx.Timeout(60.0, connect=10.0),
      limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
  )
  client = OpenAI(api_key=api_key, http_client=http_client)
  ```
- **Result**: ✅ **REVEALED THE REAL ERROR!**
  ```
  httpx.LocalProtocolError: Illegal header value b'Bearer sk-proj-s3VxxXyuSq-...A '
                                                                                ↑
                                                                    TRAILING SPACE!
  ```

### Revision 00024: THE FIX ✅
- **Root Cause**: OpenAI API key from Google Secret Manager had **trailing whitespace**
- **Impact**: HTTP Authorization header became malformed (illegal per HTTP spec)
- **Solution**: Strip whitespace from API key

**In `backend/app/routers/ai_generate.py`:**
```python
# Get API key and strip any whitespace (trailing spaces cause httpx header errors)
api_key = os.getenv("OPENAI_API_KEY", "").strip()
```

**In `build-and-deploy.ps1`:**
```powershell
# Get OpenAI API key from Secret Manager and trim whitespace
$OPENAI_KEY = (gcloud secrets versions access latest --secret="openai-api-key" --project=super-flashcards-475210).Trim()
```

## Key Learnings

### 1. Error Visibility is Critical
- Initial error messages were too generic ("500 Internal Server Error")
- Verbose logging helped surface the actual problem
- Explicit httpx client creation provided more detailed error traces

### 2. Whitespace Matters in Headers
- HTTP header values cannot contain trailing whitespace
- Secret Manager values may include newlines/spaces
- Always `.strip()` or `.Trim()` secret values before use

### 3. Layer-by-Layer Debugging
The error was masked by multiple layers:
1. FastAPI caught the exception → 500 error
2. OpenAI library retried requests → delayed error
3. httpx validation failed → generic "Connection error"
4. Only with explicit client → revealed "Illegal header value"

### 4. Environment Differences
- Local development worked fine (environment variables set manually, no trailing space)
- Production failed (Google Secret Manager introduced whitespace)
- Always test secret retrieval in deployment environment

## Prevention for Future

### ✅ Best Practices Implemented:
1. **Always strip secrets**: `.strip()` in Python, `.Trim()` in PowerShell
2. **Comprehensive logging**: Added verbose mode toggle for debugging
3. **Explicit configuration**: Created httpx client explicitly instead of relying on defaults
4. **Error surfacing**: HTTPException with detailed error messages
5. **Diagnostic tools**: Created `diagnose_errors.py` for systematic error review

### ✅ Code Quality:
- Phase 1 workarounds documented (dummy user_id)
- Todo list tracks technical debt
- Clear separation between Phase 1 (Basic Auth) and Phase 2 (Multi-user)

## Files Modified

### `backend/app/routers/ai_generate.py`
- Added verbose logging system
- Strip whitespace from API key
- Explicit httpx client creation
- Comprehensive error handling

### `build-and-deploy.ps1`
- Trim API key from Secret Manager
- Fixed environment variable injection

### `backend/app/crud.py`
- Handle missing user tables gracefully
- Default to English for Phase 1

### `backend/requirements.txt`
- Updated `openai==1.54.0` (from 1.3.5)

## Verification Steps

Once deployed:
1. Test AI generation for simple word (e.g., "dissolute")
2. Verify: definition, etymology, cognates generated
3. Check logs: No errors, 200 OK responses
4. Verify flashcard saved to database
5. Test with `?verbose=true` parameter for detailed logging

## Related Documents
- `Sprint 6 Production Deployment - Final Plan.md` - Phase 1 vs Phase 2 roadmap
- `diagnose_errors.py` - Diagnostic tool for systematic error review
- Cloud Run URL: https://super-flashcards-57478301787.us-central1.run.app
