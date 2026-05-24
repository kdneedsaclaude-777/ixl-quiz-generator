import { NextResponse } from "next/server";
import { getAdminForApi } from "@/lib/auth/admin";
import { clearImpersonationCookie, getImpersonatedUserId } from "@/lib/impersonation";
import { auditLog } from "@/lib/audit";

export async function POST() {
  // Allow exit even if the impersonator's real session is admin.
  // We re-check admin rights (in case session changed), then clear the cookie.
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const impersonated = await getImpersonatedUserId();
  await clearImpersonationCookie();
  if (impersonated) {
    await auditLog({
      actorId: auth.admin.userId,
      action: "impersonate_exit",
      targetType: "User",
      targetId: impersonated,
    });
  }
  return NextResponse.json({ ok: true });
}
