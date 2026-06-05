"""
SF-RAG-IMPORT M04: TRUNCATE + REPLACE etymology_entries from RAG staging files.

Reads staging JSON files produced by m03_bulk_export.py.
Parses headword from chunk content per source pattern:
  - beekes:  strip page prefix (e.g. 'μινύθω  9 5 5  \n...') → first Greek token
  - de-vaan: first word after "de Vaan Latin Etymology: " 
  - kroonen: first token (often starts with *root-)
  - watkins: word after "Watkins PIE Root: "

Schema mapping per row:
  source:      'beekes' | 'de-vaan' | 'kroonen' | 'watkins'
  headword:    first parseable headword (or first ~50 chars if no clear headword)
  language:    'el' (beekes), 'la' (de-vaan), 'gem-pro' (kroonen), 'ine-pro' (watkins)
  excerpt:     first 1000 chars of chunk content
  full_text:   full chunk content
  confidence:  0.9
  rag_source_id: chunk id from RAG

Skip __no_match__ (629 NULL excerpts) and dcc_vocabulary (499 clean) — untouched.

Usage:
  python rag_import.py --dry-run    # show stats only
  python rag_import.py --commit     # run TRUNCATE + INSERT
"""
import argparse
import json
import os
import re
import sys
import unicodedata
import pyodbc

STAGING_DIR = r'C:\dev\sf-rag\staging'
DB_PW = 'LGxbsXu3*Cwyte3CLrnZ'

SOURCES = ['beekes', 'de-vaan', 'kroonen', 'watkins']
LANGUAGE_MAP = {
    'beekes': 'el',
    'de-vaan': 'la',
    'kroonen': 'gem-pro',
    'watkins': 'ine-pro',
}

# ──────────────────────────────────────────────────────────────────────────────
# Headword parsers — per-source patterns
# ──────────────────────────────────────────────────────────────────────────────

def parse_headword_beekes(content: str) -> str:
    """
    Beekes chunks start with Greek text, sometimes with page numbers inline.
    Pattern: leading Greek word(s) followed by spaces/digits.
    Extract the first Greek token.
    """
    # Strip leading whitespace/page numbers
    line = content.strip().split('\n')[0].strip()
    # Find first sequence of Greek characters
    match = re.search(r'[\u0370-\u03ff\u1f00-\u1fff]+', line)
    if match:
        return match.group(0)[:100]
    # Fallback: first 50 chars of content
    return content.strip()[:50] or 'unknown'


def parse_headword_devaan(content: str) -> str:
    """
    de Vaan format: 'de Vaan Latin Etymology: WORD ...'
    """
    match = re.search(r"de Vaan Latin Etymology:\s*([^\s'[({]+)", content)
    if match:
        return match.group(1)[:100]
    # Fallback: first token of content
    tokens = content.strip().split()
    return tokens[0][:100] if tokens else 'unknown'


def parse_headword_kroonen(content: str) -> str:
    """
    Kroonen format: '*root-  ... - Go. form'
    First line often starts with *root or plain Germanic word.
    """
    line = content.strip().split('\n')[0].strip()
    # Find root form: optional * prefix + word chars
    match = re.match(r'(\*[a-z][a-zA-Z\u00c0-\u024f\-]*)', line)
    if match:
        return match.group(1)[:100]
    # Any word token
    tokens = line.split()
    if tokens:
        return tokens[0][:100]
    return content.strip()[:50] or 'unknown'


def parse_headword_watkins(content: str) -> str:
    """
    Watkins format: 'Watkins PIE Root: ROOT. Meaning...'
    """
    match = re.search(r'Watkins PIE Root:\s*([^\s.]+)', content)
    if match:
        return match.group(1)[:100]
    # Fallback
    tokens = content.strip().split()
    return tokens[0][:100] if tokens else 'unknown'


HEADWORD_PARSERS = {
    'beekes': parse_headword_beekes,
    'de-vaan': parse_headword_devaan,
    'kroonen': parse_headword_kroonen,
    'watkins': parse_headword_watkins,
}


# ──────────────────────────────────────────────────────────────────────────────
# DB helpers
# ──────────────────────────────────────────────────────────────────────────────

def get_conn(autocommit: bool = False) -> pyodbc.Connection:
    return pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=35.224.242.223,1433;DATABASE=learning;UID=sqlserver;"
        f"PWD={DB_PW};Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;",
        autocommit=autocommit
    )


# ──────────────────────────────────────────────────────────────────────────────
# Row builder
# ──────────────────────────────────────────────────────────────────────────────

def build_rows(source: str, chunks: list) -> list:
    parser = HEADWORD_PARSERS[source]
    language = LANGUAGE_MAP[source]
    rows = []
    for chunk in chunks:
        content = chunk.get('content', '') or ''
        if not content.strip():
            continue
        headword = parser(content)
        if not headword:
            headword = content.strip()[:50]
        excerpt = content[:1000]
        full_text = content
        rag_source_id = (chunk.get('id') or '')[:64]
        rows.append((
            headword,       # headword
            language,       # language
            source,         # source
            excerpt,        # excerpt
            full_text,      # full_text
            0.9,            # confidence
            rag_source_id,  # rag_source_id
        ))
    return rows


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--commit', action='store_true')
    args = parser.parse_args()

    if not args.dry_run and not args.commit:
        print('Usage: rag_import.py [--dry-run | --commit]')
        sys.exit(1)

    # Load staging files
    all_rows = {}
    total = 0
    for source in SOURCES:
        path = os.path.join(STAGING_DIR, f'{source}_chunks.json')
        if not os.path.exists(path):
            print(f'ERROR: missing staging file: {path}')
            sys.exit(1)
        with open(path, encoding='utf-8') as f:
            chunks = json.load(f)
        rows = build_rows(source, chunks)
        all_rows[source] = rows
        total += len(rows)
        print(f'  {source:10s}: {len(rows):5d} rows (from {len(chunks)} chunks)')

    print(f'  {"TOTAL":10s}: {total:5d} rows')
    print()

    if args.dry_run:
        print('DRY-RUN: sample headwords per source')
        for source, rows in all_rows.items():
            print(f'  {source}:')
            for r in rows[:5]:
                print(f'    headword={r[0]!r:40s} lang={r[1]}')
        print()
        print('DRY-RUN complete — no DB changes made')
        return

    # COMMIT: TRUNCATE + INSERT
    print('COMMIT: running DELETE + INSERT...')
    conn = get_conn(autocommit=False)
    cur = conn.cursor()

    try:
        # DELETE the 4 target sources
        for source in SOURCES:
            cur.execute("DELETE FROM dbo.etymology_entries WHERE source = ?", (source,))
            print(f'  DELETE {source}: {cur.rowcount} rows removed')

        # INSERT all rows
        INSERT_SQL = """
            INSERT INTO dbo.etymology_entries
                (headword, language, source, excerpt, full_text, confidence, rag_source_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, GETUTCDATE())
        """
        batch_size = 500
        for source in SOURCES:
            rows = all_rows[source]
            inserted = 0
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i + batch_size]
                cur.executemany(INSERT_SQL, batch)
                inserted += len(batch)
            print(f'  INSERT {source}: {inserted} rows')

        conn.commit()
        print()
        print('COMMIT complete.')

        # Verify row counts
        print('=== POST-INSERT COUNTS ===')
        conn2 = get_conn(autocommit=True)
        cur2 = conn2.cursor()
        grand_total = 0
        for source in SOURCES:
            cur2.execute("SELECT COUNT(*) FROM dbo.etymology_entries WHERE source = ?", (source,))
            cnt = cur2.fetchone()[0]
            print(f'  {source:10s}: {cnt:5d}')
            grand_total += cnt
        cur2.execute("SELECT COUNT(*) FROM dbo.etymology_entries")
        total_all = cur2.fetchone()[0]
        print(f'  {"TOTAL (all)":10s}: {total_all:5d}')
        conn2.close()

    except Exception as e:
        conn.rollback()
        print(f'ERROR — rolled back: {e}')
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    main()
