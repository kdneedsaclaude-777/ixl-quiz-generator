# Production Deployment

The app runs on **SQLite by default** for local dev and demos. Production
uses **Postgres**, real **SMTP/Resend**, **Stripe**, and per-route **rate
limiting**. None of the production steps affect local `prisma/dev.db`.

> **Which keys to fetch and where:** see [`docs/API_KEYS.md`](docs/API_KEYS.md).
> **Publishing to Google Play:** Phase B at the bottom of this file.
>
> ⚠️ In production the app **refuses to boot** if `NEXTAUTH_SECRET`,
> `DATABASE_URL`, or the public app URL are missing, or if `PUBLIC_TEST_MODE=true`
> (see `src/instrumentation.ts`). It warns when Stripe / email / `CRON_SECRET`
> are unset. This fails fast instead of misbehaving silently.

## 1. Environment

```bash
cp .env.production.example .env   # then fill in real secrets
```

Required: `DATABASE_URL` (Postgres), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
`CRON_SECRET`. Recommended: `SMTP_*` (without it, email falls back to an
Ethereal test inbox — fine for staging, not production).

## 2. Switch the Prisma provider to Postgres

The datasource provider is a static value in `schema.prisma`. Switch it (and
regenerate the client) before migrating:

```bash
npm run db:use-postgres
```

To go back to SQLite locally: `npm run db:use-sqlite`. The schema itself is
provider-agnostic (JSON is stored as `String`, no SQLite/PG-native types), so
no model changes are needed either way.

## 3. Migrate & seed

```bash
npx prisma migrate deploy      # applies committed migrations to Postgres
npx tsx prisma/seed.ts         # curriculum + badges + flags + demo org
```

> The existing migrations were authored against SQLite. For a clean Postgres
> history, run `npx prisma migrate diff` / regenerate the baseline against the
> Postgres URL in CI before the first `migrate deploy`.

## 4. Build & run

```bash
npm run build
npm run start                  # Next.js production server
```

## 5. Scheduled notifications

`POST /api/cron/notifications` (auth: `Authorization: Bearer $CRON_SECRET`)
sends weekly digests + inactivity alerts; it's idempotent (deduped via
`NotificationLog`). Wire it to a scheduler hitting it ~daily:

```bash
curl -X POST https://quiz.example.com/api/cron/notifications \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 6. Rate limiting

Sensitive endpoints (signup, password reset, resend-verification, quiz
generation, cron) are rate-limited in-memory per IP — correct for a single
instance. For multi-instance/serverless, back `src/lib/rate-limit.ts` with
Redis (Upstash) using the same `rateLimit()` signature; the call sites don't
change.

## 7. Stripe (payments)

Use **live mode** keys for the shipped app. Set `STRIPE_SECRET_KEY`,
`STRIPE_PRICE_ID` (a recurring $5/mo price), and — after the app is deployed —
register a webhook so payments are recorded:

- Stripe dashboard → Developers → Webhooks → add endpoint
- URL: `https://YOUR_DOMAIN/api/billing/webhook`
- Events: `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`,
  `invoice.payment_succeeded`
- Copy the signing secret → `STRIPE_WEBHOOK_SECRET` → redeploy.

Optional: `STRIPE_PRICE_ID_ANNUAL` (enables the Monthly/Yearly toggle),
`STRIPE_TRIAL_DAYS` (free trial on new subs).

## 8. Real admin account

The `db seed` demo accounts are dev-only — do not rely on them in prod. After
seeding, create a real admin (via the script in `scripts/` or by signing up and
promoting the row), and confirm the demo accounts aren't reachable.

## 9. Smoke test (live)

- `GET https://YOUR_DOMAIN/api/health` → `{"status":"ok","db":"up"}`
- Sign up → verification email → verify → create child → quiz → results.
- Upgrade with a real card → in-app "You're on Plus" banner + receipt in
  `/admin/billing` + welcome email.
- Free account hits the daily limit → paywall shows.

## On Vercel (recommended host)

1. Import the repo at https://vercel.com/new.
2. Add Postgres (Storage → Create) or paste an external `DATABASE_URL`.
3. Add all env vars (Project → Settings → Environment Variables, Production).
4. Build command override so migrations run on deploy:
   `npm run db:use-postgres && prisma migrate deploy && next build`
   (run `npx tsx prisma/seed.ts` once from the Vercel CLI after first deploy).
5. Cron — commit a `vercel.json`:
   ```json
   { "crons": [{ "path": "/api/cron/notifications", "schedule": "0 13 * * *" }] }
   ```
   Vercel Cron can't send a custom `Authorization` header — ask the developer to
   also accept Vercel's `x-vercel-cron` signal (or a path token) on that route.

Self-hosting instead? You'll want `output: "standalone"`, a `Dockerfile`, a TLS
reverse proxy, external Postgres, and an external scheduler — ask the developer
to add these once the host is locked.

## Pre-flight checklist

- [ ] `NEXTAUTH_SECRET` is a fresh 32-byte random value (not the dev default)
- [ ] `CRON_SECRET` set and not the placeholder
- [ ] `NEXTAUTH_URL` + `NEXT_PUBLIC_APP_URL` = the real HTTPS domain
- [ ] `npm run db:use-postgres` run; `npx prisma migrate deploy` clean; seeded
- [ ] Email verified (real provider, `EMAIL_FROM` on your domain, SPF/DKIM); dev Gmail password rotated
- [ ] Stripe live keys + webhook configured; one real test payment verified
- [ ] Real admin created; demo/seed accounts NOT in prod
- [ ] `/api/health` green; daily cron firing
- [ ] Privacy policy & terms reviewed by legal
- [ ] `npm run build` green; `npm test` and `npm run test:e2e` green in CI

---

# Phase B — Publish to Google Play (TWA)

The web app already ships a PWA manifest (`/manifest.webmanifest`), an app icon
(`/icon.svg`), and theme colors, so it's packaging-ready. A TWA is a thin Android
wrapper around the **live** site — finish Phase A first.

1. Go to **https://www.pwabuilder.com**, enter `https://YOUR_DOMAIN`.
2. Review the report → **Package For Stores → Android** (signed bundle). Download
   the `.aab` **and** the generated `assetlinks.json` (has your signing fingerprint).
3. Publish Digital Asset Links so the app opens full-screen (no browser bar):
   save the file to `public/.well-known/assetlinks.json` and redeploy so it's at
   `https://YOUR_DOMAIN/.well-known/assetlinks.json`. Template:
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.conceptmastery.quizspark",
       "sha256_cert_fingerprints": ["<FROM PWABUILDER / PLAY APP SIGNING>"]
     }
   }]
   ```
   (Hand the developer the fingerprint; they'll commit this file.)
4. Play Console → create app → package name `com.conceptmastery.quizspark` →
   upload the `.aab` → fill the listing from
   [`docs/PLAY_STORE_LISTING.md`](docs/PLAY_STORE_LISTING.md) (copy, Data Safety,
   content rating) → paste the privacy URL `https://YOUR_DOMAIN/privacy`.
5. Submit. The Families/kids track gets extra policy review — privacy policy must
   be lawyer-approved first.
