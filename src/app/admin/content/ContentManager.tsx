"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type ContentSkill = { id: number; code: string; name: string; active: boolean };
export type ContentGroup = { id: number; letter: string; name: string; active: boolean; skillCount: number; skills: ContentSkill[] };

// Preview-only — the canonical number comes from the server (which uses
// SELECT max(number) under the same uniqueness constraint). This client-side
// version reads off the rendered skill list, which is good enough to give
// the admin a feel for what the new code will be before they click save.
function nextNumberFor(skills: ContentSkill[]): number {
  const max = skills.reduce((m, s) => {
    const n = parseInt(s.code.split(".").pop() ?? "0", 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return max + 1;
}

export default function ContentManager({ grade, groups }: { grade: number; groups: ContentGroup[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  // Per-group "+ Add skill" form state — keyed by topic group id, holds the
  // in-flight skill name. `null` here means the form is closed for that group.
  const [adding, setAdding] = useState<Record<number, string | null>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function patchGroup(id: number, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/topic-group/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function patchSkill(id: number, active: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/skill/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addSkill(topicGroupId: number) {
    const name = (adding[topicGroupId] ?? "").trim();
    if (!name) {
      setError("Skill name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/topic-group/${topicGroupId}/skill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed.");
      // Close the form and clear its draft; router.refresh re-reads the page
      // so the new skill row appears with its server-assigned code.
      setAdding((prev) => ({ ...prev, [topicGroupId]: null }));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-slate-400">Grade</span>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
          <Link
            key={g}
            href={`/admin/content?grade=${g}`}
            className={`rounded px-3 py-1 text-sm font-medium ${
              g === grade
                ? "bg-indigo-600 text-white"
                : "border border-slate-500 bg-slate-700 text-slate-100 hover:bg-slate-600"
            }`}
          >
            Grade {g}
          </Link>
        ))}
      </div>

      {error && <p className="rounded bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-slate-400">
        Expand a topic group to see its skills. Toggle a skill off and the quiz generator stops using it immediately. <span className="text-slate-200">Click <span className="font-semibold text-indigo-300">+ Add skill</span> at the bottom of any expanded group</span> to author a new one — the code (e.g. <code className="font-mono text-slate-200">S.12</code>) is auto-assigned. Question templates live in <code className="font-mono text-slate-200">src/lib/ai/mock.ts</code> and match by skill name keywords.
      </div>

      <ul className="space-y-2">
        {groups.map((g) => (
          <li key={g.id} className="rounded-lg border border-slate-700 bg-slate-800">
            <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <button
                  type="button"
                  aria-label={expanded.has(g.id) ? "Collapse" : "Expand"}
                  onClick={() => toggleExpand(g.id)}
                  className="text-slate-300 hover:text-white"
                >
                  {expanded.has(g.id) ? "▼" : "▶"}
                </button>
                <span className="rounded bg-slate-700 px-2 py-0.5 font-mono text-xs text-slate-200">{g.letter}</span>
                {editing?.id === g.id ? (
                  <input
                    autoFocus
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    onBlur={() => editing && patchGroup(editing.id, { name: editing.name }).then(() => setEditing(null))}
                    onKeyDown={(e) => { if (e.key === "Enter" && editing) (e.target as HTMLInputElement).blur(); else if (e.key === "Escape") setEditing(null); }}
                    className="flex-1 rounded border border-slate-500 bg-slate-700 px-2 py-1 text-sm text-white"
                  />
                ) : (
                  <button onClick={() => setEditing({ id: g.id, name: g.name })} className="flex-1 text-left text-slate-100 hover:text-indigo-300" title="Click to rename">
                    {g.name}
                  </button>
                )}
                <span className="text-xs text-slate-400">{g.skillCount} skills</span>
              </div>
              <label className="inline-flex shrink-0 items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={g.active}
                  disabled={busy}
                  onChange={(e) => patchGroup(g.id, { active: e.target.checked })}
                />
                {g.active ? "Active" : "Hidden"}
              </label>
            </div>
            {expanded.has(g.id) && (
              <ul className="divide-y divide-slate-700 border-t border-slate-700">
                {g.skills.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-6 py-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-200">{s.code}</span>
                      <span className={s.active ? "text-slate-100" : "text-slate-500 line-through"}>{s.name}</span>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={s.active}
                        disabled={busy}
                        onChange={(e) => patchSkill(s.id, e.target.checked)}
                      />
                      {s.active ? "On" : "Off"}
                    </label>
                  </li>
                ))}
                <li className="flex items-center gap-3 px-6 py-2 text-sm">
                  {adding[g.id] === null || adding[g.id] === undefined ? (
                    <button
                      type="button"
                      onClick={() => setAdding((prev) => ({ ...prev, [g.id]: "" }))}
                      className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
                    >
                      + Add skill
                    </button>
                  ) : (
                    <>
                      {/* Server assigns the code on create — preview it here so the */}
                      {/* admin knows what the new chip will read after submit. */}
                      <span
                        className="rounded bg-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-400"
                        title="Auto-assigned after save"
                      >
                        {g.letter}.{nextNumberFor(g.skills)}
                      </span>
                      <input
                        autoFocus
                        value={adding[g.id] ?? ""}
                        onChange={(e) => setAdding((prev) => ({ ...prev, [g.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addSkill(g.id);
                          else if (e.key === "Escape") setAdding((prev) => ({ ...prev, [g.id]: null }));
                        }}
                        placeholder="Skill name (e.g. Multiply two-digit numbers)"
                        className="flex-1 rounded border border-slate-500 bg-slate-700 px-2 py-1 text-sm text-white placeholder:text-slate-400"
                        disabled={busy}
                      />
                      <button
                        type="button"
                        onClick={() => addSkill(g.id)}
                        disabled={busy}
                        className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdding((prev) => ({ ...prev, [g.id]: null }))}
                        disabled={busy}
                        className="text-xs text-slate-300 hover:text-white"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </li>
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
