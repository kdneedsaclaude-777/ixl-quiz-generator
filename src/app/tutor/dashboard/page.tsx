import Link from "next/link";
import { requireTutorSession } from "@/lib/auth/server";
import { loadTutorStudents } from "@/lib/tutor";
import { loadWeeklyLeaderboard, isLeaderboardEnabled } from "@/lib/leaderboard";
import { studentEmoji } from "@/lib/student-emoji";
import { levelTitle } from "@/lib/domain/gamification";
import Spark from "@/components/Spark";
import CMIcon from "@/components/CMIcon";
import OpsTrigger from "./OpsTrigger";

export const metadata = { title: "Tutor dashboard" };

export default async function TutorDashboardPage() {
  const tutor = await requireTutorSession();
  const students = await loadTutorStudents(tutor.userId);
  // Weekly cohort leaderboard (feature-flagged). The tutor isn't a competitor,
  // so pass a non-matching viewer id (-1) → no row is flagged "you".
  const leaderboard = (await isLeaderboardEnabled())
    ? await loadWeeklyLeaderboard({ kind: "cohort", tutorId: tutor.userId }, -1)
    : [];
  const leaderTop = leaderboard.slice(0, 8);
  const maxWeekXp = Math.max(1, ...leaderTop.map((r) => r.xpThisWeek));

  const withScores = students.filter((s) => s.avgScore !== null);
  const cohortAvg = withScores.length
    ? Math.round(withScores.reduce((acc, s) => acc + (s.avgScore ?? 0), 0) / withScores.length)
    : null;

  // "Active now" = active in the last 24h. "Needs attention" = avg < 60.
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const activeNow = students.filter((s) => s.lastActive && new Date(s.lastActive).getTime() >= dayAgo).length;

  const quizzesTotal = students.reduce((acc, s) => acc + s.quizzesCompleted, 0);
  const needsAttention = students.filter((s) => s.avgScore !== null && s.avgScore < 60);

  const kpis = [
    { l: "Assigned students", v: String(students.length), d: `${activeNow} active now` },
    { l: "Cohort avg score", v: cohortAvg !== null ? `${cohortAvg}%` : "—", d: "across completed quizzes" },
    { l: "Quizzes completed", v: String(quizzesTotal), d: "across cohort" },
    { l: "Needs attention", v: String(needsAttention.length), d: "below 60% avg", warn: true },
  ];

  return (
    <div className="space-y-5">
      <OpsTrigger />
      {/* header */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-500">TUTOR · {tutor.name.toUpperCase()}</div>
          <h1 className="font-display mt-1 text-[38px] leading-none text-slate-900">Your cohort</h1>
        </div>
        <Link href="/live/host" className="cm-btn coral">
          <CMIcon name="play" size={14} color="#fff" /> Start live quiz
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.l} className="cm-card p-4">
            <div className="text-xs font-semibold text-slate-500">{k.l}</div>
            <div className="font-display mt-1 text-3xl leading-none" style={{ color: k.warn ? "var(--cm-coral)" : "var(--ink)" }}>
              {k.v}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500">{k.d}</div>
          </div>
        ))}
      </div>

      {/* weekly leaderboard */}
      {leaderboard.length >= 2 && (
        <section className="cm-card p-[18px]">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-slate-900">This week&apos;s leaderboard</h2>
            <span className="text-xs text-slate-500">weekly XP</span>
          </div>
          {leaderTop.every((r) => r.xpThisWeek === 0) ? (
            <p className="py-4 text-center text-sm text-slate-400">No XP logged this week yet.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {leaderTop.map((r) => {
                const medal = r.rank === 1 ? "var(--cm-gold)" : r.rank === 2 ? "#94A3B8" : r.rank === 3 ? "#B45309" : "var(--slate-100)";
                const medalText = r.rank <= 3 ? "#fff" : "var(--slate-700)";
                return (
                  <div key={r.studentId} className="flex items-center gap-3">
                    <div
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold"
                      style={{ background: medal, color: medalText }}
                    >
                      {r.rank}
                    </div>
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cm-blue-50 text-lg">
                      {studentEmoji(r.studentId)}
                    </div>
                    <div className="w-24 shrink-0 truncate text-sm font-semibold text-slate-900">{r.name}</div>
                    <div className="flex-1">
                      <div className="cm-bar">
                        <i style={{ width: `${Math.round((r.xpThisWeek / maxWeekXp) * 100)}%`, background: "var(--cm-blue)" }} />
                      </div>
                    </div>
                    <div className="w-16 shrink-0 text-right font-mono text-xs font-semibold text-slate-700">{r.xpThisWeek} XP</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* students grid */}
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-bold text-slate-900">Students</h2>
        <span className="text-xs text-slate-500">{students.length} total</span>
      </div>

      {students.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No students assigned yet. An admin assigns students to tutors.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => {
            const active = s.lastActive ? new Date(s.lastActive).getTime() >= dayAgo : false;
            const alert = s.avgScore !== null && s.avgScore < 60;
            const tone =
              s.avgScore === null ? "var(--slate-400)" : s.avgScore >= 80 ? "var(--cm-mint)" : s.avgScore >= 60 ? "var(--cm-gold)" : "var(--cm-coral)";
            return (
              <Link key={s.id} href={`/tutor/student/${s.id}`} className="cm-card p-3.5 transition-shadow hover:shadow-pop">
                <div className="flex items-center gap-2.5">
                  <div
                    className="relative grid h-10 w-10 place-items-center rounded-xl bg-white text-[22px]"
                    style={{ border: "2px solid var(--cm-coral)" }}
                  >
                    {studentEmoji(s.id)}
                    {active && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                        style={{ background: "var(--cm-mint)", border: "2px solid #fff" }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-900">{s.name}</div>
                    <div className="text-[11px] text-slate-500">G{s.grade} · L{s.level} · {levelTitle(s.level).title}</div>
                  </div>
                  {alert && <span className="cm-pill coral" style={{ fontSize: 10, height: 20 }}>⚑ alert</span>}
                </div>
                <div className="mt-2.5 flex items-end justify-between">
                  <div>
                    <div className="font-display text-2xl leading-none" style={{ color: tone }}>
                      {s.avgScore !== null ? `${s.avgScore}%` : "—"}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500">{s.trend.length ? "LAST 5" : "NO QUIZZES"}</div>
                  </div>
                  {s.trend.length >= 2 && <Spark points={s.trend} w={120} h={36} color={tone} fill="transparent" />}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
