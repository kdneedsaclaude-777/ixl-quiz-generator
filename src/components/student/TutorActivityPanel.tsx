import { prisma } from "@/lib/db";
import { parseSkillIds } from "@/lib/domain/homework";

// Read-only panel showing a student's tutor sessions + homework. Used on the
// parent's child page so parents see what the tutor scheduled, the notes from
// completed sessions, and any pinned homework. Pure server component.
export default async function TutorActivityPanel({ studentId }: { studentId: number }) {
  const [sessions, homework] = await Promise.all([
    prisma.tutorSession.findMany({
      where: { studentId },
      orderBy: { scheduledAt: "desc" },
      take: 20,
      include: { tutor: { select: { name: true } } },
    }),
    prisma.homeworkAssignment.findMany({
      where: { studentId, status: { in: ["active", "completed"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { tutor: { select: { name: true } } },
    }),
  ]);

  if (sessions.length === 0 && homework.length === 0) return null;

  const skillIds = [...new Set(homework.flatMap((h) => parseSkillIds(h.assignedSkillIds)))];
  const skills = skillIds.length
    ? await prisma.skill.findMany({ where: { id: { in: skillIds } }, select: { id: true, code: true, name: true } })
    : [];
  const skillById = new Map(skills.map((s) => [s.id, s]));

  return (
    <section className="space-y-4">
      {homework.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Homework from tutor</h2>
          <ul className="space-y-2">
            {homework.map((h) => {
              const ids = parseSkillIds(h.assignedSkillIds);
              return (
                <li key={h.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${h.status === "completed" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"}`}>{h.status}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{h.title}</span>
                    <span className="text-xs text-slate-400">· {h.tutor.name}</span>
                  </div>
                  {h.instructions && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{h.instructions}</p>}
                  {ids.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ids.map((sid) => {
                        const sk = skillById.get(sid);
                        return <span key={sid} className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">{sk ? `${sk.code} ${sk.name}` : `Skill ${sid}`}</span>;
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Tutor sessions</h2>
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${badgeStyle(s.status)}`}>{s.status}</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {new Date(s.scheduledAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                  <span className="text-xs text-slate-400">· {s.durationMin} min · {s.tutor.name}</span>
                </div>
                {s.focus && <p className="mt-1 text-sm text-slate-700 dark:text-slate-200"><span className="font-medium">Focus:</span> {s.focus}</p>}
                {s.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{s.notes}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function badgeStyle(status: string): string {
  if (status === "completed") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
  if (status === "cancelled") return "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  return "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200";
}
