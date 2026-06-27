"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import Pagination from "@/components/Pagination";

export type StudentRow = {
  id: number;
  name: string;
  grade: number;
  difficulty: number;
  parentName: string;
  parentEmail: string;
  quizzesCount: number;
  avgScore: number | null;
  lastActive: string | null;
  tutorId: string | null;
  tutorName: string | null;
};

export type TutorOption = { id: string; name: string; email: string };
export type ParentOption = { id: string; name: string; email: string };

type EditState = { id: number; name: string; grade: number; difficulty: number } | null;

// Shared dark-shell control styles (admin sub-theme).
const INPUT_CLS =
  "rounded-lg border px-3 py-1.5 text-sm text-white placeholder:text-[color:var(--shell-muted)] focus:outline-none focus:ring-2 focus:ring-[#A5B4FC]/40 border-[color:var(--shell-border)] bg-white/5";
const SELECT_CLS =
  "rounded-lg border px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#A5B4FC]/40 border-[color:var(--shell-border)] bg-white/5";
const BTN_PRIMARY =
  "rounded-full bg-[#6366F1] px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-50";
const BTN_GHOST =
  "rounded-full border border-[color:var(--shell-border)] bg-white/5 px-3.5 py-1.5 text-sm font-medium text-[color:var(--shell-text)] hover:bg-white/10 disabled:opacity-50";
const BTN_GHOST_XS =
  "rounded-full border border-[color:var(--shell-border)] bg-white/5 px-2.5 py-1 text-xs font-semibold text-[color:var(--shell-text)] hover:bg-white/10";
const BTN_XS_INDIGO =
  "rounded-full bg-[#6366F1] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-50";
const MODAL_INPUT =
  "mt-1 w-full rounded-lg border px-3 py-2 text-sm text-white placeholder:text-[color:var(--shell-muted)] focus:outline-none focus:ring-2 focus:ring-[#A5B4FC]/40 border-[color:var(--shell-border)] bg-white/5";

function ToneBtn({ color, onClick, disabled, children }: { color: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
      style={{ borderColor: `${color}66`, background: `${color}22`, color }}
    >
      {children}
    </button>
  );
}

export default function StudentsTable({
  rows, tutors, parents, page, totalPages, query, grade, difficulty,
}: {
  rows: StudentRow[]; tutors: TutorOption[]; parents: ParentOption[]; page: number; totalPages: number; query: string; grade: string; difficulty: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [edit, setEdit] = useState<EditState>(null);
  const [pendingDelete, setPendingDelete] = useState<StudentRow | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // "+ Add student" modal state.
  const [creating, setCreating] = useState(false);
  const [nsName, setNsName] = useState("");
  const [nsGrade, setNsGrade] = useState(1);
  const [nsDifficulty, setNsDifficulty] = useState(1);
  const [nsParentId, setNsParentId] = useState(parents[0]?.id ?? "");
  const [nsCreateLogin, setNsCreateLogin] = useState(false);
  const [nsLoginEmail, setNsLoginEmail] = useState("");
  const [nsLoginPassword, setNsLoginPassword] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  async function createStudent() {
    setError(null);
    setSavingNew(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nsName,
          grade: nsGrade,
          parentId: nsParentId,
          startingDifficulty: nsDifficulty,
          createLogin: nsCreateLogin,
          loginEmail: nsCreateLogin ? nsLoginEmail.toLowerCase() : undefined,
          loginPassword: nsCreateLogin ? nsLoginPassword : undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Could not create student.");
      setCreating(false);
      setNsName(""); setNsLoginEmail(""); setNsLoginPassword("");
      setNsCreateLogin(false); setNsGrade(1); setNsDifficulty(1);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create student.");
    } finally {
      setSavingNew(false);
    }
  }
  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  useEffect(() => {
    if (debouncedSearch === query) return;
    const next = new URLSearchParams(params.toString());
    if (debouncedSearch) next.set("q", debouncedSearch);
    else next.delete("q");
    next.set("page", "1");
    startTransition(() => router.push(`/admin/students?${next.toString()}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function setQs(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.set("page", "1");
    startTransition(() => router.push(`/admin/students?${next.toString()}`));
  }

  async function save() {
    if (!edit) return;
    setBusy(edit.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${edit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: edit.name, grade: edit.grade, currentDifficulty: edit.difficulty }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Save failed.");
      }
      setEdit(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(null);
    }
  }

  async function doDelete() {
    if (!pendingDelete) return;
    setBusy(pendingDelete.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${pendingDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      setPendingDelete(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(null);
    }
  }

  async function assignTutor(studentId: number, tutorId: string | "") {
    setBusy(studentId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/tutor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorId: tutorId || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Tutor assignment failed.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tutor assignment failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3 text-[color:var(--shell-text)]">
      <div
        className="flex flex-wrap items-center gap-2 rounded-2xl border p-3.5"
        style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}
      >
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search student or parent…"
          aria-label="Search students"
          className={INPUT_CLS}
        />
        <select aria-label="Filter by grade" value={grade} onChange={(e) => setQs({ grade: e.target.value === "all" ? null : e.target.value })} className={SELECT_CLS}>
          <option value="all">All grades</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <button
          type="button"
          onClick={() => {
            // Re-pick a default parent in case the list changed since mount.
            if (!nsParentId && parents[0]) setNsParentId(parents[0].id);
            setCreating(true);
          }}
          disabled={parents.length === 0}
          title={parents.length === 0 ? "Create a parent first under Users" : "Add a new student"}
          className={`ml-auto ${BTN_PRIMARY}`}
        >
          + Add student
        </button>
      </div>

      {error && <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(194,95,95,.15)", color: "#FCA5A5" }}>{error}</p>}

      <div className="overflow-x-auto rounded-2xl border" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
        <div className="min-w-[720px]">
          <div
            className="grid items-center gap-2.5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--shell-muted)]"
            style={{ gridTemplateColumns: "1.3fr 60px 1.7fr 1.3fr 90px 180px", borderBottom: "1px solid var(--shell-border)" }}
          >
            <span>Name</span>
            <span className="text-center">Grade</span>
            <span>Parent</span>
            <span>Tutor</span>
            <span>Last active</span>
            <span className="text-right">Actions</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.id}
              className="grid items-center gap-2.5 px-4 py-3 text-sm"
              style={{ gridTemplateColumns: "1.3fr 60px 1.7fr 1.3fr 90px 180px", borderBottom: "1px solid var(--shell-border)" }}
            >
              <div className="font-semibold text-white">{r.name}</div>
              <div className="text-center">
                <span className="cm-pill indigo" style={{ height: 22, fontSize: 11 }}>G{r.grade}</span>
              </div>
              <div className="text-xs">
                <div className="text-[color:var(--shell-text)]">{r.parentName}</div>
                <div className="font-mono text-[color:var(--shell-muted)]">{r.parentEmail || "—"}</div>
              </div>
              <div>
                <select
                  aria-label={`Assign tutor for ${r.name}`}
                  value={r.tutorId ?? ""}
                  disabled={busy === r.id}
                  onChange={(e) => assignTutor(r.id, e.target.value)}
                  className="rounded-lg border border-[color:var(--shell-border)] bg-white/5 px-2 py-1 text-xs text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#A5B4FC]/40"
                >
                  <option value="">— None —</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-[color:var(--shell-muted)]">{r.lastActive ? new Date(r.lastActive).toLocaleDateString("en-US") : "—"}</div>
              <div className="flex justify-end gap-1">
                <Link href={`/parent/child/${r.id}`} className={BTN_GHOST_XS}>View</Link>
                <button onClick={() => setEdit({ id: r.id, name: r.name, grade: r.grade, difficulty: r.difficulty })} className={BTN_XS_INDIGO}>Edit</button>
                <ToneBtn color="#C25F5F" onClick={() => setPendingDelete(r)} disabled={busy === r.id}>Delete</ToneBtn>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-[color:var(--shell-muted)]">No students match.</div>
          )}
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/students" />

      {edit && (
        <Modal title={`Edit ${edit.name}`} onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="font-medium text-[color:var(--shell-text)]">Name</span>
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={MODAL_INPUT} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[color:var(--shell-text)]">Grade</span>
              <select value={edit.grade} onChange={(e) => setEdit({ ...edit, grade: parseInt(e.target.value, 10) })} className={MODAL_INPUT}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[color:var(--shell-text)]">Difficulty</span>
              <select value={edit.difficulty} onChange={(e) => setEdit({ ...edit, difficulty: parseInt(e.target.value, 10) })} className={MODAL_INPUT}>
                {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>Level {d}</option>)}
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEdit(null)} className={BTN_GHOST}>Cancel</button>
              <button type="button" onClick={save} disabled={busy === edit.id} className={BTN_PRIMARY}>{busy === edit.id ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </Modal>
      )}

      {creating && (
        <Modal title="Add a student" onClose={() => setCreating(false)}>
          <form
            onSubmit={(e) => { e.preventDefault(); createStudent(); }}
            className="space-y-3"
          >
            <label className="block text-sm">
              <span className="font-medium text-[color:var(--shell-text)]">Name</span>
              <input
                value={nsName}
                onChange={(e) => setNsName(e.target.value)}
                required
                className={MODAL_INPUT}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[color:var(--shell-text)]">Parent</span>
              <select
                value={nsParentId}
                onChange={(e) => setNsParentId(e.target.value)}
                required
                className={MODAL_INPUT}
              >
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="font-medium text-[color:var(--shell-text)]">Grade</span>
                <select
                  value={nsGrade}
                  onChange={(e) => setNsGrade(parseInt(e.target.value, 10))}
                  className={MODAL_INPUT}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-[color:var(--shell-text)]">Starting difficulty</span>
                <select
                  value={nsDifficulty}
                  onChange={(e) => setNsDifficulty(parseInt(e.target.value, 10))}
                  className={MODAL_INPUT}
                >
                  {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>Level {d}</option>)}
                </select>
              </label>
            </div>
            <p className="text-xs text-[color:var(--shell-muted)]">
              All active topic groups for that grade are selected by default. Refine later from the child&apos;s page.
            </p>

            <label className="flex items-center gap-2 pt-2 text-sm">
              <input
                type="checkbox"
                checked={nsCreateLogin}
                onChange={(e) => setNsCreateLogin(e.target.checked)}
                className="accent-[#6366F1]"
              />
              <span className="text-[color:var(--shell-text)]">Also create a login for this student</span>
            </label>
            {nsCreateLogin && (
              <div className="space-y-2 rounded-xl border p-3" style={{ borderColor: "var(--shell-border)", background: "rgba(255,255,255,.03)" }}>
                <label className="block text-sm">
                  <span className="font-medium text-[color:var(--shell-text)]">Login email</span>
                  <input
                    type="email"
                    value={nsLoginEmail}
                    onChange={(e) => setNsLoginEmail(e.target.value)}
                    required={nsCreateLogin}
                    autoComplete="off"
                    className={MODAL_INPUT}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-[color:var(--shell-text)]">Initial password</span>
                  <input
                    type="text"
                    value={nsLoginPassword}
                    onChange={(e) => setNsLoginPassword(e.target.value)}
                    required={nsCreateLogin}
                    autoComplete="off"
                    className={MODAL_INPUT}
                  />
                  <span className="mt-1 block text-xs text-[color:var(--shell-muted)]">
                    ≥8 chars, 1 uppercase, 1 number. Share it with the student.
                  </span>
                </label>
              </div>
            )}

            {error && <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(194,95,95,.15)", color: "#FCA5A5" }}>{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCreating(false)} className={BTN_GHOST}>Cancel</button>
              <button type="submit" disabled={savingNew} className={BTN_PRIMARY}>
                {savingNew ? "Creating…" : "Create student"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {pendingDelete && (
        <Modal title={`Delete ${pendingDelete.name}?`} onClose={() => setPendingDelete(null)}>
          <p className="text-sm text-[color:var(--shell-muted)]">
            Removes the student, their quizzes, attempts, mastery, badges, and XP log. Cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setPendingDelete(null)} className={BTN_GHOST}>Cancel</button>
            <button type="button" onClick={doDelete} disabled={busy === pendingDelete.id} className="rounded-full bg-[#C25F5F] px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{busy ? "Deleting…" : "Delete"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
        <h3 className="font-display mb-3 text-2xl text-white">{title}</h3>
        {children}
      </div>
    </div>
  );
}

