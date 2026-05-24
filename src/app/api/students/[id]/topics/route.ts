import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";

type Body = { topicGroupIds?: number[] };

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: idParam } = await params;
  const studentId = parseInt(idParam, 10);
  if (!Number.isFinite(studentId)) {
    return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as Body;
  const ids = Array.isArray(body.topicGroupIds) ? body.topicGroupIds.filter((n) => Number.isFinite(n)) : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "Select at least one topic group" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || (student.parentId !== auth.parent.userId && auth.parent.role !== "superadmin")) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const validGroups = await prisma.topicGroup.findMany({
    where: { id: { in: ids }, gradeLevel: student.grade },
    select: { id: true },
  });
  const validIds = new Set(validGroups.map((g) => g.id));
  if (validIds.size === 0) {
    return NextResponse.json({ error: "None of the selected topics belong to this student's grade" }, { status: 400 });
  }

  // Replace selections atomically: drop the existing rows, then re-insert.
  await prisma.$transaction([
    prisma.studentTopicSelection.deleteMany({ where: { studentId } }),
    prisma.studentTopicSelection.createMany({
      data: [...validIds].map((topicGroupId) => ({ studentId, topicGroupId })),
    }),
  ]);

  return NextResponse.json({ ok: true, count: validIds.size });
}
