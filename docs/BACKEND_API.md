# HamshiraGo — Backend API Reference

> Обновлено: 2026-04-18
> Base URL (production): `https://hamshirago-production-0a65.up.railway.app`

## Микросервисы

| Сервис | URL | Что обслуживает |
|--------|-----|-----------------|
| **API** (main) | hamshirago-production-0a65.up.railway.app | Все endpoints ниже |
| **Voice Agent** | voice-agent-production-e01d.up.railway.app | `/voice-agent/*` |
| **Payments** | payments-production-7853.up.railway.app | `/payments/*` |
| **Clinic** | clinic-production-baa2.up.railway.app | `/clinic*`, `/companies*`, `/patient/*` |

---

## Аутентификация

```http
Authorization: Bearer <access_token>
```

JWT roles: `client` | `medic` | `doctor` | `clinic` | `admin`

Clinic JWT дополнительно содержит: `companyId`, `clinicRole` (CEO | RECEPTION | DOCTOR)

---

## 1. Auth — Клиенты

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Регистрация клиента. Body: `{ phone, password, name?, referredByCode? }` |
| POST | `/auth/login` | — | Логин клиента. Body: `{ phone, password }` → `{ access_token, user }` |
| POST | `/auth/login/cookie` | — | Логин с httpOnly cookie |
| POST | `/auth/logout/cookie` | — | Очистка cookie |
| POST | `/auth/refresh` | JWT | Обновить токен |
| GET | `/auth/me` | JWT | Профиль текущего клиента |
| PATCH | `/auth/profile` | JWT | Обновить профиль. Body: `{ name? }` |
| PATCH | `/auth/push-token` | JWT | Сохранить push token. Body: `{ token }` |
| DELETE | `/auth/account` | JWT | Удалить аккаунт (soft-delete + анонимизация) |
| GET | `/auth/vapid-public-key` | — | VAPID ключ для Web Push |
| POST | `/auth/web-push-subscription` | JWT | Сохранить Web Push подписку |
| DELETE | `/auth/web-push-subscription` | JWT | Удалить Web Push подписку |

### Admin Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/admin/login` | — | Логин админа. Body: `{ username, password }` |
| PATCH | `/auth/admin/users/:id/block` | Admin | Блокировка клиента. Body: `{ isBlocked }` |
| GET | `/auth/admin/users` | Admin | Список клиентов. Query: `page, limit, search, isBlocked` |

---

## 2. Orders — Заказы

### Клиент

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | JWT | Создать заказ. Body: `{ serviceId, serviceIds?, latitude, longitude, address?, floor?, apartment?, discountAmount?, isUrgent?, promoCode? }` |
| GET | `/orders` | JWT | Мои заказы. Query: `page, limit, status?` |
| GET | `/orders/stats` | JWT | Статистика заказов |
| GET | `/orders/:id` | JWT | Детали заказа |
| POST | `/orders/:id/cancel` | JWT | Отменить заказ. Body: `{ reason? }` |
| POST | `/orders/:id/reorder` | JWT | Повторить заказ |
| PATCH | `/orders/:id/status` | JWT | Обновить статус (DONE). Body: `{ status }` |
| POST | `/orders/:id/rate` | JWT | Оценить медика. Body: `{ rating, review? }` |
| POST | `/orders/:id/messages` | JWT | Отправить сообщение. Body: `{ content }` |
| GET | `/orders/:id/messages` | JWT | Сообщения чата |

### Медик

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/orders/medic/available` | Medic | Доступные заказы |
| GET | `/orders/medic/my` | Medic | Мои заказы. Query: `page, limit, status?` |
| POST | `/orders/:id/accept` | Medic | Принять заказ |
| POST | `/orders/:id/decline` | Medic | Отклонить приглашение |
| PATCH | `/orders/:id/medic-status` | Medic | Обновить статус (ON_THE_WAY, ARRIVED, SERVICE_STARTED, DONE) |
| PATCH | `/orders/:id/final-price` | Medic | Итоговая цена (для операций с диапазоном). Body: `{ finalPrice }` |
| POST | `/orders/:id/photo` | Medic | Фото до/после (multipart) |
| POST | `/orders/:id/medic-messages` | Medic | Сообщение в чат |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/orders/admin/all` | Admin | Все заказы. Query: `page, limit, status?, search?, isUrgent?, dateFrom?, dateTo?` |
| PATCH | `/orders/admin/:id/cancel` | Admin | Принудительная отмена |
| DELETE | `/orders/admin/:id` | Admin | Soft-delete заказа |

**Статусы заказа:** `CREATED → ASSIGNED → ACCEPTED → ON_THE_WAY → ARRIVED → SERVICE_STARTED → DONE` (или `CANCELED`)

---

## 3. Medics — Медики

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/medics/register` | — | Регистрация. Body: `{ phone, password, name, experienceYears? }` |
| POST | `/medics/login` | — | Логин → `{ access_token, medic }` |
| GET | `/medics/me` | Medic | Профиль |
| PATCH | `/medics/profile` | Medic | Обновить профиль |
| PATCH | `/medics/location` | Medic | Обновить GPS. Body: `{ latitude, longitude }` |
| POST | `/medics/documents` | Medic | Загрузить документы (multipart: facePhoto, licensePhoto) |
| POST | `/medics/profile-photo` | Medic | Загрузить фото профиля |
| PATCH | `/medics/push-token` | Medic | Push token |
| PATCH | `/medics/telegram-chat-id` | Medic | Telegram chat ID |
| POST | `/medics/web-push-subscription` | Medic | Web Push подписка |
| DELETE | `/medics/web-push-subscription` | Medic | Удалить Web Push |
| GET | `/medics/me/schedule` | Medic | Расписание работы |
| PUT | `/medics/me/schedule` | Medic | Обновить расписание |
| PATCH | `/medics/work-zone` | Medic | Установить геозону. Body: `{ latitude, longitude, radiusKm }` |
| DELETE | `/medics/work-zone` | Medic | Убрать геозону |
| POST | `/medics/me/withdrawal-request` | Medic | Запрос вывода. Body: `{ amount, cardNumber? }` |
| GET | `/medics/nearby` | JWT | Ближайшие медики. Query: `latitude, longitude, limit?` |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/medics/admin/pending` | Admin | Ожидающие верификации |
| GET | `/medics/admin/all` | Admin | Все медики. Query: `page, limit, search?, verificationStatus?, isBlocked?, isOnline?` |
| PATCH | `/medics/admin/:id/verify` | Admin | Верификация. Body: `{ status, rejectedReason? }` |
| PATCH | `/medics/admin/:id/block` | Admin | Блокировка. Body: `{ isBlocked }` |
| POST | `/medics/admin/:id/topup` | Admin | Пополнить баланс. Body: `{ amount }` |
| GET | `/medics/admin/withdrawal-requests` | Admin | Запросы на вывод. Query: `status?` |
| POST | `/medics/admin/withdrawal-requests/:id/approve` | Admin | Одобрить вывод |
| POST | `/medics/admin/withdrawal-requests/:id/decline` | Admin | Отклонить. Body: `{ adminNote? }` |

---

## 4. Doctors — Врачи

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/doctors/register` | — | Регистрация врача. Body: `{ phone, password, name, specialization, bio?, pricePerConsultation }` |
| POST | `/doctors/login` | — | Логин (проверяет и doctors, и clinic company_users). → `{ access_token, doctor }` |
| GET | `/doctors/me` | Doctor | Профиль |
| PATCH | `/doctors/profile` | Doctor | Обновить профиль |
| PATCH | `/doctors/push-token` | Doctor | Push token |
| PATCH | `/doctors/telegram-chat-id` | Doctor | Telegram chat ID |
| POST | `/doctors/web-push-subscription` | Doctor | Web Push подписка |
| DELETE | `/doctors/web-push-subscription` | Doctor | Удалить Web Push |
| POST | `/doctors/me/slots` | Doctor | Создать слоты. Body: `{ date, slots: [{ startTime, endTime }] }` |
| GET | `/doctors/me/slots` | Doctor | Мои слоты |
| DELETE | `/doctors/me/slots/:slotId` | Doctor | Удалить слот |
| POST | `/doctors/documents` | Doctor | Загрузить документы |
| POST | `/doctors/profile-photo` | Doctor | Фото профиля |
| GET | `/doctors/:id/slots` | — | Доступные слоты врача (public). Query: `date` |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/doctors/admin/all` | Admin | Все врачи. Query: `page, limit, search?, verificationStatus?` |
| GET | `/doctors/admin/pending` | Admin | Ожидающие верификации |
| PATCH | `/doctors/admin/:id/verify` | Admin | Верификация |
| PATCH | `/doctors/admin/:id/block` | Admin | Блокировка |

---

## 5. Consultations — Консультации

### Salomat AI (чат-триаж)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/consultations/ai-chat` | JWT | Чат с Salomat AI. Body: `{ messages: [{ role, content }], lang? }` |
| POST | `/consultations/ai-chat/stream` | JWT | SSE streaming чат |
| POST | `/consultations/ai-chat/create-lead` | JWT | Создать лид для клиники из AI рекомендации |

### Клиент

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/consultations/doctors` | — | Список врачей (public). Query: `specialization?` |
| GET | `/consultations/doctors/:id` | — | Детали врача (public) |
| POST | `/consultations` | JWT | Записаться. Body: `{ doctorId, consultationType, symptoms?, slotId? }` |
| GET | `/consultations/my` | JWT | Мои консультации. Query: `page, limit` |
| GET | `/consultations/:id` | JWT | Детали (ownership check) |
| POST | `/consultations/:id/rate` | JWT | Оценить врача. Body: `{ rating: 1-5, comment? }` |

### Рецепты

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/consultations/prescriptions/my` | JWT | Мои рецепты |
| POST | `/consultations/prescriptions/:id/confirm` | JWT | Подтвердить рецепт → создать заказ |
| POST | `/consultations/prescriptions/:id/cancel` | JWT | Отменить рецепт |

### Видеозвонок

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/consultations/:id/call` | JWT | Инициировать звонок |
| POST | `/consultations/:id/call/join` | JWT | Присоединиться |
| POST | `/consultations/:id/call/end` | JWT | Завершить |
| GET | `/consultations/:id/call/status` | JWT | Статус звонка |

### Врач

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/consultations/doctor/pending` | Doctor | Ожидающие консультации |
| GET | `/consultations/doctor/my` | Doctor | Мои консультации. Query: `page, limit` |
| POST | `/consultations/:id/doctor-accept` | Doctor | Принять |
| POST | `/consultations/:id/doctor-decline` | Doctor | Отклонить |
| PATCH | `/consultations/:id/doctor-complete` | Doctor | Завершить. Body: `{ doctorNotes?, createOrderServiceId? }` |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/consultations/admin/doctors` | Admin | Создать врача |
| PATCH | `/consultations/admin/doctors/:id` | Admin | Обновить врача |
| GET | `/consultations/admin/doctors` | Admin | Список врачей |
| GET | `/consultations/admin/all` | Admin | Все консультации. Query: `page, limit, status?` |
| PATCH | `/consultations/admin/:id/complete` | Admin | Завершить с рецептом |
| PATCH | `/consultations/admin/:id/cancel` | Admin | Отменить |
| GET | `/consultations/admin/stats` | Admin | Статистика |
| GET | `/consultations/admin/salomat-audit/stats` | Admin | Salomat audit stats |

---

## 6. Clinic — Клиники

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/clinic-auth/register` | — | Регистрация клиники. Body: `{ name, phone, password, address?, city? }` |
| POST | `/clinic-auth/login` | — | Логин. Body: `{ phone, password }` → `{ token, company, user }` |
| GET | `/clinic-auth/me` | Clinic | Профиль |

### Управление (CEO)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/clinic/company` | Clinic | Профиль компании |
| PATCH | `/clinic/company` | CEO | Обновить компанию |
| POST | `/clinic/staff` | CEO | Создать сотрудника. Body: `{ name, phone, password, role: CEO|RECEPTION|DOCTOR }` |
| GET | `/clinic/staff` | Clinic | Список сотрудников |
| PATCH | `/clinic/staff/:id` | CEO | Обновить сотрудника |
| DELETE | `/clinic/staff/:id` | CEO | Деактивировать сотрудника |

### Кабинеты

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/clinic/rooms` | CEO | Создать кабинет |
| GET | `/clinic/rooms` | Clinic | Список кабинетов |
| GET | `/clinic/rooms/today` | CEO/RECEPTION | Расписание кабинетов сегодня |
| POST | `/clinic/rooms/:roomId/doctors` | CEO | Назначить врача в кабинет |
| GET | `/clinic/rooms/:roomId/schedule` | Clinic | Расписание кабинета |

### Услуги

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/clinic/services` | CEO | Создать услугу. Body: `{ name, category, price, priceMin?, priceMax? }` |
| GET | `/clinic/services` | Clinic | Список услуг |
| PATCH | `/clinic/services/:id` | CEO | Обновить |
| DELETE | `/clinic/services/:id` | CEO | Деактивировать |

### Записи

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/clinic/appointments` | CEO/RECEPTION | Создать запись |
| GET | `/clinic/appointments` | CEO/RECEPTION | Список записей. Query: `page, limit, status?, date?, doctorId?` |
| GET | `/clinic/appointments/today` | CEO/RECEPTION | Записи сегодня |
| GET | `/clinic/appointments/stats` | CEO | Статистика записей |
| GET | `/clinic/appointments/:id` | CEO/RECEPTION | Детали записи |
| PATCH | `/clinic/appointments/:id/checkin` | CEO/RECEPTION | Check-in |
| PATCH | `/clinic/appointments/:id/status` | CEO/RECEPTION | Обновить статус |
| PATCH | `/clinic/appointments/:id/cancel` | CEO/RECEPTION | Отменить |
| POST | `/clinic/appointments/:id/prescription` | Clinic | Создать рецепт |

### Лиды (от Salomat AI)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/clinic/leads` | CEO/RECEPTION | Список лидов |
| GET | `/clinic/leads/stats` | CEO/RECEPTION | Статистика лидов |
| PATCH | `/clinic/leads/:id/status` | CEO/RECEPTION | Обновить статус |
| DELETE | `/clinic/leads/:id` | CEO | Удалить лид |

### Статистика

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/clinic/stats/overview` | CEO | Обзор |
| GET | `/clinic/stats/monthly` | CEO | Помесячно |
| GET | `/clinic/stats/doctors` | CEO | По врачам |
| GET | `/clinic/stats/rooms` | CEO | По кабинетам |
| GET | `/clinic/stats/services` | CEO | По услугам |
| GET | `/clinic/patients/:phone` | CEO/RECEPTION | Поиск пациента |
| GET | `/clinic/patients/:id/history` | CEO/RECEPTION | История пациента |

### Public (без авторизации)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/companies` | — | Список клиник |
| GET | `/companies/:id` | — | Детали клиники |
| GET | `/companies/:id/services` | — | Услуги клиники |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/companies` | Admin | Все компании. Query: `page, limit, city?, isVerified?, isActive?` |
| POST | `/admin/companies` | Admin | Создать компанию |
| PATCH | `/admin/companies/:id/verify` | Admin | Верификация |
| PATCH | `/admin/companies/:id/block` | Admin | Блокировка |
| GET | `/admin/companies/:id` | Admin | Детали |
| GET | `/admin/companies/:id/staff` | Admin | Сотрудники |
| GET | `/admin/companies/:id/stats` | Admin | Статистика |
| GET | `/admin/leads/overview` | Admin | Обзор лидов |
| GET | `/admin/leads` | Admin | Все лиды |

### Patient (клиент просматривает свои визиты)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/patient/visits` | JWT | Мои визиты в клиники |
| GET | `/patient/prescriptions` | JWT | Мои рецепты от клиник |
| GET | `/patient/prescriptions/:id` | JWT | Детали рецепта |

---

## 7. Payments — Оплата

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/:orderId/initiate` | JWT | Инициировать оплату заказа → `{ paymeUrl, clickUrl, payment }` |
| GET | `/payments/:orderId/status` | JWT | Статус оплаты заказа |
| POST | `/payments/consultation/:id/initiate` | JWT | Инициировать оплату консультации |
| GET | `/payments/consultation/:id/status` | JWT | Статус оплаты консультации |
| POST | `/payments/payme` | — | Payme webhook (Basic Auth + IP) |
| POST | `/payments/click/prepare` | — | Click prepare webhook |
| POST | `/payments/click/complete` | — | Click complete webhook |

---

## 8. Voice Agent — Salomat AI (голос)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/voice-agent/transcribe` | JWT | STT: аудио → текст (Groq Whisper). Multipart: audio file ≤25MB |
| POST | `/voice-agent/chat` | JWT | Чат с голосовым ассистентом. Body: `{ message, sessionId?, lang? }` |
| POST | `/voice-agent/synthesize` | JWT | TTS: текст → аудио (OpenAI). Body: `{ text, lang? }` |
| GET | `/voice-agent/session/:id` | JWT | Получить сессию (ownership check) |
| DELETE | `/voice-agent/session/:id` | JWT | Удалить сессию |
| POST | `/voice-agent/session/:id/book-nurse` | JWT | Данные для заказа медсестры из сессии |
| POST | `/voice-agent/session/:id/book-doctor` | JWT | Данные для записи к врачу из сессии |
| GET | `/voice-agent/admin/sessions` | Admin | Список сессий |
| GET | `/voice-agent/admin/sessions/stats` | Admin | KPI статистика |
| GET | `/voice-agent/admin/sessions/:id` | Admin | Детали сессии |

---

## 9. Services — Каталог услуг

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/services` | — | Список активных услуг (public) |
| GET | `/services/:id` | — | Детали услуги |
| POST | `/services` | Admin | Создать услугу. Body: `{ title, price, priceMin?, priceMax?, category?, durationMinutes? }` |
| PATCH | `/services/:id` | Admin | Обновить |
| DELETE | `/services/:id` | Admin | Деактивировать |

---

## 10. Reviews — Отзывы

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/reviews` | JWT | Создать отзыв. Body: `{ orderId, targetRole, rating, comment? }` |
| GET | `/reviews/medic/:medicId` | — | Отзывы о медике (public) |
| GET | `/reviews/client/:clientId` | JWT | Отзывы о клиенте |
| GET | `/reviews/order/:orderId` | JWT | Отзывы по заказу |

---

## 11. Referrals — Реферальная программа

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/referrals/my` | JWT | Мой реферальный код и статистика |
| GET | `/referrals/validate/:code` | — | Проверить код (public) |

---

## 12. Favorites — Избранные медики

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/favorites` | JWT | Мои избранные |
| POST | `/favorites/:medicId` | JWT | Добавить в избранное |
| DELETE | `/favorites/:medicId` | JWT | Убрать из избранного |

---

## 13. Medical Card — Медкарта

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/medical-card` | JWT | Моя медкарта |
| PUT | `/medical-card` | JWT | Создать/обновить. Body: `{ bloodType?, allergies?, chronicDiseases?, notes? }` |
| GET | `/medical-card/client/:clientId` | Medic | Медкарта клиента (для медика) |

---

## 14. Treatment Courses — Курсы лечения

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/treatment-courses` | JWT | Создать курс. Body: `{ title, totalProcedures, intervalDays, nextDate? }` |
| GET | `/treatment-courses/my` | JWT | Мои курсы |
| PATCH | `/treatment-courses/:id` | JWT | Обновить |
| DELETE | `/treatment-courses/:id` | JWT | Удалить |

---

## 15. Loyalty — Лояльность

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/loyalty/my` | JWT | Баланс и уровень (BRONZE/SILVER/GOLD) |
| GET | `/loyalty/history` | JWT | История транзакций. Query: `page, limit` |
| POST | `/loyalty/redeem` | JWT | Обменять баллы на скидку. Body: `{ points }` |

---

## 16. Subscriptions — Подписки

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/subscriptions/tiers` | — | Доступные тарифы (public) |
| GET | `/subscriptions/my` | JWT | Моя подписка |
| POST | `/subscriptions/purchase` | JWT | Купить. Body: `{ tierId }` |
| POST | `/subscriptions/cancel` | JWT | Отменить подписку |
| GET | `/subscriptions/admin/tiers` | Admin | Все тарифы |
| POST | `/subscriptions/admin/tiers` | Admin | Создать тариф |
| PATCH | `/subscriptions/admin/tiers/:id` | Admin | Обновить |
| GET | `/subscriptions/admin/stats` | Admin | Статистика |

---

## 17. NPS — Опросы

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/nps/submit` | JWT | Отправить оценку. Body: `{ score, comment? }` |
| GET | `/nps/check` | JWT | Нужно ли показать опрос? → `{ shouldShow }` |
| GET | `/nps/admin/stats` | Admin | NPS статистика |

---

## 18. Promo — Промокоды

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/promo/validate` | JWT | Проверить код. Body: `{ code }` |
| GET | `/promo/admin` | Admin | Все промокоды |
| POST | `/promo/admin` | Admin | Создать. Body: `{ code, discountPercent, maxUses?, expiresAt? }` |
| PATCH | `/promo/admin/:id/deactivate` | Admin | Деактивировать |

---

## 19. App Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/settings` | — | Настройки приложения (public) |
| PATCH | `/settings` | Admin | Обновить. Body: `{ commissionRate?, urgentFeePercent?, ... }` |

---

## 20. Client Errors — Трекинг ошибок

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/client-errors` | — | Отправить ошибку. Body: `{ message, stack?, appType?, deviceInfo? }` |
| GET | `/client-errors/admin/stats` | Admin | Статистика ошибок |
| GET | `/client-errors/admin` | Admin | Список. Query: `page, limit, status?, appType?` |
| PATCH | `/client-errors/admin/:id` | Admin | Обновить статус (NEW→IN_PROGRESS→FIXED→IGNORED) |

---

## 21. Analytics — AI аналитика (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/analytics/ai-chat` | Admin | AI чат об аналитике |
| GET | `/analytics/feedback-summary` | Admin | Сводка фидбека |
| GET | `/analytics/top-issues` | Admin | Топ проблем |

---

## 22. System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| GET | `/health/detailed` | Admin | Детальный health check (DB, Cloudinary, memory) |
| GET | `/admin/audit-log` | Admin | Аудит-лог. Query: `page, limit` |
| POST | `/admin/push-campaign` | Admin | Массовая push рассылка |
| GET | `/admin/ledger` | Admin | Финансовый журнал. Query: `page, limit, type?, medicId?` |
| GET | `/admin/ledger/summary` | Admin | Сводка финансов |
| POST | `/telegram/webhook` | — | Telegram webhook (secret token validation) |

---

## Всего: ~170 endpoints

| Модуль | Endpoints |
|--------|-----------|
| Auth | 15 |
| Orders | 21 |
| Medics | 25 |
| Doctors | 18 |
| Consultations | 29 |
| Clinic | 45 |
| Payments | 7 |
| Voice Agent | 10 |
| Services | 5 |
| Reviews | 4 |
| Others | ~20 |
