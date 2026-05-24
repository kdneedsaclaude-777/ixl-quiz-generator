import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken, verificationExpiry } from "@/lib/tokens";
import { sendEmail, buildAppUrl } from "@/lib/email";
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
  await sendEmail({
    to: email,
    subject: "Verify your IXL Quiz email",
    text: `Click to verify your email: ${link}`,
    html: `<p>Click to verify your email:</p><p><a href="${link}">${link}</a></p>`,
  });
  return NextResponse.json({ ok: true });
}
