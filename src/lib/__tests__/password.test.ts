import { describe, it, expect } from "vitest";
import { validatePasswordStrength, hashPassword, verifyPassword } from "@/lib/password";

describe("validatePasswordStrength", () => {
  it("accepts a strong password", () => {
    expect(validatePasswordStrength("Strong1Pass")).toEqual({ ok: true });
  });

  it("rejects short passwords", () => {
    const r = validatePasswordStrength("Short1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/8 characters/);
  });

  it("requires an uppercase letter", () => {
    const r = validatePasswordStrength("alllower1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/uppercase/);
  });

  it("requires a number", () => {
    const r = validatePasswordStrength("NoNumbersHere");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/number/);
  });
});

describe("hash + verify roundtrip", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("Hello1World");
    expect(await verifyPassword("Hello1World", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("Hello1World");
    expect(await verifyPassword("Wrong1Password", hash)).toBe(false);
  });

  it("produces different hashes per call", async () => {
    const h1 = await hashPassword("Same1Pass");
    const h2 = await hashPassword("Same1Pass");
    expect(h1).not.toBe(h2);
  });
});
