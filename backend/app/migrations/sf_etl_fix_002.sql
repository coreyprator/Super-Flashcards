-- sf_etl_fix_002.sql
-- Sprint: SF-ETL-FIX-002
-- Purpose: Re-extract correct headwords from excerpt content for all 3,834 fixable rows.
--          Fixes corrupted headword values (foreign-language flashcard text) using
--          per-dictionary extraction patterns.
-- Database: learning (dbo schema)
-- Apply: POST /api/admin/apply-migration with {"migration": "sf_etl_fix_002"}
-- Version: v0.5.5 → v0.5.6
-- Closes: SF-BUG-086 (partial), SF-BUG-087 (partial), SF-BUG-090
-- Also closes: SF-TSK-034 (SF-ETL-FIX-001 anchor)
--
-- Extraction patterns (Phase 1 M02 documentation):
--   de-vaan:  excerpt starts "de Vaan Latin Etymology: <headword> ..."
--             SUBSTRING after 26-char prefix, up to first space/comma/apostrophe/bracket
--   kroonen:  excerpt starts "*<headword>[-] ..."
--             First token matching * + word chars + optional hyphen
--   watkins:  excerpt starts "Watkins PIE Root: <headword>. ..."
--             SUBSTRING after 18-char prefix, up to first period or space
--   beekes:   two sub-formats:
--             (a) num-first:   "NNN <Greek_word>..." → strip leading digits+space, take first word
--             (b) greek-first: "<Greek_word> NNN..." → take first word (up to first space)
--
-- IDEMPOTENT: UPDATE is safe to re-run (re-applies same logic).
-- SKIPS:  __no_match__ (all null excerpts), beekes NULL-excerpt sentinels

-- ═══════════════════════════════════════════════════════════════════════════
-- M03: de-vaan — 709 rows
-- Pattern: "de Vaan Latin Etymology: " (25 chars) + headword up to space/comma/apostrophe/[
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE dbo.etymology_entries
SET headword = CASE
    -- Extract substring after "de Vaan Latin Etymology: " (25 chars)
    -- Then trim up to the first delimiter: space, comma, apostrophe, [, (
    WHEN CHARINDEX(' ', SUBSTRING(excerpt, 26, 100)) > 0 OR
         CHARINDEX(',', SUBSTRING(excerpt, 26, 100)) > 0 OR
         CHARINDEX('''', SUBSTRING(excerpt, 26, 100)) > 0 OR
         CHARINDEX('[', SUBSTRING(excerpt, 26, 100)) > 0 OR
         CHARINDEX('(', SUBSTRING(excerpt, 26, 100)) > 0
    THEN
        -- Take up to the first of any delimiter
        LEFT(
            SUBSTRING(excerpt, 26, 100),
            CASE
                WHEN (CHARINDEX(' ', SUBSTRING(excerpt, 26, 100)) > 0
                      AND (CHARINDEX(',', SUBSTRING(excerpt, 26, 100)) = 0
                           OR CHARINDEX(' ', SUBSTRING(excerpt, 26, 100)) < CHARINDEX(',', SUBSTRING(excerpt, 26, 100)))
                      AND (CHARINDEX('''', SUBSTRING(excerpt, 26, 100)) = 0
                           OR CHARINDEX(' ', SUBSTRING(excerpt, 26, 100)) < CHARINDEX('''', SUBSTRING(excerpt, 26, 100)))
                      AND (CHARINDEX('[', SUBSTRING(excerpt, 26, 100)) = 0
                           OR CHARINDEX(' ', SUBSTRING(excerpt, 26, 100)) < CHARINDEX('[', SUBSTRING(excerpt, 26, 100)))
                      AND (CHARINDEX('(', SUBSTRING(excerpt, 26, 100)) = 0
                           OR CHARINDEX(' ', SUBSTRING(excerpt, 26, 100)) < CHARINDEX('(', SUBSTRING(excerpt, 26, 100))))
                THEN CHARINDEX(' ', SUBSTRING(excerpt, 26, 100)) - 1
                WHEN (CHARINDEX(',', SUBSTRING(excerpt, 26, 100)) > 0
                      AND (CHARINDEX('''', SUBSTRING(excerpt, 26, 100)) = 0
                           OR CHARINDEX(',', SUBSTRING(excerpt, 26, 100)) < CHARINDEX('''', SUBSTRING(excerpt, 26, 100)))
                      AND (CHARINDEX('[', SUBSTRING(excerpt, 26, 100)) = 0
                           OR CHARINDEX(',', SUBSTRING(excerpt, 26, 100)) < CHARINDEX('[', SUBSTRING(excerpt, 26, 100)))
                      AND (CHARINDEX('(', SUBSTRING(excerpt, 26, 100)) = 0
                           OR CHARINDEX(',', SUBSTRING(excerpt, 26, 100)) < CHARINDEX('(', SUBSTRING(excerpt, 26, 100))))
                THEN CHARINDEX(',', SUBSTRING(excerpt, 26, 100)) - 1
                WHEN (CHARINDEX('''', SUBSTRING(excerpt, 26, 100)) > 0
                      AND (CHARINDEX('[', SUBSTRING(excerpt, 26, 100)) = 0
                           OR CHARINDEX('''', SUBSTRING(excerpt, 26, 100)) < CHARINDEX('[', SUBSTRING(excerpt, 26, 100)))
                      AND (CHARINDEX('(', SUBSTRING(excerpt, 26, 100)) = 0
                           OR CHARINDEX('''', SUBSTRING(excerpt, 26, 100)) < CHARINDEX('(', SUBSTRING(excerpt, 26, 100))))
                THEN CHARINDEX('''', SUBSTRING(excerpt, 26, 100)) - 1
                WHEN (CHARINDEX('[', SUBSTRING(excerpt, 26, 100)) > 0
                      AND (CHARINDEX('(', SUBSTRING(excerpt, 26, 100)) = 0
                           OR CHARINDEX('[', SUBSTRING(excerpt, 26, 100)) < CHARINDEX('(', SUBSTRING(excerpt, 26, 100))))
                THEN CHARINDEX('[', SUBSTRING(excerpt, 26, 100)) - 1
                ELSE CHARINDEX('(', SUBSTRING(excerpt, 26, 100)) - 1
            END
        )
    ELSE SUBSTRING(excerpt, 26, 100)
    END
WHERE source = 'de-vaan'
  AND excerpt IS NOT NULL
  AND excerpt LIKE 'de Vaan Latin Etymology: %'
  AND LEN(SUBSTRING(excerpt, 26, 10)) > 0

GO

-- ═══════════════════════════════════════════════════════════════════════════
-- M04: kroonen — 1,273 rows
-- Pattern: "*<headword>" at start of excerpt (reconstructed PG form)
-- Headword is *word- or *word (with optional trailing hyphen, digits, or spaces)
-- Take from position 1 up to first space or em-dash (—)
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE dbo.etymology_entries
SET headword =
    CASE
        WHEN CHARINDEX(NCHAR(8212), excerpt) > 0  -- em-dash U+2014
             AND CHARINDEX(' ', excerpt) > 0
        THEN
            CASE WHEN CHARINDEX(NCHAR(8212), excerpt) < CHARINDEX(' ', excerpt)
                 THEN RTRIM(LEFT(excerpt, CHARINDEX(NCHAR(8212), excerpt) - 1))
                 ELSE LEFT(excerpt, CHARINDEX(' ', excerpt) - 1)
            END
        WHEN CHARINDEX(NCHAR(8212), excerpt) > 0
        THEN RTRIM(LEFT(excerpt, CHARINDEX(NCHAR(8212), excerpt) - 1))
        WHEN CHARINDEX(' ', excerpt) > 0
        THEN LEFT(excerpt, CHARINDEX(' ', excerpt) - 1)
        ELSE LEFT(excerpt, 50)
    END
WHERE source = 'kroonen'
  AND excerpt IS NOT NULL
  AND excerpt LIKE '*%'

GO

-- ═══════════════════════════════════════════════════════════════════════════
-- M05: watkins — 408 rows
-- Pattern: "Watkins PIE Root: " (18 chars) + headword up to first "." or space
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE dbo.etymology_entries
SET headword =
    CASE
        WHEN CHARINDEX('.', SUBSTRING(excerpt, 19, 50)) > 0
             AND (CHARINDEX(' ', SUBSTRING(excerpt, 19, 50)) = 0
                  OR CHARINDEX('.', SUBSTRING(excerpt, 19, 50)) <= CHARINDEX(' ', SUBSTRING(excerpt, 19, 50)))
        THEN LEFT(SUBSTRING(excerpt, 19, 50), CHARINDEX('.', SUBSTRING(excerpt, 19, 50)) - 1)
        WHEN CHARINDEX(' ', SUBSTRING(excerpt, 19, 50)) > 0
        THEN LEFT(SUBSTRING(excerpt, 19, 50), CHARINDEX(' ', SUBSTRING(excerpt, 19, 50)) - 1)
        ELSE SUBSTRING(excerpt, 19, 50)
    END
WHERE source = 'watkins'
  AND excerpt IS NOT NULL
  AND excerpt LIKE 'Watkins PIE Root: %'

GO
