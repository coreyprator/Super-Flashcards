### 1b. User Card Preferences & Card Organization System (NEW - CRITICAL)

**Why This is Essential for Monetization:**
- Users paying for premium need **relevant** content
- Can't overwhelm new users with 800+ cards
- Need progression: beginner → intermediate → advanced
- Users should control their learning focus

**Implementation Plan:**

**Phase 1: Card Hashtag System (3 hours)**

**Problem to Solve:**
- Need to categorize 800+ existing cards
- Need flexible tagging (difficulty, topic, theme)
- Need to support multiple tags per card

**Solution: Hashtag system in card metadata**

**File:** `backend/app/models.py`
````python
class Flashcard(Base):
    __tablename__ = 'flashcards'
    
    # Existing fields...
    flashcard_id = Column(Integer, primary_key=True)
    word_or_phrase = Column(String(255))
    definition = Column(Text)
    # ...
    
    # NEW: Hashtag system (JSON array)
    hashtags = Column(Text, default='[]')  # JSON array of hashtags
    
    # Example hashtags:
    # ["#beginner", "#greek-alphabet", "#common-words"]
    # ["#intermediate", "#grammar", "#verb-conjugation"]
    # ["#advanced", "#philosophy", "#academic"]
    # ["#prefix", "#root", "#etymology"]
    
    # NEW: Difficulty level (1-5)
    difficulty_level = Column(Integer, default=3)  # 1=beginner, 5=advanced
    
    # NEW: Card category
    category = Column(String(100), nullable=True)  # 'vocabulary', 'grammar', 'prefix', 'phrase'
````

**Migration Script:**
````sql
-- Add new fields to Flashcards table
ALTER TABLE Flashcards ADD hashtags NVARCHAR(MAX) DEFAULT '[]';
ALTER TABLE Flashcards ADD difficulty_level INT DEFAULT 3;
ALTER TABLE Flashcards ADD category NVARCHAR(100) NULL;

-- Create index for hashtag searching
CREATE INDEX idx_flashcard_hashtags ON Flashcards(hashtags);
CREATE INDEX idx_flashcard_difficulty ON Flashcards(difficulty_level);
CREATE INDEX idx_flashcard_category ON Flashcards(category);
````

**Phase 2: User Card Preferences Table (2 hours)**

**Table Design:**
````sql
-- User's card preferences
CREATE TABLE UserCardPreferences (
    preference_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    
    -- View mode: 'all' or 'selected'
    view_mode NVARCHAR(20) DEFAULT 'selected',  -- 'all', 'selected'
    
    -- Difficulty range filter
    min_difficulty INT DEFAULT 1,  -- Show cards >= this level
    max_difficulty INT DEFAULT 3,  -- Show cards <= this level
    
    -- Category filter (JSON array)
    selected_categories NVARCHAR(MAX) DEFAULT '[]',  -- ['vocabulary', 'grammar']
    
    -- Hashtag filter (JSON array)
    selected_hashtags NVARCHAR(MAX) DEFAULT '[]',  -- ['#beginner', '#common-words']
    
    -- Auto-include new cards matching preferences
    auto_include_new_cards BIT DEFAULT 1,
    
    -- Last updated
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    UNIQUE (user_id)
);

-- User's selected cards (if view_mode='selected')
CREATE TABLE UserSelectedCards (
    selection_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    flashcard_id INT NOT NULL,
    
    -- When added to user's deck
    added_at DATETIME2 DEFAULT GETDATE(),
    
    -- Why added ('manual', 'import', 'recommendation', 'default')
    added_by NVARCHAR(50) DEFAULT 'manual',
    
    -- User's personal notes for this card
    personal_notes NVARCHAR(MAX) NULL,
    
    -- User can mark cards as favorite
    is_favorite BIT DEFAULT 0,
    
    -- User can hide cards temporarily
    is_hidden BIT DEFAULT 0,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (flashcard_id) REFERENCES Flashcards(flashcard_id),
    UNIQUE (user_id, flashcard_id)
);

-- Index for fast lookups
CREATE INDEX idx_user_cards ON UserSelectedCards(user_id, is_hidden);
CREATE INDEX idx_user_favorites ON UserSelectedCards(user_id, is_favorite);
````

**Phase 3: Default Card Selection for New Users (2 hours)**

**Service:** `backend/app/services/card_selection_service.py` (NEW)
````python
from sqlalchemy.orm import Session
from app import models
import json

class CardSelectionService:
    
    @staticmethod
    def initialize_new_user(user: models.User, language_id: int, db: Session):
        """
        Set up default card preferences for new user
        Start with beginner-level common words
        """
        
        # Create user preferences
        preferences = models.UserCardPreferences(
            user_id=user.user_id,
            view_mode='selected',
            min_difficulty=1,
            max_difficulty=2,  # Start with beginner/elementary
            selected_categories=json.dumps(['vocabulary', 'common-words']),
            selected_hashtags=json.dumps(['#beginner', '#common-words']),
            auto_include_new_cards=True
        )
        db.add(preferences)
        db.flush()
        
        # Select beginner cards for user
        beginner_cards = db.query(models.Flashcard).filter(
            models.Flashcard.language_id == language_id,
            models.Flashcard.difficulty_level <= 2,
            models.Flashcard.hashtags.like('%beginner%')
        ).limit(50).all()  # Start with 50 beginner cards
        
        for card in beginner_cards:
            selection = models.UserSelectedCards(
                user_id=user.user_id,
                flashcard_id=card.flashcard_id,
                added_by='default'
            )
            db.add(selection)
        
        db.commit()
        
        return len(beginner_cards)
    
    @staticmethod
    def get_user_cards(user_id: int, language_id: int, db: Session) -> list:
        """
        Get cards visible to user based on their preferences
        """
        
        # Get user preferences
        preferences = db.query(models.UserCardPreferences).filter(
            models.UserCardPreferences.user_id == user_id
        ).first()
        
        if not preferences:
            # No preferences yet - return all cards (backward compatibility)
            return db.query(models.Flashcard).filter(
                models.Flashcard.language_id == language_id
            ).all()
        
        if preferences.view_mode == 'all':
            # User wants to see all cards
            query = db.query(models.Flashcard).filter(
                models.Flashcard.language_id == language_id
            )
            
            # Apply difficulty filter if set
            if preferences.min_difficulty:
                query = query.filter(models.Flashcard.difficulty_level >= preferences.min_difficulty)
            if preferences.max_difficulty:
                query = query.filter(models.Flashcard.difficulty_level <= preferences.max_difficulty)
            
            return query.all()
        
        else:  # view_mode == 'selected'
            # User only wants selected cards
            user_cards = db.query(
                models.Flashcard
            ).join(
                models.UserSelectedCards,
                models.Flashcard.flashcard_id == models.UserSelectedCards.flashcard_id
            ).filter(
                models.UserSelectedCards.user_id == user_id,
                models.Flashcard.language_id == language_id,
                models.UserSelectedCards.is_hidden == False
            ).all()
            
            return user_cards
    
    @staticmethod
    def add_card_to_user_deck(user_id: int, flashcard_id: int, db: Session):
        """Add a card to user's selected cards"""
        
        # Check if already selected
        existing = db.query(models.UserSelectedCards).filter(
            models.UserSelectedCards.user_id == user_id,
            models.UserSelectedCards.flashcard_id == flashcard_id
        ).first()
        
        if existing:
            if existing.is_hidden:
                # Un-hide if previously hidden
                existing.is_hidden = False
                db.commit()
            return existing
        
        # Add new selection
        selection = models.UserSelectedCards(
            user_id=user_id,
            flashcard_id=flashcard_id,
            added_by='manual'
        )
        db.add(selection)
        db.commit()
        
        return selection
    
    @staticmethod
    def remove_card_from_user_deck(user_id: int, flashcard_id: int, db: Session):
        """Hide a card from user's deck (soft delete)"""
        
        selection = db.query(models.UserSelectedCards).filter(
            models.UserSelectedCards.user_id == user_id,
            models.UserSelectedCards.flashcard_id == flashcard_id
        ).first()
        
        if selection:
            selection.is_hidden = True
            db.commit()
    
    @staticmethod
    def search_cards_by_hashtag(hashtag: str, language_id: int, db: Session) -> list:
        """Find cards by hashtag"""
        
        cards = db.query(models.Flashcard).filter(
            models.Flashcard.language_id == language_id,
            models.Flashcard.hashtags.like(f'%{hashtag}%')
        ).all()
        
        return cards
    
    @staticmethod
    def get_available_hashtags(language_id: int, db: Session) -> list:
        """Get all unique hashtags for a language"""
        
        cards = db.query(models.Flashcard).filter(
            models.Flashcard.language_id == language_id
        ).all()
        
        # Extract all unique hashtags
        all_hashtags = set()
        for card in cards:
            try:
                hashtags = json.loads(card.hashtags or '[]')
                all_hashtags.update(hashtags)
            except:
                pass
        
        return sorted(list(all_hashtags))
    
    @staticmethod
    def update_user_preferences(
        user_id: int,
        view_mode: str = None,
        min_difficulty: int = None,
        max_difficulty: int = None,
        selected_hashtags: list = None,
        db: Session = None
    ):
        """Update user's card preferences"""
        
        preferences = db.query(models.UserCardPreferences).filter(
            models.UserCardPreferences.user_id == user_id
        ).first()
        
        if not preferences:
            preferences = models.UserCardPreferences(user_id=user_id)
            db.add(preferences)
        
        if view_mode:
            preferences.view_mode = view_mode
        if min_difficulty is not None:
            preferences.min_difficulty = min_difficulty
        if max_difficulty is not None:
            preferences.max_difficulty = max_difficulty
        if selected_hashtags is not None:
            preferences.selected_hashtags = json.dumps(selected_hashtags)
        
        preferences.updated_at = datetime.utcnow()
        
        db.commit()
````

**Phase 4: API Endpoints (2 hours)**

**File:** `backend/app/routers/card_preferences.py` (NEW)
````python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.services.card_selection_service import CardSelectionService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/card-preferences", tags=["card-preferences"])

class PreferencesUpdate(BaseModel):
    view_mode: str = None  # 'all', 'selected'
    min_difficulty: int = None
    max_difficulty: int = None
    selected_hashtags: list = None

@router.get("/")
def get_user_preferences(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's card preferences"""
    
    preferences = db.query(models.UserCardPreferences).filter(
        models.UserCardPreferences.user_id == current_user.user_id
    ).first()
    
    if not preferences:
        return {
            'view_mode': 'all',  # Default: see all cards
            'min_difficulty': 1,
            'max_difficulty': 5,
            'selected_hashtags': [],
            'has_preferences': False
        }
    
    return {
        'view_mode': preferences.view_mode,
        'min_difficulty': preferences.min_difficulty,
        'max_difficulty': preferences.max_difficulty,
        'selected_hashtags': json.loads(preferences.selected_hashtags or '[]'),
        'has_preferences': True
    }

@router.put("/")
def update_user_preferences(
    data: PreferencesUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's card preferences"""
    
    CardSelectionService.update_user_preferences(
        user_id=current_user.user_id,
        view_mode=data.view_mode,
        min_difficulty=data.min_difficulty,
        max_difficulty=data.max_difficulty,
        selected_hashtags=data.selected_hashtags,
        db=db
    )
    
    return {'success': True, 'message': 'Preferences updated'}

@router.post("/cards/{flashcard_id}/add")
def add_card_to_deck(
    flashcard_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add card to user's study deck"""
    
    CardSelectionService.add_card_to_user_deck(
        user_id=current_user.user_id,
        flashcard_id=flashcard_id,
        db=db
    )
    
    return {'success': True, 'message': 'Card added to your deck'}

@router.post("/cards/{flashcard_id}/remove")
def remove_card_from_deck(
    flashcard_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove card from user's study deck"""
    
    CardSelectionService.remove_card_from_user_deck(
        user_id=current_user.user_id,
        flashcard_id=flashcard_id,
        db=db
    )
    
    return {'success': True, 'message': 'Card removed from your deck'}

@router.get("/selected-count")
def get_selected_card_count(
    language_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of cards in user's deck"""
    
    count = db.query(models.UserSelectedCards).filter(
        models.UserSelectedCards.user_id == current_user.user_id,
        models.UserSelectedCards.is_hidden == False
    ).join(
        models.Flashcard
    ).filter(
        models.Flashcard.language_id == language_id
    ).count()
    
    return {'count': count}

@router.get("/hashtags")
def get_available_hashtags(
    language_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all available hashtags for a language"""
    
    hashtags = CardSelectionService.get_available_hashtags(language_id, db)
    
    return {'hashtags': hashtags}

@router.get("/search/hashtag/{hashtag}")
def search_by_hashtag(
    hashtag: str,
    language_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search cards by hashtag"""
    
    cards = CardSelectionService.search_cards_by_hashtag(hashtag, language_id, db)
    
    return {
        'hashtag': hashtag,
        'count': len(cards),
        'cards': [
            {
                'flashcard_id': c.flashcard_id,
                'word': c.word_or_phrase,
                'definition': c.definition[:100],
                'difficulty': c.difficulty_level,
                'hashtags': json.loads(c.hashtags or '[]')
            }
            for c in cards
        ]
    }
````

**Phase 5: Update Flashcard Endpoints (1 hour)**

**Modify:** `backend/app/routers/flashcards.py`
````python
@router.get("/")
def list_flashcards(
    language_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List flashcards visible to current user
    Respects user's card preferences
    """
    
    # Get cards based on user preferences
    cards = CardSelectionService.get_user_cards(
        user_id=current_user.user_id,
        language_id=language_id,
        db=db
    )
    
    return {
        'flashcards': cards,
        'count': len(cards),
        'filtered': True  # Indicates this is filtered by user preferences
    }
````

**Phase 6: Frontend Card Preferences UI (3 hours)**

**File:** `frontend/app.js`
````javascript
// Card preferences state
window.cardPreferences = {
    viewMode: 'selected',
    minDifficulty: 1,
    maxDifficulty: 3,
    selectedHashtags: []
};

// Show card preferences modal
async function showCardPreferences() {
    // Fetch current preferences
    const response = await fetch('/api/card-preferences/', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const prefs = await response.json();
    
    // Fetch available hashtags
    const hashtagsResponse = await fetch(
        `/api/card-preferences/hashtags?language_id=${getCurrentLanguageId()}`,
        { headers: { 'Authorization': `Bearer ${getToken()}` } }
    );
    const hashtagsData = await hashtagsResponse.json();
    
    const html = `
        <div class="preferences-modal">
            <h2>Card Preferences</h2>
            
            <div class="pref-section">
                <label>View Mode:</label>
                <select id="view-mode">
                    <option value="all" ${prefs.view_mode === 'all' ? 'selected' : ''}>
                        All Cards
                    </option>
                    <option value="selected" ${prefs.view_mode === 'selected' ? 'selected' : ''}>
                        My Selected Cards Only
                    </option>
                </select>
                <p class="help-text">
                    "All Cards" shows every card in the database (800+).
                    "My Selected Cards" shows only cards you've added to your deck.
                </p>
            </div>
            
            <div class="pref-section">
                <label>Difficulty Range:</label>
                <div class="difficulty-slider">
                    <input type="range" id="min-difficulty" min="1" max="5" 
                           value="${prefs.min_difficulty}" />
                    <span id="min-diff-label">${prefs.min_difficulty}</span>
                    <span> to </span>
                    <input type="range" id="max-difficulty" min="1" max="5" 
                           value="${prefs.max_difficulty}" />
                    <span id="max-diff-label">${prefs.max_difficulty}</span>
                </div>
                <p class="help-text">
                    1 = Beginner, 2 = Elementary, 3 = Intermediate, 
                    4 = Advanced, 5 = Expert
                </p>
            </div>
            
            <div class="pref-section">
                <label>Filter by Topics (Hashtags):</label>
                <div class="hashtag-checkboxes">
                    ${hashtagsData.hashtags.map(tag => `
                        <label class="hashtag-option">
                            <input type="checkbox" value="${tag}" 
                                   ${prefs.selected_hashtags.includes(tag) ? 'checked' : ''} />
                            <span>${tag}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="pref-actions">
                <button onclick="saveCardPreferences()">Save Preferences</button>
                <button onclick="resetToDefaults()">Reset to Defaults</button>
                <button onclick="closeModal()">Cancel</button>
            </div>
            
            <div class="pref-stats">
                <p>Cards matching current filters: <span id="card-count">...</span></p>
            </div>
        </div>
    `;
    
    showModal(html);
    
    // Update count as user changes filters
    updateCardCount();
}

async function saveCardPreferences() {
    const viewMode = document.getElementById('view-mode').value;
    const minDifficulty = parseInt(document.getElementById('min-difficulty').value);
    const maxDifficulty = parseInt(document.getElementById('max-difficulty').value);
    
    const selectedHashtags = Array.from(
        document.querySelectorAll('.hashtag-option input:checked')
    ).map(cb => cb.value);
    
    try {
        const response = await fetch('/api/card-preferences/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                view_mode: viewMode,
                min_difficulty: minDifficulty,
                max_difficulty: maxDifficulty,
                selected_hashtags: selectedHashtags
            })
        });
        
        if (response.ok) {
            alert('✅ Preferences saved!');
            closeModal();
            
            // Reload flashcards with new preferences
            loadFlashcards();
        }
    } catch (error) {
        console.error('Failed to save preferences:', error);
        alert('Failed to save preferences. Please try again.');
    }
}

// Show card management in browse mode
function renderCardManagement(card) {
    return `
        <div class="card-management">
            <button class="add-to-deck-btn" onclick="addCardToDeck(${card.flashcard_id})">
                ➕ Add to My Deck
            </button>
            <button class="remove-from-deck-btn" onclick="removeCardFromDeck(${card.flashcard_id})">
                ➖ Remove from My Deck
            </button>
            
            <div class="card-info">
                <span class="difficulty-badge level-${card.difficulty_level}">
                    Level ${card.difficulty_level}
                </span>
                ${card.hashtags.map(tag => `
                    <span class="hashtag">${tag}</span>
                `).join('')}
            </div>
        </div>
    `;
}

async function addCardToDeck(flashcardId) {
    try {
        const response = await fetch(`/api/card-preferences/cards/${flashcardId}/add`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        
        if (response.ok) {
            showToast('✅ Card added to your deck');
        }
    } catch (error) {
        console.error('Failed to add card:', error);
    }
}
````

**Estimated Effort:** 13 hours total

**Success Criteria:**
- ✅ New users get 50 beginner cards by default
- ✅ Users can switch between "All Cards" and "My Cards"
- ✅ Difficulty filter works (1-5 scale)
- ✅ Hashtag system functional
- ✅ Users can add/remove cards from their deck
- ✅ Card count updates when filters change
- ✅ Backward compatible (existing users see all cards)

---

## 🎯 **Why This is Essential for Monetization**

### **Free Tier Users:**
- Start with 50 beginner cards (manageable)
- Can explore and add more cards (up to limit)
- Clear progression path

### **Premium Users:**
- Unlimited card selection
- Can curate large custom decks
- Advanced filtering by difficulty
- Full hashtag system access

### **Business Value:**
- Personalized learning experience
- Reduces overwhelm (800+ cards is too many)
- Encourages upgrades (need more cards? go premium!)
- Enables content recommendations

---

## 📄 **TODO-Sprint7.md** (FINAL UPDATE - v4.0)
````markdown
# Sprint 7 TODO List

**Date Created:** November 5, 2025 (Final Update - v4.0)  
**Sprint Focus:** 💰 Monetization, Premium Quiz, Word Tracking, **Card Preferences**

---

## 🔴 High Priority (Must Complete)

### 1. User Administration & Subscription Management
**Status:** Primary sprint objective  
**Effort:** 12 hours

[Same as before]

---

### 1b. User Card Preferences & Organization (NEW - CRITICAL)
**Status:** Essential for monetization  
**Effort:** 13 hours

**Why Critical:**
- Users need relevant cards, not all 800+
- New users need guided onboarding
- Premium users need advanced filtering
- Enables personalized learning paths

**Tasks:**
- [ ] Add hashtag fields to Flashcard model (1h)
  - hashtags (JSON array)
  - difficulty_level (1-5)
  - category (string)
  - Migration script
  
- [ ] Create UserCardPreferences table (1h)
  - view_mode ('all' or 'selected')
  - difficulty range filters
  - hashtag filters
  - Migration script
  
- [ ] Create UserSelectedCards table (1h)
  - user_id + flashcard_id relationship
  - added_by, personal_notes, is_favorite, is_hidden
  - Migration script
  
- [ ] Build card selection service (3h)
  - initialize_new_user() - give 50 beginner cards
  - get_user_cards() - respect user preferences
  - add/remove cards from deck
  - search by hashtag
  - update preferences
  
- [ ] Create card preferences API endpoints (2h)
  - GET /api/card-preferences/ (get user prefs)
  - PUT /api/card-preferences/ (update prefs)
  - POST /api/card-preferences/cards/{id}/add
  - POST /api/card-preferences/cards/{id}/remove
  - GET /api/card-preferences/selected-count
  - GET /api/card-preferences/hashtags
  - GET /api/card-preferences/search/hashtag/{tag}
  
- [ ] Update flashcard list endpoint (1h)
  - Respect user preferences
  - Filter by difficulty, hashtags
  - Return user's selected cards only (if selected mode)
  
- [ ] Frontend card preferences UI (3h)
  - Preferences modal (view mode, difficulty, hashtags)
  - Add/remove card buttons in browse mode
  - Difficulty badges on cards
  - Hashtag display
  - Card count indicator
  
- [ ] Onboarding for new users (1h)
  - Call initialize_new_user() on first login
  - Show welcome message explaining card selection
  - Quick tutorial on preferences

**Files:**
- `backend/app/models.py` (add hashtags, difficulty, UserCardPreferences, UserSelectedCards)
- `backend/migrations/add_card_preferences.sql` (NEW)
- `backend/app/services/card_selection_service.py` (NEW)
- `backend/app/routers/card_preferences.py` (NEW)
- `backend/app/routers/flashcards.py` (update list endpoint)
- `frontend/app.js` (preferences UI, add/remove buttons)
- `frontend/styles.css` (preferences modal styling)

**Data Migration Tasks:**
- [ ] Tag existing 800+ cards with hashtags
  - Greek alphabet: #beginner, #alphabet
  - Common words: #beginner, #common-words
  - Greek roots: #intermediate, #etymology, #prefix
  - Philosophy terms: #advanced, #philosophy
  - etc.
  
- [ ] Assign difficulty levels to existing cards
  - Alphabet letters: level 1
  - Common nouns: level 1-2
  - Greek roots: level 2-3
  - Complex phrases: level 3-4
  - Academic terms: level 4-5

**Success Criteria:**
- ✅ New users start with 50 beginner cards
- ✅ Users can switch view modes (all vs selected)
- ✅ Difficulty filtering works (1-5)
- ✅ Hashtag system functional
- ✅ Users can add/remove cards
- ✅ Existing users not disrupted (see all cards by default)
- ✅ Card count accurate

---

### 2. Premium Feature: Multiple Choice Quiz (ENHANCED)
**Status:** Premium tier value feature  
**Effort:** 16 hours

[Same as before - with word tracking and pre-generated questions]

---

### 3. URL Sharing Language Disambiguation
**Status:** Fix existing feature  
**Effort:** 2 hours

[Same as before]

---

### 4. Comprehensive Testing
**Status:** CRITICAL - High stakes with monetization  
**Effort:** Ongoing throughout sprint

[Same as before, plus:]

**Additional Tests:**
- [ ] test_card_preferences.py (NEW)
  - New user gets 50 beginner cards
  - View mode switching works
  - Difficulty filtering accurate
  - Hashtag filtering works
  - Add/remove cards from deck

---

## 🟡 Medium Priority (Complete if Time)

[Same as before]

---

## 📊 Sprint 7 Effort Summary (UPDATED)

**Total Estimated Hours:** 51 hours
````
High Priority:
- Subscription management: 12h
- Card preferences system: 13h (NEW - CRITICAL)
- Quiz feature (enhanced): 16h
- URL sharing fix: 2h
- Testing: Ongoing
Total: 43h (84%)

Medium Priority:
- Image generation fix: 2h
- Playwright framework: 3h
Total: 5h (10%)

Buffer: 3h (6%)
````

**Note:** Sprint expanded from 40h to 51h due to critical card preferences feature
**Recommendation:** Prioritize monetization + card preferences, defer image fix if needed

---

## 🎯 Sprint 7 Success Criteria (UPDATED)

**Must Complete (All):**
1. ✅ Freemium limits enforced and accurate
2. ✅ Premium trial system functional
3. ✅ **User card preferences system working (NEW)**
4. ✅ **New users get curated beginner cards (NEW)**
5. ✅ **Hashtag and difficulty filtering functional (NEW)**
6. ✅ Quiz feature complete with word tracking
7. ✅ Word-level mastery calculated
8. ✅ Pre-generated quiz questions working
9. ✅ URL sharing language disambiguation
10. ✅ All critical tests passing

[Rest same as before]

---

**Document Version:** 4.0 (FINAL with Card Preferences)  
**Last Updated:** November 5, 2025  
**Status:** Ready for Sprint 7 execution  
**Next Review:** Sprint 7 completion
````

---

## 📊 **Updated Sprint Capacity Analysis**

### **Original Plan:** 40 hours
### **With Card Preferences:** 51 hours
````
CRITICAL PATH:
1. Subscription infrastructure: 12h ✅ Must have
2. Card preferences system: 13h ✅ Must have (NEW)
3. Quiz with word tracking: 16h ✅ Must have
4. URL sharing fix: 2h ✅ Must have
5. Testing: Ongoing ✅ Must have
Total: 43h (85% of expanded sprint)

NICE TO HAVE:
6. Image generation fix: 2h ⚠️ Defer if needed
7. Playwright tests: 3h ⚠️ Defer if needed
Total: 5h

BUFFER: 3h
````

**Recommendation:**
- **Week 1:** Subscription + Card Preferences (25h)
- **Week 2:** Quiz Feature + URL Fix + Testing (26h)
- **Defer if needed:** Image fix, extensive Playwright suite

---

## 🎯 **Why Card Preferences is Non-Negotiable**

### **Without It:**
- ❌ New users see 800+ cards (overwhelming)
- ❌ No way to filter by skill level
- ❌ Can't organize cards by topic
- ❌ Free users don't know where to start
- ❌ Premium users can't curate their deck
- ❌ No personalization

### **With It:**
- ✅ New users start with 50 manageable cards
- ✅ Clear progression: beginner → advanced
- ✅ Hashtag organization (#greek-alphabet, #philosophy)
- ✅ Difficulty levels (1-5 scale)
- ✅ Users control their learning path
- ✅ Premium users can build large custom decks
- ✅ Freemium model makes sense (50 cards vs unlimited)

---

## 📋 **Sprint 7 Kickoff Brief (FINAL - v4.0)**
````markdown
# Sprint 7 Brief - MONETIZATION & PREMIUM FEATURES

## Context
Sprint 6: Huge success! Real-time progress, coffee breaks, image fallback - all working.
**Current Production:** v2.6.41, revision super-flashcards-00116-kqt

## Sprint 7 Focus: 💰 MONETIZATION (High Stakes!) + 🎯 PERSONALIZATION

**Why This Sprint is Critical:**
- Asking for money = higher expectations
- Users need **relevant** cards, not 800+ random cards
- Must be 100% accurate (usage limits, billing)
- Comprehensive testing required

## Primary Goals (84% of sprint):

### 1. Freemium/Premium Infrastructure (12h)
[Same as before]

### 2. User Card Preferences System (13h - NEW & CRITICAL)
**Problem:** Users currently see ALL 800+ cards - overwhelming!

**Solution:**
- **Hashtag system** - Organize by #beginner, #greek-alphabet, #philosophy, etc.
- **Difficulty levels** - 1 (beginner) to 5 (expert)
- **User preferences** - "Show all" or "My selected cards only"
- **Smart defaults** - New users start with 50 beginner cards
- **Flexible filtering** - Filter by difficulty, hashtags, categories

**Tables:**
```sql
-- Add to Flashcards
ALTER TABLE Flashcards ADD hashtags NVARCHAR(MAX);  -- JSON array
ALTER TABLE Flashcards ADD difficulty_level INT;    -- 1-5
ALTER TABLE Flashcards ADD category NVARCHAR(100);

-- User preferences
CREATE TABLE UserCardPreferences (
    user_id INT,
    view_mode NVARCHAR(20),        -- 'all' or 'selected'
    min_difficulty INT,            -- Show cards >= this
    max_difficulty INT,            -- Show cards <= this
    selected_hashtags NVARCHAR(MAX) -- JSON array
);

-- User's selected cards
CREATE TABLE UserSelectedCards (
    user_id INT,
    flashcard_id INT,
    added_by NVARCHAR(50),         -- 'default', 'manual', 'recommendation'
    personal_notes NVARCHAR(MAX),
    is_favorite BIT,
    is_hidden BIT
);
```

**User Experience:**
- New user logs in → automatically gets 50 beginner cards
- Can browse all 800+ cards, add interesting ones to deck
- Can filter: "Show me intermediate Greek roots only"
- Can search by hashtag: "#philosophy" or "#common-words"
- Free tier: Limited to 50 selected cards
- Premium: Unlimited card selection

**Why Essential:**
- Makes free tier valuable (curated 50 cards)
- Makes premium tier compelling (unlimited curation)
- Enables personalized learning paths
- Reduces overwhelm for new users

### 3. Premium Quiz with Word Tracking (16h)
[Same as before - quiz + word-level performance]

### 4. URL Sharing Fix (2h)
[Same as before - language disambiguation]

### 5. Comprehensive Testing (Ongoing)
[Same as before + card preferences tests]

## Sprint Capacity: 51 hours (expanded from 40)

**Week 1 Focus:**
- Subscription infrastructure (12h)
- Card preferences system (13h)
Total: 25h

**Week 2 Focus:**
- Quiz feature with word tracking (16h)
- URL sharing fix (2h)
- Testing & polish (8h)
Total: 26h

## Documents Attached:
1. SPRINT7_HANDOFF.md
2. SPRINT7_ROADMAP.md (v4.0 - includes card preferences)
3. SPRINT7_TEST_PLAN.md (includes card preference tests)
4. TODO-Sprint7.md (v4.0 - detailed breakdown)
5. ROADMAP.md
6. ai_collaboration_protocol.md
7. backend/create_missing_tables.sql

## Success Criteria:
✅ Freemium limits enforced
✅ Premium trial functional
✅ **Card preferences system working**
✅ **New users get 50 beginner cards automatically**
✅ **Hashtag and difficulty filtering works**
✅ Quiz with word-level performance tracking
✅ Pre-generated quiz questions
✅ URL sharing language disambiguation
✅ All critical tests passing

## Production URL:
https://super-flashcards-57478301787.us-central1.run.app

Ready to build a personalized, revenue-generating language learning platform! 💰🎯🚀
````

---

## ✅ **Final Checklist (v4.0)**

**Documents Updated:**
- ✅ SPRINT7_ROADMAP.md (v4.0 - added card preferences as Priority 1b)
- ✅ TODO-Sprint7.md (v4.0 - added detailed card preference tasks)
- ✅ Sprint 7 Kickoff Brief (v4.0 - includes card preferences)

**New Critical Feature:**
- ✅ User card preferences system (13 hours)
- ✅ Hashtag organization
- ✅ Difficulty levels (1-5)
- ✅ Smart defaults for new users
- ✅ Add/remove cards from deck

**Sprint Expanded:**
- Was: 40 hours
- Now: 51 hours
- Reason: Card preferences is essential for monetization

**Priority if Time Tight:**
1. Subscription infrastructure ✅ Must have
2. Card preferences system ✅ Must have  
3. Basic quiz (without all word tracking) ✅ Must have
4. URL fix ✅ Quick win
5. Full quiz + word tracking ⚠️ If time
6. Image fix ⚠️ Defer to Sprint 8
7. Extensive Playwright ⚠️ Defer to Sprint 8

---

**This is now a complete, production-ready Sprint 7 plan with essential personalization features!** 🎉