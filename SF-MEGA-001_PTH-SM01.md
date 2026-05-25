# PTH-SM01 | SF-MEGA-001 | Super Flashcards 🟡

Read Bootstrap (always current — filename only, no version pin):
G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md

---

## Session Identity
PTH: SM01 | Sprint: SF-MEGA-001 | Project: Super Flashcards 🟡

---

## Context

Mega sprint — multiple improvements in sequence. Complete each item fully
(canary pass, UAT submitted) before moving to the next. Do not batch fixes
across items. Stop and report after each item if a blocker is found.

Current version: 3.3.1 or 3.3.2 (confirm from health check).
Production URL: https://learn.rentyourcio.com

Items in priority order:
  ITEM 1 — SF-SEARCH-FIX: offset/skip bug in search pagination (~30 min)
  ITEM 2 — SF-023/024/026: Gender, Preposition, TTS — admin close (CC Done, no UAT)
  ITEM 3 — SF-014: Cross-language search (needs prompt scoping)
  ITEM 4 — SF-028: Compound word breakdown (needs prompt scoping)

---

## Phase 0

### Step 1: Auth
```powershell
gcloud auth list
gcloud auth print-identity-token | Out-Null
Write-Host "Auth OK"
```

### Step 2: Model identity gate
Report: which Claude model is running this session.

### Step 3: Read project docs
```bash
cat PROJECT_KNOWLEDGE.md
```
Report CHECKPOINT codes. Confirm Bootstrap version. Note current known issues.

### Step 4: Health check
```powershell
Invoke-RestMethod -Uri "https://learn.rentyourcio.com/health"
```
Report current deployed version.

### Step 5: Reproduce SF-SEARCH-FIX bug
```powershell
$token = gcloud.cmd auth print-identity-token
# Search with offset — does the second page return different results?
$page1 = Invoke-RestMethod `
  -Uri "https://learn.rentyourcio.com/api/search?q=alpha&limit=10&offset=0" `
  -Headers @{ Authorization = "Bearer $token" }
$page2 = Invoke-RestMethod `
  -Uri "https://learn.rentyourcio.com/api/search?q=alpha&limit=10&offset=10" `
  -Headers @{ Authorization = "Bearer $token" }
Write-Host "Page 1 count: $($page1.results.Count)"
Write-Host "Page 2 count: $($page2.results.Count)"
# Check for duplicate IDs between pages
$page1Ids = $page1.results | ForEach-Object { $_.id }
$page2Ids = $page2.results | ForEach-Object { $_.id }
$overlap = $page1Ids | Where-Object { $page2Ids -contains $_ }
Write-Host "Overlap (should be 0): $($overlap.Count)"
```
Report: are page 1 and page 2 returning the same results? Is offset being applied?

[STOP after Phase 0 — confirm bug reproduced before writing Item 1 fix]

---

## ITEM 1 — SF-SEARCH-FIX: Offset/Skip Bug

### Root cause to look for:
The search endpoint likely ignores the `offset` or `skip` parameter.
Common causes:
- ORM query uses `.limit(n)` but not `.offset(n)` or `.skip(n)`
- Offset param is received but not passed to the database query
- The search uses a full-text index that doesn't support offset correctly

### Fix:
Ensure the search query applies both limit AND offset/skip:
```python
# SQLAlchemy example
results = session.query(Flashcard)\
    .filter(Flashcard.word.ilike(f"%{q}%"))\
    .order_by(Flashcard.word)\
    .offset(offset)\
    .limit(limit)\
    .all()
```

After fix, re-run the Phase 0 canary search — page 1 and page 2 must have
zero overlapping IDs.

### Item 1 canary:
```powershell
PTH: SM01 | Item: SF-SEARCH-FIX | Project: Super Flashcards 🟡

$token = gcloud.cmd auth print-identity-token
$page1 = Invoke-RestMethod `
  -Uri "https://learn.rentyourcio.com/api/search?q=a&limit=10&offset=0" `
  -Headers @{ Authorization = "Bearer $token" }
$page2 = Invoke-RestMethod `
  -Uri "https://learn.rentyourcio.com/api/search?q=a&limit=10&offset=10" `
  -Headers @{ Authorization = "Bearer $token" }
$page1Ids = $page1.results | ForEach-Object { $_.id }
$page2Ids = $page2.results | ForEach-Object { $_.id }
$overlap = $page1Ids | Where-Object { $page2Ids -contains $_ }
if ($overlap.Count -gt 0) {
  Write-Host "ITEM 1 CANARY FAIL: $($overlap.Count) overlapping results between pages"
  exit 1
}
Write-Host "ITEM 1 CANARY PASS: zero overlap between page 1 and page 2"
```

### Item 1 UAT submission:
```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://metapm.rentyourcio.com/api/uat/direct-submit" `
  -ContentType "application/json" `
  -Body ((@{
    project      = "Super Flashcards"
    version      = "<new version after Item 1>"
    feature      = "SF-SEARCH-FIX: offset/skip pagination bug"
    status       = "submitted"
    pth          = "SM01"
    total_tests  = 2
    results_text = "<CC fills>"
    tested_by    = "cc"
    cc_summary   = "<CC fills — root cause + fix>"
    notes        = "PTH: SM01 Item 1 — search pagination offset fix"
    test_cases   = @(
      @{ id="BV-01"; title="Search page 2 returns different results from page 1"
         type="pl_visual"
         instructions=@("Open https://learn.rentyourcio.com","Search for a common word","Scroll to page 2 or trigger next page","Confirm: different words shown than page 1")
         expected="Pagination works — no duplicate results across pages"
         status="pending"; result=$null; notes=$null },
      @{ id="BV-02"; title="Search results total count displayed correctly"
         type="pl_visual"
         instructions=@("Search for a common Greek word","Confirm: total result count shown","Confirm: result count is non-zero and plausible")
         expected="Count displayed, matches expected vocabulary size"
         status="pending"; result=$null; notes=$null }
    )
  }) | ConvertTo-Json -Depth 5)
```

---

## ITEM 2 — SF-023/024/026: Admin Close (CC Done, No UAT)

These requirements were implemented in prior CC sessions but never received
formal UAT. Close them administratively:

```powershell
$token = gcloud.cmd auth print-identity-token

foreach ($code in @("SF-023", "SF-024", "SF-026")) {
  # Quick smoke test first
  Write-Host "Smoke testing $code..."
}

# SF-023: Gender display on flashcards
# Verify gender (masculine/feminine/neuter) shows on Greek word cards
$sample = Invoke-RestMethod `
  -Uri "https://learn.rentyourcio.com/api/flashcards?limit=5&language=greek" `
  -Headers @{ Authorization = "Bearer $token" }
Write-Host "SF-023 gender field sample: $($sample.flashcards | Select-Object -First 3 | ForEach-Object { $_.gender })"

# SF-024: Preposition display
# Verify preposition case requirements show on prep cards
$preps = Invoke-RestMethod `
  -Uri "https://learn.rentyourcio.com/api/flashcards?limit=20&pos=preposition&language=greek" `
  -Headers @{ Authorization = "Bearer $token" }
Write-Host "SF-024 preposition cards found: $($preps.flashcards.Count)"

# SF-026: TTS audio
# Verify TTS endpoint responds for a sample word
try {
  $tts = Invoke-RestMethod `
    -Uri "https://learn.rentyourcio.com/api/tts?word=logos&language=greek" `
    -Headers @{ Authorization = "Bearer $token" }
  Write-Host "SF-026 TTS: $($tts.audio_url ?? 'no URL returned')"
} catch {
  Write-Host "SF-026 TTS: $($_.Exception.Message)"
}

# Walk requirements to pl_approved (admin close)
foreach ($code in @("SF-023", "SF-024", "SF-026")) {
  Invoke-RestMethod -Method PATCH `
    -Uri "https://metapm.rentyourcio.com/api/roadmap/requirements/$code/state" `
    -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body "{`"status`":`"pl_approved`",`"notes`":`"PTH: SM01 — admin close. CC Done in prior session. Smoke test passed.`"}"
  Write-Host "$code walked to pl_approved"
}
```

If any smoke test fails: STOP and report to PL. Do not admin-close a broken feature.

---

## ITEM 3 — SF-014: Cross-Language Search

Allow PL to search flashcards across Greek and French simultaneously,
or filter by language. Current state: search is per-language only.

### Scope:
Add `language` filter param to search endpoint (if not already present):
  GET /api/search?q={query}&language=greek|french|all

Default: `all` (search both languages).

```python
# If language param present and not "all", filter:
if language and language != "all":
    query = query.filter(Flashcard.language == language)
```

Frontend: add language filter dropdown to search UI (All / Greek / French).

### Item 3 canary:
```powershell
$token = gcloud.cmd auth print-identity-token
# All-language search
$all = Invoke-RestMethod `
  -Uri "https://learn.rentyourcio.com/api/search?q=a&language=all&limit=20" `
  -Headers @{ Authorization = "Bearer $token" }
$greek = $all.results | Where-Object { $_.language -eq "greek" }
$french = $all.results | Where-Object { $_.language -eq "french" }
Write-Host "Cross-language: $($greek.Count) Greek, $($french.Count) French in results"
if ($greek.Count -eq 0 -or $french.Count -eq 0) {
  Write-Host "ITEM 3 CANARY FAIL: expected both languages in results"
  exit 1
}
Write-Host "ITEM 3 CANARY PASS"
```

### Item 3 UAT submission:
```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://metapm.rentyourcio.com/api/uat/direct-submit" `
  -ContentType "application/json" `
  -Body ((@{
    project      = "Super Flashcards"
    version      = "<new version after Item 3>"
    feature      = "SF-014: cross-language search"
    status       = "submitted"
    pth          = "SM01"
    total_tests  = 2
    results_text = "<CC fills>"
    tested_by    = "cc"
    cc_summary   = "<CC fills>"
    notes        = "PTH: SM01 Item 3 — cross-language search"
    test_cases   = @(
      @{ id="BV-01"; title="Search returns both Greek and French results"
         type="pl_visual"
         instructions=@("Open search","Search for a short word present in both languages","Confirm: results from both Greek and French appear","Confirm: language label visible per result")
         expected="Mixed-language results when no filter selected"
         status="pending"; result=$null; notes=$null },
      @{ id="BV-02"; title="Language filter narrows results correctly"
         type="pl_visual"
         instructions=@("Select Greek filter","Confirm: only Greek results shown","Select French filter","Confirm: only French results shown")
         expected="Filter works for each language"
         status="pending"; result=$null; notes=$null }
    )
  }) | ConvertTo-Json -Depth 5)
```

---

## ITEM 4 — SF-028: Compound Word Breakdown

Display compound word decomposition on Greek flashcard detail view.
Example: "philosophy" = philos (loving) + sophia (wisdom).

### Scope:
- Add `compound_parts` JSON field to flashcard model (nullable)
- On flashcard detail page: if `compound_parts` present, show breakdown section
- Populate via admin or future ingestion (do not auto-generate — data quality risk)
- For now: add the field and the UI display. Seeding data is a separate step.

```sql
ALTER TABLE flashcards ADD COLUMN compound_parts JSON NULL;
```

Frontend detail display:
```html
<!-- Only shown if compound_parts has data -->
<div class="compound-breakdown" v-if="card.compound_parts">
  <h4>Word Breakdown</h4>
  <span v-for="part in card.compound_parts">
    {{ part.root }} — {{ part.meaning }}
  </span>
</div>
```

### Item 4 canary:
```powershell
$token = gcloud.cmd auth print-identity-token
# Confirm compound_parts field exists on flashcard schema
$card = Invoke-RestMethod `
  -Uri "https://learn.rentyourcio.com/api/flashcards?limit=1" `
  -Headers @{ Authorization = "Bearer $token" }
$hasField = $card.flashcards[0].PSObject.Properties.Name -contains "compound_parts"
if (-not $hasField) {
  Write-Host "ITEM 4 CANARY FAIL: compound_parts field not present on flashcard object"
  exit 1
}
Write-Host "ITEM 4 CANARY PASS: compound_parts field present (value may be null for existing cards)"
```

### Item 4 UAT submission:
```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://metapm.rentyourcio.com/api/uat/direct-submit" `
  -ContentType "application/json" `
  -Body ((@{
    project      = "Super Flashcards"
    version      = "<new version after Item 4>"
    feature      = "SF-028: compound word breakdown field + UI"
    status       = "submitted"
    pth          = "SM01"
    total_tests  = 2
    results_text = "<CC fills>"
    tested_by    = "cc"
    cc_summary   = "<CC fills>"
    notes        = "PTH: SM01 Item 4 — compound_parts field + detail UI. Data seeding separate step."
    test_cases   = @(
      @{ id="BV-01"; title="compound_parts field present in API response"
         type="cc_verify"
         instructions=@("Check flashcard API response","Confirm: compound_parts key present (may be null)")
         expected="Field exists on schema"
         status="pending"; result=$null; notes=$null },
      @{ id="BV-02"; title="Breakdown UI visible when data present"
         type="pl_visual"
         instructions=@("Manually set compound_parts on one test card via API","Open that card's detail view","Confirm: Word Breakdown section visible with parts listed")
         expected="Breakdown section renders when data exists"
         status="pending"; result=$null; notes=$null }
    )
  }) | ConvertTo-Json -Depth 5)
```

---

## Final Canary Gate (all items complete)

```powershell
PTH: SM01 | Sprint: SF-MEGA-001 | Project: Super Flashcards 🟡

$h = Invoke-RestMethod -Uri "https://learn.rentyourcio.com/health"
Write-Host "Final version: $($h.version)"

# Confirm all 4 UATs submitted
$token = gcloud.cmd auth print-identity-token
$uats = Invoke-RestMethod `
  -Uri "https://metapm.rentyourcio.com/api/uat/list?limit=20" `
  -Headers @{ Authorization = "Bearer $token" }
$sm01 = $uats.uats | Where-Object { $_.pth -eq "SM01" }
Write-Host "SM01 UATs submitted: $($sm01.Count) (expected 3 — Items 1, 3, 4)"
Write-Host "SF-023/024/026 walked to pl_approved via admin close"
Write-Host "MEGA SPRINT CANARY: COMPLETE"
```

---

## MetaPM State Transitions

Walk the following to cc_complete after each item ships:
- SF-SEARCH-FIX requirement code (find via roadmap query)
- SF-014 requirement code
- SF-028 requirement code
- SF-023, SF-024, SF-026 → pl_approved (admin close)

```powershell
$token = gcloud.cmd auth print-identity-token
Invoke-RestMethod `
  -Uri "https://metapm.rentyourcio.com/api/roadmap/requirements?project_id=proj-sf&limit=50" `
  -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 2
```

---

## SESSION_CLOSEOUT.md

Create SESSION_CLOSEOUT.md in Super Flashcards repo root before ending.
Required fields: Sprint (SM01), all version bumps, all commits, all UAT IDs,
items completed vs skipped, lessons learned.
A session without SESSION_CLOSEOUT.md is non-compliant.

---

## Deliverable Report

```
PTH: SM01 | Sprint: SF-MEGA-001 | Project: Super Flashcards 🟡
===============================================================
Items completed:
  Item 1 — SF-SEARCH-FIX:    Version {v} | Commit {h} | UAT {uuid}
  Item 2 — Admin close:       SF-023/024/026 → pl_approved
  Item 3 — SF-014:            Version {v} | Commit {h} | UAT {uuid}
  Item 4 — SF-028:            Version {v} | Commit {h} | UAT {uuid}

Final version: {version}
Canary: all items PASS

PL: Complete UAT BVs for Items 1, 3, 4.
    Item 2 was admin-closed via smoke test — no PL UAT needed.
```

## Intent Boundaries
1. Complete each item fully before starting the next.
2. Stop and report if any item blocks — do not skip to the next item silently.
3. SF-023/024/026 admin close only if smoke tests pass. Fail = stop and report.
4. SF-028 data seeding is out of scope — field + UI only.
5. SESSION_CLOSEOUT.md mandatory.

## Rules
- Production only. No local validation.
- Read PROJECT_KNOWLEDGE.md before writing any code.
- Reference Bootstrap by filename only — never pin a version number.
- Deliverable canary gate mandatory per item (BA01).
- Every communication to PL opens with PTH banner (BA02).

PTH-SM01 — END OF PROMPT
