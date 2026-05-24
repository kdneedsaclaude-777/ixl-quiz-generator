import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";

// Soft delete: stamp deletedAt, anonymise PII, leave audit-trail intact.
// Student.parentId is set to NULL automatically by the SetNull cascade so
// kids' practice history survives but is unlinked from this parent.
export async function POST(): Promise<Response> {
  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.parent.role === "superadmin") {
    return NextResponse.json({ error: "Superadmin accounts cannot self-delete here." }, { status: 400 });
  }

  const now = new Date();
  const placeholder = `deleted_${auth.parent.userId}@deleted.local`;

  await prisma.$transaction([
    prisma.student.updateMany({
      where: { parentId: auth.parent.userId },
      data: { parentId: null },
    }),
    prisma.user.update({
      where: { id: auth.parent.userId },
      data: {
        deletedAt: now,
        name: "Deleted User",
        email: placeholder,
        passwordHash: null,
        emailVerified: null,
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
