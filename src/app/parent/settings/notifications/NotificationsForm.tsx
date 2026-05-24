"use client";

import { useState } from "react";

type Initial = {
  emailEveryQuiz: boolean;
  weeklyDigest: boolean;
  alertBelowScorePct: number;
  alertNoPracticeDays: number;
};

export default function NotificationsForm({ initial }: { initial: Initial }) {
  const [emailEveryQuiz, setEmailEveryQuiz] = useState(initial.emailEveryQuiz);
  const [weeklyDigest, setWeeklyDigest] = useState(initial.weeklyDigest);
  const [alertScore, setAlertScore] = useState(String(initial.alertBelowScorePct));
  const [alertDays, setAlertDays] = useState(String(initial.alertNoPracticeDays));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/parent/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailEveryQuiz,
          weeklyDigest,
          alertBelowScorePct: Math.max(0, Math.min(100, parseInt(alertScore, 10) || 60)),
          alertNoPracticeDays: Math.max(1, Math.min(30, parseInt(alertDays, 10) || 7)),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Save failed.");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <ToggleRow
        label="Email me after every quiz"
        description="A short summary lands in your inbox as soon as your child finishes a quiz."
        value={emailEveryQuiz}
        onChange={setEmailEveryQuiz}
      />
      <ToggleRow
        label="Weekly progress digest"
        description="Every Sunday at 8am: weekly summary across all your children."
        value={weeklyDigest}
        onChange={setWeeklyDigest}
      />
      <div className="rounded border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-medium text-slate-900 dark:text-slate-100">Alert me if a score drops below</div>
          <div className="flex items-center gap-1 text-sm">
            <input
              type="number"
              min={0}
              max={100}
              value={alertScore}
              onChange={(e) => setAlertScore(e.target.value)}
              className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-right text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
            />
            <span className="text-slate-600 dark:text-slate-400">%</span>
          </div>
        </div>
      </div>
      <div className="rounded border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-medium text-slate-900 dark:text-slate-100">Alert me if no practice in</div>
          <div className="flex items-center gap-1 text-sm">
            <input
              type="number"
              min={1}
              max={30}
              value={alertDays}
              onChange={(e) => setAlertDays(e.target.value)}
              className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-right text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
            />
            <span className="text-slate-600 dark:text-slate-400">days</span>
          </div>
        </div>
      </div>

      {error && <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
      {saved && <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">Saved.</p>}

      <button type="submit" disabled={saving} className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}

function ToggleRow({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/40">
      <input type="checkbox" className="mt-1" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <div>
        <div className="font-medium text-slate-900 dark:text-slate-100">{label}</div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </label>
  );
}
