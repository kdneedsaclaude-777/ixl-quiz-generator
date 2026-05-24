// Server-rendered XP progress bar. The fill is just a static `width: %` so
// no client JS is needed; animation happens on /child/quiz/[id]/results.
export default function XPBar({
  level, currentLevelXp, nextLevelXp,
}: { level: number; currentLevelXp: number; nextLevelXp: number }) {
  const pct = Math.round((currentLevelXp / nextLevelXp) * 100);
  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-white p-5 shadow-sm dark:border-amber-800/50 dark:bg-slate-800">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Level {level}</div>
        <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
          {currentLevelXp} / {nextLevelXp} XP
        </div>
      </div>
      <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950/60">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
