import crypto from "crypto";
import { cookies } from "next/headers";

// Internal ops-console gate. Access requires knowing a secret code whose bcrypt
// hash lives in OWNER_GATE_HASH (the plaintext is never stored anywhere). On a
// correct code we mint a short-lived, HMAC-signed, HttpOnly cookie — it can't be
// forged without NEXTAUTH_SECRET, and it's independent of the normal role system
// (a super-admin without the code cannot get in). Everything fails closed.

export const OPS_COOKIE = "cm_ops";
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function secret(): string {
  return process.env.NEXTAUTH_SECRET ?? "";
}

// True only when both the gate hash and the signing secret are configured.
export function opsGateConfigured(): boolean {
  return Boolean(process.env.OWNER_GATE_HASH) && secret().length > 0;
}

function sign(payloadB64: string): string {
  return crypto.createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

export function issueOpsToken(): string {
  const body = Buffer.from(JSON.stringify({ ops: true, exp: Date.now() + TTL_MS })).toString("base64url");
  return `${body}.${sign(body)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token || !secret()) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(body);
  // Constant-time compare; timingSafeEqual throws on length mismatch.
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as { ops?: boolean; exp?: number };
    return payload.ops === true && typeof payload.exp === "number" && Date.now() < payload.exp;
  } catch {
    return false;
  }
}

// Verify a submitted code against the stored hash. The stored value is the
// SHA-256 hex of the code — fine here because the code itself is high-entropy
// (~120 bits), so a fast hash is not a weakness, and hex avoids .env expansion
// issues. Constant-time compare. Fails closed when unset.
export async function checkOpsCode(code: string): Promise<boolean> {
  const stored = (process.env.OWNER_GATE_HASH ?? "").trim().toLowerCase();
  if (!stored || !code) return false;
  const got = crypto.createHash("sha256").update(code.trim()).digest("hex");
  const a = Buffer.from(got);
  const b = Buffer.from(stored);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Server-side check used by the console page + its APIs.
export async function isOpsUnlocked(): Promise<boolean> {
  const c = (await cookies()).get(OPS_COOKIE)?.value;
  return verifyToken(c);
}
