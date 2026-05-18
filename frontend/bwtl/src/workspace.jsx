// The unified workspace — the front door.
//
// Layout: center column (the word card with cross-app drill-down links)
//         + right rail (stacked panels) + chat dock at bottom.
//
// All cross-app drill-downs are <a className="xlink xxx"> with a class hinting
// at the destination color (pie/myth/graph/forge). Clicking one:
//   1. opens / un-collapses the matching panel
//   2. briefly glows that panel
//   3. updates the chat anchor if relevant

function Workspace({
  cardId,
  role,
  onNavigateWord,
  onOpenFigure,
  panelState,
  setPanelState,
  glowedPanel,
  triggerGlow,
  expandedChat,
  setExpandedChat,
  activeThreadId,
  setActiveThreadId,
  onPromote
}) {
  const [card, setCard] = React.useState(window.BWTL.FLASHCARDS[cardId] || null);
  const [loadingCard, setLoadingCard] = React.useState(!card);
  const [threads, setThreads] = React.useState([]);

  React.useEffect(() => {
    if (!cardId) return;
    setLoadingCard(true);
    window.BWTL.fetchCard(cardId)
      .then(c => { setCard(c); setLoadingCard(false); })
      .catch(err => { console.error('[Workspace] fetchCard error:', err); setLoadingCard(false); });
  }, [cardId]);

  React.useEffect(() => {
    if (!cardId) return;
    window.BWTL.getThreads({ anchor_value: cardId })
      .then(data => setThreads(Array.isArray(data) ? data : (data.items || [])))
      .catch(() => setThreads([]));
  }, [cardId]);

  if (loadingCard) return (
    <div className="ws-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--fg-3)', fontSize: 14 }}>
      Loading card…
    </div>
  );
  if (!card) return (
    <div className="ws-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--fg-3)', fontSize: 14 }}>
      No card loaded. Select a card from the Library to begin.
    </div>
  );

  const pieRootKey = card.pie_root;
  const figureId = card.figure_link || card.fun_facts?.find((f) => f.figure)?.figure;

  // ── handle: cross-app link clicks ────────────────────────────────────────
  const drillToPie = (rootKey) => {
    // For now panels follow the current card's root. Future: support
    // alternate roots (e.g. drilling into an atomic component).
    setPanelState((p) => ({ ...p, pie: 'open' }));
    triggerGlow('pie');
  };
  const drillToFigure = (id) => {
    onOpenFigure?.(id);
    setPanelState((p) => ({ ...p, myth: 'open' }));
    triggerGlow('myth');
  };
  const drillToGraph = () => {
    setPanelState((p) => ({ ...p, graph: 'open' }));
    triggerGlow('graph');
  };
  const drillToForge = () => {
    setPanelState((p) => ({ ...p, forge: 'open' }));
    triggerGlow('forge');
  };
  const drillToRag = () => {
    setPanelState((p) => ({ ...p, rag: 'open' }));
    triggerGlow('rag');
  };

  const togglePanel = (k) => {
    setPanelState((p) => ({ ...p, [k]: p[k] === 'collapsed' ? 'open' : p[k] === 'open' ? 'collapsed' : 'open' }));
  };
  const closePanel = (k) => setPanelState((p) => ({ ...p, [k]: 'closed' }));

  return (
    <div className="workspace">
      <div className="ws-center fade-up">
        <WordCard
          card={card}
          role={role}
          onDrillPie={() => drillToPie(pieRootKey)}
          onDrillFigure={drillToFigure}
          onDrillGraph={drillToGraph}
          onDrillForge={drillToForge}
          onDrillRag={drillToRag}
          onNavigateWord={onNavigateWord} />
        
      </div>

      <div className="ws-rail">
        {/* Panel order is meaningful: PIE first (because root anchors chat),
             then Etymology graph, then figure, then RAG, then ArtForge.
             User can pin/reorder; collapsed panels stay in the rail as 36px strips. */}
        {panelState.pie !== 'closed' &&
        <PiePanel
          pieRootKey={pieRootKey}
          currentWord={card.word}
          glow={glowedPanel === 'pie'}
          collapsed={panelState.pie === 'collapsed'}
          onToggle={() => togglePanel('pie')}
          onClose={() => closePanel('pie')}
          onNavigate={onNavigateWord}
          pinned={true} />

        }
        {panelState.graph !== 'closed' &&
        <EfgPanel
          pieRootKey={pieRootKey}
          currentWordId={card.efg_node_id}
          glow={glowedPanel === 'graph'}
          collapsed={panelState.graph === 'collapsed'}
          onToggle={() => togglePanel('graph')}
          onClose={() => closePanel('graph')}
          onOpenWord={onNavigateWord} />

        }
        {panelState.myth !== 'closed' && figureId &&
        <EtymythonPanel
          figureId={figureId}
          glow={glowedPanel === 'myth'}
          collapsed={panelState.myth === 'collapsed'}
          onToggle={() => togglePanel('myth')}
          onClose={() => closePanel('myth')} />

        }
        {panelState.rag !== 'closed' &&
        <RagPanel
          pieRootKey={pieRootKey}
          glow={glowedPanel === 'rag'}
          collapsed={panelState.rag === 'collapsed'}
          onToggle={() => togglePanel('rag')}
          onClose={() => closePanel('rag')} />

        }
        {panelState.forge !== 'closed' &&
        <ArtForgePanel
          card={card}
          glow={glowedPanel === 'forge'}
          collapsed={panelState.forge === 'collapsed'}
          onToggle={() => togglePanel('forge')}
          onClose={() => closePanel('forge')} />

        }
      </div>

      <ChatDock
        anchor={{ mode: 'flashcard_id', value: card.id, label: card.word }}
        card={card}
        expanded={expandedChat}
        onToggleExpand={() => setExpandedChat((x) => !x)}
        threads={threads}
        activeThreadId={activeThreadId}
        onActivateThread={setActiveThreadId}
        onNewThread={() => setActiveThreadId('new')}
        onPromote={onPromote}
        role={role} />
      
    </div>);

}

// ─────────────────────────────────────────────────────────────────────────────
// WORD CARD — the centerpiece of the workspace
// ─────────────────────────────────────────────────────────────────────────────

function WordCard({ card, role, onDrillPie, onDrillFigure, onDrillGraph, onDrillForge, onDrillRag, onNavigateWord }) {
  const canEdit = role === 'pl' || role === 'theo' || role === 'tutor';
  return (
    <div className="wordcard">
      <div className="wordcard-hero">
        <div className="wordcard-img" title="placeholder · awaiting user-uploaded image" style={{ position: 'relative' }}>
          {card.image_caption}
          {canEdit && <AiEditButton field="image" label="Image" floating />}
        </div>
        <div className="wordcard-meta">
          <div className="wordcard-row1">
            <h1 className="display">{card.word}<span className="lang">{card.language} · {card.pos}</span></h1>
          </div>
          <div className="ipa mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {card.ipa}
            <button className="btn xs ghost" style={{ padding: '3px 7px' }} title="Play audio (TTS)"><Ic.speaker /></button>
            {canEdit && <AiEditButton field="ipa" label="IPA" subtle />}
            {canEdit && <AiEditButton field="audio" label="Audio" subtle />}
          </div>
          <div className="definition" style={{ marginTop: 4 }}>{card.definition}</div>
          <div className="wordcard-actions">
            <button className="btn sm">
              <Ic.bookmark_filled style={{ color: card.bookmarked ? 'var(--acc-2)' : 'var(--fg-3)' }} />
              {card.bookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button className="btn sm ghost"><Ic.chat /> Chat about this</button>
            <button className="btn sm ghost" onClick={onDrillForge}><Ic.film /> Generate video</button>
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }}><Ic.shuffle /> Next in study</button>
          </div>
        </div>
      </div>

      {/* Etymology — with cross-app drill-down links inline */}
      <div className="wc-section">
        <h4><span className="dot pie" /> Etymology
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
            {canEdit && <AiEditButton field="etymology" label="Etymology" />}
            {canEdit && <AiEditButton field="pie_root" label="PIE root" subtle />}
          </span>
        </h4>
        <div style={{ display: 'grid', gap: 6 }}>
          {(card.etymology_layered || []).map((l, i) =>
          <div key={l.layer} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, alignItems: 'baseline' }}>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l.layer}</span>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-2)' }}>
                {l.layer === 'PIE' ?
              <EtymologyPIELine text={l.text} pieRoot={card.pie_root} onDrillPie={onDrillPie} /> :
              l.text}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cognates — chips. Each chip is a cross-app drill-down to its word card. */}
      <div className="wc-section">
        <h4>
          <span className="dot acc" /> Cognates
          <span className="pill ghost" style={{ marginLeft: 'auto', fontSize: 9.5 }}>{(card.cognates || []).length} · including {(card.cognates || []).filter((c) => c.false).length} false</span>
          {canEdit && <AiEditButton field="cognates" label="Cognates" />}
        </h4>
        <div className="chip-row">
          {(card.cognates || []).map((c) =>
          <span key={c.word} className="cog" onClick={() => onNavigateWord && onNavigateWord(null /* mock */)}>
              <span className="lang">{c.lang}</span>
              <span className="greek">{c.word}</span>
              {c.def && <span style={{ color: 'var(--fg-3)', fontSize: 11 }}>· {c.def}</span>}
              {c.false && <span className="false" title={c.false_reason}>false</span>}
            </span>
          )}
          <span className="cog" style={{ borderStyle: 'dashed', color: 'var(--fg-3)' }} onClick={onDrillGraph}>
            <Ic.graph /> Open full graph
          </span>
        </div>
      </div>

      {/* Fun facts — each one a small card; mention of a figure becomes a cross-app drill-down */}
      <div className="wc-section">
        <h4><span className="dot" style={{ background: 'var(--myth)' }} /> Fun facts
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
            {canEdit && <AiEditButton field="fun_facts" label="Fun facts" />}
          </span>
        </h4>
        <div style={{ display: 'grid', gap: 8 }}>
          {(card.fun_facts || []).map((f, i) =>
          <div key={i} className="ff-card">
              <FunFactBody text={f.text} figure={f.figure} onDrillFigure={onDrillFigure} onDrillPie={onDrillPie} />
              <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', fontSize: 10.5, color: 'var(--fg-4)' }}>
                <Ic.chat />
                <span>Discuss in chat</span>
                <span style={{ marginLeft: 'auto' }} className="mono">fun_fact · {i + 1} of {card.fun_facts.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dictionary lookup hint — opens RAG panel */}
      <div className="wc-section" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Ic.book />
        <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>
          Scholarly entry available in <a className="xlink rag" style={{ '--xc': 'var(--acc)' }} onClick={onDrillRag}>
            <span className="x-tag">RAG</span>Beekes EDPIE
          </a> — 1 match for this root.
        </span>
      </div>
    </div>);

}

// ─────────────────────────────────────────────────────────────────────────────
// Helper renderers — turn key tokens in prose into cross-app drill-down links.
// ─────────────────────────────────────────────────────────────────────────────

function EtymologyPIELine({ text, pieRoot, onDrillPie }) {
  // Replace PIE root literal in text with a clickable xlink.
  // This is the cue the design brief calls out: clicking the PIE root opens
  // the PIE Explorer panel.
  if (!pieRoot) return <span>{text}</span>;
  const parts = text.split(pieRoot);
  if (parts.length === 1) return <span>{text}</span>;
  return (
    <span>
      {parts.map((p, i) =>
      <React.Fragment key={i}>
          {p}
          {i < parts.length - 1 &&
        <a className="xlink pie" onClick={onDrillPie}>
              <span className="x-tag">PIE</span>{pieRoot}
            </a>
        }
        </React.Fragment>
      )}
    </span>);

}

function FunFactBody({ text, figure, onDrillFigure, onDrillPie }) {
  // Look for capitalized figure names — we naively detect Mnemosyne, Hera, Lethe etc.
  // For mock purposes we use a small replacements table.
  const figs = ['Mnemosyne', 'Hera', 'Lethe', 'Gaia', 'Zeus'];
  let parts = [text];
  figs.forEach((f) => {
    const next = [];
    parts.forEach((p) => {
      if (typeof p !== 'string') {next.push(p);return;}
      const split = p.split(new RegExp(`(${f})`));
      split.forEach((s, i) => {
        if (s === f) next.push(<a key={Math.random()} className="xlink myth" onClick={() => onDrillFigure(figure || 'mnemosyne')}><span className="x-tag">EM</span>{s}</a>);else
        next.push(s);
      });
    });
    parts = next;
  });
  // also linkify *root- patterns
  const finalParts = [];
  parts.forEach((p, idx) => {
    if (typeof p !== 'string') {finalParts.push(p);return;}
    const re = /(\*[a-zA-Z₀-₉ʷʰ¹²³⁴-]+-?)/g;
    let last = 0;
    let m;
    while (m = re.exec(p)) {
      finalParts.push(p.slice(last, m.index));
      finalParts.push(<a key={idx + '_' + m.index} className="xlink pie" onClick={onDrillPie}><span className="x-tag">PIE</span>{m[1]}</a>);
      last = m.index + m[1].length;
    }
    finalParts.push(p.slice(last));
  });
  return <span>{finalParts}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI EDIT BUTTON — small spark/pencil that opens a per-field regenerate popover.
// Mirrors SF /api/ai/ai_generate. The popover routes through Theodoros review
// queue for non-admin roles (per the role matrix).
// ─────────────────────────────────────────────────────────────────────────────

function AiEditButton({ field, label, subtle, floating }) {
  const [open, setOpen] = React.useState(false);
  const [stage, setStage] = React.useState('idle'); // idle | running | done
  const meta = window.BWTL.AI_FIELDS[field] || { endpoint: 'POST /api/ai/generate', model: 'gpt-4o' };
  const runIt = () => {
    setStage('running');
    setTimeout(() => setStage('done'), 1600);
  };
  const popoverStyle = floating ? {
    position: 'absolute', bottom: 8, right: 8
  } : { position: 'relative' };

  return (
    <span style={popoverStyle}>
      <button
        onClick={(e) => {e.stopPropagation();setOpen((o) => !o);setStage('idle');}}
        title={`Edit ${label} with AI — ${meta.endpoint}`}
        style={{
          appearance: 'none', border: '1px solid ' + (open ? 'var(--acc-ring)' : 'var(--line)'),
          background: open ? 'var(--acc-bg)' : subtle ? 'transparent' : 'var(--bg-2)',
          color: open ? 'var(--acc-2)' : 'var(--fg-3)',
          padding: subtle ? '2px 5px' : '3px 7px',
          borderRadius: 6, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10.5, fontWeight: 600, fontFamily: 'inherit'
        }}>
        
        <Ic.spark /> {!subtle && 'AI'}
      </button>
      {open &&
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: floating ? 0 : 'auto',
          left: floating ? 'auto' : 0,
          zIndex: 30,
          width: 320,
          background: 'var(--bg-2)',
          border: '1px solid var(--acc-ring)',
          borderRadius: 'var(--r)',
          padding: 12,
          boxShadow: '0 20px 50px -10px rgba(0,0,0,.6)'
        }}>
        
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic.spark style={{ color: 'var(--acc-2)' }} />
              <strong style={{ fontSize: 12 }}>Regenerate {label} with AI</strong>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 0, color: 'var(--fg-3)', cursor: 'pointer' }}><Ic.x /></button>
          </div>
          <div style={{ display: 'grid', gap: 6, fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 10 }}>
            <div><span className="mono" style={{ color: 'var(--fg-4)' }}>endpoint:</span> <span className="mono" style={{ color: 'var(--acc-2)' }}>{meta.endpoint}</span></div>
            <div><span className="mono" style={{ color: 'var(--fg-4)' }}>model:</span> {meta.model}</div>
            <div><span className="mono" style={{ color: 'var(--fg-4)' }}>last run:</span> {meta.last_run} · avg {meta.avg_ms}ms</div>
          </div>
          <textarea
          placeholder={`Optional: tell the AI what to focus on (e.g. "emphasize the compound nature of *h₁epi-+*gʷem-")`}
          style={{ width: '100%', height: 64, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 6, padding: 8, color: 'var(--fg)', font: 'inherit', fontSize: 12, resize: 'none' }} />
        
          {stage === 'idle' &&
        <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
              <button className="btn xs ghost">Use Beekes context</button>
              <button className="btn xs primary" style={{ marginLeft: 'auto' }} onClick={runIt}><Ic.spark /> Generate</button>
            </div>
        }
          {stage === 'running' &&
        <div style={{ marginTop: 10, padding: 8, borderRadius: 6, background: 'var(--bg-1)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-2)' }}>
              <span className="dot warn" /> Running on {meta.model}…
            </div>
        }
          {stage === 'done' &&
        <div style={{ marginTop: 10 }}>
              <div style={{ padding: 8, borderRadius: 6, background: 'color-mix(in oklch, var(--ok) 5%, var(--bg-1))', border: '1px solid color-mix(in oklch, var(--ok) 30%, var(--line))', fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5, marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ok)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Proposed</div>
                Suggested {label.toLowerCase()} drafted. {label === 'IPA' ? '/ˈsuv.ə.nir/ → /su.və.niʁ/ (Parisian)' : 'Diff shown below; review before apply.'}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn xs ghost" onClick={() => setStage('idle')}>Re-roll</button>
                <button className="btn xs ghost" style={{ marginLeft: 'auto' }}>Send to review</button>
                <button className="btn xs primary" onClick={() => {setOpen(false);window.dispatchEvent(new CustomEvent('bwtl:toast', { detail: `Applied AI ${label} to card` }));}}>
                  <Ic.check /> Apply
                </button>
              </div>
            </div>
        }
        </div>
      }
    </span>);

}

window.Workspace = Workspace;
window.AiEditButton = AiEditButton;