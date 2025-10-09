USE [LanguageLearning]
GO

PRINT 'Setting up Full-Text Search...'

-- Create Full-Text Catalog
IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'FlashcardCatalog')
BEGIN
    CREATE FULLTEXT CATALOG FlashcardCatalog AS DEFAULT
    PRINT '✓ Created Full-Text Catalog'
END

-- Drop existing index if exists
IF EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('dbo.flashcards'))
BEGIN
    DROP FULLTEXT INDEX ON dbo.flashcards
END

-- Create full-text index
CREATE FULLTEXT INDEX ON dbo.flashcards
(
    word LANGUAGE 1033,
    translation LANGUAGE 1033,
    pronunciation LANGUAGE 1033,
    etymology LANGUAGE 1033,
    example_sentences LANGUAGE 1033,
    related_words LANGUAGE 1033,
    notes LANGUAGE 1033
)
KEY INDEX PK__flashcar__3213E83F1234567
ON FlashcardCatalog
WITH CHANGE_TRACKING AUTO

PRINT '✓ Created Full-Text Index'

-- Populate index
ALTER FULLTEXT INDEX ON dbo.flashcards START FULL POPULATION
PRINT '✓ Index population started'

-- Test search
PRINT ''
PRINT 'Testing search...'
SELECT TOP 5 word, translation
FROM flashcards
WHERE CONTAINS((word, translation), 'friend OR love OR hello')

PRINT '✅ Full-Text Search setup complete!'
