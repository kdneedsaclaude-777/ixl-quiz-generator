import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { hashPassword } from "@/lib/password";
import { auditLog } from "@/lib/audit";
import { generateToken, inviteExpiry } from "@/lib/tokens";
import { sendEmail, buildAppUrl } from "@/lib/email";
import { renderEmail } from "@/lib/emailTemplate";

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

  // Placeholder hash so the account is never login-able with a guessable value;
  // the real password is chosen by the employee via the emailed invite below.
  const placeholder = crypto.randomBytes(18).toString("base64url");
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(placeholder),
      role,
      orgId: auth.admin.orgId,
      phone: b.mobilePhone?.trim() || null,
      emailVerified: new Date(),
    },
    select: { id: true, email: true, name: true, role: true },
  });
  await prisma.notificationSettings
    .create({ data: { userId: user.id } })
    .catch((e) => console.error("[employees] notificationSettings create failed", e));

  // Staff set their OWN password via an emailed invite link — the admin never
  // sees or sets it (no shared secret to leak). Reuses the password-reset token
  // flow with a longer, invite-length expiry.
  const inviteToken = generateToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, token: inviteToken, expiresAt: inviteExpiry() },
  });
  const setupLink = buildAppUrl(`/auth/reset-password?token=${inviteToken}`);
  const firstName = name.split(" ")[0] || name;
  const roleLabel = role === "orgadmin" ? "an administrator" : "a tutor";
  const { html, text } = renderEmail({
    preheader: "Set your password to activate your QuizSpark account.",
    heading: `Welcome to QuizSpark, ${firstName}`,
    body: `You've been added as ${roleLabel} on QuizSpark. Choose a password to activate your account, then sign in with this email address.`,
    cta: { label: "Set your password", url: setupLink },
    footnote: "This link expires in 7 days. If you weren't expecting this, you can safely ignore this email.",
  });
  const { ok: inviteSent } = await sendEmail({
    to: user.email,
    subject: "Set up your QuizSpark account",
    text,
    html,
  });

  await auditLog({
    actorId: auth.admin.userId,
    action: "create_user",
    targetType: "User",
    targetId: user.id,
    metadata: { role, via: "new_employee_form", email: user.email, inviteSent },
  });

  return NextResponse.json({ ok: true, userId: user.id, email: user.email, inviteSent });
}
