import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { auditLog } from "@/lib/audit";
import { notifyAccountReinstated } from "@/lib/notifications";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  const wasSuspended = Boolean(target.suspendedAt);

  await prisma.user.update({ where: { id }, data: { suspendedAt: null } });
  await auditLog({
    actorId: auth.admin.userId,
    action: "unsuspend_user",
    targetType: "User",
    targetId: id,
    metadata: { email: target.email },
  });

  // Only email if they were actually suspended — "unsuspending" an active
  // account silently no-ops in the email layer too.
  if (wasSuspended) {
    await notifyAccountReinstated({ to: target.email, name: target.name });
  }
  return NextResponse.json({ ok: true });
}
