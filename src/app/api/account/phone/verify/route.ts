import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Consume the SMS code. On success, the pending phone is promoted to
// User.phone + phoneVerified=now. On too many failed attempts, the pending
// row is wiped — the user must start over.
export async function POST(req: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Not authenticated." }, 401);

  // Cheap brute-force defence on top of the per-row attempt cap.
  const limited = enforceRateLimit(req, "phone-verify", 10, 10 * 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const code = (body.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return json({ error: "Enter the 6-digit code." }, 400);
  }

  const pending = await prisma.phoneVerification.findUnique({
    where: { userId: session.user.id },
  });
  if (!pending) {
    return json({ error: "No verification in progress. Request a new code." }, 400);
  }
  if (pending.expiresAt.getTime() < Date.now()) {
    await prisma.phoneVerification.delete({ where: { userId: session.user.id } });
    return json({ error: "Code expired. Request a new one." }, 400);
  }

  if (pending.code !== code) {
    const attempts = pending.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await prisma.phoneVerification.delete({ where: { userId: session.user.id } });
      return json(
        { error: "Too many wrong codes — start over and request a new one." },
        400,
      );
    }
    await prisma.phoneVerification.update({
      where: { userId: session.user.id },
      data: { attempts },
    });
    return json({ error: "Incorrect code. Try again." }, 400);
  }

  // Success — promote the pending phone and clear the verification row in
  // one transaction so a crash can't leave them in a half-verified state.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { phone: pending.phone, phoneVerified: new Date() },
    }),
    prisma.phoneVerification.delete({ where: { userId: session.user.id } }),
  ]);

  return json({ ok: true, phone: pending.phone });
}
