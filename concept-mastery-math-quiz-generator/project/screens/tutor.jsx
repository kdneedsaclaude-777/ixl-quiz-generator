/* Concept Mastery — Tutor cohort dashboard + Live Quiz Host */

function TutorDashboard() {
  return (
    <ChromeWindow width={1180} height={760} url="conceptmastery.ca/tutor/dashboard" tabs={[{ title: 'Tutor · Concept Mastery', active: true }]}>
      <div className="cm" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: '100%', background: 'var(--paper)' }}>
        {/* sidebar — tutor-flavored (warmer than admin) */}
        <div style={{ background: '#fff', borderRight: '1px solid var(--slate-200)', padding: 18 }}>
          <Logo size={24}/>
          <div style={{ marginTop: 24, display:'grid', gap: 3 }}>
            {[
              ['home','Dashboard', true],
              ['users','Students', false],
              ['file','Quizzes', false],
              ['play','Live quiz', false],
              ['chart','Reports', false],
              ['settings','Settings', false],
            ].map(([i,l,a],idx)=>(
              <div key={idx} style={{
                display:'flex', alignItems:'center', gap: 10,
                padding: '8px 11px', borderRadius: 10,
                background: a ? 'var(--cm-mint-soft)' : 'transparent',
                color: a ? '#047857' : 'var(--slate-700)',
                fontWeight: a ? 700 : 500, fontSize: 14,
              }}>
                <Icon name={i} size={17}/> {l}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 26, padding: 12, borderRadius: 12, background: 'var(--cm-indigo-50)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cm-indigo)' }}>Need to approve</div>
            <div style={{ fontSize: 11, color: 'var(--slate-700)', marginTop: 4, lineHeight: 1.4 }}>
              Ava Cooper requested a grade change (G3 → G4).
            </div>
            <button className="cm-btn primary" style={{ height: 28, fontSize: 11, padding: '0 10px', marginTop: 8 }}>Review</button>
          </div>
        </div>

        {/* content */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>TUTOR · MR. PATEL</div>
              <h1 className="display" style={{ fontSize: 38, margin: '4px 0 0' }}>Your cohort</h1>
            </div>
            <div style={{ display:'flex', gap: 8 }}>
              <button className="cm-btn ghost"><Icon name="download" size={14}/> Export</button>
              <button className="cm-btn coral"><Icon name="play" size={14} color="#fff"/> Start live quiz</button>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { l: 'Assigned students', v: '12', d: '2 active now' },
              { l: 'Cohort avg score', v: '76%', d: '↑ 3 this week' },
              { l: 'Quizzes this week', v: '47', d: 'across cohort' },
              { l: 'Needs attention', v: '3', d: 'low score alerts', warn: true },
            ].map((k,i)=>(
              <div key={i} className="cm-card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-500)' }}>{k.l}</div>
                <div className="display" style={{ fontSize: 30, lineHeight: 1, marginTop: 4, color: k.warn ? 'var(--cm-coral)' : 'var(--ink)' }}>{k.v}</div>
                <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 6 }}>{k.d}</div>
              </div>
            ))}
          </div>

          {/* students grid */}
          <div style={{ marginTop: 22, display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Students</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8, background:'#fff', border:'1px solid var(--slate-200)',
                            borderRadius: 999, padding: '0 14px', height: 36 }}>
                <Icon name="search" size={16} color="var(--slate-400)"/>
                <span style={{ fontSize: 13, color: 'var(--slate-400)' }}>Search…</span>
              </div>
              <div className="cm-pill indigo" style={{ height: 36, padding: '0 14px' }}>All grades</div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { e:'🦊', n:'Ben Cooper', g:'G6 · L8', score: 82, trend:[60,68,72,80,82], color:'mint', active: true },
              { e:'🐼', n:'Ava Cooper', g:'G3 · L4', score: 71, trend:[78,72,68,70,71], color:'amber', active: true },
              { e:'🦁', n:'Mia Nguyen', g:'G7 · L11', score: 91, trend:[82,86,88,90,91], color:'mint', active: false },
              { e:'🐯', n:'Leo Park',  g:'G4 · L5', score: 48, trend:[60,55,52,48,48], color:'coral', active: false, alert: true },
              { e:'🐧', n:'Owen Singh', g:'G8 · L14', score: 78, trend:[70,72,75,78,78], color:'mint', active: false },
              { e:'🦄', n:'Zoe Hart', g:'G5 · L6', score: 64, trend:[60,62,65,63,64], color:'amber', active: false },
            ].map((s,i)=>(
              <div key={i} className="cm-card" style={{ padding: 14, position: 'relative' }}>
                <div style={{ display:'flex', gap: 10, alignItems:'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background:'#fff',
                                border:'2px solid var(--cm-coral)', display:'grid', placeItems:'center', fontSize: 22, position:'relative' }}>
                    {s.e}
                    {s.active && <div style={{ position:'absolute', bottom:-2, right:-2, width: 11, height: 11, borderRadius:'50%', background:'var(--cm-mint)', border:'2px solid #fff' }}/>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.n}</div>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>{s.g}</div>
                  </div>
                  {s.alert && <span className="cm-pill coral" style={{ fontSize: 10, height: 20 }}>⚑ alert</span>}
                </div>
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                  <div>
                    <div className="display" style={{ fontSize: 24, lineHeight: 1,
                      color: s.color === 'mint' ? 'var(--cm-mint)' : s.color === 'coral' ? 'var(--cm-coral)' : 'var(--cm-amber)' }}>{s.score}%</div>
                    <div style={{ fontSize: 10, color: 'var(--slate-500)', fontWeight: 600 }}>LAST 5</div>
                  </div>
                  <Spark points={s.trend} w={120} h={36}
                          color={s.color === 'mint' ? 'var(--cm-mint)' : s.color === 'coral' ? 'var(--cm-coral)' : 'var(--cm-amber)'}
                          fill="transparent"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

/* ── Live Quiz Host ──────────────────────────────────────── */
function TutorLiveHost() {
  return (
    <ChromeWindow width={1180} height={760} url="conceptmastery.ca/live/host" tabs={[{ title: 'Live quiz · PLAY', active: true }]}>
      <div className="cm" style={{ background: 'linear-gradient(180deg, var(--ink) 0%, #1E1B4B 100%)',
                                   color: '#fff', height: '100%', padding: 28,
                                   display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* main stage */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
              <Logo size={22}/>
              <span style={{ color: 'rgba(255,255,255,.5)' }}>·</span>
              <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 600 }}>LIVE QUIZ HOST</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
              background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.4)',
              borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#FCA5A5',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }}/>
              LIVE
            </div>
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 600, letterSpacing: '.16em' }}>
              JOIN AT CONCEPTMASTERY.CA/LIVE
            </div>
            <div className="display" style={{ fontSize: 140, lineHeight: 1, marginTop: 6, letterSpacing: '.18em' }}>
              PLAY
            </div>
            <div style={{ marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,.6)' }}>
              or scan this code
            </div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 140, height: 140, background: '#fff', borderRadius: 16, padding: 10,
                display: 'grid', placeItems: 'center',
              }}>
                {/* fake QR */}
                <div style={{
                  width: '100%', height: '100%',
                  background: `
                    radial-gradient(circle at 20% 20%, var(--ink) 18%, transparent 18%),
                    radial-gradient(circle at 80% 20%, var(--ink) 18%, transparent 18%),
                    radial-gradient(circle at 20% 80%, var(--ink) 18%, transparent 18%),
                    repeating-linear-gradient(45deg, var(--ink) 0 4px, transparent 4px 8px),
                    repeating-linear-gradient(135deg, var(--ink) 0 4px, transparent 4px 8px)
                  `,
                  borderRadius: 8,
                }}/>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>QUIZ</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>Grade 6 · Fractions · 8 questions</div>
            </div>
            <button className="cm-btn coral" style={{ height: 56, padding: '0 28px', fontSize: 17 }}>
              Start round 1 <Icon name="play" size={18} color="#fff"/>
            </button>
          </div>
        </div>

        {/* right: lobby */}
        <div style={{
          background: 'rgba(255,255,255,.06)', borderRadius: 24, padding: 22,
          border: '1px solid rgba(255,255,255,.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ fontSize: 14, margin: 0, color: 'rgba(255,255,255,.6)', fontWeight: 700, letterSpacing: '.08em' }}>IN THE LOBBY</h3>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(16,185,129,.18)', color: '#6EE7B7',
              padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }}/>
              7 ready
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
            {[
              { e:'🦊', n:'Ben', s:'Just joined', online: true },
              { e:'🐼', n:'Ava', s:'Ready', online: true },
              { e:'🦁', n:'Mia', s:'Ready', online: true },
              { e:'🐯', n:'Leo', s:'Ready', online: true },
              { e:'🐧', n:'Owen', s:'Ready', online: true },
              { e:'🦄', n:'Zoe', s:'Ready', online: true },
              { e:'🐸', n:'Sam', s:'Ready', online: true },
              { e:'🐙', n:'Jaya', s:'Reconnecting…', online: false },
            ].map((p,i)=>(
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 12,
                background: 'rgba(255,255,255,.04)',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,.1)',
                  display: 'grid', placeItems: 'center', fontSize: 18, position: 'relative',
                }}>
                  {p.e}
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 10, height: 10, borderRadius: '50%',
                    background: p.online ? '#10B981' : '#94A3B8',
                    border: '2px solid #1E1B4B',
                  }}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.n}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{p.s}</div>
                </div>
                <Icon name="x" size={14} color="rgba(255,255,255,.4)"/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

Object.assign(window, { TutorDashboard, TutorLiveHost });
