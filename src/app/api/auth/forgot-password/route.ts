import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken, passwordResetExpiry } from "@/lib/tokens";
import { sendEmail, buildAppUrl } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";

type Body = { email?: string };

export async function POST(req: Request): Promise<Response> {
  const limited = enforceRateLimit(req, "forgot-password", 5, 10 * 60_000);
  if (limited) return limited;
  const body = (await req.json().catch(() => ({}))) as Body;
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: true }); // never disclose

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) return NextResponse.json({ ok: true });

  // Invalidate any outstanding tokens so only the newest one works.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = generateToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt: passwordResetExpiry() },
  });
  const link = buildAppUrl(`/auth/reset-password?token=${token}`);
  await sendEmail({
    to: email,
    subject: "Reset your IXL Quiz password",
    text: `Click to reset your password (expires in 1 hour): ${link}`,
    html: `<p>Click to reset your password (expires in 1 hour):</p><p><a href="${link}">${link}</a></p>`,
  });
  return NextResponse.json({ ok: true });
}
