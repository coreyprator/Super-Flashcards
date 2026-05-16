// Spec mode — IA tree, state diagram, role permission matrix,
// ArtForge integration spec, BWTL01 backlog reconciliation table.
//
// One scrollable document so the engineering agent can read it top-to-bottom.

function SpecDoc() {
  return (
    <div className="doc">
      <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--fg-4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>BWTL · Unified app spec</div>
      <h1>Bring Words to Life — design contract</h1>
      <p style={{ color: 'var(--fg-3)', fontSize: 15, maxWidth: '72ch' }}>
        This document is the design half of the BWTL01 reconciliation contract. Every line in <code>bwtl01_integration_inventory.md</code> maps to a row at the bottom (
        <strong>COVERED</strong> · <strong>CONSOLIDATED</strong> · <strong>DEPRECATED</strong> · <strong>GAP</strong>). The interactive prototype demonstrates the high-density surfaces; this document specifies the contracts behind them.
      </p>

      <div className="rationale">
        <strong>Design system inheritance.</strong> All visual primitives (color, type, spacing, components, shell pattern) come from the ArtForge redesign project (<code>019e28ca-daa4-78aa-bde4-5fa2eb264603</code>). The four BWTL-specific accents (<span className="pill pie">PIE</span> <span className="pill graph">EFG</span> <span className="pill myth">EM</span> <span className="pill forge">AF</span>) sit at the same oklch chroma/lightness as the AF purple accent — only hue varies. No new typography, no new spacing scale, no new radius tokens.
      </div>

      <div className="rationale" style={{ borderLeftColor: 'var(--ok)', background: 'linear-gradient(90deg, color-mix(in oklch, var(--ok) 8%, transparent), transparent 60%)' }}>
        <strong style={{ color: 'var(--ok)' }}>Revision 1 — May 2026.</strong> This doc incorporates five changes from the design review: (1) <em>Chat anchor</em> inverted to <code>flashcard_id</code> primary; (2) <em>Latin</em> promoted to first-class structured column in PIE Explorer; (3) chat <em>context payload</em> made visible and editable; (4) chat <em>Accept</em> button + field dropdown replaces the review queue; (5) <em>Theodoros tab renamed to Chat</em> and the approval gate removed — Theodoros is now a permission tier, not a UI surface. Every change is reflected below; deltas are marked <span className="pill ok" style={{ fontSize: 9.5 }}>REV-1</span>.
      </div>

      {/* ─── IA TREE ──────────────────────────────────────────────────────── */}
      <h2>1 · Information architecture</h2>
      <p>
        Six production apps collapse into one shell with four top-level destinations. Super Flashcards becomes the front door (<strong>Study</strong>); the other five become panels, sidecars, or sub-routes.
      </p>
      <div className="ia-tree">
{`<span class="node-app">BWTL — unified shell</span>
├─ <span class="node-section">Study</span>                     <span class="src">(front door · was SF)</span>
│  ├─ Today's queue              <span class="src">SF.study_sessions + SRS</span>
│  ├─ Word card                  <span class="src">SF.flashcards + SF.flashcard_pie_roots</span>
│  │  ├─ Hero (image, IPA, audio, def)
│  │  ├─ Etymology (layered)     <span class="src">+ SF.flashcard_pie_roots.etymology_layer (REQ-008)</span>
│  │  ├─ Cognates strip          <span class="src">SF.english_cognates + EM cross-link</span>
│  │  └─ Fun-fact list           <span class="src">EM.fun_facts (1012 rows) · figure-linked</span>
│  ├─ Right rail · panel stack   <span class="node-section">[NEW PRIMITIVE]</span>
│  │  ├─ PIE Explorer            <span class="src">SF + EFG MERGED · 4-language paradigm cols (REV-1)</span>
│  │  ├─ Etymology Graph         <span class="src">EFG.nodes + EFG.edges</span>
│  │  ├─ Etymython figure        <span class="src">EM.mythological_figures + EM.figure_relationships</span>
│  │  ├─ Portfolio RAG           <span class="src">RAG /search · etymology collection</span>
│  │  └─ ArtForge (panel mode)   <span class="src">AF /api/external/generate-video · ETYMOLOGY ONLY</span>
│  └─ Chat sidecar (bottom dock) <span class="node-section">[REV-1 anchor inverted]</span>
│     ├─ Anchor = flashcard_id primary  <span class="src">card·N chip in header (no pie_root fallback)</span>
│     ├─ Per-turn context-snapshot expander <span class="src">tokens in/out · fields bundled</span>
│     ├─ Thread-level context editor       <span class="src">fields · efg · figure · steering string</span>
│     └─ Per-msg Accept button + field dropdown <span class="src">writes directly · appends audit row</span>
│
├─ <span class="node-section">Bookmarks</span>                 <span class="node-section">[NEW PRIMITIVE]</span>
│  ├─ Words, PIE roots, figures, threads, collections  <span class="src">one polymorphic primitive</span>
│  ├─ Filters by kind / by date / by shared-with
│  └─ Collections                 <span class="src">share to anyone for class prep</span>
│
├─ <span class="node-section">Chat</span>                      <span class="src">(was "Theodoros" pre-REV-1)</span>
│  ├─ Threads                    <span class="src">cross-app index of all chat threads across cards</span>
│  ├─ Audit log                  <span class="src">chat_promotions · every Accept logged (who/when/before/after)</span>
│  ├─ New cards                  <span class="src">(was "Author") · single-card sheet + document import</span>
│  └─ Batch jobs                 <span class="src">(was "Batch") · monitor only · auto-apply, no approval gate</span>
│
└─ <span class="node-section">Settings</span>
   ├─ Identity & roles            <span class="src">BWTL.users / users → role tier</span>
   ├─ Audio voices                <span class="src">SF.UserVoiceClones · ElevenLabs</span>
   └─ Source apps                 <span class="src">deep-link out to standalone EFG, EM, AF</span>

<span class="node-leaf">// NOT in unified shell — remain standalone destinations:</span>
<span class="node-leaf">// • EFG graph editor (admin) → efg.rentyourcio.com</span>
<span class="node-leaf">// • ArtForge non-etymology projects → artforge.rentyourcio.com</span>
<span class="node-leaf">// • Etymython figure CMS → etymython.rentyourcio.com/admin</span>

<span class="node-leaf">// REMOVED in REV-1:</span>
<span class="node-leaf">// • Theodoros review queue (approval gate) — every user accepts their own</span>
<span class="node-leaf">//   chat promotions directly. Theodoros = permission tier, not a surface.</span>
`.split('\n').map((line, i) => <div key={i} dangerouslySetInnerHTML={{ __html: line }} />)}
      </div>

      {/* ─── KEY WIREFRAMES TABLE ─────────────────────────────────────────── */}
      <h2>2 · Key screens delivered in the prototype</h2>
      <p>The prototype tab covers eight high-fidelity surfaces. The wireframes column lists what each prototype screen demonstrates.</p>
      <table>
        <thead>
          <tr><th>#</th><th>Screen</th><th>Open in prototype</th><th>Key novel pattern</th></tr>
        </thead>
        <tbody>
          <tr><td>W1</td><td>Word study — French <span className="greek">souvenir</span></td><td>Study → French souvenir</td><td>Three-zone shell; xlinks; cross-app drill-down cues</td></tr>
          <tr><td>W2</td><td>Word study — French <span className="greek">mémoire</span></td><td>Study → French mémoire</td><td>Same shell, different root → chat anchor switches</td></tr>
          <tr><td>W3</td><td>PIE Explorer panel — unified SF+EFG view</td><td>Right rail of W1 or W2</td><td>Stacked density (atomic → words → 3 EFG prose blocks); not tabs</td></tr>
          <tr><td>W4</td><td>AI Chat sidecar</td><td>Bottom of any Study screen</td><td>Card anchor (REV-1); context payload editor; per-msg Accept + field dropdown</td></tr>
          <tr><td>W5</td><td>Bookmarks</td><td>Top nav · Bookmarks</td><td>Polymorphic primitive across all 5 entity kinds</td></tr>
          <tr><td>W6</td><td>Chat tab — cross-app index + audit log</td><td>Top nav · Chat (visible to all roles)</td><td>Threads grouped by card; audit log; per-Accept before→after diff (REV-1)</td></tr>
          <tr><td>W7</td><td>Integration moment — figure drill-down</td><td>Click <em>Mnemosyne</em> in a fun fact (W2)</td><td>Source link glow + panel glow; chat anchor unchanged</td></tr>
          <tr><td>W8</td><td>ArtForge panel mode</td><td>Right rail of any Study screen</td><td>Etymology-only generation surface; deep-link out to standalone</td></tr>
        </tbody>
      </table>

      {/* ─── STATE DIAGRAM ─────────────────────────────────────────────────── */}
      <h2>3 · Navigation state diagram</h2>
      <p>Walk-through: word → PIE → cognate → figure → fun fact → chat.</p>
      <div className="state-graph">
        <svg viewBox="0 0 920 360" style={{ width: '100%', height: 360 }}>
          <defs>
            <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0L10 5L0 10z" fill="var(--fg-4)" />
            </marker>
            <marker id="ahA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0L10 5L0 10z" fill="var(--acc)" />
            </marker>
          </defs>

          {[
            { x: 60,  y: 60,  w: 160, h: 60, label: 'Word card', sub: 'fc_souvenir', clr: 'var(--acc)' },
            { x: 280, y: 60,  w: 160, h: 60, label: 'PIE panel', sub: '*gʷem-', clr: 'var(--pie)' },
            { x: 500, y: 60,  w: 160, h: 60, label: 'EFG graph', sub: '+sibling words', clr: 'var(--graph)' },
            { x: 720, y: 60,  w: 160, h: 60, label: 'Cognate ⇒ new card', sub: 'fc_avenir', clr: 'var(--acc)' },
            { x: 60,  y: 200, w: 160, h: 60, label: 'Fun fact', sub: 'mentions Mnemosyne', clr: 'var(--myth)' },
            { x: 280, y: 200, w: 160, h: 60, label: 'Etymython panel', sub: 'mnemosyne', clr: 'var(--myth)' },
            { x: 500, y: 200, w: 160, h: 60, label: 'Chat sidecar', sub: 'anchored to fc_souvenir', clr: 'var(--acc)' },
            { x: 720, y: 200, w: 160, h: 60, label: 'Accept → card field', sub: 'audit-logged', clr: 'var(--ok)' },
          ].map((n, i) => (
            <g key={i}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="10"
                fill={`color-mix(in oklch, ${n.clr} 8%, var(--bg-2))`}
                stroke={n.clr} strokeWidth="1.2" />
              <text x={n.x + n.w/2} y={n.y + 24} textAnchor="middle" fill={n.clr} fontFamily="var(--ff-sans)" fontSize="13" fontWeight="700">{n.label}</text>
              <text x={n.x + n.w/2} y={n.y + 44} textAnchor="middle" fill="var(--fg-3)" fontFamily="var(--ff-mono)" fontSize="10">{n.sub}</text>
            </g>
          ))}

          {/* arrows */}
          {[
            [220, 90, 280, 90, 'click *gʷem-'],
            [440, 90, 500, 90, 'open in graph'],
            [660, 90, 720, 90, 'click cognate'],
            [140, 120, 140, 200, 'click figure in fact'],
            [220, 230, 280, 230, 'figure detail'],
            [440, 230, 500, 230, 'discuss in chat'],
            [660, 230, 720, 230, 'accept insight'],
            [800, 130, 800, 200, 'chat follows card'],
          ].map((a, i) => (
            <g key={'a'+i}>
              <line x1={a[0]} y1={a[1]} x2={a[2]} y2={a[3]} stroke="var(--fg-4)" strokeWidth="1.2" markerEnd="url(#ah)" />
              <text x={(a[0]+a[2])/2} y={(a[1]+a[3])/2 - 6} textAnchor="middle" fill="var(--fg-3)" fontFamily="var(--ff-mono)" fontSize="9" letterSpacing="0.04em" style={{ textTransform: 'uppercase' }}>{a[4]}</text>
            </g>
          ))}

          {/* invariant note */}
          <text x={460} y={330} textAnchor="middle" fill="var(--fg-4)" fontFamily="var(--ff-mono)" fontSize="10">
            INVARIANT — chat anchor stays on the current flashcard_id; Accept writes direct + audit row
          </text>
        </svg>
      </div>

      {/* ─── COMPONENT SPECS ──────────────────────────────────────────────── */}
      <h2>4 · Component contracts</h2>

      <h3>4.1 — Unified shell</h3>
      <table>
        <thead><tr><th>Region</th><th>Contents</th><th>Width / height</th><th>Persistence</th></tr></thead>
        <tbody>
          <tr><td>Topbar</td><td>Brand · primary nav · universal search · bookmark rail · role chip</td><td>56px fixed</td><td>Always visible</td></tr>
          <tr><td>Crumbs</td><td>Trail of current route</td><td>34px</td><td>Hide on Settings</td></tr>
          <tr><td>Center column</td><td>Word card or section content</td><td>1fr min 720px</td><td>Always visible</td></tr>
          <tr><td>Right rail</td><td>Panel stack (PIE, EFG, EM, RAG, AF); ordered & pinnable</td><td>420px fixed; collapses to 36px strips when stacked over 3 open</td><td>Per-card preference + global default</td></tr>
          <tr><td>Chat dock</td><td>Bottom-anchored. 56px collapsed, 460px expanded</td><td>1100px max, centered</td><td>Persists across sessions; height per-user</td></tr>
        </tbody>
      </table>

      <h3>4.2 — PIE Explorer panel (unified)</h3>
      <p>
        The architectural integration: SF flashcards branch list + EFG <code>efg_pie_explorer_data</code> verbal / nominal / cognates prose, in one stack. <strong>Decision: stacked sections, not tabs.</strong>
        Tabs hide density behind clicks; this user wants a glance-able dense view, and the three prose blocks together total ~2900 chars — comfortably scannable in one column.
      </p>
      <table>
        <thead><tr><th>Section</th><th>Source</th><th>Fallback</th></tr></thead>
        <tbody>
          <tr><td>Root hero</td><td><code>EFG.nodes.pie_ipa</code> + <code>pie_audio_url</code> (95% coverage)</td><td>SF <code>flashcards.pie_ipa</code> (70%) · TTS-on-demand if both null</td></tr>
          <tr><td>Atomic decomposition</td><td>Compound roots split by <code>+</code> separator (new field <code>flashcard_pie_roots.composition</code>)</td><td>Hidden if root is atomic</td></tr>
          <tr><td>Word branches strip</td><td><code>SF.flashcards WHERE pie_root = X</code> ∪ <code>EFG.nodes WHERE node_type='word' AND pie_root_id = root.id</code></td><td>SF-only if EFG join fails</td></tr>
          <tr><td><span className="pill ok" style={{ fontSize: 9.5 }}>REV-1</span> Language paradigm (4 cols)</td><td>NEW: <code>EFG.efg_pie_explorer_data.language_paradigm</code> as structured JSON. Columns: <strong>Latin</strong> · Greek · Sanskrit · French. Each form: <code>{`{form, gloss, class, linked_card?, exclude?}`}</code>. <code>linked_card</code> turns the form into an xlink to the matching SF flashcard.</td><td>Hide a column if its array is empty; hide the section if all empty</td></tr>
          <tr><td>Verbal paradigm (prose)</td><td><code>EFG.efg_pie_explorer_data.verbal_paradigm</code></td><td>Hide section if NULL</td></tr>
          <tr><td>Nominal derivatives (prose)</td><td><code>EFG.efg_pie_explorer_data.nominal_derivatives</code></td><td>Hide section if NULL</td></tr>
          <tr><td>Modern cognates (prose)</td><td><code>EFG.efg_pie_explorer_data.modern_cognates</code></td><td>Hide section if NULL</td></tr>
        </tbody>
      </table>
      <div className="rationale">
        <strong>REV item 2 — Latin as first-class column (REQ-024).</strong> Latin was buried in the three prose blocks; this revision adds a structured <code>language_paradigm</code> JSON with Latin alongside French, Greek, and Sanskrit. Card-level <em>Etymology</em> text (AI-generated, narrative) is the word-history surface; this is the structural paradigm surface. <em>Complementary, not duplicate.</em> Backend implication: add the column to <code>efg_pie_explorer_data</code>; backfill from the existing prose via a one-time AI extraction pass (TSK to be filed).
      </div>
      <div className="rationale">
        <strong>Backend implication (unchanged).</strong> <code>GET /api/flashcards/pie-explorer/{'{'}pie_root{'}'}</code> must merge a second query against <code>EtymologyGraph.efg_pie_explorer_data</code>. Per the BWTL02 finding the plumbing already exists (SF calls <code>_get_efg_connection()</code> on card create) — wire one read, merge in response builder. Closes <strong>BUG-045</strong>.
      </div>

      <h3>4.3 — AI Chat sidecar <span className="pill ok" style={{ fontSize: 9.5 }}>REV-1</span></h3>
      <table>
        <thead><tr><th>Aspect</th><th>Decision</th><th>Rationale</th></tr></thead>
        <tbody>
          <tr><td>Anchor type</td><td><code>flashcard_id</code> primary <em>only</em>. No <code>pie_root</code> fallback.</td><td><strong>REV-1.</strong> Natural chat questions are card-specific (the prototype's own example: "Why is souvenir feminine in some texts?" — about French gender, not <code>*gʷem-</code>). With <code>flashcard_id</code> as the sole anchor, the 879 cards (30%) without a <code>pie_root</code> are a non-issue, not an edge case.</td></tr>
          <tr><td>Cross-card relevance</td><td>Surfaced via the <em>Promote</em> mechanism (§4.5) and the cross-app <em>Chat</em> tab. Not via anchor logic.</td><td><strong>REV-1.</strong> Decouples "what is this conversation tied to" from "which other cards are related" — those were entangled in the previous design.</td></tr>
          <tr><td>Anchor display</td><td>Persistent chip at left of chat header — purple <code>acc</code>, mode-tag <code>card</code>, word + card_id</td><td>User must always see which card their notes will save against.</td></tr>
          <tr><td>History indicator</td><td>Thread-count pill in collapsed dock header · "last: YYYY-MM-DD"</td><td>User knows there's existing history for this card.</td></tr>
          <tr><td>Thread switcher</td><td>Left rail when expanded, grouped by month</td><td>Threads are the navigable unit, not turns.</td></tr>
          <tr><td>Per-turn context snapshot <span className="pill ok" style={{ fontSize: 9 }}>REV-1</span></td><td>Each AI bubble has a small expander showing what the model received: <code>{`{card_fields, efg_node, figure, steering_applied, tokens_in, tokens_out}`}</code></td><td>BWTL02 finding — AI chat is unreliable without full card context bundled per turn. Make that visible so users can trust (or distrust) any specific turn.</td></tr>
          <tr><td>Thread context editor <span className="pill ok" style={{ fontSize: 9 }}>REV-1</span></td><td>"Context" button in chat header opens a panel: toggleable card fields (12 keys), checkbox to attach EFG node / figure, free-text <code>steering</code> directive. Stored on the thread row.</td><td>The <em>steering</em> string is the mechanism that prevents drift across long rabbit-hole threads. Without it, the AI silently wanders.</td></tr>
          <tr><td>Per-msg Accept dropdown <span className="pill ok" style={{ fontSize: 9 }}>REV-1</span></td><td>Each AI message with <code>promotable</code> set shows: target-field dropdown (16 keys, grouped by tier) + preview + Accept button. Writes directly. Appends one row to <code>chat_promotions</code>.</td><td><strong>REV item 4.</strong> Replaces the review-queue send. Modelled on the Verify PIE round-trip dialog. No second-party approval gate.</td></tr>
          <tr><td>Compose prompt chips</td><td>"fun fact?", "conjugation", "false cognate", "linked figures"</td><td>The four most-traveled question patterns from BWTL01 logs.</td></tr>
        </tbody>
      </table>

      <h3>4.4 — Chat tab (top-nav) <span className="pill ok" style={{ fontSize: 9.5 }}>REV-1</span></h3>
      <p>
        Renamed from <em>Theodoros</em>. Removes the approval-gate framing. Theodoros remains a power user via the permission matrix (§5), not via a dedicated surface. Four sub-tabs:
      </p>
      <table>
        <thead><tr><th>Sub-tab</th><th>Contents</th><th>Source</th></tr></thead>
        <tbody>
          <tr><td><strong>Threads</strong></td><td>Cross-app index of every chat thread, grouped by card. Click → study view with that thread active. Each thread shows its <em>context payload</em> read-only.</td><td><code>chat.threads</code> (anchored to <code>flashcard_id</code>)</td></tr>
          <tr><td><strong>Audit log</strong></td><td>Append-only table of every Accept action: <em>when · who · card · field · before → after · source thread</em>. Click the card name to jump into study.</td><td>NEW table <code>chat_promotions(id, when, who, thread_id, message_idx, card, field, before, after)</code></td></tr>
          <tr><td><strong>New cards</strong> <span className="src">(was "Author")</span></td><td>Single-card sheet entry point + document-import deep link. Rename reflects actual purpose — this isn't "review others' work", it's authoring.</td><td>Existing <code>POST /api/flashcards</code> + <code>POST /api/document/parse</code></td></tr>
          <tr><td><strong>Batch jobs</strong> <span className="src">(was "Batch")</span></td><td>Monitor only. Batch results auto-apply and append audit rows — no approval gate. PL-only triggers, everyone can read.</td><td>Same data as Admin · Batch jobs</td></tr>
        </tbody>
      </table>
      <div className="rationale">
        <strong>REV item 5.</strong> The <code>review_items</code> table (previously in §10 GAP) is no longer needed as a queue. It simplifies to the audit log shape above. The "PL/Theo auto-apply, others suggest" rule from the previous §1.2.3 collapses to "everyone Accepts via the dropdown" — no role branching in the write path.
      </div>

      <h3>4.5 — Bookmark primitive</h3>
      <table>
        <thead><tr><th>Kind</th><th><code>ref</code> resolves to</th><th>Visual</th></tr></thead>
        <tbody>
          <tr><td><code>word</code></td><td><code>SF.flashcards.id</code></td><td>Word in sans serif, accent tag</td></tr>
          <tr><td><code>pie_root</code></td><td><code>EFG.nodes.id</code> (pie_root type)</td><td>Root in Fraunces display, pie tag</td></tr>
          <tr><td><code>figure</code></td><td><code>EM.mythological_figures.id</code></td><td>English name + Greek, myth tag</td></tr>
          <tr><td><code>thread</code></td><td><code>chat.threads.id</code></td><td>Thread title, chat tag</td></tr>
          <tr><td><code>collection</code></td><td><code>bookmarks.collection_id</code> (new)</td><td>Ordered set of any of the above; sharable</td></tr>
        </tbody>
      </table>

      {/* ─── ROLE MATRIX ──────────────────────────────────────────────────── */}
      <h2>5 · Role permission matrix <span className="pill ok" style={{ fontSize: 9.5 }}>REV-1</span></h2>
      <p style={{ color: 'var(--fg-3)' }}>
        Roles are permissions, not surfaces. Every role sees the same UI (the Chat tab is universal); what differs is what they can <em>write</em>. Theodoros's instructor power lives in the rows below, not in a separate surface.
      </p>
      <table>
        <thead>
          <tr><th>Capability</th><th>PL</th><th>Theodoros</th><th>Tutor</th><th>Learner</th></tr>
        </thead>
        <tbody>
          <tr><td>Read all surfaces (Study, Chat, Bookmarks, …)</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
          <tr><td>Bookmark / add to personal collection</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
          <tr><td>Chat with AI · personal threads</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
          <tr><td>Edit thread context payload (steering string)</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
          <tr><td>Create flashcard directly</td><td>✓</td><td>✓</td><td>✓</td><td>✗</td></tr>
          <tr><td>Edit any flashcard field</td><td>✓</td><td>✓</td><td>own only</td><td>✗</td></tr>
          <tr><td>Accept chat insight → card field (writes directly, audit-logged)</td><td>✓</td><td>✓</td><td>own cards only</td><td>✗</td></tr>
          <tr><td>Create / edit mythological figure (Etymython)</td><td>✓</td><td>✓</td><td>✗</td><td>✗</td></tr>
          <tr><td>Trigger ArtForge video generation</td><td>✓</td><td>✓</td><td>✓</td><td>✗</td></tr>
          <tr><td>Edit EFG node / edge</td><td>✓</td><td>✗</td><td>✗</td><td>✗</td></tr>
          <tr><td>Run AI batch jobs (TSK-001 etc.)</td><td>✓</td><td>✗</td><td>✗</td><td>✗</td></tr>
          <tr><td>View audit log of own promotions</td><td>✓</td><td>✓</td><td>✓</td><td>n/a</td></tr>
          <tr><td>View audit log of <em>all</em> users' promotions</td><td>✓</td><td>✓</td><td>✗</td><td>✗</td></tr>
          <tr><td>Settings · audio voices</td><td>✓</td><td>✓</td><td>✓</td><td>view</td></tr>
        </tbody>
      </table>
      <p style={{ color: 'var(--fg-3)' }}>
        Top-bar role chip exposes a switcher in the prototype so each tier can be exercised. In production, role is set from <code>SF.users.role_tier</code> on login.
      </p>
      <div className="rationale">
        <strong>REV-1 — what changed.</strong> The row <em>"Promote chat insight → review queue"</em> (PL/Theo auto-apply · others suggest) is gone. Replaced by <em>"Accept chat insight → card field, writes directly, audit-logged"</em> — same capability for every role that can write to that card. The role gradient now lives in <em>which cards you can write to</em>, not in <em>whether your write needs approval</em>.
      </div>

      {/* ─── ARTFORGE SCOPE ───────────────────────────────────────────────── */}
      <h2>6 · ArtForge integration spec</h2>
      <p>
        Critical scope boundary: in this unified app, ArtForge appears <strong>only as a panel</strong> for etymology-driven generation. The standalone destination at <code>artforge.rentyourcio.com</code> remains the home for non-etymology projects (Patagonia flyfishing, video stories, etc.) and is the subject of the sibling project <code>019e28ca-daa4-78aa-bde4-5fa2eb264603</code>.
      </p>
      <table>
        <thead><tr><th>AF surface</th><th>Reachable from BWTL?</th><th>How</th></tr></thead>
        <tbody>
          <tr><td>Video generation for current word</td><td>✓ inline</td><td>ArtForge panel → "Generate" button → <code>POST /api/external/generate-video</code></td></tr>
          <tr><td>From-figure storyboard</td><td>✓ inline</td><td>Etymython panel → "From-figure storyboard" → <code>POST /api/v1/stories/from-figure</code></td></tr>
          <tr><td>Scene editor (etymology context only)</td><td>✓ inline (sub-modal)</td><td>ArtForge panel → "Scene editor"</td></tr>
          <tr><td>Story enrichment with EM facts</td><td>✓ inline</td><td>Story-detail · "Enrich" → <code>POST /api/stories/{'{'}id{'}'}/enrich</code></td></tr>
          <tr><td>AF gallery / library</td><td>deep-link out</td><td>Settings · Source apps · "Open ArtForge" → opens artforge.rentyourcio.com in new tab</td></tr>
          <tr><td>AF non-etymology projects</td><td>hidden</td><td>Not reachable from BWTL nav. Curated list at standalone AF only.</td></tr>
          <tr><td>AF storyboard for fly-fishing / other</td><td>hidden</td><td>Same — these belong to AF, not BWTL</td></tr>
          <tr><td>AF mythology pipeline (internal)</td><td>hidden</td><td>Service-to-service only; users never see this trigger</td></tr>
        </tbody>
      </table>

      {/* ─── BACKLOG RECONCILIATION ───────────────────────────────────────── */}
      <h2>7 · BWTL01 backlog reconciliation</h2>
      <p>
        Each row from <code>bwtl01_integration_inventory.md</code> placed against a unified-app surface. Status values: <span className="pill ok">COVERED</span> <span className="pill accent">CONSOLIDATED</span> <span className="pill err">DEPRECATED</span> <span className="pill warn">GAP</span>.
      </p>

      <h3>Section A — Super Flashcards</h3>
      <BacklogTable rows={[
        ['SF.flashcards (CRUD)', 'Study · word card + Chat · New cards (direct authoring)', 'COVERED'],
        ['SF.flashcard_pie_roots (multi-root junction)', 'PIE panel · atomic decomposition row', 'COVERED'],
        ['SF.flashcards.etymology_layer (0% filled — REQ-008)', 'Word card · Etymology section (rows by layer)', 'GAP'],
        ['SF GET /api/flashcards/pie-explorer/{pie_root}', 'PIE panel — SF+EFG merge + new language_paradigm column (REV-1)', 'GAP'],
        ['SF /api/ai/* (generate, batch)', 'Chat tab · Batch jobs (monitor) + per-field AI spark on word card', 'COVERED'],
        ['SF /api/study/* (SRS sessions)', 'Study · Today\'s queue', 'COVERED'],
        ['SF /api/document/parse', 'Chat tab · New cards · document import (deferred — not in prototype)', 'GAP'],
        ['SF /api/v1/pronunciation/*', 'Word card · IPA speaker button + Settings · voice clones', 'COVERED'],
        ['SF /api/admin/repair-pie-*', 'Admin · Batch jobs (auto-apply, audit-logged)', 'CONSOLIDATED'],
        ['SF /api/efg/backfill-pie-*', 'Admin · Batch jobs', 'CONSOLIDATED'],
        ['SF.flashcards.gender (0% filled — dead column)', 'n/a', 'DEPRECATED'],
        ['SF /api/v0/dcc.py (deprecated path)', 'n/a — replaced by /api/v1/cards/{id}/dcc', 'DEPRECATED'],
        ['SF iframe of EFG (?cardId=)', 'Replaced by xlink → PIE / EFG panels in same shell', 'CONSOLIDATED'],
      ]} />

      <h3>Section B — EFG / pie-network-graph</h3>
      <BacklogTable rows={[
        ['EFG /api/graph (full graph)', 'EFG panel · mini graph + deep-link to standalone graph editor', 'COVERED'],
        ['EFG /api/words?include_dcc=true', 'Used internally by SF dcc.py; surfaced as DCC rank pill on word card', 'COVERED'],
        ['EFG /api/pie-explorer/{root} (rich)', 'PIE panel · 3 prose blocks (verbal/nominal/modern)', 'COVERED'],
        ['EFG /api/pie-explorer/generate/{root}', 'Admin · Batch jobs (gen for 65 roots missing data)', 'COVERED'],
        ['EFG /api/rag-query, /api/rag/search', 'Portfolio RAG panel · scholarly entry block', 'CONSOLIDATED'],
        ['EFG /api/dictionary/search (Beekes viewer)', 'RAG panel takes over; standalone Beekes viewer remains', 'CONSOLIDATED'],
        ['EFG /api/admin/stats, /api/dcc/stats', 'Settings · health dashboard (not in prototype)', 'GAP'],
        ['EFG sf_url iframe overlay', 'Replaced by intrinsic word card in unified shell', 'DEPRECATED'],
        ['EFG.nodes.pie_audio_url (95% filled · 52 missing)', 'PIE panel falls back to TTS-on-demand for the 52', 'GAP'],
        ['EFG node CRUD (PATCH/DELETE)', 'PL only · admin sub-route (links to standalone graph editor)', 'COVERED'],
      ]} />

      <h3>Section C — Etymython</h3>
      <BacklogTable rows={[
        ['EM /api/v1/figures (CRUD)', 'Etymython panel + Chat · New cards (direct authoring)', 'COVERED'],
        ['EM /api/v1/cognates/lookup', 'Word card · cognates strip (already SF→EM cross-link)', 'COVERED'],
        ['EM /api/v1/figures/{id}/mythology-data', 'Used by ArtForge from-figure flow (server-side)', 'COVERED'],
        ['EM /api/v1/figures/{id}/artforge-story', 'Etymython panel · "From-figure storyboard" button', 'COVERED'],
        ['EM.mythological_figures.ipa_transcription (38% filled)', 'Etymython panel · IPA row · AI batch backfill', 'GAP'],
        ['EM.mythological_figures.pronunciation_audio_url (39% filled)', 'Admin · Batch jobs (auto-apply, audit-logged) — REV-1 retires the review row', 'GAP'],
        ['EM.fun_facts (1012 rows)', 'Word card · Fun facts section', 'COVERED'],
        ['EM.figure_relationships', 'Etymython panel · Relations list', 'COVERED'],
        ['EM.perseus_citations', 'Etymython panel · "Sources" footer (not in prototype)', 'GAP'],
        ['EM.cognate_greek_roots (2 rows)', 'Effectively unused', 'DEPRECATED'],
        ['EM.equivalent_figure_id (cross-myth)', 'Etymython panel · Relations · "equivalent" rel type', 'COVERED'],
        ['EM /api/v1/admin/migrate-sf-links', 'Admin · Batch jobs', 'CONSOLIDATED'],
        ['EM URL link to EFG (no API)', 'Replaced by intra-shell xlink to PIE panel', 'DEPRECATED'],
      ]} />

      <h3>Section D — Portfolio RAG</h3>
      <BacklogTable rows={[
        ['RAG /search, /semantic, /query', 'RAG panel + universal topbar search (etymology collection)', 'COVERED'],
        ['RAG /search/etymology', 'RAG panel · explicit scope', 'COVERED'],
        ['RAG /api/coverage*', 'Settings · health dashboard (not in prototype)', 'GAP'],
        ['RAG /ingest/* (admin)', 'PL only · admin sub-route', 'COVERED'],
        ['RAG /mcp (MCP protocol)', 'Service-to-service; no user surface', 'COVERED'],
        ['RAG `code` collection', 'Use MetaPM SQL code_files', 'DEPRECATED'],
      ]} />

      <h3>Section E — PIE Explorer (cross-app)</h3>
      <BacklogTable rows={[
        ['SF PIE Panel response shape', 'Merged into unified PIE panel response', 'CONSOLIDATED'],
        ['EFG PIE Panel response shape', 'Merged into unified PIE panel response', 'CONSOLIDATED'],
        ['"SF panel never reads from EFG"', 'Closed — unified endpoint reads both', 'GAP'],
        ['BUG-045 (modal shows stale data)', 'Closed — single endpoint, no stale cache split', 'GAP'],
        ['65 EFG PIE nodes with no explorer_data entry', 'Admin · Batch jobs · run EFG /api/pie-explorer/generate for 65 roots', 'GAP'],
        ['flashcard_pie_roots not queried by PIE endpoint', 'Closed — unified endpoint queries junction', 'GAP'],
      ]} />

      <h3>Section F — ArtForge</h3>
      <BacklogTable rows={[
        ['AF /api/external/generate-video (SF→AF)', 'ArtForge panel · Generate', 'COVERED'],
        ['AF /api/external/jobs/{id}', 'ArtForge panel · job status row', 'COVERED'],
        ['AF /api/v1/stories/from-figure (EM→AF)', 'Etymython panel · From-figure storyboard', 'COVERED'],
        ['AF /api/stories/{id}/enrich (etymology embed)', 'ArtForge panel · enrich row', 'COVERED'],
        ['AF galleries, library, non-etymology projects', 'Out of scope — deep-link to standalone', 'CONSOLIDATED'],
        ['AF /api/v1/mythology/figures (internal)', 'Service-to-service only', 'COVERED'],
      ]} />

      <h3>Cross-cutting · AI-healable fields (16)</h3>
      <BacklogTable rows={[
        ['SF.pie_audio_url (88% missing · TSK-001)', 'Admin · Batch jobs (TSK-001 tracker)', 'GAP'],
        ['EM figure IPA/audio (62%/61% missing)', 'Admin · Batch jobs + Chat · Audit log (REV-1)', 'GAP'],
        ['EM cognate PIE audio (49% missing)', 'Admin · Batch jobs', 'GAP'],
        ['EFG node PIE IPA/audio (5% missing · REQ-011)', 'PIE panel · fallback path; Admin · Batch jobs', 'GAP'],
        ['SF etymology text (10% missing)', 'Chat · Accept (per-card) + Admin · Batch jobs (bulk)', 'GAP'],
        ['SF english_cognates (25% missing)', 'Chat · Accept (per-card) + Admin · Batch jobs (bulk)', 'GAP'],
        ['SF pie_root (30% missing · TSK-008)', 'Admin · Batch jobs (TSK-008 tracker)', 'GAP'],
        ['SF pie_ipa (30% missing · TSK-001)', 'Admin · Batch jobs (TSK-001 tracker)', 'GAP'],
        ['EM cognate PIE root (7% missing)', 'Chat · Accept + Admin · Batch jobs', 'GAP'],
        ['EM origin_story (5% missing)', 'Chat · Accept (per-figure) + Admin · Batch jobs', 'GAP'],
        ['EM etymologies.notes (unknown)', 'Chat · Accept + Admin · Batch jobs', 'GAP'],
        ['flashcard_pie_roots.etymology_layer (0% · REQ-008)', 'Word card · Etymology section assumes filled values', 'GAP'],
        ['SF efg_node_id (27% missing · REQ-015)', 'EFG panel · prompts node-link create', 'GAP'],
        ['EFG nodes.sf_url (4% missing · REQ-015)', 'PL only · admin', 'GAP'],
      ]} />

      <h3>Cross-cutting · Missing capabilities</h3>
      <BacklogTable rows={[
        ['Cross-app PIE join API (HIGH)', 'Unified PIE endpoint specified in §4.2', 'GAP'],
        ['SF PIE panel reads flashcards only (HIGH)', 'Same — closed by §4.2', 'GAP'],
        ['Latin as structured paradigm column (REQ-024)', '§4.2 — new efg_pie_explorer_data.language_paradigm JSON, Latin first-class alongside Greek/Sanskrit/French (REV-1)', 'GAP'],
        ['etymology_layer all NULL (HIGH)', 'Word card · Etymology depends on field; backfill via Admin · Batch jobs', 'GAP'],
        ['PIE audio 88% missing (HIGH)', 'TSK-001 tracker · Admin · Batch jobs', 'GAP'],
        ['EM↔EFG: no API link', 'NEW: EM.etymologies.efg_node_id column proposed', 'GAP'],
        ['No non_pie_reason field (308 cards)', 'NEW: SF.flashcards.non_pie_reason column proposed', 'GAP'],
        ['Chat anchor primitive', 'NEW: chat_threads table proposed (anchor = flashcard_id only, messages JSON, context JSON) — REV-1 inverted', 'GAP'],
        ['Chat context payload visibility / steering (REV-1)', 'NEW: chat_threads.context JSON {fields[], efg_node, figure, steering}; per-msg snapshot in messages[].context_snapshot', 'GAP'],
        ['Chat-promotion audit (REV-1)', 'NEW: chat_promotions(id, when, who, thread_id, message_idx, card, field, before, after) — replaces review_items', 'GAP'],
        ['review_items table (planned)', 'RETIRED per REV-1 — collapsed to chat_promotions audit log', 'DEPRECATED'],
        ['Bookmark primitive', 'NEW: bookmarks polymorphic table proposed', 'GAP'],
        ['Role tiers', 'NEW: SF.users.role_tier column proposed', 'GAP'],
      ]} />

      <div className="rationale" style={{ marginTop: 32 }}>
        <strong>Reconciliation contract.</strong> Every line above is one of (COVERED / CONSOLIDATED / DEPRECATED / GAP). The engineering agent should match this 1:1 against <code>bwtl01_integration_inventory.md</code>. Anything missing here = additional GAP. Anything in BWTL01 not in this table = please flag back for design pass.
      </div>
    </div>
  );
}

function BacklogTable({ rows }) {
  const stat = (s) => {
    if (s === 'COVERED') return <span className="pill ok"><span className="dot ok" />{s}</span>;
    if (s === 'CONSOLIDATED') return <span className="pill accent">{s}</span>;
    if (s === 'DEPRECATED') return <span className="pill err">{s}</span>;
    if (s === 'GAP') return <span className="pill warn">{s}</span>;
    return s;
  };
  return (
    <table>
      <thead><tr><th style={{ width: '38%' }}>Inventory row</th><th>Unified-app surface</th><th style={{ width: '14%' }}>Status</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td><code style={{ fontSize: 11.5 }}>{r[0]}</code></td>
            <td>{r[1]}</td>
            <td>{stat(r[2])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

window.SpecDoc = SpecDoc;
