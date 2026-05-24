"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GenerateResponse = {
  quizId: number;
  reused?: boolean;
  isFirstQuiz?: boolean;
};

export default function GenerateQuizButton({ studentId }: { studentId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // `reused` is non-null once a response comes back, so the UI can tell the
  // user whether a fresh quiz was made or an existing unstarted one reopened.
  const [reused, setReused] = useState<boolean | null>(null);

  async function onClick() {
    setError(null);
    setReused(null);
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, questionCount: 10 }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to generate quiz");
      }
      const data = (await res.json()) as GenerateResponse;

      // Handle the two cases differently. Either way we end up on the same
      // quiz page — but the message tells the user what happened so a repeat
      // click doesn't feel like a no-op or an accidental duplicate.
      setReused(Boolean(data.reused));
      const href = `/quiz/${data.quizId}?studentId=${studentId}`;

      if (data.reused) {
        // Reused: the child has an unstarted quiz already. Show a brief note,
        // then reopen it (no duplicate was created).
        // Keep `loading` true through the 800ms wait so the button stays
        // disabled — otherwise a fast user can spam-click during the pause
        // and fire multiple POSTs / queued navigations. `setLoading(false)`
        // would run when the component unmounts after router.push.
        setTimeout(() => router.push(href), 800);
      } else {
        // Brand-new quiz: go straight in.
        router.push(href);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate quiz");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Loading…" : "New quiz"}
      </button>

      {reused === true && (
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
          You already had a quiz ready — reopening it.
        </p>
      )}
      {reused === false && (
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          New quiz created!
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
