import Link from "next/link";
import { requireTutorSession } from "@/lib/auth/server";
import { loadTutorStudents } from "@/lib/tutor";
import { studentEmoji } from "@/lib/student-emoji";
import { levelTitle } from "@/lib/domain/gamification";
import CMIcon from "@/components/CMIcon";

export const metadata = { title: "My students — Tutor" };

export default async function TutorStudentsPage() {
  const tutor = await requireTutorSession();
  const students = await loadTutorStudents(tutor.userId);

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const withScores = students.filter((s) => s.avgScore !== null);
  const cohortAvg = withScores.length
    ? Math.round(withScores.reduce((acc, s) => acc + (s.avgScore ?? 0), 0) / withScores.length)
    : null;
  const activeNow = students.filter(
    (s) => s.lastActive && new Date(s.lastActive).getTime() >= dayAgo,
  ).length;

  return (
    <main className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide" style={{ color: "var(--cm-mint)" }}>
            TUTOR · MY STUDENTS
          </div>
          <h1 className="font-display mt-1 text-[38px] leading-none text-slate-900">My students</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="cm-pill mint" style={{ height: 28 }}>
            {students.length} assigned
          </span>
          <span className="cm-pill mint" style={{ height: 28 }}>
            {activeNow} active now
          </span>
          {cohortAvg !== null && (
            <span className="cm-pill mint" style={{ height: 28 }}>
              {cohortAvg}% cohort avg
            </span>
          )}
        </div>
      </header>

      {students.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No students assigned. Ask an admin to assign students to you.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => {
            const active = s.lastActive ? new Date(s.lastActive).getTime() >= dayAgo : false;
            const rank = levelTitle(s.level);
            const tone =
              s.avgScore === null
                ? "var(--slate-400)"
                : s.avgScore >= 80
                  ? "var(--cm-mint)"
                  : s.avgScore >= 60
                    ? "var(--cm-gold)"
                    : "var(--cm-coral)";
            const lastActiveLabel = s.lastActive
              ? new Date(s.lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "—";
            return (
              <Link
                key={s.id}
                href={`/tutor/student/${s.id}`}
                className="cm-card p-4 transition-shadow hover:shadow-pop"
              >
                {/* avatar + identity */}
                <div className="flex items-center gap-3">
                  <div
                    className="relative grid h-12 w-12 place-items-center rounded-2xl text-[24px]"
                    style={{ background: "var(--cm-mint-soft)", border: "2px solid var(--cm-mint)" }}
                  >
                    {studentEmoji(s.id)}
                    {active && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
                        style={{ background: "var(--cm-mint)", border: "2px solid #fff" }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold text-slate-900">{s.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="cm-pill mint" style={{ fontSize: 10, height: 18 }}>
                        G{s.grade}
                      </span>
                      <span className="truncate text-[11px] text-slate-500">
                        L{s.level} · {rank.title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* avg score with mint progress rail */}
                <div className="mt-3.5">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Avg score
                    </span>
                    <span className="font-display text-2xl leading-none" style={{ color: tone }}>
                      {s.avgScore !== null ? `${s.avgScore}%` : "—"}
                    </span>
                  </div>
                  <div className="cm-bar">
                    <i style={{ width: `${s.avgScore ?? 0}%`, background: tone }} />
                  </div>
                </div>

                {/* footer stats */}
                <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-[11px] text-slate-500" style={{ borderColor: "var(--slate-100)" }}>
                  <span className="inline-flex items-center gap-1">
                    <CMIcon name="file" size={13} color="var(--cm-mint)" />
                    {s.quizzesCompleted} quiz{s.quizzesCompleted === 1 ? "" : "zes"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CMIcon name="clock" size={13} color="var(--slate-400)" />
                    {lastActiveLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "var(--cm-mint)" }}>
                    View
                    <CMIcon name="chevron" size={13} color="var(--cm-mint)" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
