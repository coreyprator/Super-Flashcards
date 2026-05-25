# CC Sprint: MetaPM — Add Super Flashcards Requirements from PL UAT

## 🚨 BOOTSTRAP GATE
**Read Bootstrap v1.1 FIRST** — located at:
`G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md`

Complete ALL pre-work gates before writing any code:
1. Read `PROJECT_KNOWLEDGE.md`
2. Read `CLAUDE.md`
3. Activate service account
4. State project identity
5. `git pull origin main`
6. Read previous `SESSION_CLOSEOUT.md`

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

**Project**: MetaPM (adding requirements for Super Flashcards)
**Production URL**: https://metapm.rentyourcio.com

### What This Sprint Does
PL ran Super Flashcards v3.0.1 UAT on 2/22/2026. UAT surfaced new requirements and status changes. This is a **data sprint** — insert requirement records and update statuses only. No features built.

---

## 🔧 Requirements

### P0: Update SF-005 Status

SF-005 (Spaced Repetition) was previously marked in_progress or done. PL tested and found SRS is NOT implemented — no sorting, no card ratings. Set SF-005 status back to **backlog** with a note: "PL UAT 2/22/2026: SRS not implemented. Needs membership model before SRS makes sense."

### P1: Insert New Requirements

Query existing SF requirements first to get the current count and highest ID.

Add each of the following. All status: `backlog`. **Insert descriptions VERBATIM.**

---

**SF-014: PIE Root Pronunciation Audio**
Priority: P3
Description: Add a play button next to PIE (Proto-Indo-European) root displays on flashcard detail views. When clicked, play an audio rendering of the PIE root pronunciation. Implementation options: (1) Use phoneme-based text-to-speech — PIE roots use IPA-like notation (*méh₂tēr, *wódr̥, *dyew-) which could be mapped to phoneme sequences and synthesized via Google TTS or a custom phoneme engine. (2) Research publicly available PIE pronunciation dictionaries or audio databases — academic linguistics resources may have recorded reconstructed pronunciations. (3) As a fallback, cobble together phoneme-by-phoneme audio from IPA sound libraries (e.g., UCLA Phonetics Lab archive). The goal is to make PIE roots come alive as sounds, not just symbols. Even approximate pronunciations have educational value. Start with a proof-of-concept on a small set of common roots (*méh₂tēr "mother", *ph₂tḗr "father", *wódr̥ "water", *dyew- "sky") before scaling to all roots.

---

**SF-015: Language Reassignment**
Priority: P2
Description: Allow users to move a flashcard from one language to another via the edit modal. Current problem: PL found Υπολογιστής (a Greek word) filed under English — likely a user error during card creation. The fix: in the card edit modal, add a language dropdown that shows the current language and allows changing it. When saved, the card moves to the new language's collection. The dropdown should list all languages currently in the system (Greek, English, French, Spanish, Italian, German, Portuguese). This is a data correction tool — changing language should only update the language field, not affect the word, definition, PIE root, or any other card data.

---

**SF-016: Error Tracker Fix**
Priority: P3
Description: Browser console shows a resource load error from error-tracker.js at startup: "RESOURCE LOAD FAILED at 0.311s, Resource: https://learn.rentyourcio.com/, Tag: IMG". The error-tracker.js is trying to load an IMG element pointed at the root URL, which returns HTML not an image. Investigate and fix — either the tracker is misconfigured or there's a favicon/image reference that doesn't resolve.

---

### P2: Verify

```bash
curl -s "https://metapm.rentyourcio.com/api/requirements?project=Super Flashcards" | python -m json.tool
```
Verify: SF-005 status is backlog. SF-014, SF-015, SF-016 present. No existing records incorrectly modified.

---

## ✅ Test Commands

```bash
curl -s https://metapm.rentyourcio.com/health | python -m json.tool
curl -s "https://metapm.rentyourcio.com/api/requirements?project=Super Flashcards" | python -m json.tool | grep -c "requirement_id"
```

---

## 📮 Handoff Instructions

```bash
curl -X POST https://metapm.rentyourcio.com/api/uat/submit \
  -H "Content-Type: application/json" \
  -d '{
    "project": "MetaPM",
    "version": "current",
    "feature": "SF data sprint: SF-005 reverted to backlog, SF-014/015/016 added",
    "status": "passed",
    "total_tests": 2,
    "passed": 2,
    "failed": 0,
    "skipped": 0,
    "results_text": "SF-005 status updated to backlog. SF-014 (PIE pronunciation), SF-015 (language reassignment), SF-016 (error tracker) added.",
    "results": [],
    "tested_by": "cc"
  }'
```

---

## 🔒 Session Close-Out

1. Create `SESSION_CLOSEOUT.md`
2. Update `PROJECT_KNOWLEDGE.md`: SF requirement count, SF-005 status, new IDs
3. `git add -A && git commit -m "add SF-014/015/016 from PL UAT, revert SF-005 to backlog [data sprint]"`
4. `git push origin main`

---

## ⚠️ Rules
- **Data sprint only.** Do NOT build any features.
- **Insert descriptions VERBATIM.**
- **Do NOT modify existing requirements** (except SF-005 status change to backlog).
