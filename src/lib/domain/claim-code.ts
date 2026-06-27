import crypto from "crypto";

// Pure helpers for student claim codes. No DB access — callers persist the
// hash + expiry and compare on redeem.
//
// Security properties:
//  - High entropy: 8 chars from a 32-symbol alphabet ≈ 40 bits, formatted as
//    XXXX-XXXX for legibility. Plenty against an online, rate-limited guess.
//  - Only the SHA-256 hash is stored; the plaintext is shown to the parent
//    once and never persisted.
//  - Single-use + time-limited are enforced by the caller via claimedAt /
//    expiresAt; helpers here just generate, hash, and time-check.

// Crockford-ish base32 (no I/O/0/1 to avoid visual ambiguity).
const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
const CODE_LEN = 8;

export const CLAIM_CODE_TTL_DAYS = 14;

// Generates a formatted plaintext code like "K7QP-3MXR".
export function generateClaimCode(): string {
  const bytes = crypto.randomBytes(CODE_LEN);
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
    if (i === 3) out += "-";
  }
  return out;
}

// Normalizes user input (uppercase, strip spaces; keep the dash optional) so
// "k7qp3mxr", "K7QP-3MXR", and " k7qp 3mxr " all hash identically.
export function normalizeClaimCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== CODE_LEN) return cleaned; // caller will reject on mismatch
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

export function hashClaimCode(code: string): string {
  return crypto.createHash("sha256").update(normalizeClaimCode(code)).digest("hex");
}

export function claimExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + CLAIM_CODE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export type ClaimState = { codeHash: string; expiresAt: Date; claimedAt: Date | null };

// Decides whether a stored code can be redeemed by the supplied plaintext.
// Returns a discriminated result so the route can map to a generic message.
export function checkClaim(
  stored: ClaimState | null,
  suppliedCode: string,
  now: Date = new Date(),
): { ok: true } | { ok: false; reason: "invalid" | "expired" | "claimed" } {
  if (!stored) return { ok: false, reason: "invalid" };
  if (stored.codeHash !== hashClaimCode(suppliedCode)) return { ok: false, reason: "invalid" };
  if (stored.claimedAt) return { ok: false, reason: "claimed" };
  if (stored.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "expired" };
  return { ok: true };
}
