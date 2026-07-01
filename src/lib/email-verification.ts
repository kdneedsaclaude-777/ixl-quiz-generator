import { prisma } from "@/lib/db";
import { generateCode, verificationExpiry } from "@/lib/tokens";

// Email verification via a 6-digit code (replaces the old magic link).
//
// We reuse the existing VerificationToken table with NO migration. The stored
// `token` is a globally-unique composite `${code}:${identifier}` — the email
// is unique per user, so the 6-digit code the user types never has to be
// globally unique (avoids cross-user collisions on the unique `token` column).
// Verification recomputes the composite and looks it back up.

export function codeToken(identifier: string, code: string): string {
  return `${code}:${identifier}`;
}

// Issue a fresh code for an email, invalidating any earlier ones so only the
// most recent code works. Returns the plain 6-digit code to email.
export async function issueEmailCode(identifier: string): Promise<string> {
  const code = generateCode();
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: codeToken(identifier, code), expires: verificationExpiry() },
  });
  return code;
}

type ConsumeResult =
  | { ok: true; token: string }
  | { ok: false; reason: "invalid" | "expired" };

// Check a submitted (email, code) pair. Does NOT delete the token — the caller
// deletes it inside the same transaction that marks the user verified, so a
// failed verification can't consume the code.
export async function checkEmailCode(identifier: string, code: string): Promise<ConsumeResult> {
  const token = codeToken(identifier, code);
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return { ok: false, reason: "invalid" };
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return { ok: false, reason: "expired" };
  }
  return { ok: true, token };
}
