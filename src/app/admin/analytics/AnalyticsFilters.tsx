"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Controls for the "Quizzes by grade" chart. Updates the URL search params
// so the server re-fetches with the new filter; works without JS too (a
// plain form submit would round-trip the params).
export default function AnalyticsFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const urlGrade = params.get("gr") ?? "all";
  const urlName = params.get("q") ?? "";
  const [grade, setGrade] = useState(urlGrade);
  const [name, setName] = useState(urlName);
  // Debounce the name search so each keystroke doesn't fire a request.
  const [debounced, setDebounced] = useState(name);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(name), 300);
    return () => clearTimeout(id);
  }, [name]);

  // Sync FROM the URL whenever it changes externally (back-button, paste,
  // bookmarked filter URL). Without this, the dropdown + input show stale
  // values after navigation. The check guards against echoing our own writes.
  useEffect(() => {
    if (urlGrade !== grade) setGrade(urlGrade);
    if (urlName !== name) {
      setName(urlName);
      setDebounced(urlName); // skip debounce on a URL pop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlGrade, urlName]);

  useEffect(() => {
    const next = new URLSearchParams(params.toString());
    if (grade && grade !== "all") next.set("gr", grade);
    else next.delete("gr");
    if (debounced.trim()) next.set("q", debounced.trim());
    else next.delete("q");
    const qs = next.toString();
    startTransition(() => router.replace(`/admin/analytics${qs ? `?${qs}` : ""}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, debounced]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Filter:
      </label>
      <select
        aria-label="Filter by grade"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
        className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="all">All grades</option>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
          <option key={g} value={g}>
            Grade {g}
          </option>
        ))}
      </select>
      <input
        type="search"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Search student name…"
        aria-label="Search student name"
        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
      {(grade !== "all" || name.trim()) && (
        <button
          type="button"
          onClick={() => {
            setGrade("all");
            setName("");
          }}
          className="text-xs font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Clear
        </button>
      )}
    </div>
  );
}
