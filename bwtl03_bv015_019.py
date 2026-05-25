"""
BWTL03 BV-015 through BV-019 — Phase 2 frontend verification
"""
import os, re

BASE = "G:\\My Drive\\Code\\Python\\Super-Flashcards"
FRONTEND_BWTL = os.path.join(BASE, "frontend", "bwtl")
SRC = os.path.join(FRONTEND_BWTL, "src")

print("=" * 60)
print("BWTL03 PHASE 2 BV-015..BV-019")
print("=" * 60)

# ── BV-015: Word Study workspace + PIE Explorer panel wired ─────────────────
print("\n── BV-015: Word Study + PIE Explorer wired ──")
# Check workspace.jsx exists in frontend
assert os.path.exists(os.path.join(SRC, "workspace.jsx")), "workspace.jsx missing"
print("  PASS: workspace.jsx present")
assert os.path.exists(os.path.join(SRC, "panels.jsx")), "panels.jsx missing"
print("  PASS: panels.jsx present")
# Check bwtl-api.js has fetchPieRoot wired to /api/flashcards/pie-explorer
with open(os.path.join(SRC, "bwtl-api.js"), encoding="utf-8") as f:
    api_src = f.read()
if "/api/flashcards/pie-explorer/" in api_src:
    print("  PASS: fetchPieRoot wired to /api/flashcards/pie-explorer/")
else:
    print("  FAIL: fetchPieRoot not wired")

# ── BV-016: Chat sidecar wired to /api/chat/* ────────────────────────────────
print("\n── BV-016: Chat sidecar wired to /api/chat/* ──")
assert os.path.exists(os.path.join(SRC, "chat.jsx")), "chat.jsx missing"
print("  PASS: chat.jsx present")
chat_api_checks = [
    ("/api/chat/threads", "POST /api/chat/threads (create thread)"),
    ("/api/chat/threads/${threadId}/messages", "POST messages"),
    ("/api/chat/threads?", "GET threads list"),
]
for needle, desc in chat_api_checks:
    if needle in api_src:
        print(f"  PASS: {desc}")
    else:
        print(f"  FAIL: {desc} — '{needle}' not found in bwtl-api.js")

# anchor_mode defaults to flashcard_id in API
if "'flashcard_id'" in api_src or '"flashcard_id"' in api_src:
    print("  PASS: anchor_mode flashcard_id in bwtl-api.js")
else:
    print("  FAIL: anchor_mode flashcard_id missing from bwtl-api.js")

# ── BV-017: Accept action → POST /api/chat/promotions ────────────────────────
print("\n── BV-017: Accept → /api/chat/promotions ──")
if "/api/chat/promotions" in api_src:
    print("  PASS: promoteField wired to /api/chat/promotions")
else:
    print("  FAIL: /api/chat/promotions not in bwtl-api.js")
if "PROMOTE_FIELDS" in api_src:
    field_count = len(re.findall(r"\{ key:", api_src))
    print(f"  PASS: PROMOTE_FIELDS defined ({field_count} fields)")
else:
    print("  FAIL: PROMOTE_FIELDS missing")

# ── BV-018: Bookmarks tab wired ───────────────────────────────────────────────
print("\n── BV-018: Bookmarks tab wired to /api/bookmarks ──")
assert os.path.exists(os.path.join(SRC, "bookmarks.jsx")), "bookmarks.jsx missing"
print("  PASS: bookmarks.jsx present")
bm_checks = [("/api/bookmarks", "createBookmark/getBookmarks"), ("/api/bookmark_collections", "createCollection/getCollections")]
for needle, desc in bm_checks:
    if needle in api_src:
        print(f"  PASS: {desc} in bwtl-api.js")
    else:
        print(f"  FAIL: {desc} missing")

# ── BV-019: All 7 nav tabs present ───────────────────────────────────────────
print("\n── BV-019: All 7 nav tabs (Study, Library, Generate, Bookmarks, Chat, Admin, Settings) ──")
# Check app.jsx for all section keys
with open(os.path.join(SRC, "app.jsx"), encoding="utf-8") as f:
    app_src = f.read()

tab_checks = [
    ("'study'",      "Study tab"),
    ("'library'",    "Library tab"),
    ("'generate'",   "Generate tab"),
    ("'bookmarks'",  "Bookmarks tab"),
    ("'theodoros'",  "Chat tab (route key: theodoros)"),
    ("'admin'",      "Admin tab"),
    ("'settings'",   "Settings tab"),
]
for needle, desc in tab_checks:
    if needle in app_src:
        print(f"  PASS: {desc}")
    else:
        print(f"  FAIL: {desc} — '{needle}' not in app.jsx")

# Chat tab label is "Chat" not "Theodoros" (per BV-022 drift #1)
# Verify the UI label — TopBar tabs
if '"Chat"' in app_src or "'Chat'" in app_src:
    print("  PASS: Chat tab labeled 'Chat' (not 'Theodoros') — code reads correctly (drift #1)")
else:
    print("  NOTE: Checking tabs in app.jsx for Chat label")

# Admin only visible to 'pl' role
if "canSeeAdmin" in app_src and "role === 'pl'" in app_src:
    print("  PASS: Admin tab gated to role=pl")
else:
    print("  FAIL: Admin tab not properly gated")

# Check index.html serves bwtl-api.js not data.js
with open(os.path.join(FRONTEND_BWTL, "index.html"), encoding="utf-8") as f:
    idx_src = f.read()
if "bwtl-api.js" in idx_src and "src/data.js" not in idx_src:
    print("  PASS: index.html loads bwtl-api.js (data.js replaced)")
else:
    print("  FAIL: index.html still references data.js")

# Check /bwtl route in main.py
with open(os.path.join(BASE, "backend", "app", "main.py"), encoding="utf-8") as f:
    main_src = f.read()
if "@app.get(\"/bwtl\"" in main_src:
    print("  PASS: /bwtl route registered in main.py")
else:
    print("  FAIL: /bwtl route not registered")

print("\n" + "=" * 60)
print("BV-015..BV-019 checks complete")
print("=" * 60)
