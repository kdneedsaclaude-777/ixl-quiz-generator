import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyWelcome } from "@/lib/notifications";
import { checkEmailCode } from "@/lib/email-verification";

type Body = { email?: string; code?: string; token?: string };

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as Body;
  const email = body.email?.trim().toLowerCase();
  const code = body.code?.toString().replace(/\s+/g, "");
  const legacyToken = body.token?.toString();

  // Resolve the verification token from either the new (email + 6-digit code)
  // path or a legacy magic-link token (already-sent links / change-email flow).
  let token: string;
  if (email && code) {
    const res = await checkEmailCode(email, code);
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            res.reason === "expired"
              ? "That code has expired. Request a new one."
              : "That code isn't right. Check it and try again.",
        },
        { status: 400 },
      );
    }
    token = res.token;
  } else if (legacyToken) {
    const record = await prisma.verificationToken.findUnique({ where: { token: legacyToken } });
    if (!record) return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token: legacyToken } }).catch(() => {});
      return NextResponse.json({ error: "Token expired. Request a new verification email." }, { status: 400 });
    }
    token = legacyToken;
  } else {
    return NextResponse.json({ error: "Enter your email and the 6-digit code." }, { status: 400 });
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });

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
