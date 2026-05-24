import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { auditLog } from "@/lib/audit";
import { notifyWelcome } from "@/lib/notifications";

type Body = {
  name?: string;
  email?: string;
  password?: string;
  role?: "parent" | "tutor" | "orgadmin" | "superadmin";
};

// What roles each kind of admin is allowed to create.
const ALLOWED: Record<"orgadmin" | "superadmin", Body["role"][]> = {
  orgadmin: ["parent", "tutor"],
  superadmin: ["parent", "tutor", "orgadmin", "superadmin"],
};

// Admin-provisioned user creation. Auto-verifies the email (the admin
// vouches for it) so the user can log in immediately with the password the
// admin sets.
export async function POST(req: Request): Promise<Response> {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as Body;
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const role = body.role;

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (!role || !ALLOWED[auth.admin.role].includes(role)) {
    return NextResponse.json({ error: "Role not allowed for your account." }, { status: 403 });
  }
  const strength = validatePasswordStrength(password);
  if (!strength.ok) return NextResponse.json({ error: strength.reason }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already exists." }, { status: 409 });

  // Org assignment: superadmin row → no org; everything else → admin's org.
  // (Superadmins creating cross-org users isn't a UI option today; if you
  // need that, send `orgId` in the body and gate it here.)
  const orgId = role === "superadmin" ? null : auth.admin.orgId;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      orgId,
      emailVerified: new Date(), // admin-vouched, ready to log in
    },
    select: { id: true, email: true, name: true, role: true },
  });
  // Notification settings row so the user appears in digest/alert queries.
  // Logged on failure (don't silently swallow — a missing settings row means
  // the user is invisible to digest/inactivity emails).
  await prisma.notificationSettings
    .create({ data: { userId: user.id } })
    .catch((err) =>
      console.error("[admin/users] notification settings create failed for", user.id, err),
    );

  await auditLog({
    actorId: auth.admin.userId,
    action: "create_user",
    targetType: "User",
    targetId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  // Welcome email — admin set the password so we frame it that way and don't
  // include any verification link (admin-provisioned accounts are pre-verified).
  await notifyWelcome({
    userId: user.id,
    to: user.email,
    name: user.name,
    role: user.role,
    loginNote: "An administrator created this account for you. Your password was set during provisioning — ask them if you need it.",
  });

  return NextResponse.json({ ok: true, user });
}

