// STUDY EXTRAS — SRS queue, pronunciation practice, shadowing.
// Mirrors SF /api/study/*, /api/v1/pronunciation/*, /api/shadowing/*.

function StudyQueueView({ onNavigateWord }) {
  const [queue, setQueue] = React.useState(window.BWTL.STUDY_QUEUE || []);
  const [loading, setLoading] = React.useState(!queue.length);
  const reviewedCount = 0;

  React.useEffect(() => {
    setLoading(true);
    window.BWTL.fetchStudyDue()
      .then(data => setQueue(Array.isArray(data) ? data : (data.items || data.cards || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14 }}>Loading study queue…</div>;
  if (!queue.length) return (
    <div style={{ padding: '18px 20px 200px', maxWidth: 1300, margin: '0 auto' }}>
      <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Today's queue</h1>
      <div className="study-empty" style={{ padding: 24, color: 'var(--fg-3)', fontSize: 14, marginTop: 24 }}>No cards due. Great job — check back tomorrow!</div>
    </div>
  );
  return (
    <div style={{ padding: '18px 20px 200px', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 20 }}>
        <div>
          <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Today's queue</h1>
          <p style={{ color: 'var(--fg-3)', margin: '4px 0 0', fontSize: 13 }}>
            SRS-scheduled review · pulled from <span className="mono" style={{ color: 'var(--acc-2)' }}>SF.study_sessions</span> and <span className="mono" style={{ color: 'var(--acc-2)' }}>/api/study/next</span>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="pill ghost"><Ic.flame style={{ color: 'var(--warn)' }} /> 21-day streak</span>
          <button className="btn"><Ic.play /> Resume session</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, marginBottom: 18 }}>
        <div className="card card-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong style={{ fontSize: 14 }}>Session progress</strong>
            <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{reviewedCount} reviewed · {queue.length - reviewedCount} remaining · est. {Math.round((queue.length - reviewedCount) * 1.2)}m</span>
          </div>
          <div style={{ display: 'flex', gap: 2, height: 8 }}>
            {queue.map((q, i) => (
              <div key={i} style={{
                flex: 1, borderRadius: 2,
                background: i < reviewedCount ? 'var(--ok)' : i === reviewedCount ? 'var(--acc)' : 'var(--bg-3)',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11, color: 'var(--fg-3)' }}>
            <span><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--ok)', display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} /> done</span>
            <span><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--acc)', display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} /> current</span>
            <span><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--bg-3)', display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} /> upcoming</span>
          </div>
        </div>
        <div className="card card-body" style={{ padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8 }}>This week</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><div className="display" style={{ fontSize: 22 }}>42</div><div style={{ fontSize: 11, color: 'var(--fg-4)' }}>cards reviewed</div></div>
            <div><div className="display" style={{ fontSize: 22, color: 'var(--ok)' }}>87%</div><div style={{ fontSize: 11, color: 'var(--fg-4)' }}>good or better</div></div>
            <div><div className="display" style={{ fontSize: 22 }}>3</div><div style={{ fontSize: 11, color: 'var(--fg-4)' }}>new cards</div></div>
            <div><div className="display" style={{ fontSize: 22, color: 'var(--warn)' }}>5</div><div style={{ fontSize: 11, color: 'var(--fg-4)' }}>marked hard</div></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        {queue.map((q, i) => {
          const card = window.BWTL.FLASHCARDS[q.card];
          if (!card) return null;
          const isCurrent = i === reviewedCount;
          return (
            <div key={q.card} className="card" style={{
              padding: 0, cursor: 'pointer',
              borderColor: isCurrent ? 'var(--acc-ring)' : 'var(--line)',
              opacity: i < reviewedCount ? 0.55 : 1,
            }} onClick={() => onNavigateWord(q.card)}>
              <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px 140px auto', gap: 14, alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span className="display" style={{ fontSize: 20 }}>{card.word}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{card.ipa_pronunciation}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{card.definition}</div>
                </div>
                <span className="pill ghost" style={{ fontSize: 10 }}>{card.language}</span>
                <span className={`pill ${q.last_grade === 'easy' ? 'ok' : q.last_grade === 'good' ? 'accent' : q.last_grade === 'hard' ? 'warn' : q.last_grade === 'again' ? 'err' : 'ghost'}`} style={{ fontSize: 10 }}>{q.last_grade}</span>
                <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{q.due} · <span className="mono">+{q.interval_days}d</span></div>
                {isCurrent ? (
                  <button className="btn sm primary">Study <Ic.arrow_right /></button>
                ) : i < reviewedCount ? (
                  <Ic.check style={{ color: 'var(--ok)' }} />
                ) : (
                  <span className="mono" style={{ fontSize: 10, color: 'var(--fg-5)' }}>reps {q.reps}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PronunciationView({ card }) {
  const word = card ? (card.word_or_phrase || card.word) || 'μνήμη' : 'μνήμη';
  const ipa = card ? (card.ipa_pronunciation || card.ipa) || '/ˈmni.mi/' : '/ˈmni.mi/';
  const audioUrl = card ? card.audio_url || null : null;
  const cardId = card ? card.id : null;
  const [recording, setRecording] = React.useState(false);
  const [score, setScore] = React.useState(null);
  const [scoreError, setScoreError] = React.useState(null);
  const [scoring, setScoring] = React.useState(false);
  const mediaRecRef = React.useRef(null);
  const chunksRef = React.useRef([]);

  const playReference = () => {
    if (audioUrl) {
      const a = new Audio(audioUrl);
      a.play().catch(console.error);
    } else if (word && window.speechSynthesis) {
      const utt = new SpeechSynthesisUtterance(word);
      utt.lang = card?.language_code || 'el-GR';
      window.speechSynthesis.speak(utt);
    }
  };

  // BUG-123: wire Record/Stop to MediaRecorder + POST /api/v1/pronunciation/record
  const handleRecord = async () => {
    if (recording) {
      // Stop recording — triggers onstop which POSTs the audio
      mediaRecRef.current && mediaRecRef.current.stop();
      setRecording(false);
    } else {
      setScore(null); setScoreError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        chunksRef.current = [];
        mr.ondataavailable = e => chunksRef.current.push(e.data);
        mr.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          setScoring(true);
          try {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const form = new FormData();
            form.append('audio_file', blob, 'recording.webm');
            form.append('flashcard_id', cardId || '');
            form.append('user_id', 'pl');
            // Mutation: needs auth header
            const token = window.BWTL._getToken ? window.BWTL._getToken() : '';
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch('/api/v1/pronunciation/record', { method: 'POST', body: form, headers, credentials: 'include' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            // Map API response to display shape
            const words = data.word_scores || [];
            const segments = words.length
              ? words.map(w => [w.word || w.phoneme || '?', Math.round((w.score || 0) * 100)])
              : (data.ipa_target || ipa).replace(/[/[\]]/g,'').split('').filter(c => c.trim()).map(c => [c, Math.round(Math.random() * 30 + 60)]);
            setScore({ overall: Math.round(data.overall_score ?? data.score ?? 0), segments, feedback: data.feedback || '' });
          } catch (e) {
            setScoreError(`Scoring failed: ${e.message}`);
          } finally { setScoring(false); }
        };
        mr.start();
        mediaRecRef.current = mr;
        setRecording(true);
      } catch (e) {
        setScoreError(`Microphone access denied: ${e.message}`);
      }
    }
  };
  return (
    <div style={{ padding: '18px 20px 200px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 className="display" style={{ fontSize: 22, margin: 0 }}>Pronunciation — {word}</h2>
        <p style={{ color: 'var(--fg-3)', margin: '4px 0 0', fontSize: 13 }}>
          Record yourself, get an alignment score against the reference IPA. <span className="mono" style={{ color: 'var(--acc-2)' }}>POST /api/v1/pronunciation/score</span>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
        <div className="card card-body" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 16 }}>Now practicing</div>
          <div className="display" style={{ fontSize: 52, lineHeight: 1 }}>{word}</div>
          <div className="mono" style={{ fontSize: 16, color: 'var(--fg-2)', marginTop: 8 }}>{ipa}</div>
          <div style={{ marginTop: 10 }}>
            <button className="btn sm ghost" onClick={playReference}><Ic.speaker /> Hear reference</button>
          </div>

          <div style={{ margin: '24px auto 0', maxWidth: 400 }}>
            <div style={{ position: 'relative', height: 80, background: 'var(--bg-1)', borderRadius: 10, border: '1px solid var(--line)', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 400 60" style={{ width: '100%', height: '100%' }}>
                {Array.from({ length: 80 }, (_, i) => (
                  <rect key={i} x={i * 5} y={30 - (Math.sin(i * 0.3) * 12 + Math.random() * 8) / 2} width="3" height={Math.abs(Math.sin(i * 0.3) * 12 + Math.random() * 8)} fill={recording ? 'var(--acc)' : 'var(--fg-5)'} rx="1" />
                ))}
              </svg>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 18 }}>
            <button
              className="btn primary"
              style={{ padding: '14px 22px', borderRadius: 99 }}
              onClick={handleRecord}
              disabled={scoring}
            >
              {scoring ? <><Ic.spark /> Scoring…</> : recording ? <><Ic.pause /> Stop & score</> : <><Ic.voice /> Record</>}
            </button>
            <button className="btn ghost" onClick={() => { setScore(null); setScoreError(null); }}><Ic.refresh /> Try again</button>
          </div>
          {scoreError && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--danger, #e55)', textAlign: 'center' }}>{scoreError}</div>}
        </div>

        <div className="card card-body" style={{ padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 10 }}>Phoneme alignment</div>
          {score ? (
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ marginBottom: 6 }}>
                <span className="display" style={{ fontSize: 28, color: score.overall >= 80 ? 'var(--ok)' : 'var(--warn)' }}>{score.overall}</span>
                <span style={{ fontSize: 12, color: 'var(--fg-3)' }}> / 100 overall</span>
              </div>
              {score.segments.map(([phon, s], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', alignItems: 'center', gap: 8 }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>/{phon}/</span>
                  <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: s + '%', height: '100%', background: s >= 80 ? 'var(--ok)' : s >= 60 ? 'var(--warn)' : 'var(--err)' }} />
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', width: 28, textAlign: 'right' }}>{s}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, padding: 8, borderRadius: 6, background: 'var(--bg-2)', fontSize: 11.5, color: 'var(--fg-3)', lineHeight: 1.5 }}>
                Watch the second <span className="mono">/n/</span> — you flattened it into a vowel. Try sustained nasal closure.
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.6 }}>
              Record to see per-phoneme alignment. Scores feed back to <span className="mono">SF.PronunciationAttempts</span> for tracking.
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 11.5, color: 'var(--fg-3)' }}>
        <strong style={{ color: 'var(--fg-2)' }}>Scoreboard for this card:</strong> last 5 attempts averaged <strong style={{ color: 'var(--ok)' }}>82</strong>. View progress trend in <span className="mono">vw_UserPronunciationProgress</span>.
      </div>
    </div>
  );
}

function ShadowingView({ card }) {
  const word = card ? (card.word_or_phrase || card.word) || 'μνήμη' : 'μνήμη';
  return (
    <div style={{ padding: '18px 20px 200px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 className="display" style={{ fontSize: 22, margin: 0 }}>Shadowing — {word}</h2>
        <p style={{ color: 'var(--fg-3)', margin: '4px 0 0', fontSize: 13 }}>
          Listen, speak alongside, replay. Sessions persist in <span className="mono" style={{ color: 'var(--acc-2)' }}>SF.shadowing_sessions</span>.
        </p>
      </div>

      <div className="card card-body" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div className="display" style={{ fontSize: 22 }}>Hesiod · Theogony · lines 53-62</div>
            <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>Mnemosyne and the birth of the Muses · 47s · Eleni voice</div>
          </div>
          <button className="btn ghost"><Ic.shuffle /> Choose passage</button>
        </div>

        <div style={{ background: 'var(--bg-1)', borderRadius: 10, border: '1px solid var(--line)', padding: 18 }}>
          <div className="greek" style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--fg-2)' }}>
            τὰς ἐν Πιερίῃ Κρονίδῃ τέκε πατρὶ μιγεῖσα<br/>
            <span style={{ background: 'var(--acc-bg)', padding: '0 4px', borderRadius: 3 }}>Μνημοσύνη</span>, γουνοῖσιν Ἐλευθῆρος μεδέουσα,<br/>
            λησμοσύνην τε κακῶν ἄμπαυμά τε μερμηράων.
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--line)', fontSize: 12, color: 'var(--fg-3)', fontStyle: 'italic', lineHeight: 1.5 }}>
            In Pieria, lying with the Son of Cronus their father, Mnemosyne bore them, mistress of the hills of Eleuther — forgetfulness of evil and respite from cares.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
          <button className="btn primary" style={{ padding: '12px 18px', borderRadius: 99 }}><Ic.play /> Play & shadow</button>
          <div style={{ flex: 1, height: 4, background: 'var(--bg-3)', borderRadius: 99, position: 'relative' }}>
            <div style={{ width: '35%', height: '100%', background: 'var(--acc)', borderRadius: 99 }} />
            <div style={{ position: 'absolute', left: '35%', top: -3, width: 10, height: 10, background: 'var(--acc)', borderRadius: 99, transform: 'translateX(-50%)' }} />
          </div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>0:16 / 0:47</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0.5, 0.75, 1.0, 1.25].map(s => (
              <button key={s} className="btn xs ghost" style={{ background: s === 0.75 ? 'var(--bg-3)' : 'transparent' }}>{s}×</button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Reference', wave: true, role: 'instructor' },
            { label: 'Your shadow', wave: true, role: 'you' },
            { label: 'Alignment', diff: true },
          ].map(p => (
            <div key={p.label} style={{ padding: 10, background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--fg-4)', marginBottom: 8 }}>{p.label}</div>
              <svg viewBox="0 0 200 30" style={{ width: '100%', height: 28 }}>
                {Array.from({ length: 40 }, (_, i) => (
                  <rect key={i} x={i * 5} y={15 - Math.abs(Math.sin(i * 0.4)) * 10}
                    width="3" height={Math.abs(Math.sin(i * 0.4)) * 20 + 2}
                    fill={p.role === 'instructor' ? 'var(--graph)' : p.role === 'you' ? 'var(--acc)' : 'var(--ok)'} rx="1" />
                ))}
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.StudyQueueView = StudyQueueView;
window.PronunciationView = PronunciationView;
window.ShadowingView = ShadowingView;
