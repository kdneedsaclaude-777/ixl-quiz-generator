# QuizSpark — Revenue Model & Cost Breakdown

A plain-English model of what QuizSpark earns and costs. All figures are
estimates using public rates; confirm against live pricing before quoting them
to anyone. Currency: CAD.

> **Bottom line up front:** the *unit economics are a clear gain* — each paying
> account nets ~$4 / month and costs pennies to serve, so the business covers
> all its running costs at **~15 paying accounts**. Whether the *whole venture*
> profits comes down to one thing the app can't control: **how much you spend to
> acquire users** (marketing). With Concept Mastery's existing tutoring families
> as a low-cost channel, it should be profitable quickly.

---

## 1. Key assumptions
- Price: **$5 / month** (or **$50 / year** = 2 months free).
- Price is **per parent account** — a paid (Plus) account covers **unlimited
  children**. Revenue tracks *paying accounts*, not student headcount.
- Stripe (Canada): **2.9% + $0.30** per charge.
- Developer revenue share: **10% of gross** (a cost to the business; income to
  the dev).
- "Total users" = everyone who signs up (mostly free). Only a fraction pay.

## 2. Unit economics (one paying account)

| | Monthly ($5) | Annual ($50) |
|---|---|---|
| Customer pays | $5.00 / mo | $50.00 / yr |
| − Stripe fee | −$0.45 | −$1.75 |
| − Developer 10% | −$0.50 | −$5.00 |
| **Net to business** | **≈ $4.05 / mo** | **≈ $43.25 / yr** |
| Cost to *serve* one user | ~pennies (infra/email) | ~pennies |

Each paying customer is **strongly profitable**. The cost of one more user is
tiny — this is classic high-margin software.

## 3. Conversion scenarios — 25,000 total users, monthly plan

Most signups stay on the free tier. Net figures below subtract Stripe + the 10%
dev share + ~$1–3k/yr infrastructure.

| Conversion | Paying accounts | Gross / yr | Stripe / yr | Dev 10% / yr | **Net to business / yr** |
|---|---|---|---|---|---|
| 2% (cautious) | 500 | $30,000 | −$2,670 | −$3,000 | **≈ $23,000** |
| 5% (typical) | 1,250 | $75,000 | −$6,675 | −$7,500 | **≈ $60,000** |
| 10% (strong) | 2,500 | $150,000 | −$13,350 | −$15,000 | **≈ $120,000** |
| 100% (all pay) | 25,000 | $1,500,000 | −$133,500 | −$150,000 | **≈ $1,213,000** |

> The developer's 10% column is also *your* cut if you're the developer:
> ~$7.5k → $15k → $150k/yr across those scenarios.

**Plug-in formula for any case:**
`Net/yr ≈ (paying accounts × $48.66) − infrastructure`
(where $48.66 = $5 × 12 net of Stripe + 10%; use **$43.25 × accounts** for annual).

## 4. Costs (expenses)

### One-time
| Item | Estimate |
|---|---|
| Google Play developer account | $25 (✅ paid) |
| Legal review of privacy/terms (kids' app) | $500–$2,000 (lawyer quote) |
| Store graphics (banner + screenshots) | $0–$500 (in-house vs designer) |
| App build | $0 upfront if dev is paid via the 10% share |

### Recurring / variable
| Item | Cost |
|---|---|
| Stripe | ~9% of revenue (monthly) / ~3.5% (annual) — variable |
| Developer share | 10% of revenue — variable |
| Hosting (e.g. Vercel Pro) | ~$20 / mo |
| Database (Postgres) | $0 free tier → ~$20–30 / mo as it grows |
| Email (e.g. Resend) | $0 to start → ~$20–90 / mo at higher volume |
| Domain | ~$15 / yr |
| AI (Anthropic, *optional*) | pay-per-use; only if AI question-gen is on |
| **Fixed infra total** | **~$40–120 / mo (~$500–1,400 / yr)** even at scale |

Infrastructure is a rounding error against revenue at any real scale.

## 5. Break-even
- Net per paying account ≈ **$4.05 / mo**.
- Fixed infra ≈ **$60 / mo** (mid-estimate).
- **Break-even ≈ 60 ÷ 4.05 ≈ 15 paying accounts.**

After ~15 paying customers, the app's running costs are fully covered and every
additional paying account is ~$4/mo of profit.

## 6. The one number that decides gain vs loss: acquisition cost
The app is profitable per-customer. The venture's profit depends on **Customer
Acquisition Cost (CAC)** — what you spend on marketing/ads to get each user — vs
**Lifetime Value (LTV)**.

- LTV (monthly plan, if a customer stays ~12 months): ~$4.05 × 12 ≈ **$48**.
- If CAC < ~$48 per paying customer → **profit**. If you pay more than that to
  acquire customers who don't stick → **loss**.
- **Concept Mastery already has tutoring families** = a near-zero-cost channel.
  Marketing into your existing base is the cheapest growth and makes early
  profitability very likely.

Also factor **churn**: not everyone stays 12 months, so the "100% pay" / full-year
figures are a ceiling, not a forecast. Annual plans reduce churn and fees — worth
promoting.

## 7. Verdict
**Structurally a gain, not a loss.** High margin (~80% of price after Stripe +
dev share), near-zero cost to serve each extra user, tiny break-even (~15 paying
accounts), and trivial infrastructure cost. The only way it becomes a loss is
overspending on marketing relative to what customers pay back — which is fully in
your control, especially given Concept Mastery's existing audience.

*Caveat:* if Google requires Play Billing instead of Stripe, the platform cut
rises from ~9% to 15%, trimming margins (still profitable, just less). Resolve
that policy question early.
