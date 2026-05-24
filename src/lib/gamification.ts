import { prisma } from "@/lib/db";
import {
  calculateXp,
  xpToLevel,
  detectNewBadges,
  type QuizSummary,
} from "@/lib/domain/gamification";

export type QuizContext = {
  quizId: number;
  studentId: number;
  scorePct: number;
  startedAt: Date;
  completedAt: Date;
  topicGroupLetters: string[];
};

export type AwardOutcome = {
  xpEarned: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
  badges: { code: string; name: string; description: string; icon: string }[];
};

// Called from the submit endpoint right after the Quiz row is marked completed
// and attempts are persisted. Loads history, runs pure detection, then writes
// XPLog + StudentBadge + Student.xp/level in a single transaction.
export async function awardXpAndBadges(ctx: QuizContext, today: Date = new Date()): Promise<AwardOutcome> {
  // Build the oldest-first history including the just-completed quiz.
  const completedQuizzes = await prisma.quiz.findMany({
    where: { studentId: ctx.studentId, status: "completed" },
    orderBy: { completedAt: "asc" },
    select: {
      id: true,
      score: true,
      completedAt: true,
      questions: {
        select: { skill: { select: { topicGroup: { select: { letter: true } } } } },
      },
    },
  });

  const history: QuizSummary[] = completedQuizzes
    .filter((q) => q.completedAt && typeof q.score === "number")
    .map((q) => ({
      scorePct: q.score as number,
      completedAt: q.completedAt as Date,
      topicGroupLetters: Array.from(new Set(q.questions.map((qq) => qq.skill.topicGroup.letter))),
    }));

  const alreadyEarned = new Set(
    (await prisma.studentBadge.findMany({
      where: { studentId: ctx.studentId },
      select: { badgeCode: true },
    })).map((r) => r.badgeCode),
  );

  const durationSeconds = Math.max(0, Math.round((ctx.completedAt.getTime() - ctx.startedAt.getTime()) / 1000));
  const awards = detectNewBadges({
    thisQuiz: {
      scorePct: ctx.scorePct,
      durationSeconds,
      topicGroupLetters: ctx.topicGroupLetters,
    },
    history: { quizzes: history },
    alreadyEarned,
    today,
  });

  const xpEarned = calculateXp(ctx.scorePct);
  const student = await prisma.student.findUnique({
    where: { id: ctx.studentId },
    select: { xp: true, level: true },
  });
  const previousXp = student?.xp ?? 0;
  const previousLevel = student?.level ?? 1;
  const newXp = previousXp + xpEarned;
  const newLevelInfo = xpToLevel(newXp);

  // Persist: XPLog, StudentBadge rows, Student xp/level.
  await prisma.$transaction([
    prisma.xPLog.create({
      data: { studentId: ctx.studentId, delta: xpEarned, reason: "quiz_complete" },
    }),
    ...awards.map((a) =>
      prisma.studentBadge.create({
        data: {
          studentId: ctx.studentId,
          badgeCode: a.code,
          context: JSON.stringify({ quizId: ctx.quizId, ...a.context }),
        },
      }),
    ),
    prisma.student.update({
      where: { id: ctx.studentId },
      data: { xp: newXp, level: newLevelInfo.level },
    }),
  ]);

  // Hydrate badge metadata for the response (icon, name, description).
  const meta = awards.length
    ? await prisma.badge.findMany({ where: { code: { in: awards.map((a) => a.code) } } })
    : [];
  const byCode = new Map(meta.map((b) => [b.code, b]));
  const badges = awards.flatMap((a) => {
    const b = byCode.get(a.code);
    if (!b) return [];
    return [{ code: b.code, name: b.name, description: b.description, icon: b.icon }];
  });

  return {
    xpEarned,
    newXp,
    newLevel: newLevelInfo.level,
    leveledUp: newLevelInfo.level > previousLevel,
    badges,
  };
}

// Used by the child home page to show streak + recent badges.
export async function loadChildHomeStats(studentId: number, today: Date = new Date()) {
  const [completedQuizzes, badges, student] = await Promise.all([
    prisma.quiz.findMany({
      where: { studentId, status: "completed" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true, score: true },
      take: 200,
    }),
    prisma.studentBadge.findMany({
      where: { studentId },
      orderBy: { earnedAt: "desc" },
      include: { badge: true },
      take: 7,
    }),
    prisma.student.findUnique({
      where: { id: studentId },
      select: { xp: true, level: true },
    }),
  ]);

  const dates = completedQuizzes
    .filter((q) => q.completedAt)
    .map((q) => q.completedAt as Date);

  const { calculateStreak } = await import("@/lib/domain/gamification");
  const streak = calculateStreak(dates, today);
  const levelInfo = xpToLevel(student?.xp ?? 0);

  return {
    xp: student?.xp ?? 0,
    level: student?.level ?? levelInfo.level,
    currentLevelXp: levelInfo.currentLevelXp,
    nextLevelXp: levelInfo.nextLevelXp,
    streak,
    badges: badges.map((b) => ({
      code: b.badgeCode,
      name: b.badge.name,
      description: b.badge.description,
      icon: b.badge.icon,
      earnedAt: b.earnedAt,
    })),
    quizzesCompleted: completedQuizzes.length,
  };
}
