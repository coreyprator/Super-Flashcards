# Setup script to add runui command to current session PATH
# Run this once per PowerShell session: . .\setup-runui.ps1

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$currentPath = $env:PATH

# Check if project root is already in PATH
if ($currentPath -notlike "*$projectRoot*") {
    $env:PATH = "$projectRoot;$currentPath"
    Write-Host "✅ Added $projectRoot to PATH for this session" -ForegroundColor Green
    Write-Host "💡 You can now use 'runui' from anywhere in this terminal" -ForegroundColor Cyan
} else {
    Write-Host "✅ Project already in PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Yellow
Write-Host "  runui      - Start the server" -ForegroundColor White
Write-Host "  runui.ps1  - PowerShell version" -ForegroundColor White
Write-Host "  runui.cmd  - Windows batch version" -ForegroundColor White