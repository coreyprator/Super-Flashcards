$BackupDir = "C:\Backups\SuperFlashcards"
$ScriptPath = "$PSScriptRoot\backup_database.sql"
$ServerInstance = "localhost\SQLEXPRESS"
$DatabaseName = "LanguageLearning"

Write-Host "Setting up automated backups..." -ForegroundColor Cyan

# Create backup directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "✓ Created backup directory" -ForegroundColor Green
}

# Enable xp_cmdshell
$EnableXpCmdShell = @"
EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1;
RECONFIGURE;
"@

try {
    $result = & sqlcmd -S $ServerInstance -d master -E -Q $EnableXpCmdShell 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Enabled xp_cmdshell" -ForegroundColor Green
    } else {
        Write-Host "⚠ Warning: Could not enable xp_cmdshell (run as Administrator)" -ForegroundColor Yellow
        Write-Host "  This is needed for automatic cleanup of old backups" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠ Warning: Could not enable xp_cmdshell (run as Administrator)" -ForegroundColor Yellow
}

# Test backup using sqlcmd (more reliable than Invoke-Sqlcmd)
Write-Host "Running test backup..." -ForegroundColor Yellow
try {
    $result = & sqlcmd -S $ServerInstance -d master -E -i $ScriptPath -h -1 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Test backup successful!" -ForegroundColor Green
    } else {
        Write-Host "✗ Backup test failed. Output:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host "⚠ Continuing anyway - manual backup test recommended" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Backup test failed: $_" -ForegroundColor Red
    Write-Host "⚠ Continuing anyway - manual backup test recommended" -ForegroundColor Yellow
}

# Create scheduled task
$TaskName = "SuperFlashcards-DailyBackup"
$ActionScript = "sqlcmd -S $ServerInstance -d master -i `"$ScriptPath`" -o `"$BackupDir\backup_log.txt`""
$ActionScriptPath = "$BackupDir\run_backup.bat"
$ActionScript | Out-File -FilePath $ActionScriptPath -Encoding ASCII -Force

$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$ActionScriptPath`""
$Trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
$Principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

try {
    $ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($ExistingTask) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }
    
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force | Out-Null
    Write-Host "✓ Scheduled task created (daily at 2 AM)" -ForegroundColor Green
} catch {
    Write-Host "⚠ Could not create scheduled task (run as Administrator)" -ForegroundColor Yellow
}

Write-Host "`n✅ Backup setup complete!" -ForegroundColor Green
Write-Host "Backups saved to: $BackupDir" -ForegroundColor Gray
