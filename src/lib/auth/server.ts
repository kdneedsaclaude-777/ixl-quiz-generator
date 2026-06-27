import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getImpersonatedUserId } from "@/lib/impersonation";

export type ParentSession = {
  userId: string;
  email: string;
  name: string;
  role: "parent" | "superadmin";
  orgId: string | null;
  emailVerified: Date | null;
  // Present only while admin is impersonating a parent.
  impersonatedBy?: { userId: string; name: string; email: string };
};

export type TutorSession = {
  userId: string;
  email: string;
  name: string;
  orgId: string | null;
};

export type StudentSession = {
  userId: string;
  email: string;
  name: string;
  orgId: string | null;
  studentId: number;
};

// Server-component / server-action helper: bounces to /auth/login if absent,
// otherwise returns a strongly-typed view of the session user. Loads the
// user row from DB so suspended/deleted checks stay fresh. Respects the
// admin-impersonation cookie so /parent/* pages render AS the impersonated
// parent when set.
export async function requireParentSession(): Promise<ParentSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const realUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, orgId: true, emailVerified: true, suspendedAt: true, deletedAt: true },
  });
  if (!realUser || realUser.deletedAt) redirect("/auth/login");
  if (realUser.suspendedAt) redirect("/auth/login?suspended=1");

  // Impersonation: superadmin viewing as a parent. We swap the returned
  // identity to the target user but carry the original admin in
  // impersonatedBy so the layout can show the red banner + exit button.
  if (realUser.role === "superadmin") {
    const impersonatedId = await getImpersonatedUserId();
    if (impersonatedId) {
      const target = await prisma.user.findUnique({
        where: { id: impersonatedId },
        select: { id: true, email: true, name: true, role: true, orgId: true, emailVerified: true, deletedAt: true },
      });
      if (target && !target.deletedAt && target.role === "parent") {
        return {
          userId: target.id,
          email: target.email,
          name: target.name,
          role: "parent",
          orgId: target.orgId,
          emailVerified: target.emailVerified,
          impersonatedBy: { userId: realUser.id, name: realUser.name, email: realUser.email },
        };
      }
    }
  }

  if (realUser.role !== "parent" && realUser.role !== "superadmin") redirect("/auth/login");

  return {
    userId: realUser.id,
    email: realUser.email,
    name: realUser.name,
    role: realUser.role as "parent" | "superadmin",
    orgId: realUser.orgId,
    emailVerified: realUser.emailVerified,
  };
}

// Tutor-only server helper. Org-scoped: tutors only ever see students linked
// to them via TutorAssignment within their org.
export async function requireTutorSession(): Promise<TutorSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, orgId: true, suspendedAt: true, deletedAt: true },
  });
  if (!user || user.deletedAt) redirect("/auth/login");
  if (user.suspendedAt) redirect("/auth/login?suspended=1");
  if (user.role !== "tutor") redirect("/auth/login");
  return { userId: user.id, email: user.email, name: user.name, orgId: user.orgId };
}

// Student-only server helper. Resolves the logged-in student User to their
// Student profile (Student.userId === user.id).
export async function requireStudentSession(): Promise<StudentSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, role: true, orgId: true, suspendedAt: true, deletedAt: true,
      studentProfile: { select: { id: true } },
    },
  });
  if (!user || user.deletedAt) redirect("/auth/login");
  if (user.suspendedAt) redirect("/auth/login?suspended=1");
  if (user.role !== "student" || !user.studentProfile) redirect("/auth/login");
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    orgId: user.orgId,
    studentId: user.studentProfile.id,
  };
}

// Throws 404 (not 403) on unowned child IDs — never leak whether a given
// ID exists for another parent.
export async function requireOwnedChild(parentId: string, childId: number) {
  const student = await prisma.student.findUnique({ where: { id: childId } });
  if (!student || student.parentId !== parentId) {
    return null;
  }
  return student;
}

// API-route variant: returns the session-or-error rather than redirecting.
// Any-role API gate: accepts any logged-in, non-suspended, non-deleted user.
// Used by routes that several roles share (e.g. student approval). Returns a
// minimal user view; callers do their own per-resource authorization.
export type ApiSessionUser = { userId: string; email: string; name: string; role: string; orgId: string | null };

export async function getSessionForApi(): Promise<
  | { ok: true; user: ApiSessionUser }
  | { ok: false; status: number; error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, status: 401, error: "Not authenticated." };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, orgId: true, suspendedAt: true, deletedAt: true },
  });
  if (!user || user.deletedAt) return { ok: false, status: 401, error: "Account unavailable." };
  if (user.suspendedAt) return { ok: false, status: 403, error: "Account suspended." };
  return { ok: true, user: { userId: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId } };
}

export async function getParentForApi(): Promise<
  | { ok: true; parent: ParentSession }
  | { ok: false; status: number; error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, status: 401, error: "Not authenticated." };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, orgId: true, emailVerified: true, suspendedAt: true, deletedAt: true },
  });
  if (!user || user.deletedAt) return { ok: false, status: 401, error: "Account unavailable." };
  if (user.suspendedAt) return { ok: false, status: 403, error: "Account suspended." };
  return {
    ok: true,
    parent: {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "parent" | "superadmin",
      orgId: user.orgId,
      emailVerified: user.emailVerified,
    },
  };
}
