"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import Pagination from "@/components/Pagination";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  status: "active" | "suspended" | "deleted";
  childrenCount: number;
  lastLogin: string | null;
};

export default function UsersTable({
  rows,
  page,
  totalPages,
  query,
  status,
  verified,
  role,
  isSuperadmin,
}: {
  rows: UserRow[];
  page: number;
  totalPages: number;
  query: string;
  status: string;
  verified: string;
  role: string;
  isSuperadmin: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  // Push the debounced search to the URL exactly once per stable value
  // (skip the initial render where debounced === query).
  useEffect(() => {
    if (debouncedSearch === query) return;
    const next = new URLSearchParams(params.toString());
    if (debouncedSearch) next.set("q", debouncedSearch);
    else next.delete("q");
    next.set("page", "1");
    startTransition(() => router.push(`/admin/users?${next.toString()}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // "+ New user" modal state.
  type NewRole = "parent" | "tutor" | "orgadmin" | "superadmin";
  const [creating, setCreating] = useState(false);
  const [nuName, setNuName] = useState("");
  const [nuEmail, setNuEmail] = useState("");
  const [nuPassword, setNuPassword] = useState("");
  const [nuRole, setNuRole] = useState<NewRole>("tutor");
  const [savingNew, setSavingNew] = useState(false);

  async function createUser() {
    setError(null);
    setSavingNew(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nuName,
          email: nuEmail.toLowerCase(),
          password: nuPassword,
          role: nuRole,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Could not create user.");
      // Reset + close + switch the role filter to the role we just created so
      // the new user is visible immediately.
      const createdRole = nuRole;
      setCreating(false);
      setNuName("");
      setNuEmail("");
      setNuPassword("");
      setNuRole("tutor");
      const next = new URLSearchParams(params.toString());
      next.set("role", createdRole);
      next.set("page", "1");
      startTransition(() => router.push(`/admin/users?${next.toString()}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create user.");
    } finally {
      setSavingNew(false);
    }
  }

  const allSelected = useMemo(
    () => rows.length > 0 && rows.every((r) => selected.has(r.id)),
    [rows, selected],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setQs(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.set("page", "1");
    startTransition(() => router.push(`/admin/users?${next.toString()}`));
  }

  async function callApi(path: string, method = "POST"): Promise<void> {
    setError(null);
    try {
      const res = await fetch(path, { method });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Action failed.");
      }
      const data = await res.json().catch(() => null);
      if (data?.redirect) {
        window.location.href = data.redirect;
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    }
  }

  async function doAction(id: string, kind: "suspend" | "unsuspend" | "impersonate") {
    setBusyId(id);
    await callApi(`/api/admin/users/${id}/${kind}`);
    setBusyId(null);
  }

  async function doDelete() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    await callApi(`/api/admin/users/${pendingDelete.id}`, "DELETE");
    setBusyId(null);
    setPendingDelete(null);
  }

  async function bulkSuspend() {
    if (selected.size === 0) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/users/bulk-suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      if (!res.ok) throw new Error("Bulk action failed.");
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk action failed.");
    }
  }

  function exportCsv() {
    const url = selected.size > 0
      ? `/api/admin/users/export?ids=${[...selected].join(",")}`
      : `/api/admin/users/export`;
    window.location.href = url;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or email…"
            aria-label="Search users"
            className="rounded border border-slate-500 bg-slate-700 px-3 py-1.5 text-sm text-white placeholder:text-slate-400"
          />
          <select
            aria-label="Filter by role"
            value={role}
            // Always push the value (including "all") — page defaults to
            // "parent" when no ?role= is present, so stripping the param
            // sent "All roles" back to the parents view.
            onChange={(e) => setQs({ role: e.target.value })}
            className="rounded border border-slate-500 bg-slate-700 px-2 py-1.5 text-sm text-white"
          >
            <option value="parent">Parents</option>
            <option value="tutor">Tutors</option>
            <option value="student">Students</option>
            {isSuperadmin && <option value="orgadmin">Org Admins</option>}
            {isSuperadmin && <option value="superadmin">Super Admins</option>}
            <option value="all">All roles</option>
          </select>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setQs({ status: e.target.value === "all" ? null : e.target.value })}
            className="rounded border border-slate-500 bg-slate-700 px-2 py-1.5 text-sm text-white"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
          <select
            aria-label="Filter by verified state"
            value={verified}
            onChange={(e) => setQs({ verified: e.target.value === "all" ? null : e.target.value })}
            className="rounded border border-slate-500 bg-slate-700 px-2 py-1.5 text-sm text-white"
          >
            <option value="all">All verified</option>
            <option value="yes">Verified</option>
            <option value="no">Unverified</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-700"
          >
            + New user
          </button>
          <button
            type="button"
            onClick={bulkSuspend}
            disabled={selected.size === 0}
            className="rounded border border-slate-500 bg-slate-700 px-3 py-1.5 font-medium text-slate-100 hover:bg-slate-600 disabled:opacity-40"
          >
            Suspend selected ({selected.size})
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded border border-slate-500 bg-slate-700 px-3 py-1.5 font-medium text-slate-100 hover:bg-slate-600"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && <p className="rounded bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))}
                />
              </th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2 text-right">Children</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Last login</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 text-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className={r.status === "deleted" ? "opacity-60" : ""}>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.name}`} />
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.name}</div>
                  {!r.verified && <div className="text-[11px] text-amber-300">Unverified</div>}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.email}</td>
                <td className="px-3 py-2 text-right">{r.childrenCount}</td>
                <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                <td className="px-3 py-2 text-xs text-slate-300">
                  {r.lastLogin ? new Date(r.lastLogin).toLocaleDateString("en-US") : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    {r.status === "active" && (
                      <button onClick={() => doAction(r.id, "impersonate")} disabled={busyId === r.id} className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">Impersonate</button>
                    )}
                    {r.status === "active" && (
                      <button onClick={() => doAction(r.id, "suspend")} disabled={busyId === r.id} className="rounded border border-amber-500 bg-amber-600/80 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50">Suspend</button>
                    )}
                    {r.status === "suspended" && (
                      <button onClick={() => doAction(r.id, "unsuspend")} disabled={busyId === r.id} className="rounded border border-emerald-500 bg-emerald-600/80 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">Unsuspend</button>
                    )}
                    {r.status !== "deleted" && (
                      <button onClick={() => setPendingDelete(r)} disabled={busyId === r.id} className="rounded border border-rose-500 bg-rose-600/80 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-400">No users match.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/users" />

      {creating && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) setCreating(false); }}>
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-100">Add a new user</h3>
            <p className="mt-1 text-xs text-slate-400">
              Auto-verified — they can log in immediately with the password you set.
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); createUser(); }}
              className="mt-4 space-y-3"
            >
              <label className="block text-sm">
                <span className="text-slate-200">Role</span>
                <select
                  value={nuRole}
                  onChange={(e) => setNuRole(e.target.value as NewRole)}
                  className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white"
                >
                  <option value="parent">Parent</option>
                  <option value="tutor">Tutor</option>
                  {isSuperadmin && <option value="orgadmin">Org Admin</option>}
                  {isSuperadmin && <option value="superadmin">Super Admin</option>}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-slate-200">Full name</span>
                <input
                  value={nuName}
                  onChange={(e) => setNuName(e.target.value)}
                  required
                  autoComplete="name"
                  className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-200">Email</span>
                <input
                  type="email"
                  value={nuEmail}
                  onChange={(e) => setNuEmail(e.target.value)}
                  required
                  autoComplete="off"
                  className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-200">Initial password</span>
                <input
                  type="text"
                  value={nuPassword}
                  onChange={(e) => setNuPassword(e.target.value)}
                  required
                  autoComplete="off"
                  className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white"
                />
                <span className="mt-1 block text-xs text-slate-400">
                  ≥8 chars, 1 uppercase, 1 number. Share it with them; they can change it later.
                </span>
              </label>
              {error && <p className="rounded bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCreating(false)} className="rounded border border-slate-500 bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600">Cancel</button>
                <button type="submit" disabled={savingNew} className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                  {savingNew ? "Creating…" : "Create user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) setPendingDelete(null); }}>
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-100">Delete {pendingDelete.name}?</h3>
            <p className="mt-2 text-sm text-slate-300">
              {pendingDelete.role === "student" ? (
                <>
                  This is a <span className="font-semibold text-amber-300">student login account</span>.
                  Deleting it removes the login but the student&apos;s profile + quiz history stay
                  attached to their parent. They&apos;ll need a new login to play themselves.
                </>
              ) : (
                <>
                  Permanently removes this user, their notification settings, sessions, and tokens.
                  Their children are unlinked but their quiz history is retained.
                </>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="rounded border border-slate-500 bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600">Cancel</button>
              <button type="button" onClick={doDelete} disabled={busyId !== null} className="rounded bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{busyId ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: UserRow["status"] }) {
  const palette = status === "active"
    ? "bg-emerald-900/40 text-emerald-200 border-emerald-700/50"
    : status === "suspended"
      ? "bg-amber-900/40 text-amber-200 border-amber-700/50"
      : "bg-slate-700 text-slate-300 border-slate-600";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${palette}`}>{status}</span>;
}

