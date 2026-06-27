import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";
import { generateClaimCode, hashClaimCode, claimExpiry, CLAIM_CODE_TTL_DAYS } from "@/lib/domain/claim-code";

// POST /api/parent/child/[id]/claim-code
// Generates (or regenerates) a one-time student claim code for the parent's
// child. Returns the plaintext ONCE — it's stored only as a hash. Regenerating
// overwrites any previous code (and resets its claimed/expiry state).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const childId = parseInt(id, 10);
  if (!Number.isFinite(childId)) return NextResponse.json({ error: "Invalid child id." }, { status: 400 });

  const child = await prisma.student.findUnique({
    where: { id: childId },
    select: { id: true, parentId: true, userId: true, name: true },
  });
  if (!child) return NextResponse.json({ error: "Child not found." }, { status: 404 });
  // Ownership: parent must own this child (superadmin may also act).
  if (child.parentId !== auth.parent.userId && auth.parent.role !== "superadmin") {
    return NextResponse.json({ error: "Child not found." }, { status: 404 });
  }
  if (child.userId) {
    return NextResponse.json({ error: "This child already has a linked student login." }, { status: 409 });
  }

  const code = generateClaimCode();
  const expiresAt = claimExpiry();
  await prisma.studentClaimCode.upsert({
    where: { studentId: childId },
    create: { studentId: childId, codeHash: hashClaimCode(code), expiresAt, claimedAt: null },
    update: { codeHash: hashClaimCode(code), expiresAt, claimedAt: null },
  });

  // Plaintext returned once; only the hash is stored.
  return NextResponse.json({ ok: true, code, expiresAt, ttlDays: CLAIM_CODE_TTL_DAYS, childName: child.name });
}
