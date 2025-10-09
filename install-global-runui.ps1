# Global runui installer
# This creates a global runui command that works in any project

param(
    [switch]$Install,
    [switch]$Uninstall,
    [string]$GlobalPath = "$env:USERPROFILE\Scripts"
)

function Install-GlobalRunUI {
    Write-Host "Installing global runui command..." -ForegroundColor Green
    
    # Create Scripts directory if it doesn't exist
    if (-not (Test-Path $GlobalPath)) {
        New-Item -Path $GlobalPath -ItemType Directory -Force | Out-Null
        Write-Host "Created directory: $GlobalPath" -ForegroundColor Cyan
    }
    
    # Create the global runui.cmd
    $globalRunUIContent = @'
@echo off
REM Global runui command - works in any project directory
REM Looks for runui.cmd, runui.bat, or runui.ps1 in current directory

if exist "runui.cmd" (
    call .\runui.cmd %*
) else if exist "runui.bat" (
    call .\runui.bat %*
) else if exist "runui.ps1" (
    powershell -ExecutionPolicy Bypass -File ".\runui.ps1" %*
) else (
    echo No runui script found in current directory
    echo Looking for: runui.cmd, runui.bat, or runui.ps1
    exit /b 1
)
'@
    
    $globalRunUIPath = Join-Path $GlobalPath "runui.cmd"
    $globalRunUIContent | Out-File -FilePath $globalRunUIPath -Encoding ASCII
    
    # Check if GlobalPath is in system PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($currentPath -notlike "*$GlobalPath*") {
        Write-Host "Adding $GlobalPath to your user PATH..." -ForegroundColor Yellow
        [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$GlobalPath", "User")
        $env:PATH = "$env:PATH;$GlobalPath"
        Write-Host "Added to PATH. You may need to restart your terminal." -ForegroundColor Green
    }
    
    Write-Host "Global runui command installed!" -ForegroundColor Green
    Write-Host "Location: $globalRunUIPath" -ForegroundColor Cyan
    Write-Host "You can now type 'runui' in any project directory" -ForegroundColor Cyan
}

function Uninstall-GlobalRunUI {
    Write-Host "🗑️  Uninstalling global runui command..." -ForegroundColor Yellow
    
    $globalRunUIPath = Join-Path $GlobalPath "runui.cmd"
    if (Test-Path $globalRunUIPath) {
        Remove-Item $globalRunUIPath -Force
        Write-Host "✅ Removed: $globalRunUIPath" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No global runui found at: $globalRunUIPath" -ForegroundColor Yellow
    }
}

# Main execution
if ($Install) {
    Install-GlobalRunUI
} elseif ($Uninstall) {
    Uninstall-GlobalRunUI
} else {
    Write-Host "Global runui installer" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\install-global-runui.ps1 -Install    # Install global runui command" -ForegroundColor White
    Write-Host "  .\install-global-runui.ps1 -Uninstall  # Remove global runui command" -ForegroundColor White
    Write-Host ""
    Write-Host "After installation, you can use 'runui' in any project directory" -ForegroundColor Cyan
}