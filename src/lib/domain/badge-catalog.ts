// Single shared badge catalog. One source of truth for the kid-facing badge
// surfaces (full Badges page, home recent-badges) so the three previously
// duplicated hardcoded lists can't drift apart.
//
// `description` (past tense) mirrors the seeded DB Badge rows verbatim
// (prisma/seedAuth.ts BADGES). `unlock` (present tense, kid-friendly) is a
// derivation of the real detection rules in src/lib/domain/gamification.ts —
// a locked badge shows its category + name + this line instead of a mystery
// "???", turning every badge into a concrete goal.
//
// `category` + `unlock` are presentation copy, intentionally kept in code (not
// a DB column): the unlock text is a view of the detection rule, not user data.
// badge-catalog.test.ts guards the catalog (15 entries) against the seed +
// detection rules so it can't silently fall out of sync.

export type BadgeCategory = "milestone" | "mastery" | "speed" | "consistency" | "levels" | "tests";

export type BadgeDef = {
  code: string;
  name: string;
  icon: string;
  category: BadgeCategory;
  description: string; // earned blurb — mirrors DB Badge.description
  unlock: string; // "how to unlock" — derived from detectNewBadges
};

export const BADGE_CATALOG: BadgeDef[] = [
  {
    code: "first_quiz",
    name: "First Quiz",
    icon: "🎯",
    category: "milestone",
    description: "Completed your first quiz.",
    unlock: "Finish any quiz to earn this.",
  },
  {
    code: "perfect_score",
    name: "Perfect Score",
    icon: "💯",
    category: "mastery",
    description: "Scored 100% on a quiz.",
    unlock: "Score 100% on a quiz.",
  },
  {
    code: "hot_streak",
    name: "Hot Streak",
    icon: "🔥",
    category: "consistency",
    description: "5 quizzes in a row above 80%.",
    unlock: "Score above 80% on 5 quizzes in a row.",
  },
  {
    code: "topic_master",
    name: "Topic Master",
    icon: "🏆",
    category: "mastery",
    description: "Scored 100% on a topic 3 times.",
    unlock: "Score 100% on the same topic 3 times.",
  },
  {
    code: "speed_demon",
    name: "Speed Demon",
    icon: "⚡",
    category: "speed",
    description: "Completed a quiz in under 3 minutes.",
    unlock: "Finish a practice quiz in under 3 minutes.",
  },
  {
    code: "comeback_kid",
    name: "Comeback Kid",
    icon: "🌟",
    category: "mastery",
    description: "Scored >80% on a topic after previously scoring <40%.",
    unlock: "Score over 80% on a topic you once scored under 40% on.",
  },
  {
    code: "dedicated",
    name: "Dedicated",
    icon: "📅",
    category: "consistency",
    description: "Practiced 7 days in a row.",
    unlock: "Practise on 7 days in a row.",
  },
  // ── Expansion badges ──
  {
    code: "streak3",
    name: "Warming Up",
    icon: "🌤️",
    category: "consistency",
    description: "Practiced 3 days in a row.",
    unlock: "Practise on 3 days in a row.",
  },
  {
    code: "streak14",
    name: "Two Weeks Strong",
    icon: "🗓️",
    category: "consistency",
    description: "Practiced 14 days in a row.",
    unlock: "Practise on 14 days in a row.",
  },
  {
    code: "streak30",
    name: "Unstoppable",
    icon: "🚀",
    category: "consistency",
    description: "Practiced 30 days in a row.",
    unlock: "Practise on 30 days in a row.",
  },
  {
    code: "level5",
    name: "Rising Star",
    icon: "⭐",
    category: "levels",
    description: "Reached Level 5.",
    unlock: "Reach Level 5 by earning XP.",
  },
  {
    code: "level10",
    name: "Math Champion",
    icon: "👑",
    category: "levels",
    description: "Reached Level 10.",
    unlock: "Reach Level 10 by earning XP.",
  },
  {
    code: "test_ace",
    name: "Test Ace",
    icon: "🎓",
    category: "tests",
    description: "Scored 100% on a real test.",
    unlock: "Score 100% on a Test (not a practice quiz).",
  },
  {
    code: "daily_done",
    name: "Daily Challenge",
    icon: "📍",
    category: "milestone",
    description: "Completed a Daily Challenge.",
    unlock: "Finish a Daily Challenge from your home screen.",
  },
  {
    code: "centurion",
    name: "Centurion",
    icon: "🏅",
    category: "milestone",
    description: "Completed 100 quizzes.",
    unlock: "Complete 100 quizzes in total.",
  },
];

export const BADGE_BY_CODE: Map<string, BadgeDef> = new Map(
  BADGE_CATALOG.map((b) => [b.code, b]),
);

// Each category maps to an existing cm-pill variant (globals.css), so no new
// CSS is needed. `pill` is the cm-pill modifier class suffix.
export const CATEGORY_META: Record<BadgeCategory, { label: string; pill: string }> = {
  milestone: { label: "Milestone", pill: "indigo" },
  levels: { label: "Levels", pill: "indigo" },
  mastery: { label: "Mastery", pill: "amber" },
  tests: { label: "Tests", pill: "coral" },
  speed: { label: "Speed", pill: "coral" },
  consistency: { label: "Consistency", pill: "mint" },
};
