# [Super Flashcards] 🟡 — Delete Corrupted Greek Cards (Retry)

> **ID**: HO-W1X2
> **Timestamp**: 2026-02-11-06-51-37
> **From**: Claude.ai (Architect)
> **To**: Claude Code (Command Center)
> **Project**: 🟡 Super Flashcards
> **Task**: Delete corrupted Greek pronunciation cards

---

## Problem

Previous deletion (HO-C3D4) missed the corrupted Greek cards. User still sees these in the UI:

| Corrupted Front | Should Be | Pronunciation |
|-----------------|-----------|---------------|
| Ïˆ | ψ | [ps] |
| Î³Ï‡ | γχ | [ŋx] |
| Î¾ | ξ | [ks] |
| Î½Ï„Î¶ | ντζ | [ndz] |
| Ï„Î¶ | τζ | [dz] |
| Ï„Ïƒ | τσ | [ts] |
| Î³Î³ | γγ | [ng] |
| Î³Îº | γκ | [g]/[ng] |
| Î¼Ï€ | μπ | [b]/[mb] |
| Î½Ï„ | ντ | [d]/[nd] |
| ÎµÏ… | ευ | [ev]/[ef] |
| Î¿Ï… | ου | [u] |
| Ï…Î¹ | υι | [i] |
| Î±Ï… | αυ | [av]/[af] |
| ÎµÎ¹ | ει | [i] |
| Î¿Î¹ | οι | [i] |
| Î±Î¹ | αι | [e] |

Total: 17 corrupted cards

---

## Corrupted Character Patterns

Search for ANY of these byte sequences in the `front` column:

```
Ï (capital I + tilde + ?)
Î (capital I + circumflex)
Â (capital A + circumflex)
Ã (capital A + tilde)
ˆ (modifier letter circumflex)
¼ ½ ¾ (fractions - common corruption)
Ë (capital E + diaeresis)
Å (capital A + ring)
```

---

## SQL Deletion

Run this against the Super Flashcards Cloud SQL database:

```sql
-- First, find all corrupted cards
SELECT id, front, back 
FROM flashcards 
WHERE front LIKE '%Ï%' 
   OR front LIKE '%Î%'
   OR front LIKE '%Â%'
   OR front LIKE '%Ã%'
   OR front LIKE '%ˆ%'
   OR front LIKE '%Ë%'
   OR front LIKE '%Å%'
   OR front REGEXP '[À-ß]{2,}';  -- Multiple consecutive Latin Extended chars

-- Count before delete
SELECT COUNT(*) as corrupted_count FROM flashcards 
WHERE front LIKE '%Ï%' 
   OR front LIKE '%Î%'
   OR front LIKE '%Â%'
   OR front LIKE '%Ã%'
   OR front LIKE '%ˆ%'
   OR front LIKE '%Ë%'
   OR front LIKE '%Å%';

-- Delete corrupted cards
DELETE FROM flashcards 
WHERE front LIKE '%Ï%' 
   OR front LIKE '%Î%'
   OR front LIKE '%Â%'
   OR front LIKE '%Ã%'
   OR front LIKE '%ˆ%'
   OR front LIKE '%Ë%'
   OR front LIKE '%Å%';

-- Verify no corrupted cards remain
SELECT COUNT(*) as remaining_corrupted FROM flashcards 
WHERE front LIKE '%Ï%' 
   OR front LIKE '%Î%';
-- Should return 0
```

---

## Alternative: Direct Match on Exact Corrupted Strings

If the LIKE patterns don't match, try exact string matching:

```sql
DELETE FROM flashcards WHERE front IN (
    'Ïˆ',
    'Î³Ï‡',
    'Î¾',
    'Î½Ï„Î¶',
    'Ï„Î¶',
    'Ï„Ïƒ',
    'Î³Î³',
    'Î³Îº',
    'Î¼Ï€',
    'Î½Ï„',
    'ÎµÏ…',
    'Î¿Ï…',
    'Ï…Î¹',
    'Î±Ï…',
    'ÎµÎ¹',
    'Î¿Î¹',
    'Î±Î¹'
);
```

---

## Verification

After deletion, run in the app:
1. Go to https://learn.rentyourcio.com/
2. Filter by Greek Pronunciation category
3. Verify NO cards show corrupted characters (Î, Ï, Â, etc.)
4. All Greek cards should show proper Unicode: ψ, γχ, ξ, etc.

---

## Root Cause

The cards were inserted with wrong encoding. When inserting Greek text, the database connection must use UTF-8 charset:
- MySQL: `charset=utf8mb4`
- Python: `encoding='utf-8'`

Check CLAUDE.md for encoding protocol.

---

*ID: HO-W1X2*
*Status: SPEC*
