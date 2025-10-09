# Simple Email Test for Google Workspace
# Tests email functionality using Windows PowerShell

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Simple Email Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$EmailConfig = @{
    To = "admin@rentyourcio.com"
    From = "backup-system@rentyourcio.com"
    SMTPServer = "smtp.gmail.com"
    SMTPPort = 587
    Username = "backup-system@rentyourcio.com"
    Password = "bzox ooxo tkqh aybc"
}

Write-Host "Testing email to: $($EmailConfig.To)" -ForegroundColor Yellow
Write-Host "From: $($EmailConfig.From)" -ForegroundColor Gray

$CleanPassword = $EmailConfig.Password -replace '\s', ''
Write-Host "Password length (cleaned): $($CleanPassword.Length) characters" -ForegroundColor Gray

$Subject = "🧪 Quick Email Test - SuperFlashcards"
$Body = @"
Quick Email Test
================

This is a simple test from your SuperFlashcards backup system.

Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Computer: $env:COMPUTERNAME

If you received this, your email notifications are working!

--
SuperFlashcards Test
"@

$EmailScript = @"
Add-Type -AssemblyName System.Net.Mail
Add-Type -AssemblyName System.Net

`$SmtpClient = New-Object System.Net.Mail.SmtpClient('$($EmailConfig.SMTPServer)', $($EmailConfig.SMTPPort))
`$SmtpClient.EnableSsl = `$true
`$SmtpClient.UseDefaultCredentials = `$false

`$NetworkCredential = New-Object System.Net.NetworkCredential('$($EmailConfig.Username)', '$CleanPassword')
`$SmtpClient.Credentials = `$NetworkCredential

`$MailMessage = New-Object System.Net.Mail.MailMessage
`$MailMessage.From = New-Object System.Net.Mail.MailAddress('$($EmailConfig.From)')
`$MailMessage.To.Add('$($EmailConfig.To)')
`$MailMessage.Subject = '$Subject'
`$MailMessage.Body = @'
$Body
'@
`$MailMessage.IsBodyHtml = `$false

try {
    `$SmtpClient.Send(`$MailMessage)
    Write-Output 'SUCCESS'
} catch {
    Write-Output "ERROR: `$(`$_.Exception.Message)"
} finally {
    `$MailMessage.Dispose()
    `$SmtpClient.Dispose()
}
"@

Write-Host "Sending test email..." -ForegroundColor Yellow

try {
    $EmailResult = powershell.exe -Command $EmailScript
    
    if ($EmailResult -eq 'SUCCESS') {
        Write-Host "✅ EMAIL SENT SUCCESSFULLY!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Check your inbox at: $($EmailConfig.To)" -ForegroundColor White
        Write-Host "Subject: $Subject" -ForegroundColor White
    } else {
        Write-Host "❌ EMAIL FAILED!" -ForegroundColor Red
        Write-Host "Error: $EmailResult" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ EMAIL TEST FAILED!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan