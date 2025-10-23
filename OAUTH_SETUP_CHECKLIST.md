# Google OAuth Setup Checklist

## Pre-Installation
- [x] Google OAuth credentials obtained
- [x] Client ID and Secret saved in backend/app/google_oauth_client.json
- [x] Redirect URIs configured in Google Console
- [x] Code files generated and ready

## Installation Steps

### 1. Python Dependencies
- [ ] Opened PowerShell in backend directory
- [ ] Ran: `pip install authlib==1.3.0 httpx==0.27.0 itsdangerous==2.1.2`
- [ ] No installation errors

### 2. Database Migration
- [ ] Opened SQL Server Management Studio (SSMS)
- [ ] Connected to LanguageLearning database
- [ ] Ran script: `scripts/migrate_oauth_users_table.sql`
- [ ] Migration completed successfully
- [ ] Verified new columns exist in users table

### 3. Environment Configuration (Optional)
- [ ] Generated secret key: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- [ ] Created .env file from .env.example
- [ ] Added SECRET_KEY to .env or environment variables

### 4. Server Startup
- [ ] Ran: `.\runui.ps1`
- [ ] Server started without errors
- [ ] No import errors in console
- [ ] Server accessible at http://localhost:8000

## Testing

### Google OAuth Flow
- [ ] Navigated to http://localhost:8000/login
- [ ] Clicked "Continue with Google"
- [ ] Redirected to Google login page
- [ ] Signed in with Google account
- [ ] Redirected back to app successfully
- [ ] User profile loaded correctly

### Email/Password Registration
- [ ] Clicked "Create Account" tab
- [ ] Filled in username
- [ ] Filled in email
- [ ] Filled in password (8+ chars, upper/lower/number)
- [ ] Clicked "Create Account"
- [ ] Account created successfully
- [ ] Redirected to main app
- [ ] User profile loaded correctly

### Email/Password Login
- [ ] Logged out
- [ ] Navigated to /login
- [ ] Clicked "Sign In" tab
- [ ] Entered email and password
- [ ] Clicked "Sign In"
- [ ] Logged in successfully
- [ ] Redirected to main app

### Session Persistence
- [ ] Logged in successfully
- [ ] Refreshed the page
- [ ] Still logged in (didn't redirect to login)
- [ ] User info still displayed

### Logout
- [ ] Clicked logout button
- [ ] Redirected to /login page
- [ ] Tried to access main app
- [ ] Redirected back to login (protected route works)

### API Authentication
- [ ] Opened browser DevTools (F12)
- [ ] Went to Network tab
- [ ] Made an API request (e.g., load flashcards)
- [ ] Checked request headers
- [ ] Confirmed "Authorization: Bearer <token>" present

## Verification

### Database Check
- [ ] Opened SSMS
- [ ] Ran: `SELECT * FROM users`
- [ ] New user accounts visible
- [ ] google_id populated for OAuth users
- [ ] email, name, picture populated correctly
- [ ] auth_provider set correctly ('email' or 'google')

### File Check
- [ ] `backend/app/google_oauth_client.json` exists
- [ ] `backend/app/services/auth_service.py` exists
- [ ] `backend/app/routers/auth.py` exists
- [ ] `frontend/login.html` exists
- [ ] `frontend/auth.js` exists
- [ ] `scripts/migrate_oauth_users_table.sql` exists

### API Documentation
- [ ] Navigated to http://localhost:8000/docs
- [ ] Confirmed /auth endpoints visible
- [ ] Tried "Try it out" on /auth/me
- [ ] Authentication required

## Troubleshooting (If Needed)

### If dependencies fail to install:
```powershell
pip install --upgrade pip
pip install --trusted-host pypi.org --trusted-host pypi.python.org -r requirements.txt
```

### If database migration fails:
```powershell
# Check if already ran
SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'google_id'
```

### If OAuth fails:
1. Check redirect URIs match exactly in Google Console
2. Clear browser cookies
3. Try incognito mode
4. Check backend/app/google_oauth_client.json has correct values

### If token errors:
```javascript
// Clear storage and retry
localStorage.clear();
window.location.reload();
```

## Production Deployment (Later)

### Cloud Run Setup
- [ ] Set SECRET_KEY environment variable
- [ ] Set ENVIRONMENT=production
- [ ] Upload google_oauth_client.json securely
- [ ] Run database migration on production DB
- [ ] Test OAuth at https://learn.rentyourcio.com
- [ ] Verify all redirect URIs work

## Documentation Review
- [ ] Read OAUTH_QUICK_START.md
- [ ] Read OAUTH_SETUP_COMPLETE.md
- [ ] Reviewed OAUTH_IMPLEMENTATION_SUMMARY.md
- [ ] Understand how to use auth.js module

## Final Status
- [ ] ✅ All installation steps complete
- [ ] ✅ All tests passed
- [ ] ✅ Ready for development
- [ ] ✅ Documentation reviewed

---

## Notes / Issues Encountered

(Add any notes or issues you encountered during setup)

---

## Sign-off

Setup completed by: _________________
Date: _________________
Status: ☐ Ready for Development ☐ Issues to Resolve

---

Last Updated: October 20, 2025
