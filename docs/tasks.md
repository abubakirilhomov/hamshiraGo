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

## 🔴 Аудит 2026-04-01 — Баги и проблемы

### CRITICAL (5 багов)
- [x] **BE-CR1** — **FIXED** — Double-payment race condition в Payme — `performTransaction` обернут в `dataSource.transaction` с `SELECT ... FOR UPDATE` — `payments/payme.service.ts`
- [x] **BE-CR2** — **FIXED** — Race condition cancel: атомарный UPDATE с `clientId` в WHERE, `ConflictException` при 0 affected rows — `orders/orders.service.ts`
- [x] **BE-CR3** — **FIXED** — Earnings calculation: добавлен `safeNumber()` для всех decimal полей (urgentFee, priceAmount, discountAmount, platformFee) — `orders/orders.service.ts`
- [x] **MOB-CR1** — **FIXED** — Push notification навигация: layout шлёт `?id=`, track.tsx ждёт `orderId` — исправлено на `?orderId=` в обоих обработчиках — `mobile/app/_layout.tsx`
- [x] **BE-CR4** — **FIXED** — Referral bonus race condition: обернут в транзакцию с `pessimistic_write` lock на user row — `orders/orders.service.ts`

### HIGH (12 багов)
- [x] **BE-H1** — **FIXED** — Dispatch invite expiry проверяется через `MoreThan(new Date())` в `onMedicAccept` — `dispatch.service.ts`
- [x] **BE-H2** — **FIXED** — Geofence проверяется при self-claim: haversine distance vs workZoneRadius — `orders.service.ts`
- [x] **BE-H3** — **FIXED** — WebSocket `handleConnection` проверяет `isBlocked` через UsersService/MedicsService — `order-events.gateway.ts`
- [x] **BE-H4** — **FIXED** — Reviews unique constraint расширен до `['orderId', 'authorRole', 'targetRole']` — `review.entity.ts`
- [x] **BE-H5** — **FIXED** — `findBaseBy` теперь пытается выбрать referral-поля с fallback — `users.service.ts`
- [x] **MOB-H1** — **FIXED** — parseFloat координат с isNaN проверкой — `mobile/app/order/confirm.tsx`
- [x] **MOB-H2** — **FIXED** — Stale orders: fetchOrdersRef паттерн для стабильного useFocusEffect — `mobile/app/(tabs)/two.tsx`
- [x] **MOB-H3** — **FIXED** — parseInt с валидацией >0 в treatment courses — `mobile/app/courses.tsx`
- [x] **MED-H1** — **FIXED** — Accept order: UI dismissal moved after successful API call; no re-throw so medic can retry — `medic/hooks/useMedicOrderFeed.ts`
- [x] **MED-H2** — **FIXED** — Background location token cleared immediately in logout() before state update — `medic/context/AuthContext.tsx`
- [x] **MED-H3** — **FIXED** — Socket disconnect stops tracking; `socket!.emit()` replaced with safe `socket?.connected` check — `medic/hooks/useMedicLocation.ts`

### MEDIUM (16 багов)
- [x] **BE-M1** — **FIXED** — Discount validation: first-order check + 15% cap — `orders.service.ts`
- [x] **BE-M2** — **FIXED** — AppSettings init: save wrapped in try-catch with fallback — `app-settings.service.ts`
- [x] **BE-M3** — **FIXED** (already) — `@IsEnum(OrderStatus)` present in DTO — `dto/update-order-status.dto.ts`
- [x] **BE-M4** — **FIXED** — Push notification: `notifyWithRetry` for critical calls — `orders.service.ts`
- [x] **BE-M5** — **FIXED** — Location decimal→number: `safeNumber()` guard on all lat/lng parsing — `orders.service.ts`
- [x] **MOB-M1** — **FIXED** — Silent API failures в confirm.tsx: toast on service load error, console.warn on non-critical
- [x] **MOB-M2** — **FIXED** — WebSocket cleanup: emit unsubscribe_order for each subscribed order on unmount — `two.tsx`
- [x] **MOB-M3** — **FIXED** — Urgent fee: clamped urgentFeePercent to 0-100 range — `confirm.tsx`
- [x] **MOB-M4** — **FIXED** — Navigation race condition: skip AsyncStorage re-read when onboardingDone is already true — `_layout.tsx`
- [x] **MOB-M5** — **FIXED** — Profile offline: fallback to cached stats via cacheGetStale on network failure — `profile.tsx`
- [x] **MED-M1** — **FIXED** — Earnings display mismatch: показывает до DONE — `order/[id].tsx`
- [x] **MED-M2** — **FIXED** (already by MED-H3) — Socket emit without connection check — `useMedicLocation.ts`
- [x] **MED-M3** — **FIXED** — Photo upload: raw fetch без timeout — `verification.tsx`
- [x] **MED-M4** — **FIXED** — Location permission revoked: нет retry — `useMedicLocation.ts`
- [x] **MED-M5** — **FIXED** — OSRM route timeout: бесконечный спиннер — `OrderInviteModal.tsx`
- [x] **MED-M6** — **FIXED** — Order fetch 401: router.back() при auth error — `useOrderStatus.ts`

### LOW (4 бага)
- [x] **MED-L1** — **FIXED** — Photo MIME type: `jpg` mapped to `image/jpeg` — `medic/app/(tabs)/profile.tsx`
- [x] **MED-L2** — **FIXED** (already) — Work zone PATCH: `saving`/`clearing` states + `disabled` already present — `medic/app/work-zone.tsx`
- [x] **MOB-L1** — **FIXED** — Phone re-validation: trim + length check before order creation — `mobile/app/order/confirm.tsx`
- [x] **ALL-L1** — **FIXED** — Sentry error tracking подключён к backend, mobile, medic

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
- [x] Backend: сущность `Review` двусторонняя (orderId, authorId, authorRole, targetId, targetRole, rating, comment) — `backend/src/reviews/entities/review.entity.ts`
- [x] Backend: `POST /reviews` — клиент или медик оставляет отзыв после DONE — `backend/src/reviews/reviews.controller.ts`
- [x] Backend: `GET /reviews/medic/:id` — отзывы медика — `backend/src/reviews/reviews.controller.ts`
- [x] Backend: автоматический пересчёт `averageRating` (`medics.rating`) у медика — `backend/src/reviews/reviews.service.ts`
- [ ] Web: экран оценки после завершения заказа (звёзды + комментарий)
- [x] Web: отображение рейтинга и отзывов в профиле медика — `/reviews/medic/[medicId]` + кнопка на странице заказа
**Новое (медик → клиент):**
- [x] Backend: `Review` поддерживает `authorRole` [client/medic], `targetRole` [medic/client] — двусторонние отзывы — `backend/src/reviews/entities/review.entity.ts`
- [x] Backend: `GET /reviews/client/:id` — отзывы о клиенте от медиков — `backend/src/reviews/reviews.controller.ts`
- [x] Backend: автоматический пересчёт `averageRating` у клиента (с try/catch — колонка может отсутствовать на Railway) — `backend/src/reviews/reviews.service.ts`
- [x] Backend: push/Telegram напоминание через 1 час если отзыв не оставлен — `backend/src/reviews/reviews.service.ts` (cron `*/15 * * * *`)
- [x] Mobile medic: экран оценки клиента после заказа (звёзды + комментарий + пропуск) — `medic/components/ClientRatingModal.tsx`, `medic/app/order/[id].tsx`, `medic/hooks/useOrderStatus.ts`
- [x] Web-medic: экран оценки клиента после заказа (звёзды + комментарий + пропуск) — `web-medic/app/order/[id]/page.tsx`
- [x] Web-medic/Mobile medic: медик видит рейтинг клиента при получении заказа (помогает решить — принять или нет)
- [x] Admin: страница всех отзывов с фильтрами (по медику, клиенту, рейтингу, дате)

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
- [x] Backend: поля у медика — `workZoneLat`, `workZoneLng`, `workZoneRadius` (в км, nullable)
- [x] Backend: при диспатче — если геозона задана, отправлять только заказы внутри круга (haversine фильтр в `selectBestMedic`)
- [x] Backend: `PATCH /medics/work-zone` — сохранить/обновить центр и радиус зоны
- [x] Backend: `DELETE /medics/work-zone` — убрать ограничение (принимать заказы отовсюду)
- [x] Mobile medic: экран с картой — медик ставит точку и слайдером выбирает радиус 0.5-50 км — `medic/app/work-zone.tsx`
- [x] Mobile medic: визуальное отображение зоны на карте (полупрозрачный круг) — `medic/app/work-zone.tsx`
- [x] Web-medic: экран с картой — медик ставит точку и слайдером выбирает радиус 0.5–50 км — `web-medic/app/work-zone/page.tsx`
- [x] Admin: на карте медиков отображать их геозоны — react-leaflet вкладка "Карта" с маркерами и Circle — `admin/src/pages/Medics.tsx`

### SEO-страницы на лендинге — Диёр
- [x] Страницы услуг: `/uslugi/ukol-na-domu`, `/uslugi/kapelnica-na-domu` — landing/app/[lang]/[service]/page.tsx
- [x] Страницы по районам: Чиланзар, Юнусабад, Мирзо-Улугбек, Яккасарай (ru+uz) — landing/app/[lang]/[service]/page.tsx
- [x] Meta-теги, Open Graph, JSON-LD разметка для Google — landing/app/[lang]/layout.tsx
- [x] Sitemap.xml + robots.txt — landing/app/sitemap.ts, landing/app/robots.ts

---

## 🚀 V1.1 — месяц 1–3 после запуска

### Push-напоминания по курсу лечения — Абубакир (backend)
- [x] Backend: сущность `TreatmentCourse` (clientId, название, количество процедур, интервал, следующая дата) — `backend/src/treatment-courses/`
- [x] Backend: cron-задача — отправка push за 2 часа до следующей процедуры — `treatment-courses.service.ts`
- [x] Mobile: экран «Мои курсы лечения» с расписанием — `mobile/app/courses.tsx`
- [x] Web: страница «Курсы лечения» `/courses` с inline-формой добавления, прогресс-баром и удалением — `web/app/courses/page.tsx`

### Реферальная программа — Абубакир (backend) + Диёр (web/mobile)
- [x] Backend: генерация реферального кода для каждого клиента — `auth.service.ts`
- [x] Backend: логика начисления бонусов — оба получают скидку на следующий заказ — `orders.service.ts`
- [x] Backend: `GET /referrals/my` — список приглашённых и бонусов — `backend/src/referrals/`
- [x] Mobile: экран «Пригласи друга» с кодом/ссылкой + шаринг — `mobile/app/referral.tsx`
- [x] Web: страница «Реферальная программа» с кодом, ссылкой, шарингом и статистикой — `web/app/referral/page.tsx`

### Персональный медик — Абубакир (backend) + Диёр (web/mobile)
- [x] Backend: таблица `favorite_medics` — `backend/src/favorites/`
- [x] Backend: при создании заказа — приоритет избранному медику — `backend/src/orders/dispatch.service.ts`
- [x] Mobile: кнопка «Закрепить медика» на track screen (DONE), экран «Мои медики» `/favorites` — `mobile/app/order/track.tsx`, `mobile/app/favorites.tsx`
- [x] Web: кнопка «Закрепить медика» на странице заказа (DONE), страница `/favorites`, ссылка в профиле — `web/app/orders/[id]/page.tsx`, `web/app/favorites/page.tsx`, `web/app/profile/page.tsx`

### Медкарта в приложении — Абубакир (backend) + Диёр (web/mobile)
- [x] Backend: сущность `MedicalCard` — `backend/src/medical-card/`
- [x] Backend: эндпоинты `GET /medical-card`, `PUT /medical-card`, `GET /medical-card/client/:clientId`
- [x] Mobile: экран «Моя медкарта» `/medical-card` — заполнение и просмотр — `mobile/app/medical-card.tsx`
- [x] Медик: просмотр медкарты клиента в деталях заказа — `medic/app/order/[id].tsx`
- [x] Web-medic: просмотр медкарты клиента в деталях заказа — `web-medic/app/order/[id]/page.tsx`

---

## ⚡ V2 — месяц 3–6 (COMPLETED 2026-03-31)

### Программа лояльности — DONE
- [x] Backend: LoyaltyTransaction entity, awardPoints с tier multipliers, spendPoints, getBalance, getHistory
- [x] Backend: endpoints GET /loyalty/my, GET /loyalty/history, POST /loyalty/redeem
- [x] Backend: автоначисление при DONE, milestone bonus каждые 5 заказов
- [x] Mobile: экран «Мои бонусы» с прогресс-баром, тирами, историей, redemption

### Семейные пакеты / подписки — DONE
- [x] Backend: SubscriptionTier + Subscription entities, purchase с pessimistic lock
- [x] Backend: endpoints GET /subscriptions/tiers, GET /subscriptions/my, POST /subscriptions/purchase, POST /subscriptions/cancel
- [x] Backend: auto-discount при создании заказа, cron expiry ежедневно 3 AM
- [x] Admin: CRUD тарифов + статистика
- [x] Mobile: экран подписок с покупкой, отменой, info на confirm screen

### NPS-опросы — DONE
- [x] Backend: cron `0 11 1 * *` — ежемесячная отправка NPS push активным клиентам
- [x] Backend: NpsSurvey entity, POST /nps/submit, GET /nps/check, GET /nps/admin/stats
- [x] Mobile: NPS экран (шкала 0–10 + комментарий + благодарность) + auto-check при запуске
- [ ] Admin: дашборд NPS с графиком по месяцам (Диёр)

### ИИ-агент + онлайн-консультация — DONE
- [x] Backend: AiAgentService (Claude Haiku), Doctor/Consultation/ChatMessage entities
- [x] Backend: POST /consultations/ai-chat, GET /consultations/doctors, POST /consultations, GET /consultations/my
- [x] Backend: Admin CRUD для врачей, complete/cancel консультаций, статистика
- [x] Mobile: AI Chat screen, Doctors list, Consultation booking, My Consultations
- [x] Backend: связка — врач назначает лечение -> автосоздание заказа на медсестру — **DONE** (Prescription entity)
- [ ] Backend: видео/чат консультация (Agora/WebRTC) — перенесено в V3

---

## 📌 Задачи Диёра (web / web-medic / admin / landing)

> Backend и mobile части уже готовы. Диёр делает web/admin UI.
> Анализ проведён 2026-04-02: сравнение mobile vs web, найдены все недостающие фичи.

### 🔴 Приоритет 1 — V1 до запуска

#### D-1. Web: экран оценки заказа
- [ ] Экран оценки после завершения заказа (звёзды + комментарий)
- API: `POST /reviews` (body: `{ orderId, rating, comment, targetRole: "medic" }`)
- API: `GET /reviews/order/:id` — проверить, оставлен ли отзыв
- Референс: `mobile/components/RatingModal.tsx`

#### D-2. Web: срочный вызов при создании заказа
- [ ] Переключатель «Срочный вызов» на странице создания заказа
- [ ] Отображение доплаты (urgentFee) в итоговой сумме
- API: `POST /orders` принимает `isUrgent: true`
- API: `GET /settings` — получить `urgentFeePercent`, `urgentStartHour`, `urgentEndHour`
- Референс: `mobile/app/order/confirm.tsx`

#### D-3. Web / Web-medic: глобальный error handler
- [ ] Перехват JS ошибок (window.onerror / ErrorBoundary)
- [ ] Перехват ошибок API (fetch wrapper)
- [ ] Отправка на `POST /client-errors` с полями: `message`, `stackTrace`, `screen`, `appType` (web/web-medic), `deviceInfo`, `appVersion`
- Референс: `mobile/components/ErrorBoundary.tsx`

#### D-4. Admin: страница «User Support»
- [ ] Таблица ошибок: пользователь, сообщение, экран, устройство, дата, статус
- [ ] Фильтры: по пользователю, дате, статусу (NEW / IN_PROGRESS / FIXED / IGNORED)
- [ ] Детальная карточка ошибки: полный стек, устройство, история заказов пользователя
- [ ] Счётчик новых ошибок в сайдбаре (бейдж)
- API: `GET /client-errors/admin` (query: userId, appType, status, dateFrom, dateTo, page, limit)
- API: `GET /client-errors/admin/stats` — счётчики по статусам
- API: `PATCH /client-errors/admin/:id` — смена статуса

#### D-5. Admin: геозоны медиков на карте
- [ ] На карте медиков отображать workZone круги (полупрозрачные)
- Данные: `workZoneLat`, `workZoneLng`, `workZoneRadius` из `GET /medics/admin/all`
- Референс: `medic/app/work-zone.tsx` (circle overlay)

### 🟠 Приоритет 2 — Фичи из mobile, отсутствующие в web


#### D-6. Web: Loyalty (бонусная программа)
- [x] Страница `/loyalty` — баланс очков, тир (BRONZE/SILVER/GOLD), прогресс-бар до следующего тира
- [x] История транзакций (EARNED/SPENT/BONUS/MILESTONE) с пагинацией
- [x] Redemption: списание баллов на скидку (preset кнопки + manual input)
- [x] Карточка loyalty в профиле с очками и тиром
- [ ] Info-блок на странице подтверждения заказа (доступная скидка)
- API: `GET /loyalty/my`, `GET /loyalty/history?page=&limit=`, `POST /loyalty/redeem` (body: `{ points }`)
- Референс: `mobile/app/loyalty.tsx`

#### D-7. Web: Subscriptions (подписки)
- [x] Страница `/subscriptions` — доступные тарифы (название, цена, период, макс заказов, % скидки)
- [x] Активная подписка: карточка с прогресс-баром (использовано/доступно заказов), дата окончания
- [x] Покупка подписки + отмена
- [ ] Info-блок на странице подтверждения заказа (% скидки от подписки)
- API: `GET /subscriptions/tiers`, `GET /subscriptions/my`, `POST /subscriptions/purchase` (body: `{ tierId }`), `POST /subscriptions/cancel`
- Референс: `mobile/app/subscriptions.tsx`

#### D-8. Web: AI Chat (чат с ИИ-ассистентом)
- [x] Страница `/ai-chat` — чат-интерфейс с AI медицинским ассистентом
- [x] Сообщения user/assistant, индикатор набора текста
- [x] Карточка рекомендации (специализация + кнопка "Найти врача")
- API: `POST /consultations/ai-chat` (body: `{ messages: [{ role, content }] }`)
- Референс: `mobile/app/ai-chat.tsx`

#### D-9. Web: Doctors (список врачей)
- [x] Страница `/doctors` — список врачей с фильтром по специализации
- [x] Карточка врача: фото, имя, специализация, рейтинг, цена, кол-во консультаций
- [x] Кнопка "Записаться" → переход на бронирование
- API: `GET /consultations/doctors?specialization=`, `GET /consultations/doctors/:id`
- Референс: `mobile/app/doctors.tsx`

#### D-10. Web: Consultation (бронирование + история)
- [x] Страница `/consultation` — бронирование консультации (doctor info, symptoms, price, confirm)
- [x] Страница `/consultations` — история моих консультаций с пагинацией и статусами (PENDING/ACTIVE/COMPLETED/CANCELED)
- [x] Детали консультации: doctor notes модал
- API: `POST /consultations` (body: `{ doctorId, symptoms, suggestedSpecialization }`), `GET /consultations/my?page=&limit=`, `GET /consultations/:id`
- Референс: `mobile/app/consultation.tsx`, `mobile/app/consultations.tsx`

#### ~~D-11. Web: Prescriptions (назначения врача)~~ ✅ DONE

#### ~~D-12. Web: NPS (опрос удовлетворённости)~~ ✅ DONE

### 🟡 Приоритет 3 — Admin панель

#### ~~D-13. Admin: NPS дашборд~~ ✅ DONE

#### D-14. Admin: управление назначениями (prescriptions)
- [ ] На странице завершения консультации: dropdown выбора услуги (serviceId)
- [ ] Отображение созданных назначений в деталях консультации
- API: `PATCH /consultations/admin/:id/complete` (body: `{ doctorNotes, createOrderServiceId }`)
- API: `GET /services` — список услуг для dropdown

#### D-15. Admin: аналитика (графики)
- [ ] Дашборд: графики заказов по дням/неделям, выручка, топ медики
- [ ] Метрики: средний чек, время выполнения, конверсия
- Данные: `GET /orders/admin/all` + агрегация на фронте или новый endpoint

### 🔵 Приоритет 4 — SEO лендинг

#### D-16. Landing: SEO-страницы
- [x] Страницы услуг: `/uslugi/ukol-na-domu`, `/uslugi/kapelnica-na-domu` — landing/app/[lang]/[service]/page.tsx
- [x] Страницы по районам: Чиланзар, Юнусабад, Мирзо-Улугбек, Яккасарай (ru+uz) — landing/app/[lang]/[service]/page.tsx
- [x] Meta-теги, Open Graph, JSON-LD разметка для Google — landing/app/[lang]/layout.tsx
- [x] Sitemap.xml + robots.txt — landing/app/sitemap.ts, landing/app/robots.ts

### 📊 Матрица: mobile vs web (результат анализа 2026-04-02)

| Фича | Mobile | Web | Задача |
|------|--------|-----|--------|
| Каталог услуг | ✅ | ✅ | — |
| Создание заказа + карта | ✅ | ✅ | — |
| Трекинг заказа + WS | ✅ | ✅ | — |
| История заказов | ✅ | ✅ | — |
| Профиль | ✅ | ✅ | — |
| Медкарта | ✅ | ✅ | — |
| Курсы лечения | ✅ | ✅ | — |
| Реферальная программа | ✅ | ✅ | — |
| Избранные медики | ✅ | ✅ | — |
| Отзывы медиков | ✅ | ✅ | — |
| Оценка после DONE | ✅ | ❌ | D-1 |
| Срочный вызов | ✅ | ❌ | D-2 |
| Error handler | ✅ | ❌ | D-3 |
| **Loyalty (бонусы)** | ✅ | ❌ | **D-6** |
| **Subscriptions** | ✅ | ❌ | **D-7** |
| **AI Chat** | ✅ | ❌ | **D-8** |
| **Doctors list** | ✅ | ❌ | **D-9** |
| **Consultations** | ✅ | ❌ | **D-10** |
| **Prescriptions** | ✅ | ❌ | **D-11** |
| **NPS survey** | ✅ | ❌ | **D-12** |

---

## ⚡ V3 — roadmap (Абубакир — backend)

- [x] Видео/чат консультация с врачом — **DONE** (LiveKit: VideoService + video-call screen + endpoints)
- [x] Связка: врач назначает лечение -> автоматическое создание заказа на медсестру — **DONE** (Prescription entity + endpoints + mobile UI)
- [x] NPS-опросы: cron + дашборд в admin — **DONE** (NpsSurvey entity + cron monthly + mobile UI + admin stats)

## 💡 Идеи / V3+ (существующие)

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

## 💡 Новые идеи (добавлены 2026-04-02)

### Рост и удержание
- [ ] **Промо-коды** — admin создаёт код → клиент вводит при заказе → скидка. Entity PromoCode (code, discount%, maxUses, expiresAt). Позволяет маркетинговые кампании вне реферальной программы
- [ ] **Расписание медика** — медик указывает рабочие часы (Пн 09–18, Сб 10–14). Dispatch отправляет только в рабочее время. Уменьшает отклонения заказов
- [ ] **Push-сегментация** — admin отправляет push по сегментам (новые клиенты, неактивные 30+ дней, тир GOLD). Endpoint `POST /admin/push-campaign` + UI в admin
- [ ] **Фото до/после процедуры** — медик загружает фото в заказе (Cloudinary). Клиент видит в истории. Повышает доверие

### UX и удобство
- [ ] **Чат клиент ↔ медик** — real-time текстовый чат внутри заказа через Socket.IO. ChatMessage entity привязана к orderId. Заменяет звонки для простых вопросов ("через сколько будете?")
- [ ] **Повторный заказ** — кнопка "Заказать снова" в истории: копирует serviceId + location из прошлого заказа → сразу на confirm. Экономит время для курсовых процедур
- [ ] **Мульти-услуга в одном заказе** — клиент выбирает несколько услуг (укол + капельница). Order содержит массив serviceIds, цена суммируется. Снижает кол-во отдельных визитов
- [ ] **Оценка времени прибытия** — при ACCEPTED/ON_THE_WAY показывать ETA на основе OSRM route. Медик видит расстояние, клиент видит "~15 мин"
- [ ] **Уведомления в Telegram для клиентов** — аналогично медикам: клиент привязывает Telegram → получает статусы заказа в чат-боте

### Безопасность и инфраструктура
- [ ] **Rate limiting по IP** — текущий throttle привязан к route, добавить per-IP лимит на login/register (защита от брутфорса с разных аккаунтов)
- [ ] **Аудит-лог действий admin** — Entity AdminAuditLog (adminId, action, targetId, timestamp). Записывать: блокировки, верификации, отмены заказов, изменения настроек
- [ ] **Soft-delete для заказов** — вместо физического удаления данных, `deletedAt` timestamp. Для compliance и разбора споров
- [ ] **Healthcheck расширенный** — `GET /health/detailed` для мониторинга: DB connection, Redis (если будет), Cloudinary, Telegram bot, Expo push. Для Grafana/alerting

### Масштабирование
- [ ] **Redis кэш** — заменить in-memory кэш (AppSettings 30s TTL) на Redis. Нужен при горизонтальном масштабировании (несколько инстансов на Railway)
- [ ] **Очередь задач (BullMQ)** — перенести fire-and-forget операции (push, email, Telegram) в очередь. Устойчивость к сбоям, retry, мониторинг
- [ ] **Файловое хранилище CDN** — вместо Cloudinary для документов медика использовать S3-совместимое хранилище (дешевле для объёма)

---

## 📋 Документация (правило)

> После каждого выполненного этапа — обновить `done.md` с датой, описанием, файлами.
> Backend-изменения → обновить `docs/BACKEND_API.md`.
