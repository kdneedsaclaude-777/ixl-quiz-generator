import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTutorSession } from "@/lib/auth/server";
import { tutorOwnsStudent } from "@/lib/tutor";
import { validateTutorSession } from "@/lib/domain/tutor-sessions";

// GET  /api/tutor/students/[studentId]/sessions  → list this student's sessions
// POST /api/tutor/students/[studentId]/sessions  → create a session
// Tutor-only; the tutor must be assigned to the student.

async function authorize(studentIdRaw: string) {
  const session = await requireTutorSession();
  const studentId = parseInt(studentIdRaw, 10);
  if (!Number.isFinite(studentId)) {
    return { ok: false as const, status: 400, error: "Invalid student id." };
  }
  if (!(await tutorOwnsStudent(session.userId, studentId))) {
    return { ok: false as const, status: 404, error: "Student not found." };
  }
  return { ok: true as const, tutorId: session.userId, studentId };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string }> },
): Promise<Response> {
  const { studentId } = await params;
  const auth = await authorize(studentId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const sessions = await prisma.tutorSession.findMany({
    where: { studentId: auth.studentId },
    orderBy: { scheduledAt: "desc" },
  });
  return NextResponse.json({ sessions });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> },
): Promise<Response> {
  const { studentId } = await params;
  const auth = await authorize(studentId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const result = validateTutorSession(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const created = await prisma.tutorSession.create({
    data: {
      tutorId: auth.tutorId,
      studentId: auth.studentId,
      scheduledAt: result.value.scheduledAt,
      durationMin: result.value.durationMin,
      focus: result.value.focus,
      notes: result.value.notes,
      status: result.value.status,
    },
  });
  return NextResponse.json({ ok: true, session: created });
}
