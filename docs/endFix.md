# HamshiraGo — endFix (Pre-Production Audit)

> Дата анализа: 2026-03-06
> Охват: backend / admin / web / web-medic / mobile / medic
> Статус: **обновлён 2026-03-14** — отмечены исправленные пункты

---

## 🔴 BACKEND

### Критические баги (сломается под нагрузкой)

| # | Статус | Проблема | Файл | Описание |
|---|--------|----------|------|----------|
| B1 | ✅ | **Payment берёт полную цену вместо netPrice** | `payments/payments.service.ts:29` | Исправлено: `netPrice = priceAmount - discountAmount`. Но см. N1 — Payme/Click проверяют priceAmount |
| B2 | ✅ | **addBalance + статус DONE не в транзакции** | `orders/orders.service.ts` | Исправлено: оба пути DONE (клиент и медик) атомарны в `dataSource.transaction` |
| B3 | ✅ | **Race condition в rateOrder** | `orders/orders.service.ts` | Исправлено 2026-03-12: `rateOrder` теперь в транзакции |
| B4 | ✅ | **updateStatusByMedic без атомарного check** | `orders/orders.service.ts` | Исправлено 2026-03-09: `cancelOrder` с `WHERE status IN` |
| B5 | ✅ | **initiatePayment — дублирование под нагрузкой** | `payments/payments.service.ts` | Исправлено: `pessimistic_write` lock внутри транзакции |

### Безопасность

| # | Статус | Проблема | Файл | Описание |
|---|--------|----------|------|----------|
| B6 | ✅ | **Rate limit на /auth/login слишком мягкий** | `auth.controller.ts:51` | Исправлено: `@Throttle({ ttl: 900_000, limit: 5 })` — 5 попыток/15 мин. Но см. N6 — admin/login без этого |
| B7 | ✅ | **Swagger открыт в production** | `main.ts` | Исправлено: `if (process.env.NODE_ENV !== 'production')` |
| B8 | ✅ | **WebSocket CORS: `origin: true`** | `realtime/order-events.gateway.ts` | Исправлено 2026-03-09: production домены добавлены в CORS whitelist |

### Производительность

| # | Статус | Проблема | Файл | Описание |
|---|--------|----------|------|----------|
| B9 | ✅ | **findNearby загружает всех медиков в память** | `medics/medics.service.ts` | Исправлено: bounding box ±50км + haversine-фильтр + `slice(0, limit)` |
| B10 | ✅ | **Dispatch без лимита попыток** | `orders/dispatch.service.ts` | Исправлено: `MAX_DISPATCH_ATTEMPTS=10`, таймаут 60с. Но см. N2 — NO_MEDICS retry-таймер |

---

## 🟡 ADMIN

| # | Статус | Проблема | Файл | Описание |
|---|--------|----------|------|----------|
| A1 | ✅ | **API_BASE захардкожен** | `src/lib/api.ts` | Исправлено: читает `import.meta.env.VITE_API_URL` |
| A2 | ✅ | **Dashboard: N параллельных запросов каждые 30 сек** | `src/pages/Dashboard.tsx` | Исправлено: sequential fetch, `REVENUE_LIMIT=500`, интервал 2 мин |
| A3 | ✅ | **Reports: все DONE заказы в памяти браузера** | `src/pages/Reports.tsx` | Исправлено: `ORDER_LIMIT=500`, sequential fetch |
| A4 | ⚠️ | **JWT в localStorage** | `src/lib/api.ts` | Частично: auto-logout при истечении (BUG 33). Полный фикс = httpOnly cookies |
| A5 | ✅ | **Router проверяет только наличие токена** | `AdminLayout.tsx` | Исправлено 2026-03-14: `hasAdminToken()` проверяет `exp` + периодическая re-валидация каждые 60с |
| A6 | ✅ | **Ошибка загрузки дашборда молчит** | `src/pages/Dashboard.tsx` | Исправлено: error banner с кнопкой retry |

---

## 🔵 WEB + WEB-MEDIC

| # | Статус | Проблема | Файл | Описание |
|---|--------|----------|------|----------|
| W1 | ✅ | **`console.log` с личными данными клиента** | `web/app/order/confirm/page.tsx` | Удалён |
| W2 | ⚠️ | **JWT в localStorage (web)** | `web/lib/api.ts` | XSS уязвимость. Полный фикс = httpOnly cookies на бэкенде |
| W3 | ⚠️ | **JWT в localStorage (web-medic)** | `web-medic/lib/api.ts` | XSS уязвимость. Полный фикс = httpOnly cookies на бэкенде |
| W4 | ✅ | **WebSocket reconnect без лимита** | `web/app/orders/[id]/page.tsx` | Исправлено: `reconnectionAttempts: 5` |
| W5 | ✅ | **Ошибка при проверке скидки молчит** | `web/app/order/confirm/page.tsx` | Исправлено: `discountError` state показывает предупреждение в UI |

---

## 📱 MOBILE + MEDIC

| # | Статус | Проблема | Файл | Описание |
|---|--------|----------|------|----------|
| M1 | ⚠️ | **Location tracking при сворачивании app** | `medic/hooks/useMedicLocation.ts` | Переведён на `watchPositionAsync`, но background location (`expo-task-manager`) не реализован |
| M2 | ✅ | **OSRM — публичный rate-limited сервер** | конфиг | Исправлено: self-hosted OSRM на Railway |
| M3 | ✅ | **WebSocket без `reconnectionAttempts`** | `medic/hooks/useOrderStatus.ts` | `reconnectionDelayMax: 10000` настроен |
| M4 | ⚠️ | **STATUS_LABEL захардкожен по-русски** | `medic/app/order/[id].tsx` | i18n добавлен в медик (ru.json/uz.json), но статусы в некоторых местах ещё хардкодом |

---

---

## 🆕 Новые баги (найдены аудитом 2026-03-14)

| # | Приоритет | Проблема | Файл | Описание |
|---|-----------|----------|------|----------|
| N1 | 🔴 | **Payme/Click проверяют `priceAmount` вместо `netPrice`** | `payme.service.ts:126`, `click.service.ts:78` | `CheckPerformTransaction` сравнивает сумму с `priceAmount`, а не с `netPrice`. Заказы со скидкой вернут `ERR_WRONG_AMOUNT` — платёж не пройдёт |
| N2 | 🟡 | **NO_MEDICS retry-таймер не хранится в `this.timers`** | `dispatch.service.ts:179-184` | При отмене заказа `setTimeout` 5 мин продолжает висеть в памяти — потенциальная утечка. Нужно хранить в `this.timers` и очищать |
| N3 | 🟢 | **`adminCancelOrder` non-atomic save** | `orders/orders.service.ts:511-513` | `findOne` + `save` без `WHERE status NOT IN (DONE, CANCELED)`. Риск низкий (только admin), но лучше использовать атомарный `update()` |
| N4 | 🔴 | **`trust proxy` не настроен в `main.ts`** | `main.ts` | Payme IP-whitelist читает `req.ip` — на Railway за proxy это будет внутренний IP балансировщика. Все webhook-запросы от Payme отклоняются с 403. Фикс: `app.set('trust proxy', 1)` |
| N5 | 🟡 | **`findCandidatesForDispatch` без LIMIT** | `medics/medics.service.ts:350-364` | `qb.getMany()` без `.take()` — при сотнях онлайн медиков загружает всех в память. Добавить `.take(50)` |
| N6 | 🔴 | **`/auth/admin/login` без строгого rate limit** | `auth/auth.controller.ts:115-122` | Клиент/медик защищены `@Throttle(5 req/15 мин)`. Admin/login использует глобальный лимит 120 req/min — брутфорс на admin-аккаунт |

---

## 📊 Итог (топ открытых на 2026-03-14)

| Приоритет | Команда | # | Задача |
|-----------|---------|---|--------|
| 🔴 1 | Backend | N1 | Payme/Click проверяют priceAmount вместо netPrice — платёж со скидкой не пройдёт |
| 🔴 2 | Backend | N4 | `trust proxy` не настроен — Payme IP-whitelist блокирует все webhooks |
| 🔴 3 | Backend | N6 | `/auth/admin/login` без строгого rate limit — брутфорс |
| 🟡 4 | Backend | N2 | NO_MEDICS retry-таймер не в `this.timers` — утечка памяти |
| 🟡 5 | Backend | N5 | `findCandidatesForDispatch` без LIMIT |
| 🟢 6 | Mobile | M1 | Background location tracking |
| 🟢 7 | Backend | N3 | adminCancelOrder non-atomic |
