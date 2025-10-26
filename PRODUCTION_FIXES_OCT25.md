# Production Fixes - October 25, 2025

## Issues Discovered During Regression Testing

### 1. ✅ DNS Resolution Causing Site Inaccessibility
**Symptom**: `DNS_PROBE_FINISHED_NXDOMAIN` error on laptop Chrome, but site works on iPhone

**Root Cause**: AT&T gateway DNS servers (68.94.156.9, 68.94.157.9) had 2-4 second timeouts per query

**Impact**: 
- Chrome couldn't resolve learn.rentyourcio.com on laptop
- Python httpx 110-second delays
- gcloud CLI DNS failures  
- NordVPN 120-second launch delays

**Fix Applied**: 
```powershell
Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ServerAddresses ("8.8.8.8","8.8.4.4")
ipconfig /flushdns
```

**Result**: Instant DNS resolution, all network operations now fast

**Status**: ✅ RESOLVED

---

### 2. ✅ AI Flashcard Generation 500 Error
**Symptom**: POST `/api/ai/generate` returning 500 Internal Server Error

**Root Cause**: `OPENAI_API_KEY` environment variable was not configured in Cloud Run revision 00054-xw9

**Error Message**:
```
httpcore.LocalProtocolError: Illegal header value b'Bearer '
openai.APIConnectionError: Connection error.
```

**Fix Applied**:
```bash
gcloud run services update super-flashcards --region=us-central1 \
  --update-secrets=OPENAI_API_KEY=openai-api-key:latest
```

**Result**: New revision 00055-bcr deployed with OpenAI API key properly configured

**Status**: ✅ RESOLVED

---

### 3. 🔄 Missing Audio Generation During Card Creation
**Symptom**: AI-generated cards don't include audio, must click button manually to generate

**Root Cause**: Google Cloud TTS service initialization was failing due to unnecessary credentials check

**Issue**: Code was checking for `GOOGLE_APPLICATION_CREDENTIALS` environment variable and failing if not present. In Cloud Run with a service account, Application Default Credentials are used automatically - no credentials file needed.

**Code Fix** (backend/app/services/google_tts_service.py):
```python
# BEFORE (lines 46-51):
credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
if not credentials_path:
    logger.error("GOOGLE_APPLICATION_CREDENTIALS not set")
    return

# AFTER:
# In Cloud Run, the SDK automatically uses the service account
# No need to check GOOGLE_APPLICATION_CREDENTIALS
credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
if credentials_path and not os.path.exists(credentials_path):
    logger.warning(f"GOOGLE_APPLICATION_CREDENTIALS set but file not found: {credentials_path}")

# Initialize client - will use Application Default Credentials
self.client = texttospeech.TextToSpeechClient()
```

**Deployment**:
- Commit: 7582510 "Fix Google TTS initialization to use Application Default Credentials in Cloud Run"
- Cloud Run deployment: IN PROGRESS (revision 00056 expected)

**Status**: 🔄 FIX DEPLOYED, TESTING PENDING

---

### 4. 📋 TODO: New Card Not Displayed After Creation
**Symptom**: After AI generates a card, user must browse/search to find it - not displayed automatically

**Root Cause**: Frontend switches to study mode after card creation, which shows a random card (not the newly created one)

**Current Code** (frontend/app.js, lines 555-556):
```javascript
backToMain();
switchToStudyMode();  // Shows random card, not the new one
```

**Proposed Fix**: After card creation, either:
- Option A: Show the newly created card in an edit/view modal
- Option B: Navigate to Browse mode and highlight the new card
- Option C: Show the new card in study mode (filter to only that card)

**Status**: 📋 IDENTIFIED, FIX NOT YET IMPLEMENTED

---

## Deployment Timeline

| Time  | Event | Revision | Status |
|-------|-------|----------|--------|
| 15:50 | AI generation fails | 00054-xw9 | Missing OPENAI_API_KEY |
| 15:52 | DNS fix applied | - | Laptop now uses Google DNS |
| 16:10 | OPENAI_API_KEY added | 00055-bcr | AI generation working |
| 16:25 | TTS fix committed | - | Commit 7582510 |
| 16:27 | Backend deploying | 00056-??? | IN PROGRESS |

---

## Testing Checklist

After deployment completes:

- [ ] Test AI card generation (should work with OpenAI)
- [ ] Verify audio is generated automatically during card creation (TTS fix)
- [ ] Confirm card displays after creation (currently broken - needs fix)
- [ ] Test manual audio generation button (should still work as fallback)
- [ ] Verify DNS resolution remains fast (already fixed on laptop)

---

## Lessons Learned

1. **Secret Management**: During password rotation, check ALL required secrets are configured, not just database password
2. **Application Default Credentials**: In Cloud Run, Google Cloud SDKs use service account automatically - don't require credentials files
3. **DNS Issues**: ISP DNS servers can cause cascading failures - consider using Google DNS (8.8.8.8) or Cloudflare DNS (1.1.1.1) by default
4. **Manual Deployments**: When deploying via Cloud Console (not gcloud CLI), verify all environment variables and secrets are preserved

---

## Next Steps

1. Wait for Cloud Run deployment to complete (revision 00056)
2. Test audio generation during card creation
3. Implement fix for displaying newly created card
4. Deploy frontend fix
5. Complete production regression testing
6. Hand off to Claude for sprint planning
