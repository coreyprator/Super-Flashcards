# Batch Audio Generation Script
# Starts backend server and generates audio for all cards without audio

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 79) -ForegroundColor Cyan
Write-Host "BATCH AUDIO GENERATION FOR BOOTSTRAP CARDS" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

# Check if backend is already running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/languages" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend server is already running on port 8000" -ForegroundColor Green
    $backendStarted = $false
} catch {
    Write-Host "🚀 Starting backend server..." -ForegroundColor Yellow
    
    # Start backend in background
    $backendJob = Start-Job -ScriptBlock {
        Set-Location "G:\My Drive\Code\Python\Super-Flashcards\backend"
        python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    }
    
    Write-Host "⏳ Waiting for backend to start (10 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Verify it started
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/languages" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Backend server started successfully" -ForegroundColor Green
        $backendStarted = $true
    } catch {
        Write-Host "❌ Failed to start backend server" -ForegroundColor Red
        Stop-Job -Job $backendJob
        Remove-Job -Job $backendJob
        exit 1
    }
}

Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 79) -ForegroundColor Cyan
Write-Host "RUNNING BATCH AUDIO GENERATION" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

# Run the batch audio script
Set-Location "G:\My Drive\Code\Python\Super-Flashcards"
& .venv\Scripts\python.exe scripts\batch_audio_bootstrap.py

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "BATCH PROCESSING COMPLETE" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Cyan

if ($backendStarted) {
    Write-Host ""
    Write-Host "Backend server is still running in the background (Job ID: $($backendJob.Id))" -ForegroundColor Yellow
    Write-Host "To stop it, run: Stop-Job -Id $($backendJob.Id); Remove-Job -Id $($backendJob.Id)" -ForegroundColor Yellow
    Write-Host "Or just close this terminal window." -ForegroundColor Yellow
}
