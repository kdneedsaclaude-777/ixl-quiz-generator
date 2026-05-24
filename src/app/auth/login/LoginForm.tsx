"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signIn("credentials", {
      email,
      password: pw,
      redirect: false,
    });
    if (!res || res.error) {
      setError(res?.error?.startsWith("Your account") ? res.error : "Email or password is incorrect.");
      setSubmitting(false);
      return;
    }
    // Land on "/", which role-routes server-side (admin/tutor/student/parent).
    window.location.href = "/";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-900 dark:text-slate-100">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-900 dark:text-slate-100">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
        />
      </div>
      {error && <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
