"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LiveJoinPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const c = code.trim().toUpperCase();
      const res = await fetch(`/api/live/${c}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not join.");
      sessionStorage.setItem(`live:${c}`, j.token);
      sessionStorage.setItem(`live:${c}:id`, j.id);
      router.push(`/live/play/${c}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm space-y-6 pt-10">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-amber-900 dark:text-amber-100">Join the quiz! 🎮</h1>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">Enter the code on the screen.</p>
      </header>
      <form
        onSubmit={join}
        className="space-y-4 rounded-2xl border-2 border-amber-200 bg-white p-6 dark:border-amber-800/50 dark:bg-amber-950/20"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CODE"
          required
          maxLength={6}
          className="w-full rounded-xl border-2 border-amber-300 bg-white px-4 py-3 text-center text-2xl font-extrabold tracking-widest text-slate-900 dark:bg-amber-950/30 dark:text-white"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          maxLength={24}
          className="w-full rounded-xl border-2 border-amber-200 bg-white px-4 py-3 text-lg text-slate-900 dark:bg-amber-950/30 dark:text-white"
        />
        {error && <p className="rounded bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-amber-500 px-4 py-3 text-lg font-bold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {busy ? "Joining…" : "Let's go!"}
        </button>
      </form>
    </main>
  );
}
