import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { auditLog } from "@/lib/audit";
import { notifyAccountSuspended } from "@/lib/notifications";

type Body = { ids?: string[] };

export async function POST(req: Request): Promise<Response> {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as Body;
  const ids = Array.isArray(body.ids) ? body.ids.filter((s) => typeof s === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "No user ids supplied." }, { status: 400 });

  // Pull name + previous suspendedAt so we can skip emailing already-suspended
  // users (re-suspending shouldn't ding their inbox).
  const targets = await prisma.user.findMany({
    where: { id: { in: ids }, role: "parent", deletedAt: null },
    select: { id: true, email: true, name: true, suspendedAt: true },
  });
  const targetIds = targets.map((t) => t.id);
  await prisma.user.updateMany({
    where: { id: { in: targetIds } },
    data: { suspendedAt: new Date() },
  });
  // One audit row + one email per user (the latter only if newly suspended).
  for (const t of targets) {
    await auditLog({
      actorId: auth.admin.userId,
      action: "suspend_user",
      targetType: "User",
      targetId: t.id,
      metadata: { email: t.email, bulk: true },
    });
    if (!t.suspendedAt) {
      await notifyAccountSuspended({ to: t.email, name: t.name });
    }
  }
  return NextResponse.json({ ok: true, count: targets.length });
}
