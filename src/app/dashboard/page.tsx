import { redirect } from "next/navigation";
import { requireParentSession } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

// Legacy redirect: pre-Phase-1 the per-child dashboard lived here. New
// canonical URL is /parent/child/[id]. Ownership is checked before issuing
// the redirect to avoid leaking child ID existence cross-parent.
export default async function LegacyDashboardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const parent = await requireParentSession();
  const { studentId: sid } = await searchParams;
  const childId = parseInt(sid ?? "", 10);
  if (!Number.isFinite(childId)) redirect("/parent/dashboard");

  const student = await prisma.student.findUnique({ where: { id: childId } });
  if (!student || (student.parentId !== parent.userId && parent.role !== "superadmin")) {
    redirect("/parent/dashboard");
  }

  redirect(`/parent/child/${childId}`);
}
