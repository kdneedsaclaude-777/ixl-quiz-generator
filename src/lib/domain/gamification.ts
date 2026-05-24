// Pure gamification logic. No DB calls, no I/O.
// Implements the 7 badge rules from the Phase 2 spec.

export const XP_PER_LEVEL = 100;

// XP earned per completed quiz: 10 × score-percentage (so 100% = 100 XP).
export function calculateXp(scorePct: number): number {
  const clamped = Math.max(0, Math.min(100, scorePct));
  return Math.round(clamped * 10);
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
  };
  history: {
    // oldest-first, INCLUDING the quiz just completed
    quizzes: QuizSummary[];
  };
  alreadyEarned: Set<string>;
  today: Date;
};

export type BadgeAward = {
  code: string;
  context?: Record<string, unknown>;
};

export function detectNewBadges(input: DetectionInput): BadgeAward[] {
  const { thisQuiz, history, alreadyEarned, today } = input;
  const awards: BadgeAward[] = [];

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

  if (thisQuiz.durationSeconds < 180 && thisQuiz.durationSeconds > 0 && !alreadyEarned.has("speed_demon")) {
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

  if (!alreadyEarned.has("dedicated")) {
    const dates = history.quizzes.map((q) => q.completedAt);
    if (calculateStreak(dates, today) >= 7) {
      awards.push({ code: "dedicated" });
    }
  }

  return awards;
}
