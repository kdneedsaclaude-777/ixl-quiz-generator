"use client";

import { useState } from "react";
import CMIcon from "@/components/CMIcon";

type Phase = "form" | "code" | "verified";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("form");
  const [autoVerified, setAutoVerified] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (pw !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pw }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Sign up failed");
      if (j.autoVerified === true) {
        setAutoVerified(true);
        setPhase("verified");
        return;
      }
      const dc = typeof j.devCode === "string" ? j.devCode : null;
      setDevCode(dc);
      if (dc) setCode(dc);
      setEmailSent(typeof j.emailSent === "boolean" ? j.emailSent : null);
      setPhase("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setVerifyError(null);
    const clean = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(clean)) {
      setVerifyError("Enter the 6-digit code from your email.");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: clean }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Verification failed.");
      setPhase("verified");
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  async function onResend() {
    setResendMsg(null);
    setVerifyError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await res.json().catch(() => ({}));
      if (typeof j.devCode === "string") {
        setDevCode(j.devCode);
        setCode(j.devCode);
      }
      setResendMsg("A fresh code is on its way. Check your inbox (and spam).");
    } catch {
      setResendMsg("Couldn't resend just now — try again in a moment.");
    }
  }

  // ── Verified ─────────────────────────────────────────────────────────────
  if (phase === "verified") {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-cm-mint/40 bg-cm-mint-soft p-5 dark:border-emerald-700 dark:bg-emerald-950/40">
          <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "var(--cm-mint)" }}>
            <CMIcon name="check" size={22} color="#fff" stroke={2.25} />
          </span>
          <p className="mt-3 font-display text-2xl leading-tight text-slate-900 dark:text-emerald-50">
            {autoVerified ? "Your account is ready!" : "You're verified!"}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-emerald-200">
            {autoVerified
              ? "No email verification needed for testing — just log in."
              : "Your email is confirmed. Log in to get started."}
          </p>
          <a href="/auth/login" className="cm-btn primary mt-4 w-full">
            Log in
            <CMIcon name="arrow" size={18} color="#fff" />
          </a>
        </div>
      </div>
    );
  }

  // ── Enter code ───────────────────────────────────────────────────────────
  if (phase === "code") {
    return (
      <form onSubmit={onVerify} className="space-y-4">
        <div className="rounded-2xl border border-cm-mint/40 bg-cm-mint-soft p-5 dark:border-emerald-800 dark:bg-emerald-950/40">
          <span className="cm-pill mint">
            <CMIcon name="bell" size={14} color="currentColor" />
            Check your inbox
          </span>
          <p className="mt-3 text-sm text-slate-700 dark:text-emerald-200">
            We emailed a 6-digit code to{" "}
            <span className="font-semibold text-slate-900 dark:text-emerald-50">{email}</span>. Enter it below to
            activate your account.
          </p>
        </div>

        {emailSent === false && !devCode && (
          <p className="cm-pill coral w-full justify-start !h-auto py-2">
            <CMIcon name="x" size={14} color="currentColor" />
            We couldn&apos;t send the email just now — check spam, or tap Resend below.
          </p>
        )}

        {devCode && (
          <p className="rounded-xl bg-cm-blue-50 px-3 py-2 text-[13px] text-cm-blue dark:bg-indigo-950/40 dark:text-indigo-200">
            Test mode — your code is <span className="font-mono font-semibold">{devCode}</span> (also emailed if a
            provider is set).
          </p>
        )}

        <div>
          <label htmlFor="code" className="cm-label dark:!text-slate-100">6-digit code</label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="cm-field text-center font-mono text-2xl tracking-[0.4em] dark:!border-slate-500 dark:!bg-slate-700 dark:!text-white"
          />
        </div>

        {verifyError && (
          <p className="cm-pill coral w-full justify-start !h-auto py-2">
            <CMIcon name="x" size={14} color="currentColor" />
            {verifyError}
          </p>
        )}

        <button type="submit" disabled={verifying} className="cm-btn primary w-full disabled:opacity-50">
          {verifying ? "Verifying…" : "Verify email"}
          {!verifying && <CMIcon name="arrow" size={18} color="#fff" />}
        </button>

        <div className="text-center text-sm text-slate-600 dark:text-slate-300">
          Didn&apos;t get it?{" "}
          <button type="button" onClick={onResend} className="font-medium text-cm-blue hover:underline">
            Resend code
          </button>
        </div>
        {resendMsg && <p className="text-center text-xs text-slate-500 dark:text-slate-400">{resendMsg}</p>}
      </form>
    );
  }

  // ── Sign-up form ─────────────────────────────────────────────────────────
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl bg-cm-mint-soft px-3 py-2 text-[13px] font-medium text-cm-mint dark:bg-emerald-950/40 dark:text-emerald-300">
        <CMIcon name="users" size={16} color="currentColor" />
        Free to start — one parent, unlimited learners.
      </div>
      <Field id="name" label="Your name" value={name} onChange={setName} required autoComplete="name" />
      <Field id="email" label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
      <Field id="password" label="Password" type="password" value={pw} onChange={setPw} required autoComplete="new-password" hint="≥8 chars, 1 uppercase, 1 number." />
      <Field id="confirm" label="Confirm password" type="password" value={confirm} onChange={setConfirm} required autoComplete="new-password" />
      {error && (
        <p className="cm-pill coral w-full justify-start !h-auto py-2">
          <CMIcon name="x" size={14} color="currentColor" />
          {error}
        </p>
      )}
      <button type="submit" disabled={submitting} className="cm-btn primary w-full disabled:opacity-50">
        {submitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function Field({
  id, label, value, onChange, type = "text", required, autoComplete, hint,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; autoComplete?: string; hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="cm-label dark:!text-slate-100">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="cm-field dark:!border-slate-500 dark:!bg-slate-700 dark:!text-white"
      />
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
