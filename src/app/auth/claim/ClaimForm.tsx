"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CMIcon from "@/components/CMIcon";

export default function ClaimForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true);
    const res = await fetch("/api/auth/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-cm-mint/40 bg-cm-mint-soft p-5 dark:border-emerald-800 dark:bg-emerald-950/40">
        <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: "var(--cm-gold)" }}>
          🎉
        </span>
        <p className="mt-3 font-display text-2xl leading-tight text-slate-900 dark:text-emerald-50">
          You&apos;re all set!
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-emerald-200">
          Your account is linked to your parent. A tutor needs to approve you before you can start —
          you&apos;ll be able to log in once that&apos;s done.
        </p>
        <button onClick={() => router.push("/auth/login")} className="cm-btn primary mt-4 w-full">
          Go to login
          <CMIcon name="arrow" size={18} color="#fff" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl p-3.5" style={{ background: "var(--cm-gold-soft)" }}>
        <span className="grid h-10 w-10 place-items-center rounded-xl text-xl" style={{ background: "var(--cm-gold)" }}>
          🚀
        </span>
        <span className="text-[13px] font-semibold leading-tight" style={{ color: "#92400E" }}>
          Got your code from a parent? Pop it in below and you&apos;re in.
        </span>
      </div>
      <div>
        <label htmlFor="code" className="cm-label dark:!text-slate-100">Invite code</label>
        <input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          placeholder="ABCD-1234"
          className="cm-field font-mono tracking-widest dark:!border-slate-500 dark:!bg-slate-700 dark:!text-white"
        />
      </div>
      <div>
        <label htmlFor="email" className="cm-label dark:!text-slate-100">Your email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="cm-field dark:!border-slate-500 dark:!bg-slate-700 dark:!text-white"
        />
      </div>
      <div>
        <label htmlFor="password" className="cm-label dark:!text-slate-100">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="cm-field dark:!border-slate-500 dark:!bg-slate-700 dark:!text-white"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="cm-label dark:!text-slate-100">Confirm password</label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="cm-field dark:!border-slate-500 dark:!bg-slate-700 dark:!text-white"
        />
      </div>
      {error && (
        <p className="cm-pill coral w-full justify-start !h-auto py-2">
          <CMIcon name="x" size={14} color="currentColor" />
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="cm-btn primary w-full disabled:opacity-50">
        {busy ? "Linking…" : "Create my account"}
      </button>
    </form>
  );
}
