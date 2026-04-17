# Claude — правила работы с проектом HamshiraGo

Этот документ обязателен к прочтению перед началом любой задачи.

---

## Обязательные правила

### 1. Учёт задач

После **каждого изменения** (исправление бага, добавление фичи, рефакторинг) обновляй файлы:

- **`docs/tasks.md`** — текущие активные задачи и баги. После выполнения задачи — переноси в `docs/done.md` и удаляй из `tasks.md`.
- **`docs/done.md`** — лог завершённых задач с датой и кратким описанием изменений.

Формат в `tasks.md`:
```
## 🐛 Баги
- [ ] Краткое описание — файл/модуль где проблема

## 📋 Задачи
- [ ] Краткое описание — файл/модуль

## 💡 Идеи / V1
- [ ] Краткое описание
```

Формат в `done.md`:
```
## YYYY-MM-DD
- **[тип]** Краткое описание — что изменено (файл/модуль)
```

### 2. Прежде чем начать

1. Прочитай `docs/tasks.md` — понять текущий контекст задач
2. Прочитай `docs/done.md` — понять что уже сделано
3. Прочитай `docs/BACKEND_API.md` — если задача касается бэкенда
4. Прочитай `docs/WEB_PROGRESS.md` — если задача касается web/web-medic

### 3. Структура проекта

```
hamshiraGo-mobile/
├── backend/                # NestJS Monorepo (Railway)
│   ├── apps/
│   │   ├── api/src/        ← Основной API (auth, orders, medics, consultations, doctors)
│   │   ├── clinic/src/     ← Clinic microservice (company, appointments, staff, rooms)
│   │   ├── voice-agent/src/← Salomat AI microservice (STT, chat, TTS)
│   │   └── payments/src/   ← Payments microservice (Payme, Click webhooks)
│   ├── libs/
│   │   ├── common/src/     ← Shared utilities (CloudinaryService, TelegramService, SimpleJwtStrategy)
│   │   ├── database/src/   ← Shared entity re-exports for cross-app access
│   │   └── contracts/src/  ← Shared enums (OrderStatus, VerificationStatus)
│   ├── gateway/            ← Nginx reverse proxy config
│   ├── nest-cli.json       ← Monorepo config (4 apps + 3 libs)
│   ├── railway.toml        ← Railway deploy config (entrypoint via APP_NAME env)
│   ├── docker-entrypoint.sh← Dynamic entrypoint: reads APP_NAME → starts correct app
│   └── DEPLOY.md           ← Deployment guide (monolith + microservices)
├── mobile/                 # Expo React Native — клиент
├── medic/                  # Expo React Native — медик
├── admin/                  # React/Vite — админ панель
├── web/                    # Next.js — web клиент
├── web-medic/              # Next.js — web медик
└── docs/
    ├── tasks.md            ← текущие задачи (обновлять!)
    ├── done.md             ← история выполненных задач (обновлять!)
    ├── BACKEND_API.md      ← документация API
    ├── COMPETITIVE_ANALYSIS.md ← конкурентный анализ
    ├── WEB_PROGRESS.md     ← прогресс web приложений
    ├── ADMIN_PANEL.md      ← документация admin панели
    └── V0.1_MVP/           ← оригинальные требования MVP
```

### 4. Микросервисы на Railway

| Сервис | Порт | Railway URL | APP_NAME |
|--------|------|-------------|----------|
| **API** (main) | 3000 | hamshirago-production-0a65.up.railway.app | api |
| **Voice Agent** | 3001 | voice-agent-production-e01d.up.railway.app | voice-agent |
| **Payments** | 3002 | payments-production-7853.up.railway.app | payments |
| **Clinic** | 3003 | clinic-production-baa2.up.railway.app | clinic |

**Важно:**
- Все сервисы используют **одну PostgreSQL** (shared DB)
- Все сервисы используют **одинаковый JWT_SECRET** (токены валидны везде)
- `APP_NAME` env var определяет какой app запускается в контейнере
- Микросервисы используют `SimpleJwtStrategy` (без DB lookup) вместо полной `JwtStrategy`
- Код всех сервисов в одном репозитории — путь `@/*` → `apps/api/src/*`

### 5. Технический стек

- **Backend**: NestJS Monorepo + TypeORM + PostgreSQL (Railway), Socket.IO, JWT, Cloudinary, Telegram Bot
- **Mobile**: Expo SDK 52, React Native, Expo Router
- **Web**: Next.js 14 (App Router), Tailwind CSS v4
- **Admin**: React + Vite + shadcn/ui
- **Push**: Expo Push API + Web Push (VAPID) + Telegram Bot

### 5. Важные соглашения

- `discountAmount` хранится и передаётся в UZS (не в процентах)
- `platformFee` = 10% от `netPrice`, хранится в заказе
- Все цены в **целых UZS**
- Статусы заказа: `CREATED → ASSIGNED → ACCEPTED → ON_THE_WAY → ARRIVED → SERVICE_STARTED → DONE` (или `CANCELED`)
- `verificationStatus` медика: `PENDING | APPROVED | REJECTED`

---

## Что НЕ делать

- Не создавать файлы без необходимости
- Не дублировать логику между сервисами
- Не менять названия экспортов без обновления всех импортов
- Не делать `nullable: false` на новых колонках у существующих таблиц (вызовет ошибку на Railway)
