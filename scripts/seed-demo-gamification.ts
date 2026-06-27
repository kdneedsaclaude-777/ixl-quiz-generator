/**
 * Demo gamification seed — populates rich, deterministic history for the two
 * demo students (ada G2, ben G6) so every gamification surface shows real
 * numbers during a client demo: XP/level + level title, multi-day streaks,
 * weekly leaderboard (family + tutor cohort), last-quiz card, parent score
 * sparks, weak topics / daily challenge / quick-pick, and earned badges.
 *
 * Idempotent: it wipes ONLY these two demo students' generated history, then
 * recreates it. Safe to re-run. Touches no other users' data.
 *
 *   npx tsx scripts/seed-demo-gamification.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// XP math mirrored from src/lib/domain/gamification.ts (100% = 100 XP, 100/level).
const xpForScore = (score: number) => Math.round(Math.max(0, Math.min(100, score)));
const levelForXp = (xp: number) => Math.floor(Math.max(0, xp) / 100) + 1;

type Plan = {
  email: string;
  scores: number[]; // one completed quiz per recent consecutive day (newest last)
  weakGroupIndex: number; // which enabled topic group is the "weak" one
  badges: string[]; // StudentBadge codes to grant
};

const PLANS: Plan[] = [
  {
    // Ben — engaged G6 learner: ~level 11, 12-day streak, a perfect score,
    // a long hot streak. Tops the leaderboard.
    email: "ben@demo.local",
    scores: [70, 82, 88, 80, 91, 100, 84, 95, 80, 92, 86, 89],
    weakGroupIndex: 1,
    badges: ["first_quiz", "perfect_score", "hot_streak", "streak3", "dedicated", "level5", "level10"],
  },
  {
    // Ada — newer G2 learner: ~level 6, 7-day streak, no perfect yet.
    email: "ada@demo.local",
    scores: [60, 72, 68, 75, 80, 70, 78],
    weakGroupIndex: 0,
    badges: ["first_quiz", "streak3", "dedicated", "level5"],
  },
];

function atDaysAgo(n: number): Date {
  const d = new Date();
  d.setHours(18, 30, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

async function seedStudent(plan: Plan): Promise<void> {
  const student = await prisma.student.findFirst({
    where: { account: { email: plan.email } },
    include: { topicSelections: { include: { topicGroup: { include: { skills: true } } } } },
  });
  if (!student) {
    console.warn(`  ! ${plan.email}: no student found, skipping`);
    return;
  }

  // Wipe this student's generated history (XPLog/StudentBadge/ConceptMastery,
  // and Quizzes which cascade their Attempts).
  await prisma.xPLog.deleteMany({ where: { studentId: student.id } });
  await prisma.studentBadge.deleteMany({ where: { studentId: student.id } });
  await prisma.conceptMastery.deleteMany({ where: { studentId: student.id } });
  await prisma.quiz.deleteMany({ where: { studentId: student.id } });

  // ── ConceptMastery: vary accuracy per skill; the chosen group is "weak"
  //    (drives weak topics + the daily challenge + quick-pick mastery bars).
  const groups = student.topicSelections.map((s) => s.topicGroup);
  let cmCount = 0;
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const weak = gi === plan.weakGroupIndex;
    const skills = g.skills.slice(0, 8); // cap per group
    for (let si = 0; si < skills.length; si++) {
      const sk = skills[si];
      const attempts = 3 + ((si + gi) % 5); // 3..7
      // Weak group ~35–55%, others ~70–95%.
      const acc = weak ? 0.35 + ((si % 3) * 0.1) : 0.7 + ((si % 3) * 0.12);
      const correct = Math.min(attempts, Math.round(attempts * acc));
      await prisma.conceptMastery.create({
        data: {
          studentId: student.id,
          skillId: sk.id,
          totalAttempts: attempts,
          totalCorrect: correct,
          consecutiveCorrect: weak ? 0 : (si % 3),
          failedQuizzes: weak ? 1 : 0,
          remediationFlag: weak && si === 0,
          lastDifficulty: student.currentDifficulty,
          lastQuizScore: Math.round(acc * 100),
          updatedAt: atDaysAgo(si % 6),
        },
      });
      cmCount++;
    }
  }

  // ── Completed quizzes, one per recent consecutive day (newest = today).
  //    0 questions on purpose — all reading views guard for it, and it keeps
  //    the seed fast. Each grants an XPLog row (this-week rows feed the board).
  const n = plan.scores.length;
  let totalXp = 0;
  for (let i = 0; i < n; i++) {
    const score = plan.scores[i];
    const daysAgo = n - 1 - i; // oldest first → today last
    const when = atDaysAgo(daysAgo);
    const quiz = await prisma.quiz.create({
      data: {
        studentId: student.id,
        status: "completed",
        score,
        difficulty: student.currentDifficulty,
        mode: "practice",
        generatedBy: "adaptive",
        startedAt: when,
        createdAt: when,
        completedAt: when,
      },
      select: { id: true },
    });
    const delta = xpForScore(score);
    totalXp += delta;
    await prisma.xPLog.create({
      data: { studentId: student.id, quizId: quiz.id, delta, reason: "quiz_complete", createdAt: when },
    });
  }

  // ── Student XP/level (invariant: Student.xp === sum(XPLog.delta)).
  await prisma.student.update({
    where: { id: student.id },
    data: { xp: totalXp, level: levelForXp(totalXp) },
  });

  // ── Earned badges (spread earnedAt over recent days).
  for (let b = 0; b < plan.badges.length; b++) {
    await prisma.studentBadge.create({
      data: {
        studentId: student.id,
        badgeCode: plan.badges[b],
        earnedAt: atDaysAgo(plan.badges.length - 1 - b),
        context: JSON.stringify({ seeded: true }),
      },
    });
  }

  console.log(
    `  ✓ ${student.name} (${plan.email}): ${n} quizzes, ${totalXp} XP → L${levelForXp(totalXp)}, ` +
      `${cmCount} skills, ${plan.badges.length} badges`,
  );
}

(async () => {
  console.log("Seeding demo gamification data…");
  for (const plan of PLANS) await seedStudent(plan);
  await prisma.$disconnect();
  console.log("Done.");
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
