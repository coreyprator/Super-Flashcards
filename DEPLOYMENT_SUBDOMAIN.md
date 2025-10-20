# Quick Deployment Guide - Custom Subdomain

**Domain:** learn.rentyourcio.com  
**Status:** ✅ DNS configured, ✅ Code updated, ⏳ Awaiting Cloud Run mapping

---

## What Has Been Done

✅ **DNS Configuration** - You completed this:
- CNAME record created: `learn` → `ghs.googlehosted.com`
- Verified with successful ping to `142.251.116.121`

✅ **Backend Code Updated:**
- Added `https://learn.rentyourcio.com` to CORS allowed origins
- No breaking changes to existing functionality

✅ **Documentation Updated:**
- All references changed from `cbsware.com` to `rentyourcio.com`
- Created comprehensive setup documentation

---

## What You Need to Do Now

### Step 1: Map Domain in Google Cloud Run

Execute this command in your terminal (PowerShell or Cloud Shell):

```bash
gcloud run domain-mappings create \
  --service super-flashcards \
  --domain learn.rentyourcio.com \
  --region us-central1
```

**Expected Output:**
```
Creating domain mapping...
Waiting for certificate provisioning. This may take up to 15 minutes...
✓ Routing traffic to Cloud Run service 'super-flashcards'
```

**⏱️ Time Required:** 5-15 minutes (mostly waiting for SSL certificate)

---

### Step 2: Verify Domain Mapping

Check the status:

```bash
gcloud run domain-mappings describe learn.rentyourcio.com --region us-central1
```

**What to look for:**
- `status: ACTIVE` (may take a few minutes to show)
- Certificate details should be present

---

### Step 3: Test the Custom Domain

**Option 1: Browser Test**
1. Open browser to: https://learn.rentyourcio.com
2. You should see Basic Auth prompt
3. Enter credentials:
   - Username: `beta`
   - Password: `flashcards2025`
4. Application should load normally

**Option 2: Command Line Test**
```bash
# Test SSL certificate
curl -I https://learn.rentyourcio.com

# Test with Basic Auth
curl -u beta:flashcards2025 https://learn.rentyourcio.com
```

**Expected Result:** 200 OK response with application content

---

### Step 4: Verify Full Functionality

Once the domain is working, test these features:

1. **Study Mode:**
   - ✅ Flashcards load
   - ✅ Card flipping works
   - ✅ Navigation buttons work

2. **Read Mode:**
   - ✅ Card details display
   - ✅ Images load from Cloud Storage
   - ✅ Audio plays correctly

3. **Browse Mode:**
   - ✅ Table displays all cards
   - ✅ Search works
   - ✅ Filtering works
   - ✅ Edit modal works

4. **Assets:**
   - ✅ Images load from `/images/*` endpoint
   - ✅ Audio loads from `/audio/*` endpoint
   - ✅ No CORS errors in browser console

---

## Troubleshooting

### Issue: "Domain mapping not found"

**Cause:** Command hasn't been executed yet  
**Solution:** Run the `gcloud run domain-mappings create` command above

---

### Issue: "Certificate still pending"

**Cause:** SSL provisioning takes time  
**Solution:** Wait 5-15 minutes, then check again:
```bash
gcloud run domain-mappings describe learn.rentyourcio.com --region us-central1
```

---

### Issue: "DNS_PROBE_FINISHED_NXDOMAIN"

**Cause:** DNS not yet propagated  
**Solution:** 
1. Check DNS: `nslookup learn.rentyourcio.com`
2. Should return: `ghs.googlehosted.com`
3. If not, verify CNAME record in domain registrar
4. Wait for DNS propagation (can take up to 48 hours, usually <1 hour)

---

### Issue: "NET::ERR_CERT_COMMON_NAME_INVALID"

**Cause:** SSL certificate not yet provisioned  
**Solution:** Wait longer. Google is still provisioning the certificate.

---

### Issue: CORS errors in browser console

**Cause:** Code changes not deployed  
**Solution:** This should not happen since code is already updated, but if it does:
```bash
# Redeploy the application
gcloud run deploy super-flashcards \
  --source backend \
  --region us-central1
```

---

## After Successful Deployment

### Update OAuth (Phase 2)

When you set up Google OAuth later, remember to:
1. Go to Google Cloud Console → APIs & Credentials
2. Edit OAuth 2.0 Client ID
3. Add to Authorized redirect URIs: `https://learn.rentyourcio.com/auth/google/callback`

### Share with Friends

Once everything is working, you can share:
- **URL:** https://learn.rentyourcio.com
- **Username:** beta
- **Password:** flashcards2025

### Monitor Usage

View application logs:
```bash
gcloud run services logs tail super-flashcards --region us-central1
```

View metrics:
- Visit: https://console.cloud.google.com/run/detail/us-central1/super-flashcards

---

## Cost Reminder

**Additional Cost for Custom Domain:** $0.00
- Domain mapping: Free
- SSL certificate: Free
- No change to existing Cloud Run costs

---

## Support

If you encounter issues:

1. **Check logs:**
   ```bash
   gcloud run services logs read super-flashcards \
     --region us-central1 \
     --limit 50
   ```

2. **Verify service is running:**
   ```bash
   gcloud run services describe super-flashcards --region us-central1
   ```

3. **Fallback URL:**
   - If custom domain has issues, the app is still accessible at:
   - https://super-flashcards-57478301787.us-central1.run.app

---

## Next Steps After This

Once the custom domain is working:

1. ✅ **Phase 1 Complete:** Infrastructure deployed with custom domain
2. 🎯 **Phase 2 Next:** Multi-user authentication + card sharing (8-12 hours)
3. 📅 **Timeline:** Next weekend when you have time

---

**Current Status:**
- ✅ DNS configured
- ✅ Code updated  
- ✅ Documentation complete
- ⏳ **YOU NEED TO:** Execute domain mapping command
- ⏳ **THEN:** Wait 5-15 minutes for SSL
- ⏳ **THEN:** Test and verify

**Estimated Time to Complete:** 20 minutes (mostly automated waiting)

---

**Good luck! The hard part is done. Just one command and some waiting! 🚀**
