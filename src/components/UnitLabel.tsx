"use client";

import { useId, useState } from "react";

// Shows a curriculum UNIT name (e.g. "Fractions") with an expand chevron.
// Clicking reveals a small popover with the specific skill TITLE
// (e.g. "Adding fractions"), so learners/parents never see raw codes like
// "S.5" — the code is only shown muted inside the popover for reference.
export default function UnitLabel({
  unit,
  title,
  code,
  className = "",
}: {
  unit: string;
  title: string;
  code?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="inline-flex items-center gap-1 rounded font-medium text-slate-700 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:text-indigo-400"
      >
        <span>{unit}</span>
        <span
          aria-hidden="true"
          className={`text-[10px] transition-transform ${open ? "rotate-90" : ""}`}
        >
          ▸
        </span>
      </button>
      {open && (
        <span
          id={id}
          role="status"
          className="absolute left-0 top-full z-30 mt-1 w-max max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-600 dark:bg-slate-800"
        >
          <span className="block font-semibold text-slate-900 dark:text-slate-100">{title}</span>
          {code && (
            <span className="mt-0.5 block font-mono text-[10px] text-slate-400 dark:text-slate-500">
              {code}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
