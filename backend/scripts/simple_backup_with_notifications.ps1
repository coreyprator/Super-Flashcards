# Simple backup script with reliable notifications
Write-Host "SuperFlashcards Backup with Notifications Starting..." -ForegroundColor Cyan

# Configuration
$ProjectRoot = "G:\My Drive\Code\Python\Super-Flashcards"
$SQLBackupDir = "C:\Backups\SuperFlashcards"
$GoogleDriveDir = "$ProjectRoot\backups"
$BackupScript = "$ProjectRoot\backend\scripts\backup_database_fixed.sql"
$LogDir = "$GoogleDriveDir\logs"

# Create directories FIRST
Write-Host "Setting up directories..." -ForegroundColor Yellow
if (-not (Test-Path $GoogleDriveDir)) { 
    New-Item -ItemType Directory -Path $GoogleDriveDir -Force | Out-Null 
    Write-Host "✓ Created Google Drive directory: $GoogleDriveDir" -ForegroundColor Green
}
if (-not (Test-Path $LogDir)) { 
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null 
    Write-Host "✓ Created logs directory: $LogDir" -ForegroundColor Green
}

# Log files
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile = "$LogDir\backup_$Timestamp.log"
$StatusFile = "$GoogleDriveDir\last_backup_status.txt"

# Test log file creation
try {
    "Backup log started at $(Get-Date)" | Out-File -FilePath $LogFile -Encoding UTF8
    Write-Host "✓ Log file ready: $LogFile" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot create log file: $_" -ForegroundColor Red
    Write-Host "Continuing without file logging..." -ForegroundColor Yellow
    $LogFile = $null
}

# Function to log messages
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $LogEntry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Message"
    Write-Host $LogEntry -ForegroundColor $(if($Level -eq "ERROR") {"Red"} elseif($Level -eq "SUCCESS") {"Green"} elseif($Level -eq "WARNING") {"Yellow"} else {"White"})
    
    # Only write to file if log file is available
    if ($LogFile -and (Test-Path (Split-Path $LogFile))) {
        try {
            $LogEntry | Out-File -FilePath $LogFile -Append -Encoding UTF8
        } catch {
            # Ignore file logging errors
        }
    }
}

# Function for Windows notification
function Show-Notification {
    param([string]$Title, [string]$Message, [string]$Type = "Info")
    
    try {
        # Try Windows 10+ notification first
        $Command = @"
`$null = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
`$null = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]
`$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
`$xml.LoadXml(@'
<toast>
    <visual>
        <binding template="ToastGeneric">
            <text>$Title</text>
            <text>$Message</text>
        </binding>
    </visual>
</toast>
'@)
`$toast = [Windows.UI.Notifications.ToastNotification]::new(`$xml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('SuperFlashcards').Show(`$toast)
"@
        try {
            PowerShell -Command $Command 2>$null
        } catch {
            # Ignore toast notification errors
        }
        
        # Fallback to simple message box
        Add-Type -AssemblyName System.Windows.Forms
        $Icon = if($Type -eq "Error") { "Error" } elseif($Type -eq "Warning") { "Warning" } else { "Information" }
        [System.Windows.Forms.MessageBox]::Show($Message, $Title, "OK", $Icon) | Out-Null
        
        Write-Log "Windows notification sent: $Title" "SUCCESS"
    } catch {
        Write-Log "Failed to send Windows notification: $_" "WARNING"
    }
}

# Function to send simple email (using Windows built-in SMTP)
function Send-SimpleEmail {
    param([string]$Subject, [string]$Body, [string]$Priority = "Normal")
    
    # Basic email configuration - user needs to edit this
    $EmailConfig = @{
        To = "your-email@example.com"           # EDIT THIS
        From = "backup@yourdomain.com"          # EDIT THIS
        SMTPServer = "smtp.gmail.com"           # EDIT THIS
        SMTPPort = 587                          # EDIT THIS
        Username = "your-gmail@gmail.com"       # EDIT THIS
        Password = "your-app-password"          # EDIT THIS (use Gmail App Password)
    }
    
    # Skip email if not configured
    if ($EmailConfig.To -eq "your-email@example.com") {
        Write-Log "Email not configured, skipping email notification" "WARNING"
        return
    }
    
    try {
        $SMTPClient = New-Object System.Net.Mail.SmtpClient($EmailConfig.SMTPServer, $EmailConfig.SMTPPort)
        $SMTPClient.EnableSsl = $true
        $SMTPClient.Credentials = New-Object System.Net.NetworkCredential($EmailConfig.Username, $EmailConfig.Password)
        
        $MailMessage = New-Object System.Net.Mail.MailMessage
        $MailMessage.From = $EmailConfig.From
        $MailMessage.To.Add($EmailConfig.To)
        $MailMessage.Subject = $Subject
        $MailMessage.Body = $Body
        $MailMessage.Priority = $Priority
        
        $SMTPClient.Send($MailMessage)
        Write-Log "Email notification sent successfully" "SUCCESS"
        
        $MailMessage.Dispose()
        $SMTPClient.Dispose()
    } catch {
        Write-Log "Failed to send email: $_" "WARNING"
    }
}

# Start backup process
$StartTime = Get-Date
$Success = $true
$Errors = @()

Write-Log "========== BACKUP PROCESS STARTING ==========" "INFO"

try {
    # Step 1: SQL Backup
    Write-Log "[1/2] Running SQL Server backup..." "INFO"
    $SqlStart = Get-Date
    $SqlResult = & sqlcmd -S localhost\SQLEXPRESS -d master -E -i $BackupScript 2>&1
    $SqlEnd = Get-Date
    $SqlDuration = ($SqlEnd - $SqlStart).TotalSeconds
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "SQL backup completed in $([math]::Round($SqlDuration, 1)) seconds" "SUCCESS"
    } else {
        $ErrorMsg = "SQL backup failed with exit code: $LASTEXITCODE"
        Write-Log $ErrorMsg "ERROR"
        $Errors += $ErrorMsg
        $Success = $false
    }
    
    # Step 2: Copy to Google Drive
    Write-Log "[2/2] Copying to Google Drive..." "INFO"
    $CopyStart = Get-Date
    
    $RobocopyResult = & robocopy $SQLBackupDir $GoogleDriveDir "*.bak" /MIR /R:3 /W:10 /NP 2>&1
    $CopyEnd = Get-Date
    $CopyDuration = ($CopyEnd - $CopyStart).TotalSeconds
    
    if ($LASTEXITCODE -le 7) {
        Write-Log "Copy to Google Drive completed in $([math]::Round($CopyDuration, 1)) seconds" "SUCCESS"
    } else {
        $ErrorMsg = "Copy failed with exit code: $LASTEXITCODE"
        Write-Log $ErrorMsg "ERROR"
        $Errors += $ErrorMsg
        $Success = $false
    }
    
} catch {
    $ErrorMsg = "Unexpected error: $_"
    Write-Log $ErrorMsg "ERROR"
    $Errors += $ErrorMsg
    $Success = $false
}

# Calculate total time
$TotalDuration = (Get-Date) - $StartTime

# Write status file
$StatusContent = @"
SuperFlashcards Backup Status
=============================
Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Status: $(if($Success) { "SUCCESS" } else { "FAILED" })
Duration: $([math]::Round($TotalDuration.TotalMinutes, 1)) minutes
Computer: $env:COMPUTERNAME
$(if($Errors.Count -gt 0) { "Errors: " + ($Errors -join "; ") })

SQL Backup Files: $(if(Test-Path $SQLBackupDir) { (Get-ChildItem $SQLBackupDir -Filter "*.bak").Count } else { "0" })
Google Drive Files: $(if(Test-Path $GoogleDriveDir) { (Get-ChildItem $GoogleDriveDir -Filter "*.bak").Count } else { "0" })

Latest backup files:
$(Get-ChildItem $GoogleDriveDir -Filter "*.bak" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 3 | ForEach-Object { "  $($_.Name) - $($_.LastWriteTime)" })
"@

$StatusContent | Out-File -FilePath $StatusFile -Encoding UTF8

Write-Log "========== BACKUP PROCESS COMPLETED ==========" "INFO"

# Send notifications
if ($Success) {
    $Title = "SuperFlashcards Backup SUCCESS"
    $Message = "Database backup completed successfully in $([math]::Round($TotalDuration.TotalMinutes, 1)) minutes"
    Write-Log "Backup completed successfully!" "SUCCESS"
    
    Show-Notification -Title $Title -Message $Message -Type "Info"
    Send-SimpleEmail -Subject "✅ $Title" -Body "$Message`n`nSee attached status file for details." -Priority "Normal"
    
} else {
    $Title = "SuperFlashcards Backup FAILED"
    $Message = "Backup failed: $($Errors -join '; ')"
    Write-Log "Backup failed: $($Errors -join '; ')" "ERROR"
    
    Show-Notification -Title $Title -Message $Message -Type "Error"
    Send-SimpleEmail -Subject "❌ $Title" -Body "$Message`n`nCheck the backup system immediately." -Priority "High"
}

Write-Log "Log file: $LogFile" "INFO"
Write-Log "Status file: $StatusFile" "INFO"

# Exit with appropriate code
exit $(if($Success) { 0 } else { 1 })