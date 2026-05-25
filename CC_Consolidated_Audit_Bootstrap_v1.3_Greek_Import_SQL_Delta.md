# CC Consolidated Sprint: Session Audit + Bootstrap v1.3 + Greek Import SQL Delta Fix

## 🚨 BOOTSTRAP GATE
**Read Bootstrap v1.2 FIRST** — located at:
`G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md`

Complete ALL pre-work gates including Phase 0 Diagnostic Gate.

---

## 🔐 Auth Check

```powershell
gcloud auth list
# Expected: cc-deploy@super-flashcards-475210.iam.gserviceaccount.com (active)
# If not: gcloud auth activate-service-account cc-deploy@super-flashcards-475210.iam.gserviceaccount.com --key-file=C:\venvs\cc-deploy-key.json
# DEPLOY WORKAROUND: gcloud config set account cprator@cbsware.com (for deploy only)
```

---

## 🤖 Model Identity Gate (NEW — you are the first session to enforce this)

**Print this block as your FIRST output, before anything else:**

```
[SESSION] Super Flashcards + project-methodology | Audit + Bootstrap v1.3 + Greek Import SQL Delta | 2026-02-25
[MODEL] <your model name and version>
[RUNTIME] <Claude Code / Claude.ai / other>
```

**If you are NOT running in Claude Code on Opus 4.6**, STOP and tell PL:
"This prompt was designed for Claude Code (Opus 4.6). I am running in [your environment].
PL should re-run this prompt in the correct environment."

Do not attempt to summarize, rewrite, or "improve" this prompt. It is an instruction set.
Execute the commands. Report the results. Follow the gates.

---

## 📋 Context

**Projects**: Super Flashcards + project-methodology (two repos, one session)
**SF Version**: v3.0.2 (no version change — audit + script fix only)
**PM Version**: v3.15 → v3.16 (Bootstrap v1.2 → v1.3)

### Why This Sprint

Three tasks are consolidated into one session because two previous attempts to run them
failed — they were accidentally executed in GPT 5.3 instead of Claude Code. GPT treated
the sprint prompts as documents to rewrite rather than instructions to execute. No commands
were run, no diagnostics performed, no work was accomplished. Both prompt files were
overwritten with "concise memos."

**This session has three parts:**
- **Part A**: Investigate the non-compliant Greek Import Recovery session, clean up the mess
- **Part B**: Amend Bootstrap to v1.3 with new gates (including model identity requirement)
- **Part C**: Fix the Greek import script to use SQL delta instead of the hung API call

Execute them in order: A → B → C.

---

# ═══════════════════════════════════════════════════════
# PART A: AUDIT — Greek Import Recovery Session
# ═══════════════════════════════════════════════════════

## A-Phase 0: Investigate Previous Session

```powershell
cd "G:\My Drive\Code\Python\Super-Flashcards"

# 1. Git status — any uncommitted changes?
git status

# 2. Recent commits — did the previous session commit anything?
git log --oneline -10

# 3. Check for local environment contamination
Get-ChildItem -Directory | Where-Object { $_.Name -match "venv|\.venv|env|node_modules|__pycache__" }
Get-ChildItem -File | Where-Object { $_.Name -match "docker-compose|Makefile|\.env\.local|test_local" }

# 4. Does SESSION_CLOSEOUT.md exist?
Test-Path "SESSION_CLOSEOUT.md"

# 5. What does CC_Hotfix_SF_Greek_Import_Recovery.md contain now?
if (Test-Path "CC_Hotfix_SF_Greek_Import_Recovery.md") {
    Get-Content "CC_Hotfix_SF_Greek_Import_Recovery.md" -Head 20
} else {
    Write-Host "File not found"
}

# 6. What does CC_Audit_SF_Greek_Import_Session_Recovery_and_Bootstrap_v1.3.md contain?
if (Test-Path "CC_Audit_SF_Greek_Import_Session_Recovery_and_Bootstrap_v1.3.md") {
    Get-Content "CC_Audit_SF_Greek_Import_Session_Recovery_and_Bootstrap_v1.3.md" -Head 20
} else {
    Write-Host "File not found"
}

# 7. Check if retry logic exists in import script
Select-String -Path "import_greek_single.py" -Pattern "retry|backoff|request_with_retry|ConnectionResetError" | Select-Object -First 10

# 8. App health
Invoke-WebRequest -Uri "https://learn.rentyourcio.com/health" -UseBasicParsing | Select-Object -ExpandProperty Content

# 9. Check PROJECT_KNOWLEDGE.md for Greek import status
Select-String -Path "PROJECT_KNOWLEDGE.md" -Pattern "Greek|import|retry|greek_import" | Select-Object -First 10

# 10. How many Greek cards exist? Use SQL — the API GET hangs at 800+ cards.
# Get DB password first:
$dbpass = gcloud secrets versions access latest --secret=db-password
python -c "
import pymssql
conn = pymssql.connect(server='35.224.242.223', user='flashcards_user', password='$dbpass', database='flashcards')
cursor = conn.cursor()
cursor.execute('''
    SELECT COUNT(DISTINCT f.word_or_phrase)
    FROM flashcards f
    JOIN languages l ON f.language_id = l.id
    WHERE l.name = ''Greek''
''')
print(f'Greek words in DB: {cursor.fetchone()[0]}')
conn.close()
"
# If pymssql is not installed:
# pip install pymssql --break-system-packages
# (This is PL's desktop Python, not a virtual env — acceptable)
```

**STOP and report ALL findings before proceeding:**

| Question | Answer |
|----------|--------|
| Uncommitted changes? | |
| Previous session commits (hashes + messages)? | |
| Local env artifacts found? | |
| SESSION_CLOSEOUT.md exists? | |
| CC_Hotfix_SF_Greek_Import_Recovery.md — original prompt or overwritten? | |
| CC_Audit_...Bootstrap_v1.3.md — original prompt or overwritten? | |
| Retry logic present in import_greek_single.py? Committed? | |
| App healthy? Version? | |
| PK.md mentions Greek import? | |
| Greek card count in DB? | |

---

## A1: Preserve Evidence

```powershell
cd "G:\My Drive\Code\Python\Super-Flashcards"
git diff > previous_session_uncommitted_diff.txt 2>$null
git log --oneline -10 > previous_session_commits.txt
git status > previous_session_status.txt
```

## A2: Clean Up

Based on Phase 0 findings:

**If retry logic is uncommitted but correct:**
```powershell
git add import_greek_single.py
git commit -m "fix: add retry with exponential backoff for Greek import (recovered from non-compliant session)"
```

**If local environment artifacts exist, remove them:**
```powershell
# List what you found, then remove. Examples:
# Remove-Item -Recurse -Force .venv
# Remove-Item docker-compose.yml
# Report exactly what you removed.
```

**If prompt files were overwritten by GPT:**
```powershell
# Rename the GPT-overwritten files to preserve evidence
if (Test-Path "CC_Hotfix_SF_Greek_Import_Recovery.md") {
    Rename-Item "CC_Hotfix_SF_Greek_Import_Recovery.md" "GPT_Overwrite_Recovery_Report.md"
}
if (Test-Path "CC_Audit_SF_Greek_Import_Session_Recovery_and_Bootstrap_v1.3.md") {
    Rename-Item "CC_Audit_SF_Greek_Import_Session_Recovery_and_Bootstrap_v1.3.md" "GPT_Overwrite_Audit_Report.md"
}
```

## A3: Create Retroactive SESSION_CLOSEOUT.md

Create `SESSION_CLOSEOUT_Greek_Import_Recovery_Retroactive.md` (use a distinct name so it
doesn't conflict with THIS session's closeout):

```markdown
# SESSION CLOSEOUT — Greek Import Recovery (Retroactive)
# Created retroactively by audit on 2026-02-25
# Original session: ~2026-02-24
# Original session ran in: GPT 5.3 (incorrect model — should have been Claude Code)

## Incident Summary
PL ran Greek import overnight. Desktop reboot caused ConnectionResetError [WinError 10054].
CC prompt was created by CAI (Claude Opus 4.6) to fix retry logic. Prompt was accidentally
pasted into GPT 5.3 instead of Claude Code. GPT rewrote the prompt into a "concise memo"
instead of executing it. This happened TWICE with two different prompts.

## Technical Findings (from this audit)
- Retry logic in import_greek_single.py: [CC fill: present/absent, committed/uncommitted]
- Greek cards in DB: [CC fill: count]
- Local env artifacts: [CC fill: what was found and cleaned]
- Sprint prompt files: [CC fill: were they overwritten by GPT?]

## Compliance Violations (Original Session)
1. No SESSION_CLOSEOUT.md created
2. Sprint prompt file overwritten (by GPT, not Claude Code)
3. Local dev environment set up (Bootstrap violation)
4. No MetaPM UAT POST submitted
5. PROJECT_KNOWLEDGE.md not updated
6. Wrong model used (GPT 5.3 instead of Claude Code)

## Cleanup Actions Taken (This Audit)
- [CC fill: list everything you did to clean up]
```

## A4: Update PROJECT_KNOWLEDGE.md

Add to Super Flashcards PROJECT_KNOWLEDGE.md:

```markdown
## Greek Import Status (as of 2026-02-25 audit)
- Vocab file: greek_delta_import.txt (1,084 words)
- Cards imported: [CC fill from SQL query]
- Remaining: [CC fill: 1084 minus imported]
- Import script: import_greek_single.py
- Retry logic: [CC fill: present? committed?]
- Known issue: GET /api/flashcards hangs at 800+ cards
- Fix: SQL delta mode added in this session (Part C below)
- Import must run from PL terminal (not CC session — sessions timeout)
```

## A5: Commit Part A

```powershell
cd "G:\My Drive\Code\Python\Super-Flashcards"
git add -A
git commit -m "audit: retroactive closeout for Greek Import Recovery + cleanup from GPT mis-execution"
git push origin main
```

---

# ═══════════════════════════════════════════════════════
# PART B: BOOTSTRAP v1.3 AMENDMENT
# ═══════════════════════════════════════════════════════

## B1: Read Current Bootstrap

```powershell
cd "G:\My Drive\Code\Python\project-methodology"
Get-Content "templates\CC_Bootstrap_v1.md"
```

Report the current contents so we have a baseline.

## B2: Apply Three New Rules + One New Gate

Add the following to the Bootstrap file. Insert them in the **Rules** section (or create
a "Compliance Gates" section if the structure calls for it). Preserve all existing content.

### New Gate: Model Identity (add to session startup, before Phase 0)

```markdown
### Model Identity Gate
Every CC session must print a model identity block as its FIRST output:

[SESSION] {Project} | {Sprint} | {Date} | v{Current} → v{Target}
[MODEL] {model name and version, e.g. Claude Opus 4.6}
[RUNTIME] {environment, e.g. Claude Code / Claude.ai / VS Code extension}

CC sprint prompts are designed for Claude Code (Opus 4.6). If running in a different
model or environment, STOP and notify PL before proceeding. Do not attempt to summarize
or rewrite the prompt — it is an instruction set to be executed, not a document to edit.

Running a CC sprint prompt in a non-Claude-Code environment (e.g., GPT, Gemini, or
Claude.ai web) will result in non-compliant execution and wasted effort.
```

### New Rule: Prompt File Immutability

```markdown
### Prompt File Immutability
- The sprint prompt file (.md) given to CC by PL/CAI is a SPEC. It is READ-ONLY.
- CC must NEVER modify, overwrite, rename, or delete the sprint prompt file.
- CC's deliverables go in SESSION_CLOSEOUT.md and PROJECT_KNOWLEDGE.md — not the prompt.
- If CC needs to write a summary, incident report, or handoff notes, create a NEW file
  with a distinct name.
- Violation of this rule is HIGH severity and will trigger a session audit.
```

### New Rule: Mandatory Session Closeout

```markdown
### Mandatory Session Closeout
- Every CC session MUST create SESSION_CLOSEOUT.md before ending. No exceptions.
- This applies to hotfix sessions, investigation sessions, and aborted sessions.
- If a session is interrupted or fails, CC must still create a partial closeout:
  - What was attempted
  - What succeeded/failed
  - What state the repo is in
  - What PL needs to do next
- A session without SESSION_CLOSEOUT.md is automatically non-compliant.
```

### New Rule: No Local Dev Environments (strengthened)

```markdown
### No Local Development Environments (Strengthened in v1.3)
- CC must NEVER create virtual environments (venv, .venv, conda, poetry).
- CC must NEVER create docker-compose files, Makefiles, or .env.local files.
- CC must NEVER install packages in isolated environments.
- CC must NEVER set up local testing infrastructure.
- If CC needs a package that isn't installed on PL's machine, CC reports this to PL
  and waits. CC does NOT install it in an isolated environment.
- All testing happens against production URLs on Cloud Run. No exceptions.
- This rule applies even if CC believes local testing would be "faster" or "safer."
```

## B3: Update Version + Changelog

Change the version in the Bootstrap header from v1.2 to v1.3. Add to changelog:

```markdown
| v1.3 | 2026-02-25 | Added: Model Identity Gate (CC must declare model/runtime as first output), Prompt File Immutability rule (sprint prompts are read-only), Mandatory Session Closeout (even failed sessions), Strengthened No Local Dev rule. Triggered by: two CC prompts accidentally run in GPT 5.3, plus non-compliant Greek Import Recovery session. |
```

## B4: Commit Bootstrap v1.3

```powershell
cd "G:\My Drive\Code\Python\project-methodology"
git add templates/CC_Bootstrap_v1.md
git commit -m "v1.3: Bootstrap amendment — model identity gate, prompt immutability, mandatory closeout, no-local-env strengthening"
git push origin main
```

---

# ═══════════════════════════════════════════════════════
# PART C: GREEK IMPORT — SQL DELTA FIX
# ═══════════════════════════════════════════════════════

## C-Phase 0: Verify Prerequisites

You already have the DB password and card count from Part A Phase 0. Now verify:

```powershell
cd "G:\My Drive\Code\Python\Super-Flashcards"

# 1. Is pymssql available?
python -c "import pymssql; print(f'pymssql {pymssql.__version__} available')"
# If not installed: pip install pymssql
# (This is PL's desktop Python, NOT a virtual env — this is acceptable)

# 2. Read the current import script structure
Get-Content "import_greek_single.py" -Head 50

# 3. How does the script currently detect duplicates? Find the Step 2 GET call
Select-String -Path "import_greek_single.py" -Pattern "api/flashcards|existing|GET|duplicat" | Select-Object -First 10

# 4. What CLI args does the script currently support?
Select-String -Path "import_greek_single.py" -Pattern "argparse|add_argument|--" | Select-Object -First 15
```

**STOP and report:**
- Is pymssql available?
- How does the script currently detect duplicates? (API call? Which endpoint?)
- What CLI args exist?
- What does the script structure look like?

---

## C1: Replace API Delta with SQL Delta

Modify `import_greek_single.py` to support three modes for duplicate detection:

### Mode 1: SQL query (new default — fast, handles 800+ cards)

```python
import pymssql

def get_existing_greek_words_sql(db_password):
    """
    Query Cloud SQL directly for existing Greek words.
    Replaces GET /api/flashcards which hangs at 800+ cards.
    """
    conn = pymssql.connect(
        server='35.224.242.223',
        user='flashcards_user',
        password=db_password,
        database='flashcards'
    )
    cursor = conn.cursor()
    cursor.execute('''
        SELECT DISTINCT f.word_or_phrase
        FROM flashcards f
        JOIN languages l ON f.language_id = l.id
        WHERE l.name = 'Greek'
    ''')
    existing = set(row[0] for row in cursor.fetchall())
    conn.close()
    return existing
```

### Mode 2: Pre-computed delta file (skip Step 2 entirely)

If `--delta-file` is provided, read the delta from a file instead of querying anything:

```python
def get_delta_from_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return [line.strip() for line in f if line.strip()]
```

### Mode 3: API query (legacy — for small datasets only)

Keep the existing API-based duplicate detection as a fallback via `--use-api` flag.

### CLI Arguments to Add

```python
parser.add_argument('--db-password', type=str, default=None,
                    help='Cloud SQL password for direct DB delta query (default mode)')
parser.add_argument('--delta-file', type=str, default=None,
                    help='Pre-computed delta file — skip duplicate detection entirely')
parser.add_argument('--use-api', action='store_true',
                    help='Use legacy API-based duplicate detection (slow for 800+ cards)')
parser.add_argument('--dry-run', action='store_true',
                    help='Calculate and display delta without importing')
```

### Password Resolution Order

If neither `--delta-file` nor `--use-api` is set (i.e., SQL mode):
1. `--db-password` CLI argument
2. `DB_PASSWORD` environment variable
3. Interactive prompt (acceptable — this is a local desktop script, not Cloud Run)

**Do NOT hardcode the password.**

### Implementation Logic

```python
# Determine duplicate detection mode
if args.delta_file:
    print(f"[MODE] Delta file: {args.delta_file}")
    delta_words = get_delta_from_file(args.delta_file)
elif args.use_api:
    print("[MODE] Legacy API query (slow for large datasets)")
    existing = get_existing_words_api()  # existing function
    delta_words = [w for w in vocab_words if w not in existing]
else:
    print("[MODE] SQL direct query to Cloud SQL")
    password = args.db_password or os.environ.get('DB_PASSWORD')
    if not password:
        password = input("Enter Cloud SQL password (flashcards_user): ")
    existing = get_existing_greek_words_sql(password)
    delta_words = [w for w in vocab_words if w not in existing]

print(f"  Vocab file: {len(vocab_words)} words")
print(f"  Already imported: {len(vocab_words) - len(delta_words)}")
print(f"  Delta (to import): {len(delta_words)}")

if args.dry_run:
    # Write delta file for future use
    with open('greek_import_delta_remaining.txt', 'w', encoding='utf-8') as f:
        for w in delta_words:
            f.write(w + '\n')
    print(f"  Written to: greek_import_delta_remaining.txt")
    print("  Dry run complete. Exiting.")
    sys.exit(0)
```

### Keep Everything Else Unchanged

- Keep the one-card-at-a-time POST loop (Step 5) — it works fine
- Keep the `request_with_retry()` function if it exists from the previous session
- If `request_with_retry()` does NOT exist, add it (see below)
- Keep `--start-at` flag if it exists
- Keep the 60-second sleep between cards
- Keep log file output

### Retry Logic (add if missing, verify if present)

The POST loop must use retry with exponential backoff:

```python
def request_with_retry(method, url, max_retries=5, **kwargs):
    for attempt in range(max_retries):
        try:
            response = requests.request(method, url, timeout=180, **kwargs)
            if response.status_code >= 500:
                wait = (2 ** attempt) + random.uniform(0, 1)
                print(f"  [RETRY] Server {response.status_code}, wait {wait:.1f}s ({attempt+1}/{max_retries})")
                time.sleep(wait)
                continue
            return response
        except (requests.ConnectionError, requests.Timeout, ConnectionResetError) as e:
            wait = (2 ** attempt) + random.uniform(0, 1)
            print(f"  [RETRY] {type(e).__name__}, wait {wait:.1f}s ({attempt+1}/{max_retries})")
            time.sleep(wait)
    return requests.request(method, url, timeout=180, **kwargs)
```

## C2: Test the Fix

```powershell
cd "G:\My Drive\Code\Python\Super-Flashcards"
$dbpass = gcloud secrets versions access latest --secret=db-password

# Dry run — verify delta calculation
python import_greek_single.py --db-password $dbpass --dry-run
# Expected output:
#   [MODE] SQL direct query to Cloud SQL
#   Vocab file: 1084 words
#   Already imported: ~800
#   Delta (to import): ~250
#   Written to: greek_import_delta_remaining.txt
#   Dry run complete.

# Verify delta file mode also works
python import_greek_single.py --delta-file greek_import_delta_remaining.txt --dry-run
# Expected: reads from file, shows same delta count

# Verify legacy API mode still exists (don't actually run it — it'll hang)
python import_greek_single.py --use-api --dry-run 2>&1 | Select-Object -First 5
# Expected: starts fetching from API (cancel if it hangs — that confirms the bug)
```

## C3: Update PK.md with SQL Delta Info

Append to the Greek Import Status section you created in Part A:

```markdown
## Import Script Modes (added 2026-02-25)
- Default: `--db-password` → SQL query to Cloud SQL (handles 800+ cards)
- Alternative: `--delta-file <file>` → pre-computed delta, skips all queries
- Legacy: `--use-api` → original API GET (hangs at 800+ cards, use only for small sets)
- Dry run: `--dry-run` → shows delta count, writes delta file, no import
```

## C4: Commit Part C

```powershell
cd "G:\My Drive\Code\Python\Super-Flashcards"
git add import_greek_single.py
git commit -m "fix: SQL delta mode for Greek import — replaces hung API GET at 800+ cards"
git push origin main
```

---

# ═══════════════════════════════════════════════════════
# FINAL: SESSION CLOSE-OUT
# ═══════════════════════════════════════════════════════

## Handoff — Three Submissions

```powershell
# Part A: SF Audit
Invoke-WebRequest -Uri "https://metapm.rentyourcio.com/api/uat/submit" `
  -Method POST -ContentType "application/json" `
  -Body '{
    "project": "Super Flashcards",
    "version": "3.0.2",
    "feature": "Session audit: retroactive closeout for non-compliant Greek Import Recovery",
    "status": "passed",
    "total_tests": 6,
    "results_text": "Git state documented, local env cleaned, retroactive closeout created, PK.md updated, prompt files preserved, card count verified via SQL",
    "results": [],
    "tested_by": "cc",
    "notes": "Original session ran in GPT 5.3 (wrong model). Two prompts were overwritten. This audit cleaned up and documented findings."
  }'

# Part B: Bootstrap v1.3
Invoke-WebRequest -Uri "https://metapm.rentyourcio.com/api/uat/submit" `
  -Method POST -ContentType "application/json" `
  -Body '{
    "project": "project-methodology",
    "version": "3.16",
    "feature": "Bootstrap v1.3: model identity gate, prompt immutability, mandatory closeout, no-local-env strengthening",
    "status": "passed",
    "total_tests": 4,
    "results_text": "Four new gates added, version bumped, changelog updated, committed and pushed",
    "results": [],
    "tested_by": "cc",
    "notes": "Triggered by: GPT 5.3 mis-execution of CC prompts + non-compliant Greek Import Recovery session. New model identity gate requires CC to declare model/runtime as first output."
  }'

# Part C: SQL Delta Fix
Invoke-WebRequest -Uri "https://metapm.rentyourcio.com/api/uat/submit" `
  -Method POST -ContentType "application/json" `
  -Body '{
    "project": "Super Flashcards",
    "version": "3.0.2",
    "feature": "Greek import: SQL delta mode replaces hung API GET for 800+ cards",
    "status": "passed",
    "total_tests": 3,
    "results_text": "SQL mode dry-run shows correct delta, delta-file mode works, retry logic present on POST calls",
    "results": [],
    "tested_by": "cc",
    "notes": "Three import modes: --db-password (SQL default), --delta-file (pre-computed), --use-api (legacy). Dry run tested. PL will run live import from desktop terminal."
  }'
```

## Session Closeout Files

Create `SESSION_CLOSEOUT.md` in **BOTH repos**:

### Super-Flashcards/SESSION_CLOSEOUT.md

```markdown
# SESSION CLOSEOUT — Consolidated Audit + SQL Delta Fix
# Date: 2026-02-25
# Model: [CC fill: your model and version]
# Runtime: [CC fill: Claude Code / other]

## Part A: Audit Findings
- [CC fill: what was found in Phase 0]
- [CC fill: what was cleaned up]
- [CC fill: GPT-overwritten files renamed to GPT_Overwrite_*.md]

## Part C: SQL Delta Fix
- import_greek_single.py updated with three modes
- Dry run results: [CC fill: word counts]
- Retry logic: [CC fill: present/added/verified]

## PL Next Steps
1. Run Greek import from PowerShell terminal:
   $dbpass = gcloud secrets versions access latest --secret=db-password
   python import_greek_single.py --db-password $dbpass
2. Estimated time: [CC fill] hours for [CC fill] remaining words
```

### project-methodology/SESSION_CLOSEOUT.md

```markdown
# SESSION CLOSEOUT — Bootstrap v1.3 Amendment
# Date: 2026-02-25
# Model: [CC fill: your model and version]
# Runtime: [CC fill: Claude Code / other]

## Changes
- Bootstrap v1.2 → v1.3
- Added: Model Identity Gate
- Added: Prompt File Immutability rule
- Added: Mandatory Session Closeout rule
- Strengthened: No Local Dev Environments rule

## Triggered By
- Two CC prompts accidentally run in GPT 5.3 instead of Claude Code
- Non-compliant Greek Import Recovery session (no closeout, prompt overwritten, local env)
```

## Update PROJECT_KNOWLEDGE.md in Both Repos

- **SF PK.md**: Greek import status, card count, three import modes, retry logic, "run from PL terminal"
- **PM PK.md**: Bootstrap now v1.3, changelog entry

## Final Git

```powershell
# Super-Flashcards
cd "G:\My Drive\Code\Python\Super-Flashcards"
git add -A
git commit -m "consolidated: audit cleanup + SQL delta import mode + retroactive closeout"
git push origin main

# project-methodology
cd "G:\My Drive\Code\Python\project-methodology"
git add -A
git commit -m "v1.3: Bootstrap amendment — model identity, prompt immutability, mandatory closeout, no-local-env"
git push origin main
```

---

## ✅ Verification Checklist

```powershell
# 1. SF health
Invoke-WebRequest -Uri "https://learn.rentyourcio.com/health" -UseBasicParsing | Select-Object -ExpandProperty Content

# 2. SF git clean
cd "G:\My Drive\Code\Python\Super-Flashcards"
git status

# 3. SF SESSION_CLOSEOUT.md exists
Test-Path "SESSION_CLOSEOUT.md"

# 4. SF retroactive closeout exists
Test-Path "SESSION_CLOSEOUT_Greek_Import_Recovery_Retroactive.md"

# 5. SF PK.md has Greek import status
Select-String -Path "PROJECT_KNOWLEDGE.md" -Pattern "Greek Import Status"

# 6. SF import script has SQL mode
Select-String -Path "import_greek_single.py" -Pattern "pymssql|db-password|delta-file|use-api"

# 7. PM Bootstrap is v1.3
Select-String -Path "G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md" -Pattern "v1\.3|Model Identity|Prompt File Immutability|Mandatory Session Closeout"

# 8. PM git clean
cd "G:\My Drive\Code\Python\project-methodology"
git status

# 9. PM SESSION_CLOSEOUT.md exists
Test-Path "SESSION_CLOSEOUT.md"
```

---

## ⚠️ Rules
- **Print your model identity as your FIRST output.** This is non-negotiable.
- **Do NOT modify this prompt file.** It is READ-ONLY. You are the first session enforcing v1.3.
- **Execute commands and report results.** Do not summarize or rewrite.
- **This session touches TWO repos.** Commit and push both separately.
- **Preserve evidence before cleaning.** Capture git diff BEFORE fixing anything.
- **Do NOT run the live Greek import.** Prepare the script, dry-run it, hand off to PL.
- **SESSION_CLOSEOUT.md is mandatory in BOTH repos.**
- **Do NOT create virtual environments, .env.local, or docker-compose files.**
- **Deploy to Cloud Run and test against production URLs only.**
- **Phase 0 is mandatory. Investigate before acting.**
- **If pymssql is not installed on PL's machine, `pip install pymssql` is acceptable**
  (this is PL's desktop Python, not an isolated env). But do NOT create a venv to install it.
