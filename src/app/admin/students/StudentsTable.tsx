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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search student or parent…"
          aria-label="Search students"
          className="rounded border border-slate-500 bg-slate-700 px-3 py-1.5 text-sm text-white placeholder:text-slate-400"
        />
        <select aria-label="Filter by grade" value={grade} onChange={(e) => setQs({ grade: e.target.value === "all" ? null : e.target.value })} className="rounded border border-slate-500 bg-slate-700 px-2 py-1.5 text-sm text-white">
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
          className="ml-auto rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          + Add student
        </button>
      </div>

      {error && <p className="rounded bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2 text-center">Grade</th>
              <th className="px-3 py-2">Parent</th>
              <th className="px-3 py-2">Tutor</th>
              <th className="px-3 py-2">Last active</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 text-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 text-center">G{r.grade}</td>
                <td className="px-3 py-2 text-xs">
                  <div className="text-slate-200">{r.parentName}</div>
                  <div className="font-mono text-slate-400">{r.parentEmail || "—"}</div>
                </td>
                <td className="px-3 py-2">
                  <select
                    aria-label={`Assign tutor for ${r.name}`}
                    value={r.tutorId ?? ""}
                    disabled={busy === r.id}
                    onChange={(e) => assignTutor(r.id, e.target.value)}
                    className="rounded border border-slate-500 bg-slate-700 px-2 py-1 text-xs text-white disabled:opacity-50"
                  >
                    <option value="">— None —</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-xs text-slate-300">{r.lastActive ? new Date(r.lastActive).toLocaleDateString("en-US") : "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Link href={`/parent/child/${r.id}`} className="rounded border border-slate-500 bg-slate-700 px-2 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-600">View</Link>
                    <button onClick={() => setEdit({ id: r.id, name: r.name, grade: r.grade, difficulty: r.difficulty })} className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700">Edit</button>
                    <button onClick={() => setPendingDelete(r)} disabled={busy === r.id} className="rounded border border-rose-500 bg-rose-600/80 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">No students match.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/students" />

      {edit && (
        <Modal title={`Edit ${edit.name}`} onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-slate-300">Name</span>
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white" />
            </label>
            <label className="block text-sm">
              <span className="text-slate-300">Grade</span>
              <select value={edit.grade} onChange={(e) => setEdit({ ...edit, grade: parseInt(e.target.value, 10) })} className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-300">Difficulty</span>
              <select value={edit.difficulty} onChange={(e) => setEdit({ ...edit, difficulty: parseInt(e.target.value, 10) })} className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white">
                {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>Level {d}</option>)}
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEdit(null)} className="rounded border border-slate-500 bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600">Cancel</button>
              <button type="button" onClick={save} disabled={busy === edit.id} className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{busy === edit.id ? "Saving…" : "Save"}</button>
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
              <span className="text-slate-300">Name</span>
              <input
                value={nsName}
                onChange={(e) => setNsName(e.target.value)}
                required
                className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-300">Parent</span>
              <select
                value={nsParentId}
                onChange={(e) => setNsParentId(e.target.value)}
                required
                className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white"
              >
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-slate-300">Grade</span>
                <select
                  value={nsGrade}
                  onChange={(e) => setNsGrade(parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-slate-300">Starting difficulty</span>
                <select
                  value={nsDifficulty}
                  onChange={(e) => setNsDifficulty(parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white"
                >
                  {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>Level {d}</option>)}
                </select>
              </label>
            </div>
            <p className="text-xs text-slate-400">
              All active topic groups for that grade are selected by default. Refine later from the child&apos;s page.
            </p>

            <label className="flex items-center gap-2 pt-2 text-sm">
              <input
                type="checkbox"
                checked={nsCreateLogin}
                onChange={(e) => setNsCreateLogin(e.target.checked)}
              />
              <span className="text-slate-200">Also create a login for this student</span>
            </label>
            {nsCreateLogin && (
              <div className="space-y-2 rounded border border-slate-700 bg-slate-900/40 p-3">
                <label className="block text-sm">
                  <span className="text-slate-300">Login email</span>
                  <input
                    type="email"
                    value={nsLoginEmail}
                    onChange={(e) => setNsLoginEmail(e.target.value)}
                    required={nsCreateLogin}
                    autoComplete="off"
                    className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-300">Initial password</span>
                  <input
                    type="text"
                    value={nsLoginPassword}
                    onChange={(e) => setNsLoginPassword(e.target.value)}
                    required={nsCreateLogin}
                    autoComplete="off"
                    className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white"
                  />
                  <span className="mt-1 block text-xs text-slate-400">
                    ≥8 chars, 1 uppercase, 1 number. Share it with the student.
                  </span>
                </label>
              </div>
            )}

            {error && <p className="rounded bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCreating(false)} className="rounded border border-slate-500 bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600">Cancel</button>
              <button type="submit" disabled={savingNew} className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                {savingNew ? "Creating…" : "Create student"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {pendingDelete && (
        <Modal title={`Delete ${pendingDelete.name}?`} onClose={() => setPendingDelete(null)}>
          <p className="text-sm text-slate-300">
            Removes the student, their quizzes, attempts, mastery, badges, and XP log. Cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setPendingDelete(null)} className="rounded border border-slate-500 bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600">Cancel</button>
            <button type="button" onClick={doDelete} disabled={busy === pendingDelete.id} className="rounded bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{busy ? "Deleting…" : "Delete"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold text-slate-100">{title}</h3>
        {children}
      </div>
    </div>
  );
}

