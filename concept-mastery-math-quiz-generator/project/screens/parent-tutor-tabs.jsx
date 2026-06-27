/* Concept Mastery — role tab galleries (light shells: Parent & Tutor)
   Each gallery = a single big artboard:
     [ role sidebar with ALL tabs visible ] + [ grid of tab-content thumbnails ]
   Each thumbnail shows the *content area* for one tab. */

/* ─── shared: a single "tab thumbnail" frame ─── */
const TabThumb = ({ icon, name, sub, current = false, dark = false, w = 400, h = 290, children }) => {
  const border = dark ? 'var(--shell-border)' : 'var(--slate-200)';
  const bg = dark ? 'var(--shell-card)' : '#fff';
  const head = dark ? '#0E1729' : 'var(--slate-50)';
  const ink = dark ? '#fff' : 'var(--ink)';
  const muted = dark ? 'var(--shell-muted)' : 'var(--slate-500)';
  return (
    <div style={{
      width: w, height: h, borderRadius: 14, background: bg, border: '1px solid ' + border,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: dark ? 'none' : '0 1px 2px rgba(15,23,42,.04)',
    }}>
      <div style={{
        padding: '10px 14px', background: head, borderBottom: '1px solid ' + border,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: dark ? 'rgba(255,255,255,.06)' : '#fff',
          border: '1px solid ' + border, display: 'grid', placeItems: 'center',
        }}>
          <Icon name={icon} size={14} color={current ? 'var(--cm-blue)' : (dark ? '#A8C0E0' : 'var(--slate-700)')} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: ink, letterSpacing: '-.01em' }}>{name}</div>
          <div style={{ fontSize: 10, color: muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
        </div>
        {current && (
          <div style={{
            padding: '2px 7px', borderRadius: 999, background: 'var(--cm-blue-50)',
            color: 'var(--cm-blue)', fontSize: 9, fontWeight: 800, letterSpacing: '.06em',
          }}>YOU ARE HERE</div>
        )}
      </div>
      <div style={{ flex: 1, padding: 14, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
};
window.TabThumb = TabThumb;

/* tiny KPI strip used inside thumbs */
const ThumbKPIs = ({ tiles, dark = false }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tiles.length}, 1fr)`, gap: 6 }}>
    {tiles.map((k, i) => (
      <div key={i} style={{
        padding: 8, borderRadius: 8,
        background: dark ? 'rgba(255,255,255,.04)' : 'var(--slate-50)',
        border: '1px solid ' + (dark ? 'var(--shell-border)' : 'var(--slate-100)'),
      }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: dark ? 'var(--shell-muted)' : 'var(--slate-500)', letterSpacing: '.06em' }}>{k.l}</div>
        <div className="display" style={{ fontSize: 16, lineHeight: 1, marginTop: 3, color: k.c || (dark ? '#fff' : 'var(--ink)') }}>{k.v}</div>
      </div>
    ))}
  </div>
);
window.ThumbKPIs = ThumbKPIs;

/* tiny rows list used inside thumbs */
const ThumbRows = ({ rows, dark = false }) => (
  <div style={{ display: 'grid', gap: 6 }}>
    {rows.map((r, i) => (
      <div key={i} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
        background: dark ? 'rgba(255,255,255,.03)' : 'var(--slate-50)',
        borderRadius: 7,
      }}>
        {r.e && (
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: dark ? 'rgba(255,255,255,.06)' : '#fff',
            display: 'grid', placeItems: 'center', fontSize: 12,
          }}>{r.e}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: dark ? '#fff' : 'var(--ink)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.n}</div>
          {r.s && <div style={{ fontSize: 9, color: dark ? 'var(--shell-muted)' : 'var(--slate-500)' }}>{r.s}</div>}
        </div>
        {r.t && (
          <div style={{
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
            background: r.tBg || (dark ? 'rgba(255,255,255,.06)' : 'var(--slate-100)'),
            color: r.tFg || (dark ? 'var(--shell-text)' : 'var(--slate-700)'),
            letterSpacing: '.03em',
          }}>{r.t}</div>
        )}
        {r.v && (
          <div className="mono" style={{ fontSize: 11, fontWeight: 700,
                                          color: r.vC || (dark ? '#fff' : 'var(--ink)') }}>{r.v}</div>
        )}
      </div>
    ))}
  </div>
);
window.ThumbRows = ThumbRows;

/* tiny bar chart for inside thumbs */
const ThumbBars = ({ data, color = 'var(--cm-blue)', dark = false }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 70 }}>
    {data.map((v, i) => (
      <div key={i} style={{
        flex: 1, height: v + '%',
        background: i === data.length - 1 ? 'var(--cm-coral)' : color,
        borderRadius: '3px 3px 0 0', minHeight: 3, opacity: dark ? 0.85 : 1,
      }} />
    ))}
  </div>
);
window.ThumbBars = ThumbBars;

/* ════════════════════════════════════════════════════════════
   PARENT — light shell, 5 tabs
   ════════════════════════════════════════════════════════════ */
function ParentTabsGallery() {
  return (
    <ChromeWindow width={1480} height={1040}
      url="conceptmastery.ca/parent/*"
      tabs={[{ title: 'Parent · all tabs · Concept Mastery', active: true }]}>
      <div className="cm" style={{
        display: 'grid', gridTemplateColumns: '220px 1fr',
        height: '100%', background: 'var(--paper)',
      }}>
        {/* sidebar — parent shell */}
        <div style={{ background: '#fff', borderRight: '1px solid var(--slate-200)', padding: 18 }}>
          <Logo size={24} />
          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 10, background: 'var(--cm-blue-50)',
                        display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#fff', display: 'grid', placeItems: 'center',
                          border: '2px solid var(--cm-blue)', fontSize: 16 }}>👩</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cm-blue)', letterSpacing: '.04em' }}>PARENT</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sarah Cooper</div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gap: 3 }}>
            {[
              ['home','Dashboard'],
              ['users','Children'],
              ['file','Quizzes'],
              ['bell','Notifications'],
              ['settings','Settings'],
            ].map(([i,l],idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 11px', borderRadius: 10,
                background: 'var(--slate-50)', color: 'var(--slate-700)', fontWeight: 600, fontSize: 14,
              }}>
                <Icon name={i} size={17} color="var(--slate-500)" /> {l}
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--slate-400)' }}>↘</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, padding: 12, borderRadius: 12, background: 'var(--cm-amber-soft)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#92400E' }}>2 unread</div>
            <div style={{ fontSize: 11, color: 'var(--slate-700)', marginTop: 4 }}>
              Mr. Patel approved Ava's grade change.
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, width: 184,
                        fontSize: 10, color: 'var(--slate-400)' }}>
            <strong style={{ color: 'var(--slate-700)' }}>Family plan</strong> · 2 kids · renews Aug 14
          </div>
        </div>

        {/* main */}
        <div style={{ padding: 24, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>SARAH COOPER · PARENT VIEW</div>
              <h1 className="display" style={{ fontSize: 32, margin: '4px 0 0' }}>
                Every tab a parent sees
              </h1>
              <div style={{ fontSize: 13, color: 'var(--slate-700)', marginTop: 4 }}>
                Five sections. The arrows on the left point to each thumbnail below.
              </div>
            </div>
            <div className="cm-pill mint">5 tabs</div>
          </div>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {/* 1 Dashboard */}
            <TabThumb icon="home" name="Dashboard" sub="Overview · this week" current>
              <ThumbKPIs tiles={[
                { l: 'QUIZZES · 7D', v: '14', c: 'var(--cm-blue)' },
                { l: 'AVG SCORE',    v: '78%', c: 'var(--cm-mint)' },
                { l: 'ALERTS',       v: '2',  c: 'var(--cm-coral)' },
              ]} />
              <div style={{ marginTop: 10, padding: 8, background: 'var(--slate-50)', borderRadius: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: '.06em' }}>SCORE · 7 DAYS</div>
                <div style={{ marginTop: 4 }}>
                  <Spark points={[55,62,60,70,68,78,82]} w={340} h={50} />
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--slate-500)' }}>
                Both kids active today · Ben completed a test
              </div>
            </TabThumb>

            {/* 2 Children */}
            <TabThumb icon="users" name="Children" sub="Two kids · click any to drill in">
              <ThumbRows rows={[
                { e:'🦊', n:'Ben Cooper',  s:'Grade 6 · Level 8', v:'82%', vC:'var(--cm-mint)',  t:'ACTIVE', tBg:'var(--cm-mint-soft)', tFg:'#047857' },
                { e:'🐼', n:'Ava Cooper',  s:'Grade 3 · Level 4', v:'71%', vC:'var(--cm-amber)', t:'ALERT',  tBg:'var(--cm-coral-soft)', tFg:'#B43326' },
              ]}/>
              <div style={{ marginTop: 10, padding: 8, background: 'var(--cm-blue-50)', borderRadius: 8,
                            fontSize: 10, color: 'var(--cm-blue)', fontWeight: 700 }}>
                + Add another child →
              </div>
              <div style={{ marginTop: 10, fontSize: 10, color: 'var(--slate-500)', lineHeight: 1.4 }}>
                Tap a child for trend chart, weak topics, quiz history,<br/>and parental controls.
              </div>
            </TabThumb>

            {/* 3 Quizzes */}
            <TabThumb icon="file" name="Quizzes" sub="All quizzes you've assigned or sat">
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {['All','Test','Practice','Tutor'].map((t,i) => (
                  <div key={i} style={{
                    padding: '3px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700,
                    background: i === 0 ? 'var(--ink)' : 'var(--slate-100)',
                    color: i === 0 ? '#fff' : 'var(--slate-700)',
                  }}>{t}</div>
                ))}
              </div>
              <ThumbRows rows={[
                { n:'Fractions · unit check', s:'Ben · May 30 · test', v:'75%', vC:'var(--cm-amber)' },
                { n:'Decimals practice',      s:'Ben · May 29 · practice', v:'88%', vC:'var(--cm-mint)' },
                { n:'Subtraction set',        s:'Ava · May 29 · practice', v:'62%', vC:'var(--cm-coral)' },
                { n:'Patel · weekly check',   s:'Ben · May 27 · test', t:'IN PROGRESS', tBg:'var(--cm-amber-soft)', tFg:'#92400E' },
              ]}/>
            </TabThumb>

            {/* 4 Notifications */}
            <TabThumb icon="bell" name="Notifications" sub="Mixed: alerts, tutor msgs, digests">
              <div style={{ display: 'grid', gap: 6 }}>
                {[
                  { ic:'flame',   c:'var(--cm-coral)', t:'Ava — score dropped to 52%', s:'Subtraction, 12 min ago' },
                  { ic:'check',   c:'var(--cm-mint)',  t:'Mr. Patel approved G3→G4',   s:'Ava Cooper · 1 h ago' },
                  { ic:'spark',   c:'var(--cm-amber)', t:'Ben unlocked Streak ×7',     s:'2 h ago' },
                  { ic:'file',    c:'var(--cm-blue)',  t:'Weekly digest is ready',      s:'Sunday 8 PM' },
                ].map((n,i)=>(
                  <div key={i} style={{
                    display:'flex', gap: 8, alignItems: 'flex-start',
                    padding: '6px 8px', borderRadius: 7, background: 'var(--slate-50)',
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: '#fff', display: 'grid', placeItems: 'center', flex: 'none',
                    }}>
                      <Icon name={n.ic} size={12} color={n.c} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>{n.t}</div>
                      <div style={{ fontSize: 9, color: 'var(--slate-500)' }}>{n.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabThumb>

            {/* 5 Settings */}
            <TabThumb icon="settings" name="Settings" sub="Account · plan · notifications">
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { l: 'Email',        v: 'sarah.cooper@gmail.com' },
                  { l: 'Plan',         v: 'Family · 2 kids', tag: true, tagBg: 'var(--cm-mint-soft)', tagFg: '#047857' },
                  { l: 'Weekly digest',v: 'Sunday 8 PM',     toggle: true },
                  { l: 'Push alerts',  v: 'Low score < 60%', toggle: true },
                  { l: 'Linked tutor', v: 'Mr. Patel · Demo Academy' },
                ].map((r,i)=>(
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '6px 8px', borderRadius: 7,
                    background: i % 2 ? 'transparent' : 'var(--slate-50)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--slate-500)', fontWeight: 700, width: 90 }}>{r.l}</div>
                    {r.tag ? (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        background: r.tagBg, color: r.tagFg,
                      }}>{r.v}</span>
                    ) : (
                      <div style={{ flex: 1, fontSize: 11, color: 'var(--ink)', fontWeight: 600 }}>{r.v}</div>
                    )}
                    {r.toggle && (
                      <div style={{
                        width: 28, height: 16, borderRadius: 999, background: 'var(--cm-mint)', position: 'relative',
                      }}>
                        <div style={{ position:'absolute', right: 2, top: 2, width: 12, height: 12, borderRadius:'50%', background: '#fff' }}/>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabThumb>

            {/* spacer 6 = nothing, fill with a "key" */}
            <div style={{
              padding: 16, borderRadius: 14, border: '1px dashed var(--slate-300)',
              background: 'var(--slate-50)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--slate-700)' }}>Reading this map</div>
              <div style={{ fontSize: 11, color: 'var(--slate-700)', lineHeight: 1.5, marginTop: 8 }}>
                Each thumbnail above is a <strong>different left-nav tab</strong> from the
                parent shell. The current tab in the actual app shows the "YOU ARE HERE" pill.
                Full screens for the highlighted tabs (<em>Children → child detail</em>) live in
                section 04 of this canvas.
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="cm-pill" style={{ fontSize: 10 }}>Light shell</span>
                <span className="cm-pill mint" style={{ fontSize: 10 }}>5 tabs</span>
                <span className="cm-pill indigo" style={{ fontSize: 10 }}>Parent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

/* ════════════════════════════════════════════════════════════
   TUTOR — light shell with mint accents, 6 tabs
   ════════════════════════════════════════════════════════════ */
function TutorTabsGallery() {
  return (
    <ChromeWindow width={1480} height={1040}
      url="conceptmastery.ca/tutor/*"
      tabs={[{ title: 'Tutor · all tabs · Concept Mastery', active: true }]}>
      <div className="cm" style={{
        display: 'grid', gridTemplateColumns: '220px 1fr',
        height: '100%', background: 'var(--paper)',
      }}>
        {/* sidebar — tutor shell */}
        <div style={{ background: '#fff', borderRight: '1px solid var(--slate-200)', padding: 18 }}>
          <Logo size={24} />
          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 10, background: 'var(--cm-mint-soft)',
                        display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#fff', display: 'grid', placeItems: 'center',
                          border: '2px solid var(--cm-mint)', fontSize: 16 }}>👨🏽</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#047857', letterSpacing: '.04em' }}>TUTOR</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Mr. Patel</div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gap: 3 }}>
            {[
              ['home','Dashboard'],
              ['users','Students'],
              ['file','Quizzes'],
              ['play','Live quiz'],
              ['chart','Reports'],
              ['settings','Settings'],
            ].map(([i,l],idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 11px', borderRadius: 10,
                background: 'var(--slate-50)', color: 'var(--slate-700)', fontWeight: 600, fontSize: 14,
              }}>
                <Icon name={i} size={17} color="var(--slate-500)" /> {l}
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--slate-400)' }}>↘</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, padding: 12, borderRadius: 12, background: 'var(--cm-indigo-50)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cm-indigo)' }}>1 approval</div>
            <div style={{ fontSize: 11, color: 'var(--slate-700)', marginTop: 4 }}>
              Ava Cooper · G3 → G4
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, width: 184,
                        fontSize: 10, color: 'var(--slate-400)' }}>
            <strong style={{ color: 'var(--slate-700)' }}>Cohort</strong> · 12 students · Demo Academy
          </div>
        </div>

        {/* main */}
        <div style={{ padding: 24, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>MR. PATEL · TUTOR VIEW</div>
              <h1 className="display" style={{ fontSize: 32, margin: '4px 0 0' }}>
                Every tab a tutor sees
              </h1>
              <div style={{ fontSize: 13, color: 'var(--slate-700)', marginTop: 4 }}>
                Six sections. All data is auto-scoped to Mr. Patel's cohort.
              </div>
            </div>
            <div className="cm-pill mint">6 tabs</div>
          </div>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {/* 1 Dashboard */}
            <TabThumb icon="home" name="Dashboard" sub="Cohort overview · alerts" current>
              <ThumbKPIs tiles={[
                { l: 'STUDENTS', v: '12', c: 'var(--cm-mint)' },
                { l: 'AVG',      v: '76%' },
                { l: 'ALERTS',   v: '3', c: 'var(--cm-coral)' },
              ]} />
              <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: '.06em' }}>QUIZZES · 7 DAYS</div>
              <div style={{ marginTop: 4 }}>
                <ThumbBars data={[12, 18, 14, 26, 22, 38, 44]} color="var(--cm-mint)" />
              </div>
            </TabThumb>

            {/* 2 Students */}
            <TabThumb icon="users" name="Students" sub="Cohort roster · 12 kids · scoped">
              <ThumbRows rows={[
                { e:'🦊', n:'Ben Cooper',  s:'G6 · L8',  v:'82%', vC:'var(--cm-mint)' },
                { e:'🐼', n:'Ava Cooper',  s:'G3 · L4',  v:'71%', vC:'var(--cm-amber)' },
                { e:'🦁', n:'Mia Nguyen',  s:'G7 · L11', v:'91%', vC:'var(--cm-mint)' },
                { e:'🐯', n:'Leo Park',    s:'G4 · L5',  v:'48%', vC:'var(--cm-coral)', t:'ALERT', tBg:'var(--cm-coral-soft)', tFg:'#B43326' },
                { e:'🐧', n:'Owen Singh',  s:'G8 · L14', v:'78%' },
              ]}/>
            </TabThumb>

            {/* 3 Quizzes */}
            <TabThumb icon="file" name="Quizzes" sub="Your templates & assignments">
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {['Templates','Assigned','Drafts','Archive'].map((t,i) => (
                  <div key={i} style={{
                    padding: '3px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700,
                    background: i === 0 ? 'var(--ink)' : 'var(--slate-100)',
                    color: i === 0 ? '#fff' : 'var(--slate-700)',
                  }}>{t}</div>
                ))}
              </div>
              <ThumbRows rows={[
                { n:'G6 · Weekly fractions',     s:'10 q · test · auto-Mon', t:'AUTO', tBg:'var(--cm-mint-soft)', tFg:'#047857' },
                { n:'G6 · Decimals warmup',      s:'5 q · practice',         t:'TPL'  },
                { n:'G5 · Multiplication drill', s:'15 q · practice' },
                { n:'G8 · Pre-algebra check',    s:'12 q · test' },
              ]}/>
              <div style={{ marginTop: 6, fontSize: 10, color: 'var(--cm-mint)', fontWeight: 700 }}>+ New template →</div>
            </TabThumb>

            {/* 4 Live quiz */}
            <TabThumb icon="play" name="Live quiz" sub="Host a kahoot-style classroom round">
              <div style={{
                padding: 14, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--ink), #1E1B4B)',
                color: '#fff', textAlign: 'center',
              }}>
                <div style={{ fontSize: 8, fontWeight: 700, opacity: .7, letterSpacing: '.14em' }}>JOIN AT</div>
                <div className="display" style={{ fontSize: 32, lineHeight: 1, marginTop: 2, letterSpacing: '.16em' }}>PLAY</div>
                <div style={{
                  marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(16,185,129,.18)', color: '#6EE7B7',
                  fontSize: 9, fontWeight: 800,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }}/> 7 in lobby
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--slate-500)', lineHeight: 1.4 }}>
                Pick a template → students join with the code → real-time leaderboard.
                Full host shell in section 05B of this canvas.
              </div>
            </TabThumb>

            {/* 5 Reports */}
            <TabThumb icon="chart" name="Reports" sub="Per-topic mastery across cohort">
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--slate-500)', letterSpacing: '.06em', marginBottom: 6 }}>
                COHORT MASTERY · BY SKILL
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 3 }}>
                {Array.from({length: 30}).map((_,i)=>{
                  const v = [40,55,72,88,90,45,68,80,52,76,30,60,85,92,40,70,55,80,65,72,48,84,90,58,70,62,76,38,82,88][i];
                  const bg = v >= 80 ? 'var(--cm-mint)'
                           : v >= 60 ? 'var(--cm-amber)'
                           : 'var(--cm-coral)';
                  return <div key={i} style={{ aspectRatio: '1', borderRadius: 3, background: bg, opacity: 0.4 + v/180 }} />;
                })}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, fontSize: 9, color: 'var(--slate-700)' }}>
                <span><span style={{ display:'inline-block', width: 8, height: 8, background: 'var(--cm-mint)', borderRadius: 2, marginRight: 3 }}/>≥80</span>
                <span><span style={{ display:'inline-block', width: 8, height: 8, background: 'var(--cm-amber)', borderRadius: 2, marginRight: 3 }}/>60–79</span>
                <span><span style={{ display:'inline-block', width: 8, height: 8, background: 'var(--cm-coral)', borderRadius: 2, marginRight: 3 }}/>&lt;60</span>
              </div>
            </TabThumb>

            {/* 6 Settings */}
            <TabThumb icon="settings" name="Settings" sub="Approval rules · cohort defaults">
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { l: 'Grade changes',         v: 'Require my approval',   toggle: true },
                  { l: 'Daily quiz cap',        v: '3 / kid / day' },
                  { l: 'Default difficulty',    v: 'Adaptive (1–5)' },
                  { l: 'Auto-flag below',       v: '60%', tag: true, tagBg: 'var(--cm-coral-soft)', tagFg: '#B43326' },
                  { l: 'Calendar sync',         v: 'Google · connected', tag: true, tagBg: 'var(--cm-mint-soft)', tagFg: '#047857' },
                ].map((r,i)=>(
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '6px 8px', borderRadius: 7,
                    background: i % 2 ? 'transparent' : 'var(--slate-50)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--slate-500)', fontWeight: 700, width: 100 }}>{r.l}</div>
                    {r.tag ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                     background: r.tagBg, color: r.tagFg }}>{r.v}</span>
                    ) : (
                      <div style={{ flex: 1, fontSize: 11, color: 'var(--ink)', fontWeight: 600 }}>{r.v}</div>
                    )}
                    {r.toggle && (
                      <div style={{ width: 28, height: 16, borderRadius: 999, background: 'var(--cm-mint)', position: 'relative' }}>
                        <div style={{ position:'absolute', right: 2, top: 2, width: 12, height: 12, borderRadius:'50%', background: '#fff' }}/>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabThumb>
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

Object.assign(window, { ParentTabsGallery, TutorTabsGallery });
