import { describe, it, expect } from "vitest";
import { applyAdaptivity, calculateMastery } from "@/lib/domain/adaptivity";

const base = {
  currentDifficulty: 3,
  currentSkillCode: "B.4",
  quizScore: 60,
  consecutiveCorrect: 0,
  recentScores: [60],
};

describe("applyAdaptivity", () => {
  it("advances skill + difficulty on a mastery streak (>=80% and >=3 streak)", () => {
    const r = applyAdaptivity({ ...base, quizScore: 90, consecutiveCorrect: 3 });
    expect(r.newSkillCode).toBe("B.5");
    expect(r.newDifficulty).toBe(4);
    expect(r.progressionNote).toMatch(/Mastery streak/);
  });

  it("raises difficulty but holds skill on a strong score without the streak", () => {
    const r = applyAdaptivity({ ...base, quizScore: 85, consecutiveCorrect: 1 });
    expect(r.newSkillCode).toBe("B.4");
    expect(r.newDifficulty).toBe(4);
    expect(r.progressionNote).toMatch(/difficulty raised/);
  });

  it("caps difficulty at 5 on a strong score", () => {
    const r = applyAdaptivity({
      ...base,
      currentDifficulty: 5,
      quizScore: 95,
      consecutiveCorrect: 0,
    });
    expect(r.newDifficulty).toBe(5);
    expect(r.progressionNote).toMatch(/maximum difficulty/);
  });

  it("holds position for a mid score (50–79%)", () => {
    const r = applyAdaptivity({ ...base, quizScore: 65 });
    expect(r.newDifficulty).toBe(3);
    expect(r.newSkillCode).toBe("B.4");
    expect(r.progressionNote).toMatch(/Hold/);
  });

  it("steps back skill + difficulty below 50%", () => {
    const r = applyAdaptivity({ ...base, quizScore: 40, recentScores: [40] });
    expect(r.newSkillCode).toBe("B.3");
    expect(r.newDifficulty).toBe(2);
    expect(r.progressionNote).toMatch(/stepping back/);
  });

  it("floors difficulty at 1 and skill index at 1 when stepping back", () => {
    const r = applyAdaptivity({
      ...base,
      currentDifficulty: 1,
      currentSkillCode: "B.1",
      quizScore: 20,
      recentScores: [20],
    });
    expect(r.newDifficulty).toBe(1);
    expect(r.newSkillCode).toBe("B.1");
  });

  it("flags remediation after >=2 sub-50% recent scores", () => {
    const r = applyAdaptivity({
      ...base,
      quizScore: 30,
      recentScores: [30, 45, 70],
    });
    expect(r.remediationFlag).toBe(true);
    expect(r.progressionNote).toMatch(/Remediation flagged/);
  });

  it("does not flag remediation with a single failure", () => {
    const r = applyAdaptivity({ ...base, quizScore: 40, recentScores: [40, 80] });
    expect(r.remediationFlag).toBe(false);
  });

  it("leaves a non-standard skill code untouched when shifting", () => {
    const r = applyAdaptivity({
      ...base,
      currentSkillCode: "WEIRD",
      quizScore: 40,
      recentScores: [40],
    });
    expect(r.newSkillCode).toBe("WEIRD");
  });
});

describe("calculateMastery", () => {
  it("returns 0 for no attempts", () => {
    expect(calculateMastery([], [])).toBe(0);
  });

  it("computes a weighted average", () => {
    // (100*1 + 0*0.5) / (1 + 0.5) = 66.67
    expect(calculateMastery([100, 0], [1, 0.5])).toBeCloseTo(66.667, 2);
  });

  it("throws when attempts and weights differ in length", () => {
    expect(() => calculateMastery([1, 2], [1])).toThrow(/same length/);
  });
});
