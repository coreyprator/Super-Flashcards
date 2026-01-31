# CLAUDE.md - Super-Flashcards AI Instructions

> ⚠️ **READ THIS ENTIRE FILE** before writing any code or running any commands.
> **DO NOT** invent or guess infrastructure values. Use EXACT values below.

---

## Project Identity

| Field | Value |
|-------|-------|
| Project Name | Super-Flashcards |
| Description | French vocabulary learning with spaced repetition and pronunciation |
| Repository | https://github.com/coreyprator/Super-Flashcards |
| Local Path | G:\My Drive\Code\Python\Super-Flashcards |
| Methodology | [coreyprator/project-methodology](https://github.com/coreyprator/project-methodology) v3.14 |

---

## GCP Infrastructure (EXACT VALUES - DO NOT GUESS)

| Resource | Value |
|----------|-------|
| GCP Project ID | `super-flashcards-475210` |
| Region | `us-central1` |
| Cloud Run Service | `super-flashcards` |
| Cloud Run URL | `https://super-flashcards-wmrla7fhwa-uc.a.run.app` |
| Cloud SQL Instance | `flashcards-db` |
| Cloud SQL IP | `35.224.242.223` |
| Database Name | `LanguageLearning` |

### Verification Commands
```powershell
# Always verify correct project before ANY gcloud command
gcloud config get-value project
# Must output: super-flashcards-475210

# If wrong:
gcloud config set project super-flashcards-475210
```

---

## Deployment

### Deploy Command
```powershell
cd "G:\My Drive\Code\Python\Super-Flashcards"
gcloud run deploy super-flashcards --source . --region us-central1 --allow-unauthenticated
```

### View Logs
```powershell
gcloud run logs read super-flashcards --region=us-central1 --limit=50
```

---

## Secret Manager

| Secret Name | Purpose |
|-------------|---------|
| `db-password` | Database password (sqlserver user) |
| `google-oauth-client-secret` | Google OAuth for authentication |
| `ELEVENLABS_API_KEY` | ElevenLabs API for pronunciation |
| `GEMINI_API_KEY` | Gemini API |
| `openai-api-key` | OpenAI API |

### Access Secret
```powershell
gcloud secrets versions access latest --secret="db-password"
```

---

## SQL Connectivity
```powershell
# Connect via sqlcmd
sqlcmd -S 35.224.242.223,1433 -U sqlserver -P "$(gcloud secrets versions access latest --secret='db-password')" -d LanguageLearning

# Quick test
sqlcmd -S 35.224.242.223,1433 -U sqlserver -P "$(gcloud secrets versions access latest --secret='db-password')" -d LanguageLearning -Q "SELECT TOP 5 * FROM INFORMATION_SCHEMA.TABLES"
```

---

## Compliance Directives

### Before ANY Work (LL-045)
1. ✅ Read this entire CLAUDE.md file
2. ✅ State what you learned: "Service is super-flashcards, database is LanguageLearning"
3. ❌ Never invent infrastructure values

### Before ANY Handoff (LL-030, LL-049)
1. ✅ Deploy code (you own deployment)
2. ✅ Run tests: `pytest tests/ -v`
3. ✅ Verify deployment with PINEAPPLE test
4. ✅ Include test output in handoff
5. ❌ Never say "complete" without proof

### Locked Vocabulary (LL-049)
These words require proof (deployed revision + test output):
- "Complete" / "Done" / "Finished" / "Ready"
- "Implemented" / "Fixed" / "Working"
- ✅ emoji next to features

Without proof, say: "Code written. Pending deployment and testing."

### Forbidden Phrases
- ❌ "Test locally" (no localhost exists)
- ❌ "Let me know if you want me to deploy" (you own deployment)
- ❌ "Please run this command" (you run commands)

---

## PINEAPPLE Test (LL-044)

Before debugging ANY deployment issue:
1. Add `"canary": "PINEAPPLE-99999"` to /health endpoint
2. Deploy
3. Verify: `curl https://super-flashcards-wmrla7fhwa-uc.a.run.app/health` shows PINEAPPLE
4. If missing → deployment failed, fix that first

---

## Current Status

- **Sprint 8.5**: Pronunciation Practice bug fixes
- **Features**: Spaced repetition, Google OAuth, pronunciation feedback

---

**Last Updated**: 2026-01-31
**Methodology Version**: 3.14
