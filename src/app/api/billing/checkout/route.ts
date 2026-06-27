import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";
import { getStripe, isStripeConfigured, stripePriceId, appUrl, devSimulateAllowed, trialDays, type BillingInterval } from "@/lib/stripe";
import { isPaid, logPaywallEvent, billingEnabled } from "@/lib/plan";
import { recordPaymentSuccess } from "@/lib/billing-events";

// Starts a QuizSpark Plus subscription. Returns { url } to redirect the browser to
// Stripe Checkout. When Stripe isn't configured (dev), it simulates the upgrade
// so the full flow is testable before keys arrive.
export async function POST(req: Request): Promise<Response> {
  // Free build: billing is off — no checkout can be started.
  if (!billingEnabled()) return NextResponse.json({ error: "Billing is disabled." }, { status: 404 });
  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as { interval?: BillingInterval };
  const interval: BillingInterval = body.interval === "year" ? "year" : "month";

  const user = await prisma.user.findUnique({
    where: { id: auth.parent.userId },
    select: { id: true, email: true, plan: true, stripeCustomerId: true },
  });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (isPaid(user.plan)) {
    return NextResponse.json({ url: `${appUrl()}/parent/upgrade?already=1` });
  }
  void logPaywallEvent(user.id, "checkout_started");

  // ── Real Stripe ──
  if (isStripeConfigured()) {
    const stripe = getStripe()!;
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }
    // Use the requested interval's price; fall back to monthly if annual isn't
    // configured. Apply a free trial when STRIPE_TRIAL_DAYS is set.
    const price = stripePriceId(interval) ?? stripePriceId("month")!;
    const trial = trialDays();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${appUrl()}/parent/upgrade?success=1`,
      cancel_url: `${appUrl()}/parent/upgrade?canceled=1`,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id }, ...(trial > 0 ? { trial_period_days: trial } : {}) },
      allow_promotion_codes: true,
    });
    if (!session.url) return NextResponse.json({ error: "Could not start checkout." }, { status: 502 });
    return NextResponse.json({ url: session.url });
  }

  // ── Dev simulate (opt-in, no keys, non-production) ──
  if (devSimulateAllowed()) {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "paid", subscriptionStatus: "active", currentPeriodEnd: periodEnd },
    });
    // Mirror the real webhook side-effects (receipt + notification + welcome).
    await recordPaymentSuccess({
      userId: user.id,
      stripeInvoiceId: `sim_${user.id}_${periodEnd.getTime()}`,
      amount: 500,
      currency: "usd",
      receiptUrl: null,
      periodEnd,
      subscriptionRef: `sim_${user.id}`,
    });
    return NextResponse.json({ url: `${appUrl()}/parent/upgrade?success=1&simulated=1`, simulated: true });
  }

  return NextResponse.json({ error: "Billing isn't configured yet." }, { status: 503 });
}
