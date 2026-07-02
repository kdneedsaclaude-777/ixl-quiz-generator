"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OpsGateForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ops/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        setError(res.status === 429 ? "Too many attempts — wait a bit." : "Incorrect.");
        setBusy(false);
        return;
      }
      router.replace("/ops/panel");
    } catch {
      setError("Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3" autoComplete="off">
      <input
        type="password"
        inputMode="text"
        autoComplete="off"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Access code"
        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm tracking-widest text-slate-900 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
      />
      {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
      <button
        type="submit"
        disabled={busy || code.length < 4}
        className="w-full rounded-xl bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        {busy ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
