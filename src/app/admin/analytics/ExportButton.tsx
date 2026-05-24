"use client";

import { useState } from "react";

const DATASETS = [
  { key: "heatmap", label: "Heatmap (grade × topic)" },
  { key: "difficulty", label: "Difficulty curve" },
  { key: "dropoff", label: "Drop-off (started vs completed)" },
  { key: "quizzes", label: "Quiz log (all completed)" },
];

export default function ExportButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded border border-slate-500 bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600"
      >
        Export CSV ▾
      </button>
      {open && (
        <ul className="absolute right-0 z-10 mt-1 w-64 rounded-lg border border-slate-600 bg-slate-800 p-1 text-sm shadow-lg">
          {DATASETS.map((d) => (
            <li key={d.key}>
              <a
                href={`/api/admin/analytics/export?dataset=${d.key}`}
                className="block rounded px-3 py-2 text-slate-100 hover:bg-slate-700"
                onClick={() => setOpen(false)}
              >
                {d.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
