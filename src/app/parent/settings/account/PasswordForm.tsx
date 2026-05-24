"use client";

import { useState } from "react";

export default function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/parent/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Password change failed.");
      setSaved(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password change failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <PField id="cur" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
      <PField id="new" label="New password" value={next} onChange={setNext} autoComplete="new-password" hint="≥8 chars, 1 uppercase, 1 number." />
      <PField id="cnf" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {error && <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
      {saved && <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">Password updated.</p>}
      <button type="submit" disabled={saving} className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
        {saving ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}

function PField({ id, label, value, onChange, autoComplete, hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete?: string; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-900 dark:text-slate-100">{label}</label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
      />
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
