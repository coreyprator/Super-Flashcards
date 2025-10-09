# Manual backup test - run this to test the backup process
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Manual Backup Test" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$ProjectRoot = "G:\My Drive\Code\Python\Super-Flashcards"
$SQLBackupDir = "C:\Backups\SuperFlashcards"
$GoogleDriveDir = "$ProjectRoot\backups"

Write-Host "Backup Configuration:" -ForegroundColor Yellow
Write-Host "• SQL Backup Location: $SQLBackupDir" -ForegroundColor Gray
Write-Host "• Google Drive Location: $GoogleDriveDir" -ForegroundColor Gray
Write-Host ""

# Show current backups
Write-Host "Current SQL backups:" -ForegroundColor Green
if (Test-Path $SQLBackupDir) {
    Get-ChildItem $SQLBackupDir -Filter "*.bak" | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
        $SizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  $($_.Name) ($SizeMB MB) - $($_.LastWriteTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "  No SQL backup directory found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Current Google Drive backups:" -ForegroundColor Green
if (Test-Path $GoogleDriveDir) {
    Get-ChildItem $GoogleDriveDir -Filter "*.bak" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
        $SizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  $($_.Name) ($SizeMB MB) - $($_.LastWriteTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "  No Google Drive backup directory found" -ForegroundColor Yellow
}

Write-Host ""
$response = Read-Host "Run backup test now? (y/n)"
if ($response -eq 'y') {
    Write-Host "Running backup test..." -ForegroundColor Yellow
    
    # Run the main backup script
    $MainBackupScript = "$ProjectRoot\backend\scripts\backup_and_copy.ps1"
    if (Test-Path $MainBackupScript) {
        & $MainBackupScript
    } else {
        Write-Host "❌ Main backup script not found. Please run the setup first." -ForegroundColor Red
    }
} else {
    Write-Host "Test skipped." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"