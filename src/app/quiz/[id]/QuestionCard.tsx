"use client";

import QuestionTimer from "./QuestionTimer";
import UnitLabel from "@/components/UnitLabel";
import QuestionVisual from "@/components/QuestionVisual";
import { isFreeInputType } from "@/lib/domain/grading";

export type QuestionView = {
  id: number;
  skillCode: string;
  unit: string;
  skillTitle: string;
  displayLabel: string;
  questionText: string;
  questionType: string;
  options: Record<string, string>;
  visualSvg: string | null;
  visualNote: string | null;
};

export type ResultView = { correctAnswer: string; isCorrect: boolean };

export default function QuestionCard({
  question,
  index,
  total,
  selected,
  onSelect,
  locked,
  result,
  timerEnabled,
  timerSeconds,
  paused,
  onTimeout,
}: {
  question: QuestionView;
  index: number;
  total: number;
  selected: string | null;
  onSelect: (key: string) => void;
  locked: boolean;
  result: ResultView | null;
  timerEnabled: boolean;
  timerSeconds: number;
  paused: boolean;
  onTimeout: () => void;
}) {
  const submitted = result !== null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Q{index + 1}/{total}</span>
        <span aria-hidden>·</span>
        <UnitLabel unit={question.unit} title={question.skillTitle} code={question.skillCode} />
      </div>
      <p className="mt-2 text-base text-slate-900 dark:text-slate-100">{question.questionText}</p>

      <QuestionVisual svg={question.visualSvg} note={question.visualNote} />

      {isFreeInputType(question.questionType) ? (
        <div className="mt-3">
          <label className="sr-only" htmlFor={`q-${question.id}-input`}>Your answer</label>
          <input
            id={`q-${question.id}-input`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={selected ?? ""}
            onChange={(e) => onSelect(e.target.value)}
            disabled={locked || submitted}
            placeholder="Type your answer"
            className={`w-full max-w-xs rounded border px-3 py-2 text-sm ${
              submitted
                ? result?.isCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : "border-rose-500 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-100"
                : "border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            }`}
          />
        </div>
      ) : (
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(question.options).map(([key, text]) => {
          const isSelected = selected === key;
          const isCorrect = submitted && result?.correctAnswer === key;
          const isWrongPick = submitted && isSelected && !isCorrect;
          const tone = submitted
            ? isCorrect
              ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100"
              : isWrongPick
                ? "border-rose-500 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-100"
                : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            : isSelected
              ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-100"
              : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-800";
          return (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-3 rounded border px-3 py-2 text-sm ${tone} ${locked || submitted ? "cursor-default" : ""}`}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                value={key}
                checked={isSelected}
                onChange={() => onSelect(key)}
                disabled={locked || submitted}
              />
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{key}</span>
              <span>{text}</span>
              {submitted && isCorrect && <span aria-hidden className="ml-auto text-xs font-semibold">✓</span>}
              {submitted && isWrongPick && <span aria-hidden className="ml-auto text-xs font-semibold">✗</span>}
            </label>
          );
        })}
      </div>
      )}

      {submitted && !result?.isCorrect && (
        <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          Correct answer: <span className="font-mono">{result?.correctAnswer}</span>
          {!isFreeInputType(question.questionType) &&
            question.options[result?.correctAnswer ?? ""] &&
            ` · ${question.options[result?.correctAnswer ?? ""]}`}
        </p>
      )}

      {locked && !submitted && (
        <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-400">Time&apos;s up — answer locked.</p>
      )}

      {timerEnabled && !submitted && (
        <QuestionTimer
          questionId={question.id}
          seconds={timerSeconds}
          paused={paused || locked}
          onTimeout={onTimeout}
        />
      )}
    </div>
  );
}
