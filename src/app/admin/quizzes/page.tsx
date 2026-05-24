import Link from "next/link";
import { requireAdminSession, adminScope } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import QuizzesFilters from "./QuizzesFilters";

export const metadata = { title: "Quizzes — drill down" };
const PAGE_SIZE = 25;

// One row per individual quiz (no averaging). Charts across the app link
// here with grade / name / status filters pre-applied so an admin can click a
// bar and see the real underlying quizzes — not just the aggregate.
export default async function AdminQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{
    gr?: string;
    q?: string;
    status?: string;
    day?: string;
    page?: string;
  }>;
}) {
  const admin = await requireAdminSession();
  const { gr, q, status, day, page: pageRaw } = await searchParams;

  const gradeFilter = gr && /^[1-8]$/.test(gr) ? parseInt(gr, 10) : null;
  const nameFilter = (q ?? "").trim();
  const statusFilter = ["completed", "active", "all"].includes(status ?? "")
    ? (status as "completed" | "active" | "all")
    : "completed";
  // YYYY-MM-DD only — anything else is ignored. Server reduces it to a UTC-day
  // window because Quiz.createdAt is stored UTC. Acceptable drift for the
  // dashboard chart; the chart itself counts by server-local date.
  const dayFilter = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  // Build the nested Student filter first — assembling it in-place after the
  // QuizWhereInput is typed runs into the StudentRelationFilter | StudentWhereInput
  // union and trips TS narrowing.
  const studentWhere: Prisma.StudentWhereInput = { ...adminScope(admin) };
  if (gradeFilter) studentWhere.grade = gradeFilter;
  if (nameFilter) studentWhere.name = { contains: nameFilter };

  const where: Prisma.QuizWhereInput = { student: studentWhere };
  if (statusFilter !== "all") where.status = statusFilter;
  if (dayFilter) {
    const start = new Date(`${dayFilter}T00:00:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    where.createdAt = { gte: start, lt: end };
  }

  const [total, quizzes] = await Promise.all([
    prisma.quiz.count({ where }),
    prisma.quiz.findMany({
      where,
      orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        status: true,
        score: true,
        difficulty: true,
        completedAt: true,
        createdAt: true,
        student: { select: { id: true, name: true, grade: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quizzes — drill-down</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          One row per quiz — not averages. Charts elsewhere link here with filters pre-applied.
        </p>
      </header>

      <QuizzesFilters />

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {total} quiz{total === 1 ? "" : "zes"} match
        {gradeFilter ? ` · Grade ${gradeFilter}` : ""}
        {nameFilter ? ` · name contains "${nameFilter}"` : ""}
        {statusFilter !== "completed" ? ` · status: ${statusFilter}` : ""}
        {dayFilter ? <> · day: {dayFilter} <Link href={buildHref({ gr, q, status: statusFilter })} className="ml-1 underline hover:text-slate-300">clear day</Link></> : null}
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-3 py-2">Quiz #</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2 text-center">Grade</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Score</th>
              <th className="px-3 py-2 text-center">Difficulty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 text-slate-100">
            {quizzes.map((q) => {
              const when = q.completedAt ?? q.createdAt;
              const scoreText =
                typeof q.score === "number" ? `${Math.round(q.score)}%` : "—";
              return (
                <tr key={q.id}>
                  <td className="px-3 py-2 font-mono">#{q.id}</td>
                  <td className="px-3 py-2 text-xs text-slate-300">
                    {when.toLocaleDateString("en-US")}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/parent/child/${q.student.id}`}
                      className="font-medium text-indigo-300 hover:underline"
                    >
                      {q.student.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-center">G{q.student.grade}</td>
                  <td className="px-3 py-2 text-xs text-slate-300">{q.status}</td>
                  <td className="px-3 py-2 text-right font-semibold">{scoreText}</td>
                  <td className="px-3 py-2 text-center">L{q.difficulty}</td>
                </tr>
              );
            })}
            {quizzes.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-400">No quizzes match those filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <PageLink
              page={page - 1} gr={gr} q={q} status={statusFilter} day={dayFilter ?? undefined}
            >← Prev</PageLink>
          )}
          <span className="text-slate-400">page {page} of {totalPages}</span>
          {page < totalPages && (
            <PageLink
              page={page + 1} gr={gr} q={q} status={statusFilter} day={dayFilter ?? undefined}
            >Next →</PageLink>
          )}
        </div>
      )}
    </main>
  );
}

function buildHref({ gr, q, status, day, page }: { gr?: string; q?: string; status?: string; day?: string; page?: number }): string {
  const sp = new URLSearchParams();
  if (gr) sp.set("gr", gr);
  if (q) sp.set("q", q);
  if (status && status !== "completed") sp.set("status", status);
  if (day) sp.set("day", day);
  if (page && page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/admin/quizzes${qs ? `?${qs}` : ""}`;
}

function PageLink({
  page, gr, q, status, day, children,
}: {
  page: number; gr?: string; q?: string; status: string; day?: string; children: React.ReactNode;
}) {
  return (
    <Link
      href={buildHref({ page, gr, q, status, day })}
      className="rounded border border-slate-600 bg-slate-700 px-3 py-1 text-slate-100 hover:bg-slate-600"
    >
      {children}
    </Link>
  );
}
