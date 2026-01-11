# 🔐 Authentication Setup for Tests

## 🎯 One-Time Setup (Saves Your Login)

### Step 1: Save Your Authentication

```powershell
cd "g:\My Drive\Code\Python\Super-Flashcards"
python tests/auth_setup.py
```

**What happens:**
1. Browser opens automatically
2. You log in manually (with 2FA)
3. Press Enter in terminal
4. ✅ Session saved to `tests/auth_state.json`

### Step 2: Run Tests (No Login Needed!)

```powershell
pytest tests/test_v2_6_33_deployment.py -v --headed
```

**Now all tests use your saved session** - no more 2FA! 🎉

---

## 🔄 How It Works

### Before (Every Test):
```
Test runs → Login screen → Enter credentials → 2FA → Test starts
```

### After (One-Time Setup):
```
Run auth_setup.py once → Login manually → Session saved

Test runs → Loads saved session → Already logged in! → Test starts
```

---

## 🛠️ Troubleshooting

### "Session expired" or tests show login screen

Your saved session expired. Just re-run the setup:

```powershell
python tests/auth_setup.py
```

### Delete saved session

```powershell
Remove-Item "tests/auth_state.json"
```

### See what's saved

The `auth_state.json` file contains:
- Cookies
- LocalStorage data
- Session tokens
- Authentication state

**This file is gitignored** - it won't be committed to your repo.

---

## 🎯 Quick Commands

```powershell
# Save your login (do this once)
python tests/auth_setup.py

# Run all tests (uses saved login)
pytest tests/test_v2_6_33_deployment.py -v --headed

# Run single test (uses saved login)
pytest tests/test_v2_6_33_deployment.py::test_simple_page_load -v --headed

# Delete saved session and start fresh
Remove-Item "tests/auth_state.json"
python tests/auth_setup.py
```

---

## ✅ Benefits

- ✅ **No more 2FA** for every test run
- ✅ **Faster tests** (no login delay)
- ✅ **No security alerts** (fewer login attempts)
- ✅ **Realistic testing** (tests run as authenticated user)
- ✅ **One setup** (session persists across all tests)

---

## 🔒 Security Note

The `auth_state.json` file contains your session tokens. It's:
- ✅ **Gitignored** (won't be committed)
- ✅ **Local only** (stays on your machine)
- ⏰ **Expires** (you'll need to re-run setup when session expires)

**Safe to use for local testing!**
