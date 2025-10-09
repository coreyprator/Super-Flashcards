-- =============================================
-- Super-Flashcards Database Backup Script
-- =============================================
DECLARE @BackupPath NVARCHAR(500)
DECLARE @BackupFile NVARCHAR(500)
DECLARE @DatabaseName NVARCHAR(100) = 'LanguageLearning'
DECLARE @DateStamp NVARCHAR(50)

SET @DateStamp = CONVERT(NVARCHAR(50), GETDATE(), 112) + '_' + 
                 REPLACE(CONVERT(NVARCHAR(50), GETDATE(), 108), ':', '')

SET @BackupPath = 'C:\Backups\SuperFlashcards\'
SET @BackupFile = @BackupPath + @DatabaseName + '_' + @DateStamp + '.bak'

EXEC xp_create_subdir @BackupPath

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

-- Cleanup old backups (>30 days)
DECLARE @CleanupCommand NVARCHAR(500)
SET @CleanupCommand = 'FORFILES /P "' + @BackupPath + '" /M "' + @DatabaseName + '_*.bak" /D -30 /C "cmd /c del @path"'
EXEC xp_cmdshell @CleanupCommand

PRINT 'Cleanup completed!'

-- Verify backup
SELECT TOP 1
    database_name AS 'Database',
    backup_finish_date AS 'Backup Completed',
    CAST(backup_size / 1024 / 1024 AS DECIMAL(10,2)) AS 'Size (MB)',
    CAST(compressed_backup_size / 1024 / 1024 AS DECIMAL(10,2)) AS 'Compressed Size (MB)'
FROM msdb.dbo.backupset
WHERE database_name = @DatabaseName
ORDER BY backup_finish_date DESC
