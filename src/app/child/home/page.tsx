import Link from "next/link";
import { resolveActiveStudent } from "@/lib/active-child";
import { prisma } from "@/lib/db";
import { loadChildHomeStats } from "@/lib/gamification";
import { loadPracticeDecision } from "@/lib/parental";
import Avatar from "@/components/Avatar";
import StartPracticeButton from "./StartPracticeButton";
import XPBar from "./XPBar";
import BadgeShowcase from "./BadgeShowcase";
import LockScreen from "./LockScreen";

export const metadata = { title: "Practice — IXL Quiz" };

export default async function ChildHomePage() {
  const { student: child } = await resolveActiveStudent();

  const decision = await loadPracticeDecision(child.id);
  if (!decision.allowed) {
    return (
      <LockScreen
        reason={decision.reason!}
        detail={decision.detail}
        windowStart={decision.windowStart}
        windowEnd={decision.windowEnd}
        childName={child.name}
      />
    );
  }

  const [stats, lastQuiz] = await Promise.all([
    loadChildHomeStats(child.id),
    prisma.quiz.findFirst({
      where: { studentId: child.id, status: "completed" },
      orderBy: { completedAt: "desc" },
      select: { id: true, score: true, questions: { select: { id: true } } },
    }),
  ]);

  let lastScore: { correct: number; total: number; pct: number } | null = null;
  if (lastQuiz && typeof lastQuiz.score === "number") {
    const total = lastQuiz.questions.length;
    const correct = Math.round((lastQuiz.score / 100) * total);
    lastScore = { correct, total, pct: Math.round(lastQuiz.score) };
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <Avatar name={child.name} size={88} />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Hi there,</p>
          <h1 className="text-4xl font-extrabold text-amber-900 sm:text-5xl dark:text-amber-100">{child.name}!</h1>
          <p className="mt-2 inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
            Grade {child.grade} · Difficulty {child.currentDifficulty}
          </p>
          <p className="mt-2 text-xs">
            <Link
              href="/child/account"
              className="font-semibold text-amber-700 underline hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
            >
              ⚙️ My account
            </Link>
          </p>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <XPBar level={stats.level} currentLevelXp={stats.currentLevelXp} nextLevelXp={stats.nextLevelXp} />
        <StreakCard streak={stats.streak} quizzesCompleted={stats.quizzesCompleted} />
      </section>

      <section className="flex flex-col items-center gap-3 rounded-3xl border-2 border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-800/50 dark:bg-amber-950/40">
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">Ready for some math?</p>
        <StartPracticeButton studentId={child.id} />
        <p className="text-xs text-amber-800 dark:text-amber-200">10 questions · about 5 minutes</p>
        <Link
          href="/child/progress"
          className="mt-1 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-amber-800 shadow-sm hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/70"
        >
          📈 See my progress
        </Link>
      </section>

      {lastScore && (
        <section className="rounded-2xl border-2 border-emerald-200 bg-white p-5 text-center shadow-sm dark:border-emerald-700/50 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Your last quiz</p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-900 dark:text-emerald-200">{lastScore.correct}/{lastScore.total}</p>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{lastScore.pct}%</p>
          <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-200">
            {lastScore.pct >= 80 ? "Nice work! 🌟" : lastScore.pct >= 50 ? "Good effort — keep going! 💪" : "Practice makes progress. You've got this! 🚀"}
          </p>
        </section>
      )}

      <BadgeShowcase earned={stats.badges} />
    </main>
  );
}

function StreakCard({ streak, quizzesCompleted }: { streak: number; quizzesCompleted: number }) {
  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-white p-5 text-center shadow-sm dark:border-amber-800/50 dark:bg-slate-800">
      <div className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Streak</div>
      <div className="mt-1 text-4xl font-extrabold text-amber-900 dark:text-amber-100">
        {streak > 0 ? `🔥 ${streak}` : "—"}
      </div>
      <div className="text-xs text-amber-800 dark:text-amber-200">
        {streak > 0 ? `${streak}-day streak!` : "Take a quiz to start a streak."}
      </div>
      <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">{quizzesCompleted} quizzes total</div>
    </div>
  );
}
