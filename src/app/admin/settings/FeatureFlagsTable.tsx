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
      {error && <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(194,95,95,.15)", color: "#FCA5A5" }}>{error}</p>}
      <ul className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--shell-border)", background: "rgba(255,255,255,.02)" }}>
        {rows.length === 0 && <li className="px-4 py-3 text-sm text-[color:var(--shell-muted)]">No flags here.</li>}
        {rows.map((r, i) => {
          const isOn = r.enabled;
          const pillStyle: React.CSSProperties = danger && isOn
            ? { background: "var(--cm-coral)", color: "#fff" }
            : isOn
              ? { background: "var(--cm-mint)", color: "#fff" }
              : { background: "rgba(255,255,255,.08)", color: "var(--shell-muted)" };
          return (
            <li
              key={r.key}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--shell-border)" }}
            >
              <div>
                <div className="font-mono text-white">{r.key}</div>
                <div className="text-xs text-[color:var(--shell-muted)]">{r.description}</div>
              </div>
              <button
                type="button"
                onClick={() => toggle(r)}
                disabled={busy === r.key}
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                style={pillStyle}
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
