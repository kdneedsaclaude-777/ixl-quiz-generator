import { describe, it, expect } from "vitest";
import { generateSmsCode, normalizePhone, isRealSmsConfigured } from "@/lib/sms";

describe("generateSmsCode", () => {
  it("always returns exactly 6 digits, zero-padded", () => {
    for (let i = 0; i < 200; i++) {
      const c = generateSmsCode();
      expect(c).toMatch(/^\d{6}$/);
    }
  });
});

describe("normalizePhone", () => {
  it("strips whitespace, dashes, parens and prepends +", () => {
    expect(normalizePhone("+1 (555) 123-4567")).toBe("+15551234567");
    expect(normalizePhone("555 123 4567")).toBe("+5551234567");
    expect(normalizePhone("  +44-20-7946-0958 ")).toBe("+442079460958");
  });
  it("rejects empty / too short / non-numeric", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("not a phone")).toBeNull();
    expect(normalizePhone("+123 456 abc")).toBeNull();
  });
  it("rejects implausibly long numbers (>15 digits)", () => {
    expect(normalizePhone("1234567890123456")).toBeNull();
  });
});

describe("isRealSmsConfigured", () => {
  it("requires all three Twilio env vars", () => {
    const prior = {
      sid: process.env.TWILIO_ACCOUNT_SID,
      tok: process.env.TWILIO_AUTH_TOKEN,
      frm: process.env.TWILIO_FROM,
    };
    try {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_FROM;
      expect(isRealSmsConfigured()).toBe(false);
      process.env.TWILIO_ACCOUNT_SID = "AC123";
      expect(isRealSmsConfigured()).toBe(false);
      process.env.TWILIO_AUTH_TOKEN = "tok";
      expect(isRealSmsConfigured()).toBe(false);
      process.env.TWILIO_FROM = "+15555550100";
      expect(isRealSmsConfigured()).toBe(true);
    } finally {
      if (prior.sid !== undefined) process.env.TWILIO_ACCOUNT_SID = prior.sid;
      else delete process.env.TWILIO_ACCOUNT_SID;
      if (prior.tok !== undefined) process.env.TWILIO_AUTH_TOKEN = prior.tok;
      else delete process.env.TWILIO_AUTH_TOKEN;
      if (prior.frm !== undefined) process.env.TWILIO_FROM = prior.frm;
      else delete process.env.TWILIO_FROM;
    }
  });
});
