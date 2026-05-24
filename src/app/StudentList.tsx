"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";

export type StudentRow = {
  id: number;
  name: string;
  grade: number;
  currentDifficulty: number;
};

export default function StudentList({ students }: { students: StudentRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<StudentRow | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, students]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    setError(null);
    try {
      const res = await fetch(`/api/students/${pendingDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to delete student");
      }
      setPendingDelete(null);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete student");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <label htmlFor="student-search" className="sr-only">Search students</label>
      <input
        id="student-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name…"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
      />

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          {query ? "No students match that search." : "No students yet."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-800">
          {filtered.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={`/dashboard?studentId=${s.id}`}
                className="flex items-center gap-3 rounded-md focus-visible:outline-none"
              >
                <Avatar name={s.name} />
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{s.name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Grade {s.grade} · difficulty {s.currentDifficulty}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <Link
                  href={`/dashboard?studentId=${s.id}`}
                  className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Open dashboard →
                </Link>
                <button
                  type="button"
                  onClick={() => setPendingDelete(s)}
                  className="rounded border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950"
                  aria-label={`Delete ${s.name}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}

      {pendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 dark:bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setPendingDelete(null); }}
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <h3 id="confirm-delete-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Delete {pendingDelete.name}?
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This permanently removes the student profile, all quizzes, and progress. This can&apos;t be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId === pendingDelete.id}
                className="rounded bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deletingId === pendingDelete.id ? "Deleting…" : "Delete student"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
