# HamshiraGo — Активные задачи

> Обновляется при каждом изменении. Выполненные задачи → `done.md`.
> **Этапы 1–18 выполнены** — подробности в `done.md`.
> **Полный аудит проведён 2026-03-28** — backend (41), mobile (25), medic (26).

---

## 👥 Роли разработки

| Роль | Зона ответственности |
|------|---------------------|
| **Абубакир** | `backend/`, `mobile/`, `medic/` |
| **Диёр** | `admin/`, `web/`, `web-medic/`, `landing/`, SEO, логотип |

> Документация (`docs/`) обновляется тем, кто выполняет задачу.

---

## 🔴 CRITICAL — Backend (аудит 2026-03-28)

- [x] **BE-C1** — FIXED — Унифицировано начисление earnings: оба пути используют `netPrice`
- [x] **BE-C2** — FIXED — SQL-инъекция: заменена интерполяция на `.setParameter('fee', fee)`
- [x] **BE-C3** — FIXED — Race condition: атомарный `update()` с `Not(In([DONE, CANCELED]))`
- [x] **BE-C4** — FIXED — Telegram webhook: проверка `X-Telegram-Bot-Api-Secret-Token` + `secret_token` в setWebhook
- [x] **BE-C5** — FIXED — Payme auth: `crypto.timingSafeEqual` вместо `!==`

## 🔴 CRITICAL — Mobile (аудит 2026-03-28)

- [x] **MOB-C1** — ~~Каталог `/services` запрашивается без token~~ — **FIXED** — передаём token в apiFetch
- [x] **MOB-C2** — ~~Двойное подключение WebSocket~~ — **FIXED** — единый SocketContext/SocketProvider
- [x] **MOB-C3** — ~~`discountAmount` вычисляется на клиенте~~ — **TODO added** — требует backend fix BE-L7
- [x] **MOB-C4** — ~~Нет валидации телефона~~ — **FIXED** — regex проверка формата +998 / min 9 цифр
- [x] **MOB-C5** — ~~EAS Project ID placeholder~~ — **FIXED** — registerPushToken логирует warning при placeholder

## 🔴 CRITICAL — Medic (аудит 2026-03-28)

- [x] **MED-C1** — ~~Два WebSocket-соединения одновременно~~ — FIXED: shared SocketContext
- [x] **MED-C2** — ~~SwipeActionButton stale onConfirm~~ — FIXED: onConfirmRef pattern

---

## 🟠 HIGH — Backend

- [x] **BE-H1** — FIXED (already) — `isBlocked` проверяется в `JwtStrategy.validate()` — `strategies/jwt.strategy.ts`
- [x] **BE-H2** — FIXED (already) — `verifyOrderOwnership` проверяет `clientId === userId` — `payments.controller.ts`, `payments.service.ts`
- [x] **BE-H3** — FIXED (already) — `verifyOrderOwnership` проверяет владельца — `payments.controller.ts`, `payments.service.ts`
- [x] **BE-H4** — FIXED (already) — `validateClickIp` проверяет IP 185.8.212.0/24 и 195.158.28.0/24 — `payments.controller.ts`
- [x] **BE-H5** — FIXED (already) — `amount <= 0` проверяется inline — `medics.controller.ts`
- [x] **BE-H6** — FIXED (already) — `PushTokenDto` и `WebPushSubscriptionDto` имеют `@MaxLength` — `common/dto/`
- [x] **BE-H7** — FIXED (already) — order + location обёрнуты в `dataSource.transaction` — `orders.service.ts`
- [x] **BE-H8** — FIXED (already) — `profilePhotoUrl IS NOT NULL` в `findCandidatesForDispatch` — `medics.service.ts`
- [x] **BE-H9** — FIXED — `@MaxLength(10000)` на stacktrace, `@MaxLength(2000)` на message — `client-errors/dto/create-client-error.dto.ts`
- [x] **BE-H10** — FIXED — `@Exclude()` на `passwordHash` + `ClassSerializerInterceptor` глобально — `medic.entity.ts`, `user.entity.ts`, `main.ts`
- [x] **BE-H11** — FIXED — Telegram `/start` проверяет что medic не привязан к другому chatId — `telegram-bot.service.ts`

## 🟠 HIGH — Mobile

- [x] **MOB-H1** — VERIFIED — `ratingSubmittingRef` guard already present, `ratingSubmitting` not in deps — `hooks/useOrderTracking.ts`
- [x] **MOB-H2** — FIXED — All hardcoded Russian strings replaced with `t()` calls — `app/order/track.tsx`, `app/(tabs)/two.tsx`, `components/RatingModal.tsx`
- [x] **MOB-H3** — FIXED — Removed deprecated `STATUS_LABEL`, `OrderCard` uses `getStatusLabel(t)` — `types/order.ts`
- [x] **MOB-H4** — VERIFIED — `OrderCard.onPress` already navigates for all statuses — `components/OrderCard.tsx`
- [x] **MOB-H5** — FIXED — `cancelOrder` no longer checks truthiness of result (204 returns undefined); navigation always runs on success, throws on failure — `hooks/useOrderTracking.ts`

## 🟠 HIGH — Medic

- [x] **MED-H1** — FIXED — location interval no longer cleared on accept — `hooks/useMedicOrderFeed.ts`
- [x] **MED-H2** — FIXED — 401 shows alert before logout instead of silent logout — `constants/api.ts`
- [x] **MED-H3** — FIXED — fetchOrderRef pattern removes fetchOrder from socket effect deps — `hooks/useOrderStatus.ts`
- [x] **MED-H4** — FIXED — confirmAccept wrapped in try/catch, navigation only on success — `app/(tabs)/index.tsx`
- [x] **MED-H5** — VERIFIED — `.env` already in root `.gitignore`, not tracked by git

---

## 🟡 MEDIUM — Backend

- [x] **BE-M1** — FIXED (already) — `forbidNonWhitelisted: true` в ValidationPipe — `main.ts`
- [x] **BE-M2** — FIXED (already) — Payme cancelTransaction поддерживает state=-2 (refund) — `payme.service.ts`
- [x] **BE-M3** — FIXED (already) — `synchronize: false` для всех окружений — `app.module.ts`
- [x] **BE-M4** — FIXED (already) — DB pool `max: 20` — `app.module.ts`
- [x] **BE-M5** — FIXED (already) — Dispatch timer восстанавливает PENDING с future expiresAt — `dispatch.service.ts`
- [x] **BE-M6** — FIXED (already) — `findAvailable` возвращает [] для не-APPROVED/blocked медиков — `orders.service.ts`
- [x] **BE-M7** — FIXED (already) — `subscribe_order` кэширует access check (30s TTL) — `order-events.gateway.ts`
- [x] **BE-M8** — FIXED (already) — `medic_location` кэширует medic-to-order mapping (30s TTL) — `order-events.gateway.ts`
- [x] **BE-M9** — FIXED — Добавлен составной `@Index(['orderId', 'medicId', 'result'])` — `dispatch-attempt.entity.ts`
- [x] **BE-M10** — FIXED — WebSocket CORS использует shared `ALLOWED_ORIGINS` из `cors.config.ts` — `order-events.gateway.ts`
- [x] **BE-M11** — FIXED — Cloudinary timeout clearTimeout через `.finally()` — `cloudinary.service.ts`
- [x] **BE-M12** — FIXED (already) — Payme GetStatement имеет `take: 1000` — `payme.service.ts`

## 🟡 MEDIUM — Mobile

- [x] **MOB-M1** — FIXED — Infinite scroll pagination в orders list — `app/(tabs)/two.tsx`
- [x] **MOB-M2** — FIXED — Profile uses limit=1 + total from pagination — `app/(tabs)/profile.tsx`
- [x] **MOB-M3** — VERIFIED — Already uses shared SocketContext, no token dep for socket — `hooks/useOrderTracking.ts`
- [x] **MOB-M4** — FIXED — `res.ok` check added — `utils/registerPushToken.ts`
- [x] **MOB-M5** — FIXED — Removed `region` prop, kept `initialRegion` — `components/LocationMap.tsx`
- [x] **MOB-M6** — FIXED — AbortController 20s timeout — `constants/api.ts`
- [x] **MOB-M7** — FIXED — `language` added to useEffect deps — `app/(tabs)/index.tsx`
- [x] **MOB-M8** — FIXED — Refs for locations, removed from useCallback deps — `hooks/useRoutePolyline.ts`
- [x] **MOB-M9** — FIXED — TextInput moved inside AppModal children — `app/order/track.tsx`, `components/AppModal.tsx`

## 🟡 MEDIUM — Medic

- [x] **MED-M1** — FIXED — All hardcoded Russian strings replaced with `t()` across 5 files
- [x] **MED-M2** — FIXED — Auto-dismiss modal after 2s when countdown hits 0
- [x] **MED-M3** — FIXED — `startingRef.current = false` after setting watchRef on success
- [x] **MED-M4** — FIXED — OSRM_URL imported from `@/constants/config`
- [x] **MED-M5** — FIXED — Error state + retry UI in my-orders.tsx
- [x] **MED-M6** — FIXED — Uses `?status=DONE&limit=1` + `total` from pagination
- [x] **MED-M7** — FIXED — `onDismissRef` pattern + `order.id` in effect deps
- [x] **MED-M8** — FIXED — Throttle increased to 30s + 200m distance check
- [x] **MED-M9** — FIXED — `reconnectionAttempts: 15` added to SocketContext

---

## 🔵 LOW — Backend

- [x] **BE-L1** — FIXED — `findOneBasic` без medic JOIN для внутренних вызовов; `findOne` с JOIN для API — `orders.service.ts`
- [x] **BE-L2** — FIXED — Interval сохраняется в `cleanupInterval`, `onModuleDestroy` очищает его — `order-events.gateway.ts`
- [x] **BE-L3** — FIXED — `BlockUserDto` с `@IsBoolean()` заменил inline тип — `auth/dto/block-user.dto.ts`, `auth.controller.ts`
- [x] **BE-L4** — FIXED — Все вызовы `notifyClient`/`notifyMedic` получили `.catch(err => console.error('Notify error:', err))` — `orders.service.ts`
- [x] **BE-L5** — FIXED — `GET /services/:id` бросает `NotFoundException` если результат null — `services.controller.ts`
- [x] **BE-L6** — FIXED — `broadcastToAll` обрабатывает chunks по 20 с 100ms задержкой — `telegram.service.ts`
- [x] **BE-L7** — FIXED — `discountAmount` ограничен 20% от цены сервиса; TODO-комментарий для promo-code системы — `orders.service.ts`

## 🔵 LOW — Mobile

- [x] **MOB-L1** — FIXED — `fetchLocation` infinite loop: replaced `pin` dep with `initialPinSetRef` ref — `app/order/location.tsx`
- [x] **MOB-L2** — FIXED — Removed unused `getServiceById` import and `service` variable — `app/order/location.tsx`
- [x] **MOB-L3** — FIXED — Wrapped native `LocationMap` with `React.memo` to prevent MapView re-renders — `app/order/location.tsx`
- [x] **MOB-L4** — FIXED — Removed duplicate channel setup from `registerPushToken.ts`; kept only in `_layout.tsx` — `utils/registerPushToken.ts`
- [x] **MOB-L5** — FIXED — `logout` typed as `() => Promise<void>` in `AuthContextType` interface — `context/AuthContext.tsx`

## 🔵 LOW — Medic

- [x] **MED-L1** — FIXED — Added `useEffect` to sync `faceUri`/`licenseUri` state when `medic.facePhotoUrl`/`licensePhotoUrl` changes — `app/verification.tsx`
- [x] **MED-L2** — FIXED — Replaced dynamic `import('@/constants/api')` with static `API_BASE` import at top of file — `app/(tabs)/profile.tsx`
- [x] **MED-L3** — FIXED — `token` stored in `tokenRef`; `pushLocation` has empty deps; removed `pushLocation` from socket effect deps — `hooks/useMedicOrderFeed.ts`

---

## ⚠️ Частично закрыты (требуют backend-изменений)

- **JWT в localStorage** (web, web-medic, admin) — auto-logout при истечении добавлен; полный фикс = httpOnly cookies на бэкенде
- **Admin JWT** — `AdminLayout` проверяет exp каждые 60с ✅ (BUG 32); localStorage XSS-уязвимость остаётся пока нет httpOnly cookies (BUG 33)

## ⛔ Вне зоны изменений (зафиксировано, не исправляем)

- BUG 14: web-medic загружает все заказы чтобы найти один по id
- BUG 15: web client передаёт лишние поля в CreateOrderDto
- BUG 26: `BASE_URL` захардкожен `localhost:3000` в web и web-medic
- BUG 27: `api.orders.list()` ожидает массив, бэкенд возвращает объект с пагинацией
- BUG 28: WebSocket cleanup не эмитит `unsubscribe_order`
- BUG 29: web-клиент может напрямую поставить статус DONE

---

## 📋 Открытые задачи

### Store публикация (Этап 14 — Абубакир)
- [ ] `eas init` → вставить projectId в `mobile/app.json`
- [ ] `expo-updates` install + настройка в обоих app.json
- [ ] `eas credentials` — keystore Android + APNs iOS
- [ ] Play Store: создать приложение `com.hamshirago.client`, загрузить AAB, скриншоты, Privacy Policy
- [ ] App Store: Apple Developer аккаунт ($99/год), создать app в App Store Connect
- [ ] Скриншоты: 2+ (16:9) для Google Play; 6.7", 6.1", 5.5" для App Store (RU + UZ)
- [ ] Privacy Policy URL (обязательно для обоих сторов)

---

## 🔥 V1 — до запуска

### Взаимные отзывы после заказа — Абубакир (backend) + Диёр (web/mobile/web-medic)
**Уже сделано (клиент → медик):**
- [x] Mobile: экран оценки (звёзды + комментарий) после DONE — `components/RatingModal.tsx`, `hooks/useOrderTracking.ts`
- [x] Mobile: отображение `clientReview` и `reviewCount` после оценки — `app/order/track.tsx`
- [x] Medic: `reviewCount` на странице профиля рядом с рейтингом — `app/(tabs)/profile.tsx`
- [x] Medic: экран «Мои отзывы» со списком отзывов из DONE заказов — `app/reviews.tsx`
**Осталось (клиент → медик):**
- [ ] Backend: сущность `Review` (orderId, clientId, medicId, rating 1–5, comment, createdAt)
- [ ] Backend: `POST /reviews` — клиент оставляет отзыв после DONE
- [ ] Backend: `GET /reviews/medic/:id` — отзывы медика
- [ ] Backend: автоматический пересчёт `averageRating` у медика
- [ ] Web: экран оценки после завершения заказа (звёзды + комментарий)
- [ ] Web: отображение рейтинга и отзывов в профиле медика
**Новое (медик → клиент):**
- [ ] Backend: расширить `Review` — добавить `authorRole` [client/medic], `targetRole` [medic/client] для двусторонних отзывов
- [ ] Backend: `GET /reviews/client/:id` — отзывы о клиенте от медиков
- [ ] Backend: автоматический пересчёт `averageRating` у клиента
- [ ] Backend: push/Telegram напоминание через 1 час если отзыв не оставлен
- [ ] Web-medic/Mobile medic: экран оценки клиента после заказа (был ли вежлив, подготовил ли место, оплатил вовремя)
- [ ] Web-medic/Mobile medic: медик видит рейтинг клиента при получении заказа (помогает решить — принять или нет)
- [ ] Admin: страница всех отзывов с фильтрами (по медику, клиенту, рейтингу, дате)

### Срочный вызов (extra fee) — Абубакир (backend) + Диёр (web/mobile)
- [x] Backend: поле `isUrgent` в заказе + `urgentFee` (наценка)
- [x] Backend: логика расчёта — ночь/праздник = автоматическая наценка
- [x] Backend: `urgentFeePercent`, `urgentStartHour`, `urgentEndHour` в AppSettings (PATCH /settings)
- [x] Admin: фильтр `?isUrgent=true` в GET /orders/admin/all
- [x] Mobile: переключатель «Срочный вызов» при создании заказа с отображением доплаты — `mobile/app/order/confirm.tsx`
- [x] Mobile: бейдж «Срочный» в OrderCard и track screen — `mobile/components/OrderCard.tsx`, `mobile/app/order/track.tsx`
- [x] Medic: баннер срочного заказа в OrderInviteModal — `medic/components/OrderInviteModal.tsx`
- [x] Medic: бейдж «Срочный» и urgentFee в деталях заказа — `medic/app/order/[id].tsx`
- [ ] Web: переключатель «Срочный вызов» при создании заказа с отображением доплаты

### Система трекинга ошибок пользователей (User Support / Error Tracking) — Абубакир (backend) + Диёр (admin/web/mobile)
- [x] Backend: расширена сущность `ClientError` — добавлены `status`, `deviceInfo`, `appVersion`, `errorCode`, `count`, `resolvedAt`
- [x] Backend: `POST /client-errors` — уже существовал; теперь поддерживает новые поля + авто-группировку по errorCode
- [x] Backend: `GET /client-errors/admin` — список с фильтрами (userId, appType, status, dateFrom, dateTo, pagination)
- [x] Backend: `PATCH /client-errors/admin/:id` — изменение статуса (NEW → IN_PROGRESS → FIXED → IGNORED)
- [x] Backend: `GET /client-errors/admin/stats` — счётчики по статусам
- [x] Backend: автоматическая группировка одинаковых ошибок (по errorCode + appType, окно 24 ч)
- [x] Mobile: глобальный error boundary — перехватывает все падения и отправляет на backend с userId, экраном, устройством
- [ ] Web/Web-medic: глобальный error handler — перехватывает ошибки API и JS и отправляет на backend
- [ ] Admin: новая страница «User Support» — таблица ошибок с колонками: пользователь, ошибка, экран, устройство, дата, статус
- [ ] Admin: фильтры — по пользователю, по дате, по статусу (новые/в работе/исправлены)
- [ ] Admin: детальная карточка ошибки — полный стек, информация об устройстве, история заказов пользователя
- [ ] Admin: счётчик новых ошибок в сайдбаре (бейдж)

### Ограничение зоны работы для медиков (геозона) — Абубакир (backend) + Диёр (web-medic/mobile medic)
- [ ] Backend: поля у медика — `workZoneCenter` (lat, lng) + `workZoneRadius` (в км)
- [ ] Backend: при диспатче — если геозона задана, отправлять только заказы внутри круга (расстояние от центра < radius)
- [ ] Backend: `PATCH /medics/work-zone` — сохранить/обновить центр и радиус зоны
- [ ] Backend: `DELETE /medics/work-zone` — убрать ограничение (принимать заказы отовсюду)
- [ ] Web-medic/Mobile medic: экран с картой — медик ставит точку и тянет круг (или слайдером выбирает радиус 1–15 км)
- [ ] Web-medic/Mobile medic: визуальное отображение зоны на карте (полупрозрачный круг)
- [ ] Admin: на карте медиков отображать их геозоны

### SEO-страницы на лендинге — Диёр
- [ ] Страницы услуг: `/uslugi/ukol-na-domu`, `/uslugi/kapelnica-na-domu`
- [ ] Страницы по районам: `/tashkent/chilanzar`, `/tashkent/yunusabad` и т.д.
- [ ] Meta-теги, Open Graph, JSON-LD разметка для Google
- [ ] Sitemap.xml + robots.txt

---

## 🚀 V1.1 — месяц 1–3 после запуска

### Push-напоминания по курсу лечения — Абубакир (backend)
- [ ] Backend: сущность `TreatmentCourse` (clientId, название, количество процедур, интервал, следующая дата)
- [ ] Backend: cron-задача — отправка push/Telegram за 2 часа до следующей процедуры
- [ ] Mobile/Web: экран «Мои курсы лечения» с расписанием

### Реферальная программа — Абубакир (backend) + Диёр (web/mobile)
- [ ] Backend: генерация реферального кода для каждого клиента
- [ ] Backend: логика начисления бонусов — оба получают скидку на следующий заказ
- [ ] Backend: `GET /referrals/my` — список приглашённых и бонусов
- [ ] Mobile/Web: экран «Пригласи друга» с кодом/ссылкой + шаринг

### Персональный медик — Абубакир (backend) + Диёр (web/mobile)
- [ ] Backend: поле `favoriteMedicId` у клиента или таблица `favorite_medics`
- [ ] Backend: при создании заказа — приоритет закреплённому медику
- [ ] Mobile/Web: кнопка «Закрепить медика» в профиле медика после заказа

### Медкарта в приложении — Абубакир (backend) + Диёр (web/mobile)
- [ ] Backend: сущность `MedicalCard` (clientId, аллергии, хронические заболевания, группа крови, заметки)
- [ ] Backend: CRUD эндпоинты `/medical-card`
- [ ] Mobile/Web: экран «Моя медкарта» — заполнение и просмотр
- [ ] Медик видит медкарту клиента при принятии заказа

---

## ⚡ V2 — месяц 3–6

### Программа лояльности — Абубакир (backend)
- [ ] Backend: счётчик заказов клиента, каждый 5-й заказ — автоматическая скидка
- [ ] Backend: начисление бонусных баллов за заказы
- [ ] Mobile/Web: экран «Мои бонусы» с прогресс-баром до следующей скидки

### Семейные пакеты / подписки — Абубакир (backend) + Диёр (web/mobile)
- [ ] Backend: сущность `Subscription` (тип пакета, кол-во визитов, цена, срок)
- [ ] Backend: логика списания визитов из пакета при заказе
- [ ] Mobile/Web: экран выбора подписки + управление пакетом
- [ ] Admin: управление тарифами подписок

### NPS-опросы — Абубакир (backend)
- [ ] Backend: cron — раз в месяц отправка NPS-опроса активным клиентам (push/Telegram)
- [ ] Backend: сбор и хранение NPS-ответов
- [ ] Admin: дашборд NPS с графиком по месяцам

### 🤖 ИИ-агент + онлайн-консультация — Абубакир (backend)
- [ ] Backend: интеграция с AI API (Claude/OpenAI) — чат-бот для первичной сортировки симптомов
- [ ] Backend: сущность `Doctor` (специализация, расписание, цена консультации)
- [ ] Backend: логика маршрутизации — ИИ определяет специализацию → предлагает врача
- [ ] Backend: видео/чат консультация (интеграция с Agora/WebRTC или Telegram видеозвонок)
- [ ] Backend: связка — врач назначает лечение → автоматическое создание заказа на медсестру
- [ ] Mobile/Web: экран чат-бота «Опишите симптомы»
- [ ] Mobile/Web: экран онлайн-консультации с врачом
- [ ] Комиссия 15–20% с консультации врача

---

## 💡 Идеи / V2+

- [ ] Разделить таблицу `payments` — отдельный `payments_ledger` для прозрачности финансов
- [ ] Аналитика в admin: графики заказов, выручка, топ медики
- [ ] Фильтр услуг по категории на главном экране mobile/web
- [ ] Повторный заказ (кнопка "Заказать снова" в истории)
- [ ] История платежей клиента: `GET /payments/my`
- [ ] Редактирование профиля: `PATCH /auth/profile`, `PATCH /medics/profile`
- [ ] Token refresh mechanism (вместо hard logout при 401)
- [ ] `/orders/stats` endpoint для подсчёта заказов без загрузки данных
- [ ] Certificate pinning для mobile apps
- [ ] httpOnly cookies вместо JWT в localStorage

---

## 📋 Документация (правило)

> После каждого выполненного этапа — обновить `done.md` с датой, описанием, файлами.
> Backend-изменения → обновить `docs/BACKEND_API.md`.
