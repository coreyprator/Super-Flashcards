-- Grant permissions to flashcards_user on LanguageLearning database
-- Run this as admin user (sqlserver) on Cloud SQL instance

USE [LanguageLearning];
GO

-- Create database user for the SQL login
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'flashcards_user')
BEGIN
    CREATE USER [flashcards_user] FOR LOGIN [flashcards_user];
    PRINT 'Created database user: flashcards_user';
END
ELSE
BEGIN
    PRINT 'Database user already exists: flashcards_user';
END
GO

-- Grant read permissions
ALTER ROLE db_datareader ADD MEMBER [flashcards_user];
PRINT 'Granted db_datareader role';
GO

-- Grant write permissions
ALTER ROLE db_datawriter ADD MEMBER [flashcards_user];
PRINT 'Granted db_datawriter role';
GO

-- Grant schema modification permissions (for migrations)
ALTER ROLE db_ddladmin ADD MEMBER [flashcards_user];
PRINT 'Granted db_ddladmin role';
GO

PRINT '';
PRINT 'SUCCESS! flashcards_user now has full permissions on LanguageLearning database';
GO
