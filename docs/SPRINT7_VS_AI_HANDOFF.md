# Sprint 7 Implementation Handoff - VS Code AI

**Date:** November 10, 2025  
**From:** Claude (Architecture & Design)  
**To:** VS Code AI (Implementation)  
**Sprint Focus:** 💰 Monetization + 🎯 Personalization  
**Status:** ✅ Ready for Implementation

---

## 📋 Document Purpose

This handoff provides VS Code AI with:
1. **Complete technical specifications** for Sprint 7 features
2. **Implementation order** and dependencies
3. **New bug fix** discovered during testing
4. **Acceptance criteria** for each task
5. **Files to create/modify** with exact locations

**Your Role:** Implement the features as specified, handle syntax/import issues, add logging/error handling, debug runtime errors, and report any architecture-level issues back to Claude via the user.

---

## 🎯 Sprint 7 Overview

### Sprint Goals (51 hours total)

**Week 1 (25 hours):**
1. Subscription infrastructure (12h)
2. Card preferences system (13h)

**Week 2 (26 hours):**
3. Premium quiz with word tracking (16h)
4. URL sharing fix (2h)
5. Bug fix: Show newly added card (1h) ⭐ NEW
6. Testing & polish (7h)

### Success Criteria
- ✅ Freemium limits enforced (10 cards, 5 quizzes/day)
- ✅ Premium trial system functional (7 days)
- ✅ Card preferences working (hashtags, difficulty)
- ✅ New users get 50 curated beginner cards
- ✅ Quiz with word-level performance tracking
- ✅ URL sharing language disambiguation
- ✅ **New card navigation works** ⭐ NEW
- ✅ All tests passing

---

## 🐛 NEW BUG FIX (Priority: HIGH)

### Bug: Card Creation Doesn't Navigate to New Card

**Problem:** After adding a card, user stays in browse mode showing random order. The newly added card isn't visible.

**Expected Behavior:**
1. User submits new card form
2. Backend creates card successfully
3. Frontend refreshes cache to include new card
4. **Frontend navigates to show the specific new card** ⭐
5. User sees their newly created card immediately

**Current Behavior:**
1. Card created ✅
2. Returns to browse mode ✅
3. Shows cards in random order ❌
4. New card not visible (cache not refreshed) ❌

### Implementation Plan

**Backend Changes (if needed):**

File: `backend/app/routers/flashcards.py`

Check if the card creation endpoint returns the new flashcard_id:

```python
@router.post("/")
def create_flashcard(data: FlashcardCreate, db: Session = Depends(get_db)):
    # ... existing code ...
    
    # ENSURE this returns the full flashcard object with ID
    return {
        'success': True,
        'message': 'Flashcard created',
        'flashcard': {
            'flashcard_id': new_card.flashcard_id,  # ⭐ CRITICAL
            'word_or_phrase': new_card.word_or_phrase,
            # ... other fields ...
        }
    }
```

**Frontend Changes:**

File: `frontend/app.js`

Location: Around the `createFlashcard()` function (find where cards are created)

```javascript
async function createFlashcard(formData) {
    try {
        const response = await fetch('/api/flashcards/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create flashcard');
        }
        
        const result = await response.json();
        
        // ⭐ NEW: Get the flashcard ID from response
        const newFlashcardId = result.flashcard.flashcard_id;
        
        // ⭐ NEW: Refresh cache to include new card
        await refreshFlashcardsCache();
        
        // ⭐ NEW: Navigate to the new card
        navigateToCard(newFlashcardId);
        
        showToast('✅ Flashcard created successfully!');
        
    } catch (error) {
        console.error('Error creating flashcard:', error);
        showToast('❌ Failed to create flashcard');
    }
}

// Helper function to navigate to specific card
function navigateToCard(flashcardId) {
    // Update URL parameters to show this card
    const params = new URLSearchParams(window.location.search);
    params.set('mode', 'read');
    params.set('id', flashcardId);
    
    window.history.pushState({}, '', `?${params.toString()}`);
    
    // Trigger card load
    loadCardById(flashcardId);
}
```

**Testing Checklist:**
- [ ] Backend returns flashcard_id in response
- [ ] Cache refreshes after card creation
- [ ] Navigation to new card works
- [ ] New card displays correctly
- [ ] Toast notification shows success
- [ ] URL updates with correct card ID

**Estimated Effort:** 1 hour

---

## 1️⃣ PRIORITY 1: Subscription Infrastructure (12 hours)

### 1.1 Database Schema Changes (2 hours)

**Create Migration Script:** `backend/migrations/add_subscription_tables.sql`

```sql
-- Users table updates
ALTER TABLE Users ADD subscription_tier NVARCHAR(50) DEFAULT 'free';
ALTER TABLE Users ADD trial_start_date DATETIME2 NULL;
ALTER TABLE Users ADD trial_end_date DATETIME2 NULL;
ALTER TABLE Users ADD subscription_start_date DATETIME2 NULL;
ALTER TABLE Users ADD premium_expires_at DATETIME2 NULL;
ALTER TABLE Users ADD cards_created_count INT DEFAULT 0;
ALTER TABLE Users ADD quizzes_taken_today INT DEFAULT 0;
ALTER TABLE Users ADD last_quiz_reset DATETIME2 DEFAULT GETDATE();

-- Create indexes
CREATE INDEX idx_users_subscription_tier ON Users(subscription_tier);
CREATE INDEX idx_users_trial_dates ON Users(trial_start_date, trial_end_date);

-- Subscription limits configuration table
CREATE TABLE SubscriptionLimits (
    limit_id INT PRIMARY KEY IDENTITY(1,1),
    tier_name NVARCHAR(50) NOT NULL UNIQUE,
    max_cards INT NOT NULL,
    max_daily_quizzes INT NOT NULL,
    can_export BIT DEFAULT 0,
    can_share BIT DEFAULT 0,
    description NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Insert default limits
INSERT INTO SubscriptionLimits (tier_name, max_cards, max_daily_quizzes, can_export, can_share, description)
VALUES 
    ('free', 10, 5, 0, 0, 'Free tier with basic features'),
    ('trial', 50, 20, 1, 1, '7-day trial with most premium features'),
    ('premium', 999999, 999999, 1, 1, 'Unlimited premium access');

-- Usage tracking table
CREATE TABLE UsageLog (
    log_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    action_type NVARCHAR(50) NOT NULL,  -- 'create_card', 'take_quiz'
    timestamp DATETIME2 DEFAULT GETDATE(),
    success BIT DEFAULT 1,
    blocked_reason NVARCHAR(255) NULL,  -- If limit exceeded
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE INDEX idx_usage_log ON UsageLog(user_id, action_type, timestamp);
```

**Run Migration:**
```bash
# Connect to Azure SQL
sqlcmd -S super-flashcards-server.database.windows.net -d LanguageLearning -U <user> -P <password> -i backend/migrations/add_subscription_tables.sql
```

**Verify:**
```sql
-- Check tables exist
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('SubscriptionLimits', 'UsageLog');

-- Check Users columns
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Users' AND COLUMN_NAME LIKE '%subscription%';
```

### 1.2 Backend Models (1 hour)

**File:** `backend/app/models.py`

Add these fields to the User model:

```python
class User(Base):
    __tablename__ = 'users'
    
    user_id = Column(Integer, primary_key=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # ⭐ NEW: Subscription fields
    subscription_tier = Column(String(50), default='free')
    trial_start_date = Column(DateTime, nullable=True)
    trial_end_date = Column(DateTime, nullable=True)
    subscription_start_date = Column(DateTime, nullable=True)
    premium_expires_at = Column(DateTime, nullable=True)
    
    # ⭐ NEW: Usage tracking
    cards_created_count = Column(Integer, default=0)
    quizzes_taken_today = Column(Integer, default=0)
    last_quiz_reset = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)
```

Add new models:

```python
class SubscriptionLimits(Base):
    __tablename__ = 'subscription_limits'
    
    limit_id = Column(Integer, primary_key=True)
    tier_name = Column(String(50), unique=True, nullable=False)
    max_cards = Column(Integer, nullable=False)
    max_daily_quizzes = Column(Integer, nullable=False)
    can_export = Column(Boolean, default=False)
    can_share = Column(Boolean, default=False)
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

class UsageLog(Base):
    __tablename__ = 'usage_log'
    
    log_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    action_type = Column(String(50), nullable=False)  # 'create_card', 'take_quiz'
    timestamp = Column(DateTime, default=datetime.utcnow)
    success = Column(Boolean, default=True)
    blocked_reason = Column(String(255), nullable=True)
    
    user = relationship("User", back_populates="usage_logs")

# Add to User model
User.usage_logs = relationship("UsageLog", back_populates="user")
```

### 1.3 Subscription Service (3 hours)

**Create File:** `backend/app/services/subscription_service.py`

```python
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app import models
import logging

logger = logging.getLogger(__name__)

class SubscriptionService:
    
    @staticmethod
    def get_user_limits(user: models.User, db: Session) -> dict:
        """Get current subscription limits for user"""
        
        # Determine effective tier
        tier = SubscriptionService.get_effective_tier(user)
        
        # Get limits from database
        limits = db.query(models.SubscriptionLimits).filter(
            models.SubscriptionLimits.tier_name == tier
        ).first()
        
        if not limits:
            logger.error(f"No limits found for tier: {tier}")
            # Fallback to free tier
            limits = db.query(models.SubscriptionLimits).filter(
                models.SubscriptionLimits.tier_name == 'free'
            ).first()
        
        return {
            'tier': tier,
            'max_cards': limits.max_cards,
            'max_daily_quizzes': limits.max_daily_quizzes,
            'can_export': limits.can_export,
            'can_share': limits.can_share,
            'current_card_count': user.cards_created_count,
            'quizzes_taken_today': user.quizzes_taken_today
        }
    
    @staticmethod
    def get_effective_tier(user: models.User) -> str:
        """Determine user's current effective subscription tier"""
        
        now = datetime.utcnow()
        
        # Check if premium subscription active
        if user.subscription_tier == 'premium':
            if user.premium_expires_at and user.premium_expires_at > now:
                return 'premium'
        
        # Check if trial active
        if user.trial_end_date and user.trial_end_date > now:
            return 'trial'
        
        # Default to free
        return 'free'
    
    @staticmethod
    def start_trial(user: models.User, db: Session) -> dict:
        """Start 7-day trial for user"""
        
        # Check if user already had a trial
        if user.trial_start_date:
            return {
                'success': False,
                'message': 'Trial already used',
                'trial_end_date': user.trial_end_date
            }
        
        # Start trial
        now = datetime.utcnow()
        user.trial_start_date = now
        user.trial_end_date = now + timedelta(days=7)
        
        db.commit()
        
        logger.info(f"Trial started for user {user.user_id} until {user.trial_end_date}")
        
        return {
            'success': True,
            'message': 'Trial started',
            'trial_end_date': user.trial_end_date
        }
    
    @staticmethod
    def can_create_card(user: models.User, db: Session) -> tuple[bool, str]:
        """Check if user can create another flashcard"""
        
        limits = SubscriptionService.get_user_limits(user, db)
        
        if user.cards_created_count >= limits['max_cards']:
            tier = limits['tier']
            return False, f"Card limit reached ({limits['max_cards']}). Upgrade to create more."
        
        return True, "OK"
    
    @staticmethod
    def can_take_quiz(user: models.User, db: Session) -> tuple[bool, str]:
        """Check if user can take another quiz today"""
        
        # Reset daily counter if needed
        SubscriptionService.reset_daily_quiz_count_if_needed(user, db)
        
        limits = SubscriptionService.get_user_limits(user, db)
        
        if user.quizzes_taken_today >= limits['max_daily_quizzes']:
            return False, f"Daily quiz limit reached ({limits['max_daily_quizzes']}). Try again tomorrow or upgrade."
        
        return True, "OK"
    
    @staticmethod
    def increment_card_count(user: models.User, db: Session):
        """Increment user's card creation count"""
        user.cards_created_count += 1
        db.commit()
        logger.info(f"User {user.user_id} card count: {user.cards_created_count}")
    
    @staticmethod
    def increment_quiz_count(user: models.User, db: Session):
        """Increment user's daily quiz count"""
        
        # Reset if needed
        SubscriptionService.reset_daily_quiz_count_if_needed(user, db)
        
        user.quizzes_taken_today += 1
        db.commit()
        logger.info(f"User {user.user_id} quiz count today: {user.quizzes_taken_today}")
    
    @staticmethod
    def reset_daily_quiz_count_if_needed(user: models.User, db: Session):
        """Reset quiz count if last reset was yesterday or earlier"""
        
        now = datetime.utcnow()
        last_reset = user.last_quiz_reset
        
        # If last reset was yesterday or earlier, reset counter
        if last_reset.date() < now.date():
            user.quizzes_taken_today = 0
            user.last_quiz_reset = now
            db.commit()
            logger.info(f"Reset daily quiz count for user {user.user_id}")
    
    @staticmethod
    def log_usage(user_id: int, action_type: str, success: bool, 
                  blocked_reason: str = None, db: Session = None):
        """Log user action for analytics"""
        
        log = models.UsageLog(
            user_id=user_id,
            action_type=action_type,
            success=success,
            blocked_reason=blocked_reason
        )
        db.add(log)
        db.commit()
```

### 1.4 API Endpoints (3 hours)

**Create File:** `backend/app/routers/subscription.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.services.subscription_service import SubscriptionService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/subscription", tags=["subscription"])

@router.get("/limits")
def get_subscription_limits(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscription limits and usage"""
    
    limits = SubscriptionService.get_user_limits(current_user, db)
    
    return {
        'tier': limits['tier'],
        'limits': {
            'max_cards': limits['max_cards'],
            'max_daily_quizzes': limits['max_daily_quizzes'],
            'can_export': limits['can_export'],
            'can_share': limits['can_share']
        },
        'usage': {
            'cards_created': limits['current_card_count'],
            'quizzes_today': limits['quizzes_taken_today']
        },
        'trial_info': {
            'trial_available': current_user.trial_start_date is None,
            'trial_end_date': current_user.trial_end_date.isoformat() if current_user.trial_end_date else None
        }
    }

@router.post("/start-trial")
def start_trial(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start 7-day premium trial"""
    
    result = SubscriptionService.start_trial(current_user, db)
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])
    
    return result

@router.get("/check-limits")
def check_limits(
    action: str,  # 'create_card' or 'take_quiz'
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user can perform an action"""
    
    if action == 'create_card':
        can_do, message = SubscriptionService.can_create_card(current_user, db)
    elif action == 'take_quiz':
        can_do, message = SubscriptionService.can_take_quiz(current_user, db)
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    return {
        'can_perform': can_do,
        'message': message
    }
```

**Update:** `backend/app/main.py`

Add the new router:

```python
from app.routers import subscription

app.include_router(subscription.router)
```

### 1.5 Enforce Limits in Existing Endpoints (2 hours)

**Update:** `backend/app/routers/flashcards.py`

Add limit checks to card creation:

```python
from app.services.subscription_service import SubscriptionService

@router.post("/")
def create_flashcard(
    data: FlashcardCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ⭐ NEW: Check subscription limits
    can_create, message = SubscriptionService.can_create_card(current_user, db)
    
    if not can_create:
        # Log blocked attempt
        SubscriptionService.log_usage(
            current_user.user_id,
            'create_card',
            success=False,
            blocked_reason=message,
            db=db
        )
        raise HTTPException(status_code=403, detail=message)
    
    # ... existing card creation code ...
    
    # ⭐ NEW: Increment counter after successful creation
    SubscriptionService.increment_card_count(current_user, db)
    
    # ⭐ NEW: Log successful creation
    SubscriptionService.log_usage(
        current_user.user_id,
        'create_card',
        success=True,
        db=db
    )
    
    return {
        'success': True,
        'message': 'Flashcard created',
        'flashcard': {
            'flashcard_id': new_card.flashcard_id,
            'word_or_phrase': new_card.word_or_phrase,
            # ... other fields ...
        }
    }
```

**Update:** `backend/app/routers/quiz.py` (when created for Priority 3)

Add limit checks to quiz:

```python
@router.post("/start")
def start_quiz(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ⭐ Check subscription limits
    can_quiz, message = SubscriptionService.can_take_quiz(current_user, db)
    
    if not can_quiz:
        SubscriptionService.log_usage(
            current_user.user_id,
            'take_quiz',
            success=False,
            blocked_reason=message,
            db=db
        )
        raise HTTPException(status_code=403, detail=message)
    
    # ... existing quiz code ...
    
    # ⭐ Increment counter
    SubscriptionService.increment_quiz_count(current_user, db)
    
    # ⭐ Log usage
    SubscriptionService.log_usage(
        current_user.user_id,
        'take_quiz',
        success=True,
        db=db
    )
```

### 1.6 Frontend Subscription UI (1 hour)

**Update:** `frontend/app.js`

Add subscription status display:

```javascript
// Global state
window.subscriptionLimits = null;

// Fetch subscription limits on login
async function loadSubscriptionLimits() {
    try {
        const response = await fetch('/api/subscription/limits', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        
        if (response.ok) {
            window.subscriptionLimits = await response.json();
            updateSubscriptionUI();
        }
    } catch (error) {
        console.error('Failed to load subscription limits:', error);
    }
}

// Update UI with subscription status
function updateSubscriptionUI() {
    const limits = window.subscriptionLimits;
    if (!limits) return;
    
    // Show tier badge
    const tierBadge = document.getElementById('tier-badge');
    if (tierBadge) {
        tierBadge.textContent = limits.tier.toUpperCase();
        tierBadge.className = `tier-badge tier-${limits.tier}`;
    }
    
    // Show usage stats
    const usageDisplay = document.getElementById('usage-stats');
    if (usageDisplay) {
        usageDisplay.innerHTML = `
            <div class="usage-stat">
                <span>Cards:</span>
                <span>${limits.usage.cards_created} / ${limits.limits.max_cards}</span>
            </div>
            <div class="usage-stat">
                <span>Quizzes Today:</span>
                <span>${limits.usage.quizzes_today} / ${limits.limits.max_daily_quizzes}</span>
            </div>
        `;
    }
    
    // Show trial info if available
    if (limits.trial_info.trial_available) {
        showTrialOffer();
    } else if (limits.trial_info.trial_end_date) {
        showTrialStatus(limits.trial_info.trial_end_date);
    }
}

// Check limits before creating card
async function checkCanCreateCard() {
    try {
        const response = await fetch('/api/subscription/check-limits?action=create_card', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        
        const result = await response.json();
        
        if (!result.can_perform) {
            showLimitReachedModal('card', result.message);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Failed to check limits:', error);
        return true; // Fail open
    }
}

// Show limit reached modal
function showLimitReachedModal(type, message) {
    const html = `
        <div class="modal-content limit-reached">
            <h2>⚠️ Limit Reached</h2>
            <p>${message}</p>
            <div class="upgrade-options">
                <button onclick="showTrialModal()" class="btn-primary">
                    Start 7-Day Free Trial
                </button>
                <button onclick="showUpgradeModal()" class="btn-secondary">
                    Upgrade to Premium
                </button>
                <button onclick="closeModal()" class="btn-tertiary">
                    Maybe Later
                </button>
            </div>
        </div>
    `;
    showModal(html);
}
```

**Add to:** `frontend/index.html`

Add subscription UI elements:

```html
<!-- In header -->
<div id="tier-badge" class="tier-badge">FREE</div>
<div id="usage-stats" class="usage-stats"></div>

<!-- Trial offer banner (shown when trial available) -->
<div id="trial-banner" class="trial-banner" style="display: none;">
    <span>🎉 Start your 7-day free trial of Premium!</span>
    <button onclick="startTrial()">Start Trial</button>
    <button onclick="dismissTrialBanner()">×</button>
</div>
```

**Add to:** `frontend/styles.css`

```css
/* Tier badges */
.tier-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
}

.tier-free {
    background: #e0e0e0;
    color: #666;
}

.tier-trial {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.tier-premium {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
}

/* Usage stats */
.usage-stats {
    display: flex;
    gap: 20px;
    font-size: 14px;
}

.usage-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

/* Trial banner */
.trial-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
}

/* Limit reached modal */
.limit-reached {
    text-align: center;
}

.upgrade-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
}
```

### Testing Checklist for Priority 1

- [ ] Migration runs successfully on Azure SQL
- [ ] Default subscription limits inserted
- [ ] User model has new fields
- [ ] GET /api/subscription/limits returns correct data
- [ ] POST /api/subscription/start-trial works
- [ ] Free tier blocked at 10 cards
- [ ] Free tier blocked at 5 quizzes/day
- [ ] Trial tier has elevated limits
- [ ] Premium tier is unlimited
- [ ] Frontend displays tier badge
- [ ] Frontend shows usage stats
- [ ] Trial banner appears for eligible users
- [ ] Limit reached modal appears when blocked
- [ ] Usage log records actions

---

## 2️⃣ PRIORITY 2: User Card Preferences (13 hours)

### Implementation Plan

Follow the detailed specifications in the Sprint 7 planning document (SPRINT7_HANDOFF.md from earlier message).

**Key Files to Create:**
1. `backend/migrations/add_card_preferences.sql` (2h)
2. `backend/app/services/card_selection_service.py` (3h)
3. `backend/app/routers/card_preferences.py` (2h)
4. Update `backend/app/models.py` (1h)
5. Update `backend/app/routers/flashcards.py` (1h)
6. Update `frontend/app.js` (3h)
7. Update `frontend/styles.css` (1h)

**Refer to the Sprint 7 planning doc for:**
- Complete SQL schema
- Full service implementation
- All API endpoints
- Frontend UI components
- Success criteria

**Key Implementation Notes:**
- Hashtags stored as JSON in database
- Difficulty levels: 1 (beginner) to 5 (expert)
- New users auto-get 50 beginner cards
- Users can switch between "all cards" and "my cards" view
- Soft delete for card removal (is_hidden flag)

---

## 3️⃣ PRIORITY 3: Premium Quiz with Word Tracking (16 hours)

### Implementation Plan

This is the most complex feature in Sprint 7. Refer to the Sprint 7 planning document for complete specifications.

**Key Components:**
1. Quiz question database (3h)
2. Question pre-generation service (3h)
3. Quiz session management (3h)
4. Word-level performance tracking (3h)
5. Quiz API endpoints (2h)
6. Frontend quiz UI (2h)

**Important:**
- Questions pre-generated and stored (not generated on-demand)
- Word mastery calculated from quiz performance
- Premium feature: limit free users to 5 quizzes/day
- Comprehensive Playwright tests required

---

## 4️⃣ PRIORITY 4: URL Sharing Fix (2 hours)

**Problem:** Shared URLs like `?word=test` are ambiguous when multiple languages have the same word.

**Solution:** Add language parameter to URLs.

**Implementation:**

File: `frontend/app.js`

Update URL generation:

```javascript
// OLD
function generateShareUrl(word) {
    return `${window.location.origin}?word=${encodeURIComponent(word)}`;
}

// NEW
function generateShareUrl(word, languageCode) {
    return `${window.location.origin}?word=${encodeURIComponent(word)}&lang=${languageCode}`;
}

// Update card loading
function loadCardFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const word = params.get('word');
    const lang = params.get('lang');
    
    if (word && lang) {
        // Load specific card by word + language
        loadCardByWordAndLanguage(word, lang);
    }
}
```

**Testing:**
- [ ] URL includes language code
- [ ] Shared links load correct card
- [ ] Disambiguation works for common words across languages

---

## 🧪 Testing Strategy

### Unit Tests

**Create:** `backend/tests/test_subscription.py`

```python
import pytest
from app.services.subscription_service import SubscriptionService

def test_free_tier_card_limit():
    # Test free tier blocked at 10 cards
    pass

def test_trial_start():
    # Test trial starts correctly
    pass

def test_daily_quiz_reset():
    # Test quiz counter resets daily
    pass
```

### Integration Tests

**Create:** `backend/tests/test_subscription_endpoints.py`

```python
def test_get_limits_endpoint():
    # Test GET /api/subscription/limits
    pass

def test_start_trial_endpoint():
    # Test POST /api/subscription/start-trial
    pass
```

### Playwright E2E Tests

**Create:** `tests/e2e/test_subscription.spec.js`

```javascript
test('Free user blocked at card limit', async ({ page }) => {
    // Create 10 cards
    // Attempt 11th card
    // Verify blocked with modal
});

test('Trial start flow', async ({ page }) => {
    // Click "Start Trial"
    // Verify trial badge appears
    // Verify limits increased
});
```

**CRITICAL:** All monetization features MUST have Playwright tests due to financial implications.

---

## 📁 File Inventory

### Files to Create (New)

**Backend:**
1. `backend/migrations/add_subscription_tables.sql`
2. `backend/migrations/add_card_preferences.sql`
3. `backend/app/services/subscription_service.py`
4. `backend/app/services/card_selection_service.py`
5. `backend/app/routers/subscription.py`
6. `backend/app/routers/card_preferences.py`
7. `backend/app/routers/quiz.py`
8. `backend/tests/test_subscription.py`
9. `backend/tests/test_card_preferences.py`
10. `backend/tests/test_quiz.py`

**Frontend:**
- No new files (all updates to existing `app.js`, `styles.css`)

**Tests:**
11. `tests/e2e/test_subscription.spec.js`
12. `tests/e2e/test_card_preferences.spec.js`
13. `tests/e2e/test_quiz.spec.js`

### Files to Modify (Existing)

**Backend:**
1. `backend/app/models.py` (add subscription fields, card preference models)
2. `backend/app/main.py` (add new routers)
3. `backend/app/routers/flashcards.py` (enforce limits, return card ID, filter by preferences)
4. `backend/app/routers/ai_generate.py` (enforce limits)

**Frontend:**
5. `frontend/app.js` (subscription UI, card preferences UI, quiz UI, new card navigation fix)
6. `frontend/index.html` (tier badge, usage stats, trial banner)
7. `frontend/styles.css` (subscription styling, card preference styling)

---

## 🚨 Critical Reminders

### From Collaboration Protocol

1. **Your Role:**
   - ✅ Implement features as specified
   - ✅ Fix syntax/import errors
   - ✅ Add comprehensive logging
   - ✅ Add error handling
   - ✅ Debug runtime issues
   - ✅ Write tests

2. **Escalate to Claude (via user) when:**
   - ❌ Design flaw discovered
   - ❌ Architecture question
   - ❌ Missing major component
   - ❌ Security concern
   - ❌ Performance issue requires redesign

3. **Code Quality Standards:**
   - Add logging for all major operations
   - Handle all error cases gracefully
   - Validate user input
   - Test edge cases
   - Document complex logic

### High-Stakes Warning ⚠️

This sprint involves **monetization**:
- Users will be paying for premium features
- Subscription limits MUST be accurate
- Billing logic MUST be correct
- Testing MUST be comprehensive
- No room for "good enough" - must be perfect

**If you encounter ANY issues with subscription logic, escalate immediately to Claude.**

---

## 📋 Implementation Checklist

### Week 1: Subscription + Card Preferences

**Day 1-2: Subscription Infrastructure (12h)**
- [ ] Run database migration
- [ ] Update models.py with subscription fields
- [ ] Create subscription_service.py
- [ ] Create subscription router
- [ ] Update flashcards.py with limit checks
- [ ] Add frontend subscription UI
- [ ] Test free tier limits (10 cards, 5 quizzes)
- [ ] Test trial start (7 days)
- [ ] Write unit tests
- [ ] Write Playwright tests

**Day 3-4: Card Preferences (13h)**
- [ ] Run card preferences migration
- [ ] Update models.py with preference models
- [ ] Create card_selection_service.py
- [ ] Create card_preferences router
- [ ] Update flashcards.py to filter by preferences
- [ ] Add hashtag/difficulty UI
- [ ] Add card add/remove buttons
- [ ] Test new user onboarding (50 cards)
- [ ] Test view mode switching
- [ ] Test difficulty filtering
- [ ] Write tests

### Week 2: Quiz + Bug Fixes + Testing

**Day 5-6: Premium Quiz (16h)**
- [ ] Create quiz question tables
- [ ] Create question generation service
- [ ] Create quiz session management
- [ ] Create word performance tracking
- [ ] Create quiz API endpoints
- [ ] Add frontend quiz UI
- [ ] Enforce quiz limits (5/day free)
- [ ] Test quiz flow end-to-end
- [ ] Write comprehensive tests

**Day 7: Bug Fix + URL Fix (3h)**
- [ ] Fix new card navigation ⭐
- [ ] Fix URL sharing language disambiguation
- [ ] Test both fixes thoroughly

**Day 8: Testing & Polish (7h)**
- [ ] Run all unit tests
- [ ] Run all integration tests
- [ ] Run all Playwright tests
- [ ] Fix any failing tests
- [ ] Manual testing of critical paths
- [ ] Performance testing
- [ ] Security review

---

## 🎯 Success Criteria

Sprint 7 is successful when:

1. ✅ All Playwright tests passing
2. ✅ Free tier limits enforced accurately
3. ✅ Trial system works correctly
4. ✅ New users get 50 beginner cards
5. ✅ Card preferences filtering works
6. ✅ Quiz tracks word-level mastery
7. ✅ URL sharing includes language
8. ✅ **New cards navigate correctly** ⭐
9. ✅ Zero critical bugs
10. ✅ Production deployment successful

---

## 📞 Communication Protocol

### When to Ask Claude (via User)

**Architecture Questions:**
- "Should we use WebSockets instead of SSE for quiz?"
- "How should we handle concurrent quiz sessions?"
- "What's the best way to optimize card preference queries?"

**Design Issues:**
- "Found: subscription limits can be bypassed by..."
- "Found: race condition in daily quiz reset..."
- "Found: card preference filtering returns wrong results..."

**Missing Specs:**
- "Spec unclear: How should we handle expired trials?"
- "Spec missing: What happens if user downgrades mid-quiz?"

### Your Decisions

**Implementation Details:**
- Variable names
- Log message formatting
- Error message wording
- Code organization
- Import order
- Comment style

**Quick Fixes:**
- Syntax errors
- Import errors
- Path errors
- Type errors
- Minor logic bugs

---

## 🚀 Ready to Start?

You have everything you need:
1. ✅ Complete technical specifications
2. ✅ Implementation order
3. ✅ All SQL schemas
4. ✅ All service implementations
5. ✅ All API endpoints
6. ✅ All frontend components
7. ✅ Testing requirements
8. ✅ Success criteria

**Start with:** Bug fix (1h) + Database migrations (2h)

**Questions?** Ask the user, who will route to Claude if architectural.

**Good luck! 🎉**

---

**Document Version:** 1.0  
**Last Updated:** November 10, 2025  
**Status:** Ready for Implementation  
**Next Review:** Week 1 checkpoint (after subscription + card preferences)
