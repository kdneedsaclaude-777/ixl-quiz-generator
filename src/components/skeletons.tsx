// Reusable skeletons. Used by Next.js loading.tsx files for slow async pages.
// All use the same animate-pulse subtle gray block so they read as "placeholder"
// instantly without competing visually with real content.

type CommonProps = { className?: string };

export function SkeletonBlock({ className = "" }: CommonProps) {
  return <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700/60 ${className}`} />;
}

export function SkeletonText({ width = "w-full", height = "h-4" }: { width?: string; height?: string }) {
  return <SkeletonBlock className={`${width} ${height}`} />;
}

export function SkeletonCard({ height = "h-24" }: { height?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 ${height}`}>
      <SkeletonText width="w-1/3" height="h-3" />
      <div className="mt-3"><SkeletonText width="w-2/3" height="h-6" /></div>
    </div>
  );
}

export function SkeletonCardsGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
        <SkeletonText width="w-1/4" height="h-3" />
      </div>
      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex items-center justify-between gap-4 px-3 py-3">
            <div className="flex-1 space-y-2">
              <SkeletonText width="w-1/3" height="h-3" />
              <SkeletonText width="w-1/2" height="h-3" />
            </div>
            <SkeletonBlock className="h-7 w-20" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SkeletonChart({ height = "h-56" }: { height?: string }) {
  return <SkeletonBlock className={`w-full rounded-lg ${height}`} />;
}
