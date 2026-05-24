type Summary = {
  childCount: number;
  weekQuizzes: number;
  weekAvgScore: number | null;
  hardestTopic: { letter: string; name: string; accuracy: number } | null;
};

export default function SummaryCards({ s }: { s: Summary }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card label="Children" value={s.childCount.toString()} />
      <Card label="Quizzes this week" value={s.weekQuizzes.toString()} />
      <Card
        label="Avg score this week"
        value={s.weekAvgScore !== null ? `${Math.round(s.weekAvgScore)}%` : "—"}
      />
      <Card
        label="Hardest topic"
        value={s.hardestTopic ? `${Math.round(s.hardestTopic.accuracy * 100)}%` : "—"}
        hint={s.hardestTopic?.name ?? "No data yet"}
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
