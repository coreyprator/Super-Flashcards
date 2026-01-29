# VS Code Prompt: Sprint 8.5 - Gemini Deep Analysis Integration

## Context

You are continuing development on Super Flashcards, an AI-powered language learning application. Sprint 8 implemented pronunciation practice with Google Cloud Speech-to-Text (STT) for word-level confidence scores. Sprint 8.5 adds qualitative AI coaching feedback via Gemini API.

**Reference Document:** `SPRINT_8.5_HANDOFF_Gemini_Deep_Analysis.md` (in project folder) contains complete specifications including:
- Architecture diagrams
- Database schema (already applied to production)
- API endpoint specifications
- Service implementation code
- Frontend JavaScript and CSS
- Test cases

---

## Pre-Completed Tasks (Corey has done these)

- ✅ Gemini API key obtained: `AIzaSyB79ht9fm6PEkxfQ-RPw8PpwUHh8OusWQc`
- ✅ SQL schema changes applied (8 prompt templates inserted for all languages)
- ✅ OAuth and database connectivity verified working

---

## Your Tasks

### 1. Store Gemini API Key in Google Cloud Secret Manager

```bash
# Create the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic" --project=super-flashcards-475210

# Add the value (use file method to avoid PowerShell issues)
# Create file: secret.txt with content: AIzaSyB79ht9fm6PEkxfQ-RPw8PpwUHh8OusWQc
gcloud secrets versions add GEMINI_API_KEY --data-file="secret.txt" --project=super-flashcards-475210

# Verify
gcloud secrets versions access latest --secret=GEMINI_API_KEY --project=super-flashcards-475210

# Mount to Cloud Run (use services update, NOT deploy, to preserve existing env vars)
gcloud run services update super-flashcards --region=us-central1 --project=super-flashcards-475210 --update-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### 2. Add pip Dependency

Add to `backend/requirements.txt`:
```
google-generativeai>=0.3.0
```

### 3. Create Python Files

Per the handoff document, create:

- `backend/app/services/gemini_service.py` - Main service with:
  - `GeminiPronunciationService` class
  - `analyze_pronunciation()` method
  - `_cross_validate()` method (suppresses Gemini flags when STT confidence > 0.90)
  - `get_prompt_template()` method

- `backend/app/models/pronunciation_prompt_template.py` - SQLAlchemy model for `PronunciationPromptTemplates` table

- Update `backend/app/models/__init__.py` to import new model

- Update `backend/app/crud/pronunciation.py` with:
  - `update_pronunciation_attempt_gemini()`
  - `get_pronunciation_prompt_template()`

- Update `backend/app/routers/pronunciation.py` with endpoints:
  - `POST /api/pronunciation/deep-analysis/{attempt_id}`
  - `GET /api/pronunciation/prompt-template/{language_code}`
  - `POST /api/pronunciation/feedback/{attempt_id}`

### 4. Create Frontend Files

- `frontend/pronunciation-deep-analysis.js` - UI component for:
  - "Get AI Coaching Feedback" button
  - Results display (clarity score, rhythm, issues, drills)
  - Feedback buttons (👍👎)

- Add CSS styles to existing stylesheet (see handoff doc for complete styles)

### 5. Write Tests

- `backend/tests/test_gemini_service.py` - Unit tests per handoff doc
- `backend/tests/test_gemini_integration.py` - Integration tests

---

## Key Implementation Details

### Cross-Validation Logic (Critical)
The hybrid approach requires suppressing Gemini flags when STT confidence is high:

```python
def _cross_validate(self, gemini_results: dict, stt_word_scores: list) -> dict:
    high_confidence_words = {
        score["word"].lower() 
        for score in stt_word_scores 
        if score.get("confidence", 0) > 0.90
    }
    # If Gemini flags a word but STT confidence > 0.90, add warning
    # If both systems flag same word, mark as "cross_validated": True
```

### Gemini API Call Pattern
```python
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

response = model.generate_content([
    {"mime_type": "audio/wav", "data": audio_base64},
    prompt_template
])
```

### Response Format
Gemini must return JSON (prompt templates enforce this):
```json
{
  "clarity_score": 7.5,
  "rhythm": "slightly choppy",
  "sound_issues": [...],
  "top_drill": "Practice minimal pairs...",
  "encouragement": "Great flow overall!"
}
```

---

## Testing Checklist

After implementation:

- [ ] Verify secret is accessible: `os.getenv("GEMINI_API_KEY")` returns value
- [ ] Test prompt template retrieval for each language (fr, es, el, de, it, pt, ja, zh)
- [ ] Test deep analysis endpoint with real audio
- [ ] Verify cross-validation suppresses false positives
- [ ] Test feedback submission endpoint
- [ ] Run unit tests
- [ ] No regression in existing STT-only flow

---

## Deployment

After all changes:

```bash
# Build new image
gcloud builds submit --tag gcr.io/super-flashcards-475210/super-flashcards:latest --project=super-flashcards-475210

# Deploy (use services update to preserve env vars!)
gcloud run services update super-flashcards --region=us-central1 --project=super-flashcards-475210 --image=gcr.io/super-flashcards-475210/super-flashcards:latest
```

---

## Questions? 

Refer to `SPRINT_8.5_HANDOFF_Gemini_Deep_Analysis.md` for complete code samples, database schema, test cases, and architectural decisions.
