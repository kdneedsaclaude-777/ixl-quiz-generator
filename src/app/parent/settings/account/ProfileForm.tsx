"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Initial = { name: string; email: string; emailVerified: boolean };

export default function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailChanged = email.trim().toLowerCase() !== initial.email.toLowerCase();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // HTML5 `required` passes whitespace-only names — guard before submit.
    if (!name.trim()) {
      setError("Name can't be empty.");
      return;
    }
    setSaving(true);
    setSaved(null);
    setError(null);
    try {
      const res = await fetch("/api/parent/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Save failed.");
      setSaved(j.emailReverificationSent ? "Saved. Check your inbox to verify the new email." : "Saved.");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-900 dark:text-slate-100">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-900 dark:text-slate-100">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
        />
        {emailChanged && (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            Changing your email sends a new verification link and signs you out of unverified state until you click it.
          </p>
        )}
        {!initial.emailVerified && !emailChanged && (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Your current email is not yet verified.</p>
        )}
      </div>
      {error && <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
      {saved && <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{saved}</p>}
      <button type="submit" disabled={saving} className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
