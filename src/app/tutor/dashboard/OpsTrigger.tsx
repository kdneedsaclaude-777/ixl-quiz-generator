"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

// Invisible hotspot in the bottom-right corner. Five quick taps within 2.5s
// navigates to the code gate. Deliberately unlabeled — only someone who knows
// it's here (and knows the code) can get through.
export default function OpsTrigger() {
  const router = useRouter();
  const taps = useRef<number[]>([]);

  function onClick() {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      router.push("/ops");
    }
  }

  return (
    <button
      type="button"
      aria-hidden
      tabIndex={-1}
      onClick={onClick}
      className="fixed bottom-0 right-0 z-50 h-8 w-8 cursor-default opacity-0"
      style={{ background: "transparent", border: "none" }}
    />
  );
}
