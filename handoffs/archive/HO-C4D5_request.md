# [Super Flashcards] 🟡 — Re-Import Greek Diphthongs (Correct Encoding)

> **ID**: HO-C4D5
> **Timestamp**: 2026-02-11-08-57-52
> **From**: Claude.ai (Architect)
> **To**: Claude Code (Command Center)
> **Project**: 🟡 Super Flashcards
> **Task**: Re-import Greek diphthongs with correct UTF-8 encoding

---

## Background

The original Greek diphthong cards were deleted due to encoding corruption.
Now re-inserting with correct UTF-8 encoding.

Original spec: `G:\My Drive\Code\Python\Super-Flashcards\handoffs\outbox\20260209_181500_greek-diphthongs.md`

---

## CRITICAL: Database Connection Encoding

When connecting to Cloud SQL, ensure UTF-8:

**Python (SQLAlchemy)**:
```python
engine = create_engine("mysql+pymysql://user:pass@host/db?charset=utf8mb4")
```

**Python (mysql-connector)**:
```python
connection = mysql.connector.connect(charset='utf8mb4', collation='utf8mb4_unicode_ci', ...)
```

**Direct SQL**:
```sql
SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
```

---

## Cards to Insert (17 Total)

### Diphthongs (7 cards)

| Front | IPA | Back |
|-------|-----|------|
| αι | [e] | [e] as in 'bed' - Example: και (ke) = 'and' |
| ει | [i] | [i] as in 'see' - Example: είναι (ine) = 'is/are' |
| οι | [i] | [i] as in 'see' - Example: οι (i) = 'the' (plural) |
| υι | [i] | [i] as in 'see' - Example: υιός (ios) = 'son' |
| αυ | [av]/[af] | [av] before vowels/voiced consonants, [af] before voiceless - Example: αυτός (aftos) = 'he' |
| ευ | [ev]/[ef] | [ev] before vowels/voiced consonants, [ef] before voiceless - Example: ευχαριστώ (efcharisto) = 'thank you' |
| ου | [u] | [u] as in 'food' - Example: που (pu) = 'where/that' |

### Consonant Combinations (10 cards)

| Front | IPA | Back |
|-------|-----|------|
| ντ | [d]/[nd] | [d] at start of word, [nd] in middle - Example: ντομάτα (domata) = 'tomato' |
| μπ | [b]/[mb] | [b] at start of word, [mb] in middle - Example: μπάλα (bala) = 'ball' |
| γγ | [ng] | [ng] as in 'finger' - Example: αγγελία (angelia) = 'announcement' |
| γκ | [g]/[ng] | [g] at start of word, [ng] in middle - Example: γκαράζ (garaz) = 'garage' |
| τσ | [ts] | [ts] as in 'cats' - Example: τσάι (tsai) = 'tea' |
| τζ | [dz] | [dz] as in 'adze' - Example: τζάμι (dzami) = 'window/glass' |
| ντζ | [ndz] | [ndz] as in 'hands' - Example: πορτζιά (portza) = 'orange (tree)' |
| ξ | [ks] | [ks] as in 'box' - Example: ξένος (ksenos) = 'foreign/stranger' |
| ψ | [ps] | [ps] as in 'lips' - Example: ψωμί (psomi) = 'bread' |
| γχ | [ŋx] | [ŋx] as in 'synchro' - Example: σύγχρονος (sinchronos) = 'contemporary' |

---

## SQL Insert Script

```sql
-- FIRST: Set encoding
SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;

-- Verify encoding
SELECT @@character_set_connection, @@collation_connection;

-- Insert Diphthongs
INSERT INTO flashcards (front, back, category, language_id, source) VALUES
('αι', '[e] as in ''bed'' - Example: και (ke) = ''and''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('ει', '[i] as in ''see'' - Example: είναι (ine) = ''is/are''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('οι', '[i] as in ''see'' - Example: οι (i) = ''the'' (plural)', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('υι', '[i] as in ''see'' - Example: υιός (ios) = ''son''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('αυ', '[av] before vowels/voiced consonants, [af] before voiceless - Example: αυτός (aftos) = ''he''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('ευ', '[ev] before vowels/voiced consonants, [ef] before voiceless - Example: ευχαριστώ (efcharisto) = ''thank you''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('ου', '[u] as in ''food'' - Example: που (pu) = ''where/that''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import');

-- Insert Consonant Combinations
INSERT INTO flashcards (front, back, category, language_id, source) VALUES
('ντ', '[d] at start of word, [nd] in middle - Example: ντομάτα (domata) = ''tomato''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('μπ', '[b] at start of word, [mb] in middle - Example: μπάλα (bala) = ''ball''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('γγ', '[ng] as in ''finger'' - Example: αγγελία (angelia) = ''announcement''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('γκ', '[g] at start of word, [ng] in middle - Example: γκαράζ (garaz) = ''garage''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('τσ', '[ts] as in ''cats'' - Example: τσάι (tsai) = ''tea''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('τζ', '[dz] as in ''adze'' - Example: τζάμι (dzami) = ''window/glass''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('ντζ', '[ndz] as in ''hands'' - Example: πορτζιά (portza) = ''orange (tree)''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('ξ', '[ks] as in ''box'' - Example: ξένος (ksenos) = ''foreign/stranger''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('ψ', '[ps] as in ''lips'' - Example: ψωμί (psomi) = ''bread''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import'),
('γχ', '[ŋx] as in ''synchro'' - Example: σύγχρονος (sinchronos) = ''contemporary''', 'Greek Pronunciation', '21D23A9E-4EF7-4D53-AD17-371D164D0F0F', 'Greek Diphthongs Import');

-- Verify: Count should be 17
SELECT COUNT(*) as card_count FROM flashcards WHERE source = 'Greek Diphthongs Import';

-- Verify: Show first few cards to confirm encoding
SELECT id, front, LEFT(back, 50) as back_preview FROM flashcards 
WHERE source = 'Greek Diphthongs Import'
ORDER BY id;
```

---

## Verification Steps

1. **Query the database** — confirm 17 cards with source 'Greek Diphthongs Import'
2. **Check encoding** — front column should show αι, ει, οι NOT Î±Î¹, ÎµÎ¹, Î¿Î¹
3. **Test API** — `curl https://learn.rentyourcio.com/api/flashcards?category=Greek%20Pronunciation`
4. **Test UI** — open https://learn.rentyourcio.com/, filter Greek Pronunciation, verify display

---

## Definition of Done

✅ 17 cards inserted with correct UTF-8 Greek characters
✅ Database query shows proper Greek: αι, ει, ψ, γχ (NOT Î±Î¹, ÎµÎ¹, Ïˆ, Î³Ï‡)
✅ API returns cards with correct encoding
✅ No deployment needed (database-only change)

---

*ID: HO-C4D5*
*Status: SPEC*
