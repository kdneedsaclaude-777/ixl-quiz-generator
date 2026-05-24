import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { auditLog } from "@/lib/audit";
import { setImpersonationCookie } from "@/lib/impersonation";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.role !== "parent") {
    return NextResponse.json({ error: "Only parent accounts can be impersonated." }, { status: 400 });
  }
  if (target.deletedAt) {
    return NextResponse.json({ error: "Account is deleted." }, { status: 400 });
  }

  await setImpersonationCookie(target.id);
  await auditLog({
    actorId: auth.admin.userId,
    action: "impersonate_start",
    targetType: "User",
    targetId: id,
    metadata: { email: target.email },
  });
  return NextResponse.json({ ok: true, redirect: "/parent/dashboard" });
}
