import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
  }

  const exists = await prisma.student.findUnique({ where: { id } });
  // Treat missing AND not-owned identically: return 404 either way so a
  // parent can't probe which student IDs exist on other accounts.
  if (!exists || (exists.parentId !== auth.parent.userId && auth.parent.role !== "superadmin")) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Schema cascades: deleting a Student removes topicSelections, quizzes,
  // questions, attempts, and conceptMastery rows automatically.
  await prisma.student.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
