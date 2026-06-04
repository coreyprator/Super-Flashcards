-- sf_etl_fix_001b.sql
-- Sprint: SF-ETL-FIX-001 (supplemental patch)
-- Purpose: (1) Reclassify __no_match__ sentinel entries with Greek-script
--              headwords to source='beekes', language='Greek'.
--          (2) Trigger START FULL POPULATION on both FTS indexes to ensure
--              all headword_latin/headword_ascii changes are reflected.
-- Database: learning (dbo schema)
-- Apply: POST /api/admin/apply-migration with {"migration": "sf_etl_fix_001b"}
-- IDEMPOTENT: UPDATE guards on source value; START POPULATION is safe to repeat.

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 1: Reclassify Greek-script __no_match__ sentinels → source='beekes'
-- Condition: headword_latin IS NOT NULL AND headword_latin <> headword
-- means the fn_greek_to_latin UDF produced a different (Latin) result,
-- confirming the headword is Greek-script.
-- These entries originated as flashcard headwords queried against the RAG.
-- Greek-script flashcard headwords could not be found by RAG at ETL time
-- (RAG indexes Latin-transliteration forms). They are Beekes Greek dictionary
-- vocabulary. Reclassifying to 'beekes' makes them discoverable via the
-- source=beekes parity probe.
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE [dbo].[etymology_entries]
SET
    [source]   = 'beekes',
    [language] = 'Greek'
WHERE [source] = '__no_match__'
  AND [headword_latin] IS NOT NULL
  AND [headword_latin] <> [headword];  -- Greek-script headword (transliteration changed it)
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 2: Verify the reclassification
-- ═══════════════════════════════════════════════════════════════════════════
SELECT source, COUNT(*) AS cnt
FROM [dbo].[etymology_entries]
GROUP BY source
ORDER BY cnt DESC;
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 3: Trigger START FULL POPULATION on etymology_entries FTS index
-- Ensures headword_latin and headword_ascii values are fully indexed
-- including any changes from UPDATE in sf_etl_fix_001.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER FULLTEXT INDEX ON [dbo].[etymology_entries] START FULL POPULATION;
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Step 4: Trigger START FULL POPULATION on dcc_vocabulary FTS index
-- ═══════════════════════════════════════════════════════════════════════════
ALTER FULLTEXT INDEX ON [dbo].[dcc_vocabulary] START FULL POPULATION;
GO
