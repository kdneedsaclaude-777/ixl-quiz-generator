import Stripe from "stripe";

// Stripe wiring for the QuizSpark Plus ($5/mo) subscription. Env-gated so the app
// runs without keys; the routes fall back to a dev-only simulated upgrade until
// real keys are provided. Required env (set when going live):
//   STRIPE_SECRET_KEY        sk_test_… / sk_live_…
//   STRIPE_WEBHOOK_SECRET    whsec_…  (from `stripe listen` or the dashboard)
//   STRIPE_PRICE_ID          price_…  (a recurring $5/month price)
//   NEXT_PUBLIC_APP_URL      e.g. https://app.quizly.… (falls back to NEXTAUTH_URL)

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) cached = new Stripe(key);
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

export type BillingInterval = "month" | "year";

// Monthly = STRIPE_PRICE_ID; annual = STRIPE_PRICE_ID_ANNUAL (optional).
export function stripePriceId(interval: BillingInterval = "month"): string | null {
  if (interval === "year") return process.env.STRIPE_PRICE_ID_ANNUAL ?? null;
  return process.env.STRIPE_PRICE_ID ?? null;
}

export function hasAnnualPlan(): boolean {
  return Boolean(process.env.STRIPE_PRICE_ID_ANNUAL);
}

// Optional free-trial length (days) applied to new subscriptions. 0 = no trial.
export function trialDays(): number {
  const n = parseInt(process.env.STRIPE_TRIAL_DAYS ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

// Real Stripe is the ONLY upgrade path in the shipped build. The simulated
// upgrade is off by default and must be explicitly opted into for a local
// dry-run (BILLING_DEV_SIMULATE=1). It can never fire in production, and is
// ignored once real Stripe keys are configured — so Plus is never granted
// without a real payment.
export function devSimulateAllowed(): boolean {
  return (
    process.env.BILLING_DEV_SIMULATE === "1" &&
    process.env.NODE_ENV !== "production" &&
    !isStripeConfigured()
  );
}
