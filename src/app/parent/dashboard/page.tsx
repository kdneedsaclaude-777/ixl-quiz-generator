import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import Avatar from "@/components/Avatar";
import VerifyBanner from "./VerifyBanner";
import SummaryCards from "./SummaryCards";
// Lazy chart client wrapper so recharts isn't in the initial JS bundle.
import ChildTrendChart from "./ChildTrendChartLazy";
import type { TrendRow, ChildSeries } from "./ChildTrendChart";

const CHILD_COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#06b6d4", "#a855f7"];

function dayKey(d: Date): string {
  // YYYY-MM-DD in local time
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function ParentDashboardPage() {
  const parent = await requireParentSession();
  const user = await prisma.user.findUnique({
    where: { id: parent.userId },
    select: { name: true, email: true, emailVerified: true },
  });

  const children = await prisma.student.findMany({
    where: { parentId: parent.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, grade: true, currentDifficulty: true, createdAt: true },
  });

  // Quizzes from the last 30 days for chart + summary computation.
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 29);
  sinceDate.setHours(0, 0, 0, 0);

  const childIds = children.map((c) => c.id);
  const quizzes = childIds.length
    ? await prisma.quiz.findMany({
        where: {
          studentId: { in: childIds },
          status: "completed",
          completedAt: { gte: sinceDate },
        },
        select: { studentId: true, score: true, completedAt: true },
      })
    : [];

  // Week summary (last 7 days).
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekQuizzes = quizzes.filter((q) => q.completedAt && q.completedAt >= weekStart && typeof q.score === "number");
  const weekAvgScore = weekQuizzes.length
    ? weekQuizzes.reduce((acc, q) => acc + (q.score ?? 0), 0) / weekQuizzes.length
    : null;

  // Hardest topic across all kids: lowest accuracy from ConceptMastery.
  const hardestTopic = await pickHardestTopic(childIds);

  // Build chart rows: one row per day for last 30 days, one numeric column per child.
  const days: TrendRow[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(sinceDate);
    d.setDate(sinceDate.getDate() + i);
    days.push({ day: `${d.getMonth() + 1}/${d.getDate()}` } as TrendRow);
  }
  const dayKeyToIdx = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(sinceDate);
    d.setDate(sinceDate.getDate() + i);
    dayKeyToIdx.set(dayKey(d), i);
  }
  const accBy = new Map<string, { sum: number; n: number }>();
  for (const q of quizzes) {
    if (!q.completedAt || typeof q.score !== "number") continue;
    const idx = dayKeyToIdx.get(dayKey(q.completedAt));
    if (idx === undefined) continue;
    const child = children.find((c) => c.id === q.studentId);
    if (!child) continue;
    const key = `${idx}:${child.name}`;
    const cur = accBy.get(key) ?? { sum: 0, n: 0 };
    cur.sum += q.score;
    cur.n += 1;
    accBy.set(key, cur);
  }
  for (let i = 0; i < 30; i++) {
    for (const c of children) {
      const v = accBy.get(`${i}:${c.name}`);
      if (v) days[i][c.name] = Math.round(v.sum / v.n);
    }
  }
  const series: ChildSeries[] = children.map((c, i) => ({ name: c.name, color: CHILD_COLORS[i % CHILD_COLORS.length] }));

  return (
    <main className="space-y-6">
      {user && !user.emailVerified && <VerifyBanner email={user.email ?? ""} />}

      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome, {user?.name ?? "Parent"}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your family's practice at a glance.
        </p>
      </header>

      <SummaryCards
        s={{
          childCount: children.length,
          weekQuizzes: weekQuizzes.length,
          weekAvgScore,
          hardestTopic,
        }}
      />

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Score trend</h2>
        <div className="mt-3">
          <ChildTrendChart data={days} children={series} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Your children</h2>
          <Link href="/onboarding" className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
            + Add child
          </Link>
        </div>
        {children.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            No children yet. Click <span className="font-semibold">+ Add child</span> to begin.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {children.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                <Avatar name={c.name} />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{c.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Grade {c.grade} · difficulty {c.currentDifficulty}</div>
                </div>
                <Link href={`/parent/child/${c.id}`} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                  Open →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

async function pickHardestTopic(childIds: number[]) {
  if (childIds.length === 0) return null;
  const mastery = await prisma.conceptMastery.findMany({
    where: { studentId: { in: childIds } },
    select: {
      totalAttempts: true,
      totalCorrect: true,
      skill: { select: { topicGroup: { select: { letter: true, name: true } } } },
    },
  });
  const byLetter = new Map<string, { letter: string; name: string; attempts: number; correct: number }>();
  for (const m of mastery) {
    const k = m.skill.topicGroup.letter;
    const cur = byLetter.get(k) ?? { letter: k, name: m.skill.topicGroup.name, attempts: 0, correct: 0 };
    cur.attempts += m.totalAttempts;
    cur.correct += m.totalCorrect;
    byLetter.set(k, cur);
  }
  const ranked = [...byLetter.values()]
    .filter((r) => r.attempts >= 3)
    .map((r) => ({ ...r, accuracy: r.correct / r.attempts }))
    .sort((a, b) => a.accuracy - b.accuracy);
  return ranked[0] ?? null;
}
