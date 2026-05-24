"use client";

import { useMemo, useState } from "react";

// Three deterministic arithmetic items (easy/medium/hard) used to suggest a
// starting difficulty. Difficulty mapping:
//   3 correct → 4    |   2 correct → 3   |   1 correct → 2   |   0 correct → 1
type Item = { prompt: string; options: number[]; correctIndex: number; weight: number };

function buildItems(grade: number): Item[] {
  const easyA = 4 + (grade - 4);
  const easyB = 3 + (grade - 4);
  const medA = 12 + grade;
  const medB = 7 + grade;
  const hardA = 25 + grade * 3;
  const hardB = 14 + grade;
  const items: Item[] = [
    { prompt: `What is ${easyA} + ${easyB}?`, options: shuffle(easyA + easyB), correctIndex: 0, weight: 1 },
    { prompt: `What is ${medA} − ${medB}?`, options: shuffle(medA - medB), correctIndex: 0, weight: 1 },
    { prompt: `What is ${hardA} × 4 − ${hardB}?`, options: shuffle(hardA * 4 - hardB), correctIndex: 0, weight: 1 },
  ];
  return items.map((item) => {
    const correct = item.options[item.correctIndex];
    const shuffled = item.options.slice().sort(() => Math.random() - 0.5);
    return { ...item, options: shuffled, correctIndex: shuffled.indexOf(correct) };
  });
}

function shuffle(correct: number): number[] {
  const distractors = new Set<number>();
  while (distractors.size < 3) {
    const offset = Math.max(1, Math.round(correct * 0.15)) + Math.floor(Math.random() * 4);
    const sign = Math.random() > 0.5 ? 1 : -1;
    const candidate = correct + offset * sign;
    if (candidate !== correct && candidate >= 0) distractors.add(candidate);
  }
  return [correct, ...distractors];
}

export default function DiagnosticQuiz({
  grade,
  onComplete,
}: {
  grade: number;
  onComplete: (suggestedDifficulty: number) => void;
}) {
  const items = useMemo(() => buildItems(grade), [grade]);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [done, setDone] = useState(false);

  const allAnswered = answers.every((a) => a !== null);

  function submit() {
    let score = 0;
    items.forEach((item, i) => {
      if (answers[i] === item.correctIndex) score += item.weight;
    });
    const suggested = score === 3 ? 4 : score === 2 ? 3 : score === 1 ? 2 : 1;
    setDone(true);
    onComplete(suggested);
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
      <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Quick diagnostic</h3>
      <p className="mt-1 text-xs text-indigo-800 dark:text-indigo-200">
        Answer 3 questions and we&apos;ll suggest a starting difficulty.
      </p>
      <div className="mt-3 space-y-3">
        {items.map((item, i) => (
          <fieldset key={i} className="rounded border border-indigo-200 bg-white p-3 dark:border-indigo-900 dark:bg-slate-800">
            <legend className="px-1 text-xs font-medium text-slate-500 dark:text-slate-400">Question {i + 1}</legend>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.prompt}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {item.options.map((opt, idx) => (
                <label
                  key={idx}
                  className={`flex cursor-pointer items-center justify-center rounded border px-2 py-1.5 text-sm ${
                    answers[i] === idx
                      ? "border-indigo-600 bg-indigo-100 dark:border-indigo-400 dark:bg-indigo-900/60"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-800"
                  }`}
                >
                  <input
                    type="radio"
                    name={`diag-${i}`}
                    className="sr-only"
                    checked={answers[i] === idx}
                    onChange={() => setAnswers((prev) => prev.map((p, j) => (j === i ? idx : p)))}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!allAnswered || done}
        className="mt-3 rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {done ? "Difficulty suggested" : "Suggest difficulty"}
      </button>
    </div>
  );
}
