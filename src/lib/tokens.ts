import { randomBytes, randomInt } from "node:crypto";

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

// A 6-digit numeric verification code (100000–999999), uniform + crypto-random,
// no leading zero so it's always exactly 6 digits when typed. Used for email
// verification codes (replaces the old magic-link tokens).
export function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

const HOUR = 60 * 60 * 1000;

export function verificationExpiry(): Date {
  return new Date(Date.now() + 24 * HOUR);
}

export function passwordResetExpiry(): Date {
  return new Date(Date.now() + 1 * HOUR);
}

// Staff invites (admin-created tutor/admin accounts) get a longer window than a
// self-service reset — they may not check email right away.
export function inviteExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * HOUR);
}
