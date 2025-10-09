# AI Collaboration Protocol - Claude & VS Code AI

**Purpose**: Define clear roles and handoff process between Claude (architecture/design) and VS Code AI Copilot (implementation/debugging).

---

## Role Definition

### Claude's Responsibilities

**Architecture & Design**
- High-level system architecture
- Database schema design
- API endpoint structure
- Technology stack decisions
- Security architecture
- Scaling strategy

**Complete File Generation**
- Always deliver complete files, never diffs
- Full backend modules (main.py, models.py, etc.)
- Full frontend components
- Configuration files
- Scripts and utilities

**Documentation**
- Technical specifications
- Setup guides
- API documentation
- Architecture diagrams
- Sprint handoffs
- Roadmap updates

**Problem Diagnosis**
- Root cause analysis
- Design-level solutions
- Alternative approaches
- Trade-off analysis

**Sprint Planning**
- Feature prioritization
- Effort estimation
- Risk assessment
- Success criteria

### VS Code AI's Responsibilities

**Implementation Details**
- Code completion and suggestions
- Refactoring existing code
- Adding logging and error handling
- Variable naming and code style
- Import statement management

**Bug Fixes**
- Debug runtime errors
- Fix file path issues
- Resolve dependency conflicts
- Handle edge cases
- Add defensive programming

**Testing & Validation**
- Run code and report errors
- Test API endpoints
- Verify database queries
- Check file operations
- Validate user flows

**Incremental Improvements**
- Add comments
- Improve error messages
- Optimize existing algorithms
- Clean up code structure
- Remove dead code

---

## Collaboration Workflow

### Standard Flow

```
User Request
    ↓
Claude: Design Solution
    ↓
Claude: Deliver Complete Files
    ↓
User: Implement in Project
    ↓
VS Code AI: Real-time Assistance
    ↓
VS Code AI: Fix Issues Found
    ↓
User: Test & Validate
    ↓
[Success] → Sprint Handoff
[Issues] → Bug Report to Claude
```

### Bug Handling Flow

```
User Discovers Bug
    ↓
User Analysis (spot symptoms)
    ↓
Claude: Root Cause Analysis
    ↓
Claude: Design Fix
    ↓
Claude: Deliver Updated File(s)
    ↓
User: Implement
    ↓
VS Code AI: Refine & Debug
    ↓
VS Code AI: Add Logging/Validation
    ↓
User: Verify Fix
    ↓
Document in Handoff
```

---

## Communication Patterns

### User → Claude

**Architecture Questions**
```
User: "Should we use Cloudinary or local storage for images?"
Claude: [Analyzes trade-offs, recommends solution, explains rationale]
```

**New Feature Requests**
```
User: "Add spaced repetition algorithm"
Claude: [Designs algorithm, updates models, delivers complete files]
```

**Bug Reports**
```
User: "Images disappearing after 2 hours"
Claude: [Diagnoses (temporary URLs), designs fix (download images)]
```

### User → VS Code AI

**Syntax Issues**
```
User: "Fix this import error"
VS Code AI: [Corrects import statement, suggests right path]
```

**Quick Fixes**
```
User: "Add logging here"
VS Code AI: [Adds logger.info() with context]
```

**Runtime Errors**
```
User: "Getting FileNotFoundError"
VS Code AI: [Fixes file path, adds existence check]
```

### VS Code AI → Claude (via User)

**Architecture-Level Issues**
```
VS Code AI finds: "Design flaw - temporary URLs expire"
User reports to Claude
Claude: [Redesigns to download images]
```

**Missing Features**
```
VS Code AI: "Need sync endpoint for offline mode"
User requests from Claude
Claude: [Designs sync API, delivers router file]
```

---

## File Delivery Standards

### Claude's Deliverables

**Always Complete Files**
```python
# ✅ CORRECT: Full file
# backend/app/routers/flashcards.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
# ... imports ...

router = APIRouter()

@router.post("/")
def create_flashcard(data: FlashcardCreate, db: Session = Depends(get_db)):
    # ... complete implementation ...
    
@router.get("/")
def list_flashcards(db: Session = Depends(get_db)):
    # ... complete implementation ...

# ... all endpoints ...
```

**Never Diffs**
```python
# ❌ WRONG: Don't do this
# Add this function:
@router.post("/sync")
def sync_flashcards():
    ...
```

### VS Code AI's Edits

**Targeted Changes**
```python
# Add logging to existing function
logger.info(f"Creating flashcard: {word_or_phrase}")

# Fix file path
images_dir = Path(__file__).parent.parent.parent / "images"  # Fixed

# Add error handling
try:
    result = download_image(url)
except RequestException as e:
    logger.error(f"Download failed: {e}")
    return None
```

---

## Decision Authority

### Claude Decides

- Technology stack choices
- Database schema changes
- API design patterns
- Security approaches
- Deployment strategies
- Sprint priorities
- Architecture refactors

**User can override**, but Claude advocates for best technical approach.

### VS Code AI Decides

- Variable names
- Comment style
- Log message format
- Error message wording
- Code organization within functions
- Import order

**Low-stakes decisions**, follows best practices.

### User Decides

- Feature priorities
- Cost/time trade-offs
- Deployment timing
- Which AI to engage
- When solution is "good enough"

**Final authority** on all decisions.

---

## Handoff Triggers

### Claude → VS Code AI

**When Claude delivers complete files:**
1. User copies to project
2. VS Code AI provides real-time suggestions
3. VS Code AI fixes import errors, paths
4. VS Code AI adds missing error handling
5. User runs and tests

**Clear handoff point**: File delivery complete

### VS Code AI → Claude

**When issues are architecture-level:**
1. VS Code AI identifies design problem
2. User reports to Claude with context
3. Claude analyzes and redesigns
4. Claude delivers updated files
5. Back to VS Code AI for implementation

**Escalation criteria**:
- Design flaw found
- Missing major component
- Performance issue
- Security concern
- Architecture question

---

## Example Collaboration: Image Persistence Bug

### Sprint 1 - Discovery

**User**: "Images disappearing after review"

**User Analysis**: 
```
src="https://oaidalleapi...?se=2025-10-04T05:18:22Z"
                              ↑ Expiration timestamp
```

**User → Claude**: "Image URLs expire. Need to store locally."

### Claude's Response

**Analysis**:
- DALL-E returns temporary Azure blob URLs
- 2-hour expiration window
- Need to download and store

**Design**:
```python
def generate_image(description: str, word: str) -> str:
    """Generate image, download, save locally"""
    # Get temporary URL from DALL-E
    dalle_url = client.images.generate(...)
    
    # Download image
    response = requests.get(dalle_url)
    
    # Save to filesystem
    path = images_dir / f"{word}_{uuid}.png"
    path.write_bytes(response.content)
    
    # Return local path
    return f"/images/{filename}"
```

**Deliverable**: Complete updated `ai_generate.py`

### User Implementation

**User**: Copies Claude's file to project, restarts server

### VS Code AI's Contribution

**Found**: Directory path incorrect (`images` vs `images`)
**Fixed**: `images_dir = Path(__file__).parent.parent.parent / "images"`

**Added**: Comprehensive logging
```python
logger.info(f"Generating image for: {word}")
logger.info(f"Downloaded {len(response.content)} bytes")
logger.info(f"Saved to: {image_path}")
```

**Added**: Error handling improvements
```python
try:
    response.raise_for_status()
except requests.RequestException as e:
    logger.error(f"Download failed: {e}")
    return None
```

**Created**: `fix_images.py` script for maintenance

### Result

✅ Complete solution through collaboration:
- Claude: Architecture and design
- VS Code AI: Implementation details and debugging
- User: Testing and validation

---

## Anti-Patterns

### Bad: Claude Acting as VS Code AI

```
❌ User: "Fix this import error"
❌ Claude: [Makes tiny edit to one line]
```

**Correct**: User should ask VS Code AI for syntax fixes.

### Bad: VS Code AI Making Architecture Decisions

```
❌ VS Code AI: "Let's switch from MS SQL to MongoDB"
❌ VS Code AI: "Redesigning the sync algorithm"
```

**Correct**: Flag for Claude, get architectural guidance.

### Bad: User Asking Wrong AI

```
❌ User asks Claude: "What should this variable be named?"
❌ User asks VS Code AI: "Should we add authentication?"
```

**Correct**: 
- Variable names → VS Code AI
- Authentication strategy → Claude

---

## Sprint Handoff Integration

### End of Sprint

**Claude's Responsibilities**:
1. Sprint handoff document
2. Updated roadmap
3. Lessons learned
4. Architecture decisions documented
5. Next sprint file inventory

**VS Code AI's Contributions** (via user):
1. Bug fixes applied
2. Code improvements made
3. Issues discovered
4. Testing results

**Combined Output**: Complete sprint retrospective

---

## Quality Standards

### Claude's Code Quality

- Architecturally sound
- Complete implementations
- Well-structured
- Documented
- May need refinement

### VS Code AI's Code Quality

- Syntactically correct
- Well-commented
- Error-handled
- Logging added
- Production-ready

### Together

- Architecturally sound ✅
- Implementation solid ✅
- Error handling comprehensive ✅
- Documented and logged ✅
- Production-ready ✅

---

## Conflict Resolution

### When AIs Disagree (via User)

**Example**: Image storage approach

**Claude's Design**: Download images locally
**VS Code AI Suggests**: Use external CDN directly

**Resolution**:
1. User presents both options to Claude
2. Claude re-evaluates with new information
3. Claude makes final architecture decision
4. VS Code AI implements chosen approach
5. Document decision in handoff

**Authority**: Claude for architecture, user overrides if needed.

---

## Communication Guidelines

### Claude's Style
- Direct and technical
- No flattery
- Critical evaluation
- Complete context
- Anticipate questions

### VS Code AI's Style
- Helpful suggestions
- Quick fixes
- Code-level focus
- Context-aware
- Immediate assistance

### User's Role
- Route questions appropriately
- Provide context to both
- Make final decisions
- Document outcomes
- Test thoroughly

---

## Success Metrics

### Collaboration is Working When:
- ✅ Minimal back-and-forth needed
- ✅ Clear role boundaries
- ✅ Fast issue resolution
- ✅ High code quality
- ✅ User productive

### Collaboration Needs Improvement When:
- ❌ Repeated escalations
- ❌ Unclear who does what
- ❌ Architecture changes after implementation
- ❌ Quality issues
- ❌ User confused

---

## Future Enhancements

### Sprint 2+

**Claude May Add**:
- Offline sync architecture
- PWA service worker design
- Spaced repetition algorithm
- Authentication system

**VS Code AI Will Handle**:
- IndexedDB implementation details
- Cache strategy tweaks
- Algorithm edge cases
- JWT token formatting

**Clear Division**: Claude designs, VS Code AI implements.

---

## Version History

**v1.0**: Initial protocol based on Sprint 1 collaboration  
**Status**: Active and working well

---

## Quick Reference

| Task | Ask Claude | Ask VS Code AI |
|------|------------|----------------|
| Design new feature | ✅ Yes | ❌ No |
| Fix syntax error | ❌ No | ✅ Yes |
| Choose technology | ✅ Yes | ❌ No |
| Add logging | ❌ No | ✅ Yes |
| Database schema | ✅ Yes | ❌ No |
| File path fix | ❌ No | ✅ Yes |
| API design | ✅ Yes | ❌ No |
| Error handling | ❌ No | ✅ Yes |
| Architecture review | ✅ Yes | ❌ No |
| Code completion | ❌ No | ✅ Yes |

---

**This protocol is working. Continue following it.**