-- Simplified backup without xp_cmdshell dependency
DECLARE @BackupPath NVARCHAR(500)
DECLARE @BackupFile NVARCHAR(500)
DECLARE @DatabaseName NVARCHAR(100) = 'LanguageLearning'
DECLARE @DateStamp NVARCHAR(50)

SET @DateStamp = CONVERT(NVARCHAR(50), GETDATE(), 112) + '_' + 
                 REPLACE(CONVERT(NVARCHAR(50), GETDATE(), 108), ':', '')

SET @BackupPath = 'C:\Backups\SuperFlashcards\'
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
