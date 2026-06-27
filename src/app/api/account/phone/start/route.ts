import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  sendSms,
  generateSmsCode,
  isRealSmsConfigured,
  normalizePhone,
} from "@/lib/sms";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const CODE_TTL_MIN = 5;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Begin verification: generate a 6-digit code, store it, send via SMS. The
// pending phone lives in PhoneVerification — User.phone is only set on
// successful verify.
export async function POST(req: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Not authenticated." }, 401);

  const limited = enforceRateLimit(req, "phone-start", 5, 10 * 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => ({}))) as { phone?: string };
  const phone = normalizePhone(body.phone ?? "");
  if (!phone) {
    return json({ error: "Enter a valid phone number with country code." }, 400);
  }

  const code = generateSmsCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60_000);

  await prisma.phoneVerification.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, phone, code, expiresAt },
    update: { phone, code, expiresAt, attempts: 0 },
  });

  await sendSms({
    to: phone,
    body: `Your QuizSpark verification code is ${code}. It expires in ${CODE_TTL_MIN} minutes.`,
  });

  // Dev only: hand the code back so the UI can autofill / display it.
  // Production (real Twilio configured) never exposes the code.
  if (!isRealSmsConfigured()) {
    return json({ ok: true, devCode: code });
  }
  return json({ ok: true });
}
