-- Script to create SQL Server 2019-compatible backup
-- Run this in SQL Server Management Studio on your local AlienWare\SQLEXPRESS

USE LanguageLearning;
GO

-- Change compatibility level to SQL Server 2019
ALTER DATABASE LanguageLearning SET COMPATIBILITY_LEVEL = 150;
GO

-- Backup to local file
BACKUP DATABASE [LanguageLearning]
TO DISK = 'G:\My Drive\Code\Python\Super-Flashcards\backups\LanguageLearning_CloudCompatible.bak'
WITH FORMAT, INIT,
NAME = 'LanguageLearning-Full Database Backup',
SKIP, NOREWIND, NOUNLOAD, COMPRESSION, STATS = 10;
GO

PRINT 'Backup complete! File: LanguageLearning_CloudCompatible.bak';
GO
