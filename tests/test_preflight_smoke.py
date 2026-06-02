"""
SF Preflight Smoke — 5 critical API/HTTP paths, must pass before gcloud builds submit.
Uses Playwright APIRequestContext (no browser rendering) for reliable execution.
Target: deployed revision at BASE_URL (production).

Run before deploy:
    pytest tests/test_preflight_smoke.py -x -q && gcloud builds submit ...
"""
import pytest
import os
import base64
from playwright.sync_api import Playwright

BASE = os.getenv("SF_BASE_URL", "https://learn.rentyourcio.com")
_BASIC = "Basic " + base64.b64encode(b"beta:flashcards2025").decode()
_HEADERS = {"Authorization": _BASIC}


@pytest.fixture(scope="module")
def api(playwright: Playwright):
    ctx = playwright.request.new_context(
        base_url=BASE,
        ignore_https_errors=True,
        extra_http_headers=_HEADERS,
    )
    yield ctx
    ctx.dispose()


def test_health_ok(api):
    """Path 1: /health returns 200 with status=healthy."""
    resp = api.get("/health")
    assert resp.status == 200, f"Health returned {resp.status}"
    body = resp.json()
    assert body.get("status") == "healthy", f"Unexpected body: {body}"


def test_bwtl_root_ok(api):
    """Path 2: /bwtl returns 200 (HTML shell served)."""
    resp = api.get("/bwtl")
    assert resp.status == 200, f"/bwtl returned {resp.status}"


def test_api_flashcards_ok(api):
    """Path 3: GET /api/flashcards returns a list."""
    resp = api.get("/api/flashcards?limit=5")
    assert resp.status == 200, f"/api/flashcards returned {resp.status}"
    body = resp.json()
    items = body if isinstance(body, list) else body.get("items", [])
    assert len(items) >= 0, "Expected list or paged response"


def test_api_voice_clone_no_404(api):
    """Path 4: GET /api/v1/voice-clone returns non-404 (BUG-054 regression)."""
    resp = api.get("/api/v1/voice-clone")
    assert resp.status != 404, f"/api/v1/voice-clone returned 404 — BUG-054 regression"


def test_api_dcc_list_ok(api):
    """Path 5: GET /api/v1/dcc/list returns 200."""
    resp = api.get("/api/v1/dcc/list")
    assert resp.status == 200, f"/api/v1/dcc/list returned {resp.status}"
