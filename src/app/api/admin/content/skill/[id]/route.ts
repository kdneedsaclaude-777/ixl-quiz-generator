import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { auditLog } from "@/lib/audit";

type Body = { active?: boolean };

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "active must be a boolean." }, { status: 400 });
  }

  await prisma.skill.update({ where: { id }, data: { active: body.active } });
  await auditLog({
    actorId: auth.admin.userId,
    action: "edit_skill",
    targetType: "Skill",
    targetId: String(id),
    metadata: { active: body.active },
  });
  return NextResponse.json({ ok: true });
}
