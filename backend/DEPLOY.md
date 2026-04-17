# HamshiraGo — Microservices Deployment Guide

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   API :3000  │     │Voice :3001   │     │Payment :3002 │     │Clinic :3003  │
│              │     │              │     │              │     │              │
│ auth,orders  │     │ Salomat AI   │     │ Payme/Click  │     │ company,     │
│ medics,docs  │     │ STT,chat,TTS │     │ webhooks     │     │ appointments │
│ consultations│     │              │     │              │     │ staff,rooms  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       └────────────────────┴────────────────────┴────────────────────┘
                                    │
                            ┌───────┴───────┐
                            │  PostgreSQL   │
                            │  (shared DB)  │
                            └───────────────┘
```

## Local Development

```bash
# Build all apps
npm run build:all

# Start individual services
npm run start:prod          # API on :3000
npm run start:voice-agent   # Voice Agent on :3001
npm run start:payments      # Payments on :3002
npm run start:clinic        # Clinic on :3003

# Dev mode (API only, with watch)
npm run start:dev
```

## Railway Deployment

### Option 1: Single Service (Current — Simplest)

Railway builds using `Dockerfile` with default `APP_NAME=api`.
The API service contains ALL modules — monolith mode, backwards compatible.

**Start command:** `node dist/apps/api/main.js`

### Option 2: Multiple Services (Recommended for Scale)

Create 4 Railway services from the same repo, each with different build args:

#### Service 1: API (Main)
```
Build: Dockerfile
Build Args: APP_NAME=api
Start: node dist/apps/api/main.js
Port: 3000
```

#### Service 2: Voice Agent
```
Build: Dockerfile
Build Args: APP_NAME=voice-agent
Start: node dist/apps/voice-agent/main.js
Port: 3001 (env: VOICE_AGENT_PORT=3001)
```

#### Service 3: Payments
```
Build: Dockerfile
Build Args: APP_NAME=payments
Start: node dist/apps/payments/main.js
Port: 3002 (env: PAYMENTS_PORT=3002)
```

#### Service 4: Clinic
```
Build: Dockerfile
Build Args: APP_NAME=clinic
Start: node dist/apps/clinic/main.js
Port: 3003 (env: CLINIC_PORT=3003)
```

### Environment Variables (same for all services)

All 4 services need the same database credentials:
```
DB_HOST=<railway-postgres-host>
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<password>
DB_NAME=railway
DB_SSL=true
JWT_SECRET=<same-secret-for-all-services>
NODE_ENV=production
```

Service-specific vars:
- **API:** All current env vars (TELEGRAM_BOT_TOKEN, VAPID_*, etc.)
- **Voice Agent:** ANTHROPIC_API_KEY, GROQ_API_KEY, OPENAI_API_KEY
- **Payments:** PAYME_MERCHANT_ID, PAYME_MERCHANT_KEY, CLICK_*
- **Clinic:** VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

### Nginx Gateway (if using multiple services)

See `gateway/nginx.conf` for routing config.
On Railway: use a separate "Nginx" service or configure custom domains:
- `api.hamshirago.uz` → API service
- `voice.hamshirago.uz` → Voice Agent service
- `pay.hamshirago.uz` → Payments service
- `clinic.hamshirago.uz` → Clinic service

## Important Notes

1. **Backwards compatible** — The API service still contains ALL modules. You can run in monolith mode until ready to split.
2. **Shared DB** — All services connect to the same PostgreSQL. No data migration needed.
3. **JWT shared** — Same JWT_SECRET across all services = tokens work everywhere.
4. **Build args** — `APP_NAME` in Dockerfile determines which app to build and run.
