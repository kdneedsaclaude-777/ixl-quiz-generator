"use client";

export default function QuizProgressBar({
  answered,
  total,
}: {
  answered: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((answered / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <span>Progress</span>
        <span>
          {answered} of {total} answered ({pct}%)
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
        aria-label="Quiz progress"
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div
          className="h-full bg-indigo-600 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
