"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Near-real-time refresh for the child home, done cheaply: instead of re-running
// the whole home (~8 queries) on a timer, poll a tiny signature endpoint (2
// indexed aggregates) and only trigger the full refresh when the student's
// assigned work actually changes. Polls on an interval and on tab focus.
export default function AutoRefresh({
  signature,
  intervalMs = 30_000,
}: {
  signature: string;
  intervalMs?: number;
}) {
  const router = useRouter();
  const baseline = useRef(signature);
  // Keep the baseline in sync after a real refresh re-renders the page.
  useEffect(() => {
    baseline.current = signature;
  }, [signature]);

  useEffect(() => {
    let stopped = false;
    async function check() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/child/assigned-signature", { cache: "no-store" });
        if (!res.ok) return;
        const { sig } = (await res.json()) as { sig?: string };
        if (!stopped && typeof sig === "string" && sig && sig !== baseline.current) {
          baseline.current = sig;
          router.refresh();
        }
      } catch {
        // network blip — ignore, next tick retries
      }
    }
    const id = setInterval(check, intervalMs);
    window.addEventListener("focus", check);
    return () => {
      stopped = true;
      clearInterval(id);
      window.removeEventListener("focus", check);
    };
  }, [router, intervalMs]);

  return null;
}
