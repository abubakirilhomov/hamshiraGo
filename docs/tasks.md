# HamshiraGo — Активные задачи

> Обновляется при каждом изменении. Выполненные задачи переносить в `done.md`.

---

## 🐛 Баги (открытые, в нашей зоне: backend / mobile / medic)

> Все баги в нашей зоне исправлены в Этапе 4.

---

## ⛔ Баги вне зоны изменений (read-only: web / web-medic / admin)

> Эти баги зафиксированы, но трогать эти части нельзя.

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

## 📋 Задачи

- [x] **[plan]** Этап 1 (backend critical security): BUG 2/3/4/9/10/11/13/39 — ACL, WS auth, route fix, CORS
- [x] **[plan]** Этап 2 (mobile/medic realtime UX): BUG из tasks + авто-обновление, ошибки логина
- [x] **[plan]** Этап 3 (auth + validation hardening): BUG 5/6/7/8/12/20 — phone regex, SecureStore, timing-safe
- [x] **[backend/mobile/medic]** Yandex Taxi-style push-based автоматический dispatch — `dispatch.service.ts`, `dispatch_attempts` таблица, медик инвайт-модал, dispatch_update UI на клиенте
- [ ] **[mobile/backend/medic]** Плавная интерполяция маркера медика на карте клиента (`mobile/app/order/track.tsx`)

### Процесс выполнения

1. Этап 1: backend critical security — `выполнено`
2. Этап 2: realtime UX (`mobile`/`medic`) — `выполнено`
3. Этап 3: auth + validation hardening — `выполнено`
4. Этап 4: оставшиеся баги backend/mobile/medic — `выполнено`

---

## 💡 Идеи / V1

- [ ] Разделить таблицу `payments` — отдельный `payments_ledger` для прозрачности финансов
- [ ] Аналитика в admin: графики заказов, выручка, топ медики
- [ ] Фильтр услуг по категории на главном экране mobile/web
- [ ] Повторный заказ (кнопка "Заказать снова" в истории)
