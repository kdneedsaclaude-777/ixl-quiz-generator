import { requireAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
// Lazy chart wrappers (client components that dynamic-import recharts so
// it doesn't sit in the initial JS bundle).
import QuizzesPerDayChart from "./QuizzesPerDayChartLazy";
import AvgScorePerGradeChart from "./AvgScorePerGradeChartLazy";
import type { DayRow } from "./QuizzesPerDayChart";
import type { GradeRow } from "./AvgScorePerGradeChart";

export const metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  await requireAdminSession();

  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  since7.setHours(0, 0, 0, 0);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 29);
  since30.setHours(0, 0, 0, 0);

  const [
    parentCount,
    studentCount,
    quizCountAll,
    quizCountToday,
    activeUsers7d,
    avgScoreRow,
    recent30,
    recentCompleted,
    perGrade,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "parent", deletedAt: null } }),
    prisma.student.count(),
    prisma.quiz.count(),
    prisma.quiz.count({ where: { createdAt: { gte: startOfDay() } } }),
    prisma.user.count({ where: { role: "parent", lastLoginAt: { gte: since7 } } }),
    prisma.quiz.aggregate({
      where: { status: "completed", score: { not: null } },
      _avg: { score: true },
    }),
    prisma.quiz.findMany({
      where: { createdAt: { gte: since30 } },
      select: { createdAt: true },
    }),
    prisma.quiz.findMany({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
      take: 20,
      select: {
        id: true,
        score: true,
        completedAt: true,
        difficulty: true,
        student: { select: { name: true, grade: true } },
        questions: { select: { skill: { select: { topicGroup: { select: { letter: true } } } } } },
      },
    }),
    prisma.quiz.groupBy({
      by: ["studentId"],
      where: { status: "completed", score: { not: null } },
      _avg: { score: true },
      _count: { id: true },
    }),
  ]);

  // Build quizzes/day rows.
  const dayMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since30);
    d.setDate(since30.getDate() + i);
    dayMap.set(dayKey(d), 0);
  }
  for (const q of recent30) {
    const k = dayKey(q.createdAt);
    dayMap.set(k, (dayMap.get(k) ?? 0) + 1);
  }
  const dayRows: DayRow[] = [...dayMap.entries()].map(([day, quizzes]) => ({
    key: day,
    day: shortDay(day),
    quizzes,
  }));

  // Build avg-score-per-grade rows: join student grade in JS to avoid a 2nd query.
  const studentIds = perGrade.map((g) => g.studentId);
  const students = studentIds.length
    ? await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, grade: true },
      })
    : [];
  const gradeById = new Map(students.map((s) => [s.id, s.grade]));
  const gradeAgg = new Map<number, { sum: number; n: number; q: number }>();
  for (const g of perGrade) {
    const grade = gradeById.get(g.studentId);
    if (typeof grade !== "number") continue;
    const cur = gradeAgg.get(grade) ?? { sum: 0, n: 0, q: 0 };
    cur.sum += (g._avg.score ?? 0) * (g._count.id ?? 0);
    cur.n += g._count.id ?? 0;
    cur.q += g._count.id ?? 0;
    gradeAgg.set(grade, cur);
  }
  const gradeRows: GradeRow[] = [1, 2, 3, 4, 5, 6, 7, 8].map((g) => {
    const cur = gradeAgg.get(g);
    return {
      grade: `G${g}`,
      avgScore: cur && cur.n > 0 ? Math.round(cur.sum / cur.n) : 0,
      quizzes: cur?.q ?? 0,
    };
  });

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Platform overview.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Parents" value={parentCount.toString()} />
        <Stat label="Students" value={studentCount.toString()} />
        <Stat label="Quizzes (all)" value={quizCountAll.toString()} />
        <Stat label="Quizzes today" value={quizCountToday.toString()} />
        <Stat label="Avg score" value={avgScoreRow._avg.score !== null ? `${Math.round(avgScoreRow._avg.score)}%` : "—"} />
        <Stat label="Active 7d" value={activeUsers7d.toString()} />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <QuizzesPerDayChart data={dayRows} />
        <AvgScorePerGradeChart data={gradeRows} />
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800">
        <h2 className="border-b border-slate-700 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
          Recent quiz completions
        </h2>
        {recentCompleted.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">No quizzes have been completed yet.</p>
        ) : (
          <ul className="divide-y divide-slate-700 text-sm">
            {recentCompleted.map((q) => {
              const topics = Array.from(new Set(q.questions.map((qq) => qq.skill.topicGroup.letter)));
              return (
                <li key={q.id} className="flex flex-col gap-1 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-slate-100">{q.student.name}</span>
                    <span className="text-xs text-slate-400">G{q.student.grade} · D{q.difficulty}</span>
                  </div>
                  <div className="flex items-baseline gap-3 text-xs text-slate-300">
                    <span className="font-semibold text-slate-100">{Math.round(q.score ?? 0)}%</span>
                    <span className="font-mono text-slate-400">{topics.join(",")}</span>
                    <span className="text-slate-500">{q.completedAt?.toLocaleString() ?? ""}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-3 text-center">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function startOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shortDay(yyyymmdd: string): string {
  const [, m, d] = yyyymmdd.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}
