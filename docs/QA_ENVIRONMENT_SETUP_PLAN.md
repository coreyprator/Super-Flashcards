# Sprint 7 QA Environment Setup Plan

**Date:** November 12, 2025  
**Purpose:** Complete QA environment isolation for Sprint 7 development  
**Status:** Ready for implementation

---

## 🎯 Overview

We need **COMPLETE ISOLATION** between QA and Production:

### Code Isolation
✅ **Separate Git Branch:** `dev` branch for QA, `main` branch for Production  
✅ **Protected `main` branch:** No direct commits during Sprint 7  
✅ **QA deployment from `dev`:** build-and-deploy-qa.ps1 reads `dev` branch  
✅ **Prod deployment from `main`:** build-and-deploy.ps1 reads `main` branch  

### Database Isolation
✅ **Separate Database:** `LanguageLearning_QA` vs `LanguageLearning`  
✅ **Separate User:** `flashcards_qa_user` vs `flashcards_user`  
✅ **Separate Secrets:** `db-password-qa` vs `db-password`  

### Service Isolation
✅ **Separate Cloud Run Service:** `super-flashcards-qa` vs `super-flashcards`  
✅ **Separate URL:** QA URL vs production URL  
✅ **Separate Container Tags:** `:qa` vs `:latest`  

**Result:** Sprint 7 development happens entirely in QA. Production code and database remain untouched until QA validation complete.

---

## 🏗️ Current Production Setup (Verified)

- **Cloud SQL Instance:** `flashcards-db` (SQL Server 2019 Express)
- **Location:** us-central1-a
- **Database:** `LanguageLearning`
- **Public IP:** 35.224.242.223
- **User:** `flashcards_user`
- **Git Branch:** `main`
- **Cloud Run Service:** `super-flashcards`

---

## 📋 What I Need From You

### 1. **Google Cloud SQL QA Database Setup** (Your Action Required)

We'll create a **second database** on your existing Cloud SQL instance `flashcards-db`.

**Option A: Create QA Database on Same Instance (Recommended)**

**Why This is Best:**
- ✅ No additional Cloud SQL instance costs
- ✅ Same IP address (35.224.242.223)
- ✅ Uses existing SQL Server 2019 Express
- ✅ Simple database isolation
- ✅ Easy to set up (just one SQL command)

**How to Set Up:**

```sql
-- Connect to your Cloud SQL instance via Cloud Console SQL Editor
-- OR via SQL Server Management Studio (SSMS) connecting to 35.224.242.223

-- 1. Create QA database
CREATE DATABASE LanguageLearning_QA;
GO

-- 2. Create QA user with password
CREATE LOGIN flashcards_qa_user WITH PASSWORD = 'YourSecurePasswordHere';
GO

USE LanguageLearning_QA;
GO

CREATE USER flashcards_qa_user FOR LOGIN flashcards_qa_user;
GO

-- 3. Grant permissions
ALTER ROLE db_owner ADD MEMBER flashcards_qa_user;
GO

-- 4. Copy production schema and sample data (optional)
-- You can copy tables from LanguageLearning to LanguageLearning_QA
-- OR start with empty database and let migrations create schema
```

**Option B: Create Separate Cloud SQL Instance (Not Recommended)**
- ❌ Additional costs (~$10-30/month for another instance)
- ❌ More complex networking
- ❌ Separate IP to manage
- ❌ Overkill for QA needs

**Recommendation:** **Use Option A** (second database on same instance)

**What You'll Provide:**
- QA database password for `flashcards_qa_user`
- Confirmation that database `LanguageLearning_QA` is created

---

### 2. **Google Cloud Secret Manager** (Your Action Required)

We need QA-specific secrets stored separately from production.

**Action:** Add QA database password to Google Cloud Secret Manager:

```bash
# Via gcloud CLI (preferred)
gcloud secrets create db-password-qa \
    --project=super-flashcards-475210 \
    --replication-policy="automatic"

# Enter the password when prompted
echo -n "YourQAPasswordHere" | gcloud secrets versions add db-password-qa --data-file=-

# Can use same OpenAI API key as prod (cost tracking is per usage)
# No need for separate openai-api-key-qa unless you want separate billing
```

**Or via Google Cloud Console:**
1. Go to: https://console.cloud.google.com/security/secret-manager?project=super-flashcards-475210
2. Click "CREATE SECRET"
3. Name: `db-password-qa`
4. Secret value: [Your QA database password for `flashcards_qa_user`]
5. Click "CREATE SECRET"

**What You'll Provide:**
- Confirmation that `db-password-qa` secret is created
- We can reuse existing `openai-api-key` secret (same key, separate environment)

---

### 3. **Custom Domain for QA** (Optional - Your Decision)

**Option A: Use Cloud Run Auto URL (Easier)**
```
https://super-flashcards-qa-57478301787.us-central1.run.app
```
- ✅ No DNS configuration needed
- ✅ Immediate availability
- ✅ HTTPS automatic
- ❌ Ugly URL

**Option B: Custom Subdomain (Professional)**
```
https://qa.rentyourcio.com
```
- ✅ Clean URL
- ✅ Professional
- ❌ Requires DNS A record
- ❌ Requires SSL cert verification

**What You'll Provide (if Option B):**
- DNS A record: `qa.rentyourcio.com` → [Cloud Run IP]
- Confirmation to proceed with custom domain mapping

**Recommendation:** Start with **Option A** (auto URL) for speed, upgrade to Option B later if needed.

---

## 🛠️ What I Will Do (Automated)

Once you provide the above, I will:

### 1. Create QA Deployment Script

**File:** `build-and-deploy-qa.ps1`

```powershell
# QA-specific deployment script
gcloud run deploy super-flashcards-qa `
    --image gcr.io/super-flashcards-475210/super-flashcards:qa `
    --platform managed `
    --region us-central1 `
    --allow-unauthenticated `
    --set-env-vars="SQL_SERVER=35.224.242.223,SQL_DATABASE=LanguageLearning_QA,SQL_USER=flashcards_qa_user,BASIC_AUTH_USERNAME=qa,BASIC_AUTH_PASSWORD=qa2025,GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,GOOGLE_REDIRECT_URI=https://qa.rentyourcio.com/api/auth/google/callback,ENVIRONMENT=qa" `
    --update-secrets="SQL_PASSWORD=db-password-qa:latest,OPENAI_API_KEY=openai-api-key-qa:latest" `
    --project=super-flashcards-475210
```

**Key Differences from Production:**
- Service name: `super-flashcards-qa`
- Database: `LanguageLearning_QA`
- Secrets: `db-password-qa`, `openai-api-key-qa`
- Auth: `qa` / `qa2025` (different from prod)
- Environment tag: `ENVIRONMENT=qa`

### 2. Create Git Branch Strategy (CODE ISOLATION)

**Critical: Separate codebases for QA and Production**

```bash
# Create dev branch for Sprint 7 work
git checkout -b dev
git push origin dev

# Set branch protection rules
# main = production code ONLY
# dev = QA/development code ONLY
```

**Workflow:**
```
┌─────────────────────────────────────────────────┐
│  Sprint 7 Development Workflow                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Work on 'dev' branch                        │
│     git checkout dev                            │
│     [make code changes]                         │
│     git commit -am "Add subscription system"    │
│     git push origin dev                         │
│                                                 │
│  2. Deploy 'dev' branch to QA                   │
│     .\build-and-deploy-qa.ps1                   │
│     → Deploys to super-flashcards-qa service    │
│     → Uses LanguageLearning_QA database         │
│                                                 │
│  3. Test in QA environment                      │
│     https://super-flashcards-qa-xxx.run.app     │
│     [find bugs, fix on dev branch]              │
│                                                 │
│  4. Repeat steps 1-3 until QA passes            │
│     [iterate safely in QA]                      │
│                                                 │
│  5. ONLY AFTER QA validation:                   │
│     git checkout main                           │
│     git merge dev                               │
│     git push origin main                        │
│                                                 │
│  6. Deploy 'main' branch to Production          │
│     .\build-and-deploy.ps1                      │
│     → Deploys to super-flashcards service       │
│     → Uses LanguageLearning database (prod)     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Protection:**
- ✅ **Production code (`main`) is NEVER touched during Sprint 7 development**
- ✅ **All development happens on `dev` branch**
- ✅ **QA deployment script reads from `dev` branch**
- ✅ **Production deployment script reads from `main` branch**
- ✅ **No accidental deploys to production during development**

### 3. Update Cloud Build Configuration

**File:** `cloudbuild-qa.yaml` (NEW)

```yaml
steps:
  # Build QA container with :qa tag
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/super-flashcards-475210/super-flashcards:qa', '.']

  # Push to GCR
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/super-flashcards-475210/super-flashcards:qa']

images:
  - 'gcr.io/super-flashcards-475210/super-flashcards:qa'
```

### 4. Create QA Testing Documentation

**File:** `docs/QA_TESTING_GUIDE.md`

- How to access QA environment
- Test user credentials
- Test data seeding
- Rollback procedures
- Deployment checklist

### 5. Add Environment Detection to Code

**File:** `backend/app/main.py`

```python
import os

ENVIRONMENT = os.getenv('ENVIRONMENT', 'production')

if ENVIRONMENT == 'qa':
    # Enable debug logging
    # Disable rate limiting
    # Add QA-specific endpoints
    pass
```

---

## 🔐 Code Isolation Guarantee

### How We Prevent Stepping on Production Code

**Two Completely Separate Codebases:**

```
┌─────────────────────────────────────────────────┐
│  GIT BRANCHES                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  main branch (PRODUCTION CODE)                  │
│  ├─ build-and-deploy.ps1 deploys THIS          │
│  ├─ super-flashcards service uses THIS         │
│  ├─ LanguageLearning database                  │
│  └─ NO CHANGES during Sprint 7                 │
│                                                 │
│  dev branch (QA CODE)                           │
│  ├─ build-and-deploy-qa.ps1 deploys THIS       │
│  ├─ super-flashcards-qa service uses THIS      │
│  ├─ LanguageLearning_QA database               │
│  └─ ALL Sprint 7 work happens HERE             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Impossible to Mix Up:**

1. **Different deployment scripts:**
   - `.\build-and-deploy.ps1` → Always deploys `main` branch → Production
   - `.\build-and-deploy-qa.ps1` → Always deploys `dev` branch → QA

2. **Different Cloud Run services:**
   - `super-flashcards` → Production service (untouched)
   - `super-flashcards-qa` → QA service (Sprint 7 development)

3. **Different container tags:**
   - `:latest` → Production container (from `main` branch)
   - `:qa` → QA container (from `dev` branch)

4. **Different databases:**
   - `LanguageLearning` → Production database (untouched)
   - `LanguageLearning_QA` → QA database (Sprint 7 testing)

**Sprint 7 Workflow Enforces Isolation:**
```bash
# Step 1: Create dev branch (one time)
git checkout -b dev
git push origin dev

# Step 2: All Sprint 7 work on dev
git checkout dev
[make changes to code]
git commit -am "Add subscription system"
git push origin dev

# Step 3: Deploy to QA (from dev branch)
.\build-and-deploy-qa.ps1
# → Reads dev branch code
# → Deploys to super-flashcards-qa
# → Uses LanguageLearning_QA database

# Step 4: Test in QA
# Production is COMPLETELY UNAFFECTED

# Step 5: ONLY AFTER QA validation passes
git checkout main
git merge dev           # Bring Sprint 7 features to main
git push origin main

# Step 6: Deploy to production
.\build-and-deploy.ps1
# → Reads main branch code
# → Deploys to super-flashcards
# → Uses LanguageLearning database
```

**Safety Guarantees:**
- ✅ Production code (`main` branch) locked until Sprint 7 QA complete
- ✅ No accidental deploys to production during development
- ✅ Can't mix up QA and prod (different scripts, services, databases)
- ✅ Production users see zero changes until we're ready
- ✅ Can break QA 100 times without affecting production

---

## 🚀 Deployment Workflow

### For Sprint 7 Development:

```bash
# 1. Work on dev branch
git checkout dev

# 2. Make changes for Sprint 7
# ... code changes ...

# 3. Deploy to QA
.\build-and-deploy-qa.ps1

# 4. Test in QA environment
# https://super-flashcards-qa-xxx.run.app

# 5. If bugs found, fix and redeploy to QA
git commit -am "Fix subscription bug"
.\build-and-deploy-qa.ps1

# 6. Once QA validated, merge to main
git checkout main
git merge dev
git push origin main

# 7. Deploy to production
.\build-and-deploy.ps1
```

### Safety Benefits:

✅ **Production never touched during development**  
✅ **Can break QA without affecting users**  
✅ **Test database migrations safely**  
✅ **Validate subscription limits without real users**  
✅ **Rollback QA without prod impact**  
✅ **Parallel development possible**  

---

## 💰 Cost Considerations

### QA Environment Costs

**Google Cloud SQL QA Database:**
- **Second Database on Existing Instance:** $0/month additional
- Using `flashcards-db` instance (35.224.242.223)
- No new instance costs (just using existing capacity)
- Same tier: db-custom-1-3840 (already paid for)

**Cloud Run QA Service:**
- Same pricing as production
- $0 when not used (serverless, scales to zero)
- ~$0-5/month during active testing
- Free tier: 2 million requests/month, 360,000 GB-seconds/month

**Google Cloud Secret Manager:**
- QA Secrets: ~$0.12/month
- $0.06 per active secret version/month
- 2 secrets × $0.06 = $0.12/month

**Total Estimated Monthly Cost:** ~$0-5/month
- Most months will be $0 due to Google Cloud free tiers
- Only pay for actual compute usage during testing
- Database uses existing instance (no additional cost)

**Cost Optimization:**
- Cloud Run min-instances=0 (scale to zero automatically)
- Share OpenAI API key with production (no extra cost)
- Keep QA database long-term (it's free on existing instance)
- Only costs are minimal Cloud Run compute during active testing

---

## 🧪 QA Testing Strategy

### Phase 1: Database Migrations
1. Deploy to QA
2. Run migrations
3. Verify schema changes
4. Test backward compatibility
5. If issues: rollback QA database, fix, retry

### Phase 2: Subscription System
1. Create test users in QA
2. Test free tier limits (10 cards, 5 quizzes)
3. Test premium trial activation
4. Test subscription expiration
5. Test payment flow (Stripe test mode)

### Phase 3: Card Preferences
1. Test new user onboarding (50 default cards)
2. Test card filtering (difficulty, hashtags)
3. Test add/remove cards from deck
4. Test search by hashtag

### Phase 4: Premium Quiz
1. Test word-level tracking
2. Test performance analytics
3. Test quiz generation
4. Test free tier quiz limits

### Phase 5: Integration Testing
1. Test full user journey
2. Test edge cases
3. Load testing
4. Security testing

### Phase 6: Promote to Production
1. Final QA sign-off
2. Merge dev → main
3. Deploy to production
4. Monitor production logs
5. Rollback plan ready

---

## 🔒 Security Considerations

### QA Environment Security

✅ **Separate credentials** (flashcards_qa_user vs flashcards_user)  
✅ **Separate database** (LanguageLearning_QA vs LanguageLearning)  
✅ **Separate secrets** (db-password-qa vs db-password)  
✅ **IAM isolation** (can restrict QA service access via Google Cloud IAM)  
✅ **Test data only** (no real user data in QA)  

### Production Protection

✅ **Main branch protected** (require PR reviews before merge)  
✅ **Prod deploys from main only** (build-and-deploy.ps1)  
✅ **QA deploys from dev only** (build-and-deploy-qa.ps1)  
✅ **Separate URLs** (can't accidentally test on prod)  
✅ **Environment tagging** (code knows which env it's in)  

---

## 📝 Checklist for QA Setup

### Your Actions (User)
- [ ] **Create QA database:** `LanguageLearning_QA` on Cloud SQL instance `flashcards-db`
- [ ] **Create QA database user:** `flashcards_qa_user` with secure password
- [ ] **Copy prod data to QA database** (one-time backup/restore for testing)
- [ ] **Create Google Cloud secret:** `db-password-qa` (via gcloud or Console)
- [ ] **Provide me with:** Confirmation that QA database and secret are created
- [ ] **Decide:** Custom domain (qa.rentyourcio.com) or auto Cloud Run URL?
- [ ] **Confirm:** Budget approval for ~$0-5/month QA costs (minimal)

### My Actions (AI)
- [ ] Create `build-and-deploy-qa.ps1` script
- [ ] Create `cloudbuild-qa.yaml` configuration
- [ ] Create git `dev` branch
- [ ] Add environment detection to code
- [ ] Create `docs/QA_TESTING_GUIDE.md`
- [ ] Update `.gitignore` for QA-specific files
- [ ] Test QA deployment
- [ ] Validate QA environment works
- [ ] Document QA access for Sprint 7 work

---

## ⏱️ Timeline Estimate

### Setup Phase (Before Sprint 7)
- **Your actions:** 1-2 hours (database setup on Cloud SQL, secrets)
- **My actions:** 1 hour (scripts, configs, docs)
- **Testing:** 30 minutes (validate QA works)
- **Total:** ~3 hours

### Sprint 7 Usage
- **Week 1:** Heavy QA use (database migrations, subscription system)
- **Week 2:** Moderate QA use (quiz testing, bug fixes)
- **Post-Sprint:** Keep long-term (it's free on existing Cloud SQL instance)

---

## 🎯 Success Criteria

### QA Environment is Ready When
✅ Can deploy to QA without touching production  
✅ QA has separate database with test data on same Cloud SQL instance  
✅ QA has separate Cloud Run service URL (auto or custom)  
✅ QA uses separate Google Cloud secrets  
✅ Can break QA without affecting users  
✅ Can rollback QA independently  
✅ Dev branch → QA, Main branch → Prod  

---

## 🚨 Rollback Plan

### If QA Deployment Has Issues

**Database Rollback:**
```sql
-- Connect to Cloud SQL instance flashcards-db
-- Drop QA database if corrupted
DROP DATABASE LanguageLearning_QA;

-- Restore from backup
-- Use Cloud SQL backup/restore in Google Cloud Console
```

**Cloud Run Rollback:**
```bash
# List revisions
gcloud run revisions list --service=super-flashcards-qa --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic super-flashcards-qa \
    --to-revisions=super-flashcards-qa-00001=100 \
    --region=us-central1
```

**If QA Setup Completely Fails:**

**Option 1: Delay Sprint 7**
- Fix QA setup first
- Don't risk production

**Option 2: Use Production with Extreme Care**
- Deploy small changes with immediate rollback ready
- Test locally more extensively
- Higher risk, not recommended

**Option 3: Local Development Only**
- Test everything locally
- Deploy to prod only when 100% confident
- No QA environment
- Highest risk

**Recommendation:** Invest 3 hours in QA setup now, save days of potential production issues later.

---

## 📞 Next Steps

**Once you provide:**
1. Confirmation that `LanguageLearning_QA` database is created on `flashcards-db`
2. Confirmation that Google Cloud secret `db-password-qa` is created
3. Domain preference (auto Cloud Run URL or custom qa.rentyourcio.com)

**I will immediately:**
1. Create all QA deployment scripts
2. Set up git branch strategy
3. Configure Cloud Build for QA
4. Test QA deployment
5. Provide you with QA access credentials
6. Begin Sprint 7 work in QA environment

---

## 📚 Additional Resources

**Google Cloud SQL Documentation:**
- <https://cloud.google.com/sql/docs>

**Google Cloud Run Documentation:**
- <https://cloud.google.com/run/docs/deploying>

**Google Cloud SQL Backup/Restore:**
- <https://cloud.google.com/sql/docs/sqlserver/backup-recovery/backing-up>

**Google Secret Manager:**
- <https://cloud.google.com/secret-manager/docs/creating-and-accessing-secrets>

**Git Branch Strategy:**
- <https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows>

---

**Status:** Awaiting your input on QA database and secrets  
**Next:** I'll create all QA infrastructure once you confirm  
**Timeline:** Can start Sprint 7 in QA environment within ~3 hours of your setup  

**Ready to proceed when you are!** 🚀
