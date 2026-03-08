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

## ✅ Этап 8 — ВЫПОЛНЕН (частично Абубакир)

> Backend ✅ уже корректен. Mobile: service/[id].tsx и confirm.tsx теперь используют titleUz/descriptionUz по языку устройства, все строки интерфейса через i18n.
> Задача для Диёра (admin UI для редактирования услуг) остаётся открытой.

## ✅ Этап 9 — ВЫПОЛНЕН

> Backend: медик получает push при CANCELED и DONE. Mobile track.tsx + Medic order/[id].tsx: персистентное уведомление в фоне, WebSocket order_status в медике.

---

## ✅ Этап 7 — ВЫПОЛНЕН

> Mobile + medic: кастомный сплэш-оверлей (логотип + "by tezcode.ai") после нативного сплэша.
> Web/admin/landing/логотип — выполнено Диёром.

---

## 📋 Этап 8 — Динамические услуги через админку (Абубакир + Диёр)

- [ ] **[backend]** `[Абубакир]` Услуги уже есть в БД (`Service` entity с `titleUz`/`titleRu`). Убедиться что API отдаёт оба языка корректно
- [ ] **[mobile]** `[Абубакир]` Исправить i18n конфликт на главной: процедуры всегда на русском → использовать `titleUz`/`titleRu` динамически по языку устройства
- [ ] **[admin]** `[Диёр]` UI для добавления/редактирования услуг с полями на RU и UZ

---

## 📋 Этап 9 — Пуш-уведомления (Абубакир)

- [ ] **[backend/mobile]** Отправлять все статусы заказа по push (сейчас часть статусов пропускается)
- [ ] **[mobile/medic]** Постоянное уведомление при активном заказе (foreground service / persistent notification, как у Яндекс Go)
  - Клиент: "Медик едет — [Имя], статус [...]"
  - Медик: "Активный заказ — [адрес], статус [...]"

---

## 📋 Этап 10 — Платный режим / комиссия (Абубакир + Диёр)

> Замена откатанной wallet-системы на управляемый через админку платный режим.

- [x] **[backend]** `[Абубакир]` `isPaidMode: boolean` — таблица `app_settings`, `GET /settings`, `PATCH /admin/settings` ✅
- [x] **[backend]** `[Абубакир]` Если `isPaidMode=true` — 10% списание при acceptOrder, блок при нехватке (402) ✅
- [x] **[medic]** `[Абубакир]` Баланс кошелька всегда виден в профиле (отдельная карточка) ✅
- [ ] **[admin]** `[Диёр]` Переключатель "Платный режим" в настройках админки
- [ ] **[admin]** `[Диёр]` Просмотр балансов медиков + ручное пополнение через UI

---

## ✅ Этап 11 — ВЫПОЛНЕН

> Backend: webhook `/start MEDIC_ID` автоматически привязывает chat_id. Medic: deep link с ID, баннер канала.

---

## 📋 Этап 12 — Аналитика и мониторинг (Диёр)

- [ ] **[admin]** `[Диёр]` Аналитика посещений и использования (интеграция Plausible или PostHog — self-hosted)
- [ ] **[admin]** `[Диёр]` Логирование ошибок пользователей с просмотром в админке (Sentry уже подключён — настроить дашборд)
- [x] **[backend]** `[Абубакир]` Эндпоинт `POST /client-errors` — клиент отправляет ошибки с userId, экраном, stacktrace ✅

---

## 📋 Этап 13 — SEO и продакшн (Диёр)

- [ ] **[landing/web]** `[Диёр]` SEO улучшения (мета-теги, скорость, Core Web Vitals)
- [ ] **[web/web-medic]** `[Диёр]` Проверка lighthouse score, оптимизация

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

## 💡 Идеи / V2

- [ ] Разделить таблицу `payments` — отдельный `payments_ledger` для прозрачности финансов
- [ ] Аналитика в admin: графики заказов, выручка, топ медики
- [ ] Фильтр услуг по категории на главном экране mobile/web
- [ ] Повторный заказ (кнопка "Заказать снова" в истории)
