import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveActiveStudent } from "@/lib/active-child";
import { sanitizeSvg } from "@/lib/sanitize-svg";
import ChildQuizRunner from "./ChildQuizRunner";

export const metadata = { title: "Practice — IXL Quiz" };

export default async function ChildQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { student: child } = await resolveActiveStudent();

  const { quizId: idParam } = await params;
  const quizId = parseInt(idParam, 10);
  if (!Number.isFinite(quizId)) notFound();

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { position: "asc" }, include: { skill: { include: { topicGroup: true } } } } },
  });
  if (!quiz || quiz.studentId !== child.id) notFound();
  if (quiz.status === "completed") {
    redirect(`/child/quiz/${quiz.id}/results`);
  }

  // Send correctAnswer with each question so the runner can show immediate
  // green/red feedback. The submit endpoint re-validates server-side.
  const questions = quiz.questions.map((q) => ({
    id: q.id,
    skillCode: q.skill.code,
    unit: q.skill.topicGroup.name,
    skillTitle: q.skill.name,
    displayLabel: q.displayLabel,
    questionText: q.questionText,
    questionType: q.questionType,
    options: JSON.parse(q.answerOptionsJson) as Record<string, string>,
    correctAnswer: q.correctAnswer,
    visualSvg: sanitizeSvg(q.visualSvg),
    visualNote: q.visualNote,
  }));

  return (
    <ChildQuizRunner
      quizId={quiz.id}
      childName={child.name}
      questions={questions}
    />
  );
}
