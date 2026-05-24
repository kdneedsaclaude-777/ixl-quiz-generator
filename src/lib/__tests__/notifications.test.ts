import { describe, it, expect } from "vitest";
import {
  isLowScore,
  isInactive,
  isDigestDue,
  isoWeekKey,
} from "@/lib/notifications";

describe("isLowScore", () => {
  it("flags scores strictly below the threshold", () => {
    expect(isLowScore(55, 60)).toBe(true);
    expect(isLowScore(60, 60)).toBe(false);
    expect(isLowScore(90, 60)).toBe(false);
  });
  it("no alert when threshold is null/undefined", () => {
    expect(isLowScore(10, null)).toBe(false);
    expect(isLowScore(10, undefined)).toBe(false);
  });
});

describe("isInactive", () => {
  const now = new Date("2026-05-18T12:00:00Z");
  it("true when never practised", () => {
    expect(isInactive(null, 7, now)).toBe(true);
  });
  it("true once elapsed days >= threshold", () => {
    expect(isInactive(new Date("2026-05-11T12:00:00Z"), 7, now)).toBe(true);
    expect(isInactive(new Date("2026-05-11T13:00:00Z"), 7, now)).toBe(false);
  });
  it("disabled when days is null or non-positive", () => {
    expect(isInactive(null, null, now)).toBe(false);
    expect(isInactive(null, 0, now)).toBe(false);
  });
});

describe("isDigestDue", () => {
  const now = new Date("2026-05-18T12:00:00Z");
  it("due when never sent", () => {
    expect(isDigestDue(null, now)).toBe(true);
  });
  it("due only after 7 days", () => {
    expect(isDigestDue(new Date("2026-05-11T12:00:00Z"), now)).toBe(true);
    expect(isDigestDue(new Date("2026-05-13T12:00:00Z"), now)).toBe(false);
  });
});

describe("isoWeekKey", () => {
  it("matches the YYYY-Www format and is deterministic", () => {
    const d = new Date("2026-05-18T00:00:00Z");
    expect(isoWeekKey(d)).toMatch(/^\d{4}-W\d{2}$/);
    expect(isoWeekKey(d)).toBe(isoWeekKey(new Date("2026-05-18T23:59:00Z")));
  });
  it("changes once a full week has elapsed", () => {
    const d = new Date("2026-05-18T00:00:00Z");
    const plus8 = new Date(d.getTime() + 8 * 86_400_000);
    expect(isoWeekKey(d)).not.toBe(isoWeekKey(plus8));
  });
});
