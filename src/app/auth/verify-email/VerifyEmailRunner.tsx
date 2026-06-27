"use client";

import { useEffect, useState } from "react";
import CMIcon from "@/components/CMIcon";

type State = { status: "pending" | "ok" | "error"; message?: string };

export default function VerifyEmailRunner({ token }: { token: string }) {
  const [state, setState] = useState<State>({ status: "pending" });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", message: "Missing token in the URL." });
      return;
    }
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
  return (
    <div className="rounded-2xl border border-cm-red-soft bg-cm-red-soft/60 p-5 dark:border-rose-800 dark:bg-rose-950/40">
      <span className="cm-pill coral">
        <CMIcon name="x" size={14} color="currentColor" />
        Verification failed
      </span>
      <p className="mt-2 text-sm text-slate-700 dark:text-rose-200">
        {state.message ?? "Verification failed."}
      </p>
    </div>
  );
}
