"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";

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
    <main className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-2">
      <div className="mb-6 flex justify-center">
        <Logo size={32} />
      </div>
      <header className="text-center">
        <div className="flex justify-center">
          <span className="cm-pill coral">Live quiz</span>
        </div>
        <h1 className="font-display mt-3 text-5xl leading-[1] tracking-tight text-slate-900 dark:text-slate-100">
          Join the game!
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enter the code shown on the screen.
        </p>
      </header>
      <form onSubmit={join} className="cm-card mt-6 space-y-4 p-6">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CODE"
          aria-label="Session code"
          required
          maxLength={6}
          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-center font-mono text-3xl font-bold tracking-[0.3em] text-slate-900 focus:border-cm-blue dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          aria-label="Your name"
          required
          maxLength={24}
          className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg text-slate-900 focus:border-cm-blue dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        {error && (
          <p className="rounded-xl bg-cm-red-soft px-3 py-2 text-sm font-medium text-cm-red">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="cm-btn coral lg w-full disabled:opacity-50">
          {busy ? "Joining…" : "Let's go!"}
        </button>
      </form>
    </main>
  );
}
