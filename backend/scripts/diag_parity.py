"""Investigate parity failures: query DB directly to understand what's happening."""
import pyodbc, urllib.request, urllib.parse, json, sys

pw = sys.argv[1] if len(sys.argv) > 1 else ""
BASE = 'https://learn.rentyourcio.com'

conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=35.224.242.223,1433;DATABASE=learning;UID=sqlserver;"
    f"PWD={pw};Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=30;",
    autocommit=True
)
cur = conn.cursor()

# Check specific queries via direct DB - what headword_ascii values exist
check_words = ['sol', 'kind', 'anthropos', 'polis', 'wasser', 'terra', 'theos', 'mann', 'tyrannos', 'airi']

print("=== Direct DB query: headword_ascii LIKE '%word%' ===")
for word in check_words:
    cur.execute(
        "SELECT source, headword, headword_ascii FROM dbo.etymology_entries "
        "WHERE headword_ascii LIKE ? ORDER BY source",
        (f'%{word}%',)
    )
    rows = cur.fetchall()
    sources = [(r[0], r[1], r[2]) for r in rows]
    print(f"  {word}: {[(s, hw[:20]) for s, hw, hwa in sources[:5]]}")

print()
print("=== FTS CONTAINS tests ===")
for word in check_words:
    try:
        cur.execute(
            f"SELECT source, headword, headword_ascii FROM dbo.etymology_entries "
            f"WHERE CONTAINS(headword_ascii, ?)",
            (f'"{word}"',)
        )
        rows = cur.fetchall()
        sources = list(set(r[0] for r in rows))
        print(f"  CONTAINS({word}): sources={sources}, count={len(rows)}")
    except Exception as e:
        print(f"  CONTAINS({word}): ERROR {e}")

print()
print("=== API search results ===")
for word in ['sol', 'kind', 'anthropos']:
    url = BASE + '/api/etymology/search?' + urllib.parse.urlencode({'q': word, 'limit': 10})
    try:
        r = urllib.request.urlopen(url, timeout=20)
        data = json.loads(r.read())
        results = data.get('results', [])
        print(f"  API {word}: total={data.get('total',0)}")
        for x in results[:5]:
            print(f"    source={x.get('source')}, headword={x.get('headword','')[:30]}, hw_ascii={x.get('headword_ascii','')[:20]}")
    except Exception as e:
        print(f"  API {word}: ERROR {e}")

conn.close()
