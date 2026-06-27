"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Approve / revoke a student's access (the gate for self-claimed students).
// Shown to tutors (assigned) and admins. Hidden once approved unless you want
// the revoke affordance — we show a small "approved" state with a revoke link.
export default function ApproveStudentButton({
  studentId, approved,
}: { studentId: number; approved: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function set(next: boolean) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/students/${studentId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: next }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed.");
      return;
    }
    router.refresh();
  }

  if (approved) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
        ✅ Approved
        <button onClick={() => set(false)} disabled={busy} className="underline hover:text-emerald-900 dark:hover:text-emerald-100">revoke</button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">Pending approval</span>
      <button
        onClick={() => set(true)}
        disabled={busy}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {busy ? "Approving…" : "Approve student"}
      </button>
      {error && <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>}
    </span>
  );
}
