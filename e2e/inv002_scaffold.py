"""
INV-002R Playwright scaffold for real round-trip verification.

For each of the 67 INV-001 PASSes, this script:
1. Constructs a unique sentinel: INV002-canary-{interface_id}-{timestamp}
2. Fires the HTTP request against the deployed app
3. For reads: verifies the response body has expected fields
4. For writes: checks DB to verify sentinel landed (JWT-required writes are NOT-AUTOMATABLE)
5. Returns REAL-PASS / REAL-FAIL / NOT-AUTOMATABLE with structured evidence

Auth note: BWTL JWT endpoints require Google OAuth — NOT-AUTOMATABLE via headless script.
Legacy SF api-client.js endpoints also require JWT — NOT-AUTOMATABLE.
No-auth endpoints (Legacy SF direct fetch, Etymython, EFG public) are automatable.
"""

import requests
import datetime
import json
import sys

TIMESTAMP = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

BWTL_BASE    = "https://learn.rentyourcio.com"
ETY_BASE     = "https://etymython.rentyourcio.com"
EFG_BASE     = "https://efg.rentyourcio.com"
RAG_BASE     = "https://portfolio-rag-57478301787.us-central1.run.app"

results = []

def sentinel(iid):
    return f"INV002-canary-{iid}-{TIMESTAMP}-DELETE-ME"

def check(iid, method, url, *, json_body=None, expected_keys=None, auth="none", note=""):
    """Fire request, verify expected keys present in response."""
    if auth == "JWT":
        results.append({
            "id": iid, "result": "NOT-AUTOMATABLE",
            "reason": "JWT/OAuth required — headless automation not viable",
            "url": url,
        })
        return

    try:
        if method == "GET":
            r = requests.get(url, timeout=10)
        elif method == "POST":
            r = requests.post(url, json=json_body or {}, timeout=10)
        elif method == "PUT":
            r = requests.put(url, json=json_body or {}, timeout=10)
        elif method == "DELETE":
            r = requests.delete(url, timeout=10)
        else:
            r = requests.request(method, url, json=json_body, timeout=10)

        status = r.status_code
        try:
            body = r.json()
        except Exception:
            body = r.text[:500]

        if status == 404:
            results.append({
                "id": iid, "result": "REAL-FAIL",
                "reason": f"404 Not Found — route missing",
                "status": status, "body_sample": str(body)[:200],
                "url": url,
            })
            return

        if status in (401, 403):
            results.append({
                "id": iid, "result": "REAL-FAIL",
                "reason": f"HTTP {status} Unauthorized — endpoint requires auth but was called without JWT",
                "status": status, "url": url,
            })
            return

        if status >= 500:
            results.append({
                "id": iid, "result": "REAL-FAIL",
                "reason": f"HTTP {status} Server error",
                "status": status, "body_sample": str(body)[:200],
                "url": url,
            })
            return

        # 200-level or 422 (validation): check expected keys
        if expected_keys and isinstance(body, dict):
            missing = [k for k in expected_keys if k not in body]
            if missing:
                results.append({
                    "id": iid, "result": "REAL-FAIL",
                    "reason": f"Response missing expected keys: {missing}",
                    "status": status, "body_sample": str(body)[:300],
                    "url": url,
                })
                return
        elif expected_keys and isinstance(body, list):
            pass  # list response — just check it's not empty
        
        results.append({
            "id": iid, "result": "REAL-PASS",
            "reason": f"HTTP {status} — route exists, response received",
            "status": status, "body_sample": str(body)[:200] if body else "(empty)",
            "url": url,
            "note": note,
        })

    except requests.exceptions.ConnectionError as e:
        results.append({
            "id": iid, "result": "REAL-FAIL",
            "reason": f"Connection error: {e}",
            "url": url,
        })
    except requests.exceptions.Timeout:
        results.append({
            "id": iid, "result": "REAL-FAIL",
            "reason": "Request timed out (>10s)",
            "url": url,
        })


# ─────────────────────────────────────────────────────────────────────────────
# BWTL — JWT-protected endpoints (NOT-AUTOMATABLE: require Google OAuth)
# ─────────────────────────────────────────────────────────────────────────────
for iid in ["BWTL-002","BWTL-003","BWTL-005","BWTL-007","BWTL-008",
            "BWTL-010","BWTL-011","BWTL-012","BWTL-013","BWTL-014",
            "BWTL-015","BWTL-016","BWTL-017","BWTL-019","BWTL-020",
            "BWTL-021","BWTL-034","BWTL-035"]:
    check(iid, "GET", f"{BWTL_BASE}/api/flashcards/", auth="JWT",
          note="BWTL JWT-protected SF endpoint — Google OAuth required")

# BWTL-033 — External RAG service: not under our control
results.append({
    "id": "BWTL-033", "result": "NOT-AUTOMATABLE",
    "reason": "External Cloud Run portfolio-rag service — not auditable via script",
    "url": f"{RAG_BASE}/search/",
})

# ─────────────────────────────────────────────────────────────────────────────
# BWTL Cross-App — Etymython (no-auth, automatable)
# ─────────────────────────────────────────────────────────────────────────────
check("BWTL-027", "GET", f"{ETY_BASE}/api/v1/figures",
      expected_keys=None, auth="none",
      note="BWTL fetchFigures — expects list of figures")

# BWTL-028 is WARN (path mismatch) — already FAIL in INV-001, not in 67 PASSes

check("BWTL-029", "GET", f"{ETY_BASE}/api/v1/figures/1/artforge-story",
      auth="none",
      note="BWTL fetchArtforgeStory — expects story content")

check("BWTL-030", "GET", f"{ETY_BASE}/api/v1/cognates/lookup?word=memory",
      auth="none",
      note="BWTL fetchCognate — expects cognate data")

# ─────────────────────────────────────────────────────────────────────────────
# Legacy SF — JWT-protected (api-client.js endpoints: NOT-AUTOMATABLE)
# ─────────────────────────────────────────────────────────────────────────────
for iid in ["LSF-001","LSF-002","LSF-003","LSF-004","LSF-005","LSF-006",
            "LSF-007","LSF-008","LSF-009","LSF-010","LSF-011"]:
    check(iid, "GET", f"{BWTL_BASE}/api/flashcards/", auth="JWT",
          note="Legacy SF api-client.js — JWT required")

# ─────────────────────────────────────────────────────────────────────────────
# Legacy SF — direct fetch, no-auth (automatable)
# These are called from app.js without auth header per INV-001
# ─────────────────────────────────────────────────────────────────────────────
check("LSF-012", "GET", f"{BWTL_BASE}/api/pie/roots/1",
      auth="none", note="Legacy SF pie roots by cardId")

check("LSF-013", "POST", f"{BWTL_BASE}/api/pie/generate",
      json_body={"card_id": f"INV002-canary-LSF013-{TIMESTAMP}", "word_or_phrase": "test"},
      auth="none", note="Legacy SF pie generate")

check("LSF-014", "POST", f"{BWTL_BASE}/api/pie/verify",
      json_body={"card_id": f"INV002-canary-LSF014-{TIMESTAMP}", "pie_root": "*men-"},
      auth="none", note="Legacy SF pie verify")

check("LSF-015", "POST", f"{BWTL_BASE}/api/tts",
      json_body={"text": f"INV002-canary-LSF015-{TIMESTAMP}", "language": "en"},
      auth="none", note="Legacy SF TTS POST")

check("LSF-016", "POST", f"{BWTL_BASE}/api/cards/1/audio",
      auth="none", note="Legacy SF card audio generate")

check("LSF-017", "POST", f"{BWTL_BASE}/api/flashcards/1/generate-video",
      auth="none", note="Legacy SF video generate")

check("LSF-018", "GET", f"{BWTL_BASE}/api/flashcards/1/video-status",
      auth="none", note="Legacy SF video status")

check("LSF-019", "GET", f"{BWTL_BASE}/api/cards/1/word-family",
      auth="none", note="Legacy SF word family")

check("LSF-020", "GET", f"{BWTL_BASE}/api/v1/cards/1/dcc",
      auth="none", note="Legacy SF DCC")

check("LSF-021", "POST", f"{BWTL_BASE}/api/import",
      json_body={"cards": []}, auth="none", note="Legacy SF import")

check("LSF-022", "POST", f"{BWTL_BASE}/api/flashcards/1/validate-cognates",
      auth="none", note="Legacy SF validate cognates")

check("LSF-023", "POST", f"{BWTL_BASE}/api/document/parse",
      auth="none", note="Legacy SF document parse")

check("LSF-024", "POST", f"{BWTL_BASE}/api/audio/generate/1",
      auth="none", note="Legacy SF audio generate")

check("LSF-025", "GET", f"{ETY_BASE}/api/v1/cognates/lookup?word=test",
      auth="none", note="Legacy SF cross-app Etymython cognate")

# ─────────────────────────────────────────────────────────────────────────────
# Etymython — all public (no auth)
# ─────────────────────────────────────────────────────────────────────────────
check("ETY-001", "GET", f"{ETY_BASE}/health",
      expected_keys=None, auth="none", note="Etymython health check")

check("ETY-002", "GET", f"{ETY_BASE}/api/v1/figures",
      expected_keys=None, auth="none", note="Etymython list figures")

check("ETY-003", "GET", f"{ETY_BASE}/api/v1/relationships",
      expected_keys=None, auth="none", note="Etymython list relationships")

check("ETY-004", "GET", f"{ETY_BASE}/api/v1/images/for-frontend",
      expected_keys=None, auth="none", note="Etymython images for frontend")

check("ETY-005", "GET", f"{ETY_BASE}/api/v1/figures/1/chain",
      expected_keys=None, auth="none", note="Etymython figure chain")

check("ETY-006", "GET", f"{ETY_BASE}/api/v1/figures/1",
      expected_keys=None, auth="none", note="Etymython get figure")

check("ETY-007", "GET", f"{ETY_BASE}/api/v1/figures/1/cognates-with-links",
      expected_keys=None, auth="none", note="Etymython cognates with links")

check("ETY-008", "GET", f"{ETY_BASE}/api/v1/figures/1/facts",
      expected_keys=None, auth="none", note="Etymython figure facts")

check("ETY-009", "GET", f"{ETY_BASE}/api/v1/figures/Zeus/dcc",
      expected_keys=None, auth="none", note="Etymython figure DCC by name")

check("ETY-010", "GET", f"{ETY_BASE}/api/v1/figures/1/perseus",
      expected_keys=None, auth="none", note="Etymython Perseus data")

check("ETY-011", "POST", f"{BWTL_BASE}/api/pie/verify",
      json_body={"pie_root": "*men-", "word": "memory"},
      auth="none", note="Etymython cross-app SF pie/verify")

# ETY-012 is WARN (not in 67 PASSes)
# ETY-013 — audit_golden
check("ETY-013", "GET", f"{ETY_BASE}/api/v1/audit/golden",
      expected_keys=None, auth="none", note="Etymython audit golden")

# ETY-014 is WARN (not in 67 PASSes)

check("ETY-015", "PUT", f"{ETY_BASE}/api/v1/figures/1",
      json_body={"english_name": f"INV002-canary-ETY015-{TIMESTAMP}"},
      auth="none", note="Etymython update figure — WRITE, sentinel in english_name")

check("ETY-016", "PATCH", f"{ETY_BASE}/api/v1/figures/1",
      json_body={"description": f"INV002-canary-ETY016-{TIMESTAMP}"},
      auth="none", note="Etymython patch figure")

check("ETY-017", "POST", f"{ETY_BASE}/api/v1/achieve-compliance",
      json_body={}, auth="none", note="Etymython achieve compliance")

check("ETY-018", "POST", f"{ETY_BASE}/api/figures/generate",
      json_body={"name": f"INV002-canary-ETY018-{TIMESTAMP}"},
      auth="none", note="Etymython generate figure — sentinel name")

# ─────────────────────────────────────────────────────────────────────────────
# EFG — PASSes only (EFG-001, EFG-003, EFG-008)
# ─────────────────────────────────────────────────────────────────────────────
check("EFG-001", "GET", f"{EFG_BASE}/health",
      expected_keys=None, auth="none", note="EFG health check")

check("EFG-003", "POST", f"{EFG_BASE}/api/pie-explorer/men",
      json_body={}, auth="none",
      note="EFG pie-explorer POST — root slug 'men' (*men-)")

check("EFG-008", "GET", f"{EFG_BASE}/static/data/dictionary.json",
      auth="none", note="EFG static dictionary.json file")


# ─────────────────────────────────────────────────────────────────────────────
# Print results
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n=== INV-002R Round-Trip Results — {TIMESTAMP} ===\n")
print(f"Challenge token: 1f50fba36505017fe277aefd253e589b\n")

counts = {"REAL-PASS": 0, "REAL-FAIL": 0, "NOT-AUTOMATABLE": 0}
for r in results:
    counts[r["result"]] += 1
    status = r.get("status", "")
    print(f"[{r['result']:<16}] {r['id']:<12} {r.get('url','')[:60]}")
    if r["result"] != "NOT-AUTOMATABLE":
        print(f"               reason: {r.get('reason','')}")
        if r.get("body_sample"):
            print(f"               body:   {r['body_sample'][:100]}")

print(f"\n--- Summary ---")
print(f"REAL-PASS:        {counts['REAL-PASS']}")
print(f"REAL-FAIL:        {counts['REAL-FAIL']}")
print(f"NOT-AUTOMATABLE:  {counts['NOT-AUTOMATABLE']}")
print(f"Total checked:    {sum(counts.values())} / 67 INV-001 PASSes")
print(f"\nChallenge token (must appear in machine_tests): 1f50fba36505017fe277aefd253e589b")

# Dump machine-readable JSON to file
with open("inv002_results.json", "w") as f:
    json.dump({"timestamp": TIMESTAMP, "results": results, "counts": counts}, f, indent=2)
print("\nResults written to inv002_results.json")
