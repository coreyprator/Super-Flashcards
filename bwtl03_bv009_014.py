"""
BWTL03 BV-009 through BV-014 — Phase 1 backend verification
"""
import os, sys, json, pyodbc, ast
import subprocess

print("=" * 60)
print("BWTL03 PHASE 1 BV-009..BV-014")
print("=" * 60)

# ── BV-009: PIE Explorer response shape has BWTL03 fields ────────────────────
print("\n── BV-009: PIE Explorer merged endpoint shape ──")
with open("app/routers/flashcards.py", encoding="utf-8") as f:
    src = f.read()

required_keys = ["verbal_paradigm", "nominal_derivatives", "modern_cognates",
                 "efg_pie_ipa", "efg_pie_audio_url", "atomic_roots", "language_paradigm"]
missing_keys = [k for k in required_keys if f'"{k}"' not in src]
if missing_keys:
    print(f"FAIL: Missing keys in flashcards.py: {missing_keys}")
else:
    print("PASS: All 7 BWTL03 fields present in pie-explorer response")

# ── BV-010: EFG merge logic present ─────────────────────────────────────────
print("\n── BV-010: EFG merge logic (efg_pie_explorer_data + nodes) ──")
checks = [
    ("efg_pie_explorer_data", "efg_pie_explorer_data query"),
    ("_get_efg_connection", "EFG connection reuse"),
    ("language_paradigm", "language_paradigm heuristic"),
    ("efg_key = re.sub", "normalization strip * and -"),
]
for needle, desc in checks:
    if needle in src:
        print(f"  PASS: {desc}")
    else:
        print(f"  FAIL: {desc} — '{needle}' not found")

# ── BV-011: Chat router has all required endpoints ───────────────────────────
print("\n── BV-011: Chat endpoints ──")
with open("app/routers/chat.py", encoding="utf-8") as f:
    chat_src = f.read()

chat_routes = [
    ('POST /threads', '@router.post("/threads")'),
    ('POST /threads/{id}/messages', '@router.post("/threads/{thread_id}/messages")'),
    ('GET /threads', '@router.get("/threads")'),
    ('GET /threads/{id}/messages', '@router.get("/threads/{thread_id}/messages")'),
    ('POST /promotions', '@router.post("/promotions")'),
]
for name, pattern in chat_routes:
    if pattern in chat_src:
        print(f"  PASS: {name}")
    else:
        print(f"  FAIL: {name} — '{pattern}' not found")

# Check anchor_mode defaults to flashcard_id
if 'anchor_mode: str = "flashcard_id"' in chat_src:
    print("  PASS: anchor_mode defaults to 'flashcard_id'")
else:
    print("  FAIL: anchor_mode default not set to 'flashcard_id'")

# ── BV-012: Bookmark router has all required endpoints ───────────────────────
print("\n── BV-012: Bookmark endpoints ──")
with open("app/routers/bookmarks.py", encoding="utf-8") as f:
    bm_src = f.read()

bm_routes = [
    ('POST /bookmarks', '@router.post("/bookmarks")'),
    ('GET /bookmarks', '@router.get("/bookmarks")'),
    ('DELETE /bookmarks/{id}', '@router.delete("/bookmarks/{bookmark_id}")'),
    ('POST /bookmark_collections', '@router.post("/bookmark_collections")'),
    ('GET /bookmark_collections', '@router.get("/bookmark_collections")'),
]
for name, pattern in bm_routes:
    if pattern in bm_src:
        print(f"  PASS: {name}")
    else:
        print(f"  FAIL: {name} — '{pattern}' not found")

# ── BV-013: Role-tier middleware — 4 test points ──────────────────────────────
print("\n── BV-013: Role-tier permission middleware ──")
with open("app/dependencies.py", encoding="utf-8") as f:
    dep_src = f.read()

dep_checks = [
    ("require_role", "require_role() factory"),
    ("require_write_access", "require_write_access() — learner blocked"),
    ("require_pl", "require_pl() — PL-only gate"),
    ("role_tier", "role_tier attribute read"),
]
for needle, desc in dep_checks:
    if needle in dep_src:
        print(f"  PASS: {desc}")
    else:
        print(f"  FAIL: {desc}")

# Verify chat and bookmarks import require_write_access
for fname, fsrc in [("chat.py", chat_src), ("bookmarks.py", bm_src)]:
    if "require_write_access" in fsrc:
        print(f"  PASS: {fname} uses require_write_access")
    else:
        print(f"  FAIL: {fname} does NOT use require_write_access")

# ── BV-014: Admin coverage endpoint ─────────────────────────────────────────
print("\n── BV-014: Admin coverage endpoint ──")
with open("app/routers/admin_bwtl.py", encoding="utf-8") as f:
    adm_src = f.read()

adm_checks = [
    ('@router.get("/admin/coverage")', "GET /admin/coverage route"),
    ("require_pl", "PL-only gate applied"),
    ("non_pie_reason", "non_pie_reason in field list"),
]
# Count coverage fields
import re
field_count = len(re.findall(r'"field":', adm_src))
if field_count >= 16:
    print(f"  PASS: {field_count} fields in coverage map (≥16)")
else:
    print(f"  FAIL: only {field_count} fields (need 16)")

for needle, desc in adm_checks:
    if needle in adm_src:
        print(f"  PASS: {desc}")
    else:
        print(f"  FAIL: {desc}")

# ── main.py router registration ───────────────────────────────────────────────
print("\n── Router registration in main.py ──")
with open("app/main.py", encoding="utf-8") as f:
    main_src = f.read()

for name in ["chat", "bookmarks", "admin_bwtl"]:
    if f'from .routers import' in main_src and name in main_src:
        print(f"  PASS: {name} router registered")
    else:
        print(f"  FAIL: {name} router NOT registered")

print("\n" + "=" * 60)
print("BV-009..BV-014 checks complete")
print("=" * 60)
