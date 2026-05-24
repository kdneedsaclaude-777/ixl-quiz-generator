import { describe, it, expect } from "vitest";
import {
  isPracticeAllowedNow,
  isWithinWindow,
  minutesOfDayInTz,
  topicsAvailable,
  parseLockedTopicGroupIds,
  type ParentalSettingsView,
} from "@/lib/domain/parental-controls";

// Build a precise UTC instant so tests don't depend on the machine timezone.
function utc(hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 4, 11, hour, minute, 0, 0));
}

// Convenience to build a settings view with sensible defaults.
function view(over: Partial<ParentalSettingsView>): ParentalSettingsView {
  return {
    maxQuizzesPerDay: null,
    windowStart: null,
    windowEnd: null,
    windowTimezone: null,
    lockedTopicGroupIds: [],
    ...over,
  };
}

describe("minutesOfDayInTz", () => {
  it("reads wall-clock minutes in the given timezone", () => {
    // 21:00 UTC = 17:00 in New York (EDT, UTC-4 in May).
    expect(minutesOfDayInTz(utc(21, 0), "UTC")).toBe(21 * 60);
    expect(minutesOfDayInTz(utc(21, 0), "America/New_York")).toBe(17 * 60);
  });
  it("falls back to UTC for an invalid timezone", () => {
    expect(minutesOfDayInTz(utc(9, 30), "Not/AZone")).toBe(9 * 60 + 30);
  });
});

describe("isWithinWindow (timezone-aware)", () => {
  it("matches a same-day window in UTC", () => {
    expect(isWithinWindow("16:00", "20:00", utc(17), "UTC")).toBe(true);
    expect(isWithinWindow("16:00", "20:00", utc(15, 59), "UTC")).toBe(false);
    expect(isWithinWindow("16:00", "20:00", utc(20), "UTC")).toBe(false);
  });

  it("evaluates the SAME instant differently per timezone (the bug fix)", () => {
    // 21:00 UTC: inside 16:00–20:00 in New York (=17:00), outside in UTC.
    expect(isWithinWindow("16:00", "20:00", utc(21), "UTC")).toBe(false);
    expect(isWithinWindow("16:00", "20:00", utc(21), "America/New_York")).toBe(true);
  });

  it("matches an overnight (wrap-around) window", () => {
    expect(isWithinWindow("22:00", "02:00", utc(23), "UTC")).toBe(true);
    expect(isWithinWindow("22:00", "02:00", utc(1), "UTC")).toBe(true);
    expect(isWithinWindow("22:00", "02:00", utc(15), "UTC")).toBe(false);
  });

  it("returns true on malformed input (fail open, don't block)", () => {
    expect(isWithinWindow("nope", "20:00", utc(17), "UTC")).toBe(true);
  });

  it("returns false on an empty window (start===end)", () => {
    expect(isWithinWindow("16:00", "16:00", utc(16), "UTC")).toBe(false);
  });
});

describe("isPracticeAllowedNow", () => {
  it("allows everything when no settings", () => {
    expect(isPracticeAllowedNow(null, 0, utc(3))).toEqual({ allowed: true });
  });

  it("uses the stored timezone, not the server clock", () => {
    // 21:00 UTC, window 16:00–20:00 in New York → 17:00 NY → allowed.
    const ny = isPracticeAllowedNow(
      view({ windowStart: "16:00", windowEnd: "20:00", windowTimezone: "America/New_York" }),
      0,
      utc(21),
    );
    expect(ny.allowed).toBe(true);

    // Same instant, same window, but interpreted in UTC → 21:00 → blocked.
    const noTz = isPracticeAllowedNow(
      view({ windowStart: "16:00", windowEnd: "20:00", windowTimezone: null }),
      0,
      utc(21),
    );
    expect(noTz.allowed).toBe(false);
    expect(noTz.reason).toBe("outside_window");
  });

  it("names the timezone in the block message", () => {
    const r = isPracticeAllowedNow(
      view({ windowStart: "16:00", windowEnd: "20:00", windowTimezone: "America/New_York" }),
      0,
      utc(2), // 22:00 prev day NY → outside
    );
    expect(r.allowed).toBe(false);
    expect(r.detail).toMatch(/America\/New_York/);
  });

  it("blocks when daily limit is hit", () => {
    const r = isPracticeAllowedNow(view({ maxQuizzesPerDay: 3 }), 3, utc(15));
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("daily_limit_reached");
  });

  it("allows when both gates pass", () => {
    const r = isPracticeAllowedNow(
      view({
        maxQuizzesPerDay: 3,
        windowStart: "16:00",
        windowEnd: "20:00",
        windowTimezone: "UTC",
      }),
      2,
      utc(17),
    );
    expect(r).toEqual({ allowed: true });
  });
});

describe("topicsAvailable", () => {
  it("strips locked groups", () => {
    expect(topicsAvailable([1, 2, 3, 4], [2, 4])).toEqual([1, 3]);
  });

  it("returns full list when nothing locked", () => {
    expect(topicsAvailable([1, 2, 3], [])).toEqual([1, 2, 3]);
  });
});

describe("parseLockedTopicGroupIds", () => {
  it("parses a valid JSON array", () => {
    expect(parseLockedTopicGroupIds("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("ignores garbage", () => {
    expect(parseLockedTopicGroupIds("not json")).toEqual([]);
    expect(parseLockedTopicGroupIds(null)).toEqual([]);
    expect(parseLockedTopicGroupIds("[\"a\", 1, null]")).toEqual([1]);
  });
});
