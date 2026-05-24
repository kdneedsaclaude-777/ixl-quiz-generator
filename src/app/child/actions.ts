"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import { setActiveChildCookie, clearActiveChildCookie } from "@/lib/active-child";

// Verifies the child belongs to the logged-in parent, then sets the
// active-child cookie and routes the browser to the child home.
export async function selectChild(formData: FormData): Promise<void> {
  const parent = await requireParentSession();
  const raw = formData.get("childId");
  const childId = parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(childId)) redirect("/child/select?error=invalid");

  const child = await prisma.student.findUnique({ where: { id: childId } });
  if (!child || (child.parentId !== parent.userId && parent.role !== "superadmin")) {
    redirect("/child/select?error=notfound");
  }

  await setActiveChildCookie(childId);
  redirect("/child/home");
}

export async function exitChildMode(): Promise<void> {
  await clearActiveChildCookie();
  redirect("/parent/dashboard");
}
