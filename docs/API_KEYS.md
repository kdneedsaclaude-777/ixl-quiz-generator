# QuizSpark — Keys & accounts to fetch

This is the shopping list. Grab each value below, drop it into the host's
environment variables (NOT into a committed file), and hand the secret ones to
the developer. Items are grouped by **required to launch** vs **optional**.

Legend: 🔴 required · 🟡 strongly recommended · ⚪ optional

---

## 🔴 1. Database (Postgres) — `DATABASE_URL`
The live app cannot use the local SQLite file. You need a hosted Postgres DB.
- **Where:** whichever you prefer —
  - Neon (https://neon.tech) — free tier, fastest to set up
  - Supabase (https://supabase.com) → Project → Settings → Database → Connection string
  - Vercel Postgres (if hosting on Vercel) → Storage → Create → Postgres
  - Railway/Render also offer managed Postgres
- **What to copy:** the connection string, e.g.
  `postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require`
- **Env var:** `DATABASE_URL`

## 🔴 2. App secret — `NEXTAUTH_SECRET`
Signs login sessions. Generate a fresh one (don't reuse the dev value).
- **Where:** run `openssl rand -base64 32` in a terminal, or use https://generate-secret.vercel.app/32
- **Env var:** `NEXTAUTH_SECRET`

## 🔴 3. Public URL — `NEXTAUTH_URL` + `NEXT_PUBLIC_APP_URL`
The final HTTPS address of the app (used for links, emails, Stripe redirects).
- **Where:** your domain once chosen, e.g. `https://app.conceptmastery.ca`
  (a host subdomain like `https://quizspark.vercel.app` works to start).
- **Env vars:** set BOTH `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to that URL.

## 🔴 4. Stripe (payments) — 3 values
Account: https://dashboard.stripe.com (use **live mode** for the real app).
1. **Secret key** → Developers → API keys → "Secret key" (`sk_live_…`)
   - Env var: `STRIPE_SECRET_KEY`
2. **Price ID(s)** → Products → create a product "QuizSpark Plus" → add a
   **recurring $5.00 / month** price → copy its ID (`price_…`)
   - Env var: `STRIPE_PRICE_ID`
   - (Optional annual: add a second recurring yearly price → `STRIPE_PRICE_ID_ANNUAL`)
3. **Webhook signing secret** → Developers → Webhooks → "Add endpoint" →
   URL = `https://YOUR_DOMAIN/api/billing/webhook`, events:
   `checkout.session.completed`, `customer.subscription.*`,
   `invoice.payment_succeeded` → after creating, copy the "Signing secret" (`whsec_…`)
   - Env var: `STRIPE_WEBHOOK_SECRET`
   - ⚠️ Do this step AFTER the app is deployed (you need the real domain).

## 🔴 5. Email delivery — pick ONE
Needed for verification + notification emails. Two options:
- **Resend (easiest):** https://resend.com → API Keys → create (`re_…`)
  - Env var: `RESEND_API_KEY`
  - Also verify your sending domain in Resend → DNS, then set
    `EMAIL_FROM="QuizSpark <no-reply@conceptmastery.ca>"`
- **OR SMTP (e.g. Gmail/Workspace/SES):** host, port, user, password
  - Env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
  - ⚠️ The current dev Gmail app password must be **rotated** and not reused.

## 🔴 6. Privacy policy URL (no key — but required by Google Play)
- A draft policy now lives in-app at `/privacy` and `/terms`. Once deployed,
  the URL is `https://YOUR_DOMAIN/privacy`. **Have a lawyer review it** before
  you paste it into the Play Console (kids' apps get extra scrutiny).

---

## 🟡 7. Cron secret — `CRON_SECRET`
Protects the scheduled-email endpoint (streak reminders + weekly digests).
- **Where:** generate with `openssl rand -base64 32`
- **Env var:** `CRON_SECRET`
- Then schedule a daily `POST https://YOUR_DOMAIN/api/cron/notifications`
  with header `Authorization: Bearer <CRON_SECRET>` (Vercel Cron, GitHub
  Action, or your host's scheduler).

## 🟡 8. Anthropic API key — `ANTHROPIC_API_KEY`
Powers the admin PDF→questions generator (and, if enabled, live adaptive quiz
generation instead of the built-in mock).
- **Where:** https://console.anthropic.com → API Keys → Create Key (`sk-ant-…`)
- **Env vars:** `ANTHROPIC_API_KEY` (and set `AI_PROVIDER=claude` to use it for
  live quiz generation; leave unset to keep the mock generator).

---

## ⚪ 9. Optional growth levers
- `STRIPE_PRICE_ID_ANNUAL` — a yearly Stripe price → enables the Monthly/Yearly toggle.
- `STRIPE_TRIAL_DAYS` — e.g. `7` to start subscriptions with a free trial.

---

## What to send the developer
Once you have them, share these (securely — not over plain chat if avoidable):

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_APP_URL=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=        # after deploy
RESEND_API_KEY=               # or the SMTP_* set
EMAIL_FROM=
CRON_SECRET=
ANTHROPIC_API_KEY=            # optional
```

See `.env.example` for the full annotated list and `DEPLOY.md` for the order of
operations.
