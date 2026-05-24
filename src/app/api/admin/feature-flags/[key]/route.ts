import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { auditLog } from "@/lib/audit";

type Body = { enabled?: boolean; value?: string | null };

export async function PATCH(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { key } = await params;
  if (!key || key.length > 64) return NextResponse.json({ error: "Invalid key." }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const data: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (body.value !== undefined) data.value = body.value;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const existing = await prisma.featureFlag.findUnique({ where: { key } });
  if (!existing) return NextResponse.json({ error: "Flag not found." }, { status: 404 });

  await prisma.featureFlag.update({ where: { key }, data });
  await auditLog({
    actorId: auth.admin.userId,
    action: "edit_feature_flag",
    targetType: "FeatureFlag",
    targetId: key,
    metadata: data,
  });
  return NextResponse.json({ ok: true });
}
