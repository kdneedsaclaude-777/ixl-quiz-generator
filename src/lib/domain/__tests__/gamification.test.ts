import { describe, it, expect } from "vitest";
import {
  calculateXp,
  xpToLevel,
  calculateStreak,
  detectNewBadges,
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
    thisQuiz: over.thisQuiz ?? {
      scorePct: history.at(-1)?.scorePct ?? 80,
      durationSeconds: 300,
      topicGroupLetters: history.at(-1)?.topicGroupLetters ?? ["B"],
    },
    history: { quizzes: history },
  };
}

describe("calculateXp", () => {
  it("scales by 10× score percent", () => {
    expect(calculateXp(100)).toBe(1000);
    expect(calculateXp(75)).toBe(750);
    expect(calculateXp(0)).toBe(0);
  });
  it("clamps out-of-range inputs", () => {
    expect(calculateXp(150)).toBe(1000);
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
});
