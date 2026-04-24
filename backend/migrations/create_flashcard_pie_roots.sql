-- ETY01 Phase 5 (REQ-015, REQ-016): Multi-PIE Root Support
-- Creates junction table for many-to-many relationship between flashcards and PIE roots

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'flashcard_pie_roots')
BEGIN
    CREATE TABLE flashcard_pie_roots (
        id INT IDENTITY(1,1) PRIMARY KEY,
        flashcard_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES flashcards(id),
        pie_root NVARCHAR(100) NOT NULL,
        pie_meaning NVARCHAR(255),
        pie_ipa NVARCHAR(200),
        etymology_layer NVARCHAR(50),  -- "direct", "intermediate", "distant"
        confidence FLOAT,  -- 0.0-1.0
        source NVARCHAR(100),  -- "AI", "manual", "wiktionary", "etymonline"
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );

    CREATE INDEX idx_flashcard_pie_roots_flashcard_id ON flashcard_pie_roots(flashcard_id);
    CREATE INDEX idx_flashcard_pie_roots_pie_root ON flashcard_pie_roots(pie_root);
END
GO
