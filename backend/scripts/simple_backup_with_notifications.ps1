# Main backup script - SQL backup then copy to Google Drive
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "SuperFlashcards Backup Process Starting" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Step 1: Run SQL backup
Write-Host "[1/2] Running SQL backup..." -ForegroundColor Yellow
try {
    $SqlResult = & sqlcmd -S localhost\SQLEXPRESS -d master -E -i "G:\My Drive\Code\Python\Super-Flashcards\backend\scripts\backup_database_fixed.sql" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "âœ… SQL backup completed successfully" -ForegroundColor Green
    } else {
        Write-Host "âŒ SQL backup failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host $SqlResult -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "âŒ SQL backup error: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Copy to Google Drive
Write-Host "[2/2] Copying to Google Drive..." -ForegroundColor Yellow
try {
    & "G:\My Drive\Code\Python\Super-Flashcards\backend\scripts\copy_backup_to_gdrive.ps1"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "âœ… Copy to Google Drive completed successfully" -ForegroundColor Green
    } else {
        Write-Host "âŒ Copy to Google Drive failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "âŒ Copy error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "=========================================" -ForegroundColor Green
Write-Host "âœ… Backup Process Completed Successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
