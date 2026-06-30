"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type HistoryRow = {
  id: number;
  date: string;
  topic: string;
  title: string;
  questionCount: number;
  difficultyLabel: string;
  status: string;
  score: number | null;
};

type StatusFilter = "all" | "completed" | "in_progress";

// Quiz history with client-side filtering by topic and status.
export default function QuizHistory({ rows, studentId }: { rows: HistoryRow[]; studentId: number }) {
  const [topic, setTopic] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const topics = useMemo(() => {
    return ["all", ...Array.from(new Set(rows.map((r) => r.topic)))];
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (topic !== "all" && r.topic !== topic) return false;
    if (status === "completed" && r.status !== "completed") return false;
    if (status === "in_progress" && r.status === "completed") return false;
    return true;
  });

  const chip = (active: boolean) =>
    `rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
      active ? "bg-cm-blue text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`;

  return (
    <div className="cm-card p-[18px]">
      <h3 className="mb-3 text-[15px] font-bold text-slate-900">Quiz history</h3>

      {rows.length > 0 && (
        <div className="mb-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {(["all", "completed", "in_progress"] as StatusFilter[]).map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)} className={chip(status === s)}>
                {s === "all" ? "All" : s === "completed" ? "Completed" : "In progress"}
              </button>
            ))}
          </div>
          {topics.length > 2 && (
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <button key={t} type="button" onClick={() => setTopic(t)} className={chip(topic === t)}>
                  {t === "all" ? "All topics" : t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          {rows.length === 0 ? "No quizzes yet." : "No quizzes match these filters."}
        </p>
      ) : (
        <div>
          {filtered.map((r, i) => {
            const done = r.status === "completed";
            return (
              <div
                key={r.id}
                className="grid items-center gap-2.5 py-2.5"
                style={{ gridTemplateColumns: "56px 1fr 96px 64px 56px", borderTop: i === 0 ? "none" : "1px solid var(--slate-100)" }}
              >
                <div className="text-xs font-semibold text-slate-500">{r.date}</div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{r.title}</div>
                  <div className="text-[11px] text-slate-500">{r.questionCount} questions · {r.difficultyLabel}</div>
                </div>
                <div>
                  {done ? (
                    <span className="cm-pill mint" style={{ fontSize: 11 }}>Completed</span>
                  ) : (
                    <span className="cm-pill amber" style={{ fontSize: 11 }}>In progress</span>
                  )}
                </div>
                <div className="text-right">
                  {r.score !== null ? (
                    <span className="font-display text-xl" style={{ color: r.score >= 80 ? "var(--cm-mint)" : "var(--cm-gold)" }}>{r.score}%</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
                <div className="text-right">
                  <Link
                    href={done ? `/quiz/${r.id}/results?studentId=${studentId}` : `/quiz/${r.id}?studentId=${studentId}`}
                    className="text-xs font-semibold"
                    style={{ color: "var(--cm-blue)" }}
                  >
                    {done ? "View" : "Resume"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
