import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { auditLog } from "@/lib/audit";
import { notifyWelcome } from "@/lib/notifications";
import { parseCsv, parseStudentRows, type RowError } from "@/lib/csv-import";

// POST /api/admin/students/bulk-import   Body: { csv, mode: "preview"|"commit" }
//   preview → parse + validate every row against the DB and return a plan.
//   commit  → insert every valid row; skip invalids.
// org-admins scoped to their own org; superadmin sees all parents.

type Body = { csv?: string; mode?: "preview" | "commit" };

type RowPlan = {
  rowNumber: number;
  name: string;
  grade: number;
  parentEmail: string;
  difficulty: number;
  withLogin: boolean;
  ok: boolean;
  problems: string[];
};

export async function POST(req: Request): Promise<Response> {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as Body;
  const csv = body.csv ?? "";
  const mode = body.mode === "commit" ? "commit" : "preview";
  if (!csv.trim()) return NextResponse.json({ error: "Empty CSV." }, { status: 400 });

  const rows = parseCsv(csv);
  const { parsed, errors } = parseStudentRows(rows);

  const headerErr = errors.find((e) => e.rowNumber === 0);
  if (headerErr) return NextResponse.json({ error: headerErr.message }, { status: 400 });

  // Resolve parents (scoped) + detect duplicate logins.
  const parentEmails = [...new Set(parsed.map((r) => r.parentEmail))];
  const parents = await prisma.user.findMany({
    where: {
      email: { in: parentEmails },
      role: "parent",
      deletedAt: null,
      ...(auth.admin.role === "orgadmin" ? { orgId: auth.admin.orgId } : {}),
    },
    select: { id: true, email: true, orgId: true },
  });
  const parentByEmail = new Map(parents.map((p) => [p.email.toLowerCase(), p]));

  const loginEmails = parsed.map((r) => r.loginEmail).filter((e): e is string => !!e);
  // User.email is globally @unique, so an email used by ANY user (including a
  // soft-deleted one) is reserved. We intentionally do NOT filter deletedAt
  // here — doing so would make preview say "available" while commit still
  // throws on the unique index.
  const existingLogins = loginEmails.length
    ? await prisma.user.findMany({ where: { email: { in: loginEmails } }, select: { email: true } })
    : [];
  const takenLogins = new Set(existingLogins.map((u) => u.email.toLowerCase()));
  const seenLoginInFile = new Set<string>();

  const plans: RowPlan[] = [];
  for (const r of parsed) {
    const problems: string[] = [];
    const parent = parentByEmail.get(r.parentEmail);
    if (!parent) problems.push(`No parent with email "${r.parentEmail}" in your scope.`);

    if (r.loginEmail) {
      if (takenLogins.has(r.loginEmail)) problems.push(`Login email "${r.loginEmail}" already in use.`);
      if (seenLoginInFile.has(r.loginEmail)) problems.push(`Login email "${r.loginEmail}" duplicated in file.`);
      seenLoginInFile.add(r.loginEmail);
      if (r.loginPassword) {
        const strength = validatePasswordStrength(r.loginPassword);
        if (!strength.ok) problems.push(`Weak login password: ${strength.reason}`);
      }
    }

    plans.push({
      rowNumber: r.rowNumber,
      name: r.name,
      grade: r.grade!,
      parentEmail: r.parentEmail,
      difficulty: r.difficulty,
      withLogin: !!r.loginEmail,
      ok: problems.length === 0,
      problems,
    });
  }

  // Merge structural row errors (bad grade etc.) into the plan view.
  const structuralByRow = new Map<number, RowError[]>();
  for (const e of errors) {
    if (e.rowNumber === 0) continue;
    const list = structuralByRow.get(e.rowNumber) ?? [];
    list.push(e);
    structuralByRow.set(e.rowNumber, list);
  }
  const structuralRows: RowPlan[] = [...structuralByRow.entries()].map(([rowNumber, errs]) => ({
    rowNumber, name: "", grade: 0, parentEmail: "", difficulty: 0, withLogin: false,
    ok: false, problems: errs.map((e) => `${e.field}: ${e.message}`),
  }));

  const allPlans = [...plans, ...structuralRows].sort((a, b) => a.rowNumber - b.rowNumber);
  const validCount = allPlans.filter((p) => p.ok).length;
  const invalidCount = allPlans.length - validCount;

  if (mode === "preview") {
    return NextResponse.json({ mode: "preview", total: allPlans.length, validCount, invalidCount, rows: allPlans });
  }

  // COMMIT: insert each valid row. Invalid rows were surfaced in the preview
  // the admin approved and are skipped here.
  const validParsed = parsed.filter((r) => plans.find((p) => p.rowNumber === r.rowNumber)?.ok);

  // Hoist the per-grade topic-group lookup out of the loop — one query for the
  // whole import instead of one per row (was an N+1).
  const distinctGrades = [...new Set(validParsed.map((r) => r.grade!))];
  const groupsByGrade = new Map<number, { id: number }[]>();
  if (distinctGrades.length) {
    const allGroups = await prisma.topicGroup.findMany({
      where: { gradeLevel: { in: distinctGrades }, active: true },
      select: { id: true, gradeLevel: true },
    });
    for (const g of allGroups) {
      const list = groupsByGrade.get(g.gradeLevel) ?? [];
      list.push({ id: g.id });
      groupsByGrade.set(g.gradeLevel, list);
    }
  }

  let created = 0;
  const createdIds: number[] = [];
  // Each row is independent: a row that fails at insert time (e.g. a unique-
  // email race) is recorded and skipped, never aborting the batch — so the
  // audit log + response always reflect exactly what landed.
  const failures: { rowNumber: number; error: string }[] = [];
  for (const r of validParsed) {
    try {
      const parent = parentByEmail.get(r.parentEmail)!;
      const activeGroups = groupsByGrade.get(r.grade!) ?? [];

      let loginPasswordHash: string | null = null;
      if (r.loginEmail && r.loginPassword) loginPasswordHash = await hashPassword(r.loginPassword);

      const result = await prisma.$transaction(async (tx) => {
        let loginUserId: string | null = null;
        if (r.loginEmail && loginPasswordHash) {
          const u = await tx.user.create({
            data: {
              name: r.name,
              email: r.loginEmail,
              passwordHash: loginPasswordHash,
              role: "student",
              orgId: parent.orgId,
              emailVerified: new Date(),
            },
            select: { id: true },
          });
          loginUserId = u.id;
          await tx.notificationSettings.create({ data: { userId: u.id } });
        }
        const student = await tx.student.create({
          data: {
            name: r.name,
            grade: r.grade!,
            currentDifficulty: r.difficulty,
            tutorApproved: true,
            orgId: parent.orgId,
            parentId: parent.id,
            userId: loginUserId,
            topicSelections: { create: activeGroups.map((g) => ({ topicGroupId: g.id })) },
          },
          select: { id: true },
        });
        return { studentId: student.id, loginUserId };
      });

      created++;
      createdIds.push(result.studentId);
      if (result.loginUserId && r.loginEmail) {
        await notifyWelcome({
          userId: result.loginUserId,
          to: r.loginEmail,
          name: r.name,
          role: "student",
          loginNote: "An administrator created this account for you during a bulk import.",
        }).catch(() => {});
      }
    } catch (err) {
      failures.push({ rowNumber: r.rowNumber, error: err instanceof Error ? err.message : String(err) });
    }
  }

  await auditLog({
    actorId: auth.admin.userId,
    action: "create_student",
    targetType: "Student",
    targetId: createdIds.join(","),
    metadata: { bulkImport: true, created, skipped: invalidCount, failed: failures.length },
  });

  return NextResponse.json({ mode: "commit", created, skipped: invalidCount, failed: failures.length, failures });
}
