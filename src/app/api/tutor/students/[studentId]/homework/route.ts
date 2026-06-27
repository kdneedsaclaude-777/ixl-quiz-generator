import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTutorSession } from "@/lib/auth/server";
import { tutorOwnsStudent } from "@/lib/tutor";
import { validateHomework, parseSkillIds } from "@/lib/domain/homework";

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

  const rows = await prisma.homeworkAssignment.findMany({
    where: { studentId: auth.studentId },
    orderBy: { createdAt: "desc" },
  });
  const homework = rows.map((h) => ({ ...h, assignedSkillIds: parseSkillIds(h.assignedSkillIds) }));
  return NextResponse.json({ homework });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> },
): Promise<Response> {
  const { studentId } = await params;
  const auth = await authorize(studentId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const result = validateHomework(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const created = await prisma.homeworkAssignment.create({
    data: {
      tutorId: auth.tutorId,
      studentId: auth.studentId,
      title: result.value.title,
      instructions: result.value.instructions,
      assignedSkillIds: JSON.stringify(result.value.assignedSkillIds),
      dueAt: result.value.dueAt,
      status: result.value.status,
    },
  });
  return NextResponse.json({
    ok: true,
    homework: { ...created, assignedSkillIds: parseSkillIds(created.assignedSkillIds) },
  });
}
