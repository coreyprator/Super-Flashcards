# PowerShell script to start the Super Flashcards server
# Run this from the project root directory

Write-Host "Starting Super Flashcards Development Server..." -ForegroundColor Green

# Environment Validation Function
function Test-PythonEnvironment {
    Write-Host "`n=== ENVIRONMENT VALIDATION ===" -ForegroundColor Cyan
    
    # Show current virtual environment
    if ($env:VIRTUAL_ENV) {
        Write-Host "Virtual Environment: $env:VIRTUAL_ENV" -ForegroundColor Green
    } else {
        Write-Host "Virtual Environment: NOT ACTIVATED" -ForegroundColor Red
    }
    
    # Show which python is being used
    $pythonPath = (Get-Command python -ErrorAction SilentlyContinue).Source
    Write-Host "Python Executable: $pythonPath" -ForegroundColor Yellow
    
    # Check for contamination
    $expectedPath = "G:\My Drive\Code\Python\Super-Flashcards\.venv\Scripts\python.exe"
    $pathEntries = $env:PATH -split ';' | Where-Object { $_ -like '*cubist*' }
    
    Write-Host "`nPATH Analysis:" -ForegroundColor Cyan
    if ($pathEntries) {
        Write-Host "⚠️  WARNING: Found cubist_art paths in PATH:" -ForegroundColor Red
        $pathEntries | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
        Write-Host "`n❌ ENVIRONMENT CONTAMINATION DETECTED!" -ForegroundColor Red
        Write-Host "The PATH contains references to cubist_art environment." -ForegroundColor Red
        Write-Host "This may cause unpredictable behavior." -ForegroundColor Red
        Write-Host "`nRecommended actions:" -ForegroundColor Yellow
        Write-Host "1. Close VS Code completely" -ForegroundColor Yellow
        Write-Host "2. Open new PowerShell session" -ForegroundColor Yellow
        Write-Host "3. Navigate to Super-Flashcards folder" -ForegroundColor Yellow
        Write-Host "4. Run: .\.venv\Scripts\Activate.ps1" -ForegroundColor Yellow
        Write-Host "5. Try again" -ForegroundColor Yellow
        Write-Host "`nPress Enter to continue anyway or Ctrl+C to abort..." -ForegroundColor Magenta
        Read-Host
    }
    
    if ($pythonPath -ne $expectedPath) {
        Write-Host "⚠️  WARNING: Using unexpected Python executable!" -ForegroundColor Red
        Write-Host "Expected: $expectedPath" -ForegroundColor Yellow
        Write-Host "Actual: $pythonPath" -ForegroundColor Red
        Write-Host "`nPress Enter to continue anyway or Ctrl+C to abort..." -ForegroundColor Magenta
        Read-Host
    } else {
        Write-Host "✅ Python environment looks correct!" -ForegroundColor Green
    }
    
    Write-Host "================================`n" -ForegroundColor Cyan
}

# Run environment validation
Test-PythonEnvironment

# Activate virtual environment if not already activated
if ($env:VIRTUAL_ENV -eq $null) {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & ".\\.venv\\Scripts\\Activate.ps1"
}

# Optional: Clean PATH function (uncomment if needed)
# function Clean-PathFromCubist {
#     Write-Host "Cleaning PATH from cubist_art contamination..." -ForegroundColor Yellow
#     $cleanPath = ($env:PATH -split ';' | Where-Object { $_ -notlike '*cubist*' }) -join ';'
#     $env:PATH = $cleanPath
#     Write-Host "✅ PATH cleaned. Restart recommended for full effect." -ForegroundColor Green
# }
# Uncomment the next line if you want to automatically clean PATH:
# Clean-PathFromCubist

# Change to backend directory
Set-Location ".\backend"

# Final environment check
Write-Host "Final check - Using Python: $((Get-Command python).Source)" -ForegroundColor Cyan

# Start the FastAPI server
Write-Host "Starting FastAPI server on http://localhost:8000" -ForegroundColor Cyan
python -m uvicorn app.main:app --reload --host localhost --port 8000