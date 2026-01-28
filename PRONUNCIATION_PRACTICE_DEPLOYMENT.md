# PRONUNCIATION_PRACTICE_DEPLOYMENT.md

# Pronunciation Practice Feature - Sprint 8 Deployment Checklist

## Status: READY FOR DEPLOYMENT

### Completed Components

#### 1. Database Schema ✅
- [x] `PronunciationAttempt` table created in SSMS
- [x] `vw_UserPronunciationProgress` view created
- [x] Indexes created for query optimization
- Schema migrations in place

#### 2. Backend Implementation ✅
- [x] `PronunciationService` class created with:
  - [x] `analyze_pronunciation()` - Main entry point
  - [x] `_transcribe_audio()` - Google Cloud Speech-to-Text integration
  - [x] `_text_to_ipa()` - epitran-based IPA generation
  - [x] `_score_to_status()` - Confidence score classification
  - [x] `_generate_feedback()` - Human-readable feedback generation
  - [x] `_upload_audio()` - GCS audio storage
  - [x] `_store_attempt()` - Database persistence
  - [x] `get_user_progress()` - Progress tracking
  - [x] `get_flashcard_history()` - Attempt history retrieval
  - [x] `generate_ipa_for_flashcard()` - Batch IPA generation

- [x] API Router created with endpoints:
  - [x] `POST /api/v1/pronunciation/record` - Submit recording
  - [x] `GET /api/v1/pronunciation/progress/{user_id}` - Progress tracking
  - [x] `GET /api/v1/pronunciation/history/{flashcard_id}` - Attempt history
  - [x] `POST /api/v1/pronunciation/generate-ipa/{flashcard_id}` - Batch IPA generation

- [x] SQLAlchemy model for `PronunciationAttempt`

#### 3. Frontend Implementation ✅
- [x] `pronunciation-recorder.js` component with:
  - [x] Audio recording via MediaRecorder API
  - [x] Waveform visualization during recording
  - [x] Playback functionality
  - [x] Results display with color-coded scores
  - [x] Word-by-word breakdown
  - [x] IPA display
  - [x] Feedback generation
  - [x] Progress statistics
  - [x] Mobile responsive design

- [x] Integration into flashcard detail view
  - [x] Added pronunciation section to card back
  - [x] Recorder initialization on card flip
  - [x] Progress chart display

- [x] Updated `index.html` to include pronunciation-recorder.js

#### 4. Dependencies ✅
- [x] `google-cloud-speech>=2.21.0` added to requirements.txt
- [x] `google-cloud-storage>=2.10.0` added to requirements.txt
- [x] `epitran>=1.24` added to requirements.txt
- [x] `pytest>=7.4.0` added for testing
- [x] `pytest-asyncio>=0.21.0` added for async tests

#### 5. Testing ✅
- [x] Unit tests created for:
  - [x] IPA conversion
  - [x] Score-to-status conversion
  - [x] Feedback generation
  - [x] Transcription handling
  - [x] Audio upload to GCS
  - [x] Database storage
  - [x] Progress calculation

- [x] Integration tests created for:
  - [x] Recording endpoint
  - [x] Progress endpoint
  - [x] History endpoint
  - [x] Generate IPA endpoint
  - [x] Error handling

- [x] Playwright E2E tests created for:
  - [x] Recording flow
  - [x] Results display
  - [x] Progress tracking
  - [x] Mobile responsiveness
  - [x] Error handling
  - [x] API integration

#### 6. Infrastructure Requirements
- [ ] GCS bucket `super-flashcards-audio` created
- [ ] GCS bucket permissions configured for Cloud Run service account
- [ ] Google Cloud Speech-to-Text API enabled
- [ ] Application default credentials available in Cloud Run

### Pre-Deployment Verification

#### Code Quality
- [x] Python syntax checked
- [x] JavaScript syntax validated
- [x] No hardcoded API keys or secrets
- [x] Error handling implemented throughout
- [x] Logging implemented for debugging

#### Security
- [x] No sensitive data logged
- [x] Audio files uploaded to GCS (not stored locally)
- [x] User IDs and flashcard IDs validated
- [x] CORS headers configured
- [x] Error messages don't expose internals

#### Performance
- [x] Google Cloud Speech-to-Text used (async)
- [x] Audio stored in Cloud Storage (not in database)
- [x] Progress queries optimized with indexes
- [x] JSON stored efficiently in NVARCHAR(MAX)
- [x] Pagination implemented for history endpoint

### Infrastructure Setup Checklist

Before deploying, complete these steps:

#### 1. Create GCS Bucket
```bash
gsutil mb -l us-central1 gs://super-flashcards-audio
gsutil lifecycle set - gs://super-flashcards-audio <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}  # Delete after 30 days
      }
    ]
  }
}
EOF
```

#### 2. Grant Cloud Run Service Account Access
```bash
# Get Cloud Run service account
CLOUD_RUN_SA="super-flashcards-57478301787@cloud-run-sa.gserviceaccount.com"

# Grant Storage Object Admin
gsutil iam ch serviceAccount:$CLOUD_RUN_SA:roles/storage.admin gs://super-flashcards-audio
```

#### 3. Enable Required APIs
```bash
gcloud services enable speech.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### 4. Set Environment Variables in Cloud Run
- `GOOGLE_APPLICATION_CREDENTIALS`: Leave empty (Cloud Run uses default credentials)
- `GOOGLE_CLOUD_SPEECH_KEY`: Not needed (use ADC)

### Deployment Steps

1. **Run Tests Locally**
   ```bash
   cd backend
   pytest tests/test_pronunciation_service.py -v
   pytest tests/test_pronunciation_api.py -v
   ```

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "Sprint 8: Add pronunciation practice feature"
   git push origin main
   ```

3. **Deploy via Cloud Build**
   ```powershell
   .\deploy.ps1 -Message "Sprint 8: Pronunciation practice feature"
   ```

4. **Verify Deployment**
   - [ ] Test `POST /api/v1/pronunciation/record` endpoint
   - [ ] Test `GET /api/v1/pronunciation/progress/{user_id}` endpoint
   - [ ] Test `GET /api/v1/pronunciation/history/{flashcard_id}` endpoint
   - [ ] Test recording flow in browser
   - [ ] Check audio uploads to GCS
   - [ ] Verify database entries created

### Rollback Plan

If issues occur:

1. **Revert Code**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Redeploy Previous Version**
   ```powershell
   .\deploy.ps1 -SkipGit
   ```

3. **Check Logs**
   ```bash
   gcloud run logs read super-flashcards --limit 50
   ```

### Post-Deployment Monitoring

Monitor these metrics for the first 24 hours:

- [ ] Error rate on `/api/v1/pronunciation/record` endpoint
- [ ] Response time for transcription (should be <5 seconds)
- [ ] GCS upload success rate
- [ ] Database write errors
- [ ] User session activity

### User Communication

After successful deployment:

1. Update landing page to highlight new feature
2. Send announcement to users about pronunciation practice
3. Monitor feedback and support requests
4. Collect usage metrics for future improvements

### Known Limitations & Future Enhancements

#### Current Limitations
- Only French language supported (epitran['fra-Latn'])
- Speech-to-Text only in French (fr-FR)
- Audio files deleted after 30 days
- No pronunciation history comparison

#### Future Enhancements
- Support for multiple languages (Spanish, German, etc.)
- Audio comparison waveform visualization
- Machine learning for pronunciation improvement predictions
- Gamification (badges for pronunciation milestones)
- Teacher dashboard to track student pronunciation progress
- Real-time speech recognition feedback (lower latency)

### Support & Troubleshooting

#### Common Issues

**Issue: "Failed to analyze pronunciation"**
- Check Google Cloud Speech-to-Text API is enabled
- Verify service account has permissions
- Check audio file format (should be WEBM/Opus from browser)

**Issue: "Audio upload failed"**
- Check GCS bucket exists
- Verify service account has storage.admin role
- Check bucket name matches code

**Issue: "Database write error"**
- Verify PronunciationAttempt table exists in Cloud SQL
- Check user and flashcard IDs are valid UUIDs
- Ensure foreign keys reference existing records

**Issue: "IPA generation failed"**
- epitran should handle French text gracefully
- Check for non-Latin characters
- Verify epitran package version >= 1.24

### Contact

For issues or questions about this feature:
- GitHub Issues: https://github.com/coreyprator/super-flashcards/issues
- Email: (TBD)

---

**Deployment Date**: [To be filled]
**Deployed By**: [To be filled]
**Deployment Status**: [Ready for deployment]
