# Backup notification configuration
# Edit this file to customize your notification preferences

# === NOTIFICATION SETTINGS ===
$NotificationConfig = @{
    # Windows notifications (balloon tips and toast)
    WindowsNotifications = $true
    
    # Email notifications
    EmailNotifications = $true
    EmailTo = "your-email@example.com"
    EmailFrom = "backup-system@yourdomain.com"
    
    # Gmail SMTP settings (most common)
    SMTPServer = "smtp.gmail.com"
    SMTPPort = 587
    SMTPUser = "your-gmail@gmail.com"
    SMTPPassword = "your-app-password"  # Use Gmail App Password, not regular password
    
    # Outlook/Office365 SMTP settings (alternative)
    # SMTPServer = "smtp-mail.outlook.com"
    # SMTPPort = 587
    # SMTPUser = "your-email@outlook.com"
    # SMTPPassword = "your-password"
    
    # Other SMTP providers
    # SMTPServer = "mail.your-domain.com"
    # SMTPPort = 587
    # SMTPUser = "backup@your-domain.com"
    # SMTPPassword = "your-password"
}

# === NOTIFICATION PREFERENCES ===
$NotificationPrefs = @{
    # When to send notifications
    NotifyOnSuccess = $true    # Send notification when backup succeeds
    NotifyOnFailure = $true    # Send notification when backup fails
    NotifyOnWarning = $false   # Send notification on warnings (like slow performance)
    
    # Notification frequency
    MaxNotificationsPerDay = 5  # Prevent spam if backup runs multiple times
    
    # Include detailed logs in email
    AttachLogFiles = $true
    
    # Keep notification history
    KeepNotificationHistory = $true
    HistoryDays = 30
}

# Export configuration for use by backup script
Export-ModuleMember -Variable NotificationConfig, NotificationPrefs