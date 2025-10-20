# Custom Subdomain Setup for Cloud Run

**Date:** October 20, 2025  
**Domain:** learn.rentyourcio.com  
**Platform:** Google Cloud Run  
**Status:** ✅ DNS Configured

---

## Overview

This document describes the setup of the custom subdomain `learn.rentyourcio.com` for the Super-Flashcards application running on Google Cloud Run.

## Domain Configuration

### DNS Setup

The subdomain has been configured with the following DNS record:

- **Type:** CNAME
- **Host/Name:** learn
- **Points to:** ghs.googlehosted.com
- **TTL:** Default (typically 3600 seconds / 1 hour)
- **Domain Registrar:** RentYourCIO.com

### Verification

The DNS configuration has been verified with a successful ping test:

```
Pinging ghs.googlehosted.com [142.251.116.121] with 32 bytes of data:
Reply from 142.251.116.121: bytes=32 time=16ms TTL=96
```

This confirms that `learn.rentyourcio.com` correctly resolves to Google's hosted service infrastructure.

---

## Application Configuration

### CORS Settings

The backend application (`backend/app/main.py`) has been configured to accept requests from the custom subdomain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://super-flashcards-57478301787.us-central1.run.app",  # Cloud Run URL
        "https://learn.rentyourcio.com",  # Custom subdomain
        "http://localhost:8000",  # Local development
        "http://127.0.0.1:8000"  # Local development alt
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### SSL/TLS Configuration

Google Cloud Run automatically provisions and manages SSL/TLS certificates for custom domains:

- **Certificate Provider:** Google-managed certificate
- **Provisioning Time:** Typically 5-15 minutes after domain mapping
- **Renewal:** Automatic (handled by Google Cloud)
- **Protocol:** HTTPS (TLS 1.2+)

---

## Cloud Run Domain Mapping

To complete the domain mapping in Google Cloud Run, use the following command:

```bash
gcloud run domain-mappings create \
  --service super-flashcards \
  --domain learn.rentyourcio.com \
  --region us-central1
```

### Verification Steps

After creating the domain mapping:

1. **Check Domain Mapping Status:**
   ```bash
   gcloud run domain-mappings describe learn.rentyourcio.com \
     --region us-central1
   ```

2. **Wait for SSL Certificate:**
   - Status will change from `PENDING` → `ACTIVE`
   - This typically takes 5-15 minutes
   - Certificate is automatically provisioned by Google

3. **Test the Application:**
   ```bash
   curl -I https://learn.rentyourcio.com
   ```
   
   Expected response:
   - HTTP/2 200 (or 401 if Basic Auth is enabled)
   - SSL certificate should be valid
   - Redirect from HTTP → HTTPS should work

---

## OAuth Configuration

For Google OAuth integration (Phase 2), the authorized redirect URI needs to be updated:

**Google Cloud Console → APIs & Credentials → OAuth 2.0 Client ID:**
- Authorized redirect URIs: `https://learn.rentyourcio.com/auth/google/callback`

This ensures that Google OAuth will properly redirect users back to the custom domain after authentication.

---

## Monitoring and Troubleshooting

### Check DNS Propagation

```bash
# Check DNS resolution
nslookup learn.rentyourcio.com

# Should return:
# learn.rentyourcio.com canonical name = ghs.googlehosted.com
```

### Check SSL Certificate Status

```bash
# View certificate details
openssl s_client -connect learn.rentyourcio.com:443 -servername learn.rentyourcio.com < /dev/null 2>/dev/null | openssl x509 -noout -dates -subject
```

### View Cloud Run Logs

```bash
# Monitor application logs
gcloud run services logs tail super-flashcards --region us-central1

# View recent errors
gcloud run services logs read super-flashcards \
  --region us-central1 \
  --limit 50 | grep ERROR
```

---

## Cost Implications

The custom domain mapping has no additional cost beyond the standard Cloud Run pricing:

- **Domain Mapping:** Free
- **SSL Certificate:** Free (Google-managed)
- **Cloud Run:** Pay-per-use (covered under existing budget)

---

## Access Information

### Current URLs

1. **Cloud Run Default URL:**
   - https://super-flashcards-57478301787.us-central1.run.app
   - Always available as fallback

2. **Custom Domain URL:**
   - https://learn.rentyourcio.com
   - Primary user-facing URL

### Authentication

**Phase 1 (Current):** Basic Authentication
- Username: `beta`
- Password: `flashcards2025`

**Phase 2 (Planned):** 
- Email/Password authentication
- Google OAuth ("Sign in with Google")

---

## Related Documentation

- **Deployment Guide:** `docs/Sprint 6 Production Deployment - Final Plan.md`
- **Current Status:** `docs/SPRINT_6_CLARIFICATION.md`
- **Authentication Plan:** `docs/USER_CARD_COLLECTIONS.md`
- **Backend Configuration:** `backend/app/main.py`

---

## Rollback Procedure

If issues arise with the custom domain:

1. **Revert to Cloud Run URL:**
   - Application remains accessible via default Cloud Run URL
   - No action needed on backend

2. **Remove Domain Mapping:**
   ```bash
   gcloud run domain-mappings delete learn.rentyourcio.com \
     --region us-central1
   ```

3. **Update DNS (if needed):**
   - Remove CNAME record from domain registrar
   - Or point to different destination

---

## Future Considerations

### Multiple Subdomains

If additional subdomains are needed (e.g., `api.rentyourcio.com`, `admin.rentyourcio.com`):

1. Create additional CNAME records in DNS
2. Map each subdomain to the same or different Cloud Run services
3. Update CORS configuration in `backend/app/main.py`

### Production vs. Staging

Consider setting up separate environments:

- **Production:** `learn.rentyourcio.com` → main Cloud Run service
- **Staging:** `learn-staging.rentyourcio.com` → staging Cloud Run service
- **Development:** Continue using `localhost:8000`

---

**Status:** ✅ Domain configured and ready for mapping  
**Next Step:** Execute `gcloud run domain-mappings create` command  
**Estimated Time to Live:** 5-15 minutes for SSL provisioning
