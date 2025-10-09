@echo off
echo =====================================================
echo SuperFlashcards Backup Email Configuration Helper
echo =====================================================
echo.

echo This script will help you configure email notifications for backup alerts.
echo.
echo REQUIRED: You need a Google Workspace email account (@rentyourcio.com)
echo.
echo STEPS TO CONFIGURE:
echo.
echo 1. Open the PowerShell script:
echo    "%~dp0backup_with_google_workspace_email.ps1"
echo.
echo 2. Edit the EmailConfig section (lines 7-14) with your details:
echo    - Change "admin@rentyourcio.com" to YOUR email
echo    - Change "backup-system@rentyourcio.com" to YOUR workspace email
echo    - Replace "your-16-char-app-password-here" with your App Password
echo.
echo 3. Get your App Password from Google:
echo    a) Go to: https://myaccount.google.com/security
echo    b) Turn on 2-Step Verification (if not already on)
echo    c) Search for "App passwords"
echo    d) Generate password for "Mail"
echo    e) Copy the 16-character password (no spaces)
echo.
echo 4. Test the email configuration:
echo    Run: powershell -File "%~dp0test_email_config.ps1"
echo.

set /p choice="Press ENTER to open the PowerShell script for editing, or type 'skip' to exit: "

if /i "%choice%"=="skip" (
    echo Configuration skipped.
    goto end
)

echo Opening PowerShell script for editing...
notepad "%~dp0backup_with_google_workspace_email.ps1"

echo.
echo After editing, you can test your configuration with:
echo powershell -File "%~dp0test_email_config.ps1"
echo.

:end
pause