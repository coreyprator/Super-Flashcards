// LIBRARY — unified browse for the five entity types
// Tabs: Cards (SF) · PIE roots (EFG) · Figures (EM) · Beekes (RAG) · DCC

function LibraryView({ onNavigateWord, onOpenFigure, role }) {
  const [tab, setTab] = React.useState('cards');
  const [q, setQ] = React.useState('');
  const [langFilter, setLangFilter] = React.useState('all');

  return (
    <div style={{ padding: '18px 20px 200px', maxWidth: 1640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 20 }}>
        <div>
          <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Library</h1>
          <p style={{ color: 'var(--fg-3)', margin: '4px 0 0', fontSize: 13 }}>
            Browse the five datasets the unified app pulls from.
          </p>
        </div>
        <div className="search" style={{ maxWidth: 360 }}>
          <Ic.search />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${tab}…`} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--line)' }}>
        {[
          ['cards',   'Cards',     window.BWTL.FLASHCARDS && Object.keys(window.BWTL.FLASHCARDS).length, 'SF.flashcards'],
          ['roots',   'PIE roots', Object.keys(window.BWTL.PIE_ROOTS).length,                            'EFG.nodes (pie_root)'],
          ['figures', 'Figures',   Object.keys(window.BWTL.FIGURES).length,                              'EM.mythological_figures'],
          ['beekes',  'Beekes',    window.BWTL.BEEKES_DOCS.length,                                       'RAG · etymology collection'],
          ['dcc',     'DCC',       window.BWTL.DCC_WORDS.length,                                         'EFG · DCC dataset'],
        ].map(([k, lab, n, src]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
              padding: '10px 14px', borderBottom: '2px solid ' + (tab === k ? 'var(--acc)' : 'transparent'),
              marginBottom: -1, color: tab === k ? 'var(--fg)' : 'var(--fg-3)',
              fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 7,
            }}
            title={src}
          >
            {lab} <span className="mono" style={{ fontSize: 10, color: 'var(--fg-5)' }}>{n}</span>
          </button>
        ))}
      </div>

      {tab === 'cards'   && <CardsTab q={q} onNavigateWord={onNavigateWord} langFilter={langFilter} setLangFilter={setLangFilter} />}
      {tab === 'roots'   && <RootsTab q={q} />}
      {tab === 'figures' && <FiguresTab q={q} onOpenFigure={onOpenFigure} />}
      {tab === 'beekes'  && <BeekesTab q={q} />}
      {tab === 'dcc'     && <DccTab q={q} onNavigateWord={onNavigateWord} />}
    </div>
  );
}

function CardsTab({ q, onNavigateWord, langFilter, setLangFilter }) {
  const [cards, setCards] = React.useState(Object.values(window.BWTL.FLASHCARDS));
  const [langs, setLangs] = React.useState(window.BWTL.LANGUAGES || []);
  const [loading, setLoading] = React.useState(!cards.length);

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      window.BWTL.fetchCards({ limit: 200 }),
      window.BWTL.fetchLanguages(),
    ]).then(([cardData, langData]) => {
      const langMap = {};
      (Array.isArray(langData) ? langData : []).forEach(l => { langMap[l.id] = l.name; });
      const rawCards = Array.isArray(cardData) ? cardData : (cardData.items || []);
      rawCards.forEach(c => { if (!c.language && c.language_id) c.language = langMap[c.language_id] || null; });
      setCards(rawCards);
      setLangs(Array.isArray(langData) ? langData : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = cards.filter(c =>
    (langFilter === 'all' || c.language === langFilter) &&
    (!q || (c.word_or_phrase || c.word || '').toLowerCase().includes(q.toLowerCase()) || (c.definition || '').toLowerCase().includes(q.toLowerCase()))
  );

  if (loading) return <div style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>Loading cards…</div>;
  if (!cards.length) return <div className="cards-empty" style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>No cards in library yet.</div>;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <Ic.globe style={{ color: 'var(--fg-3)' }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Language</span>
        <div style={{ display: 'flex', gap: 3, padding: 3, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <button onClick={() => setLangFilter('all')} className="btn xs ghost" style={{ background: langFilter === 'all' ? 'var(--bg-4)' : 'transparent' }}>All <span className="mono" style={{ color: 'var(--fg-5)' }}>2936</span></button>
          {langs.map(l => (
            <button key={l.code || l.name} onClick={() => setLangFilter(l.name || l)} className="btn xs ghost"
              style={{ background: langFilter === (l.name || l) ? 'var(--bg-4)' : 'transparent' }}>
              {l.name || l}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-4)' }} className="mono">
          {filtered.length} shown · {cards.length} total
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {filtered.map(c => (
          <div key={c.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigateWord(c.id)}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{c.language} · {c.pos}</span>
              {c.bookmarked && <Ic.bookmark_filled style={{ color: 'var(--acc-2)' }} />}
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>{c.word_or_phrase || c.word}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{c.ipa_pronunciation}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 6, lineHeight: 1.4 }}>{c.definition}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {c.pie_root && <span className="pill pie" style={{ fontSize: 9.5 }}>{c.pie_root}</span>}
                {c.figure_link && <span className="pill myth" style={{ fontSize: 9.5 }}>figure</span>}
                {c.has_video && <span className="pill forge" style={{ fontSize: 9.5 }}>video</span>}
                {c.english_cognates && <span className="pill ghost" style={{ fontSize: 9.5 }}>cog</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function RootsTab({ q }) {
  const [roots, setRoots] = React.useState(Object.values(window.BWTL.PIE_ROOTS));
  const [loading, setLoading] = React.useState(!roots.length);

  React.useEffect(() => {
    setLoading(true);
    window.BWTL.fetchEfgRoots()
      .then(data => setRoots(Array.isArray(data) ? data : (data.roots || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = roots.filter(r => !q || (r.root || '').toLowerCase().includes(q.toLowerCase()) || (r.gloss || r.meaning || '').toLowerCase().includes(q.toLowerCase()));

  if (loading) return <div style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>Loading PIE roots…</div>;
  if (!roots.length) return <div className="roots-empty" style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>No PIE roots loaded. The EFG service may be offline.</div>;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="pill graph" style={{ fontSize: 10.5 }}>EFG · {roots.length} PIE root nodes</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-4)' }} className="mono">{filtered.length} shown</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
        {filtered.map((r, i) => (
          <div key={r.id || r.root || i} className="card">
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line-soft)' }}>
              <div className="display" style={{ fontSize: 22, color: 'var(--pie)' }}>{r.root || r.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{r.ipa}</span>
                {r.ipa && <button className="pie-audio" style={{ width: 22, height: 22 }}><Ic.play /></button>}
              </div>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>{r.gloss || r.meaning ? `"${r.gloss || r.meaning}"` : ''}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {r.word_count > 0 && <span className="pill ghost" style={{ fontSize: 9.5 }}>{r.word_count} cards</span>}
                {r.atomic && <span className="pill pie" style={{ fontSize: 9.5 }}>compound</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FiguresTab({ q, onOpenFigure }) {
  const [figs, setFigs] = React.useState(Object.values(window.BWTL.FIGURES));
  const [loading, setLoading] = React.useState(!figs.length);

  React.useEffect(() => {
    setLoading(true);
    window.BWTL.fetchFigures(100)
      .then(data => setFigs(Array.isArray(data) ? data : (data.items || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = figs.filter(f => !q || (f.english_name || '').toLowerCase().includes(q.toLowerCase()) || (f.greek_name || '').includes(q) || (f.latin_name || '').toLowerCase().includes(q.toLowerCase()));

  if (loading) return <div style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>Loading figures…</div>;
  if (!figs.length) return <div className="figures-empty" style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>No mythology figures loaded. The Etymython service may be offline.</div>;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="pill myth" style={{ fontSize: 10.5 }}>EM · {figs.length} figures</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-4)' }} className="mono">{filtered.length} shown</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
        {filtered.map(f => (
          <div key={f.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onOpenFigure(f.id)}>
            <div style={{
              aspectRatio: '16/10',
              background: 'linear-gradient(135deg, var(--myth-bg), var(--bg-3))',
              borderBottom: '1px solid var(--line-soft)',
              display: 'flex', alignItems: 'flex-end', padding: 8,
              fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--fg-4)',
            }}>{(f.figure_type || '').toLowerCase()}</div>
            <div style={{ padding: '10px 12px' }}>
              <div className="display" style={{ fontSize: 18, color: 'var(--myth)' }}>{f.english_name || f.name}</div>
              <div className="greek" style={{ fontSize: 13, color: 'var(--fg-2)' }}>{f.greek_name || f.latin_name}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 4 }}>{f.domain}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {f.figure_type && <span className="pill myth" style={{ fontSize: 9.5 }}>{f.figure_type}</span>}
                {f.pie_root && f.pie_root !== '?' && <span className="pill pie" style={{ fontSize: 9.5 }}>{f.pie_root}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function BeekesTab({ q }) {
  const [docs, setDocs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const lastQ = React.useRef('');

  React.useEffect(() => {
    const term = q || '*';
    if (term === lastQ.current) return;
    lastQ.current = term;
    setLoading(true);
    window.BWTL.searchRag(term, 'etymology')
      .then(data => {
        const items = Array.isArray(data) ? data : (data.results || data.items || []);
        setDocs(items.map((d, i) => ({
          id: d.id || i,
          headword: d.word || d.title || d.headword || term,
          excerpt: d.text || d.content || d.excerpt || '',
          source: d.source || 'etymology',
          confidence: (d.score || 0) > 0.8 ? 'high' : 'medium',
          page: d.page || '',
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q]);

  if (loading) return <div style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>Searching Beekes entries…</div>;
  if (!docs.length) return (
    <div className="beekes-empty" style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>
      Type a root or word in the search bar above to browse Beekes dictionary entries.
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="pill accent" style={{ fontSize: 10.5 }}>Portfolio RAG · etymology collection</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-4)' }} className="mono">{docs.length} results</span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {docs.map(d => (
          <div key={d.id} className="card">
            <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 14, alignItems: 'baseline' }}>
              <div>
                <div className="display" style={{ fontSize: 18, color: 'var(--acc-2)' }}>{d.headword}</div>
                {d.page && <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', marginTop: 2 }}>Beekes p.{d.page}</div>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>{d.excerpt}</div>
              <button className="btn xs ghost"><Ic.book /> Read full</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function DccTab({ q, onNavigateWord }) {
  const [words, setWords] = React.useState(window.BWTL.DCC_WORDS || []);
  const [loading, setLoading] = React.useState(!words.length);

  React.useEffect(() => {
    setLoading(true);
    fetch('/api/v1/dcc/list')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : (data.words || data.nodes || []);
        window.BWTL.DCC_WORDS = list;
        setWords(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = words.filter(w => !q || (w.label || w.word || '').includes(q) || (w.gloss || w.definition || '').toLowerCase().includes(q.toLowerCase()));

  if (loading) return <div style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>Loading DCC word list…</div>;
  if (!words.length) return <div className="dcc-empty" style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>DCC word list unavailable. EFG service may be offline.</div>;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="pill graph" style={{ fontSize: 10.5 }}>DCC · Greek core vocabulary</span>
        <span className="pill ghost" style={{ fontSize: 10.5 }}>{words.length} entries · ranked by frequency</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-4)' }} className="mono">showing {filtered.length}</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: 'var(--bg-2)' }}>
            {['Rank','Word','Gloss','POS','PIE root','Freq/10k','SF card'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((w, i) => (
            <tr key={w.id || w.rank || i} style={{ borderTop: '1px solid var(--line-soft)' }}>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--fg-4)' }}>{w.frequency_rank || w.rank || i+1}</td>
              <td style={{ padding: '8px 12px' }} className="greek"><span style={{ fontSize: 15, fontWeight: 600 }}>{w.label || w.word}</span></td>
              <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--fg-2)' }}>{w.gloss || w.definition}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--fg-4)' }}>{w.pos || w.part_of_speech}</td>
              <td style={{ padding: '8px 12px' }}>{(w.pie_root || w.pie) && <span className="pill pie" style={{ fontSize: 9.5 }}>{w.pie_root || w.pie}</span>}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{w.freq_per_10k || w.frequency}</td>
              <td style={{ padding: '8px 12px' }}>{w.sf_linked ? <span className="pill ok" style={{ fontSize: 9.5 }}><span className="dot ok" />linked</span> : <button className="btn xs ghost">Create card</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

window.LibraryView = LibraryView;
