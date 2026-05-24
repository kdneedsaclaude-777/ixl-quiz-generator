import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export type PasswordValidationResult = { ok: true } | { ok: false; reason: string };

// Min 8 chars, ≥1 uppercase letter, ≥1 number. Spec from SECTION 1.
export function validatePasswordStrength(pw: string): PasswordValidationResult {
  if (pw.length < 8) return { ok: false, reason: "Password must be at least 8 characters." };
  if (!/[A-Z]/.test(pw)) return { ok: false, reason: "Password must contain an uppercase letter." };
  if (!/[0-9]/.test(pw)) return { ok: false, reason: "Password must contain a number." };
  return { ok: true };
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, SALT_ROUNDS);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}
