# HamshiraGo — План реализации V1 / V1.1 / V2

> Зона ответственности: **Абубакир** (backend, mobile, medic)
> Составлено: 2026-03-29
> Основа: задачи из `tasks.md`, анализ текущей кодовой базы

---

## Анализ: что уже есть

| Фича | Статус | Что есть |
|------|--------|----------|
| Рейтинг и отзывы | ✅ Backend готов | `clientRating` + `clientReview` в Order, `rateOrder()` с пересчётом `averageRating`, `POST /orders/:id/rate` |
| Error Tracking | ⚠️ Частично | `client_errors` модуль: entity + `POST /client-errors` (public, 20/min). **Нет:** status, admin endpoints, группировка |
| Срочный вызов | ❌ Нет | Нет полей `isUrgent`/`urgentFee` в Order entity |
| Курсы лечения | ❌ Нет | Нет entity, нет cron |
| Рефералы | ❌ Нет | Нет кода/entity |
| Персональный медик | ❌ Нет | Нет `favorite_medics` |
| Медкарта | ❌ Нет | Нет entity |
| Push-инфраструктура | ✅ Готова | Expo Push + Web Push (VAPID) + Telegram Bot |
| Cron/Scheduler | ❌ Нет | `@nestjs/schedule` не подключён |

---

## 🔥 V1 — до запуска

### 1. Рейтинг и отзывы — Mobile/Medic UI (Backend ГОТОВ)

**Объём:** ~2 дня
**Зависимости:** нет

Backend уже реализован:
- `POST /orders/:id/rate` — принимает `{ rating: 1-5, review?: string }`
- Пересчёт `averageRating` у медика в транзакции
- `clientRating` + `clientReview` хранятся в Order

Осталось **только UI** (наша часть — mobile и medic):

#### Mobile (клиент)
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 1.1 | Экран оценки: звёзды + текстовое поле + кнопка "Отправить" | Уже есть `RatingModal.tsx` — нужно добавить `TextInput` для `review` | 2ч |
| 1.2 | Отправка `review` вместе с `rating` в `POST /orders/:id/rate` | `hooks/useOrderTracking.ts` → `submitRating()` — добавить параметр `review` | 1ч |
| 1.3 | Отображение отзывов в информации о медике на track-экране | `app/order/track.tsx` — показать `clientReview` если есть | 1ч |

#### Medic (медик)
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 1.4 | Профиль: отображение `averageRating` и `reviewCount` | `app/(tabs)/profile.tsx` — уже показывает rating, проверить reviewCount | 1ч |
| 1.5 | Экран "Мои отзывы" — список отзывов из завершённых заказов | Новый экран, данные из `GET /orders/medic/my?status=DONE` | 3ч |

#### Нет необходимости (по плану Диёра):
- ❌ Отдельная сущность `Review` — **не нужна**, `clientRating` + `clientReview` уже в Order
- ❌ `GET /reviews/medic/:id` — **не нужен**, отзывы берутся из orders с `clientRating IS NOT NULL`
- ❌ Автоматический пересчёт `averageRating` — **уже работает** в `rateOrder()`

---

### 2. Срочный вызов (Urgent Order)

**Объём:** ~3 дня
**Зависимости:** нет

#### Backend
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 2.1 | Добавить поля в Order entity: `isUrgent: boolean (default false)`, `urgentFee: number (default 0)` | `orders/entities/order.entity.ts` | 0.5ч |
| 2.2 | Обновить `CreateOrderDto`: добавить `@IsOptional() @IsBoolean() isUrgent` | `orders/dto/create-order.dto.ts` | 0.5ч |
| 2.3 | Логика расчёта в `create()`: если `isUrgent=true`, рассчитать `urgentFee` (фиксированная наценка или % от цены). Итоговая цена = `priceAmount + urgentFee - discountAmount` | `orders/orders.service.ts` | 2ч |
| 2.4 | Настройки срочности в AppSettings: `urgentFeePercent` (default 50%) и `urgentHoursStart/End` (ночное время 22:00–07:00) | `app-settings/entities/app-settings.entity.ts` | 1ч |
| 2.5 | Auto-detect urgent: если заказ ночью (22:00–07:00), автоматически предлагать `isUrgent` | `orders/orders.service.ts` | 1ч |
| 2.6 | Обновить `platformFee` расчёт с учётом `urgentFee` | `orders/orders.service.ts` | 0.5ч |
| 2.7 | Обновить earnings расчёт при DONE с учётом `urgentFee` | `orders/orders.service.ts` | 0.5ч |

#### Mobile (клиент)
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 2.8 | Переключатель "Срочный вызов" на экране подтверждения заказа | `app/order/confirm.tsx` | 2ч |
| 2.9 | Отображение доплаты при включении toggle (GET /settings для urgentFeePercent) | `app/order/confirm.tsx` | 1ч |
| 2.10 | Пометка "Срочный" в карточке заказа | `components/OrderCard.tsx` | 0.5ч |

#### Medic (медик)
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 2.11 | Пометка "🔴 Срочный" в OrderInviteModal и на экране заказа | `components/OrderInviteModal.tsx`, `app/order/[id].tsx` | 1ч |

---

### 3. Error Tracking — расширение существующего

**Объём:** ~3 дня
**Зависимости:** нет

Уже есть: `client_errors` модуль с базовым POST endpoint. Нужно расширить.

#### Backend
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 3.1 | Добавить поля в `ClientError` entity: `status` (enum: NEW/IN_PROGRESS/FIXED/IGNORED, default NEW), `deviceInfo` (varchar), `appVersion` (varchar), `errorCode` (varchar) | `client-errors/entities/client-error.entity.ts` | 1ч |
| 3.2 | Обновить `CreateClientErrorDto`: добавить `deviceInfo`, `appVersion`, `errorCode` | `client-errors/dto/create-client-error.dto.ts` | 0.5ч |
| 3.3 | `GET /client-errors/admin` — список с пагинацией + фильтры (status, appType, dateFrom, dateTo, userId). Guard: AdminGuard | `client-errors/client-errors.controller.ts` | 2ч |
| 3.4 | `PATCH /client-errors/admin/:id` — изменить статус. Guard: AdminGuard | `client-errors/client-errors.controller.ts` | 1ч |
| 3.5 | `GET /client-errors/admin/stats` — количество по статусам (для бейджа в сайдбаре) | `client-errors/client-errors.controller.ts` | 1ч |
| 3.6 | Автогруппировка: при создании — поиск существующей ошибки с тем же `errorCode + message` за последние 24ч, инкремент `count` вместо создания дубликата | `client-errors/client-errors.service.ts` | 2ч |

#### Mobile + Medic
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 3.7 | Global Error Boundary: перехват JS-ошибок, отправка на `POST /client-errors` с userId, screen, deviceInfo, appVersion | `mobile/app/_layout.tsx`, `medic/app/_layout.tsx` | 3ч |
| 3.8 | Добавить `deviceInfo` (Platform.OS + version) и `appVersion` (Constants.expoConfig.version) в payload | Общая утилита `utils/reportError.ts` | 1ч |

---

## 🚀 V1.1 — месяц 1–3 после запуска

### 4. Push-напоминания по курсу лечения

**Объём:** ~4 дня
**Зависимости:** `@nestjs/schedule`

#### Backend
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 4.1 | Подключить `@nestjs/schedule`: `npm i @nestjs/schedule`, добавить `ScheduleModule.forRoot()` в `app.module.ts` | `app.module.ts` | 0.5ч |
| 4.2 | Создать модуль `treatment-courses`: entity `TreatmentCourse` (clientId, title, totalProcedures, completedProcedures, intervalDays, nextDate, serviceId, status: ACTIVE/COMPLETED/PAUSED) | Новый модуль | 2ч |
| 4.3 | CRUD endpoints: `POST /treatment-courses`, `GET /treatment-courses/my`, `PATCH /treatment-courses/:id` | Новый controller | 2ч |
| 4.4 | Cron-задача: каждый час проверять `nextDate <= now + 2h`, отправлять push + Telegram | Новый service | 3ч |
| 4.5 | Автосоздание курса: после DONE, если услуга = инъекция/капельница, предложить "Создать курс?" | `orders/orders.service.ts` | 1ч |

#### Mobile
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 4.6 | Экран "Мои курсы" — список активных курсов с прогресс-баром | Новый экран `app/(tabs)/courses.tsx` или раздел в профиле | 4ч |
| 4.7 | Создание курса после завершения заказа (prompt) | `app/order/track.tsx` | 2ч |

---

### 5. Реферальная программа

**Объём:** ~3 дня
**Зависимости:** нет

#### Backend
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 5.1 | Добавить поле `referralCode` (unique, auto-generated) в User entity | `users/entities/user.entity.ts` | 0.5ч |
| 5.2 | При регистрации: автогенерация 8-символьного кода | `auth/auth.service.ts` | 0.5ч |
| 5.3 | `POST /auth/register` — принимать `referredBy` код. Найти реферера, привязать | `auth/auth.controller.ts` | 1ч |
| 5.4 | Entity `Referral` (referrerId, referredId, bonusAmount, status, createdAt) | Новый файл | 1ч |
| 5.5 | Логика бонуса: после первого DONE реферала — обоим начисляется скидка на следующий заказ | `orders/orders.service.ts` | 2ч |
| 5.6 | `GET /referrals/my` — список приглашённых + бонусы | Новый controller | 1ч |

#### Mobile
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 5.7 | Экран "Пригласи друга" — код + кнопка "Поделиться" (Share API) | Новый экран в профиле | 3ч |
| 5.8 | Поле "Код друга" при регистрации | `app/auth.tsx` | 1ч |

---

### 6. Персональный медик (Favorites)

**Объём:** ~2 дня
**Зависимости:** нет

#### Backend
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 6.1 | Entity `FavoriteMedic` (userId, medicId, createdAt). ManyToMany через join table | Новый файл | 1ч |
| 6.2 | `POST /favorites/:medicId` — добавить в избранное | Новый controller | 0.5ч |
| 6.3 | `DELETE /favorites/:medicId` — убрать из избранного | Новый controller | 0.5ч |
| 6.4 | `GET /favorites` — список избранных медиков | Новый controller | 0.5ч |
| 6.5 | Приоритет в dispatch: если у клиента есть favorite medic, и он online/approved — предложить ему первому | `orders/dispatch.service.ts` | 2ч |

#### Mobile
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 6.6 | Кнопка "❤️ Закрепить медика" на track-экране после DONE | `app/order/track.tsx` | 1ч |
| 6.7 | Экран "Мои медики" в профиле | Новый экран | 2ч |

---

### 7. Медкарта клиента

**Объём:** ~2 дня
**Зависимости:** нет

#### Backend
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 7.1 | Entity `MedicalCard` (userId OneToOne, bloodType, allergies: text, chronicDiseases: text, notes: text, updatedAt) | Новый модуль | 1ч |
| 7.2 | `GET /medical-card` — получить свою карту (client auth) | Новый controller | 0.5ч |
| 7.3 | `PUT /medical-card` — создать/обновить (upsert) | Новый controller | 0.5ч |
| 7.4 | `GET /medical-card/client/:id` — медик просматривает карту клиента (medic auth, только если assigned к заказу клиента) | Новый controller | 1ч |

#### Mobile
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 7.5 | Экран "Моя медкарта" в профиле — форма с полями | Новый экран | 3ч |

#### Medic
| # | Задача | Файлы | Оценка |
|---|--------|-------|--------|
| 7.6 | На экране заказа — кнопка "Медкарта клиента" (если заполнена) | `app/order/[id].tsx` | 1ч |

---

## ⚡ V2 — месяц 3–6

### 8. Программа лояльности

**Объём:** ~2 дня

#### Backend
| # | Задача | Оценка |
|---|--------|--------|
| 8.1 | Добавить `loyaltyPoints` и `totalOrdersCount` в User entity | 0.5ч |
| 8.2 | При DONE: инкремент `totalOrdersCount`, начисление points | 1ч |
| 8.3 | Каждый 5-й заказ: автоматическая скидка (через discount logic) | 2ч |
| 8.4 | `GET /loyalty/my` — баланс баллов, прогресс до скидки | 1ч |

#### Mobile
| # | Задача | Оценка |
|---|--------|--------|
| 8.5 | Экран "Мои бонусы" с прогресс-баром | 3ч |

---

### 9. Подписки / семейные пакеты

**Объём:** ~5 дней (крупная фича)

#### Backend
| # | Задача | Оценка |
|---|--------|--------|
| 9.1 | Entity `SubscriptionPlan` (title, visits, price, durationDays) — шаблоны пакетов | 1ч |
| 9.2 | Entity `UserSubscription` (userId, planId, remainingVisits, expiresAt, status) | 1ч |
| 9.3 | `POST /subscriptions/purchase` — покупка пакета (интеграция с Payme/Click) | 4ч |
| 9.4 | При создании заказа — списание визита из активной подписки | 2ч |
| 9.5 | Admin CRUD для управления тарифами | 2ч |

#### Mobile
| # | Задача | Оценка |
|---|--------|--------|
| 9.6 | Экран выбора подписки | 4ч |
| 9.7 | Отображение "Осталось N визитов" в профиле и при заказе | 2ч |

---

### 10–11. NPS + ИИ-агент — на будущее (оценки ориентировочные)

| Фича | Backend | Mobile | Итого |
|------|---------|--------|-------|
| NPS-опросы | 3 дня | 1 день | ~4 дня |
| ИИ-агент + онлайн-консультация | 10–15 дней | 5–7 дней | ~3 недели |

---

## Приоритеты и порядок реализации

### Рекомендуемая очерёдность (наша часть):

```
Приоритет 1 — V1, минимальные усилия, максимум ценности:
  ┌─ 1. Рейтинг: Mobile UI (backend готов)        — 1 день
  ├─ 2. Error Tracking: расширение                 — 3 дня
  └─ 3. Срочный вызов                              — 3 дня
                                              Итого: ~7 дней

Приоритет 2 — V1.1, можно после запуска:
  ┌─ 4. Персональный медик (favorites)             — 2 дня
  ├─ 5. Медкарта                                   — 2 дня
  ├─ 6. Реферальная программа                      — 3 дня
  └─ 7. Курсы лечения + cron                       — 4 дня
                                              Итого: ~11 дней

Приоритет 3 — V2:
  ┌─ 8. Лояльность                                 — 2 дня
  ├─ 9. Подписки                                   — 5 дней
  ├─ 10. NPS                                       — 4 дня
  └─ 11. ИИ-агент                                  — 3 недели
                                              Итого: ~30 дней
```

### Общий объём (наша часть): ~48 рабочих дней

---

## Технические решения

### Новые npm-пакеты (backend)
```
@nestjs/schedule          — для cron (курсы лечения, NPS)
```
Всё остальное уже в проекте.

### Новые таблицы (PostgreSQL)
```
V1:   — (нет новых таблиц, только ALTER на client_errors и orders)
V1.1: favorite_medics, treatment_courses, referrals, medical_cards
V2:   subscription_plans, user_subscriptions, nps_responses
```

### Миграции
> Все новые колонки на существующих таблицах — `nullable: true` или с `default`.
> Правило из CLAUDE.md: "Не делать `nullable: false` на новых колонках у существующих таблиц".

---

## Зависимости от Диёра

| Фича | Что делает Диёр | Блокирует нас? |
|------|-----------------|----------------|
| Рейтинг | Web UI для оценки + отображение отзывов | ❌ Нет |
| Срочный вызов | Web toggle + admin отображение | ❌ Нет |
| Error Tracking | Admin страница "User Support" + web error handler | ❌ Нет (backend endpoints делаем первыми) |
| SEO-страницы | 100% его зона | — |
| Реферальная | Web экран "Пригласи друга" | ❌ Нет |
| Персональный медик | Web кнопка "Закрепить" | ❌ Нет |
| Медкарта | Web экран медкарты | ❌ Нет |
| Подписки | Web выбор подписки + admin тарифы | ❌ Нет |

> Вывод: все наши задачи **независимы** от Диёра. Можем начинать параллельно.
