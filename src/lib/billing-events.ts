import { prisma } from "@/lib/db";
import { notifyPlusWelcome } from "@/lib/notifications";
import { logPaywallEvent } from "@/lib/plan";

function formatMoney(amountMinor: number, currency: string): string {
  try {
    return (amountMinor / 100).toLocaleString("en-US", { style: "currency", currency: currency.toUpperCase() });
  } catch {
    return `$${(amountMinor / 100).toFixed(2)}`;
  }
}

// Called by the Stripe webhook on invoice.payment_succeeded. Idempotent per
// invoice: records the receipt, drops an in-app notification to the parent the
// moment the payment lands, and sends the advanced Plus welcome email (deduped
// per subscription, so renewals don't re-welcome).
export async function recordPaymentSuccess(args: {
  userId: string;
  stripeInvoiceId: string | null;
  amount: number; // minor units (cents)
  currency: string;
  receiptUrl: string | null;
  periodEnd: Date | null;
  subscriptionRef: string; // subscription id — welcome dedup key
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: args.userId },
    select: { name: true, email: true },
  });
  if (!user) return;

  // Record the receipt. Unique invoice id makes this idempotent — a duplicate
  // webhook delivery throws and we skip the notification/email too.
  let isNew = false;
  try {
    await prisma.payment.create({
      data: {
        userId: args.userId,
        stripeInvoiceId: args.stripeInvoiceId,
        amount: args.amount,
        currency: args.currency,
        status: "paid",
        description: "QuizSpark Plus — monthly",
        receiptUrl: args.receiptUrl,
        periodEnd: args.periodEnd,
        paidAt: new Date(),
      },
    });
    isNew = true;
  } catch {
    isNew = false; // duplicate invoice → already processed
  }
  if (!isNew) return;

  const money = formatMoney(args.amount, args.currency);

  // Immediate in-app notification (every successful payment).
  await prisma.notification
    .create({
      data: {
        userId: args.userId,
        type: "payment_received",
        title: "You're on QuizSpark Plus 🎉",
        body: `Your ${money} payment went through — every feature is unlocked for your family.`,
        href: "/parent/upgrade",
      },
    })
    .catch((err) => console.error("[billing] notification create failed", err));

  // Funnel: a real conversion.
  void logPaywallEvent(args.userId, "upgraded");

  // Advanced welcome email (once per subscription).
  await notifyPlusWelcome({
    userId: args.userId,
    to: user.email,
    name: user.name,
    refKey: args.subscriptionRef || args.stripeInvoiceId || "plus",
  });
}
