import { requireAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export const metadata = { title: "Admin dashboard" };

type DayRow = { key: string; day: string; quizzes: number };
type GradeRow = { grade: string; avgScore: number; quizzes: number };

export default async function AdminDashboardPage() {
  await requireAdminSession();

  const since30 = new Date();
  since30.setDate(since30.getDate() - 29);
  since30.setHours(0, 0, 0, 0);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    parentCount,
    tutorCount,
    adminCount,
    studentCount,
    quizCountAll,
    doneLast24h,
    recent30,
    recentCompleted,
    perGrade,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "parent", deletedAt: null } }),
    prisma.user.count({ where: { role: "tutor", deletedAt: null } }),
    prisma.user.count({ where: { role: { in: ["superadmin", "admin", "org_admin"] }, deletedAt: null } }),
    prisma.student.count(),
    prisma.quiz.count(),
    prisma.quiz.count({ where: { status: "completed", completedAt: { gte: since24h } } }),
    prisma.quiz.findMany({ where: { createdAt: { gte: since30 } }, select: { createdAt: true } }),
    prisma.quiz.findMany({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
      take: 8,
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

  // Quizzes/day rows (last 30 days).
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
  const dayRows: DayRow[] = [...dayMap.entries()].map(([day, quizzes]) => ({ key: day, day: shortDay(day), quizzes }));
  const maxDay = Math.max(1, ...dayRows.map((r) => r.quizzes));

  // Avg-score-per-grade rows.
  const studentIds = perGrade.map((g) => g.studentId);
  const students = studentIds.length
    ? await prisma.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, grade: true } })
    : [];
  const gradeById = new Map(students.map((s) => [s.id, s.grade]));
  const gradeAgg = new Map<number, { sum: number; n: number }>();
  for (const g of perGrade) {
    const grade = gradeById.get(g.studentId);
    if (typeof grade !== "number") continue;
    const cur = gradeAgg.get(grade) ?? { sum: 0, n: 0 };
    cur.sum += (g._avg.score ?? 0) * (g._count.id ?? 0);
    cur.n += g._count.id ?? 0;
    gradeAgg.set(grade, cur);
  }
  const gradeRows: GradeRow[] = [1, 2, 3, 4, 5, 6, 7, 8].map((g) => {
    const cur = gradeAgg.get(g);
    return { grade: `G${g}`, avgScore: cur && cur.n > 0 ? Math.round(cur.sum / cur.n) : 0, quizzes: cur?.n ?? 0 };
  });

  const kpis = [
    { l: "Parents", v: parentCount, c: "#A5B4FC" },
    { l: "Tutors", v: tutorCount, c: "#86EFAC" },
    { l: "Admins", v: adminCount, c: "#FCD34D" },
    { l: "Students", v: studentCount, c: "#F0ABFC" },
    { l: "Quizzes", v: quizCountAll, c: "#67E8F9" },
    { l: "Done 24h", v: doneLast24h, c: "#FCA5A5" },
  ];

  return (
    <div className="space-y-4 text-[color:var(--shell-text)]">
      {/* header */}
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs font-semibold tracking-wide text-[color:var(--shell-muted)]">PLATFORM</div>
          <h1 className="font-display mt-1 text-4xl leading-none text-white">Dashboard</h1>
        </div>
        <span className="cm-pill" style={{ background: "rgba(255,255,255,.06)", color: "var(--shell-text)" }}>Last 30 days</span>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.l} className="rounded-2xl border p-3.5" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
            <div className="text-[11px] font-semibold tracking-wide text-[color:var(--shell-muted)]">{k.l.toUpperCase()}</div>
            <div className="font-display mt-1.5 text-2xl leading-none" style={{ color: k.c }}>{k.v.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* charts */}
      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border p-[18px]" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
          <h3 className="text-sm font-bold text-white">Quizzes per day · last 30 days</h3>
          {maxDay <= 1 && dayRows.every((d) => d.quizzes === 0) ? (
            <p className="py-12 text-center text-sm text-[color:var(--shell-muted)]">No quizzes generated in the last 30 days.</p>
          ) : (
            <>
              <div className="mt-4 flex h-40 items-end gap-1.5">
                {dayRows.map((d, i) => (
                  <div
                    key={d.key}
                    title={`${d.day}: ${d.quizzes}`}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${Math.max(4, (d.quizzes / maxDay) * 100)}%`,
                      minHeight: 4,
                      background: i === dayRows.length - 1 ? "var(--cm-coral)" : "linear-gradient(180deg, var(--cm-blue-500), var(--cm-blue))",
                    }}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-[color:var(--shell-muted)]">
                <span>{dayRows[0]?.day}</span>
                <span>{dayRows[Math.floor(dayRows.length / 2)]?.day}</span>
                <span>Today</span>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border p-[18px]" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
          <h3 className="text-sm font-bold text-white">Avg score per grade</h3>
          <div className="mt-4 grid gap-3">
            {gradeRows.map((r) => (
              <div key={r.grade} className="flex items-center gap-2.5">
                <div className="w-7 text-xs font-bold text-[color:var(--shell-muted)]">{r.grade}</div>
                <div className="h-3 flex-1 overflow-hidden rounded-full" style={{ background: "#1F2A44" }}>
                  <div
                    className="h-full"
                    style={{
                      width: `${r.avgScore}%`,
                      background: r.avgScore >= 80 ? "var(--cm-mint)" : r.avgScore >= 70 ? "var(--cm-blue-500)" : "var(--cm-gold)",
                    }}
                  />
                </div>
                <div className="w-9 text-right font-mono text-xs text-[color:var(--shell-text)]">{r.avgScore}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* activity */}
      <div className="rounded-2xl border p-[18px]" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-bold text-white">Recent quiz completions</h3>
          <span className="text-[11px] text-[color:var(--shell-muted)]">platform-wide</span>
        </div>
        {recentCompleted.length === 0 ? (
          <p className="py-6 text-center text-sm text-[color:var(--shell-muted)]">No quizzes have been completed yet.</p>
        ) : (
          <div className="mt-3">
            {recentCompleted.map((q, i) => {
              const topics = Array.from(new Set(q.questions.map((qq) => qq.skill.topicGroup.letter)));
              const score = Math.round(q.score ?? 0);
              return (
                <div
                  key={q.id}
                  className="grid items-center gap-2.5 py-2.5"
                  style={{ gridTemplateColumns: "1fr 70px 90px", borderTop: i === 0 ? "none" : "1px solid var(--shell-border)" }}
                >
                  <div className="text-[13px]">
                    <span className="font-semibold text-white">{q.student.name}</span>
                    <span className="text-[color:var(--shell-muted)]"> · G{q.student.grade} · D{q.difficulty} · </span>
                    <span className="font-mono text-[color:var(--shell-muted)]">{topics.join(",")}</span>
                  </div>
                  <div className="font-display text-lg" style={{ color: score >= 80 ? "var(--cm-mint)" : score >= 70 ? "#A5B4FC" : "var(--cm-gold)" }}>
                    {score}%
                  </div>
                  <div className="text-right text-[11px] text-[color:var(--shell-muted)]">
                    {q.completedAt ? q.completedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shortDay(yyyymmdd: string): string {
  const [, m, d] = yyyymmdd.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}
