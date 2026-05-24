import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { auditLog } from "@/lib/audit";

// Permanent delete (admin-only). Cascades: Student.parentId becomes NULL
// (SetNull cascade), all sessions/accounts/notifications/tokens removed.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  if (id === auth.admin.userId) {
    return NextResponse.json({ error: "Admins can't self-delete here." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.role === "superadmin") {
    return NextResponse.json({ error: "Cannot delete a superadmin." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  await auditLog({
    actorId: auth.admin.userId,
    action: "delete_user",
    targetType: "User",
    targetId: id,
    metadata: { email: target.email, name: target.name },
  });
  return NextResponse.json({ ok: true });
}
