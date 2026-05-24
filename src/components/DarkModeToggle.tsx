"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "quiz-app-theme";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // localStorage may be unavailable (private mode); ignore.
    }
    // Persist to DB for logged-in users. The API silently no-ops for anon
    // sessions so we never need to know auth state on the client.
    void fetch("/api/preferences/dark-mode", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ darkMode: next }),
    }).catch(() => {});
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
    </button>
  );
}
