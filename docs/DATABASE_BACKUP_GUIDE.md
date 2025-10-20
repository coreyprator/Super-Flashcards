# 🔄 Database Backup Implementation Guide

**Priority:** HIGH  
**Timeline:** Implement early in Sprint 6 Phase 2  
**Estimated Time:** 1 hour  

---

## 🎯 Purpose

With Google Cloud SQL as the single source of truth for production data (755+ flashcards), automated backups are critical for:
- Data loss prevention
- Disaster recovery
- Point-in-time restoration
- Pre-deployment safety net

---

## ✅ Recommended Solution: Cloud SQL Automated Backups

### Why This Approach?
- **Built-in:** Native Cloud SQL feature
- **Reliable:** Google-managed, tested at scale
- **Cost-effective:** Included in Cloud SQL pricing
- **Easy:** Configure once, runs automatically
- **Point-in-time recovery:** Binary log support

### Configuration Steps

#### Option 1: Via Google Cloud Console (Easiest)

1. **Navigate to Cloud SQL**
   - Go to: <https://console.cloud.google.com/sql/instances>
   - Select your instance: `super-flashcards-db` (or whatever you named it)

2. **Edit Instance**
   - Click "Edit" button at top
   - Scroll to "Automated backups and high availability"

3. **Enable Automated Backups**
   - Check "Enable automated backups"
   - **Backup window:** Set to `02:00` (2 AM UTC)
     - Adjust for your timezone if needed
     - Choose off-peak hours for your users
   - **Number of backups to retain:** `30` (30 days)
   - **Enable binary logging:** Check this box
     - Required for point-in-time recovery
     - Allows restore to specific time, not just backup time

4. **Save Configuration**
   - Click "Save" at bottom
   - Wait for instance to finish updating (~2-3 minutes)

5. **Verify Setup**
   - Go to "Backups" tab in left sidebar
   - Should see "Automated backups: Enabled"
   - First backup will occur at next scheduled time

---

#### Option 2: Via gcloud CLI (Faster for scripting)

```bash
# Configure automated backups
gcloud sql instances patch super-flashcards-db \
    --backup-start-time=02:00 \
    --enable-bin-log \
    --retained-backups-count=30 \
    --project=super-flashcards-475210

# Verify configuration
gcloud sql instances describe super-flashcards-db \
    --format="table(settings.backupConfiguration)"
```

**Expected Output:**
```
BACKUP_CONFIGURATION
enabled: True
startTime: '02:00'
binaryLogEnabled: True
transactionLogRetentionDays: 7
backupRetentionSettings.retainedBackups: 30
```

---

### Backup Schedule Details

**Daily Backups:**
- **Time:** 2:00 AM UTC (adjust to your timezone preference)
- **Frequency:** Every day
- **Retention:** 30 days (configurable: 1-365 days)
- **Location:** Same region as database (us-central1)

**Point-in-Time Recovery:**
- **Window:** Last 7 days (with binary logs enabled)
- **Granularity:** Down to the second
- **Use case:** Restore to exact moment before data corruption

**Storage:**
- **Cost:** Included in Cloud SQL instance pricing (~$10/month)
- **Size:** Depends on database size (~100MB for 755 cards)
- **Compression:** Automatic

---

## 🧪 Testing Backup & Restore

**CRITICAL:** Test restore procedure BEFORE you need it!

### Test Procedure (15 minutes)

#### 1. Create Test Instance from Backup

**Via Console:**
1. Go to Cloud SQL → Backups
2. Find recent backup, click "⋮" (three dots) → "Restore"
3. Choose "Restore to a new instance"
4. Name: `super-flashcards-db-test`
5. Region: Same as production (us-central1)
6. Machine type: Smallest available (db-f1-micro for testing)
7. Click "Restore" → Wait 5-10 minutes

**Via gcloud:**
```bash
# List available backups
gcloud sql backups list --instance=super-flashcards-db

# Restore to new instance (use backup ID from list)
gcloud sql backups restore BACKUP_ID \
    --backup-instance=super-flashcards-db \
    --restore-instance=super-flashcards-db-test
```

---

#### 2. Verify Data Integrity

**Connect to test instance:**
```bash
# Get connection name
gcloud sql instances describe super-flashcards-db-test \
    --format="value(connectionName)"

# Output: super-flashcards-475210:us-central1:super-flashcards-db-test
```

**Run verification queries:**
```sql
-- Count flashcards (should be 755+)
SELECT COUNT(*) as total_cards FROM flashcards;

-- Count languages (should be 9)
SELECT COUNT(*) as total_languages FROM languages;

-- Check most recent card
SELECT TOP 1 word, language_id, created_at 
FROM flashcards 
ORDER BY created_at DESC;

-- Verify data integrity
SELECT 
    l.language_name,
    COUNT(lf.flashcard_id) as card_count
FROM languages l
LEFT JOIN language_flashcards lf ON l.id = lf.language_id
GROUP BY l.language_name
ORDER BY card_count DESC;
```

**Expected Results:**
- Total cards: 755+ (exact number from production)
- Languages: 9 (English, French, Spanish, German, Italian, Portuguese, Japanese, Korean, Chinese)
- Card counts match production

---

#### 3. Test Application Connection (Optional)

**Update connection string temporarily:**
```python
# In .env or test environment
DATABASE_URL=mssql+pyodbc://username:password@/super-flashcards-db-test?driver=ODBC+Driver+17+for+SQL+Server&server=tcp:super-flashcards-db-test-ip:1433
```

**Test API endpoints:**
```bash
# Test language list
curl https://your-test-app.com/languages

# Test flashcard retrieval
curl https://your-test-app.com/flashcards?language_id=2
```

---

#### 4. Clean Up Test Instance

**IMPORTANT:** Delete test instance to avoid charges!

**Via Console:**
1. Cloud SQL → Instances
2. Select `super-flashcards-db-test`
3. Click "Delete" → Confirm

**Via gcloud:**
```bash
gcloud sql instances delete super-flashcards-db-test --quiet
```

**Cost Note:** Test instance costs ~$0.05/hour. Delete within 1 hour to keep costs under $1.

---

## 📋 Backup Monitoring & Maintenance

### Monitor Backup Status

**Via Console:**
- Cloud SQL → Your Instance → Backups tab
- Shows: Backup time, size, status (success/failed)

**Via gcloud:**
```bash
# List recent backups
gcloud sql backups list \
    --instance=super-flashcards-db \
    --limit=10

# Get backup details
gcloud sql backups describe BACKUP_ID \
    --instance=super-flashcards-db
```

**Set up alerts:**
1. Cloud Console → Monitoring → Alerting
2. Create alert: "Cloud SQL Backup Failed"
3. Send to your email/Slack

---

### Backup Best Practices

**Regular Checks:**
- [ ] Weekly: Verify backup completed successfully
- [ ] Monthly: Test restore procedure
- [ ] Before major changes: Take manual backup
- [ ] After Sprint 6 Phase 2: Verify user data in backups

**Retention Policy:**
- **30 days:** Standard (covers accidental deletions)
- **Adjust if needed:** Regulatory requirements may need longer

**Manual Backups:**
```bash
# Before major schema changes
gcloud sql backups create \
    --instance=super-flashcards-db \
    --description="Pre-Sprint6-Phase2-Schema-Change"
```

---

## 💰 Cost Analysis

### Automated Backups Cost
**Included in Cloud SQL pricing:** $0/month additional

**Storage breakdown:**
- Database size: ~100MB (755 cards)
- 30 daily backups: ~3GB total
- Binary logs (7 days): ~200MB
- **Total storage:** ~3.2GB
- **Cost:** Included (up to instance size)

**Compare to alternatives:**
- Manual exports to Cloud Storage: +$0.10/month
- Third-party backup services: +$10-50/month
- No backups: Risk = invaluable data loss

**Recommendation:** Use built-in automated backups (free, reliable)

---

## 🚨 Disaster Recovery Scenarios

### Scenario 1: Accidental Table Drop
**Problem:** User drops `flashcards` table by mistake

**Recovery:**
1. Identify last good backup (before drop)
2. Restore to new instance
3. Export `flashcards` table
4. Import into production instance
5. **Time to recovery:** 15-30 minutes

---

### Scenario 2: Data Corruption
**Problem:** Bad script corrupts card data

**Recovery:**
1. Use point-in-time recovery
2. Restore to exact moment before corruption
3. Verify data integrity
4. Switch application to restored instance
5. **Time to recovery:** 10-20 minutes

---

### Scenario 3: Regional Outage
**Problem:** us-central1 region unavailable

**Mitigation:**
- Backups are in same region (us-central1)
- Google handles regional redundancy
- For true DR, consider cross-region replica (adds cost)

**For now:** Single-region backups are sufficient (Google's SLA: 99.95%)

---

## ✅ Implementation Checklist

**Step 1: Enable Automated Backups** (5 minutes)
- [ ] Navigate to Cloud SQL instance
- [ ] Enable automated backups
- [ ] Set backup time: 2:00 AM UTC
- [ ] Enable binary logging
- [ ] Set retention: 30 days
- [ ] Save configuration

**Step 2: Verify Configuration** (2 minutes)
- [ ] Check "Backups" tab shows enabled
- [ ] Verify backup window
- [ ] Confirm retention policy

**Step 3: Test Restore** (15 minutes)
- [ ] Wait for first backup (or create manual backup)
- [ ] Restore to test instance
- [ ] Run verification queries
- [ ] Delete test instance

**Step 4: Set Up Monitoring** (5 minutes)
- [ ] Create alert for backup failures
- [ ] Add to weekly checklist: Verify backups
- [ ] Document restore procedure

**Step 5: Update Documentation** (3 minutes)
- [ ] Add to Sprint 6 Phase 2 checklist
- [ ] Update TODO list (mark complete)
- [ ] Document connection details for emergency

**Total Time:** ~30 minutes (+ wait for first backup)

---

## 📖 Additional Resources

**Google Cloud SQL Backup Documentation:**
- Backup overview: <https://cloud.google.com/sql/docs/sqlserver/backup-recovery/backups>
- Point-in-time recovery: <https://cloud.google.com/sql/docs/sqlserver/backup-recovery/pitr>
- Best practices: <https://cloud.google.com/sql/docs/sqlserver/backup-recovery/backing-up>

**gcloud Commands Reference:**
- Backup commands: <https://cloud.google.com/sdk/gcloud/reference/sql/backups>
- Instance commands: <https://cloud.google.com/sdk/gcloud/reference/sql/instances>

---

## 🎯 Success Criteria

**Backup system is complete when:**
- ✅ Automated backups enabled
- ✅ First backup completed successfully
- ✅ Restore procedure tested and documented
- ✅ Monitoring alerts configured
- ✅ Team knows how to restore in emergency
- ✅ Backup status checked weekly

---

**Database backups: Your safety net for production data! 🛡️**
