import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { recordPaymentSuccess } from "@/lib/billing-events";

// Stripe is the source of truth for subscription state. This webhook flips
// User.plan based on the subscription lifecycle. Configure the endpoint in
// Stripe (or `stripe listen --forward-to localhost:3000/api/billing/webhook`)
// and set STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request): Promise<Response> {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const raw = await req.text(); // raw body required for signature verification
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.warn("[stripe] webhook signature verification failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await applySubscription(sub, { userId, customerId });
        } else if (userId || customerId) {
          await setPlan({ userId, customerId }, { plan: "paid", status: "active", periodEnd: null, subId: null });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscription(sub, {});
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });
        if (!user) break;
        // Stripe field shapes vary across API versions — read defensively.
        const inv = invoice as unknown as {
          id?: string;
          amount_paid?: number;
          total?: number;
          currency?: string;
          hosted_invoice_url?: string | null;
          subscription?: string | { id: string } | null;
          lines?: { data?: { period?: { end?: number } }[] };
        };
        const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id ?? "";
        const periodEndUnix = inv.lines?.data?.[0]?.period?.end;
        await recordPaymentSuccess({
          userId: user.id,
          stripeInvoiceId: inv.id ?? null,
          amount: inv.amount_paid ?? inv.total ?? 0,
          currency: inv.currency ?? "usd",
          receiptUrl: inv.hosted_invoice_url ?? null,
          periodEnd: periodEndUnix ? new Date(periodEndUnix * 1000) : null,
          subscriptionRef: subId,
        });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] webhook handler error:", err);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// active/trialing → paid; anything else (canceled, past_due, unpaid…) → free.
function statusToPlan(status: string): "free" | "paid" {
  return status === "active" || status === "trialing" ? "paid" : "free";
}

async function applySubscription(
  sub: Stripe.Subscription,
  hint: { userId?: string; customerId?: string },
): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  const userId = hint.userId ?? (sub.metadata?.userId as string | undefined);
  const periodEndUnix = (sub as unknown as { current_period_end?: number }).current_period_end;
  await setPlan(
    { userId, customerId: hint.customerId ?? customerId },
    {
      plan: statusToPlan(sub.status),
      status: sub.status,
      periodEnd: periodEndUnix ? new Date(periodEndUnix * 1000) : null,
      subId: sub.id,
    },
  );
}

async function setPlan(
  who: { userId?: string; customerId?: string },
  data: { plan: "free" | "paid"; status: string; periodEnd: Date | null; subId: string | null },
): Promise<void> {
  // Prefer the stripe customer id (stable), fall back to the userId metadata.
  const where = who.customerId
    ? { stripeCustomerId: who.customerId }
    : who.userId
      ? { id: who.userId }
      : null;
  if (!where) return;
  const update: Record<string, unknown> = {
    plan: data.plan,
    subscriptionStatus: data.status,
    currentPeriodEnd: data.periodEnd,
  };
  if (data.subId) update.stripeSubscriptionId = data.subId;
  await prisma.user.updateMany({ where, data: update });
}
