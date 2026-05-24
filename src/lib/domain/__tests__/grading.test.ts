import { describe, it, expect } from "vitest";
import { gradeAnswer, normalizeNumeric, isFreeInputType } from "@/lib/domain/grading";

describe("normalizeNumeric", () => {
  it("parses plain, padded, signed and grouped numbers", () => {
    expect(normalizeNumeric("5")).toBe(5);
    expect(normalizeNumeric("  5.0 ")).toBe(5);
    expect(normalizeNumeric("+5")).toBe(5);
    expect(normalizeNumeric("1,000")).toBe(1000);
    expect(normalizeNumeric("−3")).toBe(-3); // unicode minus
    expect(normalizeNumeric(".5")).toBe(0.5);
  });
  it("returns null for non-numeric text", () => {
    expect(normalizeNumeric("")).toBeNull();
    expect(normalizeNumeric("five")).toBeNull();
    expect(normalizeNumeric("5x")).toBeNull();
  });
});

describe("gradeAnswer", () => {
  it("mcq is exact key match", () => {
    expect(gradeAnswer("mcq", "B", "B")).toBe(true);
    expect(gradeAnswer("mcq", "b", "B")).toBe(false);
    expect(gradeAnswer("mcq", "", "B")).toBe(false);
  });

  it("true_false is case-insensitive", () => {
    expect(gradeAnswer("true_false", "True", "true")).toBe(true);
    expect(gradeAnswer("true_false", "FALSE", "false")).toBe(true);
    expect(gradeAnswer("true_false", "true", "false")).toBe(false);
  });

  it("fill_in_the_blank compares numerically, formatting-insensitive", () => {
    expect(gradeAnswer("fill_in_the_blank", " 5.0 ", "5")).toBe(true);
    expect(gradeAnswer("fill_in_the_blank", "1,000", "1000")).toBe(true);
    expect(gradeAnswer("fill_in_the_blank", "+12", "12")).toBe(true);
    expect(gradeAnswer("fill_in_the_blank", "6", "7")).toBe(false);
    // numeric-only: a non-numeric submission can never be correct
    expect(gradeAnswer("fill_in_the_blank", "five", "5")).toBe(false);
  });

  it("short_answer falls back to text match when not numeric", () => {
    expect(gradeAnswer("short_answer", "Triangle", "triangle")).toBe(true);
    expect(gradeAnswer("short_answer", "3.0", "3")).toBe(true);
    expect(gradeAnswer("short_answer", "square", "triangle")).toBe(false);
  });

  it("isFreeInputType flags typed-answer questions", () => {
    expect(isFreeInputType("fill_in_the_blank")).toBe(true);
    expect(isFreeInputType("short_answer")).toBe(true);
    expect(isFreeInputType("mcq")).toBe(false);
    expect(isFreeInputType("true_false")).toBe(false);
  });
});
