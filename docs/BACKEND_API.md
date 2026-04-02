# HamshiraGo - Backend API Reference

> Base URL (production): `https://hamshirago-production-0a65.up.railway.app`

## 1. Аутентификация и роли

Все защищённые эндпоинты используют:

```http
Authorization: Bearer <access_token>
```

JWT payload:
- `sub` - id пользователя
- `role` - `client` | `medic` | `admin`

Admin-доступ:
- основной способ: Bearer token после `POST /auth/admin/login`
- legacy fallback: `X-Admin-Secret` (если задан `ADMIN_SECRET`)

Rate limits (актуально):
- `POST /auth/register` - 5 запросов / 1 мин
- `POST /auth/login` - 5 запросов / 15 мин
- `POST /medics/register` - 5 запросов / 1 мин
- `POST /medics/login` - 5 запросов / 15 мин
- `POST /auth/admin/login` - 5 запросов / 15 мин
- `POST /client-errors` - 20 запросов / 1 мин

---

## 2. Health

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Healthcheck |

Response:

```json
{ "status": "ok", "service": "hamshira-go-api" }
```

---

## 3. Auth / Users

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Регистрация клиента |
| `POST` | `/auth/login` | No | Логин клиента |
| `PATCH` | `/auth/push-token` | Client JWT | Сохранить Expo push token клиента |
| `GET` | `/auth/vapid-public-key` | No | Получить VAPID public key |
| `POST` | `/auth/web-push-subscription` | Client JWT | Сохранить web-push подписку клиента |
| `DELETE` | `/auth/web-push-subscription` | Client JWT | Удалить web-push подписку клиента |
| `POST` | `/auth/admin/login` | No | Логин админа |
| `GET` | `/auth/admin/users` | Admin | Список клиентов (пагинация + фильтры) |
| `PATCH` | `/auth/admin/users/:id/block` | Admin | Блок/разблок клиента |

`POST /auth/register` body:

```json
{
  "phone": "+998901234567",
  "password": "secret123",
  "name": "Алишер",
  "referredByCode": "AB12CD34"
}
```

`POST /auth/login` body:

```json
{ "phone": "+998901234567", "password": "secret123" }
```

`POST /auth/admin/login` body:

```json
{ "username": "admin", "password": "..." }
```

---

## 4. Medics

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/medics/register` | No | Регистрация медика |
| `POST` | `/medics/login` | No | Логин медика |
| `GET` | `/medics/me` | Medic JWT | Профиль медика |
| `PATCH` | `/medics/location` | Medic JWT | Обновить online/status и координаты |
| `POST` | `/medics/documents` | Medic JWT | Загрузить `facePhoto` + `licensePhoto` |
| `POST` | `/medics/profile-photo` | Medic JWT | Загрузить `photo` профиля |
| `PATCH` | `/medics/push-token` | Medic JWT | Сохранить Expo push token медика |
| `PATCH` | `/medics/telegram-chat-id` | Medic JWT | Сохранить/удалить telegram chat id |
| `POST` | `/medics/web-push-subscription` | Medic JWT | Сохранить web-push подписку медика |
| `DELETE` | `/medics/web-push-subscription` | Medic JWT | Удалить web-push подписку медика |
| `GET` | `/medics/nearby?latitude=&longitude=&limit=` | Client JWT | Ближайшие медики |
| `GET` | `/medics/admin/pending` | Admin | Список `PENDING` медиков |
| `GET` | `/medics/admin/all` | Admin | Список всех медиков |
| `PATCH` | `/medics/admin/:id/verify` | Admin | Верификация (`APPROVED`/`REJECTED`) |
| `PATCH` | `/medics/admin/:id/block` | Admin | Блок/разблок медика |
| `POST` | `/medics/admin/:id/topup` | Admin | Пополнение баланса |

Notes:
- `POST /medics/documents` и `POST /medics/profile-photo` отвечают `204 No Content`.
- `PATCH /medics/telegram-chat-id` body: `{ "chatId": "123456" }` или `{ "chatId": null }`.

---

## 5. Orders

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/orders` | Client JWT | Создать заказ |
| `GET` | `/orders` | Client JWT | Мои заказы (пагинация) |
| `GET` | `/orders/:id` | JWT | Заказ по id (ACL по роли) |
| `POST` | `/orders/:id/cancel` | Client JWT | Отменить заказ |
| `POST` | `/orders/:id/rate` | Client JWT | Оценить заказ после DONE |
| `PATCH` | `/orders/:id/status` | Client JWT | Клиентский переход статуса |
| `GET` | `/orders/medic/available` | Medic JWT | Доступные заказы |
| `GET` | `/orders/medic/my` | Medic JWT | История медика |
| `POST` | `/orders/:id/accept` | Medic JWT | Принять заказ |
| `POST` | `/orders/:id/decline` | Medic JWT | Отклонить инвайт |
| `PATCH` | `/orders/:id/medic-status` | Medic JWT | Статус от медика |
| `GET` | `/orders/admin/all` | Admin | Все заказы (фильтры) |
| `PATCH` | `/orders/admin/:id/cancel` | Admin | Принудительная отмена |

`POST /orders` body:

```json
{
  "serviceId": "uuid",
  "discountAmount": 5000,
  "isUrgent": true,
  "location": {
    "latitude": 41.2995,
    "longitude": 69.2401,
    "house": "ул. Навои 15",
    "floor": "3",
    "apartment": "12",
    "phone": "+998901234567"
  }
}
```

`POST /orders/:id/rate` body:

```json
{ "rating": 5, "review": "Отлично" }
```

Status flow (актуально):
- клиент создаёт: `CREATED`
- медик принимает: `ACCEPTED` (ASSIGNED пропускается)
- далее: `ON_THE_WAY -> ARRIVED -> SERVICE_STARTED -> DONE`
- отмена: `CANCELED`

---

## 6. Services

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/services` | No | Список активных услуг |
| `GET` | `/services/:id` | No | Одна услуга |
| `POST` | `/services` | Admin | Создать услугу |
| `PATCH` | `/services/:id` | Admin | Обновить услугу |
| `DELETE` | `/services/:id` | Admin | Soft delete (`isActive=false`) |

---

## 7. Payments (Payme / Click)

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/:orderId/initiate` | Client JWT | Получить платежные URL (`paymeUrl`, `clickUrl`) |
| `GET` | `/payments/:orderId/status` | Client JWT | Статус последнего платежа заказа |
| `POST` | `/payments/payme` | No (provider) | Payme JSON-RPC webhook |
| `POST` | `/payments/click/prepare` | No (provider) | Click prepare webhook |
| `POST` | `/payments/click/complete` | No (provider) | Click complete webhook |

Notes:
- Проверка owner выполняется внутри `PaymentsService.verifyOrderOwnership()`.
- Для Payme: Basic auth + IP whitelist в production.
- Для Click: IP whitelist в production.

---

## 8. Realtime (Socket.IO)

Connection:

```ts
const socket = io(API_URL, { auth: { token: 'Bearer <jwt>' } });
```

Client -> server events:
- `subscribe_order` (payload: `orderId`)
- `unsubscribe_order` (payload: `orderId`)
- `medic_location` (payload: `{ orderId, latitude, longitude, heading? }`) - только роль medic

Server -> client events:
- `order_status` (`{ orderId, status }`)
- `new_order` (для `medics_feed`)
- `dispatch_invite`
- `dispatch_invite_expired`
- `dispatch_update`
- `medic_location` (`{ orderId, medicId, latitude, longitude, heading, updatedAt, source }`)

---

## 9. App Settings

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/settings` | No | Получить текущие настройки |
| `PATCH` | `/settings` | Admin | Изменить настройки |

`PATCH /settings` body (partial):

```json
{
  "isPaidMode": true,
  "commissionRate": 10,
  "urgentFeePercent": 50,
  "urgentStartHour": 22,
  "urgentEndHour": 7
}
```

---

## 10. Client Errors (User Support)

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/client-errors` | No | Лог ошибки клиента/медика |
| `GET` | `/client-errors/admin/stats` | Admin | Счётчики по статусам |
| `GET` | `/client-errors/admin` | Admin | Список ошибок с фильтрами |
| `PATCH` | `/client-errors/admin/:id` | Admin | Смена статуса |

`PATCH /client-errors/admin/:id` body:

```json
{ "status": "IN_PROGRESS" }
```

---

## 11. Favorites

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/favorites/:medicId` | Client JWT | Добавить в избранное |
| `DELETE` | `/favorites/:medicId` | Client JWT | Удалить из избранного |
| `GET` | `/favorites` | Client JWT | Список избранных |

---

## 12. Medical Card

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/medical-card` | Client JWT | Получить свою карту |
| `PUT` | `/medical-card` | Client JWT | Создать/обновить карту |
| `GET` | `/medical-card/client/:clientId` | Medic JWT | Карта клиента при активном назначении |

---

## 13. Referrals

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/referrals/my` | Client JWT | Мой код и статистика |
| `GET` | `/referrals/validate/:code` | No | Проверка кода |

---

## 14. Treatment Courses

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/treatment-courses` | Client JWT | Создать курс |
| `GET` | `/treatment-courses/my` | Client JWT | Мои курсы |
| `PATCH` | `/treatment-courses/:id` | Client JWT | Обновить курс |
| `DELETE` | `/treatment-courses/:id` | Client JWT | Удалить курс |

`PATCH /treatment-courses/:id` поддерживает `markComplete: true`.

---

## 15. Telegram webhook

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/telegram/webhook` | No (provider) | Webhook для Telegram bot updates |

Если задан `TELEGRAM_WEBHOOK_SECRET`, endpoint проверяет header:
- `X-Telegram-Bot-Api-Secret-Token`

---

## 16. Environment variables (backend)

Обязательные/ключевые:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `PAYME_MERCHANT_ID`, `PAYME_MERCHANT_KEY`, `PAYME_TEST_MODE`
- `CLICK_MERCHANT_ID`, `CLICK_SERVICE_ID`, `CLICK_SECRET_KEY`
- `APP_URL`

Опциональные/инфраструктурные:
- `ADMIN_SECRET` (legacy admin auth fallback)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `PORT`, `NODE_ENV`

---

## 17. CORS

Allowlist задаётся в `backend/src/common/cors.config.ts` и используется в REST + WS.

Включены:
- production домены (`hamshirago.uz`, `app/medic/admin` subdomains)
- Vercel/Railway домены
- локальные origin'ы: `localhost` и `127.0.0.1` для `3000/3001/3002/8081/8082`

---

## 18. Reviews

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/reviews` | JWT (client/medic) | Оставить отзыв после DONE |
| `GET` | `/reviews/medic/:id` | No | Отзывы о медике (пагинация) |
| `GET` | `/reviews/client/:id` | No | Отзывы о клиенте (пагинация) |
| `GET` | `/reviews/order/:id` | JWT | Отзывы по заказу |

`POST /reviews` body:

```json
{
  "orderId": "uuid",
  "rating": 5,
  "comment": "Отличный специалист",
  "targetRole": "medic"
}
```

Notes:
- `targetRole`: `medic` (клиент оценивает медика) или `client` (медик оценивает клиента)
- Unique constraint: `(orderId, authorRole, targetRole)` — один отзыв на роль за заказ
- Автоматически пересчитывает `averageRating` у целевого пользователя
- Cron: каждые 15 мин отправляет push/Telegram напоминание если отзыв не оставлен через 1 час после DONE

---

## 19. Loyalty

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/loyalty/my` | Client JWT | Баланс очков + tier info |
| `GET` | `/loyalty/history` | Client JWT | Пагинированная история транзакций |
| `POST` | `/loyalty/redeem` | Client JWT | Списать баллы на скидку |

`GET /loyalty/my` response:

```json
{
  "points": 150,
  "tier": "SILVER",
  "nextTier": "GOLD",
  "nextTierThreshold": 500,
  "pointsToNextTier": 350
}
```

`GET /loyalty/history?page=1&limit=20` response:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "EARNED",
      "points": 10,
      "description": "Order completed",
      "createdAt": "2026-03-31T..."
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

`POST /loyalty/redeem` body:

```json
{ "points": 100 }
```

Response:

```json
{
  "discountAmount": 10000,
  "remainingPoints": 50
}
```

Notes:
- Тиры: BRONZE (0), SILVER (100 points), GOLD (500 points)
- Tier multipliers: BRONZE x1, SILVER x1.5, GOLD x2
- Milestone bonus: каждые 5 заказов
- Баллы начисляются автоматически при переходе заказа в DONE
- Конвертация: очки -> UZS через `redemptionRate` из AppSettings
- AppSettings: `pointsPerOrder`, `silverThreshold`, `goldThreshold`, `redemptionRate`

---

## 20. Subscriptions

### Client endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/subscriptions/tiers` | No | Доступные тарифы подписок |
| `GET` | `/subscriptions/my` | Client JWT | Активная подписка |
| `POST` | `/subscriptions/purchase` | Client JWT | Купить подписку |
| `POST` | `/subscriptions/cancel` | Client JWT | Отменить подписку |

### Admin endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/subscriptions/admin/tiers` | Admin | Все тарифы (включая неактивные) |
| `POST` | `/subscriptions/admin/tiers` | Admin | Создать тариф |
| `PATCH` | `/subscriptions/admin/tiers/:id` | Admin | Обновить тариф |
| `GET` | `/subscriptions/admin/stats` | Admin | Статистика подписок |

`POST /subscriptions/purchase` body:

```json
{ "tierId": "uuid" }
```

`GET /subscriptions/tiers` response:

```json
[
  {
    "id": "uuid",
    "name": "Базовый",
    "nameUz": "Asosiy",
    "description": "5 визитов со скидкой 10%",
    "price": 150000,
    "billingDays": 30,
    "maxOrders": 5,
    "discountPercent": 10,
    "sortOrder": 1
  }
]
```

Notes:
- `purchase()` uses pessimistic lock to prevent double-purchase
- При создании заказа автоматически применяется `discountPercent` из активной подписки
- `ordersUsed` инкрементируется атомарно после создания заказа
- Cron: ежедневно в 3:00 истекает просроченные подписки + push уведомление

---

## 21. Consultations / AI Agent

### Client endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/consultations/ai-chat` | Client JWT | Чат с AI ассистентом |
| `GET` | `/consultations/doctors` | No | Список врачей |
| `GET` | `/consultations/doctors/:id` | No | Детали врача |
| `POST` | `/consultations` | Client JWT | Создать консультацию |
| `GET` | `/consultations/my` | Client JWT | Мои консультации (пагинация) |
| `GET` | `/consultations/:id` | Client JWT | Детали консультации (с сообщениями) |

### Admin endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/consultations/admin/doctors` | Admin | Добавить врача |
| `PATCH` | `/consultations/admin/doctors/:id` | Admin | Обновить врача |
| `GET` | `/consultations/admin/doctors` | Admin | Список врачей |
| `PATCH` | `/consultations/admin/:id/complete` | Admin | Завершить консультацию |
| `PATCH` | `/consultations/admin/:id/cancel` | Admin | Отменить консультацию |
| `GET` | `/consultations/admin/stats` | Admin | Статистика консультаций |

`POST /consultations/ai-chat` body:

```json
{
  "messages": [
    { "role": "user", "content": "У меня болит горло и температура 38" }
  ]
}
```

Response:

```json
{
  "reply": "Судя по вашим симптомам...",
  "recommendation": {
    "specialization": "therapist",
    "urgency": "normal"
  }
}
```

`POST /consultations` body:

```json
{
  "doctorId": "uuid",
  "symptoms": "Боль в горле, температура",
  "suggestedSpecialization": "therapist"
}
```

`GET /consultations/doctors?specialization=therapist` response:

```json
[
  {
    "id": "uuid",
    "name": "Dr. Alisher Karimov",
    "nameUz": "Dr. Alisher Karimov",
    "specialization": "therapist",
    "bio": "10 лет опыта...",
    "photoUrl": "https://...",
    "pricePerConsultation": 50000,
    "rating": 4.8,
    "consultationCount": 120
  }
]
```

Notes:
- AI Agent использует Claude Haiku через `@anthropic-ai/sdk`
- Если `ANTHROPIC_API_KEY` не задан — возвращает сообщение "ИИ-ассистент временно недоступен"
- Статусы консультации: `PENDING -> ACTIVE -> COMPLETED` (или `CANCELED`)
- `platformFee` = 15% от `pricePerConsultation`
- Сущности: `Doctor`, `Consultation`, `ChatMessage`

---

## 22. Prescriptions (врач → автозаказ)

### Client endpoints

| Method | URL | Auth | Description |
|---|---|---|---|
| `GET` | `/consultations/prescriptions/my` | Client JWT | Мои назначения (пагинация) |
| `POST` | `/consultations/prescriptions/:id/confirm` | Client JWT | Подтвердить назначение (создать заказ) |
| `POST` | `/consultations/prescriptions/:id/cancel` | Client JWT | Отменить назначение |

`POST /consultations/prescriptions/:id/confirm` body:

```json
{
  "location": {
    "latitude": 41.2995,
    "longitude": 69.2401,
    "house": "ул. Навои 15",
    "floor": "3",
    "apartment": "12",
    "phone": "+998901234567"
  },
  "isUrgent": false,
  "discountAmount": 0
}
```

`GET /consultations/prescriptions/my?page=1&limit=20` response:

```json
{
  "data": [
    {
      "id": "uuid",
      "consultationId": "uuid",
      "serviceTitle": "Капельница",
      "servicePrice": 150000,
      "status": "PENDING",
      "orderId": null,
      "doctorNotes": "Рекомендуется курс из 5 капельниц",
      "createdAt": "2026-04-02T...",
      "expiresAt": "2026-04-09T..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

Notes:
- Назначение создаётся автоматически при завершении консультации с `createOrderServiceId`
- Статусы: `PENDING -> CONFIRMED` (или `CANCELED` / `EXPIRED`)
- Срок действия: 7 дней
- При confirm создаётся полноценный заказ через OrdersService (с dispatch, скидками и т.д.)
- Push уведомление клиенту при создании назначения

---

## 23. NPS Surveys

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/nps/submit` | Client JWT | Отправить оценку NPS |
| `GET` | `/nps/check` | Client JWT | Проверить нужно ли показывать опрос |
| `GET` | `/nps/admin/stats` | Admin | Дашборд NPS |

`POST /nps/submit` body:

```json
{ "score": 9, "comment": "Отличный сервис!" }
```

`GET /nps/check` response:

```json
{ "shouldShow": true }
```

`GET /nps/admin/stats` response:

```json
{
  "overall": { "nps": 45, "total": 100, "promoters": 60, "passives": 25, "detractors": 15 },
  "monthly": [
    { "month": "2026-04", "nps": 50, "total": 20, "promoters": 14, "passives": 3, "detractors": 3 }
  ]
}
```

Notes:
- NPS score = % Promoters (9–10) − % Detractors (0–6), range −100 to +100
- Max 1 ответ в месяц на пользователя
- Cron: 1-го числа каждого месяца в 11:00 UTC → push активным клиентам (≥1 DONE заказ за 30 дней)

---

## 24. Video Consultations (LiveKit)

| Method | URL | Auth | Description |
|---|---|---|---|
| `POST` | `/consultations/:id/call` | Client JWT | Инициировать видеозвонок |
| `POST` | `/consultations/:id/call/join` | JWT | Присоединиться к звонку |
| `POST` | `/consultations/:id/call/end` | JWT | Завершить звонок |
| `GET` | `/consultations/:id/call/status` | JWT | Статус звонка |

`POST /consultations/:id/call` response:

```json
{
  "token": "eyJ...",
  "serverUrl": "wss://livekit.example.com",
  "roomName": "consultation-uuid"
}
```

`POST /consultations/:id/call/join` body:

```json
{ "role": "client" }
```

`GET /consultations/:id/call/status` response:

```json
{
  "videoStatus": "ACTIVE",
  "roomName": "consultation-uuid",
  "serverUrl": "wss://livekit.example.com"
}
```

Notes:
- LiveKit WebRTC SFU — open-source, self-hostable
- 1-к-1 звонки (клиент + врач), max 2 участника
- Env vars: `LIVEKIT_API_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- Если LiveKit не настроен → 400 "Video consultations are not configured"
- `videoStatus`: `null` → `CALLING` → `ACTIVE` → `ENDED`
- Комната автоматически удаляется через 5 мин без участников

---

Последнее обновление: 2026-04-02
