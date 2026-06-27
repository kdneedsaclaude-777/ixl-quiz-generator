import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveActiveStudent } from "@/lib/active-child";
import { sanitizeSvg } from "@/lib/sanitize-svg";
import { isTestMode } from "@/lib/domain/test-mode";
import type { ValidatedExplanation } from "@/lib/ai/validation";
import ChildTestResultRunner from "./ChildTestResultRunner";

export const metadata = { title: "Test results — QuizSpark" };

export default async function ChildTestResultsPage({
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
      student: { select: { parentId: true } },
      questions: {
        orderBy: { position: "asc" },
        include: {
          skill: { include: { topicGroup: true } },
          // Latest attempt per question for this student's grading state.
          attempts: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!quiz || quiz.studentId !== child.id) notFound();
  if (!isTestMode(quiz.mode)) notFound();
  // Not submitted yet → back to the runner.
  if (quiz.status !== "completed") {
    redirect(`/child/test/${quiz.id}`);
  }

  // correct / wrong / blank from the persisted attempts. Blank = an attempt
  // with an empty selectedAnswer (or no attempt at all).
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  for (const q of quiz.questions) {
    const attempt = q.attempts[0];
    const selected = (attempt?.selectedAnswer ?? "").trim();
    if (selected === "") blank += 1;
    else if (attempt?.isCorrect) correct += 1;
    else wrong += 1;
  }

  const total = quiz.questions.length;
  const pct = typeof quiz.score === "number" ? Math.round(quiz.score) : 0;
  const topic = mostCommonTopic(quiz.questions.map((q) => q.skill.topicGroup.name));

  // Parent display name for the "answers locked until {parent}" banner.
  let parentName = "your grown-up";
  if (quiz.student.parentId) {
    const parent = await prisma.user.findUnique({
      where: { id: quiz.student.parentId },
      select: { name: true },
    });
    if (parent?.name) parentName = parent.name;
  }

  // Per-question explanation review is shipped ONLY when the parent has
  // unlocked review. While locked we send no answers/explanations at all.
  const review = quiz.reviewUnlocked
    ? quiz.questions.map((q) => {
        const attempt = q.attempts[0];
        let explanation: ValidatedExplanation | null = null;
        try {
          explanation = JSON.parse(q.explanationJson) as ValidatedExplanation;
        } catch {
          explanation = null;
        }
        return {
          id: q.id,
          position: q.position,
          displayLabel: q.displayLabel,
          questionText: q.questionText,
          questionType: q.questionType,
          options: JSON.parse(q.answerOptionsJson) as Record<string, string>,
          correctAnswer: q.correctAnswer,
          selectedAnswer: attempt?.selectedAnswer ?? "",
          isCorrect: attempt?.isCorrect ?? false,
          visualSvg: sanitizeSvg(q.visualSvg),
          visualNote: q.visualNote,
          explanation,
        };
      })
    : null;

  return (
    <ChildTestResultRunner
      quizId={quiz.id}
      studentId={child.id}
      topic={topic}
      pct={pct}
      total={total}
      correct={correct}
      wrong={wrong}
      blank={blank}
      timeUsedSec={quiz.timeUsedSec ?? 0}
      reviewUnlocked={quiz.reviewUnlocked}
      parentName={parentName}
      review={review}
    />
  );
}

function mostCommonTopic(names: string[]): string {
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  let best = "Test";
  let bestCount = -1;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}
