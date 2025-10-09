# Enhanced backup script with notifications
# This script performs backup and sends notifications on success/failure

param(
    [string]$NotificationMethod = "all",  # Options: "windows", "email", "all", "none"
    [string]$EmailTo = "",
    [string]$EmailFrom = "",
    [string]$SMTPServer = "",
    [int]$SMTPPort = 587,
    [string]$SMTPUser = "",
    [string]$SMTPPassword = ""
)

# Import required modules for notifications
try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $WindowsNotificationsAvailable = $true
} catch {
    $WindowsNotificationsAvailable = $false
}

# Configuration
$ProjectRoot = "G:\My Drive\Code\Python\Super-Flashcards"
$SQLBackupDir = "C:\Backups\SuperFlashcards"
$GoogleDriveDir = "$ProjectRoot\backups"
$BackupScript = "$ProjectRoot\backend\scripts\backup_database_fixed.sql"
$LogFile = "$GoogleDriveDir\backup_status.log"
$StatusFile = "$GoogleDriveDir\last_backup_status.json"

# Ensure log directory exists
if (-not (Test-Path $GoogleDriveDir)) {
    New-Item -ItemType Directory -Path $GoogleDriveDir -Force | Out-Null
}

# Function to write to log with timestamp
function Write-BackupLog {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry -ForegroundColor $(
        switch($Level) {
            "ERROR" { "Red" }
            "SUCCESS" { "Green" }
            "WARNING" { "Yellow" }
            default { "White" }
        }
    )
    $LogEntry | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

# Function to show Windows notification
function Show-WindowsNotification {
    param(
        [string]$Title,
        [string]$Message,
        [string]$Icon = "Information"  # Information, Warning, Error
    )
    
    if (-not $WindowsNotificationsAvailable) {
        Write-BackupLog "Windows notifications not available" "WARNING"
        return
    }
    
    try {
        # Create notification balloon
        $notification = New-Object System.Windows.Forms.NotifyIcon
        $notification.Icon = [System.Drawing.SystemIcons]::$Icon
        $notification.BalloonTipIcon = $Icon
        $notification.BalloonTipText = $Message
        $notification.BalloonTipTitle = $Title
        $notification.Visible = $true
        $notification.ShowBalloonTip(10000)  # Show for 10 seconds
        
        # Also try Windows 10+ toast notification
        $ToastCommand = @"
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

`$template = @"
<toast>
    <visual>
        <binding template="ToastGeneric">
            <text>$Title</text>
            <text>$Message</text>
        </binding>
    </visual>
</toast>
"@

`$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
`$xml.LoadXml(`$template)
`$toast = [Windows.UI.Notifications.ToastNotification]::new(`$xml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("SuperFlashcards").Show(`$toast)
"@
        
        PowerShell -Command $ToastCommand -ErrorAction SilentlyContinue
        
        # Clean up
        Start-Sleep -Seconds 1
        $notification.Dispose()
        
    } catch {
        Write-BackupLog "Failed to show Windows notification: $_" "WARNING"
    }
}

# Function to send email notification
function Send-EmailNotification {
    param(
        [string]$Subject,
        [string]$Body,
        [string]$Priority = "Normal"  # Normal, High, Low
    )
    
    if (-not $EmailTo -or -not $EmailFrom -or -not $SMTPServer) {
        Write-BackupLog "Email configuration incomplete, skipping email notification" "WARNING"
        return
    }
    
    try {
        $SMTPClient = New-Object System.Net.Mail.SmtpClient($SMTPServer, $SMTPPort)
        $SMTPClient.EnableSsl = $true
        
        if ($SMTPUser -and $SMTPPassword) {
            $SMTPClient.Credentials = New-Object System.Net.NetworkCredential($SMTPUser, $SMTPPassword)
        }
        
        $MailMessage = New-Object System.Net.Mail.MailMessage
        $MailMessage.From = $EmailFrom
        $MailMessage.To.Add($EmailTo)
        $MailMessage.Subject = $Subject
        $MailMessage.Body = $Body
        $MailMessage.Priority = $Priority
        $MailMessage.IsBodyHtml = $true
        
        # Attach latest log file if it exists
        if (Test-Path $LogFile) {
            $Attachment = New-Object System.Net.Mail.Attachment($LogFile)
            $MailMessage.Attachments.Add($Attachment)
        }
        
        $SMTPClient.Send($MailMessage)
        Write-BackupLog "Email notification sent successfully" "SUCCESS"
        
        $MailMessage.Dispose()
        $SMTPClient.Dispose()
        
    } catch {
        Write-BackupLog "Failed to send email notification: $_" "ERROR"
    }
}

# Function to update status file
function Update-StatusFile {
    param(
        [bool]$Success,
        [string]$Message,
        [hashtable]$Details = @{}
    )
    
    $Status = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Success = $Success
        Message = $Message
        Details = $Details
        ComputerName = $env:COMPUTERNAME
        UserName = $env:USERNAME
    }
    
    $Status | ConvertTo-Json -Depth 3 | Out-File -FilePath $StatusFile -Encoding UTF8
}

# Main backup process with comprehensive error handling
Write-BackupLog "========================================" "INFO"
Write-BackupLog "SuperFlashcards Backup Process Starting" "INFO"
Write-BackupLog "========================================" "INFO"

$BackupStartTime = Get-Date
$OverallSuccess = $true
$ErrorMessages = @()
$BackupDetails = @{}

try {
    # Step 1: SQL Server Backup
    Write-BackupLog "[1/3] Running SQL Server backup..." "INFO"
    
    $SqlBackupStart = Get-Date
    $SqlResult = & sqlcmd -S localhost\SQLEXPRESS -d master -E -i $BackupScript 2>&1
    $SqlBackupEnd = Get-Date
    $SqlDuration = ($SqlBackupEnd - $SqlBackupStart).TotalSeconds
    
    if ($LASTEXITCODE -eq 0) {
        Write-BackupLog "SQL backup completed successfully in $([math]::Round($SqlDuration, 2)) seconds" "SUCCESS"
        $BackupDetails.SqlBackup = @{
            Success = $true
            Duration = $SqlDuration
            Output = $SqlResult -join "`n"
        }
    } else {
        $ErrorMsg = "SQL backup failed with exit code: $LASTEXITCODE"
        Write-BackupLog $ErrorMsg "ERROR"
        Write-BackupLog "SQL Output: $($SqlResult -join "`n")" "ERROR"
        $ErrorMessages += $ErrorMsg
        $OverallSuccess = $false
        $BackupDetails.SqlBackup = @{
            Success = $false
            Duration = $SqlDuration
            Error = $ErrorMsg
            Output = $SqlResult -join "`n"
        }
    }
    
    # Step 2: Copy to Google Drive
    Write-BackupLog "[2/3] Copying backups to Google Drive..." "INFO"
    
    $CopyStart = Get-Date
    $RobocopyArgs = @(
        $SQLBackupDir,
        $GoogleDriveDir,
        "*.bak",
        "/MIR",
        "/R:3",
        "/W:10",
        "/NP"
    )
    
    $RobocopyResult = & robocopy @RobocopyArgs 2>&1
    $CopyEnd = Get-Date
    $CopyDuration = ($CopyEnd - $CopyStart).TotalSeconds
    
    # Robocopy exit codes 0-7 are success
    if ($LASTEXITCODE -le 7) {
        Write-BackupLog "Copy to Google Drive completed successfully in $([math]::Round($CopyDuration, 2)) seconds" "SUCCESS"
        $BackupDetails.Copy = @{
            Success = $true
            Duration = $CopyDuration
            ExitCode = $LASTEXITCODE
        }
    } else {
        $ErrorMsg = "Copy to Google Drive failed with exit code: $LASTEXITCODE"
        Write-BackupLog $ErrorMsg "ERROR"
        $ErrorMessages += $ErrorMsg
        $OverallSuccess = $false
        $BackupDetails.Copy = @{
            Success = $false
            Duration = $CopyDuration
            ExitCode = $LASTEXITCODE
            Error = $ErrorMsg
        }
    }
    
    # Step 3: Verify backups
    Write-BackupLog "[3/3] Verifying backup files..." "INFO"
    
    $SqlBackups = Get-ChildItem $SQLBackupDir -Filter "*.bak" -ErrorAction SilentlyContinue
    $GDriveBackups = Get-ChildItem $GoogleDriveDir -Filter "*.bak" -ErrorAction SilentlyContinue
    
    $BackupDetails.Verification = @{
        SqlBackupCount = $SqlBackups.Count
        GDriveBackupCount = $GDriveBackups.Count
        LatestSqlBackup = if ($SqlBackups) { ($SqlBackups | Sort-Object LastWriteTime -Descending | Select-Object -First 1).Name } else { "None" }
        LatestGDriveBackup = if ($GDriveBackups) { ($GDriveBackups | Sort-Object LastWriteTime -Descending | Select-Object -First 1).Name } else { "None" }
    }
    
    Write-BackupLog "SQL backups found: $($SqlBackups.Count)" "INFO"
    Write-BackupLog "Google Drive backups found: $($GDriveBackups.Count)" "INFO"
    
    if ($SqlBackups.Count -eq 0) {
        $ErrorMessages += "No SQL backup files found"
        $OverallSuccess = $false
    }
    
    if ($GDriveBackups.Count -eq 0) {
        $ErrorMessages += "No Google Drive backup files found"
        $OverallSuccess = $false
    }
    
} catch {
    $ErrorMsg = "Unexpected error during backup process: $_"
    Write-BackupLog $ErrorMsg "ERROR"
    $ErrorMessages += $ErrorMsg
    $OverallSuccess = $false
}

# Calculate total duration
$TotalDuration = (Get-Date) - $BackupStartTime
$BackupDetails.TotalDuration = $TotalDuration.TotalSeconds

# Update status file
Update-StatusFile -Success $OverallSuccess -Message $(if ($OverallSuccess) { "Backup completed successfully" } else { "Backup failed: $($ErrorMessages -join '; ')" }) -Details $BackupDetails

# Send notifications
if ($NotificationMethod -eq "all" -or $NotificationMethod -eq "windows") {
    if ($OverallSuccess) {
        Show-WindowsNotification -Title "SuperFlashcards Backup SUCCESS" -Message "Database backup completed successfully in $([math]::Round($TotalDuration.TotalMinutes, 1)) minutes" -Icon "Information"
    } else {
        Show-WindowsNotification -Title "SuperFlashcards Backup FAILED" -Message "Backup failed: $($ErrorMessages -join '; ')" -Icon "Error"
    }
}

if ($NotificationMethod -eq "all" -or $NotificationMethod -eq "email") {
    $EmailSubject = if ($OverallSuccess) { "✅ SuperFlashcards Backup Success" } else { "❌ SuperFlashcards Backup Failed" }
    
    $EmailBody = @"
<html>
<body>
<h2>SuperFlashcards Database Backup Report</h2>
<p><strong>Status:</strong> $(if ($OverallSuccess) { "✅ SUCCESS" } else { "❌ FAILED" })</p>
<p><strong>Date:</strong> $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
<p><strong>Computer:</strong> $env:COMPUTERNAME</p>
<p><strong>Duration:</strong> $([math]::Round($TotalDuration.TotalMinutes, 1)) minutes</p>

$(if (-not $OverallSuccess) {
    "<h3>Errors:</h3><ul>" + ($ErrorMessages | ForEach-Object { "<li>$_</li>" }) + "</ul>"
})

<h3>Backup Details:</h3>
<ul>
<li><strong>SQL Backup:</strong> $(if ($BackupDetails.SqlBackup.Success) { "✅ Success" } else { "❌ Failed" }) ($([math]::Round($BackupDetails.SqlBackup.Duration, 1))s)</li>
<li><strong>Copy to Google Drive:</strong> $(if ($BackupDetails.Copy.Success) { "✅ Success" } else { "❌ Failed" }) ($([math]::Round($BackupDetails.Copy.Duration, 1))s)</li>
<li><strong>SQL Backup Files:</strong> $($BackupDetails.Verification.SqlBackupCount)</li>
<li><strong>Google Drive Files:</strong> $($BackupDetails.Verification.GDriveBackupCount)</li>
<li><strong>Latest Backup:</strong> $($BackupDetails.Verification.LatestGDriveBackup)</li>
</ul>

<p><em>Log file is attached for detailed information.</em></p>
</body>
</html>
"@
    
    Send-EmailNotification -Subject $EmailSubject -Body $EmailBody -Priority $(if ($OverallSuccess) { "Normal" } else { "High" })
}

# Final log entries
Write-BackupLog "========================================" "INFO"
if ($OverallSuccess) {
    Write-BackupLog "✅ Backup Process Completed Successfully!" "SUCCESS"
    Write-BackupLog "Total Duration: $([math]::Round($TotalDuration.TotalMinutes, 1)) minutes" "SUCCESS"
} else {
    Write-BackupLog "❌ Backup Process Failed!" "ERROR"
    Write-BackupLog "Errors: $($ErrorMessages -join '; ')" "ERROR"
}
Write-BackupLog "========================================" "INFO"

# Exit with appropriate code
exit $(if ($OverallSuccess) { 0 } else { 1 })