# Add this to your PowerShell profile to make 'runui' work everywhere
# To find your profile path, run: echo $PROFILE
# To edit it, run: notepad $PROFILE (or create it if it doesn't exist)

function runui {
    if (Test-Path ".\runui.ps1") {
        & ".\runui.ps1"
    } elseif (Test-Path ".\runui.cmd") {
        & ".\runui.cmd"
    } elseif (Test-Path ".\runui.bat") {
        & ".\runui.bat"
    } else {
        Write-Host "No runui script found in current directory" -ForegroundColor Red
        Write-Host "Looking for: runui.ps1, runui.cmd, or runui.bat" -ForegroundColor Yellow
    }
}

Write-Host "✅ runui function loaded - you can now type 'runui' in any project directory" -ForegroundColor Green