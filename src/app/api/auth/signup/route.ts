import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { issueEmailCode } from "@/lib/email-verification";
import { sendEmail, isRealEmailConfigured } from "@/lib/email";
import { renderEmail } from "@/lib/emailTemplate";
import { enforceRateLimit } from "@/lib/rate-limit";

type Body = { name?: string; email?: string; password?: string };

export async function POST(req: Request): Promise<Response> {
  const limited = enforceRateLimit(req, "signup", 5, 10 * 60_000);
  if (limited) return limited;
  const body = (await req.json().catch(() => ({}))) as Body;
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!name || name.length < 1) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  const strength = validatePasswordStrength(password);
  if (!strength.ok) {
    return NextResponse.json({ error: strength.reason }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Don't reveal whether the email exists; reply with the same shape but
    // log the collision so an admin can debug.
    console.warn(`[signup] email already exists: ${email}`);
    return NextResponse.json({ ok: true });
  }

  // Public-test/demo mode: provision accounts fully verified so anyone can
  // sign up and use the app immediately with no email round-trip. Off by
  // default, and hard-disabled in production so a stray env var can never
  // skip email verification on the live app.
  const publicTestMode =
    process.env.PUBLIC_TEST_MODE === "true" && process.env.NODE_ENV !== "production";

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "parent",
      emailVerified: publicTestMode ? new Date() : null,
    },
    select: { id: true, email: true, name: true },
  });
  await prisma.notificationSettings.create({ data: { userId: user.id } });

  if (publicTestMode) {
    // No token, no email — the account is ready to log in right now.
    return NextResponse.json({ ok: true, autoVerified: true });
  }

  const code = await issueEmailCode(user.email!);
  const { html, text } = renderEmail({
    preheader: "Your QuizSpark verification code.",
    heading: `Verify your email, ${user.name}`,
    body: "Enter this 6-digit code in QuizSpark to confirm your email and activate your account:",
    code,
    footnote: "The code expires in 24 hours. If you didn't sign up, you can safely ignore this email.",
  });
  const { ok: emailSent, previewUrl } = await sendEmail({
    to: user.email!,
    subject: `Your QuizSpark verification code: ${code}`,
    text,
    html,
  });

  // In dev/demo there is no real inbox (Ethereal), so return the code directly
  // (and any Ethereal preview) so the tester can proceed without a real send.
  // Strictly gated: once real email (SMTP/Resend) is configured, the code is
  // never exposed in the API response.
  if (!isRealEmailConfigured()) {
    return NextResponse.json({ ok: true, email: user.email, devCode: code, previewUrl });
  }
  // Real email is configured — tell the UI whether the send actually succeeded
  // so it can prompt "resend / check spam" instead of silently claiming success.
  return NextResponse.json({ ok: true, email: user.email, emailSent });
}
