# PTH-A9E5 | SF-DCC-FIX-001 | Super Flashcards
## Super Flashcards 🟡 — Fix Homepage Broken Image + DCC UAT Verification
## Sprint ID: SF-DCC-FIX-001 | Est: 2-3 hrs | Deploy required
## Bootstrap: G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md

======================================================
========= Super Flashcards 🟡 SF-DCC-FIX-001 PTH-A9E5 =========
======================================================

[SESSION] Super Flashcards | SF-DCC-FIX-001 | 2026-03-09 | v3.3.0 → v3.3.1

## CONTEXT

UAT for SF-DCC-001 (PTH-D4E8) FAILED:

  SM-01: error-tracker.js fires on broken IMG resource at learn.rentyourcio.com/
  This is a pre-existing homepage broken image, not a DCC bug.

  Additionally: the reposted handoff (DCC-HANDOFF-FIX-001) had no cai_review
  (stripped due to parse error), so the UAT page has zero DCC-specific tests.
  DCC feature correctness was never verified by UAT.

This sprint:
  A) Fix the broken homepage image (or suppress the false-positive from error-tracker)
  B) Verify DCC features directly via canary curls
  C) Post a new handoff with DCC evidence so UAT page reflects actual feature

Production URL: https://learn.rentyourcio.com

---

## PHASE 0 — Bootstrap + auth + probe

Read Bootstrap v1.5.1. Read Super Flashcards PROJECT_KNOWLEDGE.md.

```powershell
gcloud auth list
```

```bash
curl -s https://learn.rentyourcio.com/health  # expect 3.3.0

# Reproduce the broken image
curl -s -o /dev/null -w "%{http_code}" https://learn.rentyourcio.com/
# What is the IMG src that fails? Check homepage HTML
curl -s https://learn.rentyourcio.com/ | grep -i '<img' | head -10

# Probe DCC feature directly
# Get a card known to be in DCC (e.g., θεός — god, rank ~14)
curl -s "https://learn.rentyourcio.com/api/v1/cards?search=θεός" | head -30
# Get the card ID, then check DCC panel data
```

Report broken image src before writing any fix.

---

## PHASE 1 — Fix broken homepage image

Options in priority order:
1. Fix the missing image (upload to correct path or fix the src reference)
2. If image is intentionally removed: remove the `<img>` tag
3. If error-tracker is firing on a favicon or external CDN: add the resource or suppress
   the specific error for known-missing externals

Do NOT suppress all image errors — that would hide real bugs.
Fix the specific broken resource identified in Phase 0.

---

## PHASE 2 — Verify DCC features

Run these verifications directly. Results go in handoff evidence.

```bash
# 2A: Card detail shows dcc_frequency_rank
# Find a card with DCC data (θεός, λόγος, ἄνθρωπος are likely matches)
CARD_SEARCH=$(curl -s "https://learn.rentyourcio.com/api/v1/cards?search=θεός")
echo $CARD_SEARCH | python -m json.tool | head -20
CARD_ID=$(echo $CARD_SEARCH | python -c "
import sys,json
data=json.load(sys.stdin)
cards=data.get('cards',data) if isinstance(data,dict) else data
print(cards[0]['id'] if cards else 'NOT FOUND')
")
echo "Card ID: $CARD_ID"

# 2B: Check card has dcc_frequency_rank
curl -s "https://learn.rentyourcio.com/api/v1/cards/$CARD_ID" | \
  python -c "import sys,json; d=json.load(sys.stdin); print('dcc_rank:', d.get('dcc_frequency_rank','MISSING'))"

# 2C: Check DCC panel endpoint if it exists separately
curl -s "https://learn.rentyourcio.com/api/v1/cards/$CARD_ID/dcc" 2>/dev/null || \
  echo "No separate /dcc endpoint — panel data embedded in card response"

# 2D: Verify new DCC-only cards were imported
curl -s "https://learn.rentyourcio.com/api/v1/cards?source=dcc&limit=5" | head -20
# Or check total card count vs pre-DCC baseline (was ~1400, now should be ~1436)
curl -s "https://learn.rentyourcio.com/api/v1/cards?limit=1" | \
  python -c "import sys,json; d=json.load(sys.stdin); print('total cards:', d.get('total',d.get('count','unknown')))"
```

---

## PHASE 3 — Deploy fix

```bash
gcloud run deploy super-flashcards --region us-central1  # flags from PK.md
curl -s https://learn.rentyourcio.com/health  # 3.3.1
```

---

## PHASE 4 — Post corrected handoff with evidence

```bash
cat > /tmp/sf_handoff.json << 'EOF'
{
  "project": "super-flashcards",
  "version": "3.3.1",
  "feature": "SF-DCC-001 PTH-D4E8 DCC Dictionary Panel + Bulk Load (corrected UAT)",
  "status": "passed",
  "total_tests": 4,
  "results_text": "REPLACE_WITH_ACTUAL",
  "results": [],
  "tested_by": "cc",
  "notes": "SF-DCC-FIX-001 PTH-A9E5. Corrected handoff with DCC evidence. Broken homepage image fixed.",
  "requirements": [
    {
      "code": "SF-DCC-001",
      "status": "complete",
      "evidence": {
        "curl_command": "REPLACE_WITH_ACTUAL_CURL",
        "http_status": 200,
        "response_preview": "REPLACE_WITH_ACTUAL_RESPONSE"
      }
    }
  ]
}
EOF

# Fill in actual values from Phase 2 before posting
# Then post:
SF_FIX_HANDOFF=$(curl -s -X POST \
  https://metapm.rentyourcio.com/api/uat/direct-submit \
  -H "Content-Type: application/json" \
  -d @/tmp/sf_handoff.json)
echo $SF_FIX_HANDOFF

SF_FIX_ID=$(echo $SF_FIX_HANDOFF | python -c "import sys,json; print(json.load(sys.stdin).get('handoff_id','NOT FOUND'))")

SF_FIX_UAT=$(curl -s -X POST \
  https://metapm.rentyourcio.com/api/uat/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"handoff_id\": \"$SF_FIX_ID\",
    \"work_items\": [],
    \"project\": \"super-flashcards\",
    \"version\": \"3.3.1\",
    \"deploy_url\": \"https://learn.rentyourcio.com\"
  }")
echo $SF_FIX_UAT

SF_FIX_UAT_ID=$(echo $SF_FIX_UAT | python -c "import sys,json; print(json.load(sys.stdin).get('uat_id','NOT FOUND'))")
echo "SF fix UAT URL: https://metapm.rentyourcio.com/uat/$SF_FIX_UAT_ID"
```

---

## CANARY TEST (mandatory — include actual response in handoff)

```bash
# Canary 1: Homepage loads with no broken image
curl -s -o /dev/null -w "%{http_code}" https://learn.rentyourcio.com/
# Expected: 200

# Canary 2: DCC card has frequency rank
curl -s "https://learn.rentyourcio.com/api/v1/cards/$CARD_ID" | \
  python -c "import sys,json; d=json.load(sys.stdin); rank=d.get('dcc_frequency_rank'); print('PASS' if rank else 'FAIL - no dcc_frequency_rank')"
# Expected: PASS (rank is a number)

# Canary 3: Total card count reflects DCC import (should be > 1400)
curl -s "https://learn.rentyourcio.com/api/v1/cards?limit=1" | \
  python -c "import sys,json; d=json.load(sys.stdin); print('total:', d.get('total',d.get('count','unknown')))"
# Expected: > 1400

# Canary 4: New UAT page live
curl -s -o /dev/null -w "%{http_code}" https://metapm.rentyourcio.com/uat/$SF_FIX_UAT_ID
# Expected: 200
```

---

## INTENT BOUNDARIES

1. Do NOT claim broken image is fixed without verifying homepage loads clean.
2. Do NOT fabricate card counts — use actual API response.
3. If DCC panel is embedded in card response (not a separate endpoint): that is acceptable.
   Report how it's implemented.

---

## ACCEPTANCE CRITERIA

- [ ] Homepage loads without broken image console error
- [ ] Card with DCC match shows dcc_frequency_rank in API response
- [ ] Total card count > 1400 (DCC import confirmed)
- [ ] New handoff posted with actual evidence
- [ ] New UAT page live (HTTP 200)
- [ ] Version 3.3.1 at /health

---

## DELIVERABLE REPORT

```
SESSION COMPLETE
================
PTH: A9E5 | Sprint: SF-DCC-FIX-001
Version: 3.3.0 → 3.3.1
Commit: ________

Broken image root cause: ________
Fix applied: ________

CANARY 1 — homepage HTTP status: ________
CANARY 2 — dcc_frequency_rank present: ________
CANARY 3 — total card count: ________

DCC implementation: panel embedded in card response / separate endpoint
Sample card ID with DCC data: ________
Sample card dcc_frequency_rank: ________

New handoff ID: ________
New UAT URL: https://metapm.rentyourcio.com/uat/________
UAT page HTTP status: ________

Deviations: ________
```

PTH-A9E5 — END OF PROMPT
