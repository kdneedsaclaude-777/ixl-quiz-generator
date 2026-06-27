"use client";

import { useState } from "react";
import CMIcon from "@/components/CMIcon";

export default function ResetForm({ token }: { token: string }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="rounded-2xl border border-cm-red-soft bg-cm-red-soft/60 p-5 dark:border-rose-800 dark:bg-rose-950/40">
        <span className="cm-pill coral">
          <CMIcon name="x" size={14} color="currentColor" />
          Invalid link
        </span>
        <p className="mt-2 text-sm text-slate-700 dark:text-rose-200">
          Missing reset token. Request a new link from <span className="font-semibold">Forgot password</span>.
        </p>
      </div>
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
      <div className="rounded-2xl border border-cm-mint/40 bg-cm-mint-soft p-5 dark:border-emerald-800 dark:bg-emerald-950/40">
        <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "var(--cm-mint)" }}>
          <CMIcon name="check" size={22} color="#fff" stroke={2.25} />
        </span>
        <p className="mt-3 text-sm text-slate-700 dark:text-emerald-100">
          Password updated.{" "}
          <a href="/auth/login" className="font-semibold text-cm-mint underline dark:text-emerald-300">Log in</a> with
          your new password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl bg-cm-blue-50 px-3 py-2 text-[13px] font-medium text-cm-blue dark:bg-slate-700/40 dark:text-slate-300">
        <CMIcon name="lock" size={16} color="currentColor" />
        Choose a strong password you haven&apos;t used before.
      </div>
      <div>
        <label htmlFor="pw" className="cm-label dark:!text-slate-100">New password</label>
        <input
          id="pw"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
          autoComplete="new-password"
          className="cm-field dark:!border-slate-500 dark:!bg-slate-700 dark:!text-white"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">≥8 chars, 1 uppercase, 1 number.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="cm-label dark:!text-slate-100">Confirm</label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          className="cm-field dark:!border-slate-500 dark:!bg-slate-700 dark:!text-white"
        />
      </div>
      {error && (
        <p className="cm-pill coral w-full justify-start !h-auto py-2">
          <CMIcon name="x" size={14} color="currentColor" />
          {error}
        </p>
      )}
      <button type="submit" disabled={submitting} className="cm-btn primary w-full disabled:opacity-50">
        {submitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
