/* Concept Mastery — Admin dashboard (desktop, dark slate shell) */

function AdminDashboard() {
  const dayBars = [12, 18, 14, 26, 22, 38, 44, 30, 28, 36, 42, 50, 46, 58, 52, 40, 48, 62, 58, 71, 67, 60, 75, 82];
  return (
    <ChromeWindow width={1180} height={760} url="conceptmastery.ca/admin/dashboard" tabs={[{ title: 'Admin · Concept Mastery', active: true }]}>
      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', height: '100%', background: 'var(--shell-bg)', color: 'var(--shell-text)', fontFamily: 'var(--font-ui)' }} className="cm">
        {/* sidebar */}
        <div style={{ background: 'var(--shell-card)', borderRight: '1px solid var(--shell-border)', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark size={28} />
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em' }}>Concept Mastery</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--shell-muted)', fontWeight: 600, letterSpacing: '.08em' }}>SUPER ADMIN</div>

          <div style={{ marginTop: 22, display: 'grid', gap: 3 }}>
            {[
              ['home','Dashboard', true],
              ['users','Users', false],
              ['user','Students', false],
              ['file','Quizzes', false],
              ['layers','Content', false],
              ['chart','Analytics', false],
              ['settings','Settings', false],
            ].map(([i,l,a],idx)=>(
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 11px', borderRadius: 9,
                background: a ? 'rgba(99,102,241,.18)' : 'transparent',
                color: a ? '#A5B4FC' : 'var(--shell-text)',
                fontWeight: a ? 700 : 500, fontSize: 13,
              }}>
                <Icon name={i} size={16}/> {l}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 26, fontSize: 10, color: 'var(--shell-muted)', fontWeight: 700, letterSpacing: '.08em' }}>FEATURE FLAGS</div>
          <div style={{ marginTop: 8, display:'grid', gap: 6, fontSize: 12 }}>
            {[
              ['gamification', true],
              ['timer', false],
              ['diagnostic_quiz', true],
              ['maintenance_mode', false],
            ].map(([k,on],i)=>(
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--shell-muted)' }}>{k}</span>
                <div style={{
                  width: 28, height: 16, borderRadius: 999,
                  background: on ? 'var(--cm-mint)' : '#334155', position: 'relative',
                }}>
                  <div style={{ position:'absolute', top: 2, [on ? 'right' : 'left']: 2, width: 12, height: 12, borderRadius:'50%', background:'#fff' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* main */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--shell-muted)', fontWeight: 600 }}>PLATFORM</div>
              <h1 className="display" style={{ fontSize: 36, margin: '4px 0 0' }}>Dashboard</h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="cm-pill" style={{ background:'rgba(255,255,255,.06)', color: 'var(--shell-text)' }}>Last 30 days</div>
              <button className="cm-btn" style={{ background: 'var(--cm-indigo)', color: '#fff' }}>
                <Icon name="download" size={14} color="#fff"/> Export CSV
              </button>
            </div>
          </div>

          {/* KPI tiles */}
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            {[
              { l: 'Parents',   v: '1,284', d: '+47',  color: '#A5B4FC' },
              { l: 'Tutors',    v: '186',   d: '+8',   color: '#86EFAC' },
              { l: 'Admins',    v: '12',    d: '—',    color: '#FCD34D' },
              { l: 'Students',  v: '2,471', d: '+92',  color: '#F0ABFC' },
              { l: 'Quizzes',   v: '18,902',d: '+1,140', color: '#67E8F9' },
              { l: 'Done 24h',  v: '342',   d: '+12%', color: '#FCA5A5' },
            ].map((k,i)=>(
              <div key={i} style={{
                padding: 14, borderRadius: 14,
                background: 'var(--shell-card)', border: '1px solid var(--shell-border)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--shell-muted)', fontWeight: 600, letterSpacing: '.04em' }}>{k.l.toUpperCase()}</div>
                <div className="display" style={{ fontSize: 26, lineHeight: 1, marginTop: 6, color: k.color }}>{k.v}</div>
                <div style={{ fontSize: 11, color: 'var(--shell-muted)', marginTop: 4 }}>{k.d}</div>
              </div>
            ))}
          </div>

          {/* charts */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
            <div style={{ padding: 18, borderRadius: 16, background: 'var(--shell-card)', border: '1px solid var(--shell-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: 14, margin: 0, fontWeight: 700 }}>Quizzes per day</h3>
                <span style={{ fontSize: 11, color: 'var(--shell-muted)' }}>click a bar to drill in →</span>
              </div>
              <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
                {dayBars.map((v,i)=>(
                  <div key={i} style={{
                    flex: 1, height: `${v}%`,
                    background: i === 23 ? 'var(--cm-coral)' : 'linear-gradient(180deg, var(--cm-indigo-500), var(--cm-indigo))',
                    borderRadius: '4px 4px 0 0', minHeight: 4,
                  }}/>
                ))}
              </div>
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--shell-muted)' }}>
                <span>May 1</span><span>May 8</span><span>May 15</span><span>May 22</span><span>Today</span>
              </div>
            </div>

            <div style={{ padding: 18, borderRadius: 16, background: 'var(--shell-card)', border: '1px solid var(--shell-border)' }}>
              <h3 style={{ fontSize: 14, margin: 0, fontWeight: 700 }}>Avg score per grade</h3>
              <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
                {[
                  { g: 'G1', v: 88 }, { g: 'G2', v: 82 }, { g: 'G3', v: 77 },
                  { g: 'G4', v: 74 }, { g: 'G5', v: 71 }, { g: 'G6', v: 76 },
                  { g: 'G7', v: 69 }, { g: 'G8', v: 64 },
                ].map((r,i)=>(
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 26, fontSize: 12, fontWeight: 700, color: 'var(--shell-muted)' }}>{r.g}</div>
                    <div style={{ flex: 1, height: 12, borderRadius: 999, background: '#1F2A44', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: r.v + '%',
                                    background: r.v >= 80 ? 'var(--cm-mint)' : r.v >= 70 ? 'var(--cm-indigo-500)' : 'var(--cm-amber)' }}/>
                    </div>
                    <div className="mono" style={{ width: 36, textAlign: 'right', fontSize: 12, color: 'var(--shell-text)' }}>{r.v}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* activity */}
          <div style={{ marginTop: 14, padding: 18, borderRadius: 16, background: 'var(--shell-card)', border: '1px solid var(--shell-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h3 style={{ fontSize: 14, margin: 0, fontWeight: 700 }}>Recent platform activity</h3>
              <span style={{ fontSize: 11, color: 'var(--shell-muted)' }}>Audit log →</span>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 0 }}>
              {[
                { who:'sarah.cooper', act:'created quiz for', tgt:'Ben Cooper (G6)', t:'2m ago', tag:'parent', color:'#A5B4FC' },
                { who:'mr.patel', act:'started live session', tgt:'PLAY · 7 joined', t:'8m ago', tag:'tutor', color:'#86EFAC' },
                { who:'admin@cm', act:'suspended user', tgt:'spam@test.com', t:'14m ago', tag:'admin', color:'#FCD34D' },
                { who:'mr.patel', act:'approved grade change for', tgt:'Mia Nguyen (G6 → G7)', t:'31m ago', tag:'tutor', color:'#86EFAC' },
                { who:'admin@cm', act:'toggled flag', tgt:'gamification = on', t:'1h ago', tag:'admin', color:'#FCD34D' },
              ].map((r,i)=>(
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '90px 1fr 80px',
                  gap: 10, alignItems: 'center', padding: '10px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--shell-border)',
                }}>
                  <span className="cm-pill" style={{ background:'rgba(255,255,255,.06)', color: r.color, fontSize: 10, height: 20 }}>{r.tag}</span>
                  <div style={{ fontSize: 13 }}>
                    <span className="mono" style={{ color: 'var(--shell-muted)' }}>{r.who}</span>
                    <span style={{ color: 'var(--shell-text)' }}> {r.act} </span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{r.tgt}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--shell-muted)', textAlign: 'right' }}>{r.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

Object.assign(window, { AdminDashboard });

/* ═══════════════════════════════════════════════════════════
   ORG ADMIN (scoped to one school) — separate role from
   Super Admin. Same dark shell, but the data and powers are
   limited to one organization.
   ═══════════════════════════════════════════════════════════ */

function OrgAdminDashboard() {
  return (
    <ChromeWindow width={1180} height={760} url="conceptmastery.ca/admin/dashboard" tabs={[{ title: 'Demo Academy · Admin', active: true }]}>
      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', height: '100%', background: 'var(--shell-bg)', color: 'var(--shell-text)', fontFamily: 'var(--font-ui)' }} className="cm">
        {/* sidebar */}
        <div style={{ background: 'var(--shell-card)', borderRight: '1px solid var(--shell-border)', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark size={28} />
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em' }}>Concept Mastery</span>
          </div>

          {/* Org chip — distinguishes from superadmin */}
          <div style={{
            marginTop: 14, padding: '10px 12px', borderRadius: 10,
            background: 'rgba(232,163,23,.10)', border: '1px solid rgba(232,163,23,.3)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #C25F5F, #E8A317)',
              color: '#fff', fontWeight: 800, fontSize: 12,
              display: 'grid', placeItems: 'center',
            }}>DA</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--shell-muted)', fontWeight: 600, letterSpacing: '.06em' }}>ORG ADMIN</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Demo Academy</div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gap: 3 }}>
            {[
              ['home','Dashboard', true],
              ['users','Members', false],
              ['user','Students', false],
              ['file','Quizzes', false],
              ['grid','Classes', false],
              ['chart','Analytics', false],
              ['settings','Org settings', false],
            ].map(([i,l,a],idx)=>(
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 11px', borderRadius: 9,
                background: a ? 'rgba(112,144,192,.20)' : 'transparent',
                color: a ? '#A8C0E0' : 'var(--shell-text)',
                fontWeight: a ? 700 : 500, fontSize: 13,
              }}>
                <Icon name={i} size={16}/> {l}
              </div>
            ))}
          </div>

          {/* Cannot toggle global flags — show locked state */}
          <div style={{ marginTop: 26, fontSize: 10, color: 'var(--shell-muted)', fontWeight: 700, letterSpacing: '.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="lock" size={12} /> PLATFORM FLAGS
          </div>
          <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,.04)',
                        fontSize: 11, color: 'var(--shell-muted)', lineHeight: 1.4 }}>
            Managed by Concept Mastery. Contact support to change platform-wide settings.
          </div>
        </div>

        {/* main */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--shell-muted)', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>
                DEMO ACADEMY <span style={{ opacity: .5 }}>·</span> 2025–26 SCHOOL YEAR
              </div>
              <h1 className="display" style={{ fontSize: 36, margin: '4px 0 0' }}>Welcome back, Priya</h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="cm-btn ghost" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--shell-text)', borderColor: 'rgba(255,255,255,.1)' }}>
                <Icon name="plus" size={14}/> Invite member
              </button>
              <button className="cm-btn" style={{ background: 'var(--cm-blue)', color: '#fff' }}>
                <Icon name="download" size={14} color="#fff"/> Org report
              </button>
            </div>
          </div>

          {/* KPI tiles — fewer than super-admin, school-flavored */}
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[
              { l: 'Students enrolled',  v: '184', d: '+12 this term',   color: '#A8C0E0' },
              { l: 'Active parents',     v: '162', d: '88% logged in 7d', color: '#FCD89A' },
              { l: 'Tutors on roster',   v: '14',  d: '2 onboarding',     color: '#9FD7BA' },
              { l: 'Quizzes this week',  v: '482', d: '+18% vs last',     color: '#E8B5B5' },
              { l: 'Avg score · school', v: '74%', d: '↑ 2 from term avg',color: '#C5B8DC' },
            ].map((k,i)=>(
              <div key={i} style={{
                padding: 14, borderRadius: 14,
                background: 'var(--shell-card)', border: '1px solid var(--shell-border)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--shell-muted)', fontWeight: 600, letterSpacing: '.04em' }}>{k.l.toUpperCase()}</div>
                <div className="display" style={{ fontSize: 28, lineHeight: 1, marginTop: 6, color: k.color }}>{k.v}</div>
                <div style={{ fontSize: 11, color: 'var(--shell-muted)', marginTop: 4 }}>{k.d}</div>
              </div>
            ))}
          </div>

          {/* classes overview */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
            <div style={{ padding: 18, borderRadius: 16, background: 'var(--shell-card)', border: '1px solid var(--shell-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: 14, margin: 0, fontWeight: 700 }}>Classes</h3>
                <span style={{ fontSize: 11, color: '#A8C0E0', fontWeight: 600 }}>+ New class</span>
              </div>
              <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                {[
                  { n: 'Grade 6 · Patel', s: 24, t: 'Mr. Patel', avg: 78, active: 18 },
                  { n: 'Grade 6 · Singh', s: 22, t: 'Ms. Singh', avg: 74, active: 14 },
                  { n: 'Grade 5 · Park',  s: 26, t: 'Ms. Park',  avg: 81, active: 21 },
                  { n: 'Grade 4 · Nguyen', s: 23, t: 'Mr. Nguyen', avg: 69, active: 12, alert: true },
                  { n: 'Grade 3 · Park',  s: 25, t: 'Ms. Park',  avg: 83, active: 19 },
                ].map((c,i)=>(
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1.3fr 0.7fr 80px 70px',
                    alignItems: 'center', gap: 10,
                    padding: 12, borderRadius: 10, background: 'rgba(255,255,255,.03)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{c.n} {c.alert && <span style={{ color: 'var(--cm-red)' }}>⚑</span>}</div>
                      <div style={{ fontSize: 11, color: 'var(--shell-muted)', marginTop: 2 }}>{c.t} · {c.s} students</div>
                    </div>
                    <div>
                      <div style={{ height: 8, borderRadius: 999, background: '#1F2A44', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: (c.active / c.s * 100) + '%',
                                      background: c.active / c.s > 0.7 ? 'var(--cm-mint)' : 'var(--cm-gold)' }}/>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--shell-muted)', marginTop: 4 }}>{c.active}/{c.s} active</div>
                    </div>
                    <div className="display" style={{ fontSize: 22, textAlign: 'right',
                                                       color: c.avg >= 80 ? '#9FD7BA' : c.avg >= 70 ? '#A8C0E0' : '#FCD89A' }}>{c.avg}%</div>
                    <div style={{ textAlign: 'right', fontSize: 12, color: '#A8C0E0', fontWeight: 600 }}>Open →</div>
                  </div>
                ))}
              </div>
            </div>

            {/* members roster */}
            <div style={{ padding: 18, borderRadius: 16, background: 'var(--shell-card)', border: '1px solid var(--shell-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: 14, margin: 0, fontWeight: 700 }}>Recent member activity</h3>
                <span style={{ fontSize: 11, color: 'var(--shell-muted)' }}>org-scoped</span>
              </div>
              <div style={{ marginTop: 12, display: 'grid', gap: 0 }}>
                {[
                  { e:'👩', n:'Sarah Cooper',  r:'parent', a:'invited',  t:'5m', tag:'PARENT' },
                  { e:'👨🏽', n:'Mr. Patel',   r:'tutor',  a:'started live',  t:'8m', tag:'TUTOR' },
                  { e:'👩🏾', n:'Ms. Singh',   r:'tutor',  a:'graded quiz',  t:'22m', tag:'TUTOR' },
                  { e:'👨', n:'David Park',  r:'parent', a:'added child Mia',  t:'1h', tag:'PARENT' },
                  { e:'👩🏻', n:'Anika Joshi', r:'parent', a:'completed onboarding',  t:'2h', tag:'PARENT' },
                ].map((m,i)=>(
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--shell-border)',
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.06)',
                                  display: 'grid', placeItems: 'center', fontSize: 14 }}>{m.e}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{m.n}</div>
                      <div style={{ fontSize: 11, color: 'var(--shell-muted)' }}>{m.a}</div>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      letterSpacing: '.04em',
                      background: m.r === 'tutor' ? 'rgba(78,159,123,.18)' : 'rgba(112,144,192,.18)',
                      color: m.r === 'tutor' ? '#9FD7BA' : '#A8C0E0',
                    }}>{m.tag}</span>
                    <div style={{ fontSize: 10, color: 'var(--shell-muted)', width: 30, textAlign: 'right' }}>{m.t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* footer comparison strip */}
          <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: 'rgba(112,144,192,.08)', border: '1px solid rgba(112,144,192,.2)',
                        display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="lock" size={16} color="#A8C0E0"/>
            <div style={{ flex: 1, fontSize: 12, color: '#A8C0E0', lineHeight: 1.4 }}>
              <strong style={{ color: '#fff' }}>Org-scoped view.</strong> You see only Demo Academy's members and quizzes.
              Cross-organization analytics, global feature flags and superadmin creation are reserved for the Concept Mastery platform team.
            </div>
            <span style={{ fontSize: 12, color: '#A8C0E0', fontWeight: 600 }}>Read more →</span>
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

/* ── Org Admin: Members management table ─────────────────── */
function OrgAdminMembers() {
  const members = [
    { e: '👨🏽', n: 'Mr. Patel',       email: 'patel@demoacademy.edu',  role: 'TUTOR',  status: 'active',     last: '2m',   classes: 3, kids: 24 },
    { e: '👩🏾', n: 'Ms. Singh',       email: 'singh@demoacademy.edu',  role: 'TUTOR',  status: 'active',     last: '22m',  classes: 2, kids: 18 },
    { e: '👩', n: 'Sarah Cooper',     email: 'sarah.cooper@gmail.com', role: 'PARENT', status: 'active',     last: '2h',   classes: 0, kids: 2 },
    { e: '👨', n: 'David Park',       email: 'david.park@gmail.com',   role: 'PARENT', status: 'active',     last: '1h',   classes: 0, kids: 3 },
    { e: '👩🏻', n: 'Anika Joshi',      email: 'anika@joshi.ca',         role: 'PARENT', status: 'pending',    last: '—',    classes: 0, kids: 1 },
    { e: '👨🏻', n: 'Mr. Nguyen',      email: 'nguyen@demoacademy.edu', role: 'TUTOR',  status: 'active',     last: '4h',   classes: 1, kids: 23 },
    { e: '🧑', n: 'Priya Mehta',      email: 'priya@demoacademy.edu',  role: 'ADMIN',  status: 'active',     last: 'now',  classes: 0, kids: 0 },
    { e: '👩🏼', n: 'Ms. Park',         email: 'park@demoacademy.edu',   role: 'TUTOR',  status: 'active',     last: '1d',   classes: 2, kids: 51 },
    { e: '👨', n: 'Marco Rossi',      email: 'rossi@gmail.com',        role: 'PARENT', status: 'suspended',  last: '14d',  classes: 0, kids: 1 },
  ];
  const tagColor = (r) => r === 'TUTOR'  ? { bg: 'rgba(78,159,123,.18)',  fg: '#9FD7BA' }
                       : r === 'ADMIN'  ? { bg: 'rgba(232,163,23,.18)',  fg: '#FCD89A' }
                       :                   { bg: 'rgba(112,144,192,.18)', fg: '#A8C0E0' };
  return (
    <ChromeWindow width={1180} height={760} url="conceptmastery.ca/admin/members" tabs={[{ title: 'Members · Demo Academy', active: true }]}>
      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', height: '100%', background: 'var(--shell-bg)', color: 'var(--shell-text)', fontFamily: 'var(--font-ui)' }} className="cm">
        {/* sidebar (collapsed-ish reuse) */}
        <div style={{ background: 'var(--shell-card)', borderRight: '1px solid var(--shell-border)', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark size={28} />
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em' }}>Concept Mastery</span>
          </div>
          <div style={{
            marginTop: 14, padding: '10px 12px', borderRadius: 10,
            background: 'rgba(232,163,23,.10)', border: '1px solid rgba(232,163,23,.3)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #C25F5F, #E8A317)',
              color: '#fff', fontWeight: 800, fontSize: 12,
              display: 'grid', placeItems: 'center',
            }}>DA</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--shell-muted)', fontWeight: 600, letterSpacing: '.06em' }}>ORG ADMIN</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Demo Academy</div>
            </div>
          </div>
          <div style={{ marginTop: 18, display: 'grid', gap: 3 }}>
            {[
              ['home','Dashboard', false],
              ['users','Members', true],
              ['user','Students', false],
              ['file','Quizzes', false],
              ['grid','Classes', false],
              ['chart','Analytics', false],
              ['settings','Org settings', false],
            ].map(([i,l,a],idx)=>(
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 11px', borderRadius: 9,
                background: a ? 'rgba(112,144,192,.20)' : 'transparent',
                color: a ? '#A8C0E0' : 'var(--shell-text)',
                fontWeight: a ? 700 : 500, fontSize: 13,
              }}>
                <Icon name={i} size={16}/> {l}
              </div>
            ))}
          </div>
        </div>

        {/* main */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--shell-muted)', fontWeight: 600 }}>DEMO ACADEMY · MEMBERS</div>
              <h1 className="display" style={{ fontSize: 32, margin: '4px 0 0' }}>Parents, tutors &amp; admins</h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="cm-btn ghost" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--shell-text)', borderColor: 'rgba(255,255,255,.1)' }}>
                <Icon name="download" size={14}/> Export CSV
              </button>
              <button className="cm-btn" style={{ background: 'var(--cm-blue)', color: '#fff' }}>
                <Icon name="plus" size={14} color="#fff"/> Invite member
              </button>
            </div>
          </div>

          {/* filters */}
          <div style={{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--shell-card)', border: '1px solid var(--shell-border)',
              borderRadius: 10, padding: '0 12px', height: 36, flex: '0 0 280px',
            }}>
              <Icon name="search" size={14} color="var(--shell-muted)"/>
              <input placeholder="Search by name or email…" style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: 13, fontFamily: 'var(--font-ui)',
              }}/>
            </div>
            <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--shell-card)', border: '1px solid var(--shell-border)', borderRadius: 10 }}>
              {['All', 'Parents', 'Tutors', 'Admins'].map((t,i)=>(
                <div key={i} style={{
                  padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  background: i === 0 ? 'rgba(112,144,192,.2)' : 'transparent',
                  color: i === 0 ? '#A8C0E0' : 'var(--shell-muted)',
                }}>{t}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--shell-card)', border: '1px solid var(--shell-border)', borderRadius: 10 }}>
              {['Active', 'Pending', 'Suspended'].map((t,i)=>(
                <div key={i} style={{
                  padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  background: i === 0 ? 'rgba(78,159,123,.18)' : 'transparent',
                  color: i === 0 ? '#9FD7BA' : 'var(--shell-muted)',
                }}>{t}</div>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--shell-muted)' }}>
              {members.length} of 184 · 1 selected
            </div>
          </div>

          {/* bulk actions bar */}
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 10,
            background: 'rgba(112,144,192,.10)', border: '1px solid rgba(112,144,192,.3)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 12, color: '#A8C0E0', fontWeight: 600 }}>1 selected</span>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,.1)' }}/>
            {['Suspend', 'Reset password', 'Resend invite', 'Delete'].map((a,i)=>(
              <span key={i} style={{ fontSize: 12, color: i === 3 ? '#E8B5B5' : '#fff', fontWeight: 500 }}>{a}</span>
            ))}
          </div>

          {/* table */}
          <div style={{ marginTop: 12, borderRadius: 14, background: 'var(--shell-card)',
                        border: '1px solid var(--shell-border)', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '36px 1.4fr 80px 90px 90px 110px 80px',
              padding: '10px 14px', gap: 10,
              fontSize: 10, fontWeight: 700, color: 'var(--shell-muted)', letterSpacing: '.08em',
              borderBottom: '1px solid var(--shell-border)',
            }}>
              <div></div>
              <div>NAME / EMAIL</div>
              <div>ROLE</div>
              <div>STATUS</div>
              <div>CLASSES</div>
              <div>LAST ACTIVE</div>
              <div style={{ textAlign: 'right' }}>ACTIONS</div>
            </div>
            {members.map((m,i)=>{
              const tag = tagColor(m.role);
              const selected = i === 1;
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '36px 1.4fr 80px 90px 90px 110px 80px',
                  padding: '12px 14px', gap: 10, alignItems: 'center',
                  borderTop: i === 0 ? 'none' : '1px solid var(--shell-border)',
                  background: selected ? 'rgba(112,144,192,.08)' : 'transparent',
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4,
                    border: '1.5px solid ' + (selected ? '#A8C0E0' : 'var(--shell-border)'),
                    background: selected ? '#A8C0E0' : 'transparent',
                    display: 'grid', placeItems: 'center',
                  }}>
                    {selected && <Icon name="check" size={10} color="var(--shell-bg)" stroke={3}/>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,.06)',
                                  display: 'grid', placeItems: 'center', fontSize: 16 }}>{m.e}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{m.n}</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--shell-muted)' }}>{m.email}</div>
                    </div>
                  </div>
                  <span style={{
                    display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
                    background: tag.bg, color: tag.fg, letterSpacing: '.04em', width: 'fit-content',
                  }}>{m.role}</span>
                  <span style={{ fontSize: 11, fontWeight: 600,
                    color: m.status === 'active' ? '#9FD7BA' : m.status === 'pending' ? '#FCD89A' : '#E8B5B5' }}>
                    ● {m.status}
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--shell-text)' }}>
                    {m.classes > 0 ? `${m.classes} · ${m.kids} kids` : m.kids > 0 ? `${m.kids} kid${m.kids>1?'s':''}` : '—'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--shell-muted)' }}>{m.last}</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', fontSize: 12 }}>
                    <span style={{ color: '#A8C0E0', fontWeight: 600 }}>Impersonate</span>
                    <Icon name="chevron" size={14} color="var(--shell-muted)"/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

/* ── Org Admin: Impersonation state ──────────────────────── */
function OrgAdminImpersonating() {
  return (
    <ChromeWindow width={1180} height={760} url="conceptmastery.ca/parent/child/ben" tabs={[{ title: 'Impersonating · Sarah Cooper', active: true }]}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }} className="cm">
        {/* IMPERSONATION BANNER */}
        <div style={{
          background: 'linear-gradient(90deg, #C25F5F 0%, #E8A317 100%)',
          color: '#fff', padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 13, fontWeight: 600,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7, background: 'rgba(0,0,0,.18)',
            display: 'grid', placeItems: 'center',
          }}><Icon name="eye" size={14} color="#fff"/></div>
          <div style={{ flex: 1 }}>
            You're impersonating <strong>Sarah Cooper</strong> · parent · Demo Academy.
            Every action is being recorded to the audit log.
          </div>
          <div style={{ fontSize: 11, opacity: .85, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="clock" size={12} color="#fff"/> 04:12 elapsed
          </div>
          <button style={{
            background: 'rgba(0,0,0,.3)', color: '#fff', border: 'none',
            padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
          }}>
            <Icon name="x" size={12} color="#fff" stroke={3}/> Exit impersonation
          </button>
        </div>

        {/* the underlying parent view (reused) */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: '100%', background: 'var(--paper)' }}>
            <div style={{ background: '#fff', borderRight: '1px solid var(--slate-200)', padding: 18 }}>
              <Logo size={22}/>
              <div style={{ marginTop: 22, display: 'grid', gap: 3 }}>
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
                    background: a ? 'var(--cm-blue-50)' : 'transparent',
                    color: a ? 'var(--cm-blue)' : 'var(--slate-700)',
                    fontWeight: a ? 700 : 500, fontSize: 14,
                  }}>
                    <Icon name={i} size={17}/> {l}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: 28 }}>
              <div style={{ fontSize: 12, color: 'var(--slate-500)', display: 'flex', gap: 8 }}>
                <span>Children</span> <Icon name="chevron" size={14}/> <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Ben Cooper</span>
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 20, background: '#fff',
                  border: '2px solid var(--cm-red)', display: 'grid', placeItems: 'center', fontSize: 36,
                }}>🦊</div>
                <div>
                  <h2 className="display" style={{ fontSize: 30, margin: 0 }}>Ben Cooper</h2>
                  <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>Grade 6 · Level 8</div>
                </div>
              </div>

              <div style={{
                marginTop: 24, padding: 18, borderRadius: 16,
                background: 'rgba(232,163,23,.08)', border: '1px solid rgba(232,163,23,.3)',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <Icon name="eye" size={20} color="var(--cm-gold)"/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#92400E' }}>This is what Sarah sees right now.</div>
                  <div style={{ fontSize: 13, color: 'var(--slate-700)', marginTop: 4, lineHeight: 1.5 }}>
                    You're viewing the parent dashboard as Sarah Cooper. Any quiz you assign, control you toggle,
                    or setting you change will be logged with your admin email <span className="mono">priya@demoacademy.edu</span> as the actor
                    and Sarah Cooper as the impersonated user.
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12, color: 'var(--slate-500)' }}>
                    <span>✓ Audit-logged</span>
                    <span>✓ Visible in Sarah's session history</span>
                    <span>✓ Org-scoped to Demo Academy</span>
                  </div>
                </div>
              </div>

              {/* abbreviated trend preview */}
              <div className="cm-card" style={{ marginTop: 18, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Score trend (Sarah's view)</h3>
                  <div className="cm-pill" style={{ background: 'var(--cm-blue-50)', color: 'var(--cm-blue)' }}>Last 10 quizzes</div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Spark points={[62, 68, 71, 65, 80, 75, 82, 78, 88, 82]} w={760} h={120} color="var(--cm-blue)" fill="var(--cm-blue-50)"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

Object.assign(window, { OrgAdminDashboard, OrgAdminMembers, OrgAdminImpersonating });
