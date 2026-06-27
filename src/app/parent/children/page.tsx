import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import { studentEmoji } from "@/lib/student-emoji";
import CMIcon from "@/components/CMIcon";

export const metadata = { title: "Children — QuizSpark" };

// Standalone child list. The dashboard also shows kids inline, but this page
// is the canonical Children section reachable from the parent sidebar and
// scales better as a family adds more profiles.
export default async function ChildrenListPage() {
  const parent = await requireParentSession();

  const children = await prisma.student.findMany({
    where: { parentId: parent.userId },
    orderBy: { createdAt: "desc" },
    include: {
      topicSelections: { select: { topicGroupId: true } },
      quizzes: {
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, score: true, completedAt: true, createdAt: true },
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
      topicGroupCount: c.topicSelections.length,
      quizCount: c.quizzes.length,
      completedCount: completed.length,
      avgScore,
      lastActive: lastQuiz?.completedAt ?? lastQuiz?.createdAt ?? null,
    };
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mt-1 text-sm text-slate-500">
            {rows.length === 0
              ? "You haven't added any children yet."
              : `${rows.length} child profile${rows.length === 1 ? "" : "ren"} linked to your account.`}
          </p>
        </div>
        <Link href="/onboarding" className="cm-btn primary">
          <CMIcon name="plus" size={16} color="#fff" /> Add student
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Click <span className="font-semibold">Add student</span> to onboard your first student.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((c) => (
            <Link key={c.id} href={`/parent/child/${c.id}`} className="cm-card p-4 transition-shadow hover:shadow-pop">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl"
                  style={{ border: "2px solid var(--cm-blue)" }}
                >
                  {studentEmoji(c.id)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-500">Grade {c.grade} · {c.topicGroupCount} topic group{c.topicGroupCount === 1 ? "" : "s"}</div>
                </div>
                <div className="text-right">
                  <div
                    className="font-display text-2xl leading-none"
                    style={{ color: c.avgScore === null ? "var(--slate-400)" : c.avgScore >= 80 ? "var(--cm-mint)" : "var(--cm-gold)" }}
                  >
                    {c.avgScore === null ? "—" : `${c.avgScore}%`}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500">AVG</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{c.completedCount}/{c.quizCount} quizzes done</span>
                <span>Last: {c.lastActive ? new Date(c.lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
