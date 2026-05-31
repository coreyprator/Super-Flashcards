// GENERATE — ArtForge etymology-only surface.
// Tabs: Jobs (history) · From word · From figure · Storyboard editor

function GenerateView({ cardId, role }) {
  const [tab, setTab] = React.useState('jobs');
  return (
    <div style={{ padding: '18px 20px 200px', maxWidth: 1640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 20 }}>
        <div>
          <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Generate</h1>
          <p style={{ color: 'var(--fg-3)', margin: '4px 0 0', fontSize: 13, maxWidth: '70ch' }}>
            ArtForge pipeline — etymology-driven generation only. Full ArtForge (galleries, library, non-etymology projects) lives at <span className="mono" style={{ color: 'var(--forge)' }}>artforge.rentyourcio.com</span>.
          </p>
        </div>
        <a className="btn ghost" href="#" target="_blank"><Ic.link /> Open standalone ArtForge</a>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--line)' }}>
        {[
          ['jobs',       'Jobs',       window.BWTL.AF_JOBS.length],
          ['from_word',  'From word',  null],
          ['from_figure','From figure',null],
          ['scenes',     'Scene editor', null],
          ['enrich',     'Enrich story', null],
        ].map(([k, lab, n]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer',
            padding: '10px 14px', borderBottom: '2px solid ' + (tab === k ? 'var(--forge)' : 'transparent'),
            marginBottom: -1, color: tab === k ? 'var(--fg)' : 'var(--fg-3)',
            fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 7,
          }}>
            {lab} {n !== null && <span className="mono" style={{ fontSize: 10, color: 'var(--fg-5)' }}>{n}</span>}
          </button>
        ))}
      </div>

      {tab === 'jobs'        && <JobsTab />}
      {tab === 'from_word'   && <FromWordTab cardId={cardId} />}
      {tab === 'from_figure' && <FromFigureTab />}
      {tab === 'scenes'      && <SceneEditorTab />}
      {tab === 'enrich'      && <EnrichTab />}
    </div>
  );
}

function JobsTab() {
  const jobs = window.BWTL.AF_JOBS;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span className="pill forge" style={{ fontSize: 10.5 }}>ArtForge · /api/external/jobs</span>
        <span className="pill ok" style={{ fontSize: 10.5 }}><span className="dot ok" /> {jobs.filter(j => j.status === 'done').length} done</span>
        <span className="pill warn" style={{ fontSize: 10.5 }}>{jobs.filter(j => j.status === 'rendering' || j.status === 'queued').length} active</span>
        <span className="pill err" style={{ fontSize: 10.5 }}>{jobs.filter(j => j.status === 'failed').length} failed</span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {jobs.map(j => (
          <div key={j.id} className="card" style={{ padding: 0 }}>
            <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '140px 1fr 160px 220px 100px auto', gap: 14, alignItems: 'center' }}>
              <span className={`pill ${j.status === 'done' ? 'ok' : j.status === 'failed' ? 'err' : j.status === 'rendering' ? 'warn' : 'ghost'}`} style={{ fontSize: 10, width: 'fit-content' }}>
                <span className={`dot ${j.status === 'done' ? 'ok' : j.status === 'failed' ? 'err' : j.status === 'rendering' ? 'warn' : ''}`} />
                {j.status}
              </span>
              <div>
                <div style={{ fontSize: 13 }}>
                  <span style={{ color: 'var(--fg-2)' }}>{j.kind.replace('_', ' ')}</span>
                  <span style={{ color: 'var(--fg)', marginLeft: 8, fontWeight: 600 }}>{j.subject}</span>
                </div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-5)', marginTop: 2 }}>{j.source}</div>
                {j.error && <div style={{ fontSize: 11, color: 'var(--err)', marginTop: 4 }}>{j.error}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{j.model}</span>
                {j.scenes && <span style={{ fontSize: 11, color: 'var(--fg-4)' }}>· {j.scenes} scenes</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{j.started} {j.eta && <>· eta {j.eta}</>}{j.duration && <>· {j.duration}</>}</div>
                {j.status === 'rendering' && (
                  <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: (j.progress * 100) + '%', height: '100%', background: 'var(--forge)' }} />
                  </div>
                )}
              </div>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-5)' }}>{j.id}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {j.status === 'done' && <button className="btn xs"><Ic.play /></button>}
                {j.status === 'failed' && <button className="btn xs ghost"><Ic.refresh /></button>}
                <button className="btn xs ghost"><Ic.more /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FromWordTab({ cardId }) {
  const card = window.BWTL.FLASHCARDS[cardId] || window.BWTL.FLASHCARDS.fc_souvenir;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-soft)', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Subject</div>
        <div style={{ padding: 14 }}>
          <div className="display" style={{ fontSize: 32 }}>{card.word}</div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{card.ipa}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 8 }}>{card.definition}</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <span className="pill pie" style={{ fontSize: 9.5 }}>{card.pie_root}</span>
            <span className="pill ghost" style={{ fontSize: 9.5 }}>{card.language}</span>
          </div>
          <button className="btn sm ghost" style={{ marginTop: 12 }}><Ic.shuffle /> Change subject</button>
        </div>
      </div>
      <div className="card card-body" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 6 }}>Style</div>
            <div style={{ display: 'grid', gap: 4 }}>
              {['classical (Hesiodic)','symbolic / minimal','photoreal','animated diagram'].map((s, i) => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: i === 0 ? 'var(--bg-3)' : 'var(--bg-2)', border: '1px solid ' + (i === 0 ? 'var(--forge-ring)' : 'var(--line-soft)'), cursor: 'pointer', fontSize: 12 }}>
                  <input type="radio" name="style" defaultChecked={i === 0} /> {s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 6 }}>Length</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['3 scenes (12s)','5 scenes (22s)','7 scenes (40s)'].map((s, i) => (
                <button key={s} className="btn xs ghost" style={{ background: i === 0 ? 'var(--bg-3)' : 'transparent' }}>{s}</button>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', margin: '12px 0 6px' }}>Embed etymology</div>
            <div style={{ display: 'grid', gap: 4, fontSize: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" defaultChecked /> Show PIE root visually</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" defaultChecked /> Voiceover with IPA narration</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" /> Side-card cognate sequence</label>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--fg-2)' }}>Will hit:</strong> <span className="mono" style={{ color: 'var(--forge)' }}>POST artforge /api/external/generate-video</span> with embedded {card.pie_root} context · poll <span className="mono">GET /api/external/jobs/{'{'}id{'}'}</span> · result stored in <span className="mono">SF.flashcards.video_url</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn ghost"><Ic.pencil /> Scene editor first</button>
          <button className="btn primary" style={{ '--b-bg': 'var(--forge)', '--b-fg': '#0b0918', '--b-bd': 'var(--forge)' }}><Ic.spark /> Generate</button>
        </div>
      </div>
    </div>
  );
}

function FromFigureTab() {
  const figures = Object.values(window.BWTL.FIGURES);
  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 14 }}>
        Generate a 5-scene story for a mythological figure. Hits <span className="mono" style={{ color: 'var(--forge)' }}>POST /api/v1/stories/from-figure</span> with figure name, Greek name, domain, origin story, etymology.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {[
          ...figures,
          { id: 'apollon', english_name: 'Apollon', greek_name: 'Ἀπόλλων', figure_type: 'Olympian', domain: 'music, prophecy', image_caption: 'lyre player' },
          { id: 'zeus', english_name: 'Zeus', greek_name: 'Ζεύς', figure_type: 'Olympian', domain: 'sky, thunder', image_caption: 'thunderbolt' },
          { id: 'athena', english_name: 'Athena', greek_name: 'Ἀθηνᾶ', figure_type: 'Olympian', domain: 'wisdom, craft', image_caption: 'owl & spear' },
        ].map(f => (
          <div key={f.id} className="card" style={{ cursor: 'pointer' }}>
            <div style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, var(--myth-bg), var(--forge-bg))', borderBottom: '1px solid var(--line-soft)', display: 'flex', alignItems: 'flex-end', padding: 8, fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--fg-4)' }}>
              {f.image_caption || 'placeholder'}
            </div>
            <div style={{ padding: 10 }}>
              <div className="display" style={{ fontSize: 16, color: 'var(--myth)' }}>{f.english_name}</div>
              <div className="greek" style={{ fontSize: 12, color: 'var(--fg-2)' }}>{f.greek_name}</div>
              <button className="btn xs primary" style={{ marginTop: 8, '--b-bg': 'var(--forge)', '--b-fg': '#0b0918', '--b-bd': 'var(--forge)' }}><Ic.spark /> Generate story</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SceneEditorTab() {
  const scenes = [
    { id: 1, title: 'Inception',    prompt: 'A weathered Titan, Mnemosyne, sits beside a still pool in Pieria at dusk. Long shadows.', tts: 'In Pieria, Mnemosyne sits…', model: 'veo-3' },
    { id: 2, title: 'Encounter',    prompt: 'Zeus, in mortal aspect, approaches; the air thickens with ritual silence.', tts: 'Zeus descended in mortal aspect…', model: 'veo-3' },
    { id: 3, title: 'Nine nights',  prompt: 'Time-lapse of nine moons crossing the sky over a single still figure.', tts: 'For nine nights, time pooled…', model: 'veo-3' },
    { id: 4, title: 'The Muses',    prompt: 'Nine young women emerge from a forest spring carrying instruments and scrolls.', tts: 'And then, nine sisters…', model: 'veo-3' },
    { id: 5, title: 'Coda',         prompt: 'Cut to a modern hand writing the Greek word μνήμη; fade.', tts: 'From her, everything we remember.', model: 'veo-3' },
  ];
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span className="display" style={{ fontSize: 18 }}>Story: Mnemosyne</span>
          <span style={{ fontSize: 11, color: 'var(--fg-4)' }} className="mono">story_47c0b1a · 5 scenes · etymology context: *men-</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn sm ghost"><Ic.plus /> Add scene</button>
          <button className="btn sm primary" style={{ '--b-bg': 'var(--forge)', '--b-fg': '#0b0918', '--b-bd': 'var(--forge)' }}><Ic.spark /> Render all</button>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {scenes.map(s => (
          <div key={s.id} className="card" style={{ padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 200px', gap: 12 }}>
              <div style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, var(--forge-bg), var(--bg-3))', display: 'flex', alignItems: 'flex-end', padding: 8, fontFamily: 'var(--ff-mono)', fontSize: 9, color: 'var(--fg-4)' }}>scene {s.id} preview</div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Scene {s.id} · {s.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.5 }}>{s.prompt}</div>
                <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--fg-3)' }}>
                  <span style={{ color: 'var(--fg-4)', fontFamily: 'var(--ff-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>VO ▸ </span>
                  "{s.tts}"
                </div>
              </div>
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{s.model}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn xs ghost"><Ic.refresh /></button>
                  <button className="btn xs ghost"><Ic.spark /></button>
                  <button className="btn xs ghost"><Ic.more /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EnrichTab() {
  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 14, lineHeight: 1.6 }}>
        Embed Etymython facts into an existing ArtForge story. Hits <span className="mono" style={{ color: 'var(--forge)' }}>POST /api/stories/{'{'}id{'}'}/enrich</span> · pulls suggestions from <span className="mono" style={{ color: 'var(--forge)' }}>GET /etymology-suggestions</span>.
      </div>
      <div className="card card-body" style={{ padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 10 }}>Suggested embeds</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            { fact: 'Mnemosyne is the mother of the nine Muses by Zeus over nine consecutive nights.', confidence: 0.94, source: 'EM.fun_facts · figure mnemosyne' },
            { fact: 'In the underworld, initiates drink from Mnemosyne to retain knowledge — opposite of Lethe.', confidence: 0.88, source: 'EM.fun_facts · figure mnemosyne' },
            { fact: '*men- "to think" gives both her name and the English word "memory".', confidence: 0.97, source: 'EFG.efg_pie_explorer_data · *men-' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: 10, padding: '10px 12px', background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 6, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>{s.fact}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-5)', marginTop: 4 }}>{s.source}</div>
              </div>
              <span className="pill ok" style={{ fontSize: 10 }}><span className="dot ok" />{(s.confidence * 100).toFixed(0)}%</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn xs ghost"><Ic.x /></button>
                <button className="btn xs primary"><Ic.check /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

window.GenerateView = GenerateView;
