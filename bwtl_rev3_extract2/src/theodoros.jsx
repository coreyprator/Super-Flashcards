// Chat index — top-nav surface, formerly "Theodoros review queue" (REV item 5).
//
// What it ISN'T anymore: a review queue with an approval gate. Every user
// accepts their own chat-promoted insights directly (REV item 4), so the
// queue concept is gone.
//
// What it IS: a cross-app index of all chat threads across cards, plus an
// audit log of every Accept action. Sub-tabs reflect the rename note from
// the revision request:
//   • Threads     — index of conversations (jump back to rabbit holes)
//   • Audit log   — chat_promotions rows (who/when/field/before/after)
//   • New cards   — formerly "Author"; create cards directly
//   • Batch jobs  — formerly "Batch"; deep-links to the admin batch tab
//
// Theodoros remains a *power user* via the permission matrix (can edit any
// card, run batch jobs, edit EFG nodes), not via UI access — those are
// permissions, not surface differences.

function TheodorosView({ onAccept, onReject, onNavigateWord }) {
  const [tab, setTab] = React.useState('threads');

  return (
    <div style={{ padding: '18px 20px 200px', maxWidth: 1500, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 20 }}>
        <div>
          <h1 className="display" style={{ fontSize: 34, margin: 0 }}>Chat</h1>
          <p style={{ color: 'var(--fg-3)', margin: '4px 0 0', fontSize: 13, maxWidth: '78ch' }}>
            Cross-app index of every chat thread across your cards. Use this to navigate back to rabbit holes you've started, audit what you've accepted into cards, or kick off a new card / batch job.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn sm ghost"><Ic.filter /> Filter</button>
          <button className="btn sm primary" onClick={() => window.dispatchEvent(new CustomEvent('bwtl:open-create'))}>
            <Ic.plus /> New card
          </button>
        </div>
      </div>

      <ChatStatRow />

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--line)' }}>
        {[
          ['threads',   'Threads',    Object.values(window.BWTL.CHAT_THREADS).reduce((a, x) => a + x.length, 0)],
          ['audit',     'Audit log',  window.BWTL.CHAT_PROMOTIONS.length],
          ['new_cards', 'New cards',  null],
          ['batch',     'Batch jobs', null],
        ].map(([k, lab, n]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
            padding: '10px 14px', borderBottom: '2px solid ' + (tab === k ? 'var(--acc)' : 'transparent'),
            marginBottom: -1, color: tab === k ? 'var(--fg)' : 'var(--fg-3)',
            fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 7,
          }}>
            {lab} {n != null && <span className="mono" style={{ fontSize: 10, color: 'var(--fg-5)' }}>{n}</span>}
          </button>
        ))}
      </div>

      {tab === 'threads'   && <ThreadsIndexTab onNavigateWord={onNavigateWord} />}
      {tab === 'audit'     && <AuditLogTab onNavigateWord={onNavigateWord} />}
      {tab === 'new_cards' && <NewCardsTab />}
      {tab === 'batch'     && <BatchJobsRedirectTab />}
    </div>
  );
}

function ChatStatRow() {
  const allThreads = Object.values(window.BWTL.CHAT_THREADS).flat();
  const promotions = window.BWTL.CHAT_PROMOTIONS;
  const cardsWithThreads = Object.keys(window.BWTL.CHAT_THREADS).length;
  const lastAccept = promotions[0]?.when || '—';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
      {[
        { lab: 'Threads · all cards',  n: allThreads.length, sub: `across ${cardsWithThreads} cards`, clr: 'var(--acc)' },
        { lab: 'Accepts · this week',  n: promotions.length, sub: `last: ${lastAccept}`, clr: 'var(--ok)' },
        { lab: 'Cards touched',        n: new Set(promotions.map(p => p.card)).size, sub: 'via chat-promoted writes', clr: 'var(--pie)' },
        { lab: 'AI batch jobs',        n: 7, sub: '— see Batch jobs tab', clr: 'var(--graph)' },
      ].map(s => (
        <div key={s.lab} className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{s.lab}</div>
          <div className="display" style={{ fontSize: 30, color: s.clr, marginTop: 4, lineHeight: 1 }}>{s.n}</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-4)', marginTop: 4 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── Threads · cross-app index ──────────────────────────────────────────────
function ThreadsIndexTab({ onNavigateWord }) {
  const grouped = window.BWTL.CHAT_THREADS;
  const cardIds = Object.keys(grouped);
  const [activeId, setActiveId] = React.useState(grouped[cardIds[0]]?.[0]?.id);

  // flat list with card metadata
  const flat = cardIds.flatMap(cid => grouped[cid].map(t => ({ ...t, card: window.BWTL.FLASHCARDS[cid] })));
  const active = flat.find(t => t.id === activeId) || flat[0];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16 }}>
      <div className="card" style={{ alignSelf: 'start', maxHeight: 700, display: 'flex', flexDirection: 'column' }}>
        <div className="card-head"><h3>All threads</h3>
          <span className="pill ghost" style={{ fontSize: 9.5 }}>by card · newest first</span>
        </div>
        <div style={{ overflowY: 'auto' }}>
          {cardIds.map(cid => {
            const c = window.BWTL.FLASHCARDS[cid];
            return (
              <div key={cid}>
                <div
                  onClick={() => onNavigateWord && onNavigateWord(cid)}
                  style={{
                    padding: '10px 14px',
                    borderTop: '1px solid var(--line-soft)',
                    background: 'var(--bg-2)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                  <span className="greek" style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{c.word}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{cid}</span>
                  <span className="pill ghost" style={{ fontSize: 9, marginLeft: 'auto' }}>{c.language}</span>
                  {c.pie_root && <span className="pill pie" style={{ fontSize: 9 }}>{c.pie_root}</span>}
                </div>
                {grouped[cid].map(t => (
                  <div
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    style={{
                      padding: '10px 14px 10px 22px',
                      borderTop: '1px solid var(--line-soft)',
                      cursor: 'pointer',
                      background: t.id === active?.id ? 'var(--bg-3)' : 'transparent',
                      borderLeft: t.id === active?.id ? '3px solid var(--acc)' : '3px solid transparent',
                    }}>
                    <div style={{ fontSize: 12.5, color: 'var(--fg)', fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--fg-4)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="mono">{t.when}</span>
                      <span>·</span>
                      <span>{t.messages.length} msg</span>
                      {t.context?.steering && <><span>·</span><span style={{ color: 'var(--acc-2)' }}>steered</span></>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        {active && <ThreadDetailView thread={active} onNavigateWord={onNavigateWord} />}
      </div>
    </div>
  );
}

function ThreadDetailView({ thread, onNavigateWord }) {
  const card = thread.card;
  return (
    <div className="card">
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 24, margin: 0, fontWeight: 500 }}>{thread.title}</h2>
          <span className="mono" style={{ color: 'var(--fg-4)', fontSize: 11 }}>{thread.id}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="pill accent" style={{ fontSize: 10 }}>
            <span className="mode-tag" style={{ background: 'rgba(0,0,0,.3)', padding: '1px 4px', borderRadius: 3, fontFamily: 'var(--ff-mono)', fontSize: 9 }}>card</span>
            <span style={{ marginLeft: 5 }} className="greek">{card.word}</span>
          </span>
          {card.pie_root && <span className="pill pie" style={{ fontSize: 10 }}>{card.pie_root}</span>}
          <span className="pill ghost" style={{ fontSize: 10 }}>{thread.messages.length} messages · last {thread.when}</span>
          <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => onNavigateWord && onNavigateWord(card.id)}>
            <Ic.chat /> Open in study
          </button>
        </div>
      </div>

      {thread.context && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--line-soft)', background: 'var(--bg-2)', fontSize: 12 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-4)', marginBottom: 5 }}>Context payload (editable in study view)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {thread.context.fields.map(f => (
              <span key={f} className="pill ghost" style={{ fontSize: 9.5, fontFamily: 'var(--ff-mono)' }}>{f}</span>
            ))}
            {thread.context.efg_node && <span className="pill graph" style={{ fontSize: 9.5 }}><Ic.graph /> efg · {thread.context.efg_node}</span>}
            {thread.context.figure && <span className="pill myth" style={{ fontSize: 9.5 }}>figure · {thread.context.figure}</span>}
          </div>
          {thread.context.steering && (
            <div style={{ color: 'var(--fg-2)', lineHeight: 1.5, paddingTop: 4 }}>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--fg-4)' }}>steering ▸ </span>
              "{thread.context.steering}"
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '14px 18px', display: 'grid', gap: 12 }}>
        {thread.messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="avt">{m.role === 'you' ? 'PL' : 'AI'}</div>
            <div className="bubble">
              <div>{m.text}</div>
              {m.promotable && (
                <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed var(--line)', fontSize: 11, color: 'var(--fg-3)' }}>
                  <Ic.spark style={{ color: 'var(--ok)', verticalAlign: '-2px' }} /> Accepted insight available on this turn — open in study to apply with field selector.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Audit log · chat_promotions table ──────────────────────────────────────
function AuditLogTab({ onNavigateWord }) {
  const rows = window.BWTL.CHAT_PROMOTIONS;
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="card-head">
        <h3>Chat promotions · audit log</h3>
        <span className="mono" style={{ color: 'var(--fg-4)', fontSize: 11 }}>
          chat_promotions <span style={{ color: 'var(--fg-5)' }}>· {rows.length} rows</span>
        </span>
      </div>
      <div style={{ padding: 14, borderBottom: '1px solid var(--line-soft)', fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.55, background: 'var(--bg-1)' }}>
        Every chat <Ic.check style={{ color: 'var(--ok)', verticalAlign: '-2px' }} /> Accept appends one row here. No approval gate, no second-party review — each user accepts their own promotions directly. Use this for traceability and rollback.
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr style={{ background: 'var(--bg-2)' }}>
            {['When','Who','Card','Field','Before → After','Source thread'].map(h => (
              <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const c = window.BWTL.FLASHCARDS[r.card];
            const role = window.BWTL.ROLES[r.who];
            return (
              <tr key={r.id} style={{ borderTop: '1px solid var(--line-soft)' }}>
                <td style={{ padding: '11px 12px', verticalAlign: 'top' }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{r.when}</span>
                </td>
                <td style={{ padding: '11px 12px', verticalAlign: 'top' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: 99,
                      background: role?.id === 'theo' ? 'linear-gradient(135deg, var(--myth), var(--forge))' : role?.id === 'tutor' ? 'linear-gradient(135deg, var(--acc), var(--graph))' : 'linear-gradient(135deg, var(--acc), var(--pie))',
                      display: 'grid', placeItems: 'center', fontSize: 8.5, color: '#0b0918', fontWeight: 800,
                    }}>{role?.initials}</span>
                    <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>{role?.label}</span>
                  </span>
                </td>
                <td style={{ padding: '11px 12px', verticalAlign: 'top' }}>
                  <a className="greek" onClick={() => onNavigateWord && onNavigateWord(r.card)} style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline dotted color-mix(in oklch, var(--acc) 60%, transparent)', textUnderlineOffset: 3 }}>
                    {c?.word || r.card}
                  </a>
                </td>
                <td style={{ padding: '11px 12px', verticalAlign: 'top' }}>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--acc-2)' }}>{r.field}</span>
                </td>
                <td style={{ padding: '11px 12px', verticalAlign: 'top', maxWidth: 520 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-4)', lineHeight: 1.5, marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: 9.5, color: 'var(--fg-5)' }}>before ▸ </span>
                    {r.before}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.5, padding: '4px 8px', background: 'color-mix(in oklch, var(--ok) 6%, var(--bg-1))', borderLeft: '2px solid var(--ok)', borderRadius: '0 4px 4px 0' }}>
                    <span className="mono" style={{ fontSize: 9.5, color: 'var(--ok)' }}>after ▸ </span>
                    {r.after}
                  </div>
                </td>
                <td style={{ padding: '11px 12px', verticalAlign: 'top' }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{r.thread_id}</span>
                  <div style={{ fontSize: 10, color: 'var(--fg-5)', marginTop: 2 }}>msg #{r.message_idx}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── New cards (formerly "Author") ──────────────────────────────────────────
function NewCardsTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div className="card card-body" style={{ padding: 18 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}>
          <Ic.plus /> Single card
        </div>
        <p style={{ color: 'var(--fg-2)', fontSize: 13, lineHeight: 1.55, marginTop: 0 }}>
          Type a word, pick a language, and let the AI fill etymology + cognates + fun facts + IPA + audio. Same flow as the top-bar New card button.
        </p>
        <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('bwtl:open-create'))}>
          <Ic.plus /> Open new-card sheet
        </button>
      </div>
      <div className="card card-body" style={{ padding: 18 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}>
          <Ic.upload /> From document
        </div>
        <p style={{ color: 'var(--fg-2)', fontSize: 13, lineHeight: 1.55, marginTop: 0 }}>
          Paste a Greek passage or upload a PDF — the document parser extracts vocabulary by frequency. Bulk-approve in one pass.
        </p>
        <button className="btn ghost"><Ic.upload /> Open document import →</button>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-5)', marginTop: 8 }}>routes to Admin · Document import</div>
      </div>

      <div className="card" style={{ padding: 0, gridColumn: '1 / -1' }}>
        <div className="card-head"><h3>Recent imports</h3></div>
        <div>
          {window.BWTL.DOCUMENT_RUNS.map(r => {
            const pct = Math.round((r.approved / r.extracted) * 100);
            return (
              <div key={r.id} style={{ padding: '11px 16px', borderTop: '1px solid var(--line-soft)', display: 'grid', gridTemplateColumns: '20px 1fr 240px 120px 100px', gap: 14, alignItems: 'center' }}>
                {r.kind === 'pdf' ? <Ic.doc /> : <Ic.edit />}
                <div>
                  <div style={{ fontSize: 13, color: 'var(--fg)' }}>{r.source}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--fg-4)', marginTop: 2 }}>{r.when}</div>
                </div>
                <div>
                  <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: pct + '%', height: '100%', background: pct === 100 ? 'var(--ok)' : 'var(--acc)' }} /></div>
                  <div style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 2 }}>{r.approved} / {r.extracted} approved</div>
                </div>
                <span className={`pill ${r.status === 'complete' ? 'ok' : r.status === 'partial' ? 'warn' : 'ghost'}`} style={{ fontSize: 9.5 }}>{r.status}</span>
                <button className="btn xs ghost">Review</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Batch jobs redirect (formerly "Batch") ─────────────────────────────────
function BatchJobsRedirectTab() {
  // Light wrapper around the same content the Admin · Batch tab shows.
  const jobs = [
    { id: 'TSK-001', title: 'PIE IPA + audio backfill',      target: 'SF.flashcards.pie_audio_url', rows: 2581, done: 1840, status: 'cc_executing' },
    { id: 'TSK-008', title: '76 residual PIE mismatches',    target: 'SF.flashcards.pie_root',      rows: 76,   done: 12,   status: 'req_created' },
    { id: 'REQ-011', title: 'EFG PIE audio backfill',        target: 'EFG.nodes.pie_audio_url',     rows: 52,   done: 0,    status: 'cai_designing' },
    { id: 'REQ-015', title: 'Cross-portfolio PIE audit',     target: 'SF.flashcards.efg_node_id',   rows: 877,  done: 488,  status: 'cc_executing' },
    { id: 'EM-AUDIO',title: 'EM figure audio (ElevenLabs)',  target: 'EM.figures.pronunciation_audio_url', rows: 111, done: 72, status: 'pl/theo approval gating retired — auto-applies' },
    { id: 'EM-IPA',  title: 'EM figure IPA',                 target: 'EM.figures.ipa_transcription',rows: 113,  done: 88,   status: 'cc_executing' },
    { id: 'REQ-008', title: 'etymology_layer write-back',    target: 'SF.flashcard_pie_roots.etymology_layer', rows: 2922, done: 0, status: 'req_created — blocked on schema' },
  ];
  return (
    <>
      <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--line-soft)', fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.55, marginBottom: 14 }}>
        Batch jobs run AI corrections across many cards at once. Per REV item 5 the queue-with-approval-gate is retired — batch results <strong style={{ color: 'var(--fg-2)' }}>auto-apply and append audit rows</strong>, so this view is a monitor, not a gate. PL-only triggers.
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {jobs.map(j => {
          const pct = Math.round((j.done / j.rows) * 100);
          return (
            <div key={j.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 220px 220px', gap: 14, alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--acc-2)', fontWeight: 700 }}>{j.id}</span>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 600 }}>{j.title}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', marginTop: 2 }}>{j.target}</div>
                </div>
                <div>
                  <div style={{ height: 5, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ width: pct + '%', height: '100%', background: pct >= 80 ? 'var(--ok)' : 'var(--acc)' }} />
                  </div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{j.done.toLocaleString()} / {j.rows.toLocaleString()} · {pct}%</div>
                </div>
                <span className="pill ghost" style={{ fontSize: 9.5, justifySelf: 'end' }}>{j.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

window.TheodorosView = TheodorosView;
