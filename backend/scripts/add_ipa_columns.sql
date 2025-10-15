-- Add IPA pronunciation fields to flashcards table
-- Mini-Sprint: IPA Pronunciation Enhancement

USE [flashcards_db];
GO

-- Add IPA pronunciation column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'flashcards' AND COLUMN_NAME = 'ipa_pronunciation')
BEGIN
    ALTER TABLE flashcards 
    ADD ipa_pronunciation NVARCHAR(500) NULL;
    PRINT 'Added ipa_pronunciation column';
END
ELSE
BEGIN
    PRINT 'ipa_pronunciation column already exists';
END

-- Add IPA audio URL column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'flashcards' AND COLUMN_NAME = 'ipa_audio_url')
BEGIN
    ALTER TABLE flashcards 
    ADD ipa_audio_url NVARCHAR(500) NULL;
    PRINT 'Added ipa_audio_url column';
END
ELSE
BEGIN
    PRINT 'ipa_audio_url column already exists';
END

-- Add IPA generated timestamp column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'flashcards' AND COLUMN_NAME = 'ipa_generated_at')
BEGIN
    ALTER TABLE flashcards 
    ADD ipa_generated_at DATETIME2 NULL;
    PRINT 'Added ipa_generated_at column';
END
ELSE
BEGIN
    PRINT 'ipa_generated_at column already exists';
END

-- Create index for performance on IPA pronunciation lookups
IF NOT EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'IX_flashcards_ipa_pronunciation' AND object_id = OBJECT_ID('flashcards'))
BEGIN
    CREATE INDEX IX_flashcards_ipa_pronunciation 
    ON flashcards (ipa_pronunciation);
    PRINT 'Created index on ipa_pronunciation';
END
ELSE
BEGIN
    PRINT 'Index on ipa_pronunciation already exists';
END

PRINT 'IPA columns migration completed successfully!';
GO