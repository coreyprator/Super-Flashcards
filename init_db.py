#!/usr/bin/env python3
"""
Initialize pronunciation_attempts table in Cloud SQL
Run this once to create the table for Sprint 8.5
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import text
from app.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SQL to create pronunciation_attempts table
CREATE_TABLE_SQL = """
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'pronunciation_attempts')
BEGIN
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

    -- Create indexes
    CREATE INDEX idx_pronunciation_attempts_flashcard_user 
    ON [pronunciation_attempts]([flashcard_id], [user_id]);

    CREATE INDEX idx_pronunciation_attempts_user 
    ON [pronunciation_attempts]([user_id], [created_at]);
    
    PRINT 'Table pronunciation_attempts created successfully';
END
ELSE
BEGIN
    PRINT 'Table pronunciation_attempts already exists';
END;
"""

def init_db():
    """Initialize the pronunciation_attempts table"""
    try:
        with engine.connect() as connection:
            logger.info("✅ Connected to Cloud SQL database")
            
            # Execute the SQL
            connection.execute(text(CREATE_TABLE_SQL))
            connection.commit()
            
            logger.info("✅ pronunciation_attempts table created/verified")
            return True
    except Exception as e:
        logger.error(f"❌ Error creating table: {e}")
        return False

if __name__ == "__main__":
    success = init_db()
    sys.exit(0 if success else 1)
