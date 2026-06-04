-- sf_etl_fix_001.sql
-- Sprint: SF-ETL-FIX-001
-- Purpose: Add headword_latin (Greek→Latin transliteration) and
--          headword_ascii (diacritic/macron-stripped) columns to
--          etymology_entries and dcc_vocabulary; rebuild FTS indexes.
-- Database: learning (dbo schema)
-- Apply: POST /api/admin/apply-migration with {"migration": "sf_etl_fix_001"}
-- Version: v0.5.4 → v0.5.5
-- Closes: SF-BUG-086 (Greek-script headwords), SF-BUG-087 (macron headwords)
--
-- IDEMPOTENT: all ALTER TABLE guarded with IF NOT EXISTS on column.
-- UDFs use CREATE OR ALTER (SQL Server 2016+).
-- FTS ADD columns guarded — will raise harmless error if already indexed;
-- the migration runner catches and re-throws, so Phase 3 uses START POPULATION
-- separately after a manual ADD in a safe block.

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 1a: helper UDF — Greek Unicode → Latin transliteration
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR ALTER FUNCTION [dbo].[fn_greek_to_latin] (@s NVARCHAR(MAX))
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @r NVARCHAR(MAX) = @s;

    -- ── Multi-character mappings FIRST (order matters) ──────────────────────
    -- Theta (uppercase + lowercase)
    SET @r = REPLACE(@r, N'Θ', N'th');
    SET @r = REPLACE(@r, N'θ', N'th');
    -- Phi
    SET @r = REPLACE(@r, N'Φ', N'ph');
    SET @r = REPLACE(@r, N'φ', N'ph');
    -- Chi
    SET @r = REPLACE(@r, N'Χ', N'ch');
    SET @r = REPLACE(@r, N'χ', N'ch');
    -- Psi
    SET @r = REPLACE(@r, N'Ψ', N'ps');
    SET @r = REPLACE(@r, N'ψ', N'ps');
    -- Theta symbol (U+03D1)
    SET @r = REPLACE(@r, N'ϑ', N'th');
    -- Phi symbol (U+03D5)
    SET @r = REPLACE(@r, N'ϕ', N'ph');

    -- ── Polytonic precomposed: Theta class (all map to 'th' above) ──────────

    -- ── Polytonic: Alpha with all accent/breathing combinations ─────────────
    -- U+1F00-U+1F07 (lowercase, various breathings/accents)
    SET @r = REPLACE(@r, N'ἀ', N'a'); SET @r = REPLACE(@r, N'ἁ', N'a');
    SET @r = REPLACE(@r, N'ἂ', N'a'); SET @r = REPLACE(@r, N'ἃ', N'a');
    SET @r = REPLACE(@r, N'ἄ', N'a'); SET @r = REPLACE(@r, N'ἅ', N'a');
    SET @r = REPLACE(@r, N'ἆ', N'a'); SET @r = REPLACE(@r, N'ἇ', N'a');
    -- U+1F08-U+1F0F (uppercase)
    SET @r = REPLACE(@r, N'Ἀ', N'a'); SET @r = REPLACE(@r, N'Ἁ', N'a');
    SET @r = REPLACE(@r, N'Ἂ', N'a'); SET @r = REPLACE(@r, N'Ἃ', N'a');
    SET @r = REPLACE(@r, N'Ἄ', N'a'); SET @r = REPLACE(@r, N'Ἅ', N'a');
    SET @r = REPLACE(@r, N'Ἆ', N'a'); SET @r = REPLACE(@r, N'Ἇ', N'a');
    -- U+1F70-U+1F71 (grave, acute)
    SET @r = REPLACE(@r, N'ὰ', N'a'); SET @r = REPLACE(@r, N'ά', N'a');
    -- U+1FB0-U+1FB4, U+1FB6-U+1FBB
    SET @r = REPLACE(@r, N'ᾰ', N'a'); SET @r = REPLACE(@r, N'ᾱ', N'a');
    SET @r = REPLACE(@r, N'ᾲ', N'a'); SET @r = REPLACE(@r, N'ᾳ', N'a');
    SET @r = REPLACE(@r, N'ᾴ', N'a'); SET @r = REPLACE(@r, N'ᾶ', N'a');
    SET @r = REPLACE(@r, N'ᾷ', N'a'); SET @r = REPLACE(@r, N'Ᾰ', N'a');
    SET @r = REPLACE(@r, N'Ᾱ', N'a'); SET @r = REPLACE(@r, N'Ὰ', N'a');
    SET @r = REPLACE(@r, N'Ά', N'a'); SET @r = REPLACE(@r, N'ᾼ', N'a');
    -- U+1F80-U+1F87 (alpha with subscript iota)
    SET @r = REPLACE(@r, N'ᾀ', N'a'); SET @r = REPLACE(@r, N'ᾁ', N'a');
    SET @r = REPLACE(@r, N'ᾂ', N'a'); SET @r = REPLACE(@r, N'ᾃ', N'a');
    SET @r = REPLACE(@r, N'ᾄ', N'a'); SET @r = REPLACE(@r, N'ᾅ', N'a');
    SET @r = REPLACE(@r, N'ᾆ', N'a'); SET @r = REPLACE(@r, N'ᾇ', N'a');
    SET @r = REPLACE(@r, N'ᾈ', N'a'); SET @r = REPLACE(@r, N'ᾉ', N'a');
    SET @r = REPLACE(@r, N'ᾊ', N'a'); SET @r = REPLACE(@r, N'ᾋ', N'a');
    SET @r = REPLACE(@r, N'ᾌ', N'a'); SET @r = REPLACE(@r, N'ᾍ', N'a');
    SET @r = REPLACE(@r, N'ᾎ', N'a'); SET @r = REPLACE(@r, N'ᾏ', N'a');

    -- ── Polytonic: Epsilon ───────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'ἐ', N'e'); SET @r = REPLACE(@r, N'ἑ', N'e');
    SET @r = REPLACE(@r, N'ἒ', N'e'); SET @r = REPLACE(@r, N'ἓ', N'e');
    SET @r = REPLACE(@r, N'ἔ', N'e'); SET @r = REPLACE(@r, N'ἕ', N'e');
    SET @r = REPLACE(@r, N'Ἐ', N'e'); SET @r = REPLACE(@r, N'Ἑ', N'e');
    SET @r = REPLACE(@r, N'Ἒ', N'e'); SET @r = REPLACE(@r, N'Ἓ', N'e');
    SET @r = REPLACE(@r, N'Ἔ', N'e'); SET @r = REPLACE(@r, N'Ἕ', N'e');
    SET @r = REPLACE(@r, N'ὲ', N'e'); SET @r = REPLACE(@r, N'έ', N'e');
    SET @r = REPLACE(@r, N'Ὲ', N'e'); SET @r = REPLACE(@r, N'Έ', N'e');

    -- ── Polytonic: Eta ───────────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'ἠ', N'e'); SET @r = REPLACE(@r, N'ἡ', N'e');
    SET @r = REPLACE(@r, N'ἢ', N'e'); SET @r = REPLACE(@r, N'ἣ', N'e');
    SET @r = REPLACE(@r, N'ἤ', N'e'); SET @r = REPLACE(@r, N'ἥ', N'e');
    SET @r = REPLACE(@r, N'ἦ', N'e'); SET @r = REPLACE(@r, N'ἧ', N'e');
    SET @r = REPLACE(@r, N'Ἠ', N'e'); SET @r = REPLACE(@r, N'Ἡ', N'e');
    SET @r = REPLACE(@r, N'Ἢ', N'e'); SET @r = REPLACE(@r, N'Ἣ', N'e');
    SET @r = REPLACE(@r, N'Ἤ', N'e'); SET @r = REPLACE(@r, N'Ἥ', N'e');
    SET @r = REPLACE(@r, N'Ἦ', N'e'); SET @r = REPLACE(@r, N'Ἧ', N'e');
    SET @r = REPLACE(@r, N'ὴ', N'e'); SET @r = REPLACE(@r, N'ή', N'e');
    SET @r = REPLACE(@r, N'ῆ', N'e'); SET @r = REPLACE(@r, N'Ὴ', N'e');
    SET @r = REPLACE(@r, N'Ή', N'e'); SET @r = REPLACE(@r, N'ῌ', N'e');
    -- Eta with subscript iota
    SET @r = REPLACE(@r, N'ᾐ', N'e'); SET @r = REPLACE(@r, N'ᾑ', N'e');
    SET @r = REPLACE(@r, N'ᾒ', N'e'); SET @r = REPLACE(@r, N'ᾓ', N'e');
    SET @r = REPLACE(@r, N'ᾔ', N'e'); SET @r = REPLACE(@r, N'ᾕ', N'e');
    SET @r = REPLACE(@r, N'ᾖ', N'e'); SET @r = REPLACE(@r, N'ᾗ', N'e');
    SET @r = REPLACE(@r, N'ᾘ', N'e'); SET @r = REPLACE(@r, N'ᾙ', N'e');
    SET @r = REPLACE(@r, N'ᾚ', N'e'); SET @r = REPLACE(@r, N'ᾛ', N'e');
    SET @r = REPLACE(@r, N'ᾜ', N'e'); SET @r = REPLACE(@r, N'ᾝ', N'e');
    SET @r = REPLACE(@r, N'ᾞ', N'e'); SET @r = REPLACE(@r, N'ᾟ', N'e');

    -- ── Polytonic: Iota ─────────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'ἰ', N'i'); SET @r = REPLACE(@r, N'ἱ', N'i');
    SET @r = REPLACE(@r, N'ἲ', N'i'); SET @r = REPLACE(@r, N'ἳ', N'i');
    SET @r = REPLACE(@r, N'ἴ', N'i'); SET @r = REPLACE(@r, N'ἵ', N'i');
    SET @r = REPLACE(@r, N'ἶ', N'i'); SET @r = REPLACE(@r, N'ἷ', N'i');
    SET @r = REPLACE(@r, N'Ἰ', N'i'); SET @r = REPLACE(@r, N'Ἱ', N'i');
    SET @r = REPLACE(@r, N'Ἲ', N'i'); SET @r = REPLACE(@r, N'Ἳ', N'i');
    SET @r = REPLACE(@r, N'Ἴ', N'i'); SET @r = REPLACE(@r, N'Ἵ', N'i');
    SET @r = REPLACE(@r, N'Ἶ', N'i'); SET @r = REPLACE(@r, N'Ἷ', N'i');
    SET @r = REPLACE(@r, N'ὶ', N'i'); SET @r = REPLACE(@r, N'ί', N'i');
    SET @r = REPLACE(@r, N'ῖ', N'i'); SET @r = REPLACE(@r, N'Ὶ', N'i');
    SET @r = REPLACE(@r, N'Ί', N'i');
    -- Iota with dialytika
    SET @r = REPLACE(@r, N'ϊ', N'i'); SET @r = REPLACE(@r, N'ΐ', N'i');
    -- Iota subscript (standalone)
    SET @r = REPLACE(@r, N'ι', N'i');  -- also handles plain iota again below

    -- ── Polytonic: Omicron ──────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'ὀ', N'o'); SET @r = REPLACE(@r, N'ὁ', N'o');
    SET @r = REPLACE(@r, N'ὂ', N'o'); SET @r = REPLACE(@r, N'ὃ', N'o');
    SET @r = REPLACE(@r, N'ὄ', N'o'); SET @r = REPLACE(@r, N'ὅ', N'o');
    SET @r = REPLACE(@r, N'Ὀ', N'o'); SET @r = REPLACE(@r, N'Ὁ', N'o');
    SET @r = REPLACE(@r, N'Ὂ', N'o'); SET @r = REPLACE(@r, N'Ὃ', N'o');
    SET @r = REPLACE(@r, N'Ὄ', N'o'); SET @r = REPLACE(@r, N'Ὅ', N'o');
    SET @r = REPLACE(@r, N'ὸ', N'o'); SET @r = REPLACE(@r, N'ό', N'o');
    SET @r = REPLACE(@r, N'Ὸ', N'o'); SET @r = REPLACE(@r, N'Ό', N'o');

    -- ── Polytonic: Upsilon ──────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'ὐ', N'u'); SET @r = REPLACE(@r, N'ὑ', N'u');
    SET @r = REPLACE(@r, N'ὒ', N'u'); SET @r = REPLACE(@r, N'ὓ', N'u');
    SET @r = REPLACE(@r, N'ὔ', N'u'); SET @r = REPLACE(@r, N'ὕ', N'u');
    SET @r = REPLACE(@r, N'ὖ', N'u'); SET @r = REPLACE(@r, N'ὗ', N'u');
    SET @r = REPLACE(@r, N'Ὑ', N'u'); SET @r = REPLACE(@r, N'Ὓ', N'u');
    SET @r = REPLACE(@r, N'Ὕ', N'u'); SET @r = REPLACE(@r, N'Ὗ', N'u');
    SET @r = REPLACE(@r, N'ὺ', N'u'); SET @r = REPLACE(@r, N'ύ', N'u');
    SET @r = REPLACE(@r, N'ῦ', N'u'); SET @r = REPLACE(@r, N'Ὺ', N'u');
    SET @r = REPLACE(@r, N'Ύ', N'u');
    -- Upsilon with dialytika
    SET @r = REPLACE(@r, N'ϋ', N'u'); SET @r = REPLACE(@r, N'ΰ', N'u');
    -- Upsilon symbol
    SET @r = REPLACE(@r, N'ϒ', N'u');

    -- ── Polytonic: Omega ────────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'ὠ', N'o'); SET @r = REPLACE(@r, N'ὡ', N'o');
    SET @r = REPLACE(@r, N'ὢ', N'o'); SET @r = REPLACE(@r, N'ὣ', N'o');
    SET @r = REPLACE(@r, N'ὤ', N'o'); SET @r = REPLACE(@r, N'ὥ', N'o');
    SET @r = REPLACE(@r, N'ὦ', N'o'); SET @r = REPLACE(@r, N'ὧ', N'o');
    SET @r = REPLACE(@r, N'Ὠ', N'o'); SET @r = REPLACE(@r, N'Ὡ', N'o');
    SET @r = REPLACE(@r, N'Ὢ', N'o'); SET @r = REPLACE(@r, N'Ὣ', N'o');
    SET @r = REPLACE(@r, N'Ὤ', N'o'); SET @r = REPLACE(@r, N'Ὥ', N'o');
    SET @r = REPLACE(@r, N'Ὦ', N'o'); SET @r = REPLACE(@r, N'Ὧ', N'o');
    SET @r = REPLACE(@r, N'ὼ', N'o'); SET @r = REPLACE(@r, N'ώ', N'o');
    SET @r = REPLACE(@r, N'ῶ', N'o'); SET @r = REPLACE(@r, N'Ὼ', N'o');
    SET @r = REPLACE(@r, N'Ώ', N'o'); SET @r = REPLACE(@r, N'ῼ', N'o');
    -- Omega with subscript iota
    SET @r = REPLACE(@r, N'ᾠ', N'o'); SET @r = REPLACE(@r, N'ᾡ', N'o');
    SET @r = REPLACE(@r, N'ᾢ', N'o'); SET @r = REPLACE(@r, N'ᾣ', N'o');
    SET @r = REPLACE(@r, N'ᾤ', N'o'); SET @r = REPLACE(@r, N'ᾥ', N'o');
    SET @r = REPLACE(@r, N'ᾦ', N'o'); SET @r = REPLACE(@r, N'ᾧ', N'o');
    SET @r = REPLACE(@r, N'ᾨ', N'o'); SET @r = REPLACE(@r, N'ᾩ', N'o');
    SET @r = REPLACE(@r, N'ᾪ', N'o'); SET @r = REPLACE(@r, N'ᾫ', N'o');
    SET @r = REPLACE(@r, N'ᾬ', N'o'); SET @r = REPLACE(@r, N'ᾭ', N'o');
    SET @r = REPLACE(@r, N'ᾮ', N'o'); SET @r = REPLACE(@r, N'ᾯ', N'o');

    -- ── Polytonic: Rho with breathing ───────────────────────────────────────
    SET @r = REPLACE(@r, N'ῤ', N'r'); SET @r = REPLACE(@r, N'ῥ', N'r');
    SET @r = REPLACE(@r, N'Ῥ', N'r');

    -- ── Basic Greek with tonos (U+0386, U+0388-038A, U+038C, U+038E-038F) ───
    SET @r = REPLACE(@r, N'Ά', N'a'); -- U+0386
    SET @r = REPLACE(@r, N'Έ', N'e'); -- U+0388
    SET @r = REPLACE(@r, N'Ή', N'e'); -- U+0389
    SET @r = REPLACE(@r, N'Ί', N'i'); -- U+038A
    SET @r = REPLACE(@r, N'Ό', N'o'); -- U+038C
    SET @r = REPLACE(@r, N'Ύ', N'u'); -- U+038E
    SET @r = REPLACE(@r, N'Ώ', N'o'); -- U+038F
    SET @r = REPLACE(@r, N'ά', N'a'); -- U+03AC
    SET @r = REPLACE(@r, N'έ', N'e'); -- U+03AD
    SET @r = REPLACE(@r, N'ή', N'e'); -- U+03AE
    SET @r = REPLACE(@r, N'ί', N'i'); -- U+03AF
    SET @r = REPLACE(@r, N'ΐ', N'i'); -- U+0390 (iota with dialytika+tonos)
    SET @r = REPLACE(@r, N'ό', N'o'); -- U+03CC
    SET @r = REPLACE(@r, N'ύ', N'u'); -- U+03CD
    SET @r = REPLACE(@r, N'ώ', N'o'); -- U+03CE

    -- ── Basic Greek uppercase (U+0391-U+03A9) ───────────────────────────────
    SET @r = REPLACE(@r, N'Α', N'a'); SET @r = REPLACE(@r, N'Β', N'b');
    SET @r = REPLACE(@r, N'Γ', N'g'); SET @r = REPLACE(@r, N'Δ', N'd');
    SET @r = REPLACE(@r, N'Ε', N'e'); SET @r = REPLACE(@r, N'Ζ', N'z');
    SET @r = REPLACE(@r, N'Η', N'e'); SET @r = REPLACE(@r, N'Θ', N'th');
    SET @r = REPLACE(@r, N'Ι', N'i'); SET @r = REPLACE(@r, N'Κ', N'k');
    SET @r = REPLACE(@r, N'Λ', N'l'); SET @r = REPLACE(@r, N'Μ', N'm');
    SET @r = REPLACE(@r, N'Ν', N'n'); SET @r = REPLACE(@r, N'Ξ', N'x');
    SET @r = REPLACE(@r, N'Ο', N'o'); SET @r = REPLACE(@r, N'Π', N'p');
    SET @r = REPLACE(@r, N'Ρ', N'r'); SET @r = REPLACE(@r, N'Σ', N's');
    SET @r = REPLACE(@r, N'Τ', N't'); SET @r = REPLACE(@r, N'Υ', N'u');
    -- Φ, Χ, Ψ already handled above (multi-char)
    SET @r = REPLACE(@r, N'Ω', N'o');

    -- ── Basic Greek lowercase (U+03B1-U+03C9) ───────────────────────────────
    SET @r = REPLACE(@r, N'α', N'a'); SET @r = REPLACE(@r, N'β', N'b');
    SET @r = REPLACE(@r, N'γ', N'g'); SET @r = REPLACE(@r, N'δ', N'd');
    SET @r = REPLACE(@r, N'ε', N'e'); SET @r = REPLACE(@r, N'ζ', N'z');
    SET @r = REPLACE(@r, N'η', N'e'); SET @r = REPLACE(@r, N'ι', N'i');
    SET @r = REPLACE(@r, N'κ', N'k'); SET @r = REPLACE(@r, N'λ', N'l');
    SET @r = REPLACE(@r, N'μ', N'm'); SET @r = REPLACE(@r, N'ν', N'n');
    SET @r = REPLACE(@r, N'ξ', N'x'); SET @r = REPLACE(@r, N'ο', N'o');
    SET @r = REPLACE(@r, N'π', N'p'); SET @r = REPLACE(@r, N'ρ', N'r');
    SET @r = REPLACE(@r, N'σ', N's'); SET @r = REPLACE(@r, N'ς', N's');
    SET @r = REPLACE(@r, N'τ', N't'); SET @r = REPLACE(@r, N'υ', N'u');
    SET @r = REPLACE(@r, N'ω', N'o');
    -- ϐ (beta symbol U+03D0), ϖ (pi symbol U+03D6)
    SET @r = REPLACE(@r, N'ϐ', N'b'); SET @r = REPLACE(@r, N'ϖ', N'p');

    -- ── Strip remaining combining diacritics (breathing marks, accents) ──────
    -- These Unicode combining marks may appear with NFD-decomposed Greek.
    -- U+0300 grave, U+0301 acute, U+0302 circumflex, U+0304 macron,
    -- U+0306 breve, U+0308 dialytika, U+0313 psili, U+0314 dasia,
    -- U+0342 perispomeni, U+0345 ypogegrammeni
    SET @r = REPLACE(@r, NCHAR(0x0300), N'');
    SET @r = REPLACE(@r, NCHAR(0x0301), N'');
    SET @r = REPLACE(@r, NCHAR(0x0302), N'');
    SET @r = REPLACE(@r, NCHAR(0x0304), N'');
    SET @r = REPLACE(@r, NCHAR(0x0306), N'');
    SET @r = REPLACE(@r, NCHAR(0x0308), N'');
    SET @r = REPLACE(@r, NCHAR(0x0313), N'');
    SET @r = REPLACE(@r, NCHAR(0x0314), N'');
    SET @r = REPLACE(@r, NCHAR(0x0342), N'');
    SET @r = REPLACE(@r, NCHAR(0x0345), N'');

    RETURN @r;
END
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2a: helper UDF — ASCII fold (strip macrons, umlauts, accents)
-- Covers: Latin macrons (ā/Ā, ē/Ē, ī/Ī, ō/Ō, ū/Ū),
--         German umlauts (ä→a, ö→o, ü→u), sharp-s (ß→ss),
--         common accented Latin (é→e, à→a, etc.)
-- Does NOT transliterate Greek — call fn_greek_to_latin first for Greek input.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR ALTER FUNCTION [dbo].[fn_ascii_fold] (@s NVARCHAR(MAX))
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @r NVARCHAR(MAX) = @s;

    -- ── Latin macrons ────────────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'ā', N'a'); SET @r = REPLACE(@r, N'Ā', N'a');
    SET @r = REPLACE(@r, N'ē', N'e'); SET @r = REPLACE(@r, N'Ē', N'e');
    SET @r = REPLACE(@r, N'ī', N'i'); SET @r = REPLACE(@r, N'Ī', N'i');
    SET @r = REPLACE(@r, N'ō', N'o'); SET @r = REPLACE(@r, N'Ō', N'o');
    SET @r = REPLACE(@r, N'ū', N'u'); SET @r = REPLACE(@r, N'Ū', N'u');
    SET @r = REPLACE(@r, N'ȳ', N'y'); SET @r = REPLACE(@r, N'Ȳ', N'y');

    -- ── Latin with breve ─────────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'ă', N'a'); SET @r = REPLACE(@r, N'Ă', N'a');
    SET @r = REPLACE(@r, N'ĕ', N'e'); SET @r = REPLACE(@r, N'Ĕ', N'e');
    SET @r = REPLACE(@r, N'ĭ', N'i'); SET @r = REPLACE(@r, N'Ĭ', N'i');
    SET @r = REPLACE(@r, N'ŏ', N'o'); SET @r = REPLACE(@r, N'Ŏ', N'o');
    SET @r = REPLACE(@r, N'ŭ', N'u'); SET @r = REPLACE(@r, N'Ŭ', N'u');

    -- ── German umlauts and sharp-s ───────────────────────────────────────────
    SET @r = REPLACE(@r, N'ä', N'a'); SET @r = REPLACE(@r, N'Ä', N'a');
    SET @r = REPLACE(@r, N'ö', N'o'); SET @r = REPLACE(@r, N'Ö', N'o');
    SET @r = REPLACE(@r, N'ü', N'u'); SET @r = REPLACE(@r, N'Ü', N'u');
    SET @r = REPLACE(@r, N'ß', N'ss');

    -- ── Accented A ───────────────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'á', N'a'); SET @r = REPLACE(@r, N'Á', N'a');
    SET @r = REPLACE(@r, N'à', N'a'); SET @r = REPLACE(@r, N'À', N'a');
    SET @r = REPLACE(@r, N'â', N'a'); SET @r = REPLACE(@r, N'Â', N'a');
    SET @r = REPLACE(@r, N'ã', N'a'); SET @r = REPLACE(@r, N'Ã', N'a');
    SET @r = REPLACE(@r, N'å', N'a'); SET @r = REPLACE(@r, N'Å', N'a');
    SET @r = REPLACE(@r, N'æ', N'ae'); SET @r = REPLACE(@r, N'Æ', N'ae');

    -- ── Accented E ───────────────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'é', N'e'); SET @r = REPLACE(@r, N'É', N'e');
    SET @r = REPLACE(@r, N'è', N'e'); SET @r = REPLACE(@r, N'È', N'e');
    SET @r = REPLACE(@r, N'ê', N'e'); SET @r = REPLACE(@r, N'Ê', N'e');
    SET @r = REPLACE(@r, N'ë', N'e'); SET @r = REPLACE(@r, N'Ë', N'e');

    -- ── Accented I ───────────────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'í', N'i'); SET @r = REPLACE(@r, N'Í', N'i');
    SET @r = REPLACE(@r, N'ì', N'i'); SET @r = REPLACE(@r, N'Ì', N'i');
    SET @r = REPLACE(@r, N'î', N'i'); SET @r = REPLACE(@r, N'Î', N'i');
    SET @r = REPLACE(@r, N'ï', N'i'); SET @r = REPLACE(@r, N'Ï', N'i');

    -- ── Accented O ───────────────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'ó', N'o'); SET @r = REPLACE(@r, N'Ó', N'o');
    SET @r = REPLACE(@r, N'ò', N'o'); SET @r = REPLACE(@r, N'Ò', N'o');
    SET @r = REPLACE(@r, N'ô', N'o'); SET @r = REPLACE(@r, N'Ô', N'o');
    SET @r = REPLACE(@r, N'õ', N'o'); SET @r = REPLACE(@r, N'Õ', N'o');
    SET @r = REPLACE(@r, N'ø', N'o'); SET @r = REPLACE(@r, N'Ø', N'o');

    -- ── Accented U ───────────────────────────────────────────────────────────
    SET @r = REPLACE(@r, N'ú', N'u'); SET @r = REPLACE(@r, N'Ú', N'u');
    SET @r = REPLACE(@r, N'ù', N'u'); SET @r = REPLACE(@r, N'Ù', N'u');
    SET @r = REPLACE(@r, N'û', N'u'); SET @r = REPLACE(@r, N'Û', N'u');

    -- ── Other common Latin diacritics ────────────────────────────────────────
    SET @r = REPLACE(@r, N'ç', N'c'); SET @r = REPLACE(@r, N'Ç', N'c');
    SET @r = REPLACE(@r, N'ñ', N'n'); SET @r = REPLACE(@r, N'Ñ', N'n');
    SET @r = REPLACE(@r, N'ý', N'y'); SET @r = REPLACE(@r, N'Ý', N'y');
    SET @r = REPLACE(@r, N'ÿ', N'y'); SET @r = REPLACE(@r, N'Ÿ', N'y');

    -- ── Strip remaining combining diacritics ─────────────────────────────────
    SET @r = REPLACE(@r, NCHAR(0x0300), N'');  -- combining grave
    SET @r = REPLACE(@r, NCHAR(0x0301), N'');  -- combining acute
    SET @r = REPLACE(@r, NCHAR(0x0302), N'');  -- combining circumflex
    SET @r = REPLACE(@r, NCHAR(0x0303), N'');  -- combining tilde
    SET @r = REPLACE(@r, NCHAR(0x0304), N'');  -- combining macron
    SET @r = REPLACE(@r, NCHAR(0x0306), N'');  -- combining breve
    SET @r = REPLACE(@r, NCHAR(0x0307), N'');  -- combining dot above
    SET @r = REPLACE(@r, NCHAR(0x0308), N'');  -- combining diaeresis
    SET @r = REPLACE(@r, NCHAR(0x030A), N'');  -- combining ring above
    SET @r = REPLACE(@r, NCHAR(0x030B), N'');  -- combining double acute
    SET @r = REPLACE(@r, NCHAR(0x030C), N'');  -- combining caron

    RETURN @r;
END
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 1b: ADD headword_latin column to etymology_entries
-- ═══════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'etymology_entries'
      AND COLUMN_NAME = 'headword_latin'
)
BEGIN
    ALTER TABLE [dbo].[etymology_entries]
        ADD [headword_latin] NVARCHAR(255) NULL;
END;
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 1c: POPULATE headword_latin in etymology_entries
-- Greek-source entries (beekes): full Greek→Latin transliteration.
-- All other entries: copy headword as-is (already Latin-script).
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE [dbo].[etymology_entries]
SET [headword_latin] = [dbo].[fn_greek_to_latin]([headword])
WHERE [headword] IS NOT NULL
  AND ([headword_latin] IS NULL OR [headword_latin] = [headword]);
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 1d: ADD + POPULATE headword_latin on dcc_vocabulary
-- ═══════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'dcc_vocabulary'
      AND COLUMN_NAME = 'headword_latin'
)
BEGIN
    ALTER TABLE [dbo].[dcc_vocabulary]
        ADD [headword_latin] NVARCHAR(255) NULL;
END;
GO

UPDATE [dbo].[dcc_vocabulary]
SET [headword_latin] = [dbo].[fn_greek_to_latin]([greek_word])
WHERE [greek_word] IS NOT NULL
  AND ([headword_latin] IS NULL OR [headword_latin] = [greek_word]);
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2b: ADD headword_ascii column to etymology_entries
-- ═══════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'etymology_entries'
      AND COLUMN_NAME = 'headword_ascii'
)
BEGIN
    ALTER TABLE [dbo].[etymology_entries]
        ADD [headword_ascii] NVARCHAR(255) NULL;
END;
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2c: POPULATE headword_ascii in etymology_entries
-- Apply ASCII fold to headword_latin (already Greek-transliterated) so that
-- macron-headword entries (rēx→rex) are also covered.
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE [dbo].[etymology_entries]
SET [headword_ascii] = [dbo].[fn_ascii_fold](COALESCE([headword_latin], [headword]))
WHERE COALESCE([headword_latin], [headword]) IS NOT NULL
  AND ([headword_ascii] IS NULL);
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2d: ADD + POPULATE headword_ascii on dcc_vocabulary
-- ═══════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'dcc_vocabulary'
      AND COLUMN_NAME = 'headword_ascii'
)
BEGIN
    ALTER TABLE [dbo].[dcc_vocabulary]
        ADD [headword_ascii] NVARCHAR(255) NULL;
END;
GO

UPDATE [dbo].[dcc_vocabulary]
SET [headword_ascii] = [dbo].[fn_ascii_fold](COALESCE([headword_latin], [greek_word]))
WHERE COALESCE([headword_latin], [greek_word]) IS NOT NULL
  AND ([headword_ascii] IS NULL);
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 3: Extend FTS index on etymology_entries with new columns
-- AUTOCOMMIT is required for all FULLTEXT DDL (handled by migration runner).
-- ═══════════════════════════════════════════════════════════════════════════
ALTER FULLTEXT INDEX ON [dbo].[etymology_entries]
    ADD ([headword_latin] LANGUAGE 1033, [headword_ascii] LANGUAGE 1033);
GO

ALTER FULLTEXT INDEX ON [dbo].[etymology_entries] START FULL POPULATION;
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 3: Extend FTS index on dcc_vocabulary with new columns
-- ═══════════════════════════════════════════════════════════════════════════
ALTER FULLTEXT INDEX ON [dbo].[dcc_vocabulary]
    ADD ([headword_latin] LANGUAGE 1033, [headword_ascii] LANGUAGE 1033);
GO

ALTER FULLTEXT INDEX ON [dbo].[dcc_vocabulary] START FULL POPULATION;
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification: row counts and sample transliterations
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
    'etymology_entries' AS tbl,
    COUNT(*) AS total_rows,
    SUM(CASE WHEN [headword_latin] IS NOT NULL THEN 1 ELSE 0 END) AS latin_populated,
    SUM(CASE WHEN [headword_ascii] IS NOT NULL THEN 1 ELSE 0 END) AS ascii_populated
FROM [dbo].[etymology_entries]
UNION ALL
SELECT
    'dcc_vocabulary',
    COUNT(*),
    SUM(CASE WHEN [headword_latin] IS NOT NULL THEN 1 ELSE 0 END),
    SUM(CASE WHEN [headword_ascii] IS NOT NULL THEN 1 ELSE 0 END)
FROM [dbo].[dcc_vocabulary];
GO

-- Sample: verify Greek headwords got correct Latin transliteration
SELECT TOP 10 [headword], [headword_latin], [headword_ascii], [source]
FROM [dbo].[etymology_entries]
WHERE [source] = 'beekes'
  AND [headword_latin] IS NOT NULL
ORDER BY [id];
GO

-- Sample: verify macron headwords (de-vaan, kroonen)
SELECT TOP 10 [headword], [headword_latin], [headword_ascii], [source]
FROM [dbo].[etymology_entries]
WHERE [source] IN ('de-vaan', 'kroonen')
  AND [headword_ascii] != [headword]
ORDER BY [id];
GO
