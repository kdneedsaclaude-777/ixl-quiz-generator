"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Reactive URL-backed filters for /admin/quizzes. Same pattern as
// AnalyticsFilters — debounced name search, sync FROM url when it changes.
export default function QuizzesFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const urlGrade = params.get("gr") ?? "all";
  const urlName = params.get("q") ?? "";
  const urlStatus = params.get("status") ?? "completed";

  const [grade, setGrade] = useState(urlGrade);
  const [name, setName] = useState(urlName);
  const [status, setStatus] = useState(urlStatus);
  const [debounced, setDebounced] = useState(name);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(name), 300);
    return () => clearTimeout(id);
  }, [name]);

  // Sync FROM url (back-button / paste).
  useEffect(() => {
    if (urlGrade !== grade) setGrade(urlGrade);
    if (urlName !== name) { setName(urlName); setDebounced(urlName); }
    if (urlStatus !== status) setStatus(urlStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlGrade, urlName, urlStatus]);

  useEffect(() => {
    const next = new URLSearchParams(params.toString());
    if (grade && grade !== "all") next.set("gr", grade); else next.delete("gr");
    if (debounced.trim()) next.set("q", debounced.trim()); else next.delete("q");
    if (status && status !== "completed") next.set("status", status); else next.delete("status");
    next.delete("page"); // reset paging on filter change
    const qs = next.toString();
    startTransition(() => router.replace(`/admin/quizzes${qs ? `?${qs}` : ""}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, debounced, status]);

  const ctrlCls =
    "rounded-lg border px-2 py-1.5 text-sm text-white placeholder:text-[color:var(--shell-muted)] focus:outline-none focus:ring-2 focus:ring-[#A5B4FC]/40 border-[color:var(--shell-border)] bg-white/5";
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border p-3" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
      <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--shell-muted)]">Filter:</span>
      <select
        aria-label="Filter by grade"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
        className={ctrlCls}
      >
        <option value="all">All grades</option>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => <option key={g} value={g}>Grade {g}</option>)}
      </select>
      <input
        type="search"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Search student name…"
        aria-label="Search student name"
        className={`${ctrlCls} px-3`}
      />
      <select
        aria-label="Filter by status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className={ctrlCls}
      >
        <option value="completed">Completed only</option>
        <option value="active">Active (not yet submitted)</option>
        <option value="all">Any status</option>
      </select>
      {(grade !== "all" || name.trim() || status !== "completed") && (
        <button
          type="button"
          onClick={() => { setGrade("all"); setName(""); setStatus("completed"); }}
          className="text-xs font-medium text-[#A5B4FC] underline hover:text-white"
        >
          Clear
        </button>
      )}
    </div>
  );
}
