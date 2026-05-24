import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type AdminSession = {
  userId: string;
  email: string;
  name: string;
  // 'superadmin' sees every org; 'orgadmin' is scoped to its own org.
  role: "superadmin" | "orgadmin";
  orgId: string | null;
};

// Returns a Prisma `where` fragment that scopes a query to the admin's
// visibility. Superadmin → {} (everything); org-admin → { orgId }.
export function adminScope(admin: AdminSession): { orgId?: string } {
  if (admin.role === "superadmin") return {};
  return { orgId: admin.orgId ?? "__none__" };
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, orgId: true, deletedAt: true, suspendedAt: true },
  });
  if (!user || user.deletedAt || user.suspendedAt) redirect("/auth/login");
  if (user.role !== "superadmin" && user.role !== "orgadmin") redirect("/parent/dashboard");

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "superadmin" | "orgadmin",
    orgId: user.orgId,
  };
}

export async function getAdminForApi(): Promise<
  | { ok: true; admin: AdminSession }
  | { ok: false; status: number; error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false, status: 401, error: "Not authenticated." };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, orgId: true, deletedAt: true, suspendedAt: true },
  });
  if (!user || user.deletedAt) return { ok: false, status: 401, error: "Account unavailable." };
  if (user.suspendedAt) return { ok: false, status: 403, error: "Account suspended." };
  if (user.role !== "superadmin" && user.role !== "orgadmin") {
    return { ok: false, status: 403, error: "Admin only." };
  }
  return {
    ok: true,
    admin: {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "superadmin" | "orgadmin",
      orgId: user.orgId,
    },
  };
}
