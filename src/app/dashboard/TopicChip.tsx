"use client";

import Tooltip from "@/components/Tooltip";

export type TopicStrength = {
  letter: string;
  name: string;
  attempts: number;
  correct: number;
};

function tone(accuracy: number | null): { dot: string; label: string } {
  if (accuracy === null) return { dot: "bg-slate-300 dark:bg-slate-600", label: "no data yet" };
  if (accuracy >= 80) return { dot: "bg-emerald-500", label: "strong (≥80%)" };
  if (accuracy >= 50) return { dot: "bg-amber-500", label: "developing (50–79%)" };
  return { dot: "bg-rose-500", label: "needs work (<50%)" };
}

export default function TopicChip({ topic }: { topic: TopicStrength }) {
  const accuracy = topic.attempts === 0 ? null : Math.round((topic.correct / topic.attempts) * 100);
  const t = tone(accuracy);
  const tipLabel =
    accuracy === null
      ? `${topic.name}: no quizzes yet`
      : `${topic.name}: ${accuracy}% accuracy across ${topic.attempts} questions (${t.label})`;

  return (
    <Tooltip label={tipLabel}>
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
        <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />
        <span>{topic.name}</span>
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          {accuracy !== null ? `${accuracy}%` : "—"}
        </span>
      </span>
    </Tooltip>
  );
}
