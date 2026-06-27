"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

// Range selector for the Score trend chart. Writes ?range=30d|90d|1y or
// ?from=YYYY-MM-DD&to=YYYY-MM-DD to the URL; the server dashboard reads it,
// recomputes the buckets, and re-renders the chart. Default is 30d.
export default function TrendRangeFilter({
  range,
  from,
  to,
}: {
  range: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [showCustom, setShowCustom] = useState(range === "custom");
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  function setRange(r: string) {
    const next = new URLSearchParams(params.toString());
    next.set("range", r);
    next.delete("from");
    next.delete("to");
    setShowCustom(false);
    startTransition(() => router.replace(`/parent/dashboard?${next.toString()}`));
  }

  function applyCustom() {
    if (!f || !t) return;
    const next = new URLSearchParams(params.toString());
    next.set("range", "custom");
    next.set("from", f);
    next.set("to", t);
    startTransition(() => router.replace(`/parent/dashboard?${next.toString()}`));
  }

  const PRESETS = [
    { key: "30d", label: "Last 30 days" },
    { key: "90d", label: "Last 90 days" },
    { key: "1y", label: "Last 1 year" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => setRange(p.key)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            range === p.key
              ? "bg-indigo-600 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          {p.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setShowCustom((v) => !v)}
        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
          range === "custom"
            ? "bg-indigo-600 text-white"
            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        }`}
      >
        Custom
      </button>
      {showCustom && (
        <span className="flex items-center gap-1">
          <input type="date" value={f} onChange={(e) => setF(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
          <span className="text-xs text-slate-400">→</span>
          <input type="date" value={t} onChange={(e) => setT(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
          <button type="button" onClick={applyCustom} className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700">Apply</button>
        </span>
      )}
    </div>
  );
}
