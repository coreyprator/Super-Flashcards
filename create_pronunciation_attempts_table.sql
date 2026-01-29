-- Create pronunciation_attempts table for Sprint 8.5
-- This table stores user pronunciation practice attempts with audio URLs, transcriptions, and scores

CREATE TABLE [pronunciation_attempts] (
    [id] [uniqueidentifier] NOT NULL PRIMARY KEY DEFAULT (NEWID()),
    [flashcard_id] [uniqueidentifier] NOT NULL FOREIGN KEY REFERENCES [flashcards]([id]),
    [user_id] [uniqueidentifier] NOT NULL FOREIGN KEY REFERENCES [users]([id]),
    [audio_url] [nvarchar](500) NOT NULL,
    [target_text] [nvarchar](500) NOT NULL,
    [transcribed_text] [nvarchar](500),
    [overall_confidence] [numeric](5, 4),
    [word_scores] [nvarchar](max),
    [ipa_target] [nvarchar](200),
    [ipa_transcribed] [nvarchar](200),
    [created_at] [datetime] NOT NULL DEFAULT GETDATE()
);

-- Create index for faster lookups by flashcard and user
CREATE INDEX idx_pronunciation_attempts_flashcard_user 
ON [pronunciation_attempts]([flashcard_id], [user_id]);

-- Create index for looking up user's attempts
CREATE INDEX idx_pronunciation_attempts_user 
ON [pronunciation_attempts]([user_id], [created_at]);
