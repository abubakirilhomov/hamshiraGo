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

> Mobile + medic: кастомный сплэш-оверлей (логотип + "by tezcode.ai") после нативного сплэша. ✅
> Web/web-medic/admin/landing: сплэш с брендингом + логотип — выполнено Диёром. ✅

---

## ✅ Этап 8 — ВЫПОЛНЕН полностью (Абубакир + Диёр)

- [x] **[backend]** `[Абубакир]` API отдаёт оба языка корректно ✅
- [x] **[mobile]** `[Абубакир]` titleUz/titleRu динамически по языку устройства ✅
- [x] **[admin]** `[Диёр]` UI для добавления/редактирования услуг с полями на RU и UZ (двойной блок 🇷🇺/🇺🇿 в форме, colTitleUz в таблице) ✅

---

## 📋 Этап 10 — Платный режим / комиссия (Абубакир + Диёр)

> Замена откатанной wallet-системы на управляемый через админку платный режим.

- [x] **[backend]** `[Абубакир]` `isPaidMode: boolean` — таблица `app_settings`, `GET /settings`, `PATCH /admin/settings` ✅
- [x] **[backend]** `[Абубакир]` Если `isPaidMode=true` — 10% списание при acceptOrder, блок при нехватке (402) ✅
- [x] **[medic]** `[Абубакир]` Баланс кошелька всегда виден в профиле (отдельная карточка) ✅
- [x] **[admin]** `[Диёр]` Просмотр балансов медиков + ручное пополнение через UI ✅
- [x] **[admin]** `[Диёр]` Переключатель "Платный режим" в настройках админки ✅

---

## ✅ Этап 11 — ВЫПОЛНЕН

> Backend: webhook `/start MEDIC_ID` автоматически привязывает chat_id. Medic: deep link с ID, баннер канала.

---

## 📋 Этап 12 — Аналитика и мониторинг (Диёр)

- [x] **[admin]** `[Диёр]` PostHog аналитика — трекинг страниц и действий в admin; интеграция через `VITE_POSTHOG_KEY` + `VITE_POSTHOG_HOST` ✅
- [ ] **[admin]** `[Диёр]` Sentry дашборд — настроить алерты и release tracking (DSN уже в `.env`)
- [x] **[backend]** `[Абубакир]` Эндпоинт `POST /client-errors` — клиент отправляет ошибки с userId, экраном, stacktrace ✅

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

## 💡 Идеи / V2

- [ ] Разделить таблицу `payments` — отдельный `payments_ledger` для прозрачности финансов
- [ ] Аналитика в admin: графики заказов, выручка, топ медики
- [ ] Фильтр услуг по категории на главном экране mobile/web
- [ ] Повторный заказ (кнопка "Заказать снова" в истории)
