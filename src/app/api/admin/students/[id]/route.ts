import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { auditLog } from "@/lib/audit";

type PatchBody = { name?: string; grade?: number; currentDifficulty?: number };

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const target = await prisma.student.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Student not found." }, { status: 404 });
  // Org-admins can only touch students in their own org.
  if (auth.admin.role === "orgadmin" && target.orgId !== auth.admin.orgId) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as PatchBody;
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.grade === "number" && body.grade >= 1 && body.grade <= 8) data.grade = body.grade;
  if (typeof body.currentDifficulty === "number" && body.currentDifficulty >= 1 && body.currentDifficulty <= 5) {
    data.currentDifficulty = body.currentDifficulty;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await prisma.student.update({ where: { id }, data });
  await auditLog({
    actorId: auth.admin.userId,
    action: "edit_student",
    targetType: "Student",
    targetId: String(id),
    metadata: data,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const target = await prisma.student.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Student not found." }, { status: 404 });
  if (auth.admin.role === "orgadmin" && target.orgId !== auth.admin.orgId) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  await prisma.student.delete({ where: { id } });
  await auditLog({
    actorId: auth.admin.userId,
    action: "delete_student",
    targetType: "Student",
    targetId: String(id),
    metadata: { name: target.name, grade: target.grade },
  });
  return NextResponse.json({ ok: true });
}
