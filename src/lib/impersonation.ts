import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "admin-impersonate";
const MAX_AGE = 60 * 60 * 2; // 2 hours

// Cookie holds the impersonated user's id. The original admin session is
// preserved in NextAuth's JWT — so an admin who exits returns to /admin
// without re-authenticating.
export async function getImpersonatedUserId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

export async function setImpersonationCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearImpersonationCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

// Loads the impersonated user record (or null). Used by the parent layout
// to show the red "Impersonating X" banner.
export async function loadImpersonatedUser() {
  const id = await getImpersonatedUserId();
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
}
