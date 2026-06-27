import { describe, it, expect } from "vitest";
import {
  calculateXp,
  xpToLevel,
  calculateStreak,
  streakAtRisk,
  detectNewBadges,
  levelTitle,
  LEVEL_TIER_PILL,
  calculateXpBreakdown,
  type DetectionInput,
  type QuizSummary,
} from "@/lib/domain/gamification";

function quiz(scorePct: number, topicGroupLetters: string[], completedAt: Date): QuizSummary {
  return { scorePct, topicGroupLetters, completedAt };
}

function daysAgo(today: Date, n: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d;
}

function buildInput(over: Partial<DetectionInput> & { history?: QuizSummary[] }): DetectionInput {
  const today = over.today ?? new Date(2026, 4, 11, 12, 0, 0);
  const history = over.history ?? [];
  return {
    today,
    alreadyEarned: over.alreadyEarned ?? new Set(),
    level: over.level ?? 1,
    totalQuizzes: over.totalQuizzes ?? history.length,
    thisQuiz: over.thisQuiz ?? {
      scorePct: history.at(-1)?.scorePct ?? 80,
      durationSeconds: 300,
      topicGroupLetters: history.at(-1)?.topicGroupLetters ?? ["B"],
    },
    history: { quizzes: history },
  };
}

describe("calculateXp", () => {
  it("equals the score percent (100% = 100 XP = one level)", () => {
    expect(calculateXp(100)).toBe(100);
    expect(calculateXp(75)).toBe(75);
    expect(calculateXp(0)).toBe(0);
  });
  it("clamps out-of-range inputs", () => {
    expect(calculateXp(150)).toBe(100);
    expect(calculateXp(-10)).toBe(0);
  });
});

describe("xpToLevel", () => {
  it("starts at level 1 with empty xp", () => {
    expect(xpToLevel(0)).toEqual({ level: 1, currentLevelXp: 0, nextLevelXp: 100 });
  });
  it("crosses to level 2 at 100 XP", () => {
    expect(xpToLevel(100).level).toBe(2);
    expect(xpToLevel(150)).toEqual({ level: 2, currentLevelXp: 50, nextLevelXp: 100 });
  });
  it("handles big XP", () => {
    expect(xpToLevel(1234).level).toBe(13);
  });
});

describe("calculateStreak", () => {
  const today = new Date(2026, 4, 11, 12, 0, 0);

  it("returns 0 for no quiz dates", () => {
    expect(calculateStreak([], today)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(calculateStreak([today, daysAgo(today, 1), daysAgo(today, 2)], today)).toBe(3);
  });

  it("picks up from yesterday if today has no activity", () => {
    expect(calculateStreak([daysAgo(today, 1), daysAgo(today, 2)], today)).toBe(2);
  });

  it("breaks on gap", () => {
    // today, yesterday OK, then 3-days-ago — gap at -2
    const dates = [today, daysAgo(today, 1), daysAgo(today, 3)];
    expect(calculateStreak(dates, today)).toBe(2);
  });

  it("ignores duplicate same-day quizzes", () => {
    const a = new Date(today);
    const b = new Date(today); b.setHours(15);
    const c = new Date(today); c.setHours(20);
    expect(calculateStreak([a, b, c], today)).toBe(1);
  });
});

describe("streakAtRisk", () => {
  const today = new Date(2026, 4, 11, 12, 0, 0);

  it("returns 0 when there is no history", () => {
    expect(streakAtRisk([], today)).toBe(0);
  });

  it("returns 0 when already practised today (streak is safe)", () => {
    expect(streakAtRisk([today, daysAgo(today, 1)], today)).toBe(0);
  });

  it("flags a live streak not yet extended today", () => {
    // practised yesterday + the day before, nothing today → 2-day streak at risk
    expect(streakAtRisk([daysAgo(today, 1), daysAgo(today, 2)], today)).toBe(2);
  });

  it("returns 0 when the streak already lapsed (no quiz yesterday)", () => {
    expect(streakAtRisk([daysAgo(today, 2), daysAgo(today, 3)], today)).toBe(0);
  });

  it("respects the minDays floor", () => {
    // a 1-day streak is below a minDays=2 floor
    expect(streakAtRisk([daysAgo(today, 1)], today, 2)).toBe(0);
    expect(streakAtRisk([daysAgo(today, 1)], today, 1)).toBe(1);
  });
});

describe("detectNewBadges", () => {
  const today = new Date(2026, 4, 11, 12, 0, 0);

  it("First Quiz fires on the only completed quiz", () => {
    const r = detectNewBadges(buildInput({
      history: [quiz(60, ["B"], today)],
      thisQuiz: { scorePct: 60, durationSeconds: 400, topicGroupLetters: ["B"] },
    }));
    expect(r.map((a) => a.code)).toContain("first_quiz");
  });

  it("First Quiz does NOT fire on the 2nd quiz", () => {
    const r = detectNewBadges(buildInput({
      history: [quiz(60, ["B"], daysAgo(today, 1)), quiz(70, ["B"], today)],
      thisQuiz: { scorePct: 70, durationSeconds: 400, topicGroupLetters: ["B"] },
    }));
    expect(r.map((a) => a.code)).not.toContain("first_quiz");
  });

  it("Perfect Score fires at 100%", () => {
    const r = detectNewBadges(buildInput({
      history: [quiz(100, ["B"], today)],
      thisQuiz: { scorePct: 100, durationSeconds: 400, topicGroupLetters: ["B"] },
    }));
    expect(r.map((a) => a.code)).toContain("perfect_score");
  });

  it("Hot Streak fires after 5 quizzes ≥80%", () => {
    const history = [80, 90, 85, 100, 81].map((s, i) => quiz(s, ["B"], daysAgo(today, 4 - i)));
    const r = detectNewBadges(buildInput({
      history,
      thisQuiz: { scorePct: 81, durationSeconds: 400, topicGroupLetters: ["B"] },
    }));
    expect(r.map((a) => a.code)).toContain("hot_streak");
  });

  it("Hot Streak does NOT fire if one quiz dipped below 80%", () => {
    const history = [80, 90, 70, 100, 81].map((s, i) => quiz(s, ["B"], daysAgo(today, 4 - i)));
    const r = detectNewBadges(buildInput({
      history,
      thisQuiz: { scorePct: 81, durationSeconds: 400, topicGroupLetters: ["B"] },
    }));
    expect(r.map((a) => a.code)).not.toContain("hot_streak");
  });

  it("Topic Master fires after 3rd 100% on same topic", () => {
    const history = [
      quiz(100, ["B"], daysAgo(today, 2)),
      quiz(100, ["B"], daysAgo(today, 1)),
      quiz(100, ["B"], today),
    ];
    const r = detectNewBadges(buildInput({
      history,
      thisQuiz: { scorePct: 100, durationSeconds: 400, topicGroupLetters: ["B"] },
    }));
    const topicMaster = r.find((a) => a.code === "topic_master");
    expect(topicMaster).toBeDefined();
    expect(topicMaster?.context).toEqual({ topicLetter: "B" });
  });

  it("Speed Demon fires under 3 minutes", () => {
    const r = detectNewBadges(buildInput({
      history: [quiz(70, ["B"], today)],
      thisQuiz: { scorePct: 70, durationSeconds: 120, topicGroupLetters: ["B"] },
    }));
    expect(r.map((a) => a.code)).toContain("speed_demon");
  });

  it("Speed Demon does NOT fire at exactly 3 minutes", () => {
    const r = detectNewBadges(buildInput({
      history: [quiz(70, ["B"], today)],
      thisQuiz: { scorePct: 70, durationSeconds: 180, topicGroupLetters: ["B"] },
    }));
    expect(r.map((a) => a.code)).not.toContain("speed_demon");
  });

  it("Comeback Kid fires after a prior <40% on a shared topic", () => {
    const r = detectNewBadges(buildInput({
      history: [
        quiz(30, ["B"], daysAgo(today, 2)),
        quiz(85, ["B"], today),
      ],
      thisQuiz: { scorePct: 85, durationSeconds: 400, topicGroupLetters: ["B"] },
    }));
    expect(r.map((a) => a.code)).toContain("comeback_kid");
  });

  it("Comeback Kid does NOT fire if low score was on a different topic", () => {
    const r = detectNewBadges(buildInput({
      history: [
        quiz(30, ["E"], daysAgo(today, 2)),
        quiz(85, ["B"], today),
      ],
      thisQuiz: { scorePct: 85, durationSeconds: 400, topicGroupLetters: ["B"] },
    }));
    expect(r.map((a) => a.code)).not.toContain("comeback_kid");
  });

  it("Dedicated fires at 7-day streak", () => {
    const history: QuizSummary[] = [];
    for (let i = 6; i >= 0; i--) history.push(quiz(70, ["B"], daysAgo(today, i)));
    const r = detectNewBadges(buildInput({
      history,
      thisQuiz: { scorePct: 70, durationSeconds: 400, topicGroupLetters: ["B"] },
    }));
    expect(r.map((a) => a.code)).toContain("dedicated");
  });

  it("Already-earned badges are not re-awarded", () => {
    const r = detectNewBadges(buildInput({
      history: [quiz(100, ["B"], today)],
      thisQuiz: { scorePct: 100, durationSeconds: 100, topicGroupLetters: ["B"] },
      alreadyEarned: new Set(["first_quiz", "perfect_score", "speed_demon"]),
    }));
    expect(r.map((a) => a.code)).toEqual([]);
  });

  // ── Expansion badges ──
  it("streak3 at exactly a 3-day streak, not at 2", () => {
    const h3 = [quiz(80, ["B"], daysAgo(today, 2)), quiz(80, ["B"], daysAgo(today, 1)), quiz(80, ["B"], today)];
    expect(detectNewBadges(buildInput({ history: h3 })).map((a) => a.code)).toContain("streak3");
    const h2 = [quiz(80, ["B"], daysAgo(today, 1)), quiz(80, ["B"], today)];
    expect(detectNewBadges(buildInput({ history: h2 })).map((a) => a.code)).not.toContain("streak3");
  });

  it("level5 fires at level >=5, level10 only at >=10", () => {
    const r5 = detectNewBadges(buildInput({ history: [quiz(80, ["B"], today)], level: 5 }));
    expect(r5.map((a) => a.code)).toContain("level5");
    expect(r5.map((a) => a.code)).not.toContain("level10");
    const r10 = detectNewBadges(buildInput({ history: [quiz(80, ["B"], today)], level: 10 }));
    expect(r10.map((a) => a.code)).toContain("level10");
  });

  it("test_ace requires a 100% TEST, not a 100% practice quiz", () => {
    const practice = detectNewBadges(buildInput({
      history: [quiz(100, ["B"], today)],
      thisQuiz: { scorePct: 100, durationSeconds: 300, topicGroupLetters: ["B"], isTest: false },
    }));
    expect(practice.map((a) => a.code)).not.toContain("test_ace");
    const test = detectNewBadges(buildInput({
      history: [quiz(100, ["B"], today)],
      thisQuiz: { scorePct: 100, durationSeconds: 300, topicGroupLetters: ["B"], isTest: true },
    }));
    expect(test.map((a) => a.code)).toContain("test_ace");
  });

  it("daily_done requires the daily-challenge flag", () => {
    const r = detectNewBadges(buildInput({
      history: [quiz(60, ["B"], today)],
      thisQuiz: { scorePct: 60, durationSeconds: 300, topicGroupLetters: ["B"], isDailyChallenge: true },
    }));
    expect(r.map((a) => a.code)).toContain("daily_done");
  });

  it("centurion at 100 total quizzes, not 99", () => {
    expect(detectNewBadges(buildInput({ history: [quiz(80, ["B"], today)], totalQuizzes: 99 })).map((a) => a.code)).not.toContain("centurion");
    expect(detectNewBadges(buildInput({ history: [quiz(80, ["B"], today)], totalQuizzes: 100 })).map((a) => a.code)).toContain("centurion");
  });
});

describe("levelTitle", () => {
  it("clamps low levels to the first rank", () => {
    expect(levelTitle(0).title).toBe("Math Rookie");
    expect(levelTitle(-3).title).toBe("Math Rookie");
    expect(levelTitle(1).title).toBe("Math Rookie");
  });
  it("uses inclusive band boundaries", () => {
    expect(levelTitle(2).title).toBe("Number Newbie");
    expect(levelTitle(10).title).toBe("Math Whiz");
    expect(levelTitle(9).title).toBe("Sharp Thinker"); // just below the 10-band
  });
  it("caps very high levels at the top rank", () => {
    expect(levelTitle(500).title).toBe("Math Mythic");
  });
  it("every tier maps to one of the four existing cm-pill variants", () => {
    const allowed = new Set(["mint", "coral", "amber", "indigo"]);
    for (const lvl of [1, 3, 7, 14, 24, 40, 75, 100]) {
      expect(allowed.has(LEVEL_TIER_PILL[levelTitle(lvl).tier])).toBe(true);
    }
  });
});

describe("calculateXpBreakdown", () => {
  const baseInput = {
    scorePct: 70,
    streak: 1,
    isFirstToday: false,
    isDailyChallenge: false,
    isTest: false,
    recentAvgPct: null as number | null,
  };

  it("base only when no bonuses apply", () => {
    const r = calculateXpBreakdown(baseInput);
    expect(r.base).toBe(calculateXp(70));
    expect(r.bonuses).toEqual([]);
    expect(r.total).toBe(r.base);
  });

  it("perfect score adds +25", () => {
    const r = calculateXpBreakdown({ ...baseInput, scorePct: 100 });
    expect(r.bonuses.find((b) => b.reason === "perfect_score")?.amount).toBe(25);
  });

  it("streak bonus scales by 5/day and caps at 50, and needs streak >= 2", () => {
    expect(calculateXpBreakdown({ ...baseInput, streak: 1 }).bonuses.find((b) => b.reason === "streak_bonus")).toBeUndefined();
    expect(calculateXpBreakdown({ ...baseInput, streak: 4 }).bonuses.find((b) => b.reason === "streak_bonus")?.amount).toBe(20);
    expect(calculateXpBreakdown({ ...baseInput, streak: 50 }).bonuses.find((b) => b.reason === "streak_bonus")?.amount).toBe(50);
  });

  it("first-of-day, daily-challenge and test bonuses are gated by their flags", () => {
    const r = calculateXpBreakdown({ ...baseInput, isFirstToday: true, isDailyChallenge: true, isTest: true });
    const amt = (reason: string) => r.bonuses.find((b) => b.reason === reason)?.amount;
    expect(amt("first_quiz_of_day")).toBe(20);
    expect(amt("daily_challenge")).toBe(30);
    expect(amt("test_complete")).toBe(40);
  });

  it("comeback needs >=80 now AND a prior sub-50 average", () => {
    expect(calculateXpBreakdown({ ...baseInput, scorePct: 85, recentAvgPct: 40 }).bonuses.find((b) => b.reason === "comeback")?.amount).toBe(30);
    expect(calculateXpBreakdown({ ...baseInput, scorePct: 85, recentAvgPct: 60 }).bonuses.find((b) => b.reason === "comeback")).toBeUndefined();
    expect(calculateXpBreakdown({ ...baseInput, scorePct: 70, recentAvgPct: 40 }).bonuses.find((b) => b.reason === "comeback")).toBeUndefined();
  });

  it("total = base + sum of bonuses", () => {
    const r = calculateXpBreakdown({ scorePct: 100, streak: 3, isFirstToday: true, isDailyChallenge: false, isTest: false, recentAvgPct: null });
    const sum = r.bonuses.reduce((s, b) => s + b.amount, 0);
    expect(r.total).toBe(r.base + sum);
  });
});
