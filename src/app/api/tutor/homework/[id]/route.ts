import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTutorSession } from "@/lib/auth/server";
import { validateHomework, parseSkillIds } from "@/lib/domain/homework";

async function loadOwned(id: string, tutorId: string) {
  const row = await prisma.homeworkAssignment.findUnique({ where: { id } });
  if (!row || row.tutorId !== tutorId) return null;
  return row;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireTutorSession();
  const { id } = await params;
  const row = await loadOwned(id, session.userId);
  if (!row) return NextResponse.json({ error: "Homework not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const result = validateHomework(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const updated = await prisma.homeworkAssignment.update({
    where: { id },
    data: {
      title: result.value.title,
      instructions: result.value.instructions,
      assignedSkillIds: JSON.stringify(result.value.assignedSkillIds),
      dueAt: result.value.dueAt,
      status: result.value.status,
      completedAt: result.value.status === "completed" ? (row.completedAt ?? new Date()) : null,
    },
  });
  return NextResponse.json({
    ok: true,
    homework: { ...updated, assignedSkillIds: parseSkillIds(updated.assignedSkillIds) },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireTutorSession();
  const { id } = await params;
  const row = await loadOwned(id, session.userId);
  if (!row) return NextResponse.json({ error: "Homework not found." }, { status: 404 });

  await prisma.homeworkAssignment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
