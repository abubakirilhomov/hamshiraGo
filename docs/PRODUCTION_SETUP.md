# HamshiraGo -- Production Setup Guide

> Last updated: 2026-03-31

---

## 1. Railway Backend Environment Variables

### CRITICAL (app won't work without these)

| Variable | Description | How to get |
|----------|-------------|------------|
| `DATABASE_URL` | PostgreSQL connection string | Railway auto-sets when you add a Postgres plugin |
| `JWT_SECRET` | Auth token signing key | `openssl rand -hex 32` |
| `ADMIN_USERNAME` | Admin panel login | Choose any |
| `ADMIN_PASSWORD` | Admin panel password | Choose strong (16+ chars) |

### PAYMENTS (orders work but payments don't process)

| Variable | Description | How to get |
|----------|-------------|------------|
| `PAYME_MERCHANT_ID` | Payme merchant ID | merchant.payme.uz |
| `PAYME_MERCHANT_KEY` | Payme secret key | merchant.payme.uz |
| `PAYME_TEST_MODE` | Enable test mode (`true`/`false`) | Set `true` for staging |
| `CLICK_MERCHANT_ID` | Click merchant ID | my.click.uz |
| `CLICK_SERVICE_ID` | Click service ID | my.click.uz |
| `CLICK_SECRET_KEY` | Click secret key | my.click.uz |

### AI AGENT (graceful fallback if missing)

| Variable | Description | How to get |
|----------|-------------|------------|
| `ANTHROPIC_API_KEY` | Claude API key for medical triage | console.anthropic.com -- API Keys |

### TELEGRAM BOT (graceful fallback if missing)

| Variable | Description | How to get |
|----------|-------------|------------|
| `TELEGRAM_BOT_TOKEN` | Bot token | @BotFather in Telegram |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook auth secret | `openssl rand -hex 32` |
| `BACKEND_URL` | Public backend URL for webhook | Railway deployment URL (e.g. `https://hamshirago-production-0a65.up.railway.app`) |
| `TELEGRAM_ADMIN_CHAT_ID` | Admin chat for alerts | Talk to @userinfobot in Telegram |

### CLOUDINARY (photo uploads)

| Variable | Description | How to get |
|----------|-------------|------------|
| `CLOUDINARY_CLOUD_NAME` | Cloud name | cloudinary.com dashboard |
| `CLOUDINARY_API_KEY` | API key | cloudinary.com dashboard |
| `CLOUDINARY_API_SECRET` | API secret | cloudinary.com dashboard |

### WEB PUSH (browser notifications)

| Variable | Description | How to get |
|----------|-------------|------------|
| `VAPID_PUBLIC_KEY` | VAPID public key | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | VAPID private key | Same command as above |
| `VAPID_SUBJECT` | Contact email for VAPID | `mailto:admin@hamshirago.uz` |

### OPTIONAL

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `production` |
| `ADMIN_SECRET` | Legacy admin auth fallback header | disabled |
| `APP_URL` | Frontend URL for links in notifications | `https://app.hamshirago.uz` |
| `EXPO_PUBLIC_API_BASE` | Override API URL in mobile apps | Railway URL |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking DSN | disabled |

---

## 2. Database Setup

Railway auto-provisions PostgreSQL when you add the Postgres plugin. The backend uses TypeORM with `synchronize: false`.

### Running Migrations

Migrations are in `backend/migrations/` and are idempotent (safe to re-run):

```bash
# Connect to Railway Postgres (get DATABASE_URL from Railway dashboard)
psql $DATABASE_URL

# Run migrations in order:
\i backend/migrations/001_sync_schema.sql
\i backend/migrations/002_loyalty.sql
\i backend/migrations/003_subscriptions.sql
\i backend/migrations/004_consultations.sql
```

Migration files use `IF NOT EXISTS` and `DO $$ ... $$` blocks, so they are safe to run multiple times.

---

## 3. Mobile App Setup

### Client App (`mobile/`)

1. Install EAS CLI: `npm install -g eas-cli`
2. Initialize project: `cd mobile && eas init`
3. Replace `REPLACE_WITH_EAS_PROJECT_ID` in `mobile/app.json` with the project ID from EAS
4. Set API base URL in `mobile/constants/api.ts` (or via `EXPO_PUBLIC_API_BASE` env var)
5. Build: `eas build --platform android` / `eas build --platform ios`

### Medic App (`medic/`)

- Already configured with EAS project ID: `bb076475-8c14-4266-8992-ebbe2eda93f6`
- Build: `cd medic && eas build --platform android` / `eas build --platform ios`

### EAS Credentials

```bash
# Android: generates keystore (or upload existing)
eas credentials --platform android

# iOS: manages APNs keys + provisioning profiles
eas credentials --platform ios
```

### Store Publication Checklist

**Google Play:**
- [ ] Create app listing for `com.hamshirago.client`
- [ ] Upload AAB from EAS build
- [ ] Screenshots: 2+ images (16:9 ratio)
- [ ] Privacy Policy URL (required)
- [ ] Content rating questionnaire

**App Store:**
- [ ] Apple Developer account ($99/year)
- [ ] Create app in App Store Connect
- [ ] Screenshots: 6.7", 6.1", 5.5" sizes (RU + UZ locales)
- [ ] Privacy Policy URL (required)
- [ ] App Review description

---

## 4. Web Apps Setup

### Web Client (`web/`)
```bash
cd web && npm install && npm run build
# Deploy to Vercel or Railway
# Set NEXT_PUBLIC_API_BASE to backend URL
```

### Web Medic (`web-medic/`)
```bash
cd web-medic && npm install && npm run build
# Deploy to Vercel or Railway
# Set NEXT_PUBLIC_API_BASE to backend URL
```

### Admin Panel (`admin/`)
```bash
cd admin && npm install && npm run build
# Deploy to Vercel or Railway
# Set VITE_API_BASE to backend URL
```

### CORS Configuration

Allowed origins are configured in `backend/src/common/cors.config.ts`. Add your production domains there:
- `app.hamshirago.uz` (web client)
- `medic.hamshirago.uz` (web medic)
- `admin.hamshirago.uz` (admin panel)
- `hamshirago.uz` (landing)

---

## 5. Security Checklist

- [ ] Rotate `JWT_SECRET` from any hardcoded/dev value -- `openssl rand -hex 32`
- [ ] Rotate Cloudinary credentials if previously exposed in `.env`
- [ ] Regenerate Telegram bot token via @BotFather if compromised
- [ ] Regenerate VAPID keys -- `npx web-push generate-vapid-keys`
- [ ] Remove `.env` from git history if it was ever committed (contains secrets)
- [ ] Set up all environment variables in Railway dashboard (not `.env` file)
- [ ] Verify `PAYME_TEST_MODE=false` for production payments
- [ ] Ensure Payme IP whitelist is configured for production
- [ ] Ensure Click IP whitelist includes `185.8.212.0/24` and `195.158.28.0/24`
- [ ] Set `NODE_ENV=production`

---

## 6. Graceful Fallbacks

The backend is designed to work with partial configuration. Missing optional services degrade gracefully:

| Service | If Missing | Behavior |
|---------|-----------|----------|
| Anthropic API | `ANTHROPIC_API_KEY` not set | AI triage returns "AI assistant temporarily unavailable" message |
| Cloudinary | Credentials not set | Logs warning, photo uploads disabled |
| Telegram Bot | `TELEGRAM_BOT_TOKEN` not set | Telegram notifications silently skipped |
| Web Push VAPID | Keys not set | Browser push notifications disabled |
| Sentry | `NEXT_PUBLIC_SENTRY_DSN` not set | Error tracking disabled, errors logged to console |
| Payme/Click | Credentials not set | Orders work but payment URLs return error |

---

## 7. Monitoring and Maintenance

### Cron Jobs (automatic, managed by NestJS)

| Job | Schedule | Description |
|-----|----------|-------------|
| Review reminders | Every 15 min | Sends push/Telegram reminder 1h after DONE if no review |
| Treatment course reminders | Every hour | Push notification 2h before next procedure |
| Subscription expiry | Daily 3:00 AM | Expires overdue subscriptions, sends push |
| Stale medic cleanup | Periodic | Auto-disables medics who haven't pinged location |

### Health Check

```bash
curl https://hamshirago-production-0a65.up.railway.app/health
# Expected: { "status": "ok", "service": "hamshira-go-api" }
```

### Useful Admin Endpoints

```bash
# Check error stats
GET /client-errors/admin/stats

# Check all orders
GET /orders/admin/all?page=1&limit=20

# Check pending medic verifications
GET /medics/admin/pending
```

---

## 8. Architecture Overview

```
                    +------------------+
                    |   Railway (PG)   |
                    +--------+---------+
                             |
                    +--------+---------+
                    |  NestJS Backend  |
                    |  (Railway)       |
                    +--+----+----+-----+
                       |    |    |
          +------------+    |    +------------+
          |                 |                 |
  +-------+------+  +------+-------+  +------+-------+
  | Mobile (Expo)|  | Web (Next.js)|  | Admin (Vite) |
  | Client+Medic |  | Client+Medic |  | React+shadcn |
  +--------------+  +--------------+  +--------------+
```

- **Backend**: NestJS + TypeORM + PostgreSQL, Socket.IO for realtime
- **Mobile**: Expo SDK 52, React Native, Expo Router
- **Web**: Next.js 14 (App Router), Tailwind CSS v4
- **Admin**: React + Vite + shadcn/ui
- **Push**: Expo Push API (mobile) + Web Push VAPID (browser) + Telegram Bot
