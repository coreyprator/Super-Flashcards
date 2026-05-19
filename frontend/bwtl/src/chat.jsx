// AI Chat sidecar — the most novel surface, revised.
//
// REV item 1 — anchor is FLASHCARD_ID primary. The card's id is shown in the
// header chip. There is no pie_root fallback — cards without pie_root (30%,
// 879 cards) work identically.
//
// REV item 3 — every AI turn carries a "context snapshot" debug expander
// showing exactly what fields, EFG node, figure, and steering directive the
// model received. The user can also edit the THREAD-level context payload
// (which fields to bundle, which EFG/figure to attach, steering string) to
// keep long rabbit-holes on-topic.
//
// REV item 4 — instead of a "promote to review queue" send, each AI message
// can be Accepted directly with a target field dropdown (16 healable fields).
// Accept writes the audit row immediately. No second-party approval gate.

function ChatDock({
  anchor,               // { mode: 'flashcard_id', value: 'fc_souvenir', label: 'souvenir' }
  card,
  expanded,
  onToggleExpand,
  threads,
  activeThreadId,
  onActivateThread,
  onNewThread,
  onPromote,
  role,
}) {
  const [draft, setDraft] = React.useState('');
  const [contextOpen, setContextOpen] = React.useState(false);
  const [snapOpen, setSnapOpen] = React.useState({});  // per-message-idx
  const messagesRef = React.useRef(null);

  React.useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [activeThreadId, expanded]);

  const active = threads.find(t => t.id === activeThreadId) || threads[0];

  // group threads by month for the rail
  const grouped = React.useMemo(() => {
    const map = {};
    threads.forEach(t => {
      const month = t.when.slice(0, 7);
      (map[month] = map[month] || []).push(t);
    });
    return map;
  }, [threads]);

  const totalThreads = threads.length;
  const ctx = active?.context;

  return (
    <div className={`chat-dock ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="chat-shell">
        <div className="chat-head" onClick={(e) => { if (e.target.closest('button,.chat-anchor')) return; onToggleExpand(); }}>
          <div className="chat-anchor" style={{ background: 'var(--acc-bg)', borderColor: 'var(--acc-ring)', color: 'var(--acc-2)' }}
               title="This thread is anchored to a specific flashcard. The Chat tab in top-nav indexes threads across all cards.">
            <span className="mode-tag">card</span>
            <span className="greek">{anchor.label || anchor.value}</span>
            <span className="mono" style={{ fontSize: 9.5, opacity: 0.6 }}>{anchor.value}</span>
          </div>
          <div className="thread-info">
            {totalThreads > 0 ? (
              <>
                <span className="thread-pill"><Ic.chat /> {totalThreads} thread{totalThreads !== 1 ? 's' : ''}<span className="count">· last: {threads[0]?.when}</span></span>
                {!expanded && active && (
                  <span style={{ color: 'var(--fg-2)' }}>
                    “{active.title}”
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: 'var(--fg-3)' }}>No prior threads on this card.</span>
            )}
          </div>
          <div className="chat-head-actions">
            {expanded && active && (
              <button
                className="btn xs ghost"
                onClick={(e) => { e.stopPropagation(); setContextOpen(o => !o); }}
                title="View / edit the context payload the AI receives for this thread"
                style={contextOpen ? { background: 'var(--bg-3)', color: 'var(--fg)' } : {}}
              >
                <Ic.spark /> Context
              </button>
            )}
            <button className="btn xs ghost" onClick={(e) => { e.stopPropagation(); onNewThread(); }}>
              <Ic.plus /> New thread
            </button>
            <button className="btn xs ghost" onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}>
              {expanded ? <Ic.collapse /> : <Ic.expand />}
            </button>
          </div>
        </div>

        {expanded && (
          <>
            <div className="chat-body">
              <div className="chat-threads">
                {Object.entries(grouped).map(([month, items]) => (
                  <React.Fragment key={month}>
                    <div className="chat-thread-header">{month}</div>
                    {items.map(t => (
                      <div
                        key={t.id}
                        className={`chat-thread-item ${t.id === active?.id ? 'active' : ''}`}
                        onClick={() => onActivateThread(t.id)}
                      >
                        <div className="lead" style={{ fontWeight: 600 }}>{t.title}</div>
                        <div className="when">{t.when} · {t.messages.length} msg</div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
                {threads.length === 0 && (
                  <div style={{ padding: 12, color: 'var(--fg-4)', fontSize: 12, lineHeight: 1.5 }}>
                    No threads yet on <span className="pill" style={{ fontSize: 9.5 }}>{anchor.label || anchor.value}</span>.
                    Start one — anything you discuss will be here next time you open this card.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {contextOpen && active && (
                  <ContextPanel ctx={ctx} card={card} onClose={() => setContextOpen(false)} />
                )}
                <div className="chat-messages" ref={messagesRef}>
                  {active ? active.messages.map((m, i) => (
                    <div key={i} className={`msg ${m.role}`}>
                      <div className="avt">{m.role === 'you' ? (window.BWTL.ROLES[role]?.initials || 'U') : 'AI'}</div>
                      <div className="bubble">
                        <div>{m.text}</div>
                        {/* Per-AI-turn context-snapshot expander (REV item 3) */}
                        {m.role === 'ai' && m.context_snapshot && (
                          <div style={{
                            marginTop: 8, paddingTop: 6,
                            borderTop: '1px dashed var(--line)',
                            fontSize: 10.5, color: 'var(--fg-4)',
                          }}>
                            <button
                              onClick={() => setSnapOpen(s => ({ ...s, [i]: !s[i] }))}
                              style={{
                                appearance: 'none', background: 'transparent', border: 0,
                                color: 'var(--fg-4)', cursor: 'pointer', padding: 0,
                                fontFamily: 'inherit', fontSize: 10.5,
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                              }}
                            >
                              <Ic.caret_d style={{ transform: snapOpen[i] ? 'none' : 'rotate(-90deg)' }} />
                              context · {m.context_snapshot.card_fields} card field{m.context_snapshot.card_fields !== 1 ? 's' : ''}
                              {m.context_snapshot.efg_node ? ' · efg ✓' : ''}
                              {m.context_snapshot.figure ? ` · figure ${m.context_snapshot.figure}` : ''}
                              {m.context_snapshot.steering_applied ? ' · steered' : ''}
                              <span className="mono" style={{ marginLeft: 6 }}>{m.context_snapshot.tokens_in}/{m.context_snapshot.tokens_out}t</span>
                            </button>
                            {snapOpen[i] && (
                              <pre style={{
                                margin: '6px 0 0', padding: '8px 10px',
                                background: 'var(--bg-1)', border: '1px solid var(--line)',
                                borderRadius: 5, fontFamily: 'var(--ff-mono)', fontSize: 10,
                                color: 'var(--fg-3)', whiteSpace: 'pre-wrap',
                              }}>{JSON.stringify({ ...m.context_snapshot, anchor }, null, 2)}</pre>
                            )}
                          </div>
                        )}
                        {/* Per-message Accept dropdown (REV item 4) */}
                        {m.role === 'ai' && m.promotable && (
                          <AcceptBar promotable={m.promotable} role={role} onPromote={onPromote} />
                        )}
                      </div>
                    </div>
                  )) : (
                    <div style={{ color: 'var(--fg-4)', fontSize: 13, padding: 12 }}>
                      Pick a thread on the left, or start a new one.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="chat-compose">
              <div>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Ask about ${anchor.label || anchor.value} — anchored to this card.`}
                />
                <div className="chat-compose-prompt">
                  <span>Try:</span>
                  <span className="prompt-chip" onClick={() => setDraft('What\'s a striking fun-fact for this word?')}>fun fact?</span>
                  <span className="prompt-chip" onClick={() => setDraft('Show me the conjugation table.')}>conjugation</span>
                  <span className="prompt-chip" onClick={() => setDraft('Walk me through a false cognate.')}>false cognate</span>
                  <span className="prompt-chip" onClick={() => setDraft('Which figures are linked to this word?')}>linked figures</span>
                </div>
              </div>
              <button className="btn primary" disabled={!draft.trim()}>
                <Ic.send /> Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Context payload panel ──────────────────────────────────────────────────
// Visible above messages when the "Context" button is toggled. Shows which
// card fields, EFG node, and figure are bundled per turn, plus a steering
// directive the user can edit live.
function ContextPanel({ ctx, card, onClose }) {
  const allFields = [
    'word_or_phrase','language','pos','ipa_pronunciation','definition',
    'etymology','pie_root','pie_ipa','english_cognates','related_words','image_caption','efg_node_id',
  ];
  const [fields, setFields] = React.useState(new Set(ctx?.fields || []));
  const [efg, setEfg] = React.useState(!!ctx?.efg_node);
  const [fig, setFig] = React.useState(!!ctx?.figure);
  const [steering, setSteering] = React.useState(ctx?.steering || '');
  const toggle = (k) => setFields(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <div style={{
      borderBottom: '1px solid var(--line-soft)',
      background: 'var(--bg-2)',
      padding: '10px 16px',
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--acc-2)' }}>
          <Ic.spark style={{ verticalAlign: '-2px' }} /> Context payload · sent on every turn
        </span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{fields.size + (efg?1:0) + (fig?1:0)} attached</span>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: 'var(--fg-3)', cursor: 'pointer' }}><Ic.x /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-4)', marginBottom: 5 }}>Card fields bundled</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {allFields.map(f => (
              <button
                key={f}
                onClick={() => toggle(f)}
                style={{
                  appearance: 'none', cursor: 'pointer',
                  padding: '3px 8px', borderRadius: 99,
                  border: '1px solid ' + (fields.has(f) ? 'var(--acc-ring)' : 'var(--line)'),
                  background: fields.has(f) ? 'var(--acc-bg)' : 'transparent',
                  color: fields.has(f) ? 'var(--acc-2)' : 'var(--fg-3)',
                  fontFamily: 'var(--ff-mono)', fontSize: 10.5,
                }}
              >
                {fields.has(f) && '✓ '}{f}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--fg-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={efg} onChange={(e) => setEfg(e.target.checked)} />
              attach EFG node <span className="mono" style={{ color: 'var(--graph)' }}>{card?.efg_node_id || '—'}</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--fg-2)', cursor: 'pointer', opacity: card?.figure_link ? 1 : 0.4 }}>
              <input type="checkbox" checked={fig} onChange={(e) => setFig(e.target.checked)} disabled={!card?.figure_link} />
              attach figure <span className="mono" style={{ color: 'var(--myth)' }}>{card?.figure_link || '—'}</span>
            </label>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-4)', marginBottom: 5 }}>
            Steering directive
            <span style={{ marginLeft: 6, color: 'var(--fg-5)', textTransform: 'none', letterSpacing: 0 }}>· keeps long threads on-topic</span>
          </div>
          <textarea
            value={steering}
            onChange={(e) => setSteering(e.target.value)}
            placeholder='e.g. "Focus on French historical morphology, not PIE reconstruction."'
            style={{
              width: '100%', height: 64,
              background: 'var(--bg-1)', border: '1px solid var(--line)',
              borderRadius: 5, padding: 8,
              color: 'var(--fg)', font: 'inherit', fontSize: 12,
              resize: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
            <button className="btn xs ghost" onClick={() => { setSteering(ctx?.steering || ''); setFields(new Set(ctx?.fields || [])); }}>Revert</button>
            <button className="btn xs primary" onClick={onClose}><Ic.check /> Save for thread</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Per-message Accept + field dropdown (REV item 4) ───────────────────────
// No more "send to review queue". Accept writes immediately and appends an
// audit row to chat_promotions. The user picks the target field from a
// dropdown of 16 healable fields, modelled on the Verify PIE round-trip.
function AcceptBar({ promotable, role, onPromote }) {
  const [open, setOpen] = React.useState(false);
  const [field, setField] = React.useState('fun_facts');
  const [stage, setStage] = React.useState('idle'); // idle | confirm | done

  const fieldMeta = window.BWTL.PROMOTE_FIELDS.find(f => f.key === field);
  const grouped = React.useMemo(() => {
    const m = {};
    window.BWTL.PROMOTE_FIELDS.forEach(f => { (m[f.tier] = m[f.tier] || []).push(f); });
    return m;
  }, []);

  const accept = () => {
    setStage('done');
    onPromote({ card: promotable.card, field, preview: promotable.preview });
    setTimeout(() => { setOpen(false); setStage('idle'); }, 1600);
  };

  return (
    <div style={{
      marginTop: 10, padding: 8,
      borderTop: '1px dashed var(--line)',
      borderRadius: 5,
      background: 'color-mix(in oklch, var(--ok) 4%, transparent)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--fg-3)' }}>
        <Ic.spark style={{ color: 'var(--ok)' }} />
        <span>Accept this insight to <strong style={{ color: 'var(--fg-2)' }}>{promotable.card}</strong> →</span>
        <select
          value={field}
          onChange={(e) => setField(e.target.value)}
          style={{
            background: 'var(--bg-2)', border: '1px solid var(--line)',
            color: 'var(--fg)', borderRadius: 5, padding: '3px 6px',
            fontFamily: 'var(--ff-mono)', fontSize: 11, cursor: 'pointer',
          }}
        >
          {Object.entries(grouped).map(([tier, items]) => (
            <optgroup key={tier} label={tier}>
              {items.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </optgroup>
          ))}
        </select>
        <button
          className="btn xs ghost"
          onClick={() => setOpen(o => !o)}
          title="Preview the write"
          style={open ? { background: 'var(--bg-3)', color: 'var(--fg)' } : {}}
        >
          {open ? 'hide' : 'preview'}
        </button>
        {stage === 'idle' && (
          <button
            className="btn xs primary"
            style={{ marginLeft: 'auto', '--b-bg': 'var(--ok)', '--b-fg': '#0b0918', '--b-bd': 'var(--ok)' }}
            onClick={accept}
          >
            <Ic.check /> Accept
          </button>
        )}
        {stage === 'done' && (
          <span className="pill ok" style={{ fontSize: 9.5, marginLeft: 'auto' }}>
            <span className="dot ok" /> written · audit row appended
          </span>
        )}
      </div>
      {open && (
        <div style={{
          marginTop: 8, padding: '8px 10px',
          background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 5,
          fontSize: 11.5, color: 'var(--fg-2)', lineHeight: 1.5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>
              writes to ▸ <span style={{ color: 'var(--acc-2)' }}>{fieldMeta?.table || field}</span>
            </span>
            <span className="pill ghost" style={{ fontSize: 9.5 }}>by {window.BWTL.ROLES[role]?.label || role}</span>
          </div>
          {promotable.preview}
        </div>
      )}
    </div>
  );
}

window.ChatDock = ChatDock;
