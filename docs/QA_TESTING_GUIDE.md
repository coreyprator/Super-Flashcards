# QA Testing Guide for Super Flashcards

**Environment:** QA  
**Date:** November 12, 2025  
**Purpose:** Sprint 7 development testing procedures

---

## 🔐 QA Environment Access

### QA Service URL
```
https://super-flashcards-qa-57478301787.us-central1.run.app
```

### QA Login Credentials
```
Username: qa
Password: qa2025
```

### QA Database
```
Instance: flashcards-db (35.224.242.223)
Database: LanguageLearning_QA
User: flashcards_qa_user
```

### QA Git Branch
```
Branch: dev
```

---

## 🚀 Deployment Workflow

### Deploying to QA

```bash
# 1. Ensure you're on dev branch
git checkout dev

# 2. Make your code changes
[edit files]

# 3. Commit changes
git add .
git commit -m "Sprint 7: Your feature description"
git push origin dev

# 4. Deploy to QA
.\build-and-deploy-qa.ps1
```

**Build Time:** ~2-3 minutes  
**Deployment Time:** ~30-60 seconds  
**Total:** ~3-4 minutes from commit to live

### Deploying to Production (After QA Validation)

```bash
# 1. Merge dev to main
git checkout main
git merge dev
git push origin main

# 2. Deploy to production
.\build-and-deploy.ps1
```

---

## 🧪 Sprint 7 Testing Checklist

### Phase 1: Database Migrations
- [ ] Deploy Sprint 7 database migrations to QA
- [ ] Verify new tables created:
  - [ ] `Subscriptions`
  - [ ] `PaymentHistory`
  - [ ] `UserCardPreferences`
  - [ ] `UserSelectedCards`
  - [ ] `QuizSessions`
  - [ ] `QuizWordPerformance`
- [ ] Test backward compatibility (old features still work)
- [ ] Check database integrity

### Phase 2: Subscription System
- [ ] Create test user in QA
- [ ] Test free tier limits:
  - [ ] Can access 10 cards (no more)
  - [ ] Can take 5 quizzes per day (no more)
  - [ ] See "Upgrade to Premium" prompts
- [ ] Test premium trial:
  - [ ] Activate 7-day trial
  - [ ] Verify unlimited access during trial
  - [ ] Test trial expiration
- [ ] Test Stripe payment flow (test mode):
  - [ ] Click "Upgrade to Premium"
  - [ ] Complete Stripe checkout
  - [ ] Verify subscription activated
  - [ ] Test subscription management
- [ ] Test subscription expiration:
  - [ ] Manually expire subscription in database
  - [ ] Verify user reverts to free tier

### Phase 3: Card Preferences System
- [ ] Test new user onboarding:
  - [ ] Create new user
  - [ ] Verify 50 default beginner cards added
  - [ ] Check difficulty levels (1-5)
- [ ] Test card filtering:
  - [ ] Filter by difficulty level
  - [ ] Filter by hashtag (#beginner, #intermediate, #advanced)
  - [ ] Filter by language
- [ ] Test card selection:
  - [ ] Add card to personal deck
  - [ ] Remove card from personal deck
  - [ ] Verify only selected cards appear in study mode
- [ ] Test hashtag search:
  - [ ] Search by #beginner
  - [ ] Search by #food
  - [ ] Search by #travel

### Phase 4: Premium Quiz
- [ ] Test quiz generation:
  - [ ] Start premium quiz
  - [ ] Verify word-level questions
  - [ ] Test all question types
- [ ] Test word-level tracking:
  - [ ] Complete quiz
  - [ ] Check QuizWordPerformance table
  - [ ] Verify correctness tracking per word
- [ ] Test performance analytics:
  - [ ] View personal stats
  - [ ] Check word-level breakdown
  - [ ] Verify spaced repetition hints
- [ ] Test free tier limits:
  - [ ] Take 5 quizzes as free user
  - [ ] Verify 6th quiz blocked
  - [ ] Test "Upgrade to Premium" prompt

### Phase 5: URL Sharing Fix
- [ ] Test language disambiguation:
  - [ ] Share URL with "Greek (el)"
  - [ ] Share URL with "Greek"
  - [ ] Verify fuzzy matching works
  - [ ] Test with other languages
- [ ] Test card sharing:
  - [ ] Share specific flashcard URL
  - [ ] Open in new browser/incognito
  - [ ] Verify card loads correctly

### Phase 6: Bug Fix (Card Navigation)
- [ ] Create new flashcard
- [ ] Verify app navigates to newly created card
- [ ] Check UUID display in URL
- [ ] Test back/forward browser navigation

### Phase 7: Integration Testing
- [ ] Test full user journey:
  1. Create account
  2. Get 50 default cards
  3. Browse and filter cards
  4. Add cards to deck
  5. Take 5 quizzes (free tier)
  6. Hit quiz limit
  7. Activate premium trial
  8. Take unlimited quizzes
  9. View performance analytics
  10. Trial expires → back to free tier
- [ ] Test edge cases:
  - [ ] User with no cards
  - [ ] User with 1000+ cards
  - [ ] User with expired trial
  - [ ] Concurrent quiz sessions
- [ ] Load testing:
  - [ ] Multiple users simultaneously
  - [ ] Rapid quiz completions
  - [ ] Large quiz result sets
- [ ] Security testing:
  - [ ] Free user trying to access premium features
  - [ ] Manipulating quiz results via API
  - [ ] SQL injection attempts
  - [ ] XSS attempts in card content

---

## 🔍 Testing Tools

### Manual Testing
- **Browser:** Chrome, Firefox, Safari, Mobile browsers
- **Tools:** DevTools, Network tab, Console
- **Accounts:** Create multiple test accounts (free, trial, premium)

### API Testing
```bash
# Test API directly with curl
curl -X POST https://super-flashcards-qa-57478301787.us-central1.run.app/api/quiz/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language_id": 1}'
```

### Database Queries (QA Only)
```sql
-- Check subscription status
SELECT * FROM Subscriptions WHERE user_id = 'YOUR_USER_ID';

-- Check quiz history
SELECT * FROM QuizSessions WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC;

-- Check word performance
SELECT * FROM QuizWordPerformance WHERE quiz_session_id = 'QUIZ_ID';

-- Reset daily quiz limit (for testing)
UPDATE Subscriptions SET daily_quiz_count = 0 WHERE user_id = 'YOUR_USER_ID';
```

---

## 🚨 Rollback Procedures

### Rollback QA Deployment
```bash
# List previous QA revisions
gcloud run revisions list --service=super-flashcards-qa --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic super-flashcards-qa \
    --to-revisions=super-flashcards-qa-00001=100 \
    --region=us-central1
```

### Rollback QA Database
```sql
-- Connect to Cloud SQL instance
-- Drop QA database if corrupted
DROP DATABASE LanguageLearning_QA;

-- Restore from backup
-- Use Cloud SQL backup/restore in Google Cloud Console
```

### Rollback Code Changes
```bash
# Revert last commit on dev branch
git checkout dev
git revert HEAD
git push origin dev

# Deploy reverted code
.\build-and-deploy-qa.ps1
```

---

## 📊 Test Data Management

### Creating Test Users
```python
# Via Python script or API
POST /api/auth/register
{
  "email": "test1@example.com",
  "password": "TestPass123!",
  "username": "test_user_1"
}
```

### Seeding Test Cards
```sql
-- Add test flashcards to QA database
INSERT INTO flashcards (word, translation, language_id, difficulty, hashtags)
VALUES 
  ('hello', 'γεια σου', 1, 1, '#beginner #greetings'),
  ('goodbye', 'αντίο', 1, 1, '#beginner #greetings'),
  ('restaurant', 'εστιατόριο', 1, 3, '#intermediate #food');
```

### Cleaning Test Data
```sql
-- Reset QA database (CAREFUL: Deletes all data)
DELETE FROM QuizWordPerformance;
DELETE FROM QuizSessions;
DELETE FROM UserSelectedCards;
DELETE FROM UserCardPreferences;
DELETE FROM Subscriptions;
DELETE FROM users WHERE email LIKE '%@example.com';
```

---

## ✅ QA Sign-Off Criteria

Before promoting to production, verify:

- [ ] **All Sprint 7 features working** in QA
- [ ] **No regressions** (old features still work)
- [ ] **Performance acceptable** (no major slowdowns)
- [ ] **Security tested** (no obvious vulnerabilities)
- [ ] **Database migrations successful** (no data loss)
- [ ] **Mobile responsive** (tested on iPhone/Android)
- [ ] **Cross-browser compatible** (Chrome, Firefox, Safari)
- [ ] **Error handling graceful** (no crashes)
- [ ] **Logs clean** (no critical errors)
- [ ] **Ready for production deployment**

---

## 🎯 Production Deployment (After QA)

### Final Checklist
- [ ] All QA testing complete and passed
- [ ] Code reviewed and approved
- [ ] Database migration scripts tested in QA
- [ ] Production backup created
- [ ] Rollback plan documented
- [ ] Team notified of deployment window
- [ ] Monitoring dashboards ready

### Deployment Steps
```bash
# 1. Merge dev to main
git checkout main
git merge dev
git push origin main

# 2. Create backup of production database (via Cloud Console)
# Go to: Cloud SQL > flashcards-db > Backups > Create Backup

# 3. Run production database migrations (if needed)
# Connect to LanguageLearning database and run migration scripts

# 4. Deploy to production
.\build-and-deploy.ps1

# 5. Smoke test production
# - Visit https://learn.rentyourcio.com
# - Test critical paths (login, browse cards, take quiz)
# - Check production logs for errors

# 6. Monitor for 30 minutes
# - Watch Cloud Run logs
# - Check error rates
# - Monitor user reports

# 7. If issues: ROLLBACK
gcloud run revisions list --service=super-flashcards --region=us-central1
gcloud run services update-traffic super-flashcards \
    --to-revisions=super-flashcards-00117=100 \
    --region=us-central1
```

---

## 📞 Support Contacts

**Primary Developer:** Available in Copilot chat  
**Database Issues:** Check Cloud SQL logs in Google Cloud Console  
**Deployment Issues:** Review Cloud Build logs in Google Cloud Console  

**Useful Logs:**
- Cloud Run Logs: https://console.cloud.google.com/run?project=super-flashcards-475210
- Cloud Build Logs: https://console.cloud.google.com/cloud-build/builds?project=super-flashcards-475210
- Cloud SQL Logs: https://console.cloud.google.com/sql/instances?project=super-flashcards-475210

---

**Happy Testing!** 🧪🚀

Remember: QA is your safe space. Break things. Find bugs. That's what it's for! 💪
