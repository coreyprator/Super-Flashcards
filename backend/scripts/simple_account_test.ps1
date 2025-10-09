# Simple test to identify which account your App Password belongs to
Write-Host "Testing App Password Account..." -ForegroundColor Yellow

# Test 1: Try with cp@rentyourcio.com
Write-Host "Testing if App Password belongs to: cp@rentyourcio.com" -ForegroundColor Cyan

try {
    $SecurePassword = ConvertTo-SecureString "bzoxooxotkqhaybc" -AsPlainText -Force  # Cleaned password
    $Credential = New-Object System.Management.Automation.PSCredential("cp@rentyourcio.com", $SecurePassword)
    
    Send-MailMessage -To "cp@rentyourcio.com" -From "cp@rentyourcio.com" -Subject "Test from cp@rentyourcio.com" -Body "If you receive this, your App Password belongs to cp@rentyourcio.com" -SmtpServer "smtp.gmail.com" -Port 587 -UseSsl -Credential $Credential
    
    Write-Host "✅ SUCCESS! App Password belongs to cp@rentyourcio.com" -ForegroundColor Green
    Write-Host "Check your email at cp@rentyourcio.com" -ForegroundColor White
    
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -match "5.7.0.*Authentication Required") {
        Write-Host ""
        Write-Host "🔍 Authentication failed - this means:" -ForegroundColor Yellow
        Write-Host "   1. Your App Password does NOT belong to cp@rentyourcio.com, OR" -ForegroundColor White
        Write-Host "   2. The App Password is incorrect/expired" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 SOLUTION: Generate a new App Password specifically for cp@rentyourcio.com:" -ForegroundColor Green
        Write-Host "   1. Sign in to Google as cp@rentyourcio.com" -ForegroundColor White
        Write-Host "   2. Go to: https://myaccount.google.com/security" -ForegroundColor Cyan
        Write-Host "   3. Enable 2-Step Verification (if not already on)" -ForegroundColor White
        Write-Host "   4. Search for 'App passwords'" -ForegroundColor White
        Write-Host "   5. Generate a NEW App Password for 'Mail'" -ForegroundColor White
        Write-Host "   6. Replace the password in your backup script" -ForegroundColor White
    }
}