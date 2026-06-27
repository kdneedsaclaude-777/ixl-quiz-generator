import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveActiveStudent } from "@/lib/active-child";
import { isTestMode, parseFlaggedIds, clampTimeLimit } from "@/lib/domain/test-mode";
import { isStudentPaid } from "@/lib/plan";
import ChildTestRunner from "./ChildTestRunner";

export const metadata = { title: "Real test — QuizSpark" };

export default async function ChildTestPage({
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
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: { skill: { include: { topicGroup: true } } },
      },
    },
  });
  if (!quiz || quiz.studentId !== child.id) notFound();
  // This route is test-only; practice quizzes have their own runner.
  if (!isTestMode(quiz.mode)) notFound();
  // Real Tests are a QuizSpark Plus feature — block free access (defense in depth
  // for a quiz left over from a lapsed subscription).
  if (!(await isStudentPaid(child.id))) redirect("/child/home");
  if (quiz.status === "completed") {
    redirect(`/child/test/${quiz.id}/results`);
  }

  // NEVER ship correctAnswer to the client for a test — feedback is withheld
  // until submit (and review unlock). The submit endpoint re-grades server-side.
  const questions = quiz.questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    questionType: q.questionType,
    answerOptions: JSON.parse(q.answerOptionsJson) as Record<string, string>,
    displayLabel: q.displayLabel,
    position: q.position,
  }));

  // Topic label = most common topic group across the quiz's questions.
  const topicLabel = mostCommonTopic(quiz.questions.map((q) => q.skill.topicGroup.name));

  // Resume the real countdown: if the test was already started (testStartedAt
  // set), the remaining time is the limit minus elapsed since that stamp — so
  // reloading the page can't reset the clock.
  const timeLimitSec = clampTimeLimit(quiz.timeLimitSec);
  const alreadyStarted = quiz.testStartedAt != null;
  const elapsedSec = alreadyStarted
    ? Math.max(0, Math.round((Date.now() - quiz.testStartedAt!.getTime()) / 1000))
    : 0;
  const initialRemainingSec = Math.max(0, timeLimitSec - elapsedSec);

  return (
    <ChildTestRunner
      quizId={quiz.id}
      studentName={child.name}
      topic={topicLabel}
      questions={questions}
      timeLimitSec={timeLimitSec}
      flaggedQuestionIds={parseFlaggedIds(quiz.flaggedQuestionIds)}
      alreadyStarted={alreadyStarted}
      initialRemainingSec={initialRemainingSec}
    />
  );
}

function mostCommonTopic(names: string[]): string {
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  let best = "your";
  let bestCount = -1;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}
