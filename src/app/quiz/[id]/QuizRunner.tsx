"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QuizSettings, { type QuizMode } from "./QuizSettings";
import QuizProgressBar from "./QuizProgressBar";
import QuestionCard, { type QuestionView, type ResultView } from "./QuestionCard";

type SubmitResponse = {
  quizId: number;
  score: number;
  results: { questionId: number; correctAnswer: string; isCorrect: boolean }[];
};

export default function QuizRunner({
  quizId,
  studentId,
  questions,
  // "test" hides per-answer correctness/explanations on the quiz screen even
  // after submit (revealed only on the results page); "practice" shows the
  // inline feedback after submit. Defaults to practice for safety.
  mode: quizMode = "practice",
}: {
  quizId: number;
  studentId: number | null;
  questions: QuestionView[];
  mode?: "practice" | "test";
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [locked, setLocked] = useState<Record<number, boolean>>({});
  const [results, setResults] = useState<Map<number, ResultView> | null>(null);
  const [mode, setMode] = useState<QuizMode>("all");
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitted = results !== null;
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;

  function setAnswer(qid: number, key: string) {
    if (locked[qid] || submitted) return;
    setAnswers((prev) => {
      // A cleared text input must not count toward "all answered".
      if (key.trim() === "") {
        const next = { ...prev };
        delete next[qid];
        return next;
      }
      return { ...prev, [qid]: key };
    });
  }

  const handleTimeoutFor = useCallback(
    (qid: number, qIdx: number) => {
      setLocked((prev) => ({ ...prev, [qid]: true }));
      if (mode === "card" && qIdx < total - 1) {
        setCurrentIdx((idx) => (idx === qIdx ? qIdx + 1 : idx));
      }
    },
    [mode, total],
  );

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: stringKeys(answers) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to submit quiz");
      }
      const data = (await res.json()) as SubmitResponse;
      const map = new Map<number, ResultView>();
      for (const r of data.results) {
        map.set(r.questionId, { correctAnswer: r.correctAnswer, isCorrect: r.isCorrect });
      }
      setResults(map);
      if (mode === "card") setCurrentIdx(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }

  function continueToResults() {
    router.push(`/quiz/${quizId}/results${studentId ? `?studentId=${studentId}` : ""}`);
  }

  const visible = useMemo(() => (mode === "all" ? questions : [questions[currentIdx]]), [mode, questions, currentIdx]);

  return (
    <div className="space-y-4">
      <QuizSettings
        mode={mode}
        setMode={setMode}
        timerEnabled={timerEnabled}
        setTimerEnabled={setTimerEnabled}
        timerSeconds={timerSeconds}
        setTimerSeconds={setTimerSeconds}
        disabled={submitted}
      />
      <QuizProgressBar answered={answeredCount} total={total} />

      <div className="space-y-4">
        {visible.map((q) => {
          const idx = mode === "all" ? questions.indexOf(q) : currentIdx;
          return (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              total={total}
              selected={answers[q.id] ?? null}
              onSelect={(k) => setAnswer(q.id, k)}
              locked={Boolean(locked[q.id])}
              // Test mode never reveals correctness inline — feedback lives on
              // the results page only.
              result={quizMode === "test" ? null : (results?.get(q.id) ?? null)}
              // Timer only applies one-at-a-time — never in "all" mode, even
              // if the flag was left enabled from a previous card session.
              timerEnabled={timerEnabled && mode === "card"}
              timerSeconds={timerSeconds}
              paused={submitted || (mode === "card" && idx !== currentIdx)}
              onTimeout={() => handleTimeoutFor(q.id, idx)}
            />
          );
        })}
      </div>

      {error && <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {mode === "card" && !submitted && (
          <CardNav
            currentIdx={currentIdx}
            total={total}
            answeredHere={Boolean(answers[questions[currentIdx]?.id])}
            onPrev={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            onNext={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
          />
        )}
        <div className="flex gap-2 sm:ml-auto">
          {!submitted ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!allAnswered || submitting}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit quiz"}
            </button>
          ) : (
            <button
              type="button"
              onClick={continueToResults}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Continue to results →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CardNav({ currentIdx, total, answeredHere, onPrev, onNext }: {
  currentIdx: number; total: number; answeredHere: boolean; onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onPrev} disabled={currentIdx === 0} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">← Back</button>
      <span className="text-xs text-slate-500 dark:text-slate-400">{currentIdx + 1} / {total}</span>
      <button type="button" onClick={onNext} disabled={currentIdx === total - 1 || !answeredHere} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">Next →</button>
    </div>
  );
}

function stringKeys(obj: Record<number, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) out[String(k)] = v;
  return out;
}
