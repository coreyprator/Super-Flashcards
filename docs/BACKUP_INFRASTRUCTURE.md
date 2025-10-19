# Backup Infrastructure Documentation

**Last Updated:** October 17, 2025  
**System:** Super-Flashcards Language Learning App

---

## 📁 Backup Locations

### **Primary Backup Location (Local)**
```
C:\Backups\SuperFlashcards\
```
- **Server:** AlienWare\SQLEXPRESS
- **Schedule:** Nightly at 2:00 AM (Scheduled Task)
- **Retention:** TBD
- **Format:** SQL Server .bak files (compressed)

### **Disaster Recovery Location (Google Drive)**
```
G:\My Drive\Code\Python\Super-Flashcards\backups\
```
- **Sync Method:** RoboCopy (automated after nightly backup)
- **Purpose:** Off-site disaster recovery
- **Cloud Sync:** Google Drive sync enabled

### **Cloud Backup Location (Google Cloud Storage)**
```
gs://super-flashcards-backups/
```
- **Region:** us-central1
- **Purpose:** Cloud SQL restore and deployment
- **Access:** Cloud SQL service account has read access

---

## 🕐 Backup Schedule

### **Nightly Automated Backup**
- **Time:** 2:00 AM daily
- **Method:** Windows Scheduled Task
- **Process:**
  1. SQL Server backup runs → `C:\Backups\SuperFlashcards\`
  2. RoboCopy syncs → `G:\My Drive\Code\Python\Super-Flashcards\backups\`
  3. Google Drive syncs to cloud

### **Manual Cloud Deployment Backup**
When deploying to Google Cloud:
1. Create compatibility level 150 backup (SQL Server 2019)
2. Save to: `C:\Backups\SuperFlashcards\LanguageLearning_CloudCompatible.bak`
3. Upload to: `gs://super-flashcards-backups/`
4. Import to Cloud SQL instance

---

## 📋 Database Information

### **Local Database**
- **Instance:** AlienWare\SQLEXPRESS
- **Database:** LanguageLearning
- **Version:** SQL Server 2022 (Compatibility Level 160)
- **Size:** ~12 MB (755 flashcards as of Oct 17, 2025)
- **Auth:** Windows Authentication

### **Cloud Database**
- **Instance:** flashcards-db
- **Project:** super-flashcards-475210
- **Region:** us-central1-a
- **Version:** SQL Server 2019 Express (Compatibility Level 150)
- **Tier:** db-custom-1-3840 (1 vCPU, 3.75 GB RAM)
- **Storage:** 10 GB SSD (auto-increase enabled)
- **Auth:** SQL Server Authentication (user: flashcards_user)

---

## 🔧 Creating Cloud-Compatible Backup

The local database runs SQL Server 2022, but Cloud SQL uses 2019 Express.  
**Compatibility level must be changed from 160 → 150 before backup.**

### **Script Location**
```
G:\My Drive\Code\Python\Super-Flashcards\backups\create_compatible_backup_v2.sql
```

### **Usage**
1. Open SQL Server Management Studio
2. Connect to: `AlienWare\SQLEXPRESS`
3. Open: `create_compatible_backup_v2.sql`
4. Execute (F5)
5. Output: `C:\Backups\SuperFlashcards\LanguageLearning_CloudCompatible.bak`

### **What It Does**
```sql
-- Change compatibility level
ALTER DATABASE LanguageLearning SET COMPATIBILITY_LEVEL = 150;

-- Create compressed backup
BACKUP DATABASE [LanguageLearning]
TO DISK = 'C:\Backups\SuperFlashcards\LanguageLearning_CloudCompatible.bak'
WITH FORMAT, INIT, COMPRESSION;
```

---

## 📤 Uploading to Cloud Storage

### **PowerShell Command**
```powershell
$env:Path += ";C:\Users\Owner\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

gsutil cp "C:\Backups\SuperFlashcards\LanguageLearning_CloudCompatible.bak" `
  gs://super-flashcards-backups/
```

### **Import to Cloud SQL**
```powershell
gcloud sql import bak flashcards-db `
  gs://super-flashcards-backups/LanguageLearning_CloudCompatible.bak `
  --database=LanguageLearning
```

---

## 🔐 Security Notes

- **Local backups:** Protected by Windows NTFS permissions
- **G: Drive:** Synced via Google Drive (encrypted in transit)
- **Cloud Storage:** Private bucket (no public access)
- **Cloud SQL:** VPC-secured, no public IP connections
- **Passwords:** Stored in 1Password ("Cloud SQL Database Password - Super Flashcards")

---

## 📊 Backup History

| Date | Event | Location | Size | Notes |
|------|-------|----------|------|-------|
| 2025-10-17 | Initial cloud backup created | C:\Backups\SuperFlashcards | 11.6 MB | 755 flashcards, compatibility level 160 |
| 2025-10-17 | Cloud-compatible backup | C:\Backups\SuperFlashcards | TBD | Compatibility level 150 for Cloud SQL 2019 |

---

## 🚨 Disaster Recovery Procedures

### **Scenario 1: Restore Local Database**
```sql
-- In SSMS
RESTORE DATABASE [LanguageLearning]
FROM DISK = 'C:\Backups\SuperFlashcards\LanguageLearning_YYYYMMDD_HHMMSS.bak'
WITH REPLACE, RECOVERY;
```

### **Scenario 2: Restore Cloud Database**
```powershell
# Ensure backup is in gs://super-flashcards-backups/
gcloud sql import bak flashcards-db gs://super-flashcards-backups/[backup-file].bak --database=LanguageLearning
```

### **Scenario 3: Rebuild from Google Drive**
1. Copy backup from `G:\My Drive\Code\Python\Super-Flashcards\backups\`
2. Place in `C:\Backups\SuperFlashcards\`
3. Follow Scenario 1 or 2 procedures

---

## 📝 Related Documentation

- **Sprint 6 Deployment Plan:** `docs/Sprint 6 Production Deployment - Final Plan.md`
- **Cloud SQL Setup:** `docs/DEPLOYMENT_QUICK_START_UPDATED.md` (if exists)
- **Database Schema:** `backend/app/models.py`
- **Backup Scripts:** `backups/create_compatible_backup_v2.sql`

---

## ✅ Checklist for Cloud Deployment

- [ ] Run `create_compatible_backup_v2.sql` in SSMS
- [ ] Verify backup created: `C:\Backups\SuperFlashcards\LanguageLearning_CloudCompatible.bak`
- [ ] Upload to Cloud Storage: `gs://super-flashcards-backups/`
- [ ] Grant Cloud SQL service account read access
- [ ] Import to Cloud SQL instance
- [ ] Verify 755 flashcards imported successfully
- [ ] Test database connection from Cloud Run

---

**END OF DOCUMENT**
