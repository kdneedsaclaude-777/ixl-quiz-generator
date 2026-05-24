"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type TopicGroup = { id: number; letter: string; name: string };

export default function EditTopics({
  studentId,
  allGroups,
  selectedIds,
}: {
  studentId: number;
  allGroups: TopicGroup[];
  selectedIds: number[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set(selectedIds));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const allSelected = allGroups.length > 0 && allGroups.every((g) => selected.has(g.id));

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
      if (allSelected) for (const g of allGroups) next.delete(g.id);
      else for (const g of allGroups) next.add(g.id);
      return next;
    });
  }

  function openModal() {
    setSelected(new Set(selectedIds));
    setError(null);
    setOpen(true);
  }

  async function save() {
    setError(null);
    if (selected.size === 0) return setError("Select at least one topic group.");
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/topics`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicGroupIds: [...selected] }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to update topics");
      }
      setOpen(false);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update topics");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        Edit topics
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-topics-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 dark:bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <h3 id="edit-topics-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit topics</h3>
              <button
                type="button"
                onClick={toggleAll}
                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Adaptive quizzes will only draw from the selected topic groups.
            </p>
            <div className="mt-4 grid max-h-72 grid-cols-1 gap-2 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-950">
              {allGroups.map((g) => (
                <label key={g.id} className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm text-slate-900 hover:bg-white dark:text-slate-100 dark:hover:bg-slate-900">
                  <input type="checkbox" className="mt-0.5" checked={selected.has(g.id)} onChange={() => toggle(g.id)} />
                  <span>{g.name}</span>
                </label>
              ))}
            </div>
            {error && <p className="mt-2 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button type="button" onClick={save} disabled={saving} className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
