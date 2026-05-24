import Link from "next/link";
import { requireTutorSession } from "@/lib/auth/server";
import { loadTutorStudents } from "@/lib/tutor";

export const metadata = { title: "My students — Tutor" };

export default async function TutorStudentsPage() {
  const tutor = await requireTutorSession();
  const students = await loadTutorStudents(tutor.userId);

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My students</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {students.length} assigned to you.
        </p>
      </header>

      {students.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          No students assigned. Ask an admin to assign students to you.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2 text-center">Grade</th>
                <th className="px-4 py-2 text-center">Difficulty</th>
                <th className="px-4 py-2 text-right">Quizzes</th>
                <th className="px-4 py-2 text-right">Avg score</th>
                <th className="px-4 py-2">Last active</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900 dark:divide-slate-700 dark:text-slate-100">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2 text-center">G{s.grade}</td>
                  <td className="px-4 py-2 text-center">L{s.difficulty}</td>
                  <td className="px-4 py-2 text-right">{s.quizzesCompleted}</td>
                  <td className="px-4 py-2 text-right">{s.avgScore !== null ? `${s.avgScore}%` : "—"}</td>
                  <td className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
                    {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/tutor/student/${s.id}`} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                      View progress
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
