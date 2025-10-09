@echo off
echo ========================================
echo SuperFlashcards Backup Task Setup
echo ========================================
echo.
echo This will create a scheduled task to backup your database
echo to both C:\Backups and your Google Drive folder daily at 2 AM.
echo.
pause

PowerShell.exe -ExecutionPolicy Bypass -File "%~dp0setup_scheduled_backup.ps1"

pause