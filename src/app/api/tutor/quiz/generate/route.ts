import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tutorOwnsStudent } from "@/lib/tutor";
import { createQuizForStudent } from "@/lib/quiz/create";
import { enforceRateLimit } from "@/lib/rate-limit";

// Lets a tutor generate (assign) an adaptive practice quiz for a student on
// their roster. Tutors are staff, so no freemium/parental gating — but they can
// only generate for students assigned to them (superadmin: any).
type Body = { studentId?: number; questionCount?: number };

export async function POST(req: Request): Promise<Response> {
  const limited = enforceRateLimit(req, "quiz-generate", 20, 60_000);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const role = session.user.role;
  if (role !== "tutor" && role !== "superadmin") {
    return NextResponse.json({ error: "Tutors only." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const studentId = body.studentId;
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const student =
    role === "superadmin"
      ? await prisma.student.findUnique({ where: { id: studentId } })
      : await tutorOwnsStudent(session.user.id, studentId);
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const questionCount = Number.isFinite(body.questionCount)
    ? Math.min(50, Math.max(1, Math.round(body.questionCount as number)))
    : 10;

  const created = await createQuizForStudent({
    studentId,
    grade: student.grade,
    questionCount,
    mode: "practice",
  });
  if (!created.ok) return NextResponse.json({ error: created.error }, { status: created.status });
  return NextResponse.json({ quizId: created.quizId });
}
