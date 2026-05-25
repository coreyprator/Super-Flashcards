# CC Diagnostic + Retry: Super Flashcards Greek Batch Import

## 🚨 BOOTSTRAP GATE
**Read Bootstrap v1.1 FIRST** — located at:
`G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md`

Complete ALL pre-work gates before writing any code.

---

## 🔐 Auth Check

```powershell
gcloud auth list
# Expected: cc-deploy@super-flashcards-475210.iam.gserviceaccount.com (active)
# If not: gcloud auth activate-service-account cc-deploy@super-flashcards-475210.iam.gserviceaccount.com --key-file=C:\venvs\cc-deploy-key.json
# DEPLOY WORKAROUND: gcloud config set account cprator@cbsware.com (for deploy only, switch back after)
```

---

## 📋 Context

**Project**: Super Flashcards
**Current Version**: v3.0.2
**Production URL**: https://learn.rentyourcio.com
**Cloud SQL**: 35.224.242.223, instance flashcards-db, login: flashcards_user

### What Happened
A prior CC session attempted this Greek batch import sprint but died after only 2 steps (auth activation + counting vocab file lines). The import never executed. PL verified: Greek card count is still 481 (unchanged from 2/22/2026 UAT).

Likely cause: a command was blocked (network egress, database connection, or similar). This session must diagnose what went wrong and complete the import.

---

## PHASE 0: DIAGNOSE (before doing anything else)

### Step 1: Check what the app exposes for card creation
```powershell
# Does the app have an API endpoint for creating cards?
Select-String -Path app/*.py,app/**/*.py -Pattern "def create|def add|def import|def bulk|/cards" -Recurse
Select-String -Path app/*.py,app/**/*.py -Pattern "@app.route|@app.post|@app.put" -Recurse | Select-String -Pattern "card"
```

### Step 2: Check if there's already a batch import script or management command
```powershell
dir scripts/*.py 2>$null
dir manage*.py 2>$null
dir tools/*.py 2>$null
Select-String -Path *.py,**/*.py -Pattern "batch|bulk|import.*csv|import.*vocab" -Recurse
```

### Step 3: Test network connectivity to production
```powershell
# Can we reach the production app?
curl -s -o $null -w "%{http_code}" https://learn.rentyourcio.com/health

# Can we reach Cloud SQL? (this may be what failed last time)
# Test-NetConnection 35.224.242.223 -Port 1433 -WarningAction SilentlyContinue | Select TcpTestSucceeded
```

### Step 4: Read the vocab file and confirm format
```powershell
Get-Content "G:\My Drive\Code\Python\Super-Flashcards\greek_core_vocab.txt" | Select-Object -First 10
(Get-Content "G:\My Drive\Code\Python\Super-Flashcards\greek_core_vocab.txt" | Where-Object { $_.Trim() -ne "" }).Count
```

**STOP after Phase 0. Report what you found:**
- Does an API endpoint exist for card creation?
- Does a batch import script already exist?
- Can you reach the production app?
- Can you reach Cloud SQL directly?
- What format is the vocab file in?

**Then choose your import strategy based on findings:**

---

## PHASE 1: IMPORT STRATEGY (choose one based on Phase 0 findings)

### Option A: API-based import (PREFERRED if endpoint exists)
If the production app has a POST endpoint for creating cards (e.g., `/api/cards`, `/api/v1/cards`):
1. Parse the vocab file into JSON payloads
2. POST each card (or batch) to the production API
3. This avoids needing direct DB access

### Option B: Script-based import via Cloud SQL Proxy
If no API exists and direct DB is needed:
1. Start Cloud SQL Proxy: `cloud-sql-proxy super-flashcards-475210:us-central1:flashcards-db --port=1433`
2. Run import script against localhost:1433
3. **If Cloud SQL Proxy fails or is blocked, STOP and report — do NOT silently exit**

### Option C: Create a management endpoint, deploy, then use it
If neither A nor B works:
1. Add a POST `/api/admin/import-vocab` endpoint to the app
2. Deploy to Cloud Run
3. Call the new endpoint with the vocab data
4. This guarantees network access (the Cloud Run service already has Cloud SQL access)

**Whichever option you choose, explain WHY before proceeding.**

---

## PHASE 2: EXECUTE IMPORT

### Vocab file location
`G:\My Drive\Code\Python\Super-Flashcards\greek_core_vocab.txt`

### Pre-import baseline
```powershell
# Count existing Greek cards BEFORE import
curl -s "https://learn.rentyourcio.com/api/cards?language=Greek" | python -m json.tool | Select-String "total"
# Expected: ~481 cards (from 2/22/2026 UAT)
```

### Import rules
- Language: Greek
- Skip duplicates (if word already exists in Greek collection, skip it)
- Log: imported count, skipped count, error count
- Do NOT delete or modify existing cards
- If any card fails, continue with the rest (don't abort the batch)

### Post-import verification
```powershell
# Count Greek cards AFTER import
curl -s "https://learn.rentyourcio.com/api/cards?language=Greek" | python -m json.tool | Select-String "total"
# Expected: > 481

# Spot check a few new words
curl -s "https://learn.rentyourcio.com/api/cards?language=Greek&search=αγάπη" | python -m json.tool
```

---

## PHASE 3: UPDATE PROJECT_KNOWLEDGE.md

The prior CC session also failed to update PK.md. Apply these changes:
- SF-005 status: backlog (was in_progress). PL UAT 2/22: SRS not implemented, needs membership model.
- SF-014: PIE Root Pronunciation Audio (backlog, P3)
- SF-017: Language Reassignment (backlog, P2)
- SF-018: Error Tracker Fix (backlog, P3)
- Greek batch import: record date, count imported, count skipped

---

## ✅ Test Commands

```bash
# Health
curl -s https://learn.rentyourcio.com/health
# Expected: v3.0.2

# Greek card count (must be > 481)
curl -s "https://learn.rentyourcio.com/api/cards?language=Greek" | python -m json.tool | Select-String "total"
```

---

## 📮 Handoff Instructions

Standard handoff to MetaPM. Include:
- Import strategy used (A, B, or C) and why
- Pre-import Greek count
- Post-import Greek count
- Cards imported / skipped / errored
- PK.md update status

---

## 🔒 Session Close-Out

1. Create `SESSION_CLOSEOUT.md`
2. Update `PROJECT_KNOWLEDGE.md` (Phase 3 changes + import results)
3. `git add -A && git commit -m "Greek batch import + PK.md updates [data sprint]"`
4. `git push origin main`

---

## ⚠️ CRITICAL RULES
- **Do NOT silently exit if a command is blocked.** Report the error and try an alternative approach.
- **Deploy to Cloud Run and test against production.** Do NOT run local validation or create virtual environments.
- **If direct DB access is blocked, use the production API or create a management endpoint.** There is always a path forward — find it.
- **Report your import strategy choice and reasoning before executing.**
- **Version stays at v3.0.2.** This is a data import, not a code change (unless Option C is needed, then bump to v3.0.3).
