#!/usr/bin/env pwsh
# Add Windows Defender Exclusions for Super-Flashcards Development
# This fixes 2-minute OAuth delays and 58-second card loading delays
# Must be run as Administrator

Write-Host "🛡️  Adding Windows Defender Exclusions for Development..." -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run as admin:" -ForegroundColor Yellow
    Write-Host "  1. Right-click PowerShell" -ForegroundColor Yellow
    Write-Host "  2. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "  3. Run: cd 'g:\My Drive\Code\Python\Super-Flashcards'" -ForegroundColor Yellow
    Write-Host "  4. Run: .\add-defender-exclusions.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Get paths
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source

if (-not $pythonExe) {
    Write-Host "⚠️  Warning: Python not found in PATH. Checking virtual environment..." -ForegroundColor Yellow
    $venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"
    if (Test-Path $venvPython) {
        $pythonExe = $venvPython
        Write-Host "✅ Found Python in virtual environment: $pythonExe" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: Could not find Python executable!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "📍 Project folder: $projectRoot" -ForegroundColor Cyan
Write-Host "🐍 Python executable: $pythonExe" -ForegroundColor Cyan
Write-Host ""

# Add exclusions
Write-Host "Adding exclusions..." -ForegroundColor Yellow
Write-Host ""

try {
    # Exclude Python executable (fixes OAuth delays and card loading)
    Write-Host "1️⃣  Excluding Python executable..." -ForegroundColor Cyan
    Add-MpPreference -ExclusionProcess "python.exe"
    Write-Host "   ✅ python.exe excluded" -ForegroundColor Green
    
    # Exclude project folder (fixes file operations)
    Write-Host "2️⃣  Excluding project folder..." -ForegroundColor Cyan
    Add-MpPreference -ExclusionPath $projectRoot
    Write-Host "   ✅ $projectRoot excluded" -ForegroundColor Green
    
    # Exclude Chrome (optional, helps with browser testing)
    Write-Host "3️⃣  Excluding Chrome browser..." -ForegroundColor Cyan
    Add-MpPreference -ExclusionProcess "chrome.exe"
    Write-Host "   ✅ chrome.exe excluded" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🎉 SUCCESS! Windows Defender exclusions added!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Expected improvements:" -ForegroundColor Cyan
    Write-Host "  • OAuth login: 2+ min → <5 seconds" -ForegroundColor Green
    Write-Host "  • Card loading: 58s → <1 second" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ You can now restart your development server!" -ForegroundColor Yellow
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Failed to add exclusions!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "To add manually:" -ForegroundColor Yellow
    Write-Host "  1. Open Windows Security" -ForegroundColor Yellow
    Write-Host "  2. Go to: Virus & threat protection → Manage settings" -ForegroundColor Yellow
    Write-Host "  3. Scroll to: Exclusions → Add or remove exclusions" -ForegroundColor Yellow
    Write-Host "  4. Add these exclusions:" -ForegroundColor Yellow
    Write-Host "     - Process: python.exe" -ForegroundColor Cyan
    Write-Host "     - Process: chrome.exe" -ForegroundColor Cyan
    Write-Host "     - Folder: $projectRoot" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}
