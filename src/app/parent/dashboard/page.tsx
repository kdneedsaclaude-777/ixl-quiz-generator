import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import { studentEmoji } from "@/lib/student-emoji";
import Spark from "@/components/Spark";
import CMIcon from "@/components/CMIcon";
import VerifyBanner from "./VerifyBanner";
import NotificationBanners from "./NotificationBanners";

// Parent dashboard, rebuilt to match the design bundle (parent.jsx
// ParentDashboardMobile): a "this week" Spark card, then a card per child
// with emoji avatar, 7-day average, mini topic bars, and weak/assigned pills.
// All values are real.
export default async function ParentDashboardPage() {
  const parent = await requireParentSession();

  const user = await prisma.user.findUnique({
    where: { id: parent.userId },
    select: { name: true, email: true, emailVerified: true },
  });

  // Unread in-app notifications (billing events).
  const notifications = await prisma.notification.findMany({
    where: { userId: parent.userId, readAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, body: true, href: true },
  });

  const children = await prisma.student.findMany({
    where: { parentId: parent.userId },
    orderBy: { createdAt: "desc" },
    include: {
      conceptMastery: {
        select: { totalAttempts: true, totalCorrect: true, skill: { select: { topicGroup: { select: { name: true } } } } },
      },
      homework: { where: { status: "active" }, select: { id: true } },
    },
  });
  const childIds = children.map((c) => c.id);

  // Last 7 days of completed quizzes (family Spark + per-child average).
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekQuizzes = childIds.length
    ? await prisma.quiz.findMany({
        where: { studentId: { in: childIds }, status: "completed", completedAt: { gte: weekStart } },
        select: { studentId: true, score: true, completedAt: true },
      })
    : [];

  // Per-day average for the family Spark (7 points).
  const dayBuckets: { sum: number; n: number }[] = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
  for (const q of weekQuizzes) {
    if (!q.completedAt || typeof q.score !== "number") continue;
    const offset = Math.floor((q.completedAt.getTime() - weekStart.getTime()) / 86_400_000);
    if (offset >= 0 && offset < 7) { dayBuckets[offset].sum += q.score; dayBuckets[offset].n += 1; }
  }
  const sparkPoints = dayBuckets.map((b) => (b.n ? Math.round(b.sum / b.n) : 0));
  const hasSpark = sparkPoints.some((p) => p > 0);

  const recentByChild = new Map<number, number[]>();
  for (const q of weekQuizzes) {
    if (typeof q.score !== "number") continue;
    const arr = recentByChild.get(q.studentId) ?? [];
    arr.push(Math.round(q.score));
    recentByChild.set(q.studentId, arr);
  }

  const kid = children.map((c) => {
    const scores = recentByChild.get(c.id) ?? [];
    const avg = scores.length ? Math.round(scores.reduce((a, s) => a + s, 0) / scores.length) : null;
    const byTopic = new Map<string, { att: number; cor: number }>();
    for (const m of c.conceptMastery) {
      const k = m.skill.topicGroup.name;
      const cur = byTopic.get(k) ?? { att: 0, cor: 0 };
      cur.att += m.totalAttempts; cur.cor += m.totalCorrect;
      byTopic.set(k, cur);
    }
    const weak = [...byTopic.entries()]
      .filter(([, v]) => v.att >= 3)
      .map(([name, v]) => ({ name, acc: v.cor / v.att }))
      .sort((a, b) => a.acc - b.acc)[0]?.name ?? null;
    const bars = [...byTopic.values()].slice(0, 4).map((v) => (v.att ? Math.round((v.cor / v.att) * 100) : 0));
    while (bars.length < 4) bars.push(0);
    return { ...c, avg, weak, bars, assigned: c.homework.length };
  });

  const weekCount = weekQuizzes.length;

  return (
    <main className="mx-auto max-w-md space-y-5">
      {user && !user.emailVerified && <VerifyBanner email={user.email ?? ""} />}
      <NotificationBanners initial={notifications} />

      <header className="flex items-center justify-between pt-1">
        <div>
          <div className="text-xs text-slate-500">Good morning,</div>
          <div className="text-lg font-extrabold text-slate-900">{user?.name ?? "Parent"}</div>
        </div>
        <Link
          href="/parent/notifications"
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white"
          aria-label="Notifications"
        >
          <CMIcon name="bell" size={18} color="var(--slate-700)" />
        </Link>
      </header>

      {/* This week */}
      <section className="rounded-[20px] border border-slate-200 bg-white p-4">
        <div>
          <div className="text-xs font-semibold text-slate-500">THIS WEEK</div>
          <div className="font-display mt-1 text-3xl leading-none">
            {weekCount} quiz{weekCount === 1 ? "" : "zes"}
          </div>
        </div>
        <div className="mt-3">
          {hasSpark ? (
            <Spark
              points={sparkPoints}
              w={300}
              h={70}
              domain={[0, 100]}
              gridlines={[0, 50, 100]}
              unitSuffix="%"
              baseline
              padRight={26}
              ariaLabel="Daily average score this week, 0 to 100 percent"
            />
          ) : (
            <p className="py-4 text-center text-xs text-slate-400">No completed quizzes this week yet.</p>
          )}
        </div>
        {/* Day labels align under the plot columns, not the % gutter (padRight). */}
        <div className="flex justify-between pr-[26px] text-[10px] font-semibold text-slate-400">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
        </div>
      </section>

      {/* Students */}
      <h3 className="text-sm font-bold text-slate-700">YOUR STUDENTS</h3>
      {kid.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No students yet. <Link href="/onboarding" className="font-semibold text-cm-blue">Add a student</Link> to begin.
        </p>
      ) : (
        kid.map((c) => (
          <div key={c.id} className="cm-card p-3.5">
            <div className="flex items-center gap-3">
              <div
                className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-white text-2xl"
                style={{ border: "2px solid var(--cm-blue)" }}
              >
                {studentEmoji(c.id)}
              </div>
              <div className="flex-1">
                <div className="text-base font-bold text-slate-900">{c.name}</div>
                <div className="text-xs text-slate-500">Grade {c.grade}</div>
              </div>
              <div className="text-right">
                <div
                  className="font-display text-[22px]"
                  style={{ color: c.avg === null ? "var(--slate-400)" : c.avg >= 80 ? "var(--cm-mint)" : "var(--cm-gold)" }}
                >
                  {c.avg === null ? "—" : `${c.avg}%`}
                </div>
                <div className="text-[10px] font-semibold text-slate-500">AVG (7D)</div>
              </div>
            </div>

            <div className="mt-3 flex gap-1.5">
              {c.bars.map((p, j) => (
                <div key={j} className="flex-1">
                  <div className="cm-bar">
                    <i style={{ width: `${p}%`, background: p < 60 ? "var(--cm-coral)" : "var(--cm-blue)" }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex gap-1.5">
                {c.weak && <span className="cm-pill coral" style={{ height: 22, fontSize: 11 }}>⚠ {c.weak}</span>}
                {c.assigned > 0 && <span className="cm-pill" style={{ height: 22, fontSize: 11 }}>📌 {c.assigned} assigned</span>}
              </div>
              <Link href={`/parent/child/${c.id}`} className="cm-btn ghost" style={{ height: 32, padding: "0 14px", fontSize: 13 }}>
                View
              </Link>
            </div>
          </div>
        ))
      )}

      <Link href="/onboarding" className="cm-btn primary w-full justify-center">
        <CMIcon name="plus" size={16} color="#fff" /> Add a student
      </Link>
    </main>
  );
}
