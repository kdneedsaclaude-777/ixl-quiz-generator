/* Concept Mastery — Student mobile flow: home, quiz, feedback, results */

/* ── Student Home ────────────────────────────────────────── */
function StudentHome() {
  return (
    <IOSDevice title="Home">
      <div className="cm" style={{
        background: 'linear-gradient(180deg, #FFF7ED 0%, #FAFAF7 40%)',
        minHeight: '100%', padding: '14px 20px 24px',
      }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16, background:'#fff',
            border: '2px solid var(--cm-coral)', display:'grid', placeItems:'center', fontSize: 28,
          }}>🦊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>Hi, Ben 👋</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Let's master Grade 6 today</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
            background: '#fff', borderRadius: 999, border: '1px solid var(--slate-200)',
          }}>
            <Icon name="flame" size={16} color="var(--cm-coral)" />
            <span style={{ fontWeight: 800, fontSize: 13 }}>7</span>
          </div>
        </div>

        {/* XP card */}
        <div style={{
          marginTop: 18, padding: '16px 18px', borderRadius: 22,
          background: 'linear-gradient(135deg, var(--cm-indigo) 0%, var(--kid-violet) 100%)',
          color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position:'absolute', right: -20, top: -20, width: 120, height: 120,
                        background: 'rgba(255,255,255,.12)', borderRadius: '50%' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, opacity: .75 }}>LEVEL 8 · MULTIPLIER</div>
              <div className="display" style={{ fontSize: 36, lineHeight: 1, margin: '4px 0 0' }}>1,240 XP</div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background:'rgba(255,255,255,.18)', display:'grid', placeItems:'center',
            }}><Icon name="spark" size={22} color="#fff"/></div>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, opacity: .8, display:'flex', justifyContent:'space-between' }}>
            <span>260 XP to Level 9</span><span>1,240 / 1,500</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,.2)', borderRadius: 999, marginTop: 6 }}>
            <div style={{ height: '100%', width: '82%', borderRadius: 999, background: '#fff' }}/>
          </div>
        </div>

        {/* Big start button */}
        <button style={{
          marginTop: 16, width: '100%',
          height: 86, borderRadius: 22, border: 'none',
          background: 'var(--cm-coral)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 22px',
          boxShadow: '0 6px 0 #C8483F',
          cursor: 'pointer',
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, opacity: .85, fontWeight: 600 }}>YOUR NEXT QUIZ</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>Start practice</div>
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.22)',
            display:'grid', placeItems:'center',
          }}><Icon name="play" size={26} color="#fff" /></div>
        </button>

        {/* assigned strip */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--slate-700)' }}>ASSIGNED</h3>
          <span style={{ fontSize: 12, color: 'var(--cm-indigo)', fontWeight: 600 }}>See all</span>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            { who: 'Mom', topic: 'Fractions · 10 questions', due: 'Due today', color: 'var(--cm-coral)', tag: 'TEST' },
            { who: 'Mr. Patel', topic: 'Decimals · 8 questions', due: 'Due Fri', color: 'var(--cm-indigo)', tag: 'PRACTICE' },
          ].map((q, i) => (
            <div key={i} className="cm-card" style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 8, alignSelf: 'stretch', borderRadius: 999, background: q.color
              }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--slate-500)', fontWeight: 600 }}>{q.who.toUpperCase()} · {q.tag}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{q.topic}</div>
                <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>{q.due}</div>
              </div>
              <Icon name="chevron" size={18} color="var(--slate-400)" />
            </div>
          ))}
        </div>

        {/* badges row */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--slate-700)' }}>RECENT BADGES</h3>
          <span style={{ fontSize: 12, color: 'var(--cm-indigo)', fontWeight: 600 }}>All badges</span>
        </div>
        <div style={{ display:'flex', gap: 10 }}>
          {[
            { e: '🏆', name: 'Perfect Score', bg: '#FEF3C7' },
            { e: '⚡', name: 'Speed Demon',   bg: '#E0E7FF' },
            { e: '🔥', name: 'Streak ×7',     bg: 'var(--cm-coral-soft)' },
            { e: '🧮', name: 'Topic Master',  bg: 'var(--cm-mint-soft)' },
          ].map((b,i) => (
            <div key={i} style={{ flex: 1, textAlign:'center' }}>
              <div style={{
                aspectRatio: '1', borderRadius: 16, background: b.bg,
                display: 'grid', placeItems: 'center', fontSize: 28, marginBottom: 4,
              }}>{b.e}</div>
              <div style={{ fontSize: 10, color: 'var(--slate-700)', fontWeight: 600, lineHeight: 1.2 }}>{b.name}</div>
            </div>
          ))}
        </div>

        {/* tabbar */}
        <div style={{
          position: 'absolute', left: 16, right: 16, bottom: 24,
          background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--slate-200)',
          borderRadius: 999, padding: 6,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
        }}>
          {[
            ['home','Home', true],
            ['chart','Progress', false],
            ['trophy','Badges', false],
            ['user','Me', false],
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

/* ── Student Quiz Question (test mode) ──────────────────── */
function StudentQuiz() {
  const dots = Array.from({ length: 10 }, (_, i) => i);
  const current = 4;
  const options = [
    { k: 'A', text: '11 cm' },
    { k: 'B', text: '22 cm' },
    { k: 'C', text: '24 cm' },
    { k: 'D', text: '16 cm' },
  ];
  return (
    <IOSDevice>
      <div className="cm" style={{ background: 'var(--paper)', minHeight: '100%', padding: '12px 18px 24px', display: 'flex', flexDirection: 'column' }}>
        {/* progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
          <Icon name="x" size={22} color="var(--slate-400)" />
          <div style={{ flex: 1, display: 'flex', gap: 4 }}>
            {dots.map(i => (
              <div key={i} style={{
                flex: 1, height: 8, borderRadius: 999,
                background: i < current ? 'var(--cm-mint)' : (i === current ? 'var(--cm-indigo)' : 'var(--slate-200)'),
              }}/>
            ))}
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--slate-700)', fontWeight: 700 }}>{current + 1}/10</div>
        </div>

        {/* skill chip */}
        <div style={{ marginTop: 22, display:'flex', gap: 8, alignItems: 'center' }}>
          <span className="cm-pill indigo">S.1 · Perimeter</span>
          <span className="cm-pill" style={{ background: 'var(--slate-100)' }}>
            <Icon name="target" size={12} /> Difficulty 2
          </span>
        </div>

        {/* question */}
        <div style={{ marginTop: 16 }}>
          <div className="display" style={{ fontSize: 28, lineHeight: 1.18, letterSpacing: '-.01em' }}>
            A rectangle has a length of <span style={{ color:'var(--cm-indigo)' }}>8 cm</span> and a width of <span style={{ color:'var(--cm-indigo)' }}>3 cm</span>.
            What is its perimeter?
          </div>
        </div>

        {/* visual */}
        <div style={{
          marginTop: 18, padding: 12, borderRadius: 18,
          background: '#fff', border: '1px solid var(--slate-200)',
          display: 'grid', placeItems: 'center',
        }}>
          <svg width="220" height="100" viewBox="0 0 220 100">
            <rect x="20" y="20" width="180" height="60" fill="var(--cm-indigo-50)" stroke="var(--cm-indigo)" strokeWidth="2" rx="6"/>
            <text x="110" y="14" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1E293B">8 cm</text>
            <text x="110" y="98" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1E293B">8 cm</text>
            <text x="10" y="54" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1E293B">3</text>
            <text x="212" y="54" textAnchor="middle" fontSize="12" fontWeight="600" fill="#1E293B">3</text>
          </svg>
        </div>

        {/* options */}
        <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
          {options.map((o, i) => (
            <div key={o.k} style={{
              padding: '16px 18px', borderRadius: 18, background:'#fff',
              border: i === 1 ? '2px solid var(--cm-indigo)' : '1px solid var(--slate-200)',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: i === 1 ? '0 0 0 4px var(--cm-indigo-50)' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: i === 1 ? 'var(--cm-indigo)' : 'var(--slate-100)',
                color: i === 1 ? '#fff' : 'var(--slate-700)',
                fontWeight: 800, display: 'grid', placeItems: 'center',
              }}>{o.k}</div>
              <div style={{ fontWeight: 600, fontSize: 17 }}>{o.text}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}/>
        <button className="cm-btn primary lg" style={{ width: '100%', marginTop: 18 }}>
          Check answer <Icon name="arrow" size={18} color="#fff" />
        </button>
      </div>
    </IOSDevice>
  );
}

/* ── Student Practice Feedback (wrong answer w/ explanation) ── */
function StudentFeedback() {
  return (
    <IOSDevice>
      <div className="cm" style={{ background: 'var(--paper)', minHeight: '100%', padding: '12px 18px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
          <Icon name="x" size={22} color="var(--slate-400)" />
          <div style={{ flex: 1, display: 'flex', gap: 4 }}>
            {Array.from({length: 10}).map((_,i)=>(
              <div key={i} style={{
                flex: 1, height: 8, borderRadius: 999,
                background: i < 3 ? 'var(--cm-mint)' : (i === 3 ? 'var(--cm-rose)' : (i === 4 ? 'var(--cm-indigo)' : 'var(--slate-200)')),
              }}/>
            ))}
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--slate-700)', fontWeight: 700 }}>4/10</div>
        </div>

        {/* incorrect banner */}
        <div style={{
          marginTop: 22, padding: '14px 16px', borderRadius: 18,
          background: 'var(--cm-rose-soft)', border: '1px solid #FCA5A5',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background:'var(--cm-rose)', display:'grid', placeItems:'center' }}>
            <Icon name="x" size={20} color="#fff" stroke={3}/>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#9F1239' }}>Not quite!</div>
            <div style={{ fontSize: 13, color: '#9F1239', opacity: .8 }}>The right answer is <strong>B · 22 cm</strong></div>
          </div>
        </div>

        {/* options recap */}
        <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
          {[
            { k: 'A', t: '11 cm', state: 'idle' },
            { k: 'B', t: '22 cm', state: 'right' },
            { k: 'C', t: '24 cm', state: 'wrong' },
            { k: 'D', t: '16 cm', state: 'idle' },
          ].map((o) => (
            <div key={o.k} style={{
              padding: '12px 14px', borderRadius: 14, background:'#fff',
              border: '1px solid ' + (o.state === 'right' ? 'var(--cm-mint)' : (o.state === 'wrong' ? 'var(--cm-rose)' : 'var(--slate-200)')),
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: o.state === 'right' ? 'var(--cm-mint)' : (o.state === 'wrong' ? 'var(--cm-rose)' : 'var(--slate-100)'),
                color: o.state === 'idle' ? 'var(--slate-700)' : '#fff',
                fontWeight: 800, display:'grid', placeItems:'center', fontSize: 13,
              }}>{o.k}</div>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{o.t}</div>
              {o.state === 'right' && <Icon name="check" size={20} color="var(--cm-mint)" stroke={2.5}/>}
              {o.state === 'wrong' && <Icon name="x" size={20} color="var(--cm-rose)" stroke={2.5}/>}
            </div>
          ))}
        </div>

        {/* explanation */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 18, background: '#fff', border:'1px solid var(--slate-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background:'var(--cm-indigo-50)', display:'grid', placeItems:'center' }}>
              <Icon name="book" size={16} color="var(--cm-indigo)"/>
            </div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Here's how it works</div>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--slate-700)' }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Why C is wrong:</strong> 8 × 3 = 24 gives the <em>area</em>, not the perimeter.
            </div>
            <div style={{
              padding: 10, background: 'var(--cm-indigo-50)', borderRadius: 10,
              color: 'var(--cm-indigo)', fontFamily: 'var(--font-mono)', fontSize: 13,
            }}>
              P = 2 × (length + width)<br/>
              P = 2 × (8 + 3) = 2 × 11 = <strong>22 cm</strong>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--slate-500)' }}>
              💡 Add all four sides, or use <span className="mono">2l + 2w</span>.
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}/>
        <button className="cm-btn primary lg" style={{ width: '100%', marginTop: 18 }}>
          Got it — next question <Icon name="arrow" size={18} color="#fff" />
        </button>
      </div>
    </IOSDevice>
  );
}

/* ── Student Results (animated score) ──────────────────── */
function StudentResults() {
  return (
    <IOSDevice>
      <div className="cm" style={{
        background: 'linear-gradient(180deg, var(--cm-indigo) 0%, var(--kid-violet) 60%, #FAFAF7 60.1%)',
        minHeight: '100%', padding: '14px 18px 24px', position: 'relative',
      }}>
        {/* confetti dots */}
        {Array.from({length: 18}).map((_,i)=>{
          const colors=['#FACC15','#F97066','#10B981','#FFFFFF','#EC4899'];
          return <div key={i} style={{
            position:'absolute', width: 8, height: 8, borderRadius: '50%',
            background: colors[i%5],
            top: 20 + Math.random()*180,
            left: 16 + Math.random()*340,
            opacity: .8,
            transform: `rotate(${Math.random()*180}deg)`,
          }}/>;
        })}

        <div style={{ textAlign: 'center', color: '#fff', marginTop: 24, position: 'relative' }}>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: .8, letterSpacing: '.1em' }}>QUIZ COMPLETE</div>
          <div className="display" style={{ fontSize: 96, lineHeight: 1, margin: '6px 0' }}>80<span style={{ fontSize: 48 }}>%</span></div>
          <div style={{ fontSize: 14, opacity: .9 }}>Fractions · 10 questions</div>
        </div>

        <div className="cm-card" style={{
          marginTop: 36, padding: 18, borderRadius: 24,
          position: 'relative',
        }}>
          {/* score breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
            <div>
              <div className="display" style={{ fontSize: 26, color: 'var(--cm-mint)' }}>8</div>
              <div style={{ fontSize: 11, color: 'var(--slate-500)', fontWeight: 600 }}>CORRECT</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--slate-200)', borderRight: '1px solid var(--slate-200)' }}>
              <div className="display" style={{ fontSize: 26, color: 'var(--cm-rose)' }}>2</div>
              <div style={{ fontSize: 11, color: 'var(--slate-500)', fontWeight: 600 }}>MISSED</div>
            </div>
            <div>
              <div className="display" style={{ fontSize: 26, color: 'var(--cm-indigo)' }}>+80</div>
              <div style={{ fontSize: 11, color: 'var(--slate-500)', fontWeight: 600 }}>XP EARNED</div>
            </div>
          </div>

          <div style={{
            marginTop: 16, padding: 14, borderRadius: 16,
            background: 'var(--cm-mint-soft)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 28 }}>📈</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: '#047857', fontSize: 14 }}>Difficulty up to 3!</div>
              <div style={{ fontSize: 12, color: '#047857', opacity: .85 }}>You're ready for harder questions.</div>
            </div>
          </div>
        </div>

        {/* new badge */}
        <div style={{
          marginTop: 16, padding: 16, borderRadius: 20,
          background: '#fff', border: '1px solid var(--slate-200)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #FACC15, #F97066)',
            display: 'grid', placeItems: 'center', fontSize: 28,
            boxShadow: '0 4px 14px rgba(249,112,102,.4)',
          }}>🔥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--cm-coral)', fontWeight: 800 }}>NEW BADGE UNLOCKED</div>
            <div style={{ fontWeight: 800, fontSize: 17, marginTop: 1 }}>Streak ×7</div>
            <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>7 days of practice in a row</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
          <button className="cm-btn ghost lg" style={{ background: '#fff' }}>Review answers</button>
          <button className="cm-btn primary lg">Practice again</button>
        </div>
      </div>
    </IOSDevice>
  );
}

Object.assign(window, { StudentHome, StudentQuiz, StudentFeedback, StudentResults });
