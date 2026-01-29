# Lessons Learned: OAuth Debugging Session (Jan 29, 2026)

## Incident Summary
OAuth login failed with `invalid_client: Unauthorized` during Sprint 8 pronunciation feature deployment. Debugging took ~2 hours across multiple AI assistants and human intervention.

---

## Root Causes Identified

### 1. Hardcoded Credentials in Code Override Secret Manager
**Problem:** The file `backend/app/google_oauth_client.json` contained old/wrong OAuth credentials. The code's loading logic checked for this JSON file FIRST, before falling back to environment variables:

```python
# This pattern caused the issue:
if os.path.exists(oauth_config_path):
    # Loads from JSON - ignores Secret Manager!
    config = json.load(f)
else:
    # Only uses env vars if JSON doesn't exist
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
```

**Lesson:** Never commit credential files to the repository. Always load from environment variables / Secret Manager exclusively in production code.

**Action Item:** 
- Add `*_client.json` and `*_credentials.json` to `.gitignore`
- Refactor auth code to ONLY use environment variables (no JSON file fallback)
- Add startup log that explicitly shows WHERE credentials were loaded from

---

### 2. `gcloud run deploy` Wipes Environment Variables
**Problem:** Running `gcloud run deploy --image ...` without explicitly specifying env vars resulted in losing ALL previously configured environment variables and secrets.

**What was lost:**
- SQL_PASSWORD (secret)
- OPENAI_API_KEY (secret)
- SQL_SERVER, SQL_DATABASE, SQL_USER
- BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD

**Lesson:** Use `gcloud run services update` for configuration changes, NOT `gcloud run deploy` unless you're explicitly setting all env vars.

**Safe Commands:**
```powershell
# SAFE - Updates specific config without wiping others
gcloud run services update SERVICE_NAME --update-env-vars="KEY=value"
gcloud run services update SERVICE_NAME --update-secrets="KEY=secret:version"

# DANGEROUS - Can wipe existing env vars if not explicitly included
gcloud run deploy SERVICE_NAME --image IMAGE_URL
```

**Action Item:** 
- Document all required env vars in a `DEPLOYMENT.md` file
- Create deployment script that always includes all required vars
- Before any deploy, run `gcloud run services describe` to capture current config

---

### 3. PowerShell Mangles Secret Values
**Problem:** Using PowerShell pipe to create secrets added unexpected characters:

```powershell
# BAD - PowerShell may add newlines or truncate
"secret_value" | gcloud secrets versions add SECRET_NAME --data-file=-
# Result: Secret length was 2 instead of 35!

# GOOD - Use file with -NoNewline
Set-Content -Path "secret.txt" -Value "secret_value" -NoNewline
gcloud secrets versions add SECRET_NAME --data-file="secret.txt"
Remove-Item "secret.txt"
```

**Lesson:** Always verify secret length after creation:
```powershell
$secret = gcloud secrets versions access latest --secret=SECRET_NAME; $secret.Length
```

**Action Item:** Add PowerShell secret creation helper to project scripts.

---

### 4. Multi-Line Commands Don't Work in PowerShell
**Problem:** Bash-style line continuation (`\`) doesn't work in PowerShell, causing curl tests to fail.

```powershell
# BAD - Bash style
curl -X POST https://example.com \
  -d "data"

# GOOD - Single line or use backtick
curl.exe -X POST "https://example.com" -d "data"
```

**Action Item:** All documentation should include PowerShell-compatible commands since that's the dev environment.

---

## Debugging Methodology That Worked

### The Curl Test (Isolates Code vs Config Issues)
When OAuth fails, test credentials directly with curl BEFORE changing code:

```powershell
# 1. Get fresh auth code from browser redirect
# 2. Immediately run (within 60 seconds):
curl.exe -X POST "https://oauth2.googleapis.com/token" -H "Content-Type: application/x-www-form-urlencoded" -d "code=AUTH_CODE&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&redirect_uri=REDIRECT_URI&grant_type=authorization_code"
```

- **If curl succeeds:** Problem is in application code
- **If curl fails:** Problem is in Google Console config or credentials

### Check Previous Working Revision
```powershell
# List recent revisions
gcloud run revisions list --service=SERVICE --region=REGION --limit=30

# Compare env vars with known working revision
gcloud run revisions describe REVISION_NAME --region=REGION --format="yaml(spec.containers[0].env)"
```

---

## Prevention Checklist

Before any Cloud Run deployment:

- [ ] Verify no credential JSON files in codebase
- [ ] Run `gcloud run services describe` to capture current config
- [ ] If using `gcloud run deploy`, include ALL env vars explicitly
- [ ] After secret creation, verify length matches expected
- [ ] Test OAuth with curl before debugging code
- [ ] Check Cloud Run logs for startup messages showing config source

---

## Time Cost
- Total debugging time: ~2 hours
- Could have been: ~15 minutes with curl test first

**Key Insight:** The curl test proving credentials worked meant the problem was 100% in application code/config, not Google Console. This should always be step 1 for OAuth issues.
