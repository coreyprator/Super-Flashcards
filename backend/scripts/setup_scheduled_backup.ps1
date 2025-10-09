# Create Scheduled Task for SuperFlashcards Backup
# Run this script as Administrator

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "SuperFlashcards Backup Task Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green

# Define paths
$ProjectRoot = "G:\My Drive\Code\Python\Super-Flashcards"
$SQLBackupDir = "C:\Backups\SuperFlashcards"
$GoogleDriveBackupDir = "$ProjectRoot\backups"
$BackupScript = "$ProjectRoot\backend\scripts\backup_database_fixed.sql"
$CopyScript = "$ProjectRoot\backend\scripts\copy_backup_to_gdrive.ps1"

# Verify paths exist
if (-not (Test-Path $BackupScript)) {
    Write-Host "❌ Backup script not found: $BackupScript" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backup script found" -ForegroundColor Green

# Create Google Drive backup directory
if (-not (Test-Path $GoogleDriveBackupDir)) {
    New-Item -ItemType Directory -Path $GoogleDriveBackupDir -Force | Out-Null
    Write-Host "✅ Created Google Drive backup directory: $GoogleDriveBackupDir" -ForegroundColor Green
} else {
    Write-Host "✅ Google Drive backup directory exists" -ForegroundColor Green
}

# Create the copy script
$CopyScriptContent = @"
# Copy SQL backups to Google Drive
`$SQLBackupDir = "C:\Backups\SuperFlashcards"
`$GoogleDriveDir = "$GoogleDriveBackupDir"
`$LogFile = "`$GoogleDriveDir\backup_copy_log.txt"

Write-Host "Copying SQL backups to Google Drive..." -ForegroundColor Cyan

# Use robocopy to sync backup files
`$RobocopyArgs = @(
    `$SQLBackupDir,
    `$GoogleDriveDir,
    "*.bak",
    "/MIR",        # Mirror (delete files in destination that don't exist in source)
    "/R:3",        # Retry 3 times on failed copies
    "/W:10",       # Wait 10 seconds between retries
    "/LOG+:`$LogFile",  # Append to log file
    "/TEE",        # Output to console and log
    "/NP"          # No progress (cleaner output)
)

`$Result = & robocopy @RobocopyArgs

# Robocopy exit codes: 0-7 are success, 8+ are errors
if (`$LASTEXITCODE -ge 8) {
    Write-Host "❌ Robocopy failed with exit code: `$LASTEXITCODE" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Backup files copied to Google Drive successfully" -ForegroundColor Green
}

# Show backup summary
Write-Host "`nBackup Summary:" -ForegroundColor Yellow
Write-Host "SQL Backup Directory: `$SQLBackupDir" -ForegroundColor Gray
Write-Host "Google Drive Directory: `$GoogleDriveDir" -ForegroundColor Gray

`$BackupFiles = Get-ChildItem `$GoogleDriveDir -Filter "*.bak" | Sort-Object LastWriteTime -Descending
if (`$BackupFiles) {
    Write-Host "`nLatest backup files in Google Drive:" -ForegroundColor Green
    `$BackupFiles | Select-Object -First 5 | ForEach-Object {
        `$SizeMB = [math]::Round(`$_.Length / 1MB, 2)
        Write-Host "  `$(`$_.Name) (`$SizeMB MB) - `$(`$_.LastWriteTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ No backup files found in Google Drive directory" -ForegroundColor Red
}
"@

$CopyScriptContent | Out-File -FilePath $CopyScript -Encoding UTF8 -Force
Write-Host "✅ Created copy script: $CopyScript" -ForegroundColor Green

# Use the notification-enabled backup script
$MainBackupScript = "$ProjectRoot\backend\scripts\simple_backup_with_notifications.ps1"
$MainBackupContent = @"
# Main backup script - SQL backup then copy to Google Drive
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "SuperFlashcards Backup Process Starting" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Step 1: Run SQL backup
Write-Host "[1/2] Running SQL backup..." -ForegroundColor Yellow
try {
    `$SqlResult = & sqlcmd -S localhost\SQLEXPRESS -d master -E -i "$BackupScript" 2>&1
    if (`$LASTEXITCODE -eq 0) {
        Write-Host "✅ SQL backup completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ SQL backup failed with exit code: `$LASTEXITCODE" -ForegroundColor Red
        Write-Host `$SqlResult -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ SQL backup error: `$_" -ForegroundColor Red
    exit 1
}

# Step 2: Copy to Google Drive
Write-Host "[2/2] Copying to Google Drive..." -ForegroundColor Yellow
try {
    & "$CopyScript"
    if (`$LASTEXITCODE -eq 0) {
        Write-Host "✅ Copy to Google Drive completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Copy to Google Drive failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Copy error: `$_" -ForegroundColor Red
    exit 1
}

Write-Host "=========================================" -ForegroundColor Green
Write-Host "✅ Backup Process Completed Successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
"@

$MainBackupContent | Out-File -FilePath $MainBackupScript -Encoding UTF8 -Force
Write-Host "✅ Created main backup script: $MainBackupScript" -ForegroundColor Green

# Test the backup process
Write-Host "`nTesting backup process..." -ForegroundColor Yellow
try {
    & $MainBackupScript
    Write-Host "✅ Backup test successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Backup test failed: $_" -ForegroundColor Red
    Read-Host "Press Enter to continue anyway"
}

# Create the scheduled task
Write-Host "`nCreating scheduled task..." -ForegroundColor Yellow

$TaskName = "SuperFlashcards-DailyBackup"
$TaskDescription = "Daily backup of SuperFlashcards database to Google Drive"

# Remove existing task if it exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($ExistingTask) {
    Write-Host "Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create new task
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$MainBackupScript`""
$Trigger = New-ScheduledTaskTrigger -Daily -At "02:00AM"
$Principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

try {
    Register-ScheduledTask -TaskName $TaskName -Description $TaskDescription -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force | Out-Null
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    
    # Show task details
    $Task = Get-ScheduledTask -TaskName $TaskName
    Write-Host "`nTask Details:" -ForegroundColor Cyan
    Write-Host "  Name: $($Task.TaskName)" -ForegroundColor Gray
    Write-Host "  State: $($Task.State)" -ForegroundColor Gray
    Write-Host "  Next Run: $(Get-ScheduledTaskInfo -TaskName $TaskName | Select-Object -ExpandProperty NextRunTime)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Failed to create scheduled task: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "`nBackup Configuration:" -ForegroundColor Yellow
Write-Host "• Task Name: $TaskName" -ForegroundColor Gray
Write-Host "• Schedule: Daily at 2:00 AM" -ForegroundColor Gray
Write-Host "• SQL Backups: $SQLBackupDir" -ForegroundColor Gray
Write-Host "• Google Drive: $GoogleDriveBackupDir" -ForegroundColor Gray
Write-Host "• Log Files: $GoogleDriveBackupDir\backup_copy_log.txt" -ForegroundColor Gray

Write-Host "`nTo test manually:" -ForegroundColor Yellow
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray

Write-Host "`nTo view task:" -ForegroundColor Yellow
Write-Host "  Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray

Read-Host "`nPress Enter to exit"