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

function buildTrail(section, sub, view) {
  if (section === 'study') {
    const subLab = { queue: 'Queue', card: 'Word study', pronunciation: 'Pronunciation', shadowing: 'Shadowing' }[sub];
    if (sub === 'card' && view?.id) {
      const c = window.BWTL.FLASHCARDS[view.id];
      return [
        { label: 'Study', go: { section: 'study', sub: 'queue' } },
        { label: 'Word study', go: { section: 'study', sub: 'card' } },
        { label: c?.word || view.id, here: true },
      ];
    }
    return [{ label: 'Study', go: { section: 'study', sub: 'queue' } }, { label: subLab, here: true }];
  }
  if (section === 'library')   return [{ label: 'Library', here: true }];
  if (section === 'generate')  return [{ label: 'Generate', here: true }];
  if (section === 'bookmarks') return [{ label: 'Bookmarks', here: true }];
  if (section === 'theodoros') return [{ label: 'Theodoros', here: true }];
  if (section === 'admin')     return [{ label: 'Admin', here: true }];
  if (section === 'settings')  return [{ label: 'Settings', here: true }];
  return [];
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [mode, setMode] = React.useState('proto'); // proto | spec
  const [role, setRole] = React.useState('pl');
  const [section, setSection] = React.useState('study');
  const [sub, setSub] = React.useState('card');  // study sub-view: queue|card|pronunciation|shadowing
  const [view, setView] = React.useState({ kind: 'card', id: null });
  const [createOpen, setCreateOpen] = React.useState(false);

  // ── auth state ──────────────────────────────────────────────────────────
  const [authed, setAuthed] = React.useState(() => !!localStorage.getItem('access_token'));

  // ── URL-based routing on mount ───────────────────────────────────────────
  React.useEffect(() => {
    // Pick up OAuth token dropped by /api/auth/google/callback redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      const tok = params.get('token');
      if (tok) {
        localStorage.setItem('access_token', tok);
        setAuthed(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    const path = window.location.pathname;
    const cardMatch = path.match(/^\/bwtl\/study\/card\/([^/]+)/);
    if (cardMatch) {
      setSection('study'); setSub('card'); setView({ kind: 'card', id: cardMatch[1] });
    } else if (/^\/bwtl\/library/.test(path)) {
      setSection('library');
    } else if (/^\/bwtl\/bookmarks/.test(path)) {
      setSection('bookmarks');
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

  // ── prefetch study queue on boot (BV-012) ────────────────────────────────
  React.useEffect(() => {
    window.BWTL.fetchStudyDue().catch(() => {});
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    setAuthed(false);
  };

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

  // ── navigate to a different card ─────────────────────────────────────────
  const navigateWord = (cardId) => {
    if (!cardId) return;
    setView({ kind: 'card', id: cardId });
    setSection('study');
    setSub('card');
    setPanelState(p => ({ ...p, pie: 'open' }));
    setActiveThreadId(null);
  };

  // ── open figure detail (drill from fun fact) ─────────────────────────────
  const openFigure = (figureId) => {
    setPanelState(p => ({ ...p, myth: 'open' }));
  };

  // ── chat Accept → audit log (REV item 4 / 5) ────────────────────────────
  // No review queue. Each Accept writes directly and appends an audit row.
  const onPromote = (payload) => {
    const fieldMeta = window.BWTL.PROMOTE_FIELDS.find(f => f.key === payload.field);
    showToast(`Accepted to ${window.BWTL.FLASHCARDS[payload.card]?.word || payload.card} · ${fieldMeta?.label || payload.field}`);
  };

  // ── toast (lightweight) ──────────────────────────────────────────────────
  const [toast, setToast] = React.useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  // Global event hooks — StudyToolbar and AiEditButton dispatch these.
  React.useEffect(() => {
    const onCreate = () => setCreateOpen(true);
    const onToast = (e) => showToast(e.detail);
    window.addEventListener('bwtl:open-create', onCreate);
    window.addEventListener('bwtl:toast', onToast);
    return () => {
      window.removeEventListener('bwtl:open-create', onCreate);
      window.removeEventListener('bwtl:toast', onToast);
    };
  }, []);

  const trail = buildTrail(section, sub, view);

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
              section={section} setSection={(s) => { setSection(s); if (s === 'study') setSub('queue'); }}
              sub={sub} setSub={setSub}
              role={role} setRole={setRole}
              canSeeAdmin={canSeeAdmin}
              roleMenuOpen={roleMenuOpen} setRoleMenuOpen={setRoleMenuOpen}
              onNavigateWord={navigateWord}
              authed={authed} onLogout={handleLogout} />
            {trail.length > 0 && <Crumbs trail={trail} go={(g) => { if (g.section) setSection(g.section); if (g.sub) setSub(g.sub); }} />}
            <div className="main-area">
              {section === 'study' && sub === 'queue' && <StudyQueueView onNavigateWord={navigateWord} />}
              {section === 'study' && sub === 'pronunciation' && <PronunciationView />}
              {section === 'study' && sub === 'shadowing' && <ShadowingView />}
              {section === 'study' && sub === 'card' && (
                <Workspace
                  cardId={view.id}
                  role={role}
                  onNavigateWord={navigateWord}
                  onOpenFigure={openFigure}
                  panelState={panelState}
                  setPanelState={setPanelState}
                  glowedPanel={glowedPanel}
                  triggerGlow={triggerGlow}
                  expandedChat={expandedChat}
                  setExpandedChat={setExpandedChat}
                  activeThreadId={activeThreadId}
                  setActiveThreadId={setActiveThreadId}
                  onPromote={onPromote} />
              )}
              {section === 'library'   && <LibraryView onNavigateWord={navigateWord} onOpenFigure={openFigure} role={role} />}
              {section === 'generate'  && <GenerateView cardId={view.id} role={role} />}
              {section === 'bookmarks' && <BookmarksView />}
              {section === 'theodoros' && (
                <TheodorosView
                  onAccept={(item) => showToast(`Accepted · ${item.field}`)}
                  onReject={(item) => showToast(`Rejected · ${item.id}`)}
                  onNavigateWord={navigateWord} />
              )}
              {section === 'admin' && canSeeAdmin && <AdminView role={role} />}
              {section === 'admin' && !canSeeAdmin && (
                <div style={{ padding: 40, color: 'var(--fg-3)' }}>
                  Admin surfaces are PL-only.
                </div>
              )}
              {section === 'settings' && <SettingsView role={role} />}
            </div>
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

function TopBar({ section, setSection, sub, setSub, role, setRole, canSeeAdmin, roleMenuOpen, setRoleMenuOpen, onNavigateWord, authed, onLogout }) {
  const r = window.BWTL.ROLES[role];
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className="brand">
            <div className="brand-mark" />
            <div>
              <div>Bring Words to Life</div>
              <div className="brand-sub">Unified · BWTL01 · v0.2 · REV-1</div>
            </div>
          </div>

          {/* primary nav */}
          <div style={{ display: 'inline-flex', gap: 2, padding: 4, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10 }}>
            {[
              ['study',     'Study',     <Ic.book />,        null],
              ['library',   'Library',   <Ic.grid />,        null],
              ['generate',  'Generate',  <Ic.film />,        null],
              ['bookmarks', 'Bookmarks', <Ic.bookmark />,    null],
              ['theodoros', 'Chat',      <Ic.chat />,        Object.values(window.BWTL.CHAT_THREADS).reduce((a, x) => a + x.length, 0)],
              canSeeAdmin ? ['admin', 'Admin', <Ic.spark />, null] : null,
              ['settings',  'Settings',  null,               null],
            ].filter(Boolean).map(([k, lab, icon, badge]) => (
              <button
                key={k}
                onClick={() => setSection(k)}
                title={k === 'theodoros' ? 'Cross-app chat index — all threads across cards, audit log of accepted insights, new cards, batch jobs' : k === 'bookmarks' ? 'Saved words, PIE roots, figures, threads, and class collections' : ''}
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

        {/* universal search */}
        <div className="search">
          <Ic.search />
          <input placeholder="Search a word, PIE root, figure, or thread — across all apps…" />
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

          <button className="btn sm ghost" title="Bookmarks rail">
            <Ic.bookmark /> <span style={{ color: 'var(--fg-3)' }}>{window.BWTL.BOOKMARKS.length}</span>
          </button>

          {authed ? (
            <button
              className="btn sm ghost"
              title="Sign out"
              onClick={onLogout}
              style={{ color: 'var(--fg-3)', fontSize: 12 }}
            >
              Sign out
            </button>
          ) : (
            <a
              href="/api/auth/google/login"
              className="btn sm primary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Sign in with Google to use AI Chat and save progress"
            >
              Sign in
            </a>
          )}

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

      {/* Study sub-nav */}
      {section === 'study' && (
        <div style={{ borderTop: '1px solid var(--line-soft)', padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          {[
            ['queue',         'Today’s queue', <Ic.flame />],
            ['card',          'Word study',    <Ic.book />],
            ['pronunciation', 'Pronunciation', <Ic.voice />],
            ['shadowing',     'Shadowing',     <Ic.speaker />],
          ].map(([k, lab, icon]) => (
            <button
              key={k}
              onClick={() => setSub(k)}
              style={{
                appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
                padding: '5px 10px', borderRadius: 6,
                color: sub === k ? 'var(--fg)' : 'var(--fg-3)',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
              {sub === k && <span style={{ width: 4, height: 4, borderRadius: 99, background: 'var(--acc)' }} />}
              {icon} {lab}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-4)' }}>
            Click any <span className="pill pie" style={{ fontSize: 9 }}>PIE root</span>, <span className="pill myth" style={{ fontSize: 9 }}>figure</span>, or cognate to drill in · click the <Ic.spark style={{ verticalAlign: '-2px' }} /> on any field to edit with AI
          </span>
        </div>
      )}
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
          <button className="btn sm ghost" style={{ marginTop: 10 }}>Manage voice clones</button>
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
// 3-step flow: type word + pick language → AI fills everything → review/save
// ─────────────────────────────────────────────────────────────────────────────

function NewCardSheet({ role, onClose, onCreated }) {
  const [step, setStep] = React.useState(1);
  const [word, setWord] = React.useState('');
  const [lang, setLang] = React.useState('Greek');
  const [aiStage, setAiStage] = React.useState('idle'); // idle | running | done
  const [progress, setProgress] = React.useState([]);

  const langs = window.BWTL.LANGUAGES;

  const runAi = () => {
    setAiStage('running');
    setProgress([]);
    const steps = [
      { lab: 'Looking up Beekes via Portfolio RAG', endpoint: 'GET rag/search/etymology', t: 700 },
      { lab: 'Etymology + PIE root',                endpoint: 'POST /api/ai/generate',     t: 1500 },
      { lab: 'IPA transcription',                   endpoint: 'POST /api/v1/pronunciation', t: 800 },
      { lab: 'English cognates + cross-link',       endpoint: 'POST /api/ai/generate',     t: 1100 },
      { lab: 'Fun facts (Etymython link check)',    endpoint: 'GET em/cognates/lookup',     t: 900 },
      { lab: 'TTS audio',                           endpoint: 'POST /api/audio/tts',        t: 1000 },
      { lab: 'Wire to EFG node',                    endpoint: 'POST efg /api/nodes',        t: 600 },
    ];
    let acc = 0;
    steps.forEach((s, i) => {
      acc += s.t;
      setTimeout(() => {
        setProgress(p => [...p, { ...s, done: true }]);
        if (i === steps.length - 1) {
          setTimeout(() => setAiStage('done'), 200);
        }
      }, acc);
    });
  };

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" style={{
        top: '8vh', bottom: '8vh', left: '50%', transform: 'translateX(-50%)',
        width: 'min(720px, calc(100vw - 40px))',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--ff-display)', fontSize: 22, fontWeight: 500 }}>New flashcard</div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 2 }}>
              <span className="mono">POST /api/flashcards</span> + <span className="mono">POST /api/ai/ai_generate</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--fg-3)' }}>
            {[1, 2, 3].map(n => (
              <React.Fragment key={n}>
                <span style={{
                  width: 22, height: 22, borderRadius: 99,
                  background: step >= n ? 'var(--acc-bg)' : 'var(--bg-3)',
                  border: '1px solid ' + (step >= n ? 'var(--acc-ring)' : 'var(--line)'),
                  color: step >= n ? 'var(--acc-2)' : 'var(--fg-4)',
                  display: 'inline-grid', placeItems: 'center',
                  fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 700,
                }}>{n}</span>
                {n < 3 && <span style={{ width: 24, height: 1, background: step > n ? 'var(--acc-ring)' : 'var(--line)' }} />}
              </React.Fragment>
            ))}
            <button onClick={onClose} style={{ marginLeft: 12, appearance: 'none', background: 'transparent', border: 0, color: 'var(--fg-3)', cursor: 'pointer' }}><Ic.x /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {step === 1 && (
            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', display: 'block', marginBottom: 8 }}>Word or phrase</label>
                <input
                  autoFocus
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder={lang === 'Greek' ? 'e.g. ἀναμιμνῄσκω' : lang === 'French' ? 'e.g. souvenir' : 'e.g. memory'}
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: 'var(--bg-1)', border: '1px solid var(--line)',
                    borderRadius: 'var(--r)',
                    color: 'var(--fg)', font: 'inherit',
                    fontFamily: 'var(--ff-display)', fontSize: 24, letterSpacing: '-0.01em',
                  }}
                />
                <div style={{ fontSize: 11.5, color: 'var(--fg-4)', marginTop: 6 }}>
                  Goes into <span className="mono" style={{ color: 'var(--acc-2)' }}>SF.flashcards.word_or_phrase</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', display: 'block', marginBottom: 8 }}>Language</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {langs.map(l => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.name)}
                      style={{
                        appearance: 'none', cursor: 'pointer',
                        border: '1px solid ' + (lang === l.name ? 'var(--acc-ring)' : 'var(--line)'),
                        background: lang === l.name ? 'var(--acc-bg)' : 'var(--bg-1)',
                        color: lang === l.name ? 'var(--fg)' : 'var(--fg-2)',
                        padding: '10px 12px', borderRadius: 8,
                        fontFamily: 'inherit', textAlign: 'left',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--fg-4)', marginTop: 2 }} className="mono">{l.total} cards</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', display: 'block', marginBottom: 8 }}>Card type</label>
                <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: 8 }}>
                  {[['word', 'Word'], ['sentence', 'Sentence (250 in library)']].map(([k, lab]) => (
                    <button key={k} className="btn xs ghost" style={{ background: k === 'word' ? 'var(--bg-4)' : 'transparent', color: k === 'word' ? 'var(--fg)' : 'var(--fg-3)' }}>{lab}</button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--bg-1)', border: '1px dashed var(--line)', borderRadius: 8, padding: 14, fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--fg-2)' }}>Or bulk import →</strong> <span className="mono" style={{ color: 'var(--acc-2)' }}>POST /api/document/parse</span> · paste a Greek text or upload a PDF; the document parser extracts vocabulary and you approve in batch.
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div className="display" style={{ fontSize: 36 }}>{word || 'souvenir'}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>{lang}</div>
              </div>
              <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Ic.spark style={{ color: 'var(--acc)' }} /> AI fill pipeline
                  {aiStage === 'running' && <span className="dot warn" style={{ marginLeft: 'auto' }} />}
                  {aiStage === 'done' && <span className="pill ok" style={{ fontSize: 9.5, marginLeft: 'auto' }}><span className="dot ok" /> all done</span>}
                </div>
                <div style={{ display: 'grid', gap: 5 }}>
                  {[
                    'Looking up Beekes via Portfolio RAG',
                    'Etymology + PIE root',
                    'IPA transcription',
                    'English cognates + cross-link',
                    'Fun facts (Etymython link check)',
                    'TTS audio',
                    'Wire to EFG node',
                  ].map((lab, i) => {
                    const done = progress[i]?.done;
                    return (
                      <div key={lab} style={{
                        display: 'grid', gridTemplateColumns: '18px 1fr auto',
                        alignItems: 'center', gap: 10,
                        padding: '6px 10px', borderRadius: 5,
                        background: done ? 'color-mix(in oklch, var(--ok) 5%, transparent)' : 'transparent',
                        fontSize: 12,
                        color: done ? 'var(--fg-2)' : 'var(--fg-4)',
                      }}>
                        {done ? <Ic.check style={{ color: 'var(--ok)' }} /> : aiStage === 'running' && i === progress.length ? <span className="dot warn" /> : <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--fg-5)' }} />}
                        <span>{lab}</span>
                        <span className="mono" style={{ fontSize: 9.5, color: 'var(--fg-5)' }}>{progress[i]?.endpoint || ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {aiStage === 'idle' && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn ghost"><Ic.edit /> Fill manually instead</button>
                  <button className="btn primary" onClick={runAi}><Ic.spark /> Run AI fill</button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  aspectRatio: '1/1', borderRadius: 'var(--r)',
                  background: 'linear-gradient(135deg, var(--myth-bg), var(--pie-bg))',
                  border: '1px dashed var(--line)',
                  display: 'flex', alignItems: 'flex-end', padding: 6,
                  fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--fg-4)',
                }}>placeholder · awaiting upload</div>
                <div>
                  <div className="display" style={{ fontSize: 32 }}>{word || 'souvenir'}</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>/su.və.niʁ/</div>
                  <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 6 }}>A memory; a keepsake.</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span className="pill pie" style={{ fontSize: 9.5 }}>*gʷem-</span>
                    <span className="pill graph" style={{ fontSize: 9.5 }}>5 cognates</span>
                    <span className="pill myth" style={{ fontSize: 9.5 }}>1 fun fact</span>
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--bg-1)', border: '1px solid color-mix(in oklch, var(--ok) 30%, var(--line))', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ok)', marginBottom: 6 }}>Review before save</div>
                Every field has a spark <Ic.spark style={{ verticalAlign: '-2px', color: 'var(--acc)' }} /> next to it on the card — you can re-roll any field individually after save, or send it to Theodoros for approval if you're not in admin role.
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <div style={{ flex: 1 }} />
          {step > 1 && <button className="btn ghost" onClick={() => setStep(s => s - 1)}>← Back</button>}
          {step === 1 && <button className="btn primary" disabled={!word.trim()} onClick={() => setStep(2)}>Next: AI fill →</button>}
          {step === 2 && aiStage === 'done' && <button className="btn primary" onClick={() => setStep(3)}>Next: Review →</button>}
          {step === 3 && <button className="btn primary" onClick={() => onCreated(word || 'souvenir', lang)}><Ic.check /> Create card</button>}
        </div>
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
