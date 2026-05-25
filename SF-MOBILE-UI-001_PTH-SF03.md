# ┌─────────────────────────────────────────────────────────────────────┐
# │ PTH: SF03  │ Sprint: SF-MOBILE-UI-001  │ Super Flashcards 🟡        │
# └─────────────────────────────────────────────────────────────────────┘

## PHASE 0 — SESSION GATES

**Gate 1 — Model identity**
Confirm Claude Sonnet 4.5 or higher.

**Gate 2 — Bootstrap**
Read: `G:\My Drive\Code\Python\project-methodology\CC_Bootstrap_v1.md`
Confirm BOOT-1.5.11-R3B8 loaded.

**Gate 3 — Auth**
```powershell
$env:CLOUDSDK_PYTHON = (Get-Command py -ErrorAction SilentlyContinue)?.Source
gcloud config set account cc-deploy@super-flashcards-475210.iam.gserviceaccount.com
gcloud auth activate-service-account --key-file=C:\venvs\cc-deploy-key.json
gcloud config set project super-flashcards-475210
gcloud auth print-access-token
```

**Gate 4 — Read PROJECT_KNOWLEDGE.md**
Read: `G:\My Drive\Code\Python\super-flashcards\PROJECT_KNOWLEDGE.md`
Confirm current version. Record it.

**Gate 5 — Read frontend source before touching anything**
Find and read the current mobile UI template. It will be one of:
- `G:\My Drive\Code\Python\super-flashcards\frontend\index.html`
- `G:\My Drive\Code\Python\super-flashcards\backend\app\templates\index.html`
- Search: `grep -r "Study\|Browse\|Import\|Progress" G:\My Drive\Code\Python\super-flashcards\frontend\`

Identify:
1. The current tab structure (how many tabs, what are they called)
2. Where the card layout HTML lives
3. Where the mobile CSS/styles live
4. The JS that handles tab switching and card navigation

Do NOT write any code until you have read these files.

**Gate 6 — RAG query**
```
rag_query("Super Flashcards mobile card UI frontend tabs current", collection="portfolio")
rag_query("Super Flashcards REQ-002 mobile clipping", collection="metapm")
```

---

## BACKGROUND

REQ-002: Mobile UI clipping on iPhone — right side content gets cut off.
PL has designed a complete mobile UI redesign. The reference implementation
is committed at:
`G:\My Drive\Code\Python\super-flashcards\sf_mobile_redesign_v1.html`

Read this file before writing any code. It is the authoritative spec.
The redesign is a standalone HTML prototype — extract the patterns from it
and apply them to the real app's template/frontend structure.

---

## WHAT CHANGED (from redesign spec)

**1. Overflow fix (P1 — the original bug)**
Everything fits within 375px. No right-side clipping.
Use `min-width: 0` and `box-sizing: border-box` throughout card layout.
The flex container issue: image + text side by side was overflowing.
Fix: constrain both columns with `min-width: 0` on the text div.

**2. 6 modes → 4 tabs**
Current tabs (Study, Read, Practice, Browse, Import, Progress) collapse to:
- Card (merges Study + Read + Practice)
- Browse
- Import
- Progress

**3. Card tab: expand/collapse sections**
Inside the Card tab, two collapsible sections:
- Details (expanded by default): definition, etymology, cognates
- Practice (collapsed by default): spaced repetition buttons (Again/Hard/Good/Easy),
  mic button, next review date, interval

Toggle: click section header to expand/collapse. Chevron rotates.
State: persists visually as PL navigates between cards.

**4. Browse tab: language badges**
Each word row shows a language badge (FR, GR, EN) so PL can see
language at a glance when browsing across languages.

**5. Image fullscreen on tap**
Current image thumbnail: static.
New: tap thumbnail → fullscreen modal overlay → tap again to dismiss.
Modal uses position:absolute inside the phone container (see redesign HTML).
Do NOT use position:fixed — see Bootstrap UI rules.

---

## KNOWN TEST VALUES

CC must verify these against production before handoff:

| Test | Entity | Expected |
|---|---|---|
| Layout | Any card on iPhone viewport (375px) | No horizontal scroll, nothing clipped right |
| Tab count | Card/Browse/Import/Progress | 4 tabs visible, not 6 |
| Details section | Any card | Expanded by default, definition visible |
| Practice section | Any card | Collapsed by default, buttons hidden |
| Details toggle | Click Details header | Collapses, chevron rotates |
| Practice toggle | Click Practice header | Expands, Again/Hard/Good/Easy visible |
| Browse badges | Browse tab | FR/GR/EN badge on each row |
| Image tap | Card with image | Fullscreen modal opens, tap dismisses |
| Prev/Next nav | Card tab | Navigates cards without layout reflow |

CC must test against live production URL:
`https://learn.rentyourcio.com`

Report PASS/FAIL per row. If a row fails — fix before handoff.

---

## SPRINT SCOPE

### Item 1 — Update REQ-002 description in MetaPM

Before any code work, update REQ-002 with the full spec:
```
PATCH https://metapm.rentyourcio.com/api/roadmap/requirements/REQ-002
{
  "description": "Mobile UI redesign for iPhone (375px viewport). Five changes: (1) Overflow fix: min-width:0 + box-sizing:border-box on card layout — eliminates right-side clipping. (2) Tab consolidation: Study+Read+Practice merged into Card tab; Browse, Import, Progress remain. Total: 4 tabs not 6. (3) Card tab sections: Details (definition, etymology, cognates) expanded by default. Practice (Again/Hard/Good/Easy, mic, schedule) collapsed by default. Toggle with chevron. (4) Browse tab language badges: FR/GR/EN badge per row. (5) Image fullscreen: tap thumbnail to open modal overlay, tap to dismiss. Reference implementation: sf_mobile_redesign_v1.html committed to repo."
}
```

**Note:** Use the correct endpoint for description update. Check if it's
PATCH /api/roadmap/requirements/{id} or PUT — verify from PK.md schema.

### Item 2 — Apply redesign to production frontend

Read the redesign file (Gate 5 + `sf_mobile_redesign_v1.html`) and apply
each change to the real app template. The redesign is HTML/CSS/JS —
extract the patterns and wire them to the real data layer.

**Critical constraint:** The redesign uses static mock data. The real app
fetches cards from `/api/flashcards/{id}` and language from the API.
Preserve all existing API calls, data bindings, and JS logic.
Only change: layout structure, tab names, CSS, and interaction patterns.

Do not break:
- Spaced repetition review recording (`POST /api/flashcards/{id}/review`)
- Audio playback (Play button)
- Card navigation (Prev/Next)
- Edit card functionality
- Import flow
- Progress view

**Canary 1:**
```
curl https://learn.rentyourcio.com
```
Returns 200. Page loads without JS errors.
```
curl https://learn.rentyourcio.com/api/flashcards/?language_id=1&limit=5
```
Returns card data (confirms API not broken).
Include both responses in handoff.

### Item 3 — Mobile viewport meta tag

Confirm `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
is present in the HTML head. If missing — add it.
This is the foundational fix for mobile clipping.

**Canary 2:** grep the template for viewport meta tag. Include output.

---

## DELIVERABLE CANARY GATE

| # | Check | Expected |
|---|---|---|
| 1 | REQ-002 description updated | PATCH returns success, description populated |
| 2 | Homepage loads | 200, no JS errors |
| 3 | API not broken | /api/flashcards returns card data |
| 4 | Viewport meta present | grep confirms meta tag in template |
| 5 | Known test values | All 9 rows PASS against production |
| 6 | Health | version bumped |

---

## VERSION

Bump: current → next patch (e.g. 3.3.7 → 3.3.8)
This is a UI-only patch. No schema changes. No new API endpoints.

---

## MetaPM transitions

- REQ-002: PATCH to uat_ready after canaries pass
Use PATCH /api/roadmap/requirements/{id}/state (NOT POST)

---

## UAT SPEC (CC posts to /api/uat/spec before handoff)

```json
{
  "project": "Super Flashcards",
  "version": "next",
  "sprint": "SF-MOBILE-UI-001",
  "pth": "SF03",
  "linked_requirements": ["REQ-002"],
  "test_cases": [
    {
      "id": "BV-01",
      "title": "No horizontal scroll on iPhone viewport",
      "url": "https://learn.rentyourcio.com",
      "steps": [
        "Open URL on iPhone or use Chrome DevTools → iPhone SE (375px width)",
        "Load any flashcard",
        "Try to scroll horizontally"
      ],
      "expected": "No horizontal scroll. All content fits within 375px. Nothing clipped on right side."
    },
    {
      "id": "BV-02",
      "title": "4 tabs visible: Card, Browse, Import, Progress",
      "url": "https://learn.rentyourcio.com",
      "steps": ["Open URL", "Count tabs in the tab bar"],
      "expected": "Exactly 4 tabs: Card, Browse, Import, Progress. No Study/Read/Practice as separate tabs."
    },
    {
      "id": "BV-03",
      "title": "Details section expanded by default",
      "url": "https://learn.rentyourcio.com",
      "steps": ["Open Card tab", "Look at Details section"],
      "expected": "Definition, etymology, and cognates visible without clicking anything"
    },
    {
      "id": "BV-04",
      "title": "Practice section collapsed by default",
      "url": "https://learn.rentyourcio.com",
      "steps": ["Open Card tab", "Look at Practice section"],
      "expected": "Again/Hard/Good/Easy buttons NOT visible. Section shows toggle header only."
    },
    {
      "id": "BV-05",
      "title": "Toggle sections open and close",
      "url": "https://learn.rentyourcio.com",
      "steps": [
        "Click Details header",
        "Confirm it collapses",
        "Click Practice header",
        "Confirm Again/Hard/Good/Easy appear"
      ],
      "expected": "Both sections toggle correctly. Chevron rotates on toggle."
    },
    {
      "id": "BV-06",
      "title": "Browse tab shows language badges",
      "url": "https://learn.rentyourcio.com",
      "steps": ["Click Browse tab", "Look at word list"],
      "expected": "Each word has a language badge (FR, GR, or EN) visible next to the word"
    },
    {
      "id": "BV-07",
      "title": "Image tap opens fullscreen modal",
      "url": "https://learn.rentyourcio.com",
      "steps": [
        "Find a card with an image",
        "Tap the image thumbnail",
        "Confirm fullscreen view opens",
        "Tap again to dismiss"
      ],
      "expected": "Fullscreen modal appears. Tap dismisses it. No broken layout after dismiss."
    },
    {
      "id": "BV-08",
      "title": "Card navigation works without layout reflow",
      "url": "https://learn.rentyourcio.com",
      "steps": ["Click Prev or Next button 3 times", "Observe layout stability"],
      "expected": "Card content updates. No layout jump, no horizontal overflow introduced."
    }
  ]
}
```

---

## SESSION_CLOSEOUT.md

Write to: `G:\My Drive\Code\Python\super-flashcards\SESSION_CLOSEOUT_SF03.md`

Include:
- Known test values table with PASS/FAIL
- Viewport meta tag grep output
- Canary API responses
- REQ-002 PATCH confirmation

---

## PK.md UPDATE

Append:
- New version
- Mobile UI: 4-tab layout (Card/Browse/Import/Progress)
- Card tab: Details expanded default, Practice collapsed default
- Browse: language badges per row
- Image: fullscreen modal on tap
- Overflow fix: min-width:0 + box-sizing:border-box on card layout

---

## HANDOFF FORMAT (Bootstrap BA02 + two-call closeout)

PTH banner as plain chat text immediately before file link.

```
PTH: SF03 | Sprint: SF-MOBILE-UI-001 | Project: Super Flashcards
Version: {current} → {new}
Handoff ID: [from POST /mcp/handoffs]
Handoff URL: https://metapm.rentyourcio.com/mcp/handoffs/[ID]/content
UAT spec_id: [from POST /api/uat/spec]
UAT URL: https://metapm.rentyourcio.com/uat/[spec_id]
```
