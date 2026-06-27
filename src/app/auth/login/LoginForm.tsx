"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signIn("credentials", { email, password: pw, redirect: false });
    if (!res || res.error) {
      setError(res?.error?.startsWith("Your account") ? res.error : "Email or password is incorrect.");
      setSubmitting(false);
      return;
    }
    // Land on "/", which role-routes server-side (admin/tutor/student/parent).
    window.location.href = "/";
  }

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-cm-blue dark:border-slate-600 dark:bg-slate-700 dark:text-white";
  const labelCls = "mb-1.5 block text-sm font-semibold text-slate-900 dark:text-slate-100";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelCls}>Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelCls}>Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            className={`${inputCls} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {showPw ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.77 9.77 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Link href="/auth/forgot-password" className="text-sm font-medium text-cm-blue hover:underline">
          Forgot password?
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>
      )}

      <button type="submit" disabled={submitting} className="cm-btn primary lg w-full justify-center disabled:opacity-50">
        {submitting ? "Logging in…" : "Login"}
      </button>
    </form>
  );
}
