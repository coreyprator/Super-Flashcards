#!/usr/bin/env pwsh
# Sprint 5 Cross-Device Testing Script
# Starts backend on port 8080 and serves frontend on port 3000

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

# Get local IP address
function Get-LocalIP {
    try {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*" -and $_.IPAddress -notlike "169.254.*"}).IPAddress
        if (-not $ip) {
            # Fallback: try any active connection
            $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -notlike "10.5.*"} | Select-Object -First 1).IPAddress
        }
        return $ip
    }
    catch {
        return "localhost"
    }
}

$localIP = Get-LocalIP

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    SPRINT 5 CROSS-DEVICE TESTING            ║" -ForegroundColor Green
Write-Host "║                   Offline Sync + Mobile Ready               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🌍 NETWORK ACCESS:" -ForegroundColor Yellow
Write-Host "   Laptop URL:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "   iPhone URL:     http://$localIP`:3000" -ForegroundColor Cyan
Write-Host "   Backend API:    http://$localIP`:8080" -ForegroundColor Magenta
Write-Host ""

# Start backend if requested
if (-not $FrontendOnly) {
    Write-Host "🔧 Starting FastAPI Backend..." -ForegroundColor Green
    
    $backendProcess = Start-Process powershell -ArgumentList @(
        "-NoExit", 
        "-Command", 
        "cd 'G:\My Drive\Code\Python\Super-Flashcards\backend'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8080"
    ) -PassThru
    
    Write-Host "   Backend PID: $($backendProcess.Id)" -ForegroundColor Gray
    Start-Sleep 3
}

# Start frontend if requested  
if (-not $BackendOnly) {
    Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Green
    
    $frontendProcess = Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command", 
        "cd 'G:\My Drive\Code\Python\Super-Flashcards\frontend'; python -m http.server 3000"
    ) -PassThru
    
    Write-Host "   Frontend PID: $($frontendProcess.Id)" -ForegroundColor Gray
    Start-Sleep 2
}

Write-Host ""
Write-Host "📱 IPHONE TESTING STEPS:" -ForegroundColor Yellow
Write-Host "   1. Connect iPhone to same WiFi network as laptop" -ForegroundColor White
Write-Host "   2. Open Safari and navigate to: http://$localIP`:3000" -ForegroundColor Cyan
Write-Host "   3. Test offline functionality:" -ForegroundColor White
Write-Host "      • Turn on Airplane Mode" -ForegroundColor Gray
Write-Host "      • Create/edit flashcards" -ForegroundColor Gray  
Write-Host "      • Turn off Airplane Mode" -ForegroundColor Gray
Write-Host "      • Watch automatic sync!" -ForegroundColor Gray
Write-Host ""

Write-Host "🧪 DEBUG FEATURES:" -ForegroundColor Yellow
Write-Host "   • Check browser console for Sprint 5 logs" -ForegroundColor White
Write-Host "   • Use sync status UI in header" -ForegroundColor White
Write-Host "   • Test debug buttons in footer" -ForegroundColor White
Write-Host "   • Monitor IndexedDB in DevTools > Application" -ForegroundColor White
Write-Host ""

Write-Host "✨ CROSS-DEVICE SYNC TESTING:" -ForegroundColor Yellow
Write-Host "   □ Create flashcard on laptop → See on iPhone" -ForegroundColor White
Write-Host "   □ Create flashcard on iPhone (offline) → Sync when online" -ForegroundColor White
Write-Host "   □ Edit same card on both devices → Last edit wins" -ForegroundColor White
Write-Host "   □ Study flashcards without internet" -ForegroundColor White
Write-Host "   □ Background sync every 5 minutes" -ForegroundColor White
Write-Host ""

Write-Host "⏹️  Press Ctrl+C to stop servers" -ForegroundColor Red
Write-Host ""

# Wait for user to stop
try {
    while ($true) {
        Start-Sleep 1
    }
}
catch {
    Write-Host "`n🛑 Stopping servers..." -ForegroundColor Red
    
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "   Backend stopped" -ForegroundColor Gray
    }
    
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue  
        Write-Host "   Frontend stopped" -ForegroundColor Gray
    }
    
    Write-Host "✅ All servers stopped" -ForegroundColor Green
}