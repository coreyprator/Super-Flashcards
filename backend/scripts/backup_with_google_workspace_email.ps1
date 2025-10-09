# SuperFlashcards Backup with Google Workspace Email Notifications
# Configure this script with your @rentyourcio.com email settings

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "SuperFlashcards Backup with Notifications" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# === EMAIL CONFIGURATION FOR GOOGLE WORKSPACE ===
# EDIT THESE SETTINGS WITH YOUR GOOGLE WORKSPACE DETAILS
$EmailConfig = @{
    Enabled = $true                                   # Set to $false to disable email notifications
    To = "corey.prator@gmail.com"                    # WHERE notifications go (your personal Gmail)
    From = "SuperFlashcards Backup <cprator@cbsware.com>"  # Display name with actual account
    SMTPServer = "smtp.gmail.com"                    # Google Workspace SMTP
    SMTPPort = 587
    Username = "cprator@cbsware.com"                 # Actual account that owns the App Password
    Password = "bzox ooxo tkqh aybc"      # App Password from Google Account
}

# Paths
$ProjectRoot = "G:\My Drive\Code\Python\Super-Flashcards"
$SQLBackupDir = "C:\Backups\SuperFlashcards"
$GoogleDriveDir = "$ProjectRoot\backups"
$BackupScript = "$ProjectRoot\backend\scripts\backup_database_fixed.sql"
$LogFile = "$GoogleDriveDir\backup_log_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Create directories
if (-not (Test-Path $GoogleDriveDir)) { 
    New-Item -ItemType Directory -Path $GoogleDriveDir -Force | Out-Null 
}

# Function to log messages
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $LogEntry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Message"
    $Color = switch($Level) { "ERROR" {"Red"} "SUCCESS" {"Green"} "WARNING" {"Yellow"} default {"White"} }
    Write-Host $LogEntry -ForegroundColor $Color
    
    try {
        $LogEntry | Out-File -FilePath $LogFile -Append -Encoding UTF8
    } catch {
        # Ignore logging errors
    }
}

# Function to send email notification using modern .NET SMTP client
function Send-BackupNotification {
    param([bool]$Success, [string]$Message, [array]$Details = @())
    
    if (-not $EmailConfig.Enabled -or $EmailConfig.Password -eq "your-16-char-app-password-here") {
        Write-Log "Email notifications not configured - edit the EmailConfig section" "WARNING"
        return
    }
    
    try {
        Write-Log "Preparing email notification..." "INFO"
        
        # Create unique subject to avoid spam filtering
        $UniqueId = (Get-Date -Format 'yyyyMMdd-HHmmss')
        $Subject = if ($Success) { "[SuperFlashcards] Backup SUCCESS - $UniqueId" } else { "[SuperFlashcards] Backup FAILED - $UniqueId" }
        
        $Body = @"
SuperFlashcards Database Backup Report
======================================

Backup ID: $UniqueId
Status: $(if ($Success) { "SUCCESS [OK]" } else { "FAILED [ERROR]" })
Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Server: $env:COMPUTERNAME
System: SuperFlashcards Production Backup

Summary: $Message

$(if ($Details.Count -gt 0) { "Technical Details:`n" + ($Details -join "`n") })

Backup Storage Locations:
- Primary: $SQLBackupDir
- Cloud Copy: $GoogleDriveDir

$(if ($Success) { 
    "[OK] BACKUP SUCCESSFUL
Your SuperFlashcards database has been safely backed up and synchronized to Google Drive.
No action required - your data is protected." 
} else { 
    "[ERROR] BACKUP FAILED
IMMEDIATE ATTENTION REQUIRED: Please check the backup system and resolve any issues.
Your data may be at risk until this is resolved." 
})

This is an automated notification from your SuperFlashcards backup system.
Do not reply to this email.

--
SuperFlashcards Automated Backup System
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@
        
        Write-Log "Connecting to SMTP server: $($EmailConfig.SMTPServer):$($EmailConfig.SMTPPort)" "INFO"
        Write-Log "Authenticating as: $($EmailConfig.Username)" "INFO"
        
        # Clean password (remove spaces)
        $CleanPassword = $EmailConfig.Password -replace '\s', ''
        Write-Log "Using cleaned password (length: $($CleanPassword.Length))" "INFO"
        
        # Use Send-MailMessage directly (simpler and more reliable)
        Write-Log "Using Send-MailMessage for email delivery..." "INFO"
        $SecurePassword = ConvertTo-SecureString $CleanPassword -AsPlainText -Force
        $Credential = New-Object System.Management.Automation.PSCredential($EmailConfig.Username, $SecurePassword)
        
        # Send email with proper error handling
        try {
            Send-MailMessage -To $EmailConfig.To -From $EmailConfig.Username -Subject $Subject -Body $Body -SmtpServer $EmailConfig.SMTPServer -Port $EmailConfig.SMTPPort -UseSsl -Credential $Credential -ErrorAction Stop
            Write-Log "Email notification sent successfully to $($EmailConfig.To)" "SUCCESS"
        } catch {
            $ErrorMsg = $_.Exception.Message
            Write-Log "Email sending failed: $ErrorMsg" "ERROR"
            
            # Provide specific troubleshooting
            if ($ErrorMsg -match "5.7.0.*Authentication Required") {
                Write-Log "SMTP Authentication failed - App Password issue" "ERROR"
                Write-Log "1. Verify App Password belongs to: $($EmailConfig.Username)" "ERROR"
                Write-Log "2. Check 2-Step Verification is enabled" "ERROR"
                Write-Log "3. Try regenerating App Password" "ERROR"
            } elseif ($ErrorMsg -match "5.5.1") {
                Write-Log "Email address error - check sender/recipient addresses" "ERROR"
            }
            
            throw "Email notification failed: $ErrorMsg"
        }
        
    } catch {
        $ErrorDetail = $_.Exception.Message
        if ($_.Exception.InnerException) {
            $ErrorDetail += " (Inner: $($_.Exception.InnerException.Message))"
        }
        
        Write-Log "Failed to send email notification: $ErrorDetail" "ERROR"
        
        # Provide specific troubleshooting based on error type
        if ($ErrorDetail -match "Authentication Required|5.7.0") {
            Write-Log "SMTP Authentication failed - check your App Password" "ERROR"
            Write-Log "1. Verify your App Password is exactly 16 characters" "ERROR"
            Write-Log "2. Make sure 2-Step Verification is enabled" "ERROR"
            Write-Log "3. Try regenerating your App Password" "ERROR"
        } elseif ($ErrorDetail -match "5.5.1|Invalid address") {
            Write-Log "Email address error - check From/To addresses exist in @rentyourcio.com" "ERROR"
        } elseif ($ErrorDetail -match "timeout|network") {
            Write-Log "Network connectivity issue - check internet connection" "ERROR"
        }
        
        Write-Log "See EMAIL_SETUP_GUIDE.md for detailed troubleshooting" "ERROR"
    }
}

# Function for Windows notification
function Show-WindowsNotification {
    param([string]$Title, [string]$Message, [string]$Type = "Info")
    
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $Icon = switch($Type) { "Error" {"Error"} "Warning" {"Warning"} default {"Information"} }
        [System.Windows.Forms.MessageBox]::Show($Message, $Title, "OK", $Icon) | Out-Null
        Write-Log "Windows notification shown: $Title" "SUCCESS"
    } catch {
        Write-Log "Failed to show Windows notification: $_" "WARNING"
    }
}

# Main backup process
$StartTime = Get-Date
$Success = $true
$ErrorMessages = @()
$Details = @()

Write-Log "Backup process starting..." "INFO"

try {
    # Step 1: SQL Server Backup
    Write-Log "[1/2] Running SQL Server backup..." "INFO"
    $SqlStart = Get-Date
    $SqlResult = & sqlcmd -S localhost\SQLEXPRESS -d master -E -i $BackupScript 2>&1
    $SqlEnd = Get-Date
    $SqlDuration = ($SqlEnd - $SqlStart).TotalSeconds
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "SQL backup completed in $([math]::Round($SqlDuration, 1)) seconds" "SUCCESS"
        $Details += "SQL Backup: SUCCESS ($([math]::Round($SqlDuration, 1))s)"
    } else {
        $ErrorMsg = "SQL backup failed with exit code: $LASTEXITCODE"
        Write-Log $ErrorMsg "ERROR"
        $ErrorMessages += $ErrorMsg
        $Success = $false
        $Details += "SQL Backup: FAILED"
    }
    
    # Step 2: Copy to Google Drive
    Write-Log "[2/2] Copying to Google Drive..." "INFO"
    $CopyStart = Get-Date
    
    $RobocopyResult = & robocopy $SQLBackupDir $GoogleDriveDir "*.bak" /MIR /R:3 /W:10 /NP 2>&1
    $CopyEnd = Get-Date
    $CopyDuration = ($CopyEnd - $CopyStart).TotalSeconds
    
    if ($LASTEXITCODE -le 7) {
        Write-Log "Copy to Google Drive completed in $([math]::Round($CopyDuration, 1)) seconds" "SUCCESS"
        $Details += "Google Drive Copy: SUCCESS ($([math]::Round($CopyDuration, 1))s)"
    } else {
        $ErrorMsg = "Copy failed with exit code: $LASTEXITCODE"
        Write-Log $ErrorMsg "ERROR"
        $ErrorMessages += $ErrorMsg
        $Success = $false
        $Details += "Google Drive Copy: FAILED"
    }
    
    # Verification
    $SqlBackups = Get-ChildItem $SQLBackupDir -Filter "*.bak" -ErrorAction SilentlyContinue
    $GDriveBackups = Get-ChildItem $GoogleDriveDir -Filter "*.bak" -ErrorAction SilentlyContinue
    
    $Details += "SQL Backup Files: $($SqlBackups.Count)"
    $Details += "Google Drive Files: $($GDriveBackups.Count)"
    
    if ($GDriveBackups.Count -gt 0) {
        $LatestBackup = $GDriveBackups | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $Details += "Latest Backup: $($LatestBackup.Name) ($([math]::Round($LatestBackup.Length/1MB,1)) MB)"
    }
    
} catch {
    $ErrorMsg = "Unexpected error: $_"
    Write-Log $ErrorMsg "ERROR"
    $ErrorMessages += $ErrorMsg
    $Success = $false
}

$TotalDuration = (Get-Date) - $StartTime

# Send notifications
$Message = if ($Success) { 
    "Database backup completed successfully in $([math]::Round($TotalDuration.TotalMinutes, 1)) minutes" 
} else { 
    "Backup failed: $($ErrorMessages -join '; ')" 
}

# Email notification
Send-BackupNotification -Success $Success -Message $Message -Details $Details

# Windows notification
$NotificationTitle = if ($Success) { "SuperFlashcards Backup SUCCESS" } else { "SuperFlashcards Backup FAILED" }
$NotificationType = if ($Success) { "Info" } else { "Error" }
Show-WindowsNotification -Title $NotificationTitle -Message $Message -Type $NotificationType

# Final log
Write-Log "========================================" "INFO"
if ($Success) {
    Write-Log "✅ Backup completed successfully!" "SUCCESS"
    Write-Log "Total time: $([math]::Round($TotalDuration.TotalMinutes, 1)) minutes" "SUCCESS"
} else {
    Write-Log "❌ Backup failed!" "ERROR"
    Write-Log "Errors: $($ErrorMessages -join '; ')" "ERROR"
}
Write-Log "Log file: $LogFile" "INFO"
Write-Log "========================================" "INFO"

# Exit with appropriate code
exit $(if($Success) { 0 } else { 1 })