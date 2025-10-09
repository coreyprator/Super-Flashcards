# Simple backup setup script - minimal privileges required
$BackupDir = "C:\Backups\SuperFlashcards"
$ScriptPath = "$PSScriptRoot\backup_database.sql"
$ServerInstance = "localhost\SQLEXPRESS"
$DatabaseName = "LanguageLearning"

Write-Host "Setting up automated backups (simple version)..." -ForegroundColor Cyan

# Create backup directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "✓ Created backup directory: $BackupDir" -ForegroundColor Green
} else {
    Write-Host "✓ Backup directory exists: $BackupDir" -ForegroundColor Green
}

# Test database connection first
Write-Host "Testing database connection..." -ForegroundColor Yellow
try {
    $testQuery = "SELECT DB_NAME() AS CurrentDatabase"
    $result = & sqlcmd -S $ServerInstance -d $DatabaseName -E -Q $testQuery -h -1 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "✗ Database connection failed:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Database connection test failed: $_" -ForegroundColor Red
    exit 1
}

# Create a simplified backup script that doesn't require xp_cmdshell
$SimplifiedBackupSQL = @"
-- Simplified backup without xp_cmdshell dependency
DECLARE @BackupPath NVARCHAR(500)
DECLARE @BackupFile NVARCHAR(500)
DECLARE @DatabaseName NVARCHAR(100) = '$DatabaseName'
DECLARE @DateStamp NVARCHAR(50)

SET @DateStamp = CONVERT(NVARCHAR(50), GETDATE(), 112) + '_' + 
                 REPLACE(CONVERT(NVARCHAR(50), GETDATE(), 108), ':', '')

SET @BackupPath = '$BackupDir\'
SET @BackupFile = @BackupPath + @DatabaseName + '_' + @DateStamp + '.bak'

PRINT 'Starting backup: ' + @DatabaseName
PRINT 'Backup file: ' + @BackupFile

BACKUP DATABASE @DatabaseName
TO DISK = @BackupFile
WITH 
    FORMAT,
    INIT,
    NAME = @DatabaseName + ' Full Backup',
    COMPRESSION,
    STATS = 10,
    CHECKSUM

PRINT 'Backup completed successfully!'

-- Show backup info
SELECT TOP 1
    database_name AS 'Database',
    backup_finish_date AS 'Backup Completed',
    CAST(backup_size / 1024 / 1024 AS DECIMAL(10,2)) AS 'Size (MB)',
    CAST(compressed_backup_size / 1024 / 1024 AS DECIMAL(10,2)) AS 'Compressed Size (MB)'
FROM msdb.dbo.backupset
WHERE database_name = @DatabaseName
ORDER BY backup_finish_date DESC
"@

$SimplifiedScriptPath = "$PSScriptRoot\backup_database_simple.sql"
$SimplifiedBackupSQL | Out-File -FilePath $SimplifiedScriptPath -Encoding UTF8 -Force

# Test backup using simplified script
Write-Host "Running test backup..." -ForegroundColor Yellow
try {
    $result = & sqlcmd -S $ServerInstance -d master -E -i $SimplifiedScriptPath 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Test backup successful!" -ForegroundColor Green
        Write-Host $result -ForegroundColor Gray
    } else {
        Write-Host "✗ Backup test failed. Output:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Backup test failed: $_" -ForegroundColor Red
    exit 1
}

# Create batch file for scheduled task
$BatchContent = @"
@echo off
echo Starting SuperFlashcards database backup...
sqlcmd -S $ServerInstance -d master -E -i "$SimplifiedScriptPath" -o "$BackupDir\backup_log_%date:~-4,4%_%date:~-10,2%_%date:~-7,2%.txt"
if %ERRORLEVEL% EQU 0 (
    echo Backup completed successfully
) else (
    echo Backup failed with error level %ERRORLEVEL%
)
"@

$BatchPath = "$BackupDir\run_backup.bat"
$BatchContent | Out-File -FilePath $BatchPath -Encoding ASCII -Force
Write-Host "✓ Created batch file: $BatchPath" -ForegroundColor Green

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "✅ Basic backup setup complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Manual backup command:" -ForegroundColor Yellow
Write-Host "  sqlcmd -S $ServerInstance -d master -E -i `"$SimplifiedScriptPath`"" -ForegroundColor Gray
Write-Host ""
Write-Host "To create scheduled task (run PowerShell as Administrator):" -ForegroundColor Yellow
Write-Host "  `$Action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument '/c `"$BatchPath`"'" -ForegroundColor Gray
Write-Host "  `$Trigger = New-ScheduledTaskTrigger -Daily -At '02:00'" -ForegroundColor Gray
Write-Host "  Register-ScheduledTask -TaskName 'SuperFlashcards-DailyBackup' -Action `$Action -Trigger `$Trigger" -ForegroundColor Gray
Write-Host ""
Write-Host "Backup directory: $BackupDir" -ForegroundColor Cyan