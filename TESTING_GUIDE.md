# OAuth & Performance Testing Guide

## 🧪 How to Test the OAuth Flow

### ✅ Recommended: Clear Site Data Method

This is the **easiest and most reliable** way to test:

```javascript
// Open DevTools Console (F12) and run:

// Clear ALL site data
localStorage.clear();
sessionStorage.clear();

// Clear cookies
document.cookie.split(";").forEach(c => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// Clear IndexedDB
indexedDB.deleteDatabase('flashcard_db');

// Reload page
location.reload();
```

**What this does:**
- ✅ Clears JWT token → Forces re-authentication
- ✅ Clears onboarding flags → Triggers first-time flow
- ✅ Clears flashcard cache → Forces initial sync
- ✅ Clears all local state
- ⚠️ Google MAY still remember consent (but that's OK)

**Expected behavior:**
1. Page reloads to login screen
2. Click "Continue with Google"
3. Google may skip consent (already granted)
4. Redirects back with token
5. Shows first-time welcome screen
6. Loads flashcards with progress bar

---

### ✅ Alternative: Incognito/Private Mode

Open an incognito/private window:

**Chrome:** `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)  
**Firefox:** `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)  
**Edge:** `Ctrl+Shift+N` (Windows)

**What this does:**
- ✅ Completely clean slate (no cookies, no storage)
- ✅ Google WILL ask for consent again
- ✅ Tests true "first-time user" experience
- ✅ Can't interfere with your logged-in session

**Best for:**
- Testing actual first-time OAuth flow
- Verifying consent screen behavior
- Clean environment testing

---

### ❌ What WON'T Work: Just Logging Out

**Don't do this:**
```javascript
localStorage.removeItem('auth_token');
location.reload();
```

**Why it fails:**
- ❌ Leaves IndexedDB intact (won't trigger first-time flow)
- ❌ Leaves onboarding flags (won't show welcome screen)
- ❌ Leaves session storage (tracking data persists)

---

## ⏱️ Comprehensive Timing Analysis

### What Gets Tracked Now

With the new `oauth-tracker.js`, we track EVERYTHING:

#### OAuth Flow
```
[0ms] ▶️  START: oauth-flow
[5ms] 📍 MARK: google-button-clicked
      ... (redirect to Google) ...
      ... (passkey authentication) ...
      ... (redirect back to /api/auth/callback) ...
      ... (backend processing) ...
      ... (redirect to /login?auth=success) ...
[3245ms] 📍 MARK: oauth-callback-received
[3250ms] ▶️  START: process-oauth-token
[3255ms] ▶️  START: fetch-user-info
[3456ms] ✅ END: fetch-user-info (took 201ms)
[3460ms] ✅ END: process-oauth-token (took 210ms)
[3461ms] ✅ END: oauth-flow (took 3461ms)
```

**OAuth should complete in <10 seconds with passkey!**

#### App Initialization
```
[0ms] 📍 MARK: page-loading
[45ms] 📍 MARK: dom-content-loaded
[123ms] 📍 MARK: window-loaded
[150ms] ▶️  START: initial-sync
[155ms] ▶️  START: load-first-10-cards
[1823ms] ✅ END: load-first-10-cards (took 1668ms)
[1825ms] ▶️  START: load-remaining-cards
[28456ms] ✅ END: load-remaining-cards (took 26631ms)
[28457ms] ✅ END: initial-sync (took 28307ms)
```

**First 10 cards should load in <2 seconds!**

---

## 📊 How to View Timing Data

### In Console

After OAuth completes or sync finishes, you'll see automatic reports:

```
📊 OAuth & App Performance Report
=== SUMMARY ===
┌─────────────────────┬──────────┬────────┐
│ Phase               │ Duration │ Status │
├─────────────────────┼──────────┼────────┤
│ oauth-flow          │ 3.46s    │ ✅ FAST │
│ load-first-10-cards │ 1.67s    │ ✅ FAST │
│ load-remaining-cards│ 26.63s   │ ⚠️ OK   │
└─────────────────────┴──────────┴────────┘

=== BREAKDOWN ===
OAuth flow: 3.46s
Initial sync: 28.31s
First card load: 1.67s
```

### Manual Report

```javascript
// Get report anytime
window.oauthTracker.getReport();

// Export data for analysis
console.log(window.oauthTracker.export());

// Reset and start fresh
window.oauthTracker.reset();
```

---

## 🔍 What to Look For

### ✅ Good Performance Indicators

**OAuth Flow:**
- Total OAuth time: **<10 seconds** (with passkey)
- Callback received: **<5 seconds** after button click
- Token processing: **<1 second**

**App Initialization:**
- First 10 cards loaded: **<2 seconds**
- First card displayed: **<2 seconds**
- Background sync: **<40 seconds** (doesn't block UI)

### 🚨 Problem Indicators

**OAuth Flow:**
- ❌ OAuth time: **>30 seconds** → Network issue or Google problem
- ❌ Callback delay: **>10 seconds** → Backend slow or network lag
- ❌ Token processing: **>2 seconds** → Database slow

**App Initialization:**
- ❌ First 10 cards: **>5 seconds** → API slow or network lag
- ❌ Background sync: **>60 seconds** → Too many cards or slow IndexedDB

---

## 🧪 Test Scenarios

### Scenario 1: Fresh User Test (Recommended Start Here)

```bash
# 1. Clear all data
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('flashcard_db');

# Clear cookies (paste in console)
document.cookie.split(";").forEach(c => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

# 2. Reload
location.reload();

# 3. Click "Continue with Google"

# 4. Watch console for timing data

# 5. Expected results:
#    - OAuth: 3-10 seconds
#    - First card: <2 seconds
#    - Welcome screen appears
#    - Progress bar updates
```

### Scenario 2: Incognito Mode Test

```bash
# 1. Open incognito window (Ctrl+Shift+N)

# 2. Navigate to http://localhost:8000

# 3. Click "Continue with Google"
#    - Google WILL ask for consent (first time in incognito)
#    - Use passkey authentication

# 4. Watch console for timing

# 5. Expected results:
#    - OAuth: 5-15 seconds (includes consent screens)
#    - First card: <2 seconds
#    - Full first-time experience
```

### Scenario 3: Returning User Test

```bash
# 1. After Scenario 1 or 2 completes successfully

# 2. Just refresh page (DON'T clear data)

# 3. Expected results:
#    - No login screen (already authenticated)
#    - First card loads in <500ms
#    - No welcome screen
#    - Background sync check (silent)
```

### Scenario 4: Network Throttling Test

```bash
# 1. Open DevTools → Network tab

# 2. Set throttling to "Slow 3G"

# 3. Clear data and test OAuth

# 4. Expected results:
#    - OAuth: 10-30 seconds (network limited)
#    - First card: Still <5 seconds
#    - Progress bar shows actual network speed
```

---

## 🐛 Debugging Tips

### OAuth Takes >30 Seconds

**Check:**
1. **Network tab:** Are requests hanging?
2. **Console:** Any errors during redirect?
3. **Backend logs:** Is `/api/auth/callback` slow?

**Common causes:**
- Network latency
- Google API slow response
- Database connection issues
- Multiple redirects

### Sync Takes >60 Seconds

**Check:**
1. **Console:** How many cards are syncing?
2. **Network tab:** Are API requests slow?
3. **Application tab → IndexedDB:** Is database saving slow?

**Common causes:**
- Too many flashcards (>1000)
- Slow IndexedDB performance
- Network latency
- Images loading during sync

### No Timing Data Appears

**Check:**
1. **Console:** Do you see `✅ OAuth Performance Tracker initialized`?
2. **Network tab:** Is `oauth-tracker.js` loaded?
3. **Console:** Run `window.oauthTracker` - is it defined?

**Fix:**
```javascript
// Manually check if tracker exists
if (window.oauthTracker) {
    console.log('Tracker loaded ✅');
    window.oauthTracker.getReport();
} else {
    console.error('Tracker NOT loaded ❌');
}
```

---

## 📝 Expected Console Output

### Successful OAuth Flow

```
⏱️ [0ms] 📍 MARK: page-loading
⏱️ [45ms] 📍 MARK: dom-content-loaded
⏱️ [123ms] 📍 MARK: window-loaded
👆 User clicked "Continue with Google"
⏱️ [2456ms] ▶️  START: oauth-flow
⏱️ [2461ms] 📍 MARK: google-button-clicked
   ... (redirecting to Google) ...
⏱️ [5234ms] 📍 MARK: oauth-callback-received
⏱️ OAuth flow took: 2.78s
   Started at: 2025-10-21T20:30:45.123Z
   Ended at: 2025-10-21T20:30:47.901Z
✅ OAuth callback detected, processing token...
⏱️ [5240ms] ▶️  START: process-oauth-token
💾 Token saved to localStorage
🔄 Fetching user info from /api/auth/me...
⏱️ [5245ms] ▶️  START: fetch-user-info
📥 Got response: 200 OK
⏱️ [5456ms] ✅ END: fetch-user-info (took 211ms)
👤 User info received: {email: 'user@example.com', ...}
⏱️ [5460ms] ✅ END: process-oauth-token (took 220ms)
⏱️ [5461ms] ✅ END: oauth-flow (took 3005ms)
📊 OAuth completed successfully!
   Total OAuth time: 3.01s
🚀 Redirecting to main app...
⏱️ [5465ms] 📍 MARK: redirecting-to-app
```

---

## 📊 Export Data for Analysis

```javascript
// Export all timing data
const data = window.oauthTracker.export();

// Copy to clipboard
copy(data);

// Or download as JSON
const blob = new Blob([data], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'oauth-timing.json';
a.click();
```

---

## ✅ Success Criteria

After testing, your OAuth should meet these criteria:

### Performance
- [ ] OAuth flow: <10 seconds (with passkey)
- [ ] First card: <2 seconds
- [ ] Background sync: <40 seconds (non-blocking)
- [ ] Returning user: <500ms

### User Experience
- [ ] Welcome screen appears for first-time users
- [ ] Progress bar shows real-time updates
- [ ] ETA calculation is accurate
- [ ] "One-time setup" message is clear
- [ ] No blank screens or hanging
- [ ] Console shows timing data

### Debugging
- [ ] All phases tracked and logged
- [ ] Report shows clear breakdown
- [ ] Can export timing data
- [ ] Easy to identify bottlenecks

---

## 🎯 Next Steps

1. **Run Scenario 1** (Fresh User Test)
2. **Share console output** with timing data
3. **Identify slowest phase** from report
4. **Optimize based on data** (if needed)

Ready to test! 🚀
