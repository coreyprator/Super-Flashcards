#!/usr/bin/env pwsh
# Language Learning Flashcards - Start UI Server
# Usage: .\runui.ps1

Write-Host "🚀 Starting Language Learning Flashcards..." -ForegroundColor Green
Write-Host "📁 Project: Super-Flashcards" -ForegroundColor Cyan
Write-Host "🌐 URL: http://localhost:8000" -ForegroundColor Yellow
Write-Host "⏹️  Stop with: Ctrl+C" -ForegroundColor Red
Write-Host ""

# Record start time for performance tracking
$startTime = Get-Date
$startTimeUnix = [int64](($startTime.ToUniversalTime()) - (Get-Date "1970-01-01 00:00:00")).TotalSeconds
Write-Host "⏱️  Server startup initiated at: $($startTime.ToString('HH:mm:ss.fff'))" -ForegroundColor Magenta
Write-Host "📊 Tracking startup performance... (Look for 'Application startup complete')" -ForegroundColor Magenta
Write-Host ""

# Set environment variable for the Python app to use
$env:STARTUP_TIME_UNIX = $startTimeUnix

# Get the script directory (project root)
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "backend"

# Check if backend directory exists
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Error: Backend directory not found at $backendPath" -ForegroundColor Red
    exit 1
}

# Navigate to backend directory
Set-Location $backendPath

# Check if main.py exists
$mainFile = Join-Path $backendPath "app\main.py"
if (-not (Test-Path $mainFile)) {
    Write-Host "❌ Error: app\main.py not found at $mainFile" -ForegroundColor Red
    exit 1
}

# Activate virtual environment if not already activated
if ($env:VIRTUAL_ENV -eq $null) {
    $venvPath = Join-Path $projectRoot ".venv\Scripts\Activate.ps1"
    if (Test-Path $venvPath) {
        Write-Host "🔄 Activating virtual environment..." -ForegroundColor Blue
        & $venvPath
    } else {
        Write-Host "⚠️  Warning: Virtual environment not found" -ForegroundColor Yellow
    }
}

# Start the uvicorn server using python module
try {
    Write-Host "🔄 Starting FastAPI server..." -ForegroundColor Blue
    python -m uvicorn app.main:app --reload --host localhost --port 8000
}
catch {
    Write-Host "❌ Error starting server: $_" -ForegroundColor Red
    Write-Host "💡 Make sure you're in the correct directory and virtual environment is activated" -ForegroundColor Yellow
    exit 1
}