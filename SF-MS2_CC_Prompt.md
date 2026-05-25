# CC Sprint Prompt: SF-MS2
## Super Flashcards 🟡 — Mobile Listening Course
## Sprint ID: SF-MS2 | Est: 4-5 hrs | Deploy required
## Bootstrap: G:\My Drive\Code\Python\project-methodology\templates\CC_Bootstrap_v1.md

======================================================
=================== Super Flashcards 🟡 SF-MS2 ====================
======================================================

## CONTEXT

Super Flashcards is a Greek vocabulary learning app. This sprint adds the
"listening course" layer: TTS read-aloud per card, word family graph visualization,
and two new fields (grammatical gender, preposition usage) that Corey's Greek
professor Theodoros has identified as critical for retention.

Production URL: https://learn.rentyourcio.com
Cloud Run service: super-flashcards (verify in PK.md)
DB: Cloud SQL 35.224.242.223, instance flashcards-db, DB LanguageLearning

---

## PHASE 0 — Bootstrap + PK.md + RAG query

Read Bootstrap. Read Super Flashcards PROJECT_KNOWLEDGE.md.

```bash
curl -s https://learn.rentyourcio.com/health
```

```bash
curl -s "https://portfolio-rag-57478301787.us-central1.run.app/semantic?q=Super+Flashcards+TTS+Greek+vocabulary&collection=portfolio&n=3"
curl -s "https://portfolio-rag-57478301787.us-central1.run.app/semantic?q=Super+Flashcards+word+family+cognates&collection=code&repo=super-flashcards&n=3"
```

Mark sprint requirements as cc_executing:
```bash
for code in SF-026 SF-027 SF-023 SF-024; do
  curl -s -X PATCH https://metapm.rentyourcio.com/api/roadmap/requirements/$code \
    -H "Content-Type: application/json" \
    -d '{"status": "cc_executing"}'
done
```

---

## PHASE 1 — Read current codebase

Before writing any code, read:
1. The flashcard data model (what fields exist on a card?)
2. How cards are currently rendered (frontend component/template)
3. Whether ElevenLabs TTS is already integrated anywhere (Etymython has it)
4. The cognate linking table schema (342 SF-Etymython cognates are already linked)
5. Existing API endpoints for cards

Do NOT assume field names or schema. Read first.

---

## PHASE 2 — SF-026: TTS Read Aloud

On each flashcard, add a speaker button that plays the Greek word via ElevenLabs TTS.
Reuse the same GCS audio caching pattern from Etymython (audio generated once,
stored in GCS, served from cache on repeat plays).

### 2A. Backend endpoint

```python
# POST /api/cards/{card_id}/audio
# Checks GCS cache first, generates via ElevenLabs if miss, returns audio URL

GCS_AUDIO_PREFIX = "sf/audio/"  # separate from etymython's prefix

async def get_or_generate_audio(greek_text: str, card_id: str) -> str:
    gcs_path = f"{GCS_AUDIO_PREFIX}{card_id}.mp3"
    blob = bucket.blob(gcs_path)
    if blob.exists():
        return blob.public_url

    # Generate via ElevenLabs
    # Use Rudy voice (9XIWMI4pxD13JjWf5Vgj) for consistency across portfolio
    # OR use a Greek-appropriate ElevenLabs voice if Rudy sounds wrong for Greek
    # Check ELEVENLABS_API_KEY in Secret Manager
    audio_bytes = elevenlabs_tts(greek_text, voice_id="[voice from Secret Manager or PK.md]")

    blob.upload_from_string(audio_bytes, content_type="audio/mpeg")
    blob.make_public()
    return blob.public_url
```

GCS path must be unique per card. Use card_id in the path, NOT just the word
(two cards can have the same word with different contexts).

### 2B. Frontend speaker button

Add inline with the Greek word display on each card:
```html
<button class="tts-btn" onclick="playCardAudio('{{card_id}}', '{{greek_word}}')"
  title="Listen to pronunciation">
  🔊
</button>
```

```javascript
async function playCardAudio(cardId, greekWord) {
  const btn = document.querySelector(`[data-card="${cardId}"] .tts-btn`);
  btn.disabled = true;
  try {
    const res = await fetch(`/api/cards/${cardId}/audio`, {method: 'POST'});
    const {url} = await res.json();
    new Audio(url).play();
  } finally {
    btn.disabled = false;
  }
}
```

---

## PHASE 3 — SF-027: Word Family Graph

Show a mini network graph on each card connecting the word to its cognates
in the Etymython database (the 342 linked cognates).

### 3A. Backend endpoint

```python
# GET /api/cards/{card_id}/word-family
# Returns the card's cognates from the existing cognate link table
# Read the actual schema from the DB before writing this query
```

Query pattern (adapt to actual schema):
```sql
SELECT e.word, e.meaning, e.language, cl.relationship_type
FROM cognate_links cl
JOIN etymython_entries e ON cl.etymython_id = e.id
WHERE cl.sf_card_id = :card_id
LIMIT 20
```

### 3B. Frontend graph (D3 force layout)

Use D3.js (already available via CDN if not present). Keep it small — thumbnail
graph on the card back, expandable on click.

```javascript
function renderWordFamily(containerId, cardWord, cognates) {
  const nodes = [
    {id: cardWord, type: 'root'},
    ...cognates.map(c => ({id: c.word, type: c.language, meaning: c.meaning}))
  ];
  const links = cognates.map(c => ({source: cardWord, target: c.word}));

  // D3 force simulation
  const svg = d3.select(`#${containerId}`)
    .append('svg').attr('width', 300).attr('height', 200);

  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(60))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(150, 100));

  // Render links, nodes, labels
  // Root node: blue. Greek cognates: green. Other languages: gray.
}
```

If a card has zero cognates, hide the graph section entirely (do not show empty container).

---

## PHASE 4 — SF-023: Grammatical Gender Field

Add a `gender` field to the flashcard schema for Greek nouns.

### 4A. DB migration

```sql
ALTER TABLE flashcards ADD COLUMN gender VARCHAR(20) NULL;
-- Values: 'masculine', 'feminine', 'neuter', NULL (for verbs/adjectives)
```

### 4B. Backend

Add `gender` to the card response model and PATCH endpoint:
```python
class CardUpdate(BaseModel):
    # existing fields...
    gender: Optional[str] = None  # 'masculine' | 'feminine' | 'neuter' | None
```

### 4C. Frontend display

Show gender as a small badge next to the Greek word on the card:
- Masculine (m) — blue badge
- Feminine (f) — rose badge  
- Neuter (n) — gray badge
- None — no badge shown

Add gender selector in the card edit form (dropdown: blank, masculine, feminine, neuter).

---

## PHASE 5 — SF-024: Preposition Usage Field

Add a `preposition_usage` text field for Greek prepositions and the cases they govern.
Professor Theodoros specifically flagged this as critical — prepositions must be
learned with their case patterns, not in isolation.

### 5A. DB migration

```sql
ALTER TABLE flashcards ADD COLUMN preposition_usage TEXT NULL;
-- Example value: "με + accusative (with, together with)"
```

### 5B. Backend

Add to card model same as gender above.

### 5C. Frontend display

Show as a small info line below the Greek word when populated:
```
με  [with, together with]
    με + accusative
```

Add free-text input in the card edit form.

---

## PHASE 6 — Version bump + deploy

```python
VERSION = "3.2.0"  # bump from current — verify in PK.md first
```

Version grep:
```bash
grep -rn "VERSION\|version" app/ static/ templates/ \
  --include="*.py" --include="*.js" --include="*.html" \
  | grep -v ".pyc" | grep -v node_modules
```

Must show 4 version locations (known from Bootstrap v1.5.0 — verify all 4 match).

```bash
gcloud config get-value project  # must be: super-flashcards-475210

gcloud run deploy [SERVICE from PK.md] \
  --region us-central1 \
  [full --set-env-vars and --set-secrets from PK.md]

curl -s https://learn.rentyourcio.com/health
```

---

## PHASE 7 — MetaPM handoff

```bash
for code in SF-026 SF-027 SF-023 SF-024; do
  curl -s -X PATCH https://metapm.rentyourcio.com/api/roadmap/requirements/$code \
    -H "Content-Type: application/json" \
    -d '{"status": "cc_complete"}'
done
```

---

## ACCEPTANCE CRITERIA

- [ ] 🔊 button on each card plays Greek word audio
- [ ] Audio caches to GCS — second play does not call ElevenLabs
- [ ] GCS path uses card_id, not word text
- [ ] Word family graph renders for a card with known cognates
- [ ] Cards with zero cognates show no graph container
- [ ] Gender badge visible on noun cards (m/f/n)
- [ ] Gender badge absent on verb/adjective cards
- [ ] Preposition usage field visible when populated
- [ ] DB migrations ran without error — verify columns exist
- [ ] Version grep: all 4 locations match new version
- [ ] SF-026, SF-027, SF-023, SF-024 all show cc_complete in MetaPM

---

## DELIVERABLE

======================================================
=================== Super Flashcards 🟡 SF-MS2 ====================
======================================================

Report:
1. Card data model as found (actual fields in DB)
2. ElevenLabs voice ID used for Greek TTS
3. GCS bucket and path prefix confirmed
4. Cognate link table schema (actual column names)
5. Number of cards with at least one cognate (quick count query)
6. DB migration output for gender and preposition_usage columns
7. Version deployed
8. Commit hash(es)
9. Any deviations from prompt and why
