// Right-rail panel components. All inherit the AF visual language but ARE NEW for BWTL.
//
// Each panel exposes a small contract:
//   <PanelShell variant="pie|graph|myth|forge|rag" title meta glow collapsed onToggle>...</PanelShell>
//
// The glow prop is the integration cue: when a user clicks a cross-app link
// in the word card, the corresponding panel briefly glows in its accent color.

function PanelShell({ variant = 'rag', title, meta, glow, collapsed, onToggle, onClose, onPin, pinned, children, headRight }) {
  return (
    <div className={`panel ${variant} ${glow ? 'glow' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-head" onClick={onToggle}>
        <div className="title">
          <Ic.caret_d style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }} />
          {title}
        </div>
        <div className="ctrls" onClick={(e) => e.stopPropagation()}>
          {meta && <span className="meta">{meta}</span>}
          {headRight}
          {onPin && (
            <button title={pinned ? 'Unpin' : 'Pin to rail'} onClick={onPin}>
              {pinned ? <Ic.pin_filled /> : <Ic.pin />}
            </button>
          )}
          {onClose && <button title="Close" onClick={onClose}><Ic.x /></button>}
        </div>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PIE EXPLORER PANEL — the architectural integration win.
// MERGES SF flashcards + EFG efg_pie_explorer_data into one stacked view.
// ─────────────────────────────────────────────────────────────────────────────

function PiePanel({ pieRootKey, currentWord, glow, onNavigate, onOpenRoot, collapsed, onToggle, onClose, onPin, pinned }) {
  const [root, setRoot] = React.useState(window.BWTL.PIE_ROOTS[pieRootKey] || null);
  const [loadingRoot, setLoadingRoot] = React.useState(!root);

  React.useEffect(() => {
    if (!pieRootKey) { setLoadingRoot(false); return; }
    if (window.BWTL.PIE_ROOTS[pieRootKey]) { setRoot(window.BWTL.PIE_ROOTS[pieRootKey]); setLoadingRoot(false); return; }
    setLoadingRoot(true);
    window.BWTL.fetchPieRoot(pieRootKey)
      .then(r => { setRoot(r); setLoadingRoot(false); })
      .catch(err => { console.error('[PiePanel] fetchPieRoot error:', err); setLoadingRoot(false); });
  }, [pieRootKey]);

  const [showSrc, setShowSrc] = React.useState(true);
  const [expand, setExpand] = React.useState({ verbal: true, nominal: true, cognates: true });
  const toggle = (k) => setExpand(s => ({ ...s, [k]: !s[k] }));

  if (loadingRoot) return (
    <PanelShell variant="pie" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose}
      title={<><Ic.spark /> PIE Explorer</>} meta="loading…">
      <div style={{ color: 'var(--fg-3)', fontSize: 13, padding: 12 }}>Loading PIE root data…</div>
    </PanelShell>
  );
  if (!root) return (
    <PanelShell variant="pie" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose}
      title={<><Ic.spark /> PIE Explorer</>} meta="no root">
      <div className="pie-empty" style={{ color: 'var(--fg-3)', fontSize: 13, padding: 12 }}>No PIE root recorded for this word.</div>
    </PanelShell>
  );

  // Word strip = SF flashcards where flashcards.pie_root === this root.
  const allCards = Object.values(window.BWTL.FLASHCARDS).filter(c => c.pie_root === pieRootKey);
  const branches = root.branches || [];

  // Merge: prefer SF flashcard rendering when both exist.
  const seen = new Set();
  const mergedWords = [];
  allCards.forEach(c => { mergedWords.push({ kind: 'sf', label: c.word_or_phrase || c.word, gloss: (c.definition || '').split('.')[0], lang: c.language, ref: c.id }); seen.add(c.word_or_phrase || c.word); });
  branches.forEach(b => { if (!seen.has(b.word)) mergedWords.push({ kind: 'efg', label: b.word, gloss: '', lang: b.language || '', ref: b.id }); });

  return (
    <PanelShell variant="pie" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose} onPin={onPin} pinned={pinned}
      title={<><Ic.spark /> PIE Explorer</>}
      meta={<>SF · EFG merged</>}
      headRight={
        <button title={showSrc ? 'Hide source pills' : 'Show source pills'} onClick={() => setShowSrc(s => !s)}>
          <Ic.filter />
        </button>
      }
    >
      {/* Root hero */}
      <div className="pie-root-hero">
        <div>
          <div className="root">{root.root}</div>
          <div className="gloss">"{root.gloss}"</div>
        </div>
        <div style={{ flex: 1 }} />
        <div className="ipa">{root.ipa}</div>
        <div className="pie-audio" title="Play PIE root audio · from EFG nodes (95% coverage)"
          style={{ cursor: root.audio_url ? 'pointer' : 'default' }}
          onClick={() => root.audio_url && new Audio(root.audio_url).play()}>
          <Ic.play />
        </div>
      </div>

      {/* Atomic decomposition — shows only for compound roots */}
      {root.atomic && (
        <div className="atomic-row">
          <span className="lab">Atomic ▸</span>
          {root.atomic.map((a, i) => (
            <React.Fragment key={a}>
              <span className="atom" onClick={() => onOpenRoot && onOpenRoot(a)}>{a}</span>
              {i < root.atomic.length - 1 && <span className="plus">+</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* SF word strip — horizontal scroll */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
          Word branches <span className="mono" style={{ color: 'var(--fg-5)' }}>· {root.word_count} cards</span>
        </div>
        {showSrc && <span className="pill" style={{ fontSize: 9.5 }}>SF.flashcards.pie_root</span>}
      </div>
      <div className="pie-words-strip">
        {mergedWords.map(w => (
          <div
            key={w.ref}
            className={`pie-word ${w.label === currentWord ? 'current' : ''}`}
            onClick={() => w.kind === 'sf' && onNavigate && onNavigate(w.ref)}
          >
            <div className="w greek">{w.label}</div>
            {w.gloss && <div className="g">{w.gloss}</div>}
            <div className="lng">{w.lang}{w.kind === 'efg' && ' · efg'}</div>
          </div>
        ))}
      </div>

      {/* REV item 2 — structured Language paradigm columns.
          Latin is first-class alongside French / Greek / Sanskrit,
          complementing (not duplicating) the card-level Etymology prose. */}
      {root.language_paradigm && (
        <LanguageParadigm langs={root.language_paradigm} showSrc={showSrc} onNavigate={onNavigate} />
      )}

      {/* EFG prose blocks — the integration value */}
      <ProseBlock
        title="Verbal paradigm"
        body={root.verbal_paradigm}
        source="EFG · efg_pie_explorer_data.verbal_paradigm"
        showSrc={showSrc}
        open={expand.verbal}
        onToggle={() => toggle('verbal')}
      />
      <ProseBlock
        title="Nominal derivatives"
        body={root.nominal_derivatives}
        source="EFG · efg_pie_explorer_data.nominal_derivatives"
        showSrc={showSrc}
        open={expand.nominal}
        onToggle={() => toggle('nominal')}
      />
      <ProseBlock
        title="Modern cognates"
        body={root.modern_cognates}
        source="EFG · efg_pie_explorer_data.modern_cognates"
        showSrc={showSrc}
        open={expand.cognates}
        onToggle={() => toggle('cognates')}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="btn sm ghost"><Ic.chat /> Chat about this root</button>
        <button className="btn sm ghost"><Ic.bookmark /> Bookmark root</button>
        <button className="btn sm ghost" style={{ marginLeft: 'auto' }}><Ic.expand /> Open full</button>
      </div>
    </PanelShell>
  );
}

function ProseBlock({ title, body, source, showSrc, open, onToggle }) {
  return (
    <div className={`efg-prose ${open ? '' : 'col'}`}>
      <div className="head" onClick={onToggle}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Ic.caret_d style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform .15s' }} />
          {title}
        </span>
        {showSrc && <span className="src">{source}</span>}
      </div>
      <div className="body">
        {(() => {
          if (!body) return null;
          if (typeof body !== 'string') return body;
          try {
            const parsed = JSON.parse(body);
            const langs = Object.keys(parsed);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${langs.length}, minmax(0, 1fr))`, gap: 0, border: '1px solid var(--line-soft)', borderRadius: 4, overflow: 'hidden', fontSize: 11 }}>
                {langs.map((lang, ci) => {
                  const val = parsed[lang];
                  return (
                    <div key={lang} style={{ borderRight: ci < langs.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                      <div style={{ padding: '4px 8px', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', background: 'var(--bg-2)', borderBottom: '1px solid var(--line-soft)' }}>{lang}</div>
                      {Array.isArray(val)
                        ? val.map((item, idx) => (
                            <div key={idx} style={{ padding: '3px 8px', display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 4, borderBottom: '1px solid var(--line-soft)' }}>
                              <span className="greek" style={{ fontWeight: 600 }}>{Array.isArray(item) ? item[0] : (item.form || '')}</span>
                              <span style={{ color: 'var(--fg-3)', fontSize: 10 }}>{Array.isArray(item) ? item[1] : (item.gloss || item.gram || '')}</span>
                            </div>
                          ))
                        : typeof val === 'object' && val !== null
                          ? Object.entries(val).map(([k, v]) =>
                              typeof v === 'object' && v !== null && !Array.isArray(v)
                                ? (
                                  <div key={k}>
                                    <div style={{ padding: '2px 8px', fontSize: 9, fontWeight: 700, color: 'var(--fg-4)', background: 'var(--bg-1)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{k}</div>
                                    {Object.entries(v).map(([person, form]) => (
                                      <div key={person} style={{ padding: '2px 8px', display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 4 }}>
                                        <span style={{ color: 'var(--fg-4)', fontSize: 10 }}>{person}</span>
                                        <span className="greek">{form}</span>
                                      </div>
                                    ))}
                                  </div>
                                )
                                : (
                                  <div key={k} style={{ padding: '3px 8px', display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 4 }}>
                                    <span style={{ color: 'var(--fg-4)', fontSize: 10 }}>{k}</span>
                                    <span className="greek">{Array.isArray(v) ? v.join(', ') : String(v ?? '')}</span>
                                  </div>
                                )
                            )
                          : <div style={{ padding: '3px 8px' }}><span className="greek">{String(val ?? '')}</span></div>
                      }
                    </div>
                  );
                })}
              </div>
            );
          } catch { return body; }
        })()}
      </div>
    </div>
  );
}

// REV item 2 — Latin promoted to a first-class structured column alongside
// French / Greek / Sanskrit. Replaces the previous "Latin is buried in prose"
// situation. Card-level Etymology text (AI-generated) remains the narrative
// surface; this is the structural paradigm view.
function LanguageParadigm({ langs, showSrc, onNavigate }) {
  // Stable column order: Latin first (most paradigm-bearing in PIE studies),
  // then Greek, then Sanskrit, then French (the modern reflex column).
  const order = ['Latin', 'Greek', 'Sanskrit', 'French'].filter(l => langs[l]);

  return (
    <div className="efg-prose" style={{ marginBottom: 10 }}>
      <div className="head" style={{ cursor: 'default' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Ic.grid />
          Language paradigm
        </span>
        {showSrc && <span className="src">EFG · efg_pie_explorer_data.language_paradigm</span>}
      </div>
      <div style={{ padding: 0 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${order.length}, minmax(0, 1fr))`,
          borderTop: '1px solid var(--line-soft)',
        }}>
          {order.map((l, ci) => (
            <div key={l} style={{
              borderRight: ci < order.length - 1 ? '1px solid var(--line-soft)' : 'none',
              minWidth: 0,
            }}>
              <div style={{
                padding: '6px 10px',
                fontSize: 9.5, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: l === 'Latin' ? 'var(--myth)' : l === 'Greek' ? 'var(--pie)' : l === 'Sanskrit' ? 'var(--acc-2)' : 'var(--graph)',
                background: l === 'Latin'
                  ? 'color-mix(in oklch, var(--myth) 6%, var(--bg-1))'
                  : l === 'Greek'
                  ? 'color-mix(in oklch, var(--pie) 6%, var(--bg-1))'
                  : l === 'Sanskrit'
                  ? 'color-mix(in oklch, var(--acc) 6%, var(--bg-1))'
                  : 'color-mix(in oklch, var(--graph) 6%, var(--bg-1))',
                borderBottom: '1px solid var(--line-soft)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>{l}</span>
                <span className="mono" style={{ marginLeft: 'auto', color: 'var(--fg-5)', fontWeight: 500, letterSpacing: 0 }}>{langs[l].forms.length}</span>
              </div>
              <div style={{ padding: '4px 0' }}>
                {langs[l].forms.map((f, fi) => (
                  <div
                    key={fi}
                    onClick={() => f.linked_card && onNavigate && onNavigate(f.linked_card)}
                    style={{
                      padding: '5px 10px',
                      fontSize: 12, lineHeight: 1.35,
                      cursor: f.linked_card ? 'pointer' : 'default',
                      opacity: f.exclude ? 0.55 : 1,
                    }}
                    onMouseEnter={(e) => f.linked_card && (e.currentTarget.style.background = 'var(--bg-3)')}
                    onMouseLeave={(e) => f.linked_card && (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="greek" style={{
                      color: f.exclude ? 'var(--fg-4)' : 'var(--fg)',
                      fontWeight: 600,
                      textDecoration: f.linked_card ? 'underline dotted color-mix(in oklch, var(--acc) 60%, transparent)' : 'none',
                      textUnderlineOffset: 3,
                    }}>{f.form}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 1 }}>{f.gloss}</div>
                    <div className="mono" style={{ fontSize: 9.5, color: 'var(--fg-5)', marginTop: 1, letterSpacing: '0.02em' }}>{f.class}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EFG GRAPH PANEL — mini node-graph render of related nodes
// ─────────────────────────────────────────────────────────────────────────────

function EfgPanel({ pieRootKey, currentWordId, glow, collapsed, onToggle, onClose, onPin, pinned, onOpenWord, onOpenRoot }) {
  const [graphData, setGraphData] = React.useState(null);
  const [loadingGraph, setLoadingGraph] = React.useState(true);

  React.useEffect(() => {
    if (!currentWordId && !pieRootKey) { setLoadingGraph(false); return; }
    setLoadingGraph(true);
    window.BWTL.fetchEfgGraph(currentWordId || pieRootKey)
      .then(d => { setGraphData(d); setLoadingGraph(false); })
      .catch(err => { console.error('[EfgPanel] fetchEfgGraph error:', err); setLoadingGraph(false); });
  }, [currentWordId, pieRootKey]);

  // Derive root and siblings from graph data or cached PIE_ROOTS
  const rootData = (graphData && graphData.pie_root) ? graphData : window.BWTL.PIE_ROOTS[pieRootKey];
  const siblings = graphData ? (graphData.nodes || []).filter(n => (n.type || n.node_type) === 'word') : [];

  // simple radial layout
  const W = 360, H = 200, cx = W/2, cy = H/2;
  const ring = 70;

  if (loadingGraph) return (
    <PanelShell variant="graph" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose}
      title={<><Ic.graph /> Etymology Graph</>} meta="loading…">
      <div style={{ color: 'var(--fg-3)', fontSize: 13, padding: 12 }}>Loading graph…</div>
    </PanelShell>
  );
  if (!graphData && siblings.length === 0) return (
    <PanelShell variant="graph" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose}
      title={<><Ic.graph /> Etymology Graph</>} meta="no data">
      <div className="efg-empty" style={{ color: 'var(--fg-3)', fontSize: 13, padding: 12 }}>No graph data available for this word. The EFG service may be offline.</div>
    </PanelShell>
  );

  return (
    <PanelShell variant="graph" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose} onPin={onPin} pinned={pinned}
      title={<><Ic.graph /> Etymology Graph</>}
      meta={<>{siblings.length} nodes · {Math.floor(siblings.length * 1.4)} edges</>}
    >
      <div className="efg-mini">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          {/* edges */}
          {siblings.map((n, i) => {
            const a = (i / siblings.length) * Math.PI * 2 - Math.PI/2;
            const x = cx + Math.cos(a) * ring;
            const y = cy + Math.sin(a) * ring;
            return <line key={'e'+i} x1={cx} y1={cy} x2={x} y2={y} stroke="color-mix(in oklch, var(--graph) 30%, transparent)" strokeWidth="1" />;
          })}
          {/* PIE root center */}
          <circle cx={cx} cy={cy} r="22" fill="var(--pie-bg)" stroke="var(--pie)" strokeWidth="1.5" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="var(--pie)" fontFamily="var(--ff-display)" fontSize="14" fontWeight="500">{(rootData?.root || pieRootKey || '').replace('*','')}</text>
          {/* nodes */}
          {siblings.map((n, i) => {
            const a = (i / siblings.length) * Math.PI * 2 - Math.PI/2;
            const x = cx + Math.cos(a) * ring;
            const y = cy + Math.sin(a) * ring;
            const isCur = n.id === currentWordId;
            return (
              <g key={n.id} style={{ cursor: 'pointer' }} onClick={() => onOpenWord && onOpenWord(n.id)}>
                <circle cx={x} cy={y} r={isCur ? 14 : 11}
                  fill={isCur ? 'var(--acc-bg)' : 'var(--bg-3)'}
                  stroke={isCur ? 'var(--acc)' : 'var(--graph)'}
                  strokeWidth={isCur ? 1.5 : 1} />
                <text x={x} y={y + 22} textAnchor="middle" fill={isCur ? 'var(--fg)' : 'var(--fg-2)'} fontSize="9.5" fontFamily="var(--ff-sans)">{n.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <span className="pill graph"><Ic.link /> {siblings.length} word nodes</span>
        <span className="pill ghost">EFG graph data</span>
        <button className="btn xs ghost" style={{ marginLeft: 'auto' }} onClick={() => window.open('https://efg.rentyourcio.com', '_blank', 'noopener')}><Ic.expand /> Open in full graph</button>
      </div>
    </PanelShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ETYMYTHON PANEL — mythological figure + family tree
// ─────────────────────────────────────────────────────────────────────────────

function EtymythonPanel({ figureId, glow, collapsed, onToggle, onClose, onPin, pinned }) {
  const [f, setF] = React.useState(window.BWTL.FIGURES[figureId] || null);
  const [loadingFig, setLoadingFig] = React.useState(!f);

  React.useEffect(() => {
    if (!figureId) return;
    if (window.BWTL.FIGURES[figureId]) { setF(window.BWTL.FIGURES[figureId]); setLoadingFig(false); return; }
    setLoadingFig(true);
    window.BWTL.fetchFigure(figureId)
      .then(data => { setF(data); setLoadingFig(false); })
      .catch(err => { console.error('[EtymythonPanel] fetchFigure error:', err); setLoadingFig(false); });
  }, [figureId]);

  if (loadingFig) return (
    <PanelShell variant="myth" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose}
      title={<><Ic.shield /> Etymython</>} meta="loading…">
      <div style={{ color: 'var(--fg-3)', fontSize: 13, padding: 12 }}>Loading figure data…</div>
    </PanelShell>
  );
  if (!f) return (
    <PanelShell variant="myth" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose}
      title={<><Ic.shield /> Etymython</>} meta="no figure">
      <div className="myth-empty" style={{ color: 'var(--fg-3)', fontSize: 13, padding: 12 }}>No mythological figure linked to this card.</div>
    </PanelShell>
  );

  return (
    <PanelShell variant="myth" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose} onPin={onPin} pinned={pinned}
      title={<><Ic.shield /> Etymython</>}
      meta={<>{f.figure_type} · 1 of 183</>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          aspectRatio: '1/1',
          borderRadius: 'var(--r)',
          background: 'linear-gradient(135deg, var(--myth-bg), var(--bg-3))',
          border: '1px dashed var(--line)',
          display: 'flex', alignItems: 'flex-end', padding: 6,
          fontFamily: 'var(--ff-mono)', fontSize: 8.5, color: 'var(--fg-4)',
        }}>seated Titan</div>
        <div>
          <div className="display" style={{ fontSize: 26, color: 'var(--myth)', lineHeight: 1 }}>{f.english_name}</div>
          <div className="greek" style={{ fontSize: 16, color: 'var(--fg-2)', marginTop: 2 }}>{f.greek_name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>{f.ipa}
            <button className="btn xs ghost" style={{ marginLeft: 8, padding: '2px 6px' }} title="Play"><Ic.speaker /></button>
          </div>
          <div style={{ marginTop: 6 }}>
            <span className="pill pie" style={{ fontSize: 9.5 }}>{f.pie_root}</span>
            <span className="pill myth" style={{ fontSize: 9.5, marginLeft: 4 }}>{f.domain}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)' }}>
        {f.origin_story}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 6 }}>Relations</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {f.relations.map(r => (
            <div key={r.id} style={{
              display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: 8,
              padding: '5px 8px', borderRadius: 6,
              background: 'var(--bg-2)', border: '1px solid var(--line-soft)',
              fontSize: 12,
            }}>
              <span className="mono" style={{ color: 'var(--fg-4)', fontSize: 10, textTransform: 'uppercase' }}>{r.rel.replace('_', ' ')}</span>
              <span style={{ color: 'var(--fg)' }}>{r.name}</span>
              <Ic.chevron_r style={{ color: 'var(--fg-4)' }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button className="btn xs ghost"><Ic.spark /> Generate imagery</button>
        <button className="btn xs ghost"><Ic.film /> From-figure storyboard</button>
      </div>
    </PanelShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO RAG PANEL — dictionary lookup
// ─────────────────────────────────────────────────────────────────────────────

function RagPanel({ pieRootKey, glow, collapsed, onToggle, onClose, onPin, pinned }) {
  const [e, setE] = React.useState(window.BWTL.RAG_ENTRIES[pieRootKey] || null);
  const [loadingRag, setLoadingRag] = React.useState(!e);

  React.useEffect(() => {
    if (!pieRootKey) return;
    if (window.BWTL.RAG_ENTRIES[pieRootKey]) { setE(window.BWTL.RAG_ENTRIES[pieRootKey]); setLoadingRag(false); return; }
    setLoadingRag(true);
    window.BWTL.searchRag(pieRootKey, 'etymology')
      .then(results => {
        const items = Array.isArray(results) ? results : (results.results || results.items || []);
        if (items.length > 0) {
          const entry = { headword: pieRootKey, excerpt: items[0].full_text || items[0].snippet || items[0].text || items[0].content || '', source: items[0].source || 'RAG · etymology', confidence: 'medium' };
          window.BWTL.RAG_ENTRIES[pieRootKey] = entry;
          setE(entry);
        } else { setE(null); }
        setLoadingRag(false);
      })
      .catch(err => { console.error('[RagPanel] searchRag error:', err); setLoadingRag(false); });
  }, [pieRootKey]);

  if (loadingRag) return (
    <PanelShell variant="rag" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose}
      title={<><Ic.book /> Portfolio RAG</>} meta="loading…">
      <div style={{ color: 'var(--fg-3)', fontSize: 13, padding: 12 }}>Loading RAG data…</div>
    </PanelShell>
  );
  if (!e) return (
    <PanelShell variant="rag" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose}
      title={<><Ic.book /> Portfolio RAG</>} meta="no entry">
      <div className="rag-empty" style={{ color: 'var(--fg-3)', fontSize: 13, padding: 12 }}>
        No Beekes entry found for this root. <a className="xlink" style={{ '--xc': 'var(--acc)' }}>Request ingestion</a>.
      </div>
    </PanelShell>
  );

  return (
    <PanelShell variant="rag" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose} onPin={onPin} pinned={pinned}
      title={<><Ic.book /> Portfolio RAG</>}
      meta={<>{e.source}</>}
    >
      <div style={{ fontFamily: 'var(--ff-display)', fontSize: 18, color: 'var(--acc-2)', marginBottom: 6 }}>{e.headword}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--fg-2)' }}>{e.excerpt}</div>
      <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className="pill ok" style={{ fontSize: 9.5 }}><span className="dot ok" /> {e.confidence} confidence</span>
        <span className="pill ghost" style={{ fontSize: 9.5 }}>collection: etymology</span>
      </div>
    </PanelShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTFORGE PANEL — etymology-driven generation only
// ─────────────────────────────────────────────────────────────────────────────

function ArtForgePanel({ card, figureId, glow, collapsed, onToggle, onClose, onPin, pinned }) {
  const [busy, setBusy] = React.useState(false);
  const [stage, setStage] = React.useState('idle'); // idle | queued | rendering | done
  const [jobId, setJobId] = React.useState(null);
  const [jobError, setJobError] = React.useState(null);

  const handleGenerate = () => {
    if (!card?.id) return;
    setBusy(true); setStage('queued'); setJobError(null);
    window.BWTL.generateVideo(card.id)
      .then(data => { setJobId(data.job_id || data.id || null); setStage('rendering'); })
      .catch(err => { console.error('[ArtForgePanel] generateVideo error:', err); setJobError(err.message); setBusy(false); setStage('idle'); });
  };

  return (
    <PanelShell variant="forge" glow={glow} collapsed={collapsed} onToggle={onToggle} onClose={onClose} onPin={onPin} pinned={pinned}
      title={<><Ic.film /> ArtForge — etymology only</>}
      meta={<>panel mode</>}
    >
      <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 10, lineHeight: 1.5 }}>
        Generation surface for <strong style={{ color: 'var(--fg)' }}>{card?.word || 'this word'}</strong>.
        Full ArtForge (galleries, library, non-etymology storyboards) stays at <span className="mono" style={{ color: 'var(--forge)' }}>artforge.rentyourcio.com</span>.
      </div>

      <div className="sb-row" style={{ marginBottom: 10 }}>
        <div className="sb-tile">scene 01 · keepsake on sill</div>
        <div className="sb-tile">scene 02 · letter opens</div>
        <div className="sb-tile">scene 03 · river of memory</div>
      </div>

      {jobError && (
        <div style={{ color: 'var(--err)', fontSize: 12, padding: '6px 0' }}>{jobError}</div>
      )}
      {stage !== 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, background: 'var(--bg-2)', border: '1px solid var(--line)', fontSize: 12, marginBottom: 10 }}>
          <span className={`dot ${stage === 'done' ? 'ok' : 'warn'}`} />
          <span style={{ color: 'var(--fg-2)' }}>
            {stage === 'queued' && 'Queued on ArtForge…'}
            {stage === 'rendering' && 'Rendering · model: veo-3 · est. 90s'}
            {stage === 'done' && 'Done · ready'}
          </span>
          {jobId && <span className="mono af-job-id" style={{ marginLeft: 'auto', color: 'var(--fg-4)', fontSize: 10 }}>{jobId}</span>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn sm" style={{ '--b-bg': 'var(--forge)', '--b-fg': '#0b0918', '--b-bd': 'var(--forge)' }} onClick={handleGenerate} disabled={busy}>
          <Ic.spark /> Generate video for "{card?.word || 'word'}"
        </button>
        <button className="btn sm ghost"><Ic.pencil /> Scene editor</button>
      </div>
    </PanelShell>
  );
}

window.BwtlPanels = { PanelShell, PiePanel, EfgPanel, EtymythonPanel, RagPanel, ArtForgePanel };
