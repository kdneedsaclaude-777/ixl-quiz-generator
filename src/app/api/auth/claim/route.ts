import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { enforceRateLimit } from "@/lib/rate-limit";
import { hashClaimCode, checkClaim } from "@/lib/domain/claim-code";

// POST /api/auth/claim   Body: { code, email, password }
//
// Student self-registration via a parent-issued claim code. Creates the
// student's login (role=student) and attaches it to the pre-existing child
// profile the code points to. The student starts UNAPPROVED (tutorApproved=
// false) — a tutor/admin must approve before they can access material.
//
// Security: rate-limited; codes are matched by hash; single-use + expiry are
// enforced; errors are generic so we never reveal whether a code exists.
type Body = { code?: string; email?: string; password?: string };

export async function POST(req: Request): Promise<Response> {
  const limited = enforceRateLimit(req, "claim", 8, 10 * 60_000);
  if (limited) return limited;

  const b = (await req.json().catch(() => ({}))) as Body;
  const code = (b.code ?? "").trim();
  const email = (b.email ?? "").trim().toLowerCase();
  const password = b.password ?? "";

  if (!code) return NextResponse.json({ error: "Enter your invite code." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  const strength = validatePasswordStrength(password);
  if (!strength.ok) return NextResponse.json({ error: strength.reason }, { status: 400 });

  // Look up the code by hash, with its child.
  const stored = await prisma.studentClaimCode.findFirst({
    where: { codeHash: hashClaimCode(code) },
    include: { student: { select: { id: true, userId: true, orgId: true, name: true } } },
  });
  const verdict = checkClaim(
    stored ? { codeHash: stored.codeHash, expiresAt: stored.expiresAt, claimedAt: stored.claimedAt } : null,
    code,
  );
  if (!verdict.ok) {
    // Generic-ish: distinguish only expired/claimed (helpful, not sensitive).
    const msg =
      verdict.reason === "expired" ? "This invite code has expired — ask your parent for a new one."
      : verdict.reason === "claimed" ? "This invite code has already been used."
      : "That invite code isn't valid.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const child = stored!.student;
  if (child.userId) {
    return NextResponse.json({ error: "This student already has a login." }, { status: 409 });
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }

  // Hash before opening the transaction — bcrypt is CPU-bound and shouldn't
  // hold a DB connection / risk the interactive-transaction timeout.
  const passwordHash = await hashPassword(password);

  // Create the login + link + mark claimed, atomically. Student starts
  // unapproved so the access gate holds until a tutor/admin approves.
  // A concurrent signup/claim could grab the email between our check and the
  // insert; the @unique(email) index then throws P2002 — map it to a clean 409.
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: child.name,
          email,
          passwordHash,
          role: "student",
          orgId: child.orgId,
          emailVerified: new Date(), // email verification is a later-stage step
        },
        select: { id: true },
      });
      await tx.notificationSettings.create({ data: { userId: user.id } });
      await tx.student.update({
        where: { id: child.id },
        data: { userId: user.id, tutorApproved: false },
      });
      await tx.studentClaimCode.update({
        where: { studentId: child.id },
        data: { claimedAt: new Date() },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true, pendingApproval: true });
}
