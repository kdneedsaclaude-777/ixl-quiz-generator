"use client";

import Tooltip from "@/components/Tooltip";

const DESCRIPTIONS: Record<number, string> = {
  1: "Recall — basic facts and definitions.",
  2: "Understanding — short MCQs with light reasoning.",
  3: "Application — multi-step questions and word problems.",
  4: "Analysis — multi-step word problems requiring strategy.",
  5: "Exam-style — complex multi-step problems.",
};

export default function DifficultyBadge({ level }: { level: number }) {
  const clamped = Math.max(1, Math.min(5, level));
  const desc = DESCRIPTIONS[clamped] ?? "";
  const label = `Level ${clamped} — ${desc} Difficulty auto-increases by 1 after a quiz score of 80% or higher, holds at 50–79%, and steps back below 50%.`;
  return (
    <Tooltip label={label}>
      <span
        aria-label={`Current difficulty: level ${clamped}`}
        className="inline-flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200"
      >
        Level {clamped}
        <span aria-hidden="true" className="text-[10px] opacity-70">ⓘ</span>
      </span>
    </Tooltip>
  );
}
