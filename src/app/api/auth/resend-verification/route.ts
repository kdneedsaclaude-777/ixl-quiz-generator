import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { issueEmailCode } from "@/lib/email-verification";
import { sendEmail, isRealEmailConfigured } from "@/lib/email";
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

  const code = await issueEmailCode(email);
  const { html, text } = renderEmail({
    preheader: "A fresh verification code, as requested.",
    heading: "Verify your email",
    body: "Here's a new 6-digit code to confirm this email on your QuizSpark account:",
    code,
    footnote: "The code expires in 24 hours. If you didn't ask for this, you can ignore the email.",
  });
  const { ok: emailSent, previewUrl } = await sendEmail({
    to: email,
    subject: `Your QuizSpark verification code: ${code}`,
    text,
    html,
  });
  if (!isRealEmailConfigured()) {
    return NextResponse.json({ ok: true, devCode: code, previewUrl });
  }
  return NextResponse.json({ ok: true, emailSent });
}
