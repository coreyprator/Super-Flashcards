# Database Authentication Diagnosis - BREAKTHROUGH

**Date:** October 24, 2025  
**Status:** Claude's theory DISPROVEN - New findings point to different root cause

## Critical Discovery

### Claude's Theory: ❌ DISPROVEN
**Theory:** Connection sits idle during async Google API calls (2-4 seconds), times out, fails when query attempted.

**Our Diagnostic Test Results:**
```
🧪 DIAGNOSTIC: Testing database connection BEFORE user query...
❌ DIAGNOSTIC: Immediate query FAILED after 108ms
   This suggests connection issue is NOT timing-related
```

**Conclusion:** Connection fails **IMMEDIATELY** (108ms), not after sitting idle. The issue is NOT an idle connection timeout.

### New Discovery: /health Endpoint is Fake!

The `/health` endpoint that we thought confirmed database connectivity **NEVER ACTUALLY TESTS THE DATABASE**:

```python
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "database": "connected"  # ← HARD-CODED! No actual DB test!
    }
```

**This explains the paradox:**
- ✅ `/health` works → Because it never touches the database
- ❌ OAuth callback fails → Because it actually tries to connect

## Current Hypothesis

The database authentication is failing from Cloud Run to Cloud SQL, but we need to determine:

1. **Does ANY database query work from Cloud Run?**
2. **Is the SQL_PASSWORD being loaded correctly from Secret Manager?**
3. **Is there a URL encoding issue with special characters?**
4. **Is there a firewall/network issue specific to certain request types?**

## Action Items

### Just Deployed (Revision 00051)
Created a REAL database health check at `/health/db` that actually tests connection:

```python
@app.get("/health/db")
async def health_check_database(db: Session = Depends(get_db)):
    """Health check endpoint that ACTUALLY tests database connection"""
    try:
        from sqlalchemy import text
        result = db.execute(text("SELECT 1")).scalar()
        return {
            "status": "healthy",
            "database": "connected",
            "test_query": f"SUCCESS (result={result})"
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "failed",
            "error": str(e)
        }
```

### Next Steps

1. **Test `/health/db` endpoint** - Does database connection work from a simple endpoint?
2. **If it works:** Issue is specific to OAuth callback context (FastAPI dependency injection timing?)
3. **If it fails:** Database authentication is broken everywhere (password, firewall, or permissions issue)

## Technical Details

### Password Verification
```powershell
PS> gcloud secrets versions access latest --secret="db-password" --project=super-flashcards-475210
ezihRMX6VAaGd97hAuwW
```
✅ Password in Secret Manager matches what we expect

### Local Connection Test
```powershell
PS> sqlcmd -S 35.224.242.223 -U flashcards_user -P ezihRMX6VAaGd97hAuwW -d LanguageLearning -Q "SELECT 1"
```
✅ Direct connection from local machine works perfectly

### Cloud Run Connection String
```python
params = urllib.parse.quote_plus(
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={server},1433;"
    f"DATABASE={database};"
    f"UID={username};"
    f"PWD={password};"
    f"Encrypt=yes;"
    f"TrustServerCertificate=yes;"
    f"Connection Timeout=30;"
)
DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"
```

### Pool Settings (Added but not the issue)
```python
engine = create_engine(
    DATABASE_URL, 
    echo=True,
    pool_pre_ping=True,      # Tests connections before use
    pool_size=5,
    max_overflow=10,
    pool_recycle=3600,
    pool_timeout=30
)
```

## Logs from Failed OAuth Attempt

**OAuth flow worked perfectly:**
```
✅ Step 1/5: Getting token from Google... (145ms)
✅ Step 2/5: Extracting user info from token... (0ms)
✅ Step 3/5: Sanitizing OAuth data... (0ms)
🧪 DIAGNOSTIC: Testing database connection BEFORE user query...
❌ DIAGNOSTIC: Immediate query FAILED after 108ms
    Error: Login failed for user 'flashcards_user'
❌ Step 4/5: Checking if user exists in database...
   Same error repeats
```

## Questions to Answer

1. **Does `/health/db` work?**
   - YES → Database works from simple endpoints, issue is OAuth-specific
   - NO → Database connection broken everywhere from Cloud Run

2. **If OAuth-specific, why?**
   - FastAPI dependency injection timing?
   - Session middleware interaction?
   - Request context difference?

3. **If everywhere, what's wrong?**
   - Password not loading from Secret Manager correctly?
   - URL encoding issue with password characters?
   - Network/firewall blocking certain request types?
   - SQL Server permissions issue from Cloud Run's IP?

## Test Command

Once revision 00051 is deployed:
```powershell
curl https://super-flashcards-57478301787.us-central1.run.app/health/db
```

Expected results:
- **SUCCESS:** `{"status":"healthy","database":"connected","test_query":"SUCCESS (result=1)"}`
- **FAILURE:** `{"status":"error","database":"failed","error":"Login failed for user..."}`

This will tell us if the problem is universal or OAuth-specific.
