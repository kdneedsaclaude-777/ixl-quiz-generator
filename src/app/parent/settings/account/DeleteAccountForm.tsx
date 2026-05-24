"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function DeleteAccountForm() {
  const [confirm, setConfirm] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirm !== "DELETE") {
      setError("Type DELETE exactly to confirm.");
      return;
    }
    setError(null);
    setRunning(true);
    try {
      const res = await fetch("/api/parent/account/delete", { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Delete failed.");
      }
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
      setRunning(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 rounded-lg border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/40 dark:bg-rose-950/20">
      <p className="text-sm text-rose-800 dark:text-rose-200">
        Deleting your account anonymises your personal info and unlinks your children from your account. This cannot be undone.
        Children's quiz history is retained for the platform but no longer tied to you.
      </p>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-rose-900 dark:text-rose-200">Type DELETE to confirm</label>
        <input
          id="confirm"
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm text-rose-900 dark:border-rose-500 dark:bg-slate-700 dark:text-white"
        />
      </div>
      {error && <p className="rounded bg-rose-100 px-3 py-2 text-sm text-rose-800 dark:bg-rose-900/60 dark:text-rose-100">{error}</p>}
      <button
        type="submit"
        disabled={running || confirm !== "DELETE"}
        className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
      >
        {running ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}
