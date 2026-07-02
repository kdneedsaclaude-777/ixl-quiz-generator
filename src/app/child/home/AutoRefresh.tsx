"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Lightweight near-real-time refresh for the child home: re-fetches the server
// component on an interval and whenever the tab regains focus, so newly
// tutor-assigned quizzes/homework/tests appear without a manual reload.
export default function AutoRefresh({ intervalMs = 25_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      // Don't refresh a backgrounded tab (saves work; focus handler covers return).
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, intervalMs);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, [router, intervalMs]);
  return null;
}
