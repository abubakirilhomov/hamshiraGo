# HamshiraGo — Задачи для Абубакира (2026-03-14)

> Диёр сделал push. Прочитай этот файл, выполни задачи, обнови `done.md`.

---

## 🔴 КРИТИЧНО — Backend (платежи сломаны в production)

### N1 — Payme/Click проверяют `priceAmount` вместо `netPrice`

**Файлы:**
- `backend/src/payments/payme.service.ts` строка ~126
- `backend/src/payments/click.service.ts` строка ~78

**Проблема:** `CheckPerformTransaction` сравнивает сумму от платёжной системы с `order.priceAmount` (полная цена без скидки). Но `initiatePayment` создаёт платёж на `netPrice = priceAmount - discountAmount`. Payme пришлёт обратно именно `netPrice`, получит `ERR_WRONG_AMOUNT` → платёж не проходит.

**Что исправить:** заменить `order.priceAmount` на `(order.priceAmount ?? 0) - (order.discountAmount ?? 0)` в обоих местах проверки суммы.

---

### N4 — `trust proxy` не настроен → Payme IP-whitelist блокирует все webhooks

**Файл:** `backend/src/main.ts`

**Проблема:** Railway запускает NestJS за reverse proxy. `req.ip` возвращает внутренний IP балансировщика, а не реальный IP Payme (185.8.212.x) → все webhook-запросы от Payme отклоняются с 403.

**Что добавить** (до `app.listen`):
```ts
app.getHttpAdapter().getInstance().set('trust proxy', 1);
```

---

### N6 — `/auth/admin/login` без строгого rate limit

**Файл:** `backend/src/auth/auth.controller.ts` строки ~115-122

**Проблема:** клиент и медик защищены `@Throttle({ default: { ttl: 900_000, limit: 5 } })`. На `POST /auth/admin/login` этого декоратора нет — применяется глобальный лимит 120 req/min. Брутфорс на admin.

**Что добавить** над методом `adminLogin`:
```ts
@Throttle({ default: { ttl: 900_000, limit: 5 } })
```

---

## 🟡 ВАЖНО — Backend

### N2 — NO_MEDICS retry-таймер не в `this.timers`

**Файл:** `backend/src/orders/dispatch.service.ts` строки ~179-184

**Проблема:** при отсутствии медиков запускается `setTimeout` на 5 минут. Если клиент отменил заказ — таймер продолжает висеть в памяти (не хранится в `this.timers`, не очищается).

**Что исправить:** сохранять таймер в `this.timers[orderId]` по аналогии с основным dispatch-таймером, чтобы он очищался при отмене.

---

### N5 — `findCandidatesForDispatch` без `.take()`

**Файл:** `backend/src/medics/medics.service.ts` строки ~350-364

**Проблема:** `qb.getMany()` без `.take()` — при росте базы медиков загружает всех в память.

**Что добавить:** `.take(50)` к query builder перед `getMany()`.

---

## 🗺️ Карта — встречная полоса (bearing fix)

> Диёр уже исправил web-medic (bearings в OSRM + heading из браузера).
> Тебе нужно сделать то же самое для нативного приложения medic (Expo).

### Шаг 1 — `medic/hooks/useMedicLocation.ts`

**Проблема:** `loc.coords.heading` не передаётся в emit — уходит только `{ latitude, longitude }`.

**Что добавить** в `pos` объект перед emit:
```ts
const pos = {
  latitude: loc.coords.latitude,
  longitude: loc.coords.longitude,
  heading: loc.coords.heading ?? null,   // ← добавить
};
```

---

### Шаг 2 — Backend WebSocket Gateway

**Файл:** `backend/src/realtime/order-events.gateway.ts`

**Проблема:** событие `medic_location` получает `{ orderId, latitude, longitude }` от медика и пробрасывает клиенту. `heading` нужно добавить в этот проброс.

**Что сделать:** убедиться что `heading` из payload передаётся клиенту в событии `medic_location` (добавить в destructuring и в emit).

---

### Шаг 3 — `medic/hooks/useMedicRoute.ts`

**Файл:** `medic/hooks/useMedicRoute.ts` строки ~44-47

**Проблема:** OSRM-запрос без `bearings` и `radiuses` → медик прилипает к встречной полосе.

**Что изменить:**
```ts
// Было:
const url = `${OSRM_URL}/${medicPos.longitude},${medicPos.latitude};...?overview=full&geometries=geojson`;

// Стало:
const heading = medicPos.heading;  // heading должен быть в состоянии хука
const bearingsParam = heading != null && !isNaN(heading)
  ? `&bearings=${Math.round(heading)},45;`
  : "";
const url = `${OSRM_URL}/${medicPos.longitude},${medicPos.latitude};...?overview=full&geometries=geojson&radiuses=25;${bearingsParam}`;
```

> Для этого нужно, чтобы `medicPos` содержал `heading` — передавать его из хука `useMedicLocation` вместе с координатами.

---

### Шаг 4 — `web/components/TrackingMap.tsx` (после шага 2)

**Файл:** `web/components/TrackingMap.tsx` строка ~117

После того как бэкенд начнёт передавать `heading` в событии `medic_location`:

1. В `web/app/orders/[id]/page.tsx` — добавить `heading` в state `medicLocation` и принять из WS-события
2. Передать `heading` как prop в `<TrackingMap>`
3. В `TrackingMap.tsx` — добавить `heading?: number | null` в props и использовать в OSRM-запросе:
```ts
const bearingsParam = heading != null && !isNaN(heading)
  ? `&bearings=${Math.round(heading)},45;`
  : "";
const url = `...?overview=full&geometries=geojson&radiuses=25;${bearingsParam}`;
```

---

## ✅ Уже сделано Диёром (не трогать)

- `web/app/orders/[id]/page.tsx` — карточка медика: фото профиля или первая буква вместо иконки
- `web-medic/components/Map.tsx` — маркер медика: фото/буква/▲ вместо 🏥
- `web-medic/app/order/[id]/page.tsx` — bearings + radiuses в OSRM, heading из браузера GPS
- Этап 18 — убран ASSIGNED из web и web-medic
- BUG 32/33 — auto-logout в AdminLayout
