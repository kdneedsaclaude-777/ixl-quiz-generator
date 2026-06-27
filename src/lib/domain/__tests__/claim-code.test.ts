import { describe, it, expect } from "vitest";
import {
  generateClaimCode, normalizeClaimCode, hashClaimCode, checkClaim, claimExpiry,
} from "../claim-code";

describe("generateClaimCode", () => {
  it("produces a formatted XXXX-XXXX code with no ambiguous chars", () => {
    const c = generateClaimCode();
    expect(c).toMatch(/^[ABCDEFGHJKMNPQRSTVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTVWXYZ23456789]{4}$/);
    expect(c).not.toMatch(/[IL O01]/);
  });
  it("is random across calls", () => {
    const a = generateClaimCode();
    const b = generateClaimCode();
    expect(a).not.toBe(b); // collision odds ~1 in 30^8
  });
});

describe("normalizeClaimCode", () => {
  it("uppercases, strips spaces/dashes, re-inserts the dash", () => {
    expect(normalizeClaimCode("k7qp-3mxr")).toBe("K7QP-3MXR");
    expect(normalizeClaimCode(" k7qp 3mxr ")).toBe("K7QP-3MXR");
    expect(normalizeClaimCode("K7QP3MXR")).toBe("K7QP-3MXR");
  });
});

describe("hashClaimCode", () => {
  it("hashes equal regardless of input formatting", () => {
    expect(hashClaimCode("k7qp3mxr")).toBe(hashClaimCode("K7QP-3MXR"));
  });
  it("is a 64-char hex sha256, not the plaintext", () => {
    const h = hashClaimCode("K7QP-3MXR");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain("K7QP");
  });
});

describe("checkClaim", () => {
  const code = "K7QP-3MXR";
  const future = new Date(Date.now() + 1000 * 60 * 60);
  const past = new Date(Date.now() - 1000);

  it("accepts a valid, unexpired, unclaimed code", () => {
    const r = checkClaim({ codeHash: hashClaimCode(code), expiresAt: future, claimedAt: null }, code);
    expect(r.ok).toBe(true);
  });
  it("rejects a missing record", () => {
    const r = checkClaim(null, code);
    expect(r).toEqual({ ok: false, reason: "invalid" });
  });
  it("rejects a wrong code", () => {
    const r = checkClaim({ codeHash: hashClaimCode(code), expiresAt: future, claimedAt: null }, "WRNG-0000");
    expect(r).toEqual({ ok: false, reason: "invalid" });
  });
  it("rejects an already-claimed code", () => {
    const r = checkClaim({ codeHash: hashClaimCode(code), expiresAt: future, claimedAt: new Date() }, code);
    expect(r).toEqual({ ok: false, reason: "claimed" });
  });
  it("rejects an expired code", () => {
    const r = checkClaim({ codeHash: hashClaimCode(code), expiresAt: past, claimedAt: null }, code);
    expect(r).toEqual({ ok: false, reason: "expired" });
  });
});

describe("claimExpiry", () => {
  it("is 14 days out", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(claimExpiry(now).toISOString()).toBe("2026-01-15T00:00:00.000Z");
  });
});
