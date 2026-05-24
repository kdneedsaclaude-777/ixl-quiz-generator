"use client";

import { useEffect } from "react";

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
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl" aria-hidden>⚠️</div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        We hit an unexpected error while loading this page. Try again, or go back home.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-slate-400 dark:text-slate-500">
          Error ref: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
        >
          Go home
        </a>
      </div>
    </main>
  );
}
