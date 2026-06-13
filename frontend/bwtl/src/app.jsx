// Top-level app — shell, primary nav, role-aware routing, tweak-aware styling.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "regular",
  "railWidth": "standard",
  "railVisible": true,
  "chatPosition": "bottom-center",
  "chatPersistThreads": true,
  "xlinkStyle": "tag-pill",
  "panelGlow": true,
  "showSourceTags": true,
  "accent": "oklch(70% 0.17 295)",
  "theme": "dark",
  "etymologyLayout": "layered",
  "funfactDensity": "stacked"
}/*EDITMODE-END*/;

function computeCardSpine(cardFilter) {
  let cards = Object.values(window.BWTL.FLASHCARDS || {});
  if (cardFilter.chips.includes('bookmarked')) cards = cards.filter(c => c.bookmarked);
  if (cardFilter.chips.includes('has_video')) cards = cards.filter(c => c.has_video);
  if (cardFilter.chips.includes('missing_data')) cards = cards.filter(c => !c.pie_root && !(c.pie_roots && c.pie_roots.length));
  if (cardFilter.language) {
    const langName = (window.BWTL.LANGUAGE_FILTERS || []).find(l => l.code === cardFilter.language)?.name;
    if (langName) cards = cards.filter(c => c.language === langName);
  }
  if (cardFilter.q) {
    const q = cardFilter.q.toLowerCase();
    cards = cards.filter(c => ((c.word_or_phrase || c.word || '') + ' ' + (c.definition || '')).toLowerCase().includes(q));
  }
  if (cardFilter.sort === 'alpha') {
    cards.sort((a, b) => (a.word_or_phrase || a.word || '').localeCompare(b.word_or_phrase || b.word || ''));
  }
  return cards.map(c => c.id);
}

function buildTrail(section, detailCardId) {
  if (section === 'browse') {
    if (detailCardId) {
      const c = window.BWTL.FLASHCARDS && window.BWTL.FLASHCARDS[detailCardId];
      return [
        { label: 'Browse', go: { section: 'browse', clearDetail: true } },
        { label: c?.word_or_phrase || c?.word || detailCardId, here: true },
      ];
    }
    return [{ label: 'Browse', here: true }];
  }
  if (section === 'generate')  return [{ label: 'Generate', here: true }];
  if (section === 'theodoros') return [{ label: 'Chat', here: true }];
  if (section === 'admin')     return [{ label: 'Admin', here: true }];
  if (section === 'settings')  return [{ label: 'Settings', here: true }];
  return [];
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [mode, setMode] = React.useState('proto'); // proto | spec
  const [role, setRole] = React.useState('pl');
  const [section, setSection] = React.useState('browse');
  const [browseTab, setBrowseTab] = React.useState('cards');
  const [detailCardId, setDetailCardId] = React.useState(null);
  const [detailMode, setDetailMode] = React.useState('study');

  const [cardFilter, setCardFilter] = React.useState({ chips: [], language: null, sort: 'modified', q: '' });
  const [createOpen, setCreateOpen] = React.useState(false);
  const [flashcardsVersion, setFlashcardsVersion] = React.useState(0);

  React.useEffect(() => {
    const onLoaded = () => setFlashcardsVersion(v => v + 1);
    window.addEventListener('bwtl:flashcards-loaded', onLoaded);
    return () => window.removeEventListener('bwtl:flashcards-loaded', onLoaded);
  }, []);

  const cardSpine = React.useMemo(() => computeCardSpine(cardFilter), [cardFilter, flashcardsVersion]);

  // ── URL-based routing on mount ───────────────────────────────────────────
  React.useEffect(() => {
    const path = window.location.pathname;
    const cardMatch = path.match(/^\/bwtl\/browse\/card\/([^/]+)/);
    if (cardMatch) {
      openCard(cardMatch[1]);
    } else if (/^\/bwtl\/browse/.test(path)) {
      setSection('browse');
    } else if (/^\/bwtl\/generate/.test(path)) {
      setSection('generate');
    } else if (/^\/bwtl\/admin/.test(path)) {
      setSection('admin');
    } else if (/^\/bwtl\/theodoros/.test(path)) {
      setSection('theodoros');
    } else if (/^\/bwtl\/settings/.test(path)) {
      setSection('settings');
    }
  }, []);

  // ── prefetch languages on boot; cards are loaded on-demand by CardsTab ──
  // REQ-019: removed startup fetchCards() prefetch — cards load on-demand only
  React.useEffect(() => {
    if (!window.BWTL.fetchLanguages) return;
    window.BWTL.fetchLanguages().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── workspace UI state ───────────────────────────────────────────────────
  const [panelState, setPanelState] = React.useState({
    pie: 'open', graph: 'open', myth: 'closed', rag: 'collapsed', forge: 'collapsed',
  });
  const [glowedPanel, setGlowedPanel] = React.useState(null);
  const triggerGlow = (p) => {
    if (!t.panelGlow) return;
    setGlowedPanel(p);
    setTimeout(() => setGlowedPanel(null), 1400);
  };
  const [expandedChat, setExpandedChat] = React.useState(false);
  const [activeThreadId, setActiveThreadId] = React.useState(null);

  // role switcher
  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);

  // ── apply tweaks ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    document.documentElement.style.setProperty('--acc', t.accent);
    document.documentElement.style.setProperty('--acc-2', t.accent);
    // Rail width
    const w = { narrow: 360, standard: 420, wide: 520 }[t.railWidth] || 420;
    document.documentElement.style.setProperty('--rail-w', w + 'px');
    // density
    document.documentElement.style.setProperty('--ws-pad', t.density === 'compact' ? '12px' : t.density === 'comfy' ? '28px' : '18px');
  }, [t.accent, t.railWidth, t.density]);

  // ── open card detail (REV-3) ──────────────────────────────────────────────
  const openCard = (cardId) => {
    if (!cardId) return;
    setSection('browse');
    setDetailCardId(cardId);
    setDetailMode('study');
    setPanelState(p => ({ ...p, pie: 'open' }));
    setActiveThreadId(null);
  };

  const backToBrowse = () => setDetailCardId(null);

  const navByDelta = (delta) => {
    const idx = cardSpine.indexOf(detailCardId);
    if (idx === -1) return;
    const nxt = cardSpine[idx + delta];
    if (nxt) openCard(nxt);
  };

  // ── open figure detail (drill from fun fact) ─────────────────────────────
  const openFigure = (figureId) => {
    setPanelState(p => ({ ...p, myth: 'open' }));
  };

  // BUG-121: Accept writes to chat_promotions via POST /api/chat/promotions.
  // payload: { card: card_id, field: target_field, preview: proposed_value, msgId? }
  const onPromote = (payload) => {
    const fieldMeta = window.BWTL.PROMOTE_FIELDS.find(f => f.key === payload.field);
    window.BWTL.promoteField({
      chat_message_id: payload.msgId || 'unknown',
      card_id: payload.card,
      target_field: payload.field,
      before_value: null,
      after_value: payload.preview || '',
      accepted_by: role,
    }).then(() => {
      showToast(`Accepted → ${window.BWTL.FLASHCARDS[payload.card]?.word || payload.card} · ${fieldMeta?.label || payload.field}`);
    }).catch(err => {
      console.error('[onPromote]', err);
      showToast(`Accepted (local only — audit write failed)`);
    });
  };

  // REQ-039: card deleted — evict from spine and go back to browse
  // BUG-115: cardSpine is derived via useMemo; there is no setCardSpine setter.
  // Bumping flashcardsVersion forces recompute; the card was already evicted from
  // window.BWTL.FLASHCARDS before onCardDeleted is called.
  const onCardDeleted = (cardId) => {
    setFlashcardsVersion(v => v + 1);
    setDetailCardId(null);
    setSection('browse');
    showToast('Card deleted');
  };

  // ── toast (lightweight) ──────────────────────────────────────────────────
  const [toast, setToast] = React.useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  // Global event hooks — StudyToolbar and AiEditButton dispatch these.
  React.useEffect(() => {
    const onCreate = () => setCreateOpen(true);
    const onToast = (e) => showToast(e.detail);
    const onCardReload = (e) => {
      if (e.detail) openCard(e.detail);
    };
    window.addEventListener('bwtl:open-create', onCreate);
    window.addEventListener('bwtl:toast', onToast);
    window.addEventListener('bwtl:card-reload', onCardReload);
    return () => {
      window.removeEventListener('bwtl:open-create', onCreate);
      window.removeEventListener('bwtl:toast', onToast);
      window.removeEventListener('bwtl:card-reload', onCardReload);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const trail = buildTrail(section, detailCardId);

  // Role gates — Chat tab is visible to all roles (REV item 5).
  // Theodoros power-user status is now permission-based (edit any card, run
  // batch jobs, edit EFG nodes), not a separate UI surface.
  const canSeeAdmin = role === 'pl';

  return (
    <>
      <div className="app">
        {mode === 'proto' ? (
          <>
            <TopBar
              section={section} setSection={(s) => { setSection(s); if (s !== 'browse') setDetailCardId(null); }}
              role={role} setRole={setRole}
              canSeeAdmin={canSeeAdmin}
              roleMenuOpen={roleMenuOpen} setRoleMenuOpen={setRoleMenuOpen}
              cardFilter={cardFilter} setCardFilter={setCardFilter} />
            {trail.length > 0 && <Crumbs trail={trail} go={(g) => { if (g.section) setSection(g.section); if (g.clearDetail) setDetailCardId(null); }} />}
            <main className="main-area">
              {section === 'browse' && !detailCardId && (
                <BrowseView
                  onOpenCard={openCard}
                  onOpenFigure={openFigure}
                  role={role}
                  browseTab={browseTab}
                  setBrowseTab={setBrowseTab}
                  cardFilter={cardFilter}
                  setCardFilter={setCardFilter}
                  spine={cardSpine} />
              )}
              {section === 'browse' && detailCardId && (
                <CardDetail
                  cardId={detailCardId}
                  role={role}
                  spine={cardSpine}
                  mode={detailMode}
                  setMode={setDetailMode}
                  onBack={backToBrowse}
                  onNavByDelta={navByDelta}
                  onOpenCard={openCard}
                  onOpenFigure={openFigure}
                  panelState={panelState}
                  setPanelState={setPanelState}
                  glowedPanel={glowedPanel}
                  triggerGlow={triggerGlow}
                  expandedChat={expandedChat}
                  setExpandedChat={setExpandedChat}
                  activeThreadId={activeThreadId}
                  setActiveThreadId={setActiveThreadId}
                  onPromote={onPromote}
                  onCardDeleted={onCardDeleted} />
              )}
              {section === 'generate'  && <GenerateView cardId={detailCardId || 'fc_souvenir'} role={role} />}
              {section === 'theodoros' && (
                <TheodorosView
                  onAccept={(item) => showToast(`Accepted · ${item.field}`)}
                  onReject={(item) => showToast(`Rejected · ${item.id}`)}
                  onNavigateWord={openCard} />
              )}
              {section === 'admin' && canSeeAdmin && <AdminView role={role} />}
              {section === 'admin' && !canSeeAdmin && (
                <div style={{ padding: 40, color: 'var(--fg-3)' }}>
                  Admin surfaces are PL-only.
                </div>
              )}
              {section === 'settings' && <SettingsView role={role} />}
              {section === 'bookmarks' && window.BookmarksView && (
                <window.BookmarksView
                  go={(g) => { if (g.section) setSection(g.section); }}
                  onOpenCard={(id) => { setSection('browse'); openCard(id); }}
                  onOpenFigure={openFigure} />
              )}
            </main>
          </>
        ) : (
          <SpecDoc />
        )}
      </div>

      {/* mode toggle */}
      <div className="mode-toggle">
        <button className={mode === 'proto' ? 'active' : ''} onClick={() => setMode('proto')}>
          <Ic.grid /> Prototype
        </button>
        <button className={mode === 'spec' ? 'active' : ''} onClick={() => setMode('spec')}>
          <Ic.doc /> Spec
        </button>
      </div>

      {/* toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 90, right: 18, zIndex: 200,
          background: 'var(--bg-3)', border: '1px solid var(--acc-ring)',
          padding: '10px 14px', borderRadius: 10, color: 'var(--fg)',
          fontSize: 13, boxShadow: '0 10px 30px -10px rgba(0,0,0,.6)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Ic.check style={{ color: 'var(--ok)' }} /> {toast}
        </div>
      )}

      <BwtlTweaks tweaks={t} setTweak={setTweak} />

      {createOpen && (
        <NewCardSheet
          role={role}
          onClose={() => setCreateOpen(false)}
          onCreated={(word, lang) => { setCreateOpen(false); showToast(`Created \u201c${word}\u201d in ${lang}`); }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Topbar — brand · primary nav · search · bookmark rail · role chip
// ─────────────────────────────────────────────────────────────────────────────

function TopBar({ section, setSection, role, setRole, canSeeAdmin, roleMenuOpen, setRoleMenuOpen, cardFilter, setCardFilter }) {
  const r = window.BWTL.ROLES[role];
  const [bmCount, setBmCount] = React.useState(() => (window.BWTL.BOOKMARKS || []).length);
  React.useEffect(() => {
    const onBmChanged = () => setBmCount((window.BWTL.BOOKMARKS || []).length);
    window.addEventListener('bwtl:bookmarks-changed', onBmChanged);
    return () => window.removeEventListener('bwtl:bookmarks-changed', onBmChanged);
  }, []);
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className="brand">
            <div className="brand-mark" />
            <div>
              <div>Bring Words to Life</div>
              <div className="brand-sub">Unified · BWTL01 · v0.3 · REV-3</div>
            </div>
          </div>

          {/* primary nav */}
          <div style={{ display: 'inline-flex', gap: 2, padding: 4, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10 }}>
            {[
              ['browse',    'Browse',   <Ic.grid />,     null],
              ['generate',  'Generate', <Ic.film />,     null],
              ['theodoros', 'Chat',     <Ic.chat />,     Object.values(window.BWTL.CHAT_THREADS).reduce((a, x) => a + x.length, 0)],
              canSeeAdmin ? ['admin', 'Admin', <Ic.spark />, null] : null,
              ['settings',  'Settings', null,            null],
            ].filter(Boolean).map(([k, lab, icon, badge]) => (
              <button
                key={k}
                onClick={() => setSection(k)}
                style={{
                  appearance: 'none', border: 0,
                  background: section === k ? 'linear-gradient(180deg, var(--bg-4), var(--bg-3))' : 'transparent',
                  color: section === k ? 'var(--fg)' : 'var(--fg-3)',
                  padding: '6px 14px', borderRadius: 7,
                  fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  boxShadow: section === k ? '0 1px 0 rgba(255,255,255,.05) inset' : 'none',
                  position: 'relative',
                }}
              >
                {icon} {lab}
                {badge > 0 && (
                  <span style={{
                    background: 'var(--acc)', color: '#0b0918',
                    fontSize: 9.5, fontWeight: 800, fontFamily: 'var(--ff-mono)',
                    padding: '1px 5px', borderRadius: 99,
                    marginLeft: 2,
                  }}>{badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* FTS search — wired to cardFilter.q */}
        <div className="search">
          <Ic.search />
          <input
            placeholder="Search cards…"
            value={cardFilter?.q || ''}
            onChange={(e) => setCardFilter(f => ({ ...f, q: e.target.value }))}
          />
          {/* REQ-042: clear search button — visible only when search is non-empty */}
          {cardFilter?.q && (
            <button
              title="Clear search"
              onClick={() => setCardFilter(f => ({ ...f, q: '' }))}
              style={{ appearance: 'none', background: 'transparent', border: 0, color: 'var(--fg-3)', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: 4 }}
            >✕</button>
          )}
          <span className="kbd">⌘K</span>
        </div>

        {/* right cluster */}
        <div className="right-cluster">
          <button
            className="btn sm primary"
            title="Create a new flashcard · POST /api/flashcards"
            onClick={() => window.dispatchEvent(new CustomEvent('bwtl:open-create'))}
          >
            <Ic.plus /> New card
          </button>

          <button className="btn sm ghost" title="Bookmarks rail" onClick={() => setSection('bookmarks')}>
            <Ic.bookmark /> <span style={{ color: 'var(--fg-3)' }}>{bmCount}</span>
          </button>

          <div style={{ position: 'relative' }}>
            <div className={`role-chip ${role === 'theo' ? 'theo' : role === 'learner' ? 'learner' : ''}`} onClick={() => setRoleMenuOpen(o => !o)}>
              <div className="av">{r.initials}</div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span>{r.label}</span>
                <span style={{ fontSize: 10, color: 'var(--fg-4)', fontWeight: 500 }}>{r.sub}</span>
              </div>
              <Ic.caret_d style={{ color: 'var(--fg-4)' }} />
            </div>
            {roleMenuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--bg-2)', border: '1px solid var(--line)',
                borderRadius: 10, padding: 6, minWidth: 220, zIndex: 90,
                boxShadow: '0 20px 50px -10px rgba(0,0,0,.6)',
              }}>
                <div style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'var(--fg-4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  Switch role (prototype only)
                </div>
                {Object.values(window.BWTL.ROLES).map(R => (
                  <div
                    key={R.id}
                    onClick={() => { setRole(R.id); setRoleMenuOpen(false); }}
                    style={{
                      padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                      background: role === R.id ? 'var(--bg-3)' : 'transparent',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <div className="av" style={{
                      width: 22, height: 22, borderRadius: 99,
                      background: R.id === 'theo' ? 'linear-gradient(135deg, var(--myth), var(--forge))' : R.id === 'learner' ? 'linear-gradient(135deg, var(--graph), var(--pie))' : R.id === 'tutor' ? 'linear-gradient(135deg, var(--acc), var(--graph))' : 'linear-gradient(135deg, var(--acc), var(--pie))',
                      display: 'grid', placeItems: 'center', fontSize: 10, color: '#0b0918', fontWeight: 800,
                    }}>{R.initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{R.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{R.sub}</div>
                    </div>
                    {role === R.id && <Ic.check style={{ color: 'var(--ok)' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Crumbs({ trail, go }) {
  return (
    <div className="crumbs">
      {trail.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep">/</span>}
          {c.here ? <span className="here">{c.label}</span> : c.go ? <a onClick={() => go(c.go)} style={{ cursor: 'pointer' }}>{c.label}</a> : <span>{c.label}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings — basic skeleton
// ─────────────────────────────────────────────────────────────────────────────

function SettingsView({ role }) {
  return (
    <div style={{ padding: '24px 20px', maxWidth: 900, margin: '0 auto' }}>
      <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Settings</h1>
      <p style={{ color: 'var(--fg-3)', marginTop: 6 }}>Identity, audio voices, and deep-links out to standalone source apps.</p>

      <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <SettingsRow title="Identity">
          <div>You are <strong>{window.BWTL.ROLES[role].label}</strong> · {window.BWTL.ROLES[role].sub}</div>
          <div style={{ color: 'var(--fg-3)', fontSize: 12, marginTop: 4 }}>Role tier controls Theodoros visibility and AI-correction approval rights. See the role matrix in Spec.</div>
        </SettingsRow>

        <SettingsRow title="Audio voices">
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="pill ghost">ElevenLabs · default</span>
            <span className="pill ghost">Eleni (your clone) · Greek</span>
            <span className="pill ghost">Marcus · Latin restored</span>
          </div>
          {/* TODO: implement voice clones feature - see REQ-XXX (filed as SF-BUG-084 follow-on) */}
          {/* <button className="btn sm ghost" style={{ marginTop: 10 }}>Manage voice clones</button> */}
          {/* TSK-023: voice-trace diagnostics gate — only visible when BWTL_DEBUG_VOICE is set */}
          {window.BWTL_DEBUG_VOICE && (
            <div style={{ marginTop: 10, padding: 8, background: 'var(--bg-2)', border: '1px dashed var(--warn)', borderRadius: 6, fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--ff-mono)' }}>
              [voice-trace] BWTL_DEBUG_VOICE active · clones: {Object.keys(window.BWTL.VOICE_CLONES || {}).length} · fetchVoiceClones available: {typeof window.BWTL.fetchVoiceClones === 'function' ? 'yes' : 'no'}
            </div>
          )}
        </SettingsRow>

        <SettingsRow title="Source apps · deep-link out">
          <div style={{ display: 'grid', gap: 6 }}>
            <DeepLink name="ArtForge (full)" url="artforge.rentyourcio.com" purpose="Non-etymology projects, galleries, full library." />
            <DeepLink name="EFG graph editor" url="efg.rentyourcio.com" purpose="Admin node/edge management." />
            <DeepLink name="Etymython admin" url="etymython.rentyourcio.com/admin" purpose="Figure CMS for instructor authoring." />
            <DeepLink name="Portfolio RAG console" url="rag.rentyourcio.com" purpose="Ingestion + collection management (PL only)." />
          </div>
        </SettingsRow>

        <SettingsRow title="Data health · BWTL01 snapshot">
          <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
            <HealthRow label="SF pie_audio_url filled"  filled={0.12} target={0.95} pill="warn" sub="TSK-001 in progress — 2581 missing" />
            <HealthRow label="EFG nodes.pie_audio_url"  filled={0.95} target={1.0}  pill="ok"   sub="52 missing (REQ-011)" />
            <HealthRow label="EM figure audio"          filled={0.39} target={0.95} pill="warn" sub="111 missing — no in-flight requirement" />
            <HealthRow label="SF pie_root filled"       filled={0.70} target={0.85} pill="warn" sub="879 missing — 440 backfill-pending (TSK-008)" />
            <HealthRow label="flashcard_pie_roots.etymology_layer" filled={0.0} target={0.95} pill="err" sub="2922 rows · 0% filled (REQ-008)" />
          </div>
        </SettingsRow>
      </div>
    </div>
  );
}

function SettingsRow({ title, children }) {
  return (
    <div className="card">
      <div className="card-head"><h3>{title}</h3></div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function DeepLink({ name, url, purpose }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 6, background: 'var(--bg-2)', border: '1px solid var(--line-soft)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{name} <span className="mono" style={{ color: 'var(--fg-4)', fontSize: 11, marginLeft: 6 }}>{url}</span></div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 2 }}>{purpose}</div>
      </div>
      <button className="btn sm ghost"><Ic.link /> Open</button>
    </div>
  );
}

function HealthRow({ label, filled, target, pill, sub }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <span style={{ flex: 1, color: 'var(--fg-2)' }}>{label}</span>
        <span className={`pill ${pill}`} style={{ fontSize: 10 }}>{(filled*100).toFixed(0)}% / {(target*100).toFixed(0)}%</span>
      </div>
      <div style={{ position: 'relative', height: 6, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: (filled*100)+'%', background: pill === 'ok' ? 'var(--ok)' : pill === 'warn' ? 'var(--warn)' : 'var(--err)', borderRadius: 99 }} />
        <div style={{ position: 'absolute', left: (target*100)+'%', top: -2, bottom: -2, width: 1.5, background: 'var(--fg-3)' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW CARD SHEET — surfaces SF /api/flashcards + /api/ai/ai_generate
// BUG-101: One-click AI add — no multi-step setup dialog before card.
// BUG-108: Inline validation on empty/invalid required input.
// BV-09: Manual Entry path creates card from typed fields.
// ─────────────────────────────────────────────────────────────────────────────

function NewCardSheet({ role, onClose, onCreated }) {
  // step: 'input' | 'generating' | 'manual'
  const [step, setStep] = React.useState('input');
  const [word, setWord] = React.useState('');
  const [wordError, setWordError] = React.useState(''); // BUG-108: inline validation
  const [lang, setLang] = React.useState('Greek');
  const [aiError, setAiError] = React.useState('');
  const [createdCard, setCreatedCard] = React.useState(null);
  // Manual entry state
  const [manualDef, setManualDef] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [manualError, setManualError] = React.useState('');

  // Ensure LANGUAGES are loaded (real objects with .id)
  React.useEffect(() => {
    const langs = window.BWTL.LANGUAGES;
    if (!Array.isArray(langs) || typeof langs[0] === 'string' || !langs[0]?.id) {
      window.BWTL.fetchLanguages().catch(() => {});
    }
  }, []);

  const langs = window.BWTL.LANGUAGES;

  // Resolve language UUID from current lang name
  const _getLangId = () => {
    const langsArr = window.BWTL.LANGUAGES;
    if (Array.isArray(langsArr) && langsArr[0]?.id) {
      const match = langsArr.find(l => l.name === lang || l.code === lang);
      return match?.id || null;
    }
    return null;
  };

  // BUG-101: Start AI immediately when user confirms word + language
  const startAi = async () => {
    if (step !== 'input') return; // BUG-101: guard against double-submit
    const trimmed = word.trim();
    if (!trimmed) {
      setWordError('Word or phrase is required.'); // BUG-108: inline validation
      return;
    }
    setWordError('');
    setAiError('');
    setStep('generating');
    const langId = _getLangId();
    if (!langId) {
      try { await window.BWTL.fetchLanguages(); } catch (_) {}
    }
    const resolvedId = _getLangId();
    if (!resolvedId) {
      setAiError('Language not found. Please try again.');
      setStep('input');
      return;
    }
    try {
      const card = await window.BWTL._apiFetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ word_or_phrase: trimmed, language_id: resolvedId }),
      });
      setCreatedCard(card);
      window.BWTL.FLASHCARDS[card.id] = card; // BUG-101: seed cache before reload event
      window.dispatchEvent(new CustomEvent('bwtl:card-reload', { detail: card.id }));
      onCreated(card.word_or_phrase || trimmed, lang);
    } catch (err) {
      setAiError(`AI generation failed: ${err.message}. You can try Manual Entry instead.`);
      setStep('input');
    }
  };

  // BV-09: Manual entry — POST minimal card from typed fields
  const submitManual = async () => {
    const trimmed = word.trim();
    if (!trimmed) { setManualError('Word or phrase is required.'); return; }
    setManualError('');
    setIsSubmitting(true);
    try {
      const langId = _getLangId();
      if (!langId) { await window.BWTL.fetchLanguages().catch(() => {}); }
      const resolvedId = _getLangId();
      if (!resolvedId) throw new Error('Language not found');
      await window.BWTL._apiFetch('/api/flashcards/', {
        method: 'POST',
        body: JSON.stringify({
          word_or_phrase: trimmed,
          definition: manualDef.trim() || undefined,
          language_id: resolvedId,
        }),
      });
      window.dispatchEvent(new CustomEvent('bwtl:card-reload'));
      onCreated(trimmed, lang);
    } catch (err) {
      setManualError(`Save failed: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" style={{
        top: '8vh', bottom: 'auto', left: '50%', transform: 'translateX(-50%)',
        width: 'min(600px, calc(100vw - 40px))',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 500 }}>
            {step === 'manual' ? 'Manual entry' : 'New flashcard'}
          </div>
          <button onClick={onClose} style={{ appearance: 'none', background: 'transparent', border: 0, color: 'var(--fg-3)', cursor: 'pointer' }}><Ic.x /></button>
        </div>

        <div style={{ padding: '20px 22px' }}>
          {/* Input step — word + language picker */}
          {(step === 'input') && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', display: 'block', marginBottom: 8 }}>Word or phrase</label>
                <input
                  autoFocus
                  value={word}
                  onChange={(e) => { setWord(e.target.value); if (wordError) setWordError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') startAi(); }}
                  placeholder={lang === 'Greek' ? 'e.g. ἀναμιμνῄσκω' : lang === 'French' ? 'e.g. souvenir' : 'e.g. memory'}
                  style={{
                    width: '100%', padding: '12px 16px', boxSizing: 'border-box',
                    background: wordError ? 'color-mix(in oklch, var(--err) 5%, var(--bg-1))' : 'var(--bg-1)',
                    border: '1px solid ' + (wordError ? 'var(--err)' : 'var(--line)'),
                    borderRadius: 'var(--r)',
                    color: 'var(--fg)', font: 'inherit',
                    fontFamily: 'var(--ff-display)', fontSize: 22,
                  }}
                />
                {/* BUG-108: inline validation feedback */}
                {wordError && (
                  <div style={{ fontSize: 12, color: 'var(--err)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Ic.spark style={{ width: 12, height: 12 }} /> {wordError}
                  </div>
                )}
                {aiError && (
                  <div style={{ fontSize: 12, color: 'var(--warn)', marginTop: 5 }}>{aiError}</div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', display: 'block', marginBottom: 8 }}>Language</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
                  {langs.map(l => (
                    <button key={l.code} onClick={() => setLang(l.name)} style={{
                      appearance: 'none', cursor: 'pointer',
                      border: '1px solid ' + (lang === l.name ? 'var(--acc-ring)' : 'var(--line)'),
                      background: lang === l.name ? 'var(--acc-bg)' : 'var(--bg-1)',
                      color: lang === l.name ? 'var(--fg)' : 'var(--fg-2)',
                      padding: '8px 10px', borderRadius: 8, fontFamily: 'inherit', textAlign: 'left',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn ghost" onClick={onClose}>Cancel</button>
                <button className="btn ghost" onClick={() => { if (!word.trim()) { setWordError('Word or phrase is required.'); return; } setWordError(''); setStep('manual'); }}>Manual entry</button>
                <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={startAi}>
                  <Ic.spark /> Add with AI
                </button>
              </div>
            </div>
          )}

          {/* Generating — brief notice while AI runs */}
          {step === 'generating' && (
            <div style={{ textAlign: 'center', padding: '32px 0', display: 'grid', gap: 16 }}>
              <div>
                <div className="display" style={{ fontSize: 32, color: 'var(--fg)' }}>{word}</div>
                <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4 }}>{lang}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14, color: 'var(--fg-2)' }}>
                <span className="dot warn" /> Using AI generation…
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-4)' }}>
                Generating etymology, PIE root, IPA, cognates and wiring to EFG. This takes ~10s.
              </div>
            </div>
          )}

          {/* Manual entry form — BV-09 */}
          {step === 'manual' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', display: 'block', marginBottom: 6 }}>Word or phrase</label>
                <input value={word} onChange={(e) => { setWord(e.target.value); if (manualError) setManualError(''); }}
                  placeholder="Enter word or phrase" style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--fg)', font: 'inherit', fontSize: 18 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', display: 'block', marginBottom: 6 }}>Definition (optional)</label>
                <textarea value={manualDef} onChange={(e) => setManualDef(e.target.value)} rows={3}
                  placeholder="Enter definition" style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--fg)', font: 'inherit', fontSize: 14, resize: 'vertical' }} />
              </div>
              {manualError && <div style={{ fontSize: 12, color: 'var(--err)' }}>{manualError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn ghost" onClick={() => { setStep('input'); setManualError(''); }}>← Back</button>
                <button className="btn primary" style={{ marginLeft: 'auto' }} disabled={isSubmitting} onClick={submitManual}>
                  <Ic.check /> {isSubmitting ? 'Saving…' : 'Create card'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// PassphraseModal — extracted component; fixes React #310 hook-count crash (BUG-130)
// BUG-131: autoComplete + name attrs prevent Chrome from logging the value.
// ─────────────────────────────────────────────────────────────────────────────
function PassphraseModal({ passphraseInput, setPassphraseInput, passphraseError, passphraseLoading, onSubmit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-0)' }}>
      <div className="card card-body" style={{ padding: 32, maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <div className="display" style={{ fontSize: 22, marginBottom: 6 }}>BWTL</div>
        <div style={{ fontSize: 13, color: 'var(--fg-3)', marginBottom: 24 }}>Enter the session passphrase to continue.</div>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="password"
            name="passphrase"
            autoComplete="current-password"
            value={passphraseInput}
            onChange={e => setPassphraseInput(e.target.value)}
            placeholder="Passphrase"
            autoFocus
            style={{ padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--fg)', fontSize: 14, outline: 'none' }}
          />
          {passphraseError && <div style={{ fontSize: 12, color: 'var(--danger, #e55)' }}>{passphraseError}</div>}
          <button className="btn primary" type="submit" disabled={!passphraseInput || passphraseLoading}>
            {passphraseLoading ? 'Authenticating…' : 'Continue →'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppGate — holds auth state; renders PassphraseModal or App (BUG-130)
// ─────────────────────────────────────────────────────────────────────────────
function AppGate() {
  const [authRequired, setAuthRequired] = React.useState(!window.BWTL._getToken());
  const [passphraseInput, setPassphraseInput] = React.useState('');
  const [passphraseError, setPassphraseError] = React.useState('');
  const [passphraseLoading, setPassphraseLoading] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setAuthRequired(true);
    window.addEventListener('bwtl:auth-required', handler);
    return () => window.removeEventListener('bwtl:auth-required', handler);
  }, []);

  const handlePassphraseSubmit = async (e) => {
    e.preventDefault();
    setPassphraseLoading(true);
    setPassphraseError('');
    try {
      await window.BWTL.bwtlLogin(passphraseInput);
      setAuthRequired(false);
      setPassphraseInput('');
    } catch (err) {
      setPassphraseError('Incorrect passphrase — try again.');
    } finally {
      setPassphraseLoading(false);
    }
  };

  if (authRequired) {
    return (
      <PassphraseModal
        passphraseInput={passphraseInput}
        setPassphraseInput={setPassphraseInput}
        passphraseError={passphraseError}
        passphraseLoading={passphraseLoading}
        onSubmit={handlePassphraseSubmit}
      />
    );
  }
  return <App />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppGate />);
