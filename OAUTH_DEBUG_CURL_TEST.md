# OAuth 401 Debug - Systematic Verification

## PART 1: Google Console Verification Checklist

### Check #1: Credential Type
Location: Google Cloud Console → APIs & Services → Credentials

1. Find the OAuth 2.0 Client ID: `57478301787-80l70otb16jfgliododcl2s4m59vnc67`
2. Click on it to open details
3. At the top, look for "Application type"

Expected: **Web application**
If you see: Desktop app, Android, iOS, or anything else = ❌ PROBLEM FOUND

**What you see:**
- [ ] Web application (correct)
- [ ] Something else (problem)
- [ ] Describe: ___________________

---

### Check #2: Authorized Redirect URIs
In the same credential detail page, find "Authorized redirect URIs"

Must be **EXACTLY**:
```
https://learn.rentyourcio.com/api/auth/google/callback
```

Common mistakes:
- ❌ Has trailing slash: `https://learn.rentyourcio.com/api/auth/google/callback/`
- ❌ HTTP instead of HTTPS: `http://learn.rentyourcio.com/...`
- ❌ Different path: `https://learn.rentyourcio.com/callback`

**Verification:**
- [ ] Exact match (no trailing slash, HTTPS, exact path)
- [ ] Different - describe: ___________________

---

### Check #3: OAuth Consent Screen
Location: Google Cloud Console → APIs & Services → OAuth consent screen

1. Look at "Publishing status"

**Options:**
- [ ] "Testing" mode
- [ ] "In production"

**If Testing Mode:**
- Click "Test users"
- Is `cprator@cbsware.com` listed?
  - [ ] Yes
  - [ ] No (ADD IT if missing)

---

## PART 2: The Curl Test (Do This After Console Checks)

### Step 1: Get Fresh Authorization Code
Copy and paste this entire URL into your browser (incognito mode):
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=57478301787-80l70otb16jfgliododcl2s4m59vnc67.apps.googleusercontent.com&redirect_uri=https://learn.rentyourcio.com/api/auth/google/callback&response_type=code&scope=openid%20email%20profile&access_type=offline
```

1. Authorize with Google (if prompted)
2. Wait for redirect (it will error, that's fine)
3. **Copy the entire URL from the address bar**
4. Find the `code=XXXXX` parameter
5. **Copy just the code value** (long string after `code=`)

Example:
```
URL in address bar after redirect:
https://learn.rentyourcio.com/api/auth/google/callback?state=abc123&code=4%2F0ASc3gC1zZ430lNec0v77T2Tz&...

Your code value: 4%2F0ASc3gC1zZ430lNec0v77T2Tz
```

---

### Step 2: Run Curl Test (Within 60 Seconds of Getting Code)

In PowerShell, run this command. **Replace `PASTE_CODE_HERE` with your actual code:**

```powershell
$code = "PASTE_CODE_HERE"
$clientId = "57478301787-80l70otb16jfgliododcl2s4m59vnc67.apps.googleusercontent.com"
$clientSecret = "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"
$redirectUri = "https://learn.rentyourcio.com/api/auth/google/callback"

$body = @{
    code = $code
    client_id = $clientId
    client_secret = $clientSecret
    redirect_uri = $redirectUri
    grant_type = "authorization_code"
}

Write-Host "Testing OAuth token exchange..."
Write-Host "Code: $code"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" `
        -Method POST `
        -Body $body `
        -ContentType "application/x-www-form-urlencoded" `
        -Verbose
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response:"
    $response | ConvertTo-Json
}
catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Full Response:"
    Write-Host $_.Exception.Response
}
```

---

## PART 3: Report Your Results

### Console Verification Results:
```
Credential Type: [Web application / Other]
Redirect URI Match: [Exact / Different - describe]
Consent Screen Status: [Testing / Production]
Test Users (if Testing): [cprator@cbsware.com present: Yes/No]
```

### Curl Test Results:
```
SUCCESS or FAILURE?
If FAILURE, what's the exact error message?
```

---

## Analysis After Results

**If curl succeeds:** 
- ✅ Google Console is configured correctly
- ❌ Problem is in Python/Authlib code
- Next step: Debug Authlib token exchange

**If curl fails with 401 invalid_client:**
- ❌ Google Console configuration is wrong
- ✅ Code is correct
- Check: Credential type, redirect URI exact match, consent screen settings

**If curl fails with different error:**
- Report that error - it will tell us the specific problem
