import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { hashPassword } from "@/lib/password";
import { auditLog } from "@/lib/audit";

// Creates an employee = a User with role tutor (Teacher) or orgadmin
// (Administrator). Core identity fields persist; HR/scheduling fields
// (availability, wages, calendar) are accepted but wired in a later stage.
// Org-admins can only create within their own org and can't mint org-admins.
type Body = {
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeType?: string; // "Teacher" | "Administrator"
  mobilePhone?: string;
};

export async function POST(req: Request): Promise<Response> {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const b = (await req.json().catch(() => ({}))) as Body;
  const name = `${(b.firstName ?? "").trim()} ${(b.lastName ?? "").trim()}`.trim();
  const email = (b.email ?? "").trim().toLowerCase();
  const role = b.employeeType === "Administrator" ? "orgadmin" : "tutor";

  if (!name) return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  // Org-admins may add teachers only, not other admins.
  if (auth.admin.role === "orgadmin" && role !== "tutor") {
    return NextResponse.json({ error: "Org admins can only add teachers." }, { status: 403 });
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "Email already exists." }, { status: 409 });
  }

  const tempPassword = crypto.randomBytes(18).toString("base64url");
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(tempPassword),
      role,
      orgId: auth.admin.orgId,
      phone: b.mobilePhone?.trim() || null,
      emailVerified: new Date(),
    },
    select: { id: true, email: true, role: true },
  });
  await prisma.notificationSettings
    .create({ data: { userId: user.id } })
    .catch((e) => console.error("[employees] notificationSettings create failed", e));

  await auditLog({
    actorId: auth.admin.userId,
    action: "create_user",
    targetType: "User",
    targetId: user.id,
    metadata: { role, via: "new_employee_form", email: user.email },
  });

  return NextResponse.json({ ok: true, userId: user.id });
}
