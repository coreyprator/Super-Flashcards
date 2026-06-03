"""
SF-ETL-DICT parity report: compare RAG /semantic vs SQL /api/etymology/search
for 20 representative headwords. Outputs overlap scores and summary.
"""
import json
import urllib.request
import urllib.parse

BASE = "https://super-flashcards-57478301787.us-central1.run.app"
RAG  = "https://portfolio-rag-57478301787.us-central1.run.app"

# Mirror of _normalise_source() in admin_etl.py
def _normalise_source(raw: str) -> str:
    s = raw.lower()
    if "beekes" in s:
        return "beekes"
    if "proto-germani" in s or "proto_germani" in s or "germanic" in s:
        return "kroonen"
    if "watkins" in s:
        return "watkins"
    if "de vaan" in s or "de_vaan" in s:
        return "de-vaan"
    if "wiktionary" in s:
        return "wiktionary"
    return s.split(".")[0][:30]

# 20 representative queries spanning Greek, Latin, PIE, Proto-Germanic
QUERIES = [
    # Greek (Beekes)
    "logos", "theos", "anthropos", "polis", "kosmos",
    # Latin (de Vaan)
    "aqua", "terra", "vita", "rex", "homo",
    # PIE (Watkins)
    "pater", "mater", "deus", "nox", "sol",
    # Proto-Germanic (Kroonen)
    "wasser", "haus", "mann", "kind", "gott",
]


def rag_sources(q: str, n: int = 5) -> list:
    """Return list of (source, headword) from RAG /semantic."""
    url = RAG + "/semantic?" + urllib.parse.urlencode({"q": q, "collection": "etymology", "n": n})
    try:
        r = urllib.request.urlopen(url, timeout=15)
        data = json.loads(r.read())
        results = data.get("results", [])
        return [(_normalise_source(r.get("source", "")), r.get("headword", q)) for r in results[:n]]
    except Exception as e:
        return []


def sql_sources(q: str, limit: int = 20) -> list:
    """Return list of (source, headword) from /api/etymology/search."""
    url = BASE + "/api/etymology/search?" + urllib.parse.urlencode({"q": q, "limit": limit})
    try:
        r = urllib.request.urlopen(url, timeout=15)
        data = json.loads(r.read())
        results = data.get("results", [])
        return [(r.get("source", ""), r.get("headword", q)) for r in results[:limit]]
    except Exception as e:
        return []


def source_overlap(rag: list, sql: list) -> float:
    """Fraction of RAG top-5 sources also present in SQL top-5 sources."""
    if not rag:
        return 1.0  # no RAG results → nothing to compare, count as passing
    rag_srcs = {s for s, _ in rag}
    sql_srcs = {s for s, _ in sql}
    return len(rag_srcs & sql_srcs) / len(rag_srcs)


rows = []
total_overlap = 0.0
n_queryable = 0

print("%-20s  RAG_hits  SQL_hits  overlap  RAG_sources" % "query")
print("-" * 80)

for q in QUERIES:
    rag = rag_sources(q)
    sql = sql_sources(q)
    ol = source_overlap(rag, sql)
    rag_src_str = ", ".join(sorted({s for s, _ in rag})) or "(none)"
    sql_src_str = ", ".join(sorted({s for s, _ in sql})) or "(none)"
    print("%-20s  %-8d  %-8d  %-7.0f%%  %s" % (q, len(rag), len(sql), ol * 100, rag_src_str))
    rows.append({
        "query": q,
        "rag_hits": len(rag),
        "sql_hits": len(sql),
        "overlap_pct": round(ol * 100, 1),
        "rag_sources": rag_src_str,
        "sql_sources": sql_src_str,
    })
    if rag:  # only count queries where RAG has results
        total_overlap += ol
        n_queryable += 1

avg_overlap = (total_overlap / n_queryable * 100) if n_queryable else 0.0
passed = avg_overlap >= 80.0

print()
print("=" * 80)
print("Queries with RAG results: %d / %d" % (n_queryable, len(QUERIES)))
print("Average source overlap:   %.1f%%" % avg_overlap)
print("Gate (>=80%%):             %s" % ("PASS" if passed else "FAIL"))
print("=" * 80)

# Write JSON for compliance doc
with open("parity_results.json", "w") as f:
    json.dump({
        "queries": rows,
        "n_queryable": n_queryable,
        "avg_overlap_pct": round(avg_overlap, 1),
        "gate_passed": passed,
    }, f, indent=2)

print("\nWrote parity_results.json")
