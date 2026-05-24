import { prisma } from "@/lib/db";

// Single source of truth for "how is this student doing over time", shared by
// the student progress dashboard and the data-portability export so the UI
// and the downloaded file can never disagree.

export type ScorePoint = { quizId: number; date: string; score: number };
export type TopicMastery = {
  letter: string;
  name: string;
  mastery: number; // 0–100
  attempts: number;
};
export type StudentProgress = {
  studentId: number;
  studentName: string;
  grade: number;
  currentDifficulty: number;
  totals: {
    quizzesCompleted: number;
    avgScore: number | null;
    questionsAnswered: number;
    correctRate: number | null;
  };
  trend: ScorePoint[]; // completed quizzes, oldest → newest
  topicMastery: TopicMastery[];
  masteredSkills: { code: string; name: string }[];
};

// --- pure shaping helpers (unit-tested without a DB) ---------------------

export function masteryPct(totalCorrect: number, totalAttempts: number): number {
  if (totalAttempts <= 0) return 0;
  return Math.round((totalCorrect / totalAttempts) * 100);
}

export function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, n) => a + n, 0) / nums.length);
}

// A skill counts as "mastered" once it has real attempts and a high hit rate.
export function isMastered(totalCorrect: number, totalAttempts: number): boolean {
  return totalAttempts >= 3 && totalCorrect / totalAttempts >= 0.8;
}

type RawQuiz = { id: number; score: number | null; completedAt: Date | null };

export function buildTrend(quizzes: RawQuiz[]): ScorePoint[] {
  return quizzes
    .filter((q) => q.completedAt && typeof q.score === "number")
    .sort((a, b) => a.completedAt!.getTime() - b.completedAt!.getTime())
    .map((q) => ({
      quizId: q.id,
      date: q.completedAt!.toISOString(),
      score: Math.round(q.score!),
    }));
}

// --- DB-backed assembly --------------------------------------------------

export async function buildStudentProgress(
  studentId: number,
): Promise<StudentProgress | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      grade: true,
      currentDifficulty: true,
      quizzes: {
        where: { status: "completed" },
        select: { id: true, score: true, completedAt: true },
      },
      conceptMastery: {
        select: {
          totalAttempts: true,
          totalCorrect: true,
          skill: {
            select: {
              code: true,
              name: true,
              topicGroup: { select: { letter: true, name: true } },
            },
          },
        },
      },
    },
  });
  if (!student) return null;

  const trend = buildTrend(student.quizzes);
  const scores = trend.map((t) => t.score);

  // Roll concept mastery up to the topic-group level.
  const byGroup = new Map<
    string,
    { letter: string; name: string; correct: number; attempts: number }
  >();
  let totalCorrect = 0;
  let totalAttempts = 0;
  const masteredSkills: { code: string; name: string }[] = [];

  for (const m of student.conceptMastery) {
    totalCorrect += m.totalCorrect;
    totalAttempts += m.totalAttempts;
    const g = m.skill.topicGroup;
    const cur = byGroup.get(g.letter) ?? {
      letter: g.letter,
      name: g.name,
      correct: 0,
      attempts: 0,
    };
    cur.correct += m.totalCorrect;
    cur.attempts += m.totalAttempts;
    byGroup.set(g.letter, cur);
    if (isMastered(m.totalCorrect, m.totalAttempts)) {
      masteredSkills.push({ code: m.skill.code, name: m.skill.name });
    }
  }

  const topicMastery: TopicMastery[] = [...byGroup.values()]
    .map((g) => ({
      letter: g.letter,
      name: g.name,
      mastery: masteryPct(g.correct, g.attempts),
      attempts: g.attempts,
    }))
    .sort((a, b) => a.letter.localeCompare(b.letter));

  return {
    studentId: student.id,
    studentName: student.name,
    grade: student.grade,
    currentDifficulty: student.currentDifficulty,
    totals: {
      quizzesCompleted: trend.length,
      avgScore: average(scores),
      questionsAnswered: totalAttempts,
      correctRate: masteryPct(totalCorrect, totalAttempts) || (totalAttempts ? 0 : null),
    },
    trend,
    topicMastery,
    masteredSkills: masteredSkills.sort((a, b) => a.code.localeCompare(b.code)),
  };
}
