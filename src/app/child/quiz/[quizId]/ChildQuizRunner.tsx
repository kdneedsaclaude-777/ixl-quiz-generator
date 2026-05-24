"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import UnitLabel from "@/components/UnitLabel";
import QuestionVisual from "@/components/QuestionVisual";
import { gradeAnswer, isFreeInputType } from "@/lib/domain/grading";

type ChildQuestion = {
  id: number;
  skillCode: string;
  unit: string;
  skillTitle: string;
  displayLabel: string;
  questionText: string;
  questionType: string;
  options: Record<string, string>;
  correctAnswer: string;
  visualSvg: string | null;
  visualNote: string | null;
};

type Answer = { key: string; isCorrect: boolean };

// Kid-friendly one-at-a-time runner. Each answer tap shows immediate feedback
// (green if right, red if wrong) and a "Next →" button. Last question's Next
// becomes "Finish quiz" and POSTs all answers in a single submit call.
export default function ChildQuizRunner({
  quizId,
  childName,
  questions,
}: {
  quizId: number;
  childName: string;
  questions: ChildQuestion[];
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [typedById, setTypedById] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = questions[idx];
  const total = questions.length;
  const myAnswer = answers[current.id];
  const isLast = idx === total - 1;
  const isTyped = isFreeInputType(current.questionType);
  const typedValue = typedById[current.id] ?? "";

  // Encouragement varies a bit to keep it from feeling robotic.
  const encouragements = useMemo(
    () => ({
      right: ["Nice!", "You got it!", "Yes!", "Boom!", "Perfect!"],
      wrong: ["Good try!", "Almost!", "Keep going!", "You'll get the next one!"],
    }),
    [],
  );

  function pick(key: string) {
    if (myAnswer) return; // can't change after picking
    const isCorrect = gradeAnswer(current.questionType, key, current.correctAnswer);
    setAnswers((prev) => ({ ...prev, [current.id]: { key, isCorrect } }));
  }

  function checkTyped() {
    if (myAnswer || typedValue.trim() === "") return;
    const isCorrect = gradeAnswer(current.questionType, typedValue, current.correctAnswer);
    setAnswers((prev) => ({ ...prev, [current.id]: { key: typedValue, isCorrect } }));
  }

  async function finish() {
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, string> = {};
      for (const [qid, a] of Object.entries(answers)) payload[qid] = a.key;
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Couldn't submit your quiz.");
      }
      router.push(`/child/quiz/${quizId}/results`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit your quiz.");
      setSubmitting(false);
    }
  }

  return (
    <main className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-amber-700">
          Question {idx + 1} of {total}
        </div>
        <div className="flex gap-1.5">
          {questions.map((q, i) => (
            <span
              key={q.id}
              aria-hidden
              className={`h-2 w-6 rounded-full ${
                answers[q.id]?.isCorrect
                  ? "bg-emerald-500"
                  : answers[q.id]
                    ? "bg-rose-500"
                    : i === idx
                      ? "bg-amber-400"
                      : "bg-amber-200"
              }`}
            />
          ))}
        </div>
      </div>

      <section className="rounded-3xl border-2 border-amber-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          <UnitLabel unit={current.unit} title={current.skillTitle} code={current.skillCode} />
        </div>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{current.questionText}</h2>

        <QuestionVisual svg={current.visualSvg} note={current.visualNote} />

        {isTyped ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor={`child-q-${current.id}`}>Your answer</label>
            <input
              id={`child-q-${current.id}`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={typedValue}
              disabled={!!myAnswer}
              onChange={(e) => setTypedById((p) => ({ ...p, [current.id]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") checkTyped(); }}
              placeholder="Type your answer"
              className={`flex-1 rounded-2xl border-2 px-4 py-4 text-lg font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 ${
                myAnswer
                  ? myAnswer.isCorrect
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-rose-500 bg-rose-50 text-rose-900"
                  : "border-amber-200 bg-white text-slate-900"
              }`}
            />
            {!myAnswer && (
              <button
                type="button"
                onClick={checkTyped}
                disabled={typedValue.trim() === ""}
                className="rounded-2xl bg-amber-500 px-6 py-4 text-lg font-bold text-white shadow hover:bg-amber-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
              >
                Check ✓
              </button>
            )}
          </div>
        ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Object.entries(current.options).map(([key, text]) => {
            const picked = myAnswer?.key === key;
            const isCorrect = key === current.correctAnswer;
            const showAsRight = Boolean(myAnswer) && isCorrect;
            const showAsWrong = picked && !isCorrect;
            const tone = showAsRight
              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
              : showAsWrong
                ? "border-rose-500 bg-rose-50 text-rose-900"
                : picked
                  ? "border-amber-500 bg-amber-100"
                  : "border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50";
            return (
              <button
                key={key}
                type="button"
                onClick={() => pick(key)}
                disabled={!!myAnswer}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left text-lg font-semibold transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 ${tone} ${!myAnswer ? "hover:-translate-y-0.5" : ""}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-mono text-base font-bold text-amber-700">{key}</span>
                <span>{text}</span>
                {showAsRight && <span aria-hidden className="ml-auto text-xl">✓</span>}
                {showAsWrong && <span aria-hidden className="ml-auto text-xl">✗</span>}
              </button>
            );
          })}
        </div>
        )}

        {myAnswer && (
          <div
            className={`mt-5 rounded-2xl p-4 text-center text-base font-semibold ${
              myAnswer.isCorrect
                ? "bg-emerald-100 text-emerald-900"
                : "bg-rose-100 text-rose-900"
            }`}
          >
            {myAnswer.isCorrect ? (
              <span>
                <span className="mr-1 text-2xl">✓</span>
                {encouragements.right[idx % encouragements.right.length]}
              </span>
            ) : (
              <span>
                <span className="mr-1 text-2xl">✗</span>
                {encouragements.wrong[idx % encouragements.wrong.length]}{" "}
                The answer is{" "}
                <span className="font-mono">{current.correctAnswer}</span>
                {!isTyped && current.options[current.correctAnswer] && (
                  <>: <span className="font-bold">{current.options[current.correctAnswer]}</span></>
                )}
                .
              </span>
            )}
          </div>
        )}
      </section>

      {error && <p className="rounded bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p>}

      <div className="flex justify-end">
        {!isLast ? (
          <button
            type="button"
            onClick={() => setIdx(idx + 1)}
            disabled={!myAnswer}
            className="rounded-2xl bg-amber-500 px-6 py-3 text-base font-bold text-white shadow hover:bg-amber-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={!myAnswer || submitting}
            className="rounded-2xl bg-emerald-500 px-6 py-3 text-base font-bold text-white shadow hover:bg-emerald-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
          >
            {submitting ? "Sending…" : `Finish quiz, ${childName}! 🎉`}
          </button>
        )}
      </div>
    </main>
  );
}
