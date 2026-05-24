"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type FlagRow = { key: string; enabled: boolean; description: string };

export default function FeatureFlagsTable({ rows, danger = false }: { rows: FlagRow[]; danger?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(row: FlagRow) {
    setBusy(row.key);
    setError(null);
    try {
      const res = await fetch(`/api/admin/feature-flags/${row.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !row.enabled }),
      });
      if (!res.ok) throw new Error("Failed.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {error && <p className="rounded bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <ul className="divide-y divide-slate-700 rounded-lg border border-slate-700 bg-slate-900/40">
        {rows.length === 0 && <li className="px-4 py-3 text-sm text-slate-400">No flags here.</li>}
        {rows.map((r) => {
          const isOn = r.enabled;
          const pill = danger && isOn
            ? "bg-rose-700 text-white"
            : isOn
              ? "bg-emerald-600 text-white"
              : "bg-slate-700 text-slate-300";
          return (
            <li key={r.key} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <div className="font-mono text-slate-100">{r.key}</div>
                <div className="text-xs text-slate-400">{r.description}</div>
              </div>
              <button
                type="button"
                onClick={() => toggle(r)}
                disabled={busy === r.key}
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${pill} disabled:opacity-50`}
                aria-pressed={isOn}
              >
                {busy === r.key ? "…" : isOn ? "On" : "Off"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
