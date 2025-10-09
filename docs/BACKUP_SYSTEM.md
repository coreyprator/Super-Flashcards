# SuperFlashcards Backup System Documentation

## 🎯 **System Overview**

**Status**: ✅ **FULLY OPERATIONAL** (October 9, 2025)

The SuperFlashcards backup system provides automated daily database backups with email notifications and Google Drive synchronization.

## 📧 **Email Notification System**

### **Configuration**
- **From**: SuperFlashcards Backup System <cprator@cbsware.com>
- **To**: corey.prator@gmail.com
- **Authentication**: Google Workspace App Password
- **SMTP**: smtp.gmail.com:587 (TLS)

### **Email Types**
**Success Notifications:**
- Subject: `[SuperFlashcards] Backup SUCCESS - YYYYMMDD-HHMMSS`
- Contains: Backup timing, file counts, storage locations

**Failure Notifications:**
- Subject: `[SuperFlashcards] Backup FAILED - YYYYMMDD-HHMMSS`
- Contains: Error details, troubleshooting guidance
- Priority: High

## 🗄️ **Backup Storage**

### **Primary Storage**
- **Location**: `C:\Backups\SuperFlashcards\`
- **Format**: SQL Server .bak files
- **Naming**: `LanguageLearning_YYYYMMDD_HHMMSS.bak`
- **Retention**: Managed by SQL Server maintenance

### **Cloud Backup**
- **Location**: `G:\My Drive\Code\Python\Super-Flashcards\backups\`
- **Sync**: Automatic via robocopy
- **Files**: 20 backup files (~5.1 MB total)
- **Access**: Google Drive cloud sync

## ⏰ **Automation Schedule**

### **Scheduled Task Details**
- **Name**: SuperFlashcards-DailyBackup
- **Schedule**: Daily at 2:00 AM (Central Time)
- **User**: ALIENWARE\Owner
- **Privileges**: Highest Available
- **Execution Limit**: 72 hours
- **Battery Policy**: Runs on battery
- **Network**: Not required

### **Task Configuration**
```xml
<Command>PowerShell.exe</Command>
<Arguments>-WindowStyle Hidden -ExecutionPolicy Bypass -File "G:\My Drive\Code\Python\Super-Flashcards\backend\scripts\backup_with_google_workspace_email.ps1"</Arguments>
```

## 🔧 **Key Components**

### **Main Backup Script**
**File**: `backend\scripts\backup_with_google_workspace_email.ps1`

**Features**:
- SQL Server database backup
- Google Drive synchronization
- Email notifications (success/failure)
- Windows desktop notifications
- Comprehensive logging
- Error handling and recovery

### **SQL Backup Script**
**File**: `backend\scripts\backup_database_fixed.sql`

**Features**:
- Creates timestamped backup files
- Optimized for SQL Server Express (no compression)
- Backup verification
- Error handling

### **Scheduled Task Export**
**File**: `backups\SuperFlashcards-DailyBackup.xml`

**Purpose**: Allows task recreation on other systems

## 📊 **Current Status**

### **Last Successful Backup**
- **Date**: October 9, 2025 07:53:35
- **Duration**: < 1 minute
- **File Size**: 5.1 MB
- **Email Sent**: ✅ Success
- **Files Synced**: 20 backup files

### **Performance Metrics**
- **SQL Backup Time**: ~0.1-0.2 seconds
- **Google Drive Sync**: ~0.1-0.2 seconds
- **Email Delivery**: ~2-3 seconds
- **Total Process Time**: < 1 minute

## 🛠️ **Manual Operations**

### **Run Backup Manually**
```powershell
powershell -File "G:\My Drive\Code\Python\Super-Flashcards\backend\scripts\backup_with_google_workspace_email.ps1"
```

### **Test Email Notifications**
```powershell
powershell -File "G:\My Drive\Code\Python\Super-Flashcards\backend\scripts\simple_email_test.ps1"
```

### **View Scheduled Task**
```powershell
Get-ScheduledTask -TaskName "SuperFlashcards-DailyBackup"
schtasks /query /tn "SuperFlashcards-DailyBackup" /v
```

### **Check Backup Files**
```powershell
Get-ChildItem "C:\Backups\SuperFlashcards\" -Filter "*.bak" | Sort-Object LastWriteTime -Descending | Select-Object -First 5
Get-ChildItem "G:\My Drive\Code\Python\Super-Flashcards\backups\" -Filter "*.bak"
```

## 🔍 **Troubleshooting**

### **Email Issues**
- **App Password**: Belongs to cprator@cbsware.com
- **2-Factor Auth**: Required for App Passwords
- **SMTP Errors**: Check `EMAIL_SETUP_GUIDE.md`

### **Backup Failures**
- **SQL Server**: Verify SQLEXPRESS service running
- **Permissions**: Ensure backup directory is writable
- **Disk Space**: Check available space on C: and G: drives

### **Scheduled Task Issues**
- **Permissions**: Task runs with highest privileges
- **Execution Policy**: Bypassed in task arguments
- **User Context**: Runs as ALIENWARE\Owner

## 📁 **Related Files**

- `backend\scripts\backup_with_google_workspace_email.ps1` - Main backup script
- `backend\scripts\backup_database_fixed.sql` - SQL backup commands
- `backend\scripts\EMAIL_SETUP_GUIDE.md` - Email configuration guide
- `backend\scripts\simple_email_test.ps1` - Email testing utility
- `backups\SuperFlashcards-DailyBackup.xml` - Scheduled task export
- `backups\backup_log_*.log` - Daily backup logs

## 🎛️ **Email Filter Suggestions**

For Gmail filtering of backup notifications:

**Success Filter:**
- From: cprator@cbsware.com
- Subject contains: "Backup SUCCESS"
- Action: Label as "Backup-Success", Mark as read

**Failure Filter:**
- From: cprator@cbsware.com
- Subject contains: "Backup FAILED"
- Action: Label as "Backup-URGENT", Star, Never mark as spam

---

**Last Updated**: October 9, 2025  
**System Status**: ✅ Fully Operational  
**Next Review**: Monthly verification recommended