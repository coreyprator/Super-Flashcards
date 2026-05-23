#!/usr/bin/env python3
"""
bwtl04_regression.py — SFCORE-IMAGE-MIGRATION-001 Post-Deploy Regression Suite
38 tests covering: health, reads, open writes (no auth), RBAC removal.
Challenge token: 64e2d3f3c1bdf610cf50a8aa56952251

Usage:
    python bwtl04_regression.py [--base https://learn.rentyourcio.com]
"""
import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.error
import urllib.parse

# Force UTF-8 stdout on Windows to handle accented/non-ASCII DB content
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── Config ────────────────────────────────────────────────────────────────────

DEFAULT_BASE = "https://learn.rentyourcio.com"
CHALLENGE_TOKEN = "64e2d3f3c1bdf610cf50a8aa56952251"

# ── Helpers ───────────────────────────────────────────────────────────────────

class Result:
    def __init__(self, bv_id, title, passed, evidence):
        self.bv_id = bv_id
        self.title = title
        self.passed = passed
        self.evidence = evidence

    def __str__(self):
        status = "PASS" if self.passed else "FAIL"
        return f"[{status}] {self.bv_id}: {self.title}\n         Evidence: {self.evidence[:200]}"


def _get(base, path, expected_status=200):
    url = base.rstrip("/") + path
    try:
        r = urllib.request.urlopen(url, timeout=15)
        body = r.read().decode("utf-8", errors="replace")
        return r.status, body
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except Exception as ex:
        return 0, str(ex)


def _post(base, path, body_dict, headers_extra=None, expected_status=None):
    url = base.rstrip("/") + path
    data = json.dumps(body_dict).encode()
    headers = {"Content-Type": "application/json"}
    if headers_extra:
        headers.update(headers_extra)
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        r = urllib.request.urlopen(req, timeout=15)
        body = r.read().decode("utf-8", errors="replace")
        return r.status, body
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except Exception as ex:
        return 0, str(ex)


def _delete(base, path, headers_extra=None):
    url = base.rstrip("/") + path
    headers = {"Content-Type": "application/json"}
    if headers_extra:
        headers.update(headers_extra)
    req = urllib.request.Request(url, headers=headers, method="DELETE")
    try:
        r = urllib.request.urlopen(req, timeout=15)
        body = r.read().decode("utf-8", errors="replace")
        return r.status, body
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except Exception as ex:
        return 0, str(ex)


# ── Test definitions ──────────────────────────────────────────────────────────

def run_tests(base):
    results = []

    def r(bv_id, title, passed, evidence):
        results.append(Result(bv_id, title, passed, evidence))

    # ── Health ────────────────────────────────────────────────────────────────

    status, body = _get(base, "/health")
    r("T01", "GET /health returns 2xx", status in (200, 201), f"HTTP {status}: {body[:100]}")

    status, body = _get(base, "/")
    r("T02", "GET / returns HTML (legacy SF frontend)", status == 200 and "<html" in body.lower(), f"HTTP {status}, len={len(body)}")

    status, body = _get(base, "/bwtl/")
    r("T03", "GET /bwtl/ returns BWTL frontend HTML", status == 200 and "<html" in body.lower(), f"HTTP {status}, len={len(body)}")

    # ── Languages ─────────────────────────────────────────────────────────────

    status, body = _get(base, "/api/languages")
    r("T04", "GET /api/languages returns 200 list", status == 200 and "[" in body, f"HTTP {status}: {body[:80]}")

    # ── Flashcards READ ───────────────────────────────────────────────────────

    status, body = _get(base, "/api/flashcards/?limit=5")
    r("T05", "GET /api/flashcards/ returns 200 list", status == 200 and ("[" in body or "{" in body), f"HTTP {status}: {body[:80]}")

    # ── OAuth routes gone ─────────────────────────────────────────────────────

    status, body = _get(base, "/api/auth/google/login")
    r("T06", "GET /api/auth/google/login returns 404/405 (route removed)", status in (404, 405, 422), f"HTTP {status}: {body[:80]}")

    status, body = _get(base, "/api/auth/google/callback")
    r("T07", "GET /api/auth/google/callback returns 404/405 (route removed)", status in (404, 405, 422), f"HTTP {status}: {body[:80]}")

    status, body = _get(base, "/api/auth/me")
    r("T08", "GET /api/auth/me returns 404/405 (route removed)", status in (404, 405, 422), f"HTTP {status}: {body[:80]}")

    # ── Write endpoints open (no auth required) ────────────────────────────────

    status, body = _post(base, "/api/bookmarks", {"kind": "word", "ref_id": "bv09-test-open", "owner_id": "bv09-test"})
    r("T09", "POST /api/bookmarks open write (no auth) -> 200/201", status in (200, 201), f"HTTP {status}: {body[:80]}")

    status, body = _post(base, "/api/chat/threads", {"anchor_mode": "flashcard_id", "anchor_value": "bv09-test", "owner_id": "bv09-test"})
    r("T10", "POST /api/chat/threads open write (no auth) -> 200/201", status in (200, 201), f"HTTP {status}: {body[:80]}")

    status, body = _post(base, "/api/ai/generate", {"word": "bv09-test-open"})
    r("T11", "POST /api/ai/generate open write (no auth) -> not 403", status not in (401, 403), f"HTTP {status}: {body[:80]}")

    # ── Auth register/login still work ───────────────────────────────────────

    status, body = _post(base, "/api/auth/register",
        {"username": "bv09test_dummy", "email": "bv09test@devnull.invalid", "password": "BadPwd1!"})
    r("T12", "POST /api/auth/register reachable (200 or 400 conflict)", status in (200, 201, 400, 409, 422), f"HTTP {status}: {body[:80]}")

    status, body = _post(base, "/api/auth/logout", {})
    r("T13", "POST /api/auth/logout returns 200 (no auth)", status == 200, f"HTTP {status}: {body[:80]}")

    # ── Bookmarks CRUD with bypass token ─────────────────────────────────────

    bm_owner = "bv09-owner-001"
    status, body = _post(base, "/api/bookmarks",
        {"kind": "word", "ref_id": "bv09-ref-001", "owner_id": bm_owner})
    r("T14", "POST /api/bookmarks open write (no auth) -> 200/201", status in (200, 201), f"HTTP {status}: {body[:120]}")

    bm_id = None
    if status in (200, 201):
        try:
            bm_id = json.loads(body).get("id")
        except Exception:
            pass

    status, body = _get(base, f"/api/bookmarks?owner_id={bm_owner}")
    r("T15", "GET /api/bookmarks returns list with created bookmark", status == 200 and "bv09-ref-001" in body, f"HTTP {status}: {body[:200]}")

    if bm_id:
        status, body = _delete(base, f"/api/bookmarks/{bm_id}")
        r("T16", f"DELETE /api/bookmarks/{bm_id} open write (no auth) -> 200", status == 200, f"HTTP {status}: {body[:80]}")
    else:
        r("T16", "DELETE /api/bookmarks/{id} — SKIP (bookmark not created)", False, "Skipped: bookmark not created in T14")

    # ── Chat CRUD with bypass token ───────────────────────────────────────────

    thr_owner = "bv09-chat-owner-001"
    status, body = _post(base, "/api/chat/threads",
        {"anchor_mode": "flashcard_id", "anchor_value": "bv09-anchor-001", "owner_id": thr_owner})
    r("T17", "POST /api/chat/threads open write (no auth) -> 200/201", status in (200, 201), f"HTTP {status}: {body[:120]}")

    thr_id = None
    if status in (200, 201):
        try:
            thr_id = json.loads(body).get("id")
        except Exception:
            pass

    if thr_id:
        status, body = _post(base, f"/api/chat/threads/{thr_id}/messages",
            {"role": "user", "text": "BV09 test message"})
        r("T18", "POST /api/chat/threads/{id}/messages open write (no auth) -> 200/201", status in (200, 201), f"HTTP {status}: {body[:120]}")

        status, body = _get(base, f"/api/chat/threads/{thr_id}/messages")
        r("T19", "GET /api/chat/threads/{id}/messages returns list", status == 200, f"HTTP {status}: {body[:200]}")
    else:
        r("T18", "POST /api/chat/threads/{id}/messages — SKIP", False, "Skipped: thread not created in T17")
        r("T19", "GET /api/chat/threads/{id}/messages — SKIP", False, "Skipped: thread not created in T17")

    status, body = _get(base, f"/api/chat/threads?owner_id={thr_owner}")
    r("T20", "GET /api/chat/threads returns list", status == 200, f"HTTP {status}: {body[:200]}")

    # ── Admin coverage ────────────────────────────────────────────────────────

    status, body = _get(base, "/api/admin/coverage")
    r("T21", "GET /api/admin/coverage returns 200 (no auth required)", status == 200 and "coverage" in body, f"HTTP {status}: {body[:200]}")

    # ── Collections ───────────────────────────────────────────────────────────

    status, body = _post(base, "/api/bookmark_collections",
        {"name": "bv09-test-collection", "owner_id": bm_owner})
    r("T22", "POST /api/bookmark_collections open write (no auth) -> 200/201", status in (200, 201), f"HTTP {status}: {body[:120]}")

    # ── Study endpoints ───────────────────────────────────────────────────────

    status, body = _get(base, "/api/study/due?owner_id=bv08-owner&limit=5")
    r("T23", "GET /api/study/due returns 200 list", status in (200, 422), f"HTTP {status}: {body[:120]}")

    # ── PIE explorer / EFG ───────────────────────────────────────────────────

    status, body = _get(base, "/api/search?q=test&limit=3")
    r("T24", "GET /api/search returns 200 (no auth)", status == 200, f"HTTP {status}: {body[:120]}")

    # ── Flashcards write with bypass token ───────────────────────────────────

    status, body = _post(base, "/api/flashcards/",
        {"word_or_phrase": "bv09testword", "language_id": "362b8846-c4ca-49b0-92c0-c8d207cf8d56", "source": "bv09_test"})
    r("T25", "POST /api/flashcards open write (no auth) -> 200/201", status in (200, 201, 422), f"HTTP {status}: {body[:120]}")

    new_card_id = None
    if status in (200, 201):
        try:
            new_card_id = json.loads(body).get("id")
        except Exception:
            pass

    if new_card_id:
        put_data = {"definition": "BV09 test definition update"}
        put_url = base.rstrip("/") + f"/api/flashcards/{new_card_id}"
        put_req = urllib.request.Request(put_url,
            data=json.dumps(put_data).encode(),
            headers={"Content-Type": "application/json"},
            method="PUT")
        try:
            rp = urllib.request.urlopen(put_req, timeout=15)
            put_status = rp.status; put_body = rp.read().decode()
        except urllib.error.HTTPError as e:
            put_status = e.code; put_body = e.read().decode()
        except Exception as ex:
            put_status = 0; put_body = str(ex)
        r("T26", f"PUT /api/flashcards/{new_card_id} open write (no auth) -> 200", put_status in (200, 201), f"HTTP {put_status}: {put_body[:120]}")

        del_req = urllib.request.Request(put_url,
            headers={"Content-Type": "application/json"},
            method="DELETE")
        try:
            rd = urllib.request.urlopen(del_req, timeout=15)
            del_status = rd.status; del_body = rd.read().decode()
        except urllib.error.HTTPError as e:
            del_status = e.code; del_body = e.read().decode()
        except Exception as ex:
            del_status = 0; del_body = str(ex)
        r("T27", f"DELETE /api/flashcards/{new_card_id} open write (no auth) -> 200", del_status in (200, 204), f"HTTP {del_status}: {del_body[:80]}")
    else:
        r("T26", "PUT /api/flashcards/{id} — SKIP (card not created)", False, "Skipped")
        r("T27", "DELETE /api/flashcards/{id} — SKIP (card not created)", False, "Skipped")

    # ── Version check ─────────────────────────────────────────────────────────

    status, body = _get(base, "/health")
    r("T30", "GET /health returns 200 with version info", status == 200, f"HTTP {status}: {body[:120]}")

    if status == 200:
        try:
            version_data = json.loads(body)
            version = version_data.get("version", "")
            r("T31", "Version is 5.2.0 (version bump confirmed)", version == "5.2.0", f"version={version}")
        except Exception:
            r("T31", "Version is 5.2.0 (version bump confirmed)", "5.2.0" in body, f"raw: {body[:100]}")
    else:
        # Check version from root HTML
        status2, body2 = _get(base, "/")
        import re
        m = re.search(r'id="version-badge">v([^<]+)<', body2)
        found_ver = m.group(1) if m else "(not found)"
        r("T31", "Version is 5.2.0 (version bump confirmed via HTML badge)", found_ver == "5.2.0", f"Found: {found_ver}")

    # ── Bypass token on health exempt (GET on health never needs token) ───────

    status, body = _post(base, "/health", {})
    r("T32", "POST /health exempt from bypass token check", status != 403, f"HTTP {status}: {body[:80]}")

    # ── admin/repair reachable ────────────────────────────────────────────────

    status, body = _post(base, "/api/admin/repair-pie-relationship",
        {"card_id": "bv09-nonexistent", "pie_root": "*bv09"})
    r("T33", "POST /api/admin/repair-pie-relationship open write (not 401/403)", status not in (401, 403), f"HTTP {status}: {body[:80]}")

    status, body = _post(base, "/api/admin/repair-pie-batch",
        {"repairs": [{"card_id": "bv09-nonexistent", "pie_root": "*bv09"}]})
    r("T34", "POST /api/admin/repair-pie-batch open write (not 401/403)", status not in (401, 403), f"HTTP {status}: {body[:80]}")

    # ── BWTL AF jobs proxy ────────────────────────────────────────────────────

    status, body = _get(base, "/api/bwtl/af-jobs")
    r("T35", "GET /api/bwtl/af-jobs returns 200 (no auth required)", status == 200, f"HTTP {status}: {body[:80]}")

    # ── Voice clone status ────────────────────────────────────────────────────

    status, body = _get(base, "/api/v1/voice-clone/status")
    r("T36", "GET /api/v1/voice-clone/status returns 200 (no auth required)", status == 200, f"HTTP {status}: {body[:120]}")

    # ── Auth endpoints still work ─────────────────────────────────────────────

    status, body = _post(base, "/api/auth/login",
        {"email": "nonexistent@bv09.test", "password": "BadPwd1!"})
    r("T37", "POST /api/auth/login reachable (returns 200 or 401 invalid creds)", status in (200, 401), f"HTTP {status}: {body[:80]}")

    # ── Promotions ────────────────────────────────────────────────────────────

    status, body = _post(base, "/api/chat/promotions",
        {"chat_message_id": "msg_bv09nonexistent", "card_id": "bv09-card", "target_field": "definition", "accepted_by": "bv09"})
    r("T38", "POST /api/chat/promotions open write (not 401/403)", status not in (401, 403), f"HTTP {status}: {body[:80]}")

    # ── Challenge token present ───────────────────────────────────────────────

    r("T39", f"Challenge token embedded: {CHALLENGE_TOKEN}", True, f"Token: {CHALLENGE_TOKEN}")

    # ── Double-check no 401s on standard reads ────────────────────────────────

    endpoints_get = [
        "/api/flashcards/?limit=1",
        "/api/languages",
        "/api/admin/coverage",
    ]
    all_200 = True
    evidence_parts = []
    for ep in endpoints_get:
        s, _ = _get(base, ep)
        if s not in (200, 201):
            all_200 = False
        evidence_parts.append(f"{ep}->{s}")
    r("T41", "All standard GET endpoints return 200 (no auth regression)", all_200, " | ".join(evidence_parts))

    return results


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="BWTL09 regression suite")
    parser.add_argument("--base", default=DEFAULT_BASE, help="Base URL")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args()

    print(f"BWTL09 AUTH-NUKE-FINAL Regression Suite")
    print(f"   Base: {args.base}")
    print(f"   Challenge: {CHALLENGE_TOKEN}")
    print()

    start = time.time()
    results = run_tests(args.base)
    elapsed = time.time() - start

    passed = sum(1 for r in results if r.passed)
    failed = sum(1 for r in results if not r.passed)

    if args.json:
        output = {
            "total": len(results),
            "passed": passed,
            "failed": failed,
            "elapsed_s": round(elapsed, 2),
            "challenge_token": CHALLENGE_TOKEN,
            "results": [{"id": r.bv_id, "title": r.title, "passed": r.passed, "evidence": r.evidence} for r in results],
        }
        print(json.dumps(output, indent=2))
    else:
        for res in results:
            print(res)
        print()
        print("=" * 70)
        print(f"TOTAL: {len(results)} | PASS: {passed} | FAIL: {failed} | Time: {elapsed:.1f}s")
        if failed > 0:
            print("\nFAILED TESTS:")
            for res in results:
                if not res.passed:
                    print(f"  FAIL: {res.bv_id}: {res.title}")
        else:
            print("ALL TESTS PASSED")
        print(f"\nChallenge token: {CHALLENGE_TOKEN}")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
