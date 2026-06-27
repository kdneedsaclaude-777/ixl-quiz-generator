import { describe, it, expect } from "vitest";
import { validateTutorSession } from "../tutor-sessions";

describe("validateTutorSession", () => {
  const base = { scheduledAt: "2026-06-01T15:00:00.000Z" };

  it("accepts a minimal valid payload with defaults", () => {
    const r = validateTutorSession(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.durationMin).toBe(30);
      expect(r.value.status).toBe("scheduled");
      expect(r.value.focus).toBeNull();
    }
  });
  it("requires a date", () => {
    expect(validateTutorSession({}).ok).toBe(false);
  });
  it("rejects invalid date", () => {
    expect(validateTutorSession({ scheduledAt: "nope" }).ok).toBe(false);
  });
  it("rejects bad status", () => {
    expect(validateTutorSession({ ...base, status: "frozen" }).ok).toBe(false);
  });
  it("enforces duration bounds", () => {
    expect(validateTutorSession({ ...base, durationMin: 4 }).ok).toBe(false);
    expect(validateTutorSession({ ...base, durationMin: 481 }).ok).toBe(false);
    expect(validateTutorSession({ ...base, durationMin: 60 }).ok).toBe(true);
  });
  it("trims empty free-text to null", () => {
    const r = validateTutorSession({ ...base, focus: "   ", notes: "" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.focus).toBeNull();
      expect(r.value.notes).toBeNull();
    }
  });
});
