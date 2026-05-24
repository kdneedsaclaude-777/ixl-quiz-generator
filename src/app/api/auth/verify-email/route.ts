import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyWelcome } from "@/lib/notifications";

type Body = { token?: string };

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as Body;
  const token = body.token?.toString() ?? "";
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return NextResponse.json({ error: "Token expired. Request a new verification email." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: record.identifier } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 400 });

  // First-verify only — re-verification (email change) won't fire welcome
  // again because notifyWelcome uses refKey="once" and NotificationLog has
  // a unique (userId, type, refKey).
  const isFirstVerify = !user.emailVerified;

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  if (isFirstVerify) {
    await notifyWelcome({
      userId: user.id,
      to: user.email,
      name: user.name,
      role: user.role,
    });
  }

  return NextResponse.json({ ok: true, email: user.email });
}
