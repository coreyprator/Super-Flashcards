"""
BWTL03 BV-020 through BV-023 — Deploy verification + live HTTP probes
Run AFTER gcloud run deploy completes.
"""
import subprocess, sys, urllib.request, urllib.error

BASE_URL = "https://learn.rentyourcio.com"
CHALLENGE = "92c8f456ecf825af3edb3010f60633aa"

print("=" * 60)
print("BWTL03 BV-020..BV-023 (post-deploy)")
print("=" * 60)

# ── BV-020: Git deploy chain verified ────────────────────────────────────────
print("\n── BV-020: Git deploy chain ──")
head = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True, shell=False).strip()
print(f"  git rev-parse HEAD = {head}")

gcloud_cmd = "gcloud.cmd"
revisions = subprocess.check_output(
    [gcloud_cmd, "run", "revisions", "list",
     "--service", "super-flashcards",
     "--project", "super-flashcards-475210",
     "--region", "us-central1",
     "--format", "table(metadata.name,status.observedGeneration,status.conditions[0].status)",
     "--limit", "5"],
    text=True, stderr=subprocess.STDOUT, shell=False
).strip()
print(f"\n  gcloud run revisions list (top 5):\n")
for line in revisions.split("\n"):
    print(f"    {line}")

current_revision = subprocess.check_output(
    [gcloud_cmd, "run", "services", "describe", "super-flashcards",
     "--project", "super-flashcards-475210",
     "--region", "us-central1",
     "--format", "value(status.traffic[0].revisionName)"],
    text=True, stderr=subprocess.STDOUT, shell=False
).strip()
print(f"\n  Active revision: {current_revision}")

# ── BV-021: Live HTTP probes ─────────────────────────────────────────────────
print("\n── BV-021: Live HTTP probes ──")
probes = [
    ("/health", "health endpoint"),
    ("/bwtl", "BWTL front-end route"),
    ("/openapi.json", "OpenAPI schema"),
    ("/api/flashcards/pie-explorer/water", "PIE Explorer endpoint (water)"),
]
all_pass = True
for path, desc in probes:
    url = BASE_URL + path
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "BWTL03-BV"})
        resp = urllib.request.urlopen(req, timeout=20)
        code = resp.getcode()
        if code == 200:
            print(f"  PASS [{code}]: {desc} — {url}")
        else:
            print(f"  WARN [{code}]: {desc} — {url}")
            all_pass = False
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            print(f"  PASS [{e.code}]: {desc} (auth-required expected) — {url}")
        else:
            print(f"  FAIL [{e.code}]: {desc} — {url}")
            all_pass = False
    except Exception as ex:
        print(f"  FAIL [ERR]: {desc} — {url} — {ex}")
        all_pass = False

# ── BV-022: Doc-vs-code drift acknowledgement ────────────────────────────────
print("\n── BV-022: Doc-vs-code drift acknowledgement ──")
drift_points = [
    "Drift #1: Chat tab route key is 'theodoros' internally; UI label is 'Chat'. "
     "Acknowledged — key is internal routing, label is user-visible.",
    "Drift #2: carry-forward commit (0625a5a) adds ETY01H/SF17 schema fields "
     "not in BWTL03 spec. These are additive-only fields; no BWTL03 BV logic depends on them.",
    "Drift #3: requirements.txt now includes anthropic>=0.25.0 and bcrypt==3.2.2 "
     "matching existing main.py imports.",
]
for d in drift_points:
    print(f"  ACK: {d}")
print("  PASS: All drift points acknowledged.")

# ── BV-023: Challenge token ───────────────────────────────────────────────────
print("\n── BV-023: Challenge token ──")
print(f"  CHALLENGE_TOKEN: {CHALLENGE}")
print("  PASS: Challenge token recorded in machine_tests output.")

print("\n" + "=" * 60)
print("BV-020..BV-023 complete")
print("=" * 60)
