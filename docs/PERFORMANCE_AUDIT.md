# HamshiraGo — Performance & Security Audit

> Дата: 2026-03-09
> Аудитор: Claude Code (analysis of actual source files)
> Версия: актуальный main branch

---

## 🔴 КРИТИЧНО — рухнет при 50+ одновременных пользователях

| # | Проблема | Файл | Почему рухнет |
|---|----------|------|---------------|
| 1 | **`findAvailable()` грузит ВСЕ CREATED заказы без лимита** | `backend/src/orders/orders.service.ts:282` | При 500+ заказах — полный table scan + `medicsService.findById()` вне цикла, но `orders.find({where:{status:CREATED}})` без `take` вернёт все строки. Каждые 15 сек медик делает этот запрос. |
| 2 | **`dispatch_attempts` без индексов на `orderId`/`medicId`** | `backend/src/orders/entities/dispatch-attempt.entity.ts` | `getActivePendingAttempt()`, `onApplicationBootstrap()` и `advanceDispatch()` делают `find({where:{orderId, result:PENDING}})` — полный scan таблицы при росте. При 100+ заказах/день = 1000+ записей без индекса. |
| 3 | **Cloudinary upload без timeout** | `backend/src/common/cloudinary.service.ts:47` | `uploadBuffer()` создаёт Promise без AbortController/timeout. Если Cloudinary тормозит — NestJS worker thread зависает навсегда. При 10 одновременных загрузках = 10 зависших потоков. |
| 4 | **Polling вместо WebSocket в web-medic** | `web-medic/app/page.tsx:147` | `pollInterval = setInterval(fetchOrders, 15000)` — при 50 медиках онлайн = 3-4 req/сек постоянно на `/orders/medic/available`. Каждый запрос грузит все CREATED заказы (проблема #1). |
| 5 | **`appSettingsService.getCommissionRate()` без кэша** | `backend/src/orders/orders.service.ts:111` | При каждом создании заказа и каждом `acceptOrder()` делается запрос к `app_settings` таблице. При высокой нагрузке — лишние DB запросы. |

---

## 🟡 ВАЖНО — деградация при 200+ пользователях

| # | Проблема | Файл | Эффект |
|---|----------|------|--------|
| 1 | **`notifyMedic()` делает лишний DB запрос** | `backend/src/orders/orders.service.ts:89` | При каждом изменении статуса `updateStatusByMedic()` вызывает `notifyMedic()` → `medicsService.findById(medicId)` — хотя order уже загружен и medicId известен. Лишний SELECT на каждый статус. |
| 2 | **WebSocket `clientOrderRooms` Map без TTL** | `backend/src/realtime/order-events.gateway.ts:55` | Map растёт с каждым reconnect. `handleDisconnect` удаляет запись, но zombie entries (клиент не отключился, а соединение зависло) остаются. При 1000+ соединений — утечка памяти. |
| 3 | **Admin: `recharts` статический импорт** | `admin/src/pages/Dashboard.tsx:17`, `Reports.tsx:5` | `recharts` весит ~400KB minified. Импортируется в header бандла — задерживает Time To Interactive для всего admin. Нужен `React.lazy()`. |
| 4 | **Location update каждые 30 сек via REST** | `web-medic/app/page.tsx:139` | `locationInterval = setInterval(updateLocation, 30000)` вместо WebSocket. При 50 медиках = ~1.7 REST req/сек на `PATCH /medics/location`. Можно через уже открытый socket. |
| 5 | **Нет pagination в `findAvailable()`** | `backend/src/orders/orders.service.ts:282` | `orders.find({where:{status:CREATED}})` без `take/skip`. Если CREATED заказов 50+ (пиковая нагрузка) — клиент получает их все, фронт рендерит все. |
| 6 | **`synchronize: true` в dev (риск для staging)** | `backend/src/app.module.ts:67` | `synchronize: process.env.NODE_ENV !== 'production'`. Если staging задеплоен без `NODE_ENV=production` — TypeORM может изменить схему в реальной БД при deploy. |
| 7 | **Dispatch timeout 60с, нет авто-retry для NO_MEDICS** | `backend/src/orders/dispatch.service.ts:157` | Когда все медики заняты → `dispatchStatus=NO_MEDICS`. Заказ висит навсегда, клиент не знает когда попробовать снова. Нужен retry через 5-10 мин. |

---

## 🟢 ОПТИМИЗАЦИИ — хорошо бы сделать

| # | Что улучшить | Файл | Выгода |
|---|-------------|------|--------|
| 1 | **Добавить `@Index` на `dispatch_attempts.orderId` и `dispatch_attempts.medicId`** | `dispatch-attempt.entity.ts` | -90% времени на dispatch queries |
| 2 | **Кэшировать `appSettings` на 60 сек** | `app-settings.service.ts` | Убрать DB hit на каждый запрос настроек |
| 3 | **Динамический импорт recharts** | `Dashboard.tsx`, `Reports.tsx` | -400KB от initial bundle admin |
| 4 | **WebSocket для location updates** | `web-medic/app/page.tsx` | Убрать REST polling, использовать `medic_location` event уже через socket |
| 5 | **`take: 100` в `findAvailable()`** | `orders.service.ts:282` | Ограничить размер ответа при высокой нагрузке |
| 6 | **Connection pool настройки** | `app.module.ts` TypeORM config | Добавить `extra: {max:10, min:2}` для Railway |
| 7 | **debounce 500ms на поиск в admin** | `admin/src/pages/Medics.tsx`, `Orders.tsx` | Убрать лишние запросы при вводе текста |
| 8 | **CDN для Cloudinary + автовебп** | `cloudinary.service.ts:54` | `fetch_format: 'auto'` уже есть — добавить `width: 800` трансформацию для профиль фото |

---

## 🔐 БЕЗОПАСНОСТЬ

| # | Уязвимость | Файл | Риск |
|---|-----------|------|------|
| 1 | **JWT default 7 дней без отзыва токенов** | `backend/src/auth/auth.module.ts:22` | Если токен скомпрометирован (XSS/leak) — действует 7 дней. Нет blacklist. Admin JWT — 7 дней с полным доступом к панели. Рекомендация: `JWT_EXPIRES_IN=1d` для клиентов, `12h` для admin. |
| 2 | **JWT в localStorage (XSS-уязвимость)** | `web-medic/lib/api.ts:6`, `web/lib/api.ts` | `localStorage.getItem("medic_token")` — любой JS на странице (XSS, CDN компрометация) получает токен. Критично для admin (BUG-33). Решение: HttpOnly cookie. |
| 3 | **Payme webhook без IP whitelist** | `backend/src/payments/payme.service.ts:30` | Проверяет только Basic auth. Если PAYME_MERCHANT_KEY попадёт в лог/trace — любой может вызвать webhook и подтвердить платёж. Нужна проверка IP: `185.8.212.0/24` (Payme IP range). |
| 4 | **Click webhook: потенциальный race condition** | `backend/src/payments/click.service.ts` | Prepare + Complete приходят независимо. Если Complete придёт дважды (сеть) — проверка на idempotency критична. Нужно убедиться, что `payment.status = PAID` не устанавливается дважды. |
| 5 | **Admin токен роль не проверяется при WebSocket** | `backend/src/realtime/order-events.gateway.ts:69` | `role === 'admin' → return true` без проверки что токен действительно выдан для admin. Если у клиента JWT с `role:admin` (не должно быть, но JWT секрет утёк) — полный доступ. |
| 6 | **Rate limit не применяется к WebSocket** | `backend/src/app.module.ts:51` | ThrottlerGuard применяется к HTTP. WebSocket события (`medic_location`, `subscribe_order`) не throttle-ятся. Можно засыпать сервер `medic_location` событиями. |
| 7 | **ADMIN_PASSWORD default в .env.example** | `backend/.env.example` | Если пользователь не поменял — `change-this-strong-password` даёт доступ к admin. Нужна проверка при старте: если пароль == default → throw и не запускаться. |

---

## 📊 ПРОПУЩЕННЫЕ ФИЧИ (бизнес-важные)

| # | Фича | Почему важно | Зона |
|---|------|-------------|------|
| 1 | **Контакт медика для клиента** | Клиент не может связаться с медиком если тот задерживается. Телефон медика не передаётся в Order. | Абубакир (backend) + Диёр (web) |
| 2 | **История платежей** | `GET /payments/:orderId/status` есть, но нет `GET /payments/my` для клиента. Клиент не видит свои платежи в истории. | Абубакир (backend) + Диёр (web) |
| 3 | **Refund механизм** | Если заказ отменён после оплаты — нет автоматического возврата. Нет эндпоинта `POST /payments/:id/refund`. | Абубакир |
| 4 | **Авто-retry для NO_MEDICS заказов** | Заказ зависает в `dispatchStatus=NO_MEDICS`. Клиент должен сам пересоздать заказ. Нужен retry через 5-10 мин с push-уведомлением. | Абубакир |
| 5 | **Клиент не видит контакт медика на web** | web/app/orders/[id] показывает статус, но не телефон/имя медика для связи | Диёр (web) |

---

## ✅ ЧТО УЖЕ ХОРОШО

| Компонент | Что сделано правильно |
|-----------|----------------------|
| DB indexes | Order: `clientId`, `medicId`, `status`, `created_at` — все проиндексированы ✅ |
| Medic entity | `phone` (unique index), `isOnline`, `verificationStatus` — проиндексированы ✅ |
| Race conditions | `acceptOrder`, `cancelOrder`, `rateOrder` — атомарные UPDATE WHERE с optimistic locking ✅ |
| WebSocket CORS | Конкретный whitelist доменов, не `origin: '*'` ✅ |
| REST CORS | Конкретный whitelist с callback-функцией ✅ |
| Dispatch | Полная логика: invite → timeout → следующий медик, restart после Railway reboot ✅ |
| Cloudinary | `quality:'auto'`, `fetch_format:'auto'`, EXIF stripped ✅ |
| TypeORM sync | `synchronize: false` в production (`NODE_ENV=production`) ✅ |
| Rate limiting | Global 120/min + login 10/min через ThrottlerModule ✅ |
| Validation | `ValidationPipe(whitelist:true)` глобально ✅ |
| Payme DONE | Earning credit в транзакции (atomically) ✅ |
| Click | HMAC signature проверка через `sign` ✅ |

---

## 🎯 ПРИОРИТЕТЫ — что делать первым

### Абубакир (backend):
1. **`@Index()` на `dispatch_attempts.orderId` и `medicId`** — 1 строка кода, большой эффект
2. **`take: 50` в `findAvailable()`** — защита от полного table scan
3. **Cloudinary timeout** — обернуть `uploadBuffer` в `Promise.race` с 30s timeout
4. **`PAYME_IP_WHITELIST`** — проверять `req.ip` в Payme webhook
5. **Авто-retry для NO_MEDICS** — `setTimeout(advanceDispatch, 5*60*1000)` если не нашли медика

### Диёр (frontend):
1. **Убрать polling в web-medic** — `setInterval(fetchOrders, 15000)` → WebSocket `new_order` event уже есть на бэке (`emitNewOrder`), нужно подписаться
2. **Динамический импорт recharts** — `const { AreaChart } = await import('recharts')` в Dashboard/Reports
3. **Debounce на поиск** — в admin медики/заказы (500ms)
4. **Показывать имя/телефон медика клиенту** — в web/app/orders/[id]

---

*Создан: 2026-03-09 | Следующий аудит рекомендуется после 2-х недель работы в prod*
