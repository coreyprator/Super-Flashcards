===================================================
PROMPT BUILDER DRAFT — REQUIRES CAI COMPLETION
This is NOT a ready-to-fire CC prompt.
Paste this entire document into your SF CAI session.
CAI will replace all [UNVERIFIED] items with real
portfolio data and post SF10 to MetaPM.
===================================================

---CAI HANDOFF START---
PROMPT BUILDER DRAFT — REQUIRES CAI COMPLETION

Project: Super Flashcards
Intended sprint: SF10
Template type: Diagnosis + Feature

WARNING: Items marked [UNVERIFIED] were generated without portfolio context
and must be replaced before this prompt is fired to CC.
Do not pass [UNVERIFIED] assertions to CC.

CAI ACTION REQUIRED:
1. Read session-context-sf to confirm current version, open bugs, and
   post-SF09 pass rate on the IPA regression harness
2. Query code_files to find the PIE-to-IPA conversion function,
   the test page template, and the audio generation pipeline
3. Check whether the sed.mp3 quality bug (flagged in HM40 UAT 2026-04-14)
   is already seeded in the SF backlog — if not, seed it now
4. Replace every [UNVERIFIED] with a verified value from code_files,
   execute_sql_query, or live endpoint testing
5. Write all BVs as real executable PowerShell/Invoke-RestMethod commands
   — no JavaScript assertions, no invented cmdlets
6. Assign PTH via get_challenge
7. Confirm current version from session-context-sf
8. Create handoff shell via create_handoff_shell
9. Post final prompt to MetaPM via post_prompt
10. Deliverable: ready-to-fire SF10 CC prompt posted to MetaPM

---CAI HANDOFF END---

---

## STRUCTURED INTENT — SF10: PIE-IPA Post-SF09 Diagnosis and Audio Comparison

### Background

SF09 shipped fixes for BUG-008 (strip_final_laryngeal overstripping),
BUG-009 (capital H unrecognized), and BUG-010 (diphthong e→ɛ mapping).
The regression harness at learn.rentyourcio.com/pie-ipa-test now shows
a new baseline pass rate.
[UNVERIFIED — CAI: query live test page or session-context-sf for
current post-SF09 pass rate]

SF10 has two goals:
1. Diagnose the failures that remain after SF09
2. Add a side-by-side audio comparison UI to the test page

---

### Goal 1 — Diagnose remaining failures

After SF09, there are still non-passing test cases.
[UNVERIFIED — CAI: check pie-ipa-test results for current fail/partial count]

For each remaining failure, CC must:
- Identify the exact transformation step where the algorithm diverges
- Show the character-level diff between expected IPA and produced IPA
- Group failures by pattern (e.g. laryngeal handling, vowel mapping,
  consonant clusters, word-final rules)
- Produce a root cause report as part of the handoff

The grading system is already implemented (pass / partial / fail with %).
CC should use it as-is.
[UNVERIFIED — CAI: confirm grading system file path in code_files]

---

### Goal 2 — Audio comparison UI on test page

Existing test table at learn.rentyourcio.com/pie-ipa-test:
```
# | Root | Gloss | Category | Wiktionary IPA | Our IPA | Status
```
[UNVERIFIED — CAI: confirm exact column structure by querying code_files
for the test page template]

**Add to each row:**

After Wiktionary IPA column:
- Audio button — plays Wiktionary reference pronunciation for that root
- Source: existing Wiktionary audio URLs already used in the PIE pipeline
  [UNVERIFIED — CAI: find the Wiktionary audio URL pattern in code_files]

After Our IPA column:
- Audio button — plays our algorithm's generated pronunciation
- Source: ElevenLabs Josh voice (TxGEqnHWrfWFTfGW9XjX, eleven_monolingual_v1)
  [UNVERIFIED — CAI: confirm voice ID from session-context-sf]
- Phoneme-level diff display showing specific mismatches for that root
- Match percentage (e.g. "84% match")

**BA41 instrumentation required** — audio buttons are wired interactions.
Chain to instrument:
- Audio button click fired
- Audio source URL fetched
- Playback started
- Phoneme diff API called (if separate endpoint)
- Diff result rendered

---

### Known bug — HIGH PRIORITY — must be in SF10

The audio for *sed- /sɛd/ is poor quality.
GCS reference: https://storage.googleapis.com/super-flashcards-media/pie-audio/sed.mp3
Flagged in HM40 general notes 2026-04-14.
[UNVERIFIED — CAI: check SF backlog for existing BUG code for this.
If not seeded, call post_requirement now before building the prompt]

---

### Integration scope — spec only, no wiring

PIE audio will eventually integrate into EFG and Etymython.
This sprint defines the API contract only — no deployment to those systems.
[UNVERIFIED — CAI: check if REQ-010 or any existing SF requirement
already covers this scope, or if it needs a new requirement code]

---

### Acceptance criteria (PL intent — CAI must convert to executable BVs)

- Algorithm diagnosis report present in handoff — root causes identified
  for all remaining non-passing test cases
  [UNVERIFIED — CAI: define what "present" means as a BV assertion,
  e.g. handoff machine_tests field contains failure_analysis JSON]

- Audio buttons appear on test page for both IPA columns
  [UNVERIFIED — CAI: Invoke-RestMethod GET learn.rentyourcio.com/pie-ipa-test
  and grep response for audio button selectors]

- Clicking Our IPA button plays audio via ElevenLabs
  [UNVERIFIED — CAI: define chain BV with BA41 debug trace as cc_evidence]

- Phoneme diff displays for at least one known failure root
  [UNVERIFIED — CAI: pick a specific root from current failures as test case]

- *sed- audio quality improved
  [UNVERIFIED — CAI: define BV — GET GCS URL returns audio, or
  confirm new file generated and uploaded]

- BA41 debug trace present as cc_evidence for all audio button chain BVs

---

### Out of scope

- Mobile
- Multi-user
- Actual integration deployment to EFG or Etymython (spec only)
- Any changes to the flashcard UI outside the test page

---

### Questions PL answered

Q: One sprint or split by dependency?
A: One sprint. No forced split.

Q: BA41 instrumentation required?
A: Yes — audio buttons are wired interactions.

Q: Target pass rate after SF10?
A: 85%+ overall
[UNVERIFIED — CAI: confirm feasibility given remaining failure patterns]

---

## FOR CAI — Suggested lookup queries

```sql
-- Find PIE-to-IPA conversion function
SELECT file_path, LEFT(content, 500) as preview
FROM code_files
WHERE app = 'super-flashcards'
AND content LIKE '%pie_ipa%'
AND file_path LIKE '%.py%'

-- Find test page template
SELECT file_path FROM code_files
WHERE app = 'super-flashcards'
AND file_path LIKE '%pie-ipa-test%'

-- Check sed bug already seeded
SELECT code, title, status FROM roadmap_requirements r
JOIN roadmap_projects p ON r.project_id = p.id
WHERE p.code = 'SF'
AND (r.title LIKE '%sed%' OR r.description LIKE '%sed.mp3%')

-- Current post-SF09 open requirements
SELECT code, title, status, priority FROM roadmap_requirements r
JOIN roadmap_projects p ON r.project_id = p.id
WHERE p.code = 'SF'
AND r.status NOT IN ('done', 'closed')
ORDER BY r.priority, r.updated_at DESC
```
