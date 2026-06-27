/* Concept Mastery — Parent dashboard (mobile) + Child detail (desktop) */

/* Tiny SVG line chart */
const Spark = ({ points, w = 280, h = 80, color = 'var(--cm-indigo)', fill = 'var(--cm-indigo-50)' }) => {
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const sx = (i) => (i / (points.length - 1)) * (w - 8) + 4;
  const sy = (v) => h - 6 - ((v - min) / range) * (h - 16);
  const path = points.map((v,i) => `${i ? 'L' : 'M'} ${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(' ');
  const area = `${path} L ${sx(points.length-1)} ${h} L ${sx(0)} ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={area} fill={fill} opacity={0.6} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((v,i)=>(
        <circle key={i} cx={sx(i)} cy={sy(v)} r={i === points.length-1 ? 4 : 0} fill={color}/>
      ))}
    </svg>
  );
};
window.Spark = Spark;

/* ── Parent dashboard (mobile) ───────────────────────────── */
function ParentDashboardMobile() {
  return (
    <IOSDevice title="Family">
      <div className="cm" style={{ background: 'var(--paper)', minHeight: '100%', padding: '12px 18px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>Good morning,</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Sarah Cooper</div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: '#fff',
            border: '1px solid var(--slate-200)',
            display: 'grid', placeItems: 'center', position: 'relative'
          }}>
            <Icon name="bell" size={18} color="var(--slate-700)"/>
            <div style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8,
                          borderRadius: '50%', background: 'var(--cm-coral)', border: '2px solid #fff' }}/>
          </div>
        </div>

        {/* This week */}
        <div style={{ marginTop: 18, padding: 16, borderRadius: 20, background: '#fff', border: '1px solid var(--slate-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>THIS WEEK</div>
              <div className="display" style={{ fontSize: 30, lineHeight: 1, marginTop: 4 }}>14 quizzes</div>
            </div>
            <div className="cm-pill mint">↑ 18%</div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Spark points={[55, 62, 60, 70, 68, 78, 82]} w={280} h={70} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--slate-400)', fontWeight: 600 }}>
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
        </div>

        {/* kids cards */}
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '20px 0 10px', color: 'var(--slate-700)' }}>YOUR KIDS</h3>

        {[
          { e: '🦊', n: 'Ben Cooper', g: 'Grade 6 · Level 8',
            score: 82, trend: 'up', last: '2h ago', weak: 'Fractions', color: 'var(--cm-indigo)' },
          { e: '🐼', n: 'Ava Cooper', g: 'Grade 3 · Level 4',
            score: 71, trend: 'flat', last: 'yesterday', weak: 'Subtraction', color: 'var(--cm-coral)' },
        ].map((k, i) => (
          <div key={i} className="cm-card" style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16, background: '#fff',
                border: `2px solid ${k.color}`, display: 'grid', placeItems: 'center', fontSize: 28,
              }}>{k.e}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{k.n}</div>
                <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>{k.g} · last active {k.last}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="display" style={{ fontSize: 22, color: k.score >= 80 ? 'var(--cm-mint)' : 'var(--cm-amber)' }}>{k.score}%</div>
                <div style={{ fontSize: 10, color: 'var(--slate-500)', fontWeight: 600 }}>AVG (7D)</div>
              </div>
            </div>
            {/* mini topic bars */}
            <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
              {[88, 72, 55, 91].map((p, j) => (
                <div key={j} style={{ flex: 1 }}>
                  <div className="cm-bar"><i style={{ width: p + '%', background: p < 60 ? 'var(--cm-coral)' : 'var(--cm-indigo)' }}/></div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap: 6 }}>
                <span className="cm-pill coral" style={{ height: 22, fontSize: 11 }}>⚠ {k.weak}</span>
                <span className="cm-pill" style={{ height: 22, fontSize: 11 }}>📌 1 assigned</span>
              </div>
              <button className="cm-btn ghost" style={{ height: 32, padding: '0 14px', fontSize: 13 }}>Open</button>
            </div>
          </div>
        ))}

        {/* FAB */}
        <div style={{
          position: 'absolute', right: 24, bottom: 96,
          width: 56, height: 56, borderRadius: '50%', background: 'var(--cm-indigo)',
          display: 'grid', placeItems: 'center',
          boxShadow: '0 10px 30px rgba(67,56,202,.4)',
        }}>
          <Icon name="plus" size={24} color="#fff" stroke={2.5}/>
        </div>

        {/* tab */}
        <div style={{
          position: 'absolute', left: 16, right: 16, bottom: 24,
          background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--slate-200)',
          borderRadius: 999, padding: 6,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
        }}>
          {[
            ['home','Home', true],
            ['users','Kids', false],
            ['bell','Activity', false],
            ['settings','Settings', false],
          ].map(([n,l,a],i) => (
            <div key={i} style={{
              padding: '8px 0', borderRadius: 999, textAlign: 'center',
              background: a ? 'var(--cm-indigo)' : 'transparent',
              color: a ? '#fff' : 'var(--slate-500)',
              display:'flex', flexDirection:'column', gap: 2, alignItems:'center',
            }}>
              <Icon name={n} size={18} color={a ? '#fff' : 'var(--slate-500)'}/>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </IOSDevice>
  );
}

/* ── Child detail (desktop) ──────────────────────────────── */
function ParentChildDetailDesktop() {
  const scores = [62, 68, 71, 65, 80, 75, 82, 78, 88, 82];
  return (
    <ChromeWindow width={1180} height={760} url="conceptmastery.ca/parent/child/ben" tabs={[{ title: 'Ben Cooper · Concept Mastery', active: true }]}>
      <div className="cm" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: '100%', background: 'var(--paper)' }}>
        {/* sidebar */}
        <div style={{ background: '#fff', borderRight: '1px solid var(--slate-200)', padding: 18 }}>
          <Logo size={24}/>
          <div style={{ marginTop: 24, display:'grid', gap: 3 }}>
            {[
              ['home','Dashboard', false],
              ['users','Children', true],
              ['file','Quizzes', false],
              ['bell','Notifications', false],
              ['settings','Settings', false],
            ].map(([i,l,a],idx)=>(
              <div key={idx} style={{
                display:'flex', alignItems:'center', gap: 10,
                padding: '8px 11px', borderRadius: 10,
                background: a ? 'var(--cm-indigo-50)' : 'transparent',
                color: a ? 'var(--cm-indigo)' : 'var(--slate-700)',
                fontWeight: a ? 700 : 500, fontSize: 14,
              }}>
                <Icon name={i} size={17}/> {l}
              </div>
            ))}
          </div>
        </div>

        {/* content */}
        <div style={{ padding: 24, overflow: 'hidden' }}>
          {/* breadcrumb */}
          <div style={{ display:'flex', gap: 6, alignItems:'center', fontSize: 13, color:'var(--slate-500)' }}>
            <span>Children</span><Icon name="chevron" size={14}/><span style={{ color: 'var(--ink)', fontWeight: 600 }}>Ben Cooper</span>
          </div>

          {/* header */}
          <div style={{ marginTop: 16, display: 'flex', gap: 18, alignItems: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22, background: '#fff',
              border: '2px solid var(--cm-coral)', display: 'grid', placeItems: 'center', fontSize: 40,
            }}>🦊</div>
            <div style={{ flex: 1 }}>
              <h1 className="display" style={{ fontSize: 34, margin: 0 }}>Ben Cooper</h1>
              <div style={{ display:'flex', gap: 8, marginTop: 4, color: 'var(--slate-500)', fontSize: 13 }}>
                <span>Grade 6</span>·<span>Level 8 · Multiplier</span>·<span>Difficulty 3</span>·<span>Last active 2h ago</span>
              </div>
            </div>
            <button className="cm-btn ghost">Export</button>
            <button className="cm-btn primary"><Icon name="plus" size={16} color="#fff"/> New quiz</button>
          </div>

          {/* KPIs */}
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { l: 'Avg score (10 quizzes)', v: '82%', d: '↑ 4 from last 10', c: 'var(--cm-mint)' },
              { l: 'Quizzes this week', v: '7', d: '5 practice · 2 test', c: 'var(--cm-indigo)' },
              { l: 'Current streak', v: '7 days', d: 'Best: 12 days', c: 'var(--cm-coral)' },
              { l: 'Skills mastered', v: '34 / 96', d: '6 new this month', c: 'var(--kid-violet)' },
            ].map((k,i)=>(
              <div key={i} className="cm-card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-500)' }}>{k.l}</div>
                <div className="display" style={{ fontSize: 30, lineHeight: 1, marginTop: 4, color: k.c }}>{k.v}</div>
                <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 6 }}>{k.d}</div>
              </div>
            ))}
          </div>

          {/* main grid */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
            {/* trend */}
            <div className="cm-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Score trend · last 10 quizzes</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['7d','30d','All'].map((p,i)=>(
                    <div key={i} style={{
                      padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                      background: i === 1 ? 'var(--slate-100)' : 'transparent',
                      color: i === 1 ? 'var(--ink)' : 'var(--slate-500)',
                    }}>{p}</div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <Spark points={scores} w={620} h={150}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--slate-400)' }}>
                <span>May 16</span><span>May 19</span><span>May 22</span><span>May 25</span><span>May 28</span><span>Today</span>
              </div>
            </div>

            {/* weak topics */}
            <div className="cm-card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Weak topics</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { s: 'D.7 Multiply fractions', p: 38, flag: true },
                  { s: 'D.4 Add fractions, unlike', p: 52, flag: true },
                  { s: 'E.5 Round decimals', p: 64 },
                  { s: 'G.2 Equivalent ratios', p: 71 },
                ].map((t,i)=>(
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{t.s} {t.flag && <span style={{ color: 'var(--cm-rose)', fontWeight: 700 }}>⚑</span>}</span>
                      <span className="mono" style={{ color: 'var(--slate-500)' }}>{t.p}%</span>
                    </div>
                    <div className="cm-bar">
                      <i style={{ width: t.p + '%', background: t.p < 60 ? 'var(--cm-coral)' : 'var(--cm-amber)' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* quiz history + parental controls */}
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
            <div className="cm-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Quiz history</h3>
                <span style={{ fontSize: 12, color: 'var(--cm-indigo)', fontWeight: 600 }}>View all →</span>
              </div>
              <div style={{ marginTop: 12 }}>
                {[
                  { d: 'May 30', t: 'Fractions practice', q: 10, score: 82, status: 'completed', mode: 'practice' },
                  { d: 'May 29', t: 'Decimals quick test', q: 8, score: 88, status: 'completed', mode: 'test' },
                  { d: 'May 28', t: 'Multiplication review', q: 12, score: 75, status: 'completed', mode: 'practice' },
                  { d: 'May 27', t: 'Mr. Patel: weekly check', q: 15, score: null, status: 'in-progress', mode: 'test' },
                ].map((r,i)=>(
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '64px 1fr 80px 90px 60px',
                    gap: 10, alignItems: 'center', padding: '10px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--slate-100)',
                  }}>
                    <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>{r.d}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{r.t}</div>
                      <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>{r.q} questions · {r.mode}</div>
                    </div>
                    <div>
                      {r.status === 'completed'
                        ? <span className="cm-pill mint" style={{ fontSize: 11 }}>Completed</span>
                        : <span className="cm-pill amber" style={{ fontSize: 11 }}>In progress</span>
                      }
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {r.score !== null ? (
                        <span className="display" style={{ fontSize: 20, color: r.score >= 80 ? 'var(--cm-mint)' : 'var(--cm-amber)' }}>{r.score}%</span>
                      ) : <span style={{ color: 'var(--slate-400)' }}>—</span>}
                    </div>
                    <div style={{ textAlign: 'right', color: 'var(--cm-indigo)', fontSize: 12, fontWeight: 600 }}>
                      {r.status === 'completed' ? 'View' : 'Resume'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cm-card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Parental controls</h3>
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Daily quiz limit</div>
                  <div style={{ display:'flex', gap: 6 }}>
                    {['1','2','3','Unlimited'].map((n,i)=>(
                      <div key={i} style={{
                        padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                        background: i === 2 ? 'var(--cm-indigo)' : 'var(--slate-100)',
                        color: i === 2 ? '#fff' : 'var(--slate-700)',
                      }}>{n}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Practice window</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div className="cm-field mono" style={{ height: 38, fontSize: 14, display:'flex', alignItems:'center' }}>16:00</div>
                    <span style={{ color: 'var(--slate-400)' }}>→</span>
                    <div className="cm-field mono" style={{ height: 38, fontSize: 14, display:'flex', alignItems:'center' }}>20:00</div>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 10, background: 'var(--slate-50)', borderRadius: 12,
                }}>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>Weekly digest</div>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Sun · 8:00 PM</div>
                  </div>
                  <div style={{ width: 36, height: 22, borderRadius: 999, background: 'var(--cm-mint)', position: 'relative' }}>
                    <div style={{ position:'absolute', right: 2, top: 2, width: 18, height: 18, borderRadius:'50%', background: '#fff' }}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

Object.assign(window, { ParentDashboardMobile, ParentChildDetailDesktop });
