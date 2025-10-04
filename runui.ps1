#!/usr/bin/env pwsh
# Language Learning Flashcards - Start UI Server
# Usage: .\runui.ps1

Write-Host "🚀 Starting Language Learning Flashcards..." -ForegroundColor Green
Write-Host "📁 Project: Super-Flashcards" -ForegroundColor Cyan
Write-Host "🌐 URL: http://localhost:8000" -ForegroundColor Yellow
Write-Host "⏹️  Stop with: Ctrl+C" -ForegroundColor Red
Write-Host ""

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

# Start the uvicorn server
try {
    Write-Host "🔄 Starting uvicorn server..." -ForegroundColor Blue
    uvicorn app.main:app --reload --host localhost --port 8000
}
catch {
    Write-Host "❌ Error starting server: $_" -ForegroundColor Red
    exit 1
}