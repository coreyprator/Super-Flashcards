# ┌─────────────────────────────────────────────────────────────────────┐
# │ PTH: SF03-FIX  │ Sprint: SF-MOBILE-FIX-001  │ Super Flashcards 🟡  │
# └─────────────────────────────────────────────────────────────────────┘

## PHASE 0 — SESSION GATES

**Gate 1 — Model identity** Confirm Claude Sonnet 4.5 or higher.
**Gate 2 — Bootstrap**
`G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md`
Confirm BOOT-1.5.11-R3B8. File is in templates\ subdirectory.
**Gate 3 — Auth** SA login as standard.
**Gate 4 — Read PROJECT_KNOWLEDGE.md**
Read: `G:\My Drive\Code\Python\super-flashcards\PROJECT_KNOWLEDGE.md`
Confirm version 3.3.8.

**Gate 5 — Read frontend source before touching anything**
Find and read the frontend HTML/JS file that contains:
1. The image thumbnail click/tap handler
2. The card navigation buttons (Prev/Next)
3. The Browse tab language filter dropdown

Search for: `onclick`, `addEventListener`, `modal`, `Previous`, `Prev`, `lang-select`, `language`
Report: the old nav HTML, the new nav HTML, and the current language dropdown HTML.
Do NOT write code until you confirm you've found all three.

---

## BACKGROUND — 3 BUGS FROM SF03 UAT (2026-03-16)

**Bug 1 — BV-07: Image tap broken on iPhone**
Image fullscreen modal works on desktop (click event fires) but not on iPhone
(touch events don't reliably fire click on tap without proper handling).
Root cause: `onclick` or `addEventListener('click')` — not touch-aware.

**Bug 2 — BV-08: Duplicate Prev/Next navigation**
Screenshot shows two nav rows:
- New: `← Prev | 1364/1439 | ✏ Edit | Next →`
- Old: `← Previous | 1364/1439 | Next →`
CC added new nav without removing old nav. Old nav still in DOM.

**Bug 3 — BV-06: Language dropdown hardcoded, missing languages**
The Browse tab language dropdown shows only EN/FR/GR hardcoded in HTML.
Database has additional languages including Portuguese (49 words) and Spanish.
Fix: populate dropdown dynamically from the languages API.
If a language has 0 cards, show it with a count of (0) — do not hide it.

---

## SPRINT SCOPE — 3 FIXES, FRONTEND ONLY

### Fix 1 — Image tap on iPhone (BV-07)

Find the image thumbnail tap handler. It currently uses `click` only.

Replace with a handler that works on both desktop and mobile:
```javascript
const imgThumb = document.getElementById('img-thumb'); // or whatever the selector is
['click', 'touchend'].forEach(function(eventType) {
    imgThumb.addEventListener(eventType, function(e) {
        e.preventDefault();
        e.stopPropagation();
        const modal = document.getElementById('modal-overlay');
        if (modal) modal.style.display = 'flex';
    });
});
```

Also update the modal dismiss handler:
```javascript
const modal = document.getElementById('modal-overlay');
['click', 'touchend'].forEach(function(eventType) {
    modal.addEventListener(eventType, function(e) {
        e.preventDefault();
        this.style.display = 'none';
    });
});
```

**Key:** `e.preventDefault()` stops the browser from firing a synthetic
click after touchend, which would cause double-firing on desktop.
`touchend` fires immediately on finger lift — no 300ms delay like click.

### Fix 2 — Remove duplicate nav buttons (BV-08)

Read the frontend source (Gate 5). Find the OLD nav HTML — the one with
`← Previous` and `Next →` labels (without the Edit button and card counter).

Delete the old nav HTML block entirely. Keep ONLY the new nav row:
`← Prev | {counter} | ✏ Edit | Next →`

**Fabrication-proof canary:** Count nav button occurrences after fix:
```bash
curl -s https://learn.rentyourcio.com | \
  python3 -c "
import sys
html = sys.stdin.read()
prev_count = html.lower().count('← prev') + html.lower().count('← previous')
next_count = html.lower().count('next →')
print(f'Prev variants: {prev_count}')
print(f'Next variants: {next_count}')
assert prev_count == 1, f'FAIL: {prev_count} prev buttons found, expected 1'
assert next_count == 1, f'FAIL: {next_count} next buttons found, expected 1'
print('PASS: exactly 1 of each nav button')
"
```
Must print PASS. Include full output in handoff.

### Fix 3 — Dynamic language dropdown in Browse tab (BV-06)

The current dropdown is hardcoded HTML options: EN, FR, GR.
Fix: populate from the languages API on page load.

**Step 1 — Find the languages API endpoint.**
Read the frontend source. Search for `language_id`, `/api/languages`, `/api/language`.
The endpoint likely returns something like:
```json
[{"id": 1, "name": "French", "code": "fr"},
 {"id": 2, "name": "Greek", "code": "el"},
 {"id": 9, "name": "English", "code": "en"},
 {"id": 10, "name": "Portuguese", "code": "pt"},
 {"id": 11, "name": "Spanish", "code": "es"}]
```
Confirm the correct endpoint before writing code.

**Step 2 — Replace hardcoded options with dynamic population:**
```javascript
async function populateLanguageDropdown() {
    const select = document.getElementById('lang-select');
    if (!select) return;

    try {
        const res = await fetch('/api/languages/');
        const languages = await res.json();

        // Clear existing hardcoded options (keep "All" if present)
        select.innerHTML = '<option value="">All Languages</option>';

        languages.forEach(lang => {
            const opt = document.createElement('option');
            opt.value = lang.id || lang.code;
            opt.textContent = lang.name;
            select.appendChild(opt);
        });
    } catch(e) {
        console.error('Language dropdown failed:', e);
        // Leave existing options as fallback
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', populateLanguageDropdown);
```

**Step 3 — Confirm card count per language (optional enhancement):**
If the API supports a count param (e.g. `/api/languages/?include_count=true`),
show the count in the option label: `French (342)`, `Portuguese (49)`.
If count not available from the API — skip this, plain names are fine.
Do NOT make additional API calls per language just to get counts.

**Fabrication-proof canary 3:**
```bash
# Confirm hardcoded options are gone
curl -s https://learn.rentyourcio.com | \
  python3 -c "
import sys
html = sys.stdin.read()
# Should NOT have hardcoded language options
hardcoded = '<option>French</option>' in html or '<option>Greek</option>' in html
dynamic = 'populateLanguageDropdown' in html or 'api/languages' in html
print(f'Hardcoded options: {hardcoded}')
print(f'Dynamic population: {dynamic}')
assert not hardcoded, 'FAIL: hardcoded options still present'
assert dynamic, 'FAIL: dynamic population not found'
print('PASS')
"
```
Must print PASS. Include full output.

---

## DELIVERABLE CANARY GATE

| # | Check | Expected |
|---|---|---|
| 1 | touchend on image | touchend in HTML — assert PASS |
| 2 | Duplicate nav removed | exactly 1 prev, 1 next — assert PASS |
| 3 | Language dropdown dynamic | no hardcoded, API call present — assert PASS |
| 4 | Languages API returns Portuguese | curl /api/languages includes Portuguese |
| 5 | Health | version 3.3.9 |

**Canary 1 — fabrication-proof:**
```bash
curl -s https://learn.rentyourcio.com | \
  python3 -c "
import sys
html = sys.stdin.read()
print('touchend in html:', 'touchend' in html)
assert 'touchend' in html, 'FAIL: touchend not found'
print('PASS')
"
```
Must print PASS. Include output.

**Canary 4 — languages API verification:**
```bash
curl -s https://learn.rentyourcio.com/api/languages/ | \
  python3 -c "
import sys, json
langs = json.load(sys.stdin)
names = [l.get('name','') for l in langs]
print(f'Languages: {names}')
assert any('ortugues' in n or 'PT' in n.upper() for n in names), \
    'FAIL: Portuguese not in languages list'
print('PASS: Portuguese found')
"
```
Must print PASS. Include full output.

**Canary 5 — PL browser test (PENDING PL):**
Open [https://learn.rentyourcio.com](https://learn.rentyourcio.com) on iPhone.
- Tap image thumbnail → fullscreen opens
- One set of Prev/Next buttons only
- Browse tab language dropdown shows Portuguese and Spanish

---

## VERSION

Bump: 3.3.8 → 3.3.9 (patch — touch fix + duplicate nav + dynamic language dropdown)

---

## MetaPM transitions

REQ-002 is already `done` — no transition needed.
Seed a new requirement for the language dropdown fix:
```
POST /api/roadmap/requirements
{
  "project_code": "SF",
  "title": "Browse tab language dropdown populated dynamically from API",
  "priority": "P2",
  "type": "bug",
  "status": "cc_executing",
  "description": "Language dropdown in Browse tab was hardcoded to EN/FR/GR. Database contains additional languages including Portuguese (49 words) and Spanish. Fix: populate dropdown from /api/languages/ on page load. If language has 0 cards show it with count 0."
}
```
PATCH to uat_ready after canaries pass.

---

## UAT SPEC (POST to /api/uat/spec)

```json
{
  "project": "Super Flashcards",
  "version": "3.3.9",
  "sprint": "SF-MOBILE-FIX-001",
  "pth": "SF03-FIX",
  "linked_requirements": ["REQ-002"],
  "test_cases": [
    {
      "id": "BV-01",
      "title": "Image tap opens fullscreen modal on iPhone",
      "url": "https://learn.rentyourcio.com",
      "steps": [
        "Open on iPhone (or Chrome DevTools iPhone SE)",
        "Find a card with an image",
        "TAP the image thumbnail (not click)",
        "Confirm fullscreen opens",
        "Tap anywhere to dismiss"
      ],
      "expected": "Fullscreen modal opens immediately on tap. Tap dismisses. Works on iPhone, not just desktop."
    },
    {
      "id": "BV-02",
      "title": "Only one set of Prev/Next buttons visible",
      "url": "https://learn.rentyourcio.com",
      "steps": [
        "Open Card tab",
        "Scroll to bottom of card",
        "Count navigation button rows"
      ],
      "expected": "Exactly one row: ← Prev | counter | Edit | Next →. No second row of Previous/Next below."
    },
    {
      "id": "BV-03",
      "title": "Language dropdown shows all languages including Portuguese and Spanish",
      "url": "https://learn.rentyourcio.com",
      "steps": [
        "Click Browse tab",
        "Open the language dropdown",
        "Read all options"
      ],
      "expected": "Dropdown includes Portuguese and Spanish in addition to French, Greek, English. No hardcoded-only list."
    }
  ]
}
```

---

## HANDOFF FORMAT

```
PTH: SF03-FIX | Sprint: SF-MOBILE-FIX-001 | Project: Super Flashcards
Version: 3.3.8 → 3.3.9
Languages in dropdown: [list from canary 4 output]
Handoff ID: [from POST /mcp/handoffs]
Handoff URL: https://metapm.rentyourcio.com/mcp/handoffs/[ID]/content
UAT spec_id: [from POST /api/uat/spec]
UAT URL: https://metapm.rentyourcio.com/uat/[spec_id]
```
