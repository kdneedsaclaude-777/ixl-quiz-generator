// Runs once when the server boots (Next.js instrumentation hook). We use it to
// fail fast on a misconfigured PRODUCTION environment rather than starting up
// and crashing on the first request — a missing NEXTAUTH_SECRET or DATABASE_URL
// is a silent footgun otherwise.
//
// Dev and the build step are left untouched. Only a real `next start` with
// NODE_ENV=production is validated.
export async function register(): Promise<void> {
  // Only the Node.js server runtime — skip the edge runtime and the build phase.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NODE_ENV !== "production") return;

  const missing: string[] = [];
  const warnings: string[] = [];

  // ── Hard requirements — the app cannot run safely without these ──
  if (!process.env.NEXTAUTH_SECRET) missing.push("NEXTAUTH_SECRET (sign-in tokens)");
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL (database connection)");
  if (!process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXTAUTH_URL) {
    missing.push("NEXT_PUBLIC_APP_URL (public origin for links & Stripe redirects)");
  }

  // ── Dangerous flag that must never be on in production ──
  if (process.env.PUBLIC_TEST_MODE === "true") {
    missing.push("PUBLIC_TEST_MODE must NOT be 'true' in production (it disables email verification)");
  }

  // ── Soft requirements — degrade gracefully but worth shouting about ──
  // Skip Stripe warnings entirely when billing is intentionally off (free build).
  const billingOff = process.env.NEXT_PUBLIC_BILLING_ENABLED === "false";
  if (billingOff) {
    console.log("[startup] 💸 Billing is OFF — running the FREE build (all features unlocked).");
  } else {
    const stripeReady = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID;
    if (!stripeReady) warnings.push("Stripe is not fully configured (STRIPE_SECRET_KEY + STRIPE_PRICE_ID) — paid upgrades are disabled.");
    if (!process.env.STRIPE_WEBHOOK_SECRET) warnings.push("STRIPE_WEBHOOK_SECRET is unset — payment webhooks will be rejected.");
  }
  const emailReady = process.env.SMTP_HOST || process.env.RESEND_API_KEY;
  if (!emailReady) warnings.push("No email transport (SMTP_HOST or RESEND_API_KEY) — verification/notification emails will not send.");
  if (!process.env.CRON_SECRET) warnings.push("CRON_SECRET is unset — scheduled email endpoint will reject all calls.");

  for (const w of warnings) console.warn(`[startup] ⚠️  ${w}`);

  if (missing.length > 0) {
    console.error("[startup] ❌ Refusing to start — missing/invalid production configuration:");
    for (const m of missing) console.error(`         • ${m}`);
    throw new Error(`Missing required production environment: ${missing.join("; ")}`);
  }

  console.log("[startup] ✅ Production environment validated.");
}
