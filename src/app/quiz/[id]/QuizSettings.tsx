"use client";

export type QuizMode = "all" | "card";

export default function QuizSettings({
  mode,
  setMode,
  timerEnabled,
  setTimerEnabled,
  timerSeconds,
  setTimerSeconds,
  disabled,
}: {
  mode: QuizMode;
  setMode: (m: QuizMode) => void;
  timerEnabled: boolean;
  setTimerEnabled: (v: boolean) => void;
  timerSeconds: number;
  setTimerSeconds: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Mode</span>
        <div role="group" aria-label="Quiz layout mode" className="inline-flex rounded border border-slate-300 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMode("all")}
            disabled={disabled}
            aria-pressed={mode === "all"}
            className={`rounded-l px-3 py-1 text-xs font-medium ${mode === "all" ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"}`}
          >
            All at once
          </button>
          <button
            type="button"
            onClick={() => setMode("card")}
            disabled={disabled}
            aria-pressed={mode === "card"}
            className={`rounded-r border-l border-slate-300 px-3 py-1 text-xs font-medium dark:border-slate-700 ${mode === "card" ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"}`}
          >
            One at a time
          </button>
        </div>
      </div>
      {/* A per-question timer only makes sense one-question-at-a-time, so the
          controls are hidden entirely in "All at once" mode. */}
      {mode === "card" && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={timerEnabled}
              onChange={(e) => setTimerEnabled(e.target.checked)}
              disabled={disabled}
            />
            Per-question timer
          </label>
          <label className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-200">
            <span>Seconds</span>
            <input
              type="number"
              min={5}
              max={300}
              step={5}
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(Math.max(5, Math.min(300, parseInt(e.target.value, 10) || 30)))}
              disabled={disabled || !timerEnabled}
              className="w-16 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs dark:border-slate-500 dark:bg-slate-700 dark:text-white"
            />
          </label>
        </div>
      )}
    </div>
  );
}
