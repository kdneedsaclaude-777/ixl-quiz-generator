"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import { generatePin, hashPin } from "@/lib/profile-lock";
import { notifyProfilePin } from "@/lib/notifications";

// Generate a fresh 4-digit PIN, store its hash, and email the clear PIN to the
// parent. Used to both enable the lock and resend/rotate the PIN.
async function rotatePin(): Promise<void> {
  const parent = await requireParentSession();
  const user = await prisma.user.findUnique({
    where: { id: parent.userId },
    select: { email: true, name: true },
  });
  if (!user) return;
  const pin = generatePin();
  await prisma.user.update({
    where: { id: parent.userId },
    data: { profileLockPin: await hashPin(pin) },
  });
  await notifyProfilePin({ to: user.email, name: user.name ?? "there", pin });
}

export async function enableProfileLock(): Promise<void> {
  await rotatePin();
  revalidatePath("/parent/settings/account");
}

export async function resendProfilePin(): Promise<void> {
  await rotatePin();
  revalidatePath("/parent/settings/account");
}

export async function disableProfileLock(): Promise<void> {
  const parent = await requireParentSession();
  await prisma.user.update({
    where: { id: parent.userId },
    data: { profileLockPin: null },
  });
  revalidatePath("/parent/settings/account");
}
