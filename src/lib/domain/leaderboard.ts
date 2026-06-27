// Pure leaderboard logic (week boundary + ranking). No DB — testable in
// isolation, mirroring the pure/pipeline split used by gamification.

export type LeaderboardRow = {
  studentId: number;
  name: string;
  xpThisWeek: number;
  rank: number;
  isYou: boolean;
};

export type RankInput = {
  studentId: number;
  name: string;
  xpThisWeek: number;
  firstXpAt: number | null; // epoch ms of first XP this week (tiebreak), null if none
};

// Monday 00:00 local. The leaderboard is weekly so it resets and a newcomer can
// top it — it never becomes an all-time veteran trophy case.
export function startOfWeek(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? 6 : day - 1; // back up to Monday
  d.setDate(d.getDate() - diff);
  return d;
}

// Standard competition ranking (1,2,2,4): equal weekly XP shares a rank. Ties
// broken by earlier first-XP, then studentId for determinism.
export function rankWeeklyRows(members: RankInput[], viewerStudentId: number): LeaderboardRow[] {
  const sorted = [...members].sort(
    (a, b) =>
      b.xpThisWeek - a.xpThisWeek ||
      (a.firstXpAt ?? Infinity) - (b.firstXpAt ?? Infinity) ||
      a.studentId - b.studentId,
  );
  let lastXp: number | null = null;
  let lastRank = 0;
  return sorted.map((m, i) => {
    const rank = lastXp !== null && m.xpThisWeek === lastXp ? lastRank : i + 1;
    lastXp = m.xpThisWeek;
    lastRank = rank;
    return {
      studentId: m.studentId,
      name: m.name,
      xpThisWeek: Math.max(0, m.xpThisWeek),
      rank,
      isYou: m.studentId === viewerStudentId,
    };
  });
}
