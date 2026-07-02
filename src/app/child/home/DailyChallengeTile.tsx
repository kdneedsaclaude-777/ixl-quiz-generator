"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CMIcon from "@/components/CMIcon";

// Daily Challenge: a short (5-question) quiz on the GLOBAL topic of the day —
// the same challenge for every student in the grade, rotating daily, always at
// the hardest difficulty. The topic is computed server-side and passed in.
export default function DailyChallengeTile({
  studentId,
  topicLetter,
  topicName,
}: {
  studentId: number;
  topicLetter: string;
  topicName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          questionCount: 5,
          topicLetter,
          difficulty: 5, // hardest — this is meant to be tough
          isDailyChallenge: true,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Couldn't start the challenge right now.");
      }
      const { quizId } = await res.json();
      router.push(`/child/quiz/${quizId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start the challenge right now.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-label={`Start today's daily challenge: ${topicName}`}
        className="flex w-full items-center gap-3 rounded-[18px] border p-3.5 text-left transition-transform active:translate-y-0.5 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cm-gold"
        style={{ background: "var(--cm-gold-soft)", borderColor: "rgba(232,163,23,.35)" }}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white" aria-hidden>
          <CMIcon name="target" size={22} color="var(--cm-gold)" />
        </span>
        <span className="flex-1">
          <span className="flex items-center gap-1.5">
            <span className="block text-[11px] font-bold tracking-wide" style={{ color: "#B45309" }}>
              DAILY CHALLENGE
            </span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ background: "var(--cm-gold-soft)", color: "#B45309", border: "1px solid rgba(232,163,23,.4)" }}
            >
              Advanced
            </span>
          </span>
          <span className="block text-sm font-bold text-slate-900">{topicName}</span>
          <span className="block text-xs text-slate-600">
            {loading ? "Preparing today's challenge…" : "Today's featured topic at the highest difficulty."}
          </span>
        </span>
        <CMIcon name="chevron" size={18} color="#B45309" />
      </button>
      {error && <p className="mt-1.5 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p>}
    </div>
  );
}
