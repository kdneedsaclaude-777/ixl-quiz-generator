"use client";

import { useEffect } from "react";
import { Logo } from "@/components/Logo";

// Next.js calls this for ANY uncaught error inside a route segment. Keeps the
// app shell (layout, nav) and replaces the failing route with a retry card.
// global-error.tsx handles errors thrown inside the root layout itself.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-8 flex justify-center">
        <Logo size={36} tagline />
      </div>
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-10 shadow-card dark:border-slate-700 dark:bg-slate-800">
        <div className="flex justify-center">
          <span className="cm-pill coral">Error</span>
        </div>
        <h1 className="font-display mt-4 text-3xl leading-[1.05] tracking-tight text-slate-900 dark:text-slate-100">
          Something went wrong
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          We hit an unexpected error while loading this page. Try again, or go
          back home.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-slate-400 dark:text-slate-500">
            Error ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={reset} className="cm-btn primary">
            Try again
          </button>
          <a href="/" className="cm-btn ghost">
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
