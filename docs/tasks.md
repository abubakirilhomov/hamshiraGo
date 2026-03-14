# HamshiraGo — Активные задачи

> Обновляется при каждом изменении. Выполненные задачи → `done.md`.
> **Этапы 1–18 выполнены** — подробности в `done.md`.

---

## 👥 Роли разработки

| Роль | Зона ответственности |
|------|---------------------|
| **Абубакир** | `backend/`, `mobile/`, `medic/` |
| **Диёр** | `admin/`, `web/`, `web-medic/`, `landing/`, SEO, логотип |

> Документация (`docs/`) обновляется тем, кто выполняет задачу.

---

## 🐛 Открытые баги

### 🔴 КРИТИЧНО — Абубакир (backend) — найдено аудитом 2026-03-14
- [x] **N1** — `payme.service.ts:126` + `click.service.ts:78`: `CheckPerformTransaction` сравнивает сумму с `priceAmount`, нужно `priceAmount - discountAmount` — заказы со скидкой не оплачиваются
- [x] **N4** — `main.ts`: добавить `app.set('trust proxy', 1)` — без этого Payme IP-whitelist блокирует все webhooks на Railway
- [x] **N6** — `auth/auth.controller.ts:115`: добавить `@Throttle({ default: { ttl: 900_000, limit: 5 } })` на `/auth/admin/login` — сейчас глобальный лимит 120 req/min (брутфорс)

### 🟡 ВАЖНО — Абубакир (backend)
- [x] **N2** — `dispatch.service.ts:179`: NO_MEDICS retry `setTimeout` не хранится в `this.timers` — при отмене заказа таймер висит в памяти
- [x] **N5** — `medics/medics.service.ts:350`: `findCandidatesForDispatch` без `.take()` — при росте базы загружает всех медиков

### 🟡 Карта — встречная полоса (bearings fix) — Абубакир
> Диёр уже исправил web-medic. Нужно сделать для нативного medic и backend.
- [x] **Шаг 1** — `medic/hooks/useMedicLocation.ts`: добавить `heading: loc.coords.heading ?? null` в объект emit `medic_location`
- [x] **Шаг 2** — `backend/src/realtime/order-events.gateway.ts`: пробросить `heading` из payload `medic_location` клиенту
- [x] **Шаг 3** — `medic/hooks/useMedicRoute.ts`: добавить `bearings=${heading},45` и `radiuses=25` в OSRM-запрос
- [ ] **Шаг 4** — `web/components/TrackingMap.tsx` + `web/app/orders/[id]/page.tsx`: принять `heading` из WS-события и передать в OSRM (после шагов 1-2)

### LOW — Абубакир (mobile/medic)
- [ ] **`pushLocation` использует `Accuracy.Balanced`** — для первого отображения на карте лучше `High` — `medic/hooks/useMedicOrderFeed.ts`
- [ ] **История заказов без пагинации** — `/orders` возвращает paginated данные, но mobile показывает только первую страницу без кнопки "загрузить ещё"

### ⚠️ Частично закрыты (требуют backend-изменений)
- **JWT в localStorage** (web, web-medic, admin) — auto-logout при истечении добавлен; полный фикс = httpOnly cookies на бэкенде
- **Admin JWT** — `AdminLayout` проверяет exp каждые 60с ✅ (BUG 32); localStorage XSS-уязвимость остаётся пока нет httpOnly cookies (BUG 33)

### ⛔ Вне зоны изменений (зафиксировано, не исправляем)
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

## 💡 Идеи / V2

- [ ] Разделить таблицу `payments` — отдельный `payments_ledger` для прозрачности финансов
- [ ] Аналитика в admin: графики заказов, выручка, топ медики
- [ ] Фильтр услуг по категории на главном экране mobile/web
- [ ] Повторный заказ (кнопка "Заказать снова" в истории)
- [ ] История платежей клиента: `GET /payments/my`
- [ ] Редактирование профиля: `PATCH /auth/profile`, `PATCH /medics/profile`

---

## 📋 Документация (правило)

> После каждого выполненного этапа — обновить `done.md` с датой, описанием, файлами.
> Backend-изменения → обновить `docs/BACKEND_API.md`.
