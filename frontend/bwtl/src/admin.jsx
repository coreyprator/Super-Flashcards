// ADMIN — PL-only surfaces: EFG editor link, RAG console, document import,
// batch ops, data health. Surfaces consolidated from /api/admin/* and
// /api/efg/backfill-* across SF, EFG, EM, RAG.

function AdminView({ role }) {
  const [tab, setTab] = React.useState('health');
  const isPL = role === 'pl';

  return (
    <div style={{ padding: '18px 20px 200px', maxWidth: 1500, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 20 }}>
        <div>
          <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Admin</h1>
          <p style={{ color: 'var(--fg-3)', margin: '4px 0 0', fontSize: 13 }}>
            Cross-app data ops, batch jobs, ingestion. PL-only surfaces are gated.
          </p>
        </div>
        <span className={`pill ${isPL ? 'accent' : 'err'}`}>
          {isPL ? <><Ic.shield /> PL · full admin</> : <><Ic.shield /> {role} · limited</>}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--line)' }}>
        {[
          ['health',  'Data health'],
          ['batch',   'Batch jobs'],
          ['import',  'Document import'],
          ['efg',     'EFG editor'],
          ['rag',     'RAG console'],
        ].map(([k, lab]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
            padding: '10px 14px', borderBottom: '2px solid ' + (tab === k ? 'var(--acc)' : 'transparent'),
            marginBottom: -1, color: tab === k ? 'var(--fg)' : 'var(--fg-3)',
            fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
          }}>{lab}</button>
        ))}
      </div>

      {tab === 'health' && <DataHealthTab />}
      {tab === 'batch'  && <BatchJobsTab />}
      {tab === 'import' && <DocumentImportTab />}
      {tab === 'efg'    && <EfgEditorTab isPL={isPL} />}
      {tab === 'rag'    && <RagConsoleTab isPL={isPL} />}
    </div>
  );
}

function DataHealthTab() {
  const [coverage, setCoverage] = React.useState(null);
  const [loadingCov, setLoadingCov] = React.useState(true);

  React.useEffect(() => {
    window.BWTL.getCoverage()
      .then(data => { setCoverage(data); setLoadingCov(false); })
      .catch(err => { console.error('[DataHealthTab] getCoverage error:', err); setLoadingCov(false); });
  }, []);

  const rows = coverage ? (coverage.coverage || []) : [];
  const totalCards = coverage ? (coverage.total_flashcards || 0) : 0;

  const pillFor = (s) => s === 'high' ? 'err' : s === 'med' ? 'warn' : s === 'low' ? 'ok' : 'ghost';

  if (loadingCov) return <div style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>Loading coverage data…</div>;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18 }}>
        <div className="card card-body" style={{ padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>SF Flashcards</div>
          <div className="display" style={{ fontSize: 30, color: 'var(--acc)', marginTop: 4, lineHeight: 1 }}>{(totalCards || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-head"><h3>Field coverage · live from /api/admin/coverage</h3></div>
        {!rows.length ? (
          <div className="coverage-empty" style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>No coverage data returned.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)' }}>
                {['Field','Fill %','Missing','Total'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const pct = Math.round(r.fill_pct || 0);
                return (
                  <tr key={r.field} style={{ borderTop: '1px solid var(--line-soft)' }}>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--fg-2)' }}>{r.field}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 5, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: pct + '%', height: '100%', background: pct >= 90 ? 'var(--ok)' : pct >= 70 ? 'var(--warn)' : 'var(--err)' }} />
                        </div>
                        <span className="mono cov-pct" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{(r.missing_rows || 0).toLocaleString()}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{(r.total_rows || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function BatchJobsTab() {
  const jobs = [
    { id: 'TSK-001', title: 'PIE IPA + audio backfill',        target: 'SF.flashcards.pie_audio_url',       rows: 2581, done: 1840, status: 'cc_executing', kicked: '5 days ago' },
    { id: 'TSK-008', title: '76 residual PIE mismatches',      target: 'SF.flashcards.pie_root',            rows: 76,   done: 12,   status: 'req_created',  kicked: '—' },
    { id: 'REQ-011', title: 'EFG PIE audio backfill',          target: 'EFG.nodes.pie_audio_url',           rows: 52,   done: 0,    status: 'cai_designing',kicked: '—' },
    { id: 'REQ-015', title: 'Cross-portfolio PIE audit',       target: 'SF.flashcards.efg_node_id + EFG.nodes.sf_url', rows: 877, done: 488, status: 'cc_executing', kicked: '3 days ago' },
    { id: 'EM-AUDIO', title: 'EM figure audio (ElevenLabs)',   target: 'EM.mythological_figures.pronunciation_audio_url', rows: 111, done: 72,  status: 'awaiting Theo approval', kicked: '2 days ago' },
    { id: 'EM-IPA',   title: 'EM figure IPA',                  target: 'EM.mythological_figures.ipa_transcription', rows: 113, done: 88, status: 'cc_executing', kicked: '1 day ago' },
    { id: 'REQ-008', title: 'etymology_layer write-back',      target: 'SF.flashcard_pie_roots.etymology_layer', rows: 2922, done: 0,   status: 'req_created — blocked on schema decision', kicked: '—' },
  ];
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {jobs.map(j => {
        const pct = Math.round((j.done / j.rows) * 100);
        return (
          <div key={j.id} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 220px 120px', gap: 14, alignItems: 'center' }}>
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
  );
}

function DocumentImportTab() {
  const runs = window.BWTL.DOCUMENT_RUNS;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <div className="card card-body" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}><Ic.upload /> Paste text</div>
          <textarea placeholder="Paste a Greek, French, or other passage…" style={{ width: '100%', height: 120, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 6, padding: 10, color: 'var(--fg)', font: 'inherit', fontSize: 13, resize: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button className="btn sm primary"><Ic.spark /> Extract vocab</button>
          </div>
        </div>
        <div className="card card-body" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}><Ic.upload /> Upload PDF</div>
          <div style={{
            border: '2px dashed var(--line)', borderRadius: 8,
            padding: 28, textAlign: 'center',
            background: 'var(--bg-1)',
            fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.5,
          }}>
            Drop a PDF or text file here<br/>
            <span style={{ color: 'var(--fg-4)', fontSize: 11 }}>POST /api/document/parse · uses Beekes RAG to grade vocabulary by frequency</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-head"><h3>Recent imports</h3></div>
        <div>
          {runs.map(r => {
            const pct = Math.round((r.approved / r.extracted) * 100);
            return (
              <div key={r.id} style={{ padding: '12px 16px', borderTop: '1px solid var(--line-soft)', display: 'grid', gridTemplateColumns: '20px 1fr 220px 120px 100px', gap: 14, alignItems: 'center' }}>
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
    </>
  );
}

function EfgEditorTab({ isPL }) {
  const stats = window.BWTL.EFG_STATS;
  if (!isPL) return <div style={{ padding: 30, color: 'var(--fg-3)', textAlign: 'center', fontSize: 13 }}>EFG node/edge editing is PL-only. Theodoros and tutors edit cards and figures instead.</div>;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <Stat lab="Nodes" v={stats.total_nodes} sub={`${stats.word_nodes} words · ${stats.pie_root_nodes} roots`} clr="var(--graph)" />
        <Stat lab="Edges" v={stats.total_edges} sub="2111 connections" clr="var(--graph)" />
        <Stat lab="SF-linked" v={stats.sf_linked} sub="word nodes with sf_url" clr="var(--ok)" />
        <Stat lab="Explorer data" v={stats.pie_explorer_data} sub={`${stats.pie_root_nodes - stats.pie_explorer_data} roots missing`} clr="var(--warn)" />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-head">
          <h3>Recent node operations</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn sm ghost"><Ic.plus /> POST /api/nodes</button>
            <button className="btn sm ghost"><Ic.link /> POST /api/edges</button>
            <a className="btn sm ghost" href="#" target="_blank"><Ic.link /> Open graph editor</a>
          </div>
        </div>
        <div>
          {[
            { id: 'word_mneme',   op: 'PATCH', field: 'sf_url',        old: 'NULL', new: 'learn.rentyourcio.com/?cardId=…', when: '1h ago', who: 'cai' },
            { id: 'pie_men',      op: 'PATCH', field: 'pie_audio_url', old: 'NULL', new: 'audio/pie/men.mp3', when: '3h ago', who: 'TSK-001' },
            { id: 'word_souvenir',op: 'POST',  field: '—',             old: '—',    new: '(created)',         when: 'yesterday', who: 'pl' },
            { id: 'edge_47',      op: 'DELETE',field: 'parent_of',     old: '(removed)', new: '—',            when: 'yesterday', who: 'pl' },
          ].map((r, i) => (
            <div key={i} style={{ padding: '10px 16px', borderTop: '1px solid var(--line-soft)', display: 'grid', gridTemplateColumns: '90px 200px 120px 1fr 100px 80px', gap: 12, alignItems: 'center', fontSize: 12 }}>
              <span className={`pill ${r.op === 'POST' ? 'ok' : r.op === 'PATCH' ? 'accent' : 'err'}`} style={{ fontSize: 9.5, width: 'fit-content' }}>{r.op}</span>
              <span className="mono" style={{ color: 'var(--fg)' }}>{r.id}</span>
              <span className="mono" style={{ color: 'var(--fg-3)' }}>{r.field}</span>
              <span style={{ color: 'var(--fg-2)' }}><span style={{ color: 'var(--fg-5)' }}>{r.old}</span> → <span style={{ color: 'var(--ok)' }}>{r.new}</span></span>
              <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{r.when}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{r.who}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function RagConsoleTab({ isPL }) {
  if (!isPL) return <div style={{ padding: 30, color: 'var(--fg-3)', textAlign: 'center', fontSize: 13 }}>RAG ingestion is PL-only.</div>;
  const colls = window.BWTL.RAG_COLLECTIONS;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        <Stat lab="Collections" v={colls.filter(c => c.status === 'healthy').length} sub={`+ ${colls.filter(c => c.status !== 'healthy').length} deprecated`} clr="var(--acc-2)" />
        <Stat lab="Total docs" v={colls.reduce((a, c) => a + c.docs, 0)} sub="across all collections" clr="var(--graph)" />
        <Stat lab="Last ingest" v="12m" sub="metapm · auto from GitHub" clr="var(--ok)" />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="card-head">
          <h3>Collections</h3>
          <button className="btn sm ghost"><Ic.refresh /> Reingest all</button>
        </div>
        <div>
          {colls.map(c => (
            <div key={c.name} style={{ padding: '12px 16px', borderTop: '1px solid var(--line-soft)', display: 'grid', gridTemplateColumns: '160px 100px 100px 1fr 120px 200px', gap: 14, alignItems: 'center', fontSize: 12.5, opacity: c.status === 'deprecated' ? 0.5 : 1 }}>
              <span className="mono" style={{ color: 'var(--acc-2)', fontWeight: 700 }}>{c.name}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{c.docs.toLocaleString()} docs</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{c.size}</span>
              <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{c.consumer}</span>
              <span className={`pill ${c.status === 'healthy' ? 'ok' : 'err'}`} style={{ fontSize: 9.5 }}>{c.status}</span>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11, color: 'var(--fg-4)' }}>{c.last_ingest}</span>
                {c.status === 'healthy' && <button className="btn xs ghost"><Ic.refresh /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-head"><h3>Test query</h3></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="*men- semantic search" style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--fg)', font: 'inherit', fontSize: 13 }} />
            <select style={{ padding: '8px 10px', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--fg)', font: 'inherit', fontSize: 12 }}>
              <option>etymology</option>
              <option>portfolio</option>
              <option>dcc</option>
              <option>metapm</option>
            </select>
            <button className="btn sm primary">Query</button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 6 }} className="mono">POST /query · /semantic · /mcp</div>
        </div>
      </div>
    </>
  );
}

function Stat({ lab, v, sub, clr }) {
  return (
    <div className="card card-body" style={{ padding: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{lab}</div>
      <div className="display" style={{ fontSize: 28, color: clr, marginTop: 4, lineHeight: 1 }}>{typeof v === 'number' ? v.toLocaleString() : v}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

window.AdminView = AdminView;
