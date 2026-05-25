# PTH-D5C1 | SF-DCC-REWORK-001 | Super Flashcards 🟡

Read Bootstrap v1.5.6 FIRST:
G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md
Complete ALL pre-work gates including Phase 0 Diagnostic Gate.

---

## Auth Check

```powershell
gcloud auth list
# Expected: cc-deploy@super-flashcards-475210.iam.gserviceaccount.com (active)
# If not: gcloud auth activate-service-account `
#   cc-deploy@super-flashcards-475210.iam.gserviceaccount.com `
#   --key-file=C:\venvs\cc-deploy-key.json
```

## Session Identity Banner

Print as FIRST output:
```
[SESSION] Super Flashcards | SF-DCC-REWORK-001 | 2026-03-11 | v3.3.1 → v3.3.2
```

---

## Context

SF-DCC-001 was previously marked cc_complete but RECON-001 (PTH-R3C0) found
the production endpoint returning HTTP 500:

  GET /api/v1/cards/{id}/dcc → HTTP 500

The feature was built but is fully broken in production. This sprint diagnoses
the root cause and fixes it.

The DCC feature: when a Super Flashcards word matches a DCC Greek Core List
entry, show a panel with rank, gloss, POS, transliteration. Data source is the
PIE Network Graph API. 8 of the card set are expected to match DCC.

PIE Network Graph (data source): https://efg.rentyourcio.com
Super Flashcards production: https://learn.rentyourcio.com

---

## Phase 0 — Diagnostic Gate

```powershell
# 1. Governance checkpoint
Invoke-RestMethod -Uri "https://metapm.rentyourcio.com/api/governance/bootstrap-checkpoint"
# Expected: BOOT-1.5.6-B5F9

# 2. Confirm the 500 error
Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/v1/cards?limit=5" | ConvertTo-Json
# Note a card id from the response, then:
Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/v1/cards/{id}/dcc"
# Expected currently: HTTP 500

# 3. Check PIE Network Graph DCC data is available
Invoke-RestMethod -Uri "https://efg.rentyourcio.com/api/words?limit=5" | ConvertTo-Json
# Expected: words with dcc_imported field

# 4. Read PROJECT_KNOWLEDGE.md before writing any code
# G:\My Drive\Code\Python\super-flashcards\PROJECT_KNOWLEDGE.md
```

Stop and report Phase 0 findings — include the exact 500 error message from
server logs or response body — before writing any code.

Suspected cause: PIE Network Graph API call shape mismatch, missing env var,
or null handling error in the DCC lookup route. CC must confirm in Phase 0.

---

## Requirements

### DCC-FIX-1 — Diagnose and Fix HTTP 500

Investigate the /api/v1/cards/{id}/dcc route handler:
- What error is thrown? (check Cloud Run logs if response body is empty)
- Is the PIE Network Graph API being called correctly?
- Is the response being parsed correctly?
- Are null/no-match cases handled (most cards won't have a DCC entry)?

```powershell
# Pull Cloud Run logs for the error
gcloud run services logs read super-flashcards --region us-central1 --limit 50
```

Fix the root cause. Do not mask the error with a try/catch that returns empty.

Acceptance criteria:
- [ ] GET /api/v1/cards/{id}/dcc returns HTTP 200 for a card with no DCC match (empty response, not 500)
- [ ] GET /api/v1/cards/{id}/dcc returns HTTP 200 with DCC data for a matching card

### DCC-FIX-2 — Confirm 8 Matches Exist

8 cards are expected to match DCC entries based on prior sprint context.

```powershell
# Test a sample of cards to find DCC matches
# Pull first 50 cards and check each
$cards = Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/v1/cards?limit=50"
foreach ($card in $cards.items) {
  $dcc = Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/v1/cards/$($card.id)/dcc" -ErrorAction SilentlyContinue
  if ($dcc) { Write-Host "$($card.id): $($card.word_or_phrase) -> DCC match" }
}
```

Acceptance criteria:
- [ ] At least 1 confirmed DCC match returns correct data (rank, gloss, POS, transliteration)
- [ ] Non-matching cards return 200 with empty/null payload, not 500

### DCC-FIX-3 — Version Bump

Bump Super Flashcards version 3.3.1 → 3.3.2.

---

## Implementation Order

1. Phase 0: reproduce 500, read logs, identify root cause
2. DCC-FIX-1: fix the route handler
3. DCC-FIX-2: confirm matches work
4. DCC-FIX-3: version bump, deploy, verify /health returns 3.3.2

---

## Test Commands

```powershell
# Health check
Invoke-RestMethod -Uri "https://learn.rentyourcio.com/health"
# Expected: version 3.3.2

# DCC endpoint — non-matching card (should be 200, not 500)
Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/v1/cards/{any_id}/dcc"
# Expected: 200 with null/empty body

# DCC endpoint — matching card
Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/v1/cards/{matching_id}/dcc"
# Expected: 200 with rank, gloss, POS, transliteration fields
```

---

## MetaPM Handoff

```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://metapm.rentyourcio.com/api/uat/submit" `
  -ContentType "application/json" `
  -Body '{
    "project": "Super-Flashcards",
    "version": "3.3.2",
    "feature": "SF-DCC-001 rework: fix HTTP 500 on /api/v1/cards/{id}/dcc",
    "status": "passed",
    "total_tests": 0,
    "results_text": "<CC fills in: root cause, fix applied, canary results>",
    "results": [],
    "tested_by": "cc",
    "notes": "SF-DCC-REWORK-001 PTH-D5C1. Rework of SF-DCC-001 which shipped broken."
  }'
```

---

## Session Close-Out

1. Create SESSION_CLOSEOUT.md with root cause and fix summary
2. Update PROJECT_KNOWLEDGE.md: document DCC endpoint shape and PIE Network Graph API dependency
3. `git add -A && git commit -m "3.3.2: fix DCC endpoint HTTP 500 [SF-DCC-001]"`
4. `git push origin main`
5. Deploy and verify /health returns 3.3.2

---

## CANARY TEST (mandatory)

```powershell
Invoke-RestMethod -Uri "https://learn.rentyourcio.com/api/v1/cards/{any_card_id}/dcc"
```
Expected: HTTP 200. Any response other than 500 is progress. A 200 with DCC
data on a matching card is full pass.

If still returning 500 after fix attempt, sprint is NOT complete. Report
root cause found and fix attempted but canary failed.

---

## INTENT BOUNDARIES

1. Do NOT claim the endpoint is fixed if it still returns 500.
2. STOP and report if root cause cannot be identified from logs.
3. If the PIE Network Graph API is the problem (not SF code), report that
   clearly — do not patch around it without documenting the dependency.
4. Honest partial delivery if time runs out.

---

## Rules

- Deploy to Cloud Run and test against production. No local validation.
- Never prompt for passwords. Never create virtual environments.
- Read PROJECT_KNOWLEDGE.md before writing any code.
- If gcloud logs are inaccessible, report and try alternative diagnosis.

PTH-D5C1 — END OF PROMPT
