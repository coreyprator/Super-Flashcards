# Language Learning Flashcards - Updated Roadmap v2

**Last Updated**: End of Sprint 1  
**Current Status**: Sprint 2 complete, ready for Sprint 3  
**Next Milestone**: Offline PWA + Spaced Repetition

---

## Project Vision

AI-powered flashcard system for language learning with offline-first architecture. User has 18 months of language learning experience using AI and needs a structured tool with etymology-based memory anchoring.

**Core Use Case**: International travel with unreliable internet. System must work offline.

---

## Sprint Status Overview

| Sprint | Status | Duration | Focus |
|--------|--------|----------|-------|
| Sprint 1 | ✅ COMPLETE | Initial dev | Core flashcard system + AI generation |
| Sprint 2 | ✅ COMPLETE | 1 week | Advanced features + Edit modal + Spaced repetition |
| Sprint 3 | � NEXT | 1 week | Import/Export + Advanced Study Features |
| Sprint 4 | 📋 PLANNED | 1 week | Authentication + Deployment |
| Sprint 5+ | 💭 BACKLOG | TBD | Enhancements |

---

## ✅ Sprint 1: MVP Core System (COMPLETE)

**Goal**: Working flashcard system with manual and AI generation.

### Completed Features

**Backend** ✅
- FastAPI application with auto-generated docs
- MS SQL Express database (no migration needed)
- CRUD operations for flashcards and languages
- OpenAI GPT-4-turbo integration (text generation)
- DALL-E 3 integration (image generation)
- Image download and local storage
- Windows Authentication support
- Environment configuration via .env

**Frontend** ✅
- Responsive HTML/CSS/JavaScript with Tailwind
- Three-tab interface (Study, Add Card, Browse)
- Manual flashcard creation
- AI-powered flashcard generation
- Card flip animation
- Sequential navigation
- Search functionality
- Keyboard shortcuts (←→ navigation, F flip)
- Offline detection indicator

**Database** ✅
- Languages table (8 default languages)
- Flashcards table with Unicode support
- StudySessions table (structure for Phase 2)
- Offline sync fields (is_synced, local_only)
- JSON support for related_words

**DevOps** ✅
- Database initialization script
- Image maintenance script
- Comprehensive documentation
- .env.template configuration
- Git repository setup

### Key Decisions Made
1. **MS SQL Express**: Leverages user's 20 years expertise
2. **Local images first**: Download DALL-E images, migrate to Cloudinary later
3. **Simple frontend**: HTML/CSS/JS, no React complexity
4. **UNIQUEIDENTIFIER**: For offline-first UUID generation

### Sprint 1 Metrics
- **Lines of Code**: ~3,500
- **API Endpoints**: 12
- **Database Tables**: 3
- **Default Languages**: 8
- **Time to First Card**: 15 minutes (from setup)
- **AI Generation Time**: 5-10 seconds

---

## ✅ Sprint 2: CRUD UI + PWA Foundation (COMPLETE)

**Goal**: Complete CRUD interface and lay PWA groundwork.

**Priority**: HIGH (core functionality gaps)

**Adjusted from original plan**: Focusing on CRUD UI first (user-reported need), then basic PWA setup. Full offline sync moved to Sprint 3.

### Must Have

**CRUD UI Enhancements**
- [ ] Edit flashcard modal
  - Edit button on browse/study views
  - Pre-populate form with existing data
  - Save updates (PUT /api/flashcards/{id})
  - Update display immediately
- [ ] Delete flashcard with confirmation
  - Delete buttons with trash icon
  - Confirmation modal
  - Handle deleting current study card
  - Remove from display
- [ ] Improved manual entry form
  - Textareas for multi-line content
  - Better placeholders and examples
  - Form validation
  - Clear/reset button
- [ ] Image management
  - Display current image in edit
  - Remove image button
  - Regenerate image button
  - Preview in edit form

**PWA Infrastructure (Basic)**
- [ ] Service worker basics
  - Cache static assets
  - Cache Tailwind CDN
  - Network-first for APIs
  - Offline fallback page
- [ ] PWA manifest
  - App metadata and icons
  - Display: standalone
  - Start URL configuration
- [ ] Install prompt
  - Desktop install button
  - iOS instructions
  - Install detection

### Should Have

**Quality of Life**
- [ ] Better card navigation
  - Keyboard shortcuts documented
  - Navigation hints
- [ ] Form improvements
  - Character counters
  - Auto-save drafts (localStorage)
- [ ] Error handling
  - Network error messages
  - Retry buttons

### Nice to Have

**Bulk Operations**
- [ ] Select multiple cards
- [ ] Delete selected
- [ ] Export selected

**Basic Spaced Repetition**
- [ ] Simple difficulty rating (Easy/Hard)
- [ ] Calculate next review date
- [ ] "Due for review" filter

### Technical Architecture

**Files to Create**:
```
frontend/
├── sw.js                  # Service worker
├── manifest.json          # PWA manifest
└── offline.html           # Offline fallback
```

**Files to Modify**:
```
frontend/
├── index.html             # Add edit/delete modals
└── app.js                 # Add CRUD functions
```

**No Backend Changes**: All API endpoints exist.

### Sprint 2 Estimates
- **Duration**: 5-7 days
- **Complexity**: Medium
- **Risk**: Modal UI complexity, service worker testing
- **Dependencies**: Sprint 1 complete ✅

### Success Criteria
- [ ] Can edit flashcards from UI
- [ ] Can delete flashcards with confirmation
- [ ] Manual entry form is user-friendly
- [ ] Can manage images (remove/regenerate)
- [ ] App installable on desktop
- [ ] Service worker caches basic assets
- [ ] Works on mobile (tested on iPhone)

---

## 📋 Sprint 3: Full Offline Sync + Spaced Repetition (PLANNED)

**Goal**: Complete offline functionality and intelligent review scheduling.

**Priority**: HIGH (core use case: international travel)

### Features

**Full Offline Sync** (Moved from Sprint 2)
- [ ] IndexedDB integration
  - Store flashcards locally
  - Store languages
  - Store user preferences
  - Sync queue for offline changes
- [ ] Sync mechanism
  - Detect online/offline status
  - Upload local changes when online
  - Download server changes
  - Conflict resolution (last-write-wins)
  - Sync status indicator
  - Last synced timestamp
- [ ] Background sync API
  - Queue failed requests
  - Retry when online
  - Sync logs for debugging

**Spaced Repetition Algorithm**
- [ ] Leitner system implementation
  - 5 boxes for difficulty levels
  - Review intervals: 1d, 3d, 7d, 14d, 30d
  - Move cards based on recall success
- [ ] Study session tracking
  - Use study_sessions table
  - Track: card, difficulty rating, duration
  - Session summary at end
  - Cards reviewed today counter
- [ ] "Due for review" queue
  - Calculate next review date
  - Sort by urgency
  - Show due count badge
  - Filter by language
- [ ] Review workflow
  - Start study session
  - Show card
  - User rates: Easy/Good/Hard/Again
  - Auto-schedule next review
  - Progress through queue

**Mobile Optimization**
- [ ] Swipe gestures
  - Swipe right: next card
  - Swipe left: previous card
  - Swipe up: flip card
- [ ] Touch-friendly UI
  - Larger buttons
  - Better tap targets
  - Improved spacing
- [ ] Performance
  - Lazy load images
  - Optimize bundle size
  - Faster initial load

### Sprint 3 Estimates
- **Duration**: 5-7 days
- **Complexity**: Medium-High
- **Risk**: IndexedDB sync complexity, iOS service worker limits
- **Dependencies**: Sprint 2 (PWA foundation, CRUD UI)

**Statistics Dashboard**
- [ ] Learning metrics
  - Total cards by language
  - Cards mastered vs learning
  - Study streak (days)
  - Time studied today/week
- [ ] Visual charts
  - Learning progress over time
  - Cards due by date
  - Review success rate
  - Most reviewed words
- [ ] Language breakdown
  - Per-language statistics
  - Weak areas identification
  - Suggested focus areas
- [ ] Export data
  - Download statistics as CSV
  - Progress reports

**Search & Filter Enhancements**
- [ ] Full-text search
  - MS SQL CONTAINS indexes
  - Search in all fields
  - Ranked results
- [ ] Advanced filters
  - By review status (due, mastered, new)
  - By difficulty level
  - By source (AI vs manual)
  - By date range
- [ ] Sort options
  - Newest first
  - Most/least reviewed
  - Alphabetical
  - Due date

**Quality of Life**
- [ ] Card editing UI
  - Edit AI-generated content
  - Regenerate images
  - Add custom notes
- [ ] Bulk operations
  - Delete multiple cards
  - Export selected cards
  - Change language for cards
- [ ] Favorites/tags
  - Star important cards
  - Custom tags
  - Filter by tags

### Sprint 3 Estimates
- **Duration**: 5-7 days
- **Complexity**: Medium
- **Risk**: Mobile testing coverage
- **Dependencies**: Sprint 2 (PWA foundation)

---

## 📋 Sprint 4: Statistics + Polish (PLANNED)

**Goal**: Add progress tracking and polish the user experience.

**Priority**: MEDIUM (enhances engagement, not core functionality)

### Features

**Statistics Dashboard**
- [ ] Learning metrics
  - Total cards by language
  - Cards mastered vs learning vs new
  - Study streak (consecutive days)
  - Time studied today/week/month
  - Review success rate
- [ ] Visual charts
  - Learning progress over time (line chart)
  - Cards due by date (bar chart)
  - Review success rate (pie chart)
  - Most reviewed words (top 10 list)
- [ ] Language breakdown
  - Per-language statistics
  - Weak areas identification
  - Cards per difficulty level
  - Suggested focus areas
- [ ] Export data
  - Download statistics as CSV
  - Weekly/monthly reports
  - Print-friendly format

**Search & Filter Enhancements**
- [ ] Full-text search
  - MS SQL CONTAINS indexes
  - Search across all fields
  - Ranked results by relevance
- [ ] Advanced filters
  - By review status (due, mastered, new, learning)
  - By difficulty level
  - By source (AI vs manual)
  - By date range
  - By tags (if implemented)
- [ ] Sort options
  - Newest first / Oldest first
  - Most reviewed / Least reviewed
  - Alphabetical A-Z / Z-A
  - Next due date
  - Difficulty level

**Quality of Life Improvements**
- [ ] Favorites/bookmarks
  - Star important cards
  - Filter by favorites
  - Quick access list
- [ ] Tags system
  - Add custom tags to cards
  - Filter by tags
  - Tag suggestions
- [ ] Card templates
  - Save common patterns
  - Quick create from template
- [ ] Keyboard shortcuts help
  - ? key shows shortcuts overlay
  - Documented shortcuts

### Sprint 4 Estimates
- **Duration**: 5-7 days
- **Complexity**: Medium
- **Risk**: Chart library integration, performance with large datasets
- **Dependencies**: Sprint 3 (review data populated)

---

## 📋 Sprint 5: Authentication + Deployment (PLANNED)

**Goal**: Multi-user support and production deployment.

**Priority**: MEDIUM (for sharing with colleagues)

### Features

**Authentication**
- [ ] User registration
  - Email/password
  - Password strength validation
  - Email verification (optional)
- [ ] Login system
  - JWT token authentication
  - Remember me option
  - Logout functionality
- [ ] User profiles
  - Preferred language
  - Study preferences
  - Settings storage
  - **Instructional language preferences**:
    - Current: English explanations for foreign words (Option A)
    - Future: User-configurable instruction language
    - Options: 'english', 'target_language', 'auto'
    - Per-language preferences for advanced users
- [ ] Multi-tenant data
  - User-specific flashcards
  - Shared public decks (optional)
  - Privacy controls

**Deployment**
- [ ] Production environment setup
  - Choose: Azure SQL or VPS
  - SSL certificates
  - Domain configuration
- [ ] Image storage migration
  - Migrate from filesystem to Cloudinary
  - Batch upload existing images
  - Update all URLs in database
- [ ] Monitoring
  - Application logging
  - Error tracking (Sentry optional)
  - Performance monitoring
  - Usage analytics
- [ ] Backup strategy
  - Automated database backups
  - Image backups
  - Disaster recovery plan
- [ ] CI/CD pipeline
  - GitHub Actions
  - Automated testing
  - Deploy on push

**Security**
- [ ] Input validation
- [ ] SQL injection prevention (SQLAlchemy handles)
- [ ] XSS protection
- [ ] Rate limiting
- [ ] CORS configuration for production
- [ ] API key security

### Deployment Options

**Option A: Azure SQL + Azure App Service** (Recommended)
- **Pros**: Managed, scalable, familiar MS SQL
- **Cons**: ~$15-25/month
- **Setup**: 1-2 hours

**Option B: VPS + SQL Server Express**
- **Pros**: Cheap (~$5/month), full control
- **Cons**: Manual management, updates
- **Setup**: 3-4 hours

**Option C: Keep Local**
- **Pros**: Free, simple
- **Cons**: Not accessible outside network
- **Setup**: None needed

**Recommendation**: Option A (Azure) for best balance of cost/effort/reliability.

### Sprint 4 Estimates
- **Duration**: 5-7 days
- **Complexity**: Medium
- **Risk**: Deployment issues, DNS
- **Dependencies**: Sprint 3 (feature-complete)

---

## 💭 Sprint 5+: Future Enhancements (BACKLOG)

### Audio Features
- [ ] Text-to-speech pronunciation
  - OpenAI TTS API
  - Play button on cards
  - Record custom audio
- [ ] Voice input
  - Speak to add cards
  - Voice search

### Import/Export
- [ ] Google Docs parser
  - Import user's 18 months of existing content
  - Parse structure automatically
  - Match to database schema
- [ ] Anki export
  - Generate .apkg files
  - Share decks with others
- [ ] CSV import/export
  - Bulk add cards
  - Backup/restore

### Collaboration
- [ ] Share decks
  - Public deck library
  - Import others' decks
  - Rate and review decks
- [ ] Study groups
  - Invite colleagues
  - Shared progress
  - Leaderboards (optional)

### Advanced Learning
- [ ] Cloze deletion cards
  - Fill-in-the-blank style
  - Multiple clozes per card
- [ ] Sentence cards
  - Context-based learning
  - Grammar integration
- [ ] Custom card types
  - User-defined fields
  - Template system

### AI Enhancements
- [ ] Prompt customization
  - User-defined AI prompts
  - Emphasis on etymology/cognates
  - Different image styles
- [ ] AI quiz generation
  - Generate practice questions
  - Multiple choice
  - Fill in the blank
- [ ] Progress-aware AI
  - AI suggests what to learn next
  - Adapts to weak areas

### Mobile App
- [ ] Native iOS app (optional)
  - Swift/SwiftUI
  - Better offline support
  - Native notifications
- [ ] Native Android app (optional)
  - Kotlin
  - Material Design

### Analytics & Insights
- [ ] Learning patterns
  - Best time of day
  - Optimal session length
  - Difficulty trends
- [ ] Recommendations
  - Suggested review times
  - Cards to prioritize
  - Learning strategies
- [ ] Comparison metrics
  - Compare to average user
  - Language difficulty rankings

---

## Technical Debt & Maintenance

### Known Issues
1. **Image storage**: Filesystem → need Cloudinary migration (Sprint 4)
2. **No database migrations**: Using direct schema create (consider Alembic)
3. **Updated_at trigger**: Manual, not automatic (add trigger)
4. **No API tests**: Only manual testing (add pytest suite)
5. **No full-text search**: Using LIKE queries (add CONTAINS indexes)

### Refactoring Opportunities
- [ ] Separate AI service layer
- [ ] Cache frequently accessed data
- [ ] Add API versioning (/api/v1/)
- [ ] Centralize error handling
- [ ] Add request validation middleware

### Performance Optimization
- [ ] Add Redis caching (when needed)
- [ ] Implement pagination (when >1000 cards)
- [ ] Optimize database queries (use SSMS profiler)
- [ ] Add CDN for images (Cloudinary)
- [ ] Compress API responses

### Documentation
- [ ] API reference (Swagger sufficient for now)
- [ ] User guide
- [ ] Video tutorials
- [ ] Troubleshooting guide
- [ ] Contributing guidelines (if open source)

---

## Non-Goals

**We are NOT building**:
- Social network features (focus on learning)
- Gamification (no points, badges, levels)
- Live tutoring or chat
- Course marketplace
- Mobile games or mini-games
- Complex animations or effects
- Video/audio lessons (just flashcards)

**Scope Discipline**: Keep focused on flashcard-based learning with AI generation.

---

## Success Metrics

### Sprint 1 (Actual)
- ✅ MVP functional: Yes
- ✅ AI generation works: Yes
- ✅ User can create cards: Yes (manual + AI)
- ✅ Setup time: 15 minutes
- ✅ User satisfaction: High

### Sprint 2 (Targets)
- [ ] Offline mode works: 100% offline functionality
- [ ] Install rate: User installs to home screen
- [ ] Sync success: 100% of changes sync when online
- [ ] Review completion: 80%+ of scheduled reviews done
- [ ] Mobile performance: <2s load time

### Sprint 3 (Targets)
- [ ] Mobile UX: User prefers mobile over desktop
- [ ] Statistics usage: User checks stats weekly
- [ ] Search success: 90%+ searches find cards
- [ ] Study sessions: Average 20+ cards per session

### Sprint 4 (Targets)
- [ ] Uptime: 99.9%
- [ ] Deploy time: <30 minutes
- [ ] Zero security issues
- [ ] Image migration: 100% successful
- [ ] Colleague adoption: 3+ users

### Long-term (6 months)
- [ ] Daily active usage
- [ ] 1000+ flashcards created
- [ ] Measurable learning progress
- [ ] Zero critical bugs
- [ ] User recommends to others

---

## Resource Requirements

### Development Time
- **Sprint 1**: ~40 hours (COMPLETE)
- **Sprint 2**: ~40 hours (estimated)
- **Sprint 3**: ~30 hours (estimated)
- **Sprint 4**: ~30 hours (estimated)
- **Total MVP**: ~140 hours (3-4 weeks full-time)

### Costs

**Development (Phase 1-2)**:
- Development: User's time (most valuable resource)
- OpenAI API: ~$5-10 per 100 flashcards with images
- Tools: $0 (all free/open source)

**Production (Phase 3+)**:
- Hosting: $10-25/month (Azure SQL + App Service)
- Cloudinary: $0-9/month (free tier sufficient)
- Domain: $10-15/year (optional)
- Total: ~$15-35/month

**Acceptable**: User prioritizes time savings over cost savings.

---

## Risk Assessment

### High Risk
- **Offline sync complexity**: Conflict resolution edge cases
  - **Mitigation**: Last-write-wins, extensive testing
  
- **Mobile browser limitations**: iOS service worker restrictions
  - **Mitigation**: Test on real devices early, PWA fallbacks

### Medium Risk
- **OpenAI API costs**: Runaway costs if not monitored
  - **Mitigation**: Set spending limits, track usage

- **Image storage scaling**: 10k cards = ~1GB images
  - **Mitigation**: Cloudinary migration planned

- **MS SQL Express 10GB limit**: Could hit limit eventually
  - **Mitigation**: Easy upgrade to Standard if needed

### Low Risk
- **Performance**: Should be fine for 10k cards
- **Security**: Standard practices, not handling PII
- **Deployment**: Multiple options, well-documented

---

## Decision Log

### Sprint 1 Decisions

**✅ MS SQL Express instead of SQLite/PostgreSQL**
- **Rationale**: User has 20 years MS SQL experience
- **Result**: Zero learning curve, fast development
- **Status**: Confirmed correct decision

**✅ Local image storage instead of Cloudinary Day 1**
- **Rationale**: Simplicity, iterate later
- **Result**: Working immediately, easy to migrate
- **Status**: Correct for Phase 1, will migrate Sprint 4

**✅ Simple frontend instead of React**
- **Rationale**: Time optimization, no build complexity
- **Result**: Fast development, easy debugging
- **Status**: Correct, will keep for MVP

**✅ Download DALL-E images instead of storing URLs**
- **Rationale**: URLs expire after 2 hours (fixed bug)
- **Result**: Images persist correctly
- **Status**: Critical fix, should have been Day 1

### Decisions to Make

**Sprint 2**:
- Leitner vs SM-2 algorithm? (Recommend: Leitner, simpler)
- IndexedDB vs LocalStorage? (Recommend: IndexedDB, more storage)
- Sync strategy? (Recommend: Last-write-wins)

**Sprint 4**:
- Azure SQL vs VPS? (Recommend: Azure, managed)
- Authentication provider? (Recommend: Custom JWT)
- Image CDN? (Recommend: Cloudinary)

---

## Version History

**v1.0** (Sprint 1 Start): Initial roadmap, plan for MVP  
**v2.0** (Sprint 1 Complete): Updated after Sprint 1, added learnings, refined Sprint 2-4

---

**Next Review**: Sprint 2 completion  
**Status**: ✅ Sprint 2 complete, Sprint 3 ready to start