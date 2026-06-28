import { randomInt } from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/password";

// Parental profile-lock PIN. A 4-digit code the parent sets so a kid on a
// shared device can't switch profiles or slip into the parent app. Stored
// bcrypt-hashed (reusing the password helpers); emailed to the parent in clear.

export function generatePin(): string {
  return String(randomInt(0, 10000)).padStart(4, "0");
}

export function hashPin(pin: string): Promise<string> {
  return hashPassword(pin);
}

export function verifyPin(pin: string, hash: string): Promise<boolean> {
  return verifyPassword(pin, hash);
}

export function isValidPinShape(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
