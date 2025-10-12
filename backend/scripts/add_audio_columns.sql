-- backend/migrations/add_audio_columns.sql
-- Add audio-related columns to flashcards table
-- Run this migration before using audio features

USE LanguageLearning;
GO

PRINT 'Starting audio columns migration...';
PRINT '';

-- Add audio URL column
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.flashcards') 
    AND name = 'audio_url'
)
BEGIN
    ALTER TABLE dbo.flashcards
    ADD audio_url NVARCHAR(500) NULL;
    
    PRINT '✓ Added audio_url column';
END
ELSE
BEGIN
    PRINT '- audio_url column already exists';
END
GO

-- Add audio generation timestamp
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.flashcards') 
    AND name = 'audio_generated_at'
)
BEGIN
    ALTER TABLE dbo.flashcards
    ADD audio_generated_at DATETIME NULL;
    
    PRINT '✓ Added audio_generated_at column';
END
ELSE
BEGIN
    PRINT '- audio_generated_at column already exists';
END
GO

-- Create index for audio lookup (improves query performance)
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE object_id = OBJECT_ID('dbo.flashcards') 
    AND name = 'idx_flashcards_audio'
)
BEGIN
    CREATE INDEX idx_flashcards_audio 
    ON dbo.flashcards(audio_url) 
    WHERE audio_url IS NOT NULL;
    
    PRINT '✓ Created idx_flashcards_audio index';
END
ELSE
BEGIN
    PRINT '- idx_flashcards_audio index already exists';
END
GO

-- Verify changes
PRINT '';
PRINT 'Verifying schema changes...';
PRINT '';

SELECT 
    name AS ColumnName,
    TYPE_NAME(system_type_id) AS DataType,
    max_length AS MaxLength,
    is_nullable AS IsNullable
FROM sys.columns
WHERE object_id = OBJECT_ID('dbo.flashcards')
AND name IN ('audio_url', 'audio_generated_at')
ORDER BY name;
GO

PRINT '';
PRINT '✅ Migration complete!';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Restart your FastAPI server';
PRINT '2. Test: POST /api/audio/generate/{card_id}';
PRINT '3. Run: python backend/scripts/batch_audio_generator.py';
GO
