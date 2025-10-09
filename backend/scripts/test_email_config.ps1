# Test Email Configuration for Google Workspace
# This script tests your email notification setup

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Email Configuration Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Load the same email configuration from the backup script
$EmailConfig = @{
    Enabled = $true
    To = "admin@rentyourcio.com"                     # WHERE notifications go
    From = "backup-system@rentyourcio.com"           # WHO sends (your workspace email)
    SMTPServer = "smtp.gmail.com"                    # Google Workspace SMTP
    SMTPPort = 587
    Username = "backup-system@rentyourcio.com"       # Your full workspace email
    Password = "bzox ooxo tkqh aybc"                 # App Password from Google Account
}

Write-Host "Testing email configuration..." -ForegroundColor Yellow
Write-Host "From: $($EmailConfig.From)" -ForegroundColor Gray
Write-Host "To: $($EmailConfig.To)" -ForegroundColor Gray
Write-Host "SMTP: $($EmailConfig.SMTPServer):$($EmailConfig.SMTPPort)" -ForegroundColor Gray
Write-Host ""

# Check configuration
if (-not $EmailConfig.Enabled) {
    Write-Host "❌ Email notifications are DISABLED" -ForegroundColor Red
    Write-Host "   Edit the script and set Enabled = `$true" -ForegroundColor Yellow
    exit 1
}

if ($EmailConfig.Password -eq "your-16-char-app-password-here") {
    Write-Host "❌ App Password NOT CONFIGURED" -ForegroundColor Red
    Write-Host "   You need to set up your Google Workspace App Password:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://myaccount.google.com/security" -ForegroundColor White
    Write-Host "   2. Enable 2-Step Verification" -ForegroundColor White
    Write-Host "   3. Search for 'App passwords'" -ForegroundColor White
    Write-Host "   4. Generate password for 'Mail'" -ForegroundColor White
    Write-Host "   5. Copy the 16-character password (no spaces)" -ForegroundColor White
    Write-Host "   6. Replace 'your-16-char-app-password-here' in the script" -ForegroundColor White
    exit 1
}

# Clean the password (remove spaces) and check length
$CleanPassword = $EmailConfig.Password -replace '\s', ''
if ($CleanPassword.Length -ne 16) {
    Write-Host "❌ App Password should be exactly 16 characters" -ForegroundColor Red
    Write-Host "   Original: '$($EmailConfig.Password)' (Length: $($EmailConfig.Password.Length))" -ForegroundColor Yellow
    Write-Host "   Clean: '$CleanPassword' (Length: $($CleanPassword.Length))" -ForegroundColor Yellow
    Write-Host "   Google App Passwords are always 16 characters with no spaces" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ App Password is configured correctly" -ForegroundColor Green
    if ($EmailConfig.Password -ne $CleanPassword) {
        Write-Host "   (Spaces will be automatically removed)" -ForegroundColor Gray
    }
}

# Test email sending
Write-Host "Attempting to send test email..." -ForegroundColor Yellow

try {
    $Subject = "🧪 SuperFlashcards Email Test"
    $Body = @"
SuperFlashcards Email Test
=========================

This is a test email from your backup notification system.

Configuration Details:
- From: $($EmailConfig.From)
- To: $($EmailConfig.To)
- SMTP Server: $($EmailConfig.SMTPServer):$($EmailConfig.SMTPPort)
- Test Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
- Computer: $env:COMPUTERNAME

If you received this email, your Google Workspace email configuration is working correctly!

Next Steps:
1. Run your backup script to test real notifications
2. Set up a scheduled task for automatic backups

--
SuperFlashcards Backup System Test
"@
    
    # Load required .NET assemblies for modern SMTP
    Add-Type -AssemblyName System.Net.Mail
    Add-Type -AssemblyName System.Net
    
    Write-Host "Connecting to $($EmailConfig.SMTPServer)..." -ForegroundColor Gray
    
    # Create SMTP client with modern security
    $SmtpClient = New-Object System.Net.Mail.SmtpClient($EmailConfig.SMTPServer, $EmailConfig.SMTPPort)
    $SmtpClient.EnableSsl = $true
    $SmtpClient.UseDefaultCredentials = $false
    
    # Create network credential (remove any spaces from App Password)
    $CleanPassword = $EmailConfig.Password -replace '\s', ''
    $NetworkCredential = New-Object System.Net.NetworkCredential($EmailConfig.Username, $CleanPassword)
    $SmtpClient.Credentials = $NetworkCredential
    
    # Create mail message
    $MailMessage = New-Object System.Net.Mail.MailMessage
    $MailMessage.From = New-Object System.Net.Mail.MailAddress($EmailConfig.From)
    $MailMessage.To.Add($EmailConfig.To)
    $MailMessage.Subject = $Subject
    $MailMessage.Body = $Body
    $MailMessage.IsBodyHtml = $false
    
    # Send test email
    $SmtpClient.Send($MailMessage)
    
    # Clean up
    $MailMessage.Dispose()
    $SmtpClient.Dispose()
    
    Write-Host "✅ TEST EMAIL SENT SUCCESSFULLY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Check your inbox at: $($EmailConfig.To)" -ForegroundColor White
    Write-Host "Subject: $Subject" -ForegroundColor White
    Write-Host ""
    Write-Host "If you don't see the email:" -ForegroundColor Yellow
    Write-Host "- Check your spam/junk folder" -ForegroundColor White
    Write-Host "- Verify the recipient email address is correct" -ForegroundColor White
    Write-Host "- Make sure the sender email exists in your domain" -ForegroundColor White
    
} catch {
    Write-Host "❌ EMAIL TEST FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common Solutions:" -ForegroundColor Yellow
    Write-Host "1. Verify your App Password is correct (16 characters)" -ForegroundColor White
    Write-Host "2. Make sure 2-Step Verification is enabled" -ForegroundColor White
    Write-Host "3. Check that both email addresses exist in @rentyourcio.com" -ForegroundColor White
    Write-Host "4. Verify you have permission to send emails" -ForegroundColor White
    Write-Host "5. Try regenerating your App Password" -ForegroundColor White
    Write-Host ""
    Write-Host "Detailed troubleshooting guide:" -ForegroundColor White
    Write-Host "G:\My Drive\Code\Python\Super-Flashcards\backend\scripts\EMAIL_SETUP_GUIDE.md" -ForegroundColor Cyan
    
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Email configuration test completed!" -ForegroundColor Green
Write-Host "Your backup notifications should work now." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan