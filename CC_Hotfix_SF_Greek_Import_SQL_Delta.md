# Super Flashcards — Greek Import SQL Delta Assessment (for CAI)

## Purpose
Assess whether the Greek import failure was caused by API delta retrieval scale limits, and whether a SQL-delta workaround is required.

## Executive Findings
- The observed crash was a **transport-level TLS reset** (`WinError 10054`) during Step 2 API retrieval, not a confirmed payload-size timeout.
- A direct service health check from the same machine returned **HTTP 200** (`/health`), indicating service reachability.
- The failing script path does **not** use `gcloud` token auth; this incident is unlikely to be auth-expiry related.
- A retry hardening patch was applied to the importer, which should mitigate transient resets without introducing SQL coupling.

## What Was Suspected
Potential hypothesis: `GET /api/flashcards` for Greek cards became too large and caused hangs/timeouts, suggesting SQL direct-read as replacement for duplicate detection.

## What Was Actually Verified
1. Failure signature was `ConnectionResetError` during TLS connection setup.
2. No HTTP `401/403/5xx` response body captured at failure point.
3. Service endpoint is reachable (`/health` success).
4. Existing script architecture currently relies on API-only flow for duplicate detection and import posts.

## Current Risk Assessment
- **High confidence:** transient network/proxy/edge reset occurred at request establishment.
- **Medium confidence:** large payload may still be a latent performance concern, but it was **not proven** as root cause in this incident.
- **Low confidence:** SQL delta replacement is necessary immediately for recovery; retry may be sufficient for now.

## Code Change Already Applied
File: `Super-Flashcards/import_greek_single.py`
- Added bounded retry wrapper with exponential backoff + jitter.
- Applied to both:
  - `GET /api/flashcards/` (existing-card scan)
  - `POST /api/ai/batch-generate` (single-word import)

## Recommendation to CAI
1. **Primary:** keep API flow + retry patch as the active recovery path.
2. **Investigate before SQL migration:**
   - Measure Step 2 latency and response size for Greek dataset.
   - Confirm whether server-side pagination/limits are operating as expected.
   - Inspect upstream/LB logs around failure timestamp for connection resets.
3. **Only if evidence supports scale issue:**
   - Implement optional SQL-delta mode behind explicit flag.
   - Keep API mode as default to avoid introducing direct DB credential handling in local scripts.

## Proposed Decision Gate
Adopt SQL delta mode only if at least one of the following is true:
- Step 2 reproducibly fails due to response size/timeout despite retries.
- API pagination is broken or cannot be corrected quickly.
- Operational urgency requires deterministic local fallback and CAI approves DB-access tradeoffs.

## Open Questions for CAI
- Were there Cloud Run/LB reset events at incident timestamp?
- What is the observed payload size and end-to-end duration for Greek Step 2 retrieval?
- Is API pagination returning full data reliably with current `limit/offset` values?

## Bottom Line
This incident is best explained by transient connection reset, not proven SQL-delta necessity. Retry hardening is in place; SQL-delta should be treated as a contingency path pending CAI evidence review.
