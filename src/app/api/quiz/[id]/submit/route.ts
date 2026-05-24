import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyAdaptivity } from "@/lib/domain/adaptivity";
import { gradeAnswer } from "@/lib/domain/grading";
import { getParentForApi } from "@/lib/auth/server";
import { awardXpAndBadges } from "@/lib/gamification";
import { notifyQuizCompleted } from "@/lib/notifications";

type Body = { answers?: Record<string, string> };

type SkillBreakdown = {
  skillId: number;
  skillCode: string;
  attempts: number;
  correct: number;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: idParam } = await params;
  const quizId = parseInt(idParam, 10);
  if (!Number.isFinite(quizId)) {
    return NextResponse.json({ error: "invalid quiz id" }, { status: 400 });
  }
  const body = (await req.json()) as Body;
  const answers = body.answers ?? {};

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { include: { skill: { include: { topicGroup: true } } } },
      student: true,
    },
  });
  if (!quiz) return NextResponse.json({ error: "quiz not found" }, { status: 404 });
  const uid = auth.parent.userId;
  const canAccess =
    quiz.student.userId === uid ||
    quiz.student.parentId === uid ||
    auth.parent.role === "superadmin";
  if (!canAccess) {
    return NextResponse.json({ error: "quiz not found" }, { status: 404 });
  }
  if (quiz.status === "completed") {
    return NextResponse.json({ error: "quiz already completed" }, { status: 400 });
  }

  // Defensive: a quiz with 0 questions would crash pickFocalSkill below
  // (sorted[0] === undefined → .skillId throws). Generate now rejects this,
  // but historical rows or future bugs could still produce one.
  if (quiz.questions.length === 0) {
    return NextResponse.json(
      { error: "This quiz has no questions and can't be submitted." },
      { status: 400 },
    );
  }

  const attempts = quiz.questions.map((q) => {
    const selected = answers[String(q.id)] ?? "";
    const isCorrect = gradeAnswer(q.questionType, selected, q.correctAnswer);
    return {
      questionId: q.id,
      skillId: q.skillId,
      skillCode: q.skill.code,
      selectedAnswer: selected,
      isCorrect,
    };
  });
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;
  const scorePercent = attempts.length === 0 ? 0 : (totalCorrect / attempts.length) * 100;

  const breakdownById = new Map<number, SkillBreakdown>();
  for (const a of attempts) {
    const cur = breakdownById.get(a.skillId) ?? {
      skillId: a.skillId,
      skillCode: a.skillCode,
      attempts: 0,
      correct: 0,
    };
    cur.attempts += 1;
    if (a.isCorrect) cur.correct += 1;
    breakdownById.set(a.skillId, cur);
  }

  const skillIds = [...breakdownById.keys()];
  const priorMastery = await prisma.conceptMastery.findMany({
    where: { studentId: quiz.studentId, skillId: { in: skillIds } },
    include: { skill: true },
  });
  const priorById = new Map(priorMastery.map((p) => [p.skillId, p]));

  const focal = pickFocalSkill(breakdownById, priorById);
  const focalPrior = priorById.get(focal.skillId);
  const focalConsecutive = focalPrior?.consecutiveCorrect ?? 0;

  const focalRecentScores = (
    await prisma.quiz.findMany({
      where: {
        studentId: quiz.studentId,
        status: "completed",
        questions: { some: { skillId: focal.skillId } },
      },
      orderBy: { completedAt: "desc" },
      take: 4,
      select: { score: true },
    })
  )
    .map((q) => q.score)
    .filter((s): s is number => typeof s === "number");
  focalRecentScores.unshift(scorePercent);

  const updatedConsecutive =
    focal.attempts === 0
      ? focalConsecutive
      : focal.attempts === focal.correct
        ? focalConsecutive + focal.correct
        : 0;

  const adaptive = applyAdaptivity({
    currentDifficulty: quiz.difficulty,
    currentSkillCode: focal.skillCode,
    quizScore: scorePercent,
    consecutiveCorrect: updatedConsecutive,
    recentScores: focalRecentScores,
  });

  const masteryUpdates = [...breakdownById.values()].map((b) => {
    const prior = priorById.get(b.skillId);
    const newConsecutive =
      b.attempts === 0
        ? prior?.consecutiveCorrect ?? 0
        : b.attempts === b.correct
          ? (prior?.consecutiveCorrect ?? 0) + b.correct
          : 0;
    const newTotalAttempts = (prior?.totalAttempts ?? 0) + b.attempts;
    const newTotalCorrect = (prior?.totalCorrect ?? 0) + b.correct;
    const skillCorrectRate = newTotalAttempts === 0 ? 1 : newTotalCorrect / newTotalAttempts;
    const failedThisSkill = scorePercent < 50 && skillCorrectRate < 0.5;
    const newFailedQuizzes = (prior?.failedQuizzes ?? 0) + (failedThisSkill ? 1 : 0);
    const isFocal = b.skillId === focal.skillId;
    return {
      skillId: b.skillId,
      consecutiveCorrect: newConsecutive,
      totalAttempts: newTotalAttempts,
      totalCorrect: newTotalCorrect,
      failedQuizzes: newFailedQuizzes,
      remediationFlag: isFocal ? adaptive.remediationFlag : prior?.remediationFlag ?? false,
      lastDifficulty: isFocal ? adaptive.newDifficulty : prior?.lastDifficulty ?? quiz.difficulty,
      lastQuizScore: scorePercent,
      progressionNote: isFocal ? adaptive.progressionNote : prior?.progressionNote ?? null,
    };
  });

  await prisma.$transaction([
    prisma.attempt.createMany({
      data: attempts.map((a) => ({
        questionId: a.questionId,
        studentId: quiz.studentId,
        selectedAnswer: a.selectedAnswer,
        isCorrect: a.isCorrect,
      })),
    }),
    prisma.quiz.update({
      where: { id: quiz.id },
      data: { status: "completed", score: scorePercent, completedAt: new Date() },
    }),
    prisma.student.update({
      where: { id: quiz.studentId },
      data: { currentDifficulty: adaptive.newDifficulty },
    }),
    ...masteryUpdates.map((m) =>
      prisma.conceptMastery.upsert({
        where: {
          studentId_skillId: { studentId: quiz.studentId, skillId: m.skillId },
        },
        create: {
          studentId: quiz.studentId,
          skillId: m.skillId,
          consecutiveCorrect: m.consecutiveCorrect,
          totalAttempts: m.totalAttempts,
          totalCorrect: m.totalCorrect,
          failedQuizzes: m.failedQuizzes,
          remediationFlag: m.remediationFlag,
          lastDifficulty: m.lastDifficulty,
          lastQuizScore: m.lastQuizScore,
          progressionNote: m.progressionNote,
        },
        update: {
          consecutiveCorrect: m.consecutiveCorrect,
          totalAttempts: m.totalAttempts,
          totalCorrect: m.totalCorrect,
          failedQuizzes: m.failedQuizzes,
          remediationFlag: m.remediationFlag,
          lastDifficulty: m.lastDifficulty,
          lastQuizScore: m.lastQuizScore,
          progressionNote: m.progressionNote,
        },
      }),
    ),
  ]);

  // Per-question results let the runner color each row green/red without
  // having shipped correct answers to the client up front.
  const correctById = new Map(quiz.questions.map((q) => [q.id, q.correctAnswer]));
  const results = attempts.map((a) => ({
    questionId: a.questionId,
    correctAnswer: correctById.get(a.questionId) ?? "",
    isCorrect: a.isCorrect,
  }));

  // Gamification: XP + badge detection. Runs after the transaction so the
  // history loader sees the just-completed quiz. Best-effort: any error here
  // logs but doesn't fail the submission.
  let gamification: Awaited<ReturnType<typeof awardXpAndBadges>> | null = null;
  try {
    const topicGroupLetters = Array.from(
      new Set(quiz.questions.map((q) => q.skill.topicGroup.letter)),
    );
    gamification = await awardXpAndBadges({
      quizId: quiz.id,
      studentId: quiz.studentId,
      scorePct: scorePercent,
      startedAt: quiz.startedAt,
      completedAt: new Date(),
      topicGroupLetters,
    });
  } catch (err) {
    console.error("[gamification] award failed", err);
  }

  // Completion emails (student + tutor always, parent if opted in, plus a
  // low-score alert). Fire-and-forget on purpose — the comment used to claim
  // "never blocks the response" but we were actually awaiting it, so first-
  // submit hung ~14s while Ethereal spun up + 3–4 emails went out serially.
  // notifyQuizCompleted is already self-contained and never throws.
  void notifyQuizCompleted(quiz.id).catch((err) =>
    console.error("[notifications] notifyQuizCompleted failed", err),
  );

  return NextResponse.json({
    quizId: quiz.id,
    score: scorePercent,
    newDifficulty: adaptive.newDifficulty,
    newSkillCode: adaptive.newSkillCode,
    remediationFlag: adaptive.remediationFlag,
    progressionNote: adaptive.progressionNote,
    focalSkillCode: focal.skillCode,
    results,
    gamification,
  });
}

// The most-attempted skill on the quiz wins. Ties broken by remediation status,
// then by lowest skill number (most foundational first).
function pickFocalSkill(
  breakdownById: Map<number, SkillBreakdown>,
  priorById: Map<number, { skillId: number; remediationFlag: boolean }>,
): SkillBreakdown {
  const sorted = [...breakdownById.values()].sort((a, b) => {
    if (b.attempts !== a.attempts) return b.attempts - a.attempts;
    const aRem = priorById.get(a.skillId)?.remediationFlag ?? false;
    const bRem = priorById.get(b.skillId)?.remediationFlag ?? false;
    if (aRem !== bRem) return bRem ? 1 : -1;
    return a.skillCode.localeCompare(b.skillCode);
  });
  return sorted[0];
}
