"use client";

import { useEffect, useRef, useState } from "react";

// Counts down once per question and emits onTimeout exactly once. Re-mounting
// (different `questionId`) restarts. `paused` freezes the bar in place — used
// after submit or once a question is locked.
export default function QuestionTimer({
  questionId,
  seconds,
  paused,
  onTimeout,
}: {
  questionId: number;
  seconds: number;
  paused: boolean;
  onTimeout: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const fired = useRef(false);

  useEffect(() => {
    fired.current = false;
    setRemaining(seconds);
  }, [questionId, seconds]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 0.1) {
          if (!fired.current) {
            fired.current = true;
            onTimeout();
          }
          return 0;
        }
        return r - 0.1;
      });
    }, 100);
    return () => clearInterval(id);
  }, [paused, onTimeout]);

  const pct = Math.max(0, Math.min(100, (remaining / seconds) * 100));
  const tone =
    pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div
      className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      aria-label={`Time remaining: ${remaining.toFixed(0)} seconds`}
    >
      <div
        className={`h-full transition-[width] duration-100 ease-linear ${tone}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
