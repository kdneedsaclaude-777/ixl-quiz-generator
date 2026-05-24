"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  };
  badges: { code: string; name: string; description: string; icon: string }[];
};

// Animates the score count-up, XP bar fill, and staggered badge pops.
// All timings are short (≤1s) so revisiting the page doesn't feel slow.
export default function ChildResultsRunner({ childName, childId, quizId, score, xp, badges }: Props) {
  const [displayedScore, setDisplayedScore] = useState(0);
  const [xpFill, setXpFill] = useState(0);
  const [revealedBadges, setRevealedBadges] = useState(0);

  // Count score up in 600ms.
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      setDisplayedScore(Math.round(score.correct * easeOut(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score.correct]);

  // Fill XP bar after score animation (700ms delay), animate width to final %.
  useEffect(() => {
    const timer = setTimeout(() => {
      const finalPct = Math.round((xp.finalCurrentLevelXp / xp.finalNextLevelXp) * 100);
      setXpFill(finalPct);
    }, 700);
    return () => clearTimeout(timer);
  }, [xp.finalCurrentLevelXp, xp.finalNextLevelXp]);

  // Stagger badge reveals.
  useEffect(() => {
    if (badges.length === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    badges.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealedBadges((n) => Math.max(n, i + 1)), 1400 + i * 350));
    });
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [badges]);

  const tone = score.pct >= 80
    ? { bg: "bg-emerald-50 dark:bg-slate-800", border: "border-emerald-300 dark:border-emerald-500", text: "text-emerald-900 dark:text-emerald-200", emoji: "🌟", note: "Amazing work!" }
    : score.pct >= 50
      ? { bg: "bg-amber-50 dark:bg-slate-800", border: "border-amber-300 dark:border-amber-500", text: "text-amber-900 dark:text-amber-200", emoji: "💪", note: "Nice effort!" }
      : { bg: "bg-rose-50 dark:bg-slate-800", border: "border-rose-300 dark:border-rose-500", text: "text-rose-900 dark:text-rose-200", emoji: "🚀", note: "Keep going, you've got this!" };

  return (
    <main className="space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-amber-900 dark:text-amber-100">Great job, {childName}!</h1>
        <p className="text-sm text-amber-800 dark:text-amber-200">Here&apos;s how you did.</p>
      </header>

      <section className={`rounded-3xl border-2 ${tone.border} ${tone.bg} p-6 text-center shadow-sm`}>
        <div className={`text-6xl font-extrabold ${tone.text}`}>
          {displayedScore}<span className="text-3xl">/{score.total}</span>
        </div>
        <div className={`mt-1 text-xl font-bold ${tone.text}`}>{score.pct}%</div>
        <div className="mt-3 text-3xl" aria-hidden>{tone.emoji}</div>
        <p className={`mt-1 text-sm font-semibold ${tone.text}`}>{tone.note}</p>
      </section>

      <section className="rounded-2xl border-2 border-amber-200 bg-white p-5 shadow-sm dark:border-amber-800/50 dark:bg-slate-800">
        <div className="flex items-baseline justify-between">
          <div className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Level {xp.finalLevel}
            {xp.finalLevel > xp.startLevel && (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100">LEVEL UP!</span>
            )}
          </div>
          <div className="text-sm font-bold text-amber-800 dark:text-amber-200">+{xp.earned} XP</div>
        </div>
        <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950/60">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-1000 ease-out"
            style={{ width: `${xpFill}%` }}
          />
        </div>
        <div className="mt-1 text-right text-xs text-amber-700 dark:text-amber-300">
          {xp.finalCurrentLevelXp} / {xp.finalNextLevelXp} XP to next level
        </div>
      </section>

      {badges.length > 0 && (
        <section className="rounded-2xl border-2 border-yellow-300 bg-yellow-50 p-5 shadow-sm dark:border-yellow-600/60 dark:bg-yellow-950/30">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-800 dark:text-yellow-200">
            🎉 New badge{badges.length === 1 ? "" : "s"} unlocked!
          </h2>
          <ul className="mt-3 space-y-2">
            {badges.map((b, i) => (
              <li
                key={b.code}
                className={`flex items-center gap-3 rounded-xl border-2 border-yellow-300 bg-white px-4 py-3 transition-all duration-500 dark:border-yellow-600/60 dark:bg-slate-800 ${
                  revealedBadges > i ? "scale-100 opacity-100" : "scale-95 opacity-0"
                }`}
              >
                <span className="text-4xl" aria-hidden>{b.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-yellow-900 dark:text-yellow-100">{b.name}</div>
                  <div className="text-xs text-yellow-800 dark:text-yellow-200">{b.description}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PlayAgainButton studentId={childId} />
        <Link
          href="/child/home"
          className="rounded-2xl border-2 border-amber-300 bg-white px-6 py-4 text-center text-base font-bold text-amber-900 shadow-sm hover:bg-amber-50 dark:border-amber-700/60 dark:bg-slate-800 dark:text-amber-100 dark:hover:bg-slate-700"
        >
          Back to home
        </Link>
      </div>

      <p className="text-center text-xs text-amber-700 dark:text-amber-300">Quiz #{quizId}</p>
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
    <div className="space-y-1">
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="w-full rounded-2xl bg-amber-500 px-6 py-4 text-center text-base font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
      >
        {loading ? "Loading…" : "Play again ✏️"}
      </button>
      {error && <p className="text-xs text-rose-700">{error}</p>}
    </div>
  );
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
