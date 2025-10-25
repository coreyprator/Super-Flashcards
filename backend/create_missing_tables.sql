-- Create missing tables for Super-Flashcards OAuth authentication
-- Run this in SSMS connected to LanguageLearning database

USE LanguageLearning;
GO

-- Table 1: users (REQUIRED for OAuth)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        
        -- Basic info
        username NVARCHAR(50) UNIQUE NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        
        -- Authentication fields
        password_hash NVARCHAR(255) NULL,  -- Null for OAuth-only users
        auth_provider NVARCHAR(20) DEFAULT 'email',  -- 'email', 'google', 'github', etc.
        
        -- Google OAuth fields
        google_id NVARCHAR(255) UNIQUE NULL,  -- Google's unique user ID
        name NVARCHAR(100) NULL,  -- Full name from OAuth
        picture NVARCHAR(500) NULL,  -- Profile picture URL
        
        -- Preferences
        preferred_instruction_language NVARCHAR(10) DEFAULT 'en',
        
        -- Account status
        is_active BIT DEFAULT 1,
        is_verified BIT DEFAULT 0,  -- Email verification status
        
        -- Timestamps
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        last_login DATETIME2 NULL
    );
    
    PRINT 'Created table: users';
END
ELSE
BEGIN
    PRINT 'Table already exists: users';
END
GO

-- Table 2: user_languages
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_languages')
BEGIN
    CREATE TABLE user_languages (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        language_id UNIQUEIDENTIFIER NOT NULL,
        instruction_language NVARCHAR(10) NULL,
        proficiency_level NVARCHAR(20) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign keys
        CONSTRAINT FK_user_languages_users FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT FK_user_languages_languages FOREIGN KEY (language_id) REFERENCES languages(id)
    );
    
    PRINT 'Created table: user_languages';
END
ELSE
BEGIN
    PRINT 'Table already exists: user_languages';
END
GO

-- Table 3: study_sessions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'study_sessions')
BEGIN
    CREATE TABLE study_sessions (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        flashcard_id UNIQUEIDENTIFIER NOT NULL,
        user_id UNIQUEIDENTIFIER NULL,
        
        reviewed_at DATETIME2 DEFAULT GETDATE(),
        ease_rating INT NULL,  -- 1-5: how easy was it to recall?
        time_spent_seconds INT NULL,
        
        created_at DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign keys
        CONSTRAINT FK_study_sessions_flashcards FOREIGN KEY (flashcard_id) REFERENCES flashcards(id),
        CONSTRAINT FK_study_sessions_users FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    PRINT 'Created table: study_sessions';
END
ELSE
BEGIN
    PRINT 'Table already exists: study_sessions';
END
GO

-- Verify all tables were created
SELECT 
    t.name AS TableName,
    COUNT(c.name) AS ColumnCount
FROM 
    sys.tables t
LEFT JOIN 
    sys.columns c ON t.object_id = c.object_id
WHERE 
    t.name IN ('users', 'user_languages', 'study_sessions', 'flashcards', 'languages')
GROUP BY 
    t.name
ORDER BY 
    t.name;
GO

PRINT 'Database schema setup complete!';
