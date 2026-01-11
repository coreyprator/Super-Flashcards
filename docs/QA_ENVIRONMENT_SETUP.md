# QA Environment Setup Guide

**Date:** November 10, 2025  
**Purpose:** Create isolated QA environment for Sprint 7 monetization testing  
**Status:** Architecture Design - Ready for Implementation

---

## 🎯 Overview

### Why QA Environment is Critical for Sprint 7

**Problem:** Sprint 7 involves monetization features with real financial implications:
- Subscription limits enforcement
- Payment processing (future)
- User data with financial records
- Cannot test in production without risking real users

**Solution:** Dedicated QA environment that mirrors production:
- Isolated Google Cloud Run service
- Separate Azure SQL database
- Separate Google Cloud Storage bucket
- Copy of production data for testing
- Independent deployment pipeline

---

## 🏗️ Architecture Design

### Current State (Production Only)

```
Production Environment:
├── Cloud Run: super-flashcards (us-central1)
├── Database: LanguageLearning on super-flashcards-server.database.windows.net
├── Storage: super-flashcards-media (GCS bucket)
└── Domain: https://super-flashcards-57478301787.us-central1.run.app
```

### Target State (Production + QA)

```
Production Environment:
├── Cloud Run: super-flashcards (us-central1)
├── Database: LanguageLearning (Azure SQL)
├── Storage: super-flashcards-media (GCS bucket)
├── Domain: https://super-flashcards-57478301787.us-central1.run.app
└── Branch: main

QA Environment:
├── Cloud Run: super-flashcards-qa (us-central1)
├── Database: LanguageLearning_QA (Azure SQL - same server)
├── Storage: super-flashcards-media-qa (GCS bucket)
├── Domain: https://super-flashcards-qa-57478301787.us-central1.run.app
└── Branch: qa (or main with different config)
```

---

## 📋 Step-by-Step Setup

### Phase 1: Azure SQL QA Database (30 minutes)

#### Step 1.1: Create QA Database

**Option A: Azure Portal (Recommended)**

1. Go to Azure Portal → SQL databases
2. Click "Create SQL database"
3. Settings:
   - **Server:** super-flashcards-server.database.windows.net (same server)
   - **Database name:** `LanguageLearning_QA`
   - **Pricing tier:** Same as production (or smaller for cost savings)
   - **Backup:** Same as production
4. Click "Create"

**Option B: Azure CLI**

```bash
# Login to Azure
az login

# Create QA database on existing server
az sql db create \
    --resource-group <your-resource-group> \
    --server super-flashcards-server \
    --name LanguageLearning_QA \
    --service-objective S0  # Adjust tier as needed

# Verify
az sql db show \
    --resource-group <your-resource-group> \
    --server super-flashcards-server \
    --name LanguageLearning_QA
```

#### Step 1.2: Copy Production Schema to QA

**Method 1: SQL Server Management Studio (SSMS)**

1. Connect to production database: `LanguageLearning`
2. Right-click → Tasks → Generate Scripts
3. Select all tables, views, stored procedures
4. Save script to file: `prod_schema.sql`
5. Connect to QA database: `LanguageLearning_QA`
6. Execute `prod_schema.sql`

**Method 2: sqlcmd (Command Line)**

```bash
# Export production schema
sqlcmd -S super-flashcards-server.database.windows.net \
    -d LanguageLearning \
    -U <username> -P <password> \
    -Q "SELECT * FROM INFORMATION_SCHEMA.TABLES" \
    -o prod_tables.txt

# Generate full schema script (manual or use tool)
# Then apply to QA database

sqlcmd -S super-flashcards-server.database.windows.net \
    -d LanguageLearning_QA \
    -U <username> -P <password> \
    -i prod_schema.sql
```

#### Step 1.3: Copy Production Data to QA

**Create Data Copy Script:** `scripts/copy_prod_to_qa.sql`

```sql
-- Copy all tables from Production to QA
-- Run this in the context of LanguageLearning_QA database

-- Copy Languages
DELETE FROM LanguageLearning_QA.dbo.Languages;
INSERT INTO LanguageLearning_QA.dbo.Languages
SELECT * FROM LanguageLearning.dbo.Languages;

-- Copy Flashcards
DELETE FROM LanguageLearning_QA.dbo.Flashcards;
INSERT INTO LanguageLearning_QA.dbo.Flashcards
SELECT * FROM LanguageLearning.dbo.Flashcards;

-- Copy Users (if exists)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    DELETE FROM LanguageLearning_QA.dbo.Users;
    INSERT INTO LanguageLearning_QA.dbo.Users
    SELECT * FROM LanguageLearning.dbo.Users;
END

-- Copy APIDebugLog (recent data only - last 7 days)
DELETE FROM LanguageLearning_QA.dbo.APIDebugLog;
INSERT INTO LanguageLearning_QA.dbo.APIDebugLog
SELECT * FROM LanguageLearning.dbo.APIDebugLog
WHERE timestamp >= DATEADD(day, -7, GETDATE());

-- Verify counts
SELECT 'Languages' as TableName, COUNT(*) as RowCount FROM Languages
UNION ALL
SELECT 'Flashcards', COUNT(*) FROM Flashcards
UNION ALL
SELECT 'Users', COUNT(*) FROM Users
UNION ALL
SELECT 'APIDebugLog', COUNT(*) FROM APIDebugLog;
```

**Run Copy Script:**

```bash
sqlcmd -S super-flashcards-server.database.windows.net \
    -d LanguageLearning_QA \
    -U <username> -P <password> \
    -i scripts/copy_prod_to_qa.sql
```

**Important:** Sanitize sensitive data if needed:

```sql
-- Anonymize user emails in QA
UPDATE LanguageLearning_QA.dbo.Users
SET email = 'qa-user-' + CAST(user_id AS VARCHAR) + '@test.com';

-- Reset passwords to test password
UPDATE LanguageLearning_QA.dbo.Users
SET password_hash = '$2b$12$TEST_HASH_HERE';
```

---

### Phase 2: Google Cloud Storage QA Bucket (15 minutes)

#### Step 2.1: Create QA Storage Bucket

```bash
# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project super-flashcards-475210

# Create QA bucket
gsutil mb -c STANDARD -l us-central1 gs://super-flashcards-media-qa

# Set public read access (same as prod)
gsutil iam ch allUsers:objectViewer gs://super-flashcards-media-qa

# Verify
gsutil ls gs://super-flashcards-media-qa
```

#### Step 2.2: Copy Production Media to QA

**Option A: Copy All Media (Slow but Complete)**

```bash
# Copy all images and audio from prod to QA
gsutil -m cp -r gs://super-flashcards-media/* gs://super-flashcards-media-qa/

# This may take a while depending on size
# Estimated time: 10-30 minutes for 800+ cards
```

**Option B: Copy Sample Data Only (Fast)**

```bash
# Copy just a sample of images for testing
gsutil -m cp gs://super-flashcards-media/images/*.png gs://super-flashcards-media-qa/images/

# Copy a sample of audio files
gsutil -m cp gs://super-flashcards-media/audio/google/*.mp3 gs://super-flashcards-media-qa/audio/google/
gsutil -m cp gs://super-flashcards-media/audio/openai/*.mp3 gs://super-flashcards-media-qa/audio/openai/
```

**Option C: Start Fresh (Fast, Test Image Generation)**

```bash
# Don't copy media - test image/audio generation in QA
# Just create the folder structure
gsutil cp /dev/null gs://super-flashcards-media-qa/images/.keep
gsutil cp /dev/null gs://super-flashcards-media-qa/audio/google/.keep
gsutil cp /dev/null gs://super-flashcards-media-qa/audio/openai/.keep
```

**Recommendation:** Use Option A for first QA setup, Option C for ongoing testing.

---

### Phase 3: Google Cloud Run QA Service (30 minutes)

#### Step 3.1: Create QA Service Configuration

**Create:** `qa.env` (Environment variables for QA)

```bash
# QA Environment Variables
# DO NOT COMMIT THIS FILE TO GIT

# Database - QA Database
DATABASE_URL=mssql+pyodbc://username:password@super-flashcards-server.database.windows.net/LanguageLearning_QA?driver=ODBC+Driver+17+for+SQL+Server

# Storage - QA Bucket
GCS_BUCKET_NAME=super-flashcards-media-qa

# OpenAI - Same as prod (or use different key if you have one)
OPENAI_API_KEY=<same-as-prod-or-different>

# Environment label
ENVIRONMENT=QA
```

#### Step 3.2: Update Deployment Script for QA

**Create:** `build-and-deploy-qa.ps1`

```powershell
# QA Deployment Script
# Deploy to super-flashcards-qa Cloud Run service

Write-Host "🚀 Building and deploying Super-Flashcards to QA environment..." -ForegroundColor Cyan

# Configuration
$PROJECT_ID = "super-flashcards-475210"
$IMAGE_NAME = "super-flashcards-qa"
$SERVICE_NAME = "super-flashcards-qa"
$REGION = "us-central1"

# Step 1: Set project
Write-Host "`n📋 Setting Google Cloud project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Step 2: Build Docker image
Write-Host "`n🔨 Building Docker image..." -ForegroundColor Yellow
docker build --platform linux/amd64 -t gcr.io/$PROJECT_ID/$IMAGE_NAME:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully" -ForegroundColor Green

# Step 3: Push to Google Container Registry
Write-Host "`n📤 Pushing image to GCR..." -ForegroundColor Yellow
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Image pushed to GCR" -ForegroundColor Green

# Step 4: Deploy to Cloud Run (QA)
Write-Host "`n🚀 Deploying to Cloud Run (QA)..." -ForegroundColor Yellow

# Get secrets from Secret Manager (same as prod but for QA env vars)
gcloud run deploy $SERVICE_NAME `
    --image gcr.io/$PROJECT_ID/$IMAGE_NAME:latest `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars="ENVIRONMENT=QA" `
    --set-secrets="DATABASE_URL=qa-database-url:latest,OPENAI_API_KEY=openai-api-key:latest,GCS_BUCKET_NAME=qa-gcs-bucket-name:latest,GCS_SERVICE_ACCOUNT_KEY=gcs-service-account-key:latest" `
    --memory 512Mi `
    --cpu 1 `
    --timeout 300s `
    --min-instances 0 `
    --max-instances 10

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cloud Run deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployed to Cloud Run (QA)" -ForegroundColor Green

# Step 5: Get service URL
Write-Host "`n🌐 Getting QA service URL..." -ForegroundColor Yellow
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"

Write-Host "`n✅ QA Deployment complete!" -ForegroundColor Green
Write-Host "🌐 QA URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "📊 View logs: gcloud run services logs read $SERVICE_NAME --region $REGION" -ForegroundColor Yellow
```

#### Step 3.3: Create QA Secrets in Google Secret Manager

```bash
# Create QA-specific secrets

# QA Database URL
echo -n "mssql+pyodbc://username:password@super-flashcards-server.database.windows.net/LanguageLearning_QA?driver=ODBC+Driver+17+for+SQL+Server" | \
gcloud secrets create qa-database-url --data-file=-

# QA GCS Bucket Name
echo -n "super-flashcards-media-qa" | \
gcloud secrets create qa-gcs-bucket-name --data-file=-

# Same OpenAI key (or create separate if desired)
# Same GCS service account key (or create separate if desired)

# Verify secrets
gcloud secrets list | grep qa
```

#### Step 3.4: Deploy QA Service

```bash
# Run QA deployment script
pwsh build-and-deploy-qa.ps1

# Or manually deploy
gcloud run deploy super-flashcards-qa \
    --image gcr.io/super-flashcards-475210/super-flashcards-qa:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars="ENVIRONMENT=QA" \
    --set-secrets="DATABASE_URL=qa-database-url:latest,OPENAI_API_KEY=openai-api-key:latest,GCS_BUCKET_NAME=qa-gcs-bucket-name:latest,GCS_SERVICE_ACCOUNT_KEY=gcs-service-account-key:latest"

# Get QA URL
gcloud run services describe super-flashcards-qa \
    --region us-central1 \
    --format="value(status.url)"
```

**QA URL will be:** `https://super-flashcards-qa-XXXXX.us-central1.run.app`

---

### Phase 4: Environment Management (15 minutes)

#### Step 4.1: Add Environment Indicator to Frontend

**Update:** `frontend/index.html`

Add environment badge to header:

```html
<!-- After app version badge -->
<span id="env-badge" class="env-badge" style="display: none;"></span>

<script>
    // Show environment badge if not production
    const hostname = window.location.hostname;
    const envBadge = document.getElementById('env-badge');
    
    if (hostname.includes('super-flashcards-qa')) {
        envBadge.textContent = 'QA';
        envBadge.style.display = 'inline-block';
        envBadge.className = 'env-badge env-qa';
    } else if (hostname.includes('localhost')) {
        envBadge.textContent = 'LOCAL';
        envBadge.style.display = 'inline-block';
        envBadge.className = 'env-badge env-local';
    }
</script>
```

**Update:** `frontend/styles.css`

```css
/* Environment badges */
.env-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    margin-left: 10px;
}

.env-qa {
    background: #FFA500;
    color: white;
}

.env-local {
    background: #808080;
    color: white;
}
```

#### Step 4.2: Backend Environment Detection

**Update:** `backend/app/main.py`

```python
import os

# Environment detection
ENVIRONMENT = os.getenv('ENVIRONMENT', 'PRODUCTION')

@app.get("/api/health")
def health_check():
    return {
        'status': 'healthy',
        'environment': ENVIRONMENT,
        'version': '2.6.41'
    }

# Add environment to logs
logger.info(f"🚀 Starting Super-Flashcards API [{ENVIRONMENT}]")
```

---

## 🔄 Workflow: Managing Two Environments

### Development Workflow

```
1. Develop Locally
   ↓
2. Test Locally (localhost)
   ↓
3. Deploy to QA
   ↓
4. Test in QA (https://super-flashcards-qa-XXXXX.run.app)
   ↓
5. If tests pass → Deploy to Production
   ↓
6. Test in Production (smoke tests only)
```

### Deployment Commands

**Deploy to QA:**
```bash
pwsh build-and-deploy-qa.ps1
```

**Deploy to Production:**
```bash
pwsh build-and-deploy.ps1  # Existing script
```

**Copy Fresh Data from Prod to QA (Weekly or as needed):**
```bash
sqlcmd -S super-flashcards-server.database.windows.net \
    -d LanguageLearning_QA \
    -U <username> -P <password> \
    -i scripts/copy_prod_to_qa.sql
```

### Testing Strategy

**QA Environment Tests:**
- ✅ All Playwright E2E tests
- ✅ Subscription limit testing
- ✅ Payment flow testing (when implemented)
- ✅ Data migration testing
- ✅ Performance testing
- ✅ Load testing

**Production Tests:**
- ✅ Smoke tests only (basic functionality)
- ✅ No subscription testing
- ✅ No payment testing
- ✅ Monitor for errors

---

## 📊 Cost Implications

### Additional Monthly Costs

**Azure SQL Database (QA):**
- **Estimated:** $5-15/month (S0 tier)
- **Optimization:** Scale down or pause when not in use

**Google Cloud Run (QA):**
- **Estimated:** $0-5/month (scales to zero when not in use)
- **Optimization:** Zero minimum instances

**Google Cloud Storage (QA):**
- **Estimated:** $1-5/month (storage + bandwidth)
- **Optimization:** Delete old test data periodically

**Total Additional Cost:** $6-25/month

**Cost Savings Tips:**
1. Pause QA database during off-hours (weekends, nights)
2. Delete QA storage after major tests
3. Use smaller database tier for QA (S0 vs S1)
4. Scale to zero for Cloud Run (already default)

---

## 🔐 Security Considerations

### Access Control

**QA Environment should:**
- ✅ Use separate database credentials
- ✅ Use separate GCS bucket
- ✅ Allow unauthenticated access (for testing)
- ✅ Use separate service account (optional)

**Production Environment should:**
- ✅ Restrict database access
- ✅ Protect GCS bucket
- ✅ Monitor access logs
- ✅ Use strong authentication

### Data Privacy

**QA Data Handling:**
- ✅ Anonymize user emails in QA
- ✅ Reset passwords in QA
- ✅ Clear QA database regularly
- ✅ Don't use real payment info

**Never:**
- ❌ Copy production payment data to QA
- ❌ Use production API keys in QA (if avoidable)
- ❌ Test with real user credentials

---

## 🧪 QA Testing Checklist

### After QA Setup Complete

**Verify QA Environment:**
- [ ] QA database exists and has data
- [ ] QA storage bucket exists
- [ ] QA Cloud Run service deployed
- [ ] QA URL accessible
- [ ] Environment badge shows "QA"
- [ ] Backend returns "QA" in health check

**Test Basic Functionality:**
- [ ] Can view flashcards
- [ ] Can create flashcard
- [ ] Can generate image
- [ ] Can generate audio
- [ ] Can browse cards
- [ ] Can study in Read mode

**Test Sprint 7 Features (After Implementation):**
- [ ] Free tier card limit (10 cards)
- [ ] Free tier quiz limit (5/day)
- [ ] Trial start works
- [ ] Card preferences work
- [ ] Quiz tracks performance
- [ ] URL sharing works

---

## 📝 Quick Reference

### Environment URLs

| Environment | URL | Database | Bucket |
|------------|-----|----------|--------|
| Production | https://super-flashcards-57478301787.us-central1.run.app | LanguageLearning | super-flashcards-media |
| QA | https://super-flashcards-qa-XXXXX.us-central1.run.app | LanguageLearning_QA | super-flashcards-media-qa |
| Local | http://localhost:8000 | LanguageLearning (local or Azure) | Local or Azure |

### Deployment Commands

```bash
# Deploy to QA
pwsh build-and-deploy-qa.ps1

# Deploy to Production
pwsh build-and-deploy.ps1

# Copy data from Prod to QA
sqlcmd -S super-flashcards-server.database.windows.net \
    -d LanguageLearning_QA -U <user> -P <pass> \
    -i scripts/copy_prod_to_qa.sql

# View QA logs
gcloud run services logs read super-flashcards-qa --region us-central1 --limit 50
```

### Database Connections

```bash
# Connect to Production database
sqlcmd -S super-flashcards-server.database.windows.net \
    -d LanguageLearning -U <user> -P <pass>

# Connect to QA database
sqlcmd -S super-flashcards-server.database.windows.net \
    -d LanguageLearning_QA -U <user> -P <pass>
```

---

## 🚀 Getting Started (Quick Start)

### Minimum Viable QA Setup (1 hour)

**If you want to start testing Sprint 7 immediately:**

1. **Create QA Database** (15 min)
   ```bash
   az sql db create --name LanguageLearning_QA --server super-flashcards-server
   ```

2. **Copy Schema** (15 min)
   - Export prod schema
   - Apply to QA database

3. **Copy Sample Data** (10 min)
   ```sql
   INSERT INTO LanguageLearning_QA.dbo.Languages 
   SELECT * FROM LanguageLearning.dbo.Languages;
   
   INSERT INTO LanguageLearning_QA.dbo.Flashcards 
   SELECT TOP 100 * FROM LanguageLearning.dbo.Flashcards;
   ```

4. **Create QA Secrets** (10 min)
   ```bash
   echo -n "QA_DB_URL" | gcloud secrets create qa-database-url --data-file=-
   echo -n "super-flashcards-media-qa" | gcloud secrets create qa-gcs-bucket-name --data-file=-
   ```

5. **Deploy to Cloud Run** (10 min)
   ```bash
   gcloud run deploy super-flashcards-qa \
       --image gcr.io/super-flashcards-475210/super-flashcards:latest \
       --set-env-vars="ENVIRONMENT=QA" \
       --set-secrets="DATABASE_URL=qa-database-url:latest,..."
   ```

**Done!** You now have a QA environment for Sprint 7 testing.

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** QA database not accessible
- **Fix:** Check firewall rules, add your IP to Azure SQL allowed list

**Issue:** Images not loading in QA
- **Fix:** Verify GCS bucket permissions, check bucket name in environment

**Issue:** Cloud Run deployment fails
- **Fix:** Check secrets exist, verify service account permissions

**Issue:** QA shows production data
- **Fix:** Verify DATABASE_URL secret points to QA database

### Rollback Plan

**If QA environment has issues:**
1. Delete QA Cloud Run service
2. Delete QA database (optional)
3. Continue testing locally
4. Try setup again

**Production is unaffected** - QA is completely isolated.

---

**Document Version:** 1.0  
**Last Updated:** November 10, 2025  
**Status:** Ready for Implementation  
**Estimated Setup Time:** 1-2 hours (depending on data copy size)
