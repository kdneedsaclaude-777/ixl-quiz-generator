import Link from "next/link";
import { resolveActiveStudent } from "@/lib/active-child";
import { buildStudentProgress } from "@/lib/progress";
import ProgressTrendChartLazy from "./ProgressTrendChartLazy";
import DataExportMenu from "@/components/DataExportMenu";

export const metadata = { title: "My Progress — IXL Quiz" };

export default async function ChildProgressPage() {
  const { student: child } = await resolveActiveStudent();
  const progress = await buildStudentProgress(child.id);

  const trend =
    progress?.trend.slice(-12).map((p, i) => ({
      x: i + 1,
      label: `#${p.quizId}`,
      score: p.score,
    })) ?? [];

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-amber-900 dark:text-amber-100">
            My Progress 📈
          </h1>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            {child.name} · Grade {child.grade}
          </p>
        </div>
        <Link
          href="/child/home"
          className="self-start rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-900 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-100"
        >
          ← Back home
        </Link>
      </header>

      {!progress || progress.totals.quizzesCompleted === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-amber-300 bg-white p-8 text-center text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
          Finish a quiz and your progress will show up here! 🚀
        </p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Quizzes done" value={String(progress.totals.quizzesCompleted)} />
            <Stat
              label="Average score"
              value={progress.totals.avgScore !== null ? `${progress.totals.avgScore}%` : "—"}
            />
            <Stat label="Questions answered" value={String(progress.totals.questionsAnswered)} />
            <Stat label="Skills mastered" value={String(progress.masteredSkills.length)} />
          </section>

          <section className="rounded-2xl border-2 border-amber-200 bg-white p-5 dark:border-amber-800/50 dark:bg-amber-950/20">
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Score over your last {trend.length} quizzes
            </h2>
            <div className="mt-3">
              <ProgressTrendChartLazy data={trend} />
            </div>
          </section>

          <section className="rounded-2xl border-2 border-amber-200 bg-white p-5 dark:border-amber-800/50 dark:bg-amber-950/20">
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              How you&apos;re doing by topic
            </h2>
            <ul className="mt-4 space-y-3">
              {progress.topicMastery.map((t) => (
                <li key={t.letter}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{t.name}</span>
                    <span className="font-bold text-amber-800 dark:text-amber-200">{t.mastery}%</span>
                  </div>
                  <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-900/40">
                    <div
                      className={`h-full rounded-full ${
                        t.mastery >= 80
                          ? "bg-emerald-500"
                          : t.mastery >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.max(3, t.mastery)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border-2 border-amber-200 bg-white p-5 dark:border-amber-800/50 dark:bg-amber-950/20">
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Take your progress with you
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Download everything — quizzes, scores, and topic mastery.
            </p>
            <div className="mt-3">
              <DataExportMenu studentId={child.id} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-white p-4 text-center dark:border-amber-800/50 dark:bg-amber-950/20">
      <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold text-amber-900 dark:text-amber-100">{value}</div>
    </div>
  );
}
