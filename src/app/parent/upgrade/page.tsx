import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import { isPaid, billingEnabled } from "@/lib/plan";
import { hasAnnualPlan, trialDays } from "@/lib/stripe";
import UpgradeClient from "./UpgradeClient";

export const metadata = { title: "QuizSpark Plus" };

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; already?: string; simulated?: string }>;
}) {
  // Free build: no upgrade flow — send users back to their dashboard.
  if (!billingEnabled()) redirect("/parent/dashboard");
  const parent = await requireParentSession();
  const user = await prisma.user.findUnique({
    where: { id: parent.userId },
    select: { plan: true, currentPeriodEnd: true },
  });
  const sp = await searchParams;

  return (
    <UpgradeClient
      paid={isPaid(user?.plan)}
      currentPeriodEnd={user?.currentPeriodEnd ? user.currentPeriodEnd.toISOString() : null}
      flash={sp.success ? "success" : sp.canceled ? "canceled" : sp.already ? "already" : null}
      simulated={sp.simulated === "1"}
      hasAnnual={hasAnnualPlan()}
      trialDays={trialDays()}
    />
  );
}
