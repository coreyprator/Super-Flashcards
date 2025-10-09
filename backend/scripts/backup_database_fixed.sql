-- Simple backup script for SuperFlashcards
DECLARE @DatabaseName NVARCHAR(100) = 'LanguageLearning'
DECLARE @BackupFile NVARCHAR(500)
DECLARE @DateString NVARCHAR(20)

-- Create date string in format YYYYMMDD_HHMMSS
SET @DateString = CONVERT(NVARCHAR(8), GETDATE(), 112) + '_' + 
                 REPLACE(CONVERT(NVARCHAR(8), GETDATE(), 108), ':', '')

-- Build backup file path
SET @BackupFile = 'C:\Backups\SuperFlashcards\LanguageLearning_' + @DateString + '.bak'

PRINT 'Starting backup of: ' + @DatabaseName
PRINT 'Backup file: ' + @BackupFile

-- Perform backup (no compression for Express Edition)
BACKUP DATABASE [LanguageLearning]
TO DISK = @BackupFile
WITH 
    FORMAT,
    INIT,
    NAME = 'LanguageLearning Full Backup',
    STATS = 10,
    CHECKSUM

PRINT 'Backup completed successfully!'

-- Show latest backup info
SELECT TOP 1
    database_name AS [Database],
    backup_finish_date AS [Backup_Completed],
    CAST(backup_size / 1024.0 / 1024.0 AS DECIMAL(10,2)) AS [Size_MB],
    CAST(compressed_backup_size / 1024.0 / 1024.0 AS DECIMAL(10,2)) AS [Compressed_Size_MB]
FROM msdb.dbo.backupset
WHERE database_name = 'LanguageLearning'
ORDER BY backup_finish_date DESC