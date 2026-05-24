import { describe, it, expect } from "vitest";
import { escapeCsvField, toCsv } from "@/lib/csv";

describe("escapeCsvField", () => {
  it("returns empty string for null/undefined", () => {
    expect(escapeCsvField(null)).toBe("");
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("returns plain string when no special chars", () => {
    expect(escapeCsvField("hello")).toBe("hello");
    expect(escapeCsvField(42)).toBe("42");
  });

  it("quotes fields with commas, quotes, or newlines", () => {
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('he said "hi"')).toBe('"he said ""hi"""');
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("toCsv", () => {
  it("formats headers + rows with CRLF line endings", () => {
    const csv = toCsv(["name", "score"], [["Alice", 90], ["Bob", 75]]);
    expect(csv).toBe("name,score\r\nAlice,90\r\nBob,75\r\n");
  });

  it("escapes embedded commas in row values", () => {
    const csv = toCsv(["topic", "n"], [["Fractions, decimals", 5]]);
    expect(csv).toContain('"Fractions, decimals"');
  });
});
