/* Concept Mastery — Auth screens (sign-in + role picker + onboarding) */

/* Brand mark: open-book + pixel squares, matches Concept Mastery logo */
const LogoMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ flex: 'none' }}>
    {/* red top curve */}
    <path d="M8 22 Q 32 10 56 22 L 56 18 Q 32 6 8 18 Z" fill="#C25F5F"/>
    {/* yellow open pages */}
    <path d="M10 22 L 32 18 L 32 50 L 10 46 Z" fill="#E8A317"/>
    <path d="M54 22 L 32 18 L 32 50 L 54 46 Z" fill="#E8A317" opacity="0.9"/>
    {/* center spine */}
    <rect x="31" y="18" width="2" height="32" fill="#FFFFFF" opacity="0.5"/>
    {/* blue bottom curve */}
    <path d="M8 46 Q 32 56 56 46 L 56 50 Q 32 60 8 50 Z" fill="#7090C0"/>
    {/* pixel squares (top-right cluster) */}
    <rect x="44" y="6"  width="6" height="6" rx="1" fill="#E8A317"/>
    <rect x="52" y="10" width="5" height="5" rx="1" fill="#7090C0"/>
    <rect x="46" y="14" width="4" height="4" rx="1" fill="#C25F5F"/>
  </svg>
);
window.LogoMark = LogoMark;

const Logo = ({ size = 32, tagline = false, dark = false }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <LogoMark size={size} />
    <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1 }}>
      <span style={{
        fontFamily: 'var(--font-ui)', fontWeight: 800,
        fontSize: size * 0.58, letterSpacing: '-.015em',
        color: dark ? '#FFFFFF' : '#4D4D4D',
      }}>
        Concept Mastery
      </span>
      {tagline && (
        <span style={{
          fontFamily: 'var(--font-ui)', fontWeight: 500,
          fontSize: size * 0.30, letterSpacing: '.22em', marginTop: 4,
          color: dark ? 'rgba(255,255,255,.7)' : '#7090C0',
        }}>
          QUALITY EDUCATION
        </span>
      )}
    </span>
  </span>
);
window.Logo = Logo;

/* ── Sign-in (mobile, role-tabbed) ───────────────────────── */
function AuthSignIn({ role = 'parent' }) {
  const roles = [
    { id: 'student', label: 'Student' },
    { id: 'parent',  label: 'Parent' },
    { id: 'tutor',   label: 'Tutor' },
    { id: 'admin',   label: 'Admin' },
  ];
  return (
    <IOSDevice title="Sign in">
      <div className="cm" style={{ padding: '24px 22px', background: 'var(--paper)', minHeight: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <Logo size={38} tagline />
        </div>
        <h1 className="display" style={{ fontSize: 38, lineHeight: 1.05, margin: '36px 0 6px', letterSpacing: '-.02em' }}>
          Welcome back.
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: 15, margin: '0 0 22px' }}>
          Sign in to your learning space.
        </p>

        {/* role tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
          padding: 4, background: '#fff', border: '1px solid var(--slate-200)',
          borderRadius: 999, marginBottom: 22
        }}>
          {roles.map(r => (
            <div key={r.id} style={{
              height: 36, borderRadius: 999, display: 'grid', placeItems: 'center',
              fontSize: 13, fontWeight: 600,
              background: r.id === role ? 'var(--cm-indigo)' : 'transparent',
              color: r.id === role ? '#fff' : 'var(--slate-700)',
            }}>{r.label}</div>
          ))}
        </div>

        <label className="cm-label">Email</label>
        <input className="cm-field" defaultValue="parent@conceptmastery.ca" />
        <div style={{ height: 14 }}/>
        <label className="cm-label">Password</label>
        <div style={{ position: 'relative' }}>
          <input className="cm-field" type="password" defaultValue="•••••••••" />
          <div style={{ position:'absolute', right: 12, top: 13, color:'var(--slate-400)' }}>
            <Icon name="eye" size={20} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 22px' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color:'var(--slate-700)' }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--cm-indigo)', display:'grid', placeItems:'center' }}>
              <Icon name="check" size={12} color="#fff" stroke={3} />
            </span>
            Keep me signed in
          </label>
          <a style={{ fontSize: 13, color: 'var(--cm-indigo)', fontWeight: 600 }}>Forgot?</a>
        </div>
        <button className="cm-btn primary lg" style={{ width: '100%' }}>
          Sign in <Icon name="arrow" size={18} color="#fff" />
        </button>

        <div style={{ textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, margin: '22px 0 10px' }}>
          New family?  <span style={{ color: 'var(--cm-indigo)', fontWeight: 600 }}>Create an account</span>
        </div>

        {/* Student kid-friendly alt */}
        <div style={{
          marginTop: 16, padding: 14, borderRadius: 16,
          background: 'var(--cm-indigo-50)', display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--cm-coral)',
                        display:'grid', placeItems:'center', color:'#fff', fontWeight: 800 }}>👦</div>
          <div style={{ flex: 1, fontSize: 13, lineHeight: 1.3 }}>
            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>Are you a student?</div>
            <div style={{ color: 'var(--slate-500)' }}>Sign in with your avatar &amp; PIN</div>
          </div>
          <Icon name="chevron" size={18} color="var(--cm-indigo)" />
        </div>
      </div>
    </IOSDevice>
  );
}

/* ── Student kid login (avatar + PIN) ────────────────────── */
function AuthKidLogin() {
  const avatars = ['🦊','🐼','🐯','🦄','🐸','🐙','🦁','🐧','🦉'];
  return (
    <IOSDevice title="Who's playing?">
      <div className="cm" style={{ padding: '20px 22px', background: 'linear-gradient(180deg,#FFF7ED 0%, #FAFAF7 60%)', minHeight: '100%' }}>
        <div style={{ display:'flex', justifyContent:'center', marginTop: 10 }}>
          <Logo size={26} />
        </div>
        <h1 className="display" style={{ fontSize: 34, margin: '28px 0 4px' }}>Who's playing?</h1>
        <p style={{ color: 'var(--slate-500)', fontSize: 14, margin: '0 0 20px' }}>Tap your avatar to start.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {avatars.map((a, i) => (
            <div key={i} style={{
              aspectRatio: '1 / 1', borderRadius: 22, background: '#fff',
              border: i === 0 ? '3px solid var(--cm-coral)' : '1px solid var(--slate-200)',
              display:'grid', placeItems:'center', fontSize: 44,
              boxShadow: i === 0 ? '0 6px 0 var(--cm-coral-soft)' : 'var(--shadow-card)',
              position: 'relative',
            }}>
              {a}
              {i === 0 && (
                <div style={{
                  position:'absolute', bottom: -10, left: '50%', transform:'translateX(-50%)',
                  background: 'var(--cm-coral)', color:'#fff', borderRadius: 999,
                  padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                }}>Ben · G6</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 36 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-700)', textAlign: 'center', marginBottom: 10 }}>
            Enter your PIN
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
            {[1,2,3,4].map((n,i) => (
              <div key={n} style={{
                width: 46, height: 56, borderRadius: 14,
                border: '2px solid ' + (i < 2 ? 'var(--cm-indigo)' : 'var(--slate-200)'),
                background: i < 2 ? 'var(--cm-indigo-50)' : '#fff',
                display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 700,
                color: 'var(--cm-indigo)',
              }}>{i < 2 ? '•' : ''}</div>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--slate-400)' }}>
            Forgot? Ask your parent
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

/* ── Onboarding wizard (parent, mobile) ──────────────────── */
function AuthOnboarding() {
  const groups = [
    { code: 'A', name: 'Number sense', count: 20, picked: true },
    { code: 'B', name: 'Addition', count: 19, picked: true },
    { code: 'C', name: 'Subtraction', count: 17, picked: false },
    { code: 'E', name: 'Multiplication', count: 33, picked: true },
    { code: 'H', name: 'Division', count: 20, picked: false },
    { code: 'R', name: 'Geometry', count: 29, picked: false },
    { code: 'S', name: 'Geometric measurement', count: 17, picked: true },
    { code: 'N', name: 'Data and graphs', count: 16, picked: false },
  ];
  return (
    <IOSDevice title="Set up Ben">
      <div className="cm" style={{ padding: '18px 20px', background: 'var(--paper)', minHeight: '100%' }}>
        {/* progress */}
        <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 16 }}>
          <Icon name="chevronL" size={20} color="var(--slate-400)"/>
          <div className="cm-bar" style={{ flex: 1 }}><i style={{ width: '66%' }}/></div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--slate-500)' }}>2 of 3</div>
        </div>

        <div className="cm-pill indigo" style={{ marginBottom: 8 }}>Step 2 · Topics</div>
        <h2 className="display" style={{ fontSize: 30, margin: '0 0 6px', lineHeight: 1.1 }}>
          What should Ben practice?
        </h2>
        <p style={{ color: 'var(--slate-500)', fontSize: 14, margin: '0 0 16px' }}>
          Grade 6 · IXL Ontario. Pick the topic groups you want enabled. Your tutor will review the selection.
        </p>

        <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
          {groups.map(g => (
            <div key={g.code} style={{
              padding: '12px 14px', borderRadius: 14, background: '#fff',
              border: g.picked ? '1.5px solid var(--cm-indigo)' : '1px solid var(--slate-200)',
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: g.picked ? '0 0 0 4px var(--cm-indigo-50)' : 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center',
                background: g.picked ? 'var(--cm-indigo)' : 'var(--slate-100)',
                color: g.picked ? '#fff' : 'var(--slate-500)',
                fontWeight: 800, fontSize: 13,
              }}>{g.code}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>{g.count} skills</div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: 7,
                border: '1.5px solid ' + (g.picked ? 'var(--cm-indigo)' : 'var(--slate-300)'),
                background: g.picked ? 'var(--cm-indigo)' : '#fff',
                display: 'grid', placeItems: 'center',
              }}>
                {g.picked && <Icon name="check" size={14} color="#fff" stroke={3} />}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="cm-btn ghost" style={{ flex: 1 }}>Back</button>
          <button className="cm-btn primary" style={{ flex: 2 }}>
            Continue <Icon name="arrow" size={16} color="#fff"/>
          </button>
        </div>
      </div>
    </IOSDevice>
  );
}

Object.assign(window, { AuthSignIn, AuthKidLogin, AuthOnboarding });
