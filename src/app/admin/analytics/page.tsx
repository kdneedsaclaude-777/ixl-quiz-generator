import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import Heatmap, { type HeatmapCell } from "./Heatmap";
// Heatmap is pure DOM. The recharts ones use lazy client wrappers so the
// chart bundle isn't shipped in the initial JS.
import DifficultyCurveChart from "./DifficultyCurveChartLazy";
import DropOffChart from "./DropOffChartLazy";
import QuizzesByGradeChart from "./QuizzesByGradeChartLazy";
import AnalyticsFilters from "./AnalyticsFilters";
import type { CurveRow } from "./DifficultyCurveChart";
import type { DropOffRow } from "./DropOffChart";
import type { QuizzesByGradeRow } from "./QuizzesByGradeChart";
import type { Prisma } from "@prisma/client";
import ExportButton from "./ExportButton";

export const metadata = { title: "Analytics" };

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function shortDay(k: string): string {
  const [, m, d] = k.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ gr?: string; q?: string }>;
}) {
  const _admin = await requireAdminSession();
  if (_admin.role !== "superadmin") redirect("/admin/dashboard");

  // Filter parsing — used by the "Quizzes by grade" section below. Bad values
  // are simply ignored (no error UX needed for a URL the user can re-edit).
  const { gr: grRaw, q: qRaw } = await searchParams;
  const gradeFilter =
    grRaw && /^[1-8]$/.test(grRaw) ? parseInt(grRaw, 10) : null;
  const nameFilter = (qRaw ?? "").trim();

  const since30 = new Date();
  since30.setDate(since30.getDate() - 29);
  since30.setHours(0, 0, 0, 0);

  const since7 = new Date();
  since7.setDate(since7.getDate() - 6);
  since7.setHours(0, 0, 0, 0);

  // "Quizzes by grade — 7d vs 30d" with filters. We resolve the matching
  // students first, then count their quizzes in each window. This lets the
  // grade filter and the name search work in the same query path.
  const studentWhere: Prisma.StudentWhereInput = {};
  if (gradeFilter) studentWhere.grade = gradeFilter;
  if (nameFilter) studentWhere.name = { contains: nameFilter };
  const filteredStudents = await prisma.student.findMany({
    where: studentWhere,
    select: { id: true, grade: true },
  });
  const studentIdToGrade = new Map(filteredStudents.map((s) => [s.id, s.grade]));
  const filteredIds = filteredStudents.map((s) => s.id);

  const gradeQuizzes = filteredIds.length
    ? await prisma.quiz.findMany({
        where: { studentId: { in: filteredIds }, createdAt: { gte: since30 } },
        select: { studentId: true, createdAt: true },
      })
    : [];

  const gradeCounts = new Map<number, { last7: number; last30: number }>();
  for (let g = 1; g <= 8; g++) gradeCounts.set(g, { last7: 0, last30: 0 });
  for (const q of gradeQuizzes) {
    const g = studentIdToGrade.get(q.studentId);
    if (!g) continue;
    const c = gradeCounts.get(g)!;
    c.last30 += 1;
    if (q.createdAt >= since7) c.last7 += 1;
  }
  const quizzesByGradeRows: QuizzesByGradeRow[] = [...gradeCounts.entries()]
    .map(([g, c]) => ({ grade: `G${g}`, last7: c.last7, last30: c.last30 }))
    // Hide grades with zero activity in BOTH windows so the chart focuses on
    // grades that actually have data when the filters narrow things down.
    .filter((r) => r.last7 > 0 || r.last30 > 0);

  // Heatmap: aggregate accuracy by (student.grade, topic letter) via ConceptMastery.
  const mastery = await prisma.conceptMastery.findMany({
    where: { totalAttempts: { gt: 0 } },
    include: {
      student: { select: { grade: true } },
      skill: { select: { topicGroup: { select: { letter: true } } } },
    },
  });
  type Agg = { sum: number; total: number };
  const heatAgg = new Map<string, Agg>();
  const lettersSet = new Set<string>();
  for (const m of mastery) {
    const grade = m.student.grade;
    const letter = m.skill.topicGroup.letter;
    lettersSet.add(letter);
    const key = `${grade}-${letter}`;
    const cur = heatAgg.get(key) ?? { sum: 0, total: 0 };
    cur.sum += m.totalCorrect;
    cur.total += m.totalAttempts;
    heatAgg.set(key, cur);
  }
  const letters = [...lettersSet].sort();
  const cells: HeatmapCell[] = [];
  for (const g of [1, 2, 3, 4, 5, 6, 7, 8]) {
    for (const l of letters) {
      const cur = heatAgg.get(`${g}-${l}`);
      cells.push({
        grade: g,
        letter: l,
        accuracy: cur && cur.total > 0 ? Math.round((cur.sum / cur.total) * 100) : null,
        attempts: cur?.total ?? 0,
      });
    }
  }

  // Difficulty curve: avg score per (grade, difficulty) for completed quizzes.
  const completedQuizzes = await prisma.quiz.findMany({
    where: { status: "completed", score: { not: null } },
    select: { difficulty: true, score: true, student: { select: { grade: true } } },
  });
  type DiffAgg = { sum: number; n: number };
  const diffAgg = new Map<string, DiffAgg>();
  for (const q of completedQuizzes) {
    const key = `${q.student.grade}-${q.difficulty}`;
    const cur = diffAgg.get(key) ?? { sum: 0, n: 0 };
    cur.sum += q.score ?? 0;
    cur.n += 1;
    diffAgg.set(key, cur);
  }
  const curveRows: CurveRow[] = [];
  const gradesLine = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8"];
  for (let d = 1; d <= 5; d++) {
    const row: CurveRow = { difficulty: d };
    for (const g of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const cur = diffAgg.get(`${g}-${d}`);
      if (cur && cur.n > 0) row[`G${g}`] = Math.round(cur.sum / cur.n);
    }
    curveRows.push(row);
  }

  // Drop-off: quizzes started (createdAt) vs completed (completedAt) per day.
  const recent = await prisma.quiz.findMany({
    where: { createdAt: { gte: since30 } },
    select: { createdAt: true, completedAt: true, status: true },
  });
  const dropMap = new Map<string, { started: number; completed: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since30);
    d.setDate(since30.getDate() + i);
    dropMap.set(dayKey(d), { started: 0, completed: 0 });
  }
  for (const q of recent) {
    const k = dayKey(q.createdAt);
    const cur = dropMap.get(k);
    if (cur) cur.started += 1;
    if (q.status === "completed" && q.completedAt) {
      const k2 = dayKey(q.completedAt);
      const cur2 = dropMap.get(k2);
      if (cur2) cur2.completed += 1;
    }
  }
  const dropRows: DropOffRow[] = [...dropMap.entries()].map(([k, v]) => ({
    day: shortDay(k),
    started: v.started,
    completed: v.completed,
  }));

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Platform-wide trends and drill-downs.</p>
        </div>
        <ExportButton />
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
            Quizzes by grade — last 7 days vs last 30 days
          </h2>
          <AnalyticsFilters />
        </div>
        {quizzesByGradeRows.length === 0 ? (
          <p className="mt-4 rounded border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
            No matching quizzes in the last 30 days.
          </p>
        ) : (
          <div className="mt-3">
            <QuizzesByGradeChart data={quizzesByGradeRows} />
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Grade × topic heatmap</h2>
        <div className="mt-2"><Heatmap letters={letters} cells={cells} /></div>
      </section>

      <section>
        <DifficultyCurveChart data={curveRows} grades={gradesLine} />
      </section>

      <section>
        <DropOffChart data={dropRows} />
      </section>
    </main>
  );
}
