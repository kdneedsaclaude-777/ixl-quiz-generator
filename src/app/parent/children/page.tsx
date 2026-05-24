import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import Avatar from "@/components/Avatar";
import DifficultyBadge from "@/app/dashboard/DifficultyBadge";

export const metadata = { title: "Children — IXL Quiz" };

// Standalone child list. The dashboard also shows kids inline, but this page
// is the canonical Children section reachable from the parent navbar and
// scales better as a family adds more profiles.
export default async function ChildrenListPage() {
  const parent = await requireParentSession();

  // Pull a few rollup stats per child so the list is useful at a glance.
  const children = await prisma.student.findMany({
    where: { parentId: parent.userId },
    orderBy: { createdAt: "desc" },
    include: {
      topicSelections: { select: { topicGroupId: true } },
      quizzes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          score: true,
          completedAt: true,
          createdAt: true,
        },
      },
    },
  });

  const rows = children.map((c) => {
    const completed = c.quizzes.filter((q) => q.status === "completed" && typeof q.score === "number");
    const avgScore = completed.length
      ? Math.round(completed.reduce((acc, q) => acc + (q.score ?? 0), 0) / completed.length)
      : null;
    const lastQuiz = c.quizzes[0];
    return {
      id: c.id,
      name: c.name,
      grade: c.grade,
      difficulty: c.currentDifficulty,
      topicGroupCount: c.topicSelections.length,
      quizCount: c.quizzes.length,
      completedCount: completed.length,
      avgScore,
      // Fall back to createdAt so an in-progress quiz still counts as recent
      // activity instead of showing "—".
      lastActive: lastQuiz?.completedAt ?? lastQuiz?.createdAt ?? null,
      createdAt: c.createdAt,
    };
  });

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your children</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {rows.length === 0
              ? "You haven't added any children yet."
              : `${rows.length} child profile${rows.length === 1 ? "" : "ren"} linked to your account.`}
          </p>
        </div>
        <Link
          href="/onboarding"
          className="rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Add child
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Click <span className="font-semibold">+ Add child</span> to onboard your first student.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id}>
              <Link
                href={`/parent/child/${c.id}`}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-300 sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700"
              >
                <Avatar name={c.name} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{c.name}</div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Grade {c.grade}
                    </span>
                    <DifficultyBadge level={c.difficulty} />
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-600 sm:grid-cols-4 dark:text-slate-400">
                    <span>{c.topicGroupCount} topic group{c.topicGroupCount === 1 ? "" : "s"}</span>
                    <span>{c.completedCount}/{c.quizCount} quizzes done</span>
                    <span>Avg: {c.avgScore !== null ? `${c.avgScore}%` : "—"}</span>
                    <span>
                      Last: {c.lastActive ? new Date(c.lastActive).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
