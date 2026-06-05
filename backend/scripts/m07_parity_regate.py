"""
SF-ETL-FIX-003 Phase 6 / M07: Parity re-gate
Re-execute the same 20 queries as parity v1.2.0 via production API.
Average ≥80% required to close sprint.

Usage: python m07_parity_regate.py
"""
import urllib.request, urllib.parse, json
import sys

BASE = 'https://learn.rentyourcio.com'

# Same 20 queries from parity v1.2.0 with their known source sets
QUERIES = [
    ('logos',     ['beekes', 'watkins']),
    ('theos',     ['beekes', 'kroonen']),
    ('anthropos', ['beekes', 'de-vaan', 'kroonen', 'watkins']),
    ('polis',     ['beekes', 'de-vaan', 'watkins']),
    ('kosmos',    ['beekes', 'watkins']),
    ('aqua',      ['de-vaan', 'kroonen', 'watkins']),
    ('terra',     ['de-vaan', 'kroonen', 'watkins']),
    ('vita',      ['beekes', 'de-vaan', 'kroonen']),
    ('rex',       ['de-vaan', 'kroonen', 'watkins']),
    ('homo',      ['de-vaan', 'kroonen']),
    ('pater',     ['de-vaan', 'kroonen', 'watkins']),
    ('mater',     ['de-vaan', 'kroonen', 'watkins']),
    ('deus',      ['de-vaan', 'kroonen']),
    ('nox',       ['de-vaan', 'kroonen', 'watkins']),
    ('sol',       ['de-vaan', 'kroonen', 'watkins']),
    ('wasser',    ['beekes', 'kroonen', 'watkins']),
    ('haus',      ['kroonen']),
    ('mann',      ['de-vaan', 'kroonen', 'watkins']),
    ('kind',      ['kroonen', 'watkins']),
    ('gott',      ['de-vaan', 'kroonen']),
]

print("=== SF-ETL-FIX-003 Parity Re-gate (M07) ===")
print(f"Target: average ≥80%")
print()
print(f"{'Query':<12} {'Source':<12} {'Found?':<8} {'Score'}")
print("-" * 55)

results = []
query_scores = {}
for q, expected_sources in QUERIES:
    found_sources = []
    for src in expected_sources:
        url = BASE + '/api/etymology/search?' + urllib.parse.urlencode({'q': q, 'source': src, 'limit': 5})
        try:
            r = urllib.request.urlopen(url, timeout=20)
            data = json.loads(r.read())
            found = data.get('total', 0) > 0
            found_sources.append((src, found))
        except Exception as e:
            found_sources.append((src, False))
            print(f"  {q:<10} {src:<12} ERROR: {e}")
    
    n_found = sum(1 for _, f in found_sources if f)
    pct = n_found / len(expected_sources) if expected_sources else 0
    results.append(pct)
    query_scores[q] = (pct, found_sources)
    
    for src, found in found_sources:
        print(f"  {q:<10} {src:<12} {'YES ✓' if found else 'no   '}")
    print(f"  {q}: {n_found}/{len(expected_sources)} = {pct*100:.0f}%")
    print()

avg = sum(results) / len(results) if results else 0
print()
print(f"Average parity: {avg*100:.1f}%")
print(f"Gate threshold: 80.0%")
print(f"Gate result: {'PASS ✓' if avg >= 0.80 else 'FAIL ✗'}")

if avg >= 0.80:
    print("\nPARITY RE-GATE PASSED — sprint may proceed to closeout.")
else:
    print(f"\nPARITY RE-GATE FAILED — {avg*100:.1f}% < 80%. Do NOT close sprint.")
    print("\nPer-query breakdown (failures):")
    for q, expected_sources in QUERIES:
        pct, found_sources = query_scores[q]
        if pct < 1.0:
            missing = [s for s, f in found_sources if not f]
            print(f"  {q}: {pct*100:.0f}% — missing: {missing}")
    sys.exit(1)
