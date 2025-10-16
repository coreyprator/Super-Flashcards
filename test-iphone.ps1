#!/usr/bin/env pwsh
# Sprint 5 Network Testing - Simplified
# Starts both frontend and backend for iPhone access

Write-Host "🚀 Starting Super-Flashcards for Cross-Device Testing..." -ForegroundColor Green
Write-Host "📱 iPhone URL: http://172.20.2.203:3000" -ForegroundColor Yellow
Write-Host "💻 Laptop URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

# Start backend (try different ports if needed)
Write-Host "🔧 Starting Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'G:\My Drive\Code\Python\Super-Flashcards\backend'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8080" -WindowStyle Minimized

# Wait a moment for backend
Start-Sleep 2

# Start frontend
Write-Host "🌐 Starting Frontend..." -ForegroundColor Green  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'G:\My Drive\Code\Python\Super-Flashcards\frontend'; python -m http.server 3000 --bind 0.0.0.0" -WindowStyle Minimized

# Wait for servers to start
Start-Sleep 3

Write-Host ""
Write-Host "✅ Servers should be starting..." -ForegroundColor Green
Write-Host ""
Write-Host "🧪 TESTING STEPS:" -ForegroundColor Yellow
Write-Host "   1. Test laptop: http://localhost:3000" -ForegroundColor White
Write-Host "   2. Test IP:     http://172.20.2.203:3000" -ForegroundColor White  
Write-Host "   3. Test iPhone: http://172.20.2.203:3000" -ForegroundColor White
Write-Host ""
Write-Host "If step 1 works but step 2 doesn't = Windows Firewall issue" -ForegroundColor Magenta
Write-Host "If step 2 works but step 3 doesn't = Network/Hotel WiFi issue" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press any key to exit and stop servers..." -ForegroundColor Red
Read-Host

# The servers will keep running in their own windows
Write-Host "⚠️  Remember to close the server windows manually!" -ForegroundColor Yellow