import { describe, it, expect } from "vitest";
import { BADGE_CATALOG, BADGE_BY_CODE, CATEGORY_META } from "../badge-catalog";

// The kid-facing badge catalog carries presentation copy (category + unlock
// criterion) that must stay aligned with two real sources of truth:
//   1. the seeded DB Badge rows (code/name/icon/description), and
//   2. the codes that the detection engine can actually award.
// These guards make a silent drift impossible.

// Mirror of prisma/seedAuth.ts BADGES (kept here to avoid importing the seed,
// which pulls in Prisma). If the seed changes, this test must be updated in
// lockstep with the catalog — that's the point.
const SEED_BADGES = [
  { code: "first_quiz", name: "First Quiz", description: "Completed your first quiz.", icon: "🎯" },
  { code: "perfect_score", name: "Perfect Score", description: "Scored 100% on a quiz.", icon: "💯" },
  { code: "hot_streak", name: "Hot Streak", description: "5 quizzes in a row above 80%.", icon: "🔥" },
  { code: "topic_master", name: "Topic Master", description: "Scored 100% on a topic 3 times.", icon: "🏆" },
  { code: "speed_demon", name: "Speed Demon", description: "Completed a quiz in under 3 minutes.", icon: "⚡" },
  { code: "comeback_kid", name: "Comeback Kid", description: "Scored >80% on a topic after previously scoring <40%.", icon: "🌟" },
  { code: "dedicated", name: "Dedicated", description: "Practiced 7 days in a row.", icon: "📅" },
  { code: "streak3", name: "Warming Up", description: "Practiced 3 days in a row.", icon: "🌤️" },
  { code: "streak14", name: "Two Weeks Strong", description: "Practiced 14 days in a row.", icon: "🗓️" },
  { code: "streak30", name: "Unstoppable", description: "Practiced 30 days in a row.", icon: "🚀" },
  { code: "level5", name: "Rising Star", description: "Reached Level 5.", icon: "⭐" },
  { code: "level10", name: "Math Champion", description: "Reached Level 10.", icon: "👑" },
  { code: "test_ace", name: "Test Ace", description: "Scored 100% on a real test.", icon: "🎓" },
  { code: "daily_done", name: "Daily Challenge", description: "Completed a Daily Challenge.", icon: "📍" },
  { code: "centurion", name: "Centurion", description: "Completed 100 quizzes.", icon: "🏅" },
];

// Codes detectNewBadges can award (mirrors src/lib/domain/gamification.ts).
const AWARDABLE_CODES = new Set([
  "first_quiz",
  "perfect_score",
  "hot_streak",
  "topic_master",
  "speed_demon",
  "comeback_kid",
  "dedicated",
  "streak3",
  "streak14",
  "streak30",
  "level5",
  "level10",
  "test_ace",
  "daily_done",
  "centurion",
]);

describe("badge-catalog", () => {
  it("matches the seeded DB badges (code/name/icon/description)", () => {
    expect(BADGE_CATALOG.length).toBe(SEED_BADGES.length);
    for (const seed of SEED_BADGES) {
      const def = BADGE_BY_CODE.get(seed.code);
      expect(def, `catalog missing ${seed.code}`).toBeTruthy();
      expect(def!.name).toBe(seed.name);
      expect(def!.icon).toBe(seed.icon);
      expect(def!.description).toBe(seed.description);
    }
  });

  it("only contains codes the detection engine can award", () => {
    for (const def of BADGE_CATALOG) {
      expect(AWARDABLE_CODES.has(def.code), `${def.code} is not awardable`).toBe(true);
    }
    expect(BADGE_CATALOG.length).toBe(AWARDABLE_CODES.size);
  });

  it("gives every badge a non-empty unlock line and a known category", () => {
    for (const def of BADGE_CATALOG) {
      expect(def.unlock.trim().length).toBeGreaterThan(0);
      expect(CATEGORY_META[def.category]).toBeTruthy();
    }
  });
});
