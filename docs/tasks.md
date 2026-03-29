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
- [x] **Шаг 4** — `web/components/TrackingMap.tsx` + `web/app/orders/[id]/page.tsx`: принять `heading` из WS-события и передать в OSRM ✅

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

## 🔥 V1 — до запуска

### Рейтинг и отзывы медиков — Абубакир (backend) + Диёр (web/mobile)
- [ ] Backend: создать сущность `Review` (orderId, clientId, medicId, rating 1–5, comment, createdAt)
- [ ] Backend: `POST /reviews` — клиент оставляет отзыв после DONE
- [ ] Backend: `GET /reviews/medic/:id` — отзывы медика
- [ ] Backend: автоматический пересчёт `averageRating` у медика
- [ ] Mobile/Web: экран оценки после завершения заказа (звёзды + комментарий)
- [ ] Mobile/Web: отображение рейтинга и отзывов в профиле медика

### Срочный вызов (extra fee) — Абубакир (backend) + Диёр (web/mobile)
- [ ] Backend: поле `isUrgent` в заказе + `urgentFee` (наценка)
- [ ] Backend: логика расчёта — ночь/праздник = автоматическая наценка
- [ ] Mobile/Web: переключатель «Срочный вызов» при создании заказа с отображением доплаты
- [ ] Admin: отображение срочных заказов в списке

### Система трекинга ошибок пользователей (User Support / Error Tracking) — Абубакир (backend) + Диёр (admin/web/mobile)
- [ ] Backend: сущность `UserError` (userId, userRole [client/medic], errorCode, errorMessage, stackTrace, screen/page, deviceInfo, appVersion, createdAt)
- [ ] Backend: `POST /errors/report` — клиент/медик автоматически отправляет ошибку при возникновении
- [ ] Backend: `GET /errors` (admin) — список всех ошибок с фильтрами (по пользователю, дате, типу, статусу)
- [ ] Backend: `PATCH /errors/:id` (admin) — изменить статус (NEW → IN_PROGRESS → FIXED → IGNORED)
- [ ] Backend: автоматическая группировка одинаковых ошибок (по errorCode + errorMessage)
- [ ] Mobile: глобальный error boundary — перехватывает все падения и отправляет на backend с userId, экраном, устройством
- [ ] Web/Web-medic: глобальный error handler — перехватывает ошибки API и JS и отправляет на backend
- [ ] Admin: новая страница «User Support» — таблица ошибок с колонками: пользователь, ошибка, экран, устройство, дата, статус
- [ ] Admin: фильтры — по пользователю, по дате, по статусу (новые/в работе/исправлены)
- [ ] Admin: детальная карточка ошибки — полный стек, информация об устройстве, история заказов пользователя
- [ ] Admin: счётчик новых ошибок в сайдбаре (бейдж)

### SEO-страницы на лендинге — Диёр
- [ ] Страницы услуг: `/uslugi/ukol-na-domu`, `/uslugi/kapelnica-na-domu`
- [ ] Страницы по районам: `/tashkent/chilanzar`, `/tashkent/yunusabad` и т.д.
- [ ] Meta-теги, Open Graph, JSON-LD разметка для Google
- [ ] Sitemap.xml + robots.txt

---

## 🚀 V1.1 — месяц 1–3 после запуска

### Push-напоминания по курсу лечения — Абубакир (backend)
- [ ] Backend: сущность `TreatmentCourse` (clientId, название, количество процедур, интервал, следующая дата)
- [ ] Backend: cron-задача — отправка push/Telegram за 2 часа до следующей процедуры
- [ ] Mobile/Web: экран «Мои курсы лечения» с расписанием

### Реферальная программа — Абубакир (backend) + Диёр (web/mobile)
- [ ] Backend: генерация реферального кода для каждого клиента
- [ ] Backend: логика начисления бонусов — оба получают скидку на следующий заказ
- [ ] Backend: `GET /referrals/my` — список приглашённых и бонусов
- [ ] Mobile/Web: экран «Пригласи друга» с кодом/ссылкой + шаринг

### Персональный медик — Абубакир (backend) + Диёр (web/mobile)
- [ ] Backend: поле `favoriteMedicId` у клиента или таблица `favorite_medics`
- [ ] Backend: при создании заказа — приоритет закреплённому медику
- [ ] Mobile/Web: кнопка «Закрепить медика» в профиле медика после заказа

### Медкарта в приложении — Абубакир (backend) + Диёр (web/mobile)
- [ ] Backend: сущность `MedicalCard` (clientId, аллергии, хронические заболевания, группа крови, заметки)
- [ ] Backend: CRUD эндпоинты `/medical-card`
- [ ] Mobile/Web: экран «Моя медкарта» — заполнение и просмотр
- [ ] Медик видит медкарту клиента при принятии заказа

---

## ⚡ V2 — месяц 3–6

### Программа лояльности — Абубакир (backend)
- [ ] Backend: счётчик заказов клиента, каждый 5-й заказ — автоматическая скидка
- [ ] Backend: начисление бонусных баллов за заказы
- [ ] Mobile/Web: экран «Мои бонусы» с прогресс-баром до следующей скидки

### Семейные пакеты / подписки — Абубакир (backend) + Диёр (web/mobile)
- [ ] Backend: сущность `Subscription` (тип пакета, кол-во визитов, цена, срок)
- [ ] Backend: логика списания визитов из пакета при заказе
- [ ] Mobile/Web: экран выбора подписки + управление пакетом
- [ ] Admin: управление тарифами подписок

### NPS-опросы — Абубакир (backend)
- [ ] Backend: cron — раз в месяц отправка NPS-опроса активным клиентам (push/Telegram)
- [ ] Backend: сбор и хранение NPS-ответов
- [ ] Admin: дашборд NPS с графиком по месяцам

### 🤖 ИИ-агент + онлайн-консультация — Абубакир (backend)
- [ ] Backend: интеграция с AI API (Claude/OpenAI) — чат-бот для первичной сортировки симптомов
- [ ] Backend: сущность `Doctor` (специализация, расписание, цена консультации)
- [ ] Backend: логика маршрутизации — ИИ определяет специализацию → предлагает врача
- [ ] Backend: видео/чат консультация (интеграция с Agora/WebRTC или Telegram видеозвонок)
- [ ] Backend: связка — врач назначает лечение → автоматическое создание заказа на медсестру
- [ ] Mobile/Web: экран чат-бота «Опишите симптомы»
- [ ] Mobile/Web: экран онлайн-консультации с врачом
- [ ] Комиссия 15–20% с консультации врача

---

## 💡 Идеи / V2+

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
