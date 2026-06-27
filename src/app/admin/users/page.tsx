import { requireAdminSession, adminScope } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import UsersTable, { type UserRow } from "./UsersTable";

export const metadata = { title: "User management" };

const PAGE_SIZE = 10;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string; verified?: string; role?: string }>;
}) {
  const admin = await requireAdminSession();
  const { page: pageRaw, q, status, verified, role: roleRaw } = await searchParams;
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  // Role filter defaults to "parent" to preserve the old default view. Pass
  // ?role=student | tutor | orgadmin | superadmin | all to switch.
  const validRoles = new Set(["parent", "tutor", "student", "orgadmin", "superadmin"]);
  const role = roleRaw && (validRoles.has(roleRaw) || roleRaw === "all") ? roleRaw : "parent";
  // Org-admins only see users within their org; superadmin sees all.
  const where: Prisma.UserWhereInput = { ...adminScope(admin) };
  if (role !== "all") where.role = role;
  if (q && q.trim()) {
    where.OR = [
      { email: { contains: q.trim() } },
      { name: { contains: q.trim() } },
    ];
  }
  if (status === "active") {
    where.suspendedAt = null;
    where.deletedAt = null;
  } else if (status === "suspended") {
    where.suspendedAt = { not: null };
    where.deletedAt = null;
  } else if (status === "deleted") {
    where.deletedAt = { not: null };
  }
  if (verified === "yes") where.emailVerified = { not: null };
  else if (verified === "no") where.emailVerified = null;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        suspendedAt: true,
        deletedAt: true,
        lastLoginAt: true,
        _count: { select: { students: true } },
      },
    }),
  ]);

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    verified: Boolean(u.emailVerified),
    status: u.deletedAt ? "deleted" : u.suspendedAt ? "suspended" : "active",
    childrenCount: u._count.students,
    lastLogin: u.lastLoginAt?.toISOString() ?? null,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="space-y-6 text-[color:var(--shell-text)]">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-[color:var(--shell-muted)]">PEOPLE</div>
          <h1 className="font-display mt-1 text-4xl leading-none text-white">User management</h1>
          <p className="mt-1.5 text-sm text-[color:var(--shell-muted)]">
            {total} parent account{total === 1 ? "" : "s"}.
          </p>
        </div>
        <a href="/admin/users/new" className="rounded-full bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4F46E5]">
          + New employee
        </a>
      </header>
      <UsersTable
        rows={rows}
        page={page}
        totalPages={totalPages}
        query={q ?? ""}
        status={status ?? "all"}
        verified={verified ?? "all"}
        role={role}
        isSuperadmin={admin.role === "superadmin"}
      />
    </main>
  );
}
