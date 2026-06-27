"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CMIcon from "@/components/CMIcon";

// The big coral start button from the design bundle (student.jsx): 86px tall,
// a 3D bottom shadow, eyebrow + title + play-circle. Generates a fresh adaptive
// practice quiz and routes into it.
export default function StartPracticeButton({
  studentId,
  hasResumable = false,
}: {
  studentId: number;
  hasResumable?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);

  async function onClick() {
    setError(null);
    setUpgrade(false);
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, questionCount: 10 }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        // 402 = freemium paywall; 423 = parental lock.
        if (j.upgrade) setUpgrade(true);
        throw new Error(j.error ?? "Couldn't start a quiz right now.");
      }
      const { quizId } = await res.json();
      router.push(`/child/quiz/${quizId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start a quiz right now.");
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-label="Start a new practice quiz"
        className="flex w-full items-center gap-3 rounded-[20px] px-5 text-left text-white transition-transform active:translate-y-0.5 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cm-red/40"
        style={{ height: 86, background: "var(--cm-coral)", boxShadow: "0 6px 0 #C8483F" }}
      >
        <span className="flex-1">
          <span className="block text-[11px] font-bold tracking-wide" style={{ color: "rgba(255,255,255,.92)" }}>
            {hasResumable ? "START A NEW QUIZ" : "YOUR NEXT QUIZ"}
          </span>
          <span className="block text-[22px] font-extrabold leading-tight">
            {loading ? "Starting…" : "Start practice"}
          </span>
        </span>
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full"
          style={{ background: "rgba(255,255,255,.22)" }}
          aria-hidden
        >
          <CMIcon name="play" size={26} color="#fff" />
        </span>
      </button>
      {error && (
        <div className={`rounded-xl px-3 py-2.5 text-sm ${upgrade ? "" : "bg-rose-100 text-rose-800"}`} style={upgrade ? { background: "var(--cm-gold-soft)", color: "#92660A" } : undefined}>
          <p>{error}</p>
          {upgrade && (
            <Link href="/parent/upgrade" className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ background: "var(--cm-blue)" }}>
              <CMIcon name="spark" size={14} color="#fff" /> See QuizSpark Plus
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
