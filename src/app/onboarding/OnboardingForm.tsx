"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DiagnosticQuiz from "./DiagnosticQuiz";

type Group = { id: number; gradeLevel: number; letter: string; name: string };

export default function OnboardingForm({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [difficulty, setDifficulty] = useState(1);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticHint, setDiagnosticHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gradeGroups = useMemo(() => groups.filter((g) => g.gradeLevel === grade), [groups, grade]);
  const allSelected = gradeGroups.length > 0 && gradeGroups.every((g) => selected.has(g.id));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) for (const g of gradeGroups) next.delete(g.id);
      else for (const g of gradeGroups) next.add(g.id);
      return next;
    });
  }

  function onDiagnosticComplete(suggested: number) {
    setDifficulty(suggested);
    setDiagnosticHint(`Suggested starting difficulty: Level ${suggested}.`);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Enter the student's name.");
    if (selected.size === 0) return setError("Select at least one topic group.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grade,
          topicGroupIds: [...selected],
          startingDifficulty: difficulty,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to create student");
      }
      const { studentId } = await res.json();
      router.push(`/dashboard?studentId=${studentId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create student");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-900 dark:text-slate-100">Student name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
          placeholder="e.g. Alex"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-slate-900 dark:text-slate-100">Grade</label>
          <select
            id="grade"
            value={grade}
            onChange={(e) => {
              setGrade(parseInt(e.target.value, 10));
              setSelected(new Set());
              setDiagnosticHint(null);
            }}
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-slate-900 dark:text-slate-100">Starting difficulty</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value, 10))}
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
          >
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>Level {d}</option>
            ))}
          </select>
          {diagnosticHint && (
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{diagnosticHint}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowDiagnostic((s) => !s)}
          className="rounded border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 dark:hover:bg-indigo-900"
        >
          {showDiagnostic ? "Hide diagnostic" : "Take 3-question diagnostic"}
        </button>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          (Optional — helps auto-set the starting difficulty.)
        </span>
      </div>
      {showDiagnostic && <DiagnosticQuiz grade={grade} onComplete={onDiagnosticComplete} />}

      <fieldset>
        <div className="flex items-center justify-between">
          <legend className="text-sm font-medium text-slate-900 dark:text-slate-100">Topic groups</legend>
          <button
            type="button"
            onClick={toggleAll}
            disabled={gradeGroups.length === 0}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {allSelected ? "Clear all" : "Select all topics for this grade"}
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pick at least one. Add more later from the dashboard.
        </p>
        <div className="mt-3 grid max-h-72 grid-cols-1 gap-2 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-950">
          {gradeGroups.map((g) => (
            <label
              key={g.id}
              className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-white text-slate-900 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={selected.has(g.id)}
                onChange={() => toggle(g.id)}
              />
              <span>{g.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create student"}
      </button>
    </form>
  );
}
