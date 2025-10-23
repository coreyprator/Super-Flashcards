# 🚀 Efficient OAuth Debugging Workflow

## Quick Start (Choose One)

### Option 1: One-Click Launch (RECOMMENDED)
```
1. Press Ctrl+Shift+P
2. Type: "Tasks: Run Task"
3. Select: "Start Backend + Open Chrome"
4. Chrome opens with DevTools ready
```

### Option 2: Debug with VS Code Integration
```
1. Press F5 (or Debug → Start Debugging)
2. Chrome launches automatically
3. DevTools open automatically
4. Breakpoints work in VS Code!
```

### Option 3: Manual (Traditional)
```powershell
# Terminal 1
.\runui.ps1

# Then open Chrome manually to http://localhost:8000/login
```

---

## 🔍 Using the Debug Panel

**Navigate to:** http://localhost:8000/oauth-debug.html

**Features:**
- ✅ Server status check
- ✅ OAuth endpoint test
- ✅ Network request logging
- ✅ One-click cURL generation
- ✅ Copy debug info to share with VS Code AI

---

## 📋 When Debugging OAuth - Do This:

### In Chrome (F12):

1. **Network Tab**
   - ✅ Check "Preserve log" (CRITICAL!)
   - ✅ Click "Continue with Google"
   - ✅ Look for these requests:
     - `GET /api/auth/google/login` → Should be 307/302
     - `GET https://accounts.google.com/...` → Should load
     - `GET /api/auth/callback?code=...` → After Google login

2. **Console Tab**
   - Look for JavaScript errors
   - Look for debug messages starting with 🔍

3. **Application Tab**
   - Check Cookies → Should see `access_token` after login
   - Check Local Storage → Should see `auth_token`

---

## 🤝 Sharing Debug Info with VS Code AI

### If OAuth Button Not Working:

**In Chrome:**
```
1. F12 → Network tab
2. Check "Preserve log"
3. Click "Continue with Google"
4. Right-click the failed request
5. Copy → Copy as cURL (bash)
6. Paste to VS Code AI
```

**Alternative - Use Debug Panel:**
```
1. Go to http://localhost:8000/oauth-debug.html
2. Click "Test OAuth Endpoint"
3. Click "Copy All Logs"
4. Paste to VS Code AI
```

### Example Message to VS Code AI:

```
Here's what I see when clicking "Continue with Google":

NETWORK TAB:
- Request: GET /api/auth/google/login
- Status: 404 Not Found
- Response: {"detail":"Not Found"}

CONSOLE TAB:
- Error: Failed to fetch

BACKEND LOGS:
INFO: 127.0.0.1:54321 - "GET /api/auth/google/login HTTP/1.1" 404

Please debug this OAuth issue.
```

---

## 🎯 Current OAuth Debug Steps

### Step 1: Verify Server Running
```powershell
# Check if server is up
Invoke-WebRequest http://localhost:8000/health
```

### Step 2: Test OAuth Endpoint
```powershell
# Should redirect (Status 307/302)
Invoke-WebRequest http://localhost:8000/api/auth/google/login -MaximumRedirection 0
```

### Step 3: Check Client ID in Redirect
```
1. Open http://localhost:8000/oauth-debug.html
2. Click "Test OAuth Endpoint"
3. Look in logs for client_id
4. Should see: 57478301787-n858cdgn...
```

### Step 4: Test in Browser
```
1. Open http://localhost:8000/login
2. F12 → Network tab → Check "Preserve log"
3. Click "Continue with Google"
4. Watch the redirect chain
```

---

## 🐛 Common Issues & Solutions

### Issue: Button Click Does Nothing
**Debug:**
- Console tab → Any JavaScript errors?
- Network tab → Any request sent?
- Is form submitting?

**Share with VS Code AI:**
- Screenshot of Console errors
- Copy network request as cURL
- Copy backend terminal logs

### Issue: 404 Not Found
**Debug:**
- Check backend logs for route registration
- Verify URL: `/api/auth/google/login` (not `/auth/google/login`)

**Share with VS Code AI:**
- Backend startup logs showing routes
- Network request details

### Issue: Wrong Client ID
**Debug:**
- Backend logs show which client_id loaded
- Network redirect URL shows which client_id used
- Compare the two

**Share with VS Code AI:**
- Backend startup log: "Client ID: 57478301787-n858cdgn..."
- Network URL: "client_id=57478301787-80l70otb..." (old?)
- Request VS Code AI to check caching

---

## 📊 VS Code AI Can Help When You Share:

✅ **Network request details** (Copy as cURL)
✅ **Console errors** (Copy message)
✅ **Backend logs** (Copy from terminal)
✅ **Response bodies** (Copy from Network → Response tab)
✅ **Headers** (Copy from Network → Headers tab)

❌ **Don't just say:** "It's not working"
✅ **Do say:** "Here's the cURL, console error, and backend log - please debug"

---

## 🏆 Efficiency Tips

1. **Keep Chrome DevTools open** while debugging
2. **Enable "Preserve log"** in Network tab (critical for OAuth!)
3. **Use Debug Panel** for quick tests
4. **Copy-paste** logs instead of describing them
5. **Use cURL** commands to share exact requests
6. **VS Code Tasks** for one-click server start

---

## 🎬 Current Status Check

Run this to see where we are:

```powershell
# 1. Is server running?
Test-NetConnection localhost -Port 8000

# 2. What client_id is loaded?
# Look in backend terminal for: "Client ID: 57478301787-n858cdgn..."

# 3. Test endpoint
Invoke-WebRequest http://localhost:8000/api/auth/google/login -MaximumRedirection 0

# 4. Open debug panel
start chrome http://localhost:8000/oauth-debug.html
```

---

**Questions? Ask VS Code AI with specific error details!** 🚀
