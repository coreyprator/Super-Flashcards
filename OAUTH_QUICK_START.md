# 🚀 Quick Start: Google OAuth Setup

## ⚡ Installation (5 minutes)

### 1. Install Python Dependencies
```powershell
cd "G:\My Drive\Code\Python\Super-Flashcards\backend"
pip install authlib==1.3.0 httpx==0.27.0 itsdangerous==2.1.2
```

### 2. Run Database Migration
Open SQL Server Management Studio and run:
```powershell
# File: scripts/migrate_oauth_users_table.sql
```
Or from command line:
```powershell
sqlcmd -S .\SQLEXPRESS -d LanguageLearning -i "scripts\migrate_oauth_users_table.sql"
```

### 3. Generate Secret Key (Recommended)
```powershell
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
```
Copy the output and add to your environment variables or create a `.env` file.

### 4. Start Server
```powershell
.\runui.ps1
```

### 5. Test Authentication

**Navigate to:** <http://localhost:8000/login>

**Test Google OAuth:**
- Click "Continue with Google"
- Sign in with your Google account
- ✅ Should redirect to main app

**Test Email/Password:**
- Click "Create Account" tab
- Fill in username, email, password
- Click "Create Account"  
- ✅ Should redirect to main app

---

## 📁 Files Created

### Backend:
- ✅ `backend/app/google_oauth_client.json` - OAuth credentials
- ✅ `backend/app/services/auth_service.py` - Auth utilities
- ✅ `backend/app/routers/auth.py` - Auth endpoints
- ✅ `backend/requirements.txt` - Updated dependencies

### Frontend:
- ✅ `frontend/login.html` - Login page
- ✅ `frontend/auth.js` - Auth module

### Database:
- ✅ `scripts/migrate_oauth_users_table.sql` - DB migration

### Documentation:
- ✅ `OAUTH_SETUP_COMPLETE.md` - Full setup guide
- ✅ `.env.example` - Environment template

---

## 🔑 API Endpoints

All endpoints are under `/api/auth`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account with email/password |
| POST | `/auth/login` | Login with email/password |
| GET | `/auth/google/login` | Initiate Google OAuth |
| GET | `/auth/callback` | Handle OAuth callback |
| GET | `/auth/me` | Get current user |
| POST | `/auth/logout` | Logout user |
| PUT | `/auth/me` | Update profile |

---

## 🔧 Configuration

### OAuth URLs Configured:
- <http://localhost:8000>
- <http://127.0.0.1:8000>
- <https://super-flashcards-57478301787.us-central1.run.app>
- <https://learn.rentyourcio.com>

### Session Settings:
- **Duration:** 30 days
- **Token Type:** JWT
- **Storage:** HTTP-only cookies + localStorage

### Basic Auth:
- **Status:** Enabled (fallback)
- **Username:** beta
- **Password:** flashcards2025

---

## 🎯 Usage Examples

### JavaScript - Check Auth Status
```javascript
if (window.auth.isAuthenticated()) {
    const user = window.auth.getUser();
    console.log(`Logged in as: ${user.email}`);
}
```

### JavaScript - Require Auth
```javascript
// Redirect to login if not authenticated
await window.auth.requireAuth();
```

### JavaScript - Logout
```javascript
await window.auth.logout();
```

### JavaScript - Make Authenticated API Call
```javascript
// Auth headers are automatically added by api-client.js
const flashcards = await apiClient.getFlashcards();
```

---

## 🐛 Troubleshooting

### "Module not found" errors
```powershell
pip install -r backend/requirements.txt
```

### Database errors
Run the migration script:
```powershell
sqlcmd -S .\SQLEXPRESS -d LanguageLearning -i "scripts\migrate_oauth_users_table.sql"
```

### OAuth not working
1. Check `backend/app/google_oauth_client.json` exists
2. Verify redirect URIs in Google Console
3. Clear browser cookies and try again

### Token expired
```javascript
// Clear and re-login
localStorage.clear();
window.location.href = '/login';
```

---

## ✅ Testing Checklist

- [ ] Dependencies installed
- [ ] Database migrated
- [ ] Server starts without errors
- [ ] Can access <http://localhost:8000/login>
- [ ] Google OAuth works
- [ ] Email/password registration works
- [ ] Email/password login works
- [ ] User stays logged in after refresh
- [ ] Logout works
- [ ] Protected routes redirect to login

---

## 📝 Next Steps

1. **Protect Routes:** Add auth checks to index.html
2. **User Profile:** Display user info in UI
3. **Link Flashcards:** Associate flashcards with users
4. **Email Verification:** Implement email confirmation
5. **Password Reset:** Add "Forgot Password" flow

---

Need help? Check `OAUTH_SETUP_COMPLETE.md` for detailed documentation!
