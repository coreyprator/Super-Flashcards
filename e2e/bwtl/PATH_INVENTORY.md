# BWTL04 Path Inventory
**Sprint:** BWTL04 | **Date:** 2026-05-17  
**Source:** bwtl01_integration_inventory.md + live codebase audit + deployed API probes  
**Total paths:** 35

## Legend
- **Legacy** (P001–P011): SF core endpoints; existed before BWTL redesign.
- **New BWTL** (P012–P021): Endpoints added in BWTL03 (chat, bookmarks, admin coverage).
- **Cross-app** (P022–P030): Calls to EM, EFG, RAG, ArtForge services.
- **Role/auth** (P031–P035): Auth-gated and role-differentiation paths.

---

## Path Table

| path_id | be_endpoint | fe_view | expected_response_shape | fe_data_assertion |
|---------|------------|---------|-------------------------|-------------------|
| P001 | `GET /api/flashcards/{id}` | Study › Word card center | `{id, word_or_phrase, definition, pie_root, audio_url, efg_node_id, ipa_pronunciation}` | `word_or_phrase` from BE appears in word card hero `.display` element |
| P002 | `GET /api/flashcards/?limit=N` | Library › Cards grid | `{items:[{id,word_or_phrase,definition,language,pie_root}], total}` | First item `word_or_phrase` appears in a card tile inside `.card` grid |
| P003 | `GET /api/study/next` | Study › Queue list | `[{card_id, due, interval_days, last_grade, ease_factor}]` | Card word from first queue item appears in queue row label |
| P004 | `GET /api/study/sessions` (aggregate) | Study › Streak + this-week stats | `{reviewed_count, good_pct, streak_days, new_this_week}` | Session count / streak number appears in stats widget |
| P005 | `GET /api/languages` | Library › Cards language filter chips | `[{id, name, code, total_cards}]` | Language `name` from first item appears as a filter button |
| P006 | `GET /api/users/me` | Settings › Identity panel + topbar role chip | `{id, email, role_tier, display_name}` | `email` from BE appears in Settings identity section |
| P007 | `POST /api/audio/tts` | Study › Word card audio button (click) | `{audio_url: "/audio/...mp3"}` | `<audio>` element `src` attribute matches `audio_url` from response |
| P008 | `POST /api/v1/pronunciation/score` | Study › Pronunciation score panel | `{overall_score, phoneme_analysis:[{phoneme,score}]}` | Numeric score (0–100) appears in score panel |
| P009 | `GET /api/v1/voice_clone` | Settings › Audio voices list | `[{id, voice_name, elevenlabs_voice_id, status}]` | `voice_name` from first item appears in voice selector list |
| P010 | `GET /api/v1/cards/{id}/dcc` | Library › DCC row | `{dcc_frequency_rank, english_definition, greek_word}` | `dcc_frequency_rank` integer appears in DCC detail row |
| P011 | `POST /api/document/parse` | Admin › Document import recent table | `{words:[{word_or_phrase,definition,language}], doc_title}` | First parsed `word_or_phrase` appears in import preview table |
| P012 | `GET /api/flashcards/pie-explorer/{root}` | Study › PIE Explorer right rail | `{pie_root, verbal_paradigm(JSON str), modern_cognates(JSON str), language_paradigm(obj), branches:[{id,word}]}` | `verbal_paradigm` text (parsed content) appears in `.efg-prose .body` element in PIE panel |
| P013 | `POST /api/chat/threads` | Study › Chat dock new thread chip | `{id, anchor_mode, anchor_value, created_at, title}` | New thread title/id appears in thread chip list inside chat dock |
| P014 | `GET /api/chat/threads?anchor_value={card_id}` | Study › Chat dock thread list | `[{id, anchor_mode, anchor_value, messages_count}]` | Thread count (`messages_count`) or thread row appears in chat dock |
| P015 | `POST /api/chat/threads/{id}/messages` | Study › Chat message bubble | `{id, content, role:"user", created_at}` | `content` text from POST body appears in chat bubble `.msg` element |
| P016 | `POST /api/chat/promotions` | Study › Accept-to-card audit log | `{id, target_field, after_value, accepted_by}` | `target_field` label appears in promotions audit log row |
| P017 | `GET /api/chat/threads` (no filter) | Chat tab › Threads index | `[{id, anchor_mode, anchor_value, title}]` | Thread `anchor_value` string appears in thread index row |
| P018 | `POST /api/bookmarks` | Study › Bookmark toggle (star icon) | `{id, kind:"flashcard", resource_id}` | Bookmark icon changes to filled state after POST succeeds |
| P019 | `GET /api/bookmarks?owner_id={user_id}` | Bookmarks tab › Cards list | `[{id, kind, resource_id, word_or_phrase}]` | Bookmarked card `word_or_phrase` appears in Bookmarks view |
| P020 | `POST /api/bookmark_collections` | Bookmarks › Sidebar new collection | `{id, name, owner_id, card_count:0}` | Collection `name` appears in collections sidebar after create |
| P021 | `GET /api/admin/coverage` (PL auth) | Admin › Data health 16-field table | `{fields:[{field,coverage_pct,null_count,total}]}` | Coverage `coverage_pct` percentages appear in admin health table rows |
| P022 | `GET https://efg.rentyourcio.com/api/graph` | Study › EFG Graph panel (right rail) | `{nodes:[{id,label,node_type,pie_root}], edges:[{source,target}]}` | At least one `label` from `nodes` appears inside EFG graph panel element |
| P023 | `GET https://efg.rentyourcio.com/api/roots` | Library › PIE roots grid (Roots tab) | `[{id,label,language,gloss}]` | First root `label` appears in Library Roots tab grid |
| P024 | `GET https://etymython.rentyourcio.com/api/v1/figures?limit=20` | Library › Figures grid (Figures tab) | `[{id,english_name,latin_name,role,description}]` | Figure `english_name` (e.g. "Aphrodite") appears in Figures tab card |
| P025 | `GET https://etymython.rentyourcio.com/api/v1/cognates/lookup?word={word}` | Study › Card cognates strip | `{cognates:[{word,sf_card_id,pie_root}]}` or `null` | Cognate word appears in cognates strip on word card |
| P026 | `GET https://etymython.rentyourcio.com/api/v1/figures/{id}/mythology-data` | Study › Etymython panel hero | `{name,description,myths:[{title,text}],etymology_notes}` | Figure `name` appears in Etymython panel header |
| P027 | `GET https://portfolio-rag-57478301787.us-central1.run.app/search/etymology?q={word}` | Study › RAG panel rows + Library Beekes tab | `[{text,source,score}]` | Result `text` snippet appears in RAG panel result row |
| P028 | `POST https://artforge.rentyourcio.com/api/external/generate-video` (via SF proxy) | Generate › Word job tile created | `{job_id, status:"queued", word}` | `job_id` (UUID) appears in Generate jobs table row |
| P029 | `GET https://artforge.rentyourcio.com/api/external/jobs/{job_id}` (via SF proxy) | Generate › Job status row | `{job_id, status, video_url, created_at}` | `status` value ("queued"/"processing"/"done") appears in job status chip |
| P030 | `GET https://etymython.rentyourcio.com/api/v1/figures/{id}/artforge-story` | Generate › Figure story panel | `{story_text, images:[{url}], figure_name}` | `story_text` snippet appears in Generate figure panel |
| P031 | `GET /api/flashcards/{id}` (`audio_url` field) | Study › Word card audio `<audio>` element | `audio_url` field non-null | `<audio>` element with `src` matching `audio_url` is in DOM |
| P032 | `GET /api/languages` (unauthenticated) | Library › Language filter | `[{id,name,code,total_cards}]` returns 200 without auth | Language name appears in filter chips without login |
| P033 | ⌘K universal search (SF + EFG) | All views › Search palette dropdown | `[{kind, id, label, source}]` from combined SF+EFG search | Search result `label` appears in palette dropdown |
| P034 | `GET /api/admin/coverage` (role=pl, authenticated) | Admin view visible | full 16-field coverage JSON | Admin link visible in nav; coverage table renders percentages |
| P035 | `GET /api/admin/coverage` (role=learner) | Admin link NOT in nav | 401/403 from BE | Nav has no "Admin" item; direct fetch from page context returns 401/403 |

---

## Wiring Gap Notes (observed pre-fix)

Based on codebase audit (2026-05-17), these paths have confirmed wiring gaps:

| path_id | gap type | evidence |
|---------|----------|----------|
| P001 | **No auto-fetch on mount** | `Workspace` returns null for default `fc_souvenir` mock ID; `fetchCard()` never called automatically |
| P002 | **No auto-fetch on mount** | `CardsTab` reads `Object.values(window.BWTL.FLASHCARDS)` — always empty on initial load |
| P003 | **Endpoint not wired** | `/api/study/next` returns 404 on live site; `STUDY_QUEUE` is a stub empty array |
| P005 | **Stub data** | `LANGUAGES` in bwtl-api.js is a static string array, not fetched from `/api/languages` |
| P006 | **Not implemented** | `/api/users/me` path exists in backend but no FE component calls it |
| P012 | **Conditional render failure** | `PiePanel` returns null if `window.BWTL.PIE_ROOTS[pieRootKey]` is empty; `fetchPieRoot()` never called |
| P013–P017 | **Stub data** | `CHAT_THREADS`, `CHAT_PROMOTIONS` are empty stubs; chat components don't call API on mount |
| P018–P020 | **Stub data** | `BOOKMARKS` is an empty stub; `createBookmark()` exists but not wired to UI state |
| P021 | **Auth required** | `getCoverage()` returns 401 without auth token; FE passes no auth header |
| P022–P030 | **Cross-app not fetched** | `NODES`, `FIGURES`, `BEEKES_DOCS`, `DCC_WORDS` all start as empty stubs |

---

## Source Files
- Backend routers: `Super-Flashcards/backend/app/routers/*.py`
- Frontend API wrapper: `Super-Flashcards/frontend/bwtl/src/bwtl-api.js`
- FE components: `Super-Flashcards/frontend/bwtl/src/*.jsx`
- BWTL01 inventory: `G:/My Drive/Code/Python/bwtl01_integration_inventory.md`
