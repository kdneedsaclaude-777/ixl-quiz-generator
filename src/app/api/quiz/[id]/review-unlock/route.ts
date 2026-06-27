import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";

// Parent / superadmin gate that unlocks test-result review for the student:
// flips Quiz.reviewUnlocked = true so the child's result screen + the submit
// endpoint stop withholding correct answers and explanations.
//
// TODO(tutors): tutors assigned to this student (via TutorAssignment) should
// also be allowed to unlock review. getParentForApi() only resolves parent /
// superadmin sessions, so for now we authorize parent (owner) + superadmin and
// leave tutor support to a follow-up.
export async function PATCH(
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
    include: { student: { select: { parentId: true } } },
  });
  if (!quiz) return NextResponse.json({ error: "quiz not found" }, { status: 404 });

  // Only the owning parent (or a superadmin) may unlock. 404, not 403, so we
  // never confirm a quiz id to a non-owner.
  const uid = auth.parent.userId;
  const canUnlock = quiz.student.parentId === uid || auth.parent.role === "superadmin";
  if (!canUnlock) {
    return NextResponse.json({ error: "quiz not found" }, { status: 404 });
  }

  await prisma.quiz.update({
    where: { id: quiz.id },
    data: { reviewUnlocked: true },
  });

  return NextResponse.json({ ok: true });
}
