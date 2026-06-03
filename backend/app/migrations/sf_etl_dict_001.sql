-- SF-ETL-DICT: Dictionary content migration
-- Sprint: SF-ETL-DICT-001
-- Database: learning (dbo schema)
-- Apply: POST /admin/apply-migration with {"migration": "sf_etl_dict_001"}
--
-- Phase 1: Create tables
-- Phase 2: Full-text catalog and indexes

-- ── Phase 1: etymology_entries ───────────────────────────────────────────────

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'etymology_entries' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[etymology_entries] (
        [id]            INT            IDENTITY(1,1) NOT NULL,
        [headword]      NVARCHAR(200)  NOT NULL,
        [language]      NVARCHAR(50)   NOT NULL,
        [source]        NVARCHAR(100)  NOT NULL,
        [excerpt]       NVARCHAR(1000) NULL,
        [full_text]     NVARCHAR(MAX)  NULL,
        [page_ref]      NVARCHAR(50)   NULL,
        [confidence]    FLOAT          NULL,
        [rag_source_id] NVARCHAR(64)   NOT NULL,
        [created_at]    DATETIME2      NOT NULL CONSTRAINT [df_etymology_created_at] DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_etymology_entries] PRIMARY KEY CLUSTERED ([id] ASC)
    );

    CREATE INDEX [ix_etymology_headword]
        ON [dbo].[etymology_entries] ([headword]);

    CREATE INDEX [ix_etymology_source]
        ON [dbo].[etymology_entries] ([source]);

    CREATE UNIQUE INDEX [uix_etymology_rag_source_id]
        ON [dbo].[etymology_entries] ([rag_source_id]);
END;

-- ── Phase 1: dcc_vocabulary ──────────────────────────────────────────────────

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'dcc_vocabulary' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[dcc_vocabulary] (
        [id]             INT           IDENTITY(1,1) NOT NULL,
        [greek_word]     NVARCHAR(100) NOT NULL,
        [lemma]          NVARCHAR(100) NOT NULL,
        [gloss]          NVARCHAR(500) NULL,
        [frequency_rank] INT           NULL,
        [pos]            NVARCHAR(200) NULL,
        [semantic_group] NVARCHAR(100) NULL,
        CONSTRAINT [PK_dcc_vocabulary] PRIMARY KEY CLUSTERED ([id] ASC)
    );

    CREATE INDEX [ix_dcc_greek_word]
        ON [dbo].[dcc_vocabulary] ([greek_word]);

    CREATE INDEX [ix_dcc_frequency_rank]
        ON [dbo].[dcc_vocabulary] ([frequency_rank]);
END;

-- ── Phase 2: Full-text catalog ───────────────────────────────────────────────

IF NOT EXISTS (SELECT 1 FROM sys.fulltext_catalogs WHERE name = 'learning_FTCatalog')
BEGIN
    CREATE FULLTEXT CATALOG [learning_FTCatalog]
        WITH ACCENT_SENSITIVITY = OFF;
END;

-- ── Phase 2: Full-text index on etymology_entries ───────────────────────────

IF NOT EXISTS (
    SELECT 1
    FROM sys.fulltext_indexes fi
    JOIN sys.tables t ON fi.object_id = t.object_id
    WHERE t.name = 'etymology_entries' AND t.schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE FULLTEXT INDEX ON [dbo].[etymology_entries]
        ([headword] LANGUAGE 1033, [excerpt] LANGUAGE 1033, [full_text] LANGUAGE 1033)
        KEY INDEX [PK_etymology_entries]
        ON [learning_FTCatalog]
        WITH CHANGE_TRACKING AUTO;
END;

-- ── Phase 2: Full-text index on dcc_vocabulary ──────────────────────────────

IF NOT EXISTS (
    SELECT 1
    FROM sys.fulltext_indexes fi
    JOIN sys.tables t ON fi.object_id = t.object_id
    WHERE t.name = 'dcc_vocabulary' AND t.schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE FULLTEXT INDEX ON [dbo].[dcc_vocabulary]
        ([greek_word] LANGUAGE 1033, [lemma] LANGUAGE 1033, [gloss] LANGUAGE 1033)
        KEY INDEX [PK_dcc_vocabulary]
        ON [learning_FTCatalog]
        WITH CHANGE_TRACKING AUTO;
END;
