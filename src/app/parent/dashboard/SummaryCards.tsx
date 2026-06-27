type Summary = {
  childCount: number;
  // Most recent completed-quiz score across all children (client asked to
  // replace the weekly average with the last quiz score).
  lastQuizScore: number | null;
  // Total quizzes generated across all children (attempted).
  quizzesAttempted: number;
  // Completed (submitted) vs generated-but-not-completed.
  submitted: number;
  notSubmitted: number;
};

export default function SummaryCards({ s }: { s: Summary }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card label="Children" value={s.childCount.toString()} />
      <Card
        label="Last quiz score"
        value={s.lastQuizScore !== null ? `${Math.round(s.lastQuizScore)}%` : "—"}
      />
      <Card label="Quizzes attempted" value={s.quizzesAttempted.toString()} />
      <Card
        label="Submitted / not"
        value={`${s.submitted} / ${s.notSubmitted}`}
        hint={`${s.submitted} submitted · ${s.notSubmitted} not submitted`}
      />
    </section>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </div>
  );
}
