"use client";

import { useEffect, useState } from "react";
import CMIcon from "@/components/CMIcon";

type State = { status: "idle" | "pending" | "ok" | "error"; message?: string };

export default function VerifyEmailRunner({
  token,
  initialEmail,
}: {
  token: string;
  initialEmail: string;
}) {
  // If we arrived via a legacy magic link (?token=...), auto-verify it.
  // Otherwise show the 6-digit code form.
  const [state, setState] = useState<State>({ status: token ? "pending" : "idle" });
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const j = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) setState({ status: "error", message: j.error ?? "Verification failed." });
        else setState({ status: "ok", message: `Verified ${j.email ?? "your email"}. You can log in now.` });
      } catch {
        if (!cancelled) setState({ status: "error", message: "Verification failed." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = code.replace(/\s+/g, "");
    if (!email.trim() || !/^\d{6}$/.test(clean)) {
      setState({ status: "error", message: "Enter your email and the 6-digit code." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: clean }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setState({ status: "error", message: j.error ?? "Verification failed." });
      else setState({ status: "ok", message: `Verified ${j.email ?? "your email"}. You can log in now.` });
    } catch {
      setState({ status: "error", message: "Verification failed." });
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setResendMsg(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (typeof j.devCode === "string") setCode(j.devCode);
      setResendMsg("A fresh code is on its way. Check your inbox (and spam).");
    } catch {
      setResendMsg("Couldn't resend just now — try again in a moment.");
    }
  }

  if (state.status === "pending") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-cm-blue-100 bg-cm-blue-50 p-5 dark:border-slate-600 dark:bg-slate-700/40">
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-cm-blue/30 border-t-cm-blue"
          aria-hidden
        />
        <p className="text-sm font-medium text-cm-blue dark:text-slate-200">Verifying your email…</p>
      </div>
    );
  }

  if (state.status === "ok") {
    return (
      <div className="rounded-2xl border border-cm-mint/40 bg-cm-mint-soft p-5 dark:border-emerald-800 dark:bg-emerald-950/40">
        <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "var(--cm-mint)" }}>
          <CMIcon name="check" size={22} color="#fff" stroke={2.25} />
        </span>
        <p className="mt-3 font-display text-2xl leading-tight text-slate-900 dark:text-emerald-50">
          You&apos;re verified.
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-emerald-200">{state.message}</p>
        <a href="/auth/login" className="cm-btn primary mt-4 w-full">
          Go to login
          <CMIcon name="arrow" size={18} color="#fff" />
        </a>
      </div>
    );
  }

  // idle or error → show the code form (unless a legacy token failed hard).
  return (
    <form onSubmit={onVerify} className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Enter the 6-digit code we emailed you to verify your account.
      </p>

      <div>
        <label htmlFor="v-email" className="cm-label dark:!text-slate-100">Email</label>
        <input
          id="v-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="cm-field dark:!border-slate-500 dark:!bg-slate-700 dark:!text-white"
        />
      </div>

      <div>
        <label htmlFor="v-code" className="cm-label dark:!text-slate-100">6-digit code</label>
        <input
          id="v-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="cm-field text-center font-mono text-2xl tracking-[0.4em] dark:!border-slate-500 dark:!bg-slate-700 dark:!text-white"
        />
      </div>

      {state.status === "error" && (
        <p className="cm-pill coral w-full justify-start !h-auto py-2">
          <CMIcon name="x" size={14} color="currentColor" />
          {state.message ?? "Verification failed."}
        </p>
      )}

      <button type="submit" disabled={submitting} className="cm-btn primary w-full disabled:opacity-50">
        {submitting ? "Verifying…" : "Verify email"}
        {!submitting && <CMIcon name="arrow" size={18} color="#fff" />}
      </button>

      <div className="text-center text-sm text-slate-600 dark:text-slate-300">
        Didn&apos;t get it?{" "}
        <button type="button" onClick={onResend} className="font-medium text-cm-blue hover:underline">
          Resend code
        </button>
      </div>
      {resendMsg && <p className="text-center text-xs text-slate-500 dark:text-slate-400">{resendMsg}</p>}
    </form>
  );
}
