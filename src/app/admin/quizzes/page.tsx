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
    <main className="space-y-6 text-[color:var(--shell-text)]">
      <header>
        <div className="text-xs font-semibold tracking-wide text-[color:var(--shell-muted)]">ACTIVITY</div>
        <h1 className="font-display mt-1 text-4xl leading-none text-white">Quizzes — drill-down</h1>
        <p className="mt-1.5 text-sm text-[color:var(--shell-muted)]">
          One row per quiz — not averages. Charts elsewhere link here with filters pre-applied.
        </p>
      </header>

      <QuizzesFilters />

      <p className="text-xs text-[color:var(--shell-muted)]">
        {total} quiz{total === 1 ? "" : "zes"} match
        {gradeFilter ? ` · Grade ${gradeFilter}` : ""}
        {nameFilter ? ` · name contains "${nameFilter}"` : ""}
        {statusFilter !== "completed" ? ` · status: ${statusFilter}` : ""}
        {dayFilter ? <> · day: {dayFilter} <Link href={buildHref({ gr, q, status: statusFilter })} className="ml-1 text-[#A5B4FC] underline hover:text-white">clear day</Link></> : null}
      </p>

      <div className="overflow-x-auto rounded-2xl border" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
        <div className="min-w-[680px]">
          <div
            className="grid items-center gap-2.5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--shell-muted)]"
            style={{ gridTemplateColumns: "80px 90px 1.6fr 70px 110px 80px 90px", borderBottom: "1px solid var(--shell-border)" }}
          >
            <span>Quiz #</span>
            <span>Date</span>
            <span>Student</span>
            <span className="text-center">Grade</span>
            <span>Status</span>
            <span className="text-right">Score</span>
            <span className="text-center">Difficulty</span>
          </div>
          {quizzes.map((q) => {
            const when = q.completedAt ?? q.createdAt;
            const score = typeof q.score === "number" ? Math.round(q.score) : null;
            return (
              <div
                key={q.id}
                className="grid items-center gap-2.5 px-4 py-3 text-sm"
                style={{ gridTemplateColumns: "80px 90px 1.6fr 70px 110px 80px 90px", borderBottom: "1px solid var(--shell-border)" }}
              >
                <span className="font-mono text-[color:var(--shell-muted)]">#{q.id}</span>
                <span className="text-xs text-[color:var(--shell-muted)]">{when.toLocaleDateString("en-US")}</span>
                <Link href={`/parent/child/${q.student.id}`} className="font-semibold text-[#A5B4FC] hover:underline">
                  {q.student.name}
                </Link>
                <span className="text-center font-mono text-xs">G{q.student.grade}</span>
                <span>
                  <span className={q.status === "completed" ? "cm-pill mint" : "cm-pill"} style={{ height: 22, fontSize: 11 }}>{q.status}</span>
                </span>
                <span
                  className="text-right font-display text-lg"
                  style={{ color: score === null ? "var(--shell-muted)" : score >= 80 ? "var(--cm-mint)" : score >= 70 ? "#A5B4FC" : "var(--cm-gold)" }}
                >
                  {score === null ? "—" : `${score}%`}
                </span>
                <span className="text-center font-mono text-xs">L{q.difficulty}</span>
              </div>
            );
          })}
          {quizzes.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[color:var(--shell-muted)]">No quizzes match those filters.</div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <PageLink
              page={page - 1} gr={gr} q={q} status={statusFilter} day={dayFilter ?? undefined}
            >← Prev</PageLink>
          )}
          <span className="text-[color:var(--shell-muted)]">page {page} of {totalPages}</span>
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
      className="rounded-full border border-[color:var(--shell-border)] bg-white/5 px-3.5 py-1 text-[color:var(--shell-text)] hover:bg-white/10"
    >
      {children}
    </Link>
  );
}
