"use client";

import { useState } from "react";

// Tutor action: generate (assign) an adaptive practice quiz for a roster
// student. The quiz lands in the student's account for them to take.
export default function AssignQuizButton({ studentId }: { studentId: number }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function go() {
    setState("loading");
    try {
      const res = await fetch("/api/tutor/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={state === "loading" || state === "done"}
      className="cm-btn primary disabled:opacity-60"
      style={{ background: "var(--cm-mint)" }}
    >
      {state === "loading"
        ? "Assigning…"
        : state === "done"
          ? "✓ Quiz assigned"
          : state === "error"
            ? "Failed — retry"
            : "Assign a quiz"}
    </button>
  );
}
