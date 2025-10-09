# Google Workspace SMTP Diagnostic Tool
# This script helps diagnose specific authentication issues

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Google Workspace SMTP Diagnostics" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Your current configuration (copy from backup script)
$EmailConfig = @{
    Username = "backup-system@rentyourcio.com"
    Password = "bzox ooxo tkqh aybc"  # Your current App Password
    SMTPServer = "smtp.gmail.com"
    SMTPPort = 587
}

Write-Host "Analyzing your Google Workspace configuration..." -ForegroundColor Yellow
Write-Host ""

# Check 1: App Password format
Write-Host "🔍 Checking App Password format..." -ForegroundColor White

$CleanPassword = $EmailConfig.Password -replace '\s', ''
$OriginalLength = $EmailConfig.Password.Length
$CleanLength = $CleanPassword.Length

Write-Host "   Original: '$($EmailConfig.Password)' (Length: $OriginalLength)" -ForegroundColor Gray
Write-Host "   Clean:    '$CleanPassword' (Length: $CleanLength)" -ForegroundColor Gray

if ($CleanLength -eq 16) {
    Write-Host "   ✅ App Password length is correct (16 characters)" -ForegroundColor Green
} else {
    Write-Host "   ❌ App Password should be exactly 16 characters" -ForegroundColor Red
    Write-Host "   Expected: 16, Got: $CleanLength" -ForegroundColor Red
}

if ($EmailConfig.Password -match '\s') {
    Write-Host "   ⚠️  App Password contains spaces - this is normal but will be cleaned" -ForegroundColor Yellow
} else {
    Write-Host "   ℹ️  App Password has no spaces" -ForegroundColor Cyan
}

Write-Host ""

# Check 2: Email domain validation
Write-Host "🔍 Checking email domain..." -ForegroundColor White

if ($EmailConfig.Username -match '@rentyourcio\.com$') {
    Write-Host "   ✅ Username uses correct domain: @rentyourcio.com" -ForegroundColor Green
} else {
    Write-Host "   ❌ Username should end with @rentyourcio.com" -ForegroundColor Red
    Write-Host "   Current: $($EmailConfig.Username)" -ForegroundColor Red
}

Write-Host ""

# Check 3: Test SMTP connection without authentication
Write-Host "🔍 Testing SMTP server connectivity..." -ForegroundColor White

try {
    $TcpClient = New-Object System.Net.Sockets.TcpClient
    $TcpClient.Connect($EmailConfig.SMTPServer, $EmailConfig.SMTPPort)
    
    if ($TcpClient.Connected) {
        Write-Host "   ✅ Can connect to $($EmailConfig.SMTPServer):$($EmailConfig.SMTPPort)" -ForegroundColor Green
        $TcpClient.Close()
    }
} catch {
    Write-Host "   ❌ Cannot connect to SMTP server: $_" -ForegroundColor Red
    Write-Host "   Check your internet connection" -ForegroundColor Yellow
}

Write-Host ""

# Check 4: Test authentication specifically
Write-Host "🔍 Testing Google Workspace authentication..." -ForegroundColor White

try {
    Add-Type -AssemblyName System.Net.Mail
    Add-Type -AssemblyName System.Net
    
    $SmtpClient = New-Object System.Net.Mail.SmtpClient($EmailConfig.SMTPServer, $EmailConfig.SMTPPort)
    $SmtpClient.EnableSsl = $true
    $SmtpClient.UseDefaultCredentials = $false
    
    # Use cleaned password
    $NetworkCredential = New-Object System.Net.NetworkCredential($EmailConfig.Username, $CleanPassword)
    $SmtpClient.Credentials = $NetworkCredential
    
    # Try to authenticate by creating a minimal message
    $TestMessage = New-Object System.Net.Mail.MailMessage
    $TestMessage.From = New-Object System.Net.Mail.MailAddress($EmailConfig.Username)
    $TestMessage.To.Add($EmailConfig.Username)  # Send to self
    $TestMessage.Subject = "Auth Test - Delete This"
    $TestMessage.Body = "Authentication test - you can delete this email"
    
    Write-Host "   Attempting authentication..." -ForegroundColor Gray
    $SmtpClient.Send($TestMessage)
    
    Write-Host "   ✅ Authentication SUCCESSFUL!" -ForegroundColor Green
    Write-Host "   Your Google Workspace credentials are working" -ForegroundColor Green
    
    $TestMessage.Dispose()
    $SmtpClient.Dispose()
    
} catch {
    $ErrorMessage = $_.Exception.Message
    Write-Host "   ❌ Authentication FAILED" -ForegroundColor Red
    Write-Host "   Error: $ErrorMessage" -ForegroundColor Red
    Write-Host ""
    
    # Specific error analysis
    if ($ErrorMessage -match "5.7.0.*Authentication Required") {
        Write-Host "📋 DIAGNOSIS: Google Workspace Authentication Issue" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "This specific error means:" -ForegroundColor White
        Write-Host "1. Google rejected your username/password combination" -ForegroundColor White
        Write-Host "2. Your App Password may be incorrect or expired" -ForegroundColor White
        Write-Host "3. 2-Step Verification might not be properly enabled" -ForegroundColor White
        Write-Host ""
        Write-Host "SOLUTIONS:" -ForegroundColor Green
        Write-Host "1. Generate a NEW App Password:" -ForegroundColor White
        Write-Host "   - Go to: https://myaccount.google.com/security" -ForegroundColor Cyan
        Write-Host "   - Search for 'App passwords'" -ForegroundColor Cyan
        Write-Host "   - Delete the old password and create a new one" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "2. Verify 2-Step Verification is ON:" -ForegroundColor White
        Write-Host "   - Must be enabled for App Passwords to work" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "3. Check email address exists:" -ForegroundColor White
        Write-Host "   - Verify '$($EmailConfig.Username)' exists in your domain" -ForegroundColor Cyan
        Write-Host "   - Make sure it's not an alias" -ForegroundColor Cyan
        
    } elseif ($ErrorMessage -match "5.5.1") {
        Write-Host "📋 DIAGNOSIS: Email Address Issue" -ForegroundColor Yellow
        Write-Host "The email address doesn't exist or is incorrectly formatted" -ForegroundColor White
        
    } else {
        Write-Host "📋 DIAGNOSIS: Unknown SMTP Error" -ForegroundColor Yellow
        Write-Host "Try regenerating your App Password" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Diagnostic Complete" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Fix any issues identified above" -ForegroundColor White
Write-Host "2. Test with: test_email_config.ps1" -ForegroundColor White
Write-Host "3. Run backup with notifications" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan