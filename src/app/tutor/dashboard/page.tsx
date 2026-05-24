import Link from "next/link";
import { requireTutorSession } from "@/lib/auth/server";
import { loadTutorStudents } from "@/lib/tutor";
import Avatar from "@/components/Avatar";

export const metadata = { title: "Tutor dashboard" };

export default async function TutorDashboardPage() {
  const tutor = await requireTutorSession();
  const students = await loadTutorStudents(tutor.userId);

  const withScores = students.filter((s) => s.avgScore !== null);
  const cohortAvg = withScores.length
    ? Math.round(withScores.reduce((acc, s) => acc + (s.avgScore ?? 0), 0) / withScores.length)
    : null;
  const totalQuizzes = students.reduce((acc, s) => acc + s.quizzesCompleted, 0);

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome, {tutor.name}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Progress for the {students.length} student{students.length === 1 ? "" : "s"} assigned to you.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Assigned students" value={students.length.toString()} />
        <Stat label="Quizzes completed" value={totalQuizzes.toString()} />
        <Stat label="Cohort avg score" value={cohortAvg !== null ? `${cohortAvg}%` : "—"} />
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Your students</h2>
        {students.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            No students assigned yet. An admin assigns students to tutors.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {students.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/tutor/student/${s.id}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700"
                >
                  <Avatar name={s.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{s.name}</div>
                    <div className="mt-0.5 grid grid-cols-2 gap-x-4 text-xs text-slate-600 sm:grid-cols-4 dark:text-slate-400">
                      <span>Grade {s.grade}</span>
                      <span>{s.quizzesCompleted} quizzes</span>
                      <span>Avg: {s.avgScore !== null ? `${s.avgScore}%` : "—"}</span>
                      <span>Last: {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}
