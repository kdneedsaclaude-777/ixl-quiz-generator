"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";

// Sets a child's daily quiz goal (parent-only, ownership-checked).
export async function setDailyGoal(formData: FormData): Promise<void> {
  const parent = await requireParentSession();
  const childId = parseInt(String(formData.get("childId") ?? ""), 10);
  const goal = Math.max(1, Math.min(10, parseInt(String(formData.get("goal") ?? "1"), 10) || 1));
  if (!Number.isFinite(childId)) return;
  const child = await prisma.student.findUnique({ where: { id: childId }, select: { parentId: true } });
  if (!child || (child.parentId !== parent.userId && parent.role !== "superadmin")) return;
  await prisma.student.update({ where: { id: childId }, data: { dailyGoal: goal } });
  revalidatePath(`/parent/child/${childId}`);
}
