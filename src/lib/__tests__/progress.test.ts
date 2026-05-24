import { describe, it, expect } from "vitest";
import {
  masteryPct,
  average,
  isMastered,
  buildTrend,
} from "@/lib/progress";

describe("masteryPct", () => {
  it("rounds correct/attempts and guards zero attempts", () => {
    expect(masteryPct(0, 0)).toBe(0);
    expect(masteryPct(3, 4)).toBe(75);
    expect(masteryPct(2, 3)).toBe(67);
  });
});

describe("average", () => {
  it("returns null for empty and a rounded mean otherwise", () => {
    expect(average([])).toBeNull();
    expect(average([80, 90, 100])).toBe(90);
    expect(average([70, 75])).toBe(73);
  });
});

describe("isMastered", () => {
  it("requires >=3 attempts and >=80% accuracy", () => {
    expect(isMastered(3, 3)).toBe(true);
    expect(isMastered(4, 5)).toBe(true); // 80%
    expect(isMastered(2, 2)).toBe(false); // too few attempts
    expect(isMastered(2, 3)).toBe(false); // 67%
  });
});

describe("buildTrend", () => {
  it("keeps only scored+completed quizzes, oldest → newest", () => {
    const trend = buildTrend([
      { id: 3, score: 90, completedAt: new Date("2026-03-03") },
      { id: 1, score: 50, completedAt: new Date("2026-03-01") },
      { id: 9, score: null, completedAt: new Date("2026-03-02") }, // dropped
      { id: 8, score: 70, completedAt: null }, // dropped
      { id: 2, score: 60.6, completedAt: new Date("2026-03-02") },
    ]);
    expect(trend.map((t) => t.quizId)).toEqual([1, 2, 3]);
    expect(trend.map((t) => t.score)).toEqual([50, 61, 90]);
    expect(trend[0].date).toMatch(/^2026-03-01/);
  });
});
