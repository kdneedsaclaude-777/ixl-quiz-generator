"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import CMIcon from "@/components/CMIcon";

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
    <section
      className="cm-card overflow-hidden p-6 dark:border-rose-900/40 dark:bg-rose-950/20"
      style={{ borderColor: "var(--cm-coral)", borderLeftWidth: 4 }}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-cm-red-soft text-cm-red dark:bg-rose-950/40">
          <CMIcon name="x" size={15} color="var(--cm-coral)" />
        </span>
        <h2 className="text-[15px] font-bold text-cm-red dark:text-rose-300">Danger zone</h2>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <p className="text-sm text-rose-800 dark:text-rose-200">
          Deleting your account anonymises your personal info and unlinks your children from your account. This cannot be undone.
          Children's quiz history is retained for the platform but no longer tied to you.
        </p>
        <div>
          <label htmlFor="confirm" className="cm-label dark:text-rose-200" style={{ color: "var(--cm-red)" }}>Type DELETE to confirm</label>
          <input
            id="confirm"
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="cm-field dark:border-rose-500 dark:bg-slate-700 dark:text-white"
            style={{ borderColor: "var(--cm-coral)" }}
          />
        </div>
        {error && <p className="rounded-lg bg-cm-red-soft px-3 py-2 text-sm text-rose-800 dark:bg-rose-900/60 dark:text-rose-100">{error}</p>}
        <button
          type="submit"
          disabled={running || confirm !== "DELETE"}
          className="cm-btn coral disabled:opacity-50"
        >
          {running ? "Deleting…" : "Delete my account"}
        </button>
      </form>
    </section>
  );
}
