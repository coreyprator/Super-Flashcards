// REV-2 — Etymology Surface components.
//
// Five new pieces, conditionally rendered inside the word card center column:
//   • MultiRootPie          — equation-style root pills (N=1..5+ roots)
//   • ScholarlyNotesStack   — multi-source citation stack (1 open + 4 collapsed)
//   • OriginStoryPanel      — long-form narrative, figure-only
//   • FamilyTreeGraph       — hierarchical SVG tree, figure-only
//   • EmptyEtymologyState   — placeholder with "Ask AI to research" actions
//
// All inherit BWTL's color tokens (pie blue, myth amber, etc.) and the
// ArtForge-derived shell vocabulary.

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-ROOT PIE DISPLAY (equation style)
// Renders one or more PIE root pills joined by "+". Each pill is large, has
// its own audio, gloss, IPA, and drills to the PIE Explorer panel.
// At N=1 the "+" disappears and the pill is solo. At N>=2 it's the full equation.
// ─────────────────────────────────────────────────────────────────────────────
function MultiRootPie({ pieRoots, currentCard, onDrillPie, canEdit }) {
  const roots = (pieRoots && pieRoots.length) ? pieRoots : (currentCard?.pie_root ? [currentCard.pie_root] : []);
  if (roots.length === 0) return null;
  const compound = roots.length > 1;

  return (
    <div className="wc-section" style={{ paddingTop: 18, paddingBottom: 18, background: 'linear-gradient(180deg, color-mix(in oklch, var(--pie) 4%, transparent), transparent)' }}>
      <h4>
        <span className="dot pie" /> PIE root{compound ? 's' : ''}
        {compound && (
          <span className="pill pie" style={{ marginLeft: 6, fontSize: 9.5 }}>compound · {roots.length} roots</span>
        )}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
          {canEdit && <AiEditButton field="pie_root" label="PIE root" subtle />}
        </span>
      </h4>

      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: compound ? 6 : 0,
        flexWrap: 'wrap',
        marginTop: 4,
      }}>
        {roots.map((r, i) => (
          <React.Fragment key={r}>
            <RootPill rootKey={r} onClick={() => onDrillPie?.(r)} primary={i === 0} />
            {compound && i < roots.length - 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
                fontFamily: 'var(--ff-display)',
                fontSize: 40, fontWeight: 300,
                color: 'var(--fg-4)',
                userSelect: 'none',
              }}>+</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {compound && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          background: 'var(--bg-2)',
          border: '1px dashed var(--line)',
          borderRadius: 'var(--r-sm)',
          fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.5,
        }}>
          <span className="mono" style={{ fontSize: 9.5, color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 6 }}>compound ▸</span>
          {currentCard?.word} is built from {roots.length} PIE roots. Each root has its own audio, paradigm, and reflexes — click any pill to open it in the PIE Explorer panel.
        </div>
      )}
    </div>
  );
}

function RootPill({ rootKey, onClick, primary }) {
  const root = window.BWTL.PIE_ROOTS[rootKey];
  const [playing, setPlaying] = React.useState(false);
  if (!root) {
    // Graceful: render a slim placeholder pill for unknown roots.
    return (
      <div className="pie-rootpill" onClick={onClick} style={{ borderStyle: 'dashed', opacity: 0.7 }}>
        <div className="prp-root">{rootKey}</div>
        <div className="prp-gloss" style={{ color: 'var(--fg-4)' }}>(not in PIE Explorer yet)</div>
      </div>
    );
  }
  return (
    <div
      className="pie-rootpill"
      onClick={onClick}
      style={primary ? {} : { borderColor: 'var(--pie-ring)' }}
    >
      <div className="prp-row">
        <div className="prp-root">{root.root}</div>
        <button
          className="prp-audio"
          onClick={(e) => { e.stopPropagation(); setPlaying(true); setTimeout(() => setPlaying(false), 1200); }}
          title={`Play PIE reconstruction · ${root.ipa}`}
        >
          {playing ? <Ic.pause /> : <Ic.play />}
        </button>
      </div>
      <div className="prp-ipa mono">{root.ipa}</div>
      <div className="prp-gloss">"{root.gloss}"</div>
      <div className="prp-meta">
        <span className="mono">{root.word_count} reflexes</span>
        <span className="prp-drill"><Ic.spark /> Open</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHOLARLY NOTES STACK (compact accordion: 1 expanded, 4 collapsed)
// Per-root citation list — Beekes / Watkins / Kroonen / DCC / LSJ entries
// with page numbers. User can expand any line; first one is open by default.
// Renders side-by-side for compound words (one stack per root).
// ─────────────────────────────────────────────────────────────────────────────
function ScholarlyNotesStack({ pieRoots, currentCard }) {
  const roots = (pieRoots && pieRoots.length) ? pieRoots : (currentCard?.pie_root ? [currentCard.pie_root] : []);
  const notesByRoot = roots.map(r => ({ root: r, notes: window.BWTL.SCHOLARLY_NOTES[r] || [] }))
                            .filter(g => g.notes.length > 0);
  if (notesByRoot.length === 0) return null;

  return (
    <div className="wc-section">
      <h4>
        <span className="dot" style={{ background: 'var(--acc-2)' }} /> Scholarly notes
        <span className="pill ghost" style={{ marginLeft: 'auto', fontSize: 9.5 }}>
          {notesByRoot.reduce((a, g) => a + g.notes.length, 0)} attestations
          {notesByRoot.length > 1 && ` · ${notesByRoot.length} roots`}
        </span>
      </h4>
      <div style={{
        display: 'grid',
        gridTemplateColumns: notesByRoot.length > 1 ? `repeat(${notesByRoot.length}, minmax(0, 1fr))` : '1fr',
        gap: 10,
        marginTop: 6,
      }}>
        {notesByRoot.map(({ root, notes }) => (
          <ScholarlyNotesColumn key={root} root={root} notes={notes} multiRoot={notesByRoot.length > 1} />
        ))}
      </div>
    </div>
  );
}

function ScholarlyNotesColumn({ root, notes, multiRoot }) {
  // First entry expanded by default; others collapsed headers.
  const [expanded, setExpanded] = React.useState(new Set([0]));
  const toggle = (i) => setExpanded(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  return (
    <div style={{
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-sm)',
      overflow: 'hidden',
    }}>
      {multiRoot && (
        <div style={{
          padding: '6px 10px',
          background: 'color-mix(in oklch, var(--pie) 6%, var(--bg-2))',
          borderBottom: '1px solid var(--line-soft)',
          fontFamily: 'var(--ff-display)',
          fontSize: 14,
          color: 'var(--pie)',
        }}>
          {root}
        </div>
      )}
      {notes.map((n, i) => {
        const isOpen = expanded.has(i);
        return (
          <div key={i} style={{ borderTop: i > 0 ? '1px solid var(--line-soft)' : 'none' }}>
            <button
              onClick={() => toggle(i)}
              style={{
                width: '100%', appearance: 'none', cursor: 'pointer',
                background: isOpen ? 'var(--bg-2)' : 'transparent',
                border: 0, padding: '8px 12px',
                display: 'grid',
                gridTemplateColumns: '14px 1fr auto',
                gap: 8, alignItems: 'center',
                fontFamily: 'inherit', color: 'var(--fg)',
                textAlign: 'left',
              }}
            >
              <Ic.caret_d style={{ transform: isOpen ? 'none' : 'rotate(-90deg)', color: 'var(--fg-4)', transition: 'transform .15s' }} />
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{n.source}</span>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>{n.ref}</span>
                {n.headword && <span className="greek" style={{ fontSize: 12, color: 'var(--acc-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.headword}</span>}
              </span>
              <KindBadge kind={n.kind} confidence={n.confidence} contradicts={n.contradicts} />
            </button>
            {isOpen && (
              <div style={{
                padding: '4px 12px 12px 34px',
                fontSize: 12.5, lineHeight: 1.55,
                color: 'var(--fg-2)',
                background: 'var(--bg-2)',
              }}>
                {n.excerpt}
                {n.contradicts && (
                  <div style={{ marginTop: 8, padding: '6px 8px', borderLeft: '2px solid var(--err)', background: 'color-mix(in oklch, var(--err) 5%, transparent)', fontSize: 11, color: 'var(--fg-3)' }}>
                    ⚠ This source rejects the PIE attribution <span className="mono">{n.contradicts}</span>. Card shows it for transparency; not a coverage gap.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function KindBadge({ kind, confidence, contradicts }) {
  const map = {
    dictionary: { label: 'dict',  color: 'var(--pie)' },
    root:       { label: 'root',  color: 'var(--acc)' },
    lexicon:    { label: 'lex',   color: 'var(--graph)' },
    frequency:  { label: 'freq',  color: 'var(--myth)' },
  };
  const m = map[kind] || { label: kind, color: 'var(--fg-3)' };
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      <span style={{
        fontFamily: 'var(--ff-mono)', fontSize: 9, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        padding: '1.5px 5px', borderRadius: 3,
        background: `color-mix(in oklch, ${m.color} 14%, transparent)`,
        color: m.color,
        border: `1px solid color-mix(in oklch, ${m.color} 30%, transparent)`,
      }}>{m.label}</span>
      {confidence != null && (
        <span style={{
          fontFamily: 'var(--ff-mono)', fontSize: 9,
          color: contradicts ? 'var(--err)' : confidence >= 0.9 ? 'var(--ok)' : confidence >= 0.7 ? 'var(--warn)' : 'var(--fg-4)',
        }}>{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORIGIN STORY PANEL (figure cards only)
// Reading-style narrative of the figure's mythological backstory.
// Pulled from EM.mythological_figures.origin_story.
// ─────────────────────────────────────────────────────────────────────────────
function OriginStoryPanel({ figure, role }) {
  if (!figure) return null;
  const canEdit = role === 'pl' || role === 'theo';
  const paras = (figure.origin_story || '').split('\n\n');
  return (
    <div className="wc-section" style={{ background: 'color-mix(in oklch, var(--myth) 3%, transparent)' }}>
      <h4>
        <span className="dot" style={{ background: 'var(--myth)' }} /> Origin story
        <span className="pill myth" style={{ marginLeft: 6, fontSize: 9.5 }}>
          {figure.figure_type}
        </span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
          {canEdit && <AiEditButton field="origin_story" label="Origin story" subtle />}
        </span>
      </h4>
      <div style={{
        fontFamily: 'var(--ff-display)',
        fontSize: 16, lineHeight: 1.65,
        color: 'var(--fg)',
        fontWeight: 400,
        letterSpacing: '-0.005em',
        textWrap: 'pretty',
      }}>
        {paras.map((p, i) => (
          <p key={i} style={{ margin: i === 0 ? '0 0 14px' : '0 0 14px' }}>
            <FigureProseLinker text={p} />
          </p>
        ))}
      </div>
      {figure.attestations && figure.attestations.length > 0 && (
        <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px dashed var(--line)' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-4)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ic.scroll /> Attestations
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {figure.attestations.map((a, i) => (
              <span key={i} className="pill ghost" style={{ fontSize: 10, fontFamily: 'var(--ff-mono)' }} title={a.ref}>
                {a.source} <span style={{ opacity: 0.6 }}>· {a.era}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Light prose linker — capitalizes of figure names in origin stories get
// linked to a hover affordance (in this prototype they're styled as xlinks
// but don't navigate; in production they'd go to the figure detail).
function FigureProseLinker({ text }) {
  // crude tag the names this prototype knows
  const names = ['Ananke','Aether','Erebus','Chaos','Aion','Zurvan','Kronos','Mnemosyne','Lethe','Zeus','Gaia','Uranus','Cronus','Rhea','Themis','Moneta','Mount Olympus','Damascius','Plutarch','Hesiod','Pausanias'];
  let parts = [text];
  names.forEach(n => {
    const next = [];
    parts.forEach(p => {
      if (typeof p !== 'string') { next.push(p); return; }
      const split = p.split(new RegExp(`(${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`));
      split.forEach(s => {
        if (s === n) next.push(<a key={Math.random()} className="xlink myth" style={{ fontFamily: 'inherit', fontWeight: 600 }}><span className="x-tag">EM</span>{s}</a>);
        else if (s) next.push(s);
      });
    });
    parts = next;
  });
  return <>{parts}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAMILY TREE GRAPH (figure cards only) — hierarchical SVG.
// Three tiers: parents (top), subject + consort + siblings + lateral (middle),
// children (bottom). Lines drawn between them. Lateral relations
// (equivalent / inverse_of / distinct_from / often_confused_with) sit on the
// wings with dashed connectors that visually read as "related but not blood".
// ─────────────────────────────────────────────────────────────────────────────
function FamilyTreeGraph({ figure, onOpenFigure }) {
  if (!figure) return null;
  const rels = figure.relations || [];

  // Bucket by tier.
  const parents = rels.filter(r => r.rel === 'parent');
  const siblings = rels.filter(r => r.rel === 'sibling');
  const consorts = rels.filter(r => r.rel === 'consort');
  const children = rels.filter(r => r.rel === 'child' || r.rel === 'mother_of' || r.rel === 'father_of');
  const lateralL = rels.filter(r => r.rel === 'distinct_from' || r.rel === 'often_confused_with');
  const lateralR = rels.filter(r => r.rel === 'equivalent' || r.rel === 'inverse_of');

  const W = 880, H = 380;
  const cx = W / 2, cy = H / 2;
  const tierY = { parent: 56, middle: cy, child: H - 70 };

  // Position helper: evenly distribute around a center X.
  const distribute = (n, w, centerX, y, gap = 14) => {
    const totalW = n * w + (n - 1) * gap;
    const startX = centerX - totalW / 2;
    return Array.from({ length: n }, (_, i) => ({ x: startX + i * (w + gap) + w / 2, y }));
  };

  const nodeW = 132, nodeH = 50;
  const parentPos  = distribute(parents.length, nodeW, cx, tierY.parent);
  const childPos   = distribute(children.length, nodeW, cx, tierY.child);
  const siblingPos = siblings.map((_, i) => ({ x: 86 + (i * 6), y: tierY.parent + 92 + i * (nodeH + 8) }));
  const subjectPos = { x: cx, y: cy };
  const consortPos = consorts.length > 0 ? { x: cx + 220, y: cy } : null;
  const lLPos = lateralL.map((_, i) => ({ x: 86, y: cy + 60 + i * (nodeH + 10) }));
  const lRPos = lateralR.map((_, i) => ({ x: W - 86, y: cy - 30 + i * (nodeH + 10) }));

  return (
    <div className="wc-section" style={{ paddingTop: 18 }}>
      <h4>
        <span className="dot" style={{ background: 'var(--myth)' }} /> Family tree
        <span className="pill myth" style={{ marginLeft: 6, fontSize: 9.5 }}>
          {rels.length} relations
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--fg-4)' }}>
          <span className="mono">EM.figure_relationships</span> · click any node to drill in
        </span>
      </h4>

      <div style={{
        background:
          'radial-gradient(ellipse at center, color-mix(in oklch, var(--myth) 5%, transparent), transparent 70%), var(--bg-1)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        marginTop: 6,
        position: 'relative',
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', width: '100%', height: 'auto', minHeight: 360 }}>
          <defs>
            <marker id="ft-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0 0L10 5L0 10z" fill="color-mix(in oklch, var(--myth) 60%, var(--fg-4))" />
            </marker>
          </defs>

          {/* Tier band labels (very subtle) */}
          {parents.length > 0 && <TierLabel x={28} y={tierY.parent} label="Parents" />}
          {children.length > 0 && <TierLabel x={28} y={tierY.child} label="Children" />}
          {(consorts.length > 0 || siblings.length > 0) && <TierLabel x={28} y={cy} label="Generation" />}

          {/* Parent → subject lines (solid) */}
          {parentPos.map((p, i) => (
            <path key={'pp'+i}
              d={`M ${p.x} ${p.y + nodeH / 2} V ${(p.y + subjectPos.y) / 2} H ${subjectPos.x} V ${subjectPos.y - nodeH / 2}`}
              fill="none" stroke="color-mix(in oklch, var(--myth) 60%, var(--fg-4))" strokeWidth="1.6"
            />
          ))}

          {/* Subject → child lines (solid) */}
          {childPos.map((c, i) => (
            <path key={'cc'+i}
              d={`M ${subjectPos.x} ${subjectPos.y + nodeH / 2} V ${(subjectPos.y + c.y) / 2} H ${c.x} V ${c.y - nodeH / 2}`}
              fill="none" stroke="color-mix(in oklch, var(--myth) 60%, var(--fg-4))" strokeWidth="1.6"
            />
          ))}

          {/* Sibling lines — joined under shared parent crossbar */}
          {parents.length > 0 && siblingPos.map((s, i) => (
            <path key={'ss'+i}
              d={`M ${parentPos[0]?.x || cx} ${(parentPos[0]?.y || tierY.parent) + nodeH / 2 + 20} H ${s.x} V ${s.y}`}
              fill="none" stroke="color-mix(in oklch, var(--myth) 50%, var(--fg-4))" strokeWidth="1.3" strokeDasharray="2,3" opacity="0.7"
            />
          ))}

          {/* Consort connector — bold "=" style horizontal */}
          {consortPos && (
            <>
              <line x1={subjectPos.x + nodeW / 2} y1={subjectPos.y - 4} x2={consortPos.x - nodeW / 2} y2={consortPos.y - 4}
                    stroke="var(--myth)" strokeWidth="2" />
              <line x1={subjectPos.x + nodeW / 2} y1={subjectPos.y + 4} x2={consortPos.x - nodeW / 2} y2={consortPos.y + 4}
                    stroke="var(--myth)" strokeWidth="2" />
              <text x={(subjectPos.x + consortPos.x) / 2} y={subjectPos.y - 12} textAnchor="middle"
                    fontFamily="var(--ff-mono)" fontSize="9" letterSpacing="0.06em" fill="var(--myth)" style={{ textTransform: 'uppercase' }}>consort</text>
            </>
          )}

          {/* Lateral left — dashed lines to the subject */}
          {lLPos.map((p, i) => (
            <line key={'ll'+i}
              x1={p.x + nodeW / 2} y1={p.y}
              x2={subjectPos.x - nodeW / 2} y2={subjectPos.y}
              stroke="var(--err)" strokeWidth="1.2" strokeDasharray="4,4" opacity="0.55"
            />
          ))}
          {lRPos.map((p, i) => (
            <line key={'lr'+i}
              x1={p.x - nodeW / 2} y1={p.y}
              x2={(consortPos ? consortPos.x + nodeW / 2 : subjectPos.x + nodeW / 2)} y2={(consortPos ? consortPos.y : subjectPos.y)}
              stroke="color-mix(in oklch, var(--graph) 65%, var(--fg-4))" strokeWidth="1.2" strokeDasharray="4,4" opacity="0.55"
            />
          ))}

          {/* Render nodes (subject last so it overlays connectors at center) */}
          {parents.map((r, i) => <TreeNode key={'parent'+i} pos={parentPos[i]} r={r} onClick={() => onOpenFigure?.(r.id)} kind="parent" />)}
          {siblings.map((r, i) => <TreeNode key={'sib'+i} pos={siblingPos[i]} r={r} onClick={() => onOpenFigure?.(r.id)} kind="sibling" />)}
          {children.map((r, i) => <TreeNode key={'kid'+i} pos={childPos[i]} r={r} onClick={() => onOpenFigure?.(r.id)} kind="child" />)}
          {consortPos && <TreeNode pos={consortPos} r={consorts[0]} onClick={() => onOpenFigure?.(consorts[0].id)} kind="consort" />}
          {lateralL.map((r, i) => <TreeNode key={'lL'+i} pos={lLPos[i]} r={r} onClick={() => onOpenFigure?.(r.id)} kind="distinct" />)}
          {lateralR.map((r, i) => <TreeNode key={'lR'+i} pos={lRPos[i]} r={r} onClick={() => onOpenFigure?.(r.id)} kind="equivalent" />)}

          {/* SUBJECT NODE — drawn last so it overlays */}
          <SubjectNode pos={subjectPos} figure={figure} />
        </svg>

        {/* Legend */}
        <div style={{
          position: 'absolute', right: 12, bottom: 10,
          display: 'flex', gap: 10, alignItems: 'center',
          fontFamily: 'var(--ff-mono)', fontSize: 9, letterSpacing: '0.05em', color: 'var(--fg-4)',
        }}>
          <LegendSwatch color="var(--myth)" label="lineage" solid />
          <LegendSwatch color="var(--err)" label="distinct" dashed />
          <LegendSwatch color="var(--graph)" label="equivalent" dashed />
        </div>
      </div>
    </div>
  );
}

function TierLabel({ x, y, label }) {
  return (
    <text x={x} y={y - 22} fontFamily="var(--ff-mono)" fontSize="9" letterSpacing="0.08em"
          textTransform="uppercase" fill="var(--fg-5)" style={{ textTransform: 'uppercase' }}>
      {label}
    </text>
  );
}

function TreeNode({ pos, r, onClick, kind }) {
  const colorMap = {
    parent:     'var(--myth)',
    sibling:    'var(--myth)',
    child:      'var(--myth)',
    consort:    'var(--myth)',
    distinct:   'var(--err)',
    equivalent: 'var(--graph)',
  };
  const c = colorMap[kind] || 'var(--myth)';
  const w = 132, h = 50;
  return (
    <g style={{ cursor: 'pointer' }} onClick={onClick}>
      <rect
        x={pos.x - w / 2} y={pos.y - h / 2} width={w} height={h} rx="6"
        fill={`color-mix(in oklch, ${c} 10%, var(--bg-2))`}
        stroke={c} strokeWidth="1.2"
      />
      {r.plural && (
        <>
          <rect x={pos.x - w / 2 + 3} y={pos.y - h / 2 + 3} width={w} height={h} rx="6"
                fill="none" stroke={c} strokeWidth="0.8" opacity="0.5" />
          <rect x={pos.x - w / 2 + 6} y={pos.y - h / 2 + 6} width={w} height={h} rx="6"
                fill="none" stroke={c} strokeWidth="0.6" opacity="0.3" />
        </>
      )}
      <text x={pos.x} y={pos.y - 4} textAnchor="middle"
            fontFamily="var(--ff-sans)" fontSize="13" fontWeight="600" fill="var(--fg)">
        {r.name}{r.plural ? ` (×${r.plural})` : ''}
      </text>
      <text x={pos.x} y={pos.y + 12} textAnchor="middle"
            fontFamily="var(--ff-greek)" fontSize="11" fill="var(--fg-3)">
        {r.greek || ''}
      </text>
      {r.tradition && (
        <text x={pos.x} y={pos.y + h / 2 - 4} textAnchor="middle"
              fontFamily="var(--ff-mono)" fontSize="8" fill="var(--fg-4)" letterSpacing="0.05em">
          {r.tradition}
        </text>
      )}
    </g>
  );
}

function SubjectNode({ pos, figure }) {
  const w = 162, h = 62;
  return (
    <g>
      <rect
        x={pos.x - w / 2} y={pos.y - h / 2} width={w} height={h} rx="8"
        fill={`color-mix(in oklch, var(--myth) 18%, var(--bg-1))`}
        stroke="var(--myth)" strokeWidth="2"
      />
      {/* glow */}
      <rect
        x={pos.x - w / 2 - 4} y={pos.y - h / 2 - 4} width={w + 8} height={h + 8} rx="10"
        fill="none" stroke="var(--myth)" strokeWidth="1" opacity="0.25"
      />
      <text x={pos.x} y={pos.y - 6} textAnchor="middle"
            fontFamily="var(--ff-display)" fontSize="17" fontWeight="500" fill="var(--fg)">
        {figure.english_name}
      </text>
      <text x={pos.x} y={pos.y + 14} textAnchor="middle"
            fontFamily="var(--ff-greek)" fontSize="13" fill="var(--myth)">
        {figure.greek_name}
      </text>
    </g>
  );
}

function LegendSwatch({ color, label, dashed, solid }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <svg width="22" height="6" style={{ display: 'inline-block' }}>
        <line x1="0" y1="3" x2="22" y2="3" stroke={color} strokeWidth="1.5" strokeDasharray={dashed ? '3,3' : 'none'} />
      </svg>
      <span>{label}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY ETYMOLOGY STATE — words with no PIE root (recent loanwords, etc.).
// Per revision brief Q3 — show empty-state placeholders with explicit
// "Ask AI to research" actions for each missing pillar.
// ─────────────────────────────────────────────────────────────────────────────
function EmptyEtymologyState({ card, onAskAI }) {
  if (!card) return null;
  return (
    <div className="wc-section" style={{
      background: 'repeating-linear-gradient(45deg, transparent, transparent 14px, color-mix(in oklch, var(--fg) 2.5%, transparent) 14px, color-mix(in oklch, var(--fg) 2.5%, transparent) 15px), var(--bg-1)',
      borderTop: '1px solid var(--line-soft)',
      borderBottom: '1px solid var(--line-soft)',
    }}>
      <h4>
        <span className="dot warn" /> No etymology on record
        <span className="pill warn" style={{ marginLeft: 6, fontSize: 9.5 }}>graceful fallback</span>
      </h4>
      {card.non_pie_reason && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-2)',
          border: '1px solid var(--line-soft)',
          borderRadius: 'var(--r-sm)',
          fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.55,
          marginBottom: 12,
        }}>
          <span className="mono" style={{ fontSize: 9.5, color: 'var(--fg-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 6 }}>non_pie_reason ▸</span>
          {card.non_pie_reason}
        </div>
      )}
      <div style={{ display: 'grid', gap: 6 }}>
        {[
          { lab: 'PIE root',        sub: 'attempt reconstruction via Beekes RAG' },
          { lab: 'Cognates',        sub: 'cross-language cognate hunt' },
          { lab: 'Fun facts',       sub: 'history of the abbreviation / loan' },
          { lab: 'Scholarly notes', sub: 'cite any attestations even if non-IE' },
        ].map(p => (
          <div key={p.lab} style={{
            display: 'grid', gridTemplateColumns: '1fr auto',
            gap: 10, alignItems: 'center',
            padding: '9px 12px',
            background: 'var(--bg-2)',
            border: '1px dashed var(--line)',
            borderRadius: 'var(--r-sm)',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.lab}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 2 }}>{p.sub}</div>
            </div>
            <button className="btn xs primary" onClick={() => onAskAI?.(p.lab)}>
              <Ic.spark /> Ask AI to research
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

window.Etymology = { MultiRootPie, ScholarlyNotesStack, OriginStoryPanel, FamilyTreeGraph, EmptyEtymologyState };
