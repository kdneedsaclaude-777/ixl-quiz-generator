"use client";

import { useState } from "react";

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
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/40">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Your account is ready! 🎉
          </p>
          <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
            No email verification needed for testing — just log in.
          </p>
          <a
            href="/auth/login"
            className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Log in →
          </a>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          We&apos;ve sent a verification email to <span className="font-semibold">{email}</span>. Open the link to
          activate your account.
        </div>

        {devVerifyUrl && (
          <div className="rounded-lg border border-indigo-300 bg-indigo-50 p-4 dark:border-indigo-700 dark:bg-indigo-950/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
              Dev mode — no real inbox
            </p>
            <p className="mt-1 text-sm text-indigo-900 dark:text-indigo-100">
              Email isn&apos;t actually delivered locally. Verify in one click:
            </p>
            <a
              href={devVerifyUrl}
              className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Verify my email now →
            </a>
            {previewUrl && (
              <p className="mt-3 text-xs text-indigo-700 dark:text-indigo-300">
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
      <Field id="name" label="Your name" value={name} onChange={setName} required autoComplete="name" />
      <Field id="email" label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
      <Field id="password" label="Password" type="password" value={pw} onChange={setPw} required autoComplete="new-password" hint="≥8 chars, 1 uppercase, 1 number." />
      <Field id="confirm" label="Confirm password" type="password" value={confirm} onChange={setConfirm} required autoComplete="new-password" />
      {error && <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
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
      <label htmlFor={id} className="block text-sm font-medium text-slate-900 dark:text-slate-100">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
      />
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
