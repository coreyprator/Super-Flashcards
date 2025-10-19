-- SuperFlashcards Backup Script with Cloud Compatibility
-- This script creates a backup compatible with both:
-- - Local SQL Server 2022 restore
-- - Google Cloud SQL Server 2019 Express restore
--
-- LOCATION: C:\Backups\SuperFlashcards
-- SCHEDULE: Nightly at 2:00 AM via Windows Scheduled Task
-- SYNC: RoboCopy to G:\My Drive\Code\Python\Super-Flashcards\backups
--

DECLARE @DatabaseName NVARCHAR(100) = 'LanguageLearning'
DECLARE @BackupFile NVARCHAR(500)
DECLARE @DateString NVARCHAR(20)
DECLARE @CloudBackupFile NVARCHAR(500)
DECLARE @CurrentCompatLevel INT

-- Create date string in format YYYYMMDD_HHMMSS
SET @DateString = CONVERT(NVARCHAR(8), GETDATE(), 112) + '_' + 
                 REPLACE(CONVERT(NVARCHAR(8), GETDATE(), 108), ':', '')

-- Build backup file paths
SET @BackupFile = 'C:\Backups\SuperFlashcards\LanguageLearning_' + @DateString + '.bak'
SET @CloudBackupFile = 'C:\Backups\SuperFlashcards\LanguageLearning_CloudCompatible.bak'

PRINT '================================================'
PRINT 'SuperFlashcards Database Backup'
PRINT '================================================'
PRINT 'Database: ' + @DatabaseName
PRINT 'Started: ' + CONVERT(NVARCHAR(30), GETDATE(), 120)
PRINT '================================================'
PRINT ''

-- Get current compatibility level
SELECT @CurrentCompatLevel = compatibility_level 
FROM sys.databases 
WHERE name = @DatabaseName

PRINT 'Current compatibility level: ' + CAST(@CurrentCompatLevel AS NVARCHAR(10))
PRINT ''

-- =====================================================
-- STEP 1: Regular Backup (maintains current compatibility)
-- =====================================================
PRINT '[1/3] Creating regular timestamped backup...'
PRINT 'File: ' + @BackupFile

BACKUP DATABASE [LanguageLearning]
TO DISK = @BackupFile
WITH 
    FORMAT,
    INIT,
    NAME = 'LanguageLearning Daily Backup',
    STATS = 10,
    CHECKSUM
    -- COMPRESSION removed: Not supported on SQL Server Express

IF @@ERROR = 0
    PRINT '✓ Regular backup completed successfully!'
ELSE
BEGIN
    PRINT '✗ Regular backup FAILED!'
    RETURN
END

PRINT ''

-- =====================================================
-- STEP 2: Set Cloud Compatibility Level
-- =====================================================
PRINT '[2/3] Preparing cloud-compatible backup...'

-- Temporarily change to SQL Server 2019 compatibility (level 150)
IF @CurrentCompatLevel > 150
BEGIN
    PRINT 'Changing compatibility level: ' + CAST(@CurrentCompatLevel AS NVARCHAR(10)) + ' → 150 (SQL Server 2019)'
    ALTER DATABASE [LanguageLearning] SET COMPATIBILITY_LEVEL = 150
    PRINT '✓ Compatibility level changed for cloud backup'
END
ELSE
BEGIN
    PRINT 'Compatibility level already at 150 or below - no change needed'
END

PRINT ''

-- =====================================================
-- STEP 3: Cloud-Compatible Backup
-- =====================================================
PRINT '[3/3] Creating cloud-compatible backup...'
PRINT 'File: ' + @CloudBackupFile
PRINT 'Purpose: Google Cloud SQL Server 2019 Express deployment'

BACKUP DATABASE [LanguageLearning]
TO DISK = @CloudBackupFile
WITH 
    FORMAT,
    INIT,
    NAME = 'LanguageLearning Cloud Compatible Backup',
    STATS = 10,
    CHECKSUM
    -- COMPRESSION removed: Not supported on SQL Server Express

IF @@ERROR = 0
    PRINT '✓ Cloud-compatible backup completed successfully!'
ELSE
BEGIN
    PRINT '✗ Cloud-compatible backup FAILED!'
    -- Restore original compatibility level before returning
    IF @CurrentCompatLevel > 150
    BEGIN
        DECLARE @RestoreSql1 NVARCHAR(500)
        SET @RestoreSql1 = 'ALTER DATABASE [LanguageLearning] SET COMPATIBILITY_LEVEL = ' + CAST(@CurrentCompatLevel AS NVARCHAR(10))
        EXEC sp_executesql @RestoreSql1
    END
    RETURN
END

PRINT ''

-- =====================================================
-- STEP 4: Restore Original Compatibility Level
-- =====================================================
IF @CurrentCompatLevel > 150
BEGIN
    PRINT '[4/4] Restoring original compatibility level...'
    PRINT 'Changing back: 150 → ' + CAST(@CurrentCompatLevel AS NVARCHAR(10))
    
    DECLARE @RestoreSql NVARCHAR(500)
    SET @RestoreSql = 'ALTER DATABASE [LanguageLearning] SET COMPATIBILITY_LEVEL = ' + CAST(@CurrentCompatLevel AS NVARCHAR(10))
    EXEC sp_executesql @RestoreSql
    
    PRINT '✓ Original compatibility level restored'
    PRINT ''
END

-- =====================================================
-- BACKUP SUMMARY
-- =====================================================
PRINT '================================================'
PRINT 'BACKUP SUMMARY'
PRINT '================================================'

-- Show both backup files
SELECT 
    'Regular Backup' AS [Backup_Type],
    b.database_name AS [Database],
    b.backup_finish_date AS [Completed],
    CAST(b.backup_size / 1024.0 / 1024.0 AS DECIMAL(10,2)) AS [Size_MB],
    CAST(b.compressed_backup_size / 1024.0 / 1024.0 AS DECIMAL(10,2)) AS [Compressed_MB],
    m.physical_device_name AS [File_Path]
FROM msdb.dbo.backupset b
INNER JOIN msdb.dbo.backupmediafamily m ON b.media_set_id = m.media_set_id
WHERE b.database_name = 'LanguageLearning'
    AND b.backup_finish_date >= DATEADD(MINUTE, -5, GETDATE())
ORDER BY b.backup_finish_date DESC

PRINT ''
PRINT '✓ BACKUP COMPLETED SUCCESSFULLY!'
PRINT 'Files created:'
PRINT '  1. Regular: ' + @BackupFile
PRINT '  2. Cloud:   ' + @CloudBackupFile
PRINT ''
PRINT 'Next steps:'
PRINT '  - Regular backup will be copied to G: by RoboCopy'
PRINT '  - Cloud backup ready for Google Cloud Storage upload'
PRINT '  - Both backups can restore to local or cloud SQL Server'
PRINT '================================================'
