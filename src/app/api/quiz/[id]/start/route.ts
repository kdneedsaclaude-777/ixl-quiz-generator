import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";

// Stamp Quiz.testStartedAt = now EXACTLY ONCE, the first time a test is started,
// so the countdown can't be reset by reloading the intake. The conditional
// updateMany (where testStartedAt is null) is the atomic guard — repeat calls
// after the first are no-ops. submit computes elapsed from testStartedAt.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: idParam } = await params;
  const quizId = parseInt(idParam, 10);
  if (!Number.isFinite(quizId)) {
    return NextResponse.json({ error: "invalid quiz id" }, { status: 400 });
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { student: { select: { userId: true, parentId: true } } },
  });
  if (!quiz) return NextResponse.json({ error: "quiz not found" }, { status: 404 });

  // Same ownership check the submit route uses (404, never 403, on no access).
  const uid = auth.parent.userId;
  const canAccess =
    quiz.student.userId === uid ||
    quiz.student.parentId === uid ||
    auth.parent.role === "superadmin";
  if (!canAccess) {
    return NextResponse.json({ error: "quiz not found" }, { status: 404 });
  }

  // Stamp the clock origin once. The where-clause (testStartedAt: null) makes
  // this atomic and idempotent: only the first call sets it; reloads can't
  // reset it. Never (re)start a completed quiz.
  if (quiz.status !== "completed") {
    await prisma.quiz.updateMany({
      where: { id: quiz.id, testStartedAt: null },
      data: { testStartedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
