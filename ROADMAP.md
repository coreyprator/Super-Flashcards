# Super Flashcards - Product Roadmap
**Last Updated:** October 27, 2025  
**Current Version:** 2.6.12  
**Status:** Approaching MVP

---

## 🎯 Current Sprint - Pending Tasks

### High Priority (Blocking MVP)
- [ ] **Investigate tabs broken after document upload** - User reported Study/Read/Browse tabs don't work after uploading document
- [ ] **Test Greek words batch workflow end-to-end** - User needs to test v2.6.12 with hard refresh
- [ ] **Fix deployment issue** - Backend deployment failed (may not need redeployment if only frontend changed)

### Medium Priority
- [ ] **Clean up hamburger menu** - User wants to remove all items except Import (or remove hamburger entirely)
- [ ] **Complete production regression testing** - Verify all features work after v2.6.9-2.6.12 changes

### Low Priority
- [ ] **Document v2.6.12 testing results** - After user tests, document what works/doesn't work

**Key Decisions:**
- ✅ **Eliminate manual card creation** - All cards AI-generated for quality and consistency across all tiers
- ✅ **Google TTS only** - Eliminated OpenAI, ElevenLabs, and other TTS providers (Google won on quality/cost/reliability)
- ✅ **Subscription differentiation** - Based on content access (# of cards, # of languages, features) not quality


---

## 💰 Monetization Strategy - Freemium Model

### Payment Platform Integration
- [ ] **Research payment platforms**
  - Stripe (recommended - best developer experience)
- [ ] **Implement Stripe integration**
  - Set up Stripe account
  - Add Stripe SDK to backend
  - Create subscription plans
  - Implement webhook handlers for payment events
  - Add payment UI components
- [ ] **Implement subscription management**
  - Upgrade/downgrade flows
  - Billing portal
  - Invoice history
  - Payment method management

### Free Tier Features
**Limitations:**
- Maximum 50 flashcards total
- 5 AI generations per day
- 2 languages only (English + 1 more)
- text-to-speech (Google TTS) 
- Standard support (email only)

**Included:**
- ✅ Study mode
- ✅ Read mode
- ✅ Browse mode
- ✅ Offline access
- ✅ Mobile responsive
- ✅ Word search

### Premium Tier Features ($9.99/month or $99/year)
**Unlimited:**
- ✅ Unlimited flashcards
- ✅ Unlimited AI generations
- ✅ All languages
- ✅ TTS
- ✅ IPA pronunciation
- ✅ Etymology and cognates
- ✅ Batch document processing (unlimited)

**Exclusive Features:**
- ✅ Performance tracking & analytics
- ✅ Spaced repetition algorithm
- ✅ Custom study schedules
- ✅ **Personal card curation** - Select which global cards to study (hide cards that are too easy/hard or not relevant)
- ✅ AI-powered support chat
- ✅ Multi-language card display (cards can show in learning language or native language)

### Enterprise Tier (Future - Post Sprint 12)
**Status:** Not ready yet - focusing on Free/Premium first

**Planned Features (Everything in Premium, plus):**
- Team management dashboard
- User analytics & progress tracking
- SSO integration (SAML, OAuth)
- Custom branding
- Dedicated account manager
- SLA guarantee (99.9% uptime)
- Priority feature requests
- Bulk import tools
- LMS integration (Canvas, Moodle, etc.)

---

## 👤 User Administration & Account Management

### User Account Features
- [ ] **User registration & authentication**
  - Email/password signup
  - Google OAuth
  - Password reset flow
  - Email verification
  - Two-factor authentication (2FA)
- [ ] **Profile management**
  - Avatar upload
  - Display name
  - Email preferences
  - Primary language (native language for translations)
  - Study reminders time preference
- [ ] **Subscription management**
  - View current plan
  - Upgrade/downgrade
  - Cancel subscription
  - Billing history
  - Usage statistics (cards created, AI calls, etc.)
- [ ] **Usage limits & tracking**
  - Track daily AI generation count
  - Track total flashcard count
  - Display usage meters on dashboard
  - Warn when approaching limits
  - Upgrade prompts

### Admin Dashboard (for you/support staff)
- [ ] **User management**
  - View all users
  - Search users
  - View user details
  - Suspend/unsuspend accounts
  - Delete accounts (GDPR compliance)
  - Impersonate user (for support)
- [ ] **Subscription management**
  - View all subscriptions
  - Manually upgrade/downgrade
  - Issue refunds
  - Cancel subscriptions
  - View revenue metrics
- [ ] **Usage analytics**
  - Total users (free vs paid)
  - Monthly recurring revenue (MRR)
  - Churn rate
  - Most popular languages
  - API usage statistics
  - Error rates
- [ ] **Content moderation**
  - Flag inappropriate flashcards
  - Review reported content
  - Ban users who violate ToS

---

## 🛠️ Technical Infrastructure Needed

### Database Schema Updates
- [ ] **Users table**
  - user_id (UUID, primary key)
  - email (unique)
  - password_hash
  - display_name
  - avatar_url
  - created_at
  - last_login
  - email_verified
  - subscription_tier ('free', 'premium')
  - subscription_status ('active', 'cancelled', 'past_due')
  - stripe_customer_id
  - trial_ends_at
- [ ] **Subscriptions table**
  - subscription_id (UUID)
  - user_id (foreign key)
  - plan_id (stripe plan ID)
  - status ('active', 'cancelled', 'past_due')
  - current_period_start
  - current_period_end
  - cancel_at_period_end
  - created_at
  - updated_at
- [ ] **Usage tracking table**
  - usage_id (UUID)
  - user_id (foreign key)
  - date
  - ai_generations_count
  - flashcard_count
  - tts_requests
  - image_generations
- [ ] **Update flashcards table**
  - Add user_id (foreign key)
  - Add is_public (boolean, for shared decks)
  - Add table to associate card with user so users can choose which cards to see or ignore.

### Backend API Updates
- [ ] **Authentication endpoints**
  - POST /auth/register
  - POST /auth/login
  - POST /auth/logout
  - POST /auth/refresh-token
  - POST /auth/forgot-password
  - POST /auth/reset-password
  - POST /auth/verify-email
- [ ] **User endpoints**
  - GET /users/me (current user profile)
  - PUT /users/me (update profile)
  - DELETE /users/me (delete account)
  - GET /users/me/usage (usage statistics)
- [ ] **Subscription endpoints**
  - GET /subscriptions/plans (list available plans)
  - POST /subscriptions/checkout (create Stripe checkout session)
  - POST /subscriptions/portal (create billing portal session)
  - GET /subscriptions/me (current subscription)
  - POST /subscriptions/cancel
  - POST /webhooks/stripe (handle Stripe events)
- [ ] **Rate limiting middleware**
  - Enforce daily AI generation limits
  - Enforce flashcard count limits
  - Return 429 when limit exceeded with upgrade prompt

### Frontend Updates
- [ ] **Login/Signup UI**
  - Login modal
  - Signup modal
  - Password reset flow
  - Email verification page
- [ ] **User menu**
  - Profile dropdown in header
  - Account settings page
  - Subscription page
  - Usage dashboard
- [ ] **Paywall & upgrade prompts**
  - "Upgrade to Premium" banner for free users
  - Modal when hitting limits
  - Pricing page
  - Feature comparison table
- [ ] **Billing pages**
  - Checkout page (Stripe Elements)
  - Success/cancel pages
  - Billing portal redirect

---

## 📊 Performance Tracking (Future Sprint)

### Multiple Choice Quiz Feature (New)
**Concept:** AI-generated multiple choice questions to test word knowledge
- When a flashcard is created, generate 10 multiple choice questions automatically
- Each question has 4 answer choices (1 correct, 3 plausible distractors)
- Questions stored in database for future use
- Track user performance on each question type
- Questions test: definition, usage, synonyms, context

**Implementation:**
- [ ] Add `quiz_questions` table (card_id, question_text, correct_answer, distractors, question_type)
- [ ] AI generation endpoint: `/api/flashcards/{id}/generate-quiz`
- [ ] Quiz UI component for testing
- [ ] Performance tracking per card
- [ ] Aggregate statistics (% correct by word, by question type, by language)

### Metrics to Track
- [ ] **Study session metrics**
  - Cards studied per session
  - Session duration
  - Time spent per card
  - Cards marked as "hard" vs "easy"
- [ ] **Retention metrics**
  - Cards reviewed 1 day, 3 days, 7 days, 30 days later
  - Recall accuracy over time
  - Forgetting curve visualization
- [ ] **Progress metrics**
  - Total cards mastered
  - Current learning queue size
  - Cards due for review
  - Study streak (days in a row)
- [ ] **Language-specific metrics**
  - Progress per language
  - Vocabulary size per language
  - Most difficult words

### UI Components Needed
- [ ] **Dashboard overview**
  - Today's study goals
  - Cards due for review
  - Study streak counter
  - Weekly progress chart
- [ ] **Analytics page**
  - Progress over time graph
  - Retention curve
  - Study heatmap (calendar view)
  - Per-language breakdown
- [ ] **Card-level stats**
  - Times reviewed
  - Last reviewed date
  - Mastery level (1-5)
  - Average response time
  - Difficulty rating

### Spaced Repetition Algorithm
- [ ] **Implement SM-2 or similar algorithm**
  - Calculate next review date based on performance
  - Adjust intervals based on recall difficulty
  - Queue cards for review
- [ ] **Review interface**
  - Show due cards first
  - Grade recall (Again, Hard, Good, Easy)
  - Update next review date
  - Show progress through review queue

---

## 🌍 Multi-Language Card Display (Premium Feature)

**Concept:** Users can choose to display flashcards in their native language or the learning language
- **Beginner mode:** Cards shown in native language (e.g., English speaker learning Greek sees English front, Greek back)
- **Advanced mode:** Cards shown in learning language (e.g., Greek front, Greek definition back)
- All card content translated into each supported language using Google Translate API

**Implementation:**
- [ ] Add `card_translations` table (card_id, language_id, translated_definition, translated_etymology, etc.)
- [ ] Google Translate integration for bulk translation
- [ ] User preference: "Display cards in: [Native Language / Learning Language]"
- [ ] Auto-translate on card creation
- [ ] Re-translate when card updated
- [ ] Cache translations for performance

**Database Schema:**
```sql
CREATE TABLE card_translations (
    translation_id UUID PRIMARY KEY,
    flashcard_id UUID REFERENCES flashcards(id),
    language_id UUID REFERENCES languages(id),
    translated_definition TEXT,
    translated_etymology TEXT,
    translated_example_sentence TEXT,
    translated_notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 🎨 User Experience & Support

### Non-Technical Support Needs
- [ ] **Documentation**
  - User guide / getting started
  - FAQ page
  - Video tutorials
  - Feature showcase
  - Pricing page
  - Terms of Service
  - Privacy Policy
  - Refund policy
- [ ] **Help & Support**
  - Email support system (Zendesk, Intercom, or custom)
  - Live chat for Premium users (Intercom, Drift)
  - Support ticket system
  - Knowledge base / help center
  - Community forum (optional)
- [ ] **Marketing materials**
  - Landing page
  - Feature comparison chart
  - Customer testimonials
  - Blog posts (SEO)
  - Social media presence
  - CRM integration and email subscription for client followup
- [ ] **Onboarding flow**
  - Welcome tour for new users
  - Sample flashcards to get started
  - Tutorial tooltips
  - Email onboarding sequence
- [ ] **Communication**
  - Transactional emails (welcome, password reset, etc.)
  - Marketing emails (feature announcements)
  - Billing emails (payment successful, failed, etc.)
  - Usage notifications (approaching limit, etc.)

### Customer Success Metrics
- [ ] **Track user engagement**
  - Daily active users (DAU)
  - Monthly active users (MAU)
  - Session length
  - Feature adoption rates
- [ ] **Track conversion funnel**
  - Signup → Email verification
  - Free → Premium conversion rate
  - Trial → Paid conversion rate
  - Cancellation rate & reasons
- [ ] **Track customer satisfaction**
  - NPS score (Net Promoter Score)
  - Support ticket response time
  - Support ticket resolution time
  - User feedback surveys

---

## 🚀 Sprint Planning

### Sprint 7 - MVP Completion (Current)
**Goals:** Fix remaining bugs, complete batch workflow
- Fix tabs broken after upload
- Test Greek words workflow end-to-end
- Clean up hamburger menu
- Production regression testing
- **Target:** MVP launch-ready

### Sprint 8 - User Authentication & Accounts
**Goals:** Add user system, prepare for monetization
- Implement user registration/login
- Add user profiles
- Database schema for users
- Session management
- OAuth integration (Google)
- **Target:** Users can create accounts

### Sprint 9 - Subscription & Billing
**Goals:** Implement freemium model
- Stripe integration
- Free tier limits enforcement
- Pricing page
- Checkout flow
- Billing portal
- Usage tracking
- **Target:** Users can upgrade to Premium

### Sprint 10 - Admin Dashboard
**Goals:** Support tools for managing users
- Admin authentication
- User management UI
- Subscription management
- Analytics dashboard
- Content moderation tools
- **Target:** Can manage users and billing

### Sprint 11 - Performance Tracking (Phase 1)
**Goals:** Basic study metrics
- Track study sessions
- Basic progress metrics
- Simple analytics page
- Study streak
- **Target:** Users can see their progress

### Sprint 12 - Performance Tracking (Phase 2)
**Goals:** Advanced analytics & spaced repetition
- Implement spaced repetition algorithm
- Review queue
- Retention metrics
- Advanced analytics
- **Target:** Full performance tracking system

### Sprint 13 - Polish & Launch Prep
**Goals:** Documentation, support, marketing
- User documentation
- Help center
- Email templates
- Landing page optimization
- Beta testing program
- **Target:** Public launch

---

## 🎯 MVP Definition (Launch Criteria)

### Must Have (Blocking Launch)
- ✅ Core flashcard functionality (create, edit, delete, study)
- ✅ AI generation (definition, etymology, cognates, images)
- ✅ Batch import from text files
- ✅ Multiple languages support
- ✅ Offline-first architecture
- ✅ Mobile responsive design
- ⚠️ All tabs working (Study, Read, Browse)
- ⚠️ No critical bugs
- ❌ User authentication & accounts
- ❌ Free tier with limits
- ❌ Premium subscription option
- ❌ Basic documentation

### Nice to Have (Post-Launch)
- Performance tracking
- Spaced repetition
- Shared decks
- API access
- Export functionality
- Advanced search
- Custom themes

---

## 📝 Notes & Decisions

### Monetization Considerations
- **Stripe** is recommended for payment processing (best developer experience, handles most edge cases) Yes, go with Stripe.
- **Freemium limits** should be generous enough to evaluate the product but restrictive enough to encourage upgrades - Yes on all below.
  - 50 cards is enough to learn basics of a language
  - 5 AI generations/day allows trying the feature but not serious use
- **Annual discount** (17% off = $99/year vs $9.99/month) encourages commitment and improves retention
- **Enterprise tier** targets language schools, corporate training, universities. Not yet. Wait for above to work in prod.

### Technical Debt to Address

#### High Priority
- [ ] **Staging/Test environment** - Deploy separate test instance before touching production
  - **Why:** Currently deploying directly to prod is risky - one mistake affects live users
  - **Solution:** Create `super-flashcards-staging` Cloud Run service, test there first
  - **ROI:** Prevents production outages, allows safe experimentation

- [ ] **CI/CD Pipeline** - Automate testing and deployment
  - **Why:** Manual deployments are error-prone (running from wrong directory, forgetting version bumps)
  - **Solution:** GitHub Actions to auto-deploy on push to `main` (staging) and `production` branches
  - **ROI:** Faster releases, fewer human errors, automated tests before deploy

#### Medium Priority
- ✅ **Server-side storage with multi-device sync** - ALREADY IMPLEMENTED
  - **Current:** MS SQL Server database in Google Cloud (production)
  - **Features:** All flashcards stored server-side, synced across all devices
  - **Verified:** Desktop and iPhone both access same cards from cloud database
  - **Offline:** Read-only access via IndexedDB cache (no local edits)
  - **Status:** Working perfectly - users can access cards from any device

- [ ] **User authentication** - Add login/signup to associate cards with user accounts
  - **Current:** Everyone shares the same flashcard database (no user isolation)
  - **Needed:** User accounts so each user only sees their own cards
  - **Database:** SQL Server already set up, just need to add user_id foreign keys
  - **ROI:** Required for monetization (can't charge without user accounts)

- [ ] **Error tracking & monitoring** - Better visibility into production issues
  - **Current:** Console logs (browser-side only, we don't see users' errors)
  - **Needed:** Sentry or similar to capture errors from all users in production
  - **Why:** Currently we only know about bugs when user reports them
  - **ROI:** Proactive bug fixes before users complain, better user experience

#### Low Priority
- [ ] **End-to-end testing** - Automated tests that simulate real user workflows
  - **Current:** Manual testing only (you test after each release)
  - **Tool:** Playwright or Cypress to automate: "Create card → Study → Delete" flows
  - **ROI:** Catch regressions automatically, faster testing, confidence in releases
  - **Cost:** Takes 1-2 weeks to set up initially, then saves time on every release

- [ ] **React migration** - Keep vanilla JS for now
  - **Current:** Vanilla JavaScript works well, no performance issues
  - **When to migrate:** Only if app becomes too complex to maintain (not yet)
  - **ROI:** Better component reusability, larger talent pool, but significant rewrite cost
  - **Decision:** Defer until after monetization is working

### Open Questions & Answers

#### 1. Frontend Framework Migration?
**Decision:** Stay with vanilla JS for now
- **Current state:** App works well, no performance issues
- **If React:** Better component model, larger talent pool, easier to hire developers
- **Cost:** 3-4 weeks to rewrite everything, high risk of introducing bugs
- **ROI:** Not worth it until app complexity increases significantly (Sprint 15+)

#### 2. Mobile App vs PWA?
**Decision:** PWA (Progressive Web App) is sufficient for now

**What is PWA?**
- Web app that works like a native app (offline, home screen icon, push notifications)
- Users visit website, click "Add to Home Screen" and get an app icon
- **Current status:** Your app already has PWA support (manifest.json, service worker)
- **iPhone home screen:** Should already work! Try: Safari → Share → "Add to Home Screen"

**vs Native Mobile App:**
- **React Native/Flutter:** Separate codebase, app store approval, updates slower
- **Cost:** $20k-50k to build + ongoing maintenance
- **ROI:** Only worth it if we need: camera, fingerprint, background processing
- **Decision:** Stick with PWA until revenue justifies native app investment

#### 3. Offline AI Generation?
**How it would work:**
- Download small language model (1-2GB) to user's device
- Generate definitions without internet
- **Problem:** Models are large, slow on phones, quality worse than GPT-4
- **ROI:** Low - users rarely create cards offline, internet usually available
- **Decision:** Not worth the complexity

#### 4. Shared Decks Marketplace?
**Clarification:** You're right - this is already planned!
- All cards are globally shared
- Premium users can "follow" specific cards (personal curation)
- No separate marketplace needed - it's built into the core experience

#### 5. Anki Integration vs Build Our Own?
**What is Anki?**
- Popular desktop flashcard app (20+ years old)
- Uses spaced repetition algorithm (SM-2)
- Users want to export/import cards between systems

**Options:**
- **Build our own:** Full control, better integration, optimized for our UX
- **Anki integration:** Export to Anki format, import from Anki decks

**Decision:** Build our own + export compatibility
- Phase 1 (Sprint 11-12): Build custom spaced repetition
- Phase 2 (Sprint 13): Add Anki export for users who want both systems
- **Why:** Most users will only use our system, but power users want flexibility

---

**Last Review:** October 27, 2025  
**Next Review:** After Sprint 7 completion
