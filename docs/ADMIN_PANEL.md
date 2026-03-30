# HamshiraGo - Админ-панель

> API Base URL: `https://hamshirago-production-0a65.up.railway.app`

## 1. Авторизация

Актуальная схема для admin UI:

1. `POST /auth/admin/login` с `username/password`
2. получить `access_token`
3. отправлять `Authorization: Bearer <token>` во все admin-запросы

Пример login:

```http
POST /auth/admin/login
Content-Type: application/json

{ "username": "admin", "password": "..." }
```

```json
{ "access_token": "eyJ..." }
```

Примечание:
- `AdminGuard` поддерживает и legacy-заголовок `X-Admin-Secret`, но для фронтенда используйте JWT.

## 2. Основные страницы и API

### 2.1 Медики

- `GET /medics/admin/pending` - медики в статусе `PENDING`
- `GET /medics/admin/all?page=1&limit=20&search=&verificationStatus=&isBlocked=&isOnline=`
- `PATCH /medics/admin/:id/verify` - `{ status: "APPROVED" | "REJECTED", reason? }`
- `PATCH /medics/admin/:id/block` - `{ isBlocked: boolean }`
- `POST /medics/admin/:id/topup` - `{ amount: number }`

Рекомендуемые колонки:
- `name`, `phone`, `verificationStatus`, `isOnline`, `rating`, `reviewCount`, `balance`, `isBlocked`, `created_at`

### 2.2 Клиенты

- `GET /auth/admin/users?page=1&limit=20&search=&isBlocked=`
- `PATCH /auth/admin/users/:id/block` - `{ isBlocked: boolean }`

Рекомендуемые колонки:
- `phone`, `name`, `isBlocked`, `created_at`

### 2.3 Заказы

- `GET /orders/admin/all?page=1&limit=20&status=&isUrgent=`
- `PATCH /orders/admin/:id/cancel` - `{ reason?: string }`

Рекомендуемые колонки:
- `id`, `created_at`, `serviceTitle`, `status`, `priceAmount`, `discountAmount`, `urgentFee`, `platformFee`, `location.house`, `clientId`, `medicId`

### 2.4 Услуги

- `GET /services` (public)
- `POST /services`
- `PATCH /services/:id`
- `DELETE /services/:id` (soft delete: `isActive=false`)

### 2.5 Настройки приложения

- `GET /settings` (public)
- `PATCH /settings` (admin)

`PATCH /settings` поддерживает:
- `isPaidMode`
- `commissionRate`
- `urgentFeePercent`
- `urgentStartHour`
- `urgentEndHour`

### 2.6 User Support / Error tracking

- `GET /client-errors/admin/stats`
- `GET /client-errors/admin?status=&appType=&dateFrom=&dateTo=&userId=&page=&limit=`
- `PATCH /client-errors/admin/:id` - `{ status: "NEW" | "IN_PROGRESS" | "FIXED" | "IGNORED" }`

## 3. Минимальный fetch-wrapper (JWT)

```ts
const API_BASE = 'https://hamshirago-production-0a65.up.railway.app';

function getAdminToken() {
  return localStorage.getItem('admin_token') ?? '';
}

export async function adminRequest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAdminToken()}`,
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }

  if (res.status === 204) return null;
  return res.json();
}
```

## 4. Чек-лист по безопасности

- хранить только `admin_token` (не хранить `ADMIN_PASSWORD` и `ADMIN_SECRET` в браузере)
- обрабатывать `401` централизованно с auto-logout
- использовать HTTPS origin админки в `ALLOWED_ORIGINS`
- ограничить доступ к админке на уровне инфраструктуры (если возможно)

---

Последнее обновление: 2026-03-30
