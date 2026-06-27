import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken, verificationExpiry } from "@/lib/tokens";
import { sendEmail, buildAppUrl } from "@/lib/email";
import { renderEmail } from "@/lib/emailTemplate";
import { enforceRateLimit } from "@/lib/rate-limit";

type Body = { email?: string };

// Soft rate limit: refuse if the most recent token was issued less than 60s ago.
const MIN_RESEND_INTERVAL_MS = 60 * 1000;

export async function POST(req: Request): Promise<Response> {
  const limited = enforceRateLimit(req, "resend-verification", 5, 10 * 60_000);
  if (limited) return limited;
  const body = (await req.json().catch(() => ({}))) as Body;
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  // Always reply ok to avoid email enumeration.
  if (!user || user.emailVerified || user.deletedAt) return NextResponse.json({ ok: true });

  const recent = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: "desc" },
  });
  if (recent) {
    const issuedAt = new Date(recent.expires.getTime() - 24 * 60 * 60 * 1000);
    if (Date.now() - issuedAt.getTime() < MIN_RESEND_INTERVAL_MS) {
      return NextResponse.json({ ok: true, throttled: true });
    }
  }

  const token = generateToken();
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires: verificationExpiry() },
  });
  const link = buildAppUrl(`/auth/verify-email?token=${token}`);
  const { html, text } = renderEmail({
    preheader: "A fresh verification link, as requested.",
    heading: "Verify your email",
    body: "Here's a new link to confirm this email on your QuizSpark account.",
    cta: { label: "Verify email", url: link },
    footnote: "The link expires in 24 hours. If you didn't ask for this, you can ignore the email.",
  });
  await sendEmail({
    to: email,
    subject: "Verify your QuizSpark email",
    text,
    html,
  });
  return NextResponse.json({ ok: true });
}
