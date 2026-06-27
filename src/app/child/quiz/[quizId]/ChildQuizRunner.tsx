"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QuestionVisual from "@/components/QuestionVisual";
import CMIcon from "@/components/CMIcon";
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

// Kid practice runner, rebuilt to match the design bundle (student.jsx
// StudentQuiz + StudentFeedback): full-width segmented progress, skill pills,
// serif question, brand-blue option cards, and an inline wrong-answer
// explanation card. All grading/submit logic is unchanged.
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

  const encouragements = useMemo(
    () => ({
      right: ["Nice!", "You got it!", "Yes!", "Boom!", "Perfect!"],
      wrong: ["Good try!", "Almost!", "Keep going!", "You'll get the next one!"],
    }),
    [],
  );

  function pick(key: string) {
    if (myAnswer) return;
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

  const correctText = current.options[current.correctAnswer];

  return (
    <main className="flex min-h-[calc(100vh-7rem)] flex-col">
      {/* progress header: close + segmented dots + counter */}
      <div className="flex items-center gap-3.5 pt-1.5">
        <button
          type="button"
          onClick={() => router.push("/child/home")}
          aria-label="Quit practice"
          className="text-slate-400 hover:text-slate-600"
        >
          <CMIcon name="x" size={22} color="currentColor" />
        </button>
        <div className="flex flex-1 gap-1">
          {questions.map((q, i) => {
            const a = answers[q.id];
            const bg = a?.isCorrect
              ? "var(--cm-mint)"
              : a
                ? "var(--cm-rose)"
                : i === idx
                  ? "var(--cm-blue)"
                  : "var(--slate-200)";
            return <div key={q.id} className="h-2 flex-1 rounded-full" style={{ background: bg }} />;
          })}
        </div>
        <div className="font-mono text-xs font-bold text-slate-700">{idx + 1}/{total}</div>
      </div>

      {/* skill chips */}
      <div className="mt-5 flex items-center gap-2">
        <span className="cm-pill indigo">{current.skillCode} · {current.skillTitle}</span>
        <span className="cm-pill">{current.unit}</span>
      </div>

      {/* question */}
      <div className="font-display mt-4 text-[26px] leading-[1.18] tracking-tight text-slate-900">
        {current.questionText}
      </div>

      <QuestionVisual svg={current.visualSvg} note={current.visualNote} />

      {/* typed input OR options */}
      {isTyped ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={typedValue}
            disabled={!!myAnswer}
            onChange={(e) => setTypedById((p) => ({ ...p, [current.id]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") checkTyped(); }}
            placeholder="Type your answer"
            className={`flex-1 rounded-2xl border-2 px-4 py-4 text-lg font-semibold outline-none ${
              myAnswer
                ? myAnswer.isCorrect
                  ? "border-cm-mint bg-cm-mint-soft text-emerald-900"
                  : "border-cm-rose bg-cm-rose-soft text-rose-900"
                : "border-slate-200 bg-white text-slate-900 focus:border-cm-blue"
            }`}
          />
          {!myAnswer && (
            <button
              type="button"
              onClick={checkTyped}
              disabled={typedValue.trim() === ""}
              className="cm-btn primary lg disabled:opacity-40"
            >
              Check ✓
            </button>
          )}
        </div>
      ) : (
        <div className="mt-[18px] grid gap-2.5">
          {Object.entries(current.options).map(([key, text]) => {
            const picked = myAnswer?.key === key;
            const isCorrect = key === current.correctAnswer;
            const showRight = Boolean(myAnswer) && isCorrect;
            const showWrong = picked && !isCorrect;
            const cls = showRight
              ? "border-cm-mint bg-cm-mint-soft"
              : showWrong
                ? "border-cm-rose bg-cm-rose-soft"
                : picked
                  ? "border-cm-blue"
                  : "border-slate-200 bg-white";
            return (
              <button
                key={key}
                type="button"
                onClick={() => pick(key)}
                disabled={!!myAnswer}
                className={`flex items-center gap-3.5 rounded-[18px] border-2 px-[18px] py-4 text-left ${cls}`}
                style={picked && !myAnswer ? { boxShadow: "0 0 0 4px var(--cm-blue-50)" } : undefined}
              >
                <span
                  className="grid h-9 w-9 place-items-center rounded-[10px] text-base font-extrabold"
                  style={{
                    background: showRight ? "var(--cm-mint)" : showWrong ? "var(--cm-rose)" : "var(--slate-100)",
                    color: showRight || showWrong ? "#fff" : "var(--slate-700)",
                  }}
                >
                  {key}
                </span>
                <span className="text-[17px] font-semibold text-slate-900">{text}</span>
                {showRight && <span className="ml-auto"><CMIcon name="check" size={20} color="var(--cm-mint)" stroke={2.5} /></span>}
                {showWrong && <span className="ml-auto"><CMIcon name="x" size={20} color="var(--cm-rose)" stroke={2.5} /></span>}
              </button>
            );
          })}
        </div>
      )}

      {/* practice feedback — encouragement / wrong-answer card */}
      {myAnswer && (
        <div className="mt-4">
          {myAnswer.isCorrect ? (
            <div className="flex items-center gap-3 rounded-[18px] p-3.5" style={{ background: "var(--cm-mint-soft)" }}>
              <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--cm-mint)" }}>
                <CMIcon name="check" size={20} color="#fff" stroke={3} />
              </span>
              <div className="text-[15px] font-extrabold text-emerald-800">
                {encouragements.right[idx % encouragements.right.length]}
              </div>
            </div>
          ) : (
            <div className="rounded-[18px] border p-4" style={{ background: "var(--cm-rose-soft)", borderColor: "#FCA5A5" }}>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--cm-rose)" }}>
                  <CMIcon name="x" size={20} color="#fff" stroke={3} />
                </span>
                <div>
                  <div className="text-[15px] font-extrabold text-rose-900">
                    {encouragements.wrong[idx % encouragements.wrong.length]}
                  </div>
                  <div className="text-[13px] text-rose-900/80">
                    The right answer is{" "}
                    <strong>
                      {current.correctAnswer}
                      {correctText ? ` · ${correctText}` : ""}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p>}

      {/* spacer pushes CTA to the bottom of the screen */}
      <div className="flex-1" />

      <button
        type="button"
        onClick={isLast ? finish : () => setIdx(idx + 1)}
        disabled={!myAnswer || submitting}
        className="cm-btn primary lg mt-[18px] w-full disabled:opacity-40"
      >
        {isLast ? (submitting ? "Sending…" : `Finish quiz, ${childName}! 🎉`) : "Next question"}
        {!submitting && <CMIcon name="arrow" size={18} color="#fff" />}
      </button>
    </main>
  );
}
