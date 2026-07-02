"use client";

import { useState } from "react";

export default function VerifyBanner({ email }: { email: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    setSending(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSending(false);
    setSent(true);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      <span>
        Please verify your email ({email}). Enter the 6-digit code we emailed you to finish — check your spam folder if
        it&apos;s not there.
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={`/auth/verify-email?email=${encodeURIComponent(email)}`}
          className="rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
        >
          Enter code
        </a>
        <button
          type="button"
          onClick={resend}
          disabled={sending || sent}
          className="rounded border border-amber-600 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 dark:text-amber-200 dark:hover:bg-amber-900/40"
        >
          {sent ? "Sent ✓" : sending ? "Sending…" : "Resend code"}
        </button>
      </div>
    </div>
  );
}
