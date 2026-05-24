"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Shared paginator. Preserves all other query params; only the `page` slot
// changes. Styled for the dark admin surface; pass `tone="light"` if it
// ever needs to live on a light page.
export default function Pagination({
  page,
  totalPages,
  basePath,
  tone = "dark",
}: {
  page: number;
  totalPages: number;
  basePath: string;
  tone?: "dark" | "light";
}) {
  const params = useSearchParams();
  if (totalPages <= 1) return null;

  const make = (p: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(p));
    return `${basePath}?${next.toString()}`;
  };

  const linkClass = tone === "dark"
    ? "rounded border border-slate-500 bg-slate-700 px-3 py-1 text-slate-100 hover:bg-slate-600"
    : "rounded border border-slate-300 bg-white px-3 py-1 text-slate-900 hover:bg-slate-50 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600";
  const disabledClass = tone === "dark"
    ? "rounded border border-slate-700 bg-slate-800 px-3 py-1 text-slate-500"
    : "rounded border border-slate-200 bg-slate-100 px-3 py-1 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500";
  const labelClass = tone === "dark" ? "text-slate-300" : "text-slate-700 dark:text-slate-300";

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-between text-sm ${labelClass}`}>
      <span>Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        {page > 1
          ? <Link href={make(page - 1)} className={linkClass} aria-label="Previous page">← Prev</Link>
          : <span className={disabledClass} aria-disabled="true">← Prev</span>}
        {page < totalPages
          ? <Link href={make(page + 1)} className={linkClass} aria-label="Next page">Next →</Link>
          : <span className={disabledClass} aria-disabled="true">Next →</span>}
      </div>
    </nav>
  );
}
