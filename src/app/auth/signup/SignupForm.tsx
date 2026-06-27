"use client";

import { useState } from "react";
import CMIcon from "@/components/CMIcon";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [autoVerified, setAutoVerified] = useState(false);

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
      setDevVerifyUrl(typeof j.devVerifyUrl === "string" ? j.devVerifyUrl : null);
      setPreviewUrl(typeof j.previewUrl === "string" ? j.previewUrl : null);
      setAutoVerified(j.autoVerified === true);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent && autoVerified) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-cm-mint/40 bg-cm-mint-soft p-5 dark:border-emerald-700 dark:bg-emerald-950/40">
          <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "var(--cm-mint)" }}>
            <CMIcon name="check" size={22} color="#fff" stroke={2.25} />
          </span>
          <p className="mt-3 font-display text-2xl leading-tight text-slate-900 dark:text-emerald-50">
            Your account is ready!
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-emerald-200">
            No email verification needed for testing — just log in.
          </p>
          <a href="/auth/login" className="cm-btn primary mt-4 w-full">
            Log in
            <CMIcon name="arrow" size={18} color="#fff" />
          </a>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-cm-mint/40 bg-cm-mint-soft p-5 dark:border-emerald-800 dark:bg-emerald-950/40">
          <span className="cm-pill mint">
            <CMIcon name="bell" size={14} color="currentColor" />
            Check your inbox
          </span>
          <p className="mt-3 text-sm text-slate-700 dark:text-emerald-200">
            We&apos;ve sent a verification email to{" "}
            <span className="font-semibold text-slate-900 dark:text-emerald-50">{email}</span>. Open the link to
            activate your account.
          </p>
        </div>

        {devVerifyUrl && (
          <div className="rounded-2xl border border-cm-blue-100 bg-cm-blue-50 p-5 dark:border-indigo-700 dark:bg-indigo-950/40">
            <span className="cm-pill indigo">
              <CMIcon name="spark" size={14} color="currentColor" />
              Dev mode — no real inbox
            </span>
            <p className="mt-2 text-sm text-slate-700 dark:text-indigo-100">
              Email isn&apos;t actually delivered locally. Verify in one click:
            </p>
            <a href={devVerifyUrl} className="cm-btn primary mt-3 w-full">
              Verify my email now
              <CMIcon name="arrow" size={18} color="#fff" />
            </a>
            {previewUrl && (
              <p className="mt-3 text-xs text-cm-blue dark:text-indigo-300">
                Or view the rendered email:{" "}
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline"
                >
                  Ethereal preview
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

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
