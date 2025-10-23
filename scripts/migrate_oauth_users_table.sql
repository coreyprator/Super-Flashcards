-- Migration: Add Google OAuth Support to Users Table
-- Date: 2025-10-20
-- Description: Adds Google OAuth fields and enhances user authentication

USE LanguageLearning;
GO

-- Check if columns already exist before adding them
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'users') AND name = 'google_id')
BEGIN
    ALTER TABLE users ADD google_id NVARCHAR(255) NULL;
    PRINT 'Added column: google_id';
END
ELSE
BEGIN
    PRINT 'Column google_id already exists, skipping...';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'users') AND name = 'name')
BEGIN
    ALTER TABLE users ADD name NVARCHAR(100) NULL;
    PRINT 'Added column: name';
END
ELSE
BEGIN
    PRINT 'Column name already exists, skipping...';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'users') AND name = 'picture')
BEGIN
    ALTER TABLE users ADD picture NVARCHAR(500) NULL;
    PRINT 'Added column: picture';
END
ELSE
BEGIN
    PRINT 'Column picture already exists, skipping...';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'users') AND name = 'auth_provider')
BEGIN
    ALTER TABLE users ADD auth_provider NVARCHAR(20) DEFAULT 'email' NOT NULL;
    PRINT 'Added column: auth_provider';
END
ELSE
BEGIN
    PRINT 'Column auth_provider already exists, skipping...';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'users') AND name = 'is_active')
BEGIN
    ALTER TABLE users ADD is_active BIT DEFAULT 1 NOT NULL;
    PRINT 'Added column: is_active';
END
ELSE
BEGIN
    PRINT 'Column is_active already exists, skipping...';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'users') AND name = 'is_verified')
BEGIN
    ALTER TABLE users ADD is_verified BIT DEFAULT 0 NOT NULL;
    PRINT 'Added column: is_verified';
END
ELSE
BEGIN
    PRINT 'Column is_verified already exists, skipping...';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'users') AND name = 'last_login')
BEGIN
    ALTER TABLE users ADD last_login DATETIME NULL;
    PRINT 'Added column: last_login';
END
ELSE
BEGIN
    PRINT 'Column last_login already exists, skipping...';
END
GO

-- Make email NOT NULL if it isn't already
-- First check if there are any NULL emails
IF EXISTS (SELECT 1 FROM users WHERE email IS NULL)
BEGIN
    PRINT 'WARNING: Found users with NULL emails. Please update them before running this migration.';
    PRINT 'You can update them with: UPDATE users SET email = username + ''@example.com'' WHERE email IS NULL;';
END
ELSE
BEGIN
    -- Check if column allows NULL
    IF EXISTS (
        SELECT 1 
        FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'users') 
        AND name = 'email' 
        AND is_nullable = 1
    )
    BEGIN
        ALTER TABLE users ALTER COLUMN email NVARCHAR(255) NOT NULL;
        PRINT 'Updated email column to NOT NULL';
    END
    ELSE
    BEGIN
        PRINT 'Email column is already NOT NULL, skipping...';
    END
END
GO

-- Add unique constraint on google_id (if not exists)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_users_google_id' AND object_id = OBJECT_ID(N'users'))
BEGIN
    CREATE UNIQUE INDEX UQ_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
    PRINT 'Created unique index: UQ_users_google_id';
END
ELSE
BEGIN
    PRINT 'Unique index UQ_users_google_id already exists, skipping...';
END
GO

-- Add unique constraint on email (if not exists)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_users_email' AND object_id = OBJECT_ID(N'users'))
BEGIN
    CREATE UNIQUE INDEX UQ_users_email ON users(email);
    PRINT 'Created unique index: UQ_users_email';
END
ELSE
BEGIN
    PRINT 'Unique index UQ_users_email already exists, skipping...';
END
GO

-- Update existing users to set default values for new fields
UPDATE users
SET 
    is_active = ISNULL(is_active, 1),
    is_verified = ISNULL(is_verified, 0),
    auth_provider = ISNULL(auth_provider, 'email')
WHERE 
    is_active IS NULL 
    OR is_verified IS NULL 
    OR auth_provider IS NULL;

PRINT 'Migration completed successfully!';
PRINT '--------------------------------';
PRINT 'Summary of changes:';
PRINT '- Added google_id, name, picture columns for OAuth';
PRINT '- Added auth_provider column (email, google, etc.)';
PRINT '- Added is_active, is_verified for account management';
PRINT '- Added last_login timestamp';
PRINT '- Made email column NOT NULL and unique';
PRINT '- Added unique constraint on google_id';
GO
