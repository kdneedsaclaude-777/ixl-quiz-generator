import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createQuizForStudent } from "@/lib/quiz/create";
import { getParentForApi } from "@/lib/auth/server";
import { loadPracticeDecision, loadLockedTopicGroupIds } from "@/lib/parental";
import { enforceRateLimit } from "@/lib/rate-limit";
import { canGenerateQuiz, logPaywallEvent } from "@/lib/plan";

type Body = {
  studentId?: number;
  questionCount?: number;
  // Manual builder + targeted home tiles. topicGroupIds restricts the pool by
  // group id; topicLetter is a convenience single-group restriction (Daily
  // Challenge / Quick Pick) resolved to an id server-side. difficulty pins the
  // level. mode picks practice vs proctored test. All optional → adaptive default.
  topicGroupIds?: number[];
  topicLetter?: string;
  difficulty?: number;
  mode?: "practice" | "test";
  timeLimitSec?: number;
  // Set true by the home Daily Challenge tile — server-authoritative marker so
  // the daily_done badge + daily-challenge XP bonus can't be spoofed.
  isDailyChallenge?: boolean;
};

export async function POST(req: Request): Promise<Response> {
  // Generation is the most expensive endpoint (potential model call).
  const limited = enforceRateLimit(req, "quiz-generate", 20, 60_000);
  if (limited) return limited;

  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { studentId } = body;
  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }
  // Clamp the question count so a client can't request an unbounded quiz
  // (memory / DB pressure). 1–50 questions, integer.
  const questionCount = Number.isFinite(body.questionCount)
    ? Math.min(50, Math.max(1, Math.round(body.questionCount as number)))
    : 10;
  const mode: "practice" | "test" = body.mode === "test" ? "test" : "practice";

  // Same skill code (e.g. "B.1") exists for every grade, so the lookup must
  // be scoped to the student's grade or we'll bind questions to the wrong
  // grade's TopicGroup row and the dashboard will show wildly wrong topics.
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, grade: true, parentId: true, userId: true },
  });
  // Allowed: the student's own account, their parent, or a superadmin.
  const uid = auth.parent.userId;
  const canAccess =
    student &&
    (student.userId === uid ||
      student.parentId === uid ||
      auth.parent.role === "superadmin");
  if (!canAccess) {
    return NextResponse.json({ error: "student not found" }, { status: 404 });
  }

  // ── Resolve + validate manual/targeted topic restriction ────────────────
  // The client may pass topicGroupIds (builder) and/or a topicLetter (Daily
  // Challenge / Quick Pick). Both are validated server-side: a group must
  // belong to the student's grade, be active, and not be locked by parental
  // controls. Never trust the client to widen the pool.
  let resolvedTopicGroupIds: number[] | undefined;
  const requestedIds = new Set<number>(
    Array.isArray(body.topicGroupIds) ? body.topicGroupIds.filter((n) => Number.isFinite(n)) : [],
  );
  if (body.topicLetter) {
    const grp = await prisma.topicGroup.findFirst({
      where: { gradeLevel: student.grade, letter: body.topicLetter, active: true },
      select: { id: true },
    });
    if (grp) requestedIds.add(grp.id);
  }
  if (requestedIds.size > 0) {
    const locked = new Set(await loadLockedTopicGroupIds(student.id));
    const valid = await prisma.topicGroup.findMany({
      where: { id: { in: [...requestedIds] }, gradeLevel: student.grade, active: true },
      select: { id: true },
    });
    resolvedTopicGroupIds = valid.map((g) => g.id).filter((id) => !locked.has(id));
    if (resolvedTopicGroupIds.length === 0) {
      return NextResponse.json(
        { error: "None of the chosen topics are available for this student." },
        { status: 400 },
      );
    }
  }

  // Clamp a manual difficulty override to the engine's 1–5 band.
  const difficultyOverride =
    typeof body.difficulty === "number" && Number.isFinite(body.difficulty)
      ? Math.min(5, Math.max(1, Math.round(body.difficulty)))
      : undefined;

  // A "manual build" is anything that overrides the adaptive defaults. Such a
  // build must always create a fresh quiz (never reuse an unstarted one) and is
  // tagged generatedBy="manual" for audit.
  const isDailyChallenge = body.isDailyChallenge === true;
  const hasOverrides =
    Boolean(resolvedTopicGroupIds) || difficultyOverride !== undefined || mode === "test" || isDailyChallenge;

  // Enforce parental controls (practice window, daily limit). Parents
  // generating quizzes via this API on their own children get the same gate
  // a child would; admins/superadmins skip it.
  if (auth.parent.role !== "superadmin") {
    const decision = await loadPracticeDecision(student.id);
    if (!decision.allowed) {
      return NextResponse.json(
        { error: decision.detail ?? "Practice not allowed right now.", reason: decision.reason },
        { status: 423 },
      );
    }
  }

  // Don't pile up duplicates: if this child already has an UNSTARTED quiz of
  // the SAME mode (still "active", zero attempts), hand that one back instead
  // of generating another. Makes repeated "New quiz" clicks idempotent until
  // the child begins. Skipped entirely for manual/targeted builds — those carry
  // distinct params and must always produce a fresh quiz.
  if (!hasOverrides) {
    const existingUnstarted = await prisma.quiz.findFirst({
      where: {
        studentId,
        status: "active",
        mode,
        // Only reuse a genuinely-adaptive quiz: never hand back a daily
        // challenge or manual build (which carry their own params/markers).
        generatedBy: "adaptive",
        isDailyChallenge: false,
        questions: { none: { attempts: { some: {} } } },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (existingUnstarted) {
      return NextResponse.json({
        quizId: existingUnstarted.id,
        reused: true,
        isFirstQuiz: false,
        config: null,
      });
    }
  }

  // Freemium gate: about to CREATE a new quiz. Free plan = 1 practice quiz per
  // day; Real Test mode is paid-only. (Runs after the reuse path so a free user
  // can always re-open today's quiz.)
  const gate = await canGenerateQuiz({
    studentId,
    mode,
    isSuperadmin: auth.parent.role === "superadmin",
  });
  if (!gate.allowed) {
    void logPaywallEvent(auth.parent.userId, gate.reason);
    return NextResponse.json({ error: gate.error, reason: gate.reason, upgrade: true }, { status: gate.status });
  }

  const created = await createQuizForStudent({
    studentId,
    grade: student.grade,
    questionCount,
    topicGroupIds: resolvedTopicGroupIds,
    difficultyOverride,
    mode,
    isDailyChallenge,
    timeLimitSec: body.timeLimitSec,
  });
  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: created.status });
  }

  return NextResponse.json({
    quizId: created.quizId,
    reused: false,
    isFirstQuiz: created.isFirstQuiz,
    config: created.config,
  });
}
