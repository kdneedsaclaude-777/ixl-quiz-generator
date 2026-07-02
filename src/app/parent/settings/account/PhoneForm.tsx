"use client";

import { useEffect, useState } from "react";
import CMIcon from "@/components/CMIcon";

type Stage = "idle" | "code-sent" | "verified";

export default function PhoneForm({
  initialPhone,
  initialVerified,
}: {
  initialPhone: string | null;
  initialVerified: boolean;
}) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>(initialVerified ? "verified" : "idle");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Keep the input in sync with the latest server-side value when it changes
  // (e.g. after a verify round-trip on a different tab).
  useEffect(() => {
    if (initialVerified) setStage("verified");
  }, [initialVerified]);

  async function sendCode() {
    setBusy(true);
    setError(null);
    setInfo(null);
    setDevCode(null);
    try {
      const res = await fetch("/api/account/phone/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not send code.");
      setStage("code-sent");
      setInfo("We sent a 6-digit code to that number.");
      if (typeof j.devCode === "string") setDevCode(j.devCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/account/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Verification failed.");
      setStage("verified");
      setInfo("Phone verified.");
      setCode("");
      setDevCode(null);
      if (typeof j.phone === "string") setPhone(j.phone);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function removePhone() {
    if (!confirm("Remove your verified phone number?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/phone", { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove phone.");
      setStage("idle");
      setPhone("");
      setInfo("Phone removed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove phone.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "verified") {
    return (
      <Shell>
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-cm-mint bg-cm-mint-soft px-4 py-3 text-sm dark:border-emerald-700 dark:bg-emerald-950/40">
            <span className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-100">
              <CMIcon name="check" size={16} color="var(--cm-mint)" /> {phone}
            </span>
            <button
              type="button"
              onClick={removePhone}
              disabled={busy}
              className="rounded-full border border-cm-red bg-white px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-cm-red-soft disabled:opacity-50 dark:border-rose-700 dark:bg-slate-800 dark:text-rose-300"
            >
              Remove
            </button>
          </div>
          {info && <Note tone="ok">{info}</Note>}
          {error && <Note tone="err">{error}</Note>}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mt-5 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 123 4567"
            autoComplete="tel"
            disabled={stage === "code-sent" || busy}
            className="cm-field flex-1 disabled:opacity-60 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
          />
          <button
            type="button"
            onClick={sendCode}
            disabled={busy || !phone.trim() || stage === "code-sent"}
            className="cm-btn primary shrink-0 disabled:opacity-50"
          >
            {stage === "code-sent" ? "Code sent" : busy ? "Sending…" : "Send code"}
          </button>
        </div>

        {stage === "code-sent" && (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit code"
                className="cm-field flex-1 text-center font-mono text-lg tracking-widest dark:border-slate-500 dark:bg-slate-700 dark:text-white"
              />
              <button
                type="button"
                onClick={verifyCode}
                disabled={busy || code.length !== 6}
                className="cm-btn shrink-0 disabled:opacity-50"
                style={{ background: "var(--cm-mint)", color: "#fff" }}
              >
                {busy ? "Verifying…" : "Verify"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setStage("idle");
                setCode("");
                setDevCode(null);
                setInfo(null);
              }}
              className="text-xs font-semibold text-cm-blue underline hover:text-cm-blue-600 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Change number
            </button>
            {devCode && (
              <p className="rounded-xl border border-cm-blue bg-cm-blue-50 px-3 py-2 text-xs text-cm-blue-600 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-100">
                <span className="font-semibold">Text messaging isn&apos;t set up yet</span> — enter this code to verify:{" "}
                <span className="font-mono">{devCode}</span>
              </p>
            )}
          </div>
        )}

        {info && <Note tone="ok">{info}</Note>}
        {error && <Note tone="err">{error}</Note>}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="cm-card p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-cm-blue-50 text-cm-blue dark:bg-slate-700">
          <CMIcon name="bell" size={15} color="var(--cm-blue)" />
        </span>
        <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Phone</h2>
        <span className="cm-pill ml-auto">Optional</span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Add a verified phone number as a second contact channel.
      </p>
      {children}
    </section>
  );
}

function Note({ tone, children }: { tone: "ok" | "err"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "bg-cm-mint-soft text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
      : "bg-cm-red-soft text-rose-700 dark:bg-rose-950/40 dark:text-rose-200";
  return <p className={`rounded-lg px-3 py-2 text-sm ${cls}`}>{children}</p>;
}
