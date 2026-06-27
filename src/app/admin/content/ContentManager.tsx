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
    <div className="space-y-4 text-[color:var(--shell-text)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--shell-muted)]">Grade</span>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
          <Link
            key={g}
            href={`/admin/content?grade=${g}`}
            className="rounded-full px-3 py-1 text-sm font-semibold"
            style={
              g === grade
                ? { background: "#6366F1", color: "#fff" }
                : { background: "rgba(255,255,255,.05)", border: "1px solid var(--shell-border)", color: "var(--shell-text)" }
            }
          >
            Grade {g}
          </Link>
        ))}
      </div>

      {error && <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(194,95,95,.15)", color: "#FCA5A5" }}>{error}</p>}

      <div className="rounded-2xl border p-3 text-xs text-[color:var(--shell-muted)]" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
        Expand a topic group to see its skills. Toggle a skill off and the quiz generator stops using it immediately. <span className="text-[color:var(--shell-text)]">Click <span className="font-semibold text-[#A5B4FC]">+ Add skill</span> at the bottom of any expanded group</span> to author a new one — the code (e.g. <code className="font-mono text-[color:var(--shell-text)]">S.12</code>) is auto-assigned. Question templates live in <code className="font-mono text-[color:var(--shell-text)]">src/lib/ai/mock.ts</code> and match by skill name keywords.
      </div>

      <ul className="space-y-2">
        {groups.map((g) => (
          <li key={g.id} className="rounded-2xl border" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
            <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <button
                  type="button"
                  aria-label={expanded.has(g.id) ? "Collapse" : "Expand"}
                  onClick={() => toggleExpand(g.id)}
                  className="text-[color:var(--shell-muted)] hover:text-white"
                >
                  {expanded.has(g.id) ? "▼" : "▶"}
                </button>
                <span className="cm-pill indigo font-mono" style={{ height: 22, fontSize: 11 }}>{g.letter}</span>
                {editing?.id === g.id ? (
                  <input
                    autoFocus
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    onBlur={() => editing && patchGroup(editing.id, { name: editing.name }).then(() => setEditing(null))}
                    onKeyDown={(e) => { if (e.key === "Enter" && editing) (e.target as HTMLInputElement).blur(); else if (e.key === "Escape") setEditing(null); }}
                    className="flex-1 rounded-lg border px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#A5B4FC]/40"
                    style={{ borderColor: "var(--shell-border)", background: "rgba(255,255,255,.05)" }}
                  />
                ) : (
                  <button onClick={() => setEditing({ id: g.id, name: g.name })} className="flex-1 text-left font-semibold text-white hover:text-[#A5B4FC]" title="Click to rename">
                    {g.name}
                  </button>
                )}
                <span className="text-xs text-[color:var(--shell-muted)]">{g.skillCount} skills</span>
              </div>
              <label className="inline-flex shrink-0 items-center gap-2 text-xs text-[color:var(--shell-muted)]">
                <input
                  type="checkbox"
                  checked={g.active}
                  disabled={busy}
                  onChange={(e) => patchGroup(g.id, { active: e.target.checked })}
                  className="accent-[#6366F1]"
                />
                {g.active ? "Active" : "Hidden"}
              </label>
            </div>
            {expanded.has(g.id) && (
              <ul className="border-t" style={{ borderColor: "var(--shell-border)" }}>
                {g.skills.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-6 py-2 text-sm" style={{ borderTop: "1px solid var(--shell-border)" }}>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md px-2 py-0.5 font-mono text-[11px] text-[color:var(--shell-text)]" style={{ background: "rgba(255,255,255,.06)" }}>{s.code}</span>
                      <span className={s.active ? "text-white" : "text-[color:var(--shell-muted)] line-through"}>{s.name}</span>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-[color:var(--shell-muted)]">
                      <input
                        type="checkbox"
                        checked={s.active}
                        disabled={busy}
                        onChange={(e) => patchSkill(s.id, e.target.checked)}
                        className="accent-[#6366F1]"
                      />
                      {s.active ? "On" : "Off"}
                    </label>
                  </li>
                ))}
                <li className="flex items-center gap-3 px-6 py-2 text-sm" style={{ borderTop: "1px solid var(--shell-border)" }}>
                  {adding[g.id] === null || adding[g.id] === undefined ? (
                    <button
                      type="button"
                      onClick={() => setAdding((prev) => ({ ...prev, [g.id]: "" }))}
                      className="text-xs font-semibold text-[#A5B4FC] hover:text-white"
                    >
                      + Add skill
                    </button>
                  ) : (
                    <>
                      {/* Server assigns the code on create — preview it here so the */}
                      {/* admin knows what the new chip will read after submit. */}
                      <span
                        className="rounded-md px-2 py-0.5 font-mono text-[11px] text-[color:var(--shell-muted)]"
                        style={{ background: "rgba(255,255,255,.06)" }}
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
                        className="flex-1 rounded-lg border px-2 py-1 text-sm text-white placeholder:text-[color:var(--shell-muted)] focus:outline-none focus:ring-2 focus:ring-[#A5B4FC]/40"
                        style={{ borderColor: "var(--shell-border)", background: "rgba(255,255,255,.05)" }}
                        disabled={busy}
                      />
                      <button
                        type="button"
                        onClick={() => addSkill(g.id)}
                        disabled={busy}
                        className="rounded-full bg-[#6366F1] px-3 py-1 text-xs font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdding((prev) => ({ ...prev, [g.id]: null }))}
                        disabled={busy}
                        className="text-xs text-[color:var(--shell-muted)] hover:text-white"
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
