// BROWSE — unified browse for the five entity types (REV-3 rename from Library)
// REV-3: BrowseView replaces LibraryView; search for cards persists via cardFilter in App (BUG-059 resolved structurally).
// Tabs: Cards (SF) · PIE roots (EFG) · Figures (EM) · Beekes (RAG) · DCC

function BrowseView({ onOpenCard, onOpenFigure, role, browseTab, setBrowseTab, cardFilter, setCardFilter, spine }) {
  // localQ drives search for non-cards tabs (roots, figures, beekes, dcc)
  // Cards tab search is cardFilter.q managed by App state — persists across CardDetail nav (BUG-059 resolved)
  const [localQ, setLocalQ] = React.useState(window.BWTL._LIB_LOCAL_Q || '');
  const tab = browseTab || 'cards';
  const setTab = setBrowseTab || (() => {});
  const q = tab === 'cards' ? (cardFilter?.q || '') : localQ;

  const handleLocalQChange = (v) => {
    setLocalQ(v);
    window.BWTL._LIB_LOCAL_Q = v;
  };

  return (
    <div style={{ padding: '18px 20px 200px', maxWidth: 1640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 20 }}>
        <div>
          <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Browse</h1>
          <p style={{ color: 'var(--fg-3)', margin: '4px 0 0', fontSize: 13 }}>
            Every word, root, figure and source the app draws from — filter to your study set, open any card to study it.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {tab !== 'cards' && (
            <div className="search" style={{ maxWidth: 300 }}>
              <Ic.search />
              <input value={localQ} onChange={(e) => handleLocalQChange(e.target.value)} placeholder={`Search ${tab}…`} />
            </div>
          )}
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('bwtl:open-create'))}>
            <Ic.plus /> New
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--line)' }}>
        {[
          ['cards',   'Cards',     window.BWTL.FLASHCARDS && Object.keys(window.BWTL.FLASHCARDS).length, 'SF.flashcards'],
          ['roots',   'PIE roots', Object.keys(window.BWTL.PIE_ROOTS || {}).length,                       'EFG.nodes (pie_root)'],
          ['figures', 'Figures',   Object.keys(window.BWTL.FIGURES || {}).length,                         'EM.mythological_figures'],
          ['beekes',  'Beekes',    (window.BWTL.BEEKES_DOCS || []).length,                               'RAG · etymology collection'],
          ['dcc',     'DCC',       (window.BWTL.DCC_WORDS || []).length,                                 'EFG · DCC dataset'],
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
            {lab} <span className="mono" style={{ fontSize: 10, color: 'var(--fg-5)' }}>{n || ''}</span>
          </button>
        ))}
      </div>

      {tab === 'cards'   && <CardsTab cardFilter={cardFilter} setCardFilter={setCardFilter} spine={spine} onOpenCard={onOpenCard} />}
      {tab === 'roots'   && <RootsTab q={q} />}
      {tab === 'figures' && <FiguresTab q={q} onOpenFigure={onOpenFigure} />}
      {tab === 'beekes'  && <BeekesTab q={q} />}
      {tab === 'dcc'     && <DccTab q={q} onOpenCard={onOpenCard} />}
    </div>
  );
}

// REV-3 CardFilterBar — drives the browse grid AND the App-level cardSpine (prev/next in CardDetail)
function CardFilterBar({ cardFilter, setCardFilter, shown }) {
  const langs = window.BWTL.LANGUAGE_FILTERS || [{ code: null, name: 'All languages' }];
  const toggleChip = (c) => setCardFilter(f => ({
    ...f, chips: f.chips.includes(c) ? f.chips.filter(x => x !== c) : [...f.chips, c],
  }));
  const chipBtn = (key, label, icon) => (
    <button
      key={key}
      onClick={() => toggleChip(key)}
      className="btn xs ghost"
      style={{
        background: cardFilter.chips.includes(key) ? 'var(--acc-bg)' : 'transparent',
        borderColor: cardFilter.chips.includes(key) ? 'var(--acc-ring)' : 'var(--line)',
        color: cardFilter.chips.includes(key) ? 'var(--acc-2)' : 'var(--fg-3)',
        display: 'inline-flex', alignItems: 'center', gap: 5,
      }}
    >{icon} {label}</button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
        {chipBtn('bookmarked', 'Study set', <Ic.bookmark_filled style={{ color: cardFilter.chips.includes('bookmarked') ? 'var(--acc-2)' : 'var(--fg-4)', width: 13, height: 13 }} />)}
        {chipBtn('has_video', 'Has video', <Ic.play style={{ width: 13, height: 13 }} />)}
        {chipBtn('missing_data', 'Missing data', <Ic.spark style={{ width: 13, height: 13 }} />)}
        {/* REQ-008: filter by etymology_layer */}
        {chipBtn('has_ety_layer', 'Has layer', null)}
      </div>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-3)' }}>
        <Ic.globe />
        <select
          value={cardFilter.language || ''}
          onChange={(e) => setCardFilter(f => ({ ...f, language: e.target.value || null }))}
          style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--fg)', borderRadius: 6, padding: '5px 8px', font: 'inherit', fontSize: 12 }}
        >
          {langs.map(l => <option key={l.code || 'all'} value={l.code || ''}>{l.name}{l.count != null ? ` (${l.count})` : ''}</option>)}
        </select>
      </label>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-3)' }}>
        <span className="mono" style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-4)' }}>sort</span>
        <select
          value={cardFilter.sort}
          onChange={(e) => setCardFilter(f => ({ ...f, sort: e.target.value }))}
          style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--fg)', borderRadius: 6, padding: '5px 8px', font: 'inherit', fontSize: 12 }}
        >
          <option value="modified">Last modified</option>
          <option value="alpha">Alphabetical</option>
          <option value="srs">SRS due</option>
          <option value="freq">Frequency</option>
        </select>
      </label>
      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-4)' }} className="mono">
        {shown} shown{cardFilter.chips.includes('bookmarked') ? ' · study set' : ''}{cardFilter.language ? ' · filtered' : ''}
      </span>
      {/* REQ-041: reset filter button — visible only when any filter is active */}
      {(cardFilter.chips.length > 0 || cardFilter.language || cardFilter.sort !== 'modified') && (
        <button
          className="btn xs ghost"
          title="Reset all filters to defaults"
          onClick={() => setCardFilter(f => ({ ...f, chips: [], language: null, sort: 'modified' }))}
          style={{ fontSize: 11, color: 'var(--fg-3)' }}
        >↺ Reset filters</button>
      )}
    </div>
  );
}

// REQ-037: browse-thumb card grid
function CardsTab({ cardFilter, setCardFilter, spine, onOpenCard }) {
  const [loading, setLoading] = React.useState(!Object.keys(window.BWTL.FLASHCARDS || {}).length);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  // REQ-040: multi-select delete state
  const [selected, setSelected] = React.useState(new Set());
  const [deleting, setDeleting] = React.useState(false);

  const loadCards = React.useCallback(() => {
    setLoading(true);
    Promise.all([
      window.BWTL.fetchCards({ limit: 200 }),
      window.BWTL.fetchLanguages(),
      window.BWTL.getBookmarks('pl').catch(() => []),
    ]).then(([cardData, langData, bookmarkData]) => {
      const langMap = {};
      (Array.isArray(langData) ? langData : []).forEach(l => { langMap[l.id] = l.name; });
      const rawCards = Array.isArray(cardData) ? cardData : (cardData.items || []);
      // Build a set of bookmarked flashcard IDs
      const bookmarks = Array.isArray(bookmarkData) ? bookmarkData : (bookmarkData?.items || []);
      window.BWTL.BOOKMARKS = bookmarks;
      const bookmarkedIds = new Set(bookmarks.map(b => (b.flashcard_ref_id || '').toLowerCase()));
      rawCards.forEach(c => {
        if (!c.language && c.language_id) c.language = langMap[c.language_id] || null;
        c.bookmarked = bookmarkedIds.has((c.id || '').toLowerCase());
        window.BWTL.FLASHCARDS[c.id] = c; // update global cache for App's computeCardSpine
      });
      window.BWTL.LANGUAGES = Array.isArray(langData) ? langData : [];
      window.BWTL.LANGUAGE_FILTERS = [
        { code: null, name: 'All languages', count: rawCards.length },
        ...(Array.isArray(langData) ? langData.map(l => ({
          code: l.code || l.name,
          name: l.name,
          count: rawCards.filter(c => c.language === l.name).length,
        })) : []),
      ];
      forceUpdate();
      window.dispatchEvent(new CustomEvent('bwtl:flashcards-loaded'));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadCards();
    // BV-CROSS-LIBRARY-001: refresh when a new card is created
    window.addEventListener('bwtl:card-reload', loadCards);
    return () => window.removeEventListener('bwtl:card-reload', loadCards);
  }, [loadCards]);

  // Use App-computed spine if available; otherwise filter FLASHCARDS locally
  let cards;
  if (spine && spine.length > 0) {
    cards = spine.map(id => window.BWTL.FLASHCARDS[id]).filter(Boolean);
  } else {
    cards = Object.values(window.BWTL.FLASHCARDS || {});
    const langName = cardFilter.language
      ? (window.BWTL.LANGUAGE_FILTERS || []).find(l => l.code === cardFilter.language)?.name
      : null;
    if (langName) cards = cards.filter(c => c.language === langName);
    if (cardFilter.chips.includes('bookmarked')) cards = cards.filter(c => c.bookmarked);
    if (cardFilter.chips.includes('has_video')) cards = cards.filter(c => c.has_video);
    if (cardFilter.chips.includes('missing_data')) cards = cards.filter(c => !c.pie_root && !(c.pie_roots && c.pie_roots.length));
    // REQ-008: filter by etymology_layer presence
    if (cardFilter.chips.includes('has_ety_layer')) cards = cards.filter(c => !!c.etymology_layer);
    if (cardFilter.q) {
      const qLow = cardFilter.q.toLowerCase();
      cards = cards.filter(c => ((c.word_or_phrase || c.word || '') + ' ' + (c.definition || '')).toLowerCase().includes(qLow));
    }
    if (cardFilter.sort === 'alpha') cards.sort((a, b) => (a.word_or_phrase || a.word || '').localeCompare(b.word_or_phrase || b.word || ''));
  }

  if (loading && !cards.length) return <div style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>Loading cards…</div>;
  if (!loading && !cards.length) return (
    <div className="cards-empty" style={{ padding: '40px 0', textAlign: 'center', color: 'var(--fg-4)', fontSize: 13 }}>
      No cards match this filter.{cardFilter.chips.includes('bookmarked') ? ' Your study set is empty — bookmark cards to add them.' : ''}
    </div>
  );

  // REQ-040: bulk delete handler
  const handleDeleteSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} card${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map(id => window.BWTL.deleteCard(id).then(() => { delete window.BWTL.FLASHCARDS[id]; })));
      setSelected(new Set());
      forceUpdate();
    } catch (e) {
      window.alert(`Delete failed: ${e?.message || e}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <CardFilterBar cardFilter={cardFilter} setCardFilter={setCardFilter} shown={cards.length} />
      {/* REQ-040: action bar — visible when ≥1 card selected */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 12px', background: 'rgba(229,85,85,0.08)', border: '1px solid rgba(229,85,85,0.25)', borderRadius: 8 }}>
          <span style={{ fontSize: 12.5, color: 'var(--fg-2)', fontWeight: 600 }}>{selected.size} selected</span>
          <button className="btn xs ghost" onClick={() => setSelected(new Set())} style={{ fontSize: 11 }}>Clear selection</button>
          <button
            className="btn xs"
            onClick={handleDeleteSelected}
            disabled={deleting}
            style={{ marginLeft: 'auto', background: 'var(--danger, #e55)', color: '#fff', border: 0, fontSize: 11 }}
          >{deleting ? 'Deleting…' : `Delete selected (${selected.size})`}</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {cards.map(c => {
          const isFigure = !!c.figure_link;
          const noPie = !c.pie_root && !(c.pie_roots && c.pie_roots.length);
          const word = c.word_or_phrase || c.word;
          const isChecked = selected.has(c.id);
          return (
            <div key={c.id} className={`card browse-card${isChecked ? ' selected' : ''}`} style={{ position: 'relative' }}
              onClick={(e) => { if (e.target.closest('[data-select-check]')) return; onOpenCard(c.id); }}>
              {/* REQ-040: selection checkbox */}
              <div data-select-check style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}
                onClick={(e) => { e.stopPropagation(); setSelected(s => { const n = new Set(s); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; }); }}>
                <input type="checkbox" checked={isChecked} readOnly style={{ cursor: 'pointer', width: 15, height: 15, accentColor: 'var(--acc)' }} />
              </div>
              {/* REQ-037: thumbnail banner with word overlaid */}
              <div
                className={`browse-thumb${isFigure ? ' figure' : ''}${noPie ? ' no-pie' : ''}`}
                style={c.image_url ? { backgroundImage: `url(${c.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              >
                {c.image_caption && <span className="bt-cap">{c.image_caption}</span>}
                <div className="bt-corner">
                  {c.has_video && <span className="bt-badge video"><Ic.play /> video</span>}
                  {c.bookmarked && <span className="bt-badge star"><Ic.bookmark_filled /></span>}
                </div>
                <div className="bt-word">{word}</div>
              </div>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{c.language} · {c.pos}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{c.ipa_pronunciation || c.ipa}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--fg-2)', marginTop: 6, lineHeight: 1.45 }}>{c.definition}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {isFigure && <span className="pill myth" style={{ fontSize: 9.5 }}>figure</span>}
                  {(c.pie_roots && c.pie_roots.length > 1)
                    ? <span className="pill pie" style={{ fontSize: 9.5 }}>{c.pie_roots.length} roots</span>
                    : c.pie_root && <span className="pill pie" style={{ fontSize: 9.5 }}>{c.pie_root}</span>}
                  {noPie && <span className="pill warn" style={{ fontSize: 9.5 }}>no PIE</span>}
                  {(c.cognates || c.english_cognates) && <span className="pill ghost" style={{ fontSize: 9.5 }}>cog</span>}
                </div>
              </div>
            </div>
          );
        })}
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

function DccTab({ q, onOpenCard }) {
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
        // BUG-062: enrich sf_linked / sf_card_id from FLASHCARDS cache so the
        // "linked" pill and "Open SF card" button in the detail modal actually work.
        const fcMap = window.BWTL.FLASHCARDS || {};
        const greekNorm = (s) => s ? s.normalize('NFC').toLowerCase().trim() : '';
        const sfByGreek = {};
        Object.values(fcMap).forEach(c => {
          const w = (c.word_or_phrase || c.word || '').normalize('NFC').toLowerCase().trim();
          if (w) sfByGreek[w] = c.id;
        });
        list.forEach(w => {
          const label = greekNorm(w.label || w.word || '');
          const matchId = sfByGreek[label];
          if (matchId) { w.sf_linked = true; w.sf_card_id = matchId; }
          else { w.sf_linked = false; w.sf_card_id = null; }
        });
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
              {selectedEntry.sf_card_id && <button className="btn sm primary" onClick={() => { setSelectedEntry(null); onOpenCard(selectedEntry.sf_card_id); }}>Open SF card</button>}
              <button className="btn sm ghost" onClick={() => setSelectedEntry(null)}>Close</button>
            </div>
          </div>
        </dialog>
      )}
      {selectedEntry && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }} onClick={() => setSelectedEntry(null)} />}
    </>
  );
}

window.BrowseView = BrowseView;
window.LibraryView = BrowseView; // REV-3 back-compat alias
