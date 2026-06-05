// The unified workspace — the front door.
//
// Layout: center column (the word card with cross-app drill-down links)
//         + right rail (stacked panels) + chat dock at bottom.
//
// All cross-app drill-downs are <a className="xlink xxx"> with a class hinting
// at the destination color (pie/myth/graph/forge). Clicking one:
//   1. opens / un-collapses the matching panel
//   2. briefly glows that panel
//   3. updates the chat anchor if relevant

function Workspace({
  cardId,
  role,
  onNavigateWord,
  onNavByDelta,
  onOpenFigure,
  panelState,
  setPanelState,
  glowedPanel,
  triggerGlow,
  expandedChat,
  setExpandedChat,
  activeThreadId,
  setActiveThreadId,
  onPromote,
  onCardDeleted,
}) {
  const [card, setCard] = React.useState(window.BWTL.FLASHCARDS[cardId] || null);
  // loadingCard is only true when we have a real cardId to fetch
  const [loadingCard, setLoadingCard] = React.useState(!!cardId && !card);
  const [threads, setThreads] = React.useState([]);
  const [imgModalSrc, setImgModalSrc] = React.useState(null); // REQ-029: image iframe modal

  React.useEffect(() => {
    if (!cardId) return;
    setLoadingCard(true);
    window.BWTL.fetchCard(cardId)
      .then(c => { setCard(c); setLoadingCard(false); })
      .catch(err => { console.error('[Workspace] fetchCard error:', err); setLoadingCard(false); });
  }, [cardId]);

  React.useEffect(() => {
    if (!cardId) return;
    window.BWTL.getThreads({ anchor_value: cardId })
      .then(data => setThreads(Array.isArray(data) ? data : (data.items || [])))
      .catch(() => setThreads([]));
  }, [cardId]);

  if (loadingCard) return (
    <div className="ws-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--fg-3)', fontSize: 14 }}>
      Loading card…
    </div>
  );
  if (!card) return (
    <div className="ws-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--fg-3)', fontSize: 14 }}>
      No card loaded. Select a card from the Library to begin.
    </div>
  );

  const pieRootKey = card.pie_root;
  // Option B (BWTL05): read actual DB column names — no BE transformation layer
  const figureId = card.figure_link;

  // ── handle: cross-app link clicks ────────────────────────────────────────
  const drillToPie = (rootKey) => {
    // For now panels follow the current card's root. Future: support
    // alternate roots (e.g. drilling into an atomic component).
    setPanelState((p) => ({ ...p, pie: 'open' }));
    triggerGlow('pie');
  };
  const drillToFigure = (id) => {
    onOpenFigure?.(id);
    setPanelState((p) => ({ ...p, myth: 'open' }));
    triggerGlow('myth');
  };
  const drillToGraph = () => {
    setPanelState((p) => ({ ...p, graph: 'open' }));
    triggerGlow('graph');
  };
  const drillToForge = () => {
    setPanelState((p) => ({ ...p, forge: 'open' }));
    triggerGlow('forge');
  };
  const drillToRag = () => {
    setPanelState((p) => ({ ...p, rag: 'open' }));
    triggerGlow('rag');
  };

  // ── handle: action buttons ────────────────────────────────────────────────
  const handleBookmark = () => {
    const wasBookmarked = card.bookmarked;
    setCard((c) => ({ ...c, bookmarked: !wasBookmarked }));
    // Sync bookmark flag in global FLASHCARDS cache so Browse "Study set" chip filter sees it
    if (window.BWTL.FLASHCARDS[card.id]) window.BWTL.FLASHCARDS[card.id].bookmarked = !wasBookmarked;
    if (wasBookmarked) {
      // find bookmark id in cache and delete (BUG-053 fix: match on flashcard_ref_id)
      const bm = (window.BWTL.BOOKMARKS || []).find(b => b.flashcard_ref_id === card.id);
      if (bm) window.BWTL.deleteBookmark(bm.id).catch(() => {
        setCard((c) => ({ ...c, bookmarked: true }));
        if (window.BWTL.FLASHCARDS[card.id]) window.BWTL.FLASHCARDS[card.id].bookmarked = true;
      });
    } else {
      // BUG-053 fix: send canonical BookmarkCreate shape matching learning DB schema
      window.BWTL.createBookmark({
        kind: 'word',
        flashcard_ref_id: card.id,
        ref_label: card.word_or_phrase || card.word || null,
        owner_id: role,
      })
        .then(bm => { if (bm?.id) window.BWTL.BOOKMARKS.push(bm); })
        .catch(() => {
          setCard((c) => ({ ...c, bookmarked: false }));
          if (window.BWTL.FLASHCARDS[card.id]) window.BWTL.FLASHCARDS[card.id].bookmarked = false;
        });
    }
  };

  const handleChatAboutThis = () => {
    setExpandedChat(true);
    setActiveThreadId('new');
  };

  const handleNextInStudy = () => {
    const queue = window.BWTL.STUDY_QUEUE || [];
    const idx = queue.findIndex(q => (q.card_id || q.id) === card.id);
    if (idx >= 0 && idx < queue.length - 1) {
      onNavigateWord(queue[idx + 1].card_id || queue[idx + 1].id);
    } else if (idx === 0 && queue.length > 0 && queue[0].card_id !== card.id) {
      onNavigateWord(queue[0].card_id || queue[0].id);
    } else if (onNavByDelta) {
      onNavByDelta(1);
    }
  };

  // REQ-039: delete card (PL-only) — confirms, calls DELETE /api/flashcards/{id}, evicts cache
  const handleDeleteCard = async () => {
    if (!window.confirm(`Delete "${card.word_or_phrase || card.word}"? This cannot be undone.`)) return;
    try {
      await window.BWTL.deleteCard(card.id);
      delete window.BWTL.FLASHCARDS[card.id];
      window.BWTL.BOOKMARKS = (window.BWTL.BOOKMARKS || []).filter(b => b.flashcard_ref_id !== card.id);
      if (onCardDeleted) onCardDeleted(card.id);
    } catch (e) {
      window.alert(`Failed to delete card: ${e?.message || e}`);
    }
  };

  const togglePanel = (k) => {
    setPanelState((p) => ({ ...p, [k]: p[k] === 'collapsed' ? 'open' : p[k] === 'open' ? 'collapsed' : 'open' }));
  };
  const closePanel = (k) => setPanelState((p) => ({ ...p, [k]: 'closed' }));

  return (
    <div className="workspace">
      <div className="ws-center fade-up">
        <WordCard
          card={card}
          role={role}
          onDrillPie={() => drillToPie(pieRootKey)}
          onDrillFigure={drillToFigure}
          onDrillGraph={drillToGraph}
          onDrillForge={drillToForge}
          onDrillRag={drillToRag}
          onNavigateWord={onNavigateWord}
          onBookmark={handleBookmark}
          onChatAboutThis={handleChatAboutThis}
          onNextInStudy={handleNextInStudy}
          onDelete={handleDeleteCard}
          onOpenImage={setImgModalSrc} />
        
      </div>

      <div className="ws-rail">
        {/* Panel order is meaningful: PIE first (because root anchors chat),
             then Etymology graph, then figure, then RAG, then ArtForge.
             User can pin/reorder; collapsed panels stay in the rail as 36px strips. */}
        {panelState.pie !== 'closed' &&
        <PiePanel
          pieRootKey={pieRootKey}
          currentWord={card.word}
          glow={glowedPanel === 'pie'}
          collapsed={panelState.pie === 'collapsed'}
          onToggle={() => togglePanel('pie')}
          onClose={() => closePanel('pie')}
          onNavigate={onNavigateWord}
          pinned={true} />

        }
        {panelState.graph !== 'closed' &&
        <EfgPanel
          pieRootKey={pieRootKey}
          currentWordId={card.efg_node_id}
          glow={glowedPanel === 'graph'}
          collapsed={panelState.graph === 'collapsed'}
          onToggle={() => togglePanel('graph')}
          onClose={() => closePanel('graph')}
          onOpenWord={onNavigateWord} />

        }
        {panelState.myth !== 'closed' && figureId &&
        <EtymythonPanel
          figureId={figureId}
          glow={glowedPanel === 'myth'}
          collapsed={panelState.myth === 'collapsed'}
          onToggle={() => togglePanel('myth')}
          onClose={() => closePanel('myth')} />

        }
        {panelState.rag !== 'closed' &&
        <RagPanel
          pieRootKey={pieRootKey}
          glow={glowedPanel === 'rag'}
          collapsed={panelState.rag === 'collapsed'}
          onToggle={() => togglePanel('rag')}
          onClose={() => closePanel('rag')} />

        }
        {panelState.forge !== 'closed' &&
        <ArtForgePanel
          card={card}
          glow={glowedPanel === 'forge'}
          collapsed={panelState.forge === 'collapsed'}
          onToggle={() => togglePanel('forge')}
          onClose={() => closePanel('forge')} />

        }
      </div>

      <ChatDock
        anchor={{ mode: 'flashcard_id', value: card.id, label: card.word }}
        card={card}
        expanded={expandedChat}
        onToggleExpand={() => setExpandedChat((x) => !x)}
        threads={threads}
        activeThreadId={activeThreadId}
        onActivateThread={setActiveThreadId}
        onNewThread={() => setActiveThreadId('new')}
        onPromote={onPromote}
        role={role} />

      {/* REQ-029: Image iframe modal — click hero image to expand */}
      {imgModalSrc && (
        <dialog open style={{ position: 'fixed', inset: 0, zIndex: 999, width: '90vw', maxWidth: 900, height: '80vh', margin: 'auto', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: 0, boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--line-soft)' }}>
            <span style={{ fontSize: 12, color: 'var(--fg-3)', fontFamily: 'var(--ff-mono)' }}>{card.word} · image</span>
            <button className="btn xs ghost" onClick={() => setImgModalSrc(null)}>✕ Close</button>
          </div>
          <img src={imgModalSrc} alt={card.word} style={{ width: '100%', height: 'calc(100% - 40px)', objectFit: 'contain', display: 'block', background: '#000' }} />
        </dialog>
      )}
      {imgModalSrc && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 998 }} onClick={() => setImgModalSrc(null)} />}
      
    </div>);

}

// ─────────────────────────────────────────────────────────────────────────────
// WORD CARD — the centerpiece of the workspace
// ─────────────────────────────────────────────────────────────────────────────

function WordCard({ card, role, onDrillPie, onDrillFigure, onDrillGraph, onDrillForge, onDrillRag, onNavigateWord, onBookmark, onChatAboutThis, onNextInStudy, onDelete, onOpenImage }) {
  const canEdit = role === 'pl' || role === 'theo' || role === 'tutor';
  // BV-006: navigate to a cognate word card by searching the flashcards cache
  const handleCogClick = async (cogText) => {
    const word = (cogText || '').toLowerCase().trim();
    if (!word) return;
    const cached = Object.values(window.BWTL.FLASHCARDS).find(
      c => (c.word || c.word_or_phrase || '').toLowerCase() === word
    );
    if (cached) { onNavigateWord && onNavigateWord(cached.id); return; }
    const cards = await window.BWTL.fetchCards({ limit: 1000 }).catch(() => []);
    const found = cards.find(c => (c.word || c.word_or_phrase || '').toLowerCase() === word);
    if (found) onNavigateWord && onNavigateWord(found.id);
  };
  return (
    <div className="wordcard">
      <div className="wordcard-hero">
        <div className="wordcard-img" title={card.image_caption || card.word} style={{ position: 'relative', overflow: 'hidden', cursor: card.image_url ? 'zoom-in' : 'default' }}
          onClick={() => card.image_url && onOpenImage && onOpenImage(card.image_url)}>
          {card.image_url
            ? <img src={card.image_url} alt={card.word} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <span style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 9, color: 'var(--fg-4)', fontFamily: 'var(--ff-mono)' }}>no image</span>}
          {canEdit && <AiEditButton field="image" label="Image" floating card={card} />}
        </div>
        <div className="wordcard-meta">
          <div className="wordcard-row1">
            <h1 className="display">{card.word}<span className="lang">{card.language} · {card.pos}</span></h1>
          </div>
          <div className="ipa mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {card.ipa_pronunciation}
            <button className="btn xs ghost" style={{ padding: '3px 7px' }} title="Play audio (TTS)" onClick={() => { if (card.audio_url) new Audio(card.audio_url).play(); }}><Ic.speaker /></button>
            {canEdit && <AiEditButton field="ipa" label="IPA" subtle card={card} />}
            {canEdit && <AiEditButton field="audio" label="Audio" subtle card={card} />}
          </div>
          <div className="definition" style={{ marginTop: 4 }}>{card.definition}</div>
          <div className="wordcard-actions">
            <button className="btn sm" onClick={onBookmark}>
              <Ic.bookmark_filled style={{ color: card.bookmarked ? 'var(--acc-2)' : 'var(--fg-3)' }} />
              {card.bookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button className="btn sm ghost" onClick={onChatAboutThis}><Ic.chat /> Chat about this</button>
            <button className="btn sm ghost" onClick={onDrillForge}><Ic.film /> Generate video</button>
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={onNextInStudy}><Ic.shuffle /> Next in study</button>
            {/* REQ-039: delete card — PL-only destructive action */}
            {(role === 'pl') && (
              <button className="btn sm ghost" title="Delete this card" style={{ color: 'var(--danger, #e55)' }} onClick={onDelete}>✕ Delete card</button>
            )}
          </div>
        </div>
      </div>

      {/* Etymology — with cross-app drill-down links inline */}
      <div className="wc-section">
        <h4><span className="dot pie" /> Etymology
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
            {canEdit && <AiEditButton field="etymology" label="Etymology" card={card} />}
            {canEdit && <AiEditButton field="pie_root" label="PIE root" subtle card={card} />}
          </span>
        </h4>
        {/* Option B (BWTL05): card.etymology is the raw DB string; no etymology_layered array from BE */}
        <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-2)' }}>
          {card.etymology
            ? <EtymologyPIELine text={card.etymology} pieRoot={card.pie_root} onDrillPie={onDrillPie} />
            : <span style={{ color: 'var(--fg-4)' }}>No etymology on file.</span>}
        </div>
        {/* PIE root row — shows IPA + audio button when available */}
        {card.pie_root && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12.5, color: 'var(--fg-3)' }}>
            <span className="pill pie" style={{ fontSize: 9.5 }}>{card.pie_root}</span>
            {card.pie_ipa && <span className="mono" style={{ fontSize: 11 }}>{card.pie_ipa}</span>}
            {/* REQ-008: etymology_layer badge */}
            {card.etymology_layer && (
              <span className="pill ghost" style={{ fontSize: 9.5, textTransform: 'capitalize' }} title="Etymology layer: direct=borrowed directly; intermediate=via another language; distant=reconstructed cognate">
                {card.etymology_layer}
              </span>
            )}
            {card.pie_audio_url && (
              <button className="btn xs ghost" style={{ padding: '2px 6px' }} title="Play PIE root audio"
                onClick={() => new Audio(card.pie_audio_url).play()}>
                <Ic.speaker />
              </button>
            )}
          </div>
        )}
      </div>

      {/* REV-2: Multi-root PIE pills (equation style) */}
      {window.Etymology && <window.Etymology.MultiRootPie
        pieRoots={card.pie_roots || (card.pie_root ? [card.pie_root] : [])}
        currentCard={card}
        onDrillPie={onDrillPie}
        canEdit={canEdit}
      />}

      {/* Cognates — chips. Each chip is a cross-app drill-down to its word card. */}
      <div className="wc-section">
        <h4>
          <span className="dot acc" /> Cognates
          <span className="pill ghost" style={{ marginLeft: 'auto', fontSize: 9.5 }}>
            {(() => {
              const ec = (card.english_cognates || '').split(',').filter(s => s.trim());
              let rw = [];
              try { rw = JSON.parse(card.related_words || '[]'); } catch { rw = (card.related_words || '').split(',').map(s => s.trim()).filter(Boolean); }
              return ec.length + rw.length;
            })()} cognates
          </span>
          {canEdit && <AiEditButton field="cognates" label="Cognates" card={card} />}
        </h4>
        {/* Option B (BWTL05): english_cognates is comma-string; related_words may be JSON array or comma-string */}
        <div className="chip-row">
          {(card.english_cognates || '').split(',').map((c, i) => c.trim() ? (
            <span key={'en_' + i} className="cog" style={{ cursor: 'pointer' }} onClick={() => handleCogClick(c.trim())}>
              <span className="lang">en</span>
              <span>{c.trim()}</span>
            </span>
          ) : null)}
          {(() => {
            let rw = [];
            try { rw = JSON.parse(card.related_words || '[]'); } catch { rw = (card.related_words || '').split(',').map(s => s.trim()).filter(Boolean); }
            return rw.map((c, i) => (
              <span key={'rw_' + i} className="cog" style={{ cursor: 'pointer' }} onClick={() => handleCogClick(typeof c === 'string' ? c.trim() : String(c))}>
                <span className="lang">rel</span>
                <span>{typeof c === 'string' ? c.trim() : c}</span>
              </span>
            ));
          })()}
          <span className="cog" style={{ borderStyle: 'dashed', color: 'var(--fg-3)' }} onClick={onDrillGraph}>
            <Ic.graph /> Open full graph
          </span>
        </div>
      </div>

      {/* REV-2: Scholarly notes stack — per-root citations */}
      {window.Etymology && <window.Etymology.ScholarlyNotesStack
        pieRoots={card.pie_roots || (card.pie_root ? [card.pie_root] : [])}
        currentCard={card}
      />}

      {/* REV-2: Empty etymology placeholder for cards with no PIE root */}
      {window.Etymology && !card.pie_root && !card.etymology && (
        <window.Etymology.EmptyEtymologyState card={card} onAskAI={(field) => onChatAboutThis && onChatAboutThis(field)} />
      )}

      {/* Fun facts — hidden when empty; DB has no fun_facts column (BWTL05) */}
      {card.fun_facts && card.fun_facts.length > 0 && (
        <div className="wc-section">
          <h4><span className="dot" style={{ background: 'var(--myth)' }} /> Fun facts
            <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
              {canEdit && <AiEditButton field="fun_facts" label="Fun facts" card={card} />}
            </span>
          </h4>
          <div style={{ display: 'grid', gap: 8 }}>
            {card.fun_facts.map((f, i) =>
            <div key={i} className="ff-card">
                <FunFactBody text={f.text} figure={f.figure} onDrillFigure={onDrillFigure} onDrillPie={onDrillPie} />
                <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', fontSize: 10.5, color: 'var(--fg-4)' }}>
                  <Ic.chat />
                  <span>Discuss in chat</span>
                  <span style={{ marginLeft: 'auto' }} className="mono">fun_fact · {i + 1} of {card.fun_facts.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dictionary lookup hint — opens RAG panel */}
      <div className="wc-section" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Ic.book />
        <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>
          Scholarly entry available in <a className="xlink rag" style={{ '--xc': 'var(--acc)' }} onClick={onDrillRag}>
            <span className="x-tag">RAG</span>Beekes EDPIE
          </a> — 1 match for this root.
        </span>
      </div>
    </div>);

}

// ─────────────────────────────────────────────────────────────────────────────
// Helper renderers — turn key tokens in prose into cross-app drill-down links.
// ─────────────────────────────────────────────────────────────────────────────

function EtymologyPIELine({ text, pieRoot, onDrillPie }) {
  // Replace PIE root literal in text with a clickable xlink.
  // This is the cue the design brief calls out: clicking the PIE root opens
  // the PIE Explorer panel.
  if (!pieRoot) return <span>{text}</span>;
  const parts = text.split(pieRoot);
  if (parts.length === 1) return <span>{text}</span>;
  return (
    <span>
      {parts.map((p, i) =>
      <React.Fragment key={i}>
          {p}
          {i < parts.length - 1 &&
        <a className="xlink pie" onClick={onDrillPie}>
              <span className="x-tag">PIE</span>{pieRoot}
            </a>
        }
        </React.Fragment>
      )}
    </span>);

}

function FunFactBody({ text, figure, onDrillFigure, onDrillPie }) {
  // Look for capitalized figure names — we naively detect Mnemosyne, Hera, Lethe etc.
  // For mock purposes we use a small replacements table.
  const figs = ['Mnemosyne', 'Hera', 'Lethe', 'Gaia', 'Zeus'];
  let parts = [text];
  figs.forEach((f) => {
    const next = [];
    parts.forEach((p) => {
      if (typeof p !== 'string') {next.push(p);return;}
      const split = p.split(new RegExp(`(${f})`));
      split.forEach((s, i) => {
        if (s === f) next.push(<a key={Math.random()} className="xlink myth" onClick={() => onDrillFigure(figure || 'mnemosyne')}><span className="x-tag">EM</span>{s}</a>);else
        next.push(s);
      });
    });
    parts = next;
  });
  // also linkify *root- patterns
  const finalParts = [];
  parts.forEach((p, idx) => {
    if (typeof p !== 'string') {finalParts.push(p);return;}
    const re = /(\*[a-zA-Z₀-₉ʷʰ¹²³⁴-]+-?)/g;
    let last = 0;
    let m;
    while (m = re.exec(p)) {
      finalParts.push(p.slice(last, m.index));
      finalParts.push(<a key={idx + '_' + m.index} className="xlink pie" onClick={onDrillPie}><span className="x-tag">PIE</span>{m[1]}</a>);
      last = m.index + m[1].length;
    }
    finalParts.push(p.slice(last));
  });
  return <span>{finalParts}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI EDIT BUTTON — small spark/pencil that opens a per-field regenerate popover.
// Mirrors SF /api/ai/ai_generate. The popover routes through Theodoros review
// queue for non-admin roles (per the role matrix).
// ─────────────────────────────────────────────────────────────────────────────

function AiEditButton({ field, label, subtle, floating, card }) {
  const [open, setOpen] = React.useState(false);
  const [stage, setStage] = React.useState('idle'); // idle | running | done
  const [proposedValue, setProposedValue] = React.useState(null);
  const [promptText, setPromptText] = React.useState('');
  const meta = window.BWTL.AI_FIELDS[field] || { endpoint: 'POST /api/ai/generate', model: 'gpt-4o' };
  const FIELD_API_KEYS = {
    ipa: 'ipa_pronunciation', audio: 'audio_url', cognates: 'english_cognates',
    image: 'image_url', definition: 'definition', etymology: 'etymology',
    pie_root: 'pie_root', pie_ipa: 'pie_ipa',
  };
  const runIt = async () => {
    setStage('running');
    if (!card) { setProposedValue(null); setStage('done'); return; }
    try {
      // BUG-055 fix: use _apiFetch instead of raw fetch()
      const result = await window.BWTL._apiFetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          card_id: card.id, field, prompt: promptText,
          word_or_phrase: card.word || card.word_or_phrase,
          language_id: card.language_id,
        }),
      });
      const apiKey = FIELD_API_KEYS[field] || field;
      setProposedValue(result[apiKey] ?? null);
    } catch (e) {
      console.error('[AiEditButton] generate error:', e);
    }
    setStage('done');
  };
  const applyIt = async () => {
    if (card && proposedValue !== null) {
      const apiKey = FIELD_API_KEYS[field] || field;
      try {
        // BUG-055 fix: use _apiFetch instead of raw fetch()
        await window.BWTL._apiFetch(`/api/flashcards/${card.id}/`, {
          method: 'PUT',
          body: JSON.stringify({ [apiKey]: proposedValue }),
        });
        window.dispatchEvent(new CustomEvent('bwtl:toast', { detail: `Applied AI ${label} to card` }));
        window.dispatchEvent(new CustomEvent('bwtl:card-reload', { detail: card.id }));
      } catch (e) {
        window.dispatchEvent(new CustomEvent('bwtl:toast', { detail: `Failed to apply ${label}` }));
      }
    } else {
      window.dispatchEvent(new CustomEvent('bwtl:toast', { detail: `Applied AI ${label} to card` }));
    }
    setOpen(false);
  };
  const popoverStyle = floating ? {
    position: 'absolute', bottom: 8, right: 8
  } : { position: 'relative' };

  return (
    <span style={popoverStyle}>
      <button
        onClick={(e) => {e.stopPropagation();setOpen((o) => !o);setStage('idle');}}
        title={`Edit ${label} with AI — ${meta.endpoint}`}
        style={{
          appearance: 'none', border: '1px solid ' + (open ? 'var(--acc-ring)' : 'var(--line)'),
          background: open ? 'var(--acc-bg)' : subtle ? 'transparent' : 'var(--bg-2)',
          color: open ? 'var(--acc-2)' : 'var(--fg-3)',
          padding: subtle ? '2px 5px' : '3px 7px',
          borderRadius: 6, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10.5, fontWeight: 600, fontFamily: 'inherit'
        }}>
        
        <Ic.spark /> {!subtle && 'AI'}
      </button>
      {open &&
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: floating ? 0 : 'auto',
          left: floating ? 'auto' : 0,
          zIndex: 30,
          width: 320,
          background: 'var(--bg-2)',
          border: '1px solid var(--acc-ring)',
          borderRadius: 'var(--r)',
          padding: 12,
          boxShadow: '0 20px 50px -10px rgba(0,0,0,.6)'
        }}>
        
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic.spark style={{ color: 'var(--acc-2)' }} />
              <strong style={{ fontSize: 12 }}>Regenerate {label} with AI</strong>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 0, color: 'var(--fg-3)', cursor: 'pointer' }}><Ic.x /></button>
          </div>
          <div style={{ display: 'grid', gap: 6, fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 10 }}>
            <div><span className="mono" style={{ color: 'var(--fg-4)' }}>endpoint:</span> <span className="mono" style={{ color: 'var(--acc-2)' }}>{meta.endpoint}</span></div>
            <div><span className="mono" style={{ color: 'var(--fg-4)' }}>model:</span> {meta.model}</div>
            <div><span className="mono" style={{ color: 'var(--fg-4)' }}>last run:</span> {meta.last_run} · avg {meta.avg_ms}ms</div>
          </div>
          <textarea
          value={promptText}
          onChange={e => setPromptText(e.target.value)}
          placeholder={`Optional: tell the AI what to focus on (e.g. "emphasize the compound nature of *h₁epi-+*gʷem-")`}
          style={{ width: '100%', height: 64, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 6, padding: 8, color: 'var(--fg)', font: 'inherit', fontSize: 12, resize: 'none' }} />
        
          {stage === 'idle' &&
        <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
              <button className="btn xs ghost">Use Beekes context</button>
              <button className="btn xs primary" style={{ marginLeft: 'auto' }} onClick={runIt}><Ic.spark /> Generate</button>
            </div>
        }
          {stage === 'running' &&
        <div style={{ marginTop: 10, padding: 8, borderRadius: 6, background: 'var(--bg-1)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-2)' }}>
              <span className="dot warn" /> Running on {meta.model}…
            </div>
        }
          {stage === 'done' &&
        <div style={{ marginTop: 10 }}>
              <div style={{ padding: 8, borderRadius: 6, background: 'color-mix(in oklch, var(--ok) 5%, var(--bg-1))', border: '1px solid color-mix(in oklch, var(--ok) 30%, var(--line))', fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5, marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ok)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Proposed</div>
                {proposedValue !== null
                  ? <span style={{ fontFamily: label === 'IPA' ? 'var(--ff-mono)' : 'inherit' }}>{String(proposedValue)}</span>
                  : `Suggested ${label.toLowerCase()} drafted. Review before apply.`}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn xs ghost" onClick={() => setStage('idle')}>Re-roll</button>
                <button className="btn xs ghost" style={{ marginLeft: 'auto' }}>Send to review</button>
                <button className="btn xs primary" onClick={applyIt}>
                  <Ic.check /> Apply
                </button>
              </div>
            </div>
        }
        </div>
      }
    </span>);

}

window.Workspace = Workspace;
window.AiEditButton = AiEditButton;

// CardDetail — REV-3 unified card view with sticky nav header + mode tabs
// Wraps Workspace (Study), PronunciationView, and ShadowingView.
function CardDetail({
  cardId, role, spine, mode, setMode, onBack, onNavByDelta, onOpenCard, onOpenFigure,
  panelState, setPanelState, glowedPanel, triggerGlow,
  expandedChat, setExpandedChat, activeThreadId, setActiveThreadId, onPromote, onCardDeleted,
}) {
  const [card, setCard] = React.useState(window.BWTL.FLASHCARDS[cardId] || null);

  React.useEffect(() => {
    const cached = window.BWTL.FLASHCARDS[cardId];
    if (cached && cached.word) { setCard(cached); return; }
    window.BWTL.fetchCard(cardId)
      .then(c => { setCard(c); if (c) window.BWTL.FLASHCARDS[c.id] = c; })
      .catch(console.error);
  }, [cardId]);

  const word = card ? (card.word_or_phrase || card.word) : cardId;
  const pos = (spine && spine.length) ? spine.indexOf(cardId) : -1;
  const total = (spine && spine.length) ? spine.length : 0;
  const [bookmarked, setBookmarked] = React.useState(card?.bookmarked || false);

  React.useEffect(() => { setBookmarked(card?.bookmarked || false); }, [card]);

  const handleBookmark = () => {
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);
    if (wasBookmarked) {
      const bm = (window.BWTL.BOOKMARKS || []).find(b => b.flashcard_ref_id === cardId);
      if (bm) window.BWTL.deleteBookmark(bm.id).catch(() => setBookmarked(true));
    } else {
      window.BWTL.createBookmark({ kind: 'word', flashcard_ref_id: cardId, ref_label: word, owner_id: role })
        .then(bm => { if (bm?.id) window.BWTL.BOOKMARKS.push(bm); })
        .catch(() => setBookmarked(false));
    }
    if (window.BWTL.FLASHCARDS[cardId]) window.BWTL.FLASHCARDS[cardId].bookmarked = !wasBookmarked;
  };

  const MODES = [['study', 'Study'], ['pronunciation', 'Pronunciation'], ['shadowing', 'Shadowing']];

  return (
    <div>
      {/* Sticky sub-header: back ← Browse, breadcrumb, bookmark, prev/next N/M */}
      <div style={{
        position: 'sticky', top: 'var(--topbar-h, 52px)', zIndex: 40,
        background: 'color-mix(in oklch, var(--bg-0) 92%, transparent)',
        backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--line-soft)',
        padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button className="btn sm ghost" onClick={onBack} style={{ gap: 6, display: 'inline-flex', alignItems: 'center' }}>
          <Ic.arrow_left /> Browse
        </button>
        <span style={{ fontSize: 12, color: 'var(--fg-4)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Browse
          <span style={{ color: 'var(--fg-5)', margin: '0 2px' }}>/</span>
          <span style={{ color: 'var(--fg-2)', fontWeight: 600 }}>{word}</span>
        </span>
        <div style={{ flex: 1 }} />
        <button
          className="btn xs ghost"
          style={{ color: bookmarked ? 'var(--acc-2)' : 'var(--fg-3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          onClick={handleBookmark}
          title={bookmarked ? 'Remove from study set' : 'Add to study set'}
        >
          {bookmarked ? <Ic.bookmark_filled /> : <Ic.bookmark />}
          {bookmarked ? 'Saved' : 'Save'}
        </button>
        {total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button className="btn xs ghost icon" onClick={() => onNavByDelta(-1)} disabled={pos <= 0} title="Previous card (Alt+↑)"><Ic.arrow_up /></button>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', minWidth: 42, textAlign: 'center' }}>
              {pos >= 0 ? pos + 1 : '?'} / {total}
            </span>
            <button className="btn xs ghost icon" onClick={() => onNavByDelta(1)} disabled={pos < 0 || pos >= total - 1} title="Next card (Alt+↓)"><Ic.arrow_down /></button>
          </div>
        )}
      </div>

      {/* Mode tab strip */}
      <div style={{ display: 'flex', gap: 0, padding: '0 20px', borderBottom: '1px solid var(--line)' }}>
        {MODES.map(([k, lab]) => (
          <button key={k} onClick={() => setMode(k)} style={{
            appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
            padding: '8px 16px', borderBottom: '2px solid ' + (mode === k ? 'var(--acc)' : 'transparent'),
            marginBottom: -1, color: mode === k ? 'var(--fg)' : 'var(--fg-3)',
            fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
          }}>{lab}</button>
        ))}
      </div>

      {/* Mode content */}
      {mode === 'study' && (
        <Workspace
          cardId={cardId}
          role={role}
          onNavigateWord={onOpenCard}
          onNavByDelta={onNavByDelta}
          onOpenFigure={onOpenFigure}
          panelState={panelState}
          setPanelState={setPanelState}
          glowedPanel={glowedPanel}
          triggerGlow={triggerGlow}
          expandedChat={expandedChat}
          setExpandedChat={setExpandedChat}
          activeThreadId={activeThreadId}
          setActiveThreadId={setActiveThreadId}
          onPromote={onPromote}
          onCardDeleted={onCardDeleted}
        />
      )}
      {mode === 'pronunciation' && <PronunciationView card={card} />}
      {mode === 'shadowing' && <ShadowingView card={card} />}
    </div>
  );
}

window.CardDetail = CardDetail;