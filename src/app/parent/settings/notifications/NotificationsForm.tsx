"use client";

import { useState } from "react";
import CMIcon from "@/components/CMIcon";

type Initial = {
  emailEveryQuiz: boolean;
  weeklyDigest: boolean;
  alertBelowScorePct: number;
  alertNoPracticeDays: number;
  streakReminder: boolean;
};

export default function NotificationsForm({ initial }: { initial: Initial }) {
  const [emailEveryQuiz, setEmailEveryQuiz] = useState(initial.emailEveryQuiz);
  const [weeklyDigest, setWeeklyDigest] = useState(initial.weeklyDigest);
  const [streakReminder, setStreakReminder] = useState(initial.streakReminder);
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
          streakReminder,
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
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="cm-card p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-cm-blue-50 text-cm-blue dark:bg-slate-700">
            <CMIcon name="bell" size={15} color="var(--cm-blue)" />
          </span>
          <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Emails</h2>
        </div>
        <div className="mt-4 space-y-3">
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
          <ToggleRow
            label="Streak reminders"
            description="A friendly nudge when a child has a streak going but hasn't practised yet today."
            value={streakReminder}
            onChange={setStreakReminder}
          />
        </div>
      </section>

      <section className="cm-card p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-cm-gold-soft text-cm-gold">
            <CMIcon name="target" size={15} color="var(--cm-gold)" />
          </span>
          <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Thresholds</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">When should we nudge you to step in?</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-baseline justify-between gap-3">
              <div className="font-semibold text-slate-900 dark:text-slate-100">Alert me if a score drops below</div>
              <div className="flex items-center gap-1.5 text-sm">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={alertScore}
                  onChange={(e) => setAlertScore(e.target.value)}
                  className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
                />
                <span className="font-semibold text-slate-500 dark:text-slate-400">%</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-baseline justify-between gap-3">
              <div className="font-semibold text-slate-900 dark:text-slate-100">Alert me if no practice in</div>
              <div className="flex items-center gap-1.5 text-sm">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={alertDays}
                  onChange={(e) => setAlertDays(e.target.value)}
                  className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
                />
                <span className="font-semibold text-slate-500 dark:text-slate-400">days</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && <p className="rounded-lg bg-cm-red-soft px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
      {saved && <p className="rounded-lg bg-cm-mint-soft px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">Saved.</p>}

      <button type="submit" disabled={saving} className="cm-btn primary disabled:opacity-50">
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}

function ToggleRow({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/40">
      <div>
        <div className="font-semibold text-slate-900 dark:text-slate-100">{label}</div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {/* Pill-style switch — keeps the native checkbox for a11y + form logic. */}
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-cm-blue peer-focus-visible:ring-2 peer-focus-visible:ring-cm-blue peer-focus-visible:ring-offset-2 dark:bg-slate-600 dark:peer-checked:bg-cm-blue"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}
