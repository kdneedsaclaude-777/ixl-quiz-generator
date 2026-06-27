/* Concept Mastery — admin tab galleries (dark shell)
   OrgAdminTabsGallery — single-school scope, 7 tabs
   SuperAdminTabsGallery — platform-wide, 7 tabs
   Both reuse the <TabThumb dark> helper defined in parent-tutor-tabs.jsx */

/* shared dark-shell sidebar item */
const DarkNavItem = ({ icon, label }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 11px', borderRadius: 9,
    background: 'rgba(255,255,255,.03)',
    color: 'var(--shell-text)', fontWeight: 600, fontSize: 13,
  }}>
    <Icon name={icon} size={16} color="var(--shell-muted)" /> {label}
    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--shell-muted)' }}>↘</span>
  </div>
);

/* a tiny dark bar group for use inside dark thumbs */
const DarkBarRows = ({ rows }) => (
  <div style={{ display: 'grid', gap: 6 }}>
    {rows.map((r, i) => (
      <div key={i}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
          <span style={{ color: 'var(--shell-text)', fontWeight: 700 }}>{r.l}</span>
          <span className="mono" style={{ color: 'var(--shell-muted)' }}>{r.v}{r.unit || '%'}</span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: '#1F2A44', marginTop: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: r.v + '%',
                        background: r.v >= 80 ? '#9FD7BA' : r.v >= 60 ? '#FCD89A' : '#E8B5B5' }}/>
        </div>
      </div>
    ))}
  </div>
);

/* ════════════════════════════════════════════════════════════
   ORG ADMIN — dark shell, 7 tabs, scoped to ONE school
   ════════════════════════════════════════════════════════════ */
function OrgAdminTabsGallery() {
  return (
    <ChromeWindow width={1480} height={1340}
      url="conceptmastery.ca/admin/*"
      tabs={[{ title: 'Org Admin · all tabs · Demo Academy', active: true }]}>
      <div className="cm" style={{
        display: 'grid', gridTemplateColumns: '220px 1fr',
        height: '100%', background: 'var(--shell-bg)', color: 'var(--shell-text)',
      }}>
        {/* sidebar */}
        <div style={{ background: 'var(--shell-card)', borderRight: '1px solid var(--shell-border)', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark size={28} />
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-.01em' }}>Concept Mastery</span>
          </div>

          {/* org chip — the visual cue that distinguishes org admin */}
          <div style={{
            marginTop: 14, padding: '10px 12px', borderRadius: 10,
            background: 'rgba(232,163,23,.10)', border: '1px solid rgba(232,163,23,.3)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #C25F5F, #E8A317)',
              color: '#fff', fontWeight: 800, fontSize: 11,
              display: 'grid', placeItems: 'center',
            }}>DA</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--shell-muted)', fontWeight: 700, letterSpacing: '.06em' }}>ORG ADMIN</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Demo Academy</div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gap: 3 }}>
            {[
              ['home','Dashboard'],
              ['users','Members'],
              ['user','Students'],
              ['file','Quizzes'],
              ['grid','Classes'],
              ['chart','Analytics'],
              ['settings','Org settings'],
            ].map(([i,l],idx) => <DarkNavItem key={idx} icon={i} label={l} />)}
          </div>

          <div style={{ marginTop: 26, fontSize: 10, color: 'var(--shell-muted)', fontWeight: 700, letterSpacing: '.08em',
                        display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="lock" size={11}/> PLATFORM FLAGS
          </div>
          <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,.04)',
                        fontSize: 10, color: 'var(--shell-muted)', lineHeight: 1.4 }}>
            Read-only. Toggling lives in Super Admin.
          </div>
        </div>

        {/* main */}
        <div style={{ padding: 24, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--shell-muted)', fontWeight: 600 }}>PRIYA MEHTA · ORG ADMIN · DEMO ACADEMY</div>
              <h1 className="display" style={{ fontSize: 32, margin: '4px 0 0' }}>Every tab an org admin sees</h1>
              <div style={{ fontSize: 13, color: 'var(--shell-text)', marginTop: 4 }}>
                Seven sections. Every list is scoped to <strong>Demo Academy</strong> — no cross-org rows ever appear.
              </div>
            </div>
            <div className="cm-pill" style={{ background: 'rgba(232,163,23,.18)', color: '#FCD89A' }}>7 tabs · org-scoped</div>
          </div>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {/* 1 Dashboard */}
            <TabThumb dark icon="home" name="Dashboard" sub="School KPIs · classes overview" current>
              <ThumbKPIs dark tiles={[
                { l: 'STUDENTS', v: '184', c: '#A8C0E0' },
                { l: 'TUTORS',   v: '14',  c: '#9FD7BA' },
                { l: 'AVG',      v: '74%', c: '#FCD89A' },
              ]}/>
              <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, color: 'var(--shell-muted)', letterSpacing: '.06em' }}>
                QUIZZES · LAST 14 DAYS
              </div>
              <div style={{ marginTop: 4 }}>
                <ThumbBars dark data={[42, 38, 56, 60, 52, 78, 70, 64, 80, 72, 90, 82, 76, 88]} color="#A8C0E0" />
              </div>
            </TabThumb>

            {/* 2 Members */}
            <TabThumb dark icon="users" name="Members" sub="Parents + tutors + admins · 184">
              <ThumbRows dark rows={[
                { e:'👨🏽', n:'Mr. Patel',     s:'tutor · 3 classes', t:'TUTOR',  tBg:'rgba(78,159,123,.18)',  tFg:'#9FD7BA' },
                { e:'👩', n:'Sarah Cooper',   s:'parent · 2 kids',   t:'PARENT', tBg:'rgba(112,144,192,.18)', tFg:'#A8C0E0' },
                { e:'👩🏾', n:'Ms. Singh',     s:'tutor · 2 classes', t:'TUTOR',  tBg:'rgba(78,159,123,.18)',  tFg:'#9FD7BA' },
                { e:'🧑', n:'Priya Mehta',   s:'admin',             t:'ADMIN',  tBg:'rgba(232,163,23,.18)',  tFg:'#FCD89A' },
                { e:'👨', n:'David Park',    s:'parent · 3 kids',   t:'PARENT', tBg:'rgba(112,144,192,.18)', tFg:'#A8C0E0' },
              ]}/>
              <div style={{ marginTop: 6, fontSize: 10, color: '#A8C0E0', fontWeight: 700 }}>+ Invite member · full table in 06B</div>
            </TabThumb>

            {/* 3 Students */}
            <TabThumb dark icon="user" name="Students" sub="All kids enrolled in this org">
              <ThumbRows dark rows={[
                { e:'🦊', n:'Ben Cooper',  s:'G6 · Patel',  v:'82%', vC:'#9FD7BA' },
                { e:'🐼', n:'Ava Cooper',  s:'G3 · Park',   v:'71%', vC:'#FCD89A' },
                { e:'🦁', n:'Mia Nguyen',  s:'G7 · Singh',  v:'91%', vC:'#9FD7BA' },
                { e:'🐯', n:'Leo Park',    s:'G4 · Nguyen', v:'48%', vC:'#E8B5B5', t:'ALERT', tBg:'rgba(194,95,95,.2)', tFg:'#E8B5B5' },
                { e:'🐧', n:'Owen Singh',  s:'G8 · Singh',  v:'78%' },
              ]}/>
              <div style={{ marginTop: 6, fontSize: 10, color: 'var(--shell-muted)' }}>Sort by grade, class, last active, avg score.</div>
            </TabThumb>

            {/* 4 Quizzes */}
            <TabThumb dark icon="file" name="Quizzes" sub="Every quiz sat in your org">
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {['All','Tutor','Parent','Self','Live'].map((t,i) => (
                  <div key={i} style={{
                    padding: '3px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700,
                    background: i === 0 ? 'rgba(112,144,192,.2)' : 'rgba(255,255,255,.06)',
                    color: i === 0 ? '#A8C0E0' : 'var(--shell-muted)',
                  }}>{t}</div>
                ))}
              </div>
              <ThumbRows dark rows={[
                { n:'G6 · Fractions check', s:'Patel · today · 22 sat',  v:'78%', vC:'#9FD7BA' },
                { n:'Live · multiplication', s:'Park · today · 14 sat',  v:'82%', vC:'#9FD7BA' },
                { n:'G5 · decimals quiz',    s:'Park · yesterday · 18',  v:'69%', vC:'#FCD89A' },
                { n:'G4 · subtraction',      s:'Nguyen · 2d · 21 sat',   v:'62%', vC:'#E8B5B5' },
              ]}/>
            </TabThumb>

            {/* 5 Classes */}
            <TabThumb dark icon="grid" name="Classes" sub="Sections · rosters · auto-rolls">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {[
                  { n: 'G6 · Patel',  s: '24 kids · 78%', c: '#9FD7BA' },
                  { n: 'G6 · Singh',  s: '22 kids · 74%', c: '#A8C0E0' },
                  { n: 'G5 · Park',   s: '26 kids · 81%', c: '#9FD7BA' },
                  { n: 'G4 · Nguyen', s: '23 kids · 69%', c: '#FCD89A' },
                  { n: 'G3 · Park',   s: '25 kids · 83%', c: '#9FD7BA' },
                  { n: 'G2 · Singh',  s: '20 kids · 75%', c: '#A8C0E0' },
                ].map((c,i)=>(
                  <div key={i} style={{
                    padding: 8, borderRadius: 8, background: 'rgba(255,255,255,.04)',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{c.n}</div>
                    <div style={{ fontSize: 9, color: 'var(--shell-muted)', marginTop: 2 }}>{c.s}</div>
                    <div style={{ height: 4, borderRadius: 999, background: '#1F2A44', marginTop: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '70%', background: c.c }}/>
                    </div>
                  </div>
                ))}
              </div>
            </TabThumb>

            {/* 6 Analytics */}
            <TabThumb dark icon="chart" name="Analytics" sub="School-level trend · grade rollups">
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--shell-muted)', letterSpacing: '.06em' }}>
                AVG SCORE PER GRADE
              </div>
              <div style={{ marginTop: 6 }}>
                <DarkBarRows rows={[
                  { l: 'G2', v: 82 }, { l: 'G3', v: 77 }, { l: 'G4', v: 69 },
                  { l: 'G5', v: 81 }, { l: 'G6', v: 76 }, { l: 'G7', v: 64 },
                ]}/>
              </div>
            </TabThumb>

            {/* 7 Org settings */}
            <TabThumb dark icon="settings" name="Org settings" sub="Branding · SSO · school calendar">
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { l: 'Org name',        v: 'Demo Academy' },
                  { l: 'Domain',          v: 'demoacademy.edu',   tag: true, tagBg: 'rgba(78,159,123,.18)', tagFg: '#9FD7BA' },
                  { l: 'SSO',             v: 'Google Workspace',  tag: true, tagBg: 'rgba(78,159,123,.18)', tagFg: '#9FD7BA' },
                  { l: 'School year',     v: 'Sep 3 → Jun 28' },
                  { l: 'Brand colors',    v: 'Inherited · platform' },
                ].map((r,i)=>(
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '6px 8px', borderRadius: 7,
                    background: i % 2 ? 'transparent' : 'rgba(255,255,255,.03)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--shell-muted)', fontWeight: 700, width: 100 }}>{r.l}</div>
                    {r.tag ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                     background: r.tagBg, color: r.tagFg }}>{r.v}</span>
                    ) : (
                      <div style={{ flex: 1, fontSize: 11, color: '#fff', fontWeight: 600 }}>{r.v}</div>
                    )}
                  </div>
                ))}
              </div>
            </TabThumb>

            {/* spacer card · key */}
            <div style={{
              padding: 16, borderRadius: 14, border: '1px dashed rgba(232,163,23,.4)',
              background: 'rgba(232,163,23,.06)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#FCD89A' }}>What makes this "org admin"</div>
              <div style={{ fontSize: 11, color: 'var(--shell-text)', lineHeight: 1.5, marginTop: 8 }}>
                Same dark shell as super admin, <strong>but</strong>:
              </div>
              <ul style={{ fontSize: 11, color: 'var(--shell-text)', lineHeight: 1.5, paddingLeft: 16, margin: '6px 0 0' }}>
                <li>Persistent <strong>Demo Academy</strong> chip in sidebar</li>
                <li>Every query auto-filtered to this org</li>
                <li>Platform feature flags are read-only</li>
                <li>Can impersonate within org (see 06C)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

/* ════════════════════════════════════════════════════════════
   SUPER ADMIN — same dark shell, but PLATFORM-WIDE, 7 tabs
   ════════════════════════════════════════════════════════════ */
function SuperAdminTabsGallery() {
  return (
    <ChromeWindow width={1480} height={1340}
      url="conceptmastery.ca/admin/*"
      tabs={[{ title: 'Super Admin · all tabs · Concept Mastery', active: true }]}>
      <div className="cm" style={{
        display: 'grid', gridTemplateColumns: '220px 1fr',
        height: '100%', background: 'var(--shell-bg)', color: 'var(--shell-text)',
      }}>
        {/* sidebar — NOTE: no org chip, has feature-flag toggles */}
        <div style={{ background: 'var(--shell-card)', borderRight: '1px solid var(--shell-border)', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark size={28} />
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-.01em' }}>Concept Mastery</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#A5B4FC', fontWeight: 700, letterSpacing: '.08em' }}>SUPER ADMIN</div>

          <div style={{ marginTop: 18, display: 'grid', gap: 3 }}>
            {[
              ['home','Dashboard'],
              ['users','Users'],
              ['user','Students'],
              ['file','Quizzes'],
              ['layers','Content'],
              ['chart','Analytics'],
              ['settings','Settings'],
            ].map(([i,l],idx) => <DarkNavItem key={idx} icon={i} label={l} />)}
          </div>

          <div style={{ marginTop: 26, fontSize: 10, color: 'var(--shell-muted)', fontWeight: 700, letterSpacing: '.08em' }}>FEATURE FLAGS</div>
          <div style={{ marginTop: 8, display: 'grid', gap: 6, fontSize: 11 }}>
            {[
              ['gamification', true],
              ['timer',        false],
              ['live_quiz',    true],
              ['maintenance',  false],
            ].map(([k,on],i)=>(
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--shell-muted)' }}>{k}</span>
                <div style={{
                  width: 26, height: 14, borderRadius: 999,
                  background: on ? 'var(--cm-mint)' : '#334155', position: 'relative',
                }}>
                  <div style={{ position:'absolute', top: 2, [on ? 'right' : 'left']: 2,
                                width: 10, height: 10, borderRadius:'50%', background:'#fff' }}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: 8, borderRadius: 7, background: 'rgba(165,180,252,.08)', border: '1px solid rgba(165,180,252,.2)',
                        fontSize: 10, color: '#A5B4FC', fontWeight: 600 }}>
            Editable here only.
          </div>
        </div>

        {/* main */}
        <div style={{ padding: 24, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--shell-muted)', fontWeight: 600 }}>PLATFORM · CONCEPT MASTERY</div>
              <h1 className="display" style={{ fontSize: 32, margin: '4px 0 0' }}>Every tab a super admin sees</h1>
              <div style={{ fontSize: 13, color: 'var(--shell-text)', marginTop: 4 }}>
                Seven sections — all data is platform-wide. No single-org chip in the sidebar.
              </div>
            </div>
            <div className="cm-pill" style={{ background: 'rgba(165,180,252,.18)', color: '#A5B4FC' }}>7 tabs · cross-org</div>
          </div>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {/* 1 Dashboard */}
            <TabThumb dark icon="home" name="Dashboard" sub="Platform KPIs · 24 orgs" current>
              <ThumbKPIs dark tiles={[
                { l: 'PARENTS',  v: '1.28k', c: '#A5B4FC' },
                { l: 'STUDENTS', v: '2.47k', c: '#F0ABFC' },
                { l: 'QUIZZES',  v: '18.9k', c: '#67E8F9' },
              ]}/>
              <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, color: 'var(--shell-muted)', letterSpacing: '.06em' }}>
                QUIZZES PER DAY · 24 DAYS
              </div>
              <div style={{ marginTop: 4 }}>
                <ThumbBars dark data={[12, 18, 14, 26, 22, 38, 44, 30, 28, 36, 42, 50, 46, 58, 52, 40, 48, 62, 58, 71, 67, 60, 75, 82]} color="#A5B4FC" />
              </div>
            </TabThumb>

            {/* 2 Users */}
            <TabThumb dark icon="users" name="Users" sub="Every parent / tutor / admin across orgs">
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {['All','Parents','Tutors','Admins','Super'].map((t,i) => (
                  <div key={i} style={{
                    padding: '3px 7px', borderRadius: 999, fontSize: 9, fontWeight: 700,
                    background: i === 0 ? 'rgba(165,180,252,.2)' : 'rgba(255,255,255,.06)',
                    color: i === 0 ? '#A5B4FC' : 'var(--shell-muted)',
                  }}>{t}</div>
                ))}
              </div>
              <ThumbRows dark rows={[
                { e:'👨🏽', n:'Mr. Patel',     s:'Demo Academy · tutor',     t:'TUTOR',  tBg:'rgba(78,159,123,.18)', tFg:'#9FD7BA' },
                { e:'👩', n:'Sarah Cooper',   s:'Demo Academy · parent',     t:'PARENT', tBg:'rgba(112,144,192,.18)', tFg:'#A8C0E0' },
                { e:'🧑', n:'Priya Mehta',   s:'Demo Academy · org admin', t:'ADMIN',  tBg:'rgba(232,163,23,.18)', tFg:'#FCD89A' },
                { e:'👨', n:'Jordan Wei',    s:'Concept Mastery · super',  t:'SUPER',  tBg:'rgba(165,180,252,.2)', tFg:'#A5B4FC' },
                { e:'👩🏼', n:'Ines Garcia',   s:'Solstice Tutor · parent',   t:'PARENT', tBg:'rgba(112,144,192,.18)', tFg:'#A8C0E0' },
              ]}/>
            </TabThumb>

            {/* 3 Students */}
            <TabThumb dark icon="user" name="Students" sub="2,471 students · 24 orgs">
              <ThumbRows dark rows={[
                { e:'🦊', n:'Ben Cooper',  s:'G6 · Demo Academy',  v:'82%', vC:'#9FD7BA' },
                { e:'🐼', n:'Ava Cooper',  s:'G3 · Demo Academy',  v:'71%', vC:'#FCD89A' },
                { e:'🦁', n:'Mia Nguyen',  s:'G7 · Demo Academy',  v:'91%', vC:'#9FD7BA' },
                { e:'🐻', n:'Theo Garcia', s:'G5 · Solstice',      v:'68%', vC:'#FCD89A' },
                { e:'🦝', n:'Noor Khan',   s:'G2 · Mapleside',     v:'89%', vC:'#9FD7BA' },
              ]}/>
              <div style={{ marginTop: 6, fontSize: 10, color: 'var(--shell-muted)' }}>Filter by org · grade · active · last 30 d.</div>
            </TabThumb>

            {/* 4 Quizzes */}
            <TabThumb dark icon="file" name="Quizzes" sub="18,902 quizzes platform-wide">
              <ThumbKPIs dark tiles={[
                { l: 'TODAY',       v: '342',  c: '#FCA5A5' },
                { l: 'LIVE NOW',    v: '7',    c: '#86EFAC' },
                { l: 'IN PROGRESS', v: '84',   c: '#FCD89A' },
              ]}/>
              <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, color: 'var(--shell-muted)', letterSpacing: '.06em' }}>
                BY TYPE · LAST 7 D
              </div>
              <div style={{ marginTop: 4, display: 'grid', gap: 4 }}>
                {[
                  { l: 'Practice', v: 62, c: '#A5B4FC' },
                  { l: 'Test',     v: 28, c: '#86EFAC' },
                  { l: 'Live',     v: 10, c: '#FCD89A' },
                ].map((r,i)=>(
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 50, fontSize: 10, color: 'var(--shell-muted)' }}>{r.l}</div>
                    <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#1F2A44', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: r.v + '%', background: r.c }}/>
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--shell-text)' }}>{r.v}%</div>
                  </div>
                ))}
              </div>
            </TabThumb>

            {/* 5 Content */}
            <TabThumb dark icon="layers" name="Content" sub="Skill catalog · IXL-aligned · question bank">
              <ThumbKPIs dark tiles={[
                { l: 'SKILLS',    v: '768', c: '#67E8F9' },
                { l: 'QUESTIONS', v: '14.2k', c: '#A5B4FC' },
                { l: 'GRADES',    v: '1–8',   c: '#F0ABFC' },
              ]}/>
              <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, color: 'var(--shell-muted)', letterSpacing: '.06em' }}>
                COVERAGE BY STRAND
              </div>
              <div style={{ marginTop: 6 }}>
                <DarkBarRows rows={[
                  { l: 'Number sense',  v: 92 },
                  { l: 'Operations',    v: 88 },
                  { l: 'Fractions',     v: 76 },
                  { l: 'Geometry',      v: 64 },
                  { l: 'Data & prob.',  v: 52 },
                ]}/>
              </div>
            </TabThumb>

            {/* 6 Analytics */}
            <TabThumb dark icon="chart" name="Analytics" sub="Cross-org rollups · funnels · cohorts">
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--shell-muted)', letterSpacing: '.06em' }}>
                AVG SCORE PER GRADE · ALL ORGS
              </div>
              <div style={{ marginTop: 6 }}>
                <DarkBarRows rows={[
                  { l: 'G1', v: 88 }, { l: 'G2', v: 82 }, { l: 'G3', v: 77 }, { l: 'G4', v: 74 },
                  { l: 'G5', v: 71 }, { l: 'G6', v: 76 }, { l: 'G7', v: 69 }, { l: 'G8', v: 64 },
                ]}/>
              </div>
            </TabThumb>

            {/* 7 Settings */}
            <TabThumb dark icon="settings" name="Settings" sub="Platform-wide · super admin team · billing">
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { l: 'Platform name',  v: 'Concept Mastery' },
                  { l: 'Super admins',   v: '5 · invite',          tag: true, tagBg: 'rgba(165,180,252,.2)', tagFg: '#A5B4FC' },
                  { l: 'Billing',        v: 'Stripe · 24 orgs',    tag: true, tagBg: 'rgba(78,159,123,.18)', tagFg: '#9FD7BA' },
                  { l: 'Maintenance',    v: 'Off',                 toggle: true, on: false },
                  { l: 'Audit retention',v: '730 days' },
                ].map((r,i)=>(
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '6px 8px', borderRadius: 7,
                    background: i % 2 ? 'transparent' : 'rgba(255,255,255,.03)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--shell-muted)', fontWeight: 700, width: 100 }}>{r.l}</div>
                    {r.tag ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                     background: r.tagBg, color: r.tagFg }}>{r.v}</span>
                    ) : (
                      <div style={{ flex: 1, fontSize: 11, color: '#fff', fontWeight: 600 }}>{r.v}</div>
                    )}
                    {r.toggle && (
                      <div style={{ width: 26, height: 14, borderRadius: 999, background: r.on ? 'var(--cm-mint)' : '#334155', position: 'relative' }}>
                        <div style={{ position:'absolute', top: 2, [r.on ? 'right' : 'left']: 2,
                                      width: 10, height: 10, borderRadius:'50%', background:'#fff' }}/>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabThumb>

            {/* spacer · key */}
            <div style={{
              padding: 16, borderRadius: 14, border: '1px dashed rgba(165,180,252,.4)',
              background: 'rgba(165,180,252,.06)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#A5B4FC' }}>What makes this "super admin"</div>
              <div style={{ fontSize: 11, color: 'var(--shell-text)', lineHeight: 1.5, marginTop: 8 }}>
                Same dark shell, but distinguished by:
              </div>
              <ul style={{ fontSize: 11, color: 'var(--shell-text)', lineHeight: 1.5, paddingLeft: 16, margin: '6px 0 0' }}>
                <li><strong>No org chip</strong> in sidebar</li>
                <li>Editable platform feature flags</li>
                <li>Org column visible in every list</li>
                <li>Can create more super admins</li>
                <li>Audit log spans every org</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ChromeWindow>
  );
}

Object.assign(window, { OrgAdminTabsGallery, SuperAdminTabsGallery });
