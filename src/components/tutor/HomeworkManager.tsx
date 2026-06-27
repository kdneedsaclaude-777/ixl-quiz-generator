"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type HomeworkRow = {
  id: string;
  title: string;
  instructions: string | null;
  assignedSkillIds: number[];
  dueAt: string | null;
  status: string;
  createdAt: string;
};

export type SkillOption = { id: number; code: string; name: string };

type Props = { studentId: number; initialHomework: HomeworkRow[]; skills: SkillOption[] };

const STATUS_STYLES: Record<string, string> = {
  active: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  archived: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export default function HomeworkManager({ studentId, initialHomework, skills }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<HomeworkRow[]>(initialHomework);
  const [creating, setCreating] = useState(false);
  const skillById = new Map(skills.map((s) => [s.id, s]));

  function onSaved(saved: HomeworkRow, isNew: boolean) {
    setItems((prev) => (isNew ? [saved, ...prev] : prev.map((h) => (h.id === saved.id ? saved : h))));
    setCreating(false);
    router.refresh();
  }

  async function setStatus(h: HomeworkRow, status: string) {
    const res = await fetch(`/api/tutor/homework/${h.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...h, status }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) onSaved(data.homework as HomeworkRow, false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this homework?")) return;
    const res = await fetch(`/api/tutor/homework/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((h) => h.id !== id));
      router.refresh();
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Homework</h2>
        {!creating && (
          <button onClick={() => setCreating(true)} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">+ Assign homework</button>
        )}
      </div>

      {creating && <HomeworkForm studentId={studentId} skills={skills} onSaved={onSaved} onCancel={() => setCreating(false)} />}

      {items.length === 0 && !creating ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No homework assigned. Pin a few skills for this student to focus on.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((h) => (
            <li key={h.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[h.status] ?? ""}`}>{h.status}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{h.title}</span>
                    {h.dueAt && <span className="text-xs text-slate-400">due {fmtDate(h.dueAt)}</span>}
                  </div>
                  {h.instructions && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{h.instructions}</p>}
                  {h.assignedSkillIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {h.assignedSkillIds.map((sid) => {
                        const sk = skillById.get(sid);
                        return <span key={sid} className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">{sk ? `${sk.code} ${sk.name}` : `Skill ${sid}`}</span>;
                      })}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {h.status !== "completed" && <button onClick={() => setStatus(h, "completed")} className="text-xs text-emerald-600 hover:underline dark:text-emerald-400">Mark done</button>}
                  {h.status !== "archived" && <button onClick={() => setStatus(h, "archived")} className="text-xs text-slate-500 hover:underline">Archive</button>}
                  <button onClick={() => remove(h.id)} className="text-xs text-rose-600 hover:underline dark:text-rose-400">Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HomeworkForm({
  studentId, skills, onSaved, onCancel,
}: {
  studentId: number;
  skills: SkillOption[];
  onSaved: (h: HomeworkRow, isNew: boolean) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/tutor/students/${studentId}/homework`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, instructions, assignedSkillIds: [...selected], dueAt: dueAt ? new Date(dueAt).toISOString() : null }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
    onSaved(data.homework as HomeworkRow, true);
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-3 rounded-md border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900 dark:bg-indigo-950/30">
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
        Title
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Fractions practice this week" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
      </label>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
        Instructions (optional)
        <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
      </label>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
        Due date (optional)
        <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
      </label>
      <div>
        <p className="mb-1 text-xs font-medium text-slate-700 dark:text-slate-200">Pin skills ({selected.size} selected)</p>
        <div className="max-h-40 overflow-y-auto rounded border border-slate-200 p-2 dark:border-slate-600">
          {skills.length === 0 ? (
            <p className="text-xs text-slate-400">No active skills for this grade.</p>
          ) : (
            skills.map((s) => (
              <label key={s.id} className="flex items-center gap-2 py-0.5 text-sm text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                <span className="font-mono text-xs text-slate-500">{s.code}</span>
                {s.name}
              </label>
            ))
          )}
        </div>
      </div>
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">{busy ? "Saving…" : "Assign"}</button>
        <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
      </div>
    </form>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
