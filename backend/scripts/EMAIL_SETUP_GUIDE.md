# Email Configuration Guide for SuperFlashcards Backup Notifications

## Quick Setup Options

### Option 1: Gmail (Recommended)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings → Security → 2-Step Verification → App passwords
   - Generate password for "SuperFlashcards Backup"
   - Copy the 16-character password

3. **Edit the backup script**:
   ```powershell
   $EmailConfig = @{
       To = "your-email@gmail.com"              # Your email
       From = "your-email@gmail.com"            # Same email
       SMTPServer = "smtp.gmail.com"
       SMTPPort = 587
       Username = "your-email@gmail.com"        # Your Gmail
       Password = "abcd efgh ijkl mnop"         # App Password (16 chars)
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

## Testing Email Setup

Run this command to test your email configuration:
```powershell
# Test email
Send-MailMessage -To "your-email@gmail.com" -From "your-email@gmail.com" -Subject "Test" -Body "Email works!" -SmtpServer "smtp.gmail.com" -Port 587 -UseSsl -Credential (Get-Credential)
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