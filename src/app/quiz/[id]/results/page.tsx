import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ExportMenu from "@/components/ExportMenu";

export default async function QuizResultsPage({
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
        include: { skill: { include: { topicGroup: true } }, attempts: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
  if (!quiz) notFound();

  const studentIdParsed = parseInt(sidParam ?? "", 10);
  const studentId = Number.isFinite(studentIdParsed) ? studentIdParsed : quiz.studentId;

  const totalQuestions = quiz.questions.length;
  const correctCount = quiz.questions.filter((q) => q.attempts[0]?.isCorrect).length;
  const scorePct = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

  const topicGroups = Array.from(
    new Map(quiz.questions.map((q) => [q.skill.topicGroupId, q.skill.topicGroup])).values(),
  ).sort((a, b) => a.letter.localeCompare(b.letter));

  // In dark mode prefer a near-card bg with a bright accent border + text,
  // rather than a muddy dark-tinted fill (emerald-950/40 reads as black-green).
  const tone = scorePct >= 80
    ? { color: "text-emerald-700 dark:text-emerald-200", bg: "bg-emerald-50 dark:bg-slate-800", border: "border-emerald-200 dark:border-emerald-500", note: "Great work — advancing to harder material." }
    : scorePct >= 50
      ? { color: "text-amber-700 dark:text-amber-200", bg: "bg-amber-50 dark:bg-slate-800", border: "border-amber-200 dark:border-amber-500", note: "Solid effort — staying at this level for more practice." }
      : { color: "text-rose-700 dark:text-rose-200", bg: "bg-rose-50 dark:bg-slate-800", border: "border-rose-200 dark:border-rose-500", note: "Keep going — stepping back to build confidence." };

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quiz #{quiz.id} — results</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {quiz.student.name} · Grade {quiz.student.grade}
        </p>
      </header>

      <section className={`rounded-xl border ${tone.border} ${tone.bg} p-6 text-center`}>
        <div className={`text-5xl font-bold ${tone.color}`}>
          {correctCount}<span className="text-2xl font-semibold">/{totalQuestions}</span>
        </div>
        <div className={`mt-1 text-lg font-semibold ${tone.color}`}>{scorePct}%</div>
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{tone.note}</p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Difficulty" value={quiz.difficulty.toString()} />
        <Stat label="Questions" value={totalQuestions.toString()} />
        <Stat label="Status" value={quiz.status} />
      </section>

      {topicGroups.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Topics covered</h2>
          <div className="flex flex-wrap gap-2">
            {topicGroups.map((tg) => (
              <span
                key={tg.id}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {tg.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
        <Link
          href={`/quiz/${quiz.id}/review?studentId=${studentId}`}
          className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-700 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
        >
          Review answers
        </Link>
        <Link
          href={`/dashboard?studentId=${studentId}`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Start another quiz
        </Link>
      </div>

      <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
        <ExportMenu quizId={quiz.id} mode="report" />
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}
