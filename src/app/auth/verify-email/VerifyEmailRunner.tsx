"use client";

import { useEffect, useState } from "react";

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
    return <p className="text-sm text-slate-600 dark:text-slate-400">Verifying your email…</p>;
  }
  if (state.status === "ok") {
    return (
      <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        ✓ {state.message}
      </p>
    );
  }
  return (
    <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">
      {state.message ?? "Verification failed."}
    </p>
  );
}
