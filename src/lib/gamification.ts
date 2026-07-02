import { prisma } from "@/lib/db";
import {
  xpToLevel,
  detectNewBadges,
  calculateStreak,
  calculateXpBreakdown,
  type QuizSummary,
  type XpBreakdown,
} from "@/lib/domain/gamification";
import { masteryPct } from "@/lib/progress";

export type QuizContext = {
  quizId: number;
  studentId: number;
  scorePct: number;
  startedAt: Date;
  completedAt: Date;
  topicGroupLetters: string[];
  isTest?: boolean;
  isDailyChallenge?: boolean;
};

export type AwardOutcome = {
  xpEarned: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
  badges: { code: string; name: string; description: string; icon: string }[];
  breakdown: XpBreakdown;
};

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Called from the submit endpoint right after the Quiz row is marked completed
// and attempts are persisted. Loads history, runs pure detection, then writes
// XPLog + StudentBadge + Student.xp/level in a single transaction.
export async function awardXpAndBadges(ctx: QuizContext, today: Date = new Date()): Promise<AwardOutcome> {
  // Build the oldest-first history including the just-completed quiz.
  const completedQuizzes = await prisma.quiz.findMany({
    where: { studentId: ctx.studentId, status: "completed" },
    orderBy: { completedAt: "asc" },
    select: {
      id: true,
      score: true,
      completedAt: true,
      questions: {
        select: { skill: { select: { topicGroup: { select: { letter: true } } } } },
      },
    },
  });

  const history: QuizSummary[] = completedQuizzes
    .filter((q) => q.completedAt && typeof q.score === "number")
    .map((q) => ({
      scorePct: q.score as number,
      completedAt: q.completedAt as Date,
      topicGroupLetters: Array.from(new Set(q.questions.map((qq) => qq.skill.topicGroup.letter))),
    }));

  const alreadyEarned = new Set(
    (await prisma.studentBadge.findMany({
      where: { studentId: ctx.studentId },
      select: { badgeCode: true },
    })).map((r) => r.badgeCode),
  );

  const durationSeconds = Math.max(0, Math.round((ctx.completedAt.getTime() - ctx.startedAt.getTime()) / 1000));

  // ── XP breakdown (base + capped/gated bonuses) ──
  // Derive the bonus inputs from the already-loaded history (no extra query).
  const streak = calculateStreak(history.map((q) => q.completedAt), today);
  const todayKey = localDayKey(today);
  const completedToday = history.filter((q) => localDayKey(q.completedAt) === todayKey).length;
  const isFirstToday = completedToday <= 1; // history includes this quiz
  const prior = history.slice(0, -1).slice(-3); // up to 3 quizzes before this one
  const recentAvgPct = prior.length
    ? prior.reduce((s, q) => s + q.scorePct, 0) / prior.length
    : null;
  const breakdown = calculateXpBreakdown({
    scorePct: ctx.scorePct,
    streak,
    isFirstToday,
    isDailyChallenge: ctx.isDailyChallenge ?? false,
    isTest: ctx.isTest ?? false,
    recentAvgPct,
  });
  const xpEarned = breakdown.total;

  // Level is computed BEFORE detection so the level-milestone badges can read
  // the POST-quiz level (earned on the quiz that crosses the threshold).
  const student = await prisma.student.findUnique({
    where: { id: ctx.studentId },
    select: { xp: true, level: true },
  });
  const previousXp = student?.xp ?? 0;
  const previousLevel = student?.level ?? 1;
  const newXp = previousXp + xpEarned;
  const newLevelInfo = xpToLevel(newXp);

  const awards = detectNewBadges({
    thisQuiz: {
      scorePct: ctx.scorePct,
      durationSeconds,
      topicGroupLetters: ctx.topicGroupLetters,
      isTest: ctx.isTest,
      isDailyChallenge: ctx.isDailyChallenge,
    },
    history: { quizzes: history },
    level: newLevelInfo.level,
    totalQuizzes: history.length,
    alreadyEarned,
    today,
  });

  // Persist the itemized XPLog rows (base + one per bonus, each tagged with the
  // quiz so the results screen can reconstruct the exact breakdown) + the
  // Student xp/level update atomically.
  await prisma.$transaction([
    prisma.xPLog.create({
      data: { studentId: ctx.studentId, quizId: ctx.quizId, delta: breakdown.base, reason: "quiz_complete" },
    }),
    ...breakdown.bonuses.map((b) =>
      prisma.xPLog.create({
        data: { studentId: ctx.studentId, quizId: ctx.quizId, delta: b.amount, reason: b.reason },
      }),
    ),
    prisma.student.update({
      where: { id: ctx.studentId },
      data: { xp: newXp, level: newLevelInfo.level },
    }),
  ]);

  // Badges are written separately + best-effort: a unique-constraint collision
  // (a concurrent same-badge award; @@unique([studentId, badgeCode])) must NOT
  // roll back the XP/level write above. SQLite has no createMany skipDuplicates,
  // so insert individually and swallow the rare dup.
  for (const a of awards) {
    try {
      await prisma.studentBadge.create({
        data: {
          studentId: ctx.studentId,
          badgeCode: a.code,
          context: JSON.stringify({ quizId: ctx.quizId, ...a.context }),
        },
      });
    } catch {
      // already earned (unique violation) — ignore
    }
  }

  // Hydrate badge metadata for the response (icon, name, description).
  const meta = awards.length
    ? await prisma.badge.findMany({ where: { code: { in: awards.map((a) => a.code) } } })
    : [];
  const byCode = new Map(meta.map((b) => [b.code, b]));
  const badges = awards.flatMap((a) => {
    const b = byCode.get(a.code);
    if (!b) return [];
    return [{ code: b.code, name: b.name, description: b.description, icon: b.icon }];
  });

  return {
    xpEarned,
    newXp,
    newLevel: newLevelInfo.level,
    leveledUp: newLevelInfo.level > previousLevel,
    badges,
    breakdown,
  };
}

// Used by the child home page to show streak + recent badges.
export async function loadChildHomeStats(studentId: number, today: Date = new Date()) {
  const [completedQuizzes, badges, student] = await Promise.all([
    prisma.quiz.findMany({
      where: { studentId, status: "completed" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true, score: true },
      take: 200,
    }),
    prisma.studentBadge.findMany({
      where: { studentId },
      orderBy: { earnedAt: "desc" },
      include: { badge: true },
      take: 7,
    }),
    prisma.student.findUnique({
      where: { id: studentId },
      select: { xp: true, level: true },
    }),
  ]);

  const dates = completedQuizzes
    .filter((q) => q.completedAt)
    .map((q) => q.completedAt as Date);

  const { calculateStreak } = await import("@/lib/domain/gamification");
  const streak = calculateStreak(dates, today);
  const levelInfo = xpToLevel(student?.xp ?? 0);

  return {
    xp: student?.xp ?? 0,
    level: student?.level ?? levelInfo.level,
    currentLevelXp: levelInfo.currentLevelXp,
    nextLevelXp: levelInfo.nextLevelXp,
    streak,
    badges: badges.map((b) => ({
      code: b.badgeCode,
      name: b.badge.name,
      description: b.badge.description,
      icon: b.badge.icon,
      earnedAt: b.earnedAt,
    })),
    quizzesCompleted: completedQuizzes.length,
  };
}

// ── Home action-hub helpers ───────────────────────────────────────────────
// All read existing tables — no schema additions.

export type ResumableQuiz = { id: number; topicName: string; answered: number; total: number };

// A practice quiz the student started (≥1 answered question) but hasn't
// submitted. Powers the home "pick up where you left off" tile. Tests live in
// their own /child/test flow, so this only surfaces practice quizzes.
export async function loadResumableQuiz(studentId: number): Promise<ResumableQuiz | null> {
  const quiz = await prisma.quiz.findFirst({
    where: {
      studentId,
      status: "active",
      mode: "practice",
      questions: { some: { attempts: { some: {} } } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      questions: {
        select: {
          attempts: { take: 1, select: { id: true } },
          skill: { select: { topicGroup: { select: { name: true } } } },
        },
      },
    },
  });
  if (!quiz || quiz.questions.length === 0) return null;
  const total = quiz.questions.length;
  const answered = quiz.questions.filter((q) => q.attempts.length > 0).length;
  if (answered >= total) return null; // fully answered → it's the next "Start", not a resume
  // Dominant topic name across the quiz.
  const counts = new Map<string, number>();
  for (const q of quiz.questions) {
    const n = q.skill.topicGroup.name;
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  const topicName = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Practice";
  return { id: quiz.id, topicName, answered, total };
}

// ── Global Daily Challenge ─────────────────────────────────────────────────
// One challenge for EVERY student in a grade, the same for everyone on a given
// day and rotating daily — NOT based on the individual child's weak topics.
// Always the hardest difficulty. The topic is chosen by a date seed over the
// grade's active topic groups (parental-locked groups excluded for that child).
export type DailyChallenge = { letter: string; name: string };

// Days since the Unix epoch (UTC). Same integer for everyone on a calendar day,
// increments once per day → deterministic global rotation with no stored state.
function utcDayIndex(today: Date): number {
  return Math.floor(today.getTime() / 86_400_000);
}

export async function loadDailyChallenge(
  studentId: number,
  today: Date = new Date(),
): Promise<DailyChallenge | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { grade: true },
  });
  if (!student) return null;

  const groups = await prisma.topicGroup.findMany({
    where: { gradeLevel: student.grade, active: true },
    orderBy: { letter: "asc" }, // deterministic order → stable global rotation
    select: { id: true, letter: true, name: true },
  });
  if (groups.length === 0) return null;

  const { loadLockedTopicGroupIds } = await import("@/lib/parental");
  const locked = new Set(await loadLockedTopicGroupIds(studentId));
  const pool = groups.filter((g) => !locked.has(g.id));
  const usable = pool.length > 0 ? pool : groups; // all locked → fall back
  const pick = usable[utcDayIndex(today) % usable.length];
  return { letter: pick.letter, name: pick.name };
}

export type TopicHub = {
  dailyChallenge: { letter: string; name: string; mastery: number | null } | null;
  recentTopics: { letter: string; name: string; mastery: number | null }[];
};

// One query feeds both the Daily Challenge (weakest enabled topic) and the
// Quick Pick row (recently-practised enabled topics). Mastery rolls Concept
// Mastery up to the topic group using the shared masteryPct, intersected with
// the parent's enabled StudentTopicSelection.
export async function loadTopicHub(studentId: number): Promise<TopicHub> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      topicSelections: { select: { topicGroup: { select: { letter: true, name: true } } } },
      conceptMastery: {
        select: {
          totalCorrect: true,
          totalAttempts: true,
          updatedAt: true,
          skill: { select: { topicGroup: { select: { letter: true, name: true } } } },
        },
      },
    },
  });
  if (!student || student.topicSelections.length === 0) {
    return { dailyChallenge: null, recentTopics: [] };
  }

  const enabled = new Map<string, string>(); // letter → name
  for (const s of student.topicSelections) {
    enabled.set(s.topicGroup.letter, s.topicGroup.name);
  }

  const roll = new Map<string, { correct: number; attempts: number; lastUpdated: number }>();
  for (const m of student.conceptMastery) {
    const letter = m.skill.topicGroup.letter;
    if (!enabled.has(letter)) continue; // only enabled groups
    const cur = roll.get(letter) ?? { correct: 0, attempts: 0, lastUpdated: 0 };
    cur.correct += m.totalCorrect;
    cur.attempts += m.totalAttempts;
    cur.lastUpdated = Math.max(cur.lastUpdated, m.updatedAt.getTime());
    roll.set(letter, cur);
  }

  // Daily Challenge = weakest enabled topic with ≥1 attempt (ties → fewest
  // attempts). New students with no attempts fall back to the first enabled
  // topic with a null mastery so the tile reads "let's find out".
  const withAttempts = [...roll.entries()].filter(([, v]) => v.attempts > 0);
  let dailyChallenge: TopicHub["dailyChallenge"] = null;
  if (withAttempts.length > 0) {
    const [letter, v] = withAttempts
      .map(([l, val]) => [l, val] as const)
      .sort((a, b) => {
        const ma = masteryPct(a[1].correct, a[1].attempts);
        const mb = masteryPct(b[1].correct, b[1].attempts);
        if (ma !== mb) return ma - mb;
        return a[1].attempts - b[1].attempts;
      })[0];
    dailyChallenge = { letter, name: enabled.get(letter)!, mastery: masteryPct(v.correct, v.attempts) };
  } else {
    const first = [...enabled.entries()][0];
    if (first) dailyChallenge = { letter: first[0], name: first[1], mastery: null };
  }

  // Quick Pick = enabled topics, most-recently-practised first, then the rest.
  const recentTopics = [...enabled.entries()]
    .map(([letter, name]) => {
      const r = roll.get(letter);
      return {
        letter,
        name,
        mastery: r && r.attempts > 0 ? masteryPct(r.correct, r.attempts) : null,
        lastUpdated: r?.lastUpdated ?? 0,
      };
    })
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
    .slice(0, 4)
    .map(({ letter, name, mastery }) => ({ letter, name, mastery }));

  return { dailyChallenge, recentTopics };
}
