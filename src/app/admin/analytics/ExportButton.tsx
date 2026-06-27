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
        className="rounded-full border border-[color:var(--shell-border)] bg-white/5 px-4 py-1.5 text-sm font-medium text-[color:var(--shell-text)] hover:bg-white/10"
      >
        Export CSV ▾
      </button>
      {open && (
        <ul className="absolute right-0 z-10 mt-1 w-64 rounded-xl border p-1 text-sm shadow-2xl" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
          {DATASETS.map((d) => (
            <li key={d.key}>
              <a
                href={`/api/admin/analytics/export?dataset=${d.key}`}
                className="block rounded-lg px-3 py-2 text-[color:var(--shell-text)] hover:bg-white/5"
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
