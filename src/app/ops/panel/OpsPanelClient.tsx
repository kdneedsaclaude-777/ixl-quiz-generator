"use client";

import { useState } from "react";

export type HolidayRow = {
  id: string;
  name: string;
  currency: string;
  override: "auto" | "on" | "off";
};

const OPTIONS: { value: HolidayRow["override"]; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "on", label: "Force ON" },
  { value: "off", label: "Force OFF" },
];

export default function OpsPanelClient({
  rows,
  activeHolidayId,
}: {
  rows: HolidayRow[];
  activeHolidayId: string | null;
}) {
  const [state, setState] = useState<Record<string, HolidayRow["override"]>>(
    Object.fromEntries(rows.map((r) => [r.id, r.override])),
  );
  const [active, setActive] = useState(activeHolidayId);
  const [note, setNote] = useState<string | null>(null);

  async function change(id: string, override: HolidayRow["override"]) {
    const prev = state[id];
    setState((s) => ({ ...s, [id]: override }));
    setNote(null);
    try {
      const res = await fetch("/api/ops/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holidayId: id, override }),
      });
      if (!res.ok) {
        setState((s) => ({ ...s, [id]: prev }));
        const j = await res.json().catch(() => ({}));
        setNote(j.error ?? "Couldn't save.");
        return;
      }
      // Recompute which one is live (force-on wins; else natural unless off).
      const next = { ...state, [id]: override };
      const forcedOn = rows.find((r) => next[r.id] === "on");
      setActive(forcedOn ? forcedOn.id : activeHolidayId && next[activeHolidayId] !== "off" ? activeHolidayId : null);
      setNote("Saved.");
    } catch {
      setState((s) => ({ ...s, [id]: prev }));
      setNote("Couldn't save.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Holiday events</h2>
        <span className="text-xs text-slate-400">
          Live now: <strong className="text-slate-700 dark:text-slate-200">{active ?? "none"}</strong>
        </span>
      </div>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        Auto = follows the calendar (hidden until each holiday). Force ON previews an event now; Force OFF disables it.
      </p>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {r.name}
                {active === r.id && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    LIVE
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">{r.currency}</div>
            </div>
            <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
              {OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => change(r.id, o.value)}
                  className={`px-2.5 py-1 text-xs font-semibold ${
                    state[r.id] === o.value
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {note && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{note}</p>}
    </section>
  );
}
