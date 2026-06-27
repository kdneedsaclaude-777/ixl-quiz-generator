"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CMIcon from "@/components/CMIcon";

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
    <section className="cm-card p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-cm-blue-50 text-cm-blue dark:bg-slate-700">
          <CMIcon name="user" size={15} color="var(--cm-blue)" />
        </span>
        <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Profile</h2>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your name and the email we contact you at.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="name" className="cm-label dark:text-slate-100">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="cm-field dark:border-slate-500 dark:bg-slate-700 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="email" className="cm-label dark:text-slate-100">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="cm-field dark:border-slate-500 dark:bg-slate-700 dark:text-white"
          />
          {emailChanged && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Changing your email sends a new verification link and signs you out of unverified state until you click it.
            </p>
          )}
          {!initial.emailVerified && !emailChanged && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">Your current email is not yet verified.</p>
          )}
        </div>
        {error && <p className="rounded-lg bg-cm-red-soft px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
        {saved && <p className="rounded-lg bg-cm-mint-soft px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{saved}</p>}
        <button type="submit" disabled={saving} className="cm-btn primary disabled:opacity-50">
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </section>
  );
}
