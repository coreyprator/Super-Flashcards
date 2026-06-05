"""
SF-ETL-FIX-002 Phase 5 AI VERIFICATION (M09)
20-row evidence table: source, extracted_headword, excerpt_first_80_chars,
rag_top_result_first_80_chars, verdict (PASS/FAIL)
Hard gate: >=18/20 PASS
"""
import sys
import json
import urllib.request
import urllib.parse
import pyodbc

RAG_URL = "https://portfolio-rag-57478301787.us-central1.run.app"


def rag_query(query: str, collection: str = "etymology", n: int = 3) -> list:
    """Call Portfolio RAG /search/{collection} endpoint."""
    url = f"{RAG_URL}/search/{collection}?" + urllib.parse.urlencode({"q": query, "n": n})
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
            return data.get("results", [])
    except Exception as e:
        return [{"error": str(e)}]


def get_sample_rows(pw: str) -> list:
    """Get 5 random rows per source (excluding NULL-excerpt beekes)."""
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=35.224.242.223,1433;"
        "DATABASE=learning;"
        "UID=sqlserver;"
        f"PWD={pw};"
        "Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;",
        autocommit=True
    )
    cur = conn.cursor()
    rows = []
    for source in ["de-vaan", "kroonen", "watkins", "beekes"]:
        if source == "beekes":
            cur.execute(
                "SELECT TOP 5 source, headword, excerpt "
                "FROM dbo.etymology_entries "
                "WHERE source = ? AND excerpt IS NOT NULL "
                "ORDER BY NEWID()", source
            )
        else:
            cur.execute(
                "SELECT TOP 5 source, headword, excerpt "
                "FROM dbo.etymology_entries WHERE source = ? "
                "ORDER BY NEWID()", source
            )
        rows.extend(cur.fetchall())
    conn.close()
    return rows


def verdictize(source: str, headword: str, excerpt: str, rag_results: list) -> str:
    """
    PASS if top RAG result discusses same headword/concept as row's excerpt.
    Check: headword appears in top result text, or excerpt keywords appear.
    For beekes: use page-number proximity check.
    """
    import re as _re
    if not rag_results or "error" in str(rag_results[0]):
        return "FAIL(rag_error)"
    top = rag_results[0]
    top_text = str(top.get("snippet", top.get("content", top.get("text", top.get("document", "")))))
    top_lower = top_text.lower()[:1000]

    hw_lower = headword.lower().lstrip("*").rstrip("-.,;:")

    # For beekes: check if page number from excerpt is in RAG result (within ±10)
    if source == "beekes":
        exc_pages = _re.findall(r'\b(\d{2,4})\b', (excerpt or "")[:20])
        rag_pages = _re.findall(r'\b(\d{2,4})\b', top_text[:50])
        if exc_pages and rag_pages:
            exc_page = int(exc_pages[0])
            rag_page = int(rag_pages[0])
            if abs(exc_page - rag_page) <= 10:
                return "PASS"
        # Also check if the headword (Greek chars) appear in RAG result
        if any(ord(c) > 0x0370 for c in headword):
            # Take first 4 unicode chars of headword
            hw_prefix = headword[:4]
            if hw_prefix in top_text:
                return "PASS"
        return "FAIL"

    # For Latin/PIE sources: check headword root appears in RAG top result
    # Use longer prefix to avoid false matches (use 5+ chars)
    hw_root = hw_lower[:6] if len(hw_lower) >= 6 else hw_lower
    if len(hw_root) >= 5 and hw_root in top_lower:
        return "PASS"

    # Check if key content words from excerpt appear in RAG result (>=3 matches)
    exc_lower = (excerpt or "")[:120].lower()
    exc_words = set(w for w in _re.findall(r'[a-z]{4,}', exc_lower) if w not in {
        'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'been',
        'vaan', 'latin', 'etymology', 'watkins', 'root', 'beekes', 'kroonen',
        'derivatives', 'cognates', 'notes', 'also', 'form', 'verb', 'noun'
    })
    matching = [w for w in exc_words if w in top_lower]
    if len(matching) >= 3:
        return "PASS"

    # Check if headword itself (full) appears in RAG result
    if hw_lower and hw_lower in top_lower:
        return "PASS"

    return "FAIL"


def main():
    if len(sys.argv) < 2:
        print("Usage: python etl_phase5_ai_verify.py <db_password>")
        sys.exit(1)

    pw = sys.argv[1]
    print("Phase 5 AI VERIFICATION (M09)")
    print("Fetching 20 sample rows (5 per source)...")
    rows = get_sample_rows(pw)

    evidence_table = []
    pass_count = 0
    fail_count = 0

    for source, headword, excerpt in rows:
        rag_results = rag_query(headword, collection="etymology", n=3)
        top = rag_results[0] if rag_results else {}
        top_text = str(top.get("snippet", top.get("content", top.get("text", top.get("document", "N/A")))))[:80]
        verdict = verdictize(source, headword, excerpt or "", rag_results)
        if verdict.startswith("PASS"):
            pass_count += 1
        else:
            fail_count += 1
        evidence_table.append({
            "source": source,
            "extracted_headword": headword,
            "excerpt_first_80_chars": (excerpt or "")[:80],
            "rag_top_result_first_80_chars": top_text,
            "verdict": verdict
        })

    # Print evidence table
    print(f"\n{'SOURCE':<12} {'HEADWORD':<25} {'VERDICT':<12}")
    print("-" * 70)
    for row in evidence_table:
        print(f"{row['source']:<12} {row['extracted_headword']:<25} {row['verdict']:<12}")
        print(f"  excerpt:  {row['excerpt_first_80_chars'][:60]!r}")
        print(f"  rag_top:  {row['rag_top_result_first_80_chars'][:60]!r}")
        print()

    print(f"RESULT: {pass_count}/20 PASS, {fail_count}/20 FAIL")
    if pass_count >= 18:
        print("GATE: PASS (>=18/20)")
    else:
        print("GATE: FAIL (<18/20) — DO NOT PROCEED")

    return pass_count, evidence_table


if __name__ == "__main__":
    main()
