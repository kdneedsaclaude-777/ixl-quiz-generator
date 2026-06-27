import { describe, it, expect } from "vitest";
import { validateHomework, normalizeSkillIds, parseSkillIds } from "../homework";

describe("normalizeSkillIds", () => {
  it("returns empty array for null/undefined", () => {
    expect(normalizeSkillIds(null)).toEqual([]);
    expect(normalizeSkillIds(undefined)).toEqual([]);
  });
  it("dedupes and coerces numeric strings", () => {
    expect(normalizeSkillIds([1, "2", 2, 3])).toEqual([1, 2, 3]);
  });
  it("rejects non-array", () => {
    expect(normalizeSkillIds("nope")).toBeNull();
  });
  it("rejects non-integer members", () => {
    expect(normalizeSkillIds([1, "x"])).toBeNull();
  });
});

describe("parseSkillIds", () => {
  it("parses a JSON-encoded string", () => {
    expect(parseSkillIds("[1,2,3]")).toEqual([1, 2, 3]);
  });
  it("passes through arrays", () => {
    expect(parseSkillIds([4, 5])).toEqual([4, 5]);
  });
  it("returns [] for garbage / empty", () => {
    expect(parseSkillIds("not json")).toEqual([]);
    expect(parseSkillIds(null)).toEqual([]);
    expect(parseSkillIds('"[]"')).toEqual([]);
  });
  it("filters non-integers out of parsed JSON", () => {
    expect(parseSkillIds('[1,"x",2]')).toEqual([1, 2]);
  });
});

describe("validateHomework", () => {
  it("accepts a minimal valid payload", () => {
    const r = validateHomework({ title: "Fractions", assignedSkillIds: [1, 2] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.title).toBe("Fractions");
      expect(r.value.assignedSkillIds).toEqual([1, 2]);
      expect(r.value.status).toBe("active");
      expect(r.value.dueAt).toBeNull();
    }
  });
  it("requires a title", () => {
    expect(validateHomework({ title: "  " }).ok).toBe(false);
  });
  it("allows empty skill list", () => {
    const r = validateHomework({ title: "Read chapter 3" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.assignedSkillIds).toEqual([]);
  });
  it("rejects bad status", () => {
    expect(validateHomework({ title: "x", status: "weird" }).ok).toBe(false);
  });
  it("parses a due date", () => {
    const r = validateHomework({ title: "x", dueAt: "2026-06-10" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.dueAt).toBeInstanceOf(Date);
  });
  it("rejects an invalid due date", () => {
    expect(validateHomework({ title: "x", dueAt: "soon" }).ok).toBe(false);
  });
  it("rejects malformed skill ids", () => {
    expect(validateHomework({ title: "x", assignedSkillIds: "nope" }).ok).toBe(false);
  });
});
