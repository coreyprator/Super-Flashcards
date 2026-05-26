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

  const loadCards = React.useCallback(() => {
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

  React.useEffect(() => {
    loadCards();
    // BV-CROSS-LIBRARY-001: refresh when a new card is created
    window.addEventListener('bwtl:card-reload', loadCards);
    return () => window.removeEventListener('bwtl:card-reload', loadCards);
  }, [loadCards]);

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
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{r.pie_ipa}</span>
                {r.pie_audio_url && <button className="pie-audio" style={{ width: 22, height: 22 }} onClick={() => new Audio(r.pie_audio_url).play()}><Ic.play /></button>}
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
  const [iframeFig, setIframeFig] = React.useState(null); // BV-FIG-IFRAME-001: iFrame modal

  const _EM_URL = 'https://etymython.rentyourcio.com';

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
          <div key={f.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setIframeFig(f)}>
            <div style={{
              aspectRatio: '16/10',
              background: 'linear-gradient(135deg, var(--myth-bg), var(--bg-3))',
              borderBottom: '1px solid var(--line-soft)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {f.image_url
                ? <img src={f.image_url} alt={f.english_name || f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <span style={{ position: 'absolute', bottom: 6, left: 8, fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--fg-4)' }}>{(f.figure_type || '').toLowerCase()}</span>
              }
            </div>
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

      {/* BV-FIG-IFRAME-001: iFrame modal for Etymython figure page */}
      {iframeFig && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 998 }} onClick={() => setIframeFig(null)} />
          <dialog open style={{ position: 'fixed', inset: '5vh 5vw', width: '90vw', height: '90vh', margin: 0, padding: 0, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--line-soft)', gap: 8 }}>
              <span className="pill myth" style={{ fontSize: 10.5 }}>{iframeFig.english_name || iframeFig.name}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', flex: 1 }}>{_EM_URL}/figures/{iframeFig.id}</span>
              <button className="btn xs ghost" onClick={() => setIframeFig(null)}>✕ Close</button>
            </div>
            <iframe
              src={`${_EM_URL}/figures/${iframeFig.id}`}
              title={`Etymython · ${iframeFig.english_name}`}
              style={{ flex: 1, border: 'none', width: '100%' }}
            />
          </dialog>
        </>
      )}
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
  const [selectedEntry, setSelectedEntry] = React.useState(null); // REQ-031: DCC full content modal
  const [sortBy, setSortBy] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');
  const handleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  };

  React.useEffect(() => {
    setLoading(true);
    // BUG-055 fix: use _apiFetch instead of raw fetch()
    window.BWTL._apiFetch('/api/v1/dcc/list')
      .then(data => {
        const list = Array.isArray(data) ? data : (data.words || data.nodes || []);
        window.BWTL.DCC_WORDS = list;
        setWords(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = words.filter(w => !q || (w.label || w.word || '').includes(q) || (w.gloss || w.definition || '').toLowerCase().includes(q.toLowerCase()));
  const sorted = sortBy ? [...filtered].sort((a, b) => {
    const av = a[sortBy] ?? '';
    const bv = b[sortBy] ?? '';
    const r = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? r : -r;
  }) : filtered;

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
            {[['Rank','frequency_rank'],['Word','label'],['Gloss','gloss'],['POS','pos'],['PIE root','pie_root'],['Freq/10k','freq_per_10k'],['SF card','sf_linked']].map(([h, key]) => (
              <th key={h} onClick={() => handleSort(key)} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', cursor: 'pointer', userSelect: 'none' }}>{h}{sortBy === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((w, i) => (
            <tr key={w.id || w.rank || i} style={{ borderTop: '1px solid var(--line-soft)', cursor: 'pointer' }}
              onClick={() => setSelectedEntry(w)}>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--fg-4)' }}>{w.frequency_rank || w.rank || i+1}</td>
              <td style={{ padding: '8px 12px', maxWidth: 120 }} className="greek"><span style={{ fontSize: 15, fontWeight: 600, wordBreak: 'break-all', overflowWrap: 'anywhere', whiteSpace: 'normal', display: 'block' }}>{w.label || w.word}</span></td>
              <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--fg-2)', wordBreak: 'break-word', whiteSpace: 'normal' }}>{w.gloss || w.definition}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--fg-4)' }}>{w.pos || w.part_of_speech}</td>
              <td style={{ padding: '8px 12px' }}>{(w.pie_root || w.pie) && <span className="pill pie" style={{ fontSize: 9.5 }}>{w.pie_root || w.pie}</span>}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{w.freq_per_10k || w.frequency}</td>
              <td style={{ padding: '8px 12px' }}>{w.sf_linked ? <span className="pill ok" style={{ fontSize: 9.5 }}><span className="dot ok" />linked</span> : <button className="btn xs ghost" onClick={e => { e.stopPropagation(); }}>Create card</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* REQ-031: DCC full content modal */}
      {selectedEntry && (
        <dialog open style={{ position: 'fixed', inset: 0, zIndex: 999, width: '90vw', maxWidth: 600, margin: 'auto', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: 0, boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--line-soft)' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>DCC entry #{selectedEntry.frequency_rank || selectedEntry.rank}</span>
            <button className="btn xs ghost" onClick={() => setSelectedEntry(null)}>✕</button>
          </div>
          <div style={{ padding: 20 }}>
            <div className="greek" style={{ fontSize: 32, fontWeight: 600, marginBottom: 4 }}>{selectedEntry.label || selectedEntry.word}</div>
            <div style={{ fontSize: 14, color: 'var(--fg-2)', marginBottom: 16, lineHeight: 1.5 }}>{selectedEntry.gloss || selectedEntry.definition}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
              {[['Part of speech', selectedEntry.pos || selectedEntry.part_of_speech], ['PIE root', selectedEntry.pie_root || selectedEntry.pie], ['DCC rank', selectedEntry.frequency_rank || selectedEntry.rank], ['Freq/10k', selectedEntry.freq_per_10k || selectedEntry.frequency], ['Semantic group', selectedEntry.semantic_group || selectedEntry.category], ['Source', selectedEntry.source]].filter(([,v]) => v).map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-2)', padding: '8px 10px', borderRadius: 6 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 3 }}>{k}</div>
                  <div style={{ color: 'var(--fg)' }}>{String(v)}</div>
                </div>
              ))}
            </div>
            {selectedEntry.notes && <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.55 }}>{selectedEntry.notes}</div>}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              {selectedEntry.sf_card_id && <button className="btn sm primary" onClick={() => { setSelectedEntry(null); onNavigateWord(selectedEntry.sf_card_id); }}>Open SF card</button>}
              <button className="btn sm ghost" onClick={() => setSelectedEntry(null)}>Close</button>
            </div>
          </div>
        </dialog>
      )}
      {selectedEntry && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }} onClick={() => setSelectedEntry(null)} />}
    </>
  );
}

window.LibraryView = LibraryView;
