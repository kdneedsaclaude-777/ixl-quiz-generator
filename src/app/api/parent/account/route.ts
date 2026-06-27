import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/password";
import { generateToken, verificationExpiry } from "@/lib/tokens";
import { sendEmail, buildAppUrl } from "@/lib/email";
import { renderEmail } from "@/lib/emailTemplate";
import { notifyPasswordChanged, notifyEmailChanged } from "@/lib/notifications";

type Body = {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};

export async function PATCH(req: Request): Promise<Response> {
  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as Body;
  const user = await prisma.user.findUnique({ where: { id: auth.parent.userId } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  // Branch 1: password change (currentPassword + newPassword present).
  if (body.currentPassword !== undefined || body.newPassword !== undefined) {
    if (!body.currentPassword || !body.newPassword || !user.passwordHash) {
      return NextResponse.json({ error: "Provide both current and new password." }, { status: 400 });
    }
    const ok = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    const strength = validatePasswordStrength(body.newPassword);
    if (!strength.ok) return NextResponse.json({ error: strength.reason }, { status: 400 });
    const hash = await hashPassword(body.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    // Security notice — fires even though the user did it themselves so they
    // get a second-channel signal if their session was stolen.
    await notifyPasswordChanged({ to: user.email, name: user.name });
    return NextResponse.json({ ok: true });
  }

  // Branch 2: profile (name + email). Empty body is a no-op.
  const newName = body.name?.trim();
  const newEmail = body.email?.trim().toLowerCase();
  if (!newName && !newEmail) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  if (newName !== undefined && newName.length === 0) {
    return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
  }
  if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  let emailReverificationSent = false;
  if (newEmail && newEmail !== user.email.toLowerCase()) {
    const taken = await prisma.user.findFirst({ where: { email: newEmail, NOT: { id: user.id } } });
    if (taken) {
      // Don't disclose; behave as if changed but skip re-verification.
      console.warn(`[account] email already in use: ${newEmail}`);
    } else {
      // Issue verification for the new address.
      const token = generateToken();
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { email: newEmail, emailVerified: null, name: newName ?? user.name },
        }),
        prisma.verificationToken.create({
          data: { identifier: newEmail, token, expires: verificationExpiry() },
        }),
      ]);
      const link = buildAppUrl(`/auth/verify-email?token=${token}`);
      const { html, text } = renderEmail({
        preheader: "Confirm your new login email on QuizSpark.",
        heading: "Verify your new email",
        body: `You asked to change your QuizSpark login email to ${newEmail}. Tap below to confirm this address.`,
        cta: { label: "Verify new email", url: link },
        footnote: "If you didn't ask for this change, ignore this email — the address won't switch until you verify.",
      });
      await sendEmail({
        to: newEmail,
        subject: "Verify your new email",
        text,
        html,
      });
      // Heads-up to the OLD address — only the original owner can read it,
      // so a thief who changed the email can't suppress this alert.
      await notifyEmailChanged({
        oldEmail: user.email,
        newEmail,
        name: newName ?? user.name,
      });
      emailReverificationSent = true;
      return NextResponse.json({ ok: true, emailReverificationSent });
    }
  }

  // Name-only update path.
  if (newName) {
    await prisma.user.update({ where: { id: user.id }, data: { name: newName } });
  }
  return NextResponse.json({ ok: true, emailReverificationSent });
}
