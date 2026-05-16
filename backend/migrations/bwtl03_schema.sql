-- =============================================================================
-- BWTL03-MEGA Migration — Schema additions for Bring Words to Life (CD v2)
-- Sprint: BWTL03-MEGA-001
-- Created: 2026-05-16
-- Author: CC (BWTL03)
-- =============================================================================
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS chat_promotions;
--   DROP TABLE IF EXISTS chat_messages;
--   DROP TABLE IF EXISTS chat_threads;
--   DROP TABLE IF EXISTS bookmarks;
--   DROP TABLE IF EXISTS bookmark_collections;
--   IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='role_tier')
--     ALTER TABLE users DROP COLUMN role_tier;
--   IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='flashcards' AND COLUMN_NAME='non_pie_reason')
--     ALTER TABLE flashcards DROP COLUMN non_pie_reason;
--
-- =============================================================================

BEGIN TRANSACTION;

-- ---------------------------------------------------------------------------
-- 1. bookmark_collections (must precede bookmarks — FK dependency)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'bookmark_collections'
)
BEGIN
    CREATE TABLE bookmark_collections (
        id          NVARCHAR(50)  NOT NULL CONSTRAINT PK_bookmark_collections PRIMARY KEY,
        name        NVARCHAR(100) NOT NULL,
        owner_id    NVARCHAR(50)  NOT NULL,
        created_at  DATETIME2     NOT NULL CONSTRAINT DF_bookmark_collections_created_at DEFAULT GETUTCDATE()
    );
    PRINT 'Created table: bookmark_collections';
END
ELSE
    PRINT 'Table already exists (skipped): bookmark_collections';

-- ---------------------------------------------------------------------------
-- 2. bookmarks (polymorphic, FK to bookmark_collections)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'bookmarks'
)
BEGIN
    CREATE TABLE bookmarks (
        id              NVARCHAR(50)  NOT NULL CONSTRAINT PK_bookmarks PRIMARY KEY,
        kind            NVARCHAR(20)  NOT NULL,   -- 'word' | 'root' | 'figure' | 'thread' | 'collection'
        ref_id          NVARCHAR(100) NOT NULL,
        ref_label       NVARCHAR(200) NULL,
        owner_id        NVARCHAR(50)  NOT NULL,
        collection_id   NVARCHAR(50)  NULL,
        created_at      DATETIME2     NOT NULL CONSTRAINT DF_bookmarks_created_at DEFAULT GETUTCDATE(),
        CONSTRAINT FK_bookmarks_collection FOREIGN KEY (collection_id)
            REFERENCES bookmark_collections(id)
    );
    CREATE INDEX idx_bookmarks_owner_kind ON bookmarks (kind, ref_id, owner_id);
    PRINT 'Created table: bookmarks';
END
ELSE
    PRINT 'Table already exists (skipped): bookmarks';

-- ---------------------------------------------------------------------------
-- 3. chat_threads (anchor_mode = flashcard_id primary per REV item 1)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'chat_threads'
)
BEGIN
    CREATE TABLE chat_threads (
        id              NVARCHAR(50)  NOT NULL CONSTRAINT PK_chat_threads PRIMARY KEY,
        anchor_mode     NVARCHAR(20)  NOT NULL,   -- 'flashcard_id' (primary), 'pie_root' (legacy), 'figure_id' (future)
        anchor_value    NVARCHAR(100) NOT NULL,
        owner_id        NVARCHAR(50)  NOT NULL,
        title           NVARCHAR(200) NULL,
        created_at      DATETIME2     NOT NULL CONSTRAINT DF_chat_threads_created_at DEFAULT GETUTCDATE(),
        updated_at      DATETIME2     NOT NULL CONSTRAINT DF_chat_threads_updated_at DEFAULT GETUTCDATE()
    );
    CREATE INDEX idx_chat_threads_anchor ON chat_threads (anchor_mode, anchor_value, owner_id);
    PRINT 'Created table: chat_threads';
END
ELSE
    PRINT 'Table already exists (skipped): chat_threads';

-- ---------------------------------------------------------------------------
-- 4. chat_messages (FK to chat_threads)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'chat_messages'
)
BEGIN
    CREATE TABLE chat_messages (
        id                  NVARCHAR(50)  NOT NULL CONSTRAINT PK_chat_messages PRIMARY KEY,
        thread_id           NVARCHAR(50)  NOT NULL,
        role                NVARCHAR(10)  NOT NULL,   -- 'user' or 'ai'
        text                NVARCHAR(MAX) NOT NULL,
        context_snapshot    NVARCHAR(MAX) NULL,        -- JSON: card fields, EFG node, figure, steering directive (REV item 3)
        promotable_json     NVARCHAR(MAX) NULL,        -- JSON: {card, field, preview} when AI message has Accept-able content
        created_at          DATETIME2     NOT NULL CONSTRAINT DF_chat_messages_created_at DEFAULT GETUTCDATE(),
        CONSTRAINT FK_chat_messages_thread FOREIGN KEY (thread_id)
            REFERENCES chat_threads(id)
    );
    CREATE INDEX idx_chat_messages_thread ON chat_messages (thread_id, created_at);
    PRINT 'Created table: chat_messages';
END
ELSE
    PRINT 'Table already exists (skipped): chat_messages';

-- ---------------------------------------------------------------------------
-- 5. chat_promotions (audit log of Accept actions per REV item 4)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'chat_promotions'
)
BEGIN
    CREATE TABLE chat_promotions (
        id              NVARCHAR(50)  NOT NULL CONSTRAINT PK_chat_promotions PRIMARY KEY,
        chat_message_id NVARCHAR(50)  NOT NULL,
        card_id         NVARCHAR(50)  NOT NULL,
        target_field    NVARCHAR(50)  NOT NULL,   -- one of 16 healable fields
        before_value    NVARCHAR(MAX) NULL,
        after_value     NVARCHAR(MAX) NULL,
        accepted_by     NVARCHAR(50)  NOT NULL,
        accepted_at     DATETIME2     NOT NULL CONSTRAINT DF_chat_promotions_accepted_at DEFAULT GETUTCDATE(),
        CONSTRAINT FK_chat_promotions_msg FOREIGN KEY (chat_message_id)
            REFERENCES chat_messages(id)
    );
    CREATE INDEX idx_chat_promotions_card ON chat_promotions (card_id, accepted_at);
    PRINT 'Created table: chat_promotions';
END
ELSE
    PRINT 'Table already exists (skipped): chat_promotions';

-- ---------------------------------------------------------------------------
-- 6. ALTER users — add role_tier
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'role_tier'
)
BEGIN
    ALTER TABLE users ADD role_tier NVARCHAR(20) NOT NULL CONSTRAINT DF_users_role_tier DEFAULT 'learner';
    -- Tiers: 'pl' | 'theo' | 'tutor' | 'learner'
    CREATE INDEX idx_users_role_tier ON users (role_tier);
    PRINT 'Added column: users.role_tier';
END
ELSE
    PRINT 'Column already exists (skipped): users.role_tier';

-- ---------------------------------------------------------------------------
-- 7. ALTER flashcards — add non_pie_reason
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'flashcards' AND COLUMN_NAME = 'non_pie_reason'
)
BEGIN
    ALTER TABLE flashcards ADD non_pie_reason NVARCHAR(200) NULL;
    -- Values: 'proper_noun' | 'modern_coinage' | 'loanword_unrooted' | 'pre_greek_substrate' | 'data_hygiene'
    PRINT 'Added column: flashcards.non_pie_reason';
END
ELSE
    PRINT 'Column already exists (skipped): flashcards.non_pie_reason';

COMMIT TRANSACTION;
PRINT 'BWTL03 schema migration complete.';
