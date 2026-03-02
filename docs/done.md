# HamshiraGo — Выполненные задачи

> Хронологический лог завершённых фич и исправлений.

---

## 2026-03-03

- **[web]** Dispatch migration — убраны `nearbyMedics`, `fetchNearbyMedics`, `closestMedic`, nurse-плашка под картой, nurse-карточка "Ближайший медик", nurse-параметры в `handleSubmit` (`web/app/order/location/page.tsx`)
- **[web]** Dispatch migration — убраны `nurseName/nurseRating/nurseDistance/nurseEta` params и карточка "Медсестра" (`web/app/order/confirm/page.tsx`)
- **[web]** Dispatch migration — добавлен state `dispatchState`, listener `dispatch_update`, обновлён UI "Ищем медика" с 3 состояниями (searching/contacting/no_medics) (`web/app/orders/[id]/page.tsx`)
- **[web-medic]** Dispatch migration — добавлен `medicApi.orders.decline(id)` (`web-medic/lib/api.ts`)
- **[web-medic]** Dispatch migration — добавлены `invite` state, listeners `dispatch_invite`/`dispatch_invite_expired`, функции `acceptInvite`/`declineInvite`, fullscreen overlay с таймером 60 сек (`web-medic/app/page.tsx`)
- **[admin]** Логотип в сайдбаре — буква "H" заменена на иконку `Stethoscope` (lucide-react), форма изменена с `rounded-full` на `rounded-lg` для соответствия favicon (`admin/src/components/AdminSidebar.tsx`)

## 2026-03-02 (сессия 2)

- **[web, web-medic]** Единый favicon — `app/icon.tsx` обновлён на букву **H** белым на бирюзовом градиенте `#0d9488→#0f766e` (было: крест у web, силуэт медсестры у web-medic) (`web/app/icon.tsx`, `web-medic/app/icon.tsx`)
- **[admin]** Исправлен favicon — добавлен `<link rel="icon" href="/favicon.ico">` в `admin/index.html` (было: не подключён, браузер показывал emoji-заглушку)
- **[admin]** Добавлен кастомный SVG favicon `admin/public/icon.svg` — буква H на бирюзовом градиенте `#0d9488→#0f766e`, единый стиль с web/web-medic; `index.html` переключён на `type="image/svg+xml"`

---

## 2026-03-02

- **[web, web-medic, admin]** 12.3 Sentry error tracking — добавлен `@sentry/nextjs` (web/web-medic) и `@sentry/react` (admin); `sentry.client.config.ts` + `sentry.server.config.ts` + `withSentryConfig` в `next.config.ts`; `app/error.tsx` отправляет ошибки через `captureException`; admin `ErrorBoundary.tsx` отправляет в Sentry; Sentry init в `main.tsx`; DSN через `NEXT_PUBLIC_SENTRY_DSN` / `VITE_SENTRY_DSN` (пустой = отключён); добавлен `admin/.env.example`

- **[web-medic]** Применены изменения бэкенда: `lastSeenAt`, авто-оффлайн после 5ч — добавлен `onlineDisabledReason`, баннер INACTIVE_5H на дашборде (`web-medic/lib/api.ts`, `web-medic/app/page.tsx`)
- **[web-medic]** Исправлен BUG-14: загрузка заказа заменена с `my()+find()` на прямой `GET /orders/:id` (`web-medic/app/order/[id]/page.tsx`, `web-medic/lib/api.ts`)
- **[web-medic]** Добавлен OSRM роутинг на карте заказа медика — маршрут по дорогам с Polyline, маркеры медика и клиента, обновление каждые 30с (`web-medic/app/order/[id]/page.tsx`, `web-medic/components/Map.tsx`)
- **[web]** Исправлен BUG-27: `orders.list()` теперь корректно извлекает `.data` из пагинированного ответа (`web/lib/api.ts`)
- **[web]** Исправлен BUG-28: WebSocket отписка при unmount — добавлен `unsubscribe_order` перед `disconnect()` (`web/app/orders/[id]/page.tsx`)
- **[web]** Исправлен BUG-29: `confirmDone` заменил дырявый `updateStatus` — жёстко зафиксирован статус `DONE` (`web/lib/api.ts`)
- **[web]** Исправлен редирект после оценки заказа — клиент возвращается на `/` через 1.5с (`web/app/orders/[id]/page.tsx`)
- **[web, web-medic]** Исправлен BUG-26: `BASE_URL` вынесен в `NEXT_PUBLIC_API_URL` env var (`web/lib/api.ts`, `web-medic/lib/api.ts`, `web/lib/webPush.ts`, `web-medic/lib/webPush.ts`)
- **[web, web-medic]** Добавлены `.env.example` файлы (`web/.env.example`, `web-medic/.env.example`)
- **[admin]** Исправлен BUG-30/31: выручка и график за 7 дней загружают ВСЕ страницы заказов через параллельную пагинацию (`admin/src/pages/Dashboard.tsx`)
- **[admin]** Исправлен BUG-32: `hasAdminToken()` проверяет `exp` в JWT payload — истёкший токен больше не проходит (`admin/src/lib/api.ts`)
- **[admin]** Исправлен BUG-33: добавлен `vercel.json` с CSP, X-Frame-Options, X-Content-Type-Options и др. security headers (`admin/vercel.json`)
- **[admin]** Убран Lovable брендинг из `index.html` — заменён на HamshiraGo метаданные, добавлен `noindex` (`admin/index.html`)
- **[web]** Добавлен Error Boundary (4.4) — `app/error.tsx` + `app/global-error.tsx`, кнопки "Попробовать снова" и "На главную"
- **[web-medic]** Добавлен Error Boundary (4.4) — `app/error.tsx` + `app/global-error.tsx`
- **[admin]** Добавлен Error Boundary (4.4) — класс-компонент `ErrorBoundary.tsx`, обёрнут в `main.tsx`
- **[web]** Исправлен 8.5: SEO — `app/robots.ts` (disallow аутент. страниц, allow /auth), `app/sitemap.ts`, `app/auth/layout.tsx` с canonical+OG+Twitter для страницы входа, root layout обновлён с `title.template`, `metadataBase`, `twitter` тегами; `NEXT_PUBLIC_SITE_URL` в `.env.example`
- **[web, web-medic]** Исправлен 8.3: offline баннер — компонент `OfflineBanner` в `layout.tsx` слушает `offline`/`online` события браузера, показывает фиксированную полосу "Нет подключения к интернету"
- **[web]** Исправлены 8.1 + 8.2: loading state + обработка ошибок на главной — `.catch(() => {})` заменён, добавлен `error` state с кнопкой "Попробовать снова" (`web/app/page.tsx`); `console.error` в WS обработчике (`web/app/orders/[id]/page.tsx`); `console.error` в фоновом refresh профиля (`web-medic/app/page.tsx`) — добавлен `error` state, `.catch(() => {})` заменён на обработку ошибки с кнопкой "Попробовать снова" (`web/app/page.tsx`)
- **[admin]** TypeScript strict mode (4.1 + 4.3) — включён `strict: true` в `tsconfig.app.json`; все `any` заменены на строгие интерфейсы `AdminMedic`, `AdminUser`, `AdminOrder`, `AdminService` в `api.ts` и всех страницах; `tsc --noEmit` проходит без ошибок
- **[backend]** 10.1 DB индексы — добавлены `@Index()` на `User.phone` (unique), `Medic.phone` (unique), `Medic.isOnline`, `Medic.verificationStatus`, `Order.clientId`, `Order.medicId`, `Order.status`, `Order.created_at` — ускоряют логин, фильтрацию и сортировку (`user.entity.ts`, `medic.entity.ts`, `order.entity.ts`)
- **[web]** 10.3 Кэш услуг — `api.services.list()` кэширует результат в localStorage на 5 минут; повторные загрузки страниц не делают API-запрос (`web/lib/api.ts`)
- **[admin]** 10.4 Cloudinary оптимизация — хелпер `cloudinaryOpt()` добавляет `f_auto,q_auto,w_800` к URL; фото медика в Verification рендерятся в WebP для поддерживающих браузеров (`admin/src/pages/Verification.tsx`)
- **[web]** Добавлен поиск и фильтрация (9.7) — текстовый поиск по услугам (название/описание/категория) с кнопкой сброса на главной (`web/app/page.tsx`); фильтр-табы «Все / Активные / Завершённые / Отменённые» в истории заказов (`web/app/orders/page.tsx`). Admin поиск/фильтры уже были реализованы.
- **[web]** Добавлен профиль клиента (9.6) — `/profile` страница с именем, телефоном и историей заказов; аватар с инициалами в шапке главной; user-инфо сохраняется в localStorage после логина/регистрации (`web/app/profile/page.tsx`, `web/app/auth/page.tsx`, `web/app/page.tsx`). Редактирование и смена пароля заблокированы — требуют `PATCH /auth/profile` и `PATCH /auth/change-password` на бэкенде.
- **[admin]** Добавлена страница «Финансовые отчёты» (9.5) — `/reports`: фильтр по дате, KPI (доход платформы, кол-во заказов, средний чек, скидки), бар-чарт дохода по дням, таблица дохода по услугам, кнопка «Экспорт CSV» с BOM для Excel; пункт меню «Отчёты» в сайдбаре (`admin/src/pages/Reports.tsx`, `admin/src/App.tsx`, `admin/src/components/AdminSidebar.tsx`)
- **[web, web-medic]** Исправлен 8.6: PWA offline кэширование — `sw.js` дополнен обработчиками `install` (кэш app shell), `activate` (очистка старых кэшей), `fetch` (cache-first для `/_next/static/`, network-first для навигации); добавлен компонент `InstallPrompt` с кнопкой "Установить" и dismiss в `localStorage`

## 2026-03-01

- **[web]** Редизайн главной страницы — SVG-волна под шапкой, иконки по категориям, убран дублирующийся блок "Мои заказы" внизу (`web/app/page.tsx`)
- **[web]** Сортировка заказов новые-первыми — явный `.sort()` в рендере обеих секций (активные + история) (`web/app/orders/page.tsx`)
- **[web]** Карта трекинга медика на странице заказа — компонент `TrackingMap` (Leaflet), слушает `medic_location` Socket.IO, fallback из `order.medic.latitude/longitude` (`web/components/TrackingMap.tsx`, `web/app/orders/[id]/page.tsx`)
- **[web-medic]** Исправлен краш `orders.find is not a function` — нормализация ответа `medicApi.orders.my()` (поддержка `{data:[]}`, `{items:[]}`, plain array) (`web-medic/app/order/[id]/page.tsx`)
- **[admin]** Подключён `GET /medics/admin/all` — Medics страница переключена с `getPendingMedics` на `getAllMedics`, показывает всех медиков с пагинацией (`admin/src/lib/api.ts`, `admin/src/pages/Medics.tsx`)
- **[admin]** Подключён `GET /auth/admin/users` — добавлены `getUsers()` и `blockClient()`, реализована полноценная страница Clients с таблицей, поиском и блокировкой (`admin/src/lib/api.ts`, `admin/src/pages/Clients.tsx`)
- **[web]** Обработка истёкшего токена — при 401 ответе очищается `token` и выполняется редирект на `/auth` (`web/lib/api.ts`)
- **[web-medic]** Обработка истёкшего токена — при 401 ответе очищается `medic_token` + `medic` и выполняется редирект на `/auth` (`web-medic/lib/api.ts`)
- **[web]** Сплэш-скрин 2 сек — тил-градиент, иконка медицинского креста, пульсирующая анимация, плавное исчезновение (`web/components/SplashScreen.tsx`, `web/app/layout.tsx`)
- **[web-medic]** Сплэш-скрин 2 сек — аналогично web, подзаголовок "Панель медика" (`web-medic/components/SplashScreen.tsx`, `web-medic/app/layout.tsx`)

## 2026-02-28

- **[backend]** Добавлен `GET /medics/admin/all` (пагинация + фильтры `search`, `verificationStatus`, `isBlocked`, `isOnline`) для админки (`backend/src/medics/medics.controller.ts`, `backend/src/medics/medics.service.ts`)
- **[backend]** Добавлен `GET /auth/admin/users` (пагинация + фильтры `search`, `isBlocked`) для админки (`backend/src/auth/auth.controller.ts`, `backend/src/users/users.service.ts`)
- **[mobile]** На карте выбора адреса показываются маркеры медиков из `/medics/nearby`; тап по маркеру выбирает медика (`mobile/components/LocationMap.tsx`, `mobile/app/order/location.tsx`)
- **[mobile]** Popup маркера медика улучшен для читаемости взрослой аудитории: `🩺 Медик: ...` + явный CTA выбора (`mobile/components/LocationMap.tsx`)
- **[backend/medic/mobile]** Реализован live-трекинг “медик в пути”: socket-событие `medic_location`, отправка координат медиком каждые 5с в `ON_THE_WAY`, отображение клиенту на карте заказа (`backend/src/realtime/order-events.gateway.ts`, `medic/app/order/[id].tsx`, `mobile/app/order/track.tsx`)
- **[medic]** Добавлен background location tracking с напоминанием о разрешении `Always` и карточкой в профиле (`medic/utils/backgroundLocation.ts`, `medic/app/_layout.tsx`, `medic/app/(tabs)/profile.tsx`, `medic/app.json`)
- **[backend]** `GET /medics/me` теперь возвращает `telegramChatId` — мобильное приложение показывает статус подключения (`medics.service.ts`)
- **[backend]** `PATCH /medics/telegram-chat-id` принимает `null` для отключения Telegram (`medics.controller.ts`, `medics.service.ts`)
- **[medic]** Карточка Telegram в профиле — кнопка "Подключить" открывает `t.me/hamshirago_medic_bot`, кнопка "Отключить" сбрасывает chatId на бэкенде (`medic/app/(tabs)/profile.tsx`)
- **[medic]** `MedicUser` дополнен полем `telegramChatId` (`medic/context/AuthContext.tsx`)
- **[admin]** Исправлен лейбл "PENDING" → "Верификация" в блоке потока заказов на Dashboard — карточка показывала медиков на верификации, а не pending заказы (`admin/src/pages/Dashboard.tsx`)

- **[web]** Список медиков на экране адреса — горизонтальный скролл с карточками медиков (имя, рейтинг, расстояние), клик = выбор; выбранная медсестра передаётся на confirm (`web/app/order/location/page.tsx`)
- **[web]** Карточка медсестры на экране подтверждения — показывается имя, рейтинг, расстояние если медик выбран на предыдущем шаге (`web/app/order/confirm/page.tsx`)

---

## 2026-02-27

- **[backend]** Фильтр заказов по расстоянию — `findAvailable(medicId)` возвращает только заказы в радиусе 10 км от медика, отсортированные от ближнего к дальнему (`orders.service.ts`)
- **[backend]** Добавлен `helmet` — защита HTTP-заголовков (`main.ts`)
- **[backend]** Структурированное логирование — `nestjs-pino` + `pino-pretty` в dev, JSON в production; пароли и Authorization автоматически [REDACTED] (`app.module.ts`, `main.ts`)
- **[mobile]** Скидка 10% на первый заказ — проверяется история заказов при открытии confirm-экрана; при 0 заказов применяется скидка и UI показывает бейдж со скидкой (`mobile/app/order/confirm.tsx`)
- **[medic]** Исправлен импорт `Text` в `verification.tsx` — заменён `@/components/Themed` (несуществующий) на стандартный `Text` из `react-native`

---

## 2026-02-26

- **[backend]** Telegram Bot уведомления — при создании нового заказа рассылка онлайн-медикам у которых сохранён `telegramChatId` (`telegram.service.ts`, `orders.service.ts`)
- **[backend]** Добавлен `telegramChatId` в таблицу медиков (`medic.entity.ts`)
- **[backend]** Новый эндпоинт `PATCH /medics/telegram-chat-id` — медик сохраняет свой Telegram chat ID (`medics.controller.ts`)
- **[backend]** Admin JWT login — `POST /auth/admin/login` с username/password, возвращает JWT; `AdminGuard` поддерживает оба метода (JWT + X-Admin-Secret fallback) (`auth.service.ts`, `admin.guard.ts`)
- **[admin]** Переход с `X-Admin-Secret` на JWT Bearer токен — `adminLogin()`, `getAdminToken/setAdminToken/clearAdminToken` (`api.ts`, `Login.tsx`, `AdminSidebar.tsx`)
- **[backend]** CORS — явный список разрешённых origins включая Vercel URLs (`main.ts`)
- **[backend]** Исправлена ошибка TypeORM `nullable` — `serviceId`, `serviceTitle`, `priceAmount`, `discountAmount` теперь nullable (`order.entity.ts`)
- **[backend]** Исправлена ошибка TypeScript `priceAmount possibly null` — добавлен `?? 0` (`orders.service.ts`)
- **[backend]** Admin API для заказов — `GET /orders/admin/all` (пагинация + фильтр по статусу), `PATCH /orders/admin/:id/cancel` (`orders.controller.ts`, `orders.service.ts`)
- **[docs]** Создан `docs/BACKEND_API.md` — полная документация API
- **[docs]** Создан `docs/ADMIN_PANEL.md` — документация для разработчиков admin панели

---

## 2026-02-25

- **[medic]** Экран верификации — загрузка фото лица и лицензии, отображение статуса PENDING/APPROVED/REJECTED, причина отказа (`medic/app/verification.tsx`)
- **[medic]** Статус верификации в профиле — карточка с цветовой индикацией и переходом на `/verification` (`medic/app/(tabs)/profile.tsx`)
- **[medic]** Баннер для неверифицированных медиков на главном экране — предупреждение о невозможности принять заказ (`medic/app/(tabs)/index.tsx`)
- **[medic]** `AuthContext` обновлён — добавлены поля верификации в `MedicUser`, метод `refreshProfile()` (`medic/context/AuthContext.tsx`)
- **[medic]** Отображение заработка медика с учётом комиссии платформы 10% — `Стоимость услуги`, `Скидка клиента`, `Комиссия платформы`, `Ваш заработок` (`medic/app/order/[id].tsx`)
- **[medic]** `app.json` — добавлен `expo-image-picker` плагин и Android permissions

---

## Ранее (MVP core)

- **[backend]** NestJS API — полная архитектура: Auth (client/medic/admin), Orders, Medics, Users, Services, Locations
- **[backend]** TypeORM + PostgreSQL — все entity, автосинхронизация схемы
- **[backend]** JWT аутентификация — отдельные токены для client/medic/admin
- **[backend]** WebSocket gateway — real-time события заказов (`order:status`, `order:location`)
- **[backend]** Expo Push Notifications — уведомления клиенту по всем статусам заказа
- **[backend]** Web Push (VAPID) — уведомления в браузер клиенту и медику
- **[backend]** Каталог услуг — `Service` entity, seed-данные, `GET /services`
- **[backend]** Платформенная комиссия 10% — `platformFee` хранится в заказе, вычитается из заработка медика
- **[backend]** Рейтинг медика — взвешенное среднее при оценке заказа клиентом
- **[backend]** Верификация медиков — `verificationStatus`, `facePhotoUrl`, `licensePhotoUrl`, `POST /medics/documents` (Cloudinary)
- **[backend]** Блокировка users/medics — `isBlocked` флаг, проверка при принятии заказа
- **[backend]** Rate limiting — `@nestjs/throttler` на auth эндпоинтах
- **[mobile]** Полный flow клиента — регистрация/логин, каталог услуг, выбор адреса, создание заказа, трекинг, история, профиль, оценка медика
- **[mobile]** Push-уведомления — запрос разрешения, сохранение токена, in-app баннеры
- **[mobile]** Real-time трекинг — Socket.IO, статус-степпер, местоположение медика на карте
- **[medic]** Полный flow медика — регистрация/логин, список заказов, принятие, смена статусов, история, профиль, баланс
- **[medic]** Online/offline toggle с GPS — геолокация передаётся на бэкенд при включении
- **[admin]** Admin панель — управление медиками (верификация, блокировка), клиентами, заказами, услугами
- **[web]** Next.js web клиент — все страницы MVP
- **[web-medic]** Next.js web медик — все страницы MVP
