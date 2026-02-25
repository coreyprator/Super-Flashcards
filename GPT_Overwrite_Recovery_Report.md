# Super Flashcards — Greek Import Failure Summary (for CAI)

## Incident Snapshot
- **Date/Time:** 2026-02-24
- **Project:** Super Flashcards
- **Script:** `import_greek_single.py`
- **Environment:** Windows PowerShell
- **Target API:** `https://learn.rentyourcio.com`
- **Failure Step:** Step 2 (`GET /api/flashcards/` while fetching existing Greek cards)

## Observed Error
The import failed with:
- `ConnectionResetError: [WinError 10054] An existing connection was forcibly closed by the remote host`
- Wrapped by `urllib3.exceptions.ProtocolError` and `requests.exceptions.ConnectionError`

Important detail: the reset happened during TLS handshake/connection setup, before an HTTP status response was returned.

## Root-Cause Assessment
**Most likely cause:** transient transport-level reset (network edge / LB / upstream connection interruption), not an application-layer auth failure.

Why:
1. Error type is TCP/TLS reset (`10054`), not auth rejection.
2. No `401`/`403` HTTP response was observed.
3. Direct health probe succeeded from the same machine:
   - `Invoke-WebRequest https://learn.rentyourcio.com/health` returned `200`.
4. Import script path uses plain `requests` calls; no `gcloud` token generation/Bearer header usage in the failing code path.

## Answer to the Auth Question
**Is this likely expired `gcloud auth login`?**
- **No, very unlikely for this incident.**
- The failing script path does not depend on `gcloud auth` tokens, and the failure signature is transport reset rather than auth denial.

## Changes Applied
File updated: `Super-Flashcards/import_greek_single.py`

### What was added
- Resilient HTTP helper with bounded retries:
  - `RETRY_ATTEMPTS = 5`
  - exponential backoff (`2, 4, 8, ...`) + small jitter
  - retries on transient `requests.Timeout` and `requests.ConnectionError`
- Both critical calls now use retry wrapper:
  1. `GET /api/flashcards/` (existing-card scan)
  2. `POST /api/ai/batch-generate` (single-word import)

### Why
Prevents one-off TLS/TCP resets from aborting the entire import run.

## Validation Performed
- Endpoint reachability check: **pass** (`/health` => HTTP `200`)
- Static check of edited script: **pass** (no diagnostics errors reported)

## Suggested CAI Follow-up
1. Verify whether edge infrastructure (Cloud Run / proxy / LB) shows sporadic connection resets around the failure timestamp.
2. Optionally apply the same retry pattern to `import_greek_vocab.py` for consistency.
3. Confirm production logs around Step 2 request window for any upstream reset/termination signals.

## Current Conclusion
- Incident is best classified as **transient network/transport reset**.
- **Not** a confirmed `gcloud auth` expiration problem.
- Import script now has retry resilience to reduce recurrence impact.
