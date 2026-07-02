# QuizSpark — Keys & accounts to fetch

This is the shopping list. Grab each value below, drop it into the host's
environment variables (NOT into a committed file), and hand the secret ones to
the developer. Items are grouped by **required to launch** vs **optional**.

Legend: 🔴 required · 🟡 strongly recommended · ⚪ optional

> ## 📍 Current phase (free build) — what's actually needed right now
> The app is **live** at `https://quizspark-cm.vercel.app` (Vercel + Supabase) as a
> **free build** (`NEXT_PUBLIC_BILLING_ENABLED=false`). So for the current phase:
> - **Skip Stripe (§4)** — billing is muted; no payment keys needed until the paid
>   model is switched back on.
> - **Email is already chosen: Gmail Workspace SMTP** (`admin@conceptmastery.ca`).
>   Use the SMTP option in §5, not Resend. The only thing to keep fresh is the
>   Gmail **App Password**.
> - Everything else (DB, `NEXTAUTH_SECRET`, app URL, `CRON_SECRET`) is already set
>   on Vercel. **If email isn't arriving on the live site, the SMTP vars are almost
>   certainly missing/incorrect in Vercel — that's the #1 cause.**

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

## ⏸️ 4. Stripe (payments) — NOT needed in the current free build
Only required when the paid $5/mo model is switched back on
(`NEXT_PUBLIC_BILLING_ENABLED=true`). Skip for now.

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

## 🔴 5. Email delivery — currently **Gmail Workspace SMTP**
Needed for verification (a **6-digit code**) + notification emails. We're on the
**SMTP / Gmail** option (Resend is muted for now via `EMAIL_PROVIDER=smtp`).

- **Gmail / Workspace SMTP (current):** set these on the host (Vercel):
  - `EMAIL_PROVIDER=smtp`
  - `SMTP_HOST=smtp.gmail.com`
  - `SMTP_PORT=587`
  - `SMTP_USER=admin@conceptmastery.ca`
  - `SMTP_PASS=<Gmail App Password>` — a 16-char **App Password** (Google Account →
    Security → 2-Step Verification → App passwords), **not** the login password.
    Store with no spaces.
  - `EMAIL_FROM="Concept Mastery <admin@conceptmastery.ca>"`
  - ⚠️ Rotate the App Password if it's ever exposed; update `SMTP_PASS` and redeploy.
- **Resend (deferred, for scale later):** `RESEND_API_KEY` + a domain verified in
  Resend, then remove `EMAIL_PROVIDER=smtp` to switch back. See
  [`DNS_REQUEST.md`](DNS_REQUEST.md) for the DNS records that path needs.

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

## What to set on the host (Vercel)
Current free build — the values that actually matter right now:

```
# already set on Vercel:
DATABASE_URL=                 # Supabase Postgres
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://quizspark-cm.vercel.app
NEXT_PUBLIC_APP_URL=https://quizspark-cm.vercel.app
CRON_SECRET=
NEXT_PUBLIC_BILLING_ENABLED=false

# email (Gmail Workspace SMTP) — set ALL of these or nothing delivers:
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@conceptmastery.ca
SMTP_PASS=                    # Gmail App Password (16 chars, no spaces)
EMAIL_FROM=Concept Mastery <admin@conceptmastery.ca>

# optional:
ANTHROPIC_API_KEY=            # + AI_PROVIDER=claude to turn on real AI question-gen
VAPID_PUBLIC_KEY=             # web-push (+ NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT)

# deferred until billing is switched back on:
# STRIPE_SECRET_KEY= / STRIPE_PRICE_ID= / STRIPE_WEBHOOK_SECRET=
# RESEND_API_KEY=  (only if switching email back to Resend)
```

See `.env.example` for the full annotated list and `DEPLOY.md` for the order of
operations.
