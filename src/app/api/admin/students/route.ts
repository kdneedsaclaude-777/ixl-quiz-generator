import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { auditLog } from "@/lib/audit";
import { notifyWelcome } from "@/lib/notifications";

type Body = {
  name?: string;
  grade?: number;
  parentId?: string;
  startingDifficulty?: number;
  // Optional bundled login account for the student
  createLogin?: boolean;
  loginEmail?: string;
  loginPassword?: string;
};

// Admin-side student creation. Mirrors what /onboarding does for a parent,
// but here the admin picks which parent the student belongs to, and can
// optionally provision a student login in the same step.
export async function POST(req: Request): Promise<Response> {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as Body;
  const name = body.name?.trim();
  const grade = body.grade;
  const parentId = body.parentId?.trim();
  const difficulty = body.startingDifficulty ?? 1;

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!Number.isInteger(grade) || grade! < 1 || grade! > 8) {
    return NextResponse.json({ error: "Grade must be 1–8." }, { status: 400 });
  }
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    return NextResponse.json({ error: "Starting difficulty must be 1–5." }, { status: 400 });
  }
  if (!parentId) return NextResponse.json({ error: "Pick a parent." }, { status: 400 });

  // Parent must exist + be in the admin's org (orgadmin scope).
  const parent = await prisma.user.findUnique({ where: { id: parentId } });
  if (!parent || parent.role !== "parent" || parent.deletedAt) {
    return NextResponse.json({ error: "Parent not found." }, { status: 400 });
  }
  if (auth.admin.role === "orgadmin" && parent.orgId !== auth.admin.orgId) {
    return NextResponse.json({ error: "Parent not found." }, { status: 400 });
  }
  const studentOrgId = parent.orgId; // student inherits parent's org

  // Optional login provisioning — validated together with the body.
  let loginEmail: string | null = null;
  let loginPasswordHash: string | null = null;
  if (body.createLogin) {
    const e = body.loginEmail?.trim().toLowerCase();
    const p = body.loginPassword ?? "";
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return NextResponse.json({ error: "Login email is invalid." }, { status: 400 });
    }
    const strength = validatePasswordStrength(p);
    if (!strength.ok) return NextResponse.json({ error: strength.reason }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email: e } });
    if (existing) return NextResponse.json({ error: "Login email already in use." }, { status: 409 });
    loginEmail = e;
    loginPasswordHash = await hashPassword(p);
  }

  // Default topic selection = every active topic group for the grade. The
  // admin (or parent) can refine from the per-child page later.
  const activeTopicGroups = await prisma.topicGroup.findMany({
    where: { gradeLevel: grade!, active: true },
    select: { id: true },
  });
  if (activeTopicGroups.length === 0) {
    return NextResponse.json(
      { error: `No active topic groups for grade ${grade}. Enable some under Content first.` },
      { status: 400 },
    );
  }

  // Single transaction so a partial failure can't leave an orphan Student
  // or a User without its Student row.
  const created = await prisma.$transaction(async (tx) => {
    let loginUserId: string | null = null;
    if (loginEmail && loginPasswordHash) {
      const u = await tx.user.create({
        data: {
          name,
          email: loginEmail,
          passwordHash: loginPasswordHash,
          role: "student",
          orgId: studentOrgId,
          emailVerified: new Date(), // admin-vouched
        },
        select: { id: true },
      });
      loginUserId = u.id;
      // Notification settings so digest queries pick them up.
      await tx.notificationSettings.create({ data: { userId: loginUserId } });
    }

    const student = await tx.student.create({
      data: {
        name,
        grade: grade!,
        currentDifficulty: difficulty,
        tutorApproved: true,
        orgId: studentOrgId,
        parentId,
        userId: loginUserId,
        topicSelections: {
          create: activeTopicGroups.map((g) => ({ topicGroupId: g.id })),
        },
      },
      select: { id: true },
    });

    return { studentId: student.id, loginUserId };
  });

  await auditLog({
    actorId: auth.admin.userId,
    action: "create_student",
    targetType: "Student",
    targetId: String(created.studentId),
    metadata: {
      name,
      grade,
      parentId,
      withLogin: Boolean(loginEmail),
      loginEmail: loginEmail ?? undefined,
    },
  });

  // If the admin provisioned a student login, send the kid a welcome too.
  // (No welcome to the parent because adding-a-child is the parent's own
  // expected workflow, not something we need to alert them about.)
  if (created.loginUserId && loginEmail) {
    await notifyWelcome({
      userId: created.loginUserId,
      to: loginEmail,
      name,
      role: "student",
      loginNote: "An administrator created this account for you. Your password was set when the account was made.",
    });
  }

  return NextResponse.json({ ok: true, studentId: created.studentId, loginUserId: created.loginUserId });
}
