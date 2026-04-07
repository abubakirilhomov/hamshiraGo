# HamshiraGo — Активные задачи

> Обновляется при каждом изменении. Выполненные задачи → `done.md`.
> **Этапы 1–18 выполнены** — подробности в `done.md`.
> **Полный аудит проведён 2026-03-28** — backend (41), mobile (25), medic (26).
> **Аудит багов 2026-04-04** — mobile (28 issues), admin (40+ issues).

---

## 🔴 CRITICAL — Аудит 2026-04-04 (Mobile)

> Паттерн `apiFetch(url, token, options)` — неверная сигнатура. Правильно: `apiFetch(url, { token, method, body })`.
> Затронуты: prescription.tsx, prescriptions.tsx, nps.tsx, video-call.tsx — **экраны не работают**.

- [x] **MOB-BUG-1** — CRITICAL — `prescription.tsx:57` — apiFetch вызывается с 3 аргументами → запрос без auth, `res.json()` крашит (apiFetch возвращает parsed data, не Response)
- [x] **MOB-BUG-2** — CRITICAL — `prescription.tsx:100,144` — confirm и cancel тоже с 3 аргументами → не работают
- [x] **MOB-BUG-3** — CRITICAL — `prescriptions.tsx:52` — список назначений: тот же баг с apiFetch → экран крашит
- [x] **MOB-BUG-4** — CRITICAL — `nps.tsx:44` — отправка NPS: 3 аргумента + `res.ok` на parsed data → не работает
- [x] **MOB-BUG-5** — CRITICAL — `video-call.tsx:54` — early return до hooks → нарушение Rules of Hooks, React crash
- [x] **MOB-BUG-6** — HIGH — `video-call.tsx:77,105` — apiFetch с 3 аргументами → звонки не работают
- [x] **MOB-BUG-7** — HIGH — `order/confirm.tsx:158` — promoId не отправляется на backend → промо не отслеживается
- [x] **MOB-BUG-8** — HIGH — `profile.tsx:139` — после save name user object в AuthContext не обновляется → старое имя до рестарта
- [x] **MOB-BUG-9** — MEDIUM — `order/chat.tsx:79` — текст сообщения очищается до подтверждения отправки → потеря при ошибке
- [x] **MOB-BUG-10** — MEDIUM — `order/confirm.tsx:109` — subscription discount отображается но не применяется к finalPrice
- [x] **MOB-BUG-11** — MEDIUM — `order/confirm.tsx:264` — TextInput не импортирован → crash при открытии промо-кода
- [x] **MOB-BUG-12** — MEDIUM — `order/confirm.tsx:267` — ввод в промо поле сбрасывает уже применённую скидку
- [x] **MOB-BUG-13** — MEDIUM — `video-call.tsx:151` — mic/cam toggle меняет иконку но не мутит реально (не wired к LiveKit)
- [x] **MOB-BUG-14** — MEDIUM — `consultations.tsx:178` — кнопка "Позвонить" видна для PENDING (врач ещё не принял)
- [x] **MOB-BUG-15** — MEDIUM — `_layout.tsx:160` — NPS check гонится с auth redirect → navigation glitch

## ✅ Аудит 2026-04-04 (Admin) — ВСЁ ИСПРАВЛЕНО 2026-04-05

- [x] **ADM-BUG-1** — FIXED — revenue грузится один раз при монтировании (`loadRevenue`), не каждые 30с
- [x] **ADM-BUG-2** — FIXED — timezone fix (`toLocaleDateString("sv")`), лейбл "В процессе сейчас"
- [x] **ADM-BUG-3** — FIXED — поиск грузит до 1000 заказов (10 страниц × 100) параллельно
- [x] **ADM-BUG-4** — FIXED — Analytics грузит только 90 дней, останавливается по cutoff
- [x] **ADM-BUG-5** — FIXED — Reports грузит только DONE заказы начиная с даты `from`
- [x] **ADM-BUG-6** — FIXED — Medics грузит все страницы параллельно
- [x] **ADM-BUG-7** — FIXED — `isMounted` ref предотвращает двойную загрузку
- [x] **ADM-BUG-8** — FIXED — `min={0}` + `Math.max(0, ...)` на price input
- [x] **ADM-BUG-9** — FIXED — `(clientId ?? "").slice(0, 8)` в двух местах
- [x] **ADM-BUG-10** — FIXED — `alert()` заменён на `toast.error()`
- [x] **ADM-BUG-11** — FIXED — `onValueCommit` вместо `onValueChange` — запрос только при отпускании
- [x] **ADM-BUG-12** — FIXED — поиск грузит до 500 ошибок (5 страниц × 100)
- [x] **ADM-BUG-13** — FIXED — base64url → base64 конвертация перед `atob`
- [x] **ADM-BUG-14** — FIXED — custom event `admin:unauthorized` + `useNavigate` в AdminLayout

## 🟡 Medic app — не хватает (Абубакир — mobile)

- [x] **MED-MISS-1** — Нет inline edit name в профиле (в отличие от mobile)
- [x] **MED-MISS-2** — Нет чата в заказе (medic side) — клиент пишет, медик не видит

---

## 📋 Задачи

- [x] **ADM-AI-1** — AI Ассистент страница (чат + сводка проблем) — `admin/src/pages/AiChat.tsx`

### MVP V0.1 Gap Closures — DONE 2026-04-05

- [x] **GAP-1** — X-Request-Id middleware — `backend/src/common/middleware/request-id.middleware.ts`, `app.module.ts`, `main.ts`
- [x] **GAP-2** — WebSocket event logging (subscribe/unsubscribe/dispatch/location) — `backend/src/realtime/order-events.gateway.ts`
- [x] **GAP-3** — Telegram bot interactive commands (inline buttons, callback queries, client notifications) — `backend/src/telegram/`, `backend/src/orders/dispatch.service.ts`, `backend/src/orders/orders.service.ts`, `backend/src/users/`, `backend/src/medics/medics.service.ts`
- [x] **GAP-4** — Docker Compose + Backend Dockerfile — `docker-compose.yml`, `backend/Dockerfile`
- [x] **GAP-5** — AI Analytics module (Claude AI chat, feedback summary, top issues) — `backend/src/analytics/`, `admin/src/pages/AiChat.tsx`
- [x] **GAP-6** — Nearby medics map screen — `mobile/app/nearby-medics.tsx`, `mobile/app/(tabs)/index.tsx`

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
- [x] Web: экран оценки после завершения заказа (звёзды + комментарий) — D-1 DONE
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
- [x] Web: переключатель «Срочный вызов» при создании заказа с отображением доплаты — D-2 DONE

### Система трекинга ошибок пользователей (User Support / Error Tracking) — Абубакир (backend) + Диёр (admin/web/mobile)
- [x] Backend: расширена сущность `ClientError` — добавлены `status`, `deviceInfo`, `appVersion`, `errorCode`, `count`, `resolvedAt`
- [x] Backend: `POST /client-errors` — уже существовал; теперь поддерживает новые поля + авто-группировку по errorCode
- [x] Backend: `GET /client-errors/admin` — список с фильтрами (userId, appType, status, dateFrom, dateTo, pagination)
- [x] Backend: `PATCH /client-errors/admin/:id` — изменение статуса (NEW → IN_PROGRESS → FIXED → IGNORED)
- [x] Backend: `GET /client-errors/admin/stats` — счётчики по статусам
- [x] Backend: автоматическая группировка одинаковых ошибок (по errorCode + appType, окно 24 ч)
- [x] Mobile: глобальный error boundary — перехватывает все падения и отправляет на backend с userId, экраном, устройством
- [x] Web/Web-medic: глобальный error handler — D-3 DONE — `web/app/error.tsx`, `web/app/global-error.tsx`
- [x] Admin: новая страница «User Support» — D-4 DONE — `admin/src/pages/UserSupport.tsx`
- [x] Admin: фильтры — по пользователю, по дате, по статусу — D-4 DONE
- [x] Admin: детальная карточка ошибки — D-4 DONE
- [x] Admin: счётчик новых ошибок в сайдбаре (бейдж) — D-4 DONE

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
- [x] Admin: дашборд NPS с графиком по месяцам (Диёр) — D-13 DONE — `admin/src/pages/Nps.tsx`

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
> Анализ mobile vs web обновлён 2026-04-04.
> Анализ admin панели проведён 2026-04-04.

### 🔴 Приоритет 1 — V1 до запуска

#### ~~D-1. Web: экран оценки заказа~~ ✅ DONE
- Звёзды + комментарий в `web/app/orders/[id]/page.tsx` — `api.orders.rate()`

#### ~~D-2. Web: срочный вызов при создании заказа~~ ✅ DONE
- Переключатель isUrgent + urgentFee в `web/app/order/confirm/page.tsx`

#### ~~D-3. Web / Web-medic: глобальный error handler~~ ✅ DONE
- `web/app/error.tsx` + `global-error.tsx` — `reportClientError()` → POST /client-errors

#### ~~D-4. Admin: страница «User Support»~~ ✅ DONE
- `admin/src/pages/UserSupport.tsx` — таблица, фильтры, детали, бейдж в сайдбаре

#### ~~D-5. Admin: геозоны медиков на карте~~ ✅ DONE
- `admin/src/pages/Medics.tsx` — workZoneRadius Circle overlay на карте

### 🟠 Приоритет 2 — Фичи из mobile, отсутствующие в web


#### D-6. Web: Loyalty (бонусная программа)
- [x] Страница `/loyalty` — баланс очков, тир (BRONZE/SILVER/GOLD), прогресс-бар до следующего тира
- [x] История транзакций (EARNED/SPENT/BONUS/MILESTONE) с пагинацией
- [x] Redemption: списание баллов на скидку (preset кнопки + manual input)
- [x] Карточка loyalty в профиле с очками и тиром
- [x] Info-блок на странице подтверждения заказа (доступная скидка)
- API: `GET /loyalty/my`, `GET /loyalty/history?page=&limit=`, `POST /loyalty/redeem` (body: `{ points }`)
- Референс: `mobile/app/loyalty.tsx`

#### D-7. Web: Subscriptions (подписки)
- [x] Страница `/subscriptions` — доступные тарифы (название, цена, период, макс заказов, % скидки)
- [x] Активная подписка: карточка с прогресс-баром (использовано/доступно заказов), дата окончания
- [x] Покупка подписки + отмена
- [x] Info-блок на странице подтверждения заказа (% скидки от подписки)
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

#### ~~D-14. Admin: управление назначениями (prescriptions)~~ ✅ DONE

#### ~~D-15. Admin: аналитика (графики)~~ ✅ DONE

### 🔵 Приоритет 4 — SEO лендинг

#### D-16. Landing: SEO-страницы
- [x] Страницы услуг: `/uslugi/ukol-na-domu`, `/uslugi/kapelnica-na-domu` — landing/app/[lang]/[service]/page.tsx
- [x] Страницы по районам: Чиланзар, Юнусабад, Мирзо-Улугбек, Яккасарай (ru+uz) — landing/app/[lang]/[service]/page.tsx
- [x] Meta-теги, Open Graph, JSON-LD разметка для Google — landing/app/[lang]/layout.tsx
- [x] Sitemap.xml + robots.txt — landing/app/sitemap.ts, landing/app/robots.ts

### 📊 Матрица: mobile vs web (обновлено 2026-04-04)

#### Web client (web/) vs Mobile (mobile/)

| Фича | Mobile | Web | Статус |
|------|--------|-----|--------|
| Каталог услуг | ✅ | ✅ | Паритет |
| Создание заказа + карта | ✅ | ✅ | Паритет |
| Срочный вызов | ✅ | ✅ | Паритет |
| Трекинг заказа + WS | ✅ | ✅ | Паритет |
| История заказов + reorder | ✅ | ✅ | Паритет |
| Оценка после DONE | ✅ | ✅ | Паритет |
| Профиль + edit name | ✅ | ✅ | Паритет |
| Медкарта | ✅ | ✅ | Паритет |
| Курсы лечения | ✅ | ✅ | Паритет |
| Реферальная программа | ✅ | ✅ | Паритет |
| Избранные медики | ✅ | ✅ | Паритет |
| Loyalty (бонусы) | ✅ | ✅ | Паритет |
| Subscriptions | ✅ | ✅ | Паритет |
| AI Chat | ✅ | ✅ | Паритет |
| Doctors list | ✅ | ✅ | Паритет |
| Consultations | ✅ | ✅ | Паритет |
| Prescriptions | ✅ | ✅ | Паритет |
| NPS survey | ✅ | ✅ | Паритет |
| Video call | ✅ | ✅ | Паритет |
| Error handler | ✅ | ✅ | Паритет |
| Чат в заказе | ✅ | ✅ | D-17 DONE |
| Промо-коды | ✅ | ✅ | D-18 DONE |

#### Web-medic (web-medic/) vs Mobile medic (medic/)

| Фича | Mobile | Web-Medic | Статус |
|------|--------|-----------|--------|
| Auth + profile | ✅ | ✅ | Паритет |
| Online/offline toggle | ✅ | ✅ | Паритет |
| Заказы + трекинг | ✅ | ✅ | Паритет |
| Work zone | ✅ | ✅ | Паритет |
| Reviews | ✅ | ✅ | Паритет |
| Photo upload | ✅ | ✅ | Паритет |
| Wallet | ✅ | ✅ | Паритет |
| Редактирование имени | ✅ | ✅ | D-19 DONE |
| Чат в заказе (медик) | ✅ | ✅ | D-20 DONE |
| Экран верификации | ✅ | ✅ | D-21 DONE |
| Статистика заказов | ✅ | ✅ | D-22 DONE |

### 🔴 Новые задачи Диёра (web догоняет mobile)

#### ~~D-17. Web: чат в заказе (client ↔ medic)~~ ✅ DONE
- Slide-up панель + Socket.IO `order_message` + история — `web/app/orders/[id]/page.tsx`

#### ~~D-18. Web: промо-коды на странице подтверждения заказа~~ ✅ DONE
- Поле + кнопка "Применить" + зелёная/красная рамка + строка в итоге — `web/app/order/confirm/page.tsx`

#### ~~D-19. Web-medic: редактирование имени в профиле~~ ✅ DONE
- Inline input в хедере + PATCH /medics/profile + обновление localStorage — `web-medic/app/profile/page.tsx`

#### ~~D-20. Web-medic: чат в заказе (medic side)~~ ✅ DONE
- Slide-up панель + Socket.IO `order_message` + medic-messages endpoint — `web-medic/app/order/[id]/page.tsx`

#### ~~D-21. Web-medic: экран верификации~~ ✅ DONE
- Страница `/verification` + статус карточка + загрузка фото — `web-medic/app/verification/page.tsx`

#### ~~D-22. Web-medic: статистика заказов~~ ✅ DONE
- "Выполнено" 4-я колонка в стат-блоке профиля — `web-medic/app/profile/page.tsx`

### 🟣 Admin панель — недостающие фичи (анализ 2026-04-04)

> Admin: 15 страниц, shadcn/ui + Recharts. Уже есть: Dashboard, Verification, Medics (с картой),
> Clients, Orders (WS real-time), Services CRUD, Reports (CSV), Analytics, User Support (badges),
> Reviews, Consultations (complete/cancel), NPS, Settings.
> **Не хватает 4 страницы**, backend endpoints готовы.

#### ~~D-23. Admin: Промо-коды~~ ✅ DONE
- Страница `/promo-codes`, таблица, фильтр активные/все, создание + деактивация — `admin/src/pages/PromoCodes.tsx`

#### ~~D-24. Admin: Управление тарифами подписок~~ ✅ DONE
- Страница `/subscription-tiers`, CRUD через диалог, статистика, toggle isActive — `admin/src/pages/SubscriptionTiers.tsx`

#### ~~D-25. Admin: CRUD врачей (Doctors)~~ ✅ DONE
- Страница `/doctors`, таблица с фото/рейтингом, CRUD диалог, toggle isActive — `admin/src/pages/Doctors.tsx`

#### ~~D-26. Admin: Аудит-лог~~ ✅ DONE
- Страница `/audit-log`, пагинация, фильтр по action, expandable row с JSON деталями — `admin/src/pages/AuditLog.tsx`

### 📊 Admin: текущее покрытие (15 страниц)

| Страница | Статус | Описание |
|----------|--------|----------|
| Dashboard | ✅ | KPI, тренды, auto-refresh 30s |
| Verification | ✅ | Очередь верификации медиков |
| Medics | ✅ | Таблица + карта с геозонами |
| Clients | ✅ | Таблица + block/unblock |
| Orders | ✅ | Таблица + WS real-time + cancel |
| Services | ✅ | CRUD услуг |
| Reports | ✅ | График + CSV export |
| Analytics | ✅ | Недельные тренды + utilization |
| User Support | ✅ | Ошибки + badge в sidebar |
| Reviews | ✅ | Отзывы по медику |
| Consultations | ✅ | Complete/cancel + service selector |
| NPS | ✅ | Score gauge + monthly trend |
| Settings | ✅ | Commission, urgent fee, paid mode |
| Промо-коды | ✅ | D-23 DONE |
| Тарифы подписок | ✅ | D-24 DONE |
| Врачи (CRUD) | ✅ | D-25 DONE |
| Аудит-лог | ✅ | D-26 DONE |

---

## ⚡ V3 — roadmap (Абубакир — backend) — ВСЁ ВЫПОЛНЕНО

- [x] Видео/чат консультация — LiveKit (VideoService + video-call screen + endpoints)
- [x] Связка врач → автозаказ — Prescription entity + endpoints + mobile UI
- [x] NPS-опросы — cron monthly + mobile + admin stats
- [x] Чат клиент ↔ медик — Socket.IO + ChatMessage.orderId + mobile UI
- [x] Повторный заказ — POST /orders/:id/reorder + mobile кнопка
- [x] Редактирование профиля — PATCH /auth/profile + /medics/profile + mobile UI
- [x] Token refresh — POST /auth/refresh
- [x] Промо-коды — PromoCode entity + CRUD + validate + mobile UI
- [x] Аудит-лог admin — AdminAuditLog entity + GET /admin/audit-log
- [x] Healthcheck расширенный — GET /health/detailed (DB, Cloudinary, Expo Push)
- [x] Sentry error tracking — backend + mobile + medic
- [x] Playwright тесты — API (10 specs) + Web UI (7 specs)
- [x] Maestro тесты — mobile (5 flows) + medic (3 flows)

## 💡 V4 — идеи для будущего развития

### Рост и удержание
- [ ] **Расписание медика** — медик указывает рабочие часы (Пн 09–18, Сб 10–14). Dispatch отправляет только в рабочее время. Уменьшает отклонения заказов. **Реализация:** Entity `MedicSchedule` с массивом `{ dayOfWeek, startHour, endHour }`. В `selectBestMedic` — фильтр по текущему дню/часу. UI в medic app: выбор дней + range slider для часов. Оценка: ~4 часа backend + ~3 часа mobile
- [ ] **Push-сегментация** — admin отправляет push по сегментам (новые клиенты, неактивные 30+ дней, тир GOLD). **Реализация:** Endpoint `POST /admin/push-campaign` с body `{ segment, title, body }`. Segments: `new_7d` (регистрация <7 дней), `inactive_30d` (нет заказов 30+ дней), `tier_gold`, `all`. SQL query фильтрует users, шлёт push батчами по 100. Admin UI: форма с dropdown сегмента + textarea. Оценка: ~3 часа backend + ~2 часа admin
- [ ] **Фото до/после процедуры** — медик загружает фото в заказе (Cloudinary). **Реализация:** Поля `beforePhotoUrl`, `afterPhotoUrl` в Order entity. Endpoint `POST /orders/:id/photo` (multipart, field: before/after). Медик загружает с камеры в деталях заказа. Клиент видит в истории заказа. Повышает доверие и прозрачность. Оценка: ~2 часа backend + ~3 часа mobile
- [ ] **Уведомления в Telegram для клиентов** — аналогично медикам. **Реализация:** Добавить `telegramChatId` в User entity. Telegram bot обрабатывает `/start` от клиентов (по аналогии с медиками). В `notifyClient()` — отправка в Telegram если chatId есть. Клиент привязывает через deep link в профиле. Оценка: ~2 часа backend + ~1 час mobile

### UX и удобство
- [ ] **Мульти-услуга в одном заказе** — клиент выбирает несколько услуг (укол + капельница). **Реализация:** Поле `serviceIds` (jsonb массив) в Order вместо/наряду с `serviceId`. UI: checkbox на каталоге, корзина внизу, суммарная цена. Backend: validate все serviceIds, суммировать цены. Сложность средняя — нужно менять flow создания заказа. Оценка: ~6 часов backend + ~4 часа mobile
- [ ] **ETA (оценка времени прибытия)** — при ACCEPTED/ON_THE_WAY показывать "~15 мин". **Реализация:** Уже есть OSRM интеграция для route. Добавить `duration` парсинг из OSRM response (поле `routes[0].duration` в секундах). Показать на track screen: "Медик будет через ~{min} мин". Обновлять при каждом `medic_location` event. Оценка: ~2 часа
- [ ] **`/orders/stats` endpoint** — подсчёт заказов без загрузки данных. **Реализация:** `GET /orders/stats` → `{ total, active, completed, canceled }`. Один SQL `SELECT status, COUNT(*) GROUP BY status WHERE clientId = :id`. Используется на profile screen вместо `GET /orders?limit=1` hack. Оценка: ~30 мин

### Безопасность
- [ ] **Rate limiting по IP** — текущий throttle привязан к route, не к IP. **Реализация:** Добавить кастомный ThrottlerGuard с `getTracker()` → `req.ip`. Или использовать `@nestjs/throttler` с `generateKey: (req) => req.ip`. Применить к `/auth/login`, `/auth/register`, `/medics/login`. Защита от distributed brute-force. Оценка: ~1 час
- [ ] **Soft-delete для заказов** — `deletedAt` timestamp вместо физического удаления. **Реализация:** Добавить `@DeleteDateColumn()` в Order entity. TypeORM автоматически фильтрует `deletedAt IS NULL`. Admin может "удалить" заказ, но данные остаются для compliance. Оценка: ~30 мин
- [ ] **Certificate pinning** — защита от MITM на mobile. **Реализация:** `expo-certificate-pinning` или кастомный fetch adapter с проверкой SSL fingerprint. Pinning к Railway SSL certificate. Обновлять при ротации сертификата. Оценка: ~2 часа
- [ ] **httpOnly cookies** — заменить JWT в localStorage (web) на httpOnly cookies. **Реализация:** Backend: `res.cookie('token', jwt, { httpOnly: true, secure: true, sameSite: 'strict' })`. Frontend: убрать `localStorage.setItem('token')`, использовать `credentials: 'include'` в fetch. CORS: `credentials: true`. Это защитит от XSS-кражи токенов в web-приложениях. Оценка: ~3 часа backend + ~2 часа web

### Масштабирование (при росте >1000 заказов/день)
- [ ] **Redis кэш** — заменить in-memory кэш (AppSettings 30s TTL) на Redis. **Зачем:** Сейчас каждый инстанс backend хранит свой кэш. При горизонтальном масштабировании (2+ pods на Railway) — кэш рассинхронизирован. Redis = единый кэш для всех инстансов. **Реализация:** `@nestjs/cache-manager` + `cache-manager-redis-store`. Подключить Redis addon на Railway ($5/мес). Кэшировать: AppSettings, services list, doctor list. Оценка: ~2 часа
- [ ] **BullMQ очередь задач** — перенести fire-and-forget операции в очередь. **Зачем:** Сейчас push, Telegram, email отправляются в `.catch()` — если сервер падает во время отправки, сообщение теряется. BullMQ: retry, delay, dead-letter queue, мониторинг через Bull Board. **Реализация:** `@nestjs/bullmq` + Redis. Queues: `push-notifications`, `telegram-messages`, `email`. Оценка: ~4 часа
- [ ] **Payments ledger** — отдельная таблица для финансовой прозрачности. **Зачем:** Сейчас earnings считаются на лету из orders. Для бухгалтерии нужен аудит-трейл: кто, когда, сколько получил/заплатил. **Реализация:** Entity `PaymentLedger` (orderId, medicId, amount, type: EARNING/COMMISSION/REFUND, createdAt). Записывать при DONE. Admin endpoint: `GET /admin/ledger` с фильтрами. Оценка: ~3 часа
- [ ] **S3-совместимое хранилище** — вместо Cloudinary для объёмных файлов. **Зачем:** Cloudinary бесплатный tier = 25 credits/мес. При росте медиков (фото лицензий, профили) может не хватить. **Реализация:** MinIO на Railway или Backblaze B2 ($0.005/GB). Медиа-документы → S3, фото профилей → Cloudinary. Оценка: ~3 часа

---

## 🎙️ V5 — Голосовой AI Ассистент (новая бизнес-модель)

> **Бизнес-логика:** AI Агент (голос) → Врач (видеозвонок + рецепт) → Медсестра (выезд на дом)
> Клиент может пропустить шаг 1–2 и сразу вызвать медсестру если уже есть назначение.
> Анализ проведён 2026-04-06.

### Стек
- **STT (речь → текст):** Groq Whisper API (бесплатно, лимит 28 800 сек/день) или OpenAI Whisper API ($0.006/мин)
- **LLM (мозг):** Claude Haiku через Anthropic API (уже используется в проекте)
- **TTS (текст → голос):** OpenAI TTS `alloy` голос для RU ($15/1M символов) или Groq TTS (бесплатно в лимитах)
- **UZ голос:** ElevenLabs Voice Clone — записать диктора ~60 мин → обучить модель (~$22/мес)

---

### 📌 Фаза 1 — Backend: Voice Agent API (Абубакир)

#### VA-BE-1. Новый модуль `voice-agent/`
- [ ] Создать `backend/src/voice-agent/voice-agent.module.ts`
- [ ] Создать `VoiceSession` entity — `sessionId`, `clientId`, `messages` (jsonb), `status` (ACTIVE/COMPLETED), `recommendation` (DOCTOR/NURSE/NONE), `createdAt`, `updatedAt`
- [ ] Migration: таблица `voice_sessions`
- [ ] Файлы: `voice-agent.entity.ts`, `voice-agent.service.ts`, `voice-agent.controller.ts`

#### VA-BE-2. STT endpoint — транскрипция голоса
- [ ] `POST /voice-agent/transcribe` — принимает аудио файл (multipart, форматы: webm, mp4, m4a, wav)
- [ ] Отправляет в Groq Whisper API (`https://api.groq.com/openai/v1/audio/transcriptions`)
- [ ] Параметры: `model: "whisper-large-v3"`, `language: "ru"` или `"uz"` (из query `?lang=ru`)
- [ ] Возвращает `{ text: string, language: string, duration: number }`
- [ ] Fallback: если Groq недоступен → OpenAI Whisper API
- [ ] `GROQ_API_KEY` в `.env` и Railway environment variables

#### VA-BE-3. AI диалог с медицинским контекстом
- [ ] `POST /voice-agent/chat` — body: `{ sessionId?, message: string, lang: "ru" | "uz" }`
- [ ] Системный промпт: медицинский ассистент HamshiraGo, цель — выяснить симптомы и порекомендовать услугу
- [ ] Промпт включает: список доступных услуг из AppSettings, правила (не ставить диагноз, рекомендовать врача при серьёзных симптомах)
- [ ] Поддержка истории диалога (сохранять в `VoiceSession.messages`)
- [ ] После 3–5 обменов — принять решение: `recommendation: DOCTOR | NURSE | NONE`
- [ ] Возвращает `{ sessionId, reply: string, recommendation?, suggestedSpecialization?, sessionComplete: boolean }`

#### VA-BE-4. TTS endpoint — озвучка ответа
- [ ] `POST /voice-agent/synthesize` — body: `{ text: string, lang: "ru" | "uz", voice?: string }`
- [ ] RU: OpenAI TTS API (`model: "tts-1"`, `voice: "alloy"`) или Groq TTS
- [ ] UZ: ElevenLabs API с кастомным voice_id (настраивается через `ELEVENLABS_VOICE_ID_UZ` в `.env`)
- [ ] Возвращает audio stream (Content-Type: `audio/mpeg`)
- [ ] Кэшировать частые фразы (приветствие, прощание) в Cloudinary или локально

#### VA-BE-5. Session management
- [ ] `GET /voice-agent/session/:sessionId` — получить историю сессии
- [ ] `DELETE /voice-agent/session/:sessionId` — завершить/удалить сессию
- [ ] Автоудаление сессий старше 24 часов (cron `0 3 * * *`)
- [ ] Привязка к clientId если пользователь авторизован (из JWT)

#### VA-BE-6. Интеграция с существующим флоу
- [ ] После `recommendation: DOCTOR` → сессия предлагает список врачей (`GET /consultations/doctors`)
- [ ] После `recommendation: NURSE` → сессия предлагает создать заказ (передать `suggestedServiceId`)
- [ ] `POST /voice-agent/session/:sessionId/book-nurse` — создаёт черновик заказа с предзаполненными данными
- [ ] `POST /voice-agent/session/:sessionId/book-doctor` — создаёт консультацию с заполненными симптомами

#### VA-BE-7. Admin: мониторинг голосовых сессий
- [ ] `GET /admin/voice-sessions` — список сессий с фильтрами (дата, статус, recommendation)
- [ ] `GET /admin/voice-sessions/stats` — кол-во сессий, конверсия в заказы, топ симптомы
- [ ] Добавить в AuditLog действие `voice_session_complete`

---

### 📌 Фаза 2 — Mobile: голосовой интерфейс (Абубакир)

#### VA-MOB-1. Экран голосового ассистента `app/voice-agent.tsx`
- [ ] Кнопка-микрофон по центру (большая, анимированная пульсация при записи)
- [ ] Запись через `expo-av` (`Audio.Recording`) — формат m4a
- [ ] При отпускании → отправить на `POST /voice-agent/transcribe`
- [ ] Показать распознанный текст пользователю (для проверки)
- [ ] Отправить в `POST /voice-agent/chat` → получить ответ
- [ ] Воспроизвести аудио ответ через `POST /voice-agent/synthesize` → `Audio.Sound`

#### VA-MOB-2. UI состояния
- [ ] IDLE: большая кнопка микрофона + текст "Нажмите и говорите"
- [ ] RECORDING: анимация звуковых волн (пульсация), таймер записи
- [ ] PROCESSING: spinner "Думаю..."
- [ ] SPEAKING: анимация динамика, текст ответа ассистента
- [ ] RECOMMENDATION: карточка с рекомендацией + кнопки "Записаться к врачу" / "Вызвать медсестру"

#### VA-MOB-3. История диалога
- [ ] Bubble-чат под кнопкой микрофона (прокручиваемый)
- [ ] Сообщения пользователя (правый пузырь) + ассистент (левый пузырь с иконкой)
- [ ] Текст ответа отображается одновременно с озвучкой

#### VA-MOB-4. Переход к заказу/консультации
- [ ] При `recommendation: NURSE` → кнопка "Вызвать медсестру" → `router.push("/order/location")`
- [ ] При `recommendation: DOCTOR` → кнопка "Записаться к врачу" → `router.push("/doctors")`
- [ ] Передать симптомы через params чтобы предзаполнить поля

#### VA-MOB-5. Навигация
- [ ] Добавить кнопку на главном экране (index.tsx) — "Голосовой ассистент" с иконкой микрофона
- [ ] Или таб в нижней панели (заменить один из менее используемых)

---

### 📌 Фаза 3 — Web: голосовой интерфейс (Диёр)

#### VA-WEB-1. Страница `/voice-agent` в web/
- [ ] Большая кнопка микрофона (Web Speech API или MediaRecorder → отправка на backend)
- [ ] `MediaRecorder` → blob (webm) → FormData → `POST /voice-agent/transcribe`
- [ ] Отображение распознанного текста
- [ ] Отправка в `POST /voice-agent/chat`
- [ ] Получение аудио из `POST /voice-agent/synthesize` → `new Audio(url).play()`

#### VA-WEB-2. UI компонент `VoiceAssistant`
- [ ] `web/components/VoiceAssistant.tsx` — переиспользуемый компонент
- [ ] Состояния: idle / recording / processing / speaking
- [ ] CSS анимации: pulse при записи, wave при воспроизведении
- [ ] Чат-история под микрофоном

#### VA-WEB-3. Переход к флоу
- [ ] При `recommendation: NURSE` → `router.push("/order/confirm")`
- [ ] При `recommendation: DOCTOR` → `router.push("/doctors")`
- [ ] Кнопка "Голосовой ассистент" на главной странице `/`

---

### 📌 Фаза 4 — Расписание врачей (Абубакир)

> Необходимо для полноценного шага 2 (клиент записывается к врачу на конкретное время)

#### VA-SCH-1. Backend: DoctorSchedule
- [ ] Entity `DoctorSlot` — `doctorId`, `startsAt` (timestamp), `endsAt`, `isBooked` (bool), `consultationId` (nullable FK)
- [ ] `POST /doctors/:id/slots` (admin) — создать слоты (bulk: дата + время + кол-во)
- [ ] `GET /doctors/:id/slots?date=YYYY-MM-DD` — доступные слоты на дату
- [ ] При создании консультации → занять слот (`isBooked = true`)
- [ ] При отмене консультации → освободить слот

#### VA-SCH-2. Mobile: выбор времени при записи к врачу
- [ ] На экране бронирования (`consultation.tsx`) — добавить календарь + список доступных слотов
- [ ] При выборе слота — `slotId` передаётся в `POST /consultations`

#### VA-SCH-3. Web: выбор времени (Диёр)
- [ ] На странице `/consultation` — добавить DatePicker + слоты
- [ ] Компонент `SlotPicker` — сетка времени (09:00, 09:30, 10:00...) с пометкой занятых

---

### 📌 Фаза 5 — Admin: мониторинг голосового ассистента (Диёр)

#### VA-ADM-1. Admin страница «Голосовой агент»
- [ ] Новая страница `admin/src/pages/VoiceAgent.tsx`
- [ ] Карточки статистики: всего сессий, конверсия в заказы (%), топ-5 симптомов
- [ ] Таблица сессий: дата, клиент (id), длительность, кол-во обменов, рекомендация, результат (заказ создан?)
- [ ] Фильтры: по дате, по recommendation (DOCTOR/NURSE/NONE), по результату
- [ ] Клик на сессию → модал с полной историей диалога

#### VA-ADM-2. Sidebar и роутинг
- [ ] Добавить в `AdminSidebar.tsx` пункт «Голосовой агент» (иконка `Mic`)
- [ ] Добавить роут `/voice-agent` в `App.tsx`

---

### 💰 Оценка затрат (V5)

| Компонент | Бесплатный вариант | Платный вариант |
|-----------|-------------------|-----------------|
| STT | Groq Whisper (28 800 сек/день бесплатно) | OpenAI Whisper $0.006/мин |
| LLM | Groq LLaMA 3.3 70B (лимиты/день) | Claude Haiku ~$0.001/запрос |
| TTS RU | — | OpenAI TTS ~$0.015/1000 символов |
| TTS UZ | Piper TTS self-hosted | ElevenLabs $22/мес + диктор $50 разово |
| **Итого MVP** | **$0** (Groq лимиты) | **~$30-50/мес** при 1000 сессий/день |

### 📐 Архитектура потока

```
[Клиент нажимает кнопку микрофона]
        ↓
[Запись аудио — expo-av / MediaRecorder]
        ↓
POST /voice-agent/transcribe  →  [Groq Whisper]  →  { text }
        ↓
POST /voice-agent/chat  →  [Claude Haiku]  →  { reply, recommendation }
        ↓
POST /voice-agent/synthesize  →  [OpenAI TTS / ElevenLabs]  →  audio/mpeg
        ↓
[Воспроизведение ответа + отображение текста]
        ↓
[Если recommendation != NONE → кнопки перехода к заказу/врачу]
```

### 🚦 Порядок реализации

1. **VA-BE-1, VA-BE-2** — базовый модуль + STT (можно тестировать сразу через Postman)
2. **VA-BE-3** — AI диалог (самое важное)
3. **VA-BE-4** — TTS озвучка
4. **VA-MOB-1, VA-MOB-2** — mobile UI
5. **VA-BE-5, VA-BE-6** — session management + интеграция с заказами
6. **VA-WEB-1, VA-WEB-2** — web версия
7. **VA-SCH-1–3** — расписание врачей
8. **VA-ADM-1, VA-ADM-2** — admin мониторинг

---

## 📋 Документация (правило)

> После каждого выполненного этапа — обновить `done.md` с датой, описанием, файлами.
> Backend-изменения → обновить `docs/BACKEND_API.md`.
