"use client";

import { useState } from "react";
import CMIcon from "@/components/CMIcon";

const FREE_FEATURES = [
  { label: "1 quiz per day", on: true },
  { label: "1 child profile", on: true },
  { label: "Practice quizzes + badges & XP", on: true },
  { label: "Real Tests (timed, proctored)", on: false },
  { label: "Weekly leaderboard", on: false },
  { label: "Full progress, charts & history", on: false },
  { label: "Unlimited children", on: false },
];

const PLUS_FEATURES = [
  "Unlimited quizzes",
  "Unlimited children",
  "Real Tests — timed & proctored",
  "Weekly leaderboard",
  "Full progress, charts & history",
  "Everything in Free",
];

export default function UpgradeClient({
  paid,
  currentPeriodEnd,
  flash,
  simulated,
  hasAnnual = false,
  trialDays = 0,
}: {
  paid: boolean;
  currentPeriodEnd: string | null;
  flash: "success" | "canceled" | "already" | null;
  simulated: boolean;
  hasAnnual?: boolean;
  trialDays?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<"month" | "year">("month");

  async function go(endpoint: "checkout" | "portal") {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: endpoint === "checkout" ? JSON.stringify({ interval }) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? "Something went wrong.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  const renews = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const yearly = interval === "year";
  const priceLabel = yearly ? "$50" : "$5";
  const periodLabel = yearly ? "/yr" : "/mo";
  const ctaLabel =
    trialDays > 0
      ? `Start ${trialDays}-day free trial`
      : yearly
        ? "Upgrade — $50/year"
        : "Upgrade — $5/month";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="text-center">
        <div className="text-xs font-semibold tracking-wide text-slate-500">QUIZLY PLUS</div>
        <h1 className="font-display mt-1 text-[40px] leading-none text-slate-900">Unlock the full QuizSpark.</h1>
        <p className="mt-2 text-sm text-slate-500">
          One simple plan — <span className="font-bold text-slate-900">$5/month</span>. Cancel anytime.
        </p>
      </header>

      {flash === "success" && (
        <p className="rounded-xl px-4 py-3 text-center text-sm font-semibold" style={{ background: "var(--cm-mint-soft)", color: "#047857" }}>
          🎉 You&apos;re on QuizSpark Plus{simulated ? " (simulated)" : ""} — everything&apos;s unlocked!
        </p>
      )}
      {flash === "canceled" && (
        <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-600">
          {simulated ? "Subscription canceled (simulated)." : "Checkout canceled — no charge was made."}
        </p>
      )}
      {flash === "already" && (
        <p className="rounded-xl px-4 py-3 text-center text-sm" style={{ background: "var(--cm-blue-50)", color: "var(--cm-blue)" }}>
          You&apos;re already on QuizSpark Plus.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Free */}
        <section className="cm-card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-slate-900">Free</h2>
            <span className="font-display text-2xl text-slate-900">$0</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Great for trying QuizSpark out.</p>
          <ul className="mt-4 space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5 text-sm">
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
                  style={{ background: f.on ? "var(--cm-mint-soft)" : "var(--slate-100)" }}
                >
                  <CMIcon name={f.on ? "check" : "x"} size={12} color={f.on ? "var(--cm-mint)" : "var(--slate-400)"} stroke={3} />
                </span>
                <span className={f.on ? "text-slate-700" : "text-slate-400 line-through"}>{f.label}</span>
              </li>
            ))}
          </ul>
          {!paid && (
            <div className="mt-5 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-500">
              Your current plan
            </div>
          )}
        </section>

        {/* Plus */}
        <section className="cm-card p-6" style={{ border: "2px solid var(--cm-blue)", boxShadow: "0 0 0 4px var(--cm-blue-50)" }}>
          <div className="flex items-baseline justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <CMIcon name="spark" size={18} color="var(--cm-gold)" /> QuizSpark Plus
            </h2>
            <span><span className="font-display text-2xl text-slate-900">{priceLabel}</span><span className="text-sm text-slate-500">{periodLabel}</span></span>
          </div>
          <p className="mt-1 text-xs text-slate-500">The whole experience, for the whole family.</p>
          <ul className="mt-4 space-y-2.5">
            {PLUS_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ background: "var(--cm-mint-soft)" }}>
                  <CMIcon name="check" size={12} color="var(--cm-mint)" stroke={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>

          {paid ? (
            <div className="mt-5">
              <div className="rounded-xl px-3 py-2 text-center text-xs font-semibold" style={{ background: "var(--cm-mint-soft)", color: "#047857" }}>
                ✓ Active{renews ? ` · renews ${renews}` : ""}
              </div>
              <button onClick={() => go("portal")} disabled={loading} className="cm-btn ghost mt-3 w-full justify-center disabled:opacity-50">
                {loading ? "Opening…" : "Manage subscription"}
              </button>
            </div>
          ) : (
            <>
              {hasAnnual && (
                <div className="mt-5 grid grid-cols-2 gap-1 rounded-full border border-slate-200 p-1">
                  {(["month", "year"] as const).map((iv) => {
                    const on = interval === iv;
                    return (
                      <button
                        key={iv}
                        type="button"
                        onClick={() => setInterval(iv)}
                        className="rounded-full py-1.5 text-xs font-bold transition-colors"
                        style={{ background: on ? "var(--cm-blue)" : "transparent", color: on ? "#fff" : "var(--slate-600)" }}
                      >
                        {iv === "month" ? "Monthly" : "Yearly · 2 months free"}
                      </button>
                    );
                  })}
                </div>
              )}
              <button onClick={() => go("checkout")} disabled={loading} className="cm-btn primary lg mt-3 w-full justify-center disabled:opacity-50">
                {loading ? "Starting…" : ctaLabel}
                {!loading && <CMIcon name="arrow" size={18} color="#fff" />}
              </button>
              {trialDays > 0 && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  {trialDays}-day free trial, then {priceLabel}{periodLabel}. Cancel anytime.
                </p>
              )}
            </>
          )}
        </section>
      </div>

      {error && <p className="rounded-xl bg-cm-red-soft px-4 py-3 text-center text-sm" style={{ color: "#B43326" }}>{error}</p>}

      <p className="text-center text-xs text-slate-400">
        Secure payments by Stripe. Cancel anytime — Plus stays active until the end of your billing period.
      </p>
    </div>
  );
}
