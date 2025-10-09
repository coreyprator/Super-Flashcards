# Google Workspace App Password Account Checker
# This script helps identify which account your App Password belongs to

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Google Workspace Account Checker" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔍 Let's identify which account your App Password belongs to..." -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 To find out which account your App Password is for:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to: https://myaccount.google.com/security" -ForegroundColor Cyan
Write-Host "2. Look at the top-right corner - it shows your current account" -ForegroundColor White
Write-Host "3. Search for 'App passwords' in the page" -ForegroundColor White
Write-Host "4. You'll see which account created the App Password" -ForegroundColor White
Write-Host ""

Write-Host "🎯 Most likely your App Password belongs to one of these accounts:" -ForegroundColor Yellow
Write-Host "   - cp@rentyourcio.com (your usual account)" -ForegroundColor White
Write-Host "   - Some other account you have access to" -ForegroundColor White
Write-Host ""

Write-Host "⚡ Quick Test - Let's try sending FROM your usual account:" -ForegroundColor Green
Write-Host ""

# Test configuration with cp@rentyourcio.com as sender
$TestConfig = @{
    To = "cp@rentyourcio.com"
    From = "cp@rentyourcio.com"                    # Try sending from your account
    SMTPServer = "smtp.gmail.com"
    SMTPPort = 587
    Username = "cp@rentyourcio.com"                # Use your account
    Password = "bzox ooxo tkqh aybc"               # Your App Password
}

Write-Host "Testing with configuration:" -ForegroundColor Gray
Write-Host "  From: $($TestConfig.From)" -ForegroundColor Gray
Write-Host "  To: $($TestConfig.To)" -ForegroundColor Gray
Write-Host "  Username: $($TestConfig.Username)" -ForegroundColor Gray
Write-Host ""

$CleanPassword = $TestConfig.Password -replace '\s', ''

$Subject = "🔍 Account Test - SuperFlashcards"
$Body = @"
Account Verification Test
========================

This test email verifies which Google Workspace account your App Password belongs to.

Test Details:
- Sending FROM: $($TestConfig.From)
- Authenticating AS: $($TestConfig.Username)
- Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

If you receive this email, then your App Password belongs to: $($TestConfig.Username)

--
SuperFlashcards Account Test
"@

$EmailScript = @"
Add-Type -AssemblyName System.Net.Mail
Add-Type -AssemblyName System.Net

`$SmtpClient = New-Object System.Net.Mail.SmtpClient('$($TestConfig.SMTPServer)', $($TestConfig.SMTPPort))
`$SmtpClient.EnableSsl = `$true
`$SmtpClient.UseDefaultCredentials = `$false

`$NetworkCredential = New-Object System.Net.NetworkCredential('$($TestConfig.Username)', '$CleanPassword')
`$SmtpClient.Credentials = `$NetworkCredential

`$MailMessage = New-Object System.Net.Mail.MailMessage
`$MailMessage.From = New-Object System.Net.Mail.MailAddress('$($TestConfig.From)')
`$MailMessage.To.Add('$($TestConfig.To)')
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
    $WindowsPowerShell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
    if (Test-Path $WindowsPowerShell) {
        $EmailResult = & $WindowsPowerShell -Command $EmailScript
    } else {
        $EmailResult = powershell.exe -Command $EmailScript
    }
    
    if ($EmailResult -eq 'SUCCESS') {
        Write-Host "✅ SUCCESS! Email sent from cp@rentyourcio.com" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Your App Password belongs to: cp@rentyourcio.com" -ForegroundColor Green
        Write-Host ""
        Write-Host "✅ Check your inbox at cp@rentyourcio.com for the test email" -ForegroundColor White
        Write-Host ""
        Write-Host "📝 Update your backup script with:" -ForegroundColor Yellow
        Write-Host "   From: cp@rentyourcio.com" -ForegroundColor White
        Write-Host "   Username: cp@rentyourcio.com" -ForegroundColor White
        
    } else {
        Write-Host "❌ FAILED when sending from cp@rentyourcio.com" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error details:" -ForegroundColor Red
        Write-Host "$EmailResult" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔍 This means either:" -ForegroundColor Yellow
        Write-Host "   1. Your App Password belongs to a different account" -ForegroundColor White
        Write-Host "   2. cp@rentyourcio.com doesn't have permission to send emails" -ForegroundColor White
        Write-Host "   3. The App Password is incorrect or expired" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Check https://myaccount.google.com/security to see which account created the App Password" -ForegroundColor White
        Write-Host "   2. Try generating a new App Password from your cp@rentyourcio.com account" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Test failed with error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Account identification complete!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan