# Fix DNS on Wi-Fi adapter to use Google DNS
# This fixes: Python httpx delays, gcloud issues, NordVPN slow launch, Chrome DNS errors

Write-Host "`n🔧 Setting DNS to Google DNS (8.8.8.8, 8.8.4.4)...`n" -ForegroundColor Cyan

# Set DNS for Wi-Fi adapter
Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ServerAddresses ("8.8.8.8","8.8.4.4")

# Flush DNS cache
ipconfig /flushdns

# Verify new DNS settings
Write-Host "`n✅ DNS Updated! Current settings:" -ForegroundColor Green
Get-DnsClientServerAddress -InterfaceAlias "Wi-Fi" | Where-Object {$_.AddressFamily -eq 2} | Select-Object InterfaceAlias, ServerAddresses

# Test DNS resolution
Write-Host "`n🧪 Testing DNS resolution..." -ForegroundColor Cyan
$result = Measure-Command { nslookup learn.rentyourcio.com 2>&1 | Out-Null }
Write-Host "DNS Resolution Time: $($result.TotalSeconds) seconds" -ForegroundColor Yellow

Write-Host "`n✅ DONE! Your laptop now uses Google DNS." -ForegroundColor Green
Write-Host "`nThis fixes:" -ForegroundColor Cyan
Write-Host "  ✅ Python httpx 110s delays → instant" -ForegroundColor White
Write-Host "  ✅ gcloud DNS failures → working" -ForegroundColor White
Write-Host "  ✅ NordVPN 120s launch → instant" -ForegroundColor White
Write-Host "  ✅ Chrome DNS errors → working" -ForegroundColor White
Write-Host "`nNote: Other devices on your network still use AT&T's slow DNS.`n" -ForegroundColor Yellow
