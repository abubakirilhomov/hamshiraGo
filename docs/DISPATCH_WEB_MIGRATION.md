# Dispatch Migration Guide — web / web-medic

> Дата: 2026-03-03
> Контекст: мы перешли с pull-based модели (все медики видят заказ, первый нажал — получил)
> на push-based автоматический dispatch (как Яндекс Такси — платформа сама ищет лучшего медика).

---

## Что изменилось в бэкенде

### Новые API-эндпоинты

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| `POST` | `/orders/:id/decline` | `Bearer <medicToken>` | Медик отклоняет dispatch-инвайт → система переходит к следующему медику |

Все остальные эндпоинты без изменений.

### Новые WebSocket-события

Бэкенд теперь рассылает три новых события поверх существующих (`order_status`, `medic_location`).

#### → `dispatch_update` (клиент)

Отправляется в комнату `order:{orderId}` пока статус `CREATED`.
Клиент подписывается через `socket.emit("subscribe_order", orderId)` — уже делается в обоих приложениях.

```typescript
// Payload
{
  status: "searching" | "contacting" | "no_medics";
  medic?: {
    name: string;
    latitude: number | null;
    longitude: number | null;
    rating: number | null;
  };
}
```

| `status` | Смысл |
|----------|-------|
| `"searching"` | Заказ создан, начинаем поиск медика |
| `"contacting"` | Нашли кандидата, ждём его ответа 60 сек. `medic.name` — имя кандидата |
| `"no_medics"` | Все кандидаты не ответили/отказали в этом раунде, ищем дальше |

После назначения приходит стандартное `order_status` с `status: "ASSIGNED"`.

#### → `dispatch_invite` (медик)

Отправляется **только конкретному медику** (персональная комната `medic:{medicId}`).
Приходит когда бэкенд решил, что этот медик — лучший кандидат.

```typescript
// Payload
{
  orderId: string;
  order: {
    id: string;
    serviceTitle: string;
    priceAmount: number;
    discountAmount: number;
    location: {
      house: string;
      floor: string | null;
      apartment: string | null;
      phone: string;
      latitude: number;
      longitude: number;
    } | null;
  };
  expiresAt: string; // ISO-строка, истекает через 60 секунд
}
```

Медику нужно ответить до `expiresAt`. Если не ответит — бэкенд автоматически перейдёт к следующему.

#### → `dispatch_invite_expired` (медик)

```typescript
{ orderId: string }
```

Приходит когда: (а) таймер истёк, (б) медик сам отклонил, (в) заказ отменён.
Нужно убрать диалог/баннер инвайта.

---

## web/ — Next.js клиент

### 1. `web/app/order/location/page.tsx` — убрать выбор медика

**Что удалить:**

```typescript
// ❌ Удалить эти state-переменные
const [nearbyMedics, setNearbyMedics] = useState<MedicMarker[]>([]);
const [loadingMedics, setLoadingMedics] = useState(false);
const [closestMedic, setClosestMedic] = useState<MedicMarker | null>(null);
const medicsFetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

// ❌ Удалить функцию fetchNearbyMedics и её вызовы

// ❌ Удалить из handleSubmit() — эти строки:
if (closestMedic) {
  queryParams.set("nurseName", closestMedic.name);
  if (closestMedic.rating != null) queryParams.set("nurseRating", String(closestMedic.rating));
  if (closestMedic.distanceKm != null) queryParams.set("nurseDistance", String(closestMedic.distanceKm));
  queryParams.set("nurseEta", String(etaMinutes(closestMedic.distanceKm)));
}

// ❌ Удалить JSX — плашку с количеством медиков (div с FaUserNurse) и карточку "Ближайший медик"
```

**Карту оставить**, просто передать пустые медики:

```tsx
// ✅ Было:
<Map lat={lat} lng={lng} onMove={handleMapMove} medics={nearbyMedics} />
// ✅ Стало:
<Map lat={lat} lng={lng} onMove={handleMapMove} medics={[]} />
```

**Можно также удалить импорты** `FaUserNurse`, `Medic`, и функцию `etaMinutes`.

---

### 2. `web/app/order/confirm/page.tsx` — убрать карточку медика

**Что удалить:**

```typescript
// ❌ Удалить эти переменные из params
const nurseName     = params.get("nurseName")    ?? "";
const nurseRating   = params.get("nurseRating")  ?? "";
const nurseDistance = params.get("nurseDistance") ?? "";
const nurseEta      = params.get("nurseEta")     ?? "";

// ❌ Удалить поле serviceTitle из тела запроса (бэкенд берёт из каталога)
// В api.orders.create() тело сейчас включает serviceTitle — это избыточно,
// бэкенд игнорирует это поле и берёт название из БД. Можно оставить, не сломает.
```

**Что удалить из JSX:**

```tsx
// ❌ Удалить всю секцию "Медсестра"
{nurseName && (
  <div style={cardStyle}>
    <h2 style={sectionTitle}>Медсестра</h2>
    {/* ... весь блок ... */}
  </div>
)}
```

---

### 3. `web/app/orders/[id]/page.tsx` — показать dispatch-статус

Сейчас при статусе `CREATED` показывается:
```tsx
<p>Ищем медсестру...</p>
<p>Обычно это занимает 2–5 минут</p>
```

Нужно улучшить: слушать `dispatch_update` и показывать кто именно ищется.

**Добавить state:**

```typescript
const [dispatchState, setDispatchState] = useState<{
  status: "searching" | "contacting" | "no_medics";
  candidateName?: string;
} | null>(null);
```

**Добавить listener в useEffect (рядом с `order_status`):**

```typescript
socket.on("dispatch_update", (payload: {
  status: "searching" | "contacting" | "no_medics";
  medic?: { name: string; latitude: number | null; longitude: number | null; rating: number | null };
}) => {
  setDispatchState({
    status: payload.status,
    candidateName: payload.medic?.name,
  });
});

// Когда статус перешёл из CREATED — сбросить dispatch state
socket.on("order_status", ({ orderId, status }) => {
  if (orderId === id) {
    if (status !== "CREATED") setDispatchState(null); // ← добавить эту строку
    api.orders.get(id).then(setOrder).catch(() => {});
  }
});
```

**Обновить JSX блок "Ищем медсестру":**

```tsx
// Было:
{!order.medic && order.status === "CREATED" && (
  <div style={{ ... textAlign: "center" ... }}>
    <FaUserNurse size={24} color="#94a3b8" />
    <p>Ищем медсестру...</p>
    <p>Обычно это занимает 2–5 минут</p>
  </div>
)}

// Стало:
{!order.medic && order.status === "CREATED" && (
  <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 12, textAlign: "center" }}>
    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f1f5f9", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <FaUserNurse size={24} color="#94a3b8" />
    </div>
    {dispatchState?.status === "contacting" && dispatchState.candidateName ? (
      <>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          Связываемся с {dispatchState.candidateName}...
        </p>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          Медик рассматривает ваш заказ (до 60 сек)
        </p>
      </>
    ) : dispatchState?.status === "no_medics" ? (
      <>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          Медики заняты...
        </p>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          Продолжаем поиск, вам сообщим
        </p>
      </>
    ) : (
      <>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          Ищем медика...
        </p>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          Обычно это занимает 2–5 минут
        </p>
      </>
    )}
  </div>
)}
```

---

## web-medic/ — Next.js медик-дашборд

### 1. `web-medic/lib/api.ts` — добавить метод `decline`

В объекте `medicApi.orders` добавить:

```typescript
orders: {
  available: () => request<Order[]>("/orders/medic/available"),
  my:        () => request<{ data: Order[] }>("/orders/medic/my").then(r => r.data),
  get:       (id: string) => request<Order>(`/orders/${id}`),
  accept:    (id: string) => request<Order>(`/orders/${id}/accept`, { method: "POST" }),
  // ✅ Добавить:
  decline:   (id: string) => request<void>(`/orders/${id}/decline`, { method: "POST" }),
  updateStatus: (id: string, status: OrderStatus) =>
    request<Order>(`/orders/${id}/medic-status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
},
```

---

### 2. `web-medic/app/page.tsx` — dispatch invite dialog

Это главное изменение. Нужно добавить полноэкранный/оверлейный диалог когда приходит `dispatch_invite`.

#### Добавить типы (вверху файла):

```typescript
interface DispatchInvitePayload {
  orderId: string;
  order: {
    serviceTitle: string;
    priceAmount: number;
    discountAmount: number;
    location: {
      house: string;
      floor: string | null;
      apartment: string | null;
      phone: string;
      latitude: number;
      longitude: number;
    } | null;
  };
  expiresAt: string; // ISO timestamp
}
```

#### Добавить state и ref:

```typescript
const [invite, setInvite] = useState<DispatchInvitePayload | null>(null);
const [inviteSecondsLeft, setInviteSecondsLeft] = useState(60);
const inviteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
const [inviteLoading, setInviteLoading] = useState<"accept" | "decline" | null>(null);
```

#### Добавить listeners в `connectSocket()`:

```typescript
// Рядом с socket.on("new_order", ...) добавить:

socket.on("dispatch_invite", (payload: DispatchInvitePayload) => {
  // Запустить обратный отсчёт
  if (inviteTimerRef.current) clearInterval(inviteTimerRef.current);
  const updateCountdown = () => {
    const ms = new Date(payload.expiresAt).getTime() - Date.now();
    setInviteSecondsLeft(Math.max(0, Math.ceil(ms / 1000)));
  };
  updateCountdown();
  inviteTimerRef.current = setInterval(updateCountdown, 500);

  // Показать диалог
  setInvite(payload);
  playOrderAlert(); // уже есть в компоненте
});

socket.on("dispatch_invite_expired", ({ orderId }: { orderId: string }) => {
  setInvite((prev) => {
    if (prev?.orderId === orderId) {
      if (inviteTimerRef.current) clearInterval(inviteTimerRef.current);
      return null;
    }
    return prev;
  });
});
```

**Не забыть** очистить таймер при размонтировании (добавить в return функции useEffect):

```typescript
return () => {
  clearInterval(locationInterval);
  clearInterval(pollInterval);
  if (titleBlinkRef.current) clearInterval(titleBlinkRef.current);
  if (inviteTimerRef.current) clearInterval(inviteTimerRef.current); // ← добавить
  socketRef.current?.disconnect();
};
```

#### Добавить обработчики Accept/Decline:

```typescript
async function acceptInvite() {
  if (!invite) return;
  setInviteLoading("accept");
  try {
    await medicApi.orders.accept(invite.orderId);
    if (inviteTimerRef.current) clearInterval(inviteTimerRef.current);
    setInvite(null);
    router.push(`/order/${invite.orderId}`);
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : "Не удалось принять заказ");
    setInviteLoading(null);
  }
}

async function declineInvite() {
  if (!invite) return;
  setInviteLoading("decline");
  try {
    await medicApi.orders.decline(invite.orderId);
    if (inviteTimerRef.current) clearInterval(inviteTimerRef.current);
    setInvite(null);
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : "Не удалось отклонить заказ");
    setInviteLoading(null);
  }
}
```

#### Добавить JSX (overlay) перед закрывающим `</div>` основного компонента:

```tsx
{/* ─── Dispatch Invite Overlay ─── */}
{invite && (
  <div style={{
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  }}>
    <div style={{
      background: "#fff", borderRadius: 20, maxWidth: 480, width: "100%",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      overflow: "hidden",
    }}>
      {/* Шапка с таймером */}
      <div style={{
        background: inviteSecondsLeft <= 15
          ? (inviteSecondsLeft === 0 ? "#64748b" : "#d97706")
          : "#0d9488",
        padding: "20px 24px",
        display: "flex", alignItems: "center", gap: 16,
        transition: "background 0.5s ease",
      }}>
        {/* Круг с секундами */}
        <div style={{
          width: 68, height: 68, borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
            {inviteSecondsLeft}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>сек</span>
        </div>
        <div>
          <p style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>
            {inviteSecondsLeft === 0 ? "Время истекло" : "🚨 Новый заказ!"}
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 3 }}>
            {inviteSecondsLeft === 0
              ? "Заказ передан другому медику"
              : `Ответьте в течение ${inviteSecondsLeft} секунд`}
          </p>
        </div>
      </div>

      {/* Детали заказа */}
      <div style={{ padding: "20px 24px" }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
          {invite.order.serviceTitle}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, color: "#64748b" }}>Стоимость</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0d9488" }}>
              {((invite.order.priceAmount ?? 0) - (invite.order.discountAmount ?? 0)).toLocaleString("ru-RU")} UZS
            </span>
          </div>
          {invite.order.location && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 14, color: "#64748b", flexShrink: 0 }}>Адрес</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", textAlign: "right" }}>
                  {[
                    invite.order.location.house,
                    invite.order.location.floor ? `эт. ${invite.order.location.floor}` : null,
                    invite.order.location.apartment ? `кв. ${invite.order.location.apartment}` : null,
                  ].filter(Boolean).join(", ")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, color: "#64748b" }}>Телефон</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                  {invite.order.location.phone}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Кнопки */}
        <button
          onClick={acceptInvite}
          disabled={inviteLoading !== null || inviteSecondsLeft === 0}
          style={{
            width: "100%", background: "#0d9488", color: "#fff",
            fontSize: 17, fontWeight: 700, border: "none",
            borderRadius: 14, padding: "16px",
            cursor: (inviteLoading !== null || inviteSecondsLeft === 0) ? "not-allowed" : "pointer",
            opacity: (inviteLoading !== null || inviteSecondsLeft === 0) ? 0.5 : 1,
            marginBottom: 10,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "opacity 150ms ease",
          }}
        >
          {inviteLoading === "accept" ? "Принимаем..." : "✓ Принять заказ"}
        </button>
        <button
          onClick={declineInvite}
          disabled={inviteLoading !== null || inviteSecondsLeft === 0}
          style={{
            width: "100%", background: "#fff", color: "#ef4444",
            fontSize: 15, fontWeight: 600,
            border: "1.5px solid #ef4444", borderRadius: 14, padding: "14px",
            cursor: (inviteLoading !== null || inviteSecondsLeft === 0) ? "not-allowed" : "pointer",
            opacity: (inviteLoading !== null || inviteSecondsLeft === 0) ? 0.4 : 1,
            transition: "opacity 150ms ease",
          }}
        >
          {inviteLoading === "decline" ? "Отклоняем..." : "✕ Отклонить"}
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Итого: файлы к изменению

| Файл | Изменение |
|------|-----------|
| `web/app/order/location/page.tsx` | Убрать `fetchNearbyMedics`, `nearbyMedics`, `closestMedic`, nurse-плашку под картой, nurse-карточку "Ближайший медик", nurse-параметры в `handleSubmit`. Map передать `medics={[]}` |
| `web/app/order/confirm/page.tsx` | Убрать `nurseName/nurseRating/nurseDistance/nurseEta` params, убрать карточку "Медсестра" из JSX |
| `web/app/orders/[id]/page.tsx` | Добавить state `dispatchState`, listener `dispatch_update`, обновить UI блока "Ищем медсестру" |
| `web-medic/lib/api.ts` | Добавить `medicApi.orders.decline(id)` |
| `web-medic/app/page.tsx` | Добавить `invite` state, listeners `dispatch_invite`/`dispatch_invite_expired`, функции `acceptInvite`/`declineInvite`, JSX оверлей |

---

## Что НЕ нужно менять

- `/orders/medic/available` — эндпоинт и список заказов остаются как fallback (медики могут видеть CREATED-заказы)
- `acceptOrder()` в web-medic — логика без изменений
- Все остальные страницы — без изменений
- Статусы заказа — без изменений
- WebSocket `order_status` / `medic_location` — без изменений

---

## Проверка после реализации

1. Клиент создаёт заказ → экран `orders/[id]` сразу показывает "Ищем медика..."
2. Бэкенд находит кандидата → `dispatch_update { status: "contacting", medic: { name } }` → появляется "Связываемся с [Имя]..."
3. В web-medic на этого медика → overlay с таймером 60 сек
4. Медик нажимает "Принять" → `POST /orders/:id/accept` → редирект на `/order/:id`, оверлей закрывается
5. Медик нажимает "Отклонить" → `POST /orders/:id/decline` → оверлей закрывается, бэкенд ищет следующего
6. Время вышло (60 сек) → `dispatch_invite_expired` → оверлей закрывается автоматически
7. После ASSIGNED → стандартный tracking flow без изменений
