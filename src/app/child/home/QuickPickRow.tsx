"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Topic = { letter: string; name: string; mastery: number | null };

// Horizontal "jump back into a topic" row. Each card starts a topic-targeted
// practice quiz. Topics + mastery are real (enabled StudentTopicSelection rolled
// up from ConceptMastery, most-recent first).
export default function QuickPickRow({ studentId, topics }: { studentId: number; topics: Topic[] }) {
  const router = useRouter();
  const [loadingLetter, setLoadingLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (topics.length === 0) return null;

  async function start(topicLetter: string) {
    setError(null);
    setLoadingLetter(topicLetter);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, questionCount: 10, topicLetter }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Couldn't start that quiz right now.");
      }
      const { quizId } = await res.json();
      router.push(`/child/quiz/${quizId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start that quiz right now.");
      setLoadingLetter(null);
    }
  }

  return (
    <section>
      <h3 className="mb-2 text-sm font-bold text-slate-700">JUMP BACK IN</h3>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {topics.map((t) => (
          <button
            key={t.letter}
            type="button"
            onClick={() => start(t.letter)}
            disabled={loadingLetter !== null}
            aria-label={`Practise ${t.name}`}
            className="cm-card w-36 shrink-0 p-3 text-left transition-transform active:translate-y-0.5 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cm-blue"
          >
            <div className="flex items-center gap-2">
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold text-white"
                style={{ background: "var(--cm-blue)" }}
              >
                {t.letter}
              </span>
              <span className="line-clamp-2 text-xs font-bold leading-tight text-slate-900">{t.name}</span>
            </div>
            <div className="mt-2.5 cm-bar">
              <i
                style={{
                  width: `${t.mastery ?? 0}%`,
                  background: (t.mastery ?? 0) < 60 ? "var(--cm-coral)" : "var(--cm-blue)",
                }}
              />
            </div>
            <div className="mt-1 text-[10px] font-semibold text-slate-500">
              {loadingLetter === t.letter ? "Starting…" : t.mastery === null ? "New" : `${t.mastery}% mastered`}
            </div>
          </button>
        ))}
      </div>
      {error && <p className="mt-1.5 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p>}
    </section>
  );
}
