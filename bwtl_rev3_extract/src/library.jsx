// BROWSE — unified browse for the five entity types (REV-3, was "Library")
// Tabs: Cards (SF) · PIE roots (EFG) · Figures (EM) · Beekes (RAG) · DCC
// The Cards tab is the home surface; opening a card enters the detail view.
// Study is now a filter (Bookmarked = study set); Bookmarks folded in per tab.

function BrowseView({ onOpenCard, onOpenFigure, role, browseTab, setBrowseTab, cardFilter, setCardFilter, spine }) {
  const tab = browseTab, setTab = setBrowseTab;
  const [localQ, setLocalQ] = React.useState('');
  const q = tab === 'cards' ? cardFilter.q : localQ;
  const setQ = tab === 'cards' ? (v) => setCardFilter(f => ({ ...f, q: v })) : setLocalQ;

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
          <div className="search" style={{ maxWidth: 300 }}>
            <Ic.search />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${tab}…`} />
          </div>
          <button className="btn primary" onClick={() => window.dispatchEvent(new CustomEvent('bwtl:open-create'))}>
            <Ic.plus /> New
          </button>
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

      {tab === 'cards'   && <CardsTab cardFilter={cardFilter} setCardFilter={setCardFilter} spine={spine} onOpenCard={onOpenCard} />}
      {tab === 'roots'   && <RootsTab q={q} />}
      {tab === 'figures' && <FiguresTab q={q} onOpenFigure={onOpenFigure} />}
      {tab === 'beekes'  && <BeekesTab q={q} />}
      {tab === 'dcc'     && <DccTab q={q} onNavigateWord={onOpenCard} />}
    </div>
  );
}

// REV-3 — filter + sort bar. Drives the grid AND the detail prev/next spine
// (the App computes the same spine from cardFilter).
function CardFilterBar({ cardFilter, setCardFilter, shown }) {
  const langs = window.BWTL.LANGUAGE_FILTERS;
  const toggleChip = (c) => setCardFilter(f => ({
    ...f, chips: f.chips.includes(c) ? f.chips.filter(x => x !== c) : [...f.chips, c],
  }));
  const chip = (key, label, icon) => (
    <button
      key={key}
      onClick={() => toggleChip(key)}
      className="btn xs ghost"
      style={{
        background: cardFilter.chips.includes(key) ? 'var(--acc-bg)' : 'transparent',
        borderColor: cardFilter.chips.includes(key) ? 'var(--acc-ring)' : 'var(--line)',
        color: cardFilter.chips.includes(key) ? 'var(--acc-2)' : 'var(--fg-3)',
      }}
    >{icon} {label}</button>
  );
  const curLang = langs.find(l => l.code === cardFilter.language) || langs[0];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
      {/* filter chips */}
      <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
        {chip('bookmarked', 'Study set', <Ic.bookmark_filled style={{ color: cardFilter.chips.includes('bookmarked') ? 'var(--acc-2)' : 'var(--fg-4)' }} />)}
        {chip('has_video', 'Has video', <Ic.film />)}
        {chip('missing_data', 'Missing data', <Ic.spark />)}
      </div>

      {/* language dropdown */}
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

      {/* sort dropdown */}
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
        {shown} shown{cardFilter.chips.includes('bookmarked') ? ' · study set' : ''}{cardFilter.language ? ` · ${curLang.name}` : ''} · sorted {cardFilter.sort === 'modified' ? 'by last modified' : cardFilter.sort === 'alpha' ? 'A→Z' : cardFilter.sort}
      </span>
    </div>
  );
}

function CardsTab({ cardFilter, setCardFilter, spine, onOpenCard }) {
  // The grid renders exactly the App-computed spine, so grid order == nav order.
  const cards = spine.map(id => window.BWTL.FLASHCARDS[id]).filter(Boolean);

  return (
    <>
      <CardFilterBar cardFilter={cardFilter} setCardFilter={setCardFilter} shown={cards.length} />
      {cards.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--fg-4)', fontSize: 13 }}>
          No cards match this filter. {cardFilter.chips.includes('bookmarked') && 'Your study set is empty — bookmark cards to add them.'}
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {cards.map(c => {
          const isFigure = !!c.figure_link;
          const noPie = !c.pie_root && !(c.pie_roots && c.pie_roots.length);
          return (
            <div key={c.id} className="card browse-card" onClick={() => onOpenCard(c.id)}>
              {/* REV-3 — thumbnail banner with word overlaid, flashcard-style */}
              <div className={`browse-thumb ${isFigure ? 'figure' : ''} ${noPie ? 'no-pie' : ''}`}>
                <span className="bt-cap">{c.image_caption}</span>
                <div className="bt-corner">
                  {c.has_video && <span className="bt-badge video"><Ic.play /> video</span>}
                  {c.bookmarked && <span className="bt-badge star"><Ic.bookmark_filled /></span>}
                </div>
                <div className="bt-word greek">{c.word}</div>
              </div>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{c.language} · {c.pos}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{c.ipa}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--fg-2)', marginTop: 6, lineHeight: 1.45 }}>{c.definition}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {isFigure && <span className="pill myth" style={{ fontSize: 9.5 }}>figure</span>}
                  {(c.pie_roots && c.pie_roots.length > 1)
                    ? <span className="pill pie" style={{ fontSize: 9.5 }}>{c.pie_roots.length} roots</span>
                    : c.pie_root && <span className="pill pie" style={{ fontSize: 9.5 }}>{c.pie_root}</span>}
                  {noPie && <span className="pill warn" style={{ fontSize: 9.5 }}>no PIE</span>}
                  {c.cognates && c.cognates.length > 0 && <span className="pill ghost" style={{ fontSize: 9.5 }}>{c.cognates.length} cog</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </>
  );
}

function RootsTab({ q }) {
  const roots = Object.entries(window.BWTL.PIE_ROOTS);
  const filtered = roots.filter(([k, r]) => !q || r.root.toLowerCase().includes(q.toLowerCase()) || r.gloss.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="pill graph" style={{ fontSize: 10.5 }}>EFG · 1057 PIE root nodes</span>
        <span className="pill ok" style={{ fontSize: 10.5 }}><span className="dot ok" /> 992 with explorer data (94%)</span>
        <span className="pill warn" style={{ fontSize: 10.5 }}>65 missing</span>
        <span className="pill warn" style={{ fontSize: 10.5 }}>52 missing IPA/audio · REQ-011</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-4)' }} className="mono">{filtered.length} shown</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
        {filtered.map(([k, r]) => (
          <div key={k} className="card">
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line-soft)' }}>
              <div className="display" style={{ fontSize: 22, color: 'var(--pie)' }}>{r.root}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{r.ipa}</span>
                <button className="pie-audio" style={{ width: 22, height: 22 }}><Ic.play /></button>
              </div>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>"{r.gloss}"</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <span className="pill ghost" style={{ fontSize: 9.5 }}>{r.word_count} cards</span>
                {r.atomic && <span className="pill pie" style={{ fontSize: 9.5 }}>compound</span>}
                <span className="pill ok" style={{ fontSize: 9.5 }}><span className="dot ok" /> explorer data</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 8, lineHeight: 1.45 }}>
                {r.modern_cognates.slice(0, 120)}…
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FiguresTab({ q, onOpenFigure }) {
  const figs = Object.values(window.BWTL.FIGURES);
  // Pad list with mock additional figures for density
  const allFigs = [
    ...figs.map(f => ({ ...f })),
    { id: 'zeus',     english_name: 'Zeus',     greek_name: 'Ζεύς',     figure_type: 'Olympian',  domain: 'sky, thunder, kingship', pie_root: '*dyḗws-', ipa: '/zjuːs/' },
    { id: 'hera',     english_name: 'Hera',     greek_name: 'Ἥρα',      figure_type: 'Olympian',  domain: 'marriage, women, sky',   pie_root: '*yeh₁-',  ipa: '/ˈhɛr.ə/' },
    { id: 'apollon',  english_name: 'Apollon',  greek_name: 'Ἀπόλλων',  figure_type: 'Olympian',  domain: 'music, prophecy, light', pie_root: '?',       ipa: '/əˈpɒl.oʊ/', missing_audio: true },
    { id: 'athena',   english_name: 'Athena',   greek_name: 'Ἀθηνᾶ',    figure_type: 'Olympian',  domain: 'wisdom, war, craft',     pie_root: '?',       ipa: '/əˈθiː.nə/' },
    { id: 'lethe',    english_name: 'Lethe',    greek_name: 'Λήθη',     figure_type: 'Primordial',domain: 'forgetfulness, underworld river', pie_root: '*leh₂dʰ-', ipa: '/ˈliː.θi/' },
    { id: 'gaia',     english_name: 'Gaia',     greek_name: 'Γαῖα',     figure_type: 'Primordial',domain: 'earth, mother',          pie_root: '?',       ipa: '/ˈɡaɪ.ə/' },
  ];
  const filtered = allFigs.filter(f => !q || f.english_name.toLowerCase().includes(q.toLowerCase()) || f.greek_name.includes(q));
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="pill myth" style={{ fontSize: 10.5 }}>EM · 183 figures</span>
        <span className="pill warn" style={{ fontSize: 10.5 }}>113 missing IPA · 111 missing audio</span>
        <span className="pill ok" style={{ fontSize: 10.5 }}>173 with origin_story (95%)</span>
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
            }}>{f.figure_type.toLowerCase()}</div>
            <div style={{ padding: '10px 12px' }}>
              <div className="display" style={{ fontSize: 18, color: 'var(--myth)' }}>{f.english_name}</div>
              <div className="greek" style={{ fontSize: 13, color: 'var(--fg-2)' }}>{f.greek_name}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 4 }}>{f.domain}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <span className="pill myth" style={{ fontSize: 9.5 }}>{f.figure_type}</span>
                {f.pie_root && f.pie_root !== '?' && <span className="pill pie" style={{ fontSize: 9.5 }}>{f.pie_root}</span>}
                {f.missing_audio && <span className="pill warn" style={{ fontSize: 9.5 }}>no audio</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function BeekesTab({ q }) {
  const docs = window.BWTL.BEEKES_DOCS;
  const filtered = docs.filter(d => !q || d.headword.toLowerCase().includes(q.toLowerCase()) || d.excerpt.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="pill accent" style={{ fontSize: 10.5 }}>Portfolio RAG · etymology collection · 1840 docs</span>
        <span className="pill ghost" style={{ fontSize: 10.5 }}>queried via /search /semantic /query</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-4)' }} className="mono">{filtered.length} shown</span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map(d => (
          <div key={d.id} className="card">
            <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 14, alignItems: 'baseline' }}>
              <div>
                <div className="display" style={{ fontSize: 18, color: 'var(--acc-2)' }}>{d.headword}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', marginTop: 2 }}>Beekes p.{d.page}</div>
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
  const words = window.BWTL.DCC_WORDS;
  const filtered = words.filter(w => !q || w.word.includes(q) || w.gloss.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="pill graph" style={{ fontSize: 10.5 }}>DCC · Greek core vocabulary</span>
        <span className="pill ghost" style={{ fontSize: 10.5 }}>2086 entries · ranked by frequency</span>
        <span className="pill ghost" style={{ fontSize: 10.5 }}>enriched via SF dcc.py + RAG</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-4)' }} className="mono">showing {filtered.length} of 2086</span>
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
          {filtered.map(w => (
            <tr key={w.rank} style={{ borderTop: '1px solid var(--line-soft)' }}>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--fg-4)' }}>{w.rank}</td>
              <td style={{ padding: '8px 12px' }} className="greek"><span style={{ fontSize: 15, fontWeight: 600 }}>{w.word}</span></td>
              <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--fg-2)' }}>{w.gloss}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--fg-4)' }}>{w.pos}</td>
              <td style={{ padding: '8px 12px' }}>{w.pie_root && <span className="pill pie" style={{ fontSize: 9.5 }}>{w.pie_root}</span>}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{w.freq_per_10k}</td>
              <td style={{ padding: '8px 12px' }}>{w.sf_linked ? <span className="pill ok" style={{ fontSize: 9.5 }}><span className="dot ok" />linked</span> : <button className="btn xs ghost">Create card</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

window.BrowseView = BrowseView;
window.LibraryView = BrowseView; // back-compat alias
