/* Concept Mastery — Student bottom-tabs: Progress / Badges / Me
   The Home tab already lives in screens/student.jsx. */

/* shared tab bar so all 4 tabs share visual chrome */
const StudentTabBar = ({ active }) => (
  <div style={{
    position: 'absolute', left: 16, right: 16, bottom: 24,
    background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(16px)',
    border: '1px solid var(--slate-200)',
    borderRadius: 999, padding: 6,
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
  }}>
    {[
      ['home','Home'],
      ['chart','Progress'],
      ['trophy','Badges'],
      ['user','Me'],
    ].map(([n,l]) => {
      const a = active === l.toLowerCase();
      return (
        <div key={n} style={{
          padding: '8px 0', borderRadius: 999, textAlign: 'center',
          background: a ? 'var(--cm-indigo)' : 'transparent',
          color: a ? '#fff' : 'var(--slate-500)',
          display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center',
        }}>
          <Icon name={n} size={18} color={a ? '#fff' : 'var(--slate-500)'} />
          <span style={{ fontSize: 10, fontWeight: 600 }}>{l}</span>
        </div>
      );
    })}
  </div>
);
window.StudentTabBar = StudentTabBar;

/* ── PROGRESS ── */
function StudentProgress() {
  const weeks = [55, 62, 60, 70, 68, 78, 82];
  const topics = [
    { s: 'Fractions',        m: 62, w: false },
    { s: 'Decimals',         m: 88, w: false, hot: true },
    { s: 'Ratios & %',       m: 41, w: true },
    { s: 'Geometry · area',  m: 76, w: false },
    { s: 'Integers',         m: 92, w: false, hot: true },
    { s: 'Data & graphs',    m: 58, w: true },
  ];
  return (
    <IOSDevice title="Progress">
      <div className="cm" style={{
        background: 'var(--paper)', minHeight: '100%', padding: '12px 18px 110px',
      }}>
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>YOUR JOURNEY</div>
          <div className="display" style={{ fontSize: 30, lineHeight: 1, marginTop: 4 }}>Grade 6 · 35%</div>
        </div>

        {/* week chart */}
        <div style={{
          marginTop: 16, padding: 14, borderRadius: 18,
          background: '#fff', border: '1px solid var(--slate-200)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-700)' }}>SCORE · LAST 7 DAYS</div>
            <span className="cm-pill mint" style={{ fontSize: 11 }}>↑ 18%</span>
          </div>
          <div style={{ marginTop: 10 }}>
            <Spark points={weeks} w={310} h={70} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--slate-400)', fontWeight: 600 }}>
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
        </div>

        {/* KPI tiles */}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { l: 'STREAK',   v: '7d',  c: 'var(--cm-coral)' },
            { l: 'XP·30D',   v: '820', c: 'var(--cm-indigo)' },
            { l: 'AVG',      v: '82%', c: 'var(--cm-mint)'  },
          ].map((k,i) => (
            <div key={i} style={{
              padding: 10, borderRadius: 14, background: '#fff', border: '1px solid var(--slate-200)',
            }}>
              <div style={{ fontSize: 9, color: 'var(--slate-500)', fontWeight: 700, letterSpacing: '.06em' }}>{k.l}</div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1, marginTop: 4, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* topic mastery */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--slate-700)' }}>TOPIC MASTERY</h3>
          <span style={{ fontSize: 11, color: 'var(--cm-indigo)', fontWeight: 600 }}>All 12 →</span>
        </div>
        <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
          {topics.map((t,i) => (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 12, background: '#fff', border: '1px solid var(--slate-200)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{t.s}</span>
                {t.w && <span className="cm-pill coral" style={{ fontSize: 10, height: 18 }}>weak</span>}
                {t.hot && <span style={{ fontSize: 14 }}>🔥</span>}
                <div style={{ flex: 1 }} />
                <span className="mono" style={{ fontSize: 11, color: 'var(--slate-500)' }}>{t.m}%</span>
              </div>
              <div className="cm-bar">
                <i style={{
                  width: t.m + '%',
                  background: t.m < 60 ? 'var(--cm-coral)' : t.m < 80 ? 'var(--cm-amber)' : 'var(--cm-mint)',
                }} />
              </div>
            </div>
          ))}
        </div>

        <StudentTabBar active="progress" />
      </div>
    </IOSDevice>
  );
}

/* ── BADGES ── */
function StudentBadges() {
  const all = [
    { e: '🏆', n: 'Perfect Score', got: true,  rare: true  },
    { e: '⚡', n: 'Speed Demon',   got: true,  rare: false },
    { e: '🔥', n: 'Streak ×7',     got: true,  rare: false, isNew: true },
    { e: '🧮', n: 'Topic Master',  got: true,  rare: false },
    { e: '📐', n: 'Geometry Ace',  got: true,  rare: false },
    { e: '🎯', n: '100 Quizzes',   got: false, rare: false },
    { e: '⭐', n: 'Streak ×30',    got: false, rare: true  },
    { e: '🚀', n: 'Level 10',      got: false, rare: false },
    { e: '🧠', n: 'No Hints',      got: false, rare: false },
    { e: '🌅', n: 'Early Bird',    got: false, rare: false },
    { e: '🦉', n: 'Night Owl',     got: false, rare: false },
    { e: '👑', n: 'Top of Class',  got: false, rare: true  },
  ];
  return (
    <IOSDevice title="Badges">
      <div className="cm" style={{
        background: 'var(--paper)', minHeight: '100%', padding: '12px 18px 110px',
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>YOUR COLLECTION</div>
          <div className="display" style={{ fontSize: 30, lineHeight: 1, marginTop: 4 }}>5 of 24 unlocked</div>
        </div>

        {/* progress bar */}
        <div style={{ marginTop: 12 }}>
          <div className="cm-bar"><i style={{ width: '20%' }} /></div>
        </div>

        {/* "newly unlocked" callout */}
        <div style={{
          marginTop: 16, padding: 14, borderRadius: 18,
          background: 'linear-gradient(135deg, #FACC15, #F97066)',
          color: '#fff', display: 'flex', gap: 14, alignItems: 'center',
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,.25)',
            display: 'grid', placeItems: 'center', fontSize: 28,
          }}>🔥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', opacity: .85 }}>NEW · YESTERDAY</div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Streak ×7</div>
            <div style={{ fontSize: 11, opacity: .9 }}>7 days of practice in a row</div>
          </div>
        </div>

        {/* tab segmented */}
        <div style={{
          marginTop: 18, padding: 4, borderRadius: 999,
          background: 'var(--slate-100)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4,
        }}>
          {['All', 'Unlocked', 'Locked'].map((t, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '7px 0', borderRadius: 999,
              background: i === 0 ? '#fff' : 'transparent',
              color: i === 0 ? 'var(--ink)' : 'var(--slate-500)',
              fontWeight: 700, fontSize: 12,
              boxShadow: i === 0 ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
            }}>{t}</div>
          ))}
        </div>

        {/* grid */}
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {all.map((b, i) => (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: 16,
              background: b.got
                ? (b.rare ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)' : '#fff')
                : 'var(--slate-100)',
              border: b.got ? '1px solid var(--slate-200)' : '1px dashed var(--slate-300)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, padding: 8, position: 'relative',
              opacity: b.got ? 1 : 0.7,
            }}>
              {b.isNew && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'var(--cm-coral)', color: '#fff',
                  fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 999,
                  letterSpacing: '.06em',
                }}>NEW</div>
              )}
              {b.rare && b.got && (
                <div style={{
                  position: 'absolute', top: 6, left: 6, fontSize: 10,
                }}>✨</div>
              )}
              <div style={{
                fontSize: 30,
                filter: b.got ? 'none' : 'grayscale(1)',
              }}>{b.got ? b.e : '🔒'}</div>
              <div style={{
                fontSize: 10, fontWeight: 700, lineHeight: 1.1, textAlign: 'center',
                color: b.got ? 'var(--ink)' : 'var(--slate-500)',
              }}>{b.got ? b.n : '???'}</div>
            </div>
          ))}
        </div>

        <StudentTabBar active="badges" />
      </div>
    </IOSDevice>
  );
}

/* ── ME (profile + settings) ── */
function StudentMe() {
  return (
    <IOSDevice title="Me">
      <div className="cm" style={{
        background: 'var(--paper)', minHeight: '100%', padding: '12px 18px 110px',
      }}>
        {/* hero */}
        <div style={{
          marginTop: 4, padding: '20px 16px 16px', borderRadius: 24,
          background: 'linear-gradient(135deg, var(--cm-indigo) 0%, var(--kid-violet) 100%)',
          color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, background: 'rgba(255,255,255,.1)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22, background: '#fff',
              border: '3px solid #fff', display: 'grid', placeItems: 'center', fontSize: 42,
              boxShadow: '0 4px 16px rgba(0,0,0,.15)',
            }}>🦊</div>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 26, lineHeight: 1 }}>Ben Cooper</div>
              <div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>Grade 6 · @ben_fox</div>
              <div style={{
                marginTop: 8, display: 'inline-flex', gap: 8,
                padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,.18)',
                fontSize: 11, fontWeight: 700,
              }}>
                ⚡ Level 8 · Multiplier
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: .85 }}>
            <span>260 XP to Level 9</span><span>1,240 / 1,500</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,.22)', borderRadius: 999, marginTop: 4 }}>
            <div style={{ width: '82%', height: '100%', background: '#fff', borderRadius: 999 }} />
          </div>
        </div>

        {/* mini stat strip */}
        <div style={{
          marginTop: 14, padding: 14, borderRadius: 16,
          background: '#fff', border: '1px solid var(--slate-200)',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center',
        }}>
          {[
            { v: '47', l: 'QUIZZES' },
            { v: '5', l: 'BADGES' },
            { v: '7', l: 'STREAK' },
          ].map((k,i)=>(
            <div key={i} style={{
              borderLeft: i === 0 ? 'none' : '1px solid var(--slate-100)',
            }}>
              <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>{k.v}</div>
              <div style={{ fontSize: 10, color: 'var(--slate-500)', fontWeight: 700, marginTop: 4 }}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* settings list */}
        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: '.06em', margin: '20px 0 8px' }}>SETTINGS</h3>
        <div style={{
          background: '#fff', border: '1px solid var(--slate-200)', borderRadius: 16, overflow: 'hidden',
        }}>
          {[
            { i: 'user',     l: 'Change avatar',        v: '🦊',     c: false },
            { i: 'bell',     l: 'Sounds & feedback',    v: 'On',     c: false, toggle: true },
            { i: 'spark',    l: 'Daily reminder',       v: '5:00 PM' },
            { i: 'lock',     l: 'Change my 4-digit PIN', v: '••••',  c: false },
          ].map((r,i)=>(
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 14px',
              borderTop: i === 0 ? 'none' : '1px solid var(--slate-100)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, background: 'var(--slate-100)',
                display: 'grid', placeItems: 'center',
              }}>
                <Icon name={r.i} size={16} color="var(--slate-700)"/>
              </div>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{r.l}</div>
              {r.toggle ? (
                <div style={{
                  width: 38, height: 22, borderRadius: 999, background: 'var(--cm-mint)', position: 'relative',
                }}>
                  <div style={{ position:'absolute', right: 2, top: 2, width: 18, height: 18, borderRadius:'50%', background: '#fff' }}/>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: 13, color: 'var(--slate-500)' }}>{r.v}</span>
                  <Icon name="chevron" size={16} color="var(--slate-400)" />
                </>
              )}
            </div>
          ))}
        </div>

        {/* parent link */}
        <div style={{
          marginTop: 14, padding: 14, borderRadius: 14,
          background: 'var(--cm-indigo-50)', border: '1px solid var(--cm-indigo-100)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: '#fff',
                        display: 'grid', placeItems: 'center', fontSize: 18 }}>👩</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cm-indigo)' }}>Linked to Mom</div>
            <div style={{ fontSize: 11, color: 'var(--slate-700)' }}>sarah.cooper@gmail.com</div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--cm-indigo)', fontWeight: 600 }}>Switch →</span>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: 'var(--cm-red)', fontWeight: 700 }}>
          Sign out
        </div>

        <StudentTabBar active="me" />
      </div>
    </IOSDevice>
  );
}

Object.assign(window, { StudentProgress, StudentBadges, StudentMe });
