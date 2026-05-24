import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(req: Request) {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids");
  const where = idsParam
    ? { id: { in: idsParam.split(",").filter(Boolean) } }
    : { role: "parent" };

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      suspendedAt: true,
      deletedAt: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { students: true } },
    },
  });
  const headers = [
    "id",
    "email",
    "name",
    "verified",
    "status",
    "children",
    "last_login",
    "created_at",
  ];
  const rows = users.map((u) => [
    u.id,
    u.email,
    u.name,
    u.emailVerified ? "yes" : "no",
    u.deletedAt ? "deleted" : u.suspendedAt ? "suspended" : "active",
    u._count.students,
    u.lastLoginAt?.toISOString() ?? "",
    u.createdAt.toISOString(),
  ]);
  return csvResponse(`users-${Date.now()}.csv`, toCsv(headers, rows));
}
