import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { auditLog } from "@/lib/audit";
import { notifyAccountSuspended } from "@/lib/notifications";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.role === "superadmin") {
    return NextResponse.json({ error: "Cannot suspend a superadmin." }, { status: 400 });
  }
  const alreadySuspended = Boolean(target.suspendedAt);

  await prisma.user.update({ where: { id }, data: { suspendedAt: new Date() } });
  await auditLog({
    actorId: auth.admin.userId,
    action: "suspend_user",
    targetType: "User",
    targetId: id,
    metadata: { email: target.email },
  });

  // Skip the email if they were already suspended — re-suspending is just an
  // admin tap; the user already knows.
  if (!alreadySuspended) {
    await notifyAccountSuspended({ to: target.email, name: target.name });
  }
  return NextResponse.json({ ok: true });
}
