"use client";

import { useState } from "react";
import CMIcon from "@/components/CMIcon";

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setSubmitting(false);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-cm-mint/40 bg-cm-mint-soft p-5 dark:border-emerald-800 dark:bg-emerald-950/40">
        <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "var(--cm-mint)" }}>
          <CMIcon name="bell" size={20} color="#fff" stroke={2} />
        </span>
        <p className="mt-3 font-display text-xl leading-tight text-slate-900 dark:text-emerald-50">
          Check your inbox
        </p>
        <p className="mt-1 text-sm text-slate-700 dark:text-emerald-100">
          If an account exists for that email, we&apos;ve sent a password reset link. It expires in an hour — if it&apos;s
          not there in a minute, check your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl bg-cm-blue-50 px-3 py-2 text-[13px] font-medium text-cm-blue dark:bg-slate-700/40 dark:text-slate-300">
        <CMIcon name="lock" size={16} color="currentColor" />
        Links expire shortly and can only be used once.
      </div>
      <div>
        <label htmlFor="email" className="cm-label dark:!text-slate-100">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="cm-field dark:!border-slate-500 dark:!bg-slate-700 dark:!text-white"
        />
      </div>
      <button type="submit" disabled={submitting} className="cm-btn primary w-full disabled:opacity-50">
        {submitting ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
