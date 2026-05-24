"use client";

import { useState } from "react";

export default function ResetForm({ token }: { token: string }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">
        Missing reset token. Request a new link from <span className="font-medium">Forgot password</span>.
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (pw !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: pw }),
    });
    const j = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(j.error ?? "Reset failed.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        Password updated. <a href="/auth/login" className="font-semibold underline">Log in</a> with your new password.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="pw" className="block text-sm font-medium text-slate-900 dark:text-slate-100">New password</label>
        <input
          id="pw"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">≥8 chars, 1 uppercase, 1 number.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-slate-900 dark:text-slate-100">Confirm</label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
        />
      </div>
      {error && <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
