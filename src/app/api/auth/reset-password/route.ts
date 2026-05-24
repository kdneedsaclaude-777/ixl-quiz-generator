import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { enforceRateLimit } from "@/lib/rate-limit";

type Body = { token?: string; password?: string };

export async function POST(req: Request): Promise<Response> {
  const limited = enforceRateLimit(req, "reset-password", 10, 10 * 60_000);
  if (limited) return limited;
  const body = (await req.json().catch(() => ({}))) as Body;
  const token = body.token?.toString() ?? "";
  const password = body.password ?? "";
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });
  const strength = validatePasswordStrength(password);
  if (!strength.ok) return NextResponse.json({ error: strength.reason }, { status: 400 });

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return NextResponse.json({ error: "Invalid or expired link." }, { status: 400 });
  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {});
    return NextResponse.json({ error: "Reset link expired. Request a new one." }, { status: 400 });
  }

  const hash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: hash } }),
    prisma.passwordResetToken.delete({ where: { token } }),
  ]);
  return NextResponse.json({ ok: true });
}
