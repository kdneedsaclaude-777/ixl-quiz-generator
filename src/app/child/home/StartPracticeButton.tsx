"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartPracticeButton({ studentId }: { studentId: number }) {
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
        body: JSON.stringify({ studentId, questionCount: 10 }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        // 423 = parental lock; show the friendly reason from the API
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
    <div className="flex w-full flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full max-w-sm rounded-2xl bg-amber-500 px-8 py-5 text-xl font-extrabold text-white shadow-md transition-transform hover:scale-[1.02] hover:bg-amber-600 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
      >
        {loading ? "Loading…" : "Start Practice! ✏️"}
      </button>
      {error && <p className="rounded bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p>}
    </div>
  );
}
