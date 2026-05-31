# BWTL Etymology Surface — REV-2 Wiring Notes

Hand-off doc for CC + CAI. Describes the new design surfaces in this bundle and what production needs to wire them up. Companion to the in-app **Spec** tab (§4.6, §4.7) and §7 backlog reconciliation.

---

## TL;DR

REV-2 absorbs the standalone Etymython app into BWTL by adding five new components to the word-card center column and one new topbar capability set. **Backend changes are small** — three new SF columns, one new table, and one new merged response shape on an existing endpoint.

---

## What changed in the design

### Word card (center column)

Rendered top-to-bottom inside `<WordCard>`:

1. **Hero — IPA + anglicized pronunciation pills**
   Two side-by-side pills with their own audio buttons. `IPA` tag in mono; `English` tag for the anglicized phonetic. Both visible when both exist; either renders alone if the other is null.

2. **Multi-root PIE display** (`MultiRootPie`)
   Equation-style. At N=1 a solo large pill. At N≥2, pills joined by `+` separators that auto-wrap. Each pill has audio, IPA, gloss, reflex count, and click-drills to PIE Explorer in the right rail. Compound caveat row below the equation explains the construction.

3. **Etymology (layered)** — unchanged from REV-1.

4. **Origin Story** (`OriginStoryPanel`) — **figure cards only**
   Reading-view narrative. Figure names auto-linkified to `xlink.myth` styling. Footer rail of attestation pills (e.g., `Hesiod · ~700 BC`).

5. **Family Tree** (`FamilyTreeGraph`) — **figure cards only**
   Inline hierarchical SVG, always visible. Three tiers:
   - **Top:** parents
   - **Middle:** subject (large center node) · consort to the right with `=` bar connector · siblings clustered upper-left · lateral relations on the wings
   - **Bottom:** children
   Lateral relations (`equivalent`, `inverse_of`, `distinct_from`, `often_confused_with`) sit on the wings with dashed connectors color-coded (red = distinct, teal = equivalent). Click any node to navigate to that figure.

6. **Cognates, Fun facts** — unchanged from REV-1, but each now graceful-falls-back to an inline "Ask AI" CTA when the array is empty.

7. **Scholarly Notes** (`ScholarlyNotesStack`)
   Compact citation stack. First entry expanded by default, four collapsed headers. Per-entry kind badge (`dict` / `root` / `lex` / `freq`) + confidence %. Compound words render one column per root, side-by-side. Includes scholarly disagreement (e.g., Beekes-rejects-Watkins on Chronos) with a small caveat box.

8. **Empty Etymology State** (`EmptyEtymologyState`)
   When `card.pie_roots` is empty (e.g., recent loanwords like `fc_le_bac`), all etymology sections collapse into four placeholder rows, each with an "Ask AI to research" button. Surfaces `card.non_pie_reason` if set.

### Topbar (§4.7)

- **FTS search** — live filter across cards, figures, and PIE roots. Matches `flashcards.{word_or_phrase, definition, pie_root, anglicized, ipa}`, `mythological_figures.{english_name, greek_name, domain}`, `pie_roots.{root, gloss}`. Results grouped by kind with type-pill prefixes.
- **Language filter** — dropdown embedded in the search input. Reads `languages` table; scopes both search results AND the card prev/next nav.
- **Card prev/next** — `‹ N / M ›` control in the right cluster, visible only on study/card view. Keyboard `Alt+←` / `Alt+→`.

---

## Backend wiring required

### New SF columns

```sql
ALTER TABLE flashcards
  ADD COLUMN pie_roots         text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN anglicized        text    NULL,
  ADD COLUMN non_pie_reason    text    NULL;
```

| Column            | Replaces / supplements                | Notes                                                                                                                                  |
| ----------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `pie_roots`       | Array form of single `pie_root`       | Keep `pie_root` for back-compat; FE prefers `pie_roots` when non-empty, falls back to `[pie_root]`. Compound words use full array.     |
| `anglicized`      | New                                   | Free-text anglicized phonetic ("KROH-nos", "soov-NEER"). AI-fillable.                                                                  |
| `non_pie_reason`  | New                                   | Human-readable reason this card has no PIE root. Surfaced verbatim in the empty-state. Optional; safe to leave NULL.                   |

### New table — `scholarly_notes`

```sql
CREATE TABLE scholarly_notes (
  id           bigserial PRIMARY KEY,
  pie_root     text     NOT NULL,
  source       text     NOT NULL,   -- 'Beekes EDPIE' | 'Watkins AHD-IE' | 'Kroonen EDPGmc' | 'LSJ' | 'DCC frequency' | 'Frisk GEW' | ...
  ref          text     NULL,       -- e.g. 'p. 947' or 'rank 42'
  headword     text     NULL,       -- the scholar's headword, often differs from the card word
  kind         text     NOT NULL,   -- 'dictionary' | 'root' | 'lexicon' | 'frequency'
  excerpt      text     NOT NULL,
  confidence   numeric  NULL,       -- 0..1, optional
  contradicts  text     NULL,       -- if this entry rejects another root attribution; renders the caveat box
  UNIQUE (pie_root, source, ref)
);
CREATE INDEX scholarly_notes_pie_root_idx ON scholarly_notes (pie_root);
```

**Ingestion strategy:** one-time pass against the Portfolio RAG `etymology` collection, scoped to Beekes / Watkins / Kroonen / DCC / LSJ. Backfill via batch job — same shape as TSK-001. Target: ≥5 entries per root.

### Endpoint changes

#### `GET /api/flashcards/pie-explorer/{pie_root}` (existing, extended)

Already merges SF + EFG per REV-1. Add `scholarly_notes` to the response:

```json
{
  "pie_root": "*men-",
  "root": { … },
  "language_paradigm": { "Latin": [...], "Greek": [...], "Sanskrit": [...], "French": [...] },
  "verbal_paradigm": "…",
  "nominal_derivatives": "…",
  "modern_cognates": "…",
  "scholarly_notes": [
    { "source": "Beekes EDPIE", "ref": "p. 947", "headword": "*men- (1)",
      "kind": "dictionary", "excerpt": "…", "confidence": 0.95 },
    …
  ]
}
```

The FE reads `scholarly_notes` for the ScholarlyNotesStack. For compound words the FE makes N parallel requests and renders columns side-by-side.

#### `GET /api/search` (new)

The topbar FTS hits one endpoint. Returns up to 24 matches across three result kinds:

```json
{
  "q": "memory",
  "language_filter": "el",      // null = all
  "results": [
    { "kind": "card",     "id": "fc_mnemi",   "label": "μνήμη", "sub": "Greek · Memory…",      "pie_root": "*men-" },
    { "kind": "figure",   "id": "mnemosyne",  "label": "Mnemosyne", "sub": "Titan · memory…", "pie_root": "*men-" },
    { "kind": "pie_root", "id": "*men-",      "label": "*men-",  "sub": "to think · 18 reflexes" }
  ]
}
```

Match fields per kind:
- `card`: `word_or_phrase`, `definition`, `pie_root`, `anglicized`, `ipa`
- `figure`: `english_name`, `greek_name`, `domain`
- `pie_root`: `root`, `gloss`

### Figure relations (existing, formalized)

The FamilyTreeGraph reads `mythological_figures.relations` and expects this rel set:

| `rel`                     | Tier      | Connector       |
| ------------------------- | --------- | --------------- |
| `parent`                  | top       | solid           |
| `sibling`                 | middle    | dotted (under shared parent crossbar) |
| `consort`                 | middle    | bold `=` bar    |
| `child` / `mother_of` / `father_of` | bottom | solid |
| `equivalent`              | wing-right | dashed teal    |
| `inverse_of`              | wing-right | dashed teal    |
| `distinct_from`           | wing-left | dashed red      |
| `often_confused_with`     | wing-left | dashed red      |

Plural relations (e.g., "The Nine Muses") use `{ id, name, plural: N }` and render as stacked cards. The FE handles the visual; backend just needs the count.

### Audio fallbacks

`pie_audio_url` already covered by REQ-011 (95% filled). Anglicized audio is generated on-demand via the existing TTS endpoint with the anglicized text as input — no new column needed (the audio URL is cached in `pie_audio_url` if pre-generated, otherwise generated and cached on first play).

---

## Files in this bundle

| Path                    | What's new in REV-2                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `src/etymology.jsx`     | New file. The five new components: `MultiRootPie`, `ScholarlyNotesStack`, `OriginStoryPanel`, `FamilyTreeGraph`, `EmptyEtymologyState`. |
| `src/data.js`           | New: `SCHOLARLY_NOTES` table, `LANGUAGE_FILTERS`, demo cards `fc_chronos` / `fc_compound` / `fc_le_bac`, figure `chronos`, three new PIE roots (`*gʰer-`, `*kom-`, `*dʰeh₁-`, plus compound key `*kom-+*dʰeh₁-`). Existing cards retrofitted with `anglicized`. Mnemosyne extended with full family tree relations + attestations. |
| `src/workspace.jsx`     | `WordCard` integrates the five new sub-components; existing layered etymology / cognates / fun-facts retained as-is with empty-state inline CTAs.                  |
| `src/app.jsx`           | FTS search + language filter dropdown + card prev/next (Alt+←/→).                    |
| `src/panels.jsx`        | Null-guards on `PiePanel` and `EfgPanel` so the empty-state path doesn't crash the rail. |
| `src/spec.jsx`          | New §4.6 (Etymology surface) and §4.7 (Topbar search + nav). REV-2 callout up top.    |
| `src/icons.jsx`         | New: `chevron_l`, `scroll`.                                                          |
| `index.html`            | Loads `src/etymology.jsx`. New CSS for `.pie-rootpill` and `.pron-pill`.             |

---

## Demo cards in the prototype

- **fc_souvenir** — single root (`*gʷem-`), no figure. Baseline.
- **fc_chronos** — single root (`*gʰer-`), full mythological figure with family tree + origin story. Shows the figure-only surfaces.
- **fc_compound** — multi-root (`*kom- + *dʰeh₁-`). Shows the equation display + side-by-side ScholarlyNotes columns.
- **fc_le_bac** — no PIE root. Shows the empty-state surface and exercises the rail null-guard.

Cycle them with the `‹ N / M ›` arrows or `Alt+←` / `Alt+→`.

---

## Open items (not blocking, flag for next sprint)

- `scholarly_notes` ingestion pass needs scope decision: full Beekes (~3000 entries) or just the ~1057 attested PIE roots in EFG. Recommend the latter — drives the surface immediately, can extend later.
- Plural relation rendering (e.g. "The Nine Muses") currently renders as a single stacked-card node. If PL wants individual nodes for each Muse, the data shape supports it (drop the `plural` field, expand to N entries) — but the SVG layout would need a vertical expand-toggle to avoid breaking the three-tier grid.
- The Mithraic Aion-Chronos image and the Damascius citation icon are placeholders; flag for real asset ingest.
