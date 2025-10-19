# Simple Batch Audio Generation Runner
# PREREQUISITE: Backend server must be running on port 8000
# 
# To start backend in another terminal:
#   cd backend
#   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 79) -ForegroundColor Cyan
Write-Host "BATCH AUDIO GENERATION FOR BOOTSTRAP CARDS" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "🔍 Checking if backend server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/languages" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Backend server is running on port 8000" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Backend server is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the backend server first:" -ForegroundColor Yellow
    Write-Host "  1. Open a new PowerShell terminal" -ForegroundColor White
    Write-Host "  2. Run these commands:" -ForegroundColor White
    Write-Host "     cd 'g:\My Drive\Code\Python\Super-Flashcards\backend'" -ForegroundColor Cyan
    Write-Host "     python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Cyan
    Write-Host "  3. Wait for 'Application startup complete' message" -ForegroundColor White
    Write-Host "  4. Then run this script again" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "RUNNING BATCH AUDIO GENERATION" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

# Run the batch audio script
Set-Location "G:\My Drive\Code\Python\Super-Flashcards"
& .venv\Scripts\python.exe scripts\batch_audio_bootstrap.py

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "COMPLETE!" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""
Write-Host "You can view your flashcards at http://localhost:8000/" -ForegroundColor Yellow
