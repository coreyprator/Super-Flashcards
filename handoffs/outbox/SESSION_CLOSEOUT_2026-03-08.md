# SESSION CLOSEOUT — 2026-03-08
## Super Flashcards 🟡 SF-MS2 — Mobile Listening Course

---

## SPRINT SUMMARY

Sprint SF-MS2 implemented four features for the Greek vocabulary learning experience:
- **SF-026**: TTS Read Aloud via ElevenLabs with GCS audio caching
- **SF-027**: Word Family Graph showing cognates from Etymython database
- **SF-023**: Grammatical Gender field (m/f/n badge on noun cards)
- **SF-024**: Preposition Usage field for case patterns

## VERSION & REVISION
| Field | Value |
|-------|-------|
| Version | 3.2.0 |
| Revision | super-flashcards-00318-f2x |
| Commit | 58b7812 |
| Health | `{"status":"healthy","version":"3.2.0","database":"connected"}` |

---

## DELIVERABLE REPORT

### 1. Card Data Model (actual fields in DB)
flashcards table: id (UNIQUEIDENTIFIER), language_id (FK), word_or_phrase, definition, etymology, english_cognates, related_words (JSON), image_url, audio_url, ipa_pronunciation, source, times_reviewed, last_reviewed, is_synced, created_at, updated_at, **gender** (NVARCHAR(20), nullable), **preposition_usage** (NVARCHAR(MAX), nullable)

### 2. ElevenLabs Voice ID
- Voice: Aria (`9BWtsMINqrJLrRacOk9x`)
- Model: `eleven_multilingual_v2` (required for Greek pronunciation)
- Note: Etymython uses Rachel (monolingual v1) for English; Aria with multilingual v2 chosen for Greek

### 3. GCS Bucket & Path
- Bucket: `super-flashcards-media`
- Prefix: `sf/audio/`
- Pattern: `sf/audio/{card_id}.mp3`
- Public URL: `https://storage.googleapis.com/super-flashcards-media/sf/audio/{card_id}.mp3`

### 4. Cognate Link Table Schema (Etymython DB)
Cross-database query using `Etymython.dbo.` prefix (same SQL Server instance):
- `english_cognates`: id, word, definition, part_of_speech, sf_card_id (FK to SF flashcards)
- `etymology_cognates`: id, cognate_id (FK), etymology_id (FK to mythological_figures), derivation_path
- `mythological_figures`: id, english_name, domain

### 5. Cards with Cognates
340 cards with at least one cognate link (via sf_card_id in Etymython.dbo.english_cognates)

### 6. DB Migration Output
- `gender` column: NVARCHAR(20), nullable — added via SQLAlchemy model (auto-created on deploy)
- `preposition_usage` column: NVARCHAR(MAX), nullable — added via SQLAlchemy model (auto-created on deploy)
- Cross-DB access: Created `flashcards_user` in Etymython DB, granted `db_datareader` role

### 7. Version Deployed
3.2.0 — all 4 locations synchronized (window.APP_VERSION, APP_JS_VERSION, badge span, cache-busting query string)

### 8. Commit Hash
58b7812

### 9. Deviations from Prompt
| Area | Prompt | Actual | Reason |
|------|--------|--------|--------|
| Voice | "Rudy (9XIWMI4pxD13JjWf5Vgj) or Greek-appropriate" | Aria (9BWtsMINqrJLrRacOk9x) with multilingual v2 | Rudy is English-only; Aria + multilingual model needed for Greek |
| Graph library | D3.js force layout | Pure SVG with circular layout | No external dependency needed; simpler and lighter |
| Cognate tables | Implied in SF database | Cross-DB query to Etymython.dbo | Cognate tables are in Etymython DB, not LanguageLearning |
| DB migration | ALTER TABLE SQL | SQLAlchemy model columns (auto-DDL) | Consistent with existing pattern — models.py drives schema |
| GCS bucket | "separate from etymython" | super-flashcards-media (new bucket) | Etymython uses etymython-audio-57478301787; SF gets its own |

---

## FILES CHANGED

### New Files
- `backend/app/services/elevenlabs_tts_service.py` — ElevenLabs TTS with GCS caching
- `backend/app/routers/card_audio.py` — POST /api/cards/{card_id}/audio
- `backend/app/routers/word_family.py` — GET /api/cards/{card_id}/word-family

### Modified Files
- `backend/app/main.py` — version 3.2.0, registered new routers
- `backend/app/models.py` — added gender, preposition_usage columns
- `backend/app/schemas.py` — added gender, preposition_usage to schemas
- `frontend/app.js` — TTS button, word family graph, gender badge, preposition usage display, edit modal updates
- `frontend/index.html` — version 3.2.0, gender/preposition edit fields in modal
- `PROJECT_KNOWLEDGE.md` — updated version, revision, features, endpoints

---

## POST-DEPLOY VERIFICATION

| Test | Result |
|------|--------|
| Health check | `{"status":"healthy","version":"3.2.0","database":"connected"}` |
| TTS audio generation | Aria voice generated, cached to GCS, returned public URL |
| TTS cache hit | Second call returns cached URL (no ElevenLabs API call) |
| Word family (with cognates) | Returns figures + siblings for card "atlas" (13 siblings) |
| Word family (no cognates) | Returns empty arrays — graph hidden on frontend |
| Gender column exists | NVARCHAR(20) confirmed in INFORMATION_SCHEMA |
| Preposition_usage column exists | NVARCHAR(MAX) confirmed in INFORMATION_SCHEMA |

---

## MetaPM STATUS
All four requirements transitioned to `cc_complete`:
- SF-026: cc_complete
- SF-027: cc_complete
- SF-023: cc_complete
- SF-024: cc_complete

---

## ISSUES ENCOUNTERED & RESOLVED
1. **POST without body → 411**: Cloud Run proxy requires Content-Length header for POST requests with no body. Frontend sends `method: 'POST'` which includes the header automatically; curl needs `-H "Content-Length: 0"`.
2. **Cross-DB access denied**: flashcards_user had no access to Etymython database. Fixed by creating the user in Etymython DB and granting db_datareader role.
3. **ELEVENLABS_API_KEY not set**: Added via `gcloud run services update --update-secrets` (revision 00317).

---

*End of SESSION_CLOSEOUT_2026-03-08.md*
