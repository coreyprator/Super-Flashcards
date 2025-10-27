# Bugs & TODOs - Super Flashcards

## 🐛 Known Bugs

### High Priority

1. **Adding a card shows random card instead of newly added card**
   - When manually adding a flashcard, the UI doesn't display the newly created card
   - Instead, it shows a random existing card
   - Expected: Should show the card that was just created
   - Location: `frontend/app.js` - card creation/display logic

2. **Delete button issues in Browse mode**
   - Delete button on edit card modal doesn't work
   - Delete button intermittently disappears in Browse mode
   - Needs investigation and fix
   - Location: `frontend/app.js` - delete button event listeners

### Medium Priority

3. **Missing files causing 404 errors**
   - `manifest.json` - 404 error
   - `error-tracker.js` - 404 error
   - Impact: Console warnings, but app still functions

4. **Tab navigation after document upload**
   - User reported tabs may be broken after upload
   - Needs testing and potential fix

## 📋 Feature TODOs

### Data Enhancement Features
1. **Add Gender field for nouns**
   - Some languages (French, German, Spanish, Italian, Greek) require gender for nouns
   - Add gender field to flashcard schema: `gender: Optional[str]` (values: "masculine", "feminine", "neuter")
   - Update AI generation to determine gender
   - Update UI to display gender indicator (e.g., "le/la/l'" for French, "der/die/das" for German)
   - **May need separate batch process** to update existing cards

2. **Add Preposition field for verbs**
   - Some languages require prepositions with certain verbs
   - Examples:
     - German: "warten auf" (to wait for), "denken an" (to think of)
     - French: "penser à" (to think about), "rêver de" (to dream of)
   - Add preposition field: `preposition: Optional[str]`
   - Update AI generation to include common prepositions
   - **May need separate batch process** to update existing cards

### Batch Enhancement Process
- Create new endpoint: `/api/ai/enhance-existing`
- Process existing flashcards to add:
  - Gender for nouns (where applicable)
  - Prepositions for verbs (where applicable)
- Allow filtering by language and part of speech
- Show progress for large batches

## 🔧 Technical Debt
1. **Version consistency checks**
   - Currently requires manual updates in 3 places (HTML, app.js, backend)
   - Consider single source of truth

## ✅ Recently Fixed

- v2.6.22: Added persistent status banner for batch generation, navigation buttons from Import tab, audio generation trigger for batch-generated cards (10/27/2025)
- v2.6.21: Fixed batch generate UX issues (selection count, success message, error details, sync trigger) (10/27/2025)
- v2.6.20: Fixed related_words validation error (convert list to JSON string in batch generate)
- v2.6.19: Fixed batch generate (import models module, use models.Flashcard not crud.Flashcard)
- v2.6.18: Fixed batch generate API schema (language_id UUID type mismatch)
- v2.6.17: Fixed batch generate missing language dropdown
- v2.6.16: Fixed property name mismatch (entry.word → entry.word_or_phrase)
- v2.6.15: GitHub Actions IAM permissions fixed

---
Last updated: 2025-10-27

