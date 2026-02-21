# [Super-Flashcards] Greek Diphthongs Import — COMPLETE

> **From**: Claude Code (Command Center)
> **To**: Claude.ai (Architect)
> **Project**: Super-Flashcards
> **Task**: Greek Diphthongs Import
> **Timestamp**: 2026-02-09T18:15:00Z
> **Status**: COMPLETE

---

## Summary

Added 17 Greek pronunciation flashcards to the database:
- 7 diphthongs
- 10 consonant combinations

All cards accessible via API. TTS audio generation pending.

---

## Cards Added

### Diphthongs (7)

| Greek | IPA | Example | Meaning |
|-------|-----|---------|---------|
| αι | /e/ | και (ke) | and |
| ει | /i/ | είναι (ine) | is/are |
| οι | /i/ | οι (i) | the (plural) |
| υι | /i/ | υιός (ios) | son |
| αυ | /av/ or /af/ | αυτός (aftos) | he |
| ευ | /ev/ or /ef/ | ευχαριστώ (efcharisto) | thank you |
| ου | /u/ | που (pu) | where/that |

### Consonant Combinations (10)

| Greek | IPA | Example | Meaning |
|-------|-----|---------|---------|
| ντ | /d/ or /nd/ | ντομάτα (domata) | tomato |
| μπ | /b/ or /mb/ | μπάλα (bala) | ball |
| γγ | /ŋg/ | αγγελία (angelia) | announcement |
| γκ | /g/ or /ŋg/ | γκαράζ (garaz) | garage |
| τσ | /ts/ | τσάι (tsai) | tea |
| τζ | /dz/ | τζάμι (dzami) | window |
| ντζ | /ndz/ | πορτζιά (portza) | orange tree |
| ξ | /ks/ | ξένος (ksenos) | foreign |
| ψ | /ps/ | ψωμί (psomi) | bread |
| γχ | /ŋx/ | σύγχρονος (sinchronos) | contemporary |

---

## Context-Dependent Pronunciation Rules

### αυ and ευ
- **[af]/[ef]** before voiceless consonants: κ, π, τ, χ, φ, θ, σ, ξ, ψ
- **[av]/[ev]** before vowels and voiced consonants

### ντ and μπ
- **[d]/[b]** at word-initial position
- **[nd]/[mb]** in word-medial position

### γκ
- **[g]** at word-initial position
- **[ŋg]** in word-medial position

---

## Technical Details

| Field | Value |
|-------|-------|
| Cards Added | 17 |
| Language | Greek (el) |
| Language ID | 21D23A9E-4EF7-4D53-AD17-371D164D0F0F |
| Source | Greek Pronunciation Import |
| Audio | Pending generation |

---

## API Verification

```bash
curl https://super-flashcards-wmrla7fhwa-uc.a.run.app/api/flashcards/?limit=100
# Returns all 17 Greek Pronunciation Import cards
```

---

## Git

| Field | Value |
|-------|-------|
| Commit | `97d3372` |
| Message | feat: Add Greek diphthongs & consonant pronunciations |
| Branch | main |
| Pushed | Yes |

---

## Files Created

| File | Purpose |
|------|---------|
| `backend/greek_diphthongs.json` | Card data in JSON format |
| `backend/import_greek_diphthongs.py` | Python import script |
| `backend/insert_greek_diphthongs.sql` | SQL insert script (used) |

---

## Pending: TTS Audio

Audio generation can be triggered via batch processing endpoint:
```bash
POST /api/batch/audio
{
  "language": "el",
  "source": "Greek Pronunciation Import"
}
```

---

*Sent via Handoff Bridge per project-methodology policy*
*super-flashcards/handoffs/outbox/20260209_181500_greek-diphthongs.md -> GCS backup*
