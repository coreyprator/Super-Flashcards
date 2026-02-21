# [Super Flashcards] 🟡 Greek Diphthongs & Consonants Import

> **From**: Claude.ai (Architect)
> **To**: Claude Code (Command Center)
> **Project**: 🟡 Super Flashcards
> **Task**: greek-diphthongs-import
> **Timestamp**: 2026-02-09T10:30:00Z

---

## Overview

Add Greek diphthong and consonant combination flashcards for pronunciation drilling. User wants to see, hear, say, and practice these combinations.

---

## Card Data

### Diphthongs (7 cards)

| Greek | Romanized | IPA | Example | Meaning |
|-------|-----------|-----|---------|---------|
| αι | ai | ε | παιδί | child |
| ει / ηι | ei | i | είναι | is / are |
| οι | oi | i | οικογένεια | family |
| υι | ui / yi | i | υιός | son |
| αυ | au | av / af | αυτός | he / this |
| ευ | eu | ev / ef | ευχαριστώ | thank you |
| ου | ou | u | ουρανός | sky |

### Consonant Combinations (10 cards)

| Greek | Romanized | IPA | Example | Meaning |
|-------|-----------|-----|---------|---------|
| ντ | nt | d / nd | ντομάτα | tomato |
| μπ | mp | b / mb | μπίρα | beer |
| γγ | gg | g / ŋg | αγγούρι | cucumber |
| γκ | gk | g / ŋg | γκαράζ | garage |
| τσ | ts | ts | τσάι | tea |
| τζ | tz | dz / ndz | τζάκι | fireplace |
| ντζ | ntz | ndz | μαντζούνι | potion |
| κζ | kz | gz | εκζέμα | eczema |
| σλ | sl | zl | Ισλάμ | Islam |
| γχ | gh | ŋχ | σύγχρονος | modern |

---

## Card Structure

Each card should have:

```
Front:
- Greek letters (large, prominent): αι
- Romanized below: (ai)

Back:
- IPA pronunciation: [ε]
- Example word with audio: παιδί 🔊
- Meaning: "child"
- Pronunciation note (if applicable)
```

---

## Special Notes for αυ and ευ

These have context-dependent pronunciation — include notes on the card back:

**αυ card back:**
```
[av] before voiced consonants (β, γ, δ, ζ, λ, μ, ν, ρ) or vowels
[af] before voiceless consonants (π, τ, κ, φ, θ, χ, σ, ξ, ψ)

Example: αυτός → "av-TOS"
```

**ευ card back:**
```
[ev] before voiced consonants or vowels
[ef] before voiceless consonants

Example: ευχαριστώ → "ef-ha-ri-STO"
```

---

## Special Notes for ντ and μπ

Include position rules:

**ντ card back:**
```
Word-initial: [d] — ντομάτα → "do-MA-ta"
Mid-word: [nd] — πέντε → "PEN-de"
```

**μπ card back:**
```
Word-initial: [b] — μπίρα → "BI-ra"
Mid-word: [mb] — κόμπος → "KOM-bos"
```

---

## Implementation Options

### Option A: Use Import Feature (Preferred)

If Super Flashcards has CSV/JSON import:

```csv
front,back,example,meaning,category,language
"αι (ai)","[ε]","παιδί","child","diphthong","greek"
"ει (ei)","[i]","είναι","is / are","diphthong","greek"
...
```

### Option B: Create via API

If no import feature, create cards programmatically:

```python
cards = [
    {
        "front": "αι",
        "front_sub": "(ai)",
        "back": "[ε]",
        "example": "παιδί",
        "example_meaning": "child",
        "category": "Greek Diphthongs",
        "language": "el",
        "audio_text": "παιδί"  # for TTS
    },
    # ... rest of cards
]

for card in cards:
    create_flashcard(card)
```

### Option C: Add as New Deck/Category

Create a dedicated "Greek Pronunciation" deck containing:
- Diphthongs (7)
- Consonant Combinations (10)
- Total: 17 cards

---

## Audio

Use existing Super Flashcards TTS for Greek (language code: `el`).

For each card, generate audio for:
1. The diphthong/combination itself (e.g., "αι")
2. The example word (e.g., "παιδί")

---

## Drill Modes

Ensure cards work with existing Super Flashcards features:
- **See**: Show Greek letters
- **Hear**: Play TTS audio
- **Say**: User pronounces
- **Practice**: Spaced repetition

---

## Deliverables

1. [ ] Import or create 17 flashcards (7 diphthongs + 10 consonants)
2. [ ] Cards have Greek, IPA, example, meaning
3. [ ] Audio works (TTS Greek)
4. [ ] Special notes on αυ, ευ, ντ, μπ cards
5. [ ] Cards accessible in user's deck

---

## Definition of Done

- User can see all 17 Greek pronunciation cards
- Audio plays correctly for examples
- Cards appear in drill/practice mode
- Spaced repetition works

---

## Git

```bash
git add .
git commit -m "feat: Add Greek diphthongs and consonants flashcards"
git push
```

Send completion handoff with Handoff Bridge URL.
