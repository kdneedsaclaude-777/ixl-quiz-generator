import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ParentSession } from "@/lib/auth/server";

const COOKIE_NAME = "active-child";
const LOCK_COOKIE = "child-lock"; // "1" while a PIN-locked child session is active
const MAX_AGE = 60 * 60 * 8; // 8 hours, refreshed on each selection

type ResolvedStudent = {
  student: { id: number; name: string; grade: number; currentDifficulty: number; orgId: string | null };
  // How the viewer reached this student: their own account, or a parent/admin.
  viaSelfLogin: boolean;
};

// Single entry point for /child/* pages. Works for BOTH:
//  - a student logged into their own account (role=student) → their profile
//  - a parent (or impersonating superadmin) who picked a child via the cookie
// Redirects to the right place if neither resolves.
export async function resolveActiveStudent(): Promise<ResolvedStudent> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  const role = session.user.role;

  if (role === "student") {
    const profile = await prisma.student.findFirst({
      where: { userId: session.user.id },
      select: { id: true, name: true, grade: true, currentDifficulty: true, orgId: true },
    });
    if (!profile) redirect("/auth/login");
    return { student: profile, viaSelfLogin: true };
  }

  // Parent / impersonating-superadmin path: needs an active-child cookie.
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  const childId = parseInt(raw ?? "", 10);
  if (!Number.isFinite(childId)) redirect("/child/select");

  const child = await prisma.student.findUnique({
    where: { id: childId },
    select: { id: true, name: true, grade: true, currentDifficulty: true, orgId: true, parentId: true },
  });
  if (!child) redirect("/child/select");
  if (child.parentId !== session.user.id && role !== "superadmin") redirect("/child/select");
  return {
    student: {
      id: child.id, name: child.name, grade: child.grade,
      currentDifficulty: child.currentDifficulty, orgId: child.orgId,
    },
    viaSelfLogin: false,
  };
}

// Reads the active-child cookie and validates it belongs to the given parent.
// Returns the Student row or null. Never trusts the cookie value alone — a
// parent could only ever activate their own kids, but ownership is re-checked
// on every request so a stolen cookie can't escalate cross-account.
export async function getActiveChild(parent: ParentSession) {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const childId = parseInt(raw, 10);
  if (!Number.isFinite(childId)) return null;
  const child = await prisma.student.findUnique({ where: { id: childId } });
  if (!child) return null;
  if (child.parentId !== parent.userId && parent.role !== "superadmin") return null;
  return child;
}

export async function setActiveChildCookie(childId: number): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, String(childId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearActiveChildCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

// Lock cookie — set only when the parent has a profile-lock PIN. Middleware
// reads it (cookie-only, no DB) to gate /parent/* and profile switching behind
// the PIN. Cleared once the correct PIN is entered (or child mode is exited).
export async function setChildLockCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(LOCK_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE });
}

export async function clearChildLockCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(LOCK_COOKIE);
}

export async function isChildLocked(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(LOCK_COOKIE)?.value === "1";
}
