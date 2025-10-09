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
    Invoke-Sqlcmd -ServerInstance $ServerInstance -Query $EnableXpCmdShell -ErrorAction Stop
    Write-Host "✓ Enabled xp_cmdshell" -ForegroundColor Green
} catch {
    Write-Host "⚠ Warning: Could not enable xp_cmdshell (run as Administrator)" -ForegroundColor Yellow
}

# Test backup
Write-Host "Running test backup..." -ForegroundColor Yellow
try {
    Invoke-Sqlcmd -ServerInstance $ServerInstance -InputFile $ScriptPath -QueryTimeout 300
    Write-Host "✓ Test backup successful!" -ForegroundColor Green
} catch {
    Write-Host "✗ Backup test failed: $_" -ForegroundColor Red
    exit 1
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
