import { prisma } from "@/lib/db";
import { parseSkillIds } from "@/lib/domain/homework";

// Server component: shows the student's ACTIVE homework as a highlighted card
// on the child home page. Read-only for the student — tutors manage it.
export default async function ChildHomeworkCard({ studentId }: { studentId: number }) {
  const items = await prisma.homeworkAssignment.findMany({
    where: { studentId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  if (items.length === 0) return null;

  const allSkillIds = [...new Set(items.flatMap((h) => parseSkillIds(h.assignedSkillIds)))];
  const skills = allSkillIds.length
    ? await prisma.skill.findMany({ where: { id: { in: allSkillIds } }, select: { id: true, code: true, name: true } })
    : [];
  const skillById = new Map(skills.map((s) => [s.id, s]));

  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm dark:border-amber-700 dark:bg-amber-950/30">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-amber-900 dark:text-amber-100">📌 Homework from your tutor</h2>
      <ul className="space-y-3">
        {items.map((h) => {
          const ids = parseSkillIds(h.assignedSkillIds);
          return (
            <li key={h.id} className="rounded-xl bg-white p-3 dark:bg-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{h.title}</span>
                {h.dueAt && (
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                    due {new Date(h.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
              {h.instructions && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{h.instructions}</p>}
              {ids.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {ids.map((sid) => {
                    const sk = skillById.get(sid);
                    return <span key={sid} className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">{sk ? `${sk.code} · ${sk.name}` : `Skill ${sid}`}</span>;
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
