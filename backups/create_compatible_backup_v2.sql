-- Script to create SQL Server 2019-compatible backup for Google Cloud deployment
-- Run this in SQL Server Management Studio on your local AlienWare\SQLEXPRESS
-- 
-- BACKUP LOCATION: C:\Backups\SuperFlashcards
-- NOTE: Nightly backups run at 2:00 AM via scheduled task, then robocopy to G: for DR

USE LanguageLearning;
GO

-- Change compatibility level to SQL Server 2019 (required for Cloud SQL 2019 Express)
ALTER DATABASE LanguageLearning SET COMPATIBILITY_LEVEL = 150;
GO

-- Backup to official backup location
BACKUP DATABASE [LanguageLearning]
TO DISK = 'C:\Backups\SuperFlashcards\LanguageLearning_CloudCompatible.bak'
WITH FORMAT, INIT,
NAME = 'LanguageLearning-Cloud Compatible Backup',
SKIP, NOREWIND, NOUNLOAD, COMPRESSION, STATS = 10;
GO

PRINT 'Backup complete! File saved to: C:\Backups\SuperFlashcards\LanguageLearning_CloudCompatible.bak';
PRINT 'Ready for upload to Google Cloud Storage.';
GO
