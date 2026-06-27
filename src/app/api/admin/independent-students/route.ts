import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { hashPassword } from "@/lib/password";
import { auditLog } from "@/lib/audit";

// Creates an independent (self-billed) student: a Student row plus, if a login
// is enabled, a student User account. No parent is attached (parentId stays
// null — the schema already allows parent-less students). Core fields persist;
// billing/calendar/subject fields are accepted but wired in a later stage.
type Body = {
  firstNames?: string;
  lastName?: string;
  email?: string;
  grade?: string | number;
  enableUserAccount?: boolean;
};

export async function POST(req: Request): Promise<Response> {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const b = (await req.json().catch(() => ({}))) as Body;
  const name = `${(b.firstNames ?? "").trim()} ${(b.lastName ?? "").trim()}`.trim();
  const email = (b.email ?? "").trim().toLowerCase();
  const grade = parseInt(String(b.grade ?? ""), 10);

  if (!name) return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  if (!Number.isInteger(grade) || grade < 1 || grade > 8) {
    return NextResponse.json({ error: "Grade must be 1–8." }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const wantsLogin = b.enableUserAccount !== false;
  if (wantsLogin && (await prisma.user.findUnique({ where: { email } }))) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const activeGroups = await prisma.topicGroup.findMany({
    where: { gradeLevel: grade, active: true },
    select: { id: true },
  });

  // Hash outside the transaction — bcrypt is CPU-bound and shouldn't be
  // awaited while an interactive transaction holds a DB connection.
  const passwordHash = wantsLogin
    ? await hashPassword(crypto.randomBytes(18).toString("base64url"))
    : null;

  const created = await prisma.$transaction(async (tx) => {
    let loginUserId: string | null = null;
    if (wantsLogin && passwordHash) {
      const u = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "student",
          orgId: auth.admin.orgId,
          emailVerified: new Date(),
        },
        select: { id: true },
      });
      loginUserId = u.id;
      await tx.notificationSettings.create({ data: { userId: u.id } });
    }
    const student = await tx.student.create({
      data: {
        name,
        grade,
        currentDifficulty: 1,
        tutorApproved: true,
        orgId: auth.admin.orgId,
        parentId: null, // independent → billed directly, no family
        userId: loginUserId,
        topicSelections: { create: activeGroups.map((g) => ({ topicGroupId: g.id })) },
      },
      select: { id: true },
    });
    return { studentId: student.id };
  });

  await auditLog({
    actorId: auth.admin.userId,
    action: "create_student",
    targetType: "Student",
    targetId: String(created.studentId),
    metadata: { independent: true, via: "new_independent_form", grade },
  });

  return NextResponse.json({ ok: true, studentId: created.studentId });
}
