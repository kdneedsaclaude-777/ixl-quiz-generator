type MasteryRow = {
  topicLetter: string;
  topicName: string;
  skillCode: string;
  skillName: string;
  totalAttempts: number;
  totalCorrect: number;
};

// Picks the 3 topics with the lowest accuracy (min 2 attempts to count).
// Shows a horizontal bar with % correct and the underlying weak skill.
export default function WeakTopicsPanel({ mastery }: { mastery: MasteryRow[] }) {
  const byTopic = new Map<string, { letter: string; name: string; attempts: number; correct: number; worstSkill: { code: string; name: string; accuracy: number } | null }>();
  for (const m of mastery) {
    const acc = m.totalAttempts > 0 ? m.totalCorrect / m.totalAttempts : 1;
    const entry = byTopic.get(m.topicLetter) ?? { letter: m.topicLetter, name: m.topicName, attempts: 0, correct: 0, worstSkill: null };
    entry.attempts += m.totalAttempts;
    entry.correct += m.totalCorrect;
    if (m.totalAttempts >= 2 && (!entry.worstSkill || acc < entry.worstSkill.accuracy)) {
      entry.worstSkill = { code: m.skillCode, name: m.skillName, accuracy: acc };
    }
    byTopic.set(m.topicLetter, entry);
  }
  const ranked = [...byTopic.values()]
    .filter((e) => e.attempts >= 2)
    .map((e) => ({ ...e, accuracy: e.correct / e.attempts }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  if (ranked.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Weak topics</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Not enough quiz history yet. Once your child completes more questions, the three weakest topics will show here.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-800 dark:text-rose-200">Focus topics</h2>
      <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">The three topics with the lowest accuracy — practice will weight these first.</p>
      <ul className="mt-3 space-y-3">
        {ranked.map((r) => {
          const pct = Math.round(r.accuracy * 100);
          const tone = pct < 50 ? "bg-rose-500" : pct < 80 ? "bg-amber-500" : "bg-emerald-500";
          return (
            <li key={r.letter}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {r.name}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{pct}% · {r.attempts} questions</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
              </div>
              {r.worstSkill && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Weakest skill: <span className="font-medium text-slate-700 dark:text-slate-300">{r.worstSkill.name}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
