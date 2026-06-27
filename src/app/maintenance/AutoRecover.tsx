"use client";

import { useEffect, useState } from "react";

// Quietly polls maintenance status; when the flag flips off, navigates home
// so the user doesn't have to refresh by hand. Slow poll (every 5s) so we
// don't hammer the server while everyone is sitting on this page.
export default function AutoRecover() {
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch("/api/maintenance/status", { cache: "no-store" });
        if (!cancelled && res.ok) {
          const j = (await res.json()) as { on?: boolean };
          if (j.on === false) {
            setRestored(true);
            // brief beat so the "we're back" message is visible
            setTimeout(() => {
              if (!cancelled) window.location.replace("/");
            }, 600);
          }
        }
      } catch {
        /* ignore — try again next interval */
      }
    }
    tick(); // immediate first check
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <p
      aria-live="polite"
      className={`mt-6 text-xs font-medium ${
        restored
          ? "text-cm-mint"
          : "text-slate-400 dark:text-slate-500"
      }`}
    >
      {restored
        ? "✓ We're back — taking you home…"
        : "Checking for updates every few seconds…"}
    </p>
  );
}
