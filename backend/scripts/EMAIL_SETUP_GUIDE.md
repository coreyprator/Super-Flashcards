# Email Configuration Guide for SuperFlashcards Backup Notifications

## Google Workspace Setup for @rentyourcio.com

### Step 1: Enable 2-Factor Authentication
1. **Go to Google Admin Console** (admin.google.com)
2. **Log in with your admin account**
3. **Navigate to**: Security → 2-Step Verification
4. **Enable 2-Step Verification** for your organization (if not already enabled)

### Step 2: Create App Password for Your Account
1. **Go to**: myaccount.google.com
2. **Sign in** with your @rentyourcio.com account
3. **Navigate to**: Security → 2-Step Verification
4. **Scroll down** to "App passwords"
5. **Click** "Generate app password"
6. **Select**: Custom name → Enter "SuperFlashcards Backup"
7. **Copy the 16-character password** (format: xxxx xxxx xxxx xxxx)

### Step 3: Configure Email Settings
**Edit your backup script with these exact settings**:
```powershell
$EmailConfig = @{
    To = "your-email@rentyourcio.com"           # Your admin email
    From = "backup@rentyourcio.com"             # Or your-email@rentyourcio.com
    SMTPServer = "smtp.gmail.com"               # Google Workspace uses Gmail SMTP
    SMTPPort = 587
    Username = "your-email@rentyourcio.com"     # Your full workspace email
    Password = "xxxx xxxx xxxx xxxx"            # App Password from Step 2
}
```

### Step 4: Alternative - Service Account (Recommended for IT)
If you prefer a dedicated service account:

1. **Create service email**: backup-system@rentyourcio.com
2. **Set up 2FA** for the service account
3. **Generate App Password** for the service account
4. **Use these settings**:
```powershell
$EmailConfig = @{
    To = "admin@rentyourcio.com"                # Where notifications go
    From = "backup-system@rentyourcio.com"      # Service account
    SMTPServer = "smtp.gmail.com"
    SMTPPort = 587
    Username = "backup-system@rentyourcio.com"  # Service account
    Password = "service-app-password"           # Service account app password
}
```

### Option 2: Outlook/Hotmail
```powershell
$EmailConfig = @{
    To = "your-email@outlook.com"
    From = "your-email@outlook.com"
    SMTPServer = "smtp-mail.outlook.com"
    SMTPPort = 587
    Username = "your-email@outlook.com"
    Password = "your-password"                   # Regular password works
}
```

### Option 3: Custom Domain/Corporate Email
```powershell
$EmailConfig = @{
    To = "admin@yourdomain.com"
    From = "backup@yourdomain.com"
    SMTPServer = "mail.yourdomain.com"          # Ask your IT admin
    SMTPPort = 587                              # Usually 587 or 25
    Username = "backup@yourdomain.com"
    Password = "your-password"
}
```

## Testing Google Workspace Email Setup

### Quick Test Command
```powershell
# Test your Google Workspace email configuration
Send-MailMessage -To "your-email@rentyourcio.com" -From "your-email@rentyourcio.com" -Subject "SuperFlashcards Test" -Body "Email configuration working!" -SmtpServer "smtp.gmail.com" -Port 587 -UseSsl -Credential (Get-Credential)
```

**When prompted for credentials**:
- **Username**: your-email@rentyourcio.com
- **Password**: Your 16-character App Password (not your regular password!)

### Troubleshooting Google Workspace

**Error: "Authentication failed"**
- ✅ Verify 2FA is enabled on your account
- ✅ Double-check the App Password (16 characters, no spaces in actual use)  
- ✅ Make sure you're using your full @rentyourcio.com email address

**Error: "SMTP server requires authentication"**
- ✅ Ensure UseSsl is enabled (-UseSsl flag)
- ✅ Port should be 587 (not 25 or 465)
- ✅ Server should be smtp.gmail.com (not smtp.rentyourcio.com)

**Error: "Relay access denied"**
- ✅ Contact your Google Workspace admin
- ✅ Verify SMTP is enabled for your organization
- ✅ Check if external relay is allowed

### Complete Working Example for @rentyourcio.com
```powershell
# Replace with your actual details
$SecurePassword = ConvertTo-SecureString "your-16-char-app-password" -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential("admin@rentyourcio.com", $SecurePassword)

Send-MailMessage -To "admin@rentyourcio.com" -From "admin@rentyourcio.com" -Subject "SuperFlashcards Backup Test" -Body "This is a test of the backup notification system." -SmtpServer "smtp.gmail.com" -Port 587 -UseSsl -Credential $Credential
```

## Security Notes

- **Never commit passwords to Git!**
- Use App Passwords instead of real passwords when possible
- Consider using Windows Credential Manager for storing passwords
- Test email settings before relying on them for backup notifications

## Notification Types You'll Get

### Success Email
```
Subject: ✅ SuperFlashcards Backup SUCCESS
Body: Database backup completed successfully in 2.3 minutes
```

### Failure Email  
```
Subject: ❌ SuperFlashcards Backup FAILED
Body: Backup failed: SQL backup failed with exit code: 1
Priority: High
```

### Windows Notifications
- Toast notifications (Windows 10+)
- Fallback to message box
- Shows on desktop immediately

## File Locations

- **Logs**: `G:\My Drive\Code\Python\Super-Flashcards\backups\logs\`
- **Status**: `G:\My Drive\Code\Python\Super-Flashcards\backups\last_backup_status.txt`
- **Backups**: `G:\My Drive\Code\Python\Super-Flashcards\backups\*.bak`