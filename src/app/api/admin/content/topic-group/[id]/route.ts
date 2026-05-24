import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { auditLog } from "@/lib/audit";

type Body = { name?: string; active?: boolean };

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.active === "boolean") data.active = body.active;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  await prisma.topicGroup.update({ where: { id }, data });
  await auditLog({
    actorId: auth.admin.userId,
    action: "edit_topic_group",
    targetType: "TopicGroup",
    targetId: String(id),
    metadata: data,
  });
  return NextResponse.json({ ok: true });
}
