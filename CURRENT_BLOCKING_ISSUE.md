# Current Blocking Issue - OAuth Database Authentication Failure

**Date:** October 24, 2025  
**Status:** BLOCKED - Cannot test OAuth login anywhere (local or production)

## The Problem

OAuth authentication fails at the database connection step with:
```
{"detail":"Authentication failed: (pyodbc.InterfaceError) ('28000', \"[28000] [Microsoft][ODBC Driver 17 for SQL Server][SQL Server]Login failed for user 'flashcards_user'. (18456) (SQLDriverConnect)\")\n(Background on this error at: https://sqlalche.me/e/20/rvf5)"}
```

## What We Know

### ✅ Things That DO Work

1. **Health endpoint works**: `curl https://super-flashcards-57478301787.us-central1.run.app/health` returns `{"status":"healthy","version":"1.0.0","database":"connected"}`

2. **Local SQL connection works perfectly**:
   ```powershell
   sqlcmd -S 35.224.242.223 -U flashcards_user -P ezihRMX6VAaGd97hAuwW -d LanguageLearning
   # Returns: Connected successfully
   ```

3. **OAuth redirect works**: Redirects to Google correctly, returns to callback URL without 404

4. **Secret Manager configured**: SQL_PASSWORD secret mounted in Cloud Run revision 00049

5. **Credentials verified correct**: 
   - Username: `flashcards_user`
   - Password: `ezihRMX6VAaGd97hAuwW` (20 characters)
   - Database: `LanguageLearning`
   - Server: `35.224.242.223:1433`

### ❌ What Fails

**OAuth callback database query fails** when trying to check if user exists:
- Works: `/health` endpoint database check
- Fails: `/api/auth/google/callback` database query
- Same database, same credentials, different result

## The Paradox

**This makes no sense:**
- Health check endpoint successfully connects to database
- OAuth callback endpoint fails to connect to same database
- Both use the same connection string
- Both run in the same Cloud Run container
- Local sqlcmd works fine with same credentials

## Technical Details

### Environment (Cloud Run Revision 00049)
- **Image**: `gcr.io/super-flashcards-475210/super-flashcards@sha256:1a1ec20ab81c6e597caacd86e5361f30e05a1aab303238ffef1cd57c5fd45906`
- **Python**: 3.11-slim
- **ODBC Driver**: Microsoft ODBC Driver 17 for SQL Server
- **Database**: Cloud SQL (SQL Server 2019 Express)

### Environment Variables (Confirmed Present)
```yaml
- GOOGLE_CLIENT_ID: 57478301787-80l70otb16jfgliododcl2s4m59vnc67.apps.googleusercontent.com
- GOOGLE_CLIENT_SECRET: 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
- GOOGLE_REDIRECT_URI: https://learn.rentyourcio.com/api/auth/google/callback
- SECRET_KEY: ipg6DA97eqezGFta0KH10uPglgYBbT3s3csa+/aC0Us=
- SQL_PASSWORD: (from Secret Manager db-password:latest)
```

### Connection String (backend/app/database.py)
```python
params = urllib.parse.quote_plus(
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={server},1433;"  # 35.224.242.223,1433
    f"DATABASE={database};"   # LanguageLearning
    f"UID={username};"        # flashcards_user
    f"PWD={password};"        # ezihRMX6VAaGd97hAuwW
    f"Encrypt=yes;"
    f"TrustServerCertificate=yes;"
    f"Connection Timeout=30;"
)
DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"
```

### Health Check Code (Works)
```python
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "version": "1.0.0",
        "database": db_status
    }
```

### OAuth Callback Code (Fails)
```python
@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    # ... OAuth validation code ...
    
    # THIS LINE FAILS:
    user = db.query(models.User).filter(
        models.User.email == user_info['email']
    ).first()
```

## What We've Tried

1. ✅ **Added explicit port 1433** to connection string
2. ✅ **Added Connection Timeout=30** 
3. ✅ **Set up Secret Manager** for SQL_PASSWORD
4. ✅ **Reset Cloud SQL password** to match Secret Manager
5. ✅ **Verified user exists** in database: `flashcards_user` as SQL_USER
6. ✅ **Checked authorized networks**: 0.0.0.0/0 (all IPs allowed)
7. ✅ **Verified Secret Manager IAM**: Service account has secretAccessor role
8. ✅ **Added debug logging** (but doesn't show in logs)
9. ✅ **Fixed SECRET_KEY** for session cookies (was random per instance)
10. ✅ **Fixed session cookie config** (https_only, same_site='lax')
11. ✅ **Always include --set-secrets** in deploy commands

## Theories (All Unproven)

### Theory 1: Connection Pooling Issue
- Health check might be using a different connection pool
- OAuth callback might be exhausting connections
- **Counter-evidence**: Should see connection errors, not auth errors

### Theory 2: Timing/Race Condition
- OAuth callback happens too quickly after container start
- Connection not fully initialized
- **Counter-evidence**: Health check works immediately after deploy

### Theory 3: Session/Transaction Isolation
- OAuth route might be in a different transaction context
- Some SQLAlchemy session issue
- **Counter-evidence**: Both use `Depends(get_db)` the same way

### Theory 4: Password Encoding Issue
- Password contains special characters that need escaping in some contexts
- urllib.parse.quote_plus might not be sufficient
- **Counter-evidence**: Local sqlcmd works, health check works

### Theory 5: SQL Server Login Mode
- Cloud SQL might require Windows Authentication for some operations
- Mixed mode authentication not properly configured
- **Counter-evidence**: Local sqlcmd works with SQL auth

### Theory 6: Network Path Different
- OAuth callback might take a different network path
- Some firewall/proxy between Cloud Run and Cloud SQL
- **Counter-evidence**: Health check uses same path, works fine

## Critical Questions We Cannot Answer

1. **Why does health check work but OAuth callback doesn't?**
   - Same container, same credentials, same database

2. **Why does local sqlcmd work but Cloud Run fails?**
   - Same credentials, same network (authorized 0.0.0.0/0)

3. **Where is the debug logging?**
   - Added print statements to database.py, don't show in logs
   - Suggests code might not be running as expected?

4. **Is the password actually being loaded?**
   - No debug output confirms password is read from secret
   - Health check works though, so it must be loaded?

## What We Need to Test

### Test 1: Verify Password is Actually Loaded in OAuth Route
Add logging directly in the OAuth callback route:
```python
@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    # Log the actual connection string being used
    from app.database import engine
    logger.info(f"Connection URL: {engine.url}")
    # Continue with OAuth logic...
```

### Test 2: Try Simple DB Query in OAuth Route Before User Lookup
```python
@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    # Test query BEFORE OAuth logic
    try:
        result = db.execute(text("SELECT 1")).scalar()
        logger.info(f"Test query succeeded: {result}")
    except Exception as e:
        logger.error(f"Test query failed: {e}")
        raise
    # Continue with OAuth logic...
```

### Test 3: Check if Issue is Query-Specific
```python
# Instead of:
user = db.query(models.User).filter(models.User.email == email).first()

# Try raw SQL:
user = db.execute(
    text("SELECT * FROM Users WHERE email = :email"),
    {"email": email}
).first()
```

### Test 4: Check Connection at Module Import Time
Add to top of `backend/app/routers/auth.py`:
```python
# Test database connection when module loads
from app.database import engine
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
        print(f"✅ Auth module: Database connection OK at import time: {result}")
except Exception as e:
    print(f"❌ Auth module: Database connection FAILED at import time: {e}")
```

## Files That Need Investigation

1. **backend/app/database.py** (lines 1-74)
   - Database connection setup
   - Connection string construction
   - Missing debug output suggests issue here?

2. **backend/app/routers/auth.py** (lines 335-450)
   - OAuth callback route
   - Where database query fails
   - Need more logging here

3. **backend/app/main.py** (lines 48-76)
   - FastAPI app setup
   - Database dependency injection
   - Session middleware configuration

## Current Deployment State

- **Revision**: super-flashcards-00049-7vc
- **Status**: Deployed and running
- **Health Check**: ✅ Working (database connected)
- **OAuth Login**: ❌ Fails at database query
- **Last Deploy**: October 24, 2025 ~8:00 AM

## Why We're Stuck

We have a **paradox** that defies logical explanation:
1. Same container
2. Same database
3. Same credentials
4. One endpoint works (health)
5. Another endpoint fails (oauth callback)

This suggests:
- **NOT** a credential issue (health check works)
- **NOT** a network issue (health check works)
- **NOT** a Cloud SQL configuration issue (local sqlcmd works)
- **SOMETHING** about the OAuth callback route specifically

## Recommendations for Next Steps

1. **Add comprehensive logging** to OAuth callback route
2. **Test database query** at the very start of callback (before OAuth logic)
3. **Check SQLAlchemy session state** - might be an ORM issue
4. **Try raw SQL** instead of ORM query
5. **Check if it's timing-related** - add delay before query?
6. **Review SQLAlchemy connection pool** settings
7. **Check if User model** has some issue that prevents query

## Bottom Line

**We cannot test new user login anywhere** (local or production) due to this blocking database authentication issue that only affects the OAuth callback route but not other database operations in the same container.

The fact that the health endpoint works but OAuth callback doesn't suggests this is **NOT** a credential or configuration issue, but something about how the OAuth route interacts with the database that we haven't identified yet.
