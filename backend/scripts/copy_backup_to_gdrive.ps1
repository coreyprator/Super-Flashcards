# Copy SQL backups to Google Drive
$SQLBackupDir = "C:\Backups\SuperFlashcards"
$GoogleDriveDir = "G:\My Drive\Code\Python\Super-Flashcards\backups"
$LogFile = "$GoogleDriveDir\backup_copy_log.txt"

Write-Host "Copying SQL backups to Google Drive..." -ForegroundColor Cyan

# Use robocopy to sync backup files
$RobocopyArgs = @(
    $SQLBackupDir,
    $GoogleDriveDir,
    "*.bak",
    "/MIR",        # Mirror (delete files in destination that don't exist in source)
    "/R:3",        # Retry 3 times on failed copies
    "/W:10",       # Wait 10 seconds between retries
    "/LOG+:$LogFile",  # Append to log file
    "/TEE",        # Output to console and log
    "/NP"          # No progress (cleaner output)
)

$Result = & robocopy @RobocopyArgs

# Robocopy exit codes: 0-7 are success, 8+ are errors
if ($LASTEXITCODE -ge 8) {
    Write-Host "âŒ Robocopy failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
} else {
    Write-Host "âœ… Backup files copied to Google Drive successfully" -ForegroundColor Green
}

# Show backup summary
Write-Host "
Backup Summary:" -ForegroundColor Yellow
Write-Host "SQL Backup Directory: $SQLBackupDir" -ForegroundColor Gray
Write-Host "Google Drive Directory: $GoogleDriveDir" -ForegroundColor Gray

$BackupFiles = Get-ChildItem $GoogleDriveDir -Filter "*.bak" | Sort-Object LastWriteTime -Descending
if ($BackupFiles) {
    Write-Host "
Latest backup files in Google Drive:" -ForegroundColor Green
    $BackupFiles | Select-Object -First 5 | ForEach-Object {
        $SizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  $($_.Name) ($SizeMB MB) - $($_.LastWriteTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "âŒ No backup files found in Google Drive directory" -ForegroundColor Red
}
