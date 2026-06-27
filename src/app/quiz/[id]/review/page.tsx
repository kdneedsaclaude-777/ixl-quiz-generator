import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { sanitizeSvg } from "@/lib/sanitize-svg";
import QuestionVisual from "@/components/QuestionVisual";
import type { ValidatedExplanation } from "@/lib/ai/validation";

export default async function QuizReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { id: idParam } = await params;
  const { studentId: sidParam } = await searchParams;
  const quizId = parseInt(idParam, 10);
  if (!Number.isFinite(quizId)) notFound();

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      student: true,
      questions: {
        orderBy: { position: "asc" },
        include: { skill: true, attempts: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
  if (!quiz) notFound();

  const studentId = parseInt(sidParam ?? "", 10);
  const dashboardHref = Number.isFinite(studentId)
    ? `/dashboard?studentId=${studentId}`
    : `/dashboard?studentId=${quiz.studentId}`;

  const totalAnswered = quiz.questions.filter((q) => q.attempts.length > 0).length;
  const totalCorrect = quiz.questions.filter((q) => q.attempts[0]?.isCorrect).length;

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-4xl leading-tight tracking-tight text-slate-900 dark:text-slate-100">Quiz #{quiz.id} — review</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {quiz.student.name} · {totalCorrect}/{totalAnswered} correct ·{" "}
            {quiz.score == null ? "in progress" : `${quiz.score.toFixed(0)}%`}
          </p>
        </div>
        <Link href={dashboardHref} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          ← Dashboard
        </Link>
      </header>

      <ol className="space-y-4">
        {quiz.questions.map((q, idx) => {
          const attempt = q.attempts[0];
          const options = JSON.parse(q.answerOptionsJson) as Record<string, string>;
          const explanation = JSON.parse(q.explanationJson) as ValidatedExplanation;
          const isCorrect = attempt?.isCorrect ?? false;
          const wasAnswered = Boolean(attempt);

          return (
            <li
              key={q.id}
              className={`rounded-lg border p-5 shadow-sm ${
                !wasAnswered
                  ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                  : isCorrect
                    ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : "border-rose-200 bg-rose-50/40 dark:border-rose-800 dark:bg-rose-950/30"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Question {idx + 1} ·{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{q.displayLabel}</span>
                </span>
                {wasAnswered && (
                  <span
                    className={`rounded px-2 py-0.5 font-mono ${
                      isCorrect
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-100"
                    }`}
                  >
                    {isCorrect ? "Correct" : "Incorrect"}
                  </span>
                )}
              </div>

              <p className="mt-2 text-base text-slate-900 dark:text-slate-100">{q.questionText}</p>

              <QuestionVisual svg={sanitizeSvg(q.visualSvg)} note={q.visualNote} />

              {q.questionType !== "mcq" && (
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span
                    className={`rounded border px-3 py-1.5 ${
                      isCorrect
                        ? "border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100"
                        : "border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-100"
                    }`}
                  >
                    Your answer:{" "}
                    <span className="font-mono">{attempt?.selectedAnswer || "—"}</span>
                  </span>
                  {!isCorrect && (
                    <span className="rounded border border-emerald-400 bg-emerald-50 px-3 py-1.5 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100">
                      Correct: <span className="font-mono">{q.correctAnswer}</span>
                    </span>
                  )}
                </div>
              )}

              {q.questionType === "mcq" && (
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {Object.entries(options).map(([key, text]) => {
                    const isCorrectOpt = key === q.correctAnswer;
                    const wasSelected = attempt?.selectedAnswer === key;
                    return (
                      <div
                        key={key}
                        className={`rounded border px-3 py-2 ${
                          isCorrectOpt
                            ? "border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100"
                            : wasSelected
                              ? "border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-100"
                              : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{key}</span> {text}
                        {wasSelected && !isCorrectOpt && (
                          <span className="ml-2 text-xs text-rose-700 dark:text-rose-300">(your answer)</span>
                        )}
                        {isCorrectOpt && (
                          <span className="ml-2 text-xs text-emerald-700 dark:text-emerald-300">(correct)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 space-y-3 text-sm">
                {isCorrect ? (
                  <p className="rounded bg-white/60 px-3 py-2 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">Nice work.</span>{" "}
                    {explanation.short}
                  </p>
                ) : (
                  <div className="rounded bg-white/60 px-3 py-2 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                    <p className="font-medium text-slate-800 dark:text-slate-100">How to solve it</p>
                    <ol className="mt-1 list-decimal space-y-1 pl-5">
                      {explanation.step_by_step.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {!isCorrect &&
                  q.questionType === "mcq" &&
                  explanation.why_wrong &&
                  Object.keys(explanation.why_wrong).length > 0 && (
                    <div className="rounded border border-rose-200 bg-white/70 px-3 py-2 dark:border-rose-800 dark:bg-slate-800/70">
                      <p className="font-medium text-rose-800 dark:text-rose-300">Why the other options miss</p>
                      <ul className="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                        {Object.entries(explanation.why_wrong).map(([key, reason]) => (
                          <li key={key}>
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{key}:</span>{" "}
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {!isCorrect && explanation.misconception && (
                  <p className="rounded bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                    <span className="font-medium">Common misconception:</span>{" "}
                    {explanation.misconception}
                  </p>
                )}

                {!isCorrect && explanation.revision_tip && (
                  <p className="rounded bg-indigo-50 px-3 py-2 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100">
                    <span className="font-medium">Try this next:</span> {explanation.revision_tip}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
