import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { generateToken, verificationExpiry } from "@/lib/tokens";
import { sendEmail, buildAppUrl, isRealEmailConfigured } from "@/lib/email";
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
  // default — production keeps the real verification gate.
  const publicTestMode = process.env.PUBLIC_TEST_MODE === "true";

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

  const token = generateToken();
  await prisma.verificationToken.create({
    data: { identifier: user.email!, token, expires: verificationExpiry() },
  });
  const link = buildAppUrl(`/auth/verify-email?token=${token}`);
  const { previewUrl } = await sendEmail({
    to: user.email!,
    subject: "Verify your IXL Quiz email",
    text: `Hi ${user.name},\n\nClick the link below to verify your email:\n${link}\n\nLink expires in 24 hours.`,
    html: `<p>Hi ${user.name},</p><p>Click the link below to verify your email:</p><p><a href="${link}">${link}</a></p><p>Link expires in 24 hours.</p>`,
  });

  // In dev/demo there is no real inbox (Ethereal), so digging the link out of
  // the server console is painful. When real SMTP is NOT configured, return
  // the verification link (and Ethereal preview) so the UI can show a
  // one-click button. Strictly gated: with real SMTP this is never exposed.
  if (!isRealEmailConfigured()) {
    return NextResponse.json({ ok: true, devVerifyUrl: link, previewUrl });
  }
  return NextResponse.json({ ok: true });
}
