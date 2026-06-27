"use client";

import { useState } from "react";

// Parent-side control to generate a one-time student claim code for a child
// that doesn't yet have its own login. The plaintext code is shown once;
// the parent passes it to the student, who redeems it at /auth/claim.
export default function InviteStudent({ childId, hasLogin }: { childId: number; hasLogin: boolean }) {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (hasLogin) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Student login</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          This child already has their own student login. ✅
        </p>
      </section>
    );
  }

  async function generate() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/parent/child/${childId}/claim-code`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Couldn't generate a code."); return; }
    setCode(data.code);
    setExpiresAt(data.expiresAt);
  }

  async function copy() {
    if (!code) return;
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="font-semibold text-slate-900 dark:text-slate-100">Invite this student to set up their own login</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Generate a one-time code, then share it with your child. They&apos;ll enter it at the
        sign-up page to create their login. A tutor approves them before they can start.
      </p>

      {!code ? (
        <button onClick={generate} disabled={busy} className="mt-3 rounded-md bg-[#175a86] px-4 py-2 text-sm font-semibold text-white hover:bg-[#134a6e] disabled:opacity-50">
          {busy ? "Generating…" : "Generate invite code"}
        </button>
      ) : (
        <div className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Invite code (shown once)</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-mono text-2xl font-bold tracking-widest text-slate-900 dark:text-slate-100">{code}</span>
            <button onClick={copy} className="rounded border border-indigo-300 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-200">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Have your child go to <span className="font-medium">/auth/claim</span> and enter this code.
            {expiresAt && <> Expires {new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.</>}
            {" "}Save it now — it won&apos;t be shown again (you can always regenerate).
          </p>
          <button onClick={generate} disabled={busy} className="mt-2 text-xs text-indigo-600 underline hover:text-indigo-800 dark:text-indigo-300">
            Regenerate (invalidates this one)
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </section>
  );
}
