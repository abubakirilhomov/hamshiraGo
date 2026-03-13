# HamshiraGo — Активные задачи

> Обновляется при каждом изменении. Выполненные задачи переносить в `done.md`.

---

## 👥 Роли разработки

| Роль | Зона ответственности |
|------|---------------------|
| **Абубакир** | `backend/`, `mobile/`, `medic/` |
| **Диёр** | `admin/`, `web/`, `web-medic/`, `landing/`, SEO, логотип |

> Документация (`docs/`) обновляется тем, кто выполняет задачу.

---

## 🐛 Баги (открытые)

### Абубакир
> Все баги Абубакира исправлены (BUG-A1, BUG-A2 — выполнены в Этап 5).

### Диёр
> Все баги в зоне Диёра исправлены.

### ⛔ Вне зоны изменений (read-only)
- BUG 14: web-medic загружает все заказы чтобы найти один по id
- BUG 15: web client передаёт лишние поля в CreateOrderDto
- BUG 26: `BASE_URL` захардкожен `localhost:3000` в web и web-medic
- BUG 27: `api.orders.list()` ожидает массив, бэкенд возвращает объект с пагинацией (web)
- BUG 28: WebSocket cleanup не эмитит `unsubscribe_order` (web)
- BUG 29: web-клиент может напрямую поставить статус DONE
- BUG 30: Dashboard считает доход только по первым 100 заказам (admin)
- BUG 31: Dashboard "сегодня" ограничен 100 заказами (admin)
- BUG 32: Admin роутер проверяет только наличие токена, не его валидность (admin)
- BUG 33: Admin JWT в localStorage — уязвимость к XSS (admin)

---

## ✅ Этап 5 — ВЫПОЛНЕН

> BUG-A1, BUG-A2 исправлены. AppModal создан. Alert.alert заменены в key местах.

## ✅ Этап 6 — ВЫПОЛНЕН

> Фото профиля медика реализовано полностью.

## ✅ Этап 7 — ВЫПОЛНЕН

> Mobile + medic: кастомный сплэш-оверлей (логотип + "by tezcode.ai") после нативного сплэша. ✅
> Web/web-medic/admin/landing: сплэш с брендингом + логотип — выполнено Диёром. ✅

---

## ✅ Этап 8 — ВЫПОЛНЕН (Абубакир + Диёр)

> Backend + mobile: titleUz/titleRu динамически по языку. Admin: UI для редактирования услуг с полями RU + UZ. ✅

---

## ✅ Этап 9 — ВЫПОЛНЕН

> Backend: медик получает push при CANCELED и DONE. Mobile + Medic: персистентное уведомление в фоне. ✅

---

## ✅ Этап 10 — ВЫПОЛНЕН (Абубакир + Диёр)

> isPaidMode флаг в app_settings, 10% комиссия при acceptOrder, переключатель в admin, балансы медиков в admin. ✅

---

## ✅ Этап 11 — ВЫПОЛНЕН

> Backend: webhook `/start MEDIC_ID` автоматически привязывает chat_id. Medic: deep link с ID, баннер канала. ✅

---

## ✅ Этап 12 — ВЫПОЛНЕН (Диёр + Абубакир)

- [x] **[admin]** `[Диёр]` PostHog аналитика — трекинг страниц и действий в admin ✅
- [x] **[admin]** `[Диёр]` `commissionRate` (1–50%) в Settings — слайдер, disabled когда isPaidMode выключен ✅
- [x] **[backend]** `[Абубакир]` Эндпоинт `POST /client-errors` ✅
- ~~Sentry дашборд~~ — отложено (не нужно сейчас)

---

## ✅ Этап 13 — SEO и продакшн (Диёр)

- [x] **[landing]** `[Диёр]` SEO улучшения landing — мета-теги, hreflang, JSON-LD, OG-картинка, bilingual SeoContent секция ✅
- [x] **[web/web-medic]** `[Диёр]` Lighthouse оптимизация: `<link rel="preconnect">` для API/socket, `loading="lazy"` на все img, `fetchpriority="high"` на LCP-изображения, динамический импорт Map, `dns-prefetch` ✅

---

## 📋 Этап 14 — Store публикация (Абубакир)

### ✅ Конфигурация готова
- [x] `mobile/app.json` — `ios.bundleIdentifier: com.hamshirago.client`, `android.package`, `versionCode: 1`, `buildNumber: 1`
- [x] `mobile/eas.json` — профили `development`, `preview`, `production` (android: apk/aab)
- [x] `medic/eas.json` — то же, обновлено с buildType и submit секцией

### ⏳ Требует ручных действий
- [ ] Создать EAS проект для `mobile`: `eas init` → вставить projectId в `mobile/app.json`
- [ ] `eas credentials` — настроить подпись Android (keystore) и iOS (certificates)
- [ ] Play Store: создать приложение `com.hamshirago.client`, загрузить AAB, скриншоты, Privacy Policy
- [ ] App Store: Apple Developer аккаунт ($99/год), создать app `com.hamshirago.client` в App Store Connect
- [ ] Push certificates: APNs (iOS) и FCM (Android) загрузить в EAS / Expo dashboard
- [ ] OTA: установить `expo-updates` (`npx expo install expo-updates`) и добавить в plugins обоих app.json
- [ ] Скриншоты: минимум 2 (16:9) для Google Play; 6.7", 6.1", 5.5" для App Store (RU + UZ)
- [ ] Privacy Policy URL (обязательно для обоих сторов)

---

## 📋 Документация (авто-обновление)

> Правило: после каждого выполненного этапа — обновить `done.md` с датой, описанием, файлами.
> Backend-изменения → обновить `docs/BACKEND_API.md`.

---

---

## ✅ Этап 15 — Mobile рефакторинг (Абубакир)

### Выполнено — mobile/
- [x] `types/order.ts` — добавлены `OrderStatus`, `STATUS_LABEL`, `STATUS_COLOR`, `ACTIVE_STATUSES`
- [x] `constants/config.ts` — созданы: `GPS_ACCURACY_THRESHOLD_METERS`, `FIRST_ORDER_DISCOUNT_RATE`, `ORDERS_PAGE_LIMIT`, и др.
- [x] `components/OrderCard.tsx` — извлечён из `two.tsx`
- [x] `hooks/useOrderTracking.ts` — WebSocket + order state из `track.tsx`
- [x] `hooks/useRoutePolyline.ts` — OSRM route из `track.tsx`
- [x] `hooks/useDispatchTimer.ts` — таймер elapsed из `track.tsx`
- [x] `components/RatingModal.tsx` — звёзды рейтинга из `track.tsx`
- [x] `app/order/trackStyles.ts` — стили из `track.tsx`
- [x] `app/order/track.tsx` — 1365 → 514 строк ✅
- [x] `app/(tabs)/two.tsx` — удалены дублирующиеся типы, использует `OrderCard`
- [x] `app/order/location.tsx` и `confirm.tsx` — magic numbers → `constants/config`

### Выполнено — medic/
- [x] `types/order.ts` — `OrderStatus`, `OrderLocation`, `ACTIVE_STATUSES`, `MAP_ACTIVE_STATUSES`
- [x] `constants/config.ts` — интервалы, таймауты, URL
- [x] `components/NewOrderBanner.tsx` — извлечён из `index.tsx`
- [x] `hooks/useMedicOrderFeed.ts` — WebSocket + orders feed из `index.tsx`
- [x] `hooks/useMedicLocation.ts` — location tracking из `order/[id].tsx`
- [x] `hooks/useMedicRoute.ts` — OSRM route из `order/[id].tsx`
- [x] `hooks/useOrderStatus.ts` — order fetch + WS из `order/[id].tsx`
- [x] `app/(tabs)/index.tsx` — 649 → ~200 строк ✅
- [x] `app/order/[id].tsx` — 838 → ~300 строк ✅
- [x] `app/(tabs)/my-orders.tsx` — импорт `OrderStatus` из `types/order`

### Агент-файлы
- [x] `.claude/agents/engineering/mobile-developer.md`
- [x] `.claude/agents/engineering/mobile-refactor.md`

---

---

## ✅ Этап 16 — Полевые баги + фичи (2026-03-11/12)

- [x] BUG-1 race condition — транзакция в `acceptOrder` ✅
- [x] Performance audit backend — 5 проблем закрыты ✅
- [x] Self-hosted OSRM на Railway ✅
- [x] Cancel reason — backend + mobile UI ✅
- [x] Auto-logout на 401 (token expiry) ✅
- [x] Dispatch invite не приходил — `pushLocation` при коннекте ✅
- [x] "Принять" из списка — self-claim без invite ✅
- [x] Медик не виден клиенту — tracking с ACCEPTED ✅
- [x] Метка клиента прыгала — `tracksViewChanges=false` ✅
- [x] Черный экран "услуга не найдена" — раздельные fetches ✅
- [x] OSRM 400 — base URL без `/route/v1/driving` ✅
- [x] Zoom сломан — убран `region` prop, `fitToCoordinates` 1 раз ✅
- [x] Перегрев — `watchPositionAsync` вместо `setInterval` ✅
- [x] Двойное принятие — убран ASSIGNED из NEXT_STATUS_MAP ✅
- [x] Отзыв (текст) после заказа — backend + RatingModal ✅
- [x] GPS accuracy → `High` для навигации ✅

---

## 🐛 Активные баги (найдены 2026-03-12)

### HIGH
- [x] **`pushLocation` не останавливается** — ✅ исправлено (Этап 17): clearInterval в acceptOrder
- [x] **`cancelOrder` без причины** — исправлено: хук передаёт `reason` в body, track.tsx показывает TextInput при отмене ✅
- [x] **`autoAcceptedRef` no-retry UI** — ✅ убрано (двойное принятие устранено на уровне backend: acceptOrder теперь ставит ACCEPTED напрямую)

### MEDIUM
- [x] **Двойной emit при ACCEPTED** — ✅ исправлено (Этап 17): убран socket.emit из initial position effect
- [x] **`clientReview` не показывается медику** — ✅ исправлено (Этап 17): показывается рейтинг + отзыв + причина отмены

### LOW
- [ ] **`pushLocation` использует `Accuracy.Balanced`** — для dispatch достаточно, но для первого отображения на карте лучше `High` — `medic/hooks/useMedicOrderFeed.ts`
- [ ] **История заказов без пагинации на экране** — `/orders` возвращает paginated данные, но mobile показывает только первую страницу без кнопки "загрузить ещё"

---

## ✅ Этап 17 — ВЫПОЛНЕН (2026-03-13, Абубакир)

- [x] Показывать отзыв клиента медику в `medic/app/order/[id].tsx` — рейтинг + текст отзыва после DONE ✅
- [x] Кнопка fallback при неудаче auto-advance (ASSIGNED timeout 5с) — `medic/app/order/[id].tsx` ✅
- [x] Остановить `pushLocation` интервал когда медик принял заказ — `useMedicOrderFeed.ts` ✅
- [x] Показывать причину отмены в `medic/app/order/[id].tsx` — блок при CANCELED ✅
- [x] `cancelOrder` без причины — mobile передаёт `reason` в body + TextInput в modal ✅
- [x] Двойной emit `medic_location` при ACCEPTED — убран дублирующий emit из initial position effect ✅
- [x] OSRM timeout — увеличен до 12s, добавлен exponential backoff retry ✅

### Store публикация (финальный шаг)
- [ ] `eas init` → projectId в `mobile/app.json`
- [ ] `expo-updates` install + настройка
- [ ] EAS credentials (keystore Android, APNs iOS)
- [ ] Скриншоты + Privacy Policy

---

## 📋 Этап 18 — Веб-адаптация (Диёр)

> Бэкенд изменение: `POST /orders/:id/accept` теперь сразу ставит статус **ACCEPTED** (минуя ASSIGNED).
> Статус ASSIGNED больше не приходит клиенту при принятии медиком заказа из списка или dispatch invite.

### web/ (`app/orders/[id]/page.tsx`, `lib/api.ts`)

- [ ] **StatusStepper** — убрать `"ASSIGNED"` из массива шагов (строка 45). Новый порядок: `CREATED → ACCEPTED → ON_THE_WAY → ARRIVED → SERVICE_STARTED → DONE`. Клиент теперь видит сразу "Медик принял" без промежуточного "Назначен"
- [ ] **`canCancel`** — убрать `ASSIGNED` из условия отмены (строка 284): `order.status === "CREATED"` (только CREATED, т.к. ASSIGNED больше не наступает)
- [ ] **STATUS_LABELS** в `lib/api.ts` — `ASSIGNED: "Назначен"` можно оставить для совместимости (старые заказы в БД могут иметь этот статус), но из stepper убрать

### web-medic/ (`lib/api.ts`, страница заказа)

- [ ] **NEXT_STATUS_MAP** в `lib/api.ts` строка 235 — убрать строку `ASSIGNED: { status: "ACCEPTED", label: "Подтвердить принятие", ... }`. Медик больше не видит кнопку "Подтвердить принятие" — бэкенд ставит ACCEPTED напрямую
- [ ] Убедиться что статус ASSIGNED не отображается как активный шаг в UI web-medic (если есть stepper)

---

## 💡 Идеи / V2

- [ ] Разделить таблицу `payments` — отдельный `payments_ledger` для прозрачности финансов
- [ ] Аналитика в admin: графики заказов, выручка, топ медики
- [ ] Фильтр услуг по категории на главном экране mobile/web
- [ ] Повторный заказ (кнопка "Заказать снова" в истории)
- [ ] История платежей клиента: `GET /payments/my`
- [ ] Редактирование профиля: `PATCH /auth/profile`, `PATCH /medics/profile`
