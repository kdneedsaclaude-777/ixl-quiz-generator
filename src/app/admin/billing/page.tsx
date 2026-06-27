import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { isPaid, PAID_PRICE_LABEL, billingEnabled } from "@/lib/plan";

export const metadata = { title: "Billing — Admin" };

function money(minor: number, currency = "usd"): string {
  try {
    return (minor / 100).toLocaleString("en-US", { style: "currency", currency: currency.toUpperCase() });
  } catch {
    return `$${(minor / 100).toFixed(2)}`;
  }
}
const fmtDate = (d: Date | null) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

// Superadmin billing overview — who's paid vs not, MRR, and the receipt log.
export default async function AdminBillingPage() {
  // Free build: billing dashboard is irrelevant — bounce to the main dashboard.
  if (!billingEnabled()) redirect("/admin/dashboard");
  const admin = await requireAdminSession();
  if (admin.role !== "superadmin") redirect("/admin/dashboard");

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const [parents, totals, recent, funnel] = await Promise.all([
    prisma.user.findMany({
      where: { role: "parent", deletedAt: null },
      orderBy: [{ plan: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        payments: { orderBy: { paidAt: "desc" }, take: 1, select: { amount: true, currency: true, paidAt: true, receiptUrl: true } },
      },
    }),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
    prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      take: 25,
      select: {
        id: true,
        amount: true,
        currency: true,
        paidAt: true,
        receiptUrl: true,
        description: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.paywallEvent.groupBy({
      by: ["reason"],
      where: { createdAt: { gte: since30 } },
      _count: { _all: true },
    }),
  ]);

  const paidCount = parents.filter((p) => isPaid(p.plan)).length;
  const freeCount = parents.length - paidCount;
  const mrr = paidCount * 500; // $5/mo each
  const collected = totals._sum.amount ?? 0;

  // Conversion funnel (last 30 days) from PaywallEvent.
  const fcount = (reason: string) => funnel.find((f) => f.reason === reason)?._count._all ?? 0;
  const wallHits = fcount("free_daily_limit") + fcount("paid_feature_test") + fcount("paid_feature_children");
  const checkoutsStarted = fcount("checkout_started");
  const upgrades = fcount("upgraded");
  const convRate = wallHits > 0 ? Math.round((upgrades / wallHits) * 100) : null;
  const funnelSteps = [
    { l: "Paywall hits", v: wallHits, hint: "free limits reached", c: "#FCD34D" },
    { l: "Checkouts started", v: checkoutsStarted, hint: "clicked upgrade", c: "#A5B4FC" },
    { l: "Upgrades", v: upgrades, hint: "paid & unlocked", c: "#86EFAC" },
    { l: "Wall → paid", v: convRate === null ? "—" : `${convRate}%`, hint: "conversion rate", c: "#67E8F9" },
  ];
  const reasonLabels: Record<string, string> = {
    free_daily_limit: "Daily quiz limit reached",
    paid_feature_test: "Tried Real Test (locked)",
    paid_feature_children: "Tried to add a child (locked)",
    checkout_started: "Started checkout",
    upgraded: "Upgraded to Plus",
  };
  const reasonRows = [...funnel]
    .sort((a, b) => b._count._all - a._count._all)
    .map((f) => ({ reason: f.reason, label: reasonLabels[f.reason] ?? f.reason, count: f._count._all }));

  const kpis = [
    { l: "Paying parents", v: String(paidCount), c: "#86EFAC" },
    { l: "On free", v: String(freeCount), c: "#FCD34D" },
    { l: "MRR", v: money(mrr), c: "#A5B4FC" },
    { l: "Collected (all-time)", v: money(collected), c: "#67E8F9" },
  ];

  return (
    <div className="space-y-4 text-[color:var(--shell-text)]">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs font-semibold tracking-wide text-[color:var(--shell-muted)]">BILLING</div>
          <h1 className="font-display mt-1 text-4xl leading-none text-white">QuizSpark Plus</h1>
        </div>
        <span className="cm-pill" style={{ background: "rgba(255,255,255,.06)", color: "var(--shell-text)" }}>{PAID_PRICE_LABEL}</span>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.l} className="rounded-2xl border p-3.5" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
            <div className="text-[11px] font-semibold tracking-wide text-[color:var(--shell-muted)]">{k.l.toUpperCase()}</div>
            <div className="font-display mt-1.5 text-2xl leading-none" style={{ color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Conversion funnel (last 30 days) */}
      <div className="rounded-2xl border p-[18px]" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-white">Conversion funnel</h2>
          <span className="text-[11px] font-semibold text-[color:var(--shell-muted)]">LAST 30 DAYS</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {funnelSteps.map((s) => (
            <div key={s.l} className="rounded-xl border p-3" style={{ background: "rgba(255,255,255,.02)", borderColor: "var(--shell-border)" }}>
              <div className="text-[11px] font-semibold tracking-wide text-[color:var(--shell-muted)]">{s.l.toUpperCase()}</div>
              <div className="font-display mt-1 text-2xl leading-none" style={{ color: s.c }}>{s.v}</div>
              <div className="mt-0.5 text-[11px] text-[color:var(--shell-muted)]">{s.hint}</div>
            </div>
          ))}
        </div>
        {reasonRows.length > 0 && (
          <div className="mt-3.5">
            <div className="text-[11px] font-semibold tracking-wide text-[color:var(--shell-muted)]">BY REASON</div>
            <div className="mt-1.5">
              {reasonRows.map((r, i) => (
                <div
                  key={r.reason}
                  className="flex items-center justify-between py-1.5 text-[12px]"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--shell-border)" }}
                >
                  <span className="text-[color:var(--shell-text)]">{r.label}</span>
                  <span className="font-mono font-semibold text-white">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Who paid vs didn't */}
      <div className="rounded-2xl border p-[18px]" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
        <h2 className="text-sm font-bold text-white">Parents — paid vs free</h2>
        <div className="mt-3">
          {parents.length === 0 ? (
            <p className="py-6 text-center text-sm text-[color:var(--shell-muted)]">No parent accounts yet.</p>
          ) : (
            parents.map((p, i) => {
              const paid = isPaid(p.plan);
              const last = p.payments[0];
              return (
                <div
                  key={p.id}
                  className="grid items-center gap-2.5 py-2.5"
                  style={{ gridTemplateColumns: "1fr 88px 120px 110px", borderTop: i === 0 ? "none" : "1px solid var(--shell-border)" }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-white">{p.name}</div>
                    <div className="truncate font-mono text-[11px] text-[color:var(--shell-muted)]">{p.email}</div>
                  </div>
                  <span
                    className="justify-self-start rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={paid ? { background: "rgba(78,159,123,.18)", color: "#9FD7BA" } : { background: "rgba(255,255,255,.06)", color: "var(--shell-muted)" }}
                  >
                    {paid ? "PAID" : "FREE"}
                  </span>
                  <div className="text-[12px] text-[color:var(--shell-muted)]">
                    {paid ? (p.currentPeriodEnd ? `renews ${fmtDate(p.currentPeriodEnd)}` : (p.subscriptionStatus ?? "active")) : "—"}
                  </div>
                  <div className="text-right text-[12px]">
                    {last ? (
                      last.receiptUrl ? (
                        <a href={last.receiptUrl} target="_blank" rel="noreferrer" className="font-semibold" style={{ color: "#A5B4FC" }}>
                          {money(last.amount, last.currency)} · receipt
                        </a>
                      ) : (
                        <span className="text-[color:var(--shell-text)]">{money(last.amount, last.currency)} · {fmtDate(last.paidAt)}</span>
                      )
                    ) : (
                      <span className="text-[color:var(--shell-muted)]">no payments</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Receipt log */}
      <div className="rounded-2xl border p-[18px]" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-white">Recent payments</h2>
          <span className="text-[11px] text-[color:var(--shell-muted)]">{totals._count._all} total</span>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-[color:var(--shell-muted)]">No payments recorded yet — they appear here the moment Stripe confirms one.</p>
        ) : (
          <div className="mt-3">
            {recent.map((r, i) => (
              <div
                key={r.id}
                className="grid items-center gap-2.5 py-2.5"
                style={{ gridTemplateColumns: "1fr 90px 110px 70px", borderTop: i === 0 ? "none" : "1px solid var(--shell-border)" }}
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-white">{r.user.name}</div>
                  <div className="truncate font-mono text-[11px] text-[color:var(--shell-muted)]">{r.user.email}</div>
                </div>
                <div className="font-display text-lg" style={{ color: "#9FD7BA" }}>{money(r.amount, r.currency)}</div>
                <div className="text-[12px] text-[color:var(--shell-muted)]">{fmtDate(r.paidAt)}</div>
                <div className="text-right text-[12px]">
                  {r.receiptUrl ? (
                    <a href={r.receiptUrl} target="_blank" rel="noreferrer" className="font-semibold" style={{ color: "#A5B4FC" }}>receipt</a>
                  ) : (
                    <span className="text-[color:var(--shell-muted)]">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
