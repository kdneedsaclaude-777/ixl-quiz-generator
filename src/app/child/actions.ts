"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import {
  setActiveChildCookie,
  clearActiveChildCookie,
  setChildLockCookie,
  clearChildLockCookie,
  isChildLocked,
} from "@/lib/active-child";
import { verifyPin, generatePin, hashPin } from "@/lib/profile-lock";
import { notifyProfilePin } from "@/lib/notifications";

// Verifies the child belongs to the logged-in parent, then sets the
// active-child cookie and routes the browser to the child home. If the parent
// has a profile-lock PIN, also arm the lock so switching/leaving needs it.
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
  const u = await prisma.user.findUnique({
    where: { id: parent.userId },
    select: { profileLockPin: true },
  });
  if (u?.profileLockPin) await setChildLockCookie();
  else await clearChildLockCookie();
  redirect("/child/home");
}

export async function exitChildMode(): Promise<void> {
  // Locked → must enter the PIN before returning to the parent app.
  if (await isChildLocked()) {
    redirect(`/child/unlock?next=${encodeURIComponent("/parent/dashboard")}`);
  }
  await clearActiveChildCookie();
  redirect("/parent/dashboard");
}

// Used by /child/unlock. Verifies the PIN against the parent's stored hash,
// then performs the requested next action (switch profile / back to parent).
export async function unlockProfile(formData: FormData): Promise<void> {
  const parent = await requireParentSession();
  const pin = String(formData.get("pin") ?? "").trim();
  const next = String(formData.get("next") ?? "/parent/dashboard");
  const safeNext = next.startsWith("/") ? next : "/parent/dashboard";

  const u = await prisma.user.findUnique({
    where: { id: parent.userId },
    select: { profileLockPin: true },
  });
  // No PIN set → nothing to verify; clear the lock and proceed.
  if (!u?.profileLockPin) {
    await clearChildLockCookie();
    redirect(safeNext);
  }
  const ok = await verifyPin(pin, u!.profileLockPin!);
  if (!ok) {
    redirect(`/child/unlock?next=${encodeURIComponent(safeNext)}&error=1`);
  }
  await clearChildLockCookie();
  // Returning to the parent app fully exits child mode.
  if (safeNext.startsWith("/parent")) await clearActiveChildCookie();
  redirect(safeNext);
}

// "Forgot the PIN?" from the unlock screen — regenerates a PIN and emails it to
// the parent (safe: the kid can't read the parent's inbox), then returns to the
// unlock screen with a confirmation.
export async function resendPinFromUnlock(formData: FormData): Promise<void> {
  const parent = await requireParentSession();
  const next = String(formData.get("next") ?? "/parent/dashboard");
  const safeNext = next.startsWith("/") ? next : "/parent/dashboard";
  const user = await prisma.user.findUnique({
    where: { id: parent.userId },
    select: { email: true, name: true },
  });
  if (user) {
    const pin = generatePin();
    await prisma.user.update({ where: { id: parent.userId }, data: { profileLockPin: await hashPin(pin) } });
    await notifyProfilePin({ to: user.email, name: user.name ?? "there", pin });
  }
  redirect(`/child/unlock?next=${encodeURIComponent(safeNext)}&sent=1`);
}
