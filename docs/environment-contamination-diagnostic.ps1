# Environment Contamination Diagnostic Script
# Purpose: Systematically test for Python environment contamination in VS Code
# Usage: Run from Super-Flashcards project root directory
# Author: GitHub Copilot + Claude collaborative session
# Date: October 5, 2025

param(
    [switch]$Detailed = $false,
    [switch]$FixMode = $false
)

Write-Host "🔍 VS Code Python Environment Contamination Diagnostic" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check current environment contamination
Write-Host "📋 TEST 1: Current Environment Contamination Check" -ForegroundColor Yellow
Write-Host "Looking for cubist_art references in environment variables..."

$contamination = @()
$envContamination = Get-ChildItem Env: | Where-Object {$_.Value -like "*cubist*"}
if ($envContamination) {
    Write-Host "❌ CONTAMINATION FOUND in environment variables:" -ForegroundColor Red
    $envContamination | ForEach-Object { 
        Write-Host "   $($_.Name): $($_.Value)" -ForegroundColor Red
        $contamination += "ENV:$($_.Name)"
    }
} else {
    Write-Host "✅ No environment variable contamination found" -ForegroundColor Green
}

# Test 2: Check PATH contamination
Write-Host ""
Write-Host "📋 TEST 2: PATH Contamination Check" -ForegroundColor Yellow
$pathContamination = $env:PATH -split ';' | Select-String cubist
if ($pathContamination) {
    Write-Host "❌ CONTAMINATION FOUND in PATH:" -ForegroundColor Red
    $pathContamination | ForEach-Object { 
        Write-Host "   $_" -ForegroundColor Red
        $contamination += "PATH:$_"
    }
} else {
    Write-Host "✅ No PATH contamination found" -ForegroundColor Green
}

# Test 3: Python executable verification
Write-Host ""
Write-Host "📋 TEST 3: Python Executable Verification" -ForegroundColor Yellow
try {
    $pythonPath = (Get-Command python -ErrorAction Stop).Source
    $expectedPath = (Resolve-Path ".\.venv\Scripts\python.exe" -ErrorAction Stop).Path
    
    Write-Host "Current Python: $pythonPath"
    Write-Host "Expected Python: $expectedPath"
    
    if ($pythonPath -eq $expectedPath) {
        Write-Host "✅ Using correct Python interpreter" -ForegroundColor Green
    } else {
        Write-Host "❌ Using WRONG Python interpreter" -ForegroundColor Red
        $contamination += "PYTHON:$pythonPath"
    }
    
    # Check Python version
    $pythonVersion = & python --version 2>&1
    Write-Host "Python Version: $pythonVersion"
    if ($pythonVersion -match "3\.12") {
        Write-Host "✅ Correct Python version (3.12)" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong Python version (expected 3.12)" -ForegroundColor Red
        $contamination += "VERSION:$pythonVersion"
    }
    
} catch {
    Write-Host "❌ Python not found or error accessing: $($_.Exception.Message)" -ForegroundColor Red
    $contamination += "PYTHON:NOT_FOUND"
}

# Test 4: Virtual Environment Status
Write-Host ""
Write-Host "📋 TEST 4: Virtual Environment Status" -ForegroundColor Yellow
if ($env:VIRTUAL_ENV) {
    $expectedVenv = (Resolve-Path ".\.venv" -ErrorAction SilentlyContinue).Path
    Write-Host "Active Virtual Environment: $env:VIRTUAL_ENV"
    Write-Host "Expected Virtual Environment: $expectedVenv"
    
    if ($env:VIRTUAL_ENV -eq $expectedVenv) {
        Write-Host "✅ Correct virtual environment activated" -ForegroundColor Green
    } else {
        Write-Host "❌ Wrong virtual environment activated" -ForegroundColor Red
        $contamination += "VENV:$env:VIRTUAL_ENV"
    }
} else {
    Write-Host "⚠️  No virtual environment activated" -ForegroundColor Yellow
    $contamination += "VENV:NOT_ACTIVATED"
}

# Test 5: Required packages check
Write-Host ""
Write-Host "📋 TEST 5: Required Packages Check" -ForegroundColor Yellow
$requiredPackages = @("fastapi", "uvicorn", "pydantic")
$missingPackages = @()

foreach ($package in $requiredPackages) {
    try {
        $packageInfo = & python -c "import $package; print($package.__version__)" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $package`: $packageInfo" -ForegroundColor Green
        } else {
            Write-Host "❌ $package`: Import failed" -ForegroundColor Red
            $missingPackages += $package
        }
    } catch {
        Write-Host "❌ $package`: Error checking" -ForegroundColor Red
        $missingPackages += $package
    }
}

if ($missingPackages.Count -gt 0) {
    $contamination += "PACKAGES:$($missingPackages -join ',')"
}

# Test 6: VS Code Workspace Settings Check
Write-Host ""
Write-Host "📋 TEST 6: VS Code Workspace Settings" -ForegroundColor Yellow
$settingsPath = ".vscode\settings.json"
if (Test-Path $settingsPath) {
    Write-Host "✅ Workspace settings found" -ForegroundColor Green
    if ($Detailed) {
        $settings = Get-Content $settingsPath | ConvertFrom-Json
        Write-Host "Python Interpreter Path: $($settings.'python.defaultInterpreterPath')" -ForegroundColor Cyan
        Write-Host "Auto Activation: $($settings.'python.terminal.activateEnvironment')" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  No workspace settings found" -ForegroundColor Yellow
    $contamination += "SETTINGS:MISSING"
}

# Test 7: Server Startup Test (Optional)
if ($Detailed) {
    Write-Host ""
    Write-Host "📋 TEST 7: Server Startup Test (30 second timeout)" -ForegroundColor Yellow
    Write-Host "Testing actual server startup - this takes ~30 seconds..."
    
    Push-Location backend
    try {
        $job = Start-Job -ScriptBlock {
            & python -m uvicorn app.main:app --host localhost --port 8001 2>&1
        }
        
        # Wait up to 30 seconds
        $timeout = 30
        $elapsed = 0
        $success = $false
        
        while ($elapsed -lt $timeout -and -not $success) {
            Start-Sleep -Seconds 2
            $elapsed += 2
            
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 2 -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ Server startup successful" -ForegroundColor Green
                    $success = $true
                }
            } catch {
                # Continue waiting
            }
        }
        
        if (-not $success) {
            Write-Host "❌ Server startup failed or timeout" -ForegroundColor Red
            $contamination += "SERVER:STARTUP_FAILED"
        }
        
    } finally {
        Stop-Job -Job $job -ErrorAction SilentlyContinue
        Remove-Job -Job $job -ErrorAction SilentlyContinue
        Pop-Location
    }
}

# Summary Report
Write-Host ""
Write-Host "🎯 DIAGNOSTIC SUMMARY" -ForegroundColor Magenta
Write-Host "===================" -ForegroundColor Magenta

if ($contamination.Count -eq 0) {
    Write-Host "✅ NO CONTAMINATION DETECTED - Environment is clean!" -ForegroundColor Green
} else {
    Write-Host "❌ CONTAMINATION DETECTED:" -ForegroundColor Red
    $contamination | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    
    if ($FixMode) {
        Write-Host ""
        Write-Host "🔧 ATTEMPTING AUTOMATED FIXES..." -ForegroundColor Yellow
        
        # Fix 1: Clean PATH
        if ($pathContamination) {
            Write-Host "Cleaning PATH of cubist_art references..."
            $cleanPath = ($env:PATH -split ';' | Where-Object { $_ -notlike '*cubist*' }) -join ';'
            $env:PATH = $cleanPath
            Write-Host "✅ PATH cleaned for current session" -ForegroundColor Green
        }
        
        # Fix 2: Activate correct venv
        if ($env:VIRTUAL_ENV -ne (Resolve-Path ".\.venv" -ErrorAction SilentlyContinue).Path) {
            Write-Host "Activating correct virtual environment..."
            try {
                & ".\\.venv\\Scripts\\Activate.ps1"
                Write-Host "✅ Virtual environment activated" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to activate virtual environment" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "⚠️  NOTE: Some fixes require VS Code restart to take full effect" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔗 For complete troubleshooting guide, see:" -ForegroundColor Cyan
Write-Host "   docs/environment-contamination-lessons-learned.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Usage Examples:" -ForegroundColor Cyan
Write-Host "   .\environment-contamination-diagnostic.ps1              # Quick check" -ForegroundColor Gray
Write-Host "   .\environment-contamination-diagnostic.ps1 -Detailed    # Full diagnostics with server test" -ForegroundColor Gray
Write-Host "   .\environment-contamination-diagnostic.ps1 -FixMode     # Attempt automated fixes" -ForegroundColor Gray