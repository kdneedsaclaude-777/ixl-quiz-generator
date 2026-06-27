import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveActiveStudent } from "@/lib/active-child";
import { calculateXp, xpToLevel } from "@/lib/domain/gamification";
import ChildResultsRunner from "./ChildResultsRunner";

export const metadata = { title: "Your results — QuizSpark" };

export default async function ChildResultsPage({
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
    select: {
      id: true,
      studentId: true,
      status: true,
      score: true,
      completedAt: true,
      questions: { select: { id: true } },
    },
  });
  if (!quiz || quiz.studentId !== child.id) notFound();
  if (quiz.status !== "completed" || typeof quiz.score !== "number") {
    redirect(`/child/quiz/${quiz.id}`);
  }

  // Pick the badges that were awarded by THIS quiz (context JSON carries the
  // quiz id).
  const allBadges = await prisma.studentBadge.findMany({
    where: { studentId: child.id },
    orderBy: { earnedAt: "desc" },
    include: { badge: true },
  });
  const fromThisQuiz = allBadges.filter((b) => {
    if (!b.context) return false;
    try {
      const parsed = JSON.parse(b.context) as { quizId?: number };
      return parsed.quizId === quiz.id;
    } catch {
      return false;
    }
  });

  // Reconstruct the exact itemized XP for THIS quiz from its persisted XPLog
  // rows (base + bonuses). Legacy quizzes (pre-itemization, quizId null) fall
  // back to the base-only calculation so old results still render correctly.
  const xpLogs = await prisma.xPLog.findMany({
    where: { quizId: quiz.id },
    orderBy: { createdAt: "asc" },
    select: { delta: true, reason: true, createdAt: true },
  });
  let base: number;
  let bonuses: { reason: string; amount: number }[];
  // finalXp/startXp are computed as the cumulative XP AS OF this quiz (not the
  // live Student.xp) so revisiting an old quiz's results after later quizzes
  // still shows the correct level transition for THIS quiz.
  let finalXp: number;
  if (xpLogs.length > 0) {
    base = xpLogs.filter((l) => l.reason === "quiz_complete").reduce((s, l) => s + l.delta, 0);
    bonuses = xpLogs
      .filter((l) => l.reason !== "quiz_complete")
      .map((l) => ({ reason: l.reason, amount: l.delta }));
    const cutoff = xpLogs[xpLogs.length - 1].createdAt; // newest row for this quiz
    const cumulative = await prisma.xPLog.aggregate({
      where: { studentId: child.id, createdAt: { lte: cutoff } },
      _sum: { delta: true },
    });
    finalXp = cumulative._sum.delta ?? 0;
  } else {
    // Legacy quiz (pre-itemization): fall back to base-from-score + live total.
    base = calculateXp(quiz.score);
    bonuses = [];
    const student = await prisma.student.findUnique({ where: { id: child.id }, select: { xp: true } });
    finalXp = student?.xp ?? 0;
  }
  const xpEarned = base + bonuses.reduce((s, b) => s + b.amount, 0);
  const startXp = Math.max(0, finalXp - xpEarned);
  const startLevel = xpToLevel(startXp);
  const finalLevel = xpToLevel(finalXp);

  const total = quiz.questions.length;
  const correct = Math.round((quiz.score / 100) * total);

  return (
    <ChildResultsRunner
      childName={child.name}
      childId={child.id}
      quizId={quiz.id}
      score={{ correct, total, pct: Math.round(quiz.score) }}
      xp={{
        earned: xpEarned,
        startXp,
        finalXp,
        startLevel: startLevel.level,
        finalLevel: finalLevel.level,
        finalCurrentLevelXp: finalLevel.currentLevelXp,
        finalNextLevelXp: finalLevel.nextLevelXp,
        breakdown: { base, bonuses },
      }}
      badges={fromThisQuiz.map((b) => ({
        code: b.badgeCode,
        name: b.badge.name,
        description: b.badge.description,
        icon: b.badge.icon,
      }))}
    />
  );
}
