# HamshiraGo — Backend API Reference

> **Base URL (Production):** `https://hamshirago-production-0a65.up.railway.app`  
> **Stack:** NestJS · TypeORM · PostgreSQL · Socket.IO · Expo Push · Web Push (VAPID) · Cloudinary

---

## Содержание

1. [Аутентификация](#1-аутентификация)
2. [Клиенты (Users)](#2-клиенты-users)
3. [Медики (Medics)](#3-медики-medics)
4. [Заказы (Orders)](#4-заказы-orders)
5. [Каталог услуг (Services)](#5-каталог-услуг-services)
6. [Real-time (WebSocket)](#6-real-time-websocket)
7. [Web Push уведомления](#7-web-push-уведомления)
8. [Admin endpoints](#8-admin-endpoints)
9. [Переменные окружения](#9-переменные-окружения)
10. [Модели данных](#10-модели-данных)
11. [Избранные медики (Favorites)](#11-избранные-медики-favorites)
12. [Медкарта (MedicalCard)](#12-медкарта-medicalcard)

---

## 1. Аутентификация

Все защищённые эндпоинты требуют заголовка:
```
Authorization: Bearer <access_token>
```

JWT содержит поля `sub` (id пользователя) и `role` (`client` | `medic`).

### Клиент

| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/auth/register` | Регистрация клиента |
| `POST` | `/auth/login` | Вход клиента |

**Rate limit:** 5 запросов/мин на register, 10 запросов/мин на login.

**POST /auth/register**
```json
// Request
{ "phone": "+998901234567", "password": "secret123" }

// Response 201
{ "access_token": "eyJ...", "user": { "id": "uuid", "phone": "+998901234567" } }
```

**POST /auth/login**
```json
// Request
{ "phone": "+998901234567", "password": "secret123" }

// Response 200
{ "access_token": "eyJ...", "user": { "id": "uuid", "phone": "+998901234567" } }

// 403 — если аккаунт заблокирован
{ "statusCode": 403, "message": "Your account has been blocked. Contact support." }
```

### Медик

| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/medics/register` | Регистрация медика |
| `POST` | `/medics/login` | Вход медика |

**Rate limit:** 5 запросов/мин на register, 10 запросов/мин на login.

**POST /medics/register**
```json
// Request
{ "phone": "+998901234567", "password": "secret123", "name": "Азиза Каримова", "experienceYears": 5 }

// Response 201
{
  "access_token": "eyJ...",
  "medic": {
    "id": "uuid",
    "phone": "+998901234567",
    "name": "Азиза Каримова",
    "experienceYears": 5,
    "rating": null,
    "balance": 0,
    "isOnline": false,
    "verificationStatus": "PENDING",
    "facePhotoUrl": null,
    "licensePhotoUrl": null,
    "verificationRejectedReason": null
  }
}
```

---

## 2. Клиенты (Users)

> Все эндпоинты требуют `Authorization: Bearer <client_token>`

| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/auth/push-token` | Сохранить Expo Push Token |

**POST /auth/push-token**
```json
{ "token": "ExponentPushToken[xxx]" }
// Response 204 No Content
```

---

## 3. Медики (Medics)

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| `GET` | `/medics/me` | Medic JWT | Профиль текущего медика |
| `PATCH` | `/medics/location` | Medic JWT | Обновить локацию и онлайн-статус |
| `POST` | `/medics/push-token` | Medic JWT | Сохранить Expo Push Token |
| `POST` | `/medics/documents` | Medic JWT | Загрузить фото документов (multipart) |

**GET /medics/me**
```json
// Response 200
{
  "id": "uuid",
  "phone": "+998901234567",
  "name": "Азиза Каримова",
  "experienceYears": 5,
  "rating": 4.8,
  "reviewCount": 12,
  "balance": 450000,
  "isOnline": true,
  "isBlocked": false,
  "verificationStatus": "APPROVED",
  "facePhotoUrl": "https://res.cloudinary.com/...",
  "licensePhotoUrl": "https://res.cloudinary.com/...",
  "verificationRejectedReason": null,
  "latitude": 41.2995,
  "longitude": 69.2401
}
```

**PATCH /medics/location**
```json
// Request
{ "isOnline": true, "latitude": 41.2995, "longitude": 69.2401 }
// Response 204 No Content
```

**POST /medics/documents** — `multipart/form-data`

| Поле | Тип | Описание |
|------|-----|----------|
| `facePhoto` | file (image) | Фото лица медика |
| `licensePhoto` | file (image) | Фото лицензии/диплома |

```json
// Response 200
{
  "facePhotoUrl": "https://res.cloudinary.com/...",
  "licensePhotoUrl": "https://res.cloudinary.com/..."
}
```

Фотографии загружаются в Cloudinary (папка `hamshirago/medic-docs`), оптимизируются автоматически.  
После загрузки `verificationStatus` остаётся `PENDING` до одобрения администратором.

---

## 4. Заказы (Orders)

### Клиентские эндпоинты

> Требуют `Authorization: Bearer <client_token>`

| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/orders` | Создать заказ |
| `GET` | `/orders` | Мои заказы (с пагинацией) |
| `GET` | `/orders/:id` | Детали заказа |
| `POST` | `/orders/:id/cancel` | Отменить заказ |
| `POST` | `/orders/:id/rate` | Оценить медика после выполнения |

**POST /orders**
```json
// Request
{
  "serviceId": "uuid-из-каталога",
  "discountAmount": 5000,
  "location": {
    "house": "ул. Навои 15",
    "floor": "3",
    "apartment": "12",
    "phone": "+998901234567",
    "latitude": 41.2995,
    "longitude": 69.2401
  }
}

// Response 201
{
  "id": "uuid",
  "status": "CREATED",
  "serviceId": "uuid",
  "serviceTitle": "Измерение давления",
  "priceAmount": 50000,
  "discountAmount": 5000,
  "platformFee": 4500,
  "location": { ... },
  "created_at": "2026-02-26T10:00:00.000Z"
}
```

> Цена берётся из каталога. Клиент не может передать произвольную сумму.
> `urgentFee` — автоматически рассчитывается если `isUrgent: true` или ночной час.
> `platformFee` = `commissionRate`% от чистой цены (`priceAmount + urgentFee - discountAmount`).

**GET /orders?page=1&limit=20**
```json
// Response 200
{
  "data": [ { ...order }, { ...order } ],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

**POST /orders/:id/cancel**
```json
// Response 200 — { ...updated order }
// 400 — если статус не CREATED или ASSIGNED
// 403 — если заказ чужой
```

**POST /orders/:id/rate**
```json
// Request
{ "rating": 5 }
// Response 200 — { ...updated order }
// 400 — если заказ не DONE или уже оценён
```

### Медицинские эндпоинты

> Требуют `Authorization: Bearer <medic_token>`

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/orders/medic/available` | Доступные заказы (статус CREATED) |
| `GET` | `/orders/medic/my` | Мои заказы (история) |
| `POST` | `/orders/:id/accept` | Принять заказ |
| `PATCH` | `/orders/:id/medic-status` | Обновить статус заказа |

**POST /orders/:id/accept**
```json
// Response 200 — { ...order со статусом ASSIGNED }
// 403 — верификационный статус не APPROVED
// 403 — медик заблокирован
```

**PATCH /orders/:id/medic-status**
```json
// Request
{ "status": "ON_THE_WAY" }
// Response 200 — { ...updated order }
```

Допустимые переходы статусов:
```
ASSIGNED → ACCEPTED → ON_THE_WAY → ARRIVED → SERVICE_STARTED → DONE
```

При переходе в `DONE` автоматически:
- Рассчитывается заработок: `priceAmount + urgentFee - discountAmount - platformFee`
- Сумма зачисляется на баланс медика
- Клиент получает push-уведомление

### Статусы заказа

| Статус | Описание |
|--------|----------|
| `CREATED` | Заказ создан, ждёт медика |
| `ASSIGNED` | Медик принял заказ |
| `ACCEPTED` | Медик подтвердил выезд |
| `ON_THE_WAY` | Медик едет |
| `ARRIVED` | Медик прибыл |
| `SERVICE_STARTED` | Услуга оказывается |
| `DONE` | Завершён |
| `CANCELED` | Отменён |

---

## 5. Каталог услуг (Services)

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| `GET` | `/services` | Нет | Все активные услуги |
| `GET` | `/services/:id` | Нет | Детали одной услуги |

**GET /services**
```json
// Response 200
[
  {
    "id": "uuid",
    "title": "Измерение давления",
    "description": "Измерение артериального давления...",
    "category": "Диагностика",
    "price": 50000,
    "durationMinutes": 15,
    "isActive": true,
    "sortOrder": 1
  }
]
```

Список услуг заполняется автоматически при запуске сервера (`services.seed.ts`).  
Цены управляются только через admin-эндпоинты — клиент не может задать произвольную цену.

---

## 6. Real-time (WebSocket)

**URL:** `wss://hamshirago-production-0a65.up.railway.app`  
**Namespace:** `/` (корневой)  
**Авторизация:** передаётся при подключении:

```javascript
const socket = io('wss://hamshirago-production-0a65.up.railway.app', {
  auth: { token: 'Bearer eyJ...' }
});
```

### События (сервер → клиент)

| Событие | Получатель | Данные |
|---------|-----------|--------|
| `new_order` | Медики онлайн | Полный объект заказа |
| `order_status` | Клиент заказа | `{ orderId, status }` |

### Пример (клиент — отслеживание заказа)

```javascript
socket.on('order_status', ({ orderId, status }) => {
  console.log(`Заказ ${orderId} → ${status}`);
});
```

### Пример (медик — новые заказы)

```javascript
socket.on('new_order', (order) => {
  console.log('Новый заказ:', order.serviceTitle);
});
```

---

## 7. Web Push уведомления

Для браузерных push-уведомлений (работают даже при закрытом сайте).

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| `GET` | `/auth/vapid-public-key` | Нет | Получить VAPID публичный ключ |
| `POST` | `/auth/web-push-subscription` | Client JWT | Подписать браузер клиента |
| `DELETE` | `/auth/web-push-subscription` | Client JWT | Отписать браузер клиента |
| `POST` | `/medics/web-push-subscription` | Medic JWT | Подписать браузер медика |
| `DELETE` | `/medics/web-push-subscription` | Medic JWT | Отписать браузер медика |

**Пример подписки (browser JS):**
```javascript
const vapidKey = await fetch('/auth/vapid-public-key').then(r => r.json());

const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: vapidKey.publicKey,
});

await fetch('/auth/web-push-subscription', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    endpoint: subscription.endpoint,
    p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
    auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
  }),
});
```

**Когда приходят уведомления:**
- **Клиенту** — при каждом изменении статуса заказа (медик принял, едет, прибыл, завершил)
- **Медикам** — при создании нового заказа

---

## 8. Admin endpoints

> Все admin-эндпоинты требуют заголовок:
> ```
> X-Admin-Secret: <значение из переменной ADMIN_SECRET>
> ```

### Медики

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/medics/admin/pending` | Медики со статусом PENDING |
| `PATCH` | `/medics/admin/:id/verify` | Верифицировать / отклонить медика |
| `PATCH` | `/medics/admin/:id/block` | Заблокировать / разблокировать медика |

**PATCH /medics/admin/:id/verify**
```json
// Одобрить
{ "status": "APPROVED" }

// Отклонить с причиной
{ "status": "REJECTED", "reason": "Фото лицензии нечёткое, перезагрузите" }
```

**PATCH /medics/admin/:id/block**
```json
{ "isBlocked": true }
```

### Клиенты

| Метод | URL | Описание |
|-------|-----|----------|
| `PATCH` | `/auth/admin/users/:id/block` | Заблокировать / разблокировать клиента |

**PATCH /auth/admin/users/:id/block**
```json
{ "isBlocked": true }
```

### Заказы

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/orders/admin/all` | Все заказы с пагинацией и фильтром |
| `PATCH` | `/orders/admin/:id/cancel` | Принудительная отмена заказа |

**GET /orders/admin/all?page=1&limit=20&status=CREATED**
```json
// Response 200
{
  "data": [ { ...order }, ...],
  "total": 128,
  "page": 1,
  "totalPages": 7
}
```

Параметры запроса:
- `page` — номер страницы (default: 1)
- `limit` — заказов на странице, max 100 (default: 20)
- `status` — фильтр по статусу (необязательно): `CREATED`, `ASSIGNED`, `DONE`, `CANCELED` и т.д.

### Каталог услуг (admin CRUD)

| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/services` | Добавить услугу |
| `PATCH` | `/services/:id` | Обновить услугу |
| `DELETE` | `/services/:id` | Удалить услугу |

**POST /services**
```json
{
  "title": "Внутримышечная инъекция",
  "description": "Введение препарата внутримышечно",
  "category": "Инъекции",
  "price": 60000,
  "durationMinutes": 20,
  "sortOrder": 5
}
```

---

## 9. Переменные окружения

| Переменная | Обязательна | Описание |
|-----------|-------------|----------|
| `DB_HOST` | Да | Хост PostgreSQL |
| `DB_PORT` | Да | Порт (обычно 5432) |
| `DB_USERNAME` | Да | Пользователь БД |
| `DB_PASSWORD` | Да | Пароль БД |
| `DB_NAME` | Да | Имя базы данных |
| `JWT_SECRET` | Да | Секрет для подписи JWT (длинная случайная строка) |
| `JWT_EXPIRES_IN` | Нет | Срок действия токена (default: `7d`) |
| `PORT` | Нет | Порт сервера (default: 3000) |
| `ADMIN_SECRET` | Да | Секрет для admin-эндпоинтов (X-Admin-Secret) |
| `CLOUDINARY_CLOUD_NAME` | Да | Cloud name из Cloudinary |
| `CLOUDINARY_API_KEY` | Да | API Key из Cloudinary |
| `CLOUDINARY_API_SECRET` | Да | API Secret из Cloudinary |
| `VAPID_PUBLIC_KEY` | Да | Публичный VAPID-ключ для Web Push |
| `VAPID_PRIVATE_KEY` | Да | Приватный VAPID-ключ для Web Push |
| `VAPID_SUBJECT` | Да | `mailto:admin@hamshirago.uz` или URL сайта |

**Генерация VAPID-ключей:**
```bash
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(JSON.stringify(k, null, 2));"
```

**Генерация ADMIN_SECRET:**
```bash
openssl rand -hex 32
```

---

## 10. Модели данных

### Order

```typescript
{
  id: string;               // UUID
  clientId: string;         // UUID клиента
  medicId: string | null;   // UUID медика (null до принятия)
  serviceId: string | null; // UUID услуги из каталога
  serviceTitle: string | null; // Снимок названия на момент создания
  priceAmount: number | null;  // Цена из каталога
  discountAmount: number;      // Скидка (default: 0)
  isUrgent: boolean;           // Срочный вызов (авто или явный)
  urgentFee: number;           // Доплата за срочность в UZS (default: 0)
  platformFee: number;         // Комиссия платформы (% от netPrice)
  status: OrderStatus;
  clientRating: number | null; // 1–5, заполняется после DONE
  location: OrderLocation;
  created_at: string;
  updated_at: string;
}
```

### Medic

```typescript
{
  id: string;
  phone: string;
  name: string;
  experienceYears: number;
  rating: number | null;        // Средний рейтинг
  reviewCount: number;
  balance: number;              // Накопленный заработок (UZS)
  isOnline: boolean;
  isBlocked: boolean;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  facePhotoUrl: string | null;
  licensePhotoUrl: string | null;
  verificationRejectedReason: string | null;
  latitude: number | null;
  longitude: number | null;
}
```

### Service

```typescript
{
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;           // В UZS
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
}
```

---

## Комиссия платформы

При создании заказа рассчитывается автоматически:

```
urgentFee   = isUrgent ? round(priceAmount × urgentFeePercent / 100) : 0
netPrice    = priceAmount + urgentFee - discountAmount
platformFee = round(netPrice × commissionRate / 100)
medicEarns  = netPrice - platformFee
```

`isUrgent` устанавливается в `true` если клиент передал `isUrgent: true` ИЛИ текущий час входит в ночное окно (`urgentStartHour`–`urgentEndHour`, по умолчанию 22:00–07:00 UTC+5).

При завершении заказа (`DONE`) сумма `medicEarns` зачисляется на баланс медика.

---

## Client Errors — `POST /client-errors`

Публичный endpoint для отправки ошибок из мобильных приложений. Авторизация не требуется.

**Rate limit:** 20 запросов/мин.

**Body (все поля опциональны):**
```json
{
  "userId":     "uuid — ID пользователя (если залогинен)",
  "appType":    "mobile | medic",
  "screen":     "маршрут/экран где произошла ошибка",
  "message":    "короткое сообщение об ошибке",
  "stacktrace": "полный стек трейс",
  "meta":       "JSON-строка с доп. данными"
}
```

**Response:** `204 No Content`

Ошибки сохраняются в таблицу `client_errors`.

---

## App Settings — `GET /settings` / `PATCH /settings`

### GET /settings — публичный

Возвращает текущие настройки приложения.

**Response:**
```json
{
  "isPaidMode": false,
  "commissionRate": 10
}
```

### PATCH /settings — только Admin (`X-Admin-Secret` или JWT)

Изменяет одно или оба поля.

**Body (все поля опциональны):**
```json
{
  "isPaidMode": true,
  "commissionRate": 15
}
```
- `isPaidMode` — boolean
- `commissionRate` — int, 1–50 (процент комиссии с рабочего баланса медика при принятии заказа)

**Response:** `{ isPaidMode, commissionRate }`

---

## Баланс медика (два поля)

| Поле | Тип | Описание |
|------|-----|----------|
| `balance` | decimal | **Рабочий депозит** — снимается комиссия при acceptOrder (если isPaidMode=true); пополняется вручную через Admin |
| `earnings` | decimal | **Заработок** — сумма всех выполненных заказов; зачисляется автоматически при DONE (netPrice) |

Оба поля всегда видны медику в профиле и возвращаются в `GET /medics/profile`.

---

## CORS

Разрешённые origins:
- `https://hamshirago.uz` + `https://www.hamshirago.uz` (лендинг)
- `https://app.hamshirago.uz` (веб-клиент)
- `https://medic.hamshirago.uz` (веб-медик)
- `https://admin.hamshirago.uz` (админка)
- Vercel: `hamshirago-web.vercel.app`, `hamshirago-web-medic.vercel.app`, `hamshirago-admin.vercel.app`
- Railway: `web-production-d365f.up.railway.app`, `admin-production-9727.up.railway.app`, `web-medic-production.up.railway.app`
- `http://localhost:3000–3002`, `8081–8082` (локальная разработка)
- Запросы без `Origin` (мобильные приложения, Postman, curl)

---

---

## 11. Избранные медики (Favorites)

Все эндпоинты требуют `JwtAuthGuard` (роль `client`).

| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/favorites/:medicId` | Добавить медика в избранное |
| `DELETE` | `/favorites/:medicId` | Удалить медика из избранного |
| `GET` | `/favorites` | Список избранных медиков |

**POST /favorites/:medicId**
```json
// Response 201
{ "success": true }
```
Повторный вызов — no-op (не возвращает ошибку).

**DELETE /favorites/:medicId**
```json
// Response 200
{ "success": true }
```

**GET /favorites**
```json
// Response 200
[
  {
    "id": "uuid",
    "medicId": "uuid",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "medic": {
      "id": "uuid",
      "name": "Азиза Каримова",
      "phone": "+998901234567",
      "rating": 4.9,
      "profilePhotoUrl": "https://res.cloudinary.com/..."
    }
  }
]
```

**Приоритет при диспатче:** При создании заказа система проверяет, есть ли у клиента избранный медик, который онлайн, верифицирован, не заблокирован и находится в радиусе диспатча. Если да — он получает приглашение первым.

---

## 12. Медкарта (MedicalCard)

**Клиент (JwtAuthGuard):**

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/medical-card` | Получить свою медкарту |
| `PUT` | `/medical-card` | Создать или обновить медкарту |

**GET /medical-card**
```json
// Response 200 (null если карта не создана)
{
  "id": "uuid",
  "userId": "uuid",
  "bloodType": "A+",
  "allergies": "Пенициллин, пыль",
  "chronicDiseases": "Гипертония",
  "notes": "Принимает метформин",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

**PUT /medical-card** — все поля опциональны
```json
// Request
{
  "bloodType": "A+",
  "allergies": "Пенициллин",
  "chronicDiseases": "Гипертония",
  "notes": "Принимает метформин"
}
// Response 200 — обновлённая карта
```

**Медик (MedicAuthGuard):**

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/medical-card/client/:clientId` | Просмотр медкарты клиента |

Медик может получить карту только если он назначен на активный заказ для этого клиента (статус `ASSIGNED`, `ACCEPTED`, `ON_THE_WAY`, `ARRIVED`, `SERVICE_STARTED`). Иначе — `403 Forbidden`.

---

## 13. Реферальная программа (Referrals)

### Регистрация с реферальным кодом

**POST /auth/register** теперь принимает необязательное поле `referredByCode`:
```json
// Request
{
  "phone": "+998901234567",
  "password": "secret123",
  "name": "Алишер",
  "referredByCode": "AB12CD34"
}

// Response 201
{
  "access_token": "eyJ...",
  "user": { "id": "uuid", "phone": "+998901234567", "name": "Алишер", "referralCode": "XY98ZW56" }
}
```

- При регистрации каждому клиенту автоматически генерируется уникальный `referralCode` (8 символов, upper-case alphanumeric).
- Если передан `referredByCode`, создаётся запись в таблице `referrals`.
- После первого завершённого заказа (DONE) оба пользователя получают по 10 000 UZS на следующий заказ (`pendingReferralDiscount`).
- Скидка применяется автоматически при создании следующего заказа и сбрасывается в 0.

### Endpoints

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| `GET` | `/referrals/my` | JwtAuthGuard (client) | Мой реферальный код, статистика и pending скидка |
| `GET` | `/referrals/validate/:code` | Public | Проверить, существует ли реферальный код |

**GET /referrals/my**
```json
// Response 200
{
  "referralCode": "AB12CD34",
  "referredCount": 3,
  "bonusPaidCount": 1,
  "pendingReferralDiscount": 10000
}
```

**GET /referrals/validate/:code**
```json
// Response 200
{ "valid": true }
```

---

## 14. Курсы лечения (TreatmentCourses)

Позволяют клиенту создать расписание повторяющихся процедур с push-напоминаниями.

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| `POST` | `/treatment-courses` | JwtAuthGuard (client) | Создать курс |
| `GET` | `/treatment-courses/my` | JwtAuthGuard (client) | Мои курсы |
| `PATCH` | `/treatment-courses/:id` | JwtAuthGuard (client) | Обновить курс |
| `DELETE` | `/treatment-courses/:id` | JwtAuthGuard (client) | Удалить курс |

**POST /treatment-courses**
```json
// Request
{
  "title": "Курс инъекций витамина B12",
  "serviceId": "uuid",
  "totalProcedures": 10,
  "intervalDays": 2,
  "nextDate": "2026-04-01T09:00:00.000Z"
}

// Response 201 — TreatmentCourse entity
```

**PATCH /treatment-courses/:id**
```json
// Отметить процедуру выполненной (автоматически сдвигает nextDate на intervalDays вперёд)
{ "markComplete": true }

// Поставить на паузу
{ "status": "PAUSED" }

// Обновить расписание
{ "nextDate": "2026-04-05T10:00:00.000Z", "intervalDays": 3 }
```

**Статусы курса:** `ACTIVE` | `COMPLETED` | `PAUSED`

**Cron-напоминания:** каждый час сервис проверяет курсы с `status=ACTIVE` и `nextDate <= now + 2 hours`. Если напоминание ещё не отправлено — шлёт push-уведомление клиенту.

---

*Последнее обновление: март 2026*
