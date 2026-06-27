// Pure gamification logic. No DB calls, no I/O.
// Implements the 7 badge rules from the Phase 2 spec.

export const XP_PER_LEVEL = 100;

// Base XP earned per completed quiz = the score percentage (so 100% = 100 XP =
// one level at XP_PER_LEVEL=100). This keeps level milestones, level titles and
// the bonus system (which adds +20–50) meaningfully paced: a strong quiz is
// ~1 level, so Level 5 ≈ 5 quizzes and Level 10 ≈ 10. Bonuses then matter.
export function calculateXp(scorePct: number): number {
  const clamped = Math.max(0, Math.min(100, scorePct));
  return Math.round(clamped);
}

export type LevelInfo = {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
};

// Every 100 XP = 1 level. Level 1 is the entry level (0–99 XP).
export function xpToLevel(xp: number): LevelInfo {
  const safe = Math.max(0, xp);
  const level = Math.floor(safe / XP_PER_LEVEL) + 1;
  return {
    level,
    currentLevelXp: safe % XP_PER_LEVEL,
    nextLevelXp: XP_PER_LEVEL,
  };
}

// ── Level titles ──────────────────────────────────────────────────────────
// A named rank for each level, replacing the bogus "MULTIPLIER" label. Bands
// are sized for the real XP curve (≈1 level per quiz: 100% = 100 XP = 1 level),
// so a steady learner climbs through ranks over weeks/months and "Math Mythic"
// (level 100) is a genuine long-term goal rather than reachable in one quiz.
export type LevelTier = "rookie" | "rising" | "skilled" | "sharp" | "expert" | "elite" | "legend";
export type LevelTitle = { title: string; tier: LevelTier };

const LEVEL_BANDS: { min: number; title: string; tier: LevelTier }[] = [
  { min: 1, title: "Math Rookie", tier: "rookie" },
  { min: 2, title: "Number Newbie", tier: "rookie" },
  { min: 3, title: "Quiz Explorer", tier: "rising" },
  { min: 5, title: "Problem Solver", tier: "rising" },
  { min: 7, title: "Sharp Thinker", tier: "skilled" },
  { min: 10, title: "Math Whiz", tier: "skilled" },
  { min: 14, title: "Number Ninja", tier: "sharp" },
  { min: 18, title: "Quiz Champion", tier: "sharp" },
  { min: 24, title: "Math Ace", tier: "expert" },
  { min: 30, title: "Brain Boss", tier: "expert" },
  { min: 40, title: "Math Master", tier: "elite" },
  { min: 55, title: "Grand Master", tier: "elite" },
  { min: 75, title: "Math Legend", tier: "legend" },
  { min: 100, title: "Math Mythic", tier: "legend" },
];

// Pure. Scans to the last band whose min ≤ level; clamps to level 1.
export function levelTitle(level: number): LevelTitle {
  const lvl = Math.max(1, Math.floor(level));
  let match = LEVEL_BANDS[0];
  for (const band of LEVEL_BANDS) {
    if (lvl >= band.min) match = band;
    else break;
  }
  return { title: match.title, tier: match.tier };
}

// Tier → existing cm-pill variant (globals.css has only mint/coral/amber/indigo),
// cool→warm as rank rises. The only color source for ranks — no new CSS.
export const LEVEL_TIER_PILL: Record<LevelTier, string> = {
  rookie: "mint",
  rising: "mint",
  skilled: "indigo",
  sharp: "indigo",
  expert: "amber",
  elite: "amber",
  legend: "coral",
};

// ── XP breakdown (base + capped, gated bonuses) ────────────────────────────
// Layered on calculateXp. Every bonus is capped/gated so XP can't be farmed by
// replaying quizzes. Pure + deterministic. Reasons double as XPLog.reason values.
export type XpReason =
  | "quiz_complete"
  | "perfect_score"
  | "streak_bonus"
  | "first_quiz_of_day"
  | "daily_challenge"
  | "comeback"
  | "test_complete";

export type XpBonus = { reason: XpReason; amount: number };
export type XpBreakdown = { base: number; bonuses: XpBonus[]; total: number };

export type XpBreakdownInput = {
  scorePct: number;
  streak: number; // post-quiz streak (includes today)
  isFirstToday: boolean;
  isDailyChallenge: boolean;
  isTest: boolean;
  recentAvgPct: number | null; // avg of up to 3 PRIOR quizzes (null if none)
};

export const XP_REASON_LABEL: Record<XpReason, string> = {
  quiz_complete: "Base score",
  perfect_score: "Perfect score!",
  streak_bonus: "Streak bonus",
  first_quiz_of_day: "First quiz today",
  daily_challenge: "Daily Challenge",
  comeback: "Big comeback!",
  test_complete: "Test finished",
};

const STREAK_BONUS_PER_DAY = 5;
const STREAK_BONUS_CAP = 50;

export function calculateXpBreakdown(input: XpBreakdownInput): XpBreakdown {
  const base = calculateXp(input.scorePct);
  const bonuses: XpBonus[] = [];

  if (input.scorePct >= 100) bonuses.push({ reason: "perfect_score", amount: 25 });
  if (input.streak >= 2) {
    bonuses.push({ reason: "streak_bonus", amount: Math.min(STREAK_BONUS_CAP, STREAK_BONUS_PER_DAY * input.streak) });
  }
  if (input.isFirstToday) bonuses.push({ reason: "first_quiz_of_day", amount: 20 });
  if (input.isDailyChallenge) bonuses.push({ reason: "daily_challenge", amount: 30 });
  if (input.scorePct >= 80 && input.recentAvgPct !== null && input.recentAvgPct < 50) {
    bonuses.push({ reason: "comeback", amount: 30 });
  }
  if (input.isTest) bonuses.push({ reason: "test_complete", amount: 40 });

  const total = base + bonuses.reduce((s, b) => s + b.amount, 0);
  return { base, bonuses, total };
}

// Year-month-day key in local time, used to bucket activity by calendar day.
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Counts consecutive days ending at `today` that have ≥1 quiz date.
// If today has activity it's included; otherwise the streak picks up from
// yesterday (so logging in mid-day doesn't show 0 just because the kid
// hasn't practised yet today).
export function calculateStreak(quizDates: Date[], today: Date): number {
  if (quizDates.length === 0) return 0;
  const set = new Set(quizDates.map(dayKey));

  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  if (!set.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (set.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// A streak is "at risk" when the student has an active streak they have NOT
// yet extended today — so it breaks at the next midnight unless they practise.
// Returns the streak length on the line (0 = nothing at risk / already safe).
// `minDays` suppresses the nudge for streaks too short to be worth protecting.
export function streakAtRisk(quizDates: Date[], today: Date, minDays = 1): number {
  if (quizDates.length === 0) return 0;
  const set = new Set(quizDates.map(dayKey));
  // Already practised today → the streak is safe, no reminder needed.
  if (set.has(dayKey(today))) return 0;
  const streak = calculateStreak(quizDates, today);
  return streak >= minDays ? streak : 0;
}

export type QuizSummary = {
  scorePct: number;
  topicGroupLetters: string[];
  completedAt: Date;
};

export type DetectionInput = {
  thisQuiz: {
    scorePct: number;
    durationSeconds: number;
    topicGroupLetters: string[];
    // Proctored tests run on a long timer, so the <3min speed_demon badge is
    // either unreachable or a perverse incentive — suppress it for tests.
    isTest?: boolean;
    // True when this quiz was the home Daily Challenge.
    isDailyChallenge?: boolean;
  };
  history: {
    // oldest-first, INCLUDING the quiz just completed
    quizzes: QuizSummary[];
  };
  // The student's level AFTER this quiz's XP is applied, and their lifetime
  // completed-quiz count INCLUDING this one. Both supplied by the award
  // pipeline; required so a new caller can't forget them.
  level: number;
  totalQuizzes: number;
  alreadyEarned: Set<string>;
  today: Date;
};

export type BadgeAward = {
  code: string;
  context?: Record<string, unknown>;
};

export function detectNewBadges(input: DetectionInput): BadgeAward[] {
  const { thisQuiz, history, level, totalQuizzes, alreadyEarned, today } = input;
  const awards: BadgeAward[] = [];

  // Computed once and reused by every streak-based rule below.
  const streak = calculateStreak(history.quizzes.map((q) => q.completedAt), today);

  if (history.quizzes.length === 1 && !alreadyEarned.has("first_quiz")) {
    awards.push({ code: "first_quiz" });
  }

  if (thisQuiz.scorePct >= 100 && !alreadyEarned.has("perfect_score")) {
    awards.push({ code: "perfect_score" });
  }

  if (!alreadyEarned.has("hot_streak") && history.quizzes.length >= 5) {
    const last5 = history.quizzes.slice(-5);
    if (last5.every((q) => q.scorePct >= 80)) {
      awards.push({ code: "hot_streak" });
    }
  }

  // Topic Master: 100% on one topic ≥3 times. Stored once per student in
  // Phase 2; context records which topic triggered it.
  if (!alreadyEarned.has("topic_master")) {
    const perfectByTopic = new Map<string, number>();
    for (const q of history.quizzes) {
      if (q.scorePct < 100) continue;
      for (const t of q.topicGroupLetters) {
        perfectByTopic.set(t, (perfectByTopic.get(t) ?? 0) + 1);
      }
    }
    for (const [topic, n] of perfectByTopic) {
      if (n >= 3) {
        awards.push({ code: "topic_master", context: { topicLetter: topic } });
        break;
      }
    }
  }

  if (
    !thisQuiz.isTest &&
    thisQuiz.durationSeconds < 180 &&
    thisQuiz.durationSeconds > 0 &&
    !alreadyEarned.has("speed_demon")
  ) {
    awards.push({ code: "speed_demon" });
  }

  if (thisQuiz.scorePct > 80 && !alreadyEarned.has("comeback_kid")) {
    const prior = history.quizzes.slice(0, -1);
    const thisTopics = new Set(thisQuiz.topicGroupLetters);
    const hadLowOnSharedTopic = prior.some(
      (q) => q.scorePct < 40 && q.topicGroupLetters.some((t) => thisTopics.has(t)),
    );
    if (hadLowOnSharedTopic) {
      awards.push({ code: "comeback_kid" });
    }
  }

  if (!alreadyEarned.has("dedicated") && streak >= 7) {
    awards.push({ code: "dedicated" });
  }

  // ── Expansion badges ────────────────────────────────────────────────────
  // Streak milestones (each tier guarded; a long gap that crosses several
  // tiers can grant the still-unearned ones together).
  if (!alreadyEarned.has("streak3") && streak >= 3) awards.push({ code: "streak3" });
  if (!alreadyEarned.has("streak14") && streak >= 14) awards.push({ code: "streak14" });
  if (!alreadyEarned.has("streak30") && streak >= 30) awards.push({ code: "streak30" });

  // Level milestones — `level` is the post-quiz level (earned on the quiz that
  // crosses the threshold).
  if (!alreadyEarned.has("level5") && level >= 5) awards.push({ code: "level5" });
  if (!alreadyEarned.has("level10") && level >= 10) awards.push({ code: "level10" });

  // 100% on a proctored test (a strictly harder bar than perfect_score).
  if (!alreadyEarned.has("test_ace") && thisQuiz.isTest === true && thisQuiz.scorePct >= 100) {
    awards.push({ code: "test_ace" });
  }

  // Completed a Daily Challenge.
  if (!alreadyEarned.has("daily_done") && thisQuiz.isDailyChallenge === true) {
    awards.push({ code: "daily_done" });
  }

  // Long-horizon persistence.
  if (!alreadyEarned.has("centurion") && totalQuizzes >= 100) {
    awards.push({ code: "centurion" });
  }

  return awards;
}
