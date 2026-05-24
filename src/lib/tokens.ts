import { randomBytes } from "node:crypto";

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

const HOUR = 60 * 60 * 1000;

export function verificationExpiry(): Date {
  return new Date(Date.now() + 24 * HOUR);
}

export function passwordResetExpiry(): Date {
  return new Date(Date.now() + 1 * HOUR);
}
