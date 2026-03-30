# HamshiraGo API

Backend платформы вызова медсестры на дом (NestJS + PostgreSQL + Socket.IO).

## Стек

- NestJS 10
- TypeORM + PostgreSQL
- JWT (client/medic/admin)
- Socket.IO
- class-validator

## Требования

- Node.js 20+
- PostgreSQL 14+

## Быстрый старт

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

API по умолчанию: `http://localhost:3000`

## Важное про БД

- В проекте `synchronize: false` (для всех окружений).
- Изменения схемы применяйте миграциями или ручным SQL.
- При старте выполняется `seedServices` (идемпотентно) - базовый каталог услуг.

## Ключевые env

Смотри полный список в `backend/.env.example`.

Минимально:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`

## Основные endpoint'ы

- `POST /auth/register`, `POST /auth/login`
- `POST /medics/register`, `POST /medics/login`
- `POST /orders`, `GET /orders`, `GET /orders/:id`
- `GET /services`
- `POST /payments/:orderId/initiate`, `GET /payments/:orderId/status`
- `GET /health`

Полная API-документация: `../docs/BACKEND_API.md`
