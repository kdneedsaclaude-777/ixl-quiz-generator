import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { sanitizeSvg } from "@/lib/sanitize-svg";
import ExportMenu from "@/components/ExportMenu";
import QuizRunner from "./QuizRunner";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { id: idParam } = await params;
  const { studentId: sidParam } = await searchParams;
  const quizId = parseInt(idParam, 10);
  const studentId = parseInt(sidParam ?? "", 10);
  if (!Number.isFinite(quizId)) notFound();

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { position: "asc" }, include: { skill: { include: { topicGroup: true } } } } },
  });
  if (!quiz) notFound();

  if (quiz.status === "completed") {
    redirect(`/quiz/${quizId}/results${Number.isFinite(studentId) ? `?studentId=${studentId}` : ""}`);
  }

  const questions = quiz.questions.map((q) => ({
    id: q.id,
    skillCode: q.skill.code,
    unit: q.skill.topicGroup.name,
    skillTitle: q.skill.name,
    displayLabel: q.displayLabel,
    questionText: q.questionText,
    questionType: q.questionType,
    options: JSON.parse(q.answerOptionsJson) as Record<string, string>,
    // Sanitize server-side so the client only ever receives allowlisted SVG.
    visualSvg: sanitizeSvg(q.visualSvg),
    visualNote: q.visualNote,
  }));

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quiz #{quiz.id}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {questions.length} questions · difficulty {quiz.difficulty}
          </p>
        </div>
        <ExportMenu quizId={quiz.id} mode="worksheet" />
      </header>
      <QuizRunner
        quizId={quiz.id}
        studentId={Number.isFinite(studentId) ? studentId : null}
        questions={questions}
      />
    </main>
  );
}
