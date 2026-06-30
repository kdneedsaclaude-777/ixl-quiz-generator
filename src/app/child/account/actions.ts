"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { resolveActiveStudent } from "@/lib/active-child";
import { AVATAR_CHOICES } from "@/lib/student-emoji";

// Sets the active student's avatar to one of the allowed emoji.
export async function setAvatar(formData: FormData): Promise<void> {
  const { student } = await resolveActiveStudent();
  const avatar = String(formData.get("avatar") ?? "");
  if (!AVATAR_CHOICES.includes(avatar)) return;
  await prisma.student.update({ where: { id: student.id }, data: { avatar } });
  revalidatePath("/child/account");
  revalidatePath("/child/home");
}
