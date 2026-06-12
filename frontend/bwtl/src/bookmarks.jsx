// Bookmark surface — collection of cross-app primitives.
//
// Same primitive (BWTL.BOOKMARKS) used by PL (word-in-study), Theodoros
// (teaching examples), tutors (lesson sequences). Differentiation is
// purely contextual labels + share/audience controls.

function BookmarksView({ go, onOpenCard, onOpenFigure }) {
  const [filter, setFilter] = React.useState('all');
  const [bms, setBms] = React.useState(window.BWTL.BOOKMARKS || []);
  const [loading, setLoading] = React.useState(!bms.length);

  React.useEffect(() => {
    setLoading(true);
    window.BWTL.getBookmarks('pl')
      .then(data => setBms(Array.isArray(data) ? data : (data.items || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? bms : bms.filter(b => b.kind === filter);

  const groups = React.useMemo(() => {
    const g = {};
    filtered.forEach(b => {
      const key = b.when || (b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) : 'Saved');
      (g[key] = g[key] || []).push(b);
    });
    return g;
  }, [filtered]);

  const kindColor = (k) => ({
    word: 'var(--acc)',
    pie_root: 'var(--pie)',
    figure: 'var(--myth)',
    thread: 'var(--graph)',
    collection: 'var(--forge)',
  }[k] || 'var(--fg-3)');

  const kindLabel = (k) => ({
    word: 'WORD',
    pie_root: 'PIE',
    figure: 'EM',
    thread: 'CHAT',
    collection: 'CLS',
  }[k] || k);

  if (loading) return <div style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>Loading bookmarks…</div>;
  if (!bms.length) return (
    <div style={{ padding: '18px 20px 200px', maxWidth: 1500, margin: '0 auto' }}>
      <h1 className="display" style={{ fontSize: 34, margin: 0 }}>Bookmarks</h1>
      <div className="bm-empty" style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14, marginTop: 24 }}>No bookmarks yet. Tap a card’s bookmark button to save it here.</div>
    </div>
  );

  return (
    <div style={{ padding: '18px 20px 200px', maxWidth: 1500, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, gap: 20 }}>
        <div>
          <h1 className="display" style={{ fontSize: 34, margin: 0 }}>Bookmarks</h1>
          <p style={{ color: 'var(--fg-3)', margin: '4px 0 0', fontSize: 13, maxWidth: 70 + 'ch' }}>
            One primitive — words, PIE roots, figures, chat threads, and lesson collections all live here. Bookmark a word and its PIE root and the linked figure together in one click; collections share to Theodoros.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, padding: 4, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10, width: 'fit-content' }}>
        {[
          ['all', 'All', bms.length],
          ['word', 'Words', bms.filter(b => b.kind === 'word').length],
          ['pie_root', 'PIE roots', bms.filter(b => b.kind === 'pie_root').length],
          ['figure', 'Figures', bms.filter(b => b.kind === 'figure').length],
          ['thread', 'Threads', bms.filter(b => b.kind === 'thread').length],
          ['collection', 'Collections', bms.filter(b => b.kind === 'collection').length],
        ].map(([k, lab, n]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className="btn xs ghost"
            style={{
              background: filter === k ? 'var(--bg-4)' : 'transparent',
              color: filter === k ? 'var(--fg)' : 'var(--fg-3)',
              fontSize: 12,
              padding: '5px 10px',
            }}
          >
            {lab} <span className="mono" style={{ color: 'var(--fg-5)' }}>{n}</span>
          </button>
        ))}
      </div>

      {Object.entries(groups).map(([when, items]) => (
        <div key={when} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}>{when}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {items.map(b => (
              <div key={b.id} className="card" style={{ padding: 0 }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', color: kindColor(b.kind) }}>{kindLabel(b.kind)}</span>
                  <button style={{ background: 'transparent', border: 0, color: 'var(--fg-3)', cursor: 'pointer' }} title="More"><Ic.more /></button>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: b.kind === 'pie_root' ? 'var(--ff-display)' : 'var(--ff-sans)', fontSize: b.kind === 'pie_root' ? 22 : 17, fontWeight: 600, color: 'var(--fg)' }}>
                    {/* BUG-060: use FLASHCARDS cache as fallback to prevent ghost rows showing only UUID */}
                    {b.label || b.ref_label || (b.flashcard_ref_id && (window.BWTL.FLASHCARDS[b.flashcard_ref_id]?.word_or_phrase || window.BWTL.FLASHCARDS[b.flashcard_ref_id]?.word)) || b.flashcard_ref_id}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>{b.meta || b.kind}</div>
                </div>
                <div style={{ padding: '8px 14px', borderTop: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button className="btn xs ghost"><Ic.chat /></button>
                  <button className="btn xs ghost"><Ic.link /></button>
                  <button className="btn xs ghost" style={{ marginLeft: 'auto' }} onClick={() => {
                    if (b.kind === 'figure' && onOpenFigure) onOpenFigure(b.flashcard_ref_id);
                    else if (b.flashcard_ref_id && onOpenCard) onOpenCard(b.flashcard_ref_id);
                  }}>Open <Ic.chevron_r /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

window.BookmarksView = BookmarksView;
