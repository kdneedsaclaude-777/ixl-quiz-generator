/* Concept Mastery — Quiz Generator / Assignment builder (mobile + desktop) */

const TOPICS_G6 = [
  { code: 'A', name: 'Number sense', color: 'var(--cm-indigo)', count: 24, on: false },
  { code: 'D', name: 'Fractions', color: 'var(--cm-coral)', count: 22, on: true },
  { code: 'E', name: 'Decimals', color: 'var(--kid-violet)', count: 18, on: true },
  { code: 'G', name: 'Percent &amp; ratio', color: 'var(--kid-pink)', count: 14, on: false },
  { code: 'M', name: 'Geometry', color: 'var(--cm-mint)', count: 19, on: false },
  { code: 'P', name: 'Integers', color: 'var(--kid-cyan)', count: 12, on: false },
];

/* ── Mobile: parent/tutor builds a quiz to assign ───────── */
function QuizBuilderMobile() {
  return (
    <IOSDevice title="New quiz">
      <div className="cm" style={{ background: 'var(--paper)', minHeight: '100%', padding: '12px 18px 24px' }}>
        {/* nav */}
        <div style={{ display:'flex', alignItems:'center', gap: 12, marginTop: 6 }}>
          <Icon name="chevronL" size={22} color="var(--slate-500)"/>
          <div style={{ flex: 1, fontWeight: 800, fontSize: 17 }}>New quiz</div>
          <span className="cm-pill indigo">Draft</span>
        </div>

        {/* assign to */}
        <div style={{ marginTop: 18 }}>
          <div className="cm-label">Assign to</div>
          <div className="cm-card" style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--cm-coral)',
                          display: 'grid', placeItems: 'center', fontSize: 22 }}>🦊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Ben Cooper</div>
              <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>Grade 6 · Level 8</div>
            </div>
            <Icon name="chevron" size={18} color="var(--slate-400)"/>
          </div>
        </div>

        {/* topics */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <div className="cm-label">Topics <span style={{ color: 'var(--slate-400)', fontWeight: 400 }}>· choose any</span></div>
            <span style={{ fontSize: 12, color: 'var(--cm-indigo)', fontWeight: 600 }}>2 selected</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {TOPICS_G6.map(t => (
              <div key={t.code} style={{
                padding: 10, borderRadius: 14,
                background: t.on ? '#fff' : 'var(--slate-50)',
                border: t.on ? `2px solid ${t.color}` : '1px solid var(--slate-200)',
                position: 'relative',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 7,
                  background: t.color, color: '#fff', fontWeight: 800,
                  display: 'grid', placeItems: 'center', fontSize: 11,
                  opacity: t.on ? 1 : 0.4,
                }}>{t.code}</div>
                <div style={{ fontWeight: 700, fontSize: 12, marginTop: 8, lineHeight: 1.2 }}
                     dangerouslySetInnerHTML={{__html: t.name}}/>
                <div style={{ fontSize: 10, color: 'var(--slate-500)', marginTop: 2 }}>{t.count} skills</div>
                {t.on && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6, width: 18, height: 18,
                    borderRadius: '50%', background: t.color,
                    display: 'grid', placeItems: 'center',
                  }}><Icon name="check" size={12} color="#fff" stroke={3}/></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* questions count */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="cm-label">Questions</div>
            <div className="display" style={{ fontSize: 22, lineHeight: 1, color:'var(--cm-indigo)' }}>10</div>
          </div>
          <div style={{ position: 'relative', height: 36, marginTop: 4 }}>
            <div style={{ position:'absolute', left: 0, right: 0, top: 16, height: 4, borderRadius: 999, background:'var(--slate-200)' }}/>
            <div style={{ position:'absolute', left: 0, top: 16, height: 4, width:'33%', borderRadius: 999, background:'var(--cm-indigo)' }}/>
            <div style={{
              position:'absolute', left: '33%', top: 8, width: 20, height: 20, marginLeft: -10,
              borderRadius:'50%', background:'#fff', border:'4px solid var(--cm-indigo)',
              boxShadow:'0 2px 6px rgba(0,0,0,.12)'
            }}/>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 32, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--slate-400)' }}>
              <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span>
            </div>
          </div>
        </div>

        {/* difficulty */}
        <div style={{ marginTop: 20 }}>
          <div className="cm-label">Difficulty</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {[
              { l: '1', s: 'Recall' },
              { l: '2', s: 'Understand' },
              { l: '3', s: 'Apply', active: true },
              { l: '4', s: 'Analyze' },
              { l: '5', s: 'Exam' },
            ].map((d,i)=>(
              <div key={i} style={{
                padding: '8px 4px', borderRadius: 10, textAlign: 'center',
                background: d.active ? 'var(--cm-indigo)' : '#fff',
                color: d.active ? '#fff' : 'var(--ink)',
                border: d.active ? 'none' : '1px solid var(--slate-200)',
              }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{d.l}</div>
                <div style={{ fontSize: 9, opacity: .8, fontWeight: 600 }}>{d.s}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 8, display:'flex', gap: 6, alignItems:'center' }}>
            <Icon name="sliders" size={12}/>
            <span><strong>Adaptive on</strong> — engine will adjust as Ben answers.</span>
          </div>
        </div>

        {/* mode toggle - TEST vs PRACTICE */}
        <div style={{ marginTop: 20 }}>
          <div className="cm-label">Mode</div>
          <div style={{
            background:'#fff', borderRadius: 16, border:'1px solid var(--slate-200)',
            padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
          }}>
            <div style={{
              padding: '12px 10px', borderRadius: 12, textAlign:'center', cursor:'pointer',
            }}>
              <div style={{ fontSize: 22, marginBottom: 2 }}>🎓</div>
              <div style={{ fontSize: 13, fontWeight: 700, color:'var(--slate-700)' }}>Real test</div>
              <div style={{ fontSize: 10, color: 'var(--slate-500)' }}>Answers at the end</div>
            </div>
            <div style={{
              padding: '12px 10px', borderRadius: 12, textAlign:'center',
              background: 'var(--cm-indigo)', color: '#fff',
            }}>
              <div style={{ fontSize: 22, marginBottom: 2 }}>📚</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Practice</div>
              <div style={{ fontSize: 10, opacity: .8 }}>Explain when wrong</div>
            </div>
          </div>
        </div>

        {/* schedule + cta */}
        <div style={{ marginTop: 16, display:'flex', alignItems:'center', gap: 10, padding: 12,
                      background:'#fff', borderRadius: 14, border:'1px solid var(--slate-200)' }}>
          <Icon name="clock" size={18} color="var(--slate-500)"/>
          <div style={{ flex: 1, fontSize: 13 }}>
            <strong>Due Friday, Jun 5</strong>
            <div style={{ color: 'var(--slate-500)', fontSize: 12 }}>Ben gets a notification</div>
          </div>
          <Icon name="chevron" size={16} color="var(--slate-400)"/>
        </div>

        <button className="cm-btn primary lg" style={{ width: '100%', marginTop: 18 }}>
          Generate &amp; assign  <Icon name="spark" size={16} color="#fff"/>
        </button>
      </div>
    </IOSDevice>
  );
}

/* ── Desktop: full quiz generator/preview ────────────────── */
function QuizBuilderDesktop() {
  return (
    <ChromeWindow width={1180} height={760} url="conceptmastery.ca/parent/quiz/new" tabs={[{ title: 'Concept Mastery · New Quiz', active: true }]}>
      <div className="cm" style={{ display: 'grid', gridTemplateColumns: '300px 1fr 360px', height: '100%', background: 'var(--paper)' }}>
        {/* sidebar */}
        <div style={{ background: '#fff', borderRight: '1px solid var(--slate-200)', padding: 18 }}>
          <Logo size={26} />
          <div style={{ marginTop: 24, display: 'grid', gap: 4 }}>
            {[
              ['home','Dashboard'],
              ['users','Children', true],
              ['file','Quizzes'],
              ['bell','Notifications'],
              ['settings','Settings'],
            ].map(([i,l,a],idx)=>(
              <div key={idx} style={{
                display:'flex', alignItems:'center', gap: 10,
                padding: '9px 11px', borderRadius: 10,
                background: a ? 'var(--cm-indigo-50)' : 'transparent',
                color: a ? 'var(--cm-indigo)' : 'var(--slate-700)',
                fontWeight: a ? 700 : 500, fontSize: 14,
              }}>
                <Icon name={i} size={18}/>
                {l}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, fontSize: 12, fontWeight: 700, color: 'var(--slate-400)', letterSpacing: '.06em' }}>CHILDREN</div>
          <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
            {[['🦊','Ben','G6', true],['🐼','Ava','G3', false]].map(([e,n,g,a],i)=>(
              <div key={i} style={{
                display:'flex', alignItems:'center', gap: 10, padding: 8, borderRadius: 10,
                background: a ? 'var(--slate-100)' : 'transparent',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background:'#fff',
                              border:'1.5px solid var(--cm-coral)', display:'grid', placeItems:'center', fontSize: 14 }}>{e}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{n}</div>
                <div style={{ marginLeft:'auto', fontSize: 11, color:'var(--slate-500)' }}>{g}</div>
              </div>
            ))}
          </div>
        </div>

        {/* center */}
        <div style={{ padding: 28, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>BEN COOPER · GRADE 6</div>
              <h1 className="display" style={{ fontSize: 42, margin: '4px 0 0' }}>Build a new quiz</h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="cm-btn ghost">Save draft</button>
              <button className="cm-btn primary">Generate &amp; assign <Icon name="spark" size={16} color="#fff"/></button>
            </div>
          </div>

          {/* topics */}
          <section style={{ marginTop: 26 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Topics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {TOPICS_G6.map(t => (
                <div key={t.code} style={{
                  padding: 14, borderRadius: 14, background: '#fff',
                  border: t.on ? `2px solid ${t.color}` : '1px solid var(--slate-200)',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  boxShadow: t.on ? `0 0 0 4px ${t.color === 'var(--cm-coral)' ? 'var(--cm-coral-soft)' : 'var(--cm-indigo-50)'}` : 'none',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: t.color, color: '#fff',
                    display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14,
                    opacity: t.on ? 1 : .35,
                  }}>{t.code}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }} dangerouslySetInnerHTML={{__html: t.name}}/>
                    <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>{t.count} skills · 4 weak</div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 7,
                    background: t.on ? t.color : '#fff',
                    border: '1.5px solid ' + (t.on ? t.color : 'var(--slate-300)'),
                    display: 'grid', placeItems: 'center',
                  }}>{t.on && <Icon name="check" size={14} color="#fff" stroke={3}/>}</div>
                </div>
              ))}
            </div>
          </section>

          {/* row: count + difficulty */}
          <section style={{ marginTop: 26, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="cm-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--slate-500)', fontWeight: 600 }}>QUESTIONS</div>
                  <div className="display" style={{ fontSize: 44, lineHeight: 1, marginTop: 4, color: 'var(--cm-indigo)' }}>10</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  {[5,10,15,20,25].map(n => (
                    <div key={n} style={{
                      padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                      background: n === 10 ? 'var(--cm-indigo)' : 'var(--slate-100)',
                      color: n === 10 ? '#fff' : 'var(--slate-700)',
                    }}>{n}</div>
                  ))}
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 999, background: 'var(--slate-200)', position: 'relative', marginTop: 14 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: 4, width: '33%', borderRadius: 999, background: 'var(--cm-indigo)' }}/>
                <div style={{ position: 'absolute', left: '33%', top: -8, width: 20, height: 20, marginLeft: -10, borderRadius: '50%', background: '#fff', border: '4px solid var(--cm-indigo)' }}/>
              </div>
            </div>

            <div className="cm-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, color: 'var(--slate-500)', fontWeight: 600 }}>DIFFICULTY</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginTop: 10 }}>
                {['Recall','Understand','Apply','Analyze','Exam'].map((s,i)=>(
                  <div key={i} style={{
                    padding: '10px 4px', borderRadius: 10, textAlign: 'center',
                    background: i === 2 ? 'var(--cm-indigo)' : 'var(--slate-100)',
                    color: i === 2 ? '#fff' : 'var(--slate-700)',
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{i+1}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, opacity: .85 }}>{s}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 10 }}>
                Level 3 · Application · 50% conceptual / 50% word problems
              </div>
            </div>
          </section>

          {/* mode */}
          <section style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Mode</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
              {[
                { e: '🎓', t: 'Real test', d: 'Answers + score revealed at the end. No hints. Used for grading.', sel: false, c: 'var(--cm-coral)' },
                { e: '📚', t: 'Practice', d: 'Immediate feedback after each wrong answer with step-by-step explanation.', sel: true, c: 'var(--cm-indigo)' },
              ].map((m,i)=>(
                <div key={i} className="cm-card" style={{
                  padding: 18, display:'flex', gap: 14,
                  border: m.sel ? `2px solid ${m.c}` : '1px solid var(--slate-200)',
                  boxShadow: m.sel ? '0 0 0 4px var(--cm-indigo-50)' : 'var(--shadow-card)',
                  cursor: 'pointer',
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: m.sel ? 'var(--cm-indigo-50)' : 'var(--slate-100)',
                                display:'grid', placeItems:'center', fontSize: 26 }}>{m.e}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{m.t}</div>
                      {m.sel && <span className="cm-pill indigo">Selected</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--slate-500)', marginTop: 4, lineHeight: 1.4 }}>{m.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* right rail: preview */}
        <div style={{ background: '#fff', borderLeft: '1px solid var(--slate-200)', padding: 22, overflowY: 'auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-400)', letterSpacing: '.06em' }}>LIVE PREVIEW</div>
          <div style={{ fontSize: 14, color: 'var(--slate-500)', marginTop: 4, marginBottom: 14 }}>
            10 questions · weighted by Ben's weak skills
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { c: 'D.4', n: 'Add fractions, unlike denoms', q: 3, weak: true },
              { c: 'D.7', n: 'Multiply fractions', q: 3, weak: true },
              { c: 'D.5', n: 'Subtract fractions',  q: 2, weak: false, adj: true },
              { c: 'E.2', n: 'Compare decimals', q: 1, weak: false, adj: true },
              { c: 'E.5', n: 'Round decimals', q: 1, weak: false },
            ].map((s,i)=>(
              <div key={i} style={{
                padding: '10px 12px', borderRadius: 12, background: 'var(--slate-50)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div className="mono" style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--cm-indigo)',
                  background: '#fff', padding: '3px 7px', borderRadius: 6,
                  border: '1px solid var(--cm-indigo-100)',
                }}>{s.c}</div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.n}</div>
                {s.weak && <span className="cm-pill coral" style={{ height: 20, padding: '0 7px', fontSize: 10 }}>weak</span>}
                {s.adj && <span className="cm-pill" style={{ height: 20, padding: '0 7px', fontSize: 10 }}>adj</span>}
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-500)' }}>×{s.q}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: 'var(--cm-indigo-50)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cm-indigo)', marginBottom: 6 }}>WEIGHTING</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 6, fontSize: 12, color:'var(--slate-700)' }}>
              <div>Weak skills <strong>60%</strong></div>
              <div>Adjacent <strong>25%</strong></div>
              <div>Other <strong>15%</strong></div>
              <div>Adaptive <strong>on</strong></div>
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--slate-500)', display:'flex', gap: 8, alignItems:'flex-start' }}>
            <Icon name="lock" size={14} color="var(--slate-400)"/>
            <span>Grade change requires tutor approval. Topic changes do not.</span>
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

Object.assign(window, { QuizBuilderMobile, QuizBuilderDesktop });
