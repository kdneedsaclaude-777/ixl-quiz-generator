import Link from "next/link";
import { resolveActiveStudent } from "@/lib/active-child";
import { buildStudentProgress } from "@/lib/progress";
import { isStudentPaid } from "@/lib/plan";
import CMIcon from "@/components/CMIcon";
import ProgressTrendChartLazy from "./ProgressTrendChartLazy";

export const metadata = { title: "My Progress — QuizSpark" };

export default async function ChildProgressPage() {
  const { student: child } = await resolveActiveStudent();
  const progress = await buildStudentProgress(child.id);
  const paid = await isStudentPaid(child.id);
  const lastScore = progress?.trend.at(-1)?.score ?? null;

  const trend =
    progress?.trend.slice(-12).map((p, i) => ({
      x: i + 1,
      label: `#${p.quizId}`,
      score: p.score,
    })) ?? [];

  return (
    <main className="space-y-5">
      <header className="flex items-center gap-3 pt-2">
        <div
          className="grid h-12 w-12 place-items-center rounded-2xl bg-white"
          style={{ border: "2px solid var(--cm-blue)" }}
          aria-hidden
        >
          <CMIcon name="chart" size={22} color="var(--cm-blue)" />
        </div>
        <div>
          <h1 className="font-display text-3xl leading-tight text-slate-900">
            My Progress 📈
          </h1>
          <p className="text-sm text-slate-500">
            {child.name} · Grade {child.grade}
          </p>
        </div>
      </header>

      {!paid ? (
        <section className="cm-card p-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "var(--cm-gold-soft)" }} aria-hidden>
            <CMIcon name="lock" size={26} color="var(--cm-gold)" />
          </div>
          <h2 className="font-display text-2xl text-slate-900">Full progress is a QuizSpark Plus feature</h2>
          {lastScore !== null ? (
            <p className="mt-2 text-sm text-slate-600">
              Your last quiz: <span className="font-bold" style={{ color: "var(--cm-mint)" }}>{lastScore}%</span>. Unlock charts,
              topic mastery, and your full history.
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Unlock charts, topic mastery, and your full quiz history.</p>
          )}
          <Link href="/parent/upgrade" className="cm-btn primary mt-4">
            See QuizSpark Plus <CMIcon name="arrow" size={16} color="#fff" />
          </Link>
        </section>
      ) : !progress || progress.totals.quizzesCompleted === 0 ? (
        <p className="cm-card border-dashed p-8 text-center text-sm text-slate-600">
          Finish a quiz and your progress will show up here! 🚀
        </p>
      ) : (
        <>
          {/* ── Stat tiles (data-forward) ── */}
          <section className="grid grid-cols-2 gap-3">
            <Stat
              icon="layers"
              tint="var(--cm-blue)"
              bg="var(--cm-blue-50)"
              label="Quizzes done"
              value={String(progress.totals.quizzesCompleted)}
            />
            <Stat
              icon="target"
              tint="var(--cm-mint)"
              bg="var(--cm-mint-soft)"
              label="Average score"
              value={progress.totals.avgScore !== null ? `${progress.totals.avgScore}%` : "—"}
            />
            <Stat
              icon="check"
              tint="var(--cm-gold)"
              bg="var(--cm-gold-soft)"
              label="Questions answered"
              value={String(progress.totals.questionsAnswered)}
            />
            <Stat
              icon="star"
              tint="var(--cm-coral)"
              bg="var(--cm-coral-soft)"
              label="Skills mastered"
              value={String(progress.masteredSkills.length)}
            />
          </section>

          {/* ── Trend chart ── */}
          <section className="cm-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <CMIcon name="spark" size={18} color="var(--cm-blue)" />
              <h2 className="text-sm font-bold text-slate-700">
                Score over your last {trend.length} quizzes
              </h2>
            </div>
            <ProgressTrendChartLazy data={trend} />
          </section>

          {/* ── Topic mastery (cm-bar rows) ── */}
          <section className="cm-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <CMIcon name="chart" size={18} color="var(--cm-mint)" />
              <h2 className="text-sm font-bold text-slate-700">
                How you&apos;re doing by topic
              </h2>
            </div>
            <ul className="space-y-3.5">
              {progress.topicMastery.map((t) => {
                const fill =
                  t.mastery >= 80
                    ? "var(--cm-mint)"
                    : t.mastery >= 50
                      ? "var(--cm-gold)"
                      : "var(--cm-coral)";
                return (
                  <li key={t.letter}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold text-slate-800">{t.name}</span>
                      <span className="font-bold" style={{ color: fill }}>
                        {t.mastery}%
                      </span>
                    </div>
                    <div className="mt-1.5 cm-bar h-3">
                      <i
                        style={{ width: `${Math.max(3, t.mastery)}%`, background: fill }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

function Stat({
  icon,
  tint,
  bg,
  label,
  value,
}: {
  icon: string;
  tint: string;
  bg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="cm-card p-4">
      <div
        className="grid h-10 w-10 place-items-center rounded-2xl"
        style={{ background: bg }}
        aria-hidden
      >
        <CMIcon name={icon} size={19} color={tint} />
      </div>
      <div className="font-display mt-2.5 text-3xl leading-none text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}
