"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { levelTitle, XP_REASON_LABEL, type XpReason } from "@/lib/domain/gamification";

type Props = {
  childName: string;
  childId: number;
  quizId: number;
  score: { correct: number; total: number; pct: number };
  xp: {
    earned: number;
    startXp: number;
    finalXp: number;
    startLevel: number;
    finalLevel: number;
    finalCurrentLevelXp: number;
    finalNextLevelXp: number;
    breakdown?: { base: number; bonuses: { reason: string; amount: number }[] };
  };
  badges: { code: string; name: string; description: string; icon: string }[];
};

// Results, rebuilt to match the design bundle (student.jsx StudentResults):
// a brand blue→violet gradient header with the huge serif score reveal, a
// 3-up breakdown card (correct / missed / XP), and staggered badge-unlock
// cards. All count-up / XP-fill / stagger animation logic is unchanged.
export default function ChildResultsRunner({ childName, childId, quizId, score, xp, badges }: Props) {
  const [displayedPct, setDisplayedPct] = useState(0);
  const [revealedBadges, setRevealedBadges] = useState(0);

  // Count the headline percentage up in 700ms.
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      setDisplayedPct(Math.round(score.pct * easeOut(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score.pct]);

  // Stagger badge reveals after the score animation.
  useEffect(() => {
    if (badges.length === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    badges.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealedBadges((n) => Math.max(n, i + 1)), 1100 + i * 350));
    });
    return () => { for (const t of timers) clearTimeout(t); };
  }, [badges]);

  const missed = score.total - score.correct;
  const leveledUp = xp.finalLevel > xp.startLevel;
  const rank = levelTitle(xp.finalLevel);
  const prevRank = levelTitle(xp.startLevel);
  const rankChanged = leveledUp && rank.title !== prevRank.title;
  const bonuses = xp.breakdown?.bonuses ?? [];
  const base = xp.breakdown?.base ?? xp.earned;

  return (
    <main className="-mx-5 -mt-4">
      {/* Gradient header with the score reveal (blue → violet, like the design) */}
      <div
        className="relative px-5 pb-8 pt-8 text-center text-white"
        style={{ background: "linear-gradient(180deg, var(--cm-blue-600) 0%, var(--kid-violet-700) 100%)" }}
      >
        <div className="text-[13px] font-semibold uppercase tracking-[.1em] opacity-90">Quiz complete</div>
        <div className="font-display leading-none" style={{ fontSize: 96 }}>
          {displayedPct}<span style={{ fontSize: 48 }}>%</span>
        </div>
        <div className="text-sm opacity-90">{score.correct} of {score.total} correct</div>
      </div>

      {/* Content sits on the paper background, pulled up under the header curve */}
      <div className="space-y-4 px-5 pt-5">
        {/* breakdown card */}
        <section className="cm-card -mt-12 p-[18px] shadow-pop">
          <div className="grid grid-cols-3 text-center">
            <div>
              <div className="font-display text-2xl" style={{ color: "var(--cm-mint)" }}>{score.correct}</div>
              <div className="text-[11px] font-semibold text-slate-500">CORRECT</div>
            </div>
            <div className="border-x border-slate-200">
              <div className="font-display text-2xl" style={{ color: "var(--cm-rose)" }}>{missed}</div>
              <div className="text-[11px] font-semibold text-slate-500">MISSED</div>
            </div>
            <div>
              <div className="font-display text-2xl" style={{ color: "var(--cm-blue)" }}>+{xp.earned}</div>
              <div className="text-[11px] font-semibold text-slate-500">XP EARNED</div>
            </div>
          </div>

          {/* Itemized XP reveal: base + each bonus. */}
          {bonuses.length > 0 && (
            <div className="mt-4 space-y-1.5 rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Base score</span>
                <span className="font-mono font-semibold text-slate-700">+{base}</span>
              </div>
              {bonuses.map((b, i) => (
                <div
                  key={`${b.reason}-${i}`}
                  className="flex items-center justify-between text-xs"
                  style={{ color: "var(--cm-blue)" }}
                >
                  <span className="font-semibold">{XP_REASON_LABEL[b.reason as XpReason] ?? "Bonus"}</span>
                  <span className="font-mono font-bold">+{b.amount}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-xs">
                <span className="font-bold text-slate-900">Total XP</span>
                <span className="font-mono font-extrabold text-slate-900">+{xp.earned}</span>
              </div>
            </div>
          )}

          {leveledUp && (
            <div
              className="mt-4 flex items-center gap-3 rounded-2xl p-3.5"
              style={{ background: "var(--cm-mint-soft)" }}
            >
              <div className="text-2xl">{rankChanged ? "🎖️" : "📈"}</div>
              <div className="flex-1">
                <div className="text-sm font-extrabold text-emerald-800">
                  {rankChanged
                    ? `New rank unlocked — you're a ${rank.title}!`
                    : `Level up — you're now Level ${xp.finalLevel}!`}
                </div>
                <div className="text-xs text-emerald-800/85">
                  {rankChanged
                    ? `Level ${xp.finalLevel} reached. You're ready for harder questions.`
                    : "You're ready for harder questions."}
                </div>
              </div>
            </div>
          )}

          <div className="mt-3">
            <div className="flex justify-between text-[11px] font-medium text-slate-500">
              <span>Level {xp.finalLevel}</span>
              <span>{xp.finalCurrentLevelXp} / {xp.finalNextLevelXp} XP</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-out"
                style={{
                  width: `${Math.round((xp.finalCurrentLevelXp / xp.finalNextLevelXp) * 100)}%`,
                  background: "linear-gradient(90deg, var(--cm-blue-600), var(--kid-violet-700))",
                }}
              />
            </div>
          </div>
        </section>

        {/* badge unlocks */}
        {badges.map((b, i) => (
          <section
            key={b.code}
            className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 transition-all duration-500"
            style={{ opacity: revealedBadges > i ? 1 : 0, transform: revealedBadges > i ? "scale(1)" : "scale(.95)" }}
          >
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl text-2xl"
              style={{ background: "linear-gradient(135deg, #FACC15, #F97066)", boxShadow: "0 4px 14px rgba(249,112,102,.4)" }}
            >
              {b.icon}
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-extrabold text-cm-red">NEW BADGE UNLOCKED</div>
              <div className="mt-0.5 text-[17px] font-extrabold text-slate-900">{b.name}</div>
              <div className="text-xs text-slate-500">{b.description}</div>
            </div>
          </section>
        ))}

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-2.5 pb-2">
          <Link href="/child/home" className="cm-btn ghost lg justify-center bg-white">
            Back home
          </Link>
          <PlayAgainButton studentId={childId} />
        </div>
        <p className="text-center text-xs text-slate-400">Quiz #{quizId} · Nice work, {childName}!</p>
      </div>
    </main>
  );
}

function PlayAgainButton({ studentId }: { studentId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, questionCount: 10 }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Couldn't start a quiz.");
      }
      const { quizId } = await res.json();
      window.location.href = `/child/quiz/${quizId}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start a quiz.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={start} disabled={loading} className="cm-btn primary lg w-full justify-center disabled:opacity-50">
        {loading ? "Loading…" : "Practice again"}
      </button>
      {error && <p className="mt-1 text-xs text-rose-700">{error}</p>}
    </div>
  );
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
