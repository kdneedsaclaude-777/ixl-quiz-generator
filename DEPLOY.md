# Production Deployment

The app runs on **SQLite by default** for local dev and demos. Production
uses **Postgres**, real **SMTP**, and per-route **rate limiting**. None of the
production steps affect local `prisma/dev.db`.

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

## 7. Pre-flight checklist

- [ ] `NEXTAUTH_SECRET` is a fresh 32-byte random value (not the dev default)
- [ ] `CRON_SECRET` set and not the placeholder
- [ ] `npm run db:use-postgres` run; `npx prisma migrate deploy` clean
- [ ] SMTP verified (a real provider, `EMAIL_FROM` on your domain)
- [ ] `npm run build` green; `npm test` and `npm run test:e2e` green in CI
