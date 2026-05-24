import { describe, it, expect } from "vitest";
import { buildBuckets, type SkillRecord } from "@/lib/ai/mock";

function skill(id: number, letter: string, number: number): SkillRecord {
  return {
    id,
    code: `${letter}.${number}`,
    number,
    name: `Skill ${letter}.${number}`,
    topicGroup: { letter, name: `Group ${letter}`, gradeLevel: 4 },
  };
}

function mapOf(skills: SkillRecord[]): Map<string, SkillRecord[]> {
  const m = new Map<string, SkillRecord[]>();
  for (const s of skills) {
    const arr = m.get(s.topicGroup.letter) ?? [];
    arr.push(s);
    m.set(s.topicGroup.letter, arr);
  }
  return m;
}

const sum = (b: { count: number }[]) => b.reduce((a, x) => a + x.count, 0);

describe("buildBuckets distribution", () => {
  const skills = [
    skill(1, "B", 1), skill(2, "B", 2), skill(3, "B", 3),
    skill(4, "B", 4), skill(5, "B", 5), skill(6, "B", 6),
  ];

  it("with no weak skills, distributes exactly totalQuestions across skills", () => {
    const buckets = buildBuckets({
      skillsByGroup: mapOf(skills),
      weakSkillIds: new Set(),
      totalQuestions: 10,
    });
    expect(sum(buckets)).toBe(10);
    expect(buckets.every((b) => !b.weakTargeted)).toBe(true);
  });

  it("weights ~60% to weak skills and conserves the total", () => {
    // B.3 weak → adjacent B.2/B.4, the rest "other".
    const buckets = buildBuckets({
      skillsByGroup: mapOf(skills),
      weakSkillIds: new Set([3]),
      totalQuestions: 10,
    });
    expect(sum(buckets)).toBe(10);
    const weak = sum(buckets.filter((b) => b.weakTargeted));
    // weakCount = max(1*2, round(10*0.6)) = 6
    expect(weak).toBeGreaterThanOrEqual(6);
    expect(buckets.some((b) => b.weakTargeted)).toBe(true);
  });

  it("never emits empty buckets and handles a tiny quiz", () => {
    const buckets = buildBuckets({
      skillsByGroup: mapOf(skills),
      weakSkillIds: new Set([1]),
      totalQuestions: 3,
    });
    expect(sum(buckets)).toBe(3);
    expect(buckets.every((b) => b.count > 0)).toBe(true);
  });
});
