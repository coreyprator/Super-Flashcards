# Deployment Automation - Quick Reference

## 📋 Summary

You now have fully automated deployment scripts that build, deploy, and verify in one command!

## ✅ Current Status (Revision 00047)

**WORKING:**
- ✅ Database connection: **VERIFIED** (`/health` returns `"database":"connected"`)
- ✅ OAuth redirect setup correctly
- ✅ Frontend loads
- ✅ API endpoints working
- ✅ SQL_PASSWORD secret properly mounted

**ISSUE RESOLVED:**
The SQL_PASSWORD secret was being lost when we updated environment variables. Fixed by always including `--set-secrets=SQL_PASSWORD=db-password:latest` in deploy commands.

## 🚀 New Deployment Scripts

### 1. Full Automated Deployment
```powershell
.\deploy.ps1 -Message "Your commit message here"
```
**What it does:**
1. ✅ Commits and pushes code to GitHub
2. ✅ Builds Docker image via Cloud Build  
3. ✅ Deploys to Cloud Run with all secrets
4. ✅ Waits for deployment to stabilize
5. ✅ Runs comprehensive verification tests
6. ✅ Reports success/failure with timing

**Options:**
- `-SkipTests` - Deploy without running verification
- `-SkipGit` - Deploy already-committed code
- `-Staging` - Test against staging URL

### 2. Quick Verification (No Deploy)
```powershell
.\verify-deployment.ps1
```
Tests current deployment without rebuilding.

### 3. Manual Testing
```powershell
python test_deployment.py           # Test production
python test_deployment.py --staging # Test Cloud Run URL
```

## 📊 Test Suite

The automated tests verify:
1. ✅ **Health Check** - Server responds, database connected
2. ✅ **Frontend Loads** - HTML page loads with title
3. ✅ **Static Assets** - JavaScript files accessible
4. ✅ **Database Connection** - Languages API returns data
5. ✅ **API Endpoints** - Database queries work
6. ✅ **OAuth Redirect** - Properly redirects to Google
7. ✅ **OAuth Callback** - Route exists (no 404)

## 🎯 Usage Examples

### Deploy a fix
```powershell
.\deploy.ps1 -Message "Fix database authentication"
```

### Deploy without tests (faster)
```powershell
.\deploy.ps1 -Message "Update UI styling" -SkipTests
```

### Just check if current deployment works
```powershell
.\verify-deployment.ps1
```

### Test manually with curl
```powershell
curl -k https://super-flashcards-57478301787.us-central1.run.app/health
```

## 🔧 Important Notes

1. **Always use `--set-secrets`** when deploying:
   ```powershell
   gcloud run deploy ... --set-secrets=SQL_PASSWORD=db-password:latest
   ```
   Otherwise the secret mount is lost!

2. **Python SSL errors on Windows** are normal for local testing.
   Use curl instead, or test from the browser.

3. **Database verified working** as of revision 00047.
   Health endpoint confirms connection.

## 🎉 Benefits

**Before:**
1. Manual git commands
2. Manual gcloud build
3. Manual gcloud deploy
4. Manual browser testing
5. 10+ minutes of clicking and waiting

**After:**
1. One command: `.\deploy.ps1 -Message "Fix XYZ"`
2. Automatically verified
3. Know immediately if it works
4. ~2-3 minutes total

## 🐛 Troubleshooting

**Python SSL errors in tests:**
- Expected on Windows
- Use `curl -k` to bypass
- Or test in browser at https://learn.rentyourcio.com

**Database auth failures:**
- Check secret is mounted: `gcloud run revisions describe ... --format="yaml(spec.containers[0].env)"`
- Always include `--set-secrets` in deploy commands
- Verify password in Secret Manager matches Cloud SQL

**Deploy script won't run:**
- Enable execution: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
