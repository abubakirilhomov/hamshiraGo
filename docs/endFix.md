# HamshiraGo — endFix (Pre-Production Audit)

> Дата анализа: 2026-03-06
> Охват: backend / admin / web / web-medic / mobile / medic
> Статус: **перед релизом в production**

---

## 🔴 BACKEND

### Критические баги (сломается под нагрузкой)

| # | Проблема | Файл | Строка | Описание |
|---|----------|------|--------|----------|
| B1 | **Payment берёт полную цену вместо netPrice** | `payments/payments.service.ts` | 27 | `amount = order.priceAmount` — клиент со скидкой платит полную сумму через Payme/Click |
| B2 | **addBalance + статус DONE не в транзакции** | `orders/orders.service.ts` | 338–341 | Если `addBalance` упадёт — заказ уже DONE, медик не получил деньги |
| B3 | **Race condition в rateOrder** | `orders/orders.service.ts` | 173–179 | Два клиента одновременно оценивают медика → оба читают одинаковый `reviewCount` → один результат теряется. Нужен `SELECT FOR UPDATE` |
| B4 | **updateStatusByMedic без атомарного check** | `orders/orders.service.ts` | 330–333 | Читает статус, проверяет, сохраняет без `WHERE status = :current` — два параллельных запроса могут оба пройти |
| B5 | **initiatePayment — дублирование под нагрузкой** | `payments/payments.service.ts` | 31–47 | Два параллельных вызова: оба видят `null`, оба создают payment. Нужен UNIQUE constraint или SELECT FOR UPDATE |

### Безопасность

| # | Проблема | Файл | Строка | Описание |
|---|----------|------|--------|----------|
| B6 | **Rate limit на /auth/login слишком мягкий** | `app.module.ts` | 48–53 | 120 req/min на все эндпоинты включая `/auth/login` — возможен brute force. Нужно 5 req/15min на auth endpoints |
| B7 | **Swagger открыт в production** | `main.ts` | 60–61 | `/api/docs` отдаёт полную схему API всем. Отключить или защитить в production |
| B8 | **WebSocket CORS: `origin: true`** | `realtime/order-events.gateway.ts` | 27–29 | WS принимает соединения с любого домена. REST API ограничен whitelist, WS — нет |

### Производительность

| # | Проблема | Файл | Строка | Описание |
|---|----------|------|--------|----------|
| B9 | **findNearby загружает всех медиков в память** | `medics/medics.service.ts` | 373–393 | При 500+ онлайн медиках и 20 одновременных запросах — медленно и дорого |
| B10 | **Dispatch без лимита попыток** | `orders/dispatch.service.ts` | 66–147 | 50 медиков × 60 сек = клиент ждёт 50 минут. Нужен максимум по времени или числу попыток |

### Тесты — не покрыто

| Сценарий | Статус |
|----------|--------|
| Два медика принимают заказ одновременно | ❌ |
| Два клиента оценивают медика одновременно | ❌ |
| Payme / Click webhook callback | ❌ |
| addBalance при откате транзакции | ❌ |
| Dispatch timeout → следующий медик | ❌ |
| Медик без верификации пробует принять заказ | ❌ |

---

## 🟡 ADMIN

### Критические

| # | Проблема | Файл | Строка | Описание |
|---|----------|------|--------|----------|
| A1 | **API_BASE захардкожен строкой** | `src/lib/api.ts` | 1 | `export const API_BASE = "https://hamshirago-..."` — `VITE_API_URL` из `.env` не используется. При смене Railway URL — сломается |
| A2 | **Dashboard: N параллельных запросов каждые 30 сек** | `src/pages/Dashboard.tsx` | 39–48 | `Promise.all(Array.from({length: totalPages},...))` — при 10 000 DONE заказов = 100 запросов каждые 30 сек. Убивает бэкенд |
| A3 | **Reports: все DONE заказы в памяти браузера** | `src/pages/Reports.tsx` | 88–93 | Та же логика — при 10 000 заказов = 10 000 объектов в JS heap |

### Безопасность

| # | Проблема | Файл | Строка | Описание |
|---|----------|------|--------|----------|
| A4 | **JWT в localStorage** | `src/lib/api.ts` | 87–89 | `localStorage.getItem("admin_token")` — уязвимость к XSS. Admin токен особенно критичен |
| A5 | **Router проверяет токен только на клиенте** | Router | — | `hasAdminToken()` декодирует JWT через `atob` — не валидирует подпись. Сервер тоже не валидирует (BUG 32) |

### Функциональные

| # | Проблема | Файл | Строка | Описание |
|---|----------|------|--------|----------|
| A6 | **Ошибка загрузки дашборда молчит** | `src/pages/Dashboard.tsx` | 89–92 | `console.error(...)` — пользователь видит пустой дашборд без объяснений |

---

## 🔵 WEB + WEB-MEDIC

### Критические

| # | Проблема | Файл | Строка | Описание |
|---|----------|------|--------|----------|
| W1 | **`console.log` с личными данными клиента** | `web/app/order/confirm/page.tsx` | 82 | `console.log("[confirm] sending order body:", JSON.stringify(body))` — логирует адрес, телефон, координаты |
| W2 | **JWT в localStorage (web)** | `web/lib/api.ts` | 6 | `localStorage.getItem("token")` — XSS уязвимость |
| W3 | **JWT в localStorage (web-medic)** | `web-medic/lib/api.ts` | 6 | `localStorage.getItem("medic_token")` — XSS уязвимость |

### Средние

| # | Проблема | Файл | Строка | Описание |
|---|----------|------|--------|----------|
| W4 | **WebSocket reconnect без лимита попыток** | `web/app/orders/[id]/page.tsx` | 130–135 | `reconnection: true` без `reconnectionAttempts` — при упавшем сервере бесконечный reconnect, сажает батарею |
| W5 | **Ошибка при проверке скидки молчит** | `web/app/order/confirm/page.tsx` | 48 | `.catch(() => {})` — если запрос упал, скидка не применяется без уведомления пользователя |

### Что работает хорошо

| ✅ | Описание |
|----|----------|
| WebSocket cleanup | `socket.emit("unsubscribe_order", id); socket.disconnect()` — правильная очистка в useEffect |
| Loading states | Все кнопки `disabled={loading}` — защита от двойного submit |
| Error handling | try/catch везде, ошибки показываются пользователю |
| Services cache | 5-минутный кэш услуг в localStorage с TTL |

---

## 📱 MOBILE + MEDIC

### Средние

| # | Проблема | Файл | Строка | Описание |
|---|----------|------|--------|----------|
| M1 | **Location tracking останавливается при сворачивании app** | `medic/app/order/[id].tsx` | 192–214 | `setInterval` стоп при background. Клиент не видит медика. Нужен `expo-task-manager` + background location |
| M2 | **OSRM — публичный rate-limited сервер** | `medic/app/order/[id].tsx` | 24 | `https://router.project-osrm.org` — упадёт под production нагрузкой. Нужен self-hosted или платный роутинг |
| M3 | **WebSocket без `reconnectionAttempts`** | `medic/app/order/[id].tsx` | 151–156 | Есть `reconnectionDelayMax: 10000` — хорошо. Но нет максимума попыток |
| M4 | **STATUS_LABEL захардкожен по-русски** | `medic/app/order/[id].tsx` | 83–92 | Строки статусов не через i18n — при смене языка не переведутся |

### Что работает хорошо

| ✅ | Описание |
|----|----------|
| SecureStore | `mobile/context/AuthContext.tsx` использует `expo-secure-store` — правильно |
| Double-submit protection | `disabled={loading}` на кнопках |
| OSRM timeout | `AbortController` с 8s timeout |
| Tracking только при ON_THE_WAY | Экономия батареи |
| Location permission check | Проверяет разрешение перед отправкой координат |

---

## 📊 Сводный приоритет (топ перед релизом)

| Приоритет | Команда | # | Задача |
|-----------|---------|---|--------|
| 🔴 1 | Backend | B1 | `initiatePayment` — неправильная сумма в Payme/Click |
| 🔴 2 | Backend | B2 | `addBalance` + DONE не в транзакции |
| 🔴 3 | Admin | A1 | `API_BASE` захардкожен, не из env |
| 🔴 4 | Admin | A2 | Dashboard убивает бэкенд запросами каждые 30 сек |
| 🔴 5 | Web | W1 | `console.log` с адресом и телефоном клиента |
| 🟡 6 | Backend | B6 | Rate limit на /auth/login |
| 🟡 7 | Backend | B7 | Swagger в production |
| 🟡 8 | Backend | B3 | Race condition в rateOrder |
| 🟡 9 | Web | W4 | WebSocket reconnect без лимита |
| 🟡 10 | Mobile | M1 | Background location tracking |
| 🟢 11 | Backend | B8 | WebSocket CORS |
| 🟢 12 | Backend | B10 | Dispatch лимит попыток |
| 🟢 13 | Mobile | M2 | Заменить публичный OSRM |
| 🟢 14 | Mobile | M4 | Hardcoded статусы без i18n |
