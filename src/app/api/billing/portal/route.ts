import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";
import { getStripe, isStripeConfigured, appUrl, devSimulateAllowed } from "@/lib/stripe";
import { billingEnabled } from "@/lib/plan";

// Opens the Stripe billing portal so a parent can manage/cancel QuizSpark Plus.
// In dev-simulate mode (no Stripe keys) it just downgrades the account so the
// cancel flow is testable.
export async function POST(): Promise<Response> {
  // Free build: nothing to manage.
  if (!billingEnabled()) return NextResponse.json({ error: "Billing is disabled." }, { status: 404 });
  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const user = await prisma.user.findUnique({
    where: { id: auth.parent.userId },
    select: { id: true, stripeCustomerId: true },
  });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  if (isStripeConfigured() && user.stripeCustomerId) {
    const stripe = getStripe()!;
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl()}/parent/upgrade`,
    });
    return NextResponse.json({ url: session.url });
  }

  if (devSimulateAllowed()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "free", subscriptionStatus: "canceled", currentPeriodEnd: null },
    });
    return NextResponse.json({ url: `${appUrl()}/parent/upgrade?canceled=1&simulated=1`, simulated: true });
  }

  return NextResponse.json({ error: "No subscription to manage." }, { status: 400 });
}
