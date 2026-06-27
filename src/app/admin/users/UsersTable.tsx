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

// Shared dark-shell control styles (admin sub-theme).
const INPUT_CLS =
  "rounded-lg border px-3 py-1.5 text-sm text-white placeholder:text-[color:var(--shell-muted)] focus:outline-none focus:ring-2 focus:ring-[#A5B4FC]/40 border-[color:var(--shell-border)] bg-white/5";
const SELECT_CLS =
  "rounded-lg border px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#A5B4FC]/40 border-[color:var(--shell-border)] bg-white/5";
const BTN_PRIMARY =
  "rounded-full bg-[#6366F1] px-3.5 py-1.5 font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-50";
const BTN_GHOST =
  "rounded-full border border-[color:var(--shell-border)] bg-white/5 px-3.5 py-1.5 font-medium text-[color:var(--shell-text)] hover:bg-white/10 disabled:opacity-50";
const BTN_XS_INDIGO =
  "rounded-full bg-[#6366F1] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-50";

// Tinted outline action chip (suspend/unsuspend/delete) in the dark shell.
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
    <div className="space-y-3 text-[color:var(--shell-text)]">
      <div
        className="flex flex-col gap-3 rounded-2xl border p-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or email…"
            aria-label="Search users"
            className={INPUT_CLS}
          />
          <select
            aria-label="Filter by role"
            value={role}
            // Always push the value (including "all") — page defaults to
            // "parent" when no ?role= is present, so stripping the param
            // sent "All roles" back to the parents view.
            onChange={(e) => setQs({ role: e.target.value })}
            className={SELECT_CLS}
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
            className={SELECT_CLS}
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
            className={SELECT_CLS}
          >
            <option value="all">All verified</option>
            <option value="yes">Verified</option>
            <option value="no">Unverified</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button type="button" onClick={() => setCreating(true)} className={BTN_PRIMARY}>
            + New user
          </button>
          <button
            type="button"
            onClick={bulkSuspend}
            disabled={selected.size === 0}
            className={`${BTN_GHOST} disabled:opacity-40`}
          >
            Suspend selected ({selected.size})
          </button>
          <button type="button" onClick={exportCsv} className={BTN_GHOST}>
            Export CSV
          </button>
        </div>
      </div>

      {error && <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(194,95,95,.15)", color: "#FCA5A5" }}>{error}</p>}

      {/* Dark row-card list — header strip + one divided row per user. */}
      <div className="overflow-x-auto rounded-2xl border" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
        <div className="min-w-[760px]">
          <div
            className="grid items-center gap-2.5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--shell-muted)]"
            style={{ gridTemplateColumns: "28px 1.4fr 1.6fr 70px 110px 90px 220px", borderBottom: "1px solid var(--shell-border)" }}
          >
            <input
              type="checkbox"
              aria-label="Select all"
              checked={allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))}
              className="accent-[#6366F1]"
            />
            <span>Name</span>
            <span>Email</span>
            <span className="text-right">Children</span>
            <span>Status</span>
            <span>Last login</span>
            <span className="text-right">Actions</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.id}
              className={`grid items-center gap-2.5 px-4 py-3 text-sm ${r.status === "deleted" ? "opacity-60" : ""}`}
              style={{ gridTemplateColumns: "28px 1.4fr 1.6fr 70px 110px 90px 220px", borderBottom: "1px solid var(--shell-border)" }}
            >
              <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.name}`} className="accent-[#6366F1]" />
              <div>
                <div className="font-semibold text-white">{r.name}</div>
                {!r.verified && <div className="text-[11px]" style={{ color: "var(--cm-gold)" }}>Unverified</div>}
              </div>
              <div className="truncate font-mono text-xs text-[color:var(--shell-muted)]">{r.email}</div>
              <div className="text-right font-mono text-xs">{r.childrenCount}</div>
              <div><StatusPill status={r.status} /></div>
              <div className="text-xs text-[color:var(--shell-muted)]">
                {r.lastLogin ? new Date(r.lastLogin).toLocaleDateString("en-US") : "—"}
              </div>
              <div className="flex justify-end gap-1">
                {r.status === "active" && (
                  <button onClick={() => doAction(r.id, "impersonate")} disabled={busyId === r.id} className={BTN_XS_INDIGO}>Impersonate</button>
                )}
                {r.status === "active" && (
                  <ToneBtn color="#E8A317" onClick={() => doAction(r.id, "suspend")} disabled={busyId === r.id}>Suspend</ToneBtn>
                )}
                {r.status === "suspended" && (
                  <ToneBtn color="#4E9F7B" onClick={() => doAction(r.id, "unsuspend")} disabled={busyId === r.id}>Unsuspend</ToneBtn>
                )}
                {r.status !== "deleted" && (
                  <ToneBtn color="#C25F5F" onClick={() => setPendingDelete(r)} disabled={busyId === r.id}>Delete</ToneBtn>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-[color:var(--shell-muted)]">No users match.</div>
          )}
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/users" />

      {creating && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) setCreating(false); }}>
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
            <h3 className="font-display text-2xl text-white">Add a new user</h3>
            <p className="mt-1 text-xs text-[color:var(--shell-muted)]">
              Auto-verified — they can log in immediately with the password you set.
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); createUser(); }}
              className="mt-4 space-y-3"
            >
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[color:var(--shell-text)]">Role</span>
                <select value={nuRole} onChange={(e) => setNuRole(e.target.value as NewRole)} className={MODAL_INPUT}>
                  <option value="parent">Parent</option>
                  <option value="tutor">Tutor</option>
                  {isSuperadmin && <option value="orgadmin">Org Admin</option>}
                  {isSuperadmin && <option value="superadmin">Super Admin</option>}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[color:var(--shell-text)]">Full name</span>
                <input value={nuName} onChange={(e) => setNuName(e.target.value)} required autoComplete="name" className={MODAL_INPUT} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[color:var(--shell-text)]">Email</span>
                <input type="email" value={nuEmail} onChange={(e) => setNuEmail(e.target.value)} required autoComplete="off" className={MODAL_INPUT} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[color:var(--shell-text)]">Initial password</span>
                <input type="text" value={nuPassword} onChange={(e) => setNuPassword(e.target.value)} required autoComplete="off" className={MODAL_INPUT} />
                <span className="mt-1 block text-xs text-[color:var(--shell-muted)]">
                  ≥8 chars, 1 uppercase, 1 number. Share it with them; they can change it later.
                </span>
              </label>
              {error && <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(194,95,95,.15)", color: "#FCA5A5" }}>{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCreating(false)} className={BTN_GHOST}>Cancel</button>
                <button type="submit" disabled={savingNew} className={BTN_PRIMARY}>
                  {savingNew ? "Creating…" : "Create user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) setPendingDelete(null); }}>
          <div className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
            <h3 className="font-display text-2xl text-white">Delete {pendingDelete.name}?</h3>
            <p className="mt-2 text-sm text-[color:var(--shell-muted)]">
              {pendingDelete.role === "student" ? (
                <>
                  This is a <span className="font-semibold" style={{ color: "var(--cm-gold)" }}>student login account</span>.
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
              <button type="button" onClick={() => setPendingDelete(null)} className={BTN_GHOST}>Cancel</button>
              <button type="button" onClick={doDelete} disabled={busyId !== null} className="rounded-full bg-[#C25F5F] px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{busyId ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MODAL_INPUT =
  "w-full rounded-lg border px-3 py-2 text-sm text-white placeholder:text-[color:var(--shell-muted)] focus:outline-none focus:ring-2 focus:ring-[#A5B4FC]/40 border-[color:var(--shell-border)] bg-white/5";

function StatusPill({ status }: { status: UserRow["status"] }) {
  const cls = status === "active" ? "cm-pill mint" : status === "suspended" ? "cm-pill amber" : "cm-pill";
  return <span className={cls} style={{ height: 22, fontSize: 11 }}>{status}</span>;
}

