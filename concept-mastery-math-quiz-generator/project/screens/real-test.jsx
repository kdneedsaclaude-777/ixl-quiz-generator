/* Concept Mastery — REAL TEST · student flow
   Five mobile screens that show what a graded test feels like to a kid.
   Visually restrained vs practice: white background, no kid colors,
   visible timer, no skill chip / no immediate feedback. */

/* tiny helper — the "REAL TEST" status bar that pins to the top */
const TestHeader = ({ q, total, time, flagged = 0 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <Icon name="lock" size={18} color="var(--slate-700)" />
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--cm-red)', letterSpacing: '.14em' }}>
        REAL TEST
      </div>
      <div style={{ fontSize: 11, color: 'var(--slate-500)', fontWeight: 600 }}>
        Question {q} of {total}
      </div>
    </div>
    <div style={{ flex: 1 }} />
    {flagged > 0 && (
      <div className="cm-pill amber" style={{ height: 22, fontSize: 11 }}>
        ⚑ {flagged}
      </div>
    )}
    <div className="mono" style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 999,
      background: time.danger ? 'var(--cm-rose-soft)' : 'var(--slate-100)',
      color: time.danger ? '#9F1239' : 'var(--ink)',
      fontWeight: 800, fontSize: 13,
    }}>
      <Icon name="clock" size={14} color={time.danger ? '#9F1239' : 'var(--slate-700)'} />
      {time.label}
    </div>
  </div>
);

/* ── A · INTAKE — "you're about to start a Real Test" ── */
function StudentTestIntake() {
  return (
    <IOSDevice title="Real Test">
      <div className="cm" style={{
        background: '#fff', minHeight: '100%', padding: '12px 18px 24px',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Icon name="x" size={22} color="var(--slate-400)" />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 999,
            background: 'var(--cm-rose-soft)', color: '#9F1239',
            fontSize: 11, fontWeight: 800, letterSpacing: '.12em',
          }}>
            <Icon name="lock" size={11} color="#9F1239" /> REAL TEST
          </div>
        </div>

        <div style={{ marginTop: 28, textAlign: 'left' }}>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>
            ASSIGNED BY MOM · DUE TODAY
          </div>
          <div className="display" style={{
            fontSize: 38, lineHeight: 1.05, marginTop: 6, letterSpacing: '-.01em',
          }}>
            Ready for your<br />Fractions test, Ben?
          </div>
        </div>

        {/* quiz card */}
        <div style={{
          marginTop: 22, padding: 18, borderRadius: 20,
          background: 'var(--paper)', border: '1px solid var(--slate-200)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 600 }}>FRACTIONS · GRADE 6</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>Unit check · May 30</div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--cm-indigo-50)', display: 'grid', placeItems: 'center',
            }}>
              <Icon name="file" size={20} color="var(--cm-indigo)" />
            </div>
          </div>
          <div style={{
            marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8, textAlign: 'center',
          }}>
            <div>
              <div className="display" style={{ fontSize: 22, color: 'var(--ink)' }}>10</div>
              <div style={{ fontSize: 10, color: 'var(--slate-500)', fontWeight: 600 }}>QUESTIONS</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--slate-200)', borderRight: '1px solid var(--slate-200)' }}>
              <div className="display" style={{ fontSize: 22, color: 'var(--ink)' }}>20:00</div>
              <div style={{ fontSize: 10, color: 'var(--slate-500)', fontWeight: 600 }}>TIMER</div>
            </div>
            <div>
              <div className="display" style={{ fontSize: 22, color: 'var(--cm-red)' }}>1</div>
              <div style={{ fontSize: 10, color: 'var(--slate-500)', fontWeight: 600 }}>ATTEMPT</div>
            </div>
          </div>
        </div>

        {/* rules */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 700, letterSpacing: '.06em', marginBottom: 8 }}>
            HOW THIS TEST WORKS
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['clock',  'You have 20 minutes',          'Timer starts when you tap Start.'],
              ['eye',    'No hints, no explanations',    'You\'ll only see your score at the end.'],
              ['target', 'You can flag & come back',     'Use the navigator to skip and return.'],
              ['lock',   'Submit when you\'re done',     'You can\'t change answers after submit.'],
            ].map(([i, t, d], k) => (
              <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'var(--slate-100)', display: 'grid', placeItems: 'center', flex: 'none',
                }}>
                  <Icon name={i} size={16} color="var(--slate-700)" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{t}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 1 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <button className="cm-btn primary lg" style={{
          width: '100%', marginTop: 18,
          background: 'var(--ink)', // serious / not coral
        }}>
          Start test · 20:00 <Icon name="arrow" size={18} color="#fff" />
        </button>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--slate-500)' }}>
          Not ready? <span style={{ color: 'var(--cm-blue)', fontWeight: 700 }}>Tell Mom</span>
        </div>
      </div>
    </IOSDevice>
  );
}

/* ── B · IN-TEST QUESTION — timed, no feedback ── */
function StudentTestQuestion() {
  const dots = Array.from({ length: 10 }, (_, i) => i);
  const answered = new Set([0, 1, 2, 4]); // current = 4
  const flagged  = new Set([3]);
  const current  = 4;
  const options = [
    { k: 'A', t: '3⁄4' },
    { k: 'B', t: '5⁄8' },
    { k: 'C', t: '7⁄12' },
    { k: 'D', t: '11⁄24' },
  ];
  return (
    <IOSDevice>
      <div className="cm" style={{
        background: '#fff', minHeight: '100%', padding: '12px 18px 24px',
        display: 'flex', flexDirection: 'column',
      }}>
        <TestHeader q={5} total={10} time={{ label: '14:38' }} flagged={1} />

        {/* progress dots */}
        <div style={{ marginTop: 14, display: 'flex', gap: 4 }}>
          {dots.map(i => (
            <div key={i} style={{
              flex: 1, height: 6, borderRadius: 999,
              background:
                i === current ? 'var(--ink)'
                : flagged.has(i) ? 'var(--cm-amber)'
                : answered.has(i) ? 'var(--slate-700)'
                : 'var(--slate-200)',
            }} />
          ))}
        </div>

        {/* question */}
        <div style={{ marginTop: 24 }}>
          <div className="display" style={{ fontSize: 26, lineHeight: 1.2, letterSpacing: '-.01em' }}>
            Which fraction is equal to{' '}
            <span style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 22, lineHeight: 1, verticalAlign: 'middle',
            }}>
              <span>1</span>
              <span style={{ borderTop: '2px solid currentColor', padding: '2px 6px 0' }}>2</span>
            </span>
            {' '}+{' '}
            <span style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 22, lineHeight: 1, verticalAlign: 'middle',
            }}>
              <span>1</span>
              <span style={{ borderTop: '2px solid currentColor', padding: '2px 6px 0' }}>8</span>
            </span>
            ?
          </div>
        </div>

        {/* options — no highlighted "selected" state, neutral interaction */}
        <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
          {options.map((o, i) => {
            const selected = i === 1;
            return (
              <div key={o.k} style={{
                padding: '14px 16px', borderRadius: 14, background: '#fff',
                border: selected ? '2px solid var(--ink)' : '1px solid var(--slate-200)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: selected ? 'var(--ink)' : 'var(--slate-100)',
                  color: selected ? '#fff' : 'var(--slate-700)',
                  fontWeight: 800, display: 'grid', placeItems: 'center', fontSize: 13,
                }}>{o.k}</div>
                <div style={{ fontWeight: 600, fontSize: 17 }}>{o.t}</div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* bottom action row — Flag · Prev · Next */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr', gap: 8, marginTop: 18 }}>
          <button className="cm-btn ghost" style={{ width: 44, height: 56, padding: 0, borderRadius: 14 }} title="Flag for review">
            <Icon name="star" size={18} color="var(--slate-700)" />
          </button>
          <button className="cm-btn ghost lg" style={{ borderRadius: 14 }}>Previous</button>
          <button className="cm-btn lg" style={{ borderRadius: 14, background: 'var(--ink)', color: '#fff' }}>
            Next <Icon name="arrow" size={16} color="#fff" />
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--slate-500)' }}>
          Tap <Icon name="grid" size={11} color="var(--slate-500)" /> to jump to any question
        </div>
      </div>
    </IOSDevice>
  );
}

/* ── C · QUESTION NAVIGATOR — grid of all questions ── */
function StudentTestNavigator() {
  const states = ['done','done','done','flag','curr','none','done','flag','none','none'];
  return (
    <IOSDevice>
      <div className="cm" style={{
        background: '#fff', minHeight: '100%', padding: '12px 18px 24px',
        display: 'flex', flexDirection: 'column',
      }}>
        <TestHeader q={5} total={10} time={{ label: '12:14' }} flagged={2} />

        <div style={{ marginTop: 24 }}>
          <div className="display" style={{ fontSize: 26, letterSpacing: '-.01em' }}>
            Jump to a question
          </div>
          <div style={{ fontSize: 13, color: 'var(--slate-500)', marginTop: 4 }}>
            4 answered · 2 flagged · 4 to go
          </div>
        </div>

        {/* grid 5×2 */}
        <div style={{
          marginTop: 18, padding: 18, borderRadius: 18,
          background: 'var(--paper)', border: '1px solid var(--slate-200)',
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10,
        }}>
          {states.map((s, i) => {
            const bg =
              s === 'done' ? 'var(--ink)'
              : s === 'flag' ? '#fff'
              : s === 'curr' ? '#fff'
              : '#fff';
            const fg = s === 'done' ? '#fff' : 'var(--ink)';
            const border =
              s === 'curr' ? '2px solid var(--cm-blue)'
              : s === 'flag' ? '2px solid var(--cm-amber)'
              : s === 'done' ? '2px solid var(--ink)'
              : '1px solid var(--slate-200)';
            return (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 14, background: bg, border,
                display: 'grid', placeItems: 'center', position: 'relative',
                fontWeight: 800, fontSize: 18, color: fg,
              }}>
                {i + 1}
                {s === 'flag' && (
                  <div style={{ position: 'absolute', top: 5, right: 5, color: 'var(--cm-amber)' }}>
                    <Icon name="star" size={11} color="var(--cm-amber)" />
                  </div>
                )}
                {s === 'done' && (
                  <div style={{ position: 'absolute', top: 5, right: 5 }}>
                    <Icon name="check" size={11} color="#fff" stroke={3} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* legend */}
        <div style={{ marginTop: 14, display: 'flex', gap: 14, fontSize: 11, color: 'var(--slate-700)', flexWrap: 'wrap' }}>
          {[
            ['var(--ink)', 'Answered'],
            ['#fff',       'Not yet · grey border'],
            ['var(--cm-amber)', 'Flagged ★'],
            ['var(--cm-blue)',  'Current · blue ring'],
          ].map(([c, l], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: c, border: '1px solid var(--slate-300)' }} />
              {l}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          <button className="cm-btn ghost lg" style={{ borderRadius: 14 }}>Keep going</button>
          <button className="cm-btn lg" style={{ borderRadius: 14, background: 'var(--cm-red)', color: '#fff' }}>
            Submit test
          </button>
        </div>
      </div>
    </IOSDevice>
  );
}

/* ── D · SUBMIT CONFIRMATION ── */
function StudentTestSubmitConfirm() {
  return (
    <IOSDevice>
      <div className="cm" style={{
        background: 'rgba(15,23,42,.55)', minHeight: '100%',
        display: 'flex', alignItems: 'flex-end',
      }}>
        {/* dim underlying screen */}
        <div style={{
          width: '100%', background: '#fff',
          borderRadius: '24px 24px 0 0', padding: '20px 22px 24px',
          boxShadow: '0 -20px 60px rgba(0,0,0,.2)',
        }}>
          <div style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--slate-200)', margin: '0 auto 18px' }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: 'var(--cm-rose-soft)', display: 'grid', placeItems: 'center',
              margin: '0 auto 12px',
            }}>
              <Icon name="lock" size={26} color="var(--cm-red)" />
            </div>
            <div className="display" style={{ fontSize: 26, letterSpacing: '-.01em' }}>
              Submit your test?
            </div>
            <div style={{ fontSize: 13, color: 'var(--slate-500)', marginTop: 6, lineHeight: 1.5 }}>
              Once you submit, you can't change any answers.<br />
              Your score will be sent to Mom.
            </div>
          </div>

          {/* summary tiles */}
          <div style={{
            marginTop: 18, padding: 14, borderRadius: 16,
            background: 'var(--paper)', border: '1px solid var(--slate-200)',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center',
          }}>
            <div>
              <div className="display" style={{ fontSize: 24, color: 'var(--cm-mint)' }}>8</div>
              <div style={{ fontSize: 10, color: 'var(--slate-500)', fontWeight: 700 }}>ANSWERED</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--slate-200)', borderRight: '1px solid var(--slate-200)' }}>
              <div className="display" style={{ fontSize: 24, color: 'var(--cm-amber)' }}>2</div>
              <div style={{ fontSize: 10, color: 'var(--slate-500)', fontWeight: 700 }}>FLAGGED</div>
            </div>
            <div>
              <div className="display" style={{ fontSize: 24, color: 'var(--cm-red)' }}>2</div>
              <div style={{ fontSize: 10, color: 'var(--slate-500)', fontWeight: 700 }}>BLANK</div>
            </div>
          </div>

          <div style={{
            marginTop: 12, padding: 12, borderRadius: 12,
            background: 'var(--cm-amber-soft)', border: '1px solid rgba(232,163,23,.4)',
            display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: '#92400E',
          }}>
            <Icon name="bell" size={16} color="#92400E" />
            <span><strong>2 questions are blank.</strong> Blank counts as wrong.</span>
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            <button className="cm-btn lg" style={{ background: 'var(--cm-red)', color: '#fff', width: '100%' }}>
              Submit test now
            </button>
            <button className="cm-btn ghost lg" style={{ width: '100%' }}>
              Go back · 12:14 left
            </button>
          </div>
        </div>
      </div>
    </IOSDevice>
  );
}

/* ── E · SUBMITTED · graded score with locked review ── */
function StudentTestResult() {
  return (
    <IOSDevice>
      <div className="cm" style={{
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 55%, var(--paper) 55.1%)',
        minHeight: '100%', padding: '14px 18px 24px',
      }}>
        {/* top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 999,
            background: 'rgba(255,255,255,.12)', color: '#fff',
            fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
          }}>
            <Icon name="lock" size={11} color="#fff" /> REAL TEST · GRADED
          </div>
          <Icon name="x" size={20} color="rgba(255,255,255,.6)" />
        </div>

        {/* score reveal */}
        <div style={{ marginTop: 26, textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 12, opacity: .7, fontWeight: 700, letterSpacing: '.12em' }}>YOUR SCORE</div>
          <div className="display" style={{ fontSize: 110, lineHeight: 1, margin: '6px 0' }}>
            75<span style={{ fontSize: 48, opacity: .7 }}>%</span>
          </div>
          <div style={{ fontSize: 14, opacity: .8 }}>Fractions · Unit check · May 30</div>
        </div>

        {/* score breakdown */}
        <div className="cm-card" style={{ marginTop: 26, padding: 18, borderRadius: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center' }}>
            <div>
              <div className="display" style={{ fontSize: 22, color: 'var(--cm-mint)' }}>7</div>
              <div style={{ fontSize: 9, color: 'var(--slate-500)', fontWeight: 700 }}>CORRECT</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--slate-200)' }}>
              <div className="display" style={{ fontSize: 22, color: 'var(--cm-red)' }}>2</div>
              <div style={{ fontSize: 9, color: 'var(--slate-500)', fontWeight: 700 }}>WRONG</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--slate-200)' }}>
              <div className="display" style={{ fontSize: 22, color: 'var(--cm-amber)' }}>1</div>
              <div style={{ fontSize: 9, color: 'var(--slate-500)', fontWeight: 700 }}>BLANK</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--slate-200)' }}>
              <div className="display" style={{ fontSize: 22, color: 'var(--ink)' }}>14:22</div>
              <div style={{ fontSize: 9, color: 'var(--slate-500)', fontWeight: 700 }}>TIME USED</div>
            </div>
          </div>

          <div style={{
            marginTop: 14, padding: 12, borderRadius: 12,
            background: 'var(--slate-50)', border: '1px solid var(--slate-200)',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Icon name="lock" size={18} color="var(--slate-500)" />
            <div style={{ fontSize: 12, color: 'var(--slate-700)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--ink)' }}>Answers are locked.</strong> Because this was a test, you won't
              see explanations until <strong>Mom unlocks review</strong> from her dashboard.
            </div>
          </div>
        </div>

        {/* what's next */}
        <div style={{
          marginTop: 14, padding: 14, borderRadius: 16,
          background: '#fff', border: '1px solid var(--slate-200)',
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: 'var(--cm-mint-soft)',
            display: 'grid', placeItems: 'center',
          }}>
            <Icon name="target" size={22} color="#047857" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Practice fractions next?</div>
            <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
              We'll focus on the 2 skills you missed.
            </div>
          </div>
          <Icon name="chevron" size={18} color="var(--slate-400)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <button className="cm-btn ghost lg" style={{ background: '#fff' }}>Back home</button>
          <button className="cm-btn lg" style={{ background: 'var(--cm-blue)', color: '#fff' }}>
            Start practice
          </button>
        </div>
      </div>
    </IOSDevice>
  );
}

Object.assign(window, {
  StudentTestIntake, StudentTestQuestion, StudentTestNavigator,
  StudentTestSubmitConfirm, StudentTestResult,
});
